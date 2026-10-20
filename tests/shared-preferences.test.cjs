// Shared language/theme preference checks: real settings.js, theme.js and i18n.js
// in one VM context with stubbed cookie jar, location, history, navigator, storage and
// fetch (service profiles/dictionaries are read from assets/locales). Browser behavior
// (real cookies, rendering) is checked separately (docs/theme-pilot.md). Run with: node --test
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");
const head = html.match(/<head>[\s\S]*?<\/head>/)[0];
const VENDOR = "assets/vendor/veda-design/0.1.0-pilot-d08f1bf";
const src = (name) => read(`${VENDOR}/scripts/${name}.js`);
const COOKIE_ATTRS = "Domain=veda-ai.org; Path=/; Max-Age=31536000; SameSite=Lax; Secure";

test("index.html loads one synchronous settings.js before one synchronous theme.js, i18n deferred", () => {
    const tags = [...head.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
    const find = (name) => tags.filter((t) => t.includes(`/${name}.js`));
    for (const name of ["settings", "theme", "i18n", "report"]) assert.equal(find(name).length, 1, name);
    assert.ok(find("settings")[0].includes(`${VENDOR}/scripts/settings.js`));
    assert.doesNotMatch(find("settings")[0], /\b(async|defer)\b/);
    assert.doesNotMatch(find("theme")[0], /\b(async|defer)\b/);
    assert.match(find("i18n")[0], /\bdefer\b/);
    assert.match(find("i18n")[0], /data-veda-locales="\.\.\/\.\.\/\.\.\/\.\.\/locales\/"/);
    const at = (name) => tags.findIndex((t) => t.includes(`/${name}.js`));
    assert.ok(at("settings") < at("theme"));
    assert.ok(at("theme") < at("i18n"));
    assert.doesNotMatch(html.match(/<html[^>]*>/)[0], /data-veda-theme/);
});

function makeEnv(options = {}) {
    const {
        url = "https://abbr.veda-ai.org/", cookies = [], local = {}, languages = ["en-US"], language,
        attr, htmlLang = "en", storage = {}, cookieDenied = false, historyDenied = false, state = { keep: 1 },
        locales = true,
    } = options;
    let current = new URL(url);
    const location = {
        get href() { return current.href; },
        get hostname() { return current.hostname; },
        get protocol() { return current.protocol; },
    };
    const rawCookies = [...cookies];
    const store = new Map(Object.entries(local));
    const log = { cookieWrites: [], storageWrites: [], replaced: [] };
    const attrs = new Map(attr === undefined ? [] : [["data-veda-theme", attr]]);
    const listeners = {};
    const localStorage = {
        getItem(k) { if (storage.get) throw new Error("denied"); return store.has(k) ? store.get(k) : null; },
        setItem(k, v) { if (storage.set) throw new Error("denied"); log.storageWrites.push([k, v]); store.set(k, v); },
    };
    const doc = {
        readyState: "loading",
        currentScript: null,
        documentElement: {
            lang: htmlLang,
            getAttribute: (n) => (attrs.has(n) ? attrs.get(n) : null),
            setAttribute: (n, v) => attrs.set(n, String(v)),
            removeAttribute: (n) => attrs.delete(n),
        },
        get cookie() {
            if (cookieDenied) throw new Error("denied");
            return rawCookies.join("; ");
        },
        set cookie(v) {
            if (cookieDenied) throw new Error("denied");
            log.cookieWrites.push(v);
            const pair = v.split(";")[0];
            const name = pair.slice(0, pair.indexOf("="));
            const at = rawCookies.findIndex((c) => c.startsWith(`${name}=`));
            if (at >= 0) rawCookies.splice(at, 1);
            rawCookies.push(pair);
        },
        querySelectorAll: () => [],
        querySelector: () => null,
        addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
        dispatchEvent(e) { (listeners[e.type] || []).forEach((fn) => fn(e)); },
    };
    const history = {
        get state() { return state; },
        replaceState(s, _title, u) {
            if (historyDenied) throw new Error("denied");
            assert.equal(s, state, "history.state is passed through");
            log.replaced.push(String(u));
            current = new URL(String(u));
        },
    };
    class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } }
    const navigator = language === undefined ? { languages } : { languages: [], language };
    const window = {};
    const fetch = async (u) => {
        if (!locales) return { ok: false, status: 404, json: async () => ({}) };
        const file = path.join(root, "assets", "locales", path.basename(String(u)));
        return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(file, "utf8")) };
    };
    const sandbox = { document: doc, window, location, localStorage, history, navigator, CustomEvent, URL, fetch, console: { error() {} } };
    vm.createContext(sandbox);
    const load = (name, withBase) => {
        doc.currentScript = withBase
            ? { dataset: { vedaLocales: "../../../../locales/" }, src: new URL(`${VENDOR}/scripts/${name}.js`, "https://abbr.veda-ai.org/").href }
            : null;
        vm.runInContext(src(name), sandbox);
    };
    // Same order as index.html.
    load("settings");
    load("theme");
    load("i18n", true);
    return {
        window, doc, store, log, rawCookies,
        get href() { return current.href; },
        theme: () => attrs.get("data-veda-theme") ?? null,
        ready() {
            doc.readyState = "complete";
            (listeners.DOMContentLoaded || []).forEach((fn) => fn());
            return window.VedaI18n.ready;
        },
    };
}

