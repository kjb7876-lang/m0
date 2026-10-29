#!/usr/bin/env python3
"""R120: Drive 2026-10-29 damp cracked asphalt (WET-ASPHALT-floor) -> assets/r118/tiles/asphalt.webp.

Stitches the four lossless quadrants (Q1 top-left, Q2 top-right, Q3 bottom-left, Q4 bottom-right, 627 px each)
back into the 1254x1254 original, checks the decoded RGB hash against the bundle's RECONSTRUCT-MANIFEST.json,
and writes the same 2048x1024 sheet as scripts/r118-tiles.py (floor left; no wall, the game keeps its own).
The look is added to the existing assets/r118/tiles/index.json; other looks are untouched.
Region: sz115-S03-5 "스물세 해 전 빗속" (canon L1109 wet asphalt / L1119 rain).

usage: python -I scripts/r120-tiles.py <WET-ASPHALT PART01 dir> <PART02 dir> [out-dir]
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image

p1, p2 = Path(sys.argv[1]), Path(sys.argv[2])
out = Path(sys.argv[3] if len(sys.argv) > 3 else 'r96/runtime-text/assets/r118/tiles')
man = json.loads((p1 / 'RECONSTRUCT-MANIFEST.json').read_text(encoding='utf-8'))['materials'][0]
full = Image.new('RGB', tuple(man['size']))
for q in man['quadrants']:
    src = next(d / q['path'] for d in (p1, p2) if (d / q['path']).exists())
    full.paste(Image.open(src).convert('RGB'), tuple(q['box_xyxy'][:2]))
rgb = hashlib.sha256(full.tobytes()).hexdigest()
assert rgb == man['decoded_RGB_sha256'], ('reconstruction mismatch', rgb)
sheet = Image.new('RGB', (2048, 1024), (0, 0, 0)); sheet.paste(full.resize((1024, 1024), Image.LANCZOS), (0, 0))
p = out / 'asphalt.webp'; sheet.save(p, 'WEBP', quality=90, method=6)
idx_path = out / 'index.json'; index = json.loads(idx_path.read_text(encoding='utf-8'))
index['looks']['asphalt'] = {'family': 'WET-ASPHALT-floor', 'regions': ['sz115-S03-5'],
  'floor': {'source': man['original_name'], 'decodedRgbSha256': rgb, 'size': man['size']}, 'wall': None,
  'file': p.name, 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'added': 'R120'}
idx_path.write_text(json.dumps(index, indent=1, ensure_ascii=False) + '\n')
print('asphalt', p.stat().st_size, rgb[:12])
