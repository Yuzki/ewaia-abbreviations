"""List suspicious spots (likely OCR errors) in the source CSV files.

Heuristic and read-only: it reports candidates for a human to review and never
modifies or corrects the data. Standard library only.
"""

import argparse
import csv
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass
from io import StringIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "data/source"
CSV_FILES = (
    "EWAia-I.csv",
    "EWAia-I-New.csv",
    "EWAia-II.csv",
    "EWAia-III.csv",
)
FIELDS = ("abbreviation", "full", "type")
DEFAULT_OUTPUT = ROOT / "docs/ocr-candidates.md"

# Tunable thresholds for the vocabulary check.
VOCAB_MIN_LEN = 5  # shortest token considered
VOCAB_LONG_LEN = 9  # from this length, edit distance 2 is allowed
VOCAB_MIN_COUNT = 3  # a token this frequent counts as "known good"
# The abbreviation/full check flags an acronym when fewer than this share of
# its capitals match a word initial of the full title.
ACRONYM_MATCH_SHARE = 0.5
# Values the documentation lists for the type column.
DOCUMENTED_TYPES = {"language", "reference", "grammar", "other"}

SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2}
# Fixed rule order for reports: (rule id, one-line description).
RULES = (
    ("empty-field", "Empty or missing field"),
    ("duplicate-abbreviation", "Same abbreviation more than once"),
    ("stray-symbol", "Symbol that rarely belongs in a title or abbreviation"),
    ("confusable-in-word", "Digit or look-alike letter inside a word"),
    ("odd-char", "Character outside the expected set"),
    ("diacritic-oddity", "Misplaced or doubled combining mark"),
    ("vocab-typo", "Rare word one or two edits from a frequent word"),
    ("abbr-full-mismatch", "Abbreviation not reflected in the full title"),
    ("whitespace", "Spacing irregularity"),
    ("duplicate-full", "Same full title under different abbreviations"),
    ("broken-ending", "Full title ends oddly or looks merged"),
    ("type-value", "Type outside the documented values"),
)

STRAY_CHARS = set("~^_|{}<>!?@#$%*\\`")
BRACKETS = {")": "(", "]": "["}
LETTER = r"[^\W\d_]"
# Non-ASCII punctuation and symbols that occur legitimately.
ALLOWED_EXTRA = set("°–—‘’“”„‚•·×§†‡′″…«»‹›")
ALLOWED_ASCII_PUNCT = set(" .,;:'\"()[]=-/&+")


@dataclass(frozen=True)
class Finding:
    file: str
    line: int
    field: str
    value: str
    rule: str
    severity: str
    reason: str


@dataclass(frozen=True)
class Row:
    file: str
    line: int
    values: tuple[str, str, str]  # missing columns are ""
    columns: int


def read_rows(path: Path) -> list[Row]:
    """Read one CSV read-only, keeping physical line numbers and blanks."""
    rows = []
    with path.open(encoding="utf-8", newline="") as source:
        reader = csv.reader(source)
        next(reader, None)  # header
        for record in reader:
            if not record:
                continue
            padded = (record + ["", "", ""])[:3]
            rows.append(Row(path.name, reader.line_num, tuple(padded), len(record)))
    return rows


def load_rows(source_dir: Path = SOURCE_DIR, files=CSV_FILES) -> list[Row]:
    rows = []
    for name in files:
        rows.extend(read_rows(source_dir / name))
    return rows


# --- text helpers -----------------------------------------------------------


