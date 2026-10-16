#!/usr/bin/env python3
"""Rebuild exact approved Pages files from raw sources and bounded media ZIPs.

Python standard library only. Never executes archive content or extracts links.
An empty, fresh output directory is required. Failure leaves no partial site.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import tempfile
import zipfile


def digest(data):
    return hashlib.sha256(data).hexdigest()


def safe_name(name):
    p = PurePosixPath(name)
    if not name or p.is_absolute() or '..' in p.parts or '\\' in name or ':' in name or p.as_posix() != name:
        raise ValueError('Unsafe build path')
    return name


def verified(data, row):
    if len(data) != row['bytes'] or digest(data) != row['sha256']:
        raise ValueError('Size/hash mismatch: ' + row['path'])
    return data


def source(root, name):
    name = safe_name(name)
    f = root / name
    if f.is_symlink() or not f.is_file() or root not in f.resolve().parents:
        raise ValueError('Missing/linked/outside build input: ' + name)
    return f


def write_checked(target, row, data):
    name = safe_name(row['path'])
    f = target / name
    if f.exists():
        raise ValueError('Duplicate output: ' + name)
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_bytes(verified(data, row))


def build(root, output):
    root = root.resolve()
    output = output.absolute()
    if output.exists():
        raise ValueError('Output must not exist; never overwrite a previous site')
    if output == root or output == root / 'docs':
        raise ValueError('Do not overwrite source docs')
    build_spec = json.loads(source(root, 'build-input/runtime-packs/manifest.json').read_text())
    assert build_spec['schema'] == 'storyworld.runtime-build-input.r62/v1'
    original = source(root, 'docs/web-manifest-r62.json').read_bytes()
    assert digest(original) == build_spec['runtimeManifestSHA256'], 'Original runtime manifest changed'
    runtime = json.loads(original)
    assert len(runtime['files']) == build_spec['runtimeFileCount'] == 1906
    assert sum(r['bytes'] for r in runtime['files']) == build_spec['runtimeBytes'] == runtime['totalBytes']
    rows = {safe_name(r['path']): r for r in runtime['files']}
    assert len(rows) == len(runtime['files']) and len({n.lower() for n in rows}) == len(rows)
    raw_names = [safe_name(r['path']) for r in build_spec['raw']]
    members = [safe_name(n) for a in build_spec['archives'] for n in a['files']]
    assert len(raw_names + members) == len(set(raw_names + members)), 'Repeated build output'
    assert set(raw_names + members) == set(rows) | {'.nojekyll', 'web-manifest-r62.json'}, 'Unexpected/missing build output'
    for row in build_spec['raw']:
        if row['path'] in rows:
            assert row == rows[row['path']], 'Raw manifest disagreement'
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.runtime-build-', dir=output.parent) as temporary:
        target = Path(temporary) / 'site'
        target.mkdir()
        for row in build_spec['raw']:
            write_checked(target, row, source(root, 'docs/' + row['path']).read_bytes())
        for archive in build_spec['archives']:
            file = source(root, archive['path'])
            verified(file.read_bytes(), archive)
            if archive['bytes'] >= 5 * 1024 * 1024:
                raise ValueError('Oversize build archive')
            with zipfile.ZipFile(file) as z:
                names = z.namelist()
                assert len(names) == len(set(names)) and set(names) == set(archive['files']), 'Unexpected ZIP members'
                for info in z.infolist():
                    name = safe_name(info.filename)
                    mode = info.external_attr >> 16
                    if info.is_dir() or (stat.S_IFMT(mode) not in (0, stat.S_IFREG)) or info.flag_bits & 1:
                        raise ValueError('Archive link/directory/encryption rejected')
                    row = rows[name]
                    if info.file_size != row['bytes'] or info.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED):
                        raise ValueError('Unexpected ZIP size/compression')
                    write_checked(target, row, z.read(info))
        actual = {f.relative_to(target).as_posix() for f in target.rglob('*') if f.is_file()}
        assert actual == set(rows) | {'.nojekyll', 'web-manifest-r62.json'}
        assert digest((target / 'index.html').read_bytes()) == runtime['webHTMLSha256'] == build_spec['webHTMLSha256']
        assert not any(f.is_symlink() or (f.is_file() and f.stat().st_nlink != 1) for f in target.rglob('*'))
        os.replace(target, output)
    return {'status': 'R62_RUNTIME_RECONSTRUCTION_PASSED', 'runtimeFiles': len(rows), 'siteFiles': len(actual),
            'runtimeBytes': runtime['totalBytes'], 'webHTMLSha256': runtime['webHTMLSha256'],
            'archiveCount': len(build_spec['archives']), 'archivesInPublishedSite': False,
            'sourceHTMLSha256': runtime['sourceHTMLSha256'], 'output': str(output)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--output', type=Path, default=Path('_site'))
    args = parser.parse_args()
    print(json.dumps(build(args.root, args.output)))


if __name__ == '__main__':
    main()
