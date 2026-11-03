#!/usr/bin/env python3
"""R242 환도 선택 자산 → 게임용 아틀라스 (사용자 2026-11-03 "환도 최신 자산을 받아 디테일을 개선한 뒤 적용").

원천(읽기 전용, Drive 'Hwando-Claude-Selected-Download-Index-v1' 의 10팩, SHA-256 은 index.json 에 기록):
  걷기 Hwando-Walk8-ShortHilt-Assets-v1 (N/S/E 8키 256×256, W=E 미러)
  대기·피격 N/S/E-rest, 전투 준비 N-ready·E-combat(ready), 공격 N-attack(24)·S-attack·E-combat(attack).
  W-rest·W-combat 은 원천에서도 'E 표시 미러'라 게임에서 E 를 뒤집어 그린다(같은 그림을 두 번 올리지 않음).

하는 일(그림 픽셀은 바꾸지 않는다 — 자르기·정렬·전환 칸만):
 1) 동작마다 모든 칸의 합집합 경계로 한 번만 잘라(칸마다 다른 크롭·재중앙화 없음) 빈 여백을 덜어 메모리를 줄인다.
 2) 아틀라스는 한 줄 최대 4096px(모바일 텍스처 한도)로 줄 바꿈, WebP(무손실 알파)로 저장.
 3) 발 기준점: 동작 안 모든 칸 실루엣 바닥의 중앙값(접지선)과 몸 중심 x(몸 띠 중앙값)를 잰다 → 게임은 이 점을 영웅 발 위치에 놓는다.
    몸 키(접지선−머리 꼭대기 중앙값)도 재서 모든 동작을 걷기와 같은 키로 맞춘다(비율 유지).
 4) 대기 ↔ 전투 준비(N·E) 연결: 원천에 연결이 없다(README '미연결'). 두 동작의 모든 칸 쌍 차이를 재서 가장 가까운 쌍을 고르고,
    그 둘 사이를 발 기준점에 맞춰 3장(25/50/75%) 섞은 전환 칸을 만든다(복제 아님, 새 중간 칸). 게임은 전환 때 이 3장을 120ms 씩 거친다.
 5) 걷기 보폭: E(옆모습) 두 발 디딤 칸(1·5)의 두 발 중심 간격 = 한 걸음 → 8칸 = 두 걸음. px/칸 을 index 에 남겨 게임이 이동 거리로 칸을 넘기게 한다(미끄러짐 방지).
사용: python3 scripts/r242-hwando-build.py <풀어 둔 dl-hwando-r242/x 폴더> <출력 assets/r242/hwando>
"""
import sys, os, json, hashlib
import numpy as np
from PIL import Image

MAXW = 4096


def sil(im):
    return np.array(im)[..., 3] > 40


def load_pack(x, name):
    import glob
    d = glob.glob(os.path.join(x, '*', 'hwando-selected-v1', name))[0]
    return d, json.load(open(os.path.join(d, 'animations.json')))


def frames_from(d, anim):
    out = []
    for f in anim['frames']:
        out.append(Image.open(os.path.join(d, f['png'])).convert('RGBA'))
    return out


def measure(frames):
    bots, tops, cxs = [], [], []
    for im in frames:
        a = sil(im)
        ys, xs = np.nonzero(a)
        if not len(ys):
            continue
        bot = ys.max()
        bots.append(bot)
        # 몸 중심: 접지선 위 40~140px 띠(검 끝이 덜 섞이는 몸통·다리)
        band = a[max(0, bot - 140):max(1, bot - 40)]
        bx = np.nonzero(band)[1]
        cxs.append(float(np.median(bx)) if len(bx) else float(np.median(xs)))
        # 머리 꼭대기: 몸 중심 ±50px 열에서 가장 위
        c = int(np.median(bx)) if len(bx) else int(np.median(xs))
        col = a[:, max(0, c - 50):c + 50]
        ty = np.nonzero(col.any(1))[0]
        tops.append(int(ty.min()) if len(ty) else int(ys.min()))
    g = int(np.median(bots))
    return dict(ground=g, cx=float(np.median(cxs)), body=int(g - np.median(tops)))


def crop_union(frames):
    box = None
    for im in frames:
        b = im.getbbox()
        if not b:
            continue
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    box = (max(0, box[0] - 2), max(0, box[1] - 2), box[2] + 2, box[3] + 2)
    return box, [im.crop(box) for im in frames]


