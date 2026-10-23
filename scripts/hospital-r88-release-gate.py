#!/usr/bin/env python3
"""Independent R88 source/artifact/fresh-CPU gate; historical approvals are not inherited.

The immutable V11 manifest is never stamped or rewritten here. Browser evidence
is a separate mandatory workflow step; this CPU gate does not claim GPU proof.
"""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
APPROVAL_PATH = 'scripts/hospital-r88-approved-runtime.json'
EVIDENCE_PATH = 'release/r88/qa/r88/final-suite.json'
REPORT_PATH = 'out/hospital-r88/verification/qa/r88/final-suite.json'
PREFIX = 'storyworld.hospital-three-pc.maze.v11:'
CONTRACT = {'manifestSHA256': '62ececfcef089e58dda8d5fc458f62bb3a228910ba10ec23a0fb0029cf1ebeda',
 'expectedRuntime': {'index.html': 'a8c4b3d63bcd69b875315f430c55d8db9e1f4ceac3b3152175c9c8a10628122f',
                     'dist/phase1.js': '64495ba0969c0c85b548f75539f904197f90643ea82a07f29287de1bf7f4d105'},
 'fileCount': 2348,
 'storagePrefix': 'storyworld.hospital-three-pc.maze.v11:'}

# Complete immutable suite identity. Counts are admission minima; every actual
# check must pass and every executed script must equal its reviewed source.
EXPECTED_RUNS = {'world-runtime': ['qa/r81/runtime-contracts.cjs', 'qa/r81/runtime-results.json', 22],
 'hospital-maze': ['qa/maze-integration.cjs', 'qa/maze-results.json', 29],
 'hospital-layout': ['qa/layout-validation.cjs', 'qa/layout-results.json', 14],
 'hospital-cold': ['qa/cold-check.cjs', 'qa/cold-results.json', 7],
 'ego-health': ['qa/ego-regression.cjs', 'qa/ego-regression-results.json', 6],
 'manual-input': ['qa/r81/manual-input.cjs', 'qa/r81/manual-input-results.json', 6],
 'hospital-champions': ['qa/champion-check.cjs', 'qa/champion-results.json', 10],
 'hospital-migration': ['qa/migration-check.cjs', 'qa/migration-results.json', 9],
 'brain-and-roofs': ['qa/r82/material-check.cjs', 'qa/r82/material-results.json', 12],
 'world-geometry': ['qa/r81/geometry-contracts.cjs', 'qa/r81/geometry-results.json', 9],
 'camera-motion': ['qa/r82/camera-check.cjs', 'qa/r82/camera-results.json', 10],
 'opening-refuge': ['qa/r82/hub-check.cjs', 'qa/r82/hub-results.json', 11],
 'projectile': ['qa/r81/projectile-contracts.cjs', 'qa/r81/projectile-results.json', 13],
 'environment': ['qa/r81/environment-check.cjs', 'qa/r81/environment-results.json', 17],
 'world-cold': ['qa/r81/cold-restore-contracts.cjs', 'qa/r81/cold-restore-results.json', 6],
 'hospital-start-777': ['qa/r81/hospital-start-777.cjs', 'qa/r81/hospital-start-777-results.json', 9],
 'legacy-castle-save': ['qa/r81/legacy-castle-save-contracts.cjs',
                        'qa/r81/legacy-castle-save-results.json',
                        10],
 'legacy-save': ['qa/r81/legacy-save-contracts.cjs', 'qa/r81/legacy-save-results.json', 9],
 'native-progression': ['qa/r81/progression-contracts.cjs', 'qa/r81/progression-results.json', 12],
 'native-finale': ['qa/r81/finale-contracts.cjs', 'qa/r81/finale-results.json', 6],
 'preservation': ['qa/r81/preservation.py', 'qa/r81/preservation-results.json', 4],
 'package': ['qa/package-check.cjs', 'qa/package-results.json', 5],
 'renderer-compositing': ['qa/r83/render-compat-check.cjs', 'qa/r83/render-compat-results.json', 13],
 'legacy-scope': ['qa/r81/legacy-scope-check.cjs', 'qa/r81/legacy-scope-results.json', 3],
 'world-combat': ['qa/r81/world-combat-check.cjs', 'qa/r81/world-combat-results.json', 9],
 'hero-presentation': ['qa/r83/hero-check.cjs', 'qa/r83/hero-results.json', 18],
 'portal-interaction': ['qa/r83/portal-check.cjs', 'qa/r83/portal-results.json', 17],
 'world-door-visuals': ['qa/r83/door-check.cjs', 'qa/r83/door-results.json', 18],
 'map-perimeter': ['qa/r83/map-check.cjs', 'qa/r83/map-results.json', 14],
 'new-vfx-assets': ['qa/r83/vfx-asset-audit.py', 'qa/r83/vfx-asset-results.json', 13],
 'existing-effects': ['qa/r83/effect-check.cjs', 'qa/r83/effect-results.json', 14],
 'full-frame-render-replay': ['qa/r83/audit-frame-replay.cjs', 'qa/r83/audit-frame-results.json', 16],
 'final42-source-normalization': ['scripts/normalize-final42-r88.py',
                                  'qa/r88/final42-normalization-results.json',
                                  16],
 'final42-atlas-player': ['qa/r88/final42-runtime-check.cjs', 'qa/r88/final42-runtime-results.json', 39],
 'new-vfx-runtime': ['qa/r83/vfx-runtime-check.cjs', 'qa/r83/vfx-runtime-results.json', 18],
 'painted-frame-pixels': ['qa/r87/atlas-audit.py', 'qa/r87/atlas-results.json', 8],
 'hospital-settings': ['qa/r84/settings-check.cjs', 'qa/r84/settings-results.json', 20],
 'final42-native-hooks': ['qa/r88/final42-hooks-check.cjs', 'qa/r88/final42-hooks-results.json', 29],
 'refined-static-integration': ['qa/r86/refined-static-check.cjs',
                                'qa/r86/refined-static-results.json',
                                15],
 'dynamic-package-deferred': ['qa/r86/dynamic-deferred-check.cjs',
                              'qa/r86/dynamic-deferred-results.json',
                              8],
 'camera-default': ['qa/r86/camera-check.cjs', 'qa/r86/camera-results.json', 6],
 'door-front-surface': ['qa/r86/door-check.cjs', 'qa/r86/door-results.json', 12],
 'enemy-facing': ['qa/r86/enemy-facing-check.cjs', 'qa/r86/enemy-facing-results.json', 6],
 'hero-all-poses': ['qa/r86/hero-integration-check.cjs', 'qa/r86/hero-integration-results.json', 12],
 'enemy-colors-and-champions': ['qa/r86/enemy-check.cjs', 'qa/r86/enemy-results.json', 18],
 'retained-vector-buffers': ['qa/r86/performance-check.cjs', 'qa/r86/performance-results.json', 16],
 'active-asset-usage': ['qa/r86/vfx-usage-check.cjs', 'qa/r86/vfx-usage-results.json', 11],
 'samong-through-ending': ['qa/r86/progression-777-finale.cjs',
                           'qa/r86/progression-777-finale-results.json',
                           22],
 'campaign-map-admission': ['qa/r86/map-campaign-check.cjs', 'qa/r86/map-campaign-results.json', 13]}


