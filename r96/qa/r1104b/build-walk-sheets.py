#!/usr/bin/env python3
"""R1104b — Dots CX-0120PW 페르소나 보스 걷기 3방향(아래·위·옆, 4096x512, 512칸x8)을 게임용으로 다듬는다.
원본 PNG 는 바꾸지 않고, 다듬은 결과만 runtime-text/assets/r1104b/*.webp 로 쓴다. 새 그림을 그리지 않고 원본 픽셀만 옮기고 섞는다.
 ① 공통: 1~4px 짜리 떨어진 점 지우기, 가장자리 밝은 테(흰 테두리) 걷기
 ② 옆(side): 상체(고정)와 다리(합성) 이음매 — 엉덩이 줄(y300) 아래 다리 윗부분의 밝기를 위쪽 상체 색에 맞춰 이어 주고(위에서 아래로 사라지는 보정),
    망토 그늘을 얹어 가로로 잘린 줄을 지운다. 다리와 망토 사이 1~2px 틈은 채운다.
 ③ 아래·위(front·rear): 칸마다 머리 높이가 최대 19px 튀는 것(아래 7번째, 위 1·8번째)을 엉덩이 줄 위만 세로로 늘이고 줄여 고르게 한다(발은 그대로).
쓰기: python3 build-walk-sheets.py <front.png> <rear.png> <side.png> <출력 폴더>
"""
import sys, json, hashlib, os
import numpy as np
from PIL import Image, ImageFilter

CELL, N, HIP = 512, 8, 300

def lum(a): return a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114

def despeckle(cell, min_px=40):
    """작은 떨어진 덩어리(알파>0) 지우기 — 4방향 연결 BFS."""
    al = cell[..., 3] > 0
    seen = np.zeros_like(al)
    H, W = al.shape
    removed = 0
    for y0, x0 in zip(*np.nonzero(al)):
        if seen[y0, x0]: continue
        st = [(y0, x0)]; seen[y0, x0] = True; comp = []
        while st:
            y, x = st.pop(); comp.append((y, x))
            if len(comp) > min_px: # 큰 덩어리면 나머지는 표시만
                pass
            for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                yy, xx = y+dy, x+dx
                if 0 <= yy < H and 0 <= xx < W and al[yy, xx] and not seen[yy, xx]:
                    seen[yy, xx] = True; st.append((yy, xx))
        if len(comp) < min_px:
            for y, x in comp: cell[y, x] = 0
            removed += len(comp)
    return removed

def defringe(cell, y0=0):
    """가장자리(투명과 맞닿은) 픽셀 중 안쪽 이웃보다 훨씬 밝은 것을 안쪽 색으로."""
    a = cell[..., 3]
    op = a >= 200
    im = Image.fromarray(np.uint8(op * 255))
    near_t = np.array(im.filter(ImageFilter.MinFilter(3))) < 255  # 3x3 안에 투명/반투명 있음
    edge = (a > 0) & near_t
    edge[:y0] = False
    L = lum(cell)
    # 안쪽 기준 색: 불투명 픽셀만 5x5 평균
    w = op.astype(np.float32)
    def box(v, r=2):
        k = 2*r+1
        p = np.pad(v, r, mode='edge'); c = p.cumsum(0).cumsum(1)
        c = np.pad(c, ((1,0),(1,0)))
        return c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]
    ws = box(w) + 1e-6
    ref = np.stack([box(cell[..., i] * w) / ws for i in range(3)], -1)
    refL = lum(ref)
    bad = edge & (L > refL + 28) & (box(w) > 3)
    cell[bad, :3] = ref[bad]
    return int(bad.sum())

def close_gaps(cell, region):
    """영역 안에서 좌우(또는 위아래)로 불투명에 낀 1~2px 투명 틈 채우기."""
    a = cell[..., 3].astype(np.int32)
    op = a >= 160
    filled = 0
    H, W = op.shape
    y0, y1, x0, x1 = region
    for gap in (1, 2):
        for y in range(y0, y1):
            row = op[y]
            for x in range(x0 + 1, x1 - gap):
                if row[x-1] and not row[x:x+gap].any() and row[x+gap]:
                    L, R = cell[y, x-1].astype(np.float32), cell[y, x+gap].astype(np.float32)
                    for k in range(gap):
                        t = (k + 1) / (gap + 1)
                        cell[y, x+k] = np.uint8(np.clip(L*(1-t) + R*t, 0, 255)); cell[y, x+k, 3] = 255
                        filled += 1
                    row = op[y] = cell[y, :, 3] >= 160
    return filled

