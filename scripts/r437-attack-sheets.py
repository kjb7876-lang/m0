#!/usr/bin/env python3
"""R437 네온·라우렌 새 좌측 기본 공격 6칸 → 게임 공격 시트(R143 'e' 자리, 왼쪽은 게임이 반전)

사용자 2026-11-09 "네온 라우렌 신규공격모션 개선해서 적용해주고" — 원천(읽기 전용, 비공개 드라이브):
  네온   Neon-attack-W-6frames-review-20261109.zip       frames/neon-attack-w-00..05.png (512×512, 왼쪽을 봄)
  라우렌 Lauren-left-attack-6pose-RAW-for-Claude-20261109.zip frames/frame-0..5.png       (512×512, 왼쪽을 봄)
원천은 규격 미달(512 칸·몸 약 400px·알파 1~15 잔티·발 자리 흔들림)이라 그림 모양은 그대로 두고 아래만 고친다:
 1) 가장자리: 알파 ≤15 → 0(잔티), 알파 0 의 숨은 RGB 는 0.
 2) 뒷발 고정: 왼쪽을 보는 그림의 뒷발(바닥 띠의 가장 오른쪽 덩어리) 중심 x·바닥 y 를 0번 칸에 맞춰 칸마다 옮긴다(발 미끄러짐 제거).
 3) 몸 키: R143 과 같은 기준(머리 꼭대기 → 발바닥) 180px 가 되게 6칸 모두 같은 배율로 줄인다(premultiplied LANCZOS).
    머리 꼭대기는 창이 머리 위로 서지 않은 칸들의 맨 윗점 중앙값(라우렌 0·5번 칸은 창이 위로 서 있어 뺀다).
 4) 영웅 발밑점: 0번 칸 두 발 중심의 가운데(넓게 벌린 자세에서 몸 무게 중심). 칸 높이 256, 발바닥 y=226(R143 그대로).
    찌르는 창이 192 칸을 넘어서 칸 너비는 6칸 합집합으로 넓힌다(좌우 4px 여백) → index.json cell·foot 에 적는다.
 5) 색: 지금 게임의 같은 영웅 R143 오른쪽 공격 시트의 밝기 분포(p10·p50·p90)에 한 번의 곡선으로 맞춘다(색상은 그대로).
 6) 오른쪽(e) 시트 = 좌우 반전. 게임의 왼쪽(w)은 R143 이 e 를 다시 반전해 원래 왼쪽 그림이 된다.
 7) 창끝: 칸마다 몸 가슴에서 가장 먼 끝점(가장 왼쪽 점과 가장 위 점 중 먼 쪽, 반전 뒤 좌표)을 tip 으로 적는다 → R425 창끝 기운이 머리에 붙지 않게.
사용: python3 -I scripts/r437-attack-sheets.py <neon 프레임 폴더> <neon zip> <lauren 프레임 폴더> <lauren zip>
"""
import sys, os, json, hashlib
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, '..', 'r96', 'runtime-text', 'assets')
BODY, FOOT_Y, CH = 180.0, 226, 256
sha = lambda b: hashlib.sha256(b).hexdigest()

def clean(im):
    a = np.array(im.convert('RGBA'))
    a[a[..., 3] <= 15] = 0
    return Image.fromarray(a, 'RGBA')

def feet(a):
    """바닥 띠(맨 아래 불투명 줄에서 14px)의 덩어리들 → [(중심 x, 바닥 y)…] 왼쪽부터."""
    al = a[..., 3] > 128
    ys = np.where(al.any(1))[0]; bot = ys.max()
    band = al[bot - 14:bot + 1].any(0)
    xs = np.where(band)[0]
    runs, s = [], xs[0]
    for p, q in zip(xs, xs[1:]):
        if q - p > 6: runs.append((s, p)); s = q
    runs.append((s, xs[-1]))
    runs = [r for r in runs if r[1] - r[0] >= 6]
    out = []
    for x0, x1 in runs:
        col = al[:, x0:x1 + 1]; yb = np.where(col.any(1))[0].max()
        out.append(((x0 + x1) / 2, float(yb)))
    return out

