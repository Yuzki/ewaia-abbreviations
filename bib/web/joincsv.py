"""Regenerate the search data without changing source values or row order."""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSV_FILES = (
    "bib/EWAia-I.csv",
    "bib/EWAia-I-New.csv",
    "bib/EWAia-II.csv",
    "bib/EWAia-III.csv",
)
FIELDS = ("abbreviation", "full", "type")
OUTPUT = ROOT / "bib/web/ewaia.json"


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
    data = {file: read_csv(ROOT / file) for file in CSV_FILES}
    with OUTPUT.open("w", encoding="utf-8") as destination:
        json.dump(data, destination, indent=4)
    print(f"JSONファイルが作成されました: {OUTPUT}")


if __name__ == "__main__":
    main()
