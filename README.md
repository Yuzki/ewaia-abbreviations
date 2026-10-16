# EWAia Abbreviation Search

A static site for searching the abbreviations and full titles in Manfred Mayrhofer's *Etymologisches Wörterbuch des Altindoarischen* (EWAia). It does a case-insensitive substring search over both abbreviations and full titles, and shows the abbreviation, full title, and type in their original order.

The related code, CSV files, and source notes were split out of [SktTool](https://github.com/Yuzki/SktTool) together with their commit history. For the background and scope of the split, see [SktTool issue #4](https://github.com/Yuzki/SktTool/issues/4). This project does not include EWAia full-text search, the Register, JAIBS abbreviations, or any other Sanskrit tools.

## Running locally

Run this from the repository root. Python 3 and uv are required.

```sh
uv run python -m http.server 8000 --bind 127.0.0.1
```

Open <http://127.0.0.1:8000/> and it redirects to `bib/web/search.html`. The page fetches its JSON from `bib/web/ewaia.json` on the same site and does not depend on SktTool's data hosting. Because all URLs are relative, the site also works under a subpath such as GitHub Pages. Publishing setup is not part of the work in this repository.

Search runs as you type. Changes to the checkboxes take effect on the next input. An empty query returns every entry in the selected categories, and with both checkboxes off the result is 0 entries. The existing Search button has no handler. This behavior and the existing page were kept as they were when the project was split out.

## Regenerating the data

```sh
uv run python bib/web/joincsv.py
```

Using only the Python standard library, the script generates 932 entries from the 4 CSV files. It can also be run from another working directory by giving the absolute path to the script. It preserves the JSON keys, row order, strings, and types, and reports missing required headers or values as errors. It does not strip whitespace, remove duplicates, normalize Unicode, or correct OCR errors.

For the original sources, the mapping of CSV files, the conversion history, and unresolved rights questions, see [DATA_SOURCES.md](DATA_SOURCES.md). For the source notes, see [bib/README.md](bib/README.md). The data went through OCR and conversion by ChatGPT (GPT-3.5), so it contains typos and incorrect type assignments.

## Dependencies and terms

The page loads Bootstrap 5.0.2 (CSS/JS) and Popper 2.9.2 (JS) from a CDN, using the existing SRI hashes. These are MIT-licensed ([Bootstrap](https://github.com/twbs/bootstrap/blob/v5.0.2/LICENSE), [Popper](https://github.com/floating-ui/floating-ui/blob/v2.9.2/LICENSE.md)). Third-party copyright and license terms remain in force. Using the CDN requires a network connection.

This project's own code is licensed under the MIT License ([LICENSE](LICENSE), copyright holder Yuzuki Tsukagoshi). This choice was made on the user's confirmation, and it does not change or revoke any earlier GPL distribution in SktTool. The redistribution terms for the abbreviation data are undecided. Publication and distribution of the data are on hold until the rights notice, redistribution permission, and data terms of the original source can be verified. The code's MIT terms are not applied to the data, and no MIT or CC terms have been assigned to the data by inference.

Redirect or relocation notices on the SktTool side are separate work. UI unification, translation, new features, and OCR corrections are also outside the scope of this split.
