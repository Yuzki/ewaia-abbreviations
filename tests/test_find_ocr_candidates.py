import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import find_ocr_candidates as ocr  # noqa: E402


def make_rows(*triples, file="EWAia-I.csv"):
    return [
        ocr.Row(file, line, tuple(values), 3)
        for line, values in enumerate(triples, start=2)
    ]


def rules_for(*triples, file="EWAia-I.csv"):
    return {f.rule for f in ocr.find_candidates(make_rows(*triples, file=file))}


def clean(full="A clean title.", abbreviation="Abbr", kind="reference"):
    return (abbreviation, full, kind)


class RuleTests(unittest.TestCase):
    def test_stray_symbol(self):
        self.assertIn("stray-symbol", rules_for(clean("Upani~ad.")))
        self.assertIn("stray-symbol", rules_for(clean("Open (paren.")))
        self.assertNotIn("stray-symbol", rules_for(clean("Balanced [a] (b) = c-d.")))

    def test_confusable_in_word(self):
        self.assertIn("confusable-in-word", rules_for(clean("Troms0 Universitet.")))
        self.assertIn("confusable-in-word", rules_for(clean("Indo-lranian studies.")))
        self.assertIn("confusable-in-word", rules_for(clean("Brähmaoa and BrähmaoaJ.")))
        self.assertNotIn("confusable-in-word", rules_for(clean("Indo-Iranian 1966.")))

    def test_odd_char(self):
        self.assertIn("odd-char", rules_for(clean("Bad � char.")))
        self.assertIn("odd-char", rules_for(clean("Non breaking.")))
        self.assertNotIn("odd-char", rules_for(clean("Straße, Śrauta, Ṛgveda “q” °.")))

    def test_diacritic_oddity(self):
        self.assertIn("diacritic-oddity", rules_for(clean("a ́ b.")))
        self.assertIn("diacritic-oddity", rules_for(clean("á́ b.")))
        self.assertNotIn("diacritic-oddity", rules_for(clean("ṛ́ ok.")))

    def test_whitespace(self):
        self.assertIn("whitespace", rules_for(clean(" lead.")))
        self.assertIn("whitespace", rules_for(clean("two  spaces.")))
        self.assertIn("whitespace", rules_for(clean("Berlin.Winter 1990.")))
        self.assertNotIn("whitespace", rules_for(clean("Berlin. Winter 1990.")))

    def test_vocab_typo(self):
        known = [clean("Cleveland, Ohio.", f"A{i}") for i in range(3)]
        self.assertIn("vocab-typo", rules_for(*known, clean("Clevelaod, Ohio.", "B")))
        self.assertNotIn("vocab-typo", rules_for(*known, clean("Zurich, Ohio.", "B")))

    def test_abbr_full_mismatch(self):
        self.assertIn(
            "abbr-full-mismatch", rules_for(("Meier, Wb", "Wörterbuch der Sprache.", "x"))
        )
        self.assertNotIn(
            "abbr-full-mismatch",
            rules_for(("Meier, Wb", "H. Meier, Wörterbuch der Sprache.", "x")),
        )
        self.assertIn(
            "abbr-full-mismatch", rules_for(("QXZ", "Annual of Armenian Studies.", "x"))
        )
        self.assertNotIn(
            "abbr-full-mismatch", rules_for(("AAS", "Annual of Armenian Studies.", "x"))
        )

    def test_duplicate_abbreviation(self):
        self.assertIn("duplicate-abbreviation", rules_for(clean("One."), clean("Two.")))
        self.assertIn(
            "duplicate-abbreviation",
            rules_for(clean("One.", "Śāk."), clean("Two.", "sak")),
        )
        self.assertNotIn(
            "duplicate-abbreviation", rules_for(clean("One.", "A"), clean("Two.", "B"))
        )

    def test_duplicate_full(self):
        self.assertIn("duplicate-full", rules_for(clean("Same.", "A"), clean("Same.", "B")))
        self.assertNotIn(
            "duplicate-full", rules_for(clean("One.", "A"), clean("Two.", "B"))
        )

    def test_broken_ending(self):
        self.assertIn("broken-ending", rules_for(clean("No ending")))
        self.assertIn("broken-ending", rules_for(clean("Open [bracket.")))
        self.assertNotIn("broken-ending", rules_for(clean("Ends fine 1990")))
        self.assertNotIn("broken-ending", rules_for(clean("Ends fine.")))

    def test_type_value(self):
        self.assertIn("type-value", rules_for(clean(kind="literature")))
        self.assertIn("type-value", rules_for(clean(kind=" reference")))
        self.assertNotIn("type-value", rules_for(clean(kind="grammar")))

    def test_empty_field(self):
        self.assertIn("empty-field", rules_for(("A", "", "other")))
        self.assertNotIn("empty-field", rules_for(clean()))


class KnownExampleTests(unittest.TestCase):
    EXAMPLES = (
        "Bhav~ya-Purä!)a.",
        "Upani~ad.",
        "Tfu)4ya-Mahä-BrähmaoaJ.",
        "E. Benveniste, lndo-lranian studies.",
        "Universitetet i Troms0.",
        "Vol. N' 21.",
        "Beiträge. [Neue Folge, 1966tf.].",
        "Polska Akadetaja Umiej~tnosci.",
        "Reference DED^2.",
        "W. Belard~ ... Mazclei.",
    )

    def test_each_example_is_caught(self):
        for example in self.EXAMPLES:
            with self.subTest(example=example):
                self.assertTrue(rules_for(clean(example)) - {"broken-ending"})


class OutputTests(unittest.TestCase):
    def test_deterministic_on_real_data(self):
        first = ocr.render_markdown(ocr.find_candidates(ocr.load_rows()))
        second = ocr.render_markdown(ocr.find_candidates(ocr.load_rows()))
        self.assertEqual(first, second)
        self.assertIn("| Rule | Description | Count |", first)

    def test_csv_output_has_header(self):
        text = ocr.render_csv(ocr.find_candidates(make_rows(clean("Upani~ad."))))
        self.assertTrue(text.startswith("file,line,field,value,rule,severity,reason"))

    def test_markdown_escapes_pipes_and_edge_spaces(self):
        self.assertEqual(ocr.code_cell("a|b"), "`a\\|b`")
        self.assertEqual(ocr.show_value(" x "), "␠x␠")


if __name__ == "__main__":
    unittest.main()
