#!/usr/bin/env python3
"""R1349 Dots 시트 적용 검사(PIL만). 규격 dots-spec.json.
 1) 결과 시트가 있고 크기가 칸×열 격자와 같다.
 2) 칸마다 보이는 키(알파>40)가 원본 대기 칸 대비 ±6%, 발 아래끝이 칸 높이 1.2% 안, 몸 평균 RGB 가 원본 모든 칸 중앙값과 8 이하.
 3) 그림 표(mob-dots-motion-r1349.js · boss-motion-r620.js)가 시트 경로를 실제로 쓴다."""
import json, os, re, statistics as st
from PIL import Image
R96 = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RT = os.path.join(R96, 'runtime-text'); SITE = os.path.join(R96, 'hospital-three-pc', 'site')
spec = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dots-spec.json')))
Rl = spec['rules']; fails = 0
def ok(c, msg):
    global fails
    if not c: fails += 1
    print(('OK   ' if c else 'FAIL ') + msg)
def find(p):
    for b in (RT, SITE):
        q = os.path.join(b, p)
        if os.path.exists(q): return q
def meas(c):
    a = c.getchannel('A').point(lambda v: 255 if v > 40 else 0); bb = a.getbbox()
    if not bb: return None
    px = [p for p, m in zip(c.getdata(), a.getdata()) if m]
    return bb, tuple(sum(p[i] for p in px) / len(px) for i in range(3))
def cells(im, cw, ch, n, cols):
    return [im.crop(((i % cols) * cw, (i // cols) * ch, (i % cols) * cw + cw, (i // cols) * ch + ch)) for i in range(n)]
JS = ''
for f in ('mob-dots-motion-r1349.js', 'boss-motion-r620.js'):
    p = os.path.join(RT, f)
    JS += open(p, encoding='utf-8').read() if os.path.exists(p) else ''
for S in spec['sheets']:
    cw, ch = S['cell']; n, cols = S['n'], S['cols']
    op = find(S['out'])
    ok(op is not None, f"{S['id']}: 시트 {S['out']} 있음")
    if not op: continue
    im = Image.open(op).convert('RGBA')
    ok(im.size == (cw * cols, ch * ((n + cols - 1) // cols)), f"{S['id']}: 크기 {im.size}")
    ok(S['out'] in JS, f"{S['id']}: 그림 표가 시트를 씀")
    orp = find(S['orig'])
    ok(orp is not None, f"{S['id']}: 원본 {S['orig']} 있음")
    if not orp: continue
    oi = Image.open(orp).convert('RGBA'); ocw, och = S['origCell']; on = (oi.size[0] // ocw) * (oi.size[1] // och)
    om = [meas(c) for c in cells(oi, ocw, och, on, S['origCols'])]; om = [m for m in om if m]
    base = meas(cells(oi, ocw, och, on, S['origCols'])[S['idleCell']])
    rh, rf = base[0][3] - base[0][1], base[0][3]
    rc = tuple(st.median(m[1][i] for m in om) for i in range(3))
    worst = [0, 0, 0]
    for i, c in enumerate(cells(im, cw, ch, n, cols)):
        m = meas(c)
        if not m: ok(False, f"{S['id']}#{i}: 빈 칸"); continue
        h = abs((m[0][3] - m[0][1]) / rh - 1); f = abs(m[0][3] - rf) / ch; d = max(abs(m[1][k] - rc[k]) for k in range(3))
        worst = [max(worst[0], h), max(worst[1], f), max(worst[2], d)]
    ok(worst[0] <= Rl['height'] and worst[1] <= Rl['foot'] and worst[2] <= Rl['color'],
       f"{S['id']}: 키 {worst[0]*100:.1f}% · 발 {worst[1]*100:.2f}% · 색 {worst[2]:.1f}")
# 엔진 연결: R620 표에 걷기 칸 지원, R1349 덧씌우기가 R380·R208 몸 그림 뒤에 선다
ok(re.search(r"walk:\{path:'assets/r1349/dots/pillar-walk8\.webp'", JS) is not None, 'R620: 검은기둥 걷기 시트 연결')
ok('SD.walk' in JS, 'R620: 걷기 시트를 고르는 코드')
ok('__r1349' in JS, 'R1349 덧씌우기가 frameFor 사슬에 섬')
print('ALL OK' if not fails else f'{fails} FAIL'); raise SystemExit(1 if fails else 0)
