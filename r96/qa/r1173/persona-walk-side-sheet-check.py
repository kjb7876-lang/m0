#!/usr/bin/env python3
"""R1173 실패 먼저(사용자 11-18 14:31Z "페르소나영웅 위랑 좌우움직일때 다리가 너무빠르고 좌우다리특히 허벅지랑허리연결이 좀부자연스러움").
페르소나 '영웅' 옆 걷기 시트(assets/r1173/persona-walk-side.webp)를 R1104b 시트(보스가 그대로 씀)와 견줘 검사한다.
 I1 허리 띠(y285~340) 안 1~3px 투명 구멍(상체·다리 이음매 틈) = 0
 I2 허벅지~무릎(y300~440) 가로로 곧게 잘린 알파 끝(불투명 위·투명 아래가 가로로 이어진 길이) ≤ 8px (R1104b 2·6번 칸 15px)
 I3 골반 오르내림: 두 발 벌린 칸(0·4)은 낮게, 지나가는 칸(2·6)은 높게 — 머리 꼭대기 차이 6~12px, 발바닥 줄은 그대로
 I4 늘인 띠에 새 가로 줄 없음: 상체~엉덩이(y200~335) 줄 사이 밝기 차 최대가 원본의 1.15배 이하
 I5 무릎 아래(y≥360) 다리는 원본과 같음(바뀐 화소 ≤ 1%, 틈 끝 다듬기만)
 I6 코드 ORB(손 구슬 자리) 옆 y = 원본 y + 그 칸 골반 이동(±1px), 보스 R1104b 시트는 바이트 그대로
 I7 영웅 코드는 옆 걷기만 r1173 시트, 앞·뒤는 r1104b(보스와 같은 그림)
쓰기: python3 r96/qa/r1173/persona-walk-side-sheet-check.py
"""
import os, re, sys, json, hashlib, subprocess
import numpy as np
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..')
OLD = os.path.join(ROOT, 'runtime-text/assets/r1104b/persona-walk-side.webp')
NEW = os.path.join(ROOT, 'runtime-text/assets/r1173/persona-walk-side.webp')
SRC = os.path.join(ROOT, 'client-source/persona-hero-r1113.js')
fails = 0
def ok(c, m):
    global fails
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails += 1
def cells(p):
    a = np.array(Image.open(p).convert('RGBA')).astype(np.int32)
    return [a[:, f*512:(f+1)*512] for f in range(8)]
def lum(c): return c[..., 0]*.299 + c[..., 1]*.587 + c[..., 2]*.114
def holes(c):
    al = c[..., 3] >= 128; n = 0
    for y in range(285, 341):
        row = al[y]; xs = np.nonzero(row)[0]
        if len(xs) == 0: continue
        x = xs.min()
        while x < xs.max():
            if row[x]: x += 1; continue
            e = x
            while e < xs.max() and not row[e]: e += 1
            if e - x <= 3: n += e - x
            x = e
    return n
def cut(c):
    al = c[..., 3] >= 128; best = 0
    for y in range(300, 441):
        e = al[y] & ~al[y+1]; run = 0
        for v in e:
            run = run + 1 if v else 0; best = max(best, run)
    return best
def top(c): return int(np.nonzero((c[..., 3] >= 128).any(1))[0].min())
def sole(c): return int(np.nonzero((c[..., 3] >= 128).any(1))[0].max())
def seam(c):
    body = (c[200:336, :, 3] >= 200)
    m = body[:-1] & body[1:]
    L = lum(c[200:336])
    d = np.abs(L[1:] - L[:-1])
    return max(float(d[i][m[i]].mean()) for i in range(len(m)) if m[i].sum() > 20)
def orb(c):
    m = (c[..., 3] > 128) & (c[..., 0] > 150) & (c[..., 1] < 90) & (c[..., 2] < 90)
    m[:, 240:] = False; m[236:] = False; m[:130] = False
    ys, xs = np.nonzero(m); return xs.mean(), ys.mean()

ok(os.path.exists(NEW), 'I0 영웅 옆 걷기 시트 assets/r1173/persona-walk-side.webp 가 있음')
O = cells(OLD)
if os.path.exists(NEW):
    N = cells(NEW)
    ok(Image.open(NEW).size == (4096, 512), 'I0 크기 4096×512(512칸×8)')
    h = [holes(c) for c in N]; ok(sum(h) == 0, 'I1 허리 띠 1~3px 구멍 칸별 %s (원본 %s)' % (h, [holes(c) for c in O]))
    k = [cut(c) for c in N]; ok(max(k) <= 8, 'I2 허벅지 가로 잘림 최장 칸별 %s ≤ 8 (원본 %s)' % (k, [cut(c) for c in O]))
    t = [top(c) for c in N]; s = [sole(c) for c in N]
    contact = (t[0] + t[4]) / 2; passing = (t[2] + t[6]) / 2
    ok(6 <= contact - passing <= 12, 'I3 골반 오르내림: 벌린 칸 머리 %.1f, 지나는 칸 %.1f, 차이 %.1fpx(6~12) 칸별 머리 %s' % (contact, passing, contact - passing, t))
    ok(s == [sole(c) for c in O], 'I3 발바닥 줄 그대로 %s' % s)
    so = max(seam(c) for c in O); sn = max(seam(c) for c in N)
    ok(sn <= so * 1.15, 'I4 상체~엉덩이 줄 사이 밝기 차 최대 %.1f ≤ 원본 %.1f×1.15' % (sn, so))
    ch = [float((np.abs(n[360:] - o[360:]).max(-1) > 6).mean()) for n, o in zip(N, O)]
    ok(max(ch) <= .01, 'I5 무릎 아래 바뀐 화소 비율 칸별 최대 %.4f ≤ 0.01' % max(ch))
    js = open(SRC, encoding='utf8').read()
    m = re.search(r"side:\[(\[[^\]]+\](?:,\[[^\]]+\])*)\]", js[js.index('const ORB='):])
    tab = json.loads('[' + m.group(1) + ']') if m else []
    base_y = [188] * 8
    dy = [orb(n)[1] - orb(o)[1] for n, o in zip(N, O)]
    ok(len(tab) == 8 and all(abs((tab[f][1] - base_y[f]) - dy[f]) <= 1 for f in range(8)), 'I6 코드 ORB 옆 y %s = 188 + 칸별 이동 %s' % ([r[1] for r in tab], [round(v, 1) for v in dy]))
    ok(all(abs(tab[f][0] - 200 - (orb(N[f])[0] - orb(O[f])[0])) <= 1.5 for f in range(8)) if len(tab) == 8 else False, 'I6 ORB x 는 그대로')
    ok(hashlib.sha256(open(OLD, 'rb').read()).hexdigest() == '9d78c268bb60ba41375dbcb6d6577836d956f345b8ed1dea7fccad03bb78017b', 'I6 보스 R1104b 옆 시트 바이트 그대로(sha256 9d78c268…)')
js = open(SRC, encoding='utf8').read()
w = js[js.index('const WALK='):js.index('const WALK=') + 600]
ok("side:Object.freeze({src:'assets/r1173/persona-walk-side.webp'" in w, 'I7 영웅 옆 걷기 = r1173 시트')
ok("front:Object.freeze({src:'assets/r1104b/persona-walk-front.webp'" in w and "rear:Object.freeze({src:'assets/r1104b/persona-walk-rear.webp'" in w, 'I7 앞·뒤 = r1104b')
print('R1173 persona-walk-side-sheet ' + ('OK' if not fails else 'FAILED %d' % fails))
sys.exit(1 if fails else 0)