EXPECTED_CHECK_COUNTS = {'world-runtime': 22,
 'hospital-maze': 29,
 'hospital-layout': 14,
 'hospital-cold': 7,
 'ego-health': 6,
 'manual-input': 6,
 'hospital-champions': 10,
 'hospital-migration': 9,
 'brain-and-roofs': 12,
 'world-geometry': 9,
 'camera-motion': 10,
 'opening-refuge': 11,
 'projectile': 13,
 'environment': 17,
 'world-cold': 6,
 'hospital-start-777': 9,
 'legacy-castle-save': 10,
 'legacy-save': 9,
 'native-progression': 12,
 'native-finale': 6,
 'preservation': 4,
 'package': 5,
 'renderer-compositing': 13,
 'legacy-scope': 3,
 'world-combat': 9,
 'hero-presentation': 18,
 'portal-interaction': 17,
 'world-door-visuals': 18,
 'map-perimeter': 14,
 'new-vfx-assets': 13,
 'existing-effects': 14,
 'full-frame-render-replay': 16,
 'final42-source-normalization': 16,
 'final42-atlas-player': 39,
 'new-vfx-runtime': 18,
 'painted-frame-pixels': 8,
 'hospital-settings': 20,
 'final42-native-hooks': 29,
 'refined-static-integration': 15,
 'dynamic-package-deferred': 8,
 'camera-default': 6,
 'door-front-surface': 12,
 'enemy-facing': 6,
 'hero-all-poses': 12,
 'enemy-colors-and-champions': 18,
 'retained-vector-buffers': 16,
 'active-asset-usage': 11,
 'samong-through-ending': 22,
 'campaign-map-admission': 13}
