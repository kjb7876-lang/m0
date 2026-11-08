#!/usr/bin/env python3
"""R407: Drive SW-TILE B15/B16/B17/B19-FINAL7 (2026-11-08) -> assets/r118/tiles/<look>.webp for regions whose canon
place matches the batch theme and which had no dedicated look. Same sheet format as scripts/r405-tiles.py (2048x1024,
floor left, wall right, LANCZOS from 1254 px). Reassemble each split batch first (join payload parts in order and
check the full SHA-256 in its delivery index), unzip, and pass the folders holding `originals/` and `manifest.json`.
Every material's file hash is checked against its batch manifest. Originals are never modified.
The batches are HOLD/review candidates; each material was checked tiled 2x2 by eye before use.
  slothhouse  B15 sloth house parquet + papered wall   -> ep1b02 나태의 집 (house, indoor)
  arbelia     B16 Arbelia sealed corridor             -> kair02 아르벨리아, 유예의 수문장 (clock hall, indoor)
  corevault   B17 central core relocation room        -> u206 중앙 코어 이주실 (machine, indoor)
  sleepport   B19 sleepless village port              -> last302 잠들지 못하는 마을 (port village, outdoor)
  blackkeep   B19 fallen angel coastal keep           -> last301 타락천사 기사 (black sea keep, outdoor)
  villastair  B19 Cheongrok villa stairwell           -> murder04 고서진과 청록빌라 (villa, indoor)
  cultaltar   B19 cyborg cult final altar             -> cult04 교주의 사몽 (altar/core text, throne)
Not used: B16 gate (no matching region), B19 twin castle (floor is a diagonal transition panel, not a repeat tile),
B19 sleepless house (no indoor region in the village), B19 rose house (S-01 already has one), B15 envy house, B17 counselling shelter (dreamRest is a dark void-backdrop room where the floor never reads; tried and dropped).

usage: python -I scripts/r407-tiles.py <B15 dir> <B16 dir> <B17 dir> <B19 dir> [out-dir]
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image, ImageEnhance

b15, b16, b17, b19 = (Path(a) for a in sys.argv[1:5])
out = Path(sys.argv[5] if len(sys.argv) > 5 else 'r96/runtime-text/assets/r118/tiles')
# (brightness, saturation) per half. Very dark sheets read as a void under the game's torch light. Originals are untouched.
ADJ = {('cultaltar', 'floor'): (1.5, 1.0), ('cultaltar', 'wall'): (1.4, 1.0), ('corevault', 'floor'): (1.25, 1.0),
       ('villastair', 'floor'): (1.15, 1.0)}
JOBS = [  # look, batch dir, floor, wall, regions
  ('slothhouse', b15, 'sloth_indoor_floor.png', 'sloth_indoor_wall.png', ['ep1b02']),
  ('arbelia', b16, 'arbellia_indoor_floor.png', 'arbellia_indoor_wall.png', ['kair02']),
  ('corevault', b17, 'core_indoor_floor.png', 'core_indoor_wall.png', ['u206']),
  ('sleepport', b19, 'sleepless_coast_floor.png', 'sleepless_coast_wall.png', ['last302']),
  ('blackkeep', b19, 'coastal_floor.png', 'coastal_wall.png', ['last301']),
  ('villastair', b19, 'villa_floor.png', 'villa_wall.png', ['murder04']),
  ('cultaltar', b19, 'altar_floor.png', 'altar_wall.png', ['cult04']),
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
        adj = ADJ.get((look, side))
        if adj:
            half = ImageEnhance.Brightness(half).enhance(adj[0])
            if adj[1] != 1.0: half = ImageEnhance.Color(half).enhance(adj[1])
        sheet.paste(half, (x, 0))
        meta[side] = {'batch': bname, 'source': name, 'sha256': row['sha256'], 'decodedRgbSha256': hashlib.sha256(im.tobytes()).hexdigest(),
                      'size': row['size'], 'usage': row['usage'], 'environment': row['environment'],
                      **({'brightness': adj[0], 'saturation': adj[1]} if adj else {})}
    p = out / (look + '.webp'); sheet.save(p, 'WEBP', quality=90, method=6)
    index['looks'][look] = {'family': meta['floor']['batch'], 'regions': regions, **meta, 'file': p.name,
      'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'added': 'R407'}
    print(look, p.stat().st_size, regions)
idx_path.write_text(json.dumps(index, indent=1, ensure_ascii=False) + '\n')
