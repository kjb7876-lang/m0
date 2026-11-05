#!/usr/bin/env python3
"""Adversarial checks for missing evidence, changed bytes and false acceptance."""
import contextlib
import importlib.util
import io
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from PIL import Image


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


prepare = load('prepare_art', 'prepare-art-evidence.py').prepare
validate = load('validate_art', 'validate-art-evidence.py').validate


class EvidenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        captures = []
        for device, dpr in [('pc', 1), ('mobile', 3)]:
            name = device + '-hub.jpg'
            Image.new('RGB', (8 * dpr, 8 * dpr), '#506070').save(self.root / name)
            captures.append({'id': device + '-hub', 'file': name, 'fixture': {'kind': 'synthetic test only'},
                             'state': {'renderer': 'three', 'viewport': {'width': 8, 'height': 8, 'dpr': dpr}}})
        self.write('capture-manifest.json', {'baseSHA': 'fixture', 'captures': captures, 'finishedAt': 'fixture'})
        self.write('audit-plan.json', {'scenes': ['hub']})
        sha = lambda n: hashlib.sha256((self.root / n).read_bytes()).hexdigest()
        self.review = {'items': [{'id': 'fixture-only', 'files': ['pc-hub.jpg', 'mobile-hub.jpg'],
                                 'fileSha256': {n: sha(n) for n in ['pc-hub.jpg', 'mobile-hub.jpg']},
                                 'scores': dict(style=9, form=9, readability=9, applicability=9, reproducibility=9),
                                 'weighted': 9, 'status': '임시'}]}
        self.write('independent-review.json', self.review)
        with contextlib.redirect_stdout(io.StringIO()):
            prepare(self.root)

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, name, value):
        (self.root / name).write_text(json.dumps(value))

    def check_result(self):
        with contextlib.redirect_stdout(io.StringIO()):
            return validate(self.root)

    def test_complete_fixture_is_structurally_valid_but_not_final_graphics(self):
        self.assertTrue(self.check_result()['ok'])
        self.assertEqual(self.review['items'][0]['status'], '임시')

    def test_changed_image_bytes_are_rejected(self):
        with (self.root / 'pc-hub.jpg').open('ab') as f:
            f.write(b'changed')
        self.assertTrue(any('changed bytes' in e for e in self.check_result()['errors']))

    def test_missing_scene_is_rejected(self):
        self.write('audit-plan.json', {'scenes': ['hub', 'region-missing']})
        self.assertEqual(sum(e.startswith('missing scene') for e in self.check_result()['errors']), 2)

    def test_false_verification_and_bad_arithmetic_are_rejected(self):
        self.review['items'][0].update(weighted=8.5, status='검증됨')
        self.write('independent-review.json', self.review)
        errors = self.check_result()['errors']
        self.assertTrue(any('weighted score mismatch' in e for e in errors))
        self.assertTrue(any('final verification' in e for e in errors))

    def test_empty_or_stale_index_cannot_report_complete_evidence(self):
        index = json.loads((self.root / 'evidence-index.json').read_text())
        index['captures'] = []
        self.write('evidence-index.json', index)
        result = self.check_result()
        self.assertFalse(result['ok'])
        self.assertFalse(result['coverageComplete'])
        self.assertEqual(sum(e.startswith('capture not indexed') for e in result['errors']), 2)

    def test_index_file_must_match_manifest_file(self):
        index = json.loads((self.root / 'evidence-index.json').read_text())
        index['captures'][0]['color'] = index['captures'][1]['color']
        index['captures'][0]['sha256'] = index['captures'][1]['sha256']
        self.write('evidence-index.json', index)
        self.assertTrue(any('does not match manifest' in e for e in self.check_result()['errors']))

    def test_review_scores_are_bound_to_reviewed_bytes(self):
        Image.new('RGB', (8, 8), '#102030').save(self.root / 'pc-hub.jpg')
        with contextlib.redirect_stdout(io.StringIO()):
            prepare(self.root)
        self.assertTrue(any('reviewed image bytes changed' in e for e in self.check_result()['errors']))

    def test_review_without_hashes_is_rejected(self):
        del self.review['items'][0]['fileSha256']
        self.write('independent-review.json', self.review)
        self.assertTrue(any('not bound to image hashes' in e for e in self.check_result()['errors']))

    def test_scored_regional_row_needs_image_references(self):
        self.write('audit-plan.json', {'scenes': ['hub'], 'regions': [{'id': 'r1'}]})
        self.write('regional-review.json', {'regions': [{'regionId': 'r1', 'status': '임시', 'captures': [],
            'scores': dict(style=8, form=8, readability=8, applicability=8, reproducibility=8), 'weighted': 8}]})
        self.assertTrue(any('no reviewed image references' in e for e in self.check_result()['errors']))

    def test_wrong_screenshot_dimensions_are_rejected(self):
        Image.new('RGB', (10, 10)).save(self.root / 'mobile-hub.jpg')
        with self.assertRaisesRegex(ValueError, 'mobile-hub.jpg'):
            prepare(self.root)


if __name__ == '__main__':
    unittest.main()