PUBLIC_ATLAS_PATHS = ['assets/final42-r88/effects/081/atlas.png',
 'assets/final42-r88/effects/090/atlas.png',
 'assets/final42-r88/effects/091/atlas.png',
 'assets/final42-r88/effects/092/atlas.png',
 'assets/final42-r88/effects/093/atlas.png',
 'assets/final42-r88/effects/094/atlas.png',
 'assets/final42-r88/effects/095/atlas.png',
 'assets/final42-r88/effects/096/atlas.png',
 'assets/final42-r88/effects/097/atlas.png',
 'assets/final42-r88/effects/098/atlas.png',
 'assets/final42-r88/effects/099/thorn_atlas.png',
 'assets/final42-r88/effects/100/atlas.png',
 'assets/final42-r88/effects/101/atlas.png',
 'assets/final42-r88/effects/110/atlas.png',
 'assets/final42-r88/effects/111/atlas.png',
 'assets/final42-r88/effects/112/atlas.png',
 'assets/final42-r88/effects/113/atlas.png',
 'assets/final42-r88/effects/114/atlas.png',
 'assets/final42-r88/effects/115/atlas.png',
 'assets/final42-r88/effects/116/atlas.png',
 'assets/final42-r88/effects/117/atlas.png',
 'assets/final42-r88/effects/130/atlas.png',
 'assets/final42-r88/effects/131/atlas.png',
 'assets/final42-r88/effects/132/atlas.png',
 'assets/final42-r88/effects/213/poison-impact-atlas-256.png',
 'assets/final42-r88/effects/214/atlas.png',
 'assets/final42-r88/effects/215/atlas.png',
 'assets/final42-r88/effects/217/atlas.png',
 'assets/final42-r88/effects/243/atlas.png',
 'assets/final42-r88/effects/244/atlas.png',
 'assets/final42-r88/effects/245/atlas.png',
 'assets/final42-r88/effects/246/atlas.png',
 'assets/final42-r88/effects/247/atlas.png',
 'assets/final42-r88/effects/248/atlas.png',
 'assets/final42-r88/effects/249/atlas.png',
 'assets/final42-r88/effects/250/atlas.png',
 'assets/final42-r88/effects/251/atlas.png',
 'assets/final42-r88/effects/254/atlas.png',
 'assets/final42-r88/effects/259/atlas.png',
 'assets/final42-r88/effects/260/atlas.png',
 'assets/final42-r88/effects/261/atlas.png',
 'assets/final42-r88/effects/262/atlas.png']

def fail(message):
    raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def sha(path):
    return digest(Path(path).read_bytes())


def integer(value, minimum=0):
    return isinstance(value, int) and not isinstance(value, bool) and value >= minimum


def hexadecimal(value, length=64):
    return isinstance(value, str) and re.fullmatch('[0-9a-f]{' + str(length) + '}', value) is not None


def relative(name):
    if not isinstance(name, str) or not name or '\\' in name or '\x00' in name or ':' in name:
        fail('Unsafe relative path')
    p = PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or p.as_posix() != name or name == '.':
        fail('Unsafe relative path: ' + name)
    return p


def regular(base, name):
    rel = relative(name)
    base = Path(base)
    if base.is_symlink():
        fail('Symlink root is forbidden')
    target = base.joinpath(*rel.parts)
    for part in [target, *target.parents]:
        if part == base.parent:
            break
        if part.is_symlink():
            fail('Symlink is forbidden: ' + name)
    if not target.is_file():
        fail('Missing regular file: ' + name)
    return target


def git(repo, *args):
    return subprocess.check_output(['git', '-c', 'protocol.allow=never', *args], cwd=repo)


def head(repo=ROOT):
    return git(repo, 'rev-parse', 'HEAD').decode().strip()


def validate_contract(approval):
    if approval.get('schema') != 'storyworld.hospital-r88-runtime-approval/v1':
        fail('Unknown R88 approval schema')
    if approval.get('status') not in {'pending-review', 'approved'}:
        fail('Unknown R88 approval status')
    for key, value in CONTRACT.items():
        if approval.get(key) != value:
            fail('Immutable R88 contract differs: ' + key)


