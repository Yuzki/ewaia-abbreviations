# Data Sources and Provenance

## Original source and conversion

The source is the Abkürzungsverzeichnis of Manfred Mayrhofer, *Etymologisches Wörterbuch des Altindoarischen*, Heidelberg: Winter, 1992–2001, as recorded in SktTool's `bib/README.md`. After OCR, the list was formatted with ChatGPT (GPT-3.5) into CSV files of abbreviation, full title, and type. The original record's note that there are OCR typos and classification errors is retained. Bibliographic reference: [CiNii Research](https://cir.nii.ac.jp/crid/1971993809670356013). Bibliographic information is not evidence of permission to reuse.

| JSON key | Source CSV | Entries |
| --- | --- | ---: |
| `bib/EWAia-I.csv` | `data/source/EWAia-I.csv` | 515 |
| `bib/EWAia-I-New.csv` | `data/source/EWAia-I-New.csv` | 142 |
| `bib/EWAia-II.csv` | `data/source/EWAia-II.csv` | 18 |
| `bib/EWAia-III.csv` | `data/source/EWAia-III.csv` | 257 |
| Total | | 932 |

The JSON keys keep the CSV paths from before the directory restructure (they are labels, not file locations), so the data file is unchanged byte for byte.

`scripts/joincsv.py` reads the files in the order of the table and writes `data/ewaia.json` (plus an identical copy at the legacy URL `bib/web/ewaia.json`). Each row of each array has 3 string columns: `abbreviation`, `full`, and `type`. The generation script does not change values: it preserves the order, whitespace, spelling, and classification of the CSV files as they are. Those CSV files now contain the logged corrections described below; the pre-correction values are recorded in the log and in git history. Type values such as `report`, `literature`, and `journal` are original values that were deliberately kept. The file names alone do not show which volume, edition, or pages of the original source each CSV corresponds to, nor what I-New specifically corresponds to.

## Corrections

The CSV files were corrected for OCR errors (issue #7) in a way that can be reviewed and reverted. Values change only through `data/corrections/applied.csv` and `scripts/apply_corrections.py`; the CSV files are not edited by hand. Rows are never added, deleted, reordered, merged, or split, so the physical line numbers and the total of 932 entries are unchanged, and bytes outside the changed fields (quoting style, line endings, the missing final newline of `EWAia-III.csv`) stay as they were.

**Log.** `data/corrections/applied.csv` has one row per corrected field: `id` (stable, never reused), `file`, physical `line` (header = 1), `field`, the whole `before` and `after` values, a `category`, and short `evidence`. Categories and number of rows (183 in total):

| Category | Rows | What it covers |
| --- | ---: | --- |
| `whitespace` | 15 | space before `.`/`,`, space inside parentheses, double or trailing spaces, split ordinals (`11 th`) |
| `type-label` | 19 | ` reference` → `reference` (16) and `übrige` → `other` (3) |
| `confusable` | 41 | look-alike characters inside a word (`lndo-` → `Indo-`, `Troms0` → `Tromsø`, `W1SSenschaften` → `Wissenschaften`, `1966tf.` → `1966ff.`) |
| `symbol` | 72 | junk symbols where the intended text is certain, and mismatched brackets (`[ … )` → `[ … ]`) |
| `spelling` | 36 | well-attested names and titles (`Bertin` → `Berlin`, `Matcriali` → `Materiali`), line-break hyphens in known words (`Bom-bay` → `Bombay`), and garbled Sanskrit titles whose reading is unambiguous (`Brähmlll)a` → `Brāhmaṇa`) |

A field with several fixes is one row, and the `category` is the most substantive one (spelling, then symbol, confusable, whitespace, type-label). The `evidence` says why the new value is right, for example a correct spelling of the same name elsewhere in the data.

**Policy.** A value is corrected only when the intended text is mechanically certain or there is strong evidence for it: a well-known place, person, or title, or the same name spelled correctly elsewhere in the data. A correction changes a field only when it was flagged in [docs/ocr-candidates.md](docs/ocr-candidates.md). Where a Sanskrit or Avestan word was restored, a spelling already used in the data is preferred, otherwise standard IAST. For example, vocalic r is written as `r` + U+0329 (`Br̩haspati`), so `R̩gveda` uses `R` + U+0329, not the precomposed `Ṛ`.

**Not corrected.** German, Latin, French, Italian, and transliterated Russian spellings that may be correct or old orthography (missing French accents, `Grundriss`, `Worterbuch`); abbreviation conventions and distinct entries that look like duplicates (`PW`/`pw`, `AV`/`Av.`); possibly merged or duplicate entries, because fixing them would need row changes; intentional symbols (`[- Anm.]`, `=`, `°`, `*`, `√`, `~` in reconstructions); the systematic `ä` for `ā`, which is mixed with legitimate German `ä`; and anything that needs a guess between two plausible readings. The type labels `literature`, `journal`, `book`, `text`, `report`, `research`, `science`, and `manuscript` stay as they are, because they distinguish primary texts from journals and books, which `reference` would erase. The malformed raw field `"Aksl".` also stays (its parsed value is correct).

**Open items.** `data/corrections/review.csv` lists spots that are probably wrong but not certain, with a suggested reading where there is one and a reason, plus systemic items with an empty `line`. It is not exhaustive: the regenerated `docs/ocr-candidates.md` remains the full list of unreviewed candidates (420 after the corrections, from 713).

**Apply, revert, check.** `python3 scripts/apply_corrections.py` applies the log (idempotent), `--revert` restores the `before` values, `--check` verifies that every `after` value is in place, and `--id N` (repeatable) limits any of these to chosen rows, so a single correction can be reverted alone. A mismatch between the log and the CSV is an error and nothing is written. After applying or reverting, run `uv run python scripts/joincsv.py` to regenerate the JSON files.

## Supporting history

These are the original commit IDs in [SktTool](https://github.com/Yuzki/SktTool). The split kept only the relevant paths, so the SHAs in the new history differ. The mapping table and the history needed for recovery are kept in local working handoff files.

| Original commit | Content |
| --- | --- |
| [c6caf1f](https://github.com/Yuzki/SktTool/commit/c6caf1f) | CSV files and source notes (2023-10-21) |
| [fcd7b48](https://github.com/Yuzki/SktTool/commit/fcd7b48) | Fixes (2023-10-23) |
| [917e766](https://github.com/Yuzki/SktTool/commit/917e766) | JSON generation script and generated output (2023-10-23) |
| [ac8ef75](https://github.com/Yuzki/SktTool/commit/ac8ef75) | Web search (2023-10-23) |
| [ea074cc](https://github.com/Yuzki/SktTool/commit/ea074cc) | Added GPL v3 LICENSE (2024-07-05) |
| [af1da5b](https://github.com/Yuzki/SktTool/commit/af1da5b) | Changed the data fetch URL (2024-07-15) |
| [be5b132](https://github.com/Yuzki/SktTool/commit/be5b132), [34ee6f1](https://github.com/Yuzki/SktTool/commit/34ee6f1) | Changes to the search HTML (2025-05-21) |

The git authors of the relevant code and CSV files appear under the names Yuzki and Yuzuki Tsukagoshi. The user has confirmed that all contributions to the relevant code were made by Yuzuki Tsukagoshi personally and that it contains no code from external sources. The independent project's own code is licensed under the MIT License ([LICENSE](LICENSE)). The history also retains the GPL text, documents, and rights notices of the time. The current choice of code license does not change or revoke any earlier GPL distribution. Even where documents mention other features, the code and data outside this project's scope are not included in the split history.

## Rights status

The old repository contained the text of GPL v3. It is retained in the history as evidence of the rights notice at that time. On the user's confirmation, the independent project's own code is licensed under MIT, as stated in the current [LICENSE](LICENSE). This does not change or revoke any earlier GPL distribution.

The following remain unverified:

- The volume, edition, and pages of the original source that each CSV corresponds to, how the OCR source was obtained, and the terms of use of the scans.
- The rights notice of the original source, its current rights holder, the redistribution permission, and the data terms that apply.
- The redistribution permission and applicable terms for the data contained in each CSV.

The data is not treated as freely usable merely because it went through OCR and AI conversion or because the abbreviations are short. The code's MIT License is not applied to the data, and MIT, CC BY, CC0, or similar terms have not been assigned to data whose status is unverified. New publication and distribution of the data are on hold until the data terms are settled. The terms of third-party and vendored page assets are described separately in the root README.
