# VEDA AI shared design assets (pilot snapshot)

These files are an unmodified copy of runtime assets from the VEDA AI shared
design system. They are vendored here so the search page works without any
CDN, private URL, submodule, or build step.

| Item | Value |
| --- | --- |
| Upstream repository | `Yuzki/veda-ai-design-system` (private at the time of copying) |
| Upstream version | 0.1.0, **unreleased**: no tag or release exists |
| Pinned commit | `d08f1bf748f5804fb376968f0378526727564ee4` (merge of upstream [PR #15](https://github.com/Yuzki/veda-ai-design-system/pull/15): quiet UI rules in the design spec) |
| Designation | Pilot snapshot for the EWAia Abbreviation Search. Not an approved release. |
| Verified on | 2026-10-20 (every file compared with `gh api` contents at the pinned commit; SHA-256 identical) |
| Supersedes | `../0.1.0-pilot-af6d1dc/` (kept for rollback; older snapshots also kept) |

## Changes from the previous snapshot

Only `styles/components.css` changes; the other six files are byte-identical
to `0.1.0-pilot-af6d1dc` (same SHA-256).

## Copied files

Copied byte for byte from the pinned commit.

| Path | SHA-256 |
| --- | --- |
| `styles/tokens.css` | `96117f3d1cbc4d50da99b433be7225dbec3820f745c52c3769f59d2659fede86` |
| `styles/typography.css` | `746846c45bd692f669ea5d84c06524c4e8a83cb887d1f0621acc245844e7ec50` |
| `styles/components.css` | `ac637b12eeb252eb6b0647d53d20ef987cc72824cd9b46d2f5c2ea1ccbe93a97` |
| `scripts/i18n.js` | `ec76b7eb940926d1d344efe5b9324c675fbf1b0d1cf977f5dfc57ae1953277d6` |
| `scripts/theme.js` | `c5fb1d7093b10f52c4b13250fde39cd56390035973d8f3f060353a931e962db9` |
| `scripts/report.js` | `071b65faf7399893061699706585def21e86a477f182c39b7610e7c6dd49b982` |
| `scripts/settings.js` | `9b971ed13b198bfc2f8f9f5fb42df59ac3d0d21dcec1c5c06a0f0366260569a7` |

Nothing else was copied: no upstream documentation, examples, reference
catalog, upstream locale dictionaries, history, or tests. This service's own
dictionaries live in `assets/locales/`.

To verify, run from this directory:

```sh
sha256sum styles/tokens.css styles/typography.css styles/components.css scripts/i18n.js scripts/theme.js scripts/report.js scripts/settings.js
```

## Update and rollback

- Update: copy the seven files from the new pinned commit into a new
  `0.1.0-pilot-<short-sha>/` directory with its own SOURCE.md, point
  `index.html` and the tests at it, and keep this directory.
- Rollback: point `index.html` and the tests back at `../0.1.0-pilot-af6d1dc/`
  (same script order and loading attributes).

## Terms

The upstream repository contained no license file or license notice at the
earlier pinned commits; the same was not re-verified here, so treat it as
unchanged. This repository's MIT License (`LICENSE`) covers this project's own
code only and is **not** applied to these files. Their terms must be confirmed
by the upstream owner before this pilot is published.

## Rules

- Do not edit these files. Service-specific styling belongs in
  `assets/styles.css`, which is loaded after them.
- Report problems in the shared assets upstream instead of patching the copy.
