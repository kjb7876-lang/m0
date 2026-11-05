#!/usr/bin/env python3
"""R351 슬레이어 새 이동·공격 모션 → 게임용 아틀라스 (사용자 2026-11-05
"슬레이어 신규자산 드라이브에 받아서 적용하는데 일단좌우이동및 공격신규모션은 적용하고 위아래모션은 일관성있는거 있으면 적용 없다면 좌우로만 나오게해줘").

원천(Drive, 읽기 전용 — 사용자 승인 후보, 요청서 CX-0028 'Slayer v22 walk v5 user-approved color-and-deploy'):
  Slayer_attack_v22_straight_sword.zip  sha256 d3dcaaa6… — attack-v22/review320/frame_01~06.png (320×256 RGBA, 명목 피벗 (160,226), 170/140/110/80/150/300ms), 왼쪽을 보는 그림
  Slayer_left-v5_candidate.zip          sha256 2cde0f5d… — left-v5/review320/frame_01~08.png (320×256 RGBA, 같은 피벗, 150ms×8), 왼쪽 걷기
  두 묶음 모두 왼쪽(W) 한 방향뿐이다. 위·아래 그림은 없다 → 게임은 좌·우만 쓴다(오른쪽 = 왼쪽 좌우 뒤집기).

다듬기(포즈·검·체격은 바꾸지 않는다. 색·크기·자르기만):
 1) 색감(요청서: "색감·명도·하이라이트 정도만 맞춰"): 프레임마다 밝기 p10/p50/p90/p98·채도·채널 평균 비를 재고,
    목표 = 걷기 8칸 + 공격 1~4·6칸 평균(밝은 공격 5칸은 목표에서 뺀다). 각 프레임을 그 목표로 조각 직선 밝기 곡선 + 채도 배율 + 흰 균형으로 맞춘다
    (R283 환도 색 맞추기 방식, 하이라이트 p98 점을 더함). 알파는 그대로.
 2) 몸 키: 클립마다 접지선(실루엣 바닥 중앙값) − 머리 꼭대기(발 띠 중심 ±40px 열, 중앙값)를 재서 180px 가 되게 한 번 등비 축소(premultiplied LANCZOS).
 3) 발 기준점: x = 원천 명목 피벗 160 × 배율, y = 같은 클립 접지선 중앙값.
 4) 가장자리: 알파<6 → 0, 알파 0 픽셀 RGB 0. 동작마다 모든 칸 합집합(+2px)으로 잘라 한 줄 아틀라스, WebP 무손실.
 5) 걷기 보폭: 발 띠 폭(칼끝 조각 제외) 최대−최소 = 한 걸음, 8칸 = 두 걸음 → px_per_frame. 대기 = 두 발이 모두 닿은 가장 좁은 칸(7번째).
 6) 공격 접촉 칸 = 4번째(80ms, 검이 가장 멀리 뻗는 칸). 게임은 판정 순간(누르는 순간)을 이 칸에 맞춘다.
index.json 에는 원천 파일 이름·sha256·크기·용도·적용 여부만 적는다(Drive 파일 ID 는 적지 않는다 — 공개 저장소).
사용: python3 -I scripts/r351-slayer-build.py <공격 zip> <공격 zip 푼 폴더> <걷기 zip> <걷기 zip 푼 폴더> <출력 r96/runtime-text/assets/r351/slayer>
"""
import sys, os, json, hashlib
import numpy as np
from PIL import Image

BODY = 180.0
PIVOT = (160, 226)
W = np.array([.299, .587, .114])
ATTACK_CONTACT = 3  # 0부터 센 칸(4번째)
IDLE_FRAME = 6  # 0부터 센 걷기 칸(7번째)


def sha_b(b):
    return hashlib.sha256(b).hexdigest()


def sha(p):
    return sha_b(open(p, 'rb').read())


def sums(path):
    out = {}
    for line in open(path, encoding='utf-8'):
        p = line.split()
        if len(p) == 2:
            out[p[1]] = p[0]
    return out


def load_frames(root, sub, n):
    listed = sums(os.path.join(root, sub, 'SHA256SUMS.txt'))
    frames, meta = [], []
    for i in range(1, n + 1):
        rel = f'review320/frame_{i:02d}.png'
        p = os.path.join(root, sub, rel)
        h = sha(p)
        assert listed.get(rel) == h, (p, 'SHA256SUMS 불일치')
        im = Image.open(p).convert('RGBA')
        assert im.size == (320, 256), (p, im.size)
        frames.append(np.array(im).astype(np.float64) / 255)
        meta.append(dict(name=f'{sub}/{rel}', sha256=h, bytes=os.path.getsize(p), size=list(im.size)))
    man = json.load(open(os.path.join(root, sub, 'review320', 'manifest.json')))
    return frames, meta, man


