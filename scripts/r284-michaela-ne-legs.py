#!/usr/bin/env python3
"""R284 미카엘라 북동 다리를 오른쪽 달리기에서 — (아래는 R229 원래 설명) R229 미카엘라 북동(북서는 좌우 반전) 달리기 — R226 v3 의 '발이 꼬인 느낌'을 푼다.

사용자 2026-11-02 "미카엘라 대각위모션 발이 꼬인느낌 이거 모션 자연스럽게 잘풀고".
R226 은 5~8칸 다리를 1~4칸 다리의 좌우 뒤집기로 넣었는데, 원본 1~4칸이 한 걸음 반쪽이 아니라서 4→5·8→1 칸에서 다리가 옆으로 튀고
6칸에서는 두 다리가 무릎에서 겹쳐 꼬여 보였다.
만들기: 같은 영웅의 북쪽 달리기(run-n.webp, 다리가 제대로 번갈아 나가는 8칸 한 바퀴)의 코트 밑 다리를 북동 v2 각 칸 엉덩이 축에 맞춰 넣는다.
  · 윗몸(머리·팔·지팡이·코트)은 북동 v2 그대로. 이음선 아래(y≥SEAM)만 바꾸고 FEATHER 줄 동안 섞는다.
  · 북쪽 다리는 몸을 정면 뒤에서 본 것이라 대각 몸에 맞춰 가로로 SQUEEZE 배 좁히고 발끝 쪽을 진행 방향(오른쪽)으로 SHEAR 만큼 기울인다.
  · 위상: 북쪽 k+PHASE 칸 다리를 북동 k 칸에 넣는다(팔 흔들림과 반대 다리가 나가게, 칸별 그림 확인으로 고름).
원본은 덮어쓰지 않고 assets/r229/michaela/run-ne-v4.webp 로 새로 만든다. 임시 파생본(최종 아트 아님).
Usage: python3 -I scripts/r229-michaela-ne-legs.py r96/runtime-text [PHASE]
"""
import sys, json, hashlib
from pathlib import Path
import numpy as np
from PIL import Image
root = Path(sys.argv[1]); PHASE = int(sys.argv[2]) if len(sys.argv) > 2 else 0
src_ne = root / 'assets/r164/michaela/run-ne-v2.webp'; src_n = root / 'assets/r164/michaela/run-e.webp'
out = Path(sys.argv[3]) if len(sys.argv) > 3 else root / 'assets/r284/michaela'; out.mkdir(parents=True, exist_ok=True)
import os
CW, CH, N, SEAM, FEATHER = 192, 256, 8, 176, 8
SQUEEZE=float(os.environ.get('SQ','0.5')); TILT=float(os.environ.get('TILT','0.35')); SHEAR=0.0
ne = np.asarray(Image.open(src_ne).convert('RGBA')).astype(np.float32)
nn = np.asarray(Image.open(src_n).convert('RGBA')).astype(np.float32)
cell = lambda a, i: a[:, i*CW:(i+1)*CW].copy()
def axis(c, y0):
    xs = np.nonzero((c[y0:y0+6, :, 3] > 128).any(0))[0]
    return float(np.median(xs)) if len(xs) else CW / 2
def pm(x): y = x.copy(); y[..., :3] *= y[..., 3:4] / 255; return y
def unpm(m):
    al = m[..., 3:4]; m[..., :3] = np.where(al > 0, m[..., :3] * 255 / np.maximum(al, 1), 0); return m
