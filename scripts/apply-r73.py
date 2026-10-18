#!/usr/bin/env python3
"""Reproducible opt-in R73 build over exact preserved R72 candidate bytes."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHA = lambda b: hashlib.sha256(b).hexdigest()
BASE_HTML = '73e0be074333bd46bcee52bbb50f37187f6d19c4aa365deaf49096a0aeb5fc18'
BASE_RENDERER = '54dfe20af282d237511ef6f4bb6be3fe54880ad61d82928b0114d15f58df725c'


def build(site):
    original = {'index.html': (site / 'index.html').read_bytes(), 'dist/phase1.js': (site / 'dist/phase1.js').read_bytes()}
    if SHA(original['index.html']) != BASE_HTML or SHA(original['dist/phase1.js']) != BASE_RENDERER:
        raise RuntimeError('R73 requires exact preserved R72 candidate')
    spec = importlib.util.spec_from_file_location('render_r73', ROOT / 'scripts/render-r73.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    renderer = module.transform(original['dist/phase1.js'].decode()).encode()
    html = original['index.html'].decode()
    if html.count('dist/phase1.js?r71=1') != 1:
        raise RuntimeError('R73 renderer cache anchor drift')
    html = html.replace('dist/phase1.js?r71=1', 'dist/phase1.js?r73=1').encode()
    manifest = json.loads((site / 'web-manifest-r62.json').read_text())
    for name, value in {'index.html': html, 'dist/phase1.js': renderer}.items():
        row, = [r for r in manifest['files'] if r['path'] == name]
        if row['sha256'] != SHA(original[name]):
            raise RuntimeError('R73 manifest lineage mismatch')
        row['sha256'] = SHA(value)
        row['bytes'] = len(value)
        (site / name).write_bytes(value)
    manifest['webHTMLSha256'] = SHA(html)
    manifest['totalBytes'] = sum(r['bytes'] for r in manifest['files'])
    manifest['r73'] = {'revision': 'R73-BOOTLOADER', 'baselineCandidate': 'c011601795a8557e22bd144b7386e08b8c6169dc', 'mediaChanged': False}
    (site / 'web-manifest-r62.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'htmlSHA256': SHA(html), 'rendererSHA256': SHA(renderer)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--site', type=Path, required=True)
    build(parser.parse_args().site)
