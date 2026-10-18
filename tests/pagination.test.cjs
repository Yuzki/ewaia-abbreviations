// Pagination checks: pure helper plus script.js running against a minimal fake DOM.
// Run with: node --test tests/
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const { paginate, searchEntries, PAGE_SIZE } = require("../assets/script.js");
const data = require("../data/ewaia.json");

const source = fs.readFileSync(path.join(__dirname, "../assets/script.js"), "utf8");
const TOTAL = Object.values(data).reduce((sum, list) => sum + list.length, 0);

class Node {
    constructor(doc, tag) {
        Object.assign(this, { doc, tag, children: [], hidden: false, disabled: false, checked: false, value: "", textContent: "", className: "", listeners: {}, attrs: {} });
    }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    setAttribute(name, value) { this.attrs[name] = value; }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    focus() { this.doc.active = this; }
    fire(type) { (this.listeners[type] || []).forEach((fn) => fn({ preventDefault() {} })); }
}

const IDS = ["searchForm", "searchInput", "searchAbbreviation", "searchFull", "searchInitial", "resultCount",
    "searchStatus", "searchResults", "resultsTitle", "resultsJump", "resultsJumpLink", "resultsJumpCount",
    "pagination", "paginationRange", "pageCurrent", "pagePrev", "pageNext"];

async function page() {
    const doc = { readyState: "complete", active: null, nodes: {}, listeners: {} };
    for (const id of IDS) doc.nodes[id] = new Node(doc, id);
    doc.nodes.searchAbbreviation.checked = doc.nodes.searchFull.checked = true;
    doc.nodes.resultsJump.hidden = true;
    doc.getElementById = (id) => doc.nodes[id];
    doc.createElement = (tag) => new Node(doc, tag);
    doc.addEventListener = (type, fn) => { (doc.listeners[type] ||= []).push(fn); };
    const fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
    vm.runInNewContext(source, { document: doc, window: {}, fetch, Intl, console });
    const n = doc.nodes;
    const settle = () => new Promise((resolve) => setImmediate(resolve));
    const search = async (value) => { n.searchInput.value = value; n.searchInput.fire("input"); await settle(); };
    return { doc, n, search, settle };
}

test("paginate clamps and reports 1-based ranges", () => {
    assert.equal(PAGE_SIZE, 50);
    assert.deepEqual(paginate(932, 1), { page: 1, pages: 19, start: 0, end: 50, from: 1, to: 50 });
    assert.deepEqual(paginate(932, 19), { page: 19, pages: 19, start: 900, end: 932, from: 901, to: 932 });
    assert.equal(paginate(932, 99).page, 19);
    assert.equal(paginate(932, 0).page, 1);
    assert.equal(paginate(932, NaN).page, 1);
    assert.deepEqual(paginate(23, 1), { page: 1, pages: 1, start: 0, end: 23, from: 1, to: 23 });
    assert.equal(paginate(0, 1).pages, 1);
});

test("empty search mounts at most 50 of 932 entries and the count is unchanged", async () => {
    const { n, search } = await page();
    assert.equal(TOTAL, 932);
    await search("");
    assert.equal(n.searchResults.children.length, 50);
    assert.equal(n.resultCount.textContent, "932 entries (of 932)");
    assert.equal(n.resultsJumpCount.textContent, "932 entries (of 932)");
    assert.equal(n.resultsJump.hidden, false);
    assert.equal(n.pagination.hidden, false);
    assert.equal(n.paginationRange.textContent, "Showing 1–50 of 932 entries");
    assert.equal(n.pageCurrent.textContent, "Page 1 of 19");
    assert.equal(n.pagePrev.disabled, true);
    assert.equal(n.pageNext.disabled, false);
});

test("every entry is reachable through the pages, in data order, with focus on the heading", async () => {
    const { doc, n, search } = await page();
    await search("");
    const seen = [];
    const titles = () => n.searchResults.children.map((item) => item.children[0].textContent);
    seen.push(...titles());
    for (let i = 2; i <= 19; i++) {
        doc.active = null;
        n.pageNext.fire("click");
        assert.equal(doc.active, n.resultsTitle);
        assert.equal(n.pageCurrent.textContent, `Page ${i} of 19`);
        assert.ok(n.searchResults.children.length <= 50);
        seen.push(...titles());
    }
    assert.equal(n.pageNext.disabled, true);
    assert.equal(n.searchResults.children.length, 32);
    assert.equal(n.paginationRange.textContent, "Showing 901–932 of 932 entries");
    assert.deepEqual(seen, searchEntries(data, "", { abbreviation: true, full: true }).map((r) => r.entry.abbreviation));
    n.pagePrev.fire("click");
    assert.equal(n.pageCurrent.textContent, "Page 18 of 19");
});

test("query and field changes return to page 1 without moving focus; language change keeps the page", async () => {
    const { doc, n, search } = await page();
    await search("");
    n.pageNext.fire("click");
    n.pageNext.fire("click");
    assert.equal(n.pageCurrent.textContent, "Page 3 of 19");
    doc.listeners["veda:languagechange"].forEach((fn) => fn());
    assert.equal(n.pageCurrent.textContent, "Page 3 of 19");
    assert.equal(n.searchInput.value, "");

    doc.active = n.searchInput;
    await search("a");
    assert.match(n.pageCurrent.textContent, /^Page 1 of /);
    assert.equal(doc.active, n.searchInput);

    n.pageNext.fire("click");
    n.searchFull.checked = false;
    n.searchFull.fire("change");
    assert.match(n.pageCurrent.textContent, /^Page 1 of /);
});

test("a query with 50 or fewer matches shows every entry and no pager", async () => {
    const { n, search } = await page();
    await search("RV");
    assert.equal(n.searchResults.children.length, 23);
    assert.equal(n.resultCount.textContent, "23 entries (of 932)");
    assert.equal(n.pagination.hidden, true);
    await search("zzzzzz-no-such-entry");
    assert.equal(n.searchResults.children.length, 0);
    assert.equal(n.pagination.hidden, true);
    assert.equal(n.resultsJumpCount.textContent, "");
});

test("the results jump link focuses the heading", async () => {
    const { doc, n, search } = await page();
    await search("RV");
    n.resultsJumpLink.fire("click");
    assert.equal(doc.active, n.resultsTitle);
});
