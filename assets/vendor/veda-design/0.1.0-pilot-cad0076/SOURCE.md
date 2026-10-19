# VEDA AI shared design assets (pilot snapshot)

These files are an unmodified copy of runtime assets from the VEDA AI shared
design system. They are vendored here so the search page works without any
CDN, private URL, submodule, or build step.

| Item | Value |
| --- | --- |
| Upstream repository | `Yuzki/veda-ai-design-system` (private at the time of copying) |
| Upstream version | 0.1.0, **unreleased**: no tag or release exists |
| Pinned commit | `cad007687665115f8c0d8c4d19b92d4757d0d69d` (merge of upstream [PR #11](https://github.com/Yuzki/veda-ai-design-system/pull/11), [issue #10](https://github.com/Yuzki/veda-ai-design-system/issues/10): parent-site navigation, footer `.veda-project-reference`) |
| Designation | Pilot snapshot for the EWAia Abbreviation Search. Not an approved release. |
| Copied on | 2026-10-19 |
| Supersedes | `../0.1.0-pilot-9d65cf4/` (kept for rollback; older snapshots also kept) |

## Changes from the previous snapshot

`styles/components.css` gains the parent-site navigation styles
(`.veda-parent-link`, `.veda-project-reference`). The other six files are
byte-identical to `0.1.0-pilot-9d65cf4` (same SHA-256). The theme contract is
unchanged. This service uses only the footer `.veda-project-reference` with the
dictionary key `common.project.partOf` (its own wording is in `assets/locales/`).

## Copied files

Copied byte for byte from the pinned commit (`git show <commit>:<path>`).

| Path | SHA-256 |
| --- | --- |
| `styles/tokens.css` | `96117f3d1cbc4d50da99b433be7225dbec3820f745c52c3769f59d2659fede86` |
| `styles/typography.css` | `746846c45bd692f669ea5d84c06524c4e8a83cb887d1f0621acc245844e7ec50` |
| `styles/components.css` | `fb3addbeb2a68104fab4e59ca5862cbf7998951e3b4850a77a042fbcc3a92000` |
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
earlier pinned commits; the same was not re-verified here, so treat it as
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
  `0.1.0-pilot-9d65cf4`, remove the footer `.veda-project-reference` paragraph
  (and the `common.project.partOf` key), and restore the snapshot path in
  `tests/report.test.cjs` and `tests/theme.test.cjs`. The `veda-theme` key and
  values are unchanged, so no stored choice needs migrating.
