"""Read-only workflow/source-contract checks, not a GitHub Actions execution."""
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'out/hospital-b1/build-connected'
original = subprocess.check_output(['git', 'show', 'f415dfbf783c6290ab99125193d800429799c9f9:.github/workflows/pages.yml'], cwd=ROOT, text=True)
current = (ROOT / '.github/workflows/pages.yml').read_text()
cases = []
def check(name, fn): fn(); cases.append({'name': name, 'ok': True})
def same(a, b): assert a == b
def block(text, job):
    m = re.search(r'^  ' + re.escape(job) + r':\n([\s\S]*?)(?=^  [a-zA-Z0-9_-]+:\n|\Z)', text, re.M)
    assert m; return m.group(0)
release, deploy = block(current, 'release'), block(current, 'deploy')
check('original event triggers and concurrency remain unchanged', lambda: same(current.split('jobs:')[0], original.split('jobs:')[0]))
jobs = re.findall(r'^  ([a-zA-Z0-9_-]+):$', original.split('jobs:', 1)[1], re.M)
check('all original required jobs remain', lambda: same(re.findall(r'^  ([a-zA-Z0-9_-]+):$', current.split('jobs:', 1)[1], re.M), jobs))
for job in jobs:
    a, b = block(original, job), block(current, job)
    permissions = lambda text: re.findall(r'^    permissions:\n(?:^      .*\n)*', text, re.M)
    assert permissions(a) == permissions(b)
check('all existing job permission blocks remain unchanged', lambda: None)
condition = "github.event_name != 'pull_request' && github.ref == 'refs/heads/main'"
assert current.count(condition) == original.count(condition) == 3
assert condition in deploy and condition in release
check('main-only configure/upload/deploy restrictions remain', lambda: None)
for key in ['html_sha', 'renderer_sha', 'asset_hashes_json', 'manifest_sha']:
    assert key + ': ${{ steps.hospital.outputs.' + key + ' }}' in release
    assert '${{ needs.release.outputs.' + key + ' }}' in deploy
assert 'path: out/hospital-b3/site' in release
order = ['python3 scripts/r75-release-gate.py', 'python3 scripts/r76-release-gate.py', 'python3 scripts/r77-release-gate.py', 'python3 scripts/build-hospital-b1.py', 'python3 scripts/prepare-hospital-b1-cpu.py', 'python3 scripts/run-hospital-b1-cpu.py', 'python3 scripts/hospital-b1-release-gate.py', 'node verify-pages-r62.mjs out/hospital-b1-static', 'python3 scripts/build-hospital-b2.py', 'python3 scripts/run-hospital-b2-cpu.py', 'python3 scripts/hospital-b2-release-gate.py', 'node verify-pages-r62.mjs out/hospital-b2-static', 'python3 scripts/build-hospital-b3.py', 'python3 scripts/hospital-b3-release-gate.py', 'node verify-pages-r62.mjs out/hospital-b3-static', 'uses: actions/upload-pages-artifact@v4']
positions = [release.index(s) for s in order]; assert positions == sorted(positions)
assert 'HOSPITAL_B3_PUBLIC_RELEASE_VERIFIED' in deploy
check('final B upload, outputs, manifest stamp and public comparison form one path', lambda: None)
base_approval = json.loads(subprocess.check_output(['git', 'show', 'f415dfbf783c6290ab99125193d800429799c9f9:scripts/r77-approved-runtime.json'], cwd=ROOT, text=True))
approval = json.loads((ROOT / 'scripts/r77-approved-runtime.json').read_text())
assert {k:v for k,v in base_approval.items() if k!='candidateSource'} == {k:v for k,v in approval.items() if k!='candidateSource'}
for path in ['scripts/r75-release-gate.py', 'scripts/r76-release-gate.py', 'scripts/r77-release-gate.py']:
    assert (ROOT/path).read_bytes() == subprocess.check_output(['git', 'show', 'f415dfbf783c6290ab99125193d800429799c9f9:'+path], cwd=ROOT)
if approval['candidateSource'] == base_approval['candidateSource']:
    path=ROOT/'_pages/docs/web-manifest-r62.json'; before=hashlib.sha256(path.read_bytes()).hexdigest()
    result=subprocess.run(['python3','scripts/r77-release-gate.py'],cwd=ROOT,capture_output=True,text=True)
    assert result.returncode != 0 and 'Runtime-producing changes were made after' in result.stderr+result.stdout
    assert hashlib.sha256(path.read_bytes()).hexdigest()==before
    detail='actual old-pin refusal executed; baseline manifest unchanged'
else:
    assert isinstance(approval['candidateSource'].get('pullRequest'),int) and re.fullmatch('[0-9a-f]{40}',approval['candidateSource'].get('headSha',''))
    detail='renewed exact source record supplied; original gate must already pass in release job'
check('R77 runtime contract and unchanged gate enforce reviewed source, without allowlist widening', lambda: None)
report={'schema':'m0.hospital.workflow-wiring-cpu/v1','cases':cases,'passed':len(cases),'failed':0,'sourceGateDetail':detail,'GitHubActionsRun':False,'browserExecuted':False,'permissionsChanged':False}
(OUT/'workflow-wiring-results.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
