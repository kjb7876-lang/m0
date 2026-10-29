#!/usr/bin/env python3
"""R121: 기억사수(gunner) 치비 비율 걷기 4프레임 -> assets/r121/walk/walk-gunner-<dir>.png (4x1 스트립, 칸마다 몸이 꽉 차지 않게 여백).

R91 걷기 묶음은 사실적인 날씬한 비율이라 R93 서 있기(머리 큰 치비)와 몸 굵기가 달랐다(사용자 2026-10-29).
ChatGPT(2026-10-29)로 서 있기 그림을 참조해 같은 비율로 새로 그린 4프레임 가로 스트립(자홍 배경)을
  1) 자홍 배경 제거(색 거리 + 가장자리 자홍 번짐 제거),
  2) 몸 덩어리 4개로 나눔(세로 투명 열 기준),
  3) 같은 칸 크기·같은 발밑 줄·몸 가운데 정렬로 4x1 스트립을 만든다.
usage: python -I scripts/r121-gunner-walk.py <raw.png> <dir name> <out dir>
"""
import sys, json, hashlib  # R121 walk strips
from pathlib import Path
import numpy as np
from PIL import Image

def key_out(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = (r - g > 60) & (b - g > 60); alpha = np.where(mag, 0, 255).astype(np.float32)
    soft = (r - g > 25) & (b - g > 25) & ~mag; alpha[soft] = 128
    a[soft, 0] = a[soft, 1] = np.minimum(a[soft, 0], a[soft, 2]) * .6 + a[soft, 1] * .4; a[soft, 2] = a[soft, 0]
    return a, alpha
if sys.argv[1] == '--replace':
    strip = Image.open(sys.argv[2]).convert('RGBA'); idx = int(sys.argv[3]); a, alpha = key_out(sys.argv[4])
    cw, ch = strip.width // 4, strip.height
    ref = np.asarray(strip.crop((0, 0, cw, ch)))[..., 3] > 24; rys = np.nonzero(ref.any(1))[0]; rh = rys.max() - rys.min() + 1
    rcx = float(np.nonzero(ref[rys.min():rys.min() + int(rh * .45)])[1].mean())
    m = alpha > 0; ys, xs = np.nonzero(m); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    piece = Image.fromarray(np.dstack([a, alpha]).clip(0, 255).astype(np.uint8)[y0:y1, x0:x1]); k = rh / (y1 - y0)
    cx = (float(np.nonzero(m[y0:y0 + int((y1 - y0) * .45)])[1].mean()) - x0) * k
    piece = piece.resize((round(piece.width * k), round(piece.height * k)), Image.LANCZOS)
    cell = Image.new('RGBA', (cw, ch), (0, 0, 0, 0)); cell.alpha_composite(piece, (int(round(rcx - cx)), int(rys.max() + 1 - piece.height)))
    out_img = strip.copy(); out_img.paste(Image.new('RGBA', (cw, ch), (0, 0, 0, 0)), (idx * cw, 0)); out_img.alpha_composite(cell, (idx * cw, 0))
    out_img.save(sys.argv[2], optimize=True); print('replaced frame', idx, 'scale', round(k, 3)); sys.exit(0)
if sys.argv[1] == '--grid8':  # R121: 8프레임(2줄 x 4칸) 옆 걷기 -> 4x2 스트립. 줄은 가운데 빈 띠로 나누고 각 줄은 아래와 같은 방식으로 몸 4개를 찾는다.
    src = sys.argv[2]; a, alpha = key_out(src); solid = alpha > 0; H0 = a.shape[0]
    rowsum = solid.sum(1); mid = int(np.argmin(rowsum[int(H0 * .35):int(H0 * .65)])) + int(H0 * .35)
    frames = []; rgba = np.dstack([a, alpha]).clip(0, 255).astype(np.uint8)
    for ya, yb in ((0, mid), (mid, H0)):
        sub = solid[ya:yb]; cols = sub.any(0); runs = []; x = 0; W = sub.shape[1]
        while x < W:
            if cols[x]:
                s = x
                while x < W and cols[x]: x += 1
                runs.append((s, x))
            x += 1
        runs = [r for r in runs if r[1] - r[0] > 40]; merged = []
        for r in runs:
            if merged and r[0] - merged[-1][1] < 25: merged[-1] = (merged[-1][0], r[1])
            else: merged.append(r)
        while len(merged) < 4:  # 붙은 두 장: 가장 넓은 덩어리를 가운데 40% 안에서 가장 얇은 세로줄로 가른다
            j = max(range(len(merged)), key=lambda i: merged[i][1] - merged[i][0]); x0, x1 = merged[j]; w = x1 - x0
            cs = sub[:, x0 + int(w * .3):x0 + int(w * .7)].sum(0); cut = x0 + int(w * .3) + int(np.argmin(cs))
            merged[j:j + 1] = [(x0, cut), (cut + 1, x1)]
        for x0, x1 in merged:
            m = sub[:, x0:x1]; ys = np.nonzero(m.any(1))[0]; y0, y1 = ys.min() + ya, ys.max() + 1 + ya
            cx = float(np.nonzero(solid[y0:y0 + int((y1 - y0) * .45), x0:x1])[1].mean()) + x0
            frames.append((x0, x1, y0, y1, cx))
    Hm = max(f[3] - f[2] for f in frames); half = int(max(max(f[4] - f[0], f[1] - f[4]) for f in frames)) + 8; cw, ch = 2 * half, Hm + 16
    strip = Image.new('RGBA', (cw * 4, ch * 2), (0, 0, 0, 0))
    for i, (x0, x1, y0, y1, cx) in enumerate(frames):
        piece = Image.fromarray(rgba[y0:y1, x0:x1]); strip.alpha_composite(piece, ((i % 4) * cw + int(round(half - (cx - x0))), (i // 4) * ch + ch - 8 - (y1 - y0)))
    strip.save(sys.argv[3], optimize=True); print('grid8', cw, ch); sys.exit(0)
raw, d, out = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3]); out.mkdir(parents=True, exist_ok=True)
a = np.asarray(Image.open(raw).convert('RGB')).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
mag = (r - g > 60) & (b - g > 60)                      # 자홍 계열
alpha = np.where(mag, 0, 255).astype(np.float32)
soft = (r - g > 25) & (b - g > 25) & ~mag               # 경계 번짐: 반투명 + 색 보정
alpha[soft] = 128; a[soft, 0] = a[soft, 1] = np.minimum(a[soft, 0], a[soft, 2]) * .6 + a[soft, 1] * .4; a[soft, 2] = a[soft, 0]
solid = alpha > 0
cols = solid.any(0); runs = []; x = 0; W = a.shape[1]
while x < W:
    if cols[x]:
        s = x
        while x < W and cols[x]: x += 1
        runs.append((s, x))
    x += 1
runs = [rr for rr in runs if rr[1] - rr[0] > 40]
merged = []
for rr in runs:
    if merged and rr[0] - merged[-1][1] < 25: merged[-1] = (merged[-1][0], rr[1])
    else: merged.append(rr)
assert len(merged) == 4, ('expected 4 bodies', merged)
rgba = np.dstack([a, alpha]).clip(0, 255).astype(np.uint8)
frames = []
for x0, x1 in merged:
    m = solid[:, x0:x1]; ys = np.nonzero(m.any(1))[0]; y0, y1 = ys.min(), ys.max() + 1
    cx = float(np.nonzero(m[y0:y0 + int((y1 - y0) * .45)])[1].mean()) + x0   # 머리·가슴 가운데
    frames.append((x0, x1, y0, y1, cx))
H = max(f[3] - f[2] for f in frames); half = int(max(max(f[4] - f[0], f[1] - f[4]) for f in frames)) + 8
cw, ch = 2 * half, H + 16
strip = Image.new('RGBA', (cw * 4, ch), (0, 0, 0, 0))
for i, (x0, x1, y0, y1, cx) in enumerate(frames):
    piece = Image.fromarray(rgba[y0:y1, x0:x1]); px = i * cw + int(round(half - (cx - x0))); py = ch - 8 - (y1 - y0)
    strip.alpha_composite(piece, (px, py))
p = out / f'walk-gunner-{d}.png'; strip.save(p, optimize=True)
print(json.dumps({'file': p.name, 'cell': [int(cw), int(ch)], 'frames': 4, 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(),
                  'source': {'name': raw.name, 'sha256': hashlib.sha256(raw.read_bytes()).hexdigest()}}, ensure_ascii=False))

# --- R121 보조: 한 장짜리 그림(자홍 배경)을 기존 스트립의 n번째 칸에 같은 키·발밑·몸 가운데로 끼운다.
#     usage: python -I scripts/r121-gunner-walk.py --replace <strip.png> <index 0-3> <single.png>
#     (옆 걷기에서 3번째 장이 1번째 장과 같은 다리를 내밀어 한쪽 다리만 움직여 보였다 -> 다리를 바꾼 한 장으로 교체)
