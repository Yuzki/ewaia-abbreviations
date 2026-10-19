# EWAia Abbreviation Search

A static site for searching the abbreviations and full titles in Manfred Mayrhofer's *Etymologisches Wörterbuch des Altindoarischen* (EWAia). It does a case-insensitive substring search over both abbreviations and full titles, and shows the abbreviation, full title, and type in their original order.

The related code, CSV files, and source notes were split out of [SktTool](https://github.com/Yuzki/SktTool) together with their commit history. For the background and scope of the split, see [SktTool issue #4](https://github.com/Yuzki/SktTool/issues/4). This project does not include EWAia full-text search, the Register, JAIBS abbreviations, or any other Sanskrit tools.

## Running locally

Run this from the repository root. Python 3 and uv are required.

```sh
uv run python -m http.server 8000 --bind 127.0.0.1
```

Open <http://127.0.0.1:8000/>. The page fetches its JSON from `data/ewaia.json` on the same site and does not depend on SktTool's data hosting. Because all URLs are relative, the site also works under a subpath such as GitHub Pages. Publishing setup is not part of the work in this repository.

## Layout

| Path | Contents |
| --- | --- |
| `index.html` | The search page (canonical URL: the site root) |
| `assets/` | `script.js`, `styles.css`, `locales/` (interface dictionaries), `vendor/` (shared design copy) |
| `data/ewaia.json` | Generated search data fetched by the page |
| `data/source/` | Source CSV files and source notes ([README](data/source/README.md)) |
| `scripts/joincsv.py` | Generator for `data/ewaia.json` |
| `data/corrections/` | `applied.csv` (before/after log of every corrected field) and `review.csv` (suspected errors left unfixed) |
| `scripts/apply_corrections.py` | Applies, reverts, or checks the correction log on `data/source/` |
| `scripts/find_ocr_candidates.py` | Detector for suspected OCR errors (writes `docs/ocr-candidates.md`) |
| `tests/` | Node tests (`*.test.cjs`) and Python unittests (`test_*.py`) |
| `bib/web/` | Legacy URLs only: `search.html` redirects to the root (keeping `?lang=` and the hash) and `ewaia.json` is a generated identical copy of the data |

The site is served from the repository root, so the root URL and `bib/web/search.html` (the old location) keep working. SktTool's relocation notice points at the site root only, so no other destination is needed. The old direct URLs of the other files under `bib/` (CSV files, scripts, styles, locales, vendor) were implementation details and are not kept.

## Using the search

- Search runs as you type. **Search** and Enter run the same search without leaving the page.
- The **Search in** checkboxes choose the fields to search: **Abbreviation**, **Full form**, or both. Changing them updates the current results immediately. With both off, the page says that no field is selected and shows no results; the checkboxes are not turned back on automatically.
- Matching is a case-insensitive substring test on the selected fields. Input is not trimmed or normalized, so leading or trailing spaces and composed or decomposed characters are matched as typed. Results keep the order of the data file, including duplicates and the original type values.
- When the page opens it shows instructions, not results. An empty search (pressing Search with an empty field, or clearing a query you typed) lists every entry; with both fields on that is all 932 entries. Results are shown 50 per page with previous/next controls (a **Go to results** link under the search form jumps to the list); a new query or field change returns to page 1, and changing language or theme keeps the page.
- The page distinguishes loading, results with a count, no matches, no field selected, and a data load failure. After a failure your query and options are kept and **Try again** loads the data again.
- Open **Display settings** in the header to change these. **Language** switches the interface between English and Japanese (`?lang=en` or `?lang=ja`). **Color theme** follows the device setting by default or can be set to light or dark. Both choices are remembered in the browser when storage is allowed. Entry text from the data is never translated.

Without JavaScript, the page shows its structure, a notice, and the source and license links, but searching does not work.

## Shared design (pilot)

The page uses the VEDA AI shared design as a pilot for [issue #1](https://github.com/Yuzki/ewaia-abbreviations/issues/1). The CSS and the optional language and theme scripts are copied unmodified from an unreleased snapshot (0.1.0, commit `cad0076`, shared design [PR #11](https://github.com/Yuzki/veda-ai-design-system/pull/11) parent-site navigation, on top of issue #9, PR #7 and PR #6) into `assets/vendor/veda-design/0.1.0-pilot-cad0076/`. [SOURCE.md](assets/vendor/veda-design/0.1.0-pilot-cad0076/SOURCE.md) there records the upstream commit, file digests, terms status, and update and rollback steps. The interface text is in `assets/locales/`, and service-specific styles are in `assets/styles.css`. The footer ends with a subtle "Part of the VEDA AI project (veda-ai.org)" reference (shared `.veda-project-reference`, key `common.project.partOf`, English and Japanese) linking to `https://veda-ai.org` as an ordinary same-tab link. The previous snapshots (`0.1.0-pilot-9d65cf4`, `0.1.0-pilot-e8154fd`, `0.1.0-pilot-0a4c491`, `0.1.0-pilot-0b90d3c`) are kept for rollback.

The right end of the header has a collapsed **Display settings** popover (the shared `details.veda-settings`; it overlays the page, and Esc or a click outside closes it) holding the language and color theme selects. The color theme select (system / light / dark) follows the shared contract: `system` removes the `data-veda-theme` attribute and the saved choice, so the page follows the OS setting. A light or dark choice is saved in this origin's `localStorage` under `veda-theme` (not shared across subdomains and not synced live between tabs); if storage is blocked the choice lasts for that page view only. Without JavaScript the select is hidden and the page follows the OS. The validation record, with browser checks and what is still unconfirmed, is in [docs/theme-pilot.md](docs/theme-pilot.md). Using this contract on other services needs the maintainer's separate approval.

The footer has a "Report a problem" link to the public issue form in `Yuzki/veda-ai-feedback` (shared design PR #4, `scripts/report.js`). It pre-fills `service` with `EWAia Abbreviation Search` (always English) and, when JavaScript runs, `page` with the page origin and path only. The query string (including the search term and `lang`) and the hash are never sent. Reports become public GitHub issues and need a GitHub account; the link text and a note saying so are in the locale files. The upstream terms are still unconfirmed.

The page loads no CDN, web font, or other external resource at run time, so it works offline once served. Applying this design to other services is not part of this pilot.

## Checks

```sh
node --test
```

(`node --test tests/` also works on Node versions before 24; Node 24 treats the directory argument as a module path. Plain `node --test` finds `tests/*.test.cjs` on all versions.)

`tests/search.test.cjs` compares the search with the original page's matching code on the real data and on small edge-case fixtures. `tests/layout.test.cjs` checks that the page's local references resolve and that the legacy `bib/web/` URLs stay in place. `tests/locales.test.cjs` checks that the English and Japanese dictionaries match, that every key the page uses exists, and how counts are formatted. `tests/report.test.cjs` checks the footer report link and the vendored file digests. `tests/theme.test.cjs` checks the color theme contract (start-up priority, API, events, storage failures) against the vendored `theme.js`; it does not cover rendering, which [docs/theme-pilot.md](docs/theme-pilot.md) records. The tests use only Node built-in modules.

```sh
python3 -I -m unittest discover -s tests -p 'test_*.py'
```

The Python unittests cover the OCR candidate rules (`tests/test_find_ocr_candidates.py`) and the correction tool (`tests/test_apply_corrections.py`), including a check that the committed log matches `data/source/`.

## Regenerating the data

```sh
uv run python scripts/joincsv.py
```

Using only the Python standard library, the script generates 932 entries from the 4 CSV files. It can also be run from another working directory by giving the absolute path to the script. It preserves the JSON keys, row order, strings, and types, and reports missing required headers or values as errors. It does not strip whitespace, remove duplicates, normalize Unicode, or correct OCR errors; corrections reach the data only through the CSV files (see "Correcting the data").

For the original sources, the mapping of CSV files, the conversion history, and unresolved rights questions, see [DATA_SOURCES.md](DATA_SOURCES.md). For the source notes, see [data/source/README.md](data/source/README.md). The data went through OCR and conversion by ChatGPT (GPT-3.5), so it still contains typos (the certain ones are corrected through the log) and incorrect type assignments.

## Finding OCR error candidates

```sh
python3 scripts/find_ocr_candidates.py [--format md|csv] [--output PATH]
```

The script reads the 4 CSV files without modifying them and writes a heuristic list of suspicious spots (stray symbols, look-alike characters, rare words close to frequent ones, duplicates, and so on) to [docs/ocr-candidates.md](docs/ocr-candidates.md). It lists candidates only, not corrections: expect false positives, and the data is changed only after a person reviews the list, through the correction log below. It uses only the Python standard library.

## Correcting the data

Reviewed corrections are recorded as before/after rows in [data/corrections/applied.csv](data/corrections/applied.csv); the CSV files are never edited by hand. Doubtful spots stay in [data/corrections/review.csv](data/corrections/review.csv). The policy is in [DATA_SOURCES.md](DATA_SOURCES.md).

```sh
python3 scripts/apply_corrections.py            # apply the log (idempotent)
python3 scripts/apply_corrections.py --check    # exit 1 if a correction is not in place
python3 scripts/apply_corrections.py --revert   # restore the original values
python3 scripts/apply_corrections.py --revert --id 12   # revert one row only
uv run python scripts/joincsv.py                # then regenerate the JSON files
python3 scripts/find_ocr_candidates.py          # and the candidate list
```

The script edits only the changed fields (quoting, line endings, and row order stay byte-identical) and checks every row before it writes anything, so a mismatch changes nothing. It uses only the Python standard library.

## Dependencies and terms

The page has no third-party runtime dependencies. Earlier versions loaded Bootstrap 5.0.2 and Popper 2.9.2 from a CDN; the shared-design pilot removed both. The vendored VEDA AI design files had no license notice at the copied commit, and their terms must be confirmed upstream (see their SOURCE.md). This repository's MIT License does not cover them.

This project's own code is licensed under the MIT License ([LICENSE](LICENSE), copyright holder Yuzuki Tsukagoshi). This choice was made on the user's confirmation, and it does not change or revoke any earlier GPL distribution in SktTool. The redistribution terms for the abbreviation data are undecided. Publication and distribution of the data are on hold until the rights notice, redistribution permission, and data terms of the original source can be verified. The code's MIT terms are not applied to the data, and no MIT or CC terms have been assigned to the data by inference.

Redirect or relocation notices on the SktTool side are separate work. UI unification, translation, new features, and OCR corrections were outside the scope of the split; the shared-design pilot above was done later, under issue #1.