const profiles = JSON.parse(read("assets/locales/profiles.json"));
async function start(options) {
    const env = makeEnv(options);
    await env.ready();
    return env;
}

test("first visit follows browser language and system colors, writes nothing", async () => {
    for (const [langs, want] of [[["en-US"], "en"], [["ja-JP"], "ja"], [["fr-FR", "ja"], "ja"], [["fr-FR"], "en"]]) {
        const e = await start({ languages: langs, htmlLang: "en" });
        assert.equal(e.window.VedaI18n.lang, want, langs.join());
        assert.equal(e.theme(), null);
        assert.equal(e.window.VedaTheme.get(), "system");
        assert.deepEqual(e.log.cookieWrites, []);
        assert.deepEqual(e.log.storageWrites, []);
        assert.deepEqual(e.log.replaced, []);
    }
    const single = await start({ language: "ja-JP" });
    assert.equal(single.window.VedaI18n.lang, "ja");
});

test("priority: URL > shared cookie > stale localStorage > browser > default", async () => {
    const cookies = ["veda-lang=ja", "veda-theme=dark"];
    const local = { "veda-lang": "en", "veda-theme": "light" };
    let e = await start({ cookies, local });
    assert.equal(e.window.VedaI18n.lang, "ja");
    assert.equal(e.theme(), "dark");
    assert.deepEqual(e.log.cookieWrites, []);
    assert.deepEqual(e.log.storageWrites, []);
    assert.equal(e.href, "https://abbr.veda-ai.org/");
    e = await start({ url: "https://abbr.veda-ai.org/?lang=en&theme=light", cookies });
    assert.equal(e.window.VedaI18n.lang, "en");
    assert.equal(e.theme(), "light");
    e = await start({ local: { "veda-lang": "ja", "veda-theme": "dark" }, languages: ["en-US"] });
    assert.equal(e.window.VedaI18n.lang, "ja");
    assert.equal(e.theme(), "dark");
    e = await start({ languages: ["fr"] });
    assert.equal(e.window.VedaI18n.lang, profiles.default);
});

test("explicit data-veda-theme beats cookie; language ignores static html lang", async () => {
    const e = await start({ attr: "light", htmlLang: "en", cookies: ["veda-theme=dark", "veda-lang=ja"] });
    assert.equal(e.theme(), "light");
    assert.equal(e.window.VedaI18n.lang, "ja");
});

test("preferences resolve independently and ignore invalid candidates", async () => {
    let e = await start({ url: "https://abbr.veda-ai.org/?lang=xx_bad&theme=neon", cookies: ["veda-lang=ja", "veda-theme=dark"] });
    assert.equal(e.window.VedaI18n.lang, "ja");
    assert.equal(e.theme(), "dark");
    assert.deepEqual(e.log.cookieWrites, [], "invalid URL values are not persisted");
    assert.deepEqual(e.log.storageWrites, []);
    e = await start({ url: "https://abbr.veda-ai.org/?theme=light", cookies: ["veda-lang=ja", "veda-theme=dark"] });
    assert.equal(e.window.VedaI18n.lang, "ja");
    assert.equal(e.theme(), "light");
    e = await start({ url: "https://abbr.veda-ai.org/?lang=", cookies: ["veda-lang=", "veda-theme=%E0%A4%A", "veda-lang=zz", "junk"], local: { "veda-lang": "ja", "veda-theme": "" } });
    assert.equal(e.window.VedaI18n.lang, "ja");
    assert.equal(e.theme(), null);
});

test("language tags resolve by exact tag, primary subtag and service profiles", () => {
    const { VedaSettings } = makeEnv().window;
    assert.equal(VedaSettings.matchLanguage(profiles, "ja"), "ja");
    assert.equal(VedaSettings.matchLanguage(profiles, "ja-JP"), "ja");
    assert.equal(VedaSettings.matchLanguage(profiles, "en-GB"), "en");
    assert.equal(VedaSettings.matchLanguage(profiles, "fr"), null);
    assert.equal(VedaSettings.matchLanguage(profiles, "../x"), null);
    assert.equal(VedaSettings.matchLanguage(profiles, "__proto__"), null);
    assert.equal(VedaSettings.resolveLanguage({ profiles, browserLanguages: [] }).value, "en");
});

test("shared host boundary", () => {
    const { isSharedHost } = makeEnv().window.VedaSettings;
    for (const h of ["veda-ai.org", "abbr.veda-ai.org", "a.b.veda-ai.org"]) assert.equal(isSharedHost(h), true, h);
    for (const h of ["eveda-ai.org", "veda-ai.org.evil.com", "evil-veda-ai.org", "localhost", "127.0.0.1", "[::1]", "yzki.github.io", "", null, undefined]) {
        assert.equal(isSharedHost(h), false, String(h));
    }
});

