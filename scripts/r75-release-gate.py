#!/usr/bin/env python3
"""Bind the reviewed R75 bytes to Pages after all preserved release gates."""
import hashlib
import json
import os
from pathlib import Path

root = Path('_pages/docs')
approval = json.loads(Path('scripts/r75-approved-runtime.json').read_text())
prior = json.loads(Path('scripts/r74-approved-runtime.json').read_text())
baseline = {
    'index.html': 'f4e26c35c9ade6cc44b3935c5d6e461fb9f5fe1ac9a831d1f0ed085dd7e8cddb',
    'dist/phase1.js': 'e9faecbadc4991d2e4cfd8a5ec8555ad331d4a09e6ffc12b7ef9d1ed1e9a09bc',
}
if approval.get('baselineR74') != baseline or prior.get('approved') != baseline or prior.get('status') != 'approved':
    raise SystemExit('R75 baseline differs from the preserved approved R74 release')
actual = {name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in baseline}
art = json.loads(Path('client-source/art-r75.json').read_text())
descriptors = [art, art['npcs'], *art['npcs'].get('extraAtlases', [])]
assets = {a['path']: hashlib.sha256((root / a['path']).read_bytes()).hexdigest() for a in descriptors}
if assets != {a['path']: a['sha256'] for a in descriptors}:
    raise SystemExit('R75 generated image hashes differ from their descriptors')
status = approval.get('status')
if status == 'approved':
    if actual != approval.get('approved') or assets != approval.get('approvedAssets'):
        raise SystemExit('R75 runtime or generated images differ from the exact release pin')
elif status == 'pending-review':
    if os.environ.get('GITHUB_REF') == 'refs/heads/main' and os.environ.get('GITHUB_EVENT_NAME') != 'pull_request':
        raise SystemExit('R75 review is pending; refusing public Pages deployment')
else:
    raise SystemExit('Unknown R75 release status')
manifest_path = root / 'web-manifest-r62.json'
manifest = json.loads(manifest_path.read_text())
source = hashlib.sha256(Path('story-source/hapil-story-20261019.txt').read_bytes()).hexdigest()
if source != approval.get('sourceSha256') or manifest.get('r75', {}).get('sourceSha256') != source:
    raise SystemExit('R75 source ownership differs from the approved narrative')
expected = {**actual, **assets}
for name, digest in expected.items():
    rows = [r for r in manifest['files'] if r['path'] == name]
    if len(rows) != 1 or rows[0]['sha256'] != digest or rows[0]['bytes'] != (root / name).stat().st_size:
        raise SystemExit('R75 strict manifest disagrees with release bytes: ' + name)
manifest['releaseR75'] = {
    'sourceCommit': os.environ.get('GITHUB_SHA', 'working-tree'),
    'runtimeHashes': actual, 'generatedAssets': assets,
    'sourceSha256': source, 'status': status, 'audioApplied': False,
}
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
if os.environ.get('GITHUB_OUTPUT'):
    with open(os.environ['GITHUB_OUTPUT'], 'a') as stream:
        stream.write('html_sha=' + actual['index.html'] + '\nrenderer_sha=' + actual['dist/phase1.js'] + '\nasset_hashes_json=' + json.dumps(assets, separators=(',', ':')) + '\n')
        stream.write('manifest_sha=' + hashlib.sha256(manifest_path.read_bytes()).hexdigest() + '\n')
print(json.dumps(manifest['releaseR75']))
