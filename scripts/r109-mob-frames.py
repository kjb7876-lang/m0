#!/usr/bin/env python3
"""R109 잡몹 교차 동작: Drive 2026-10-27 잡몹 이동/날갯짓/호버 4키 후보(M002·M003·M007·M008·M019) -> R92 형식 가로 스트립.
원본 PNG는 ZIP 안에 그대로 두고, 가이드의 셀 사각형으로 자른 뒤 몸통 템플릿 상호상관으로 네 키를 같은 자리에 맞춥니다
(키마다 늘리거나 줄이지 않고 한 배율만 씀). 발밑(알파 하단 중앙값)을 피벗으로, 가시 높이 중앙값을 150px로 맞춥니다(R92 규약).
Usage: python3 -I scripts/r109-mob-frames.py <unzipped-root containing M002/ M003/ ...> r96/runtime-text/assets/r109/mobs
"""
import sys, json, hashlib
from pathlib import Path
import numpy as np
from PIL import Image
src, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
FIX = [(0, 0, 627, 627), (627, 0, 627, 627), (0, 627, 627, 627), (627, 627, 627, 627)]
# group, png, sourceRects(x,y,w,h), core template (fractions of K1 bbox: x0,x1,y0,y1), kind, Drive ZIP id / sha
GROUPS = [
 ('M002', 'M002/assets/storyworld-M002-spider-move4-v1.png', [(0, 0, 641, 627), (642, 0, 612, 627), (0, 627, 641, 627), (642, 627, 612, 627)], (.25, .75, .0, .55), 'walk',
  '1GLrbTk7hDH_Hdb798p2aVXyzaSoAehhO', 'e228a01476befa1269cc678affbc18175ac33aa6ce498d6ad49bafdbcc29afb0', '망각의 거미 계열 · 8다리 보행 4키'),
 ('M003', 'M003/assets/M003-move4-v1-raw.png', FIX, (.2, .8, .0, .6), 'walk',
  '1rcN4claKUkumE-lA3ENJBT5Dq9JtKvZI', 'd6261f05b748d0175d4bc2d01acb59c4b8f166adccd8f833e239b2fa2c1e0ed4', '수렁/검은기둥 주문사 · 걷기 4키'),
 ('M007', 'M007/assets/M007-wingbeat4-v1-raw.png', [(0, 0, 651, 654), (651, 0, 603, 654), (0, 654, 765, 600), (765, 654, 489, 600)], (.33, .67, .2, .8), 'fly',
  '1SPNxbo45gjE70ssKcgNu1G7wBilB1IHc', '4a19bd920b9c0800f26eb486eaf0b0f1d53ef3adb668a85825e013dff7ab47f0', '검은기둥 가고일 수호자 · 날갯짓 4키'),
 ('M008', 'M008/assets/M008-move-2x2.png', FIX, (.2, .8, .0, .6), 'walk',
  '1Phl1xW8SfNgoxDMKTKxKDf6zgBsoJ7_V', '02032f227430eff1e79a373151f7859d84aebfcdf2eac799cd2d65e35b2832f3', '뿔 달린 늪 악마 계열 · 걷기 4키'),
 ('M019', 'M019/assets/storyworld-M019-brain-device-hover4-v1.png', FIX, (.3, .7, .25, .75), 'hover',
  '1PN_rwxrv97r6VdeUQyG1PUjttojX9mGm', '1c09afcefc4ce3b7fe25195091d8acedbf6abf16ecf69eceae2b44e5deff82a4', '검은 실의 외부 신호(뇌 장치) · 호버 4키'),
 # R110 (Drive 2026-10-27 저녁): M137 이동 4키, M119 대기 4키, R105 종이 형상(Drive 대체 그림) 이동 4키
 ('M137', 'M137/assets/M137-move-v1-2x2.png', FIX, (.25, .75, .0, .55), 'walk',
  '158J1_OEhHfLjNkl60VjLg7W3Npdi-mEv', 'ad466a26808bdb5f70e8d9f50f5596bb48c65d73819eee5d0b97a71c9bb9a6c6', '막힌 이름들(기계팔 사이보그) · 걷기 4키'),
 ('M119', 'M119/assets/M119-idle4-raw.png', FIX, (.25, .75, .0, .55), 'idle',
  '1bNoi71UAZiANsEWUkKgWeAOTZvZZzHGR', 'f453432693d5d107dde007c305cf94e4cfaf568d73bafa4cf42e8fd8bc63c394', '무명 검흔(향로 든 형상) · 대기 4키(로브라 서 있을 때·이동 때 모두 사용)'),
 ('PAPER', 'PAPER/assets/R109-paper-figure-move4-candidate.png', FIX, (.2, .8, .0, .5), 'walk',
  '1LTZFo_SW8LwW6iXG_Y9n5zFgLTh5Aup_', 'e77f9b0b29685818a5b1d24b1c69f23bb6fb996ffa526452ee92a3ca8c982b2f', 'RF 종이 형상(R105 Drive 대체 그림) · 걷기 4키'),
]
TARGET_H, PAD = 150, 3
# 감사 스냅샷(StoryWorld-monster-action-audit-snapshot-20261027, MONSTER-AUDIT.json)의 그룹별 등록 ID
IDS = {'M002': ['dist01-sp1', 'dist01-sp2', 'dist02-sp1', 'dist03-sp1'], 'M003': ['dist02-m1', 'dist05-m1', 'dist06-m1'],
       'M007': ['dist05-c1'], 'M008': ['dist05-h1', 'dist06-h1', 'a10-h1'], 'M019': ['b01-c1'],
       'M137': ['c104-e1'], 'M119': ['h102-t1'], 'PAPER': []}
