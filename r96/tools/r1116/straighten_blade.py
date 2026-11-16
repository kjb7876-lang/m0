#!/usr/bin/env python3
"""R1116 EGO 칼 곧게 — 미리 구운 수묵 시트(r1112/ego-ink)에서 휜 칼날을 지우고 곧은 칼을 다시 그린다.

원본은 읽기만 한다. 결과는 assets/r1116/ego-ink/ 에 같은 이름·같은 크기로 쓴다.
  python3 r96/tools/r1116/straighten_blade.py [--debug DIR]

칸마다
  1) 칼날 화소 = 불투명·무채색·밝음(먹 테두리 안 회백색 띠) → 길쭉한 덩어리만 고른다.
  2) 주축(PCA)의 양 끝을 잡고, 몸 중심에 가까운 끝을 손잡이로 본다.
  3) 칼날+테두리+칼 둘레 빛을 지우고 cv2.inpaint 로 주변(몸·빛·투명)을 이어 채운다.
  4) 손잡이→끝 곧은 칼(먹 테두리 + 흰 심 + 옅은 빛, 끝 25% 뾰족)을 다시 그린다.
     원래 칼이 몸 뒤로 가려졌던 구간은 그대로 가려 둔다(주축 위 보였던 구간만 그림).
"""
import argparse, json, os, sys
import numpy as np
import cv2
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'runtime-text', 'assets', 'r1112', 'ego-ink')
DST = os.path.join(ROOT, 'runtime-text', 'assets', 'r1116', 'ego-ink')
INK = (48, 46, 48)        # 먹
CORE = (243, 238, 226)    # 흰
EDGE = (204, 52, 40)      # 언주(날 끝 가는 선)
GLOW = (214, 201, 190)    # 기존 몸 둘레 빛 평균색
SS = 4                    # 그리기 배율
THICK = 17                # 이 지름보다 가는 불투명 줄기 = 칼 후보
TIP_ALPHA = 175           # 칼끝 잇기 불투명 문턱
MIN_LEN = 34              # 칼 후보 최소 길이(px)


def blade_mask(a):
    r, g, b, al = (a[..., i].astype(int) for i in range(4))
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    return (al > 200) & (mx - mn < 28) & (mx > 125)


def pca(pts):
    c = pts.mean(0)
    u, s, vt = np.linalg.svd(pts - c, full_matrices=False)
    d = vt[0]
    t = (pts - c) @ d
    n = (pts - c) @ vt[1]
    return c, d, t, n


def fill_holes(m):
    h, w = m.shape
    ff = np.pad(m, 1).copy()
    mask = np.zeros((h + 4, w + 4), np.uint8)
    cv2.floodFill(ff, mask, (0, 0), 2)
    return ((ff[1:-1, 1:-1] != 2)).astype(np.uint8)


def comp_shape(pts):
    c, d, t, n = pca(pts)
    L = float(t.max() - t.min())
    w = float(2 * n.std() + 1)
    return c, d, t, L, w


