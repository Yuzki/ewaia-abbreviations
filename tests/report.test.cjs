// Footer "Report a problem" link checks. Run with: node --test tests/
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");
const SERVICE = "EWAia Abbreviation Search";
const VENDOR = "assets/vendor/veda-design/0.1.0-pilot-0a4c491";

const link = html.match(/<a [^>]*data-veda-report-link[^>]*>/)[0];
const attr = (name) => link.match(new RegExp(`\\b${name}="([^"]*)"`))[1];

test("report link carries the exact service name in href and data attribute", () => {
    const url = new URL(attr("href").replace(/&amp;/g, "&"));
    assert.equal(url.origin + url.pathname, "https://github.com/Yuzki/veda-ai-feedback/issues/new");
    assert.equal(url.searchParams.get("template"), "report.yml");
    assert.equal(url.searchParams.get("service"), SERVICE);
    assert.equal(attr("data-veda-report-service"), SERVICE);
});

test("report link is in the footer links and describes itself with an existing note", () => {
    const links = html.match(/<ul class="veda-footer__links">[\s\S]*?<\/ul>/)[0];
    assert.ok(links.endsWith(`${link}Report a problem</a></li>\n            </ul>`));
    const id = attr("aria-describedby");
    assert.match(html, new RegExp(`<p id="${id}" class="veda-note veda-footer__report"`));
});

test("index.html uses the new vendor dir and report.js only", () => {
    assert.ok(html.includes(`${VENDOR}/scripts/report.js`));
    assert.ok(!html.includes("0.1.0-pilot-fbeb384") && !html.includes("0.1.0-pilot-0b90d3c"));
});

test("SOURCE.md digests match all six vendored files", () => {
    const source = read(`${VENDOR}/SOURCE.md`);
    const rows = [...source.matchAll(/\| `((?:styles|scripts)\/[^`]+)` \| `([0-9a-f]{64})` \|/g)];
    assert.deepEqual(rows.map((row) => row[1]).sort(), [
        "scripts/i18n.js", "scripts/report.js", "scripts/theme.js",
        "styles/components.css", "styles/tokens.css", "styles/typography.css",
    ]);
    for (const [, file, digest] of rows) {
        assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(root, VENDOR, file))).digest("hex"), digest, file);
    }
});

test("static English text equals en.json", () => {
    const en = JSON.parse(read("assets/locales/en.json")).footer;
    assert.ok(html.includes(`>${en.report}</a>`));
    assert.ok(html.includes(`>${en.reportNote}</p>`));
});

test("report.js sends the page without query or hash and keeps the service", () => {
    const anchor = {
        attrs: { href: attr("href").replace(/&amp;/g, "&"), "data-veda-report-service": SERVICE },
        getAttribute(name) { return this.attrs[name] ?? null; },
        setAttribute(name, value) { this.attrs[name] = value; },
    };
    const location = { href: "https://host.example/app/?q=secret&lang=ja#x", protocol: "https:", origin: "https://host.example", pathname: "/app/" };
    const window = {};
    vm.runInNewContext(read(`${VENDOR}/scripts/report.js`), {
        URL, window, location,
        document: { readyState: "complete", querySelectorAll: () => [anchor] },
    });
    const url = new URL(anchor.attrs.href);
    assert.equal(url.searchParams.get("page"), "https://host.example/app/");
    assert.equal(url.searchParams.get("service"), SERVICE);
    assert.ok(!anchor.attrs.href.includes("secret"));
});
