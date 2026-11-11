#!/usr/bin/env python3
# 바닥 모서리가 2:1 이 아닌 그림을 바로잡는다: 세로줄은 그대로 두고 열마다 세로로 밀고(k) 늘여(c) 두 바닥 모서리를 0.50 / -0.50 으로.
#   y' = c*y + k*x,  c = 1/(sl - sr),  k = 0.5 - c*sl   (sl·sr = 아래 껍질에서 잰 왼쪽·오른쪽 바닥 모서리 기울기)
#  쓰기: python3 shear.py <원본> <결과.png> [sl sr]   (sl sr 를 안 주면 잰다). 원본은 건드리지 않는다.
import sys, numpy as np
from PIL import Image

def lower_hull(pts):
    h = []
    for p in pts:
        while len(h) >= 2:
            (x1, y1), (x2, y2) = h[-2], h[-1]
            if (x2 - x1) * (p[1] - y1) - (y2 - y1) * (p[0] - x1) >= 0: h.pop()
            else: break
        h.append(p)
    return h

def slopes(a):
    cols = np.nonzero(a.any(axis=0))[0]
    bot = [(int(x), int(np.nonzero(a[:, x])[0].max())) for x in cols]
    hull = lower_hull(bot); L = []; R = []
    for (xa, ya), (xb, yb) in zip(hull, hull[1:]):
        dx = xb - xa
        if dx <= 0: continue
        s = (yb - ya) / dx
        if .15 < s <= 4: L.append((dx, s))
        if -4 <= s < -.15: R.append((dx, s))
    wavg = lambda v: sum(d * s for d, s in v) / sum(d for d, s in v)
    return wavg(L), wavg(R)

def main():
    src, out = sys.argv[1], sys.argv[2]
    im = Image.open(src).convert('RGBA'); A = np.asarray(im).astype(np.float64); H, W = A.shape[:2]
    a = A[:, :, 3] > 48
    sl, sr = (float(sys.argv[3]), float(sys.argv[4])) if len(sys.argv) > 4 else slopes(a)
    c = 1 / (sl - sr); k = .5 - c * sl
    pm = A.copy(); pm[:, :, :3] *= pm[:, :, 3:4] / 255
    pad = int(np.ceil(abs(k) * W)) + 2; OH = int(np.ceil(c * H)) + 2 * pad
    O = np.zeros((OH, W, 4)); yo = np.arange(OH)
    for x in range(W):
        ys = (yo - pad - k * (x - W / 2)) / c          # 결과 줄 → 원본 줄
        y0 = np.floor(ys).astype(int); f = ys - y0
        ok = (y0 >= 0) & (y0 < H - 1)
        col = np.zeros((OH, 4)); col[ok] = pm[y0[ok], x] * (1 - f[ok])[:, None] + pm[y0[ok] + 1, x] * f[ok][:, None]
        O[:, x] = col
    al = O[:, :, 3:4]; rgb = np.where(al > 0, O[:, :, :3] * 255 / np.maximum(al, 1e-6), 0)
    res = Image.fromarray(np.clip(np.dstack([rgb, al]), 0, 255).astype(np.uint8), 'RGBA')
    res = res.crop(res.getbbox()); res.save(out)
    s2 = slopes(np.asarray(res)[:, :, 3] > 48)
    print('%s sl %.3f sr %.3f -> c %.3f k %.3f -> sl %.3f sr %.3f size %s' % (src.split('/')[-1], sl, sr, c, k, s2[0], s2[1], res.size))
main()
