"""Exercise release refusal paths in isolated files; never edit runtime inputs."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

SOURCE = Path.cwd()


class ReleaseGate(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='r75-release-gate-')
        self.root = Path(self.temp.name)
        for name in ['scripts/r75-release-gate.py', 'scripts/r75-approved-runtime.json',
                     'scripts/r74-approved-runtime.json', 'client-source/art-r75.json',
                     'story-source/hapil-story-20261019.txt', '_pages/docs/web-manifest-r62.json']:
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(SOURCE / name, target)
        for name in ['index.html', 'dist/phase1.js', 'assets/r75/doors.png', 'assets/r75/npcs.png', 'assets/r75/shaman-spear.png']:
            target = self.root / '_pages/docs' / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.symlink_to(SOURCE / '_pages/docs' / name)

    def tearDown(self):
        self.temp.cleanup()

    def run_gate(self, **env):
        return subprocess.run(['python3', 'scripts/r75-release-gate.py'], cwd=self.root,
                              env={**os.environ, 'GITHUB_OUTPUT': str(self.root/'outputs'), 'GITHUB_SHA': 'release-fixture', **env},
                              capture_output=True, text=True)

    def edit_json(self, name, edit):
        path = self.root / name
        data = json.loads(path.read_text())
        edit(data)
        path.write_text(json.dumps(data))

    def tamper(self, name):
        path = self.root / '_pages/docs' / name
        path.unlink()
        path.write_bytes(b'unreviewed replacement')

    def test_valid_exact_files_bind_the_current_commit_and_output_hashes(self):
        result = self.run_gate()
        self.assertEqual(result.returncode, 0, result.stderr)
        manifest = json.loads((self.root/'_pages/docs/web-manifest-r62.json').read_text())
        self.assertEqual(manifest['releaseR75']['sourceCommit'], 'release-fixture')
        self.assertFalse(manifest['releaseR75']['audioApplied'])
        self.assertIn('manifest_sha=', (self.root/'outputs').read_text())

    def test_prior_release_pin_cannot_be_replaced(self):
        self.edit_json('scripts/r74-approved-runtime.json', lambda d: d['approved'].update({'index.html': 'changed'}))
        self.assertNotEqual(self.run_gate().returncode, 0)

    def test_unreviewed_HTML_is_refused(self):
        self.tamper('index.html')
        self.assertNotEqual(self.run_gate().returncode, 0)

    def test_unreviewed_renderer_is_refused(self):
        self.tamper('dist/phase1.js')
        self.assertNotEqual(self.run_gate().returncode, 0)

    def test_changed_original_generated_asset_is_refused(self):
        self.tamper('assets/r75/npcs.png')
        self.assertNotEqual(self.run_gate().returncode, 0)

    def test_manifest_cannot_claim_different_release_bytes(self):
        self.edit_json('_pages/docs/web-manifest-r62.json', lambda d: next(r for r in d['files'] if r['path']=='index.html').update({'sha256': 'wrong'}))
        self.assertNotEqual(self.run_gate().returncode, 0)

    def test_pending_review_cannot_publish_from_main(self):
        self.edit_json('scripts/r75-approved-runtime.json', lambda d: d.update({'status':'pending-review'}))
        self.assertNotEqual(self.run_gate(GITHUB_REF='refs/heads/main', GITHUB_EVENT_NAME='push').returncode, 0)


if __name__ == '__main__':
    unittest.main()
