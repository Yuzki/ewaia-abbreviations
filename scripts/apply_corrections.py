"""Apply, revert, or check the reviewed corrections in data/corrections/applied.csv.

The log is the source of truth for every change made to the source CSVs after
the OCR conversion. Each row records one field's value before and after, so any
correction can be reverted alone. Edits happen at the raw-field level: bytes
outside the changed fields (quoting style, line endings, a missing final
newline) stay exactly as they were. Standard library only.

After applying or reverting, regenerate the search data with
`uv run python scripts/joincsv.py`.
"""

import argparse
import csv
import sys
from dataclasses import dataclass
from io import StringIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "data/source"
DEFAULT_LOG = ROOT / "data/corrections/applied.csv"
CSV_FILES = (
    "EWAia-I.csv",
    "EWAia-I-New.csv",
    "EWAia-II.csv",
    "EWAia-III.csv",
)
FIELDS = ("abbreviation", "full", "type")
CATEGORIES = ("whitespace", "type-label", "confusable", "symbol", "spelling")
LOG_HEADER = ["id", "file", "line", "field", "before", "after", "category", "evidence"]


class CorrectionError(Exception):
    """The log or the data cannot be processed; nothing has been written."""


@dataclass(frozen=True)
class Correction:
    id: int
    file: str
    line: int
    field: str
    before: str
    after: str
    category: str
    evidence: str

    @property
    def where(self):
        return f"{self.file}:{self.line} {self.field}"


def load_log(path):
    """Read and validate the log; return corrections sorted as in the file."""
    with open(path, encoding="utf-8", newline="") as handle:
        records = list(csv.reader(handle))
    if not records or records[0] != LOG_HEADER:
        raise CorrectionError(f"{path}: expected header {','.join(LOG_HEADER)}")
    corrections = []
    ids = set()
    keys = set()
    for number, record in enumerate(records[1:], start=2):
        where = f"{path}:{number}"
        if len(record) != len(LOG_HEADER):
            raise CorrectionError(f"{where}: expected {len(LOG_HEADER)} columns")
        id_text, file, line_text, field, before, after, category, evidence = record
        try:
            row_id, line = int(id_text), int(line_text)
        except ValueError:
            raise CorrectionError(f"{where}: id and line must be integers") from None
        if file not in CSV_FILES:
            raise CorrectionError(f"{where}: unknown file {file!r}")
        if field not in FIELDS:
            raise CorrectionError(f"{where}: unknown field {field!r}")
        if category not in CATEGORIES:
            raise CorrectionError(f"{where}: unknown category {category!r}")
        if line < 2:
            raise CorrectionError(f"{where}: line {line} is not a data line")
        if before == after:
            raise CorrectionError(f"{where}: before equals after")
        if after == "":
            raise CorrectionError(f"{where}: empty after value")
        if row_id in ids:
            raise CorrectionError(f"{where}: duplicate id {row_id}")
        if (file, line, field) in keys:
            raise CorrectionError(f"{where}: duplicate key {file}:{line} {field}")
        ids.add(row_id)
        keys.add((file, line, field))
        corrections.append(
            Correction(row_id, file, line, field, before, after, category, evidence)
        )
    return corrections


