#!/usr/bin/env python3
"""Reconstruct the isolated R80 PC review candidate; never writes docs or deploys."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import tempfile


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def safe_name(value: str) -> str:
    path = PurePosixPath(value)
    if not value or path.is_absolute() or '..' in path.parts or '\\' in value or ':' in value or path.as_posix() != value:
        raise ValueError('Unsafe review path: ' + value)
    return value


def checked_file(root: Path, row: dict) -> Path:
    path = root / safe_name(row['path'])
    if path.is_symlink() or not path.is_file() or root.resolve() not in path.resolve().parents:
        raise ValueError('Missing/linked/outside review input: ' + row['path'])
    data = path.read_bytes()
    if len(data) != row['bytes'] or digest(data) != row['sha256']:
        raise ValueError('Review size/hash mismatch: ' + row['path'])
    return path


def inspect_overlay(root: Path) -> tuple[dict, dict, dict]:
    bundle = root / 'pc-test-r80'
    delta = json.loads((bundle / 'delta-manifest.json').read_text())
    baseline = json.loads((bundle / 'baseline-manifest-r62.json').read_text())
    native_manifest = root / 'docs/web-manifest-r62.json'
    if native_manifest.exists() and json.loads(native_manifest.read_text()) != baseline:
        raise ValueError('Repository baseline differs from the retained R62 manifest')
    rows = delta['files']
    if len({row['path'] for row in rows}) != len(rows):
        raise ValueError('Duplicate review overlay path')
    for row in rows:
        checked_file(bundle / 'overlay', row)
    actual = {p.relative_to(bundle / 'overlay').as_posix() for p in (bundle / 'overlay').rglob('*') if p.is_file()}
    if actual != {row['path'] for row in rows}:
        raise ValueError('Unexpected overlay members')
    candidate = json.loads((bundle / 'overlay/web-manifest-r62.json').read_text())
    if candidate['fileCount'] != len(candidate['files']) or candidate['fileCount'] != delta['candidateFiles']:
        raise ValueError('Candidate file count differs')
    composed = {row['path']: row for row in baseline['files']}
    for name in delta.get('removedBasePaths', []):
        composed.pop(safe_name(name))
    for row in rows:
        if row['path'] != 'web-manifest-r62.json':
            composed[row['path']] = row
    expected = {row['path']: row for row in candidate['files']}
    if composed != expected:
        raise ValueError('Baseline plus overlay differs from the complete candidate manifest')
    for row in delta['launchers']:
        checked_file(bundle / 'launchers', row)
    return delta, candidate, baseline


def assemble(root: Path, output: Path, portable_node: Path | None = None) -> dict:
    root = root.resolve()
    output = output.resolve()
    if output.exists():
        raise ValueError('Output must not exist; choose a fresh review directory')
    docs = root / 'docs'
    if output == root or output == docs or docs in output.parents:
        raise ValueError('Review output must not overwrite repository docs')
    delta, candidate, _ = inspect_overlay(root)
    bundle = root / 'pc-test-r80'
    unpack_script = root / 'scripts/unpack-runtime-r62.py'
    if not unpack_script.is_file():
        raise ValueError('The existing repository scripts/unpack-runtime-r62.py is required')
    spec = importlib.util.spec_from_file_location('r80_native_unpack', unpack_script)
    unpack = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(unpack)
    qa = bundle / 'qa'
    if not qa.is_dir():
        raise ValueError('The review QA sources at pc-test-r80/qa are required')
    if portable_node:
        portable_node = portable_node.resolve()
        node_data = portable_node.read_bytes()
        expected_node = delta['portableNode']
        if portable_node.is_symlink() or len(node_data) != expected_node['bytes'] or digest(node_data) != expected_node['sha256']:
            raise ValueError('Optional portable Node differs from the original candidate runtime')
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.r80-review-', dir=output.parent) as temporary:
        work = Path(temporary) / 'review'
        project = work / 'hospital-three-pc'
        site = project / 'site'
        project.mkdir(parents=True)
        unpack.build(root, site)
        for name in delta.get('removedBasePaths', []):
            (site / safe_name(name)).unlink()
        for row in delta['files']:
            source = checked_file(bundle / 'overlay', row)
            target = site / row['path']
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
        for row in candidate['files']:
            checked_file(site, row)
        actual = {p.relative_to(site).as_posix() for p in site.rglob('*') if p.is_file()}
        if actual != {row['path'] for row in candidate['files']} | {'web-manifest-r62.json'}:
            raise ValueError('Assembled site has unexpected or missing files')
        for row in delta['launchers']:
            shutil.copyfile(checked_file(bundle / 'launchers', row), project / row['path'])
        if portable_node:
            (project / 'portable-node').mkdir()
            shutil.copyfile(portable_node, project / 'portable-node/node.exe')
        shutil.copytree(qa, work / 'qa', ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
        shutil.copyfile(bundle / 'README.md', work / 'README-R80.md')
        result = {'status': 'R80_REVIEW_ASSEMBLED', 'siteFiles': len(actual), 'candidateManifestFiles': len(candidate['files']),
                  'fullSiteSHA256Verified': True, 'portableWindowsNodeIncluded': bool(portable_node),
                  'browserVerified': False, 'GPUVerified': False, 'naturalPlayVerified': False,
                  'publicDeploymentChanged': False, 'output': str(output)}
        (work / 'ASSEMBLY-RESULTS.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
        os.replace(work, output)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--output', type=Path)
    parser.add_argument('--portable-node', type=Path)
    parser.add_argument('--verify-overlay-only', action='store_true')
    args = parser.parse_args()
    root = args.root.resolve()
    if args.verify_overlay_only:
        delta, candidate, baseline = inspect_overlay(root)
        result = {'status': 'R80_BASELINE_PLUS_OVERLAY_VERIFIED', 'baseManifestFiles': len(baseline['files']),
                  'candidateManifestFiles': len(candidate['files']), 'overlayFiles': len(delta['files']),
                  'method': 'Verified overlay byte hashes and complete baseline-plus-overlay SHA256 composition; not a fresh archive reconstruction'}
    else:
        result = assemble(root, args.output or root / 'out/r80-review', args.portable_node)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
