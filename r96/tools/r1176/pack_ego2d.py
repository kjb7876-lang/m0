#!/usr/bin/env python3
"""R1176: Dots CX-0155EG 2D EGO 전신 모션 원본(512칸)을 게임용 webp(256칸, 발 128·220 — R1139b 가로 베기 시트와 같은 규격)로 담는다.
원본은 건드리지 않는다. 손질: ① 종이 배경(흰 반투명 네모)이 남은 칸은 바깥에서 번져 들어가며 지우고 광륜 안쪽 종이도 지운다(깃털의 미색은 채도로 구분해 남긴다)
② 종이 칸은 같은 방향 시트의 몸 키에 맞춰 줄이고 발 높이·발 가운데를 맞춘다 ③ 256칸으로 줄인다.
usage: python3 -I pack_ego2d.py <raw dir> <out dir(r96/runtime-text/assets/r1176/ego2d)> [검토용 미리보기 png]"""
import sys, os, json, hashlib
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
raw, out = sys.argv[1], sys.argv[2]
preview = sys.argv[3] if len(sys.argv) > 3 else None
os.makedirs(out, exist_ok=True)
C0, C1, FOOT0, PX = 512, 256, 440, 256
P = 'CX-0155EG-'
JOBS = [  # (원본, 결과, 칸 수, 키 기준 시트(종이 칸일 때), 용도)
 ('2_idle_front8_r1_ROUGH.png', 'idle-front.webp', 8, None, '대기 · 앞'),
 ('2_idle_right8_r1_ROUGH.png', 'idle-right.webp', 8, None, '대기 · 오른쪽(왼쪽은 좌우 뒤집기)'),
 ('2_idle_rear8_r1_ROUGH.png', 'idle-rear.webp', 8, None, '대기 · 뒤'),
 ('1_walk_front8_r1_ROUGH.png', 'walk-front.webp', 8, None, '걷기 · 앞'),
 ('1_walk_right8_r1_ROUGH.png', 'walk-right.webp', 8, None, '걷기 · 오른쪽'),
 ('1_walk_rear8_r1_ROUGH.png', 'walk-rear.webp', 8, 'idle-rear.webp', '걷기 · 뒤(종이 배경 지움)'),
 ('4_run_front8_r1_ROUGH.png', 'run-front.webp', 8, 'idle-front.webp', '달리기 · 앞(종이 배경 지움)'),
 ('4_run_right8_r1_HOLD.png', 'run-right.webp', 8, None, '달리기 · 오른쪽'),
 ('4_run_rear8_r1_ROUGH.png', 'run-rear.webp', 8, None, '달리기 · 뒤'),
 ('3_hit_front4_r1_ROUGH.png', 'hit-front.webp', 4, None, '피격 · 앞'),
 ('3_hit_right4_r1_ROUGH.png', 'hit-right.webp', 4, None, '피격 · 오른쪽'),
 ('3_hit_rear4_r1_ROUGH.png', 'hit-rear.webp', 4, None, '피격 · 뒤'),
 ('5_cast_front8_r1_ROUGH.png', 'cast-front.webp', 8, None, '스킬 시전 · 앞'),
 ('5_cast_right8_r1_ROUGH.png', 'cast-right.webp', 8, 'idle-right.webp', '스킬 시전 · 오른쪽(종이 배경 지움)'),
 ('5_cast_rear8_r1_ROUGH.png', 'cast-rear.webp', 8, None, '스킬 시전 · 뒤'),
 ('6_discard_front12_r1_ROUGH.png', 'discard-front.webp', 12, None, '관측 폐기 · 앞(다른 방향도 이 그림)'),
]
def has_paper(a):
    al = a[..., 3] > 40
    if al.sum() < 100: return False
    rgb = a[..., :3].astype(int)
    white = al & (rgb.min(2) > 235) & ((rgb.max(2) - rgb.min(2)) < 10)
    return white.sum() / al.sum() > .3
def strip_paper(a):
    """종이(밝은 무채색, 반투명)를 지운다. 깃털 미색·살색은 채도가 있어 남는다."""
    rgb = a[..., :3].astype(int); al = a[..., 3].astype(int)
    mn, mx = rgb.min(2), rgb.max(2); sat = mx - mn
    ys, xs = np.where(al > 40); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    paperish = (mn > 196) & (sat < 16)              # 종이와 그 그늘·바닥 줄
    strict = (mn > 196) & (sat < 14)                # 갇힌 종이(광륜 안쪽·다리 사이). 깃털 미색은 채도 20 이상이라 남는다
    empty = al <= 40
    band = np.zeros_like(empty); m = 5
    band[y0:y0 + m, :] = band[y1 - m + 1:y1 + 1, :] = True; band[:, x0:x0 + m] = band[:, x1 - m + 1:x1 + 1] = True
    walk = paperish | empty | band
    lab, n = ndi.label(walk)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])); edge = edge[edge > 0]
    kill = np.isin(lab, edge)
    lab2, n2 = ndi.label(strict & ~kill)
    if n2:
        area = ndi.sum(np.ones_like(lab2), lab2, index=np.arange(1, n2 + 1))
        kill |= np.isin(lab2, np.where(area >= 40)[0] + 1)
    # 바닥 줄(네모 맨 아래의 회색 띠)은 발 아래쪽에서 통째로
    out = a.copy(); out[..., 3] = np.where(kill, 0, a[..., 3])
    # 가장자리 흰 테: 지운 곳 2칸 안쪽의 밝은 무채색은 흰 정도만큼 옅게
    near = ndi.binary_dilation(kill, iterations=2) & ~kill
    w = np.clip((mn - 170) / 70., 0, 1) * np.clip((26 - sat) / 16., 0, 1)
    o3 = out[..., 3].astype(float); o3[near] *= (1 - .85 * w[near]); out[..., 3] = o3.astype(np.uint8)
    # 남은 밝은 무채색(광륜 빛 번짐에 밴 종이 흰빛)은 옅게 — 종이 없는 시트의 광륜 농도에 맞춘다
    wash = (mn > 196) & (sat < 26) & ~kill; o3 = out[..., 3].astype(float); o3[wash] *= .45; out[..., 3] = o3.astype(np.uint8)
    # 조각난 부스러기 제거
    lab3, n3 = ndi.label(out[..., 3] > 40)
    if n3 > 1:
        area = ndi.sum(np.ones_like(lab3), lab3, index=np.arange(1, n3 + 1)); small = np.where(area < 60)[0] + 1
        out[..., 3] = np.where(np.isin(lab3, small), 0, out[..., 3])
    return out
