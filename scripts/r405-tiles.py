#!/usr/bin/env python3
"""R405: Drive SW-TILE batches (2026-11-07/08) -> assets/r118/tiles/<look>.webp for regions that had no dedicated look.

Each SW-TILE-BNN batch is a split archive; reassemble it (join the payload parts in order, check the full SHA-256 in
its delivery index) and unzip it, then pass the folders holding `originals/` and `manifest.json`. Every material's
file hash is checked against the batch manifest before use. Output is the same 2048x1024 sheet as
scripts/r118-tiles.py (floor left 1024 px, wall right 1024 px, LANCZOS from 1254 px). Originals are never modified.
The batches are marked HOLD for repeat review: each material was checked tiled 2x2 by eye and by an edge-seam
ratio (edge column/row difference over the mean neighbouring difference, all <= 2.4 except the theatre plank
floor's row seam, which lands on a plank groove).
  swampmud  B07 swamp floor + earth cut   -> dist02   늪지대의 뿔악마 (outdoor: natural boundary wall)
  gravepath B03 grave dirt + boundary wall -> kair09   망각의 묘지     (outdoor)
  theatre   B03 theatre plank + curtain    -> ep1b05   붉은 하이힐     (indoor)
  hotel     B05 hotel corridor tile + wall -> murder02 장민재와 새빛호텔 (indoor)
  rooftop   B05 rooftop floor + parapet    -> murder03 옥상의 순환     (outdoor)

usage: python -I scripts/r405-tiles.py <B03 dir> <B05 dir> <B07 dir> [out-dir]
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image, ImageEnhance

b03, b05, b07 = (Path(a) for a in sys.argv[1:4])
out = Path(sys.argv[4] if len(sys.argv) > 4 else 'r96/runtime-text/assets/r118/tiles')
# The theatre plank floor is painted almost black (mean RGB ~20 of 255); under the game's torch light it read as a
# void in headless captures, so that floor half is brightened (the original file is untouched).
LIFT = {('theatre', 'floor'): 1.9}
JOBS = [  # look, batch dir, floor, wall, regions
  ('swampmud', b07, 'swamp_outdoor_floor.png', 'swamp_outdoor_wall.png', ['dist02']),
  ('gravepath', b03, 'grave_outdoor_floor.png', 'grave_outdoor_wall.png', ['kair09']),
  ('theatre', b03, 'theatre_indoor_floor.png', 'theatre_indoor_wall.png', ['ep1b05']),
  ('hotel', b05, 'hotel_indoor_floor.png', 'hotel_indoor_wall.png', ['murder02']),
  ('rooftop', b05, 'roof_outdoor_floor.png', 'roof_outdoor_wall.png', ['murder03']),
]
idx_path = out / 'index.json'; index = json.loads(idx_path.read_text(encoding='utf-8'))


def material(batch, name):
    man = json.loads((batch / 'manifest.json').read_text(encoding='utf-8'))
    row = next(a for a in man['assets'] if a['file'] == name)
    data = (batch / 'originals' / name).read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    assert sha == row['sha256'], ('manifest mismatch', name, sha)
    return man['batch'], row, Image.open(batch / 'originals' / name).convert('RGB')


for look, batch, floor, wall, regions in JOBS:
    sheet = Image.new('RGB', (2048, 1024), (0, 0, 0)); meta = {}
    for side, name, x in (('floor', floor, 0), ('wall', wall, 1024)):
        bname, row, im = material(batch, name)
        half = im.resize((1024, 1024), Image.LANCZOS)
        if (look, side) in LIFT: half = ImageEnhance.Brightness(half).enhance(LIFT[(look, side)])
        sheet.paste(half, (x, 0))
        meta[side] = {'batch': bname, 'source': name, 'sha256': row['sha256'], 'decodedRgbSha256': hashlib.sha256(im.tobytes()).hexdigest(), 'size': row['size'], 'usage': row['usage'], 'environment': row['environment'], **({'brightness': LIFT[(look, side)]} if (look, side) in LIFT else {})}
    p = out / (look + '.webp'); sheet.save(p, 'WEBP', quality=90, method=6)
    index['looks'][look] = {'family': meta['floor']['batch'], 'regions': regions, **meta, 'file': p.name,
      'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'added': 'R405'}
    print(look, p.stat().st_size, regions)
idx_path.write_text(json.dumps(index, indent=1, ensure_ascii=False) + '\n')