def validate_source(approval, repo=ROOT, event=None):
    if approval.get('status') != 'approved':
        fail('R88 source is not approved; refusing release')
    source = approval.get('candidateSource', {})
    reviewed, pr = source.get('headSha'), source.get('pullRequest')
    if not hexadecimal(reviewed, 40) or not integer(pr, 1):
        fail('Actual reviewed source HEAD and PR required')
    workflow = source.get('workflowRunId')
    if workflow is not None and not integer(workflow, 1):
        fail('Actual workflow run ID must be positive or null')
    if event is not None and event.get('number', event.get('pull_request', {}).get('number')) != pr:
        fail('R88 approval belongs to another PR')
    ancestor = subprocess.run(['git', '-c', 'protocol.allow=never', 'merge-base', '--is-ancestor', reviewed, 'HEAD'], cwd=repo, capture_output=True)
    if ancestor.returncode:
        fail('Reviewed R88 source is not an ancestor of checkout')
    changed = git(repo, 'diff', '--name-only', '--no-renames', reviewed + '..HEAD').decode().splitlines()
    if any(path != APPROVAL_PATH for path in changed):
        fail('Unreviewed changes after R88 source pin: ' + ', '.join(changed))
    if subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--'], cwd=repo).returncode:
        fail('Dirty tracked source checkout')
    if git(repo, 'ls-files', '--others', '--exclude-standard').strip():
        fail('Untracked source checkout')
    if source.get('evidenceFile') != EVIDENCE_PATH or not hexadecimal(source.get('evidenceSHA256')):
        fail('Exact R88 source evidence path and SHA256 required')
    path = regular(repo, EVIDENCE_PATH)
    if sha(path) != source['evidenceSHA256']:
        fail('Reviewed R88 evidence missing or changed')
    try:
        reviewed_bytes = git(repo, 'show', reviewed + ':' + EVIDENCE_PATH)
    except subprocess.CalledProcessError:
        fail('Reviewed source has no R88 execution evidence')
    if digest(reviewed_bytes) != source['evidenceSHA256']:
        fail('Source pin and R88 evidence differ')
    evidence = json.loads(reviewed_bytes)
    runs = evidence.get('runs', [])
    if evidence.get('schema') != 'r88-final-frozen-suite/v1' or evidence.get('passed') is not True or evidence.get('sourceUnchangedDuringRun') is not True or evidence.get('groups') != 49 or evidence.get('passedChecks') != 640 or evidence.get('totalChecks') != 640 or len(runs) != len(EXPECTED_RUNS) or len({r.get('name') for r in runs}) != len(runs):
        fail('Reviewed source evidence is not the complete frozen R88 suite')
    bindings = {}
    for row in runs:
        spec = EXPECTED_RUNS.get(row.get('name'))
        if spec is None or row.get('script') != spec[0] or not hexadecimal(row.get('scriptSHA256')):
            fail('Reviewed evidence has an unknown CPU source binding')
        bindings['release/r88/' + row['script']] = row['scriptSHA256']
    # Also require the executable gate and runner to actually belong to the pin,
    # including when an inherited .gitignore pattern would hide nested qa/.
    for name in ['scripts/hospital-r88-release-gate.py', 'release/r88/qa/r88/run-suite.cjs']:
        bindings[name] = sha(regular(repo, name))
    for name, expected in bindings.items():
        try:
            pinned = git(repo, 'show', reviewed + ':' + name)
        except subprocess.CalledProcessError:
            fail('Required execution source is absent from R88 pin: ' + name)
        if digest(pinned) != expected or sha(regular(repo, name)) != expected:
            fail('Reviewed CPU source and evidence differ: ' + name)
    return source


