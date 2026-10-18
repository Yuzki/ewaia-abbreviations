# VEDA AI shared design assets (pilot snapshot)

These files are an unmodified copy of runtime assets from the VEDA AI shared
design system. They are vendored here so the search page works without any
CDN, private URL, submodule, or build step.

| Item | Value |
| --- | --- |
| Upstream repository | `Yuzki/veda-ai-design-system` (private at the time of copying) |
| Upstream version | 0.1.0, **unreleased**: no tag or release exists |
| Pinned commit | `0b90d3c2a06d58212f4fa14965cec31b8ea99dde` (`main`, includes upstream PR #4) |
| Designation | Pilot snapshot for the EWAia Abbreviation Search. Not an approved release. |
| Copied on | 2026-10-18 |
| Supersedes | `../0.1.0-pilot-fbeb384/` (kept for rollback) |

## Changes from the previous snapshot

The only difference is the added `scripts/report.js` (footer "Report a
problem" link, upstream PR #4). The five other files are byte-identical to
`0.1.0-pilot-fbeb384`; there is no CSS change.

## Copied files

Copied byte for byte with `git show <commit>:<path>`.

| Path | SHA-256 |
| --- | --- |
| `styles/tokens.css` | `96117f3d1cbc4d50da99b433be7225dbec3820f745c52c3769f59d2659fede86` |
| `styles/typography.css` | `746846c45bd692f669ea5d84c06524c4e8a83cb887d1f0621acc245844e7ec50` |
| `styles/components.css` | `458981db57c9c12a8804b1b7fb9fbaca52ee4eb17d18c0c30cd76cd2f9c2dbc0` |
| `scripts/i18n.js` | `7a463f9787edd43794eb3b735d3e4ae3c4698a3dcf1fbfec5a26d123c6f02c8b` |
| `scripts/theme.js` | `ae6b2d82697ae37f6ad0233263cfbaf3ef00d4e9103041cabca163718c245cb5` |
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
pinned commit. This repository's MIT License (`LICENSE`) covers this
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
- **Rollback:** point `index.html` back at the previous directory
  (`0.1.0-pilot-fbeb384`), which lacks the report link script, or revert the
  pilot commits to restore the pre-pilot page.
