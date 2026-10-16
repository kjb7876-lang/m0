#!/usr/bin/env python3
"""Package only approved runtime media for a GitHub Actions build, never players.

Keeps docs/ unchanged. Text source files remain ordinary repository files.
The resulting upload-plan.json is the exact alternative repository file list.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import zipfile

MEDIA = {'.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.avif', '.wav', '.mp3', '.ogg', '.m4a', '.woff', '.woff2', '.ttf'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--out', default='build-input/runtime-packs')
    args = parser.parse_args()
    root = args.root.resolve()
    docs = root / 'docs'
    out = root / args.out
    if out.exists():
        raise ValueError('Output already exists; preserve it or choose a new --out directory')
    original = (docs / 'web-manifest-r62.json').read_bytes()
    runtime = json.loads(original)
    rows = runtime['files']
    seen = set()
    for row in rows:
        name = row['path']
        parts = PurePosixPath(name)
        assert name and not parts.is_absolute() and '..' not in parts.parts and '\\' not in name
        assert name.lower() not in seen, 'duplicate/case-colliding runtime path'
        seen.add(name.lower())
        f = docs / name
        assert not f.is_symlink()
        data = f.read_bytes()
        assert len(data) == row['bytes'] and digest(data) == row['sha256'], name
    packed = [row for row in rows if PurePosixPath(row['path']).suffix.lower() in MEDIA]
    raw = [row for row in rows if row not in packed]
    # Store rather than recompress authored media. This is deterministic and
    # the 512-byte per-entry budget safely covers ZIP metadata and path bytes.
    limit = 5 * 1024 * 1024
    groups = []
    for row in sorted(packed, key=lambda r: (-r['bytes'], r['path'])):
        cost = row['bytes'] + 512 + 2 * len(row['path'].encode('utf-8'))
        assert cost + 128 < limit, 'Asset requires a larger explicit pack limit'
        group = next((g for g in groups if g['budget'] + cost < limit), None)
        if group is None:
            group = {'budget': 128, 'rows': []}
            groups.append(group)
        group['budget'] += cost
        group['rows'].append(row)
    out.mkdir(parents=True)
    archives = []
    for i, group in enumerate(groups, 1):
        file = out / f'runtime-{i:03d}.zip'
        with zipfile.ZipFile(file, 'w', compression=zipfile.ZIP_STORED, allowZip64=False) as z:
            for row in sorted(group['rows'], key=lambda r: r['path']):
                info = zipfile.ZipInfo(row['path'], date_time=(1980, 1, 1, 0, 0, 0))
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                z.writestr(info, (docs / row['path']).read_bytes())
        data = file.read_bytes()
        assert len(data) < limit
        archives.append({'path': file.relative_to(root).as_posix(), 'bytes': len(data), 'sha256': digest(data), 'files': [r['path'] for r in sorted(group['rows'], key=lambda r: r['path'])]})
    extra = []
    for name in ['.nojekyll', 'web-manifest-r62.json']:
        data = (docs / name).read_bytes()
        extra.append({'path': name, 'bytes': len(data), 'sha256': digest(data)})
    build = {'schema': 'storyworld.runtime-build-input.r62/v1', 'runtimeManifestSHA256': digest(original),
             'sourceHTMLSha256': runtime['sourceHTMLSha256'], 'webHTMLSha256': runtime['webHTMLSha256'],
             'runtimeFileCount': len(rows), 'runtimeBytes': runtime['totalBytes'],
             'raw': sorted(raw + extra, key=lambda r: r['path']), 'archives': archives,
             'archiveRole': 'Build input only; unpacked verified runtime files are published to Pages. No archives are served by Pages.'}
    (out / 'manifest.json').write_text(json.dumps(build, ensure_ascii=False, indent=2) + '\n')
    # A root-level whitelist lets the uploader avoid publishing duplicate raw
    # media and avoids accidental Git history/backups/test-output inclusion.
    nonruntime = ['README.md', 'README_DEPLOY_KO.md', 'FRIENDS_KO.md', 'VERIFY_REMOTE_KO.md', 'MAP_SUPPORT_R62_KO.md',
                  'DEPLOYMENT_STATUS_R62.json', '.gitignore', 'verify-pages-r62.mjs']
    for directory in ['client-source', 'scripts', '.github/workflows']:
        allowed = {'.js'} if directory == 'client-source' else {'.py'} if directory == 'scripts' else {'.yml', '.yaml'}
        nonruntime += [f.relative_to(root).as_posix() for f in sorted((root / directory).rglob('*')) if f.is_file() and f.suffix in allowed]
    nonruntime += ['relay/' + n for n in ['server.mjs', 'package.json', 'package-lock.json', 'README_KO.md', 'PROTOCOL.md', 'render.yaml', '.env.example', '.gitignore', 'test/relay.test.mjs', 'test/verify.mjs'] if (root / 'relay' / n).is_file()]
    upload = sorted(set(nonruntime + ['docs/' + r['path'] for r in build['raw']] + [r['path'] for r in archives] + [(out / 'manifest.json').relative_to(root).as_posix()]))
    assert all((root / n).is_file() for n in upload)
    upload_rows = []
    for name in upload:
        f = root / name
        data = f.read_bytes()
        upload_rows.append({'path': name, 'localPath': str(f.resolve()), 'sha256': digest(data), 'bytes': len(data)})
    plan = {'schema': 'storyworld.runtime-upload-plan.r62/v1', 'repository': 'kjb7876-lang/m0', 'files': upload_rows,
            'count': len(upload), 'runtimeFilesOmittedFromGitTree': len(packed), 'archiveCount': len(archives),
            'runtimeFiles': len(rows), 'runtimeOutputUnchanged': True, 'remoteUploaded': False}
    # This is an upload operator artifact, not an input or a Pages file.
    plan_path = out.parent / 'upload-plan-r62.json'
    plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'packs': len(archives), 'packedRuntimeFiles': len(packed), 'rawRuntimeFiles': len(raw), 'uploadFiles': len(upload), 'packBytes': sum(r['bytes'] for r in archives), 'maxPackBytes': max(r['bytes'] for r in archives), 'plan': str(plan_path)}))


if __name__ == '__main__':
    main()
