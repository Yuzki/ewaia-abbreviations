# VEDA AI shared design assets (pilot snapshot)

These files are an unmodified copy of runtime assets from the VEDA AI shared
design system. They are vendored here so the search page works without any
CDN, private URL, submodule, or build step.

| Item | Value |
| --- | --- |
| Upstream repository | `Yuzki/veda-ai-design-system` (private at the time of copying) |
| Upstream version | 0.1.0, **unreleased**: no tag or release exists |
| Pinned commit | `0a4c4915f0189c6efdd1696bf3b4e4aab37c3c7e` (merge of upstream [PR #6](https://github.com/Yuzki/veda-ai-design-system/pull/6), theme switch contract; request: [issue #5](https://github.com/Yuzki/veda-ai-design-system/issues/5)) |
| Designation | Pilot snapshot for the EWAia Abbreviation Search. Not an approved release. |
| Copied on | 2026-10-18 |
| Supersedes | `../0.1.0-pilot-0b90d3c/` (kept for rollback) |

## Changes from the previous snapshot

The only difference is `scripts/theme.js` (upstream PR #6): an invalid initial
`data-veda-theme` attribute (empty, unknown, or `system`) is now replaced by the
saved choice or `system`, so `VedaTheme.get()`, the select, and the colors
agree. The five other files are byte-identical to `0.1.0-pilot-0b90d3c`
(checked with `cmp`).

## Copied files

Copied byte for byte from the pinned commit (GitHub contents API, raw media type).

| Path | SHA-256 |
| --- | --- |
| `styles/tokens.css` | `96117f3d1cbc4d50da99b433be7225dbec3820f745c52c3769f59d2659fede86` |
| `styles/typography.css` | `746846c45bd692f669ea5d84c06524c4e8a83cb887d1f0621acc245844e7ec50` |
| `styles/components.css` | `458981db57c9c12a8804b1b7fb9fbaca52ee4eb17d18c0c30cd76cd2f9c2dbc0` |
| `scripts/i18n.js` | `7a463f9787edd43794eb3b735d3e4ae3c4698a3dcf1fbfec5a26d123c6f02c8b` |
| `scripts/theme.js` | `3a839a388f50a2cfe31c2a224b5d27de4d91a61c7770e516d88c8627b826d1c9` |
| `scripts/report.js` | `071b65faf7399893061699706585def21e86a477f182c39b7610e7c6dd49b982` |

Nothing else was copied: no upstream documentation, examples, reference
catalog, upstream locale dictionaries, history, or tests. This service's own
dictionaries live in `assets/locales/`.

To verify, run from this directory:

```sh
sha256sum styles/tokens.css styles/typography.css styles/components.css scripts/i18n.js scripts/theme.js scripts/report.js
```

## Terms

The upstream repository contained no license file or license notice at the
pinned commit (no LICENSE/COPYING/NOTICE path in the tree; the README has no
license text). This repository's MIT License (`LICENSE`) covers this
project's own code only and is **not** applied to these files. Their terms
must be confirmed by the upstream owner before this pilot is published.

## Rules

- Do not edit these files. Service-specific styling belongs in
  `assets/styles.css`, which is loaded after them.
- Report problems in the shared assets upstream instead of patching the copy.

## Update and rollback

- **Update:** copy the new pinned commit or tag into a new sibling directory
  (for example `assets/vendor/veda-design/0.1.1/`), record its commit and digests in
  a new `SOURCE.md`, switch the paths in `index.html`, and repeat the
  checks in the root README. Keep the old directory until the new one is
  verified.
- **Rollback:** point the six asset paths in `index.html` back at
  `0.1.0-pilot-0b90d3c` (and the snapshot path in `tests/report.test.cjs` and
  `tests/theme.test.cjs`). Do not go back to `0.1.0-pilot-fbeb384`, which has
  no report link script. The `veda-theme` key and values are unchanged, so no
  stored choice needs migrating.
