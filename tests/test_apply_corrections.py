import contextlib
import csv
import io
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import apply_corrections as ac

FIXTURES = {
    "EWAia-I.csv": (
        "abbreviation,full,type\n"
        '"A.","Anmerkung .",other\n'
        '"B","Bertin, Germany","reference"\n'
        '"C",plain,reference\n'
    ),
    "EWAia-I-New.csv": (
        "abbreviation,full,type\n"
        '"Aksl".,"Altkirchenslavisch",other\n'
        '"D","Say ""hi""", reference\n'
    ),
    "EWAia-II.csv": 'abbreviation,full,type\n"E","E full","grammar"\n',
    # no final newline
    "EWAia-III.csv": 'abbreviation,full,type\n"F","F full","übrige"',
}


def corr(row_id, file, line, field, before, after, category="whitespace", evidence=""):
    return ac.Correction(row_id, file, line, field, before, after, category, evidence)


ROWS = [
    corr(1, "EWAia-I.csv", 2, "full", "Anmerkung .", "Anmerkung."),
    corr(2, "EWAia-I.csv", 3, "full", "Bertin, Germany", "Berlin, Germany", "spelling"),
    corr(3, "EWAia-I.csv", 4, "full", "plain", "simple"),
    corr(4, "EWAia-I-New.csv", 2, "abbreviation", "Aksl.", "Aksl", "symbol"),
    corr(5, "EWAia-I-New.csv", 3, "full", 'Say "hi"', 'Say "hello"', "spelling"),
    corr(6, "EWAia-I-New.csv", 3, "type", " reference", "reference", "type-label"),
    corr(7, "EWAia-III.csv", 2, "type", "übrige", "other", "type-label"),
]


class TempDirCase(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)
        self.src = self.tmp / "source"
        self.src.mkdir()
        for name, text in FIXTURES.items():
            (self.src / name).write_bytes(text.encode("utf-8"))

    def read(self, name):
        return (self.src / name).read_bytes().decode("utf-8")

    def snapshot(self):
        return {name: self.read(name) for name in FIXTURES}

    def write_log(self, rows, name="applied.csv"):
        path = self.tmp / name
        ac.write_log(path, rows)
        return path

    def run_main(self, *args):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = ac.main(list(args))
        return code, out.getvalue(), err.getvalue()


