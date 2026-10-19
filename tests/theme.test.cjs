// Color theme contract checks against the vendored theme.js. Run with: node --test
// A VM stub covers the script's logic only; OS changes, CSS colors, rendering and
// accessibility are checked in browsers (docs/theme-pilot.md).
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
const VENDOR = "assets/vendor/veda-design/0.1.0-pilot-cad0076";
const KEY = "veda-theme";

// Load theme.js the way index.html references it.
const themeSrc = head.match(/<script src="([^"]*\/theme\.js)"[^>]*><\/script>/)[1];
const code = read(themeSrc);

function makeEnv({ attr, saved, readyState = "loading", controls = 1, storage = {} } = {}) {
    const store = new Map(saved === undefined ? [] : [[KEY, saved]]);
    const attrs = new Map(attr === undefined ? [] : [["data-veda-theme", attr]]);
    const log = { events: [], removed: [], writes: [] };
    const listeners = {};
    const localStorage = {
        getItem(k) { if (storage.get) throw new Error("get denied"); return store.has(k) ? store.get(k) : null; },
        setItem(k, v) { if (storage.set) throw new Error("set denied"); log.writes.push(v); store.set(k, v); },
        removeItem(k) { if (storage.remove) throw new Error("remove denied"); log.removed.push(k); store.delete(k); },
    };
    const makeControl = () => {
        const wrapper = {
            hidden: true,
            removeAttribute(name) { if (name === "hidden") this.hidden = false; },
        };
        const settings = {
            hidden: true,
            removeAttribute(name) { if (name === "hidden") this.hidden = false; },
        };
        const handlers = [];
        return {
            value: "",
            wrapper,
            settings,
            closest: (sel) => (sel === "[data-veda-settings]" ? settings : wrapper),
            addEventListener(type, fn) { if (type === "change") handlers.push(fn); },
            choose(value) { this.value = value; handlers.forEach((fn) => fn()); },
        };
    };
    const list = Array.from({ length: controls }, makeControl);
    const documentElement = {
        hasAttribute: (n) => attrs.has(n),
        getAttribute: (n) => (attrs.has(n) ? attrs.get(n) : null),
        setAttribute: (n, v) => attrs.set(n, String(v)),
        removeAttribute: (n) => attrs.delete(n),
    };
    const document = {
        readyState,
        documentElement,
        querySelectorAll: (sel) => (sel === "select[data-veda-theme-control]" ? list : []),
        addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
        dispatchEvent(event) { log.events.push(event); (listeners[event.type] || []).forEach((fn) => fn(event)); },
    };
    class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } }
    const window = {};
    vm.runInNewContext(code, { document, window, localStorage, CustomEvent });
    const env = { document, window, store, attrs, log, list, listeners };
    env.domReady = () => { document.readyState = "complete"; (listeners.DOMContentLoaded || []).forEach((fn) => fn()); };
    // Count events dispatched after start-up only.
    env.subscribe = () => { const seen = []; document.addEventListener("veda:themechange", (e) => seen.push(e.detail.theme)); return seen; };
    return env;
}

const attrOf = (env) => env.attrs.get("data-veda-theme") ?? null;

test("index.html wires one synchronous theme.js, one labelled select and hidden wrapper", () => {
    const scripts = [...head.matchAll(/<script\b[^>]*theme\.js[^>]*>/g)].map((m) => m[0]);
    assert.equal(scripts.length, 1);
    assert.ok(scripts[0].includes(`${VENDOR}/scripts/theme.js`));
    assert.doesNotMatch(scripts[0], /\b(async|defer)\b|type=/);
    const selects = [...html.matchAll(/<select\b[^>]*data-veda-theme-control[^>]*>([\s\S]*?)<\/select>/g)];
    assert.equal(selects.length, 1);
    const id = selects[0][0].match(/\bid="([^"]+)"/)[1];
    assert.equal(html.match(new RegExp(`id="${id}"`, "g")).length, 1);
    assert.match(html, new RegExp(`<label[^>]*for="${id}"[^>]*data-i18n="common\\.theme\\.label"`));
    assert.deepEqual([...selects[0][1].matchAll(/<option value="([^"]*)"/g)].map((m) => m[1]), ["system", "light", "dark"]);
    assert.match(html, new RegExp(`<div[^>]*data-veda-requires-js hidden[^>]*>\\s*<label[^>]*for="${id}"`));
    assert.match(html, /<div class="veda-header__tools">\s*<details class="veda-settings" data-veda-settings hidden>\s*<summary class="veda-settings__summary"><span data-i18n="common\.settings\.label">/);
    assert.equal(html.match(/<details\b/g).length, 1);
    assert.equal(html.match(/veda-header__tools/g).length, 1);
    assert.doesNotMatch(html.match(/<html[^>]*>/)[0], /data-veda-theme/);
});

test("theme dictionary keys exist in en and ja, and all CSS/JS come from one snapshot", () => {
    for (const lang of ["en", "ja"]) {
        const common = JSON.parse(read(`assets/locales/${lang}.json`)).common.theme;
        for (const key of ["label", "system", "light", "dark"]) assert.ok(common[key], `${lang} ${key}`);
        assert.ok(JSON.parse(read(`assets/locales/${lang}.json`)).common.settings.label, `${lang} settings.label`);
    }
    const refs = [...head.matchAll(/(?:href|src)="(assets\/vendor\/[^"]+)"/g)].map((m) => m[1]);
    assert.equal(refs.length, 7);
    for (const ref of refs) assert.ok(ref.startsWith(`${VENDOR}/`), ref);
    assert.ok(refs.includes(`${VENDOR}/scripts/settings.js`));
});

