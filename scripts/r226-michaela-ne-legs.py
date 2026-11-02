#!/usr/bin/env python3
"""R226 미카엘라 북동(북서는 좌우 반전) 달리기 — 한쪽 다리만 나가던 것을 좌우 다리가 번갈아 나가게.

사용자 2026-11-02 "미카엘라 이동모션 대각위동작만 개선해줘봐 한쪽발만나가는거 같은데 다리만좌우반전해서 디테일개선".
원본: assets/r164/michaela/run-ne-v2.webp(8칸 192×256, R169 v2). 8칸 모두 왼다리가 딛고 오른다리만 뒤로 굽혀 차올렸다(칸별 아래 다리 확인).
만들기: 1~4칸은 그대로. 5~8칸은 윗몸(팔·머리·지팡이·코트)을 그 칸 그대로 두고, 코트 밑단 아래 다리만 1~4칸 다리를 엉덩이 축으로 좌우 뒤집어 넣는다.
  · 엉덩이 축 = 이음선 아래 6줄의 불투명 픽셀 x 중앙값(칸마다). 넣을 다리는 대상 칸의 축에 맞춰 옮긴다.
  · 이음선(코트 밑단 최저 175 아래, y=178)에서 6px 동안 서서히 섞고, 뒤집은 다리에서는 발에 이어진 덩어리만 남긴다(떠 있는 코트 조각 제거). 발 높이(바닥 줄)는 원본 그대로라 발 기준점(96,226)이 바뀌지 않는다.
원본은 덮어쓰지 않고 assets/r226/michaela/run-ne-v3.webp 로 새로 만든다.
Usage: python3 -I scripts/r226-michaela-ne-legs.py r96/runtime-text
"""
import sys, json, hashlib
from pathlib import Path
import numpy as np
from PIL import Image
root = Path(sys.argv[1]); src = root / 'assets/r164/michaela/run-ne-v2.webp'; out = root / 'assets/r226/michaela'; out.mkdir(parents=True, exist_ok=True)
CW, CH, N, SEAM, FEATHER = 192, 256, 8, 178, 6  # 코트 밑단 최저 175(2칸) 아래
a = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32)
cells = [a[:, i*CW:(i+1)*CW].copy() for i in range(N)]
def axis(c):
    xs = np.nonzero((c[SEAM:SEAM+6, :, 3] > 128).any(0))[0]
    return float(np.median(xs)) if len(xs) else CW / 2
res = []
for k in range(N):
    if k < 4: res.append(cells[k]); continue
    tgt = cells[k].copy(); s = cells[k-4]
    ax_s, ax_t = axis(s), axis(tgt)
    legs = s[SEAM-FEATHER:, ::-1].copy()  # 좌우 뒤집기(칸 전체 기준) → 축은 CW-1-ax_s
    shift = int(round(ax_t - (CW - 1 - ax_s)))
    legs = np.roll(legs, shift, axis=1)
    # 발에 이어진 덩어리만 남긴다(이음선 근처 떠 있는 코트 조각 제거)
    al = legs[..., 3] > 40; keep = np.zeros_like(al); h, w = al.shape
    rows = np.nonzero(al.any(1))[0]; fb = int(rows.max()) if len(rows) else h - 1  # 가장 아래 발 줄
    stack = [(y, x) for y in range(max(0, fb - 12), fb + 1) for x in range(w) if al[y, x]]
    for y, x in stack: keep[y, x] = True
    while stack:
        y, x = stack.pop()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                yy, xx = y + dy, x + dx
                if 0 <= yy < h and 0 <= xx < w and al[yy, xx] and not keep[yy, xx]: keep[yy, xx] = True; stack.append((yy, xx))
    legs[~keep] = 0
    if shift > 0: legs[:, :shift] = 0
    elif shift < 0: legs[:, shift:] = 0
    lower = tgt[SEAM-FEATHER:].copy()
    w = np.clip((np.arange(lower.shape[0]) / FEATHER), 0, 1)[:, None, None]  # 0 → 1 (이음선 위는 원래, 아래는 새 다리)
    # 프리멀티 섞기
    def pm(x): y = x.copy(); y[..., :3] *= y[..., 3:4] / 255; return y
    m = pm(lower) * (1 - w) + pm(legs) * w
    al = m[..., 3:4]; m[..., :3] = np.where(al > 0, m[..., :3] * 255 / np.maximum(al, 1), 0)
    tgt[SEAM-FEATHER:] = m
    res.append(tgt)
sheet = np.concatenate(res, 1).clip(0, 255).astype(np.uint8)
dst = out / 'run-ne-v3.webp'; Image.fromarray(sheet, 'RGBA').save(dst, 'WEBP', lossless=True, method=6)
b = dst.read_bytes(); sb = src.read_bytes()
(out / 'index.json').write_text(json.dumps({'revision': 'R226 미카엘라 북동 달리기 다리 번갈기', 'path': 'assets/r226/michaela/run-ne-v3.webp', 'cols': 8, 'rows': 1, 'cell': [CW, CH], 'pivot': [96, 226],
  'source': {'path': 'assets/r164/michaela/run-ne-v2.webp', 'sha256': hashlib.sha256(sb).hexdigest()}, 'seam': SEAM, 'feather': FEATHER, 'mirroredLegsFrames': [5, 6, 7, 8], 'legsFrom': [1, 2, 3, 4],
  'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(), 'note': '임시 파생본(원본 시트 편집) — 최종 아트 확정 아님'}, ensure_ascii=False, indent=1))
print(dst, len(b))