def strip_diacritics(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(c for c in decomposed if not unicodedata.combining(c))


def normalize_key(text: str) -> str:
    """Casefold, strip diacritics, drop whitespace and punctuation."""
    stripped = strip_diacritics(text).casefold()
    return "".join(c for c in stripped if c.isalnum())


def codepoint(char: str) -> str:
    name = unicodedata.name(char, "unnamed")
    return f"U+{ord(char):04X} {name}"


def levenshtein(a: str, b: str, limit: int) -> int:
    """Edit distance, giving up (returning limit + 1) beyond `limit`."""
    if abs(len(a) - len(b)) > limit:
        return limit + 1
    previous = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        current = [i]
        for j, cb in enumerate(b, 1):
            current.append(
                min(
                    previous[j] + 1,
                    current[j - 1] + 1,
                    previous[j - 1] + (ca != cb),
                )
            )
        if min(current) > limit:
            return limit + 1
        previous = current
    return previous[-1]


def words(text: str) -> list[str]:
    return re.findall(LETTER + "+", text)


# --- per-value rules --------------------------------------------------------


def check_stray_symbol(text: str):
    for char in sorted({c for c in text if c in STRAY_CHARS}):
        severity = "medium" if char == "^" else "high"
        yield severity, f"stray symbol `{char}`"
    stack = []
    balanced = True
    for char in text:
        if char in "([":
            stack.append(char)
        elif char in BRACKETS:
            if not stack or stack.pop() != BRACKETS[char]:
                balanced = False
    if stack or not balanced:
        yield "high", "unbalanced brackets or parentheses"
    if re.search(LETTER + r"[)\]]" + LETTER, text):
        yield "high", "closing bracket glued inside a word"


CONFUSABLE_PATTERNS = (
    ("(?<=" + LETTER + r")\d(?=" + LETTER + ")", "digit between letters"),
    (r"(?<=[a-zà-ÿ])0\b", "digit 0 ending a word (o/ö?)"),
    (r"\bl[nrdgkmbpstvwzcfhj]", "lowercase l where capital I is expected?"),
    (r"(?<=[a-zà-ÿ])[IJ](?=\b|[a-zà-ÿ])", "capital I/J inside a lowercase word"),
    (r"\bN' ?\d", "N' before number (N°?)"),
    (r"\d(?:tf|ft)\b", "tf/ft after a number (ff?)"),
)


def check_confusable(text: str):
    for pattern, label in CONFUSABLE_PATTERNS:
        match = re.search(pattern, text)
        if match:
            start = max(0, match.start() - 8)
            context = text[start : match.end() + 8]
            yield "medium", f"{label} (…{context}…)"


def check_odd_char(text: str):
    seen = set()
    for char in text:
        if char in seen or char in ALLOWED_ASCII_PUNCT:
            continue
        category = unicodedata.category(char)
        name = unicodedata.name(char, "")
        odd = (
            char == "\ufffd"
            or (category[0] in "CZ")
            or (category[0] in "SP" and ord(char) >= 128 and char not in ALLOWED_EXTRA)
            or (category[0] == "L" and not name.startswith(("LATIN", "GREEK")))
            or (category[0] == "N" and ord(char) >= 128)
        )
        if odd:
            seen.add(char)
            yield "medium", f"unexpected character {codepoint(char)}"


def check_diacritic(text: str):
    previous = ""
    for char in text:
        if unicodedata.combining(char):
            if not previous or not (previous.isalpha() or unicodedata.combining(previous)):
                yield "medium", f"combining mark {codepoint(char)} not after a letter"
            elif previous == char:
                yield "medium", f"doubled combining mark {codepoint(char)}"
        previous = char


def check_whitespace(text: str, field: str):
    if text != text.strip(" "):
        yield "low", "leading or trailing space"
    if "  " in text.strip(" "):
        yield "low", "double space"
    if re.search(r" [.,]", text):
        yield "low", "space before . or ,"
    if field == "full" and re.search(LETTER + r"{2,}[.,][A-ZÄÖÜ0-9]", text):
        yield "low", "missing space after . or ,"


# --- per-row and corpus rules ----------------------------------------------


def check_empty(row: Row):
    if row.columns != 3:
        yield Finding(
            row.file, row.line, "row", ",".join(row.values), "empty-field",
            "high", f"row has {row.columns} columns instead of 3",
        )  # fmt: skip
    for field, value in zip(FIELDS, row.values):
        if not value.strip():
            yield Finding(
                row.file, row.line, field, value, "empty-field", "high",
                "field is empty",
            )  # fmt: skip


def check_type(row: Row):
    value = row.values[2]
    if not value.strip() or value in DOCUMENTED_TYPES:
        return
    if value.strip() in DOCUMENTED_TYPES:
        reason = "documented type padded with whitespace"
    elif value != value.strip():
        reason = "undocumented type, padded with whitespace"
    else:
        reason = "undocumented type"
    yield Finding(row.file, row.line, "type", value, "type-value", "low", reason)


def check_broken_ending(row: Row):
    full = row.values[1]
    text = full.rstrip()
    if not text:
        return
    reasons = []
    if not (text[-1] in ".])\"'”’" or text[-1].isdigit()):
        reasons.append("does not end with . ] ) digit or quote")
    if text.count("[") > text.count("]"):
        reasons.append("unclosed [")
    if re.search(r"\.\s+[A-Z][A-Za-z]{1,6}\.\s+[A-Z].*\d{4}", text):
        reasons.append("may merge two entries (second `Abbr.` plus year)")
    for reason in reasons:
        yield Finding(row.file, row.line, "full", full, "broken-ending", "low", reason)


def check_values(row: Row):
    for field, value in zip(FIELDS, row.values):
        if not value:
            continue
        reports = []
        for severity, reason in check_stray_symbol(value):
            reports.append(("stray-symbol", severity, reason))
        for severity, reason in check_confusable(value):
            reports.append(("confusable-in-word", severity, reason))
        for severity, reason in check_odd_char(value):
            reports.append(("odd-char", severity, reason))
        for severity, reason in check_diacritic(value):
            reports.append(("diacritic-oddity", severity, reason))
        for severity, reason in check_whitespace(value, field):
            reports.append(("whitespace", severity, reason))
        for rule, severity, reason in reports:
            yield Finding(row.file, row.line, field, value, rule, severity, reason)


def check_vocab(rows: list[Row]):
    counts = Counter()
    for row in rows:
        counts.update(
            w.casefold() for w in words(row.values[1]) if len(w) >= VOCAB_MIN_LEN
        )
    frequent = {w: n for w, n in counts.items() if n >= VOCAB_MIN_COUNT}
    by_letters = {w: Counter(w) for w in frequent}
    cache: dict[str, tuple[str, int] | None] = {}

    def nearest(token: str):
        if token in cache:
            return cache[token]
        limit = 2 if len(token) >= VOCAB_LONG_LEN else 1
        letters = Counter(token)
        best = None
        for known, known_letters in by_letters.items():
            if abs(len(known) - len(token)) > limit:
                continue
            spread = sum(((letters - known_letters) + (known_letters - letters)).values())
            if spread > 2 * limit:
                continue
            distance = levenshtein(token, known, limit)
            if distance > limit or strip_diacritics(known) == strip_diacritics(token):
                continue
            if best is None or (distance, -frequent[known]) < (
                best[1],
                -frequent[best[0]],
            ):
                best = (known, distance)
        cache[token] = best
        return best

    for row in rows:
        full = row.values[1]
        reported = set()
        for word in words(full):
            token = word.casefold()
            if len(word) < VOCAB_MIN_LEN or counts[token] != 1 or token in reported:
                continue
            match = nearest(token)
            if match:
                reported.add(token)
                known, distance = match
                yield Finding(
                    row.file, row.line, "full", full, "vocab-typo", "medium",
                    f"`{word}` (1x) is {distance} edit(s) from `{known}` ({frequent[known]}x)",
                )  # fmt: skip


def check_abbr_full(rows: list[Row]):
    for row in rows:
        abbreviation, full = row.values[0], row.values[1]
        if not abbreviation.strip() or not full.strip():
            continue
        if "," in abbreviation:
            name = abbreviation.split(",", 1)[0]
            surname = normalize_key(name)
            if len(surname) < 3 or surname in normalize_key(full):
                continue
            tokens = [normalize_key(w) for w in words(full)]
            if any(levenshtein(surname, t, 2) <= 2 for t in tokens if t):
                continue
            yield Finding(
                row.file, row.line, "abbreviation", abbreviation,
                "abbr-full-mismatch", "medium",
                f"name before the comma (`{name}`) not found in the full title",
            )  # fmt: skip
            continue
        letters_only = strip_diacritics(re.sub(r"[.\s\-]", "", abbreviation))
        capitals = [c for c in letters_only if c.isupper()]
        if len(capitals) < 3 or not letters_only.isalpha():
            continue
        initials = Counter(strip_diacritics(w)[0].upper() for w in words(full))
        matched = 0
        for capital in capitals:
            if initials[capital] > 0:
                initials[capital] -= 1
                matched += 1
        if matched < ACRONYM_MATCH_SHARE * len(capitals):
            yield Finding(
                row.file, row.line, "abbreviation", abbreviation,
                "abbr-full-mismatch", "low",
                f"only {matched} of {len(capitals)} capitals match word initials of the full title",
            )  # fmt: skip


def check_duplicates(rows: list[Row]):
    def group(key_of):
        groups = defaultdict(list)
        for row in rows:
            key = key_of(row)
            if key:
                groups[key].append(row)
        return groups

    def where(members):
        return ", ".join(f"{m.file}:{m.line}" for m in members)

    for members in group(lambda r: r.values[0]).values():
        if len(members) > 1:
            for member in members:
                others = [m for m in members if m is not member]
                yield Finding(
                    member.file, member.line, "abbreviation", member.values[0],
                    "duplicate-abbreviation", "high",
                    f"exact duplicate; also at {where(others)} "
                    "(cross-file repeats may be intentional: I-New supplements I)",
                )  # fmt: skip
    for members in group(lambda r: normalize_key(r.values[0])).values():
        if len({m.values[0] for m in members}) > 1:
            for member in members:
                others = [m for m in members if m.values[0] != member.values[0]]
                yield Finding(
                    member.file, member.line, "abbreviation", member.values[0],
                    "duplicate-abbreviation", "high",
                    "duplicate after normalizing case, diacritics and punctuation; "
                    f"also at {where(others)}",
                )  # fmt: skip
    for members in group(lambda r: r.values[1]).values():
        if len({m.values[0] for m in members}) > 1:
            for member in members:
                others = [m for m in members if m is not member]
                yield Finding(
                    member.file, member.line, "full", member.values[1],
                    "duplicate-full", "low",
                    f"same full title as {where(others)}",
                )  # fmt: skip


def find_candidates(rows: list[Row]) -> list[Finding]:
    findings = []
    for row in rows:
        findings.extend(check_empty(row))
        findings.extend(check_values(row))
        findings.extend(check_type(row))
        findings.extend(check_broken_ending(row))
    findings.extend(check_vocab(rows))
    findings.extend(check_abbr_full(rows))
    findings.extend(check_duplicates(rows))
    file_order = {name: i for i, name in enumerate(CSV_FILES)}
    rule_order = {rule: i for i, (rule, _) in enumerate(RULES)}
    findings.sort(
        key=lambda f: (
            file_order.get(f.file, len(file_order)), f.line, rule_order[f.rule],
            f.field, f.reason,
        )
    )  # fmt: skip
    return findings


# --- output -----------------------------------------------------------------


def show_value(value: str) -> str:
    """Make edge and repeated spaces visible."""
    value = re.sub(r"^ +| +$", lambda m: "␠" * len(m.group()), value)
    return re.sub(r" {2,}", lambda m: "␠" * len(m.group()), value)


def code_cell(text: str) -> str:
    text = text.replace("|", "\\|").replace("\n", " ")
    if "`" in text:
        return f"`` {text} ``"
    return f"`{text}`"


def plain_cell(text: str) -> str:
    return text.replace("|", "\\|").replace("\n", " ")


def render_markdown(findings: list[Finding]) -> str:
    counts = Counter(f.rule for f in findings)
    by_rule = defaultdict(list)
    for finding in findings:
        by_rule[finding.rule].append(finding)
    lines = [
        "# OCR error candidates",
        "",
        "Generated by `scripts/find_ocr_candidates.py`; do not edit by hand.",
        "",
        "- The list is **heuristic**: it marks spots that look suspicious, and "
        "**false positives are expected** (legitimate Sanskrit transliteration, "
        "German titles, and unusual abbreviations all trip some rules).",
        "- It is a list of candidates for review, **not corrections**. "
        "The data (`data/source/*.csv`, `data/ewaia.json`, `bib/web/ewaia.json`) "
        "is not modified.",
        "- Line numbers are physical line numbers in the CSV file "
        "(line 1 is the header). Edge and repeated spaces are shown as `␠`.",
        "- Regenerate with `python3 scripts/find_ocr_candidates.py`. "
        "The output has no timestamp, so regenerating unchanged data gives no diff.",
        "",
        "## Summary",
        "",
        "| Rule | Description | Count |",
        "| --- | --- | ---: |",
    ]
    for rule, description in RULES:
        lines.append(f"| [`{rule}`](#{rule}) | {description} | {counts[rule]} |")
    lines.append(f"| | **Total** | **{len(findings)}** |")
    for rule, description in RULES:
        members = by_rule[rule]
        severities = sorted({f.severity for f in members}, key=SEVERITY_ORDER.get)
        label = "/".join(severities) or "n/a"
        lines += [
            "",
            f"## {rule}",
            "",
            f"{description}. Severity: {label}. Hits: {len(members)}.",
            "",
        ]
        if not members:
            lines.append("No candidates.")
            continue
        lines += [
            "| File | Line | Field | Current value | Severity | Reason |",
            "| --- | ---: | --- | --- | --- | --- |",
        ]
        for f in members:
            lines.append(
                f"| {f.file} | {f.line} | {f.field} | {code_cell(show_value(f.value))} "
                f"| {f.severity} | {plain_cell(f.reason)} |"
            )
    return "\n".join(lines) + "\n"


def render_csv(findings: list[Finding]) -> str:
    buffer = StringIO()
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerow(("file", "line", "field", "value", "rule", "severity", "reason"))
    for f in findings:
        writer.writerow((f.file, f.line, f.field, f.value, f.rule, f.severity, f.reason))
    return buffer.getvalue()


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--format", choices=("md", "csv"), default="md")
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT),
        help="output path, or - for stdout (default: docs/ocr-candidates.md)",
    )
    args = parser.parse_args(argv)
    findings = find_candidates(load_rows())
    text = (render_markdown if args.format == "md" else render_csv)(findings)
    if args.output == "-":
        sys.stdout.write(text)
    else:
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(text, encoding="utf-8", newline="\n")
    counts = Counter(f.rule for f in findings)
    for rule, _ in RULES:
        print(f"{rule}: {counts[rule]}", file=sys.stderr)
    print(f"total: {len(findings)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
