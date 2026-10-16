/*
 * EWAia abbreviation search.
 *
 * Matching is unchanged from the original page: a case-insensitive substring
 * test (toLowerCase + includes) on the abbreviation and/or the full form,
 * returning entries in data order. Input is never trimmed or normalized.
 * The pure functions are exported for Node tests; the page wiring only runs
 * in a browser.
 */
(function () {
    "use strict";

    const DATA_URL = "./ewaia.json";

    // English messages for dynamic text before the dictionaries load or when
    // they fail. Must match locales/en.json (checked by tests/locales.test.cjs).
    const FALLBACK = {
        "search.results.count": {
            one: "{count} entry (of {total})",
            other: "{count} entries (of {total})",
        },
        "search.meta.type": "Type",
        "search.meta.source": "Source: EWAia list of abbreviations ({file})",
        "search.status.loadingTitle": "Loading entries",
        "search.status.loadingBody": "You can keep editing your search term and options.",
        "search.status.emptyTitle": "No matching entries",
        "search.status.emptyBody": "Try a shorter search term or search in both the abbreviation and the full form.",
        "search.status.noFieldsTitle": "No search field selected",
        "search.status.noFieldsBody": "Select Abbreviation, Full form, or both.",
        "search.status.errorTitle": "The entries could not be loaded",
        "search.status.errorBody": "Your search term and options have been kept. Check your connection and try again.",
        "search.status.retry": "Try again",
    };

    function matchesEntry(entry, query, fields) {
        const term = query.toLowerCase();
        return (fields.abbreviation && entry.abbreviation.toLowerCase().includes(term))
            || (fields.full && entry.full.toLowerCase().includes(term));
    }

    // Returns [{ group, entry }] in the order of the data file.
    function searchEntries(data, query, fields) {
        const results = [];
        for (const group in data) {
            for (const entry of data[group]) {
                if (matchesEntry(entry, query, fields)) results.push({ group, entry });
            }
        }
        return results;
    }

    function countEntries(data) {
        let total = 0;
        for (const group in data) total += data[group].length;
        return total;
    }

    function validateData(data) {
        if (data === null || typeof data !== "object" || Array.isArray(data)) {
            throw new TypeError("ewaia.json: expected an object of entry groups");
        }
        for (const group in data) {
            if (!Array.isArray(data[group])) throw new TypeError(`ewaia.json: ${group} is not a list`);
            for (const entry of data[group]) {
                const valid = entry !== null && typeof entry === "object"
                    && ["abbreviation", "full", "type"].every((field) => typeof entry[field] === "string");
                if (!valid) throw new TypeError(`ewaia.json: invalid entry in ${group}`);
            }
        }
        return data;
    }

    // Same plural and number rules as the shared i18n script, in English.
    function formatFallback(key, params = {}) {
        let value = FALLBACK[key];
        if (value !== null && typeof value === "object") {
            value = value[new Intl.PluralRules("en").select(Number(params.count ?? 0))] ?? value.other;
        }
        if (typeof value !== "string") return key;
        const numbers = new Intl.NumberFormat("en");
        return value.replace(/\{(\w+)\}/g, (match, name) => {
            if (!(name in params)) return match;
            const param = params[name];
            return typeof param === "number" ? numbers.format(param) : String(param);
        });
    }

    function start() {
        const form = document.getElementById("searchForm");
        const input = document.getElementById("searchInput");
        const searchAbbreviation = document.getElementById("searchAbbreviation");
        const searchFull = document.getElementById("searchFull");
        const initial = document.getElementById("searchInitial");
        const count = document.getElementById("resultCount");
        const status = document.getElementById("searchStatus");
        const resultsList = document.getElementById("searchResults");

        const STATUS = {
            loading: { tone: "info", title: "search.status.loadingTitle", body: "search.status.loadingBody" },
            empty: { tone: "info", icon: "i", title: "search.status.emptyTitle", body: "search.status.emptyBody" },
            noFields: { tone: "warning", icon: "!", title: "search.status.noFieldsTitle", body: "search.status.noFieldsBody" },
            error: { tone: "error", icon: "×", title: "search.status.errorTitle", body: "search.status.errorBody", retry: true },
        };

        let data = null;
        let loading = null;
        let latest = 0;
        let view = { state: "initial" };

        function message(key, params) {
            const i18n = window.VedaI18n;
            if (i18n && i18n.lang) {
                const text = i18n.t(key, params);
                if (text !== key) return text;
            }
            return formatFallback(key, params);
        }

        function element(tag, className, text) {
            const node = document.createElement(tag);
            if (className) node.className = className;
            if (text !== undefined) node.textContent = text;
            return node;
        }

        // Source strings: their language is not recorded per entry.
        function sourceText(tag, className, text) {
            const node = element(tag, `${className} ewaia-text`, text);
            node.lang = "";
            return node;
        }

        function resultItem({ group, entry }) {
            const item = element("li", "veda-result");
            const meta = element("dl", "veda-meta");
            meta.append(element("dt", "", message("search.meta.type")), sourceText("dd", "", entry.type));
            item.append(
                sourceText("h3", "veda-result__title", entry.abbreviation),
                sourceText("p", "ewaia-full", entry.full),
                meta,
                element("p", "veda-source", message("search.meta.source", { file: group })),
            );
            return item;
        }

        function statusBox(spec) {
            const box = element("div", `veda-status veda-status--${spec.tone}`);
            const icon = spec.icon ? element("span", "veda-status__icon", spec.icon) : element("span", "veda-spinner");
            icon.setAttribute("aria-hidden", "true");
            const body = element("div", "veda-status__body");
            body.append(element("p", "veda-status__title", message(spec.title)), element("p", "", message(spec.body)));
            if (spec.retry) {
                const retry = element("button", "veda-button", message("search.status.retry"));
                retry.type = "button";
                retry.addEventListener("click", () => {
                    // The button disappears when loading starts; keep focus on the query.
                    input.focus();
                    runSearch();
                });
                const actions = element("p", "veda-actions");
                actions.append(retry);
                body.append(actions);
            }
            box.append(icon, body);
            return box;
        }

        // Exactly one state is shown at a time.
        function draw() {
            const { state } = view;
            initial.hidden = state !== "initial";
            count.textContent = state === "results"
                ? message("search.results.count", { count: view.results.length, total: view.total })
                : "";
            status.replaceChildren(...(STATUS[state] ? [statusBox(STATUS[state])] : []));
            resultsList.setAttribute("aria-busy", String(state === "loading"));
            resultsList.replaceChildren(...(state === "results" ? view.results.map(resultItem) : []));
            resultsList.hidden = state !== "results";
        }

        function render(next) {
            view = next;
            draw();
        }

        function loadData() {
            if (!loading) {
                loading = fetch(DATA_URL)
                    .then((response) => {
                        if (!response.ok) throw new Error(`${DATA_URL}: HTTP ${response.status}`);
                        return response.json();
                    })
                    .then(validateData)
                    .then((loaded) => {
                        data = loaded;
                        return loaded;
                    }, (error) => {
                        // Let Retry start a new request.
                        loading = null;
                        throw error;
                    });
            }
            return loading;
        }

        function selectedFields() {
            return { abbreviation: searchAbbreviation.checked, full: searchFull.checked };
        }

        function showResults() {
            const results = searchEntries(data, input.value, selectedFields());
            render(results.length ? { state: "results", results, total: countEntries(data) } : { state: "empty" });
        }

        // Shared by live input, Search/Enter, checkbox changes and Retry.
        // Only the latest call may update the page.
        function runSearch() {
            const id = ++latest;
            const fields = selectedFields();
            if (!fields.abbreviation && !fields.full) {
                render({ state: "noFields" });
                return;
            }
            if (data) {
                showResults();
                return;
            }
            if (view.state !== "loading") render({ state: "loading" });
            loadData().then(() => {
                if (id === latest) showResults();
            }, (error) => {
                if (id !== latest) return;
                console.error("[ewaia]", error);
                render({ state: "error" });
            });
        }

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            runSearch();
        });
        input.addEventListener("input", runSearch);
        for (const checkbox of [searchAbbreviation, searchFull]) {
            checkbox.addEventListener("change", () => {
                // Before the first search the page stays in its initial state.
                if (view.state !== "initial") runSearch();
            });
        }
        document.addEventListener("veda:languagechange", draw);
        draw();
    }

    const api = { matchesEntry, searchEntries, countEntries, validateData, formatFallback, FALLBACK };
    if (typeof module === "object" && module.exports) module.exports = api;

    if (typeof document !== "undefined") {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
        else start();
    }
})();
