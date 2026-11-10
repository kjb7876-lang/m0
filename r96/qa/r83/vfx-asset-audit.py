#!/usr/bin/env python3
"""Read-only pixel/hash checks on the shipped R83 static effect artwork.

The optional contact sheets are analysis evidence, not replacement game assets.
This script never modifies or re-encodes an input PNG.
"""
from __future__ import annotations
import argparse
import collections
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def audit(asset_root, montage=False):
    source = json.loads((HERE / 'vfx-asset-audit-source.json').read_text())
    catalog = source['catalog']; entries = catalog['selected']; checks = []
    rows = []; failures = []
    def check(name, passed, detail=None):
        checks.append({'name': name, 'passed': bool(passed), 'detail': detail})
    def asset_file(entry):
        return asset_root / Path(entry['file']).relative_to('selected')
    check('Source catalog contains64 unique selected static components', catalog['count'] == len(entries) == 64 and len({e['file'] for e in entries}) == 64)
    decisions = collections.Counter(e['decision'] for e in entries)
    check('Selection provenance is48 upgrades and16 retained originals', decisions == {'upgrade': 48, 'retained_original': 16} and catalog['upgraded'] == 48 and catalog['retained_original'] == 16, dict(decisions))
    check('Retained-original hashes preserve source bytes and upgrade hashes differ', all((e['sha256'] == e['source_sha256']) == (e['decision'] == 'retained_original') for e in entries))
    expected = {str(Path(e['file']).relative_to('selected')) for e in entries}
    actual = {str(p.relative_to(asset_root)) for p in asset_root.rglob('*.png')}
    check('Shipped asset directory contains exactly the64 documented PNGs', actual == expected, {'missing': sorted(expected - actual), 'extra': sorted(actual - expected), 'actual_count': len(actual)})
    for e in entries:
        file = asset_file(e)
        if not file.is_file():
            failures.append({'file': e['file'], 'error': 'missing shipped PNG'}); continue
        try:
            with Image.open(file) as im:
                im.load(); alpha = im.getchannel('A') if im.mode == 'RGBA' else None
                if alpha is None:
                    failures.append({'file': e['file'], 'error': 'not RGBA'}); continue
                hist = alpha.histogram(); total = im.width * im.height
                edge = max(max(alpha.crop((0,0,im.width,1)).getextrema()), max(alpha.crop((0,im.height-1,im.width,im.height)).getextrema()), max(alpha.crop((0,0,1,im.height)).getextrema()), max(alpha.crop((im.width-1,0,im.width,im.height)).getextrema()))
                bbox = alpha.point(lambda a: 255 if a > 64 else 0).getbbox()
                margins = [bbox[0]/im.width,bbox[1]/im.height,(im.width-bbox[2])/im.width,(im.height-bbox[3])/im.height] if bbox else None
                rows.append({'file': e['file'], 'sha256': digest(file), 'mode': im.mode, 'dimensions': list(im.size), 'bytes': file.stat().st_size, 'decoded_rgba_bytes': total*4, 'alpha_range': list(alpha.getextrema()), 'fully_transparent_fraction': hist[0]/total, 'outermost_alpha_max': edge, 'alpha64_bbox': list(bbox) if bbox else None, 'strict10percent_alpha64_margin_pass': margins is not None and min(margins) >= .1, 'strong_alpha_min_margin_fraction': min(margins) if margins else 0, 'alpha64_pixel_fraction': sum(hist[65:])/total})
        except Exception as exc:
            failures.append({'file': e['file'], 'error': str(exc)})
    check('Every selected PNG decodes successfully as RGBA', len(rows) == 64 and not failures, failures)
    by_file = {r['file']: r for r in rows}
    def every(predicate):
        return len(rows) == 64 and all(predicate(e, by_file[e['file']]) for e in entries)
    check('Shipped PNG SHA256 matches selected-quality catalog', every(lambda e,r: r['sha256'] == e['sha256']))
    check('Shipped PNG SHA256 independently matches source SHA256SUMS', every(lambda e,r: r['sha256'] == source['sha256sums'].get(e['file'])) and {p for p in source['sha256sums'] if p.startswith('selected/')} == {e['file'] for e in entries})
    check('Dimensions and RGBA modes match catalog without uniform-size assumptions', every(lambda e,r: r['dimensions'] == e['dimensions'] and r['mode'] == e['mode'] == 'RGBA'), dict(collections.Counter('x'.join(map(str,r['dimensions'])) for r in rows)))
    check('Encoded byte lengths and decoded RGBA budget match source metadata', every(lambda e,r: r['bytes'] == e['bytes'] and r['decoded_rgba_bytes'] == e['decoded_rgba_bytes']), {'encoded_png_bytes': sum(r['bytes'] for r in rows), 'decoded_rgba_bytes': sum(r['decoded_rgba_bytes'] for r in rows), 'decoded_rgba_MiB': sum(r['decoded_rgba_bytes'] for r in rows)/1048576, 'GPU_memory_measured': False})
    check('Alpha extrema and transparent fractions match catalog', every(lambda e,r: r['alpha_range'] == e['alpha_range'] and abs(r['fully_transparent_fraction']-e['fully_transparent_fraction']) < 1e-12))
    check('All64 retain true transparency and outermost alpha at most1 of255', every(lambda e,r: r['alpha_range'][0] == 0 and r['fully_transparent_fraction'] > 0 and r['outermost_alpha_max'] <= 1))
    check('Alpha-above64 shape bounds match source review', every(lambda e,r: r['alpha64_bbox'] == e['alpha64_bbox'] and r['outermost_alpha_max'] == e['outermost_alpha_max']))
    safe = sum(r['strict10percent_alpha64_margin_pass'] for r in rows)
    check('Only16 of64 pass strict10percent strong-alpha padding, accurately reported', every(lambda e,r: r['strict10percent_alpha64_margin_pass'] == e['strict10percent_alpha64_margin_pass']) and safe == 16, {'strict_padding_pass': safe, 'minimum_strong_alpha_margin_fraction': min((r['strong_alpha_min_margin_fraction'] for r in rows), default=0), 'limitation': '48 assets do not have10percent padding. Preserve whole source canvases; no automatic edge trimming.'})
    if montage and len(rows) == 64:
        font_path = Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
        font = ImageFont.truetype(str(font_path),11) if font_path.exists() else ImageFont.load_default()
        for batch in range(1,5):
            selected = [e for e in entries if e['file'].startswith(f'selected/batch{batch:02}/')]
            board = Image.new('RGB',(928,760),(24,28,34)); draw = ImageDraw.Draw(board)
            for i,e in enumerate(selected):
                x=i%4*232; y=i//4*190; name=Path(e['file']).stem
                for at in range(0,len(name),32): draw.text((x+5,y+2+(at//32)*13),name[at:at+32],font=font,fill=(225,230,233))
                with Image.open(asset_file(e)) as im:
                    thumb=im.convert('RGBA');thumb.thumbnail((128,128),Image.Resampling.LANCZOS)
                mat=Image.new('RGBA',(128,128),(24,28,34,255));ImageDraw.Draw(mat).rectangle((64,0,127,127),fill=(112,119,114,255));mat.alpha_composite(thumb,((128-thumb.width)//2,(128-thumb.height)//2));board.paste(mat.convert('RGB'),(x+52,y+43))
                draw.text((x+5,y+174),e['decision']+' / max128px',font=font,fill=(170,180,187))
            board.save(HERE / f'vfx-contact-128-batch{batch:02}.png')
    return {'method': 'Read-only Pillow RGBA decode/hash/alpha measurements on shipped static PNGs; source PNGs never edited. Optional128px sheets use artificial dark/neutral backgrounds, not game screenshots.', 'asset_root': str(asset_root), 'checks': checks, 'passed': all(c['passed'] for c in checks), 'assets': rows, 'visual_review': {'contact_sheets_all64_inspected': True, 'maximum_thumbnail_dimension': 128, 'backgrounds': ['artificial dark RGB24/28/34','artificial neutral RGB112/119/114'], 'findings': ['Projectile and contact silhouettes generally retain a readable main axis at128px.', 'Dark scorch/groove/circuit/gaze residue can disappear on dark terrain; use as subordinate short residue, never the sole warning.', 'Warning art is baked stylized perspective and does not establish a precise damage footprint. Keep native analytic warning outlines.', 'Golden order wall is an oblique upright wall image, not an orthographic ground footprint.', 'Full source canvas keeps glow tips. Some major silhouettes have only1.56percent edge padding; do not tighten crop automatically.'], 'limitations': ['Not browser/GPU blending, terrain contrast, animation or natural-play validation.', '384MiB decoded RGBA is a sum of bytes, not measured GPU or browser memory. Load by region and release unused images.']}, 'browserVerified': False, 'GPUVerified': False}

if __name__ == '__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--asset-root',type=Path,default=ROOT/'hospital-three-pc/site/assets/vfx-r83/selected');parser.add_argument('--montage',action='store_true');args=parser.parse_args()
    report=audit(args.asset_root,args.montage)
    (HERE/'vfx-asset-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(f"{sum(c['passed'] for c in report['checks'])}/{len(report['checks'])}")
    raise SystemExit(0 if report['passed'] else 1)
