#!/usr/bin/env python3
"""Retain prior release pins and bind R74 runtime plus new images exactly."""
import hashlib
import json
import os
from pathlib import Path

root = Path('_pages/docs')
approval = json.loads(Path('scripts/r74-approved-runtime.json').read_text())
baseline = {
    'index.html': '9b484eaecc4a4dc2d2e6e5140471c0403f933b1b003f3a46b65db8d2766a8d62',
    'dist/phase1.js': '913ac7a97a4166772cb8885a62d96687b44d5b5b9ff5da1387f096415e67e471',
}
prior = json.loads(Path('scripts/r73-approved-runtime.json').read_text())
if approval.get('baselineR73') != baseline or prior.get('approved') != baseline or prior.get('status') != 'approved':
    raise SystemExit('R74 baseline differs from the preserved approved R73 release')
actual = {name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in baseline}
art = json.loads(Path('client-source/art-r74.json').read_text())
assets = {a['path']: hashlib.sha256((root / a['path']).read_bytes()).hexdigest() for a in art['atlases'].values()}
if assets != {a['path']: a['sha256'] for a in art['atlases'].values()}:
    raise SystemExit('R74 generated image hashes differ from their descriptors')
status = approval.get('status')
if status == 'approved':
    if actual != approval.get('approved') or assets != approval.get('approvedAssets'):
        raise SystemExit('R74 runtime or generated images differ from the exact release pin: ' + json.dumps(actual))
elif status == 'pending-review':
    if os.environ.get('GITHUB_REF') == 'refs/heads/main' and os.environ.get('GITHUB_EVENT_NAME') != 'pull_request':
        raise SystemExit('R74 review is pending; refusing public Pages deployment')
else:
    raise SystemExit('Unknown R74 release status')
manifest_path = root / 'web-manifest-r62.json'
manifest = json.loads(manifest_path.read_text())
manifest['releaseR74'] = {'sourceCommit': os.environ.get('GITHUB_SHA', 'working-tree'), 'runtimeHashes': actual, 'generatedAssets': assets, 'status': status}
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
if os.environ.get('GITHUB_OUTPUT'):
    with open(os.environ['GITHUB_OUTPUT'], 'a') as stream:
        stream.write('html_sha=' + actual['index.html'] + '\nrenderer_sha=' + actual['dist/phase1.js'] + '\nasset_hashes_json=' + json.dumps(assets, separators=(',', ':')) + '\n')
print(json.dumps({'status': status, 'sourceCommit': os.environ.get('GITHUB_SHA', 'working-tree'), 'runtimeHashes': actual, 'generatedAssets': assets}))
