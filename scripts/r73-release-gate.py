#!/usr/bin/env python3
"""Keep R71 approval intact and require a separate exact R73 release pin."""
import hashlib
import json
import os
from pathlib import Path

root = Path('_pages/docs')
approval = json.loads(Path('scripts/r73-approved-runtime.json').read_text())
expected = {
    'baselineR71': {'index.html': 'de6536bca2f3860c7195b39e4f7d1397ff8db7acb1558015f14a95c1b4e16646', 'dist/phase1.js': '54dfe20af282d237511ef6f4bb6be3fe54880ad61d82928b0114d15f58df725c'},
    'baselineR72': {'index.html': '73e0be074333bd46bcee52bbb50f37187f6d19c4aa365deaf49096a0aeb5fc18', 'dist/phase1.js': '54dfe20af282d237511ef6f4bb6be3fe54880ad61d82928b0114d15f58df725c'},
}
for key, value in expected.items():
    if approval.get(key) != value:
        raise SystemExit('Unexpected R73 baseline approval lineage: ' + key)
actual = {name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in ('index.html', 'dist/phase1.js')}
if approval.get('status') == 'approved':
    if approval.get('approved') != actual:
        raise SystemExit('R73 runtime differs from approved hashes: ' + json.dumps(actual))
elif approval.get('status') == 'pending-review':
    if os.environ.get('GITHUB_REF') == 'refs/heads/main' and os.environ.get('GITHUB_EVENT_NAME') != 'pull_request':
        raise SystemExit('R73 approval remains pending; refusing public Pages deployment')
else:
    raise SystemExit('Unknown R73 approval status')
manifest_path = root / 'web-manifest-r62.json'
manifest = json.loads(manifest_path.read_text())
manifest['releaseR73'] = {'sourceCommit': os.environ.get('GITHUB_SHA', 'working-tree'), 'runtimeHashes': actual, 'status': approval['status']}
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
if os.environ.get('GITHUB_OUTPUT'):
    with open(os.environ['GITHUB_OUTPUT'], 'a') as stream:
        stream.write('html_sha=' + actual['index.html'] + '\nrenderer_sha=' + actual['dist/phase1.js'] + '\n')
print(json.dumps({'status': approval['status'], 'runtimeHashes': actual, 'sourceCommit': os.environ.get('GITHUB_SHA', 'working-tree')}))
