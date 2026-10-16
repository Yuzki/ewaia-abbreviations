// Locale dictionary checks. Run with: node --test tests/
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { FALLBACK, formatFallback } = require("../bib/web/script.js");

const web = path.join(__dirname, "../bib/web");
const profiles = require("../bib/web/locales/profiles.json");
const en = require("../bib/web/locales/en.json");
const ja = require("../bib/web/locales/ja.json");
const html = fs.readFileSync(path.join(web, "search.html"), "utf8");

const PLURAL_FORMS = new Set(["zero", "one", "two", "few", "many", "other"]);

// Flattens messages to { "a.b": string | { one, other } }.
function flatten(messages, prefix = "", out = {}) {
    for (const [key, value] of Object.entries(messages)) {
        const name = prefix ? `${prefix}.${key}` : key;
        const isPlural = typeof value === "object" && Object.keys(value).every((form) => PLURAL_FORMS.has(form));
        if (typeof value === "string" || isPlural) out[name] = value;
        else flatten(value, name, out);
    }
    return out;
}

function placeholders(value) {
    const texts = typeof value === "string" ? [value] : Object.values(value);
    return [...new Set(texts.flatMap((text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1])))].sort();
}

// Same lookup and formatting as the shared i18n.js.
function format(messages, lang, key, params) {
    let value = flatten(messages)[key];
    if (typeof value === "object") value = value[new Intl.PluralRules(lang).select(params.count)] ?? value.other;
    const numbers = new Intl.NumberFormat(lang);
    return value.replace(/\{(\w+)\}/g, (match, name) => (typeof params[name] === "number" ? numbers.format(params[name]) : String(params[name])));
}

const flatEn = flatten(en);
const flatJa = flatten(ja);

test("profiles declare English (default) and Japanese with existing dictionaries", () => {
    assert.equal(profiles.default, "en");
    assert.deepEqual(Object.keys(profiles.languages).sort(), ["en", "ja"]);
    for (const [lang, profile] of Object.entries(profiles.languages)) {
        assert.equal(profile.status, "supported", lang);
        assert.ok(fs.existsSync(path.join(web, "locales", profile.messages)), profile.messages);
    }
});

test("English and Japanese have the same keys and placeholders", () => {
    assert.deepEqual(Object.keys(flatJa).sort(), Object.keys(flatEn).sort());
    for (const key of Object.keys(flatEn)) {
        assert.deepEqual(placeholders(flatJa[key]), placeholders(flatEn[key]), key);
        assert.equal(typeof flatJa[key] === "string", typeof flatEn[key] === "string", key);
    }
});

test("plural messages have an other form", () => {
    for (const [key, value] of Object.entries({ ...flatEn, ...flatJa })) {
        if (typeof value === "object") assert.equal(typeof value.other, "string", key);
    }
});

test("every data-i18n key in the page exists", () => {
    const keys = [
        ...[...html.matchAll(/data-i18n="([^"]+)"/g)].map((match) => match[1]),
        ...[...html.matchAll(/data-i18n-attr="([^"]+)"/g)].flatMap((match) => match[1].split(";").map((pair) => pair.split(":")[1].trim())),
    ];
    assert.ok(keys.length > 20);
    for (const key of keys) assert.ok(key in flatEn, key);
});

test("static English markup matches en.json", () => {
    const texts = [...html.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]*)</g)];
    assert.ok(texts.length > 20);
    for (const [, key, text] of texts) assert.equal(text, flatEn[key], key);
});

test("English fallback in script.js matches en.json", () => {
    for (const [key, value] of Object.entries(FALLBACK)) assert.deepEqual(value, flatEn[key], key);
});

test("result counts use plural forms and number formatting", () => {
    const key = "search.results.count";
    assert.equal(format(en, "en", key, { count: 0, total: 932 }), "0 entries (of 932)");
    assert.equal(format(en, "en", key, { count: 1, total: 932 }), "1 entry (of 932)");
    assert.equal(format(en, "en", key, { count: 1200, total: 1200 }), "1,200 entries (of 1,200)");
    assert.equal(format(ja, "ja", key, { count: 1, total: 932 }), "1件（全932件中）");
    assert.equal(format(ja, "ja", key, { count: 1200, total: 1200 }), "1,200件（全1,200件中）");
    assert.equal(formatFallback(key, { count: 1, total: 932 }), "1 entry (of 932)");
    assert.equal(formatFallback(key, { count: 1200, total: 932 }), "1,200 entries (of 932)");
    assert.equal(formatFallback("search.meta.source", { file: "bib/EWAia-I.csv" }), "Source: EWAia list of abbreviations (bib/EWAia-I.csv)");
});