def legs_of(c, ax_to):
    """오른쪽(E) 달리기 칸 c 의 이음선 아래 다리를 가로로 SQUEEZE 배 좁혀 축 ax_to 에 맞추고, 앞(오른쪽)으로 나간 발일수록 TILT 만큼 위로(멀어짐) 올린다."""
    ax = axis(c, SEAM); full = pm(c); res = np.zeros((CH - SEAM + FEATHER, CW, 4), np.float32)
    xs = np.arange(CW, dtype=np.float32)
    for r in range(res.shape[0]):
        y = SEAM - FEATHER + r
        t = max(0.0, (r - FEATHER)) / (CH - SEAM)
        srcx = (xs - ax_to) / SQUEEZE + ax
        srcy = y + TILT * t * (xs - ax_to) / SQUEEZE   # 앞발(+x)은 아래 줄에서 가져와 화면에서 위로 올라간 것처럼
        x0 = np.floor(srcx).astype(int); f = (srcx - x0)[:, None]; yy = np.clip(np.round(srcy).astype(int), 0, CH - 1)
        ok0 = (x0 >= 0) & (x0 < CW) & (srcy >= 0) & (srcy < CH); ok1 = (x0 + 1 >= 0) & (x0 + 1 < CW) & (srcy >= 0) & (srcy < CH)
        a = np.where(ok0[:, None], full[yy, np.clip(x0, 0, CW-1)], 0); b = np.where(ok1[:, None], full[yy, np.clip(x0+1, 0, CW-1)], 0)
        res[r] = a * (1 - f) + b * f
    return res
res = []
for k in range(N):
    tgt = cell(ne, k); s = cell(nn, (k + PHASE) % N)
    legs = legs_of(s, axis(tgt, SEAM))
    lower = pm(tgt[SEAM-FEATHER:])
    w = np.clip(np.arange(lower.shape[0]) / FEATHER, 0, 1)[:, None, None]
    # 이음선 위쪽 섞임 구간에서는 원래 코트를 지키고(덮어쓰기), 아래는 새 다리로 바꾼다
    m = lower * (1 - w) + legs * w
    over = (lower[..., 3:4] > 200) & (w < 1)  # 섞임 구간의 원래 코트 불투명 픽셀은 그대로
    m = np.where(over, lower, m)
    tgt[SEAM-FEATHER:] = unpm(m)
    # 이음선 근처에 남은 원래 다리 조각(몸과 떨어진 작은 덩어리)을 지운다: 8방향 연결 덩어리 중 몸통(가장 큰 것)과 400px 넘는 것만 남김
    al = tgt[..., 3] > 24; lab = np.zeros(al.shape, np.int32); sizes = [0]; cur = 0
    for y0, x0 in zip(*np.nonzero(al)):
        if lab[y0, x0]: continue
        cur += 1; lab[y0, x0] = cur; st = [(y0, x0)]; n = 0
        while st:
            y, x = st.pop(); n += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < CH and 0 <= xx < CW and al[yy, xx] and not lab[yy, xx]: lab[yy, xx] = cur; st.append((yy, xx))
        sizes.append(n)
    big = int(np.argmax(sizes)); keep = np.isin(lab, [i for i, n in enumerate(sizes) if i and (i == big or n > 400)])
    tgt[~keep & al] = 0
    res.append(tgt)
sheet = np.concatenate(res, 1).clip(0, 255).astype(np.uint8)
dst = out / 'run-ne-v5.webp'; Image.fromarray(sheet, 'RGBA').save(dst, 'WEBP', lossless=True, method=6)
if len(sys.argv) <= 3:
    b = dst.read_bytes()
    (out / 'index.json').write_text(json.dumps({'revision': 'R284 미카엘라 북동 달리기 — 오른쪽 달리기 다리(좁힘·앞발 올림)로 두 다리가 갈라져 번갈기', 'path': 'assets/r284/michaela/run-ne-v5.webp', 'cols': 8, 'rows': 1, 'cell': [CW, CH], 'pivot': [96, 226],
      'source': {'upper': {'path': 'assets/r164/michaela/run-ne-v2.webp', 'sha256': hashlib.sha256(src_ne.read_bytes()).hexdigest()},
                 'legs': {'path': 'assets/r164/michaela/run-e.webp', 'sha256': hashlib.sha256(src_n.read_bytes()).hexdigest()}},
      'seam': SEAM, 'feather': FEATHER, 'squeeze': SQUEEZE, 'tilt': TILT, 'phase': PHASE, 'replaces': 'assets/r229/michaela/run-ne-v4.webp(R229, 북쪽 다리라 두 발이 한 줄에 겹쳐 꼬여 보임)',
      'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(), 'note': '임시 파생본(원본 시트 편집) — 최종 아트 확정 아님'}, ensure_ascii=False, indent=1))
print(dst)