# ---------- 색 ----------
def measure_c(a):
    m = a[..., 3] > .8
    px = a[m][:, :3]
    lum = px @ W
    mx, mn = px.max(1), px.min(1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return dict(p10=float(np.percentile(lum, 10)), p50=float(np.percentile(lum, 50)), p90=float(np.percentile(lum, 90)),
                p98=float(np.percentile(lum, 98)), sat=float(sat.mean()), rgb=(px.mean(0) / px.mean()).tolist())


KEYS = ('p10', 'p50', 'p90', 'p98')


def curve(x, src, dst):
    xs = [src[k] for k in KEYS]
    ys = [dst[k] for k in KEYS]
    # 단조 보장
    for i in range(1, 4):
        xs[i] = max(xs[i], xs[i - 1] + 1e-4)
    lo = (ys[1] - ys[0]) / (xs[1] - xs[0])
    hi = (ys[3] - ys[2]) / (xs[3] - xs[2])
    y = np.interp(x, xs, ys)
    y = np.where(x < xs[0], ys[0] + (x - xs[0]) * lo, y)
    y = np.where(x > xs[3], ys[3] + (x - xs[3]) * hi, y)
    return y


def apply_c(a, src, tgt, k):
    rgb = a[..., :3]
    lum = rgb @ W
    nl = np.clip(curve(lum, src, tgt), 0, 1)
    chroma = (rgb - lum[..., None]) * k
    wb = np.array(tgt['rgb']) / np.array(src['rgb'])
    out = a.copy()
    out[..., :3] = np.clip((nl[..., None] + chroma) * wb, 0, 1)
    return out


def fix_c(a, tgt):
    src = measure_c(a)
    k = tgt['sat'] / max(src['sat'], 1e-6)
    for _ in range(6):
        got = measure_c(apply_c(a, src, tgt, k))['sat']
        k *= tgt['sat'] / max(got, 1e-6)
    return apply_c(a, src, tgt, k), src


# ---------- 모양 ----------
def measure_s(cells):
    bots, tops, cxs, spans = [], [], [], []
    for im in cells:
        a = im[..., 3] >= 16 / 255
        ys, xs = np.nonzero(a)
        bot = int(ys.max())
        band = a[max(0, bot - 10):bot + 1].copy()
        # 걷기는 칼끝이 발 높이까지 내려온다 → 줄마다 폭 8px 미만 조각(칼끝)은 발 띠에서 뺀다
        for row in band:
            xs_ = np.nonzero(row)[0]
            if len(xs_):
                cuts = np.split(xs_, np.nonzero(np.diff(xs_) > 1)[0] + 1)
                for run in cuts:
                    if len(run) < 8:
                        row[run] = False
        if not band.any():
            band = a[max(0, bot - 10):bot + 1]
        bx = np.nonzero(band.any(0))[0]
        cx = float(np.median(np.nonzero(band)[1]))
        c = int(cx)
        col = a[:, max(0, c - 40):c + 40]
        ty = np.nonzero(col.any(1))[0]
        bots.append(bot); tops.append(int(ty.min())); cxs.append(cx); spans.append(int(bx.max() - bx.min()))
    return np.array(bots), np.array(tops), np.array(cxs), np.array(spans)


def resize(a, s):
    h, w = a.shape[:2]
    nw, nh = round(w * s), round(h * s)
    im = Image.fromarray((a * 255 + .5).astype(np.uint8), 'RGBA').convert('RGBa').resize((nw, nh), Image.LANCZOS).convert('RGBA')
    r = np.array(im)
    r[r[..., 3] < 6] = 0
    return r


def main(atk_zip, atk_dir, walk_zip, walk_dir, out):
    os.makedirs(out, exist_ok=True)
    atk, atk_meta, atk_man = load_frames(atk_dir, 'attack-v22', 6)
    walk, walk_meta, walk_man = load_frames(walk_dir, 'left-v5', 8)
    assert atk_man['timing_ms'] == [170, 140, 110, 80, 150, 300]
    assert walk_man['timing_ms'] == [150] * 8
    # 1) 색
    refs = [measure_c(f) for f in walk] + [measure_c(f) for i, f in enumerate(atk) if i != 4]
    tgt = {k: float(np.mean([r[k] for r in refs])) for k in KEYS + ('sat',)}
    tgt['rgb'] = np.mean([r['rgb'] for r in refs], 0).tolist()
    color = {'target': tgt, 'frames': {}}
    clips = {'walk': walk, 'attack': atk}
    fixed = {}
    for name, frames in clips.items():
        fixed[name] = []
        for i, f in enumerate(frames):
            g, before = fix_c(f, tgt)
            after = measure_c(g)
            fixed[name].append(g)
            color['frames'][f'{name}-{i + 1}'] = {'before': {k: round(before[k], 4) for k in KEYS + ('sat',)},
                                                 'after': {k: round(after[k], 4) for k in KEYS + ('sat',)}}
    idx = {'revision': 'R351-slayer-1', 'body': BODY, 'facing_in_source': 'w',
           'directions': '좌·우만(원천이 왼쪽 한 방향뿐: 오른쪽 = 좌우 뒤집기). 위·아래 이동·공격은 가로 성분/마지막 좌·우로 그린다.',
           'source': [], 'anims': {}, 'color': color, 'notes': [
               '원천은 사용자 승인 후보(요청서: 색감만 맞춰 적용). 포즈·검 형태·체격은 그대로이고 색·등비 크기·자르기만 바꿨다.',
               '공격 v22 5칸의 밝은 날·가드·갑옷 하이라이트를 다른 칸 평균(p98)에 맞췄다.',
               '피격·죽음·기술 전용 새 그림은 원천에 없다 — 피격은 새 대기 자세, 기술·대시는 새 공격/걷기 칸으로 그린다(옛 그림을 섞지 않는다).']}
    for zp, sub, meta, clip in ((atk_zip, 'attack-v22', atk_meta, 'attack'), (walk_zip, 'left-v5', walk_meta, 'walk')):
        idx['source'].append(dict(file=os.path.basename(zp), sha256=sha(zp), bytes=os.path.getsize(zp), frames=meta,
                                  purpose=f'슬레이어 {clip} 왼쪽(320×256, 피벗 160,226)', applied=True,
                                  status_in_source='candidate(사용자 2026-11-05 승인, 색감만 맞춰 적용 요청)'))
    for name, frames in fixed.items():
        bots, tops, cxs, spans = measure_s([f.astype(np.float64) / 1 for f in frames])
        body0 = float(np.median(bots - tops))
        s = BODY / body0
        sc = [resize(f, s) for f in frames]
        b2, t2, c2, sp2 = measure_s([x.astype(np.float64) / 255 for x in sc])
        nh, nw = sc[0].shape[:2]
        box = None
        for x in sc:
            ys, xs = np.nonzero(x[..., 3])
            bb = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
            box = bb if box is None else (min(box[0], bb[0]), min(box[1], bb[1]), max(box[2], bb[2]), max(box[3], bb[3]))
        box = (max(0, int(box[0]) - 2), max(0, int(box[1]) - 2), min(nw, int(box[2]) + 2), min(nh, int(box[3]) + 2))
        cw, ch = box[2] - box[0], box[3] - box[1]
        n = len(sc)
        A = Image.new('RGBA', (n * cw, ch), (0, 0, 0, 0))
        for i, x in enumerate(sc):
            A.paste(Image.fromarray(x, 'RGBA').crop(box), (i * cw, 0))
        key = f'{name}-w'
        p = os.path.join(out, key + '.webp')
        A.save(p, 'WEBP', lossless=True, method=6)
        b = open(p, 'rb').read()
        ms = atk_man['timing_ms'] if name == 'attack' else walk_man['timing_ms']
        rec = dict(file=key + '.webp', n=n, cols=n, cell=[cw, ch], atlas=list(A.size), ms=ms,
                   anchor=[round(PIVOT[0] * s - box[0], 1), float(np.median(b2)) - box[1]], body=round(float(np.median(b2 - t2)), 1),
                   loop=name == 'walk', bytes=len(b), sha256=sha_b(b),
                   measured=dict(src_body_px=body0, scale=round(s, 4), src_foot_px=[int(bots.min()), int(np.median(bots)), int(bots.max())],
                                 foot_jitter_px=round(float(b2.max() - b2.min()), 1), body_px=[int((b2 - t2).min()), int((b2 - t2).max())],
                                 foot_span_px=[int(v) for v in sp2]))
        if name == 'walk':
            step = float(sp2.max() - sp2.min())
            rec['stride'] = dict(step_px=round(step, 1), px_per_frame=round(2 * step / n, 2), note='발 띠 폭 최대−최소 = 한 걸음, 8칸 = 두 걸음')
            # 대기 = 7번째 칸(0부터 6): 발 띠가 가장 좁은 칸들(3·7번, 각 33px) 중 두 발이 모두 바닥에 닿은 칸(눈으로 확인 —
            # 3번은 뒷발 뒤꿈치가, 6번은 뒷발이 들려 있다). R283 환도 '두 발이 모인 선 자세' 방식.
            rec['idle_frame'] = IDLE_FRAME
        else:
            rec['contact'] = ATTACK_CONTACT
        idx['anims'][name] = {'w': rec}
        print(key, rec['measured'], 'anchor', rec['anchor'], 'cell', rec['cell'], 'bytes', len(b))
    json.dump(idx, open(os.path.join(out, 'index.json'), 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main(*sys.argv[1:6])
