# VEDA AI shared design assets (pilot snapshot)

These files are an unmodified copy of runtime assets from the VEDA AI shared
design system. They are vendored here so the search page works without any
CDN, private URL, submodule, or build step.

| Item | Value |
| --- | --- |
| Upstream repository | `Yuzki/veda-ai-design-system` (private at the time of copying) |
| Upstream version | 0.1.0, **unreleased**: no tag or release exists |
| Pinned commit | `9d65cf437a8ed34c70647f5dce19193bbb36e323` (upstream [issue #9](https://github.com/Yuzki/veda-ai-design-system/issues/9): right-end settings popover, results jump link, filters, pagination; builds on [PR #7](https://github.com/Yuzki/veda-ai-design-system/pull/7)) |
| Designation | Pilot snapshot for the EWAia Abbreviation Search. Not an approved release. |
| Copied on | 2026-10-18 |
| Supersedes | `../0.1.0-pilot-e8154fd/` (kept for rollback; older snapshots also kept) |

## Changes from the previous snapshot

`styles/components.css` gains `.veda-header__tools` (right-aligned header tools,
settings panel as an overlay popover), `.veda-search--responsive`,
`.veda-search-jump`, `.veda-filters*` and `.veda-pagination*`. `scripts/settings.js`
is new: Esc, outside click and tabbing out close the open settings popover, and
Esc returns focus to its summary. `tokens.css`, `typography.css`, `i18n.js`,
`theme.js` and `report.js` are byte-identical to `0.1.0-pilot-e8154fd`
(same SHA-256). The theme contract is unchanged.

## Copied files

Copied byte for byte from the pinned commit (`git show <commit>:<path>`).

| Path | SHA-256 |
| --- | --- |
| `styles/tokens.css` | `96117f3d1cbc4d50da99b433be7225dbec3820f745c52c3769f59d2659fede86` |
| `styles/typography.css` | `746846c45bd692f669ea5d84c06524c4e8a83cb887d1f0621acc245844e7ec50` |
| `styles/components.css` | `dbf87c5ca70c685466d689c9c3461f6f9cfc39c18b00303b913ef46578f32186` |
| `scripts/i18n.js` | `21b14301fd35499d5cc78a7f43d5b05f74b5bf46cc24591a0d2baf93a4321285` |
| `scripts/theme.js` | `339ef814bc466d82a33bbdf8814b7934cf64b1d2457a083923e95efe8bf0953f` |
| `scripts/report.js` | `071b65faf7399893061699706585def21e86a477f182c39b7610e7c6dd49b982` |
| `scripts/settings.js` | `0feb48c3c782e7964dfb5d35a600933c99d6e963089875c943ca8efe4b3c7ebd` |

Nothing else was copied: no upstream documentation, examples, reference
catalog, upstream locale dictionaries, history, or tests. This service's own
dictionaries live in `assets/locales/`.

To verify, run from this directory:

```sh
sha256sum styles/tokens.css styles/typography.css styles/components.css scripts/i18n.js scripts/theme.js scripts/report.js scripts/settings.js
```

## Terms

The upstream repository contained no license file or license notice at the
previous pinned commit; the same was not re-verified here, so treat it as
unchanged. This repository's MIT License (`LICENSE`) covers this project's own
code only and is **not** applied to these files. Their terms must be confirmed
by the upstream owner before this pilot is published.

## Rules

- Do not edit these files. Service-specific styling belongs in
  `assets/styles.css`, which is loaded after them.
- Report problems in the shared assets upstream instead of patching the copy.

## Update and rollback

- **Update:** copy the new pinned commit or tag into a new sibling directory,
  record its commit and digests in a new `SOURCE.md`, switch the paths in
  `index.html`, and repeat the checks in the root README. Keep the old
  directory until the new one is verified.
- **Rollback:** point the asset paths in `index.html` back at
  `0.1.0-pilot-e8154fd`, drop the `settings.js` script tag and the
  `.veda-header__tools` wrapper, and restore the snapshot path in
  `tests/report.test.cjs` and `tests/theme.test.cjs`. The `veda-theme` key and
  values are unchanged, so no stored choice needs migrating.
