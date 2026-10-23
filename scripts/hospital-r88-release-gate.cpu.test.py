#!/usr/bin/env python3
"""Exercise real R88 refusal helpers in disposable repositories and file trees.

Synthetic fixture approvals never become production release approval records.
This does not rerun gameplay and does not claim browser or GPU validation.
"""
from datetime import datetime, timezone
import copy
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('r88gate', ROOT / 'scripts/hospital-r88-release-gate.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class RefusalTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='r88-gate-fixture-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.site = self.root / 'out/hospital-r88/site'
        self.work = self.root / 'out/hospital-r88/verification'
        self.source = self.root / 'release/r88'
        self.site.mkdir(parents=True)
        self.work.mkdir(parents=True)
        self.source.mkdir(parents=True)
        self.started = datetime.now(timezone.utc).timestamp() - 2
        (self.root / '.gitignore').write_text('/out/\n')
        self.files = {'index.html': b'fixture immutable html', 'dist/phase1.js': b'fixture immutable renderer'}
        self.files.update({name: ('fixture supplied atlas ' + name).encode() for name in gate.PUBLIC_ATLAS_PATHS})
        for name, value in self.files.items():
            p = self.site / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(value)
        rows = [{'path': p, 'bytes': len(v), 'sha256': gate.digest(v)} for p, v in sorted(self.files.items())]
        self.manifest = {
            'files': rows, 'fileCount': len(rows), 'totalBytes': sum(r['bytes'] for r in rows),
            'largest': sorted(rows, key=lambda r: r['bytes'], reverse=True)[:20],
            'webHTMLSha256': gate.sha(self.site / 'index.html'),
            'r88': {'saveNamespace': gate.PREFIX, 'paintedEffectCount': 42, 'storedPaintedFrames': 680, 'runtimeAtlasCount': 42, 'legacyProcedural80Loaded': False, 'prior3MedicalRootEffectsSingleOwner': True},
        }
        self.approval = {'schema': 'storyworld.hospital-r88-runtime-approval/v1', 'status': 'approved', 'fileCount': len(rows), 'storagePrefix': gate.PREFIX, 'expectedRuntime': {n: gate.sha(self.site / n) for n in ['index.html', 'dist/phase1.js']}}
        self.write_manifest()
        runs = []
        for name, (script, report, minimum) in gate.EXPECTED_RUNS.items():
            count = gate.EXPECTED_CHECK_COUNTS[name]
            for base in [self.source, self.work]:
                p = base / script
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text('fixture reviewed script ' + script + '\n')
            p = self.work / report
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(json.dumps({'checks': [{'name': str(i), 'passed': True} for i in range(count)]}))
            runs.append({'name': name, 'script': script, 'report': report, 'minimumChecks': minimum, 'checks': count, 'passedChecks': count, 'passed': True, 'exitCode': 0, 'signal': None, 'scriptSHA256': gate.sha(self.work / script)})
        self.report = {'schema': 'r88-final-frozen-suite/v1', 'startedAt': self.iso(self.started + .2), 'completedAt': self.iso(self.started + .8), 'passed': True, 'sourceUnchangedDuringRun': True, 'changedFiles': [], 'groups': 49, 'passedChecks': 640, 'totalChecks': 640, 'sourceHashes': self.snapshot(), 'runs': runs, 'browserVerified': False, 'GPUVerified': False, 'naturalPlayVerified': False}
        evidence = self.root / gate.EVIDENCE_PATH
        evidence.parent.mkdir(parents=True, exist_ok=True)
        evidence.write_text(json.dumps(self.report))
        record = self.root / gate.APPROVAL_PATH
        record.parent.mkdir(exist_ok=True)
        record.write_text('{}\n')
        (self.root / 'scripts/hospital-r88-release-gate.py').write_text('fixture reviewed gate\n')
        (self.source / 'qa/r88/run-suite.cjs').write_text('fixture reviewed suite entrypoint\n')
        self.git('init', '-q')
        self.git('add', '.')
        self.git('commit', '-qm', 'disposable reviewed source A')
        self.reviewed = self.git('rev-parse', 'HEAD')
        self.approval['candidateSource'] = {'headSha': self.reviewed, 'pullRequest': 999, 'workflowRunId': None, 'evidenceFile': gate.EVIDENCE_PATH, 'evidenceSHA256': gate.sha(evidence)}
        record.write_text(json.dumps(self.approval))
        self.git('add', gate.APPROVAL_PATH)
        self.git('commit', '-qm', 'disposable approval B only')
        self.preflight = {'schema': 'storyworld.hospital-r88-preflight/v1', 'sourceCommit': self.git('rev-parse', 'HEAD'), 'startedAt': self.iso(self.started), 'finishedAt': self.iso(self.started + 1), 'reportPath': gate.REPORT_PATH, 'freshResults': True, 'executedCommand': ['node', 'qa/r88/run-suite.cjs']}
        self.write_report()

    @staticmethod
    def iso(value):
        return datetime.fromtimestamp(value, timezone.utc).isoformat()

    def git(self, *args):
        return subprocess.check_output(['git', '-c', 'user.name=R88 CPU fixture', '-c', 'user.email=fixture@invalid', *args], cwd=self.root, stderr=subprocess.DEVNULL).decode().strip()

    def write_manifest(self):
        (self.site / 'web-manifest-r62.json').write_text(json.dumps(self.manifest))
        self.approval['manifestSHA256'] = gate.sha(self.site / 'web-manifest-r62.json')

    def snapshot(self):
        return {p.relative_to(self.site).as_posix(): gate.sha(p) for p in self.site.rglob('*') if p.is_file()}

    def write_report(self):
        path = self.root / gate.REPORT_PATH
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.report))
        self.preflight['reportSHA256'] = gate.sha(path)
        (self.root / 'out/hospital-r88/preflight.json').write_text(json.dumps(self.preflight))

    def artifact(self):
        return gate.validate_artifact(self.site, self.approval)

    def fresh(self):
        return gate.validate_preflight(self.artifact(), self.root)

    def source_gate(self):
        return gate.validate_source(self.approval, self.root, {'number': 999})

    def refuses(self, fn, message):
        with self.assertRaisesRegex(ValueError, message):
            fn()

    def test_positive_full_helpers(self):
        self.source_gate()
        self.assertEqual(self.fresh()['passedChecks'], 640)
        before = gate.sha(self.site / 'web-manifest-r62.json')
        values = gate.emit_outputs(self.artifact(), self.approval['candidateSource'], self.fresh())
        self.assertEqual(len(json.loads(values['asset_hashes_json'])), 42)
        self.assertEqual(before, gate.sha(self.site / 'web-manifest-r62.json'))

    def test_production_contract_is_exact(self):
        approval = dict(schema='storyworld.hospital-r88-runtime-approval/v1', status='approved', **copy.deepcopy(gate.CONTRACT))
        gate.validate_contract(approval)
        for key in gate.CONTRACT:
            bad = copy.deepcopy(approval)
            bad[key] = None
            self.refuses(lambda: gate.validate_contract(bad), 'contract differs')

    def test_pending_main_refuses_without_outputs(self):
        bad = dict(self.approval, status='pending-review')
        self.refuses(lambda: gate.validate_context(bad, None, 'refs/heads/main'), 'pending')
        self.refuses(lambda: gate.validate_context(bad, {'number': 999}, 'refs/heads/main'), 'pending')
        gate.validate_context(bad, {'number': 999}, 'refs/pull/999/merge')
        self.refuses(lambda: gate.validate_source(bad, self.root), 'not approved')

    def test_wrong_pr_refuses(self):
        self.refuses(lambda: gate.validate_source(self.approval, self.root, {'number': 998}), 'another PR')

    def test_unknown_head_refuses(self):
        self.approval['candidateSource']['headSha'] = '0' * 40
        self.refuses(self.source_gate, 'not an ancestor')

    def test_unrelated_head_refuses(self):
        current = self.git('rev-parse', 'HEAD')
        self.git('checkout', '--orphan', 'unrelated')
        self.git('commit', '-qm', 'unrelated source')
        unrelated = self.git('rev-parse', 'HEAD')
        self.git('checkout', '--detach', current)
        self.approval['candidateSource']['headSha'] = unrelated
        self.refuses(self.source_gate, 'not an ancestor')

    def test_post_pin_source_change_refuses(self):
        p = self.source / next(iter(gate.EXPECTED_RUNS.values()))[0]
        p.write_text('unreviewed code')
        self.git('add', '.')
        self.git('commit', '-qm', 'unreviewed runtime after pin')
        self.refuses(self.source_gate, 'Unreviewed changes')

    def test_dirty_tracked_source_refuses(self):
        p = self.source / next(iter(gate.EXPECTED_RUNS.values()))[0]
        p.write_text('dirty code')
        self.refuses(self.source_gate, 'Dirty tracked')

    def test_untracked_source_refuses(self):
        (self.root / 'unreviewed.py').write_text('untracked code')
        self.refuses(self.source_gate, 'Untracked source')

    def test_changed_evidence_refuses(self):
        self.approval['candidateSource']['evidenceSHA256'] = '0' * 64
        self.refuses(self.source_gate, 'evidence missing or changed')

    def test_wrong_evidence_path_refuses(self):
        self.approval['candidateSource']['evidenceFile'] = '../outside.json'
        self.refuses(self.source_gate, 'evidence path')

    def test_manifest_pin_refuses(self):
        self.approval['manifestSHA256'] = '0' * 64
        self.refuses(self.artifact, 'manifest pin')

    def test_changed_asset_refuses(self):
        (self.site / next(n for n in self.files if n.endswith('.png'))).write_bytes(b'wrong')
        self.refuses(self.artifact, 'bytes disagree')

    def test_wrong_runtime_pin_refuses(self):
        self.approval['expectedRuntime']['index.html'] = '0' * 64
        self.refuses(self.artifact, 'runtime pin')

    def test_duplicate_path_refuses(self):
        self.manifest['files'][-1] = copy.deepcopy(self.manifest['files'][0])
        self.write_manifest()
        self.refuses(self.artifact, 'Duplicate')

    def test_traversal_path_refuses(self):
        self.manifest['files'][0]['path'] = '../outside'
        self.write_manifest()
        self.refuses(self.artifact, 'Unsafe relative')

    def test_absolute_path_refuses(self):
        self.manifest['files'][0]['path'] = '/etc/passwd'
        self.write_manifest()
        self.refuses(self.artifact, 'Unsafe relative')

    def test_backslash_path_refuses(self):
        self.manifest['files'][0]['path'] = 'assets\\escape.png'
        self.write_manifest()
        self.refuses(self.artifact, 'Unsafe relative')

    def test_noncanonical_path_refuses(self):
        self.manifest['files'][0]['path'] = 'assets//image.png'
        self.write_manifest()
        self.refuses(self.artifact, 'Unsafe relative')

    def test_symlink_file_refuses(self):
        p = self.site / 'index.html'
        outside = self.root / 'outside.html'
        outside.write_bytes(p.read_bytes())
        p.unlink()
        p.symlink_to(outside)
        self.refuses(self.artifact, 'Symlink')

    def test_symlink_directory_refuses(self):
        p = self.site / 'dist'
        outside = self.root / 'outside-dist'
        p.rename(outside)
        p.symlink_to(outside, target_is_directory=True)
        self.refuses(self.artifact, 'Symlink')

    def test_extra_file_refuses(self):
        (self.site / 'unmanifested.js').write_text('unexpected')
        self.refuses(self.artifact, 'unmanifested')

    def test_namespace_drift_refuses(self):
        self.manifest['r88']['saveNamespace'] = 'original-save:'
        self.write_manifest()
        self.refuses(self.artifact, 'namespace')

    def test_procedural_package_enabled_refuses(self):
        self.manifest['r88']['legacyProcedural80Loaded'] = True
        self.write_manifest()
        self.refuses(self.artifact, 'effect scope')

    def test_preflight_other_commit_refuses(self):
        self.preflight['sourceCommit'] = '0' * 40
        self.write_report()
        self.refuses(self.fresh, 'another source')

    def test_stale_report_hash_refuses(self):
        self.write_report()
        (self.root / gate.REPORT_PATH).write_text('{}')
        self.refuses(self.fresh, 'SHA256 differs')

    def test_old_execution_times_refuse(self):
        self.started -= 86400
        self.preflight.update(startedAt=self.iso(self.started), finishedAt=self.iso(self.started + 1))
        self.report.update(startedAt=self.iso(self.started + .2), completedAt=self.iso(self.started + .8))
        self.write_report()
        self.refuses(self.fresh, 'Stale or inconsistent')

    def test_old_report_mtime_refuses(self):
        self.write_report()
        os.utime(self.root / gate.REPORT_PATH, (0, 0))
        self.refuses(self.fresh, 'not freshly written')

    def test_incomplete_suite_refuses(self):
        self.report['passedChecks'] = 639
        self.write_report()
        self.refuses(self.fresh, 'Incomplete')

    def test_changed_runtime_evidence_refuses(self):
        self.report['sourceHashes']['index.html'] = '0' * 64
        self.write_report()
        self.refuses(self.fresh, 'artifact bytes differ')

    def test_false_gpu_claim_refuses(self):
        self.report['GPUVerified'] = True
        self.write_report()
        self.refuses(self.fresh, 'misrepresents')

    def test_duplicate_group_refuses(self):
        self.report['runs'][-1] = copy.deepcopy(self.report['runs'][0])
        self.write_report()
        self.refuses(self.fresh, 'duplicate')

    def test_changed_script_refuses(self):
        p = self.work / self.report['runs'][0]['script']
        p.write_text('different test code')
        self.refuses(self.fresh, 'script differs')

    def test_failed_group_check_refuses(self):
        p = self.work / self.report['runs'][0]['report']
        data = json.loads(p.read_text())
        data['checks'][0]['passed'] = False
        p.write_text(json.dumps(data))
        self.refuses(self.fresh, 'group result differs')

    def test_stale_group_report_refuses(self):
        os.utime(self.work / self.report['runs'][0]['report'], (0, 0))
        self.refuses(self.fresh, 'not freshly written')


if __name__ == '__main__':
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(RefusalTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    report = {'schema': 'storyworld.hospital-r88-gate-refusals/v1', 'passed': result.testsRun - len(result.failures) - len(result.errors), 'failed': len(result.failures) + len(result.errors), 'testsRun': result.testsRun, 'syntheticApprovalsOnlyInDisposableRepositories': True, 'productionApprovalModified': False, 'browserVerified': False, 'GPUVerified': False}
    out = ROOT / 'out/hospital-r88'
    out.mkdir(parents=True, exist_ok=True)
    (out / 'gate-refusal-results.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))
    raise SystemExit(0 if result.wasSuccessful() else 1)