def find_blade(a):
    """칼 = 몸 덩어리에서 가늘고 곧게 뻗어 나온 줄기(불투명 영역의 얇은 부분)."""
    O = fill_holes((a[..., 3] > 200).astype(np.uint8))
    thick = cv2.morphologyEx(O, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (THICK, THICK)))
    thin = O & ~cv2.dilate(thick, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(thin, connectivity=8)
    r, g, b = (a[..., i].astype(int) for i in range(3))
    red = (r - np.maximum(g, b)) > 70
    cands = []
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < 20:
            continue
        ys, xs = np.nonzero(lab == i)
        pts = np.stack([xs, ys], 1).astype(float)
        c, d, t, L, w = comp_shape(pts)
        if L < MIN_LEN or L / w < 4.0 or w > 14:
            continue
        if red[ys, xs].mean() > .35:        # 붉은 머리칼·옷자락
            continue
        if straight_dev(pts) > 6:            # 크게 휜 줄기는 칼이 아님(옷자락)
            continue
        cands.append((L, i, c, d))
    if not cands:
        return None
    cands.sort(reverse=True)
    L0, i0, c0, d0 = cands[0]
    sel = lab == i0
    # 같은 축 위 몸 앞을 지나는 밝은 칼 조각(회백색)을 잇는다
    gm = blade_mask(a).astype(np.uint8)
    n2, lab2, st2, _ = cv2.connectedComponentsWithStats(gm, connectivity=8)
    for j in range(1, n2):
        if st2[j, cv2.CC_STAT_AREA] < 6:
            continue
        ys, xs = np.nonzero(lab2 == j)
        pts = np.stack([xs, ys], 1).astype(float)
        off = pts - c0
        dist = np.abs(off[:, 0] * d0[1] - off[:, 1] * d0[0])
        if dist.max() < 3.5 and len(xs) >= 6:
            sel |= lab2 == j
    ys, xs = np.nonzero(sel)
    pts = np.stack([xs, ys], 1).astype(float)
    c, d, t, nn = pca(pts)
    return sel, pts, c, d, t


def straight_dev(pts):
    """칼 중심선이 직선에서 벗어난 정도(px). 주축을 따라 2px 칸마다 수직 위치 평균 → 직선 맞춤 잔차의 최대-최소."""
    _, _, t, n = pca(pts)
    b = np.floor((t - t.min()) / 2).astype(int)
    xs, ys = [], []
    for k in np.unique(b):
        m = b == k
        if m.sum() >= 2:
            xs.append(t[m].mean()); ys.append(n[m].mean())
    if len(xs) < 4:
        return 0.0
    xs, ys = np.array(xs), np.array(ys)
    A = np.stack([xs, np.ones_like(xs)], 1)
    r = ys - A @ np.linalg.lstsq(A, ys, rcond=None)[0]
    return float(r.max() - r.min())


def end_point(pts, t, at_max):
    k = t >= t.max() - 2 if at_max else t <= t.min() + 2
    return pts[k].mean(0)


def process_cell(cell, info=None):
    a = cell.copy()
    fb = find_blade(a)
    if fb is None:
        return a, None
    sel, pts, c, d, t = fb
    al = a[..., 3]
    body = (al > 200) & ~cv2.dilate(sel.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    if body.sum() < 50:
        return a, None
    by, bx = np.nonzero(body)
    bc = np.array([bx.mean(), by.mean()])
    p_hi, p_lo = end_point(pts, t, True), end_point(pts, t, False)
    hilt, tip = (p_hi, p_lo) if np.linalg.norm(p_hi - bc) < np.linalg.norm(p_lo - bc) else (p_lo, p_hi)
    # 칼끝이 옅어 불투명 문턱 밖으로 빠진 몫을 되살린다(칼 방향으로 불투명 화소가 이어지는 데까지)
    u0 = (tip - hilt) / max(float(np.linalg.norm(tip - hilt)), 1e-6)
    nv0 = np.array([-u0[1], u0[0]])
    h0, w0 = a.shape[:2]
    ext = 0
    for st_ in range(1, 40):
        best = 0
        for o_ in (-1.5, -.75, 0, .75, 1.5):
            q = tip + u0 * st_ + nv0 * o_
            xi, yi = int(round(q[0])), int(round(q[1]))
            if 0 <= xi < w0 and 0 <= yi < h0:
                best = max(best, int(a[yi, xi, 3]))
        if best >= TIP_ALPHA:
            ext = st_
        elif st_ - ext > 2:
            break
    tip = tip + u0 * ext
    v = tip - hilt
    L = float(np.linalg.norm(v))
    u = v / max(L, 1e-6)
    bend = straight_dev(pts)
    # 1) 지울 곳: 칼날+먹 테두리(3px) ∪ 몸에서 먼 칼 둘레 빛(9px)
    s8 = sel.astype(np.uint8)
    if ext:
        q0 = tip - u0 * ext
        cv2.line(s8, (int(round(q0[0])), int(round(q0[1]))), (int(round(tip[0])), int(round(tip[1]))), 1, 3)
    E = cv2.dilate(s8, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))).astype(bool)
    H = cv2.dilate(s8, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19))).astype(bool)
    bodyfar = cv2.dilate(body.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))).astype(bool)
    R = E | (H & ~bodyfar)
    # 2) 이어 채우기: 미리 곱한 색으로(투명 쪽 색이 번지지 않게)
    alf = a[..., 3:4].astype(float) / 255
    pm = (a[..., :3].astype(float) * alf).astype(np.uint8)
    mk = R.astype(np.uint8) * 255
    pm2 = cv2.inpaint(pm, mk, 4, cv2.INPAINT_TELEA)
    al2 = cv2.inpaint(a[..., 3].copy(), mk, 4, cv2.INPAINT_TELEA)
    # 몸에서 먼 곳은 투명으로(빛이 끌려 나오지 않게)
    al2 = np.where(H & ~bodyfar, 0, al2).astype(np.uint8)
    rgb = np.where(al2[..., None] > 0, np.clip(pm2.astype(float) * 255 / np.maximum(al2[..., None], 1), 0, 255), 0)
    out = a.copy()
    out[..., :3] = np.where(R[..., None], rgb, a[..., :3]).astype(np.uint8)
    out[..., 3] = np.where(R, al2, a[..., 3])
    # 3) 곧은 칼: 원래 보였던 구간(주축 투영)만
    tt = (pts - hilt) @ u
    vis = np.zeros(int(L) + 8, bool)
    for x in tt:
        k = int(round(x))
        if 0 <= k < len(vis):
            vis[max(0, k - 2):k + 3] = True
    vis[:3] = True
    h, w = a.shape[:2]
    big = np.zeros((h * SS, w * SS, 4), np.uint8)
    nrm = np.array([-u[1], u[0]])
    def poly(half, color, alpha, taper=0.25, edge=0.0):
        P = []
        for side in (1, -1):
            seq = np.linspace(0, 1, 24)
            if side < 0:
                seq = seq[::-1]
            for s in seq:
                wv = half * (1.0 if s < 1 - taper else max(0.0, (1 - s) / taper))
                p = hilt + u * (s * L) + nrm * (side * wv + edge)
                P.append(p)
        P = (np.array(P) * SS).astype(np.int32)
        lay = np.zeros_like(big)
        cv2.fillPoly(lay, [P], (*color, int(255 * alpha)), lineType=cv2.LINE_AA)
        return lay
    glow = poly(4.2, GLOW, .55)
    glow = cv2.GaussianBlur(glow, (0, 0), SS * 2.0)
    layers = [glow, poly(2.7, INK, 1.0), poly(1.5, CORE, 1.0, taper=.3), poly(.35, EDGE, .55, taper=.3, edge=1.2)]
    for lay in layers:
        la = lay[..., 3:4].astype(float) / 255
        ba = big[..., 3:4].astype(float) / 255
        oa = la + ba * (1 - la)
        big[..., :3] = np.where(oa > 0, (lay[..., :3] * la + big[..., :3] * ba * (1 - la)) / np.maximum(oa, 1e-6), 0).astype(np.uint8)
        big[..., 3:4] = (oa * 255).astype(np.uint8)
    nb = cv2.resize(big, (w, h), interpolation=cv2.INTER_AREA)
    # 가려진 구간 지우기(빛은 남김: 빛 층은 가림 없이)
    yy, xx = np.mgrid[0:h, 0:w]
    tp = (xx - hilt[0]) * u[0] + (yy - hilt[1]) * u[1]
    ki = np.clip(np.round(tp).astype(int), 0, len(vis) - 1)
    keep = vis[ki] | (tp < 0)
    gl = cv2.resize(glow, (w, h), interpolation=cv2.INTER_AREA)
    nb = np.where(keep[..., None], nb, gl)
    la = nb[..., 3:4].astype(float) / 255
    oa_ = out[..., 3:4].astype(float) / 255
    oa = la + oa_ * (1 - la)
    out[..., :3] = np.where(oa > 0, (nb[..., :3] * la + out[..., :3] * oa_ * (1 - la)) / np.maximum(oa, 1e-6), 0).astype(np.uint8)
    out[..., 3:4] = (oa * 255).astype(np.uint8)
    rep = {'hilt': [round(float(hilt[0]), 1), round(float(hilt[1]), 1)], 'tip': [round(float(tip[0]), 1), round(float(tip[1]), 1)],
           'len': round(L, 1), 'bend': round(bend, 2), 'px': int(sel.sum())}
    if info is not None:
        # 고친 뒤 굽은 정도 다시 잼
        fb2 = find_blade(out)
        if fb2 is not None:
            rep['bendAfter'] = round(straight_dev(fb2[1]), 2)
    return out, rep


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--debug')
    ap.add_argument('--only')
    args = ap.parse_args()
    os.makedirs(DST, exist_ok=True)
    report = {}
    for fn in sorted(os.listdir(SRC)):
        if not fn.endswith('.webp'):
            continue
        k = fn[:-5]
        if args.only and k not in args.only.split(','):
            continue
        im = np.array(Image.open(os.path.join(SRC, fn)).convert('RGBA'))
        H, W = im.shape[:2]
        # 칸 너비는 시트 높이와 칸 수로: 너비/칸수
        pre = PRE['sheets'][k]
        ow, oh, n = pre[4], pre[5], pre[6]
        assert W == ow * n and H == oh, (k, W, H, ow, oh, n)
        out = im.copy()
        rows = []
        for f in range(n):
            cell = im[:, f * ow:(f + 1) * ow]
            o, rep = process_cell(cell, info=True)
            out[:, f * ow:(f + 1) * ow] = o
            rows.append(rep)
        Image.fromarray(out).save(os.path.join(DST, fn), 'WEBP', quality=90, method=6)
        report[k] = rows
        if args.debug:
            os.makedirs(args.debug, exist_ok=True)
            def flat(x):
                bg = Image.new('RGBA', (x.shape[1], x.shape[0]), (110, 110, 110, 255))
                bg.alpha_composite(Image.fromarray(x))
                return bg.convert('RGB')
            pair = Image.new('RGB', (W, H * 2))
            pair.paste(flat(im), (0, 0))
            pair.paste(flat(out), (0, H))
            pair.save(os.path.join(args.debug, k + '.png'))
        done = [r for r in rows if r]
        print(k, 'frames', n, 'blade', len(done),
              'bend', round(float(np.mean([r['bend'] for r in done])) if done else 0, 2),
              '->', round(float(np.mean([r.get('bendAfter', 0) for r in done])) if done else 0, 2))
    rp = os.path.join(args.debug, 'report.json') if args.debug else os.path.join(ROOT, 'qa', 'r1116', 'straighten-report.json')
    os.makedirs(os.path.dirname(rp), exist_ok=True)
    with open(rp, 'w') as fp:
        json.dump(report, fp, ensure_ascii=False, indent=0)


def load_pre():
    js = open(os.path.join(ROOT, 'client-source', 'ego-ink-r1099.js'), encoding='utf-8').read()
    s = js.index('/*R1112-PRE*/') + len('/*R1112-PRE*/')
    e = js.index('/*R1112-PRE-END*/')
    return json.loads(js[s:e])


PRE = load_pre()
if __name__ == '__main__':
    main()
