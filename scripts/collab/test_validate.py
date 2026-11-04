#!/usr/bin/env python3
"""validate.py 단위 시험: python3 -I scripts/collab/test_validate.py"""
import copy, io, json, os, sys, tempfile, unittest, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import validate as v  # noqa: E402

ROOT = v.ROOT
CFG = v.load_config()
with open(os.path.join(ROOT, 'ops', 'tasks', 'SW-0001.json'), encoding='utf-8') as f:
    TASK = json.load(f)
with open(os.path.join(ROOT, 'ops', 'manifests', 'SW-0001.json'), encoding='utf-8') as f:
    MAN = json.load(f)
ASSET_DIR = os.path.join(ROOT, 'r96', 'runtime-text', 'assets', 'r290', 'mobs')


def t(**kw):
    x = copy.deepcopy(TASK)
    x.update(kw)
    return x


class TaskContract(unittest.TestCase):
    def test_sample_task_ok(self):
        self.assertEqual(v.validate_task(TASK, CFG), [])

    def test_other_project_id_rejected(self):
        self.assertTrue(v.validate_task(t(task_id='HR-0001'), CFG))
        self.assertTrue(v.validate_task(t(repository='kjb7876-lang/hapil-reboot'), CFG))

    def test_forbidden_paths(self):
        for p in ('../hapil1/x', '/etc/passwd', 'hapil-reboot/src', 'r96/.env', 'random/'):
            self.assertTrue(v.validate_task(t(allowed_paths=[p]), CFG), p)

    def test_self_review_rejected(self):
        self.assertTrue(v.validate_task(t(executor='claude', reviewer='claude'), CFG))

    def test_external_running_needs_dispatch(self):
        self.assertTrue(v.validate_task(t(dispatch_id=None), CFG))

    def test_blocked_needs_reason_and_done_needs_evidence(self):
        self.assertTrue(v.validate_task(t(status='BLOCKED'), CFG))
        self.assertTrue(v.validate_task(t(status='DONE'), CFG))
        self.assertEqual(v.validate_task(t(status='DONE', evidence=['x']), CFG), [])

    def test_fix_round_cap(self):
        self.assertTrue(v.validate_task(t(attempt_count=4), CFG))
        self.assertEqual(v.validate_task(t(attempt_count=4, status='BLOCKED', blocked_reason='3회 개선 없음'), CFG), [])

    def test_transitions(self):
        self.assertTrue(v.check_transition('QUEUED', 'RUNNING', CFG))
        self.assertFalse(v.check_transition('DONE', 'RUNNING', CFG))
        self.assertFalse(v.check_transition('PAUSED', 'RUNNING', CFG))  # 재개는 QUEUED 를 거친다


class Dispatch(unittest.TestCase):
    def test_duplicate_and_unknown(self):
        key = v.dedup_key(TASK)
        self.assertEqual(v.check_dispatch([], TASK)[0], 'OK')
        self.assertEqual(v.check_dispatch([{'key': key, 'state': 'running'}], TASK)[0], 'DUPLICATE')
        self.assertEqual(v.check_dispatch([{'key': key, 'state': 'unknown'}], TASK)[0], 'CONFIRM_EXISTING')
        self.assertEqual(v.check_dispatch([{'key': key, 'state': 'failed'}], TASK)[0], 'OK')

    def test_new_revision_is_new_key(self):
        led = [{'key': v.dedup_key(TASK), 'state': 'done'}]
        self.assertEqual(v.check_dispatch(led, t(revision=2))[0], 'OK')

    def test_stale_result_rejected(self):
        cur = t(revision=2)
        self.assertEqual(v.accept_result(cur, {'task_id': 'SW-0001', 'revision': 1, 'input_manifest_hash': TASK['input_manifest_hash']}), 'STALE')
        self.assertEqual(v.accept_result(TASK, {'task_id': 'SW-0001', 'revision': 1, 'input_manifest_hash': TASK['input_manifest_hash']}), 'OK')
        self.assertEqual(v.accept_result(t(status='PAUSED'), {'task_id': 'SW-0001', 'revision': 1, 'input_manifest_hash': TASK['input_manifest_hash']}), 'NOT_ACCEPTING')


