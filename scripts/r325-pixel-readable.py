#!/usr/bin/env python3
"""R325: derive readable variants of very dark pixel-mode mob sheets (originals untouched).
For sheets whose mean opaque luminance < THRESH: lift dark values (gamma on RGB, hue kept) and add a
1px rim outline in the sprite's own colour lightened toward warm parchment, so mobs separate from dark floors.
Usage: python3 scripts/r325-pixel-readable.py [--dry]"""
import json, os, sys, hashlib
from PIL import Image, ImageStat, ImageFilter, ImageChops
ROOT = os.path.join(os.path.dirname(__file__), '..', 'r96')
SRC = os.path.join(ROOT, 'runtime-text')
OUT_DIR = 'assets/r325/pixel-readable'
THRESH = 45
def mean_l(im):
    a = im.getchannel('A').point(lambda v: 255 if v > 128 else 0)
    return ImageStat.Stat(im.convert('L'), mask=a).mean[0]
def derive(im, cell):
    cw, ch = cell
    rgb = im.convert('RGB'); a = im.getchannel('A')
    lut = [round(255 * (v / 255) ** 0.72) for v in range(256)]
    lifted = rgb.point(lut * 3)
    st = ImageStat.Stat(rgb, mask=a.point(lambda v: 255 if v > 128 else 0)).mean
    rim = tuple(round(c + (t - c) * 0.6) for c, t in zip(st, (214, 198, 172)))
    hard = a.point(lambda v: 255 if v > 96 else 0)
    ring = ImageChops.subtract(hard.filter(ImageFilter.MaxFilter(3)), hard)
    out = Image.merge('RGBA', (*lifted.split(), a))
    rimimg = Image.new('RGBA', im.size, rim + (0,)); rimimg.putalpha(ring.point(lambda v: 225 if v else 0))
    # keep the ring inside each cell (no bleed across frame borders)
    W, H = im.size; m = Image.new('L', im.size, 0); px = m.load()
    for y in range(H):
        for x in range(W):
            if 0 < x % cw < cw - 1 and 0 < y % ch < ch - 1: px[x, y] = 255
    rimimg.putalpha(ImageChops.multiply(rimimg.getchannel('A'), m))
    under = Image.new('RGBA', im.size, (0, 0, 0, 0)); under.alpha_composite(rimimg); under.alpha_composite(out)
    return under
def main():
    data_js = open(os.path.join(ROOT, 'client-source', 'mob-art-variants-r306-data.js')).read()
    d = json.loads(data_js[data_js.index('=') + 1:].rstrip().rstrip(';'))
    sheets = {}
    for r in d['rows'].values(): sheets.setdefault(r['pixel']['path'], r['pixel']['cell'])
    index = {'revision': 'R325', 'threshold': THRESH, 'method': 'gamma 0.72 + 1px rim (own colour 60% toward #D6C6AC)', 'map': {}}
    os.makedirs(os.path.join(SRC, OUT_DIR), exist_ok=True)
    for p, cell in sorted(sheets.items()):
        src = os.path.join(SRC, p); im = Image.open(src).convert('RGBA'); L = mean_l(im)
        if L >= THRESH: continue
        name = os.path.basename(p); dst = OUT_DIR + '/' + name
        if '--dry' not in sys.argv: derive(im, cell).save(os.path.join(SRC, dst), 'WEBP', lossless=True, quality=100, method=6)
        b = open(src, 'rb').read()
        index['map'][p] = {'path': dst, 'srcSha256': hashlib.sha256(b).hexdigest(), 'srcBytes': len(b), 'meanL': round(L, 1)}
    with open(os.path.join(SRC, OUT_DIR, 'index.json'), 'w') as f: json.dump(index, f, ensure_ascii=False, indent=1)
    print(json.dumps({'derived': len(index['map'])}))
main()
