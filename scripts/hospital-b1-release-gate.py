#!/usr/bin/env python3
"""Separate final B artifact/source gate. No review or old gate is bypassed."""
import copy
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'out/hospital-b1/build-connected/site'
APPROVAL = ROOT / 'scripts/hospital-b1-approved-runtime.json'
ALLOWED_AFTER_REVIEW = {'scripts/hospital-b1-approved-runtime.json', 'scripts/r77-approved-runtime.json'}
EVIDENCE_SOURCE_PATHS = ['.github/workflows/pages.yml', 'client-source/hospital-prototype-b1.js', 'client-source/hospital-visual-b1.js', 'client-source/hospital-sight-fix-b1.js', 'client-source/hospital-test-storage-b1.js', 'scripts/apply-hospital-prototype-b1.py', 'scripts/apply-hospital-visual-b1.py', 'scripts/apply-hospital-sight-fix-b1.py', 'scripts/build-hospital-b1.py', 'scripts/build-hospital-b1-release.sh', 'scripts/prepare-hospital-b1-cpu.py', 'scripts/run-hospital-b1-cpu.py', 'scripts/hospital-b1-release-gate.py', 'scripts/hospital-b1-build.cpu.test.py', 'scripts/hospital-b1-storage.cpu.test.mjs', 'scripts/hospital-b1-release-gate.cpu.test.py', 'scripts/hospital-b1-workflow.cpu.test.py', 'docs/hospital-b1-evidence/hospital-sim.mjs', 'docs/hospital-b1-evidence/audit.mjs']


def sha(data): return hashlib.sha256(data).hexdigest()
def fail(message): raise ValueError(message)
def head(repo=ROOT): return subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo, text=True).strip()
def asset_digest(manifest):
    rows = [{k: r[k] for k in ['path', 'bytes', 'sha256']} for r in manifest['files'] if r['path'] not in ['index.html', 'dist/phase1.js']]
    return sha(json.dumps(sorted(rows, key=lambda r: r['path']), sort_keys=True, separators=(',', ':')).encode())


def validate_artifact(site, approval, manifest=None):
    m = manifest if manifest is not None else json.loads((site / 'web-manifest-r62.json').read_text())
    if approval.get('schema') != 'storyworld.hospital-b1-runtime-approval/v1': fail('Unknown B approval schema')
    expected = approval.get('expectedRuntime', {})
    if set(expected) != {'index.html', 'dist/phase1.js'}: fail('B must pin both final runtime files')
    actual = {p: sha((site / p).read_bytes()) for p in expected}
    if actual != expected: fail('Final B runtime differs from review pin')
    b = m.get('hospitalB1Test', {})
    if b.get('runtimeHashes') != actual or m.get('webHTMLSha256') != actual['index.html']: fail('Stale B runtime metadata')
    if b.get('baselineRuntime') != approval.get('baselineR77'): fail('R77 baseline ownership differs')
    for key in ['rendererCacheKey', 'storagePrefix']:
        if b.get(key) != approval.get(key): fail('B contract differs: ' + key)
    if b.get('storageCallsMapped') != 51 or b.get('saveSchemaChanged') is not False or b.get('originalSaveImported') is not False:
        fail('Test save isolation contract differs')
    if not re.fullmatch('[0-9a-f]{40}', b.get('buildSourceCommit', '')): fail('Full build checkout commit missing')
    if b.get('sourceTreeDirty') is not False: fail('B was built from dirty/uncommitted tracked source')
    if b.get('reviewedSpatialSourceCommit') != 'c893f1f5172a33387c01241b4935d42d798ecbd8': fail('Spatial source ownership differs')
    if 'sourceCommit' in b: fail('Ambiguous old spatial-only sourceCommit field')
    if asset_digest(m) != approval.get('baselineAssetRowsSHA256') or b.get('baselineAssetRowsSHA256') != approval.get('baselineAssetRowsSHA256'):
        fail('Original asset/file table changed')
    rows = m.get('files', [])
    if len({r['path'] for r in rows}) != len(rows) or len(rows) != 1914: fail('Unexpected file set')
    for r in rows:
        rel = PurePosixPath(r['path'])
        if rel.is_absolute() or '..' in rel.parts or '\\' in r['path']: fail('Unsafe asset path')
        p = site.joinpath(*rel.parts)
        if p.is_symlink() or not p.is_file() or p.stat().st_size != r['bytes'] or sha(p.read_bytes()) != r['sha256']:
            fail('Artifact bytes disagree with manifest: ' + r['path'])
    if m.get('fileCount') != len(rows) or m.get('totalBytes') != sum(r['bytes'] for r in rows): fail('Manifest totals differ')
    if m.get('largest') != sorted(rows, key=lambda r: r['bytes'], reverse=True)[:20]: fail('Largest file table differs')
    for stage in ['releaseR75', 'releaseR76', 'releaseR77']:
        if m.get(stage, {}).get('status') != 'approved': fail('Original approval missing: ' + stage)
    if m['releaseR77'].get('runtimeHashes') != approval['baselineR77']: fail('Original R77 runtime contract changed')
    assets = m['releaseR75']['generatedAssets']
    if any(sha((site / p).read_bytes()) != v for p, v in assets.items()): fail('Preserved generated image changed')
    return {'runtimeHashes': actual, 'generatedAssets': assets, 'buildSourceCommit': b['buildSourceCommit']}