# Drive 대체 그림(art-drive-r105)으로 그려지는 몹은 ID 대신 그 그림 경로로 연결한다.
ART = {'PAPER': 'assets/r105/drive/mob-paper-figure.webp'}
TRACK = {'M119': 'idle'}

def bbox(a, t=16):
    ys, xs = np.nonzero(a >= t)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

def ncc_shift(ref, tpl_box, img, rng, step):
    """Find (dx,dy) so that img shifted by (dx,dy) best matches ref inside tpl_box (alpha*luma features)."""
    x0, y0, x1, y1 = tpl_box
    T = ref[y0:y1, x0:x1]; T = T - T.mean(); tn = np.sqrt((T * T).sum()) + 1e-6
    best = (-2, 0, 0)
    for dy in range(-rng, rng + 1, step):
        for dx in range(-rng, rng + 1, step):
            sy0, sx0 = y0 - dy, x0 - dx
            if sy0 < 0 or sx0 < 0 or sy0 + (y1 - y0) > img.shape[0] or sx0 + (x1 - x0) > img.shape[1]: continue
            P = img[sy0:sy0 + (y1 - y0), sx0:sx0 + (x1 - x0)]; P = P - P.mean()
            v = (T * P).sum() / (tn * (np.sqrt((P * P).sum()) + 1e-6))
            if v > best[0]: best = (v, dx, dy)
    return best

def ncc_at(R, B, I, dx, dy):
    T = R[B[1]:B[3], B[0]:B[2]]; P = I[B[1] - dy:B[3] - dy, B[0] - dx:B[2] - dx]
    T = T - T.mean(); P = P - P.mean()
    return float((T * P).sum() / (np.sqrt((T * T).sum()) * np.sqrt((P * P).sum()) + 1e-6))

def refine(R, B, I, cx, cy, r):
    return max(((ncc_at(R, B, I, cx + ex, cy + ey), cx + ex, cy + ey) for ey in range(-r, r + 1) for ex in range(-r, r + 1)), key=lambda t: t[0])

