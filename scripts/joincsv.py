"""Regenerate the search data without changing source values or row order."""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "data/source"
# JSON group keys keep their original names (the page shows them as the source label).
CSV_FILES = (
    "EWAia-I.csv",
    "EWAia-I-New.csv",
    "EWAia-II.csv",
    "EWAia-III.csv",
)
FIELDS = ("abbreviation", "full", "type")
OUTPUT = ROOT / "data/ewaia.json"
# Same bytes at the pre-restructure URL, for old links that fetch the JSON directly.
LEGACY_OUTPUT = ROOT / "bib/web/ewaia.json"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as source:
        reader = csv.DictReader(source)
        if reader.fieldnames != list(FIELDS):
            raise ValueError(f"{path}: expected headers {FIELDS}")
        rows = []
        for row in reader:
            if None in row or any(row[field] in (None, "") for field in FIELDS):
                raise ValueError(f"{path}:{reader.line_num}: missing or extra field")
            rows.append(row)
        return rows


def main() -> None:
    data = {f"bib/{file}": read_csv(SOURCE_DIR / file) for file in CSV_FILES}
    text = json.dumps(data, indent=4)
    for output in (OUTPUT, LEGACY_OUTPUT):
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open("w", encoding="utf-8") as destination:
            destination.write(text)
        print(f"JSONファイルが作成されました: {output}")


if __name__ == "__main__":
    main()
