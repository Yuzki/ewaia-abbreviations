// Layout and legacy-URL checks. Run with: node --test tests/
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("index.html references only files that exist", () => {
    const refs = [...read("index.html").matchAll(/\b(?:href|src)="([^"#:]+)"/g)].map((match) => match[1]);
    for (const ref of refs.filter((ref) => ref !== "./" && !ref.startsWith("data,"))) {
        assert.ok(fs.existsSync(path.join(root, ref)), ref);
    }
});

test("script.js fetches the data file that exists", () => {
    const url = read("assets/script.js").match(/DATA_URL = "([^"]+)"/)[1];
    assert.ok(fs.existsSync(path.join(root, url)), url);
});

test("legacy bib/web/ewaia.json is byte-identical to data/ewaia.json", () => {
    assert.equal(read("bib/web/ewaia.json"), read("data/ewaia.json"));
});

test("legacy bib/web/search.html leads to the site root without looping", () => {
    const html = read("bib/web/search.html");
    assert.match(html, /http-equiv="refresh" content="0; url=\.\.\/\.\.\/"/);
    assert.match(html, /location\.replace\("\.\.\/\.\.\/"/);
    assert.ok(fs.existsSync(path.join(root, "index.html")));
    assert.ok(!/search\.html/.test(read("index.html")));
});
