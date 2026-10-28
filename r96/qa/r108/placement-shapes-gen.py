"""R108 placement: generate client-source/placement-data-r108.js (decor silhouette shapes).

usage:  python placement-shapes-gen.py <built-site-dir> <out placement-data-r108.js>
needs:  Pillow, numpy.  <built-site-dir> is the folder that holds index.html, assets/** and world-assets-r80-data.js
        (r96/hospital-three-pc/site).

For every decor sprite the placement overlay can meet (plain props, R99 trees, R105 static props, Drive art props,
R59/R60 shoulder scenery, R74 atlas cells, R80 scene art) it stores the real silhouette so that the clearance model
(placement-r108.js) tests the pixels that are really drawn, not the whole bounding box.

  key     'props/v290/dead_tree'  (path under assets/, no extension)   plain sprite()  -> "s,<w/h>,<mask>"
          'tree:dead' | 'tree:living'                                   union of the 12 sway frames
          'r74:statue'                                                  atlas cell (frame pivot) -> "f,l,r,t,b,<mask>"
          'r80:r80-013'                                                 R80 art (frame pivot)    -> "f,l,r,t,b,<mask>"
  l,r,t,b extents relative to the foot pivot as multiples of the visible height (t above, b below the pivot)
  mask    10 columns x 12 rows (row 0 = top) over the visible bounds, 1 bit per cell, 30 hex digits;
          a cell is set when >= 10% of its pixels have alpha > 18 (the threshold of imageCrop()).
"""
import glob
import json
import os
import re
import sys

import numpy as np
from PIL import Image

SITE = os.path.abspath(sys.argv[1])
OUT = os.path.abspath(sys.argv[2])
COLS, ROWS, THRESH, COVER = 10, 12, 18, 0.10


def mask_hex(alpha):
    h, w = alpha.shape
    v = 0
    for j in range(ROWS):
        y0 = int(j * h / ROWS)
        y1 = max(int((j + 1) * h / ROWS), y0 + 1)
        for i in range(COLS):
            x0 = int(i * w / COLS)
            x1 = max(int((i + 1) * w / COLS), x0 + 1)
            cell = alpha[y0:y1, x0:x1]
            bit = 1 if cell.size and float((cell > THRESH).mean()) >= COVER else 0
            v = (v << 1) | bit
    return '%030x' % v


def alpha_of(path):
    im = Image.open(path).convert('RGBA')
    return np.array(im)[:, :, 3]


def bbox(alpha):
    ys, xs = np.where(alpha > THRESH)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


shapes = {}


def key_of(rel):
    rel = rel.replace('\\', '/')
    rel = re.sub(r'^assets/', '', rel)
    return re.sub(r'\.(webp|png)$', '', rel)


def add_sprite(key, path):
    try:
        alpha = alpha_of(path)
    except Exception as e:  # pragma: no cover
        print('skip', key, e)
        return
    H, W = alpha.shape
    bb = bbox(alpha)
    if not bb:
        return
    x0, y0, x1, y1 = max(0, bb[0] - 1), max(0, bb[1] - 1), min(W, bb[2] + 1), min(H, bb[3] + 1)
    shapes[key] = 's,%.4f,%s' % ((x1 - x0) / (y1 - y0), mask_hex(alpha[y0:y1, x0:x1]))


def add_frame(key, path, rect, pivot, vb, vh):
    alpha = alpha_of(path)
    sx, sy, sw, sh = rect
    cell = alpha[sy:sy + sh, sx:sx + sw]
    x0, y0, x1, y1 = [int(round(v)) for v in vb]
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(sw, x1), min(sh, y1)
    crop = cell[y0:y1, x0:x1]
    if crop.size == 0:
        return
    px, py = pivot
    shapes[key] = 'f,%.4f,%.4f,%.4f,%.4f,%s' % ((vb[0] - px) / vh, (vb[2] - px) / vh, (py - vb[1]) / vh, (vb[3] - py) / vh, mask_hex(crop))


