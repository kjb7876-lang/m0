#!/usr/bin/env python3
"""R1222 — Dots 해안 물 튐(mob-coast, R1177d) 시트를 늪 물빛으로 다시 칠한다(원본은 그대로 둔다).
사용자 2026-11-19 10:12Z "늪지대 혼령체 공격시 물나오는거 녹색 색 넣어서 늪같아보이게".
밝기를 늪 그러데이션(먹 → 탁한 녹 → 이끼 → 옅은 녹황 거품)에 맞추고, 바깥에 1px 먹 테두리를 얹는다(수묵화풍).
출력: r96/runtime-text/assets/r163/pixelfx/r1222/mob-swamp-dots-12.webp"""
import hashlib, json, os, sys
from PIL import Image, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'r96/runtime-text/assets/r1177/mob-coast-dots-12.webp')
OUT = os.path.join(ROOT, 'r96/runtime-text/assets/r163/pixelfx/r1222/mob-swamp-dots-12.webp')
# 밝기 0..1 → 색(먹 · 탁한 늪녹 · 이끼 · 녹황 거품). 흰 물보라·푸른 물빛은 남기지 않는다.
STOPS = [(0.00, (26, 42, 24)), (0.30, (44, 78, 40)), (0.55, (64, 112, 54)), (0.78, (98, 148, 74)), (1.00, (150, 190, 118))]
def ramp(v):
    for (a, ca), (b, cb) in zip(STOPS, STOPS[1:]):
        if v <= b:
            t = (v - a) / (b - a) if b > a else 0
            return tuple(round(ca[i] + (cb[i] - ca[i]) * t) for i in range(3))
    return STOPS[-1][1]
def main():
    im = Image.open(SRC).convert('RGBA')
    w, h = im.size
    src = im.load()
    lum = [[0.0] * w for _ in range(h)]
    lo, hi = 1.0, 0.0
    for y in range(h):
        for x in range(w):
            r, g, b, a = src[x, y]
            if a > 16:
                v = (0.299 * r + 0.587 * g + 0.114 * b) / 255
                lum[y][x] = v; lo = min(lo, v); hi = max(hi, v)
    body = Image.new('RGBA', (w, h))
    bp = body.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = src[x, y]
            if a == 0:
                continue
            v = (lum[y][x] - lo) / max(1e-6, hi - lo)
            v = v ** 1.1  # 늪물은 바다보다 탁하다: 밝은 쪽을 눌러 거품을 줄인다
            bp[x, y] = (*ramp(v), a)
    # 먹 테두리: 알파를 1px 넓힌 바깥 고리만 먹색으로, 몸 아래에 깐다
    alpha = im.getchannel('A')
    grown = alpha.filter(ImageFilter.MaxFilter(3))
    ink = Image.new('RGBA', (w, h), (14, 16, 10, 0))
    ink.putalpha(grown.point(lambda v: int(v * 0.85)))
    out = Image.alpha_composite(ink, body)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    out.save(OUT, 'WEBP', lossless=True, method=6)
    data = open(OUT, 'rb').read()
    print(json.dumps({'src': os.path.relpath(SRC, ROOT), 'src_sha256': hashlib.sha256(open(SRC, 'rb').read()).hexdigest(),
                      'out': os.path.relpath(OUT, ROOT), 'out_sha256': hashlib.sha256(data).hexdigest(), 'out_bytes': len(data), 'size': [w, h]}, ensure_ascii=False))
if __name__ == '__main__':
    main()
