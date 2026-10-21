#!/usr/bin/env python3
"""Compose the reviewed hospital overlays AFTER exact R77; never deploy.

Old approval gates remain untouched. Input must be a preserved R75/R76/R77
release chain. Output is a fresh test artifact, with separate storage keys.
"""
import argparse
import copy
import hashlib
import importlib.util
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = {'index.html': 'b68e0736263049e4cf58b69d5fd1b04c57afbb8a89cf5ffaca482e1bf131e4c4',
        'dist/phase1.js': 'cc71147117dbbb7fd04d2619c95408ad810804b1c1bb5462afbc09bd93f0502c'}
EXPECTED_RENDERER = 'a09c0d264510286b397682d51df7d964543794b3d8b058b534a1cd8f5f7cee1d'
PRIOR_HTML = '5aa7be827b3c1bf21b227c8caaa63b0e5fb81d22c0a0e4499911748946c00719'
PREFIX = 'storyworld.hospital-b1.test.v1:'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def module(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), ROOT / 'scripts' / (name + '.py'))
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def compose(html, renderer, manifest):
    if {k: sha(v) for k, v in [('index.html', html), ('dist/phase1.js', renderer)]} != BASE:
        raise ValueError('Exact pinned R77 runtime required; hospital overlay must be last')
    for stage in ['releaseR75', 'releaseR76', 'releaseR77']:
        if manifest.get(stage, {}).get('status') != 'approved':
            raise ValueError('Missing preserved release approval: ' + stage)
    if manifest['releaseR77']['runtimeHashes'] != BASE or manifest['r77']['baselineR76HtmlSha256'] != manifest['releaseR76']['runtimeHashes']['index.html']:
        raise ValueError('R75/R76/R77 release chain differs')
    if manifest['releaseR76']['baselineR75RuntimeHashes'] != manifest['releaseR75']['runtimeHashes']:
        raise ValueError('R75/R76 release chain differs')
    structure, visual, mask = [module(n) for n in ['apply-hospital-prototype-b1', 'apply-hospital-visual-b1', 'apply-hospital-sight-fix-b1']]
    prior_html = structure.transform_html(html.decode())
    result_renderer = mask.transform(visual.transform(structure.transform(renderer.decode()))).encode()
    if sha(prior_html.encode()) != PRIOR_HTML or sha(result_renderer) != EXPECTED_RENDERER:
        raise ValueError('Reviewed hospital candidate drift')
    cache = 'hospital-b1=' + sha(result_renderer)[:16]
    old = './dist/phase1.js?r76=1'
    if prior_html.count(old) != 1:
        raise ValueError('Renderer cache reference anchor differs')
    output_html = prior_html.replace(old, './dist/phase1.js?' + cache)
    methods = set(re.findall(r'\blocalStorage\s*\.\s*(\w+)', output_html))
    if methods != {'getItem', 'setItem', 'removeItem'} or 'window.localStorage' in output_html:
        raise ValueError('Unreviewed storage access form')
    count = 0

    def rewrite(match):
        nonlocal count
        opening, body, closing = match.groups()
        if re.search(r'type\s*=\s*[\"\x27]application/json', opening, re.I):
            return match.group(0)
        body, n = re.subn(r'(?<![\w$.])localStorage\.(getItem|setItem|removeItem)\(', r'window.__STORYWORLD_TEST_STORAGE_B1__.store.\1(', body)
        count += n
        return opening + body + closing

    output_html = re.sub(r'(<script\b[^>]*>)([\s\S]*?)(</script>)', rewrite, output_html, flags=re.I)
    if count != 51:
        raise ValueError('Expected all 51 reviewed storage call sites, found ' + str(count))
    storage = (ROOT / 'client-source/hospital-test-storage-b1.js').read_text()
    if '</script' in storage.lower() or 'id="hospital-b1-test-storage"' in output_html:
        raise ValueError('Unsafe or duplicate storage adapter')
    first = output_html.index('<script')
    output_html = output_html[:first] + '<script id="hospital-b1-test-storage">\n' + storage + '\n</script>\n' + output_html[first:]
    output_html = output_html.encode()
    result = copy.deepcopy(manifest)
    payload = {'index.html': output_html, 'dist/phase1.js': result_renderer}
    for path, data in payload.items():
        rows = [r for r in result['files'] if r['path'] == path]
        if len(rows) != 1:
            raise ValueError('Manifest entry missing or duplicated: ' + path)
        rows[0].update(bytes=len(data), sha256=sha(data))
    result['webHTMLSha256'] = sha(output_html)
    result['totalBytes'] = sum(r['bytes'] for r in result['files'])
    result['fileCount'] = len(result['files'])
    result['largest'] = sorted(result['files'], key=lambda r: r['bytes'], reverse=True)[:20]
    result.update(status='hospital B1 test candidate; no deployment acceptance', remotePublished=False, deploymentSHA=None, deploymentUTC=None)
    result['hospitalB1Test'] = {'sourceCommit': 'c893f1f5172a33387c01241b4935d42d798ecbd8', 'baselineCommit': 'f415dfbf783c6290ab99125193d800429799c9f9', 'baselineRuntime': BASE, 'runtimeHashes': {p: sha(v) for p, v in payload.items()}, 'rendererCacheKey': cache, 'storagePrefix': PREFIX, 'storageCallsMapped': count, 'saveSchemaChanged': False, 'originalSaveImported': False, 'GPUVerified': False, 'approval': 'pending final B review'}
    return payload, result


def build(baseline, output):
    baseline, output = baseline.resolve(), output.resolve()
    if output.exists() or not output.is_relative_to(ROOT / 'out') or output == baseline or baseline in output.parents:
        raise ValueError('Fresh separate output under checkout/out required')
    html, renderer = [(baseline / p).read_bytes() for p in BASE]
    manifest = json.loads((baseline / 'web-manifest-r62.json').read_text())
    payload, result = compose(html, renderer, manifest)
    shutil.copytree(baseline, output)
    for path, data in payload.items():
        (output / path).write_bytes(data)
    target = output / 'web-manifest-r62.json'
    target.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    receipt = {**result['hospitalB1Test'], 'manifestSHA256': sha(target.read_bytes()), 'output': str(output), 'sourceFiles': {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in [Path(__file__).resolve(), ROOT / 'client-source/hospital-test-storage-b1.js']}}
    (output.parent / 'build.json').write_text(json.dumps(receipt, indent=2) + '\n')
    return receipt


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--baseline', type=Path, default=ROOT / '_pages/docs')
    parser.add_argument('--output', type=Path, default=ROOT / 'out/hospital-b1/build-connected/site')
    args = parser.parse_args()
    print(json.dumps(build(args.baseline, args.output)))
