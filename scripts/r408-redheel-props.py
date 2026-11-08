#!/usr/bin/env python3
"""R408: Drive SW-map-redheel (spec 23, 2026-11-05, REVIEW_CANDIDATE) -> props for 붉은 하이힐 (ep1b05) boss area.

Dots delivered 9 lounge props (front/oblique 512 px RGBA derivatives + original + MANIFEST/index). Improvements here:
  - every derivative PNG hash is checked against the package index.json;
  - composite sheets are split into separate props at the widest empty column/row gap of the alpha (Dots: "무대단·바/선반·거울/벽판은
    시점별로 부품이 함께 있어 독립 배치 전에 분리가 필요"): stage -> long stage + side stage, wall-decor -> mirror + mask panel;
      - the same halo/edge clean-up as scripts/r406-boss-props.py, crop+4, long side <= 384, WebP q92.
Not used: bar (the room already has the SW-0009 lounge bar and bottle cabinet), chandelier (hanging piece; the floor-pivot sprite would stand on the floor, and its painted floor shadow reads as a
grey blob), spotlight beam (light cone, the game draws its own light), silver threads (Dots HELD).
Rows go to assets/r408/props/index.json in the R406 boss-prop format (zone = region id), read by props-place-r406.js.

usage: python -I scripts/r408-redheel-props.py <dir with one folder per unzipped package: bar, curtain, ...> [out-dir]
"""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from PIL import Image
src = Path(sys.argv[1]); out = Path(sys.argv[2] if len(sys.argv) > 2 else 'r96/runtime-text/assets/r408/props')
LONG = 384
# Heights are STORY-map px (the room's SW-0009 lounge bar is drawn 170 px tall; samong rooms use a smaller scale).
# name, package, derivative, component (None = whole; 0/1 = largest/second by left-to-right order), mode, axis, height px
PROPS = [
  ('lounge-seats', 'seats', 'seats-oblique-512-review.png', None, 'inner', None, 150),
  ('cocktail-table', 'table', 'table-oblique-512-review.png', None, 'inner', None, 112),
  ('stage-spot', 'spotlight', 'spotlight-fixture-oblique-512-review.png', None, 'inner', None, 165),
  ('red-heels', 'heels', 'heels-oblique-512-review.png', None, 'inner', None, 44),
  ('stage-long', 'stage', 'stage-front-512-review.png', 'top', 'inner', None, 80),
  ('red-curtain', 'curtain', 'curtain-oblique-512-review.png', None, 'wall', 'y', 235),
  ('veiled-mirror', 'wall-decor', 'wall-decor-oblique-512-review.png', 'left', 'wall', 'y', 175),
  ('mask-panel', 'wall-decor', 'wall-decor-oblique-512-review.png', 'right', 'wall', 'y', 150),
]


def clean(img):
    a = np.asarray(img.convert('RGBA')).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3]
    al = np.clip((al - 24) * 255.0 / (230 - 24), 0, 255)
    solid = al >= 250; w = solid.astype(np.float32); acc = np.zeros_like(rgb); cnt = np.zeros_like(w)
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            acc += np.roll(np.roll(rgb * w[..., None], dy, 0), dx, 1); cnt += np.roll(np.roll(w, dy, 0), dx, 1)
    edge = (al > 0) & ~solid & (cnt > 0); rgb[edge] = acc[edge] / cnt[edge][:, None]
    return Image.fromarray(np.dstack([rgb, al]).clip(0, 255).astype(np.uint8), 'RGBA')


def part(img, which):
    """Keep one piece of a two-piece sheet: cut at the longest run of empty columns (left/right) or rows (top)."""
    if which is None: return img
    al = np.asarray(img.getchannel('A')) > 40; axis = 0 if which in ('left', 'right') else 1
    occ = al.any(axis=axis); idx = np.nonzero(occ)[0]; lo, hi = idx[0], idx[-1]
    best, run, start, cut = 0, 0, None, None
    for i in range(lo, hi + 1):
        if not occ[i]:
            run += 1; start = i if run == 1 else start
            if run > best: best, cut = run, start + run // 2
        else: run = 0
    assert cut is not None and best >= 3, ('no gap to split', which)
    a = np.asarray(img).copy()
    if which == 'left': a[:, cut:, 3] = 0
    elif which == 'right': a[:, :cut, 3] = 0
    else: a[cut:, :, 3] = 0
    return Image.fromarray(a, 'RGBA')


out.mkdir(parents=True, exist_ok=True)
index = {'revision': 'R408', 'method': 'index sha check, alpha 24..230 -> 0..255, edge RGB from solid neighbours, component split, crop+4, long side <= 384, WebP q92', 'props': {}}
for name, pkg, file, which, mode, axis, h in PROPS:
    folder = src / pkg; meta = json.loads((folder / 'index.json').read_text(encoding='utf-8'))
    row = next(s for s in meta['sprites'] if s['file'] == file)
    data = (folder / file).read_bytes(); sha = hashlib.sha256(data).hexdigest(); assert sha == row['sha256'], ('index mismatch', file)
    img = part(clean(Image.open(folder / file)), which)
    box = img.getchannel('A').point(lambda v: 255 if v >= 16 else 0).getbbox()
    img = img.crop((max(0, box[0] - 4), max(0, box[1] - 4), min(img.width, box[2] + 4), min(img.height, box[3] + 4)))
    s = min(1.0, LONG / max(img.size)); img = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
    p = out / (name + '.webp'); img.save(p, 'WEBP', quality=92, alpha_quality=100, method=6)
    index['props'][name] = {'zone': 'ep1b05', 'mode': mode, 'axis': axis, 'height': h, 'path': 'assets/r408/props/' + p.name,
      'source': 'SW-map-redheel_' + pkg + '_v1_review.zip', 'png': file, 'pngSHA256': sha, 'manifestChecked': True,
      'part': which, 'dotsStatus': meta.get('status'), 'size': list(img.size), 'bytes': p.stat().st_size,
      'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
    print(name, mode, img.size, p.stat().st_size)
(out / 'index.json').write_text(json.dumps(index, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
