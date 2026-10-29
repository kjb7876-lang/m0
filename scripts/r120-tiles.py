#!/usr/bin/env python3
"""R120: Drive 2026-10-29 floor bundles -> assets/r118/tiles/<look>.webp (floor only; the game keeps its own wall).

Each bundle carries lossless quadrants (627 px, boxes listed in its RECONSTRUCT-MANIFEST.json) spread over PART
folders. They are stitched back into the 1254x1254 original, the decoded RGB hash is checked against the manifest,
and the same 2048x1024 sheet as scripts/r118-tiles.py is written (floor left). Looks are added to the existing
assets/r118/tiles/index.json; other looks are untouched. Originals are never modified.
  asphalt   WET-ASPHALT-floor  -> sz115-S03-5 "스물세 해 전 빗속" (canon L1109 wet asphalt / L1119 rain)
  sandblack TIME-SAND black    -> kair10 붕괴 의식장, kair03 세이렌 모르 (canon: 검은 모래가 발을 덮어)
  sandgold  TIME-SAND gold     -> restKairo 최초명령 재작성 (after-state once the harvested time is released)

usage: python -I scripts/r120-tiles.py <dir holding the unzipped PART folders> [out-dir]
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image

root = Path(sys.argv[1]); out = Path(sys.argv[2] if len(sys.argv) > 2 else 'r96/runtime-text/assets/r118/tiles')
JOBS = [  # look, bundle folder prefix, material name in the manifest, family, regions
  ('asphalt', 'StoryWorld-WET-ASPHALT-floor-20261029', 'floor', 'WET-ASPHALT-floor', ['sz115-S03-5']),
  ('sandblack', 'StoryWorld-TIME-SAND-pair-20261029', 'black', 'TIME-SAND-black', ['kair10', 'kair03']),
  ('sandgold', 'StoryWorld-TIME-SAND-pair-20261029', 'gold', 'TIME-SAND-gold', ['restKairo']),
]
idx_path = out / 'index.json'; index = json.loads(idx_path.read_text(encoding='utf-8'))
for look, prefix, mat, family, regions in JOBS:
    parts = sorted(root.glob(prefix + '-PART*'))
    if not parts: print('skip', look, '(bundle not found)'); continue
    man = next(json.loads(m.read_text(encoding='utf-8')) for m in (p / 'RECONSTRUCT-MANIFEST.json' for p in parts) if m.exists())
    man = next(m for m in man['materials'] if m['name'] == mat)
    full = Image.new('RGB', tuple(man['size']))
    for q in man['quadrants']:
        src = next(p / q['path'] for p in parts if (p / q['path']).exists())
        full.paste(Image.open(src).convert('RGB'), tuple(q['box_xyxy'][:2]))
    rgb = hashlib.sha256(full.tobytes()).hexdigest()
    assert rgb == man['decoded_RGB_sha256'], ('reconstruction mismatch', look, rgb)
    sheet = Image.new('RGB', (2048, 1024), (0, 0, 0)); sheet.paste(full.resize((1024, 1024), Image.LANCZOS), (0, 0))
    p = out / (look + '.webp'); sheet.save(p, 'WEBP', quality=90, method=6)
    index['looks'][look] = {'family': family, 'regions': regions,
      'floor': {'source': man['original_name'], 'decodedRgbSha256': rgb, 'size': man['size']}, 'wall': None,
      'file': p.name, 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'added': 'R120'}
    print(look, p.stat().st_size, rgb[:12], regions)
idx_path.write_text(json.dumps(index, indent=1, ensure_ascii=False) + '\n')
