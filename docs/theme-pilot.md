# Color theme pilot record

Record for the maintainer's decision on the shared system / light / dark
contract. It documents the EWAia trial only. It is **not** permission to apply
the contract to other services; that needs the maintainer's explicit approval
and a separate change.

## Purpose and pinned source

- Contract: [veda-ai-design-system PR #6](https://github.com/Yuzki/veda-ai-design-system/pull/6)
  (request: [issue #5](https://github.com/Yuzki/veda-ai-design-system/issues/5)),
  merge commit `0a4c4915f0189c6efdd1696bf3b4e4aab37c3c7e`.
- Used by EWAia: `assets/vendor/veda-design/0.1.0-pilot-0a4c491/`
  ([SOURCE.md](../assets/vendor/veda-design/0.1.0-pilot-0a4c491/SOURCE.md)).
  Only `scripts/theme.js` differs from the previous snapshot
  (`0.1.0-pilot-0b90d3c`, kept for rollback).
- The page already had the labelled theme `select`; this trial replaces the
  script with the contracted version and adds `tests/theme.test.cjs`.

## How to run it

```sh
python3 -m http.server 8000 --bind 127.0.0.1
# open http://127.0.0.1:8000/ ; old URL: http://127.0.0.1:8000/bib/web/search.html?q=abc
node --test
```

## Automated checks (Node, no browser)

`node --test`: 50 tests pass (search, layout, locales, report, theme).
`tests/theme.test.cjs` runs the vendored `theme.js` named in `index.html` in a
VM stub and covers: start-up priority (valid attribute, saved value, invalid
attribute/saved value, `system`), API `set`/`get`, select change, `system`
removing the attribute and the `veda-theme` key, invalid `set` ignored, the
`veda:themechange` event (name, `detail.theme`, not fired at start-up),
several selects in sync, and each of storage get/set/remove throwing. Run
against the previous `theme.js`, the same table fails exactly the cases with an
invalid initial attribute (empty, unknown, `system`), including "system
attribute + saved dark".

The stub does not cover OS changes, CSS colors, rendering, or accessibility.

## Browser checks

**Not performed.** No browser (Chromium-based or Firefox) was available to the
implementing agent, so every row below is unconfirmed. Nothing here counts as
passed, and the automated checks do not stand in for them. Fill in browser,
OS, date, result, and evidence (screenshots under `.agents/` or elsewhere
local) when someone runs them.

| Condition | Expected | Result | Evidence |
| --- | --- | --- | --- |
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

Point the six asset paths in `index.html` (and the snapshot path in
`tests/report.test.cjs` and `tests/theme.test.cjs`) back at
`0.1.0-pilot-0b90d3c`. Stored `veda-theme` values need no migration.