# 1. plain props (native regional scene art, source structures)
for p in sorted(glob.glob(os.path.join(SITE, 'assets', 'props', '**', '*.webp'), recursive=True)):
    add_sprite(key_of(os.path.relpath(p, SITE)), p)

# 2. R99 trees: the union of the 12 sway frames per kind, median crop aspect
for kind in ('dead', 'living'):
    crops = []
    for p in sorted(glob.glob(os.path.join(SITE, 'assets', 'r99', 'outdoor', 'tree-%s-*.webp' % kind))):
        a = alpha_of(p)
        bb = bbox(a)
        if bb:
            crops.append((a, bb))
    if not crops:
        continue
    ws = sorted(b[2] - b[0] for _, b in crops)
    hs = sorted(b[3] - b[1] for _, b in crops)
    acc = 0
    for a, bb in crops:
        acc |= int(mask_hex(a[bb[1]:bb[3], bb[0]:bb[2]]), 16)
    shapes['tree:' + kind] = 's,%.4f,%030x' % (ws[len(ws) // 2] / hs[len(hs) // 2], acc)

# 3. R105 static props, Drive art props (R105/R106), R59/R60 shoulder scenery props
for pat in ('assets/r105/props/*.webp', 'assets/r105/drive/prop-*.webp', 'assets/r105/drive/mob-student.webp', 'assets/r106/drive/*.webp',
            'assets/scenery-r59/*-prop*.webp', 'assets/scenery-r60/*-prop*.webp'):
    for p in sorted(glob.glob(os.path.join(SITE, pat))):
        add_sprite(key_of(os.path.relpath(p, SITE)), p)

# 4. R74 atlas cells (StoryArtR74 is one JSON literal inside index.html)
html = open(os.path.join(SITE, 'index.html'), encoding='utf-8').read()
m = re.search(r'globalThis\.StoryArtR74=Object\.freeze\(', html)
depth, i, start = 0, m.end() - 1, m.end() - 1
while True:
    c = html[i]
    depth += (c == '(') - (c == ')')
    i += 1
    if depth == 0:
        break
art = json.loads(html[start + 1:i - 1])
atlas = art['atlases']['props']
atlas_png = os.path.join(SITE, atlas['path'])
for c in atlas['cells']:
    add_frame('r74:' + c['key'], atlas_png, c['sourceRect'], c['pivot'], c['visibleBounds'], c['visibleHeight'])

# 5. R80 scene art (frame data lives in world-assets-r80-data.js)
data = open(os.path.join(SITE, 'world-assets-r80-data.js'), encoding='utf-8').read()
d = json.loads(data.split('=', 1)[1].rstrip().rstrip(';'))
for k, a in sorted(d['assets'].items()):
    fr = a['frame']
    add_frame('r80:' + k, os.path.join(SITE, a['path']), fr['sourceRect'], fr['pivot'], fr['visibleBounds'], fr['visibleHeight'])

lines = ['/* R108 placement data: silhouettes of the decor sprites (generated by qa/r108/placement-shapes-gen.py from the shipped art; do not edit).',
         ' * Format and keys are described in that script. The clearance model in placement-r108.js reads this table; unknown art falls back to its image crop. */',
         'window.__STORYWORLD_PLACEMENT_DATA_R108__=Object.freeze({revision:\'R108-placement-data-1\',cols:%d,rows:%d,count:%d,shapes:{' % (COLS, ROWS, len(shapes))]
items = sorted(shapes.items())
for n, (k, v) in enumerate(items):
    lines.append(' %s:%s%s' % (json.dumps(k), json.dumps(v), ',' if n < len(items) - 1 else ''))
lines.append('}});')
with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(lines) + '\n')
print(len(shapes), 'shapes ->', OUT, os.path.getsize(OUT), 'bytes')
