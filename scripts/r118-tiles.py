#!/usr/bin/env python3
"""R118: Drive 2026-10-29 map-surface materials -> assets/r118/tiles/<look>.webp.

Reads the lossless reconstructions of the Drive originals (floor/wall 1254x1254 RGB)
and writes one 2048x1024 WebP per look: floor on the left 1024 px, wall on the
right 1024 px (the same layout world-outdoor-r99 uses). A look with no wall keeps
the game's own wall. Originals are never modified; index.json records the source
hash, size and use of every image.

usage: python3 scripts/r118-tiles.py <reconstructed-root> <snow-floor.png> [out-dir]
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image

root = Path(sys.argv[1]); snow = Path(sys.argv[2])
out = Path(sys.argv[3] if len(sys.argv) > 3 else 'r96/runtime-text/assets/r118/tiles'); out.mkdir(parents=True, exist_ok=True)

# look -> (floor source, wall source, game regions). Regions come from the canon headings in the Drive catalog.
SRC = lambda *p: root.joinpath(*p)
LOOKS = {
  'garden':   (SRC('GARDEN-material3', 'floor-reconstructed.png'), None, ['dist00'], 'GARDEN-material3'),
  'cave':     (SRC('SPIDERCAVE-surface2', 'floor-reconstructed.png'), None, ['dist01'], 'SPIDERCAVE-surface2'),
  'castle':   (SRC('RUINED-castle2', 'castle-floor-reconstructed.png'), None, ['dist03'], 'RUINED-castle2'),
  # Hospital (ep1a08) is intentionally not listed: its floor is the existing atlas with crack/gloss variants, a plain linoleum would lose them.
  'kitchen':  (SRC('KITCHEN-material3', 'floor-reconstructed.png'), SRC('KITCHEN-material3', 'wall-reconstructed.png'), ['ep1b04'], 'KITCHEN-material3'),
  'vault':    (None, SRC('VAULT-v2-wall', 'wall-reconstructed.png'), ['ep1b06'], 'VAULT-v2-wall'),
  'cabin':    (SRC('CABIN-floorwall2', 'floor-reconstructed.png'), SRC('CABIN-floorwall2', 'wall-reconstructed.png'), ['ep1b06b'], 'CABIN-floorwall2'),
  'snow':     (snow, None, ['ep1b09'], 'SNOW-floor1'),
  'workshop': (SRC('WORKSHOP-material3', 'floor-reconstructed.png'), SRC('WORKSHOP-material3', 'wall-reconstructed.png'), ['kair07'], 'WORKSHOP-material3'),
  'meadow':   (SRC('MEADOW-floor', 'floor-reconstructed.png'), None, ['last304'], 'MEADOW-floor'),
  'rosehouse': (SRC('ROSEHOUSE-material2', 'floor-reconstructed.png'), SRC('ROSEHOUSE-material2', 'wall-reconstructed.png'), ['sz115-S01-1'], 'ROSEHOUSE-material2'),
  # SCHOOL: the wall is a full-height non-tileable design (plaster over wood panel), so only the floor is used.
  'school':   (SRC('SCHOOL-material3', 'floor-reconstructed.png'), None, ['sz115-S02-1', 'sz115-S02-2', 'sz115-S02-3', 'sz115-S02-4', 'sz115-S02-5', 'sz115-S02-6', 'sz115-S02-7', 'sz115-S02-8'], 'SCHOOL-material3'),
  'sparring': (SRC('SPARRING-material2', 'floor-reconstructed.png'), SRC('SPARRING-material2', 'wall-reconstructed.png'), ['sz115-S03-1', 'sz115-S03-2', 'sz115-S03-3'], 'SPARRING-material2'),
  'gyeongseong': (SRC('GYEONGSEONG-floorwall2', 'floor-reconstructed.png'), SRC('GYEONGSEONG-floorwall2', 'wall-reconstructed.png'), ['sz115-S05-1'], 'GYEONGSEONG-floorwall2'),
}

def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def rgb_sha(im): return hashlib.sha256(im.tobytes()).hexdigest()

index = {'schema': 'storyworld.r118.tiles/v1', 'source': 'Drive 2026-10-29 map surface catalog (StoryWorld-map-surfaces-catalog-20261029)', 'looks': {}}
for name, (floor, wall, regions, family) in LOOKS.items():
    sheet = Image.new('RGB', (2048, 1024), (0, 0, 0)); row = {'family': family, 'regions': regions, 'floor': None, 'wall': None}
    for slot, src, x in (('floor', floor, 0), ('wall', wall, 1024)):
        if src is None: continue
        im = Image.open(src).convert('RGB'); assert im.size == (1254, 1254), (src, im.size)
        sheet.paste(im.resize((1024, 1024), Image.LANCZOS), (x, 0))
        row[slot] = {'source': str(Path(src).name), 'decodedRgbSha256': rgb_sha(im), 'size': list(im.size)}
    p = out / (name + '.webp'); sheet.save(p, 'WEBP', quality=90, method=6)
    row['file'] = p.name; row['bytes'] = p.stat().st_size; row['sha256'] = sha(p)
    index['looks'][name] = row
(out / 'index.json').write_text(json.dumps(index, indent=1, ensure_ascii=False) + '\n')
print(json.dumps({k: [v['bytes'], v['regions']] for k, v in index['looks'].items()}, ensure_ascii=False))
