# Color theme pilot record

Record for the maintainer's decision on the shared system / light / dark
contract. It documents the EWAia trial only. It is **not** permission to apply
the contract to other services; that needs the maintainer's explicit approval
and a separate change.

## Quiet UI snapshot (current)

The page now loads `assets/vendor/veda-design/0.1.0-pilot-d08f1bf/`
([SOURCE.md](../assets/vendor/veda-design/0.1.0-pilot-d08f1bf/SOURCE.md); commit
`d08f1bf748f5804fb376968f0378526727564ee4`, upstream
[PR #15](https://github.com/Yuzki/veda-ai-design-system/pull/15) quiet UI rules).
All seven files were compared with upstream and match; only `components.css`
differs from the `af6d1dc` snapshot below, which is kept for rollback.

### Validation of the quiet UI (2026-10-20)

Real browser: Firefox (headless, geckodriver WebDriver), page served over local
HTTP with a switchable data endpoint (ok / slow / fail). Window widths below
about 490px are impossible in headless Firefox, so 390px and 320px use an
iframe of that CSS width. "200% text" is approximated by a 640px viewport, 400%
by 320px. Before = `788a64f`, after = this branch. Screenshots (42 after, 8
before), `report.json` and the scripts are local-only and not committed.

- Screenshots: initial and results for ja/en × light/dark × 390/1280px (16),
  empty / no-fields / error / loading for ja/en × 390/1280px (16), plus 320px,
  640px, forced colors, and no-JavaScript.
- Checks (21, all pass): no horizontal overflow at 320, 640 and 1280px; forced
  colors active and readable; `prefers-reduced-motion` leaves no running
  animation or transition; noscript message visible; Retry after a failed load
  returns results (ja, en); Tab reaches every control in order, each focused
  control has a 3px outline and none is hidden; Enter in the search field lists
  results; Next by keyboard moves to "Items 51–100".
- Computed styles (1280px, light): results list, items, status, count and
  pagination have `box-shadow: none` and `border-radius: 0`; only the input and
  button have a 6px radius (operation boundaries, not content groups).
- Visible characters (whitespace removed, `innerText` of `main` / whole page):

| State | ja before | ja after | en before | en after |
| --- | --- | --- | --- | --- |
| Initial | 177 / 501 | 64 / 381 | 344 / 916 | 146 / 668 |
| Results ("Rigveda", 4 entries) | 787 / 1111 | 612 / 929 | 1040 / 1612 | 723 / 1245 |

  Result text is full text and unchanged. Counts do not differ between widths.

Q1–Q10 audit (exceptions are by target and reason):

| Rule | Result |
| --- | --- |
| Q1 short noun phrases | h1, h2, legend, labels, options, nav, summary all within ja 12 / en 4. Exceptions: service name "EWAia Abbreviation Search" (official name, also shown in ja); footer links ja 13–17 chars and en "Part of the VEDA AI project" (links, not names; "(英語)" and "(MIT)" tell the destination language or license). |
| Q2 lead | One sentence, ja 19 chars / en 7 words. |
| Q3 hints | One: "空欄で検索すると全件表示します。" on the search field. Kept because blank-search-lists-all is not discoverable and is not an error. |
| Q4 callouts | None at rest. Loading is title only; empty, error and noscript are one sentence each (the error and noscript bodies were cut from two sentences in this round); Retry is the recovery action. |
| Q5 nesting | Only the "Search in" fieldset has a frame; no frame inside a frame. |
| Q6 badges | None. Type is plain metadata. |
| Q7 duplicates | One total count; range ("Items 1–50") carries no total; jump link has no count. Exception: per-entry source line, because each entry's origin must stay visible. |
| Q8 buttons | Search, Previous, Next, Try again: 1–2 words / ja ≤ 3 chars. |
| Q9 shape/shadow | Content groups: radius 0, no shadow, no tinted surface. Exceptions: status tones (state color), input/button radius 6px (operation boundary, not a content group). |
| Q10 decoration | No decorative `strong`/`b`, no feature list, no section intro. |

## Shared display preferences (previous revision, af6d1dc)

Adopts [veda-ai-design-system PR #13](https://github.com/Yuzki/veda-ai-design-system/pull/13)
(request: [issue #12](https://github.com/Yuzki/veda-ai-design-system/issues/12))
at commit `af6d1dc9f565b9d9a561a6479fef11131c75e3e4`, vendored unmodified in
`assets/vendor/veda-design/0.1.0-pilot-af6d1dc/`
([SOURCE.md](../assets/vendor/veda-design/0.1.0-pilot-af6d1dc/SOURCE.md); the
seven files were compared with upstream and their SHA-256 digests match).

- Goal: a language or theme chosen at veda-ai.org applies at abbr.veda-ai.org,
  even when this origin holds a stale local value.
- Priority (each preference separately; invalid values fall through): URL
  `?lang=` / `?theme=` > explicit `data-veda-theme` (theme) > shared cookie
  `veda-lang` / `veda-theme` > legacy `localStorage` > `navigator.languages` /
  system > service default language. `<html lang="en">` is static fallback text,
  not a choice.
- Cookies: only on `veda-ai.org` and `*.veda-ai.org`, HTTPS writes only,
  `Domain=veda-ai.org; Path=/; Max-Age=31536000; SameSite=Lax; Secure`. Off
  those hosts (localhost, `github.io`, HTTP) choices stay in this origin's
  `localStorage`; there is no weaker-cookie fallback.
- Only explicit choices and valid URL values are saved (cookie and
  `localStorage` independently). Automatic resolution saves nothing and adds no
  URL parameter. `system` is stored as a value and overrides a shared dark.
- A change replaces only its own URL key; query, hash and `history.state` are
  kept. No live cross-tab synchronization.
- `index.html` loads `settings.js` then `theme.js` synchronously in `<head>`;
  `i18n.js` and `report.js` stay deferred. Do not duplicate this logic in
  `assets/script.js`.
- Verified: `node --test tests/*.test.cjs` (VM stubs for cookie jar, location,
  history, navigator, storage and fetch; see `tests/shared-preferences.test.cjs`).
  **Browser validation of this revision was not run** (see below): no real
  cookies, `Domain` handling, rendering or screenshots have been observed for it.
  The browser records further down are historical (the previous snapshot) and do
  not validate this revision.
- Rollback to `0.1.0-pilot-cad0076`: point the seven asset paths in `index.html`
  back, restore its script order (`theme.js` synchronous; `i18n.js`,
  `report.js` and `settings.js` deferred), and the old test expectations
  (`system` removes the saved key; `tests/shared-preferences.test.cjs` removed).
  Cookies already set stay in browsers; the older scripts ignore them.

## Purpose and pinned source (earlier pilot, historical)

- Contract: [veda-ai-design-system PR #6](https://github.com/Yuzki/veda-ai-design-system/pull/6)
  (request: [issue #5](https://github.com/Yuzki/veda-ai-design-system/issues/5)),
  plus [PR #7](https://github.com/Yuzki/veda-ai-design-system/pull/7), which
  groups language and theme into a collapsed "Display settings"
  `details.veda-settings`, and
  [issue #9](https://github.com/Yuzki/veda-ai-design-system/issues/9), which
  makes it a right-end popover (`settings.js`) and adds the results jump link
  and pagination styles. Pinned commit
  `9d65cf437a8ed34c70647f5dce19193bbb36e323`.
- Used by EWAia at that pilot stage (superseded by af6d1dc): `assets/vendor/veda-design/0.1.0-pilot-cad0076/`
  ([SOURCE.md](../assets/vendor/veda-design/0.1.0-pilot-cad0076/SOURCE.md);
  commit `cad0076`, shared design PR #11, adds only the parent-site styles
  over `0.1.0-pilot-9d65cf4`, which is kept for rollback).
  `components.css` differs from `0.1.0-pilot-e8154fd` and `settings.js` is new;
  the other five files are byte-identical (kept for rollback).
- The header's separate language and theme selects are now inside the shared
  collapsed settings component (new key `common.settings.label`). Behavior is
  unchanged: system / light / dark saving and restoring, language switching.
  `tests/theme.test.cjs` covers the contract.

## How to run it

```sh
python3 -m http.server 8000 --bind 127.0.0.1
# open http://127.0.0.1:8000/ ; old URL: http://127.0.0.1:8000/bib/web/search.html?q=abc
node --test
```

## Automated checks (Node, no browser)

`node --test`: 72 tests pass at the shared-preferences revision (56 earlier; search, layout, locales, report, theme,
pagination). `tests/pagination.test.cjs` runs `assets/script.js` against a
minimal fake DOM: 50 entries mounted for the empty search (932 total), all 19
pages traversed in data order, page reset on query/field change, page kept on
`veda:languagechange`, focus on the results heading only for page/jump actions
(not while typing), `RV` → 23 with no pager.
`tests/theme.test.cjs` runs the vendored `theme.js` named in `index.html` in a
VM stub and covers: start-up priority (valid attribute, saved value, invalid
attribute/saved value, `system`), API `set`/`get`, select change, `system`
removing the attribute and the `veda-theme` key, invalid `set` ignored, the
`veda:themechange` event (name, `detail.theme`, not fired at start-up),
several selects in sync, and each of storage get/set/remove throwing. Run
against the previous `theme.js`, the same table fails exactly the cases with an
invalid initial attribute (empty, unknown, `system`), including "system
attribute + saved dark".

It also checks that `index.html` has one `details.veda-settings[data-veda-settings]`
inside one `div.veda-header__tools` and holding both selects, that `settings.js`
is loaded, and that `theme.js` reveals the enclosing `details`.

The stub does not cover OS changes, CSS colors, rendering, or accessibility.

## Browser checks (historical: previous snapshot, not this revision)

**Partly performed.** Headless Firefox (via geckodriver's WebDriver API, local
scripts `.agents/wd_check.py` and `.agents/wd_narrow.py`, not committed) on
Linux, 2026-10-18. 320 and 390 px were measured in an iframe, because headless
windows cannot go narrower than about 488 px. Results:

- Settings popover (1280, 488, 390 and 320 px; en and ja): summary at the right
  end of the header, brand not clipped, opening it keeps the header height and
  does not push content, panel stays inside the viewport, Escape closes it and
  returns focus to the summary, an outside click closes it, no horizontal
  overflow.
- Search row stacks with a full-width button below 40rem; the "Go to results"
  link is shown.
- Empty search mounts 50 of 932; all 19 pages reachable (932 entries); page
  action and jump link move focus to the results heading; language and theme
  changes keep page 19 and the input; typing `RV` gives 23 results with no
  pager and the input keeps focus.

Everything marked "not run" below is still unconfirmed, as are Chromium,
screenshots, ja/en x dark comparison, 400 % zoom, forced colors, and
failure/retry in a browser. The automated checks do not stand in for them.

| Condition | Expected | Result | Evidence |
| --- | --- | --- | --- |
| Display settings component (new) | Header shows only a collapsed "Display settings / 表示設定" summary at the right end; it opens as an overlay by mouse and keyboard, holds language and theme selects, closes on Esc/outside click, stays closed when theme or language is changed through the API, and is hidden with JS off | open/close, Esc, outside click, layout: pass in Firefox headless (see above); keyboard Tab-out, JS off: not run | `.agents/wd_check.py` |
| OS light/dark x select system/light/dark | Body, inputs, select, buttons, links, results, status text readable; explicit choice beats OS; system follows an OS change at once and `get()` stays `system` | not run | - |
| Opposite-of-OS choice, reload | Choice and select restored; no wrong-color first paint (slow load or screen recording) | not run | - |
| Back to system, reload | Root attribute and `veda-theme` key gone; follows OS | not run | - |
| en/ja x 3 themes x 390 / 1280 px | Labels, options, focus, Japanese and transcribed text visible; query, targets, results kept while switching theme/language | not run | - |
| 320 px and 400 % zoom | Header tools wrap; no horizontal scroll or clipped options | not run | - |
| Keyboard only, forced colors | Tab/Shift+Tab and native select switch theme; focus visible; search state kept | not run | - |
| JS off / only i18n.js blocked | JS off: theme control hidden, text readable in OS colors; i18n blocked: static English labels, theme still switches | not run | - |
| Storage get/set/remove denied | No error; search and switching work; choice applies for this view only | not run | - |
| Initial, results, 0 results, no target, fetch failure then retry (light and dark) | Readable; empty search shows 932 entries; search behavior and order unchanged | not run | - |
| Root and sub-path serving; `bib/web/search.html` | No 404 for CSS/JS/locales/data; old URL keeps query/hash and the saved theme applies | not run | - |
| Event subscription | Select/API change delivers the right `detail.theme`; no event at start-up or on OS change | not run | - |
| Footer report link | `service` fixed English; `page` only origin + path | not run | - |

## Problems found

None in the automated checks. No visual problem could be observed. No
`assets/styles.css` change was made (none was reproduced as needed).

## Not confirmed

- Chromium-based browsers and Firefox: nothing run.
- Forced colors, 400 % zoom, narrow widths, first-paint flash, OS-change
  following: not run.
- Upstream terms of the shared assets: no license text at the pinned commit
  (see SOURCE.md); to be confirmed by the owner before publishing.

## Awaiting the maintainer

1. Run or review the browser table above.
2. Decide whether the contract is good enough to roll out. Merging PR #6 or
   this pilot is **not** that approval; roll-out to other services is a
   separate step after explicit permission.

## Rollback

To undo the issue #9 update only, point the asset paths in `index.html` back at
`0.1.0-pilot-e8154fd`, drop `settings.js` and the `veda-header__tools` wrapper,
and revert the pagination/jump markup, script and locale keys.

Point the six asset paths in `index.html` (and the snapshot path in
`tests/report.test.cjs` and `tests/theme.test.cjs`) back at
`0.1.0-pilot-0a4c491` (or `0.1.0-pilot-0b90d3c`, which has the header selects but the older theme script; revert the `index.html` header markup and the `common.settings` locale key too). Stored `veda-theme` values need no migration.
