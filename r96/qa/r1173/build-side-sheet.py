#!/usr/bin/env python3
"""R1173 — 페르소나 '영웅' 옆 걷기 시트 다듬기(새로 그리지 않고 R1104b 시트 픽셀만 옮기고 섞는다. 보스가 쓰는 R1104b 시트는 그대로).
 ① 골반 오르내림: 두 발 벌린 칸(0·4)은 상체를 4px 내리고 지나가는 칸(2·6)은 4px 올린다. 엉덩이 아래(y≥326)는 그대로,
    y230~326 띠에서 이동량을 부드럽게(smoothstep) 0 으로 줄여 허리·허벅지가 끊기지 않고 늘었다 줄었다 한다.
    (R1104b 옆 시트는 상체가 8칸 모두 같은 한 장이라 다리만 움직이고 허리가 굳어 보였다.)
 ② 허리 띠(y280~345) 안 1~3px 투명 틈(상체·다리 합성 이음매)을 양옆 색으로 채운다.
 ③ 허벅지 뒤 망토 안감 채움 끝이 가로로 곧게 잘린 곳(R1104b 2·6번 칸, 15px)을 망토 자락처럼 비스듬히 깎고 3px 알파로 흐린다.
쓰기: python3 build-side-sheet.py <R1104b side.webp> <출력 webp>
"""
import sys
import numpy as np
from PIL import Image

CELL, N = 512, 8
BOB = {0: 4.0, 4: 4.0, 2: -4.0, 6: -4.0}   # +는 아래로
Y0, Y1 = 230, 326

def bob(cell, b):
    if not b: return cell
    H = cell.shape[0]
    a = cell.astype(np.float32)
    pm = a.copy(); pm[..., :3] *= a[..., 3:4] / 255.0   # 미리 곱한 알파로 섞어야 가장자리 테가 안 생김
    out = pm.copy()
    for y in range(0, Y1):
        if y <= Y0: w = 1.0
        else:
            t = (y - Y0) / (Y1 - Y0); w = 1 - t * t * (3 - 2 * t)
        sy = y - b * w
        if sy < 0: out[y] = 0; continue
        y0 = int(np.floor(sy)); fr = sy - y0; y1 = min(H - 1, y0 + 1)
        out[y] = pm[y0] * (1 - fr) + pm[y1] * fr
    al = out[..., 3:4]
    rgb = np.where(al > 0, out[..., :3] * 255.0 / np.maximum(al, 1e-6), 0)
    res = np.uint8(np.clip(np.concatenate([rgb, al], -1) + .5, 0, 255))
    res[Y1:] = cell[Y1:]                                   # 엉덩이 아래는 원본 그대로(바이트까지)
    return res

def fill_holes(cell, y0=280, y1=346, maxw=3):
    n = 0
    for y in range(y0, y1):
        op = cell[y, :, 3] >= 128
        xs = np.nonzero(op)[0]
        if len(xs) == 0: continue
        x = xs.min()
        while x < xs.max():
            if op[x]: x += 1; continue
            e = x
            while e < xs.max() and not op[e]: e += 1
            w = e - x
            if w <= maxw:
                L = cell[y, x - 1].astype(np.float32); R = cell[y, e].astype(np.float32)
                for k in range(w):
                    t = (k + 1) / (w + 1); v = L * (1 - t) + R * t
                    cell[y, x + k, :3] = np.uint8(v[:3]); cell[y, x + k, 3] = 255; n += 1
            x = e
    return n

def taper_cuts(cell, y0=300, y1=441, minrun=9, D=12):
    al = cell[..., 3] >= 128
    fixed = []
    for y in range(y0, y1):
        e = al[y] & ~al[y + 1]
        x = 0
        while x < CELL:
            if not e[x]: x += 1; continue
            s = x
            while x < CELL and e[x]: x += 1
            if x - s >= minrun: fixed.append((y, s, x - 1))
    for y, x0, x1 in fixed:
        def bottom(xx):
            col = np.nonzero(cell[:, xx, 3] >= 128)[0]; col = col[col >= y - 40]
            return col.max() if len(col) else -1
        lowL, lowR = bottom(max(0, x0 - 1)), bottom(min(CELL - 1, x1 + 1))
        for x in range(x0, x1 + 1):
            t = (x - x0) / max(1, x1 - x0)
            raise_ = D * ((1 - t) if lowR >= lowL else t)          # 아래로 더 내려간 이웃 쪽은 낮게, 반대쪽은 D 만큼 올림
            nb = int(round(y - raise_))
            cell[nb + 1:y + 1, x, 3] = 0
            for k in range(3):                                      # 끝 3px 알파 흐리기
                yy = nb - k
                cell[yy, x, 3] = np.uint8(int(cell[yy, x, 3]) * (k + 1) // 4)
    return len(fixed)

def main(src, dst):
    a = np.array(Image.open(src).convert('RGBA'))
    assert a.shape == (CELL, CELL * N, 4), a.shape
    out = a.copy(); log = []
    for f in range(N):
        c = bob(a[:, f * CELL:(f + 1) * CELL], BOB.get(f, 0.0))
        k = taper_cuts(c); h = fill_holes(c)   # 깎은 쐐기 끝 1~3px 틈도 허리 띠 안이면 메움
        out[:, f * CELL:(f + 1) * CELL] = c; log.append((f, BOB.get(f, 0.0), h, k))
    Image.fromarray(out).save(dst, 'WEBP', lossless=True, exact=True, quality=100, method=6)   # exact: 투명 화소 색도 원본대로
    for r in log: print('칸 %d 골반 %+.0fpx 구멍 %d 잘림 %d' % r)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
