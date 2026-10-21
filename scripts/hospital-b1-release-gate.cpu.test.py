"""Real helper CPU checks; approved records exist only in disposable fixtures."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'out/hospital-b1/build-connected'
spec = importlib.util.spec_from_file_location('gate', ROOT / 'scripts/hospital-b1-release-gate.py')
gate = importlib.util.module_from_spec(spec); spec.loader.exec_module(gate)
approval = json.loads((ROOT / 'scripts/hospital-b1-approved-runtime.json').read_text())
m = json.loads((OUT / 'site/web-manifest-r62.json').read_text())
cases = []


def check(name, fn):
    fn(); cases.append({'name': name, 'ok': True})


def refuses(fn, text):
    try: fn()
    except ValueError as error: assert text in str(error), str(error)
    else: raise AssertionError('Expected refusal: ' + text)


verified = gate.validate_artifact(OUT / 'site', approval)
check('real final B artifact validates independently of release approval', lambda: None)
pending = copy.deepcopy(approval); pending['status'] = 'review-required'
check('explicit review-required fixture refuses release regardless of production status', lambda: refuses(lambda: gate.validate_source(pending), 'not approved'))
bad = copy.deepcopy(approval); bad['expectedRuntime']['index.html'] = '0' * 64
check('different final HTML refuses artifact', lambda: refuses(lambda: gate.validate_artifact(OUT / 'site', bad), 'runtime differs'))
badm = copy.deepcopy(m); badm['hospitalB1Test']['buildSourceCommit'] = ''
check('full build checkout source stamp is required', lambda: refuses(lambda: gate.validate_artifact(OUT / 'site', approval, badm), 'checkout commit missing'))
badm = copy.deepcopy(m); badm['hospitalB1Test']['sourceTreeDirty'] = True
check('dirty build cannot be released', lambda: refuses(lambda: gate.validate_artifact(OUT / 'site', approval, badm), 'dirty/uncommitted'))
badm = copy.deepcopy(m); badm['hospitalB1Test']['storagePrefix'] = 'original-save:'
check('original/test save domain mix refuses artifact', lambda: refuses(lambda: gate.validate_artifact(OUT / 'site', approval, badm), 'storagePrefix'))
badm = copy.deepcopy(m); badm['files'][10]['sha256'] = '0' * 64
check('changed original asset table refuses artifact', lambda: refuses(lambda: gate.validate_artifact(OUT / 'site', approval, badm), 'asset/file table'))
badm = copy.deepcopy(m); badm['releaseR77']['runtimeHashes']['index.html'] = '0' * 64
check('original R77 runtime contract cannot be overwritten', lambda: refuses(lambda: gate.validate_artifact(OUT / 'site', approval, badm), 'R77 runtime contract'))

with tempfile.TemporaryDirectory(prefix='source-gate-', dir=OUT) as folder:
    repo = Path(folder)
    def git(*args): return subprocess.check_output(['git', '-c', 'user.name=CPU fixture', '-c', 'user.email=fixture@invalid', *args], cwd=repo, text=True, stderr=subprocess.DEVNULL).strip()
    git('init', '-q')
    for path in gate.EVIDENCE_SOURCE_PATHS:
        p=repo/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('fixture original\n')
    changed_source=repo/gate.EVIDENCE_SOURCE_PATHS[0]
    evidence = repo / 'docs/hospital-b1-evidence/clean-checkout-results.json'; evidence.parent.mkdir(parents=True, exist_ok=True)
    evidence.write_text(json.dumps({'sourcePathHashes': {p:gate.sha((repo/p).read_bytes()) for p in gate.EVIDENCE_SOURCE_PATHS}}))
    git('add', '.'); git('commit', '-qm', 'disposable reviewed source')
    record = copy.deepcopy(approval); record['status'] = 'approved'
    record['candidateSource'].update(pullRequest=999, headSha=git('rev-parse', 'HEAD'), evidenceSHA256=gate.sha(evidence.read_bytes()))
    check('disposable full-source/evidence fixture accepts matching PR', lambda: gate.validate_source(record, repo, {'number': 999}))
    def approved_fixture_negative():
        before = copy.deepcopy(record)
        negative = copy.deepcopy(record); negative['status'] = 'review-required'
        refuses(lambda: gate.validate_source(negative, repo, {'number': 999}), 'not approved')
        assert record == before and record['status'] == 'approved'
        gate.validate_source(record, repo, {'number': 999})
    check('negative fixture copied from approved input refuses without changing approved source', approved_fixture_negative)
    check('a different PR cannot reuse source approval', lambda: refuses(lambda: gate.validate_source(record, repo, {'number': 998}), 'another PR'))
    changed_source.write_text('fixture changed\n')
    check('dirty tracked source refuses approval', lambda: refuses(lambda: gate.validate_source(record, repo), 'Dirty source'))
    changed_source.write_text('fixture original\n')
    for name in ['hospital-b1-approved-runtime.json', 'r77-approved-runtime.json']:
        p=repo/'scripts'/name;p.parent.mkdir(exist_ok=True);p.write_text('{}\n')
        git('add','.');git('commit','-qm','disposable exact approval metadata')
    check('only the two exact approval-record changes may follow reviewed source',lambda:gate.validate_source(record,repo,{'number':999}))
    (repo / 'runtime.js').write_text('new code\n'); git('add', '.'); git('commit', '-qm', 'disposable unreviewed runtime')
    check('new code after review pin refuses approval', lambda: refuses(lambda: gate.validate_source(record, repo), 'Unreviewed changes'))

fixture_approved = copy.deepcopy(approval); fixture_approved['status'] = 'approved'; fixture_approved['candidateSource'].update(headSha='1' * 40, pullRequest=999)
with tempfile.TemporaryDirectory(prefix='stamp-',dir=OUT) as folder:
    p=Path(folder)/'web-manifest-r62.json';p.write_text(json.dumps(m))
    emitted=gate.stamp_file(p,fixture_approved,verified)
    assert emitted==hashlib.sha256(p.read_bytes()).hexdigest()
    roundtrip=json.loads(p.read_text())
assert roundtrip['releaseHospitalB1']['buildSourceCommit'] == m['hospitalB1Test']['buildSourceCommit']
assert roundtrip['releaseHospitalB1']['reviewedSourceCommit'] != roundtrip['releaseHospitalB1']['buildSourceCommit']
assert roundtrip['releaseR77'] == m['releaseR77']
check('release stamp separates reviewed full source and actual build; R77 unchanged', lambda: None)
report = {'schema': 'm0.hospital.release-gate-cpu/v1', 'cases': cases, 'passed': len(cases), 'failed': 0, 'approvedDataOnlyInDisposableFixtures': True, 'productionApprovalStatus': approval['status'], 'artifactManifestUnchanged': json.loads((OUT / 'site/web-manifest-r62.json').read_text()) == m, 'browserOrGPU': False}
(OUT / 'release-gate-tests.json').write_text(json.dumps(report, indent=2) + '\n'); print(json.dumps(report))