def write_log(path, corrections):
    """Write the log sorted by file order, line, field; deterministic bytes."""
    ordered = sorted(
        corrections,
        key=lambda c: (CSV_FILES.index(c.file), c.line, FIELDS.index(c.field)),
    )
    with open(path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(LOG_HEADER)
        for c in ordered:
            writer.writerow(
                [
                    c.id,
                    c.file,
                    c.line,
                    c.field,
                    c.before,
                    c.after,
                    c.category,
                    c.evidence,
                ]
            )


def tokenize(line):
    """Split one physical line into (raw, value, regular) field tokens.

    A quoted token may be followed by stray characters up to the next comma
    (`"Aksl".`); csv.reader appends them to the value, and such a token is
    reported as irregular.
    """
    tokens = []
    pos = 0
    length = len(line)
    while True:
        start = pos
        if pos < length and line[pos] == '"':
            pos += 1
            chunks = []
            while True:
                end = line.find('"', pos)
                if end < 0:
                    raise CorrectionError("unterminated quoted field")
                chunks.append(line[pos:end])
                if line.startswith('""', end):
                    chunks.append('"')
                    pos = end + 2
                else:
                    pos = end + 1
                    break
            stray_end = line.find(",", pos)
            stray_end = length if stray_end < 0 else stray_end
            stray = line[pos:stray_end]
            tokens.append((line[start:stray_end], "".join(chunks) + stray, not stray))
            pos = stray_end
        else:
            end = line.find(",", pos)
            end = length if end < 0 else end
            tokens.append((line[start:end], line[start:end], True))
            pos = end
        if pos >= length:
            return tokens
        pos += 1  # the comma
        if pos == length:
            tokens.append(("", "", True))
            return tokens


def render(value, quoted):
    """Raw CSV text for a replacement value."""
    # Edge spaces need no quotes for csv.reader, and leaving them bare keeps a
    # revert byte-identical for the original `"x","y", reference` rows.
    if quoted or any(char in value for char in ',"\r\n'):
        return '"' + value.replace('"', '""') + '"'
    return value


def split_lines(text):
    """Return (lines, ends_with_newline); a final newline is not a line."""
    if "\r" in text:
        raise CorrectionError("file contains CR characters; only LF is supported")
    ends = text.endswith("\n")
    lines = text.split("\n")
    if ends:
        lines.pop()
    return lines, ends


def check_one_line_records(name, text, lines):
    records = list(csv.reader(StringIO(text, newline="")))
    if len(records) != len(lines):
        raise CorrectionError(f"{name}: every record must be one physical line")


def edit_lines(name, lines, edits):
    """Apply {line: {field index: (source, target, label)}} to the lines.

    A field equal to `source` becomes `target`; one already equal to `target`
    is skipped; anything else is an error. Returns (lines, applied, skipped).
    """
    new_lines = list(lines)
    applied = skipped = 0
    for line_number, fields in edits.items():
        if line_number < 2 or line_number > len(lines):
            raise CorrectionError(f"{name}:{line_number}: line does not exist")
        text = lines[line_number - 1]
        tokens = tokenize(text)
        decoded = next(csv.reader([text]))
        if decoded != [value for _, value, _ in tokens]:
            raise CorrectionError(f"{name}:{line_number}: cannot parse line reliably")
        changed = False
        for index, (source, target, label) in fields.items():
            if index >= len(tokens):
                raise CorrectionError(f"{label}: record has too few fields")
            raw, current, _ = tokens[index]
            if current == target:
                skipped += 1
            elif current == source:
                tokens[index] = (render(target, raw.startswith('"')), target, True)
                changed = True
                applied += 1
            else:
                raise CorrectionError(
                    f"{label}: current value {current!r} is neither"
                    f" {source!r} nor {target!r}"
                )
        if changed:
            new_lines[line_number - 1] = ",".join(raw for raw, _, _ in tokens)
    return new_lines, applied, skipped


def plan_edits(corrections, source_dir, revert):
    """Compute new file texts for all files; nothing is written here."""
    results = {}
    applied = skipped = 0
    for file in CSV_FILES:
        selected = [c for c in corrections if c.file == file]
        if not selected:
            continue
        path = Path(source_dir) / file
        with open(path, encoding="utf-8", newline="") as handle:
            text = handle.read()
        lines, ends = split_lines(text)
        check_one_line_records(file, text, lines)
        edits = {}
        for c in selected:
            source, target = (c.after, c.before) if revert else (c.before, c.after)
            edits.setdefault(c.line, {})[FIELDS.index(c.field)] = (
                source,
                target,
                c.where,
            )
        new_lines, file_applied, file_skipped = edit_lines(file, lines, edits)
        applied += file_applied
        skipped += file_skipped
        new_text = "\n".join(new_lines) + ("\n" if ends else "")
        if new_text != text:
            results[path] = new_text
    return results, applied, skipped


def select(corrections, ids):
    if not ids:
        return corrections
    known = {c.id for c in corrections}
    missing = sorted(set(ids) - known)
    if missing:
        raise CorrectionError(f"unknown id(s): {', '.join(map(str, missing))}")
    return [c for c in corrections if c.id in set(ids)]


def apply(corrections, source_dir, revert=False):
    """Apply (or revert) corrections in place; return (applied, skipped).

    All files are checked before any is written, so a mismatch changes nothing.
    """
    results, applied, skipped = plan_edits(corrections, source_dir, revert)
    for path, text in results.items():
        with open(path, "w", encoding="utf-8", newline="") as handle:
            handle.write(text)
    return applied, skipped


def check(corrections, source_dir):
    """Return a list of rows whose current value is not the corrected one."""
    pending = []
    for file in CSV_FILES:
        selected = [c for c in corrections if c.file == file]
        if not selected:
            continue
        with open(Path(source_dir) / file, encoding="utf-8", newline="") as handle:
            text = handle.read()
        check_one_line_records(file, text, split_lines(text)[0])
        rows = list(csv.reader(StringIO(text, newline="")))
        for c in selected:
            if c.line > len(rows):
                raise CorrectionError(f"{c.where}: line does not exist")
            record = rows[c.line - 1]
            index = FIELDS.index(c.field)
            if index >= len(record) or record[index] != c.after:
                pending.append(c)
    return pending


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--revert", action="store_true", help="restore before values")
    mode.add_argument("--check", action="store_true", help="verify, write nothing")
    parser.add_argument("--id", type=int, action="append", default=[], help="row id")
    parser.add_argument("--log", type=Path, default=DEFAULT_LOG)
    parser.add_argument("--source-dir", type=Path, default=SOURCE_DIR)
    args = parser.parse_args(argv)
    try:
        corrections = select(load_log(args.log), args.id)
        if args.check:
            pending = check(corrections, args.source_dir)
            for c in pending:
                print(f"not applied: id {c.id} {c.where}", file=sys.stderr)
            total = len(corrections)
            print(f"{total - len(pending)} of {total} corrections applied")
            return 1 if pending else 0
        applied, skipped = apply(corrections, args.source_dir, revert=args.revert)
    except CorrectionError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    verb = "reverted" if args.revert else "applied"
    print(f"{verb} {applied}, skipped {skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
