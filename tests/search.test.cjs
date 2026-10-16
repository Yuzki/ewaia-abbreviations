// Search compatibility checks. Run with: node --test tests/
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { searchEntries, countEntries, validateData } = require("../bib/web/script.js");
const data = require("../bib/web/ewaia.json");

const BOTH = { abbreviation: true, full: true };
const ABBREVIATION = { abbreviation: true, full: false };
const FULL = { abbreviation: false, full: true };
const NEITHER = { abbreviation: false, full: false };

// The predicate and loop of the original page (before the shared-design
// pilot), kept verbatim as the reference for result sets and order.
function originalSearch(source, searchTerm, searchAbbreviation, searchFull) {
    const matches = [];
    for (const key in source) {
        const items = source[key];
        for (const item of items) {
            if ((searchAbbreviation && item.abbreviation.toLowerCase().includes(searchTerm)) || (searchFull && item.full.toLowerCase().includes(searchTerm))) {
                matches.push(item);
            }
        }
    }
    return matches;
}

function entries(results) {
    return results.map((result) => result.entry);
}

function abbreviations(source, query, fields) {
    return searchEntries(source, query, fields).map((result) => result.entry.abbreviation);
}

const fixture = {
    "a.csv": [
        { abbreviation: "RV", full: "Rigveda", type: "literature" },
        { abbreviation: "Nalac ", full: "Nalacampū.", type: "literature" },
        { abbreviation: "Mayrhofer", full: "M. Mayrhofer, KEWA", type: " reference" },
    ],
    "b.csv": [
        { abbreviation: "Vcar", full: "Vararuci (first)", type: "reference" },
        { abbreviation: "Vcar", full: "Vararuci (second)", type: "reference" },
        // "ā" composed (U+0101) and decomposed (a + U+0304).
        { abbreviation: "Rāj", full: "Rājanighaṇṭu", type: "literature" },
        { abbreviation: "Rāj", full: "Rājanighaṇṭu", type: "übrige" },
    ],
};

test("real data matches the original search for fixed queries in every field combination", () => {
    const queries = ["Rigveda", "rigveda", "RIGVEDA", "Vcar", "a", "Mayrhofer", "ṛ", "ā", "Wörterbuch", " ", "", "1955", "zzqqxx"];
    const combinations = [[true, true], [true, false], [false, true], [false, false]];
    for (const query of queries) {
        for (const [abbreviation, full] of combinations) {
            const expected = originalSearch(data, query.toLowerCase(), abbreviation, full);
            const actual = entries(searchEntries(data, query, { abbreviation, full }));
            assert.deepEqual(actual, expected, `query ${JSON.stringify(query)}, fields ${abbreviation}/${full}`);
        }
    }
});

test("real data: blank query with both fields returns all 932 entries in order", () => {
    const results = searchEntries(data, "", BOTH);
    assert.equal(results.length, 932);
    assert.equal(countEntries(data), 932);
    assert.deepEqual(entries(results), Object.values(data).flat());
    assert.deepEqual([...new Set(results.map((result) => result.group))], Object.keys(data));
});

test("real data: a verified absent query has no matches", () => {
    assert.equal(searchEntries(data, "zzqqxx", BOTH).length, 0);
});

test("fields select where to search", () => {
    assert.deepEqual(abbreviations(fixture, "rv", ABBREVIATION), ["RV"]);
    assert.deepEqual(abbreviations(fixture, "rigveda", ABBREVIATION), []);
    assert.deepEqual(abbreviations(fixture, "rigveda", FULL), ["RV"]);
    assert.deepEqual(abbreviations(fixture, "mayrhofer", BOTH), ["Mayrhofer"]);
    assert.deepEqual(abbreviations(fixture, "", NEITHER), []);
    assert.deepEqual(abbreviations(fixture, "rv", NEITHER), []);
});

test("matching is a case-insensitive substring test", () => {
    assert.deepEqual(abbreviations(fixture, "RIGV", FULL), ["RV"]);
    assert.deepEqual(abbreviations(fixture, "eda", FULL), ["RV"]);
    assert.deepEqual(abbreviations(fixture, "kewa", FULL), ["Mayrhofer"]);
});

test("blank query returns every entry of the selected fields", () => {
    assert.equal(searchEntries(fixture, "", BOTH).length, 7);
    assert.equal(searchEntries(fixture, "", ABBREVIATION).length, 7);
    assert.equal(searchEntries(fixture, "", FULL).length, 7);
});

test("whitespace is not trimmed", () => {
    assert.deepEqual(abbreviations(fixture, "nalac ", ABBREVIATION), ["Nalac "]);
    assert.deepEqual(abbreviations(fixture, " nalac", ABBREVIATION), []);
    assert.deepEqual(abbreviations(fixture, " ", ABBREVIATION), ["Nalac "]);
});

test("composed and decomposed text stay distinct", () => {
    assert.deepEqual(abbreviations(fixture, "rāj", BOTH), ["Rāj"]);
    assert.deepEqual(abbreviations(fixture, "rāj", BOTH), ["Rāj"]);
});

test("duplicates, raw types and order are preserved", () => {
    const results = searchEntries(fixture, "vcar", ABBREVIATION);
    assert.deepEqual(entries(results), fixture["b.csv"].slice(0, 2));
    assert.deepEqual(results.map((result) => result.group), ["b.csv", "b.csv"]);
    assert.equal(searchEntries(fixture, "kewa", FULL)[0].entry.type, " reference");
    assert.equal(searchEntries(fixture, "rāj", FULL)[0].entry.type, "übrige");
    assert.equal(searchEntries(fixture, "rv", ABBREVIATION)[0].entry, fixture["a.csv"][0]);
});

test("data validation accepts the real file and rejects broken shapes", () => {
    assert.equal(validateData(data), data);
    for (const broken of [null, [], "x", { g: {} }, { g: [null] }, { g: [{ abbreviation: "A", full: "B" }] }, { g: [{ abbreviation: 1, full: "B", type: "t" }] }]) {
        assert.throws(() => validateData(broken), TypeError, JSON.stringify(broken));
    }
});
