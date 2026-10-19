# VEDA AI shared design assets (pilot snapshot)

These files are an unmodified copy of runtime assets from the VEDA AI shared
design system. They are vendored here so the search page works without any
CDN, private URL, submodule, or build step.

| Item | Value |
| --- | --- |
| Upstream repository | `Yuzki/veda-ai-design-system` (private at the time of copying) |
| Upstream version | 0.1.0, **unreleased**: no tag or release exists |
| Pinned commit | `af6d1dc9f565b9d9a561a6479fef11131c75e3e4` (merge of upstream [PR #13](https://github.com/Yuzki/veda-ai-design-system/pull/13), [issue #12](https://github.com/Yuzki/veda-ai-design-system/issues/12): shared language/theme preferences across veda-ai.org subdomains) |
| Designation | Pilot snapshot for the EWAia Abbreviation Search. Not an approved release. |
| Verified on | 2026-10-19 (every file compared with `gh api` contents at the pinned commit; SHA-256 identical) |
| Supersedes | `../0.1.0-pilot-cad0076/` (kept for rollback; older snapshots also kept) |

## Changes from the previous snapshot

`scripts/settings.js`, `scripts/theme.js` and `scripts/i18n.js` change; the
other four files are byte-identical to `0.1.0-pilot-cad0076` (same SHA-256).

- Language and theme resolve independently: `?lang=` / `?theme=` > explicit
  initial value > shared cookie (`veda-lang`, `veda-theme`) > legacy
  localStorage > browser languages / system > service default.
- Cookies are used only on `veda-ai.org` and its subdomains, written only over
  HTTPS (`Domain=veda-ai.org; Path=/; Max-Age=31536000; SameSite=Lax; Secure`).
- `system` is now stored as an explicit theme value.
- Explicit changes update only their own URL parameter.
- `settings.js` must load in `<head>` without `defer`, **before** `theme.js`.

## Copied files

Copied byte for byte from the pinned commit.

| Path | SHA-256 |
| --- | --- |
| `styles/tokens.css` | `96117f3d1cbc4d50da99b433be7225dbec3820f745c52c3769f59d2659fede86` |
| `styles/typography.css` | `746846c45bd692f669ea5d84c06524c4e8a83cb887d1f0621acc245844e7ec50` |
| `styles/components.css` | `fb3addbeb2a68104fab4e59ca5862cbf7998951e3b4850a77a042fbcc3a92000` |
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
- Rollback: point `index.html` back at `../0.1.0-pilot-cad0076/`, restore its
  script order (`theme.js` synchronous; `i18n.js`, `report.js`, `settings.js`
  deferred) and the old test expectations. Shared cookies already set remain in
  browsers; the older scripts ignore them.

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