def validate_artifact(site, approval):
    site = Path(site)
    manifest_path = regular(site, 'web-manifest-r62.json')
    if sha(manifest_path) != approval.get('manifestSHA256'):
        fail('Immutable R88 manifest pin differs')
    manifest = json.loads(manifest_path.read_text())
    rows = manifest.get('files')
    if not isinstance(rows, list) or len(rows) != approval.get('fileCount'):
        fail('Unexpected R88 file count')
    paths, total = set(), 0
    actual = {'web-manifest-r62.json': sha(manifest_path)}
    for row in rows:
        if not isinstance(row, dict):
            fail('Malformed R88 manifest row')
        name = row.get('path')
        relative(name)
        if name in paths or name == 'web-manifest-r62.json':
            fail('Duplicate or self-referential manifest path')
        paths.add(name)
        if not integer(row.get('bytes')) or not hexadecimal(row.get('sha256')):
            fail('Malformed file size or SHA256: ' + name)
        path = regular(site, name)
        value = sha(path)
        if path.stat().st_size != row['bytes'] or value != row['sha256']:
            fail('Artifact bytes disagree with manifest: ' + name)
        actual[name] = value
        total += row['bytes']
    discovered = set()
    for path in site.rglob('*'):
        if path.is_symlink():
            fail('Symlink in staged site')
        if path.is_file():
            discovered.add(path.relative_to(site).as_posix())
    if discovered != paths | {'web-manifest-r62.json'}:
        fail('Missing or unmanifested staged file')
    if manifest.get('fileCount') != len(rows) or manifest.get('totalBytes') != total:
        fail('R88 manifest totals differ')
    if manifest.get('largest') != sorted(rows, key=lambda r: r['bytes'], reverse=True)[:20]:
        fail('R88 largest-file table differs')
    expected = approval.get('expectedRuntime')
    if not isinstance(expected, dict) or set(expected) != {'index.html', 'dist/phase1.js'}:
        fail('Both R88 runtime hashes must be pinned')
    if {name: actual.get(name) for name in expected} != expected:
        fail('R88 runtime pin differs')
    if manifest.get('webHTMLSha256') != actual.get('index.html'):
        fail('Stale R88 HTML manifest hash')
    r88 = manifest.get('r88', {})
    if r88.get('saveNamespace') != PREFIX or approval.get('storagePrefix') != PREFIX:
        fail('R88 test namespace differs')
    if r88.get('paintedEffectCount') != 42 or r88.get('storedPaintedFrames') != 680 or r88.get('runtimeAtlasCount') != 42 or r88.get('legacyProcedural80Loaded') is not False or r88.get('prior3MedicalRootEffectsSingleOwner') is not True:
        fail('R88 painted/deferred effect scope differs')
    return {'runtimeHashes': expected, 'manifestSHA256': actual['web-manifest-r62.json'], 'sourceHashes': actual, 'manifest': manifest}


def timestamp(value):
    try:
        parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
        if parsed.tzinfo is None:
            raise ValueError('timezone missing')
        return parsed.timestamp()
    except (ValueError, TypeError, AttributeError):
        fail('Invalid UTC timestamp')


def validate_preflight(verified, repo=ROOT, now=None):
    repo = Path(repo)
    out = repo / 'out/hospital-r88'
    preflight_path = regular(out, 'preflight.json')
    pre = json.loads(preflight_path.read_text())
    if pre.get('schema') != 'storyworld.hospital-r88-preflight/v1' or pre.get('sourceCommit') != head(repo):
        fail('Fresh CPU preflight belongs to another source checkout')
    if pre.get('freshResults') is not True or pre.get('executedCommand') != ['node', 'qa/r88/run-suite.cjs'] or pre.get('reportPath') != REPORT_PATH:
        fail('Fresh R88 CPU execution receipt required')
    report_path = regular(repo, REPORT_PATH)
    if not hexadecimal(pre.get('reportSHA256')) or sha(report_path) != pre['reportSHA256']:
        fail('Fresh CPU report SHA256 differs')
    report = json.loads(report_path.read_text())
    start, finish = timestamp(pre.get('startedAt')), timestamp(pre.get('finishedAt'))
    rs, rf = timestamp(report.get('startedAt')), timestamp(report.get('completedAt'))
    current = datetime.now(timezone.utc).timestamp() if now is None else now
    if not start <= rs <= rf <= finish or finish > current + 300 or current - finish > 21600:
        fail('Stale or inconsistent R88 CPU execution times')
    if report_path.stat().st_mtime + 2 < start:
        fail('CPU report was not freshly written')
    if report.get('schema') != 'r88-final-frozen-suite/v1' or report.get('passed') is not True or report.get('sourceUnchangedDuringRun') is not True or report.get('changedFiles') != []:
        fail('R88 CPU suite failed or runtime changed during verification')
    if report.get('groups') != 49 or report.get('passedChecks') != 640 or report.get('totalChecks') != 640:
        fail('Incomplete R88 CPU suite')
    if report.get('sourceHashes') != verified['sourceHashes']:
        fail('CPU evidence and staged artifact bytes differ')
    if any(report.get(key) is not False for key in ['browserVerified', 'GPUVerified', 'naturalPlayVerified']):
        fail('CPU report misrepresents browser/GPU/natural-play evidence')
    runs = report.get('runs')
    if not isinstance(runs, list) or len(runs) != len(EXPECTED_RUNS) or len({r.get('name') for r in runs}) != len(runs):
        fail('Missing or duplicate R88 CPU groups')
    verification = repo / 'out/hospital-r88/verification'
    source = repo / 'release/r88'
    counted = 0
    for row in runs:
        spec = EXPECTED_RUNS.get(row.get('name'))
        if spec is None or row.get('script') != spec[0] or row.get('report') != spec[1] or row.get('minimumChecks') != spec[2]:
            fail('Unknown or altered R88 CPU group')
        script = regular(verification, row['script'])
        reviewed_script = regular(source, row['script'])
        if row.get('scriptSHA256') != sha(script) or sha(script) != sha(reviewed_script):
            fail('CPU script differs from reviewed source: ' + row['script'])
        if row.get('passed') is not True or row.get('exitCode') != 0 or row.get('signal') is not None or row.get('checks') != row.get('passedChecks') or row.get('checks') != EXPECTED_CHECK_COUNTS[row['name']] or not integer(row.get('checks'), spec[2]):
            fail('R88 CPU group failed: ' + row['name'])
        result_path = regular(verification, row['report'])
        if result_path.stat().st_mtime + 2 < start:
            fail('CPU group report was not freshly written')
        result = json.loads(result_path.read_text())
        checks = result.get('checks')
        if result.get('failure') or result.get('integrationFixture') is True or not isinstance(checks, list) or len(checks) != row['checks'] or any(c.get('passed') is not True for c in checks):
            fail('Fresh CPU group result differs: ' + row['name'])
        counted += len(checks)
    if counted != 640:
        fail('CPU check total differs')
    return {'reportSHA256': pre['reportSHA256'], 'passedChecks': counted, 'groups': len(runs), 'sourceCommit': pre['sourceCommit']}


