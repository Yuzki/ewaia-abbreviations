# VEDA AI shared design assets (pilot snapshot)

These files are an unmodified copy of runtime assets from the VEDA AI shared
design system. They are vendored here so the search page works without any
CDN, private URL, submodule, or build step.

| Item | Value |
| --- | --- |
| Upstream repository | `Yuzki/veda-ai-design-system` (private at the time of copying) |
| Upstream version | 0.1.0, **unreleased**: no tag or release exists |
| Pinned commit | `a8b1e40dfa4666e0925f5fcc95abb0d9d7004bb1` (merge of upstream [PR #17](https://github.com/Yuzki/veda-ai-design-system/pull/17): icon display settings) |
| Designation | Pilot snapshot for the EWAia Abbreviation Search. Not an approved release. |
| Verified on | 2026-10-22 (every file compared with `gh api` contents at the pinned commit; SHA-256 identical) |
| Supersedes | `../0.1.0-pilot-d08f1bf/` (kept for rollback; older snapshots also kept) |

## Changes from the previous snapshot

`styles/components.css`, `scripts/i18n.js`, `scripts/settings.js` and
`scripts/theme.js` change (opt-in icon entries for language and theme);
`styles/tokens.css`, `styles/typography.css` and `scripts/report.js` are
checked against upstream at the new commit.

## Copied files

Copied byte for byte from the pinned commit.

| Path | SHA-256 |
| --- | --- |
| `styles/tokens.css` | `96117f3d1cbc4d50da99b433be7225dbec3820f745c52c3769f59d2659fede86` |
| `styles/typography.css` | `746846c45bd692f669ea5d84c06524c4e8a83cb887d1f0621acc245844e7ec50` |
| `styles/components.css` | `79c9449265da09a4039e95e8f3f143c281822b1d6adc4125cb3437e140fcca22` |
| `scripts/i18n.js` | `aee984c17d03d56c123ad94f2d59d90867f9714898697340be08596acddc394e` |
| `scripts/report.js` | `071b65faf7399893061699706585def21e86a477f182c39b7610e7c6dd49b982` |
| `scripts/settings.js` | `cf861ac785fcb00813cd42f5200692dc91a4c72e65f71560c1b430ee57e9cb27` |
| `scripts/theme.js` | `37fb7483a57ca74a60f2444c2dae2a1abe9ef5cdc13cc04c5a24248adb69419f` |