def validate_source(approval, repo=ROOT, event=None):
    if approval.get('status') != 'approved': fail('Final B source review is not approved; refusing release')
    source = approval.get('candidateSource', {})
    pr, reviewed = source.get('pullRequest'), source.get('headSha')
    if not isinstance(pr, int) or isinstance(pr, bool) or pr < 1: fail('Actual reviewed PR number required')
    if not isinstance(reviewed, str) or not re.fullmatch('[0-9a-f]{40}', reviewed): fail('Exact full reviewed source HEAD required')
    if subprocess.run(['git', '-c', 'protocol.allow=never', 'merge-base', '--is-ancestor', reviewed, 'HEAD'], cwd=repo, capture_output=True).returncode: fail('Reviewed source is not an ancestor of build checkout')
    changed = subprocess.check_output(['git', '-c', 'protocol.allow=never', 'diff', '--name-only', reviewed + '..HEAD'], cwd=repo, text=True).splitlines()
    if any(p not in ALLOWED_AFTER_REVIEW for p in changed): fail('Unreviewed changes after B source pin: ' + ', '.join(changed))
    if subprocess.run(['git', 'diff', '--quiet', 'HEAD'], cwd=repo).returncode: fail('Dirty source checkout')
    if event is not None and event.get('number') != pr: fail('B review pin belongs to another PR')
    if source.get('evidenceFile') != 'docs/hospital-b1-evidence/clean-checkout-results.json': fail('Unexpected review evidence path')
    p = repo / source['evidenceFile']
    if not p.is_file() or sha(p.read_bytes()) != source.get('evidenceSHA256'): fail('Reviewed evidence missing or changed')
    review_evidence = json.loads(p.read_text())
    if set(review_evidence.get('sourcePathHashes', {})) != set(EVIDENCE_SOURCE_PATHS): fail('Review evidence does not bind the complete build/runtime/test source set')
    for path, digest in review_evidence.get('sourcePathHashes', {}).items():
        if path in ALLOWED_AFTER_REVIEW: fail('Approval record cannot self-attest its own evidence digest')
        rel=PurePosixPath(path)
        if rel.is_absolute() or '..' in rel.parts or '\\' in path: fail('Unsafe review evidence path')
        actual = subprocess.check_output(['git', '-c', 'protocol.allow=never', 'show', reviewed + ':' + path], cwd=repo)
        if sha(actual) != digest: fail('Reviewed source and execution evidence differ: ' + path)
    if not review_evidence.get('sourcePathHashes'): fail('Review evidence has no full-source bindings')
    return source


def validate_preflight(site, repo=ROOT):
    out = site.parent
    r = json.loads((out / 'cpu-preflight.json').read_text())
    if r.get('sourceCommit') != head(repo) or r.get('ok') is not True: fail('Fresh CPU preflight for actual build checkout required')
    if not r.get('freshResultFiles') or not r.get('executedCommands'): fail('Previous JSON records are not a fresh preflight')
    for path, digest in r['resultHashes'].items():
        target=(repo/path).resolve()
        if not target.is_relative_to((repo/'out/hospital-b1').resolve()): fail('CPU result path escapes evidence directory')
        if sha(target.read_bytes()) != digest: fail('CPU result changed after execution: ' + path)
    whole = json.loads((out / 'final-results.json').read_text())
    if whole.get('commit') != head(repo) or whole.get('htmlSHA256') != sha((site / 'index.html').read_bytes()) or whole.get('rendererSHA256') != sha((site / 'dist/phase1.js').read_bytes()):
        fail('Whole CPU run used another source/artifact')
    for path, count in [('final-results.json', 29), ('audit/results.json', 10), ('build-chain-results.json', 7), ('storage-results.json', 6)]:
        data = json.loads((out / path).read_text())
        if data.get('passed') != count or data.get('failed') != 0: fail('CPU gate failed: ' + path)
    return r


def stamp(manifest, approval, verified):
    result = copy.deepcopy(manifest)
    result['hospitalB1Test']['approval'] = 'approved full-source test artifact; user play pending'
    result['releaseHospitalB1'] = {'status': 'approved', 'reviewedSourceCommit': approval['candidateSource']['headSha'], 'reviewedPullRequest': approval['candidateSource']['pullRequest'], 'buildSourceCommit': verified['buildSourceCommit'], 'runtimeHashes': verified['runtimeHashes'], 'rendererCacheKey': approval['rendererCacheKey'], 'storagePrefix': approval['storagePrefix'], 'originalSaveImported': False}
    return result


def stamp_file(path, approval, verified):
    result = stamp(json.loads(path.read_text()), approval, verified)
    path.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    return sha(path.read_bytes())


def main():
    approval = json.loads(APPROVAL.read_text())
    event = None
    if os.environ.get('GITHUB_EVENT_NAME') == 'pull_request':
        event = json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text())
    validate_source(approval, event=event)
    verified = validate_artifact(SITE, approval)
    if verified['buildSourceCommit'] != head() or os.environ.get('GITHUB_SHA', head()) != head(): fail('Artifact/source/CI checkout stamp mismatch')
    validate_preflight(SITE)
    path = SITE / 'web-manifest-r62.json'
    manifest_sha = stamp_file(path, approval, verified)
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
            for name, value in {'html_sha': verified['runtimeHashes']['index.html'], 'renderer_sha': verified['runtimeHashes']['dist/phase1.js'], 'manifest_sha': manifest_sha, 'asset_hashes_json': json.dumps(verified['generatedAssets'], sort_keys=True, separators=(',', ':'))}.items():
                f.write(name + '=' + value + '\n')
    print(json.dumps({'status': 'HOSPITAL_B1_RELEASE_PIN_PASSED', **verified, 'reviewedSourceCommit': approval['candidateSource']['headSha'], 'manifestSHA256': manifest_sha}))


if __name__ == '__main__':
    try: main()
    except ValueError as error: raise SystemExit(str(error))
