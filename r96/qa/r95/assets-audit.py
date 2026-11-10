#!/usr/bin/env python3
"""Audit delivered assets, independently of the renderer and its image stubs."""
from pathlib import Path
import hashlib
import json
import sys
from datetime import datetime, timezone
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / 'hospital-three-pc' / 'site'
checks = []
failures = []
counts = {'json': 0, 'images': 0, 'catalogRows': 0, 'catalogImages': 0,
          'stripAtlases': 0, 'effectAtlases': 0, 'effectFrames': 0}


def check(name, errors):
    checks.append({'name': name, 'passed': not errors, 'detail': errors})
    print(('FAIL' if errors else 'PASS'), name)


json_data = {}
errors = []
for file in sorted(SITE.rglob('*.json')):
    try:
        json_data[file] = json.loads(file.read_text(encoding='utf-8'))
        counts['json'] += 1
    except Exception as exc:
        errors.append({'file': str(file.relative_to(SITE)), 'error': str(exc)})
check('Every delivered JSON file parses', errors)

image_sizes = {}
errors = []
for file in sorted(SITE.rglob('*')):
    if file.suffix.lower() not in {'.png', '.webp', '.jpg', '.jpeg', '.gif'}:
        continue
    try:
        with Image.open(file) as image:
            image_sizes[str(file.relative_to(SITE))] = image.size
            image.load()  # Decode pixels, not only the header.
        counts['images'] += 1
    except Exception as exc:
        errors.append({'file': str(file.relative_to(SITE)), 'error': str(exc)})
check('Every delivered raster image decodes', errors)

path_errors, hash_errors, dimension_errors, frame_errors = [], [], [], []


def visit(value, catalog):
    if isinstance(value, dict):
        path = value.get('path')
        if isinstance(path, str) and path.startswith('assets/'):
            counts['catalogRows'] += 1
            file = SITE / path
            if not file.is_file():
                path_errors.append({'catalog': catalog, 'path': path})
            else:
                data = file.read_bytes()
                actual = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
                for key in actual:
                    if key in value and value[key] != actual[key]:
                        hash_errors.append({'path': path, 'field': key})
                size = image_sizes.get(path)
                if size:
                    counts['catalogImages'] += 1
                    if all(key in value for key in ('w', 'h')):
                        if tuple(value[key] for key in ('w', 'h')) != size:
                            dimension_errors.append({'path': path, 'size': size})
                    cell, frames = value.get('cell'), value.get('frames')
                    if isinstance(cell, list) and isinstance(frames, int):
                        counts['stripAtlases'] += 1
                        if (cell[0] * frames, cell[1]) != size:
                            frame_errors.append({'path': path, 'cell': cell,
                                                 'frames': frames, 'size': size})
                    if isinstance(frames, int) and value.get('cellW') and value.get('cellH'):
                        if (frames * value['cellW'], value['cellH']) != size:
                            frame_errors.append({'path': path, 'size': size})
        for child in value.values():
            visit(child, catalog)
    elif isinstance(value, list):
        for child in value:
            visit(child, catalog)


for file, data in json_data.items():
    if file.name == 'index.json' and file.relative_to(SITE).parts[1] in {'r91', 'r92', 'r93'}:
        visit(data, str(file.relative_to(SITE)))
check('All R91-R93 catalog runtime paths exist', path_errors)
check('All R91-R93 catalog bytes and hashes match', hash_errors)
check('All R91-R93 catalog image dimensions match', dimension_errors)
check('All R91-R93 strip cells remain within the image', frame_errors)

errors = []
for file, data in json_data.items():
    if not isinstance(data, dict) or not isinstance(data.get('atlas'), str) or not isinstance(data.get('frames'), list):
        continue
    atlas = file.parent / data['atlas']
    size = image_sizes.get(str(atlas.relative_to(SITE)))
    if not size:
        errors.append({'file': str(file.relative_to(SITE)), 'missingAtlas': str(data['atlas'])})
        continue
    counts['effectAtlases'] += 1
    for frame in data['frames']:
        if not isinstance(frame, dict) or not isinstance(frame.get('rect'), dict):
            continue
        counts['effectFrames'] += 1
        rect = frame['rect']
        try:
            valid = rect['x'] >= 0 and rect['y'] >= 0 and rect['w'] > 0 and rect['h'] > 0 and rect['x'] + rect['w'] <= size[0] and rect['y'] + rect['h'] <= size[1]
        except (KeyError, TypeError):
            valid = False
        if not valid:
            errors.append({'file': str(file.relative_to(SITE)), 'rect': rect, 'size': size})
check('Every declared effect-atlas frame stays within its atlas', errors)

report = {'schema': 'storyworld.r95.asset-audit/v1',
          'generatedAt': datetime.now(timezone.utc).isoformat(),
          'method': 'JSON parsing, full raster pixel decoding, independent catalog hashes and atlas bounds. Source provenance paths and external-to-crop foot pivots are not runtime file or bounds errors.',
          'counts': counts, 'checks': checks, 'passed': all(c['passed'] for c in checks),
          'browserVerified': False, 'GPUVerified': False}
Path(__file__).with_name('assets-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'passed': report['passed'], 'checks': len(checks), 'counts': counts}))
sys.exit(0 if report['passed'] else 1)