test("explicit system overwrites shared dark with exact cookie attributes and persists on reload", async () => {
    const e = await start({ cookies: ["veda-theme=dark", "veda-lang=ja"], local: { "veda-theme": "dark" } });
    e.window.VedaTheme.set("system");
    assert.equal(e.theme(), null);
    assert.deepEqual(e.log.cookieWrites, [`veda-theme=system; ${COOKIE_ATTRS}`]);
    assert.doesNotMatch(e.log.cookieWrites[0], /HttpOnly/i);
    assert.equal(e.store.get("veda-theme"), "system");
    assert.match(e.href, /\?theme=system$/);
    // Reload without the query: stored system still wins over the older dark.
    const again = await start({ cookies: e.rawCookies, local: Object.fromEntries(e.store) });
    assert.equal(again.theme(), null);
    assert.equal(again.window.VedaTheme.get(), "system");
    assert.deepEqual(again.log.cookieWrites, []);
});

test("language and theme changes replace only their own URL key and keep state/hash", async () => {
    const state = { page: 2 };
    const e = await start({ url: "https://abbr.veda-ai.org/p/?q=abc&page=2&theme=dark#hit-3", state });
    e.window.VedaTheme.set("light");
    await e.window.VedaI18n.setLanguage("ja");
    const url = new URL(e.href);
    assert.deepEqual([...url.searchParams], [["q", "abc"], ["page", "2"], ["theme", "light"], ["lang", "ja"]]);
    assert.equal(url.pathname, "/p/");
    assert.equal(url.hash, "#hit-3");
    assert.equal(e.store.get("veda-lang"), "ja");
    assert.ok(e.log.cookieWrites.includes(`veda-lang=ja; ${COOKIE_ATTRS}`));
    assert.ok(e.log.cookieWrites.includes(`veda-theme=light; ${COOKIE_ATTRS}`));
});

test("updateUrl ignores no-op, invalid values and unknown keys", () => {
    const e = makeEnv();
    const { updateUrl } = e.window.VedaSettings;
    updateUrl("theme", "dark");
    assert.equal(e.href, "https://abbr.veda-ai.org/?theme=dark");
    updateUrl("theme", "dark");
    updateUrl("theme", "neon");
    updateUrl("other", "x");
    assert.equal(e.log.replaced.length, 1);
});

test("valid URL choices are saved at start-up", async () => {
    const e = await start({ url: "https://abbr.veda-ai.org/?lang=ja&theme=dark" });
    assert.deepEqual([...e.log.cookieWrites].sort(), [`veda-lang=ja; ${COOKIE_ATTRS}`, `veda-theme=dark; ${COOKIE_ATTRS}`]);
    assert.equal(e.store.get("veda-lang"), "ja");
    assert.equal(e.store.get("veda-theme"), "dark");
});

test("origin-local fallback: no cookie writes off eligible hosts or over HTTP", async () => {
    for (const url of ["http://localhost:8000/", "https://yzki.github.io/ewaia/", "http://abbr.veda-ai.org/", "https://veda-ai.org.evil.com/"]) {
        const e = await start({ url, cookies: ["veda-lang=ja", "veda-theme=dark"] });
        e.window.VedaTheme.set("light");
        await e.window.VedaI18n.setLanguage("ja");
        assert.deepEqual(e.log.cookieWrites, [], url);
        assert.equal(e.store.get("veda-theme"), "light", url);
        assert.equal(e.store.get("veda-lang"), "ja", url);
    }
    // Cookies are not even read on ineligible hosts.
    const e = await start({ url: "http://localhost:8000/", cookies: ["veda-theme=dark"] });
    assert.equal(e.theme(), null);
});

test("denied cookie, storage and history access never block display updates", async () => {
    const e = await start({ cookieDenied: true, storage: { get: true, set: true }, historyDenied: true });
    assert.doesNotThrow(() => e.window.VedaTheme.set("dark"));
    assert.equal(e.theme(), "dark");
    await e.window.VedaI18n.setLanguage("ja");
    assert.equal(e.window.VedaI18n.lang, "ja");
    assert.equal(e.doc.documentElement.lang, "ja");
});

test("locale failure still lets theme resolve and change", async () => {
    const e = await start({ locales: false, cookies: ["veda-theme=dark"] });
    assert.equal(e.theme(), "dark");
    assert.equal(e.window.VedaI18n.lang, null);
    e.window.VedaTheme.set("light");
    assert.equal(e.theme(), "light");
});

test("malformed or hostile cookie values are ignored", async () => {
    for (const bad of ["veda-theme=%00", "veda-theme=dark%3Bx", "veda-lang=ja%3B", `veda-lang=${"a".repeat(40)}`]) {
        const e = await start({ cookies: [bad] });
        assert.equal(e.theme(), null, bad);
        assert.equal(e.window.VedaI18n.lang, "en", bad);
    }
});
