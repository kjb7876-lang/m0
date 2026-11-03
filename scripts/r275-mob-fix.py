#!/usr/bin/env python3
"""R275 mob sheet fixes -> r96/runtime-text/assets/r275/mobs (derived copies; originals are never touched).

1. islands: flat grey panel background left enclosed inside the sprite (between legs, arm and smoke) -> transparent.
   feather: one-row strips (R208 / R223 Drive mobs) whose art was already cut by the Drive sheet panel (the pixels
   beyond the panel were never drawn, so they cannot be recovered) get a soft alpha ramp instead of a flat cut.
2. defringe: light semi-transparent edge pixels (bright halo from a light matte) are pulled to the colour of the
   nearest solid neighbour.
Same cell / pivot as the source, so only the path changes (mob-fix-r275.js).
Writes index.json (source path, sha256, size, fix, new cell / pivot / scale).
"""
import hashlib, json, os, sys
from collections import deque
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'r96/runtime-text')
OUT = os.path.join(SRC, 'assets/r275/mobs')
A_TH = 16


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def components(alpha):
    h, w = alpha.shape
    lab = np.zeros((h, w), np.int32)
    n = 0
    sizes = []
    ys, xs = np.nonzero(alpha)
    for y0, x0 in zip(ys, xs):
        if lab[y0, x0]:
            continue
        n += 1
        q = deque([(y0, x0)]); lab[y0, x0] = n; cnt = 0
        while q:
            y, x = q.popleft(); cnt += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < h and 0 <= xx < w and alpha[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n; q.append((yy, xx))
        sizes.append(cnt)
    return lab, n


def defringe(a):
    """bright halo: edge pixels (alpha < 230, next to transparency) much lighter than the solid pixel next to them."""
    rgb = a[..., :3].astype(np.float32); al = a[..., 3]
    L = rgb @ np.array([.299, .587, .114], np.float32)
    solid = al >= 230
    fixed = 0
    h, w = al.shape
    sat = rgb.max(2) - rgb.min(2)
    edge = (al > 0) & (al < 200) & (sat < 14) & (L > 95)  # light, grey (matte-coloured) edge only
    ys, xs = np.nonzero(edge)
    for y, x in zip(ys, xs):
        best = None
        for dy in (-2, -1, 0, 1, 2):
            for dx in (-2, -1, 0, 1, 2):
                yy, xx = y + dy, x + dx
                if 0 <= yy < h and 0 <= xx < w and solid[yy, xx]:
                    if best is None or L[yy, xx] < L[best]:
                        best = (yy, xx)
        if best is not None and L[y, x] - L[best] > 45:  # much lighter than the solid body next to it
            a[y, x, :3] = a[best][:3]; fixed += 1
    return fixed


def islands(a, minarea=40):
    """enclosed panel-background islands (flat grey left between legs / arm and smoke: the corner flood-fill of the
    extractor could not reach them)."""
    rgb = a[..., :3].astype(np.float32); al = a[..., 3]
    L = rgb.mean(2); sat = rgb.max(2) - rgb.min(2)
    pad = np.pad(L, 1, mode='edge'); d = np.zeros_like(L)
    for dy in (0, 1, 2):
        for dx in (0, 1, 2):
            d = np.maximum(d, np.abs(pad[dy:dy + L.shape[0], dx:dx + L.shape[1]] - L))
    cand = (al > 200) & (d <= 3) & (sat <= 6) & (L >= 45) & (L <= 95)
    lab = np.zeros(L.shape, np.int32); n = 0; out = np.zeros(L.shape, bool)
    ys, xs = np.nonzero(cand)
    for y0, x0 in zip(ys, xs):
        if lab[y0, x0]:
            continue
        n += 1; q = deque([(y0, x0)]); lab[y0, x0] = n; pts = []
        while q:
            y, x = q.popleft(); pts.append((y, x))
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < L.shape[0] and 0 <= xx < L.shape[1] and cand[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n; q.append((yy, xx))
        if len(pts) >= minarea:
            P = np.array(pts)
            if L[P[:, 0], P[:, 1]].std() < 3:
                out[P[:, 0], P[:, 1]] = True
    return out


def feather_cuts(a, cw, frames, F=7):
    """sprite cut flat by the cell edge (art clipped in the Drive sheet panel): fade alpha over F px so the cut
    reads as a soft edge, only on rows where the sprite really reaches that edge."""
    al = a[..., 3].astype(np.float32); n = 0
    for f in range(frames):
        x0, x1 = f * cw, min(a.shape[1], (f + 1) * cw)
        for side in (0, 1):
            col = x0 if side == 0 else x1 - 1
            rows = np.nonzero(a[:, col, 3] > 32)[0]
            if len(rows) < 3:
                continue
            for k in range(F):
                x = col + k if side == 0 else col - k
                al[rows, x] *= (k + 1) / (F + 1)
            n += len(rows)
    a[..., 3] = np.clip(al, 0, 255).astype(np.uint8)
    return n


def fix_strip(src_path, cell, frames):
    a = np.array(Image.open(src_path).convert('RGBA'))
    isl = islands(a)
    a[isl] = 0
    fr = defringe(a)
    cut = feather_cuts(a, cell[0], frames)
    return Image.fromarray(a, 'RGBA'), {'islandPixelsCleared': int(isl.sum()), 'defringed': fr, 'featheredEdgeRows': cut}


def main():
    os.makedirs(OUT, exist_ok=True)
    rows = []
    for idx in ['assets/r208/mobs/index.json', 'assets/r223/mobs/index.json']:
        j = json.load(open(os.path.join(SRC, idx), encoding='utf8'))
        for m in j['mobs']:
            src = os.path.join(SRC, m['path'])
            frames = m['frames']
            img, info = fix_strip(src, m['cell'], frames)
            if not (info['islandPixelsCleared'] or info['featheredEdgeRows'] or info['defringed'] > 200):
                continue
            dst = os.path.join(OUT, m['id'] + '.webp')
            img.save(dst, 'WEBP', lossless=True, quality=100, method=6)
            rows.append({'id': m['id'], 'from': m['path'], 'fromSha256': sha(src), 'fromBytes': os.path.getsize(src), 'fromCell': m['cell'], 'fromPivot': m['pivot'],
                         'path': 'assets/r275/mobs/' + m['id'] + '.webp', 'sha256': sha(dst), 'bytes': os.path.getsize(dst), 'cell': m['cell'], 'pivot': m['pivot'], 'frames': frames,
                         'fix': [k for k, v in (('background islands cleared', info['islandPixelsCleared']), ('light halo defringed', info['defringed']), ('cut edge feathered', info['featheredEdgeRows'])) if v], **info})
            print(m['id'], info)
    json.dump({'revision': 'R275', 'note': 'derived copies of R208/R223 strips; originals untouched', 'sheets': rows}, open(os.path.join(OUT, 'index.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