def fill_cape_gaps(cell, still, y0, y1, x0, x1, maxw=16):
    """다리 합성 때 비운 자리 중 망토와 맞닿은 좁은 투명 틈(가로 maxw 이하)을 망토 안감 그늘색으로 채운다.
    한쪽은 망토, 한쪽은 다리이고 바로 윗줄이 막혀 있는(위에서 이어 내려온 구멍) 틈만 채운다.
    다리와 다리 사이·망토 자락과 자락 사이 틈은 진짜 틈이라 남긴다."""
    filled = 0
    F = np.zeros(cell.shape[:2], bool)
    for y in range(y0, y1):
        op = cell[y, :, 3] >= 128
        x = x0
        while x < x1:
            if op[x] or not op[x-1]: x += 1; continue
            e = x
            while e < x1 and not op[e]: e += 1
            w = e - x
            if e < x1 and 0 < w <= maxw and ((still[y, x-1] != still[y, e]) or y < HIP + 40) and (cell[y-1, x:e, 3] >= 128).mean() > .6:
                L, R = cell[y, x-1, :3].astype(np.float32), cell[y, e, :3].astype(np.float32)
                for k in range(w):
                    t = (k + 1) / (w + 1); mid = 1 - .45 * np.sin(np.pi * t)   # 가운데로 갈수록 깊은 그늘
                    cell[y, x+k, :3] = np.uint8(np.clip((L*(1-t) + R*t) * mid, 0, 255)); cell[y, x+k, 3] = 255
                F[y, x:e] = True
                filled += w
            x = e + 1
    # 채운 기둥의 아래 끝 8줄은 알파를 서서히 빼서 가로로 잘린 끝이 안 보이게
    run = np.zeros(F.shape, np.int32)
    for y in range(y1 - 1, y0 - 1, -1):
        run[y] = np.where(F[y], (run[y + 1] + 1) if y + 1 < F.shape[0] else 1, 0)
    fade = F & (run < 8)
    cell[fade, 3] = np.uint8(255 * (run[fade] + 1) / 9)
    return filled

def soften_edges(cell, y0, region_mask):
    """다리 띠 안에서 계단처럼 잘린 실루엣 가장자리 알파를 3x3 로 부드럽게."""
    a = cell[..., 3].astype(np.float32)
    b = np.array(Image.fromarray(np.uint8(a)).filter(ImageFilter.BoxBlur(1))).astype(np.float32)
    op = a >= 250
    near_t = np.array(Image.fromarray(np.uint8(op * 255)).filter(ImageFilter.MinFilter(3))) < 255
    m = region_mask & near_t & (a > 0)
    m[:y0] = False
    cell[m, 3] = np.uint8(np.minimum(a[m], b[m] * 1.15).clip(0, 255))
    return int(m.sum())