class ApplyTests(TempDirCase):
    def test_apply_changes_only_target_fields(self):
        applied, skipped = ac.apply(ROWS, self.src)
        self.assertEqual((applied, skipped), (7, 0))
        self.assertEqual(
            self.read("EWAia-I.csv"),
            "abbreviation,full,type\n"
            '"A.","Anmerkung.",other\n'
            '"B","Berlin, Germany","reference"\n'
            '"C",simple,reference\n',
        )
        self.assertEqual(
            self.read("EWAia-I-New.csv"),
            "abbreviation,full,type\n"
            '"Aksl","Altkirchenslavisch",other\n'
            '"D","Say ""hello""",reference\n',
        )
        self.assertEqual(self.read("EWAia-II.csv"), FIXTURES["EWAia-II.csv"])
        self.assertEqual(
            self.read("EWAia-III.csv"), 'abbreviation,full,type\n"F","F full","other"'
        )

    def test_apply_is_idempotent(self):
        ac.apply(ROWS, self.src)
        once = self.snapshot()
        applied, skipped = ac.apply(ROWS, self.src)
        self.assertEqual((applied, skipped), (0, 7))
        self.assertEqual(self.snapshot(), once)

    def test_revert_round_trip_restores_bytes(self):
        ac.apply(ROWS, self.src)
        applied, skipped = ac.apply(ROWS, self.src, revert=True)
        self.assertEqual((applied, skipped), (7, 0))
        expected = dict(FIXTURES)
        # The stray-character token comes back as a clean quoted field.
        expected["EWAia-I-New.csv"] = expected["EWAia-I-New.csv"].replace(
            '"Aksl".,', '"Aksl.",'
        )
        self.assertEqual(self.snapshot(), expected)

    def test_revert_restores_bytes_exactly_without_irregular_token(self):
        rows = [r for r in ROWS if r.id != 4]
        ac.apply(rows, self.src)
        ac.apply(rows, self.src, revert=True)
        self.assertEqual(self.snapshot(), FIXTURES)

    def test_two_fields_on_one_line(self):
        ac.apply(ac.select(ROWS, [5, 6]), self.src)
        self.assertIn('"D","Say ""hello""",reference\n', self.read("EWAia-I-New.csv"))

    def test_select_one_id(self):
        selected = ac.select(ROWS, [2])
        ac.apply(selected, self.src)
        self.assertIn("Berlin", self.read("EWAia-I.csv"))
        self.assertIn("Anmerkung .", self.read("EWAia-I.csv"))
        self.assertEqual(self.read("EWAia-III.csv"), FIXTURES["EWAia-III.csv"])
        ac.apply(selected, self.src, revert=True)
        self.assertEqual(self.snapshot(), FIXTURES)

    def test_select_unknown_id(self):
        with self.assertRaises(ac.CorrectionError):
            ac.select(ROWS, [99])

    def test_mismatch_writes_nothing(self):
        bad = ROWS + [corr(8, "EWAia-III.csv", 2, "full", "wrong", "right")]
        with self.assertRaises(ac.CorrectionError) as ctx:
            ac.apply(bad, self.src)
        self.assertIn("EWAia-III.csv:2 full", str(ctx.exception))
        self.assertEqual(self.snapshot(), FIXTURES)

    def test_missing_line_writes_nothing(self):
        bad = ROWS + [corr(8, "EWAia-II.csv", 9, "full", "x", "y")]
        with self.assertRaises(ac.CorrectionError):
            ac.apply(bad, self.src)
        self.assertEqual(self.snapshot(), FIXTURES)

    def test_multiline_record_rejected(self):
        (self.src / "EWAia-II.csv").write_text(
            'abbreviation,full,type\n"E","two\nlines","grammar"\n', encoding="utf-8"
        )
        with self.assertRaises(ac.CorrectionError):
            ac.apply([corr(1, "EWAia-II.csv", 2, "type", "grammar", "other")], self.src)

    def test_value_with_quote_and_comma_round_trips(self):
        rows = [
            corr(1, "EWAia-I.csv", 4, "abbreviation", "C", 'x"y,z'),
            corr(2, "EWAia-I.csv", 3, "full", "Bertin, Germany", 'a "b", c'),
        ]
        ac.apply(rows, self.src)
        text = self.read("EWAia-I.csv")
        self.assertIn('"x""y,z",plain,reference', text)
        parsed = list(csv.reader(io.StringIO(text, newline="")))
        self.assertEqual(parsed[3][0], 'x"y,z')
        self.assertEqual(parsed[2][1], 'a "b", c')
        ac.apply(rows, self.src, revert=True)
        self.assertEqual(self.snapshot(), FIXTURES)

    def test_unquoted_value_gets_quotes_only_when_needed(self):
        ac.apply([corr(1, "EWAia-I.csv", 4, "type", "reference", "grammar")], self.src)
        self.assertIn('"C",plain,grammar\n', self.read("EWAia-I.csv"))
        ac.apply([corr(2, "EWAia-I.csv", 4, "type", "grammar", "a, b")], self.src)
        self.assertIn('"C",plain,"a, b"\n', self.read("EWAia-I.csv"))
        self.assertEqual(
            list(csv.reader(io.StringIO(self.read("EWAia-I.csv"))))[3][2], "a, b"
        )

    def test_edge_space_stays_bare(self):
        row = corr(1, "EWAia-I.csv", 4, "type", "reference", " reference")
        ac.apply([row], self.src)
        self.assertIn('"C",plain, reference\n', self.read("EWAia-I.csv"))
        ac.apply([row], self.src, revert=True)
        self.assertEqual(self.snapshot(), FIXTURES)


class TokenizerTests(unittest.TestCase):
    def test_styles(self):
        self.assertEqual(
            ac.tokenize('"a","b, c",d'),
            [('"a"', "a", True), ('"b, c"', "b, c", True), ("d", "d", True)],
        )

    def test_stray_after_quote(self):
        self.assertEqual(ac.tokenize('"Aksl".,x')[0], ('"Aksl".', "Aksl.", False))

    def test_trailing_comma_gives_empty_field(self):
        self.assertEqual(ac.tokenize("a,")[-1], ("", "", True))

    def test_matches_csv_reader(self):
        for line in ['"a","b ""q""",c', '"Aksl".,"x",y', "a,b,c", '"a",,"c"']:
            self.assertEqual(
                [v for _, v, _ in ac.tokenize(line)], next(csv.reader([line]))
            )


