# EWAia: Abkürzungsverzeichnis

Mayrhofer, Manfred. 1992–2001. *Etymologisches Wörterbuch des Altindoarischen*. Heidelberg: Winter (Bearbeitet 1985–, in den Faszikeln erschienen 1986–).

This data comes from the list of abbreviations (German: *Abkürzungsverzeichnis*) in the original source. The list was OCR'd and then formatted with ChatGPT (GPT-3.5) into CSV files of abbreviation, full title, and type. The original instructions asked for the leading `=` and any mid-entry line breaks to be removed from the full title, and for entries to be classed as `language` (language names), `reference` (titles of works), `grammar` (grammatical terms), or `other` (everything else). The actual CSV files also contain values outside these 4 categories, and the generation script preserves the CSV values as they are.

- There are typos from OCR. The certain ones were corrected through a reversible log, [data/corrections/applied.csv](../corrections/applied.csv) (see [DATA_SOURCES.md](../../DATA_SOURCES.md)); spots that are probably wrong but not certain are listed in [data/corrections/review.csv](../corrections/review.csv). A generated, unreviewed list of the remaining suspected spots is in [docs/ocr-candidates.md](../../docs/ocr-candidates.md).
- The leading space of ` reference` and the German type label `übrige` (now `other`) were normalized. Other values outside the 4 categories (`literature`, `journal`, `book`, and so on) are kept, because they carry a distinction that `reference` would erase.
- There are incorrect type assignments from ChatGPT.
- The original text before conversion and an example prompt remain in this file's git history, as extracted.

The project's own code is licensed under the MIT License. The redistribution terms for the data are undecided, and publication and distribution of the data are on hold until the volume and pages of the original source, how it was obtained, its rights notice, and the permission to use it can be verified. For the mapping between the 4 CSV files and the generated JSON, and for the source history, see [DATA_SOURCES.md](../DATA_SOURCES.md). Do not infer the volume, edition, or page of the original source from the file names.
