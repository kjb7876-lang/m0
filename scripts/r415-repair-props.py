#!/usr/bin/env python3
"""R415: Drive 'Layout-Repair' / '-QA' prop candidates (Dots, 2026-11-08 15:19-20:08 UTC) -> in-game props for samong zones.

Dots re-padded (and for some, re-verified) the StoryProps candidates that were still on HOLD. The 13 candidates that R406
already places are the same art with wider margins only (manifest input_sha256 == R406 pngSHA256), and R406 crops to the
alpha box, so those are not replaced. This script takes the 32 repaired candidates that were never in the game and turns
them into props for the samong zone whose title matches the object (classroom desk -> '서른 개의 책상', mailbox -> '로비와
번호 없는 우편함', ...). The hanging chandelier is held (a ceiling fixture cannot stand on the floor).

Each PNG is improved here, never in place: sha256 checked against the zip MANIFEST when there is one, alpha 72..230 ->
0..255, 1 px erode, edge RGB from solid neighbours, crop+4, long side <= 384, WebP q92 (same as R406).
The rows are read by props-place-r406.js (IDXS) and placed by its boss() routine around the zone's dais / objective:
wall props on the nearest back wall facing the room, floor props 2.6-8 cells out on open floor. Draw only (solid:false).

usage: python -I scripts/r415-repair-props.py <staging dir with raw/<name>.png, x/<name>/MANIFEST.json, got.json> [out-dir]
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image

src = Path(sys.argv[1]); out = Path(sys.argv[2] if len(sys.argv) > 2 else 'r96/runtime-text/assets/r415/props')
LO, HI, LONG = 72, 230, 384

# name, Drive file, zone, mode, axis ('x' = art parallel to the -x wall, 'y' = the -y wall), draw height px (hero 66)
PROPS = [
  ('locker', 'S02-locker-layout-repair.png', 'sz115-S02-1', 'wall', 'y', 62),
  ('student-desk', 'StoryWorld-resumed207-S02-student-desk-QA.zip', 'sz115-S02-3', 'inner', None, 30),
  ('bulletin', 'S02-bulletin-layout-repair.png', 'sz115-S02-4', 'wall', 'y', 44),
  ('record-cabinet', 'S02-record-cabinet-layout-repair.png', 'sz115-S02-8', 'wall', 'y', 46),
  ('mailbox', 'S04-mailbox-layout-repair.png', 'sz115-S04-2', 'wall', 'y', 48),
  ('lobby-counter', 'S04-lobby-counter-layout-repair.png', 'sz115-S04-2', 'inner', None, 34),
  ('memory-rack', 'S04-memory-rack-layout-repair.png', 'sz115-S04-9', 'wall', 'y', 26),
  ('report-desk', 'S05-report-desk-layout-repair.png', 'sz115-S05-3', 'inner', None, 32),
  ('display-window', 'S05-display-window-layout-repair.png', 'sz115-S05-2', 'wall', 'y', 70),
  ('labcoat-chair', 'S06-labcoat-chair-layout-repair.png', 'sz115-S06-14', 'inner', None, 44),
  ('platform', 'StoryWorld-resumed212-S06-platform-QA.zip', 'sz115-S06-11', 'inner', None, 16),
  ('arrival-display', 'StoryWorld-resumed217-R00-arrival-display-padding-repair.zip', 'sz115-RA-1', 'wall', 'y', 30),
  ('patient-bed', 'StoryWorld-resumed208-R02-patient-bed-QA.zip', 'sz115-RA-5', 'inner', None, 34),
  ('two-chair', 'R03-two-chair-layout-repair.png', 'sz115-RB-1', 'inner', None, 40),
  ('cutting-block', 'StoryWorld-resumed201-R04-cutting-block-QA.zip', 'sz115-RB-4', 'inner', None, 18),
  ('swamp-bed', 'R07-swamp-bed-layout-repair.png', 'sz115-RD-2', 'inner', None, 32),
  ('grand-desk', 'R08-grand-desk-layout-repair.png', 'sz115-RD-4', 'inner', None, 32),
  ('low-table', 'StoryWorld-resumed205-R08-low-table-QA.zip', 'sz115-RD-4', 'inner', None, 20),
  ('bell', 'R09-bell-layout-repair.png', 'sz115-RD-7', 'wall', 'y', 36),
  ('waiting-bench', 'R10-waiting-bench-layout-repair.png', 'sz115-RE-1', 'inner', None, 30),
  ('news-window', 'R10-news-window-layout-repair.png', 'sz115-RE-1', 'wall', 'y', 48),
  ('manual-lever', 'StoryWorld-resumed203-R10-manual-lever-QA.zip', 'sz115-RE-1', 'wall', 'y', 30),
  ('paper-bowl', 'R11-paper-bowl-layout-repair.png', 'sz115-RF-2', 'inner', None, 18),
  ('paint-layer', 'R12-paint-layer-layout-repair.png', 'sz115-RF-3', 'inner', None, 20),
  ('empty-sleeve', 'R13-empty-sleeve-layout-repair.png', 'sz115-RG-3', 'inner', None, 16),
  ('bent-hand', 'StoryWorld-resumed218-R13-bent-hand-padding-repair.zip', 'sz115-RG-3', 'inner', None, 22),
  ('archive-shelf', 'R15-archive-shelf-layout-repair.png', 'sz115-RG-5', 'wall', 'y', 28),
  ('burned-books', 'R15-burned-books-layout-repair.png', 'sz115-RG-5', 'inner', None, 16),
  ('machine-heart', 'R15-machine-heart-layout-repair.png', 'sz115-RG-5', 'inner', None, 48),
  ('genealogy', 'StoryWorld-resumed216-R15-genealogy-halo-repair.zip', 'sz115-RG-5', 'inner', None, 14),
  ('monitor', 'R16-monitor-layout-repair.png', 'sz115-RG-9', 'inner', None, 32),
  ('care-table', 'StoryWorld-resumed204-R16-care-table-QA.zip', 'sz115-RG-9', 'inner', None, 30),
]
HELD = {'chandelier': 'R06-chandelier-layout-repair.png: ceiling fixture, cannot stand on the floor (R406 draws floor props only)'}


def clean(im):
    import numpy as np
    from PIL import ImageFilter
    a = np.asarray(im.convert('RGBA')).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3]
    al = np.clip((al - LO) * 255.0 / (HI - LO), 0, 255)
    al = np.asarray(Image.fromarray(al.astype(np.uint8)).filter(ImageFilter.MinFilter(3))).astype(np.float32)
    solid = al >= 250
    w = solid.astype(np.float32); acc = np.zeros_like(rgb); cnt = np.zeros_like(w)
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            acc += np.roll(np.roll(rgb * w[..., None], dy, 0), dx, 1); cnt += np.roll(np.roll(w, dy, 0), dx, 1)
    edge = (al > 0) & ~solid & (cnt > 0)
    rgb[edge] = acc[edge] / cnt[edge][:, None]
    img = Image.fromarray(np.dstack([rgb, al]).clip(0, 255).astype(np.uint8), 'RGBA')
    box = img.getchannel('A').point(lambda v: 255 if v >= 16 else 0).getbbox()
    box = (max(0, box[0] - 4), max(0, box[1] - 4), min(img.width, box[2] + 4), min(img.height, box[3] + 4))
    img = img.crop(box); s = min(1.0, LONG / max(img.size))
    return img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)


got = json.loads((src / 'got.json').read_text(encoding='utf-8'))
out.mkdir(parents=True, exist_ok=True)
index = {'revision': 'R415', 'method': f'alpha {LO}..{HI} -> 0..255, 1px erode, edge RGB from solid neighbours, crop+4, long side <= {LONG}, WebP q92',
         'held': HELD, 'props': {}}
for name, drive, zone, mode, axis, h in PROPS:
    png = src / 'raw' / (name + '.png'); data = png.read_bytes(); sha = hashlib.sha256(data).hexdigest()
    g = got[name]; assert g['sha256'] == sha, ('staging mismatch', name)
    man = None
    for m in g.get('man', []):
        man = json.loads((src / 'x' / name / m).read_text(encoding='utf-8'))
        assert man.get('sha256') in (None, sha), ('manifest mismatch', name)
    img = clean(Image.open(png)); key = 'r415-' + name
    p = out / (name + '.webp'); img.save(p, 'WEBP', quality=92, alpha_quality=100, method=6)
    index['props'][key] = {'zone': zone, 'mode': mode, 'axis': axis, 'height': h, 'path': 'assets/r415/props/' + p.name,
      'source': drive, 'pngSHA256': sha, 'manifestChecked': bool(man and man.get('sha256')),
      'dotsStatus': (man or {}).get('status') or 'REVIEW_STATIC_LAYOUT_REPAIR', 'size': list(img.size), 'bytes': p.stat().st_size,
      'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
    print(key, zone, mode, img.size, p.stat().st_size)
(out / 'index.json').write_text(json.dumps(index, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
