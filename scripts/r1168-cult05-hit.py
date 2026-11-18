#!/usr/bin/env python3
"""R1168 cult05 '설원 아래의 기계 다리'(r380 cult-mech-legs-walk-d1) 피격 4칸 — Dots CX-0136 A4 cult05 hit4 r2(DIAGNOSTIC_HOLD) 손질.
사용자 11-18 08:41Z "hold 보류자산도 앵간하면 너가 코드나 스킬로 개선해서 적용해".
HOLD 사유와 손질:
- 생성 배경·격자(가장자리 불투명) → 가장자리에서 흰색·격자 색을 물들이기(flood fill)로 지운 사본(bgcut, 입력 1)을 쓴다.
- 몸 키 약 290px(게임 218px) → 1칸 몸 키를 게임 이동 0칸 몸 키에 맞춰 네 칸 같은 배율로 줄인다.
- 발 줄 → 칸마다 아래 12줄 불투명 화소 가운데를 게임 0칸 발 가운데·발 줄(320)에 맞춘다(발 고정, 위쪽 반동은 그대로).
- 4칸이 원래보다 앞을 봄 → 4칸은 게임 그림(이동 0칸)으로 바꿔 서기 자세로 돌아오게 한다.
- 색 → 1~3칸 불투명 화소 평균을 게임 0칸에 맞춘다(채널 이득, 0.8~1.25 로 제한).
원본은 그대로 두고 파생본만 assets/r1168/mob-hit/ 에 만든다. 출처표 assets/r1168/index.json.
"""
import os, sys, json, hashlib
import numpy as np
from PIL import Image
BGCUT = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/dots-results/cx0136-a4-cult05-fix/cult05-hit4-r2-bgcut.png'
RAW = sys.argv[2] if len(sys.argv) > 2 else '/mnt/project-files/dots-results/unified-r2/raw/CX_P3_A4_HIT_R2_QA/P3_A4_cult/CX-0136_A4_cult05_hit4_r2_DIAGNOSTIC_HOLD.png'
HERE = os.path.dirname(os.path.abspath(__file__)); RT = os.path.join(HERE, '..', 'r96', 'runtime-text')
GAME = os.path.join(RT, 'assets', 'r380', 'mobs', 'cult-mech-legs-walk-d1.webp')
OUT = os.path.join(RT, 'assets', 'r1168', 'mob-hit'); os.makedirs(OUT, exist_ok=True)
C = 320
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def bbox(a): al = a[..., 3] > 24; ys = np.where(al.any(1))[0]; xs = np.where(al.any(0))[0]; return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
def footx(a):
    _, _, _, b = bbox(a); band = a[b - 12:b, :, 3] > 100; xs = np.where(band)[1]; return float(xs.mean())
def mean_rgb(a):
    m = a[..., 3] > 200; return a[..., :3][m].reshape(-1, 3).astype(float).mean(0)
g0 = np.array(Image.open(GAME).convert('RGBA'))[:, :C].copy()
gx0, gy0, gx1, gy1 = bbox(g0); gH = gy1 - gy0; gfx = footx(g0); gmean = mean_rgb(g0)
src = np.array(Image.open(BGCUT).convert('RGBA'))
cs = [src[:, i * C:(i + 1) * C].copy() for i in range(4)]
_, y0, _, y1 = bbox(cs[0]); s = gH / float(y1 - y0)
out, meta = [], []
for i, c in enumerate(cs[:3]):
    x0, yy0, x1, yy1 = bbox(c); crop = Image.fromarray(c[yy0:yy1, x0:x1])
    w, h = max(1, round((x1 - x0) * s)), max(1, round((yy1 - yy0) * s)); sm = np.array(crop.resize((w, h), Image.LANCZOS))
    fx = footx(np.pad(sm, ((0, 0), (0, 0), (0, 0))))
    ox = int(round(gfx - fx)); oy = C - h - (C - gy1)
    cell = np.zeros((C, C, 4), np.uint8); im = Image.fromarray(cell); im.alpha_composite(Image.fromarray(sm), (ox, oy)); cell = np.array(im)
    gain = np.clip(gmean / np.maximum(1, mean_rgb(cell)), .8, 1.25)
    rgb = cell[..., :3].astype(float) * gain; cell[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out.append(cell); meta.append({'frame': i, 'scale': round(s, 4), 'offset': [int(ox), int(oy)], 'gain': [round(float(v), 3) for v in gain]})
out.append(g0.copy()); meta.append({'frame': 3, 'note': '게임 이동 0칸 그림(서기 자세 복귀)'})
def tidy(c):
    c[..., 3][c[..., 3] <= 16] = 0; c[c[..., 3] == 0] = 0; c[:3] = 0; c[:, :3] = 0; c[:, -3:] = 0; return c
a = np.concatenate([tidy(c) for c in out], 1); p = os.path.join(OUT, 'cult05-hit4.webp')
Image.fromarray(a, 'RGBA').save(p, 'WEBP', quality=92, alpha_quality=100, method=6)
row = {'file': 'assets/r1168/mob-hit/cult05-hit4.webp', 'source': 'Dots CX-0136 A4 CX-0136_A4_cult05_hit4_r2_DIAGNOSTIC_HOLD.png (드라이브 CX_P3_A4_HIT_R2_QA, 2026-11-18)',
       'sourceSha256': sha(RAW), 'bgcutSha256': sha(BGCUT), 'gameSha256': sha(GAME), 'sha256': sha(p), 'bytes': os.path.getsize(p), 'size': [a.shape[1], a.shape[0]],
       'cell': [C, C], 'pivot': [159.23, 319.23], 'frames': 4, 'gameBodyH': int(gH), 'srcBodyH': int(y1 - y0), 'gameFootX': round(gfx, 2), 'perFrame': meta,
       'note': 'DIAGNOSTIC_HOLD → 배경·격자 제거, 0.75배 맞춤, 발 고정, 4칸 게임 그림, 색 맞춤'}
json.dump({'schema': 'storyworld.r1168.dots/v1', 'assets': [row]}, open(os.path.join(RT, 'assets', 'r1168', 'index.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps(row, ensure_ascii=False))
