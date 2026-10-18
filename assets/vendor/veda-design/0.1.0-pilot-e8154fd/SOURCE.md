# VEDA AI shared design assets (pilot snapshot)

These files are an unmodified copy of runtime assets from the VEDA AI shared
design system. They are vendored here so the search page works without any
CDN, private URL, submodule, or build step.

| Item | Value |
| --- | --- |
| Upstream repository | `Yuzki/veda-ai-design-system` (private at the time of copying) |
| Upstream version | 0.1.0, **unreleased**: no tag or release exists |
| Pinned commit | `e8154fdfcabb617b0ca4c2585b7da6fe458b84e9` (merge of upstream [PR #7](https://github.com/Yuzki/veda-ai-design-system/pull/7), compact display settings; builds on [PR #6](https://github.com/Yuzki/veda-ai-design-system/pull/6) and [issue #5](https://github.com/Yuzki/veda-ai-design-system/issues/5)) |
| Designation | Pilot snapshot for the EWAia Abbreviation Search. Not an approved release. |
| Copied on | 2026-10-18 |
| Supersedes | `../0.1.0-pilot-0a4c491/` (kept for rollback; `../0.1.0-pilot-0b90d3c/` also kept) |

## Changes from the previous snapshot

Upstream PR #7 adds the compact display settings: `styles/components.css` gains
the `.veda-settings` classes, and `scripts/theme.js` and `scripts/i18n.js` each
also reveal the enclosing `[data-veda-settings]` `<details>` when they show a
control. `tokens.css`, `typography.css` and `report.js` are byte-identical to
`0.1.0-pilot-0a4c491` (checked with `cmp`). The theme contract is unchanged.

## Copied files

Copied byte for byte from the pinned commit (GitHub contents API, raw media type).

| Path | SHA-256 |
| --- | --- |
| `styles/tokens.css` | `96117f3d1cbc4d50da99b433be7225dbec3820f745c52c3769f59d2659fede86` |
| `styles/typography.css` | `746846c45bd692f669ea5d84c06524c4e8a83cb887d1f0621acc245844e7ec50` |
| `styles/components.css` | `7105748c60c1aab9ad4bef11892206ad4b900e0b6c664b25d8034d4f86d11c20` |
| `scripts/i18n.js` | `21b14301fd35499d5cc78a7f43d5b05f74b5bf46cc24591a0d2baf93a4321285` |
| `scripts/theme.js` | `339ef814bc466d82a33bbdf8814b7934cf64b1d2457a083923e95efe8bf0953f` |
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
  `0.1.0-pilot-0a4c491` (and the snapshot path in `tests/report.test.cjs` and
  `tests/theme.test.cjs`). Do not go back to `0.1.0-pilot-fbeb384`, which has
  no report link script. The `veda-theme` key and values are unchanged, so no
  stored choice needs migrating.
