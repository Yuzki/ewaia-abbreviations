# Data Sources and Provenance

## Original source and conversion

The source is the Abkürzungsverzeichnis of Manfred Mayrhofer, *Etymologisches Wörterbuch des Altindoarischen*, Heidelberg: Winter, 1992–2001, as recorded in SktTool's `bib/README.md`. After OCR, the list was formatted with ChatGPT (GPT-3.5) into CSV files of abbreviation, full title, and type. The original record's note that there are OCR typos and classification errors is retained. Bibliographic reference: [CiNii Research](https://cir.nii.ac.jp/crid/1971993809670356013). Bibliographic information is not evidence of permission to reuse.

| Source CSV / JSON key | Entries |
| --- | ---: |
| `bib/EWAia-I.csv` | 515 |
| `bib/EWAia-I-New.csv` | 142 |
| `bib/EWAia-II.csv` | 18 |
| `bib/EWAia-III.csv` | 257 |
| Total | 932 |

`bib/web/joincsv.py` reads the files in the order of the table and writes `bib/web/ewaia.json`. Each row of each array has 3 string columns: `abbreviation`, `full`, and `type`. The generation script preserves the original order, whitespace, spelling, and classification. Values such as `report`, `literature`, `übrige`, and ` reference` are also original values. The file names alone do not show which volume, edition, or pages of the original source each CSV corresponds to, nor what I-New specifically corresponds to.

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

The data is not treated as freely usable merely because it went through OCR and AI conversion or because the abbreviations are short. The code's MIT License is not applied to the data, and MIT, CC BY, CC0, or similar terms have not been assigned to data whose status is unverified. New publication and distribution of the data are on hold until the data terms are settled. The MIT terms of Bootstrap and Popper are maintained separately (see the root README).
