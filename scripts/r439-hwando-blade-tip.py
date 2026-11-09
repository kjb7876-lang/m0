#!/usr/bin/env python3
"""R439 환도 공격 검끝 점 지우기 — 사용자 2026-11-09 "이동은 자연스러운데 환도 공격모션 중에 검끝에 점 묻어 보이는 거 개선".

원인(assets/r283/hwando/r271/attack-e.webp, 12칸 288×214, 좌 공격은 이 그림 미러):
 ① 7·10·11칸 칼날 끝 둘레에 노랑·빨강 색 번짐(반투명 가장자리 압축 잔재) — 은빛 칼날 위에 색 점으로 보인다.
 ② 11칸(마지막, 250ms 로 가장 오래 멈춤)의 칼끝이 옅은 틈(알파<60) 뒤에 따로 떨어진 조각(15px)이라 줄인 화면에서 점처럼 보인다.
고치는 것: ① 칼날 구역(굵은 몸 마스크 밖, 은빛 칼날 픽셀 둘레 3px)의 유채색 픽셀(채도>.15)을 같은 밝기의 칼날 은빛으로 바꾼다(알파 그대로).
           ② 11칸의 떨어진 칼끝 바늘 조각과 그 앞 옅은 틈을 지운다(칼날은 이미 가늘어지며 끝난다 — 잇기는 갈고리처럼 꺾여 보여 버림).
칸 수·칸 크기·발 기준점·몸·망토·손잡이 색은 그대로. 원본 파일은 덮어쓰지 않고 assets/r439/hwando/attack-e.webp 로 낸다(무손실).
사용: python3 -I scripts/r439-hwando-blade-tip.py
"""
import os, sys, hashlib, json
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, '..', 'r96', 'runtime-text', 'assets')
SRC = os.path.join(A, 'r283', 'hwando', 'r271', 'attack-e.webp')
OUT = os.path.join(A, 'r439', 'hwando', 'attack-e.webp')
CW, N = 288, 12

def hue_sat(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1); c = mx - mn; d = np.where(c > 1e-6, c, 1)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, np.where(mx > 0, c / np.where(mx > 0, mx, 1), 0), c

def _grow(mask, size, fn):
    from PIL import ImageFilter
    im = Image.fromarray((mask * 255).astype(np.uint8), 'L').filter(fn(size))
    return np.array(im) > 127

def fix_specks(a, log):
    from PIL import ImageFilter
    rgb = a[..., :3] / 255.0; al = a[..., 3]
    h, s, c = hue_sat(rgb); lum = rgb.mean(-1)
    # 굵은 몸(망토·손·장화·손잡이) = 불투명 마스크를 9px 로 깎았다 다시 불린 것(가는 칼날은 사라진다) → 5px 더 불려 둘레까지.
    solid = al > 100
    thick = _grow(_grow(_grow(solid, 9, ImageFilter.MinFilter), 9, ImageFilter.MaxFilter), 11, ImageFilter.MaxFilter)
    steel = solid & (c < .08) & (lum > .35) & ~thick  # 칼날 은빛 픽셀
    zone = _grow(steel, 7, ImageFilter.MaxFilter) & ~thick  # 칼날 둘레 3px
    tone = (rgb[steel].mean(0) / rgb[steel].mean()) if steel.any() else np.ones(3)  # 칼날 은빛 채널 비
    odd = zone & (al > 0) & (s > .15) & (c > .06)
    ys, xs = np.where(odd)
    a[ys, xs, :3] = np.clip(lum[ys, xs, None] * tone[None, :] * 255, 0, 255).round().astype(np.int32)
    for y, x in zip(ys, xs): log.append((int(x // CW), int(x % CW), int(y)))
    return a, len(ys)

def drop_loose_tip(a, log):
    # 11칸: 굵은 칼날(알파≥60 큰 덩어리)과 떨어진 칼끝 바늘 조각과 그 사이 옅은 틈 픽셀을 지운다(칼날은 원래 가늘어지며 끝난다).
    from collections import deque
    x0 = 11 * CW; f = a[:, x0:x0 + CW]; al = f[..., 3]
    m = al >= 60; H, W = m.shape; lab = np.zeros((H, W), int); k = 0; sizes = {}
    for y, x in zip(*np.where(m)):
        if lab[y, x]: continue
        k += 1; q = deque([(y, x)]); lab[y, x] = k; cnt = 0
        while q:
            cy, cx = q.popleft(); cnt += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < H and 0 <= nx < W and m[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = k; q.append((ny, nx))
        sizes[k] = cnt
    main = max(sizes, key=sizes.get); small = [k for k in sizes if k != main and sizes[k] >= 8]
    if len(small) != 1: raise SystemExit(f'칼끝 조각을 하나로 못 찾음: {small}')
    ty, tx = np.where(lab == small[0])
    # 칼날 쪽 끝 = 큰 덩어리 중 조각에 가장 가까운 점. 그 점과 조각을 감싸는 상자 안에서 큰 덩어리가 아닌 픽셀(옅은 틈 포함)만 지운다.
    my, mx = np.where(lab == main); j = np.argmin((my - ty.min()) ** 2 + (mx - tx.min()) ** 2)
    y0, y1 = int(my[j]) + 1, int(ty.max()) + 2; xa, xb = int(min(tx.min(), mx[j])) - 8, int(tx.max()) + 3
    box = np.zeros_like(m); box[y0:y1, xa:xb] = True
    kill = box & (al > 0) & (lab != main)
    n = int(kill.sum()); f[kill] = 0
    log.append(('loose-tip', [int(my[j]), int(mx[j])], [int(ty.min()), int(tx.min()), int(ty.max()), int(tx.max())], n))
    return n

def main():
    im = Image.open(SRC).convert('RGBA'); assert im.size == (CW * N, 214), im.size
    a = np.array(im).astype(np.int32); log = []
    a, n1 = fix_specks(a, log)
    n2 = drop_loose_tip(a, log)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA').save(OUT, 'WEBP', lossless=True, quality=100, method=6, exact=True)
    sha = hashlib.sha256(open(OUT, 'rb').read()).hexdigest()
    json.dump({'revision': 'R439', 'file': 'attack-e.webp', 'source': 'assets/r283/hwando/r271/attack-e.webp',
               'source_sha256': hashlib.sha256(open(SRC, 'rb').read()).hexdigest(), 'sha256': sha, 'bytes': os.path.getsize(OUT),
               'atlas': [CW * N, 214], 'n': N, 'cell': [CW, 214], 'specks_neutralised': n1, 'loose_tip_px_removed': n2},
              open(os.path.join(os.path.dirname(OUT), 'index.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps({'src': os.path.relpath(SRC, A), 'out': os.path.relpath(OUT, A), 'specks': n1, 'loose_tip_px': n2,
                      'frames': sorted({e[0] for e in log if isinstance(e[0], int)}), 'loose_tip': [e for e in log if e[0] == 'loose-tip'],
                      'bytes': os.path.getsize(OUT), 'sha256': sha}, ensure_ascii=False))

if __name__ == '__main__':
    main()
