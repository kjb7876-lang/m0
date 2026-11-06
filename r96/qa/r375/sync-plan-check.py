#!/usr/bin/env python3
"""Read-only diagnosis. Never copies runtime files or rewrites either manifest."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
R = ROOT / 'r96'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
ownership = json.loads((Path(__file__).parent / 'evidence/followup/open-pr-ownership.json').read_text())
spec = json.loads((R / 'runtime-inputs.json').read_text())
manifest = json.loads((R / 'runtime-manifest.json').read_text())
rows = {row['path']: row for row in manifest['files']}
locked = {p: [row['pr'] for row in ownership['prs'] if p in row.get('commonFiles', [])]
          for p in ['r96/runtime-inputs.json', 'r96/runtime-manifest.json',
                    'r96/runtime-text/index.html', 'scripts/verify-r96-public.py', '.github/workflows/pages.yml']}
before = {p: sha(ROOT / p) for p in locked}
sources = []
for name in ['mobs-r109.js', 'mob-unique-r248.js', 'enemy-facing-r375.js', 'world-scale-r375.js']:
    source, runtime = R / 'client-source' / name, R / 'runtime-text' / name
    sources.append({'name': name, 'sourceSha256': sha(source),
                    'runtimeSha256': sha(runtime) if runtime.exists() else None,
                    'manifestSha256': rows.get(name, {}).get('sha256'),
                    'registered': name in spec['textPaths'],
                    'copyRequired': not runtime.exists() or source.read_bytes() != runtime.read_bytes()})
result = {'mode': 'read-only sync plan; sync/build not executed', 'lockedFiles': locked,
          'sources': sources, 'manifestDigestValid': sha(R / 'runtime-manifest.json') == spec['runtimeManifestSHA256'],
          'cause': 'build-r96.py:43 compares manifest-built runtime with client-source; R109 and R248 differ',
          'requiredSyncWrites': ['runtime copies for all changed client-source/*.js',
                                'r96/runtime-manifest.json', 'r96/runtime-inputs.json'],
          'registrationWrites': ['r96/runtime-text/index.html', 'scripts/verify-r96-public.py',
                                 '.github/workflows/pages.yml'],
          'resolution': 'integration owner must coordinate open PR ownership, then wire generation/collision/save boundaries and run sync; copying runtime alone invalidates manifest hashes',
          'unchangedLockedFiles': all(sha(ROOT / p) == h for p, h in before.items()),
          'lockedFileSha256': before}
assert result['manifestDigestValid'] and result['unchangedLockedFiles']
assert all(locked[p] for p in locked), 'Refresh ownership before using this blocked diagnosis'
assert all(row['copyRequired'] for row in sources), 'Candidate changed; revise the diagnosis'
print(json.dumps(result, indent=2))