// [name, initial attribute, saved value, expected data-veda-theme, expected get()]
const startup = [
    ["no attribute, nothing saved", undefined, undefined, null, "system"],
    ["saved light", undefined, "light", "light", "light"],
    ["saved dark", undefined, "dark", "dark", "dark"],
    ["saved system", undefined, "system", null, "system"],
    ["saved garbage", undefined, "purple", null, "system"],
    ["valid attribute beats saved", "light", "dark", "light", "light"],
    ["valid dark attribute beats saved", "dark", "light", "dark", "dark"],
    ["empty attribute, saved dark", "", "dark", "dark", "dark"],
    ["unknown attribute, saved dark", "sepia", "dark", "dark", "dark"],
    ["system attribute, saved dark (old regression)", "system", "dark", "dark", "dark"],
    ["system attribute, nothing saved", "system", undefined, null, "system"],
    ["empty attribute, nothing saved", "", undefined, null, "system"],
    ["unknown attribute, garbage saved", "sepia", "purple", null, "system"],
];
for (const [name, attr, saved, expectAttr, expectGet] of startup) {
    test(`startup: ${name}`, () => {
        const env = makeEnv({ attr, saved });
        assert.equal(attrOf(env), expectAttr);
        assert.equal(env.window.VedaTheme.get(), expectGet);
        // Start-up reads storage but does not rewrite or clear it.
        assert.deepEqual(env.log.writes, []);
        assert.deepEqual(env.log.removed, []);
        assert.equal(env.log.events.length, 0);
    });
}

test("root is set before DOMContentLoaded; controls connect after it", () => {
    const env = makeEnv({ saved: "dark" });
    assert.equal(attrOf(env), "dark");
    assert.equal(env.list[0].value, "");
    assert.equal(env.list[0].wrapper.hidden, true);
    assert.equal(env.list[0].settings.hidden, true);
    env.domReady();
    assert.equal(env.list[0].settings.hidden, false);
    assert.equal(env.list[0].value, "dark");
    assert.equal(env.list[0].wrapper.hidden, false);
    const later = makeEnv({ saved: "light", readyState: "complete" });
    assert.equal(later.list[0].value, "light");
    assert.equal(later.list[0].wrapper.hidden, false);
    assert.equal(later.list[0].settings.hidden, false);
});

test("select change applies, stores, and notifies; system clears attribute and key", () => {
    const env = makeEnv({ saved: "light" });
    env.domReady();
    const seen = env.subscribe();
    env.list[0].choose("dark");
    assert.equal(attrOf(env), "dark");
    assert.equal(env.store.get(KEY), "dark");
    assert.equal(env.window.VedaTheme.get(), "dark");
    env.list[0].choose("system");
    assert.equal(attrOf(env), null);
    assert.equal(env.store.has(KEY), false);
    assert.equal(env.window.VedaTheme.get(), "system");
    assert.deepEqual(seen, ["dark", "system"]);
    const event = env.log.events.at(-1);
    assert.equal(event.type, "veda:themechange");
    assert.deepEqual({ ...event.detail }, { theme: "system" });
});

test("API set updates the select, ignores invalid values, and notifies", () => {
    const env = makeEnv({});
    env.domReady();
    const seen = env.subscribe();
    env.window.VedaTheme.set("light");
    assert.equal(env.list[0].value, "light");
    assert.equal(env.store.get(KEY), "light");
    for (const bad of ["Dark", "", "auto", null, undefined, 1, {}]) env.window.VedaTheme.set(bad);
    assert.equal(env.window.VedaTheme.get(), "light");
    assert.equal(attrOf(env), "light");
    assert.deepEqual(seen, ["light"]);
});

test("multiple controls stay in sync", () => {
    const env = makeEnv({ saved: "dark", controls: 2 });
    env.domReady();
    assert.deepEqual(env.list.map((c) => c.value), ["dark", "dark"]);
    env.list[1].choose("light");
    assert.deepEqual(env.list.map((c) => c.value), ["light", "light"]);
    env.window.VedaTheme.set("system");
    assert.deepEqual(env.list.map((c) => c.value), ["system", "system"]);
});

for (const op of ["get", "set", "remove"]) {
    test(`storage ${op} denied: no exception, choice still applies`, () => {
        const env = makeEnv({ storage: { [op]: true }, saved: op === "get" ? undefined : "light" });
        env.domReady();
        for (const theme of ["dark", "system", "light"]) {
            assert.doesNotThrow(() => env.list[0].choose(theme));
            assert.equal(env.window.VedaTheme.get(), theme);
            assert.equal(attrOf(env), theme === "system" ? null : theme);
        }
        assert.doesNotThrow(() => env.window.VedaTheme.set("dark"));
        assert.equal(env.list[0].value, "dark");
    });
}

test("all storage operations denied from the start", () => {
    const env = makeEnv({ attr: "sepia", storage: { get: true, set: true, remove: true } });
    assert.equal(env.window.VedaTheme.get(), "system");
    env.domReady();
    env.window.VedaTheme.set("dark");
    assert.equal(attrOf(env), "dark");
});