class Manifest(unittest.TestCase):
    def test_real_asset_complete(self):
        errs, complete = v.validate_manifest(MAN, ASSET_DIR)
        self.assertEqual(errs, [])
        self.assertTrue(complete)

    def test_partial_delivery_not_complete(self):
        m = copy.deepcopy(MAN)
        m['expected_count'] = 2
        errs, complete = v.validate_manifest(m, ASSET_DIR)
        self.assertFalse(complete)
        self.assertTrue(any('일부만' in e for e in errs))

    def test_hash_mismatch(self):
        m = copy.deepcopy(MAN)
        m['assets'][0]['sha256'] = '0' * 64
        errs, complete = v.validate_manifest(m, ASSET_DIR)
        self.assertFalse(complete)

    def test_missing_file(self):
        with tempfile.TemporaryDirectory() as d:
            errs, complete = v.validate_manifest(MAN, d)
            self.assertFalse(complete)
            self.assertTrue(errs)

    def test_path_outside_root_rejected(self):
        for bad in (os.path.join(ASSET_DIR, 'm001.webp'), '../mobs/m001.webp'):
            m = copy.deepcopy(MAN)
            m['assets'][0]['file'] = bad
            with tempfile.TemporaryDirectory() as d:
                errs, complete = v.validate_manifest(m, d)
            self.assertFalse(complete, bad)
            self.assertTrue(errs, bad)

    def test_symlink_escape_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            os.symlink(os.path.join(ASSET_DIR, 'm001.webp'), os.path.join(d, 'm001.webp'))
            errs, complete = v.validate_manifest(MAN, d)
            self.assertFalse(complete)

    def test_duplicate_entries_do_not_count(self):
        m = copy.deepcopy(MAN)
        m['expected_count'] = 2
        m['assets'].append(copy.deepcopy(m['assets'][0]))
        errs, complete = v.validate_manifest(m, ASSET_DIR)
        self.assertFalse(complete)
        self.assertTrue(any('중복' in e for e in errs))

    def test_png_trns_alpha(self):
        import struct, zlib
        def chunk(tag, data):
            return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
        png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 3, 0, 0, 0))
               + chunk(b'PLTE', b'\xff\x00\x00') + chunk(b'tRNS', b'\x00')
               + chunk(b'IDAT', zlib.compress(b'\x00\x00')) + chunk(b'IEND', b''))
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, 'a.png')
            open(p, 'wb').write(png)
            self.assertEqual(v.image_info(p), ('image/png', 1, 1, True))

    def test_targets_mode_assets_in_different_dirs(self):
        other = 'r96/runtime-text/assets/r163/pixelfx/crit-hit.webp'
        po = os.path.join(ROOT, other)
        m = copy.deepcopy(MAN)
        m['expected_count'] = 2
        b = copy.deepcopy(m['assets'][0])
        b.update(asset_id='r163/fx/crit-hit', file='crit-hit.webp', target_path=other,
                 bytes=os.path.getsize(po), sha256=v.sha256_file(po))
        b.pop('format'); b.pop('sprite')
        m['assets'].append(b)
        errs, complete = v.validate_manifest(m, use_targets=True)
        self.assertEqual(errs, [])
        self.assertTrue(complete)
        m['assets'][1]['target_path'] = '../outside.webp'
        self.assertFalse(v.validate_manifest(m, use_targets=True)[1])

    def test_bad_sprite_grid(self):
        m = copy.deepcopy(MAN)
        m['assets'][0]['sprite']['cell'] = [300, 320]
        errs, complete = v.validate_manifest(m, ASSET_DIR)
        self.assertFalse(complete)


class Zip(unittest.TestCase):
    def _zip(self, entries):
        d = tempfile.mkdtemp()
        p = os.path.join(d, 'b.zip')
        with zipfile.ZipFile(p, 'w') as z:
            for n, data in entries:
                z.writestr(n, data)
        return p

    def test_clean_zip(self):
        self.assertEqual(v.check_zip(self._zip([('a/m.png', b'x'), ('a/MANIFEST.json', b'{}')])), [])

    def test_exec_bit_and_shebang_without_extension(self):
        d = tempfile.mkdtemp()
        p = os.path.join(d, 'x.zip')
        with zipfile.ZipFile(p, 'w') as z:
            zi = zipfile.ZipInfo('run')
            zi.external_attr = 0o100755 << 16
            z.writestr(zi, b'#!/bin/sh\necho hi\n')
            z.writestr('tool', b'#!/usr/bin/env python\n')
            z.writestr('a/ok.png', b'\x89PNG....')
        errs = v.check_zip(p)
        self.assertEqual(len(errs), 2, errs)

    def test_traversal_and_scripts(self):
        errs = v.check_zip(self._zip([('../evil.png', b'x'), ('run.sh', b'x'), ('a/x.js', b'x')]))
        self.assertEqual(len(errs), 3)


if __name__ == '__main__':
    unittest.main(verbosity=1)