rows = []
for gid, png, rects, core, kind, zid, zsha, use in GROUPS:
    raw = (src / png).read_bytes(); im = Image.open(src / png).convert('RGBA')
    keys = [np.asarray(im.crop((x, y, x + w, y + h))).astype(np.float32) for x, y, w, h in rects]
    S = 1000  # common padded canvas, each key centred on its own cell centre first
    canv = []
    for k in keys:
        c = np.zeros((S, S, 4), np.float32); h, w = k.shape[:2]; oy, ox = (S - h) // 2, (S - w) // 2
        c[oy:oy + h, ox:ox + w] = k; canv.append(c)
    feat = [c[..., 3] / 255 * (c[..., :3].mean(-1) / 255 * .7 + .3) for c in canv]
    bx0, by0, bx1, by1 = bbox(canv[0][..., 3])
    tb = (int(bx0 + (bx1 - bx0) * core[0]), int(by0 + (by1 - by0) * core[2]), int(bx0 + (bx1 - bx0) * core[1]), int(by0 + (by1 - by0) * core[3]))
    shifts = [(0, 0, 1.0)]
    ds = 4; small = [f[::ds, ::ds] for f in feat]; stb = tuple(v // ds for v in tb)
    for f, fs in zip(feat[1:], small[1:]):
        v, dx, dy = ncc_shift(small[0], stb, fs, 30, 1)
        v, dx, dy = refine(feat[0], tb, f, dx * ds, dy * ds, ds)
        shifts.append((dx, dy, v))
    al = []
    for c, (dx, dy, _) in zip(canv, shifts):
        al.append(np.roll(np.roll(c, dy, 0), dx, 1))
    # walkers: keep the feet on one ground line (median of per-key bottoms after body registration)
    bottoms = [bbox(a[..., 3])[3] for a in al]
    if kind == 'walk':
        g = int(np.median(bottoms)); al = [np.roll(a, max(-14, min(14, g - b)), 0) for a, b in zip(al, bottoms)]
    boxes = [bbox(a[..., 3]) for a in al]
    ux0, uy0 = min(b[0] for b in boxes) - PAD, min(b[1] for b in boxes) - PAD
    ux1, uy1 = max(b[2] for b in boxes) + PAD, max(b[3] for b in boxes) + PAD
    vis = float(np.median([b[3] - b[1] for b in boxes])); sc = TARGET_H / vis
    cw, ch = round((ux1 - ux0) * sc), round((uy1 - uy0) * sc)
    strip = Image.new('RGBA', (cw * 4, ch), (0, 0, 0, 0))
    for i, a in enumerate(al):
        cell = a[uy0:uy1, ux0:ux1]
        pm = cell.copy(); pm[..., :3] *= pm[..., 3:4] / 255  # premultiplied resample
        r = np.asarray(Image.fromarray(pm.clip(0, 255).astype(np.uint8), 'RGBA').resize((cw, ch), Image.BOX if sc < .5 else Image.LANCZOS)).astype(np.float32)
        aa = r[..., 3:4]; rgb = np.where(aa > 0, r[..., :3] * 255 / np.maximum(aa, 1), 0)
        strip.paste(Image.fromarray(np.concatenate([rgb, aa], -1).clip(0, 255).astype(np.uint8), 'RGBA'), (i * cw, 0))
    ground = float(np.median([b[3] for b in boxes]))
    a0 = al[0][..., 3]; core_cx = float((np.nonzero(a0[tb[1]:tb[3], tb[0]:tb[2]] >= 16)[1].mean()) + tb[0])
    pivot = [round(float((core_cx - ux0) * sc), 2), round(float((ground - uy0) * sc), 2)]
    name = f'{gid}-{TRACK.get(gid, "move")}.png'; p = out / name; strip.save(p, optimize=True); b = p.read_bytes()
    rows.append({'group': gid, 'ids': IDS[gid], **({'art': ART[gid]} if gid in ART else {}), 'track': TRACK.get(gid, 'move'), 'kind': kind, 'path': 'assets/r109/mobs/' + name, 'frames': 4, 'cell': [cw, ch], 'pivot': pivot,
                 'visibleHeight': TARGET_H, 'bytes': len(b), 'sha256': sha(b), 'use': use,
                 'registration': [{'dx': int(dx), 'dy': int(dy), 'ncc': round(float(v), 3)} for dx, dy, v in shifts], 'groundSpreadPx': int(max(bottoms) - min(bottoms)),
                 'source': {'driveZipId': zid, 'zipSha256': zsha, 'png': png.split('/', 1)[1], 'pngSha256': sha(raw), 'sourceRects': rects}})
    print(gid, kind, 'cell', cw, ch, 'pivot', pivot, 'reg', [(r[0], r[1], round(r[2], 3)) for r in shifts], 'bytes', len(b))
(out / 'index.json').write_text(json.dumps({'schema': 'storyworld.r109.mobs/v1', 'note': 'Drive 2026-10-27 조건부 4키 후보, 원본 보존·가공 사본. 완성 루프 승인 아님.', 'tracks': rows}, ensure_ascii=False, indent=1))