def emit_outputs(verified, source, preflight, destination=None):
    assets = {row['path']: row['sha256'] for row in verified['manifest']['files'] if row['path'] in PUBLIC_ATLAS_PATHS}
    if set(assets) != set(PUBLIC_ATLAS_PATHS) or len(assets) != 42:
        fail('All42 painted atlas PNGs must be publicly verified')
    values = {'html_sha': verified['runtimeHashes']['index.html'], 'renderer_sha': verified['runtimeHashes']['dist/phase1.js'], 'manifest_sha': verified['manifestSHA256'], 'asset_hashes_json': json.dumps(assets, sort_keys=True, separators=(',', ':'))}
    if destination:
        with open(destination, 'a') as stream:
            for key, value in values.items():
                stream.write(key + '=' + value + '\n')
    return values


def validate_context(approval, event=None, ref=None):
    if approval.get('status') != 'approved' and (event is None or ref == 'refs/heads/main'):
        fail('R88 approval is pending; refusing public release')


def main():
    approval = json.loads(regular(ROOT, APPROVAL_PATH).read_text())
    validate_contract(approval)
    event = None
    if os.environ.get('GITHUB_EVENT_NAME') == 'pull_request':
        event = json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text())
    validate_context(approval, event, os.environ.get('GITHUB_REF'))
    verified = validate_artifact(ROOT / 'out/hospital-r88/site', approval)
    preflight = validate_preflight(verified)
    if approval['status'] != 'approved':
        print(json.dumps({'status': 'R88_MEASURED_PENDING_REVIEW', 'commit': head(), **preflight, 'releaseOutputsEmitted': False, 'browserVerified': False, 'GPUVerified': False}))
        return
    source = validate_source(approval, event=event)
    if os.environ.get('GITHUB_SHA', head()) != head():
        fail('R88 checkout and CI source commit differ')
    values = emit_outputs(verified, source, preflight, os.environ.get('GITHUB_OUTPUT'))
    print(json.dumps({'status': 'HOSPITAL_R88_RELEASE_PIN_PASSED', 'commit': head(), 'reviewedSourceCommit': source['headSha'], 'reviewedPullRequest': source['pullRequest'], **preflight, **values, 'browserVerified': False, 'GPUVerified': False, 'naturalPlayVerified': False}))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, OSError, TypeError, subprocess.CalledProcessError) as error:
        raise SystemExit('R88 release refused: ' + str(error))