def atlas(cells):
    w, h = cells[0].size
    cols = max(1, min(len(cells), MAXW // w))
    rows = (len(cells) + cols - 1) // cols
    A = Image.new('RGBA', (cols * w, rows * h), (0, 0, 0, 0))
    for i, c in enumerate(cells):
        A.alpha_composite(c, ((i % cols) * w, (i // cols) * h))
    return A, cols


def save(A, path):
    A.save(path, 'WEBP', lossless=True, method=6)
    b = open(path, 'rb').read()
    return dict(bytes=len(b), sha256=hashlib.sha256(b).hexdigest())


def build_anim(frames, ms, out, key, extra=None):
    m = measure(frames)
    box, cells = crop_union(frames)
    A, cols = atlas(cells)
    fname = key + '.webp'
    info = save(A, os.path.join(out, fname))
    rec = dict(file=fname, cols=cols, n=len(cells), cell=list(cells[0].size), ms=ms,
               anchor=[round(m['cx'] - box[0], 1), m['ground'] - box[1]], body=m['body'], crop=list(box), atlas=list(A.size), **info)
    if extra:
        rec.update(extra)
    return rec


def place_on(im, anchor, size, at):
    """그림을 발 기준점이 at 에 오도록 size 캔버스에 놓는다."""
    c = Image.new('RGBA', size, (0, 0, 0, 0))
    c.alpha_composite(im, (int(round(at[0] - anchor[0])), int(round(at[1] - anchor[1]))))
    return c


def transition(idle, ms_i, ready, ms_r, out, key):
    """대기 ↔ 준비: 가장 가까운 칸 쌍을 찾아 3장 섞은 전환 칸."""
    mi, mr = measure(idle), measure(ready)
    S = (420, 360)
    at = (210, 330)
    I = [place_on(f, (mi['cx'], mi['ground']), S, at) for f in idle]
    R = [place_on(f, (mr['cx'], mr['ground']), S, at) for f in ready]
    ai = [np.array(f).astype(np.float32) for f in I]
    ar = [np.array(f).astype(np.float32) for f in R]
    best, bd = (0, 0), 1e18
    for i, a in enumerate(ai[:12]):
        for j, b in enumerate(ar[:12]):
            d = float(np.abs(a - b).mean())
            if d < bd:
                bd, best = d, (i, j)
    i, j = best
    blends = []
    for t in (.25, .5, .75):
        blends.append(Image.blend(I[i], R[j], t))
    box, cells = crop_union(blends)
    A, cols = atlas(cells)
    info = save(A, os.path.join(out, key + '.webp'))
    return dict(file=key + '.webp', cols=cols, n=3, cell=list(cells[0].size), ms=[120, 120, 120], anchor=[at[0] - box[0], at[1] - box[1]],
                body=mi['body'], from_idle=i, to_ready=j, diff=round(bd, 2), crop=list(box), atlas=list(A.size), **info)


def walk(x, out):
    import glob
    W = glob.glob(os.path.join(x, '*', 'hwando-walk-8-short-hilt'))[0]
    res = {}
    for d in 'NSE':
        frames = [Image.open(os.path.join(W, d, f'{d}-{i:02d}.png')).convert('RGBA') for i in range(1, 9)]
        res[d.lower()] = build_anim(frames, [100] * 8, out, 'walk-' + d.lower())
    # 보폭: E 1·5 칸(두 발 디딤) 바닥 띠의 두 덩어리 중심 간격
    steps = []
    for i in (1, 5):
        a = sil(Image.open(os.path.join(W, 'E', f'E-{i:02d}.png')).convert('RGBA'))
        ys, xs = np.nonzero(a)
        band = a[ys.max() - 10:ys.max() + 1].any(0)
        segs, s0 = [], None
        for X in range(len(band)):
            if band[X] and s0 is None:
                s0 = X
            if not band[X] and s0 is not None:
                segs.append((s0, X - 1)); s0 = None
        if s0 is not None:
            segs.append((s0, len(band) - 1))
        segs = [s for s in segs if s[1] - s[0] > 8]
        if len(segs) >= 2:
            steps.append(((segs[-1][0] + segs[-1][1]) - (segs[0][0] + segs[0][1])) / 2)
    step = float(np.mean(steps)) if steps else 44.0
    res['stride'] = dict(step_px=round(step, 1), frames_per_stride=8, px_per_frame=round(step * 2 / 8, 2), note='E 1·5칸 두 발 중심 간격 = 한 걸음, 8칸 = 두 걸음')
    return res


def main():
    x, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    idx = dict(revision='R242-hwando-1', source='Drive Hwando-Claude-Selected-Download-Index-v1 (selected-handoff-v1)', mirrorW='E', anims={})
    idx['anims']['walk'] = walk(x, out)
    A = idx['anims']
    for dname, pack in (('n', 'N-rest'), ('s', 'S-rest'), ('e', 'E-rest')):
        d, an = load_pack(x, pack)
        for k in ('idle', 'hit'):
            v = an[k]
            A.setdefault(k, {})[dname] = build_anim(frames_from(d, v), v['duration_ms'], out, f'{k}-{dname}', dict(state=v.get('state')))
    for dname, pack, k in (('n', 'N-ready', 'ready'), ('e', 'E-combat', 'ready'), ('n', 'N-attack', 'attack'), ('s', 'S-attack', 'attack'), ('e', 'E-combat', 'attack')):
        d, an = load_pack(x, pack)
        v = an[k]
        A.setdefault(k, {})[dname] = build_anim(frames_from(d, v), v['duration_ms'], out, f'{k}-{dname}', dict(state=v.get('state')))
    # 대기 ↔ 준비 전환(N·E — S 는 준비 동작이 없어 대기를 쓴다)
    for dname, rp, ip in (('n', 'N-ready', 'N-rest'), ('e', 'E-combat', 'E-rest')):
        di, ai = load_pack(x, ip)
        dr, ar = load_pack(x, rp)
        A.setdefault('toReady', {})[dname] = transition(frames_from(di, ai['idle']), ai['idle']['duration_ms'], frames_from(dr, ar['ready']), ar['ready']['duration_ms'], out, f'to-ready-{dname}')
    json.dump(idx, open(os.path.join(out, 'index.json'), 'w'), ensure_ascii=False, indent=1)
    tot = sum(v['atlas'][0] * v['atlas'][1] * 4 for a in A.values() if isinstance(a, dict) for v in a.values() if isinstance(v, dict) and 'atlas' in v)
    print(json.dumps(dict(files=len(os.listdir(out)), rgba_mib=round(tot / 2 ** 20, 2), bytes=sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out)), stride=A['walk']['stride'],
                          toReady={k: (v['from_idle'], v['to_ready'], v['diff']) for k, v in A['toReady'].items()},
                          body={a: {d: v['body'] for d, v in A[a].items() if isinstance(v, dict) and 'body' in v} for a in A}), ensure_ascii=False))


if __name__ == '__main__':
    main()