def lum(a):
    m = a[..., 3] > 128
    rgb = a[..., :3][m].astype(float)
    return rgb @ np.array([.299, .587, .114])

def tone(a, ref):
    """밝기 p10/p50/p90 을 ref 에 맞추는 단조 곡선(구간 선형) — 채널에 같은 배율로 적용해 색상 유지."""
    src = np.percentile(lum(a), [1, 10, 50, 90, 99]); dst = np.percentile(ref, [1, 10, 50, 90, 99])
    dst = np.maximum.accumulate(dst)
    L = a[..., :3].astype(float) @ np.array([.299, .587, .114])
    L2 = np.interp(L, src, dst, left=None, right=None)
    k = np.where(L > 1, L2 / np.maximum(L, 1), 1.0)[..., None]
    out = a.copy().astype(float); out[..., :3] = np.clip(a[..., :3] * k, 0, 255)
    return out.astype(np.uint8), [float(v) for v in src], [float(v) for v in dst]

def build(hero, files, zp, spear_up):
    cells = [clean(Image.open(f)) for f in files]
    arr = [np.array(c) for c in cells]
    fts = [feet(a) for a in arr]
    rear = [f[-1] for f in fts]  # 왼쪽을 봄 → 오른쪽 발이 뒷발
    # 2) 뒷발 고정: 0번 칸 기준으로 옮김
    shifted = []
    for c, r in zip(cells, rear):
        dx, dy = round(rear[0][0] - r[0]), round(rear[0][1] - r[1])
        canvas = Image.new('RGBA', (c.width + 200, c.height + 200), (0, 0, 0, 0))
        canvas.alpha_composite(c, (100 + dx, 100 + dy)); shifted.append(canvas)
    sa = [np.array(c) for c in shifted]
    bot = rear[0][1] + 100
    tops = [float(np.where((a[..., 3] > 128).any(1))[0].min()) for i, a in enumerate(sa) if i not in spear_up]
    head = float(np.median(tops)); body0 = bot - head; s = BODY / body0
    f0 = feet(sa[0]); px = (f0[0][0] + f0[-1][0]) / 2  # 0번 칸 두 발 가운데
    W, H = shifted[0].size; nw, nh = round(W * s), round(H * s)
    small = [clean(c.convert('RGBa').resize((nw, nh), Image.LANCZOS).convert('RGBA')) for c in shifted]
    pxs, bots = px * s, bot * s
    box = None
    for c in small:
        bb = c.getbbox(); box = bb if box is None else (min(box[0], bb[0]), min(box[1], bb[1]), max(box[2], bb[2]), max(box[3], bb[3]))
    left, right = pxs - box[0] + 4, box[2] - pxs + 4
    cw = int(np.ceil(left + right)); cw += cw % 2
    fx_left = int(round(left))  # 왼쪽을 보는 칸의 발 x
    top_y = FOOT_Y - bots  # 줄인 그림 y → 칸 y
    assert box[1] + top_y >= 0, (hero, 'top clipped', box[1] + top_y)
    # 5) 색 기준: 지금 게임 R143 e 시트
    ref = lum(np.array(Image.open(os.path.join(A, 'r143', 'attack', hero, 'attack-e.webp')).convert('RGBA')))
    sheetL = Image.new('RGBA', (cw * 6, CH), (0, 0, 0, 0))
    for i, c in enumerate(small):
        sheetL.alpha_composite(c, (i * cw + int(round(fx_left - pxs)), int(round(top_y))))
    la = np.array(sheetL); la, srcp, dstp = tone(la, ref)
    sheetL = Image.fromarray(la, 'RGBA')
    # 6) 오른쪽 시트 = 칸마다 좌우 반전
    sheetE = Image.new('RGBA', sheetL.size, (0, 0, 0, 0))
    for i in range(6):
        sheetE.alpha_composite(sheetL.crop((i * cw, 0, (i + 1) * cw, CH)).transpose(Image.FLIP_LEFT_RIGHT), (i * cw, 0))
    fx = cw - fx_left
    # 7) 창끝(오른쪽 시트 좌표): 가슴(발 위 0.65 몸)에서 가장 먼 끝점 — 가장 오른쪽 점과 가장 위 점 중
    ea = np.array(sheetE); tips, feet_out = [], []
    for i in range(6):
        a = ea[:, i * cw:(i + 1) * cw, 3] > 128
        ys, xs = np.where(a)
        chest = (fx, FOOT_Y - .65 * BODY)
        r = (xs.max(), ys[xs == xs.max()].mean()); t = (xs[ys == ys.min()].mean(), ys.min())
        d = lambda p: (p[0] - chest[0]) ** 2 + (p[1] - chest[1]) ** 2
        tip = r if d(r) >= d(t) else t
        tips.append([round(float(tip[0]), 1), round(float(tip[1]), 1)])
        ff = feet(ea[:, i * cw:(i + 1) * cw])
        feet_out.append({'front': [round(ff[-1][0], 1), ff[-1][1]], 'rear': [round(ff[0][0], 1), ff[0][1]]})
    out = os.path.join(A, 'r437', 'attack', hero); os.makedirs(out, exist_ok=True)
    p = os.path.join(out, 'attack-e.webp'); sheetE.save(p, 'WEBP', lossless=True, method=6)
    b = open(p, 'rb').read()
    meas_body = []
    for i in range(6):
        if i in spear_up: continue
        a = ea[:, i * cw:(i + 1) * cw, 3] > 128; meas_body.append(FOOT_Y - int(np.where(a.any(1))[0].min()))
    rear_x = [f['rear'][0] for f in feet_out]
    idx = {'hero': hero, 'action': 'attack', 'revision': 'R437', 'order': '예비 2 · 타격 2 · 회수 2',
           'applied': 'R143 기본 공격(멈춰 서서) 오른쪽 자리 — 왼쪽은 게임이 반전(원천은 왼쪽을 봄)',
           'directions': {'e': {'path': 'assets/r437/attack/%s/attack-e.webp' % hero, 'frames': 6, 'cell': [cw, CH], 'foot': [fx, FOOT_Y],
                                'body': BODY, 'tips': tips, 'feet': feet_out, 'sha256': sha(b), 'bytes': len(b)}},
           'measured': {'body_px_non_spear_up_frames': meas_body, 'rear_foot_x_jitter_px': round(max(rear_x) - min(rear_x), 1), 'scale': round(s, 4),
                        'tone_src_p1_10_50_90_99': [round(v, 1) for v in srcp], 'tone_dst': [round(v, 1) for v in dstp]},
           'source': {'zip': os.path.basename(zp), 'zip_sha256': sha(open(zp, 'rb').read()),
                      'frames_png_sha256': [sha(open(f, 'rb').read()) for f in files], 'note': '원천은 사용자 비공개 드라이브. 그림 모양은 그대로, 크기·발 자리·잔티·밝기만 보정'}}
    json.dump(idx, open(os.path.join(out, 'index.json'), 'w'), ensure_ascii=False, indent=1)
    print(hero, 'cell', cw, 'foot', fx, 'scale', round(s, 4), 'body', meas_body, 'rear jitter', idx['measured']['rear_foot_x_jitter_px'], 'bytes', len(b))
    return sheetE

if __name__ == '__main__':
    nd, nz, ld, lz = sys.argv[1:5]
    build('neon', [os.path.join(nd, 'neon-attack-w-%02d.png' % i) for i in range(6)], nz, set())
    build('lauren', [os.path.join(ld, 'frame-%d.png' % i) for i in range(6)], lz, {0, 5})