def bbox(a):
    ys, xs = np.where(a[..., 3] > 40); return xs.min(), xs.max(), ys.min(), ys.max()
def footx(a):
    x0, x1, y0, y1 = bbox(a); ys, xs = np.where(a[y1 - 12:y1 + 1, :, 3] > 40); return float(np.median(xs))
heights, rows, sheets = {}, [], {}
for src, dst, n, ref, use in JOBS:
    p = os.path.join(raw, P + src); im = Image.open(p).convert('RGBA'); assert im.size == (C0 * n, C0), (src, im.size)
    cells = [np.array(im.crop((i * C0, 0, (i + 1) * C0, C0))) for i in range(n)]
    paper = [has_paper(c) for c in cells]; note = ''
    if any(paper):
        cells = [strip_paper(c) if pp else c for c, pp in zip(cells, paper)]
        hs = [bbox(c)[3] - bbox(c)[2] for c, pp in zip(cells, paper) if pp]
        clean = [bbox(c)[3] - bbox(c)[2] for c, pp in zip(cells, paper) if not pp]
        target = float(np.median(clean)) if clean else heights[ref] * (1.0 if 'run' not in dst else 1.0)
        k = target / float(np.median(hs)) if 'run' not in dst else heights[ref] / float(np.max(hs)) * 1.02
        k = min(1.25, max(.75, k))
        bot = max(bbox(c)[3] for c, pp in zip(cells, paper) if pp)   # 시트 안 가장 낮은 발(뜬 칸은 뜬 채로)
        fixed = []
        for c, pp in zip(cells, paper):
            if not pp: fixed.append(c); continue
            fx = footx(c) if 'run' not in dst else (bbox(c)[0] + bbox(c)[1]) / 2
            if 'run' in dst: fx = 256 + (fx - 256) * 0  # 달리기 앞: 칸 가운데 유지
            big = Image.fromarray(c).resize((round(C0 * k), round(C0 * k)), Image.LANCZOS)
            cv = Image.new('RGBA', (C0, C0), (0, 0, 0, 0))
            cx = footx(c) if 'run' not in dst else 256.
            cv.alpha_composite(big, (0, 0)) if False else cv.paste(big, (round(PX - cx * k), round(FOOT0 - bot * k)))
            fixed.append(np.array(cv))
        cells = fixed; note = 'paper %d/%d, scale %.3f' % (sum(paper), n, k)
    heights[dst] = float(np.median([bbox(c)[3] - bbox(c)[2] for c in cells]))
    sheet = Image.new('RGBA', (C0 * n, C0), (0, 0, 0, 0))
    for i, c in enumerate(cells): sheet.paste(Image.fromarray(c), (i * C0, 0))
    small = sheet.resize((C1 * n, C1), Image.LANCZOS); q = os.path.join(out, dst); small.save(q, 'WEBP', quality=90, method=6, exact=False)
    sheets[dst] = small
    rows.append({'source': P + src, 'sourceSha256': hashlib.sha256(open(p, 'rb').read()).hexdigest(), 'sourceBytes': os.path.getsize(p), 'sourceCell': C0,
                 'file': dst, 'sha256': hashlib.sha256(open(q, 'rb').read()).hexdigest(), 'bytes': os.path.getsize(q), 'cell': C1, 'frames': n, 'foot': [128, 220], 'use': use, 'fix': note})
    print(dst, os.path.getsize(q), 'h', round(heights[dst]), note)
json.dump({'handoff': 'Dots CX-0155EG r1 (EGO 2D 전신 모션, ROUGH·HOLD 포함 — 코드 손질 후 적용)', 'files': rows}, open(os.path.join(out, 'index.json'), 'w'), ensure_ascii=False, indent=1)
print('total', sum(r['bytes'] for r in rows))
if preview:
    M = Image.new('RGB', (12 * 256, len(sheets) * 256), (22, 18, 24))
    for r, (k, s) in enumerate(sheets.items()):
        M.paste(s, (0, r * 256), s)
        for x in range(0, M.width, 4): M.putpixel((x, r * 256 + 220), (255, 0, 0))
    M.save(preview)