def hip_blend(cell, legmask, band=30, shade=.42, shade_rows=30):
    """엉덩이 줄(HIP) 아래 다리 픽셀의 색을 바로 위 상체 색에 이어 붙인다."""
    c = cell.astype(np.float32)
    above = c[HIP-6:HIP, :, :3].mean(0)
    below = c[HIP:HIP+6, :, :3].mean(0)
    okA = (cell[HIP-6:HIP, :, 3] >= 200).all(0)
    okB = (cell[HIP:HIP+6, :, 3] >= 200).all(0)
    delta = np.where((okA & okB)[:, None], above - below, 0)
    # 가로로 부드럽게(9칸)
    k = 9; pad = np.pad(delta, ((k//2, k//2), (0, 0)), mode='edge')
    delta = np.stack([np.convolve(pad[:, i], np.ones(k)/k, mode='valid') for i in range(3)], -1)
    changed = 0
    for dy in range(band):
        y = HIP + dy
        t = 1 - dy / band
        m = legmask[y] & (cell[y, :, 3] > 0)
        if not m.any(): continue
        sh = 1 - shade * max(0, 1 - dy / shade_rows)   # 망토 아래 그늘
        v = (c[y, m, :3] + delta[m] * t * t) * sh
        cell[y, m, :3] = np.uint8(np.clip(v, 0, 255)); changed += int(m.sum())
    # 이음매 줄(HIP-2..HIP+3) 세로 3칸 부드럽게(보정한 색 기준)
    c = cell.astype(np.float32)
    for y in range(HIP-2, HIP+4):
        m = legmask[y] | legmask[min(y+1, CELL-1)]
        m &= (cell[y-1, :, 3] >= 200) & (cell[y+1, :, 3] >= 200)
        cell[y, m, :3] = np.uint8((c[y-1, m, :3] + 2*c[y, m, :3] + c[y+1, m, :3]) / 4)
    return changed

def level_heads(cells, hip=HIP):
    """머리 꼭대기(알파>40 첫 줄)를 중앙값으로 맞춘다: 엉덩이 줄 위만 세로로 다시 뽑는다."""
    tops = [int(np.nonzero((c[..., 3] > 40).any(1))[0][0]) for c in cells]
    target = int(np.median(tops))
    out = []
    for c, top in zip(cells, tops):
        if top == target: out.append(c); continue
        # 새 줄 y(target..hip) ← 원래 줄 top + (y-target)*(hip-top)/(hip-target)
        n = c.copy(); n[:hip] = 0
        src = c.astype(np.float32)
        for y in range(max(0, target - 2), hip):
            sy = top + (y - target) * (hip - top) / (hip - target)
            if sy < 0: continue
            y0 = int(np.floor(sy)); f = sy - y0; y1 = min(y0 + 1, CELL - 1)
            # 알파 곱해 섞기
            a0, a1 = src[y0, :, 3:4] / 255, src[y1, :, 3:4] / 255
            al = a0 * (1 - f) + a1 * f
            col = (src[y0, :, :3] * a0 * (1 - f) + src[y1, :, :3] * a1 * f) / np.maximum(al, 1e-6)
            n[y, :, :3] = np.uint8(np.clip(col, 0, 255)); n[y, :, 3] = np.uint8(np.clip(al[:, 0] * 255, 0, 255))
        out.append(n)
    return out, tops, target

def process(path, kind, report):
    a = np.array(Image.open(path).convert('RGBA'))
    assert a.shape == (CELL, CELL * N, 4), a.shape
    cells = [a[:, i*CELL:(i+1)*CELL].copy() for i in range(N)]
    rep = {'source': os.path.basename(path), 'sha256': hashlib.sha256(open(path, 'rb').read()).hexdigest(), 'frames': []}
    if kind == 'side':
        stack = np.stack(cells).astype(np.int16)
        still = (np.abs(stack - stack[0]).sum(-1) == 0).all(0)   # 모든 칸 같은 곳 = 고정 망토·상체
        for i, c in enumerate(cells):
            leg = ~still & (c[..., 3] > 0); leg[:HIP] = False
            r = {'gaps': close_gaps(c, (HIP, 472, 150, 360)),
                 'capegap': fill_cape_gaps(c, still & (c[..., 3] > 0), HIP - 4, 448, 150, 370),
                 'hip': hip_blend(c, leg | (~still & (np.arange(CELL)[:, None] >= HIP)))}
            reg = np.zeros((CELL, CELL), bool); reg[HIP:472, 150:370] = True
            r['soft'] = soften_edges(c, HIP, reg)
            rep['frames'].append(r)
    if kind in ('front', 'rear'):
        cells, tops, target = level_heads(cells)
        rep['tops_before'] = tops; rep['top_target'] = target
        rep['frames'] = [{} for _ in cells]
    for i, c in enumerate(cells):
        rep['frames'][i]['speck'] = despeckle(c)
        rep['frames'][i]['fringe'] = defringe(c, y0=200)
        c[c[..., 3] <= 16] = 0
    out = np.concatenate(cells, 1)
    rep['tops_after'] = [int(np.nonzero((c[..., 3] > 40).any(1))[0][0]) for c in cells]
    rep['ground'] = [int(np.nonzero((c[..., 3] > 40).any(1))[0][-1]) for c in cells]
    report[kind] = rep
    return Image.fromarray(out, 'RGBA')

if __name__ == '__main__':
    f, r, s, outdir = sys.argv[1:5]
    os.makedirs(outdir, exist_ok=True)
    report = {}
    for p, k in ((f, 'front'), (r, 'rear'), (s, 'side')):
        im = process(p, k, report)
        dst = os.path.join(outdir, f'persona-walk-{k}.webp')
        im.save(dst, 'WEBP', quality=90, method=6, exact=False)
        im.save(os.path.join(outdir, f'persona-walk-{k}.preview.png')) if '--png' in sys.argv else None
        report[k]['out'] = os.path.basename(dst); report[k]['out_sha256'] = hashlib.sha256(open(dst, 'rb').read()).hexdigest(); report[k]['bytes'] = os.path.getsize(dst)
    print(json.dumps(report, ensure_ascii=False, indent=1))
