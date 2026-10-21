"""CPU build-chain checks only; original gate/asset files are read-only."""
import contextlib
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import tempfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'out/hospital-b1/build-connected'
def sha(b): return hashlib.sha256(b).hexdigest()
def load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), ROOT / 'scripts' / (name + '.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
builder = load('build-hospital-b1')
manifest = json.loads((ROOT / '_pages/docs/web-manifest-r62.json').read_text())
protected = [ROOT / p for p in ['_pages/docs/index.html', '_pages/docs/dist/phase1.js', 'scripts/apply-r75.py', 'scripts/apply-r76.py', 'scripts/apply-r77.py', 'scripts/r77-release-gate.py']]
before = {str(p): sha(p.read_bytes()) for p in protected}
rows = []
with tempfile.TemporaryDirectory(prefix='lineage-', dir=OUT) as tmp:
    tmp = Path(tmp); site = tmp / 'site'; (site / 'dist').mkdir(parents=True)
    for rel in ['index.html', 'dist/phase1.js', 'web-manifest-r62.json']:
        shutil.copyfile(ROOT / '_r74-reference/docs' / rel, site / rel)
    snapshots = {}
    load('apply-r75').build(site)
    snapshots['R75'] = {p: sha((site / p).read_bytes()) for p in builder.BASE}
    prior = Path.cwd()
    try:
        os.chdir(tmp)
        load('apply-r76').build(site)
    finally:
        os.chdir(prior)
    snapshots['R76'] = {p: sha((site / p).read_bytes()) for p in builder.BASE}
    r77 = load('apply-r77'); r77.ROOT = tmp
    for rel in ['scripts/r76-approved-runtime.json', 'client-source/guide-r77.js']:
        p = tmp / rel; p.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(ROOT / rel, p)
    r77.build(site)
    snapshots['R77'] = {p: sha((site / p).read_bytes()) for p in builder.BASE}
    for stage in ['R75', 'R76', 'R77']:
        assert snapshots[stage] == manifest['release' + stage]['runtimeHashes']
    rows.append({'name': 'actual R75/R76/R77 overlay builders reproduce preserved runtime hashes from R74 input', 'ok': True, 'snapshots': snapshots, 'method': 'R74 runtime/manifest inputs only; original overlay functions; scratch side outputs; no original gate or browser execution'})
    payload, result = builder.compose((site / 'index.html').read_bytes(), (site / 'dist/phase1.js').read_bytes(), manifest)
    actual = {p: sha(data) for p, data in payload.items()}
    final = json.loads((OUT / 'build.json').read_text())
    assert actual == final['runtimeHashes']
    rows.append({'name': 'hospital builder runs after R77 and matches final artifact; renderer not lost', 'ok': True, 'runtimeHashes': actual})
    for p, data in payload.items(): (site / p).write_bytes(data)
    previous = {p: sha((site / p).read_bytes()) for p in payload}
    try: r77.build(site)
    except RuntimeError: pass
    else: raise AssertionError('late R77 replay should reject hospital bytes')
    assert previous == {p: sha((site / p).read_bytes()) for p in payload}
    rows.append({'name': 'wrong overlay order rejects without overwriting hospital candidate', 'ok': True})
    p2, m2 = builder.compose((ROOT / '_pages/docs/index.html').read_bytes(), (ROOT / '_pages/docs/dist/phase1.js').read_bytes(), manifest)
    assert p2 == payload and m2 == result
    rows.append({'name': 'composition and cache key are deterministic', 'ok': True, 'cacheKey': result['hospitalB1Test']['rendererCacheKey']})
    try: builder.compose(b'wrong', b'wrong', manifest)
    except ValueError: pass
    else: raise AssertionError('wrong baseline admitted')
    rows.append({'name': 'unapproved baseline refuses build', 'ok': True})

m = json.loads((OUT / 'site/web-manifest-r62.json').read_text())
for row in m['files']:
    p = OUT / 'site' / row['path']; assert p.stat().st_size == row['bytes'] and sha(p.read_bytes()) == row['sha256'], row['path']
assert m['totalBytes'] == sum(r['bytes'] for r in m['files'])
assert m['largest'] == sorted(m['files'], key=lambda r: r['bytes'], reverse=True)[:20]
rows.append({'name': 'final full manifest, original assets and size summaries match', 'ok': True, 'files': len(m['files'])})
entry = (ROOT / 'scripts/build-hospital-b1-release.sh').read_text()
commands = [l for l in entry.splitlines() if l and not l.startswith('#') and not l.startswith('set ')]
assert commands == ['bash scripts/build-r75-site.sh', 'python3 scripts/r75-release-gate.py', 'python3 scripts/apply-r76.py --site _pages/docs', 'python3 scripts/r76-release-gate.py', 'python3 scripts/apply-r77.py --site _pages/docs', 'python3 scripts/r77-release-gate.py', 'python3 scripts/build-hospital-b1.py', 'python3 scripts/prepare-hospital-b1-cpu.py', 'python3 scripts/run-hospital-b1-cpu.py', 'python3 scripts/hospital-b1-release-gate.py', 'node verify-pages-r62.mjs out/hospital-b1-static']
rows.append({'name': 'manual release entry keeps all original gates and hospital overlay last', 'ok': True, 'method': 'shell entry order assertion; full release entry not executed'})
after = {str(p): sha(p.read_bytes()) for p in protected}; assert before == after
report = {'schema': 'm0.hospital.build-chain-cpu/v1', 'cases': rows, 'passed': len(rows), 'failed': 0, 'originalInputsAndEvidenceUnchanged': True, 'browserOrGPU': False}
(OUT / 'build-chain-results.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
