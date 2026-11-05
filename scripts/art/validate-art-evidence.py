#!/usr/bin/env python3
"""Validate evidence coverage/bytes and independent score arithmetic, not taste."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

WEIGHTS = {'style': 3, 'form': 2, 'readability': 2, 'applicability': 2, 'reproducibility': 1}


def validate(root):
    manifest = json.loads((root / 'capture-manifest.json').read_text())
    index = json.loads((root / 'evidence-index.json').read_text())
    plan = json.loads((root / 'audit-plan.json').read_text())
    errors = []
    captures = {r['id']: r for r in manifest['captures']}
    if len(captures) != len(manifest['captures']):
        errors.append('duplicate capture IDs')
    expected = {f'{d}-{s}' for d in ['pc', 'mobile'] for s in plan['scenes']}
    errors.extend('missing scene ' + s for s in sorted(expected - captures.keys()))
    indexed = [r['id'] for r in index['captures']]
    if len(set(indexed)) != len(indexed):
        errors.append('duplicate index capture IDs')
    errors.extend('capture not indexed ' + i for i in sorted(captures.keys() - set(indexed)))
    errors.extend('index row without capture ' + i for i in sorted(set(indexed) - captures.keys()))
    for r in index['captures']:
        if r['id'] not in captures:
            continue
        if Path(r['color']).name != Path(captures[r['id']]['file']).name:
            errors.append('index color file does not match manifest ' + r['id'])
        for field, sha in [('color', 'sha256'), ('gray', 'graySHA256')]:
            p = root / r[field]
            if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest() != r[sha]:
                errors.append('missing/changed bytes ' + p.name)
                continue
            with Image.open(p) as im:
                im.verify()
        c = captures[r['id']]
        if c['state']['renderer'] != 'three':
            errors.append('renderer fallback ' + r['id'])
        if c['state']['viewport']['dpr'] != (3 if r['id'].startswith('mobile-') else 1):
            errors.append('unexpected DPR ' + r['id'])
        if c['fixture'].get('pose'):
            actual = c['state']['heroState']['state']
            if actual != c['fixture']['pose']:
                errors.append(f"pose mismatch {r['id']}: {actual}")
        if c['fixture'].get('bossCount', 0) > 8:
            errors.append('omitted bosses ' + r['id'])
    if not manifest.get('finishedAt'):
        errors.append('capture run incomplete')
    if manifest.get('fatal'):
        errors.append('capture fatal: ' + manifest['fatal'])
    errors.extend('capture failure ' + r['device'] + '/' + r['id'] for r in manifest.get('failures', []))
    errors.extend('page error ' + r['message'] for r in manifest.get('errors', []))
    review_path = root / 'independent-review.json'
    scored = 0
    if review_path.exists():
        review = json.loads(review_path.read_text())
        for item in review['items']:
            scores = item.get('scores')
            if not scores:
                if item['status'] != '미검증':
                    errors.append('unscored item not unverified: ' + item['id'])
                continue
            if set(scores) != set(WEIGHTS) or any(not isinstance(v, (int, float)) or not 0 <= v <= 10 for v in scores.values()):
                errors.append('invalid scores ' + item['id'])
                continue
            weighted = sum(scores[k] * w for k, w in WEIGHTS.items()) / 10
            if abs(weighted - item['weighted']) > 0.0001:
                errors.append('weighted score mismatch ' + item['id'])
            if not item.get('files') or any(not (root / f).is_file() for f in item.get('files', [])):
                errors.append('missing review image ' + item['id'])
            hashes = item.get('fileSha256') or {}
            if set(hashes) != set(item.get('files', [])):
                errors.append('review not bound to image hashes ' + item['id'])
            for f, sha in hashes.items():
                p = root / f
                if p.is_file() and hashlib.sha256(p.read_bytes()).hexdigest() != sha:
                    errors.append('reviewed image bytes changed ' + item['id'] + '/' + f)
            if item['status'] == '검증됨':
                errors.append('headless-only evidence cannot establish final verification ' + item['id'])
            scored += 1
    else:
        errors.append('independent review missing')
    regional_path = root / 'regional-review.json'
    regional_count = 0
    regional_scored = 0
    if regional_path.exists():
        regional = json.loads(regional_path.read_text())['regions']
        regional_count = len(regional)
        expected_regions = {r['id'] for r in plan.get('regions', [])}
        if expected_regions and {r['regionId'] for r in regional} != expected_regions:
            errors.append('regional review does not match canonical region inventory')
        for row in regional:
            scores = row.get('scores')
            if scores is None:
                if row.get('status') != '미검증' or not row.get('unscoredReason'):
                    errors.append('regional missing score needs explicit reason ' + row['regionId'])
            elif set(scores) != set(WEIGHTS) or any(not isinstance(v, (int, float)) or not 0 <= v <= 10 for v in scores.values()):
                errors.append('invalid regional scores ' + row['regionId'])
            elif abs(sum(scores[k] * w for k, w in WEIGHTS.items()) / 10 - row['weighted']) > 0.0001:
                errors.append('regional weighted score mismatch ' + row['regionId'])
            if scores is not None:
                regional_scored += 1
                if not row.get('captures'):
                    errors.append('scored regional row has no reviewed image references ' + row['regionId'])
            if row.get('status') == '검증됨':
                errors.append('regional fixture cannot establish final verification ' + row['regionId'])
            for ref in row.get('captures', []):
                p = root / Path(ref['file']).name
                if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest() != ref['sha256']:
                    errors.append('regional reviewed bytes changed ' + row['regionId'] + '/' + p.name)
    elif plan.get('regions'):
        errors.append('regional review missing')
    result = {'ok': not errors, 'captured': len(captures), 'expected': len(expected),
              'coverageComplete': not (expected - captures.keys()) and set(indexed) == set(captures),
              'scoredItems': scored, 'regionalRows': regional_count,
              'regionalScored': regional_scored, 'regionalUnverified': regional_count - regional_scored,
              'visualAcceptance': 'UNVERIFIED: fixtures/headless evidence, with subject-specific limits in independent review',
              'errors': errors,
              'scope': 'coverage, image decodability, SHA256, pose metadata, score arithmetic; not final graphics/GPU acceptance'}
    (root / 'validation.json').write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps(result, ensure_ascii=False))
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('directory', type=Path)
    args = parser.parse_args()
    raise SystemExit(0 if validate(args.directory.resolve())['ok'] else 1)