class LogValidationTests(TempDirCase):
    def assert_invalid(self, rows):
        path = self.tmp / "invalid.csv"
        with open(path, "w", encoding="utf-8", newline="") as handle:
            writer = csv.writer(handle, lineterminator="\n")
            writer.writerow(ac.LOG_HEADER)
            for c in rows:
                writer.writerow(
                    [c.id, c.file, c.line, c.field, c.before, c.after, c.category, ""]
                )
        with self.assertRaises(ac.CorrectionError):
            ac.load_log(path)

    def test_valid_log_round_trips(self):
        path = self.write_log(ROWS)
        self.assertEqual(ac.load_log(path), ROWS)

    def test_duplicate_id(self):
        self.assert_invalid([ROWS[0], corr(1, "EWAia-I.csv", 3, "full", "a", "b")])

    def test_duplicate_key(self):
        self.assert_invalid([ROWS[0], corr(9, "EWAia-I.csv", 2, "full", "a", "b")])

    def test_bad_field_category_file(self):
        self.assert_invalid([corr(1, "EWAia-I.csv", 2, "nope", "a", "b")])
        self.assert_invalid([corr(1, "EWAia-I.csv", 2, "full", "a", "b", "nope")])
        self.assert_invalid([corr(1, "other.csv", 2, "full", "a", "b")])

    def test_header_line_rejected(self):
        self.assert_invalid([corr(1, "EWAia-I.csv", 1, "full", "a", "b")])

    def test_before_equals_after(self):
        self.assert_invalid([corr(1, "EWAia-I.csv", 2, "full", "a", "a")])

    def test_empty_after(self):
        self.assert_invalid([corr(1, "EWAia-I.csv", 2, "full", "a", "")])

    def test_bad_header(self):
        path = self.tmp / "bad.csv"
        path.write_text("id,file\n", encoding="utf-8")
        with self.assertRaises(ac.CorrectionError):
            ac.load_log(path)

    def test_write_log_sorts_rows(self):
        path = self.write_log(list(reversed(ROWS)))
        self.assertEqual([c.id for c in ac.load_log(path)], [1, 2, 3, 4, 5, 6, 7])
        self.assertTrue(path.read_bytes().endswith(b"\n"))


class CliTests(TempDirCase):
    def test_apply_then_check(self):
        log = self.write_log(ROWS)
        base = ["--log", str(log), "--source-dir", str(self.src)]
        code, out, _ = self.run_main(*base, "--check")
        self.assertEqual(code, 1)
        self.assertIn("0 of 7", out)
        self.assertEqual(self.snapshot(), FIXTURES)
        code, out, _ = self.run_main(*base)
        self.assertEqual((code, out), (0, "applied 7, skipped 0\n"))
        code, out, _ = self.run_main(*base, "--check")
        self.assertEqual((code, out), (0, "7 of 7 corrections applied\n"))
        code, out, _ = self.run_main(*base, "--revert", "--id", "1")
        self.assertEqual((code, out), (0, "reverted 1, skipped 0\n"))
        code, _, _ = self.run_main(*base, "--check", "--id", "2")
        self.assertEqual(code, 0)
        code, _, _ = self.run_main(*base, "--check", "--id", "1")
        self.assertEqual(code, 1)

    def test_error_exit_code_and_no_write(self):
        log = self.write_log(ROWS + [corr(8, "EWAia-II.csv", 2, "full", "x", "y")])
        code, _, err = self.run_main("--log", str(log), "--source-dir", str(self.src))
        self.assertEqual(code, 1)
        self.assertIn("EWAia-II.csv:2 full", err)
        self.assertEqual(self.snapshot(), FIXTURES)


class RealDataTests(unittest.TestCase):
    def test_committed_log_is_valid_and_applied(self):
        rows = ac.load_log(ac.DEFAULT_LOG)
        self.assertEqual(ac.check(rows, ac.SOURCE_DIR), [])

    def test_committed_log_can_be_reverted_on_a_copy(self):
        rows = ac.load_log(ac.DEFAULT_LOG)
        with tempfile.TemporaryDirectory() as tmp:
            copy = Path(tmp) / "source"
            shutil.copytree(ac.SOURCE_DIR, copy, ignore=shutil.ignore_patterns("*.md"))
            applied, skipped = ac.apply(rows, copy, revert=True)
            self.assertEqual((applied, skipped), (len(rows), 0))
            applied, skipped = ac.apply(rows, copy)
            self.assertEqual((applied, skipped), (len(rows), 0))
            for name in ac.CSV_FILES:
                self.assertEqual(
                    (copy / name).read_bytes(), (ac.SOURCE_DIR / name).read_bytes()
                )

    def test_review_list_header(self):
        with open(
            ROOT / "data/corrections/review.csv", encoding="utf-8", newline=""
        ) as f:
            header = next(csv.reader(f))
        self.assertEqual(
            header, ["file", "line", "field", "value", "suggestion", "reason"]
        )


if __name__ == "__main__":
    unittest.main()
