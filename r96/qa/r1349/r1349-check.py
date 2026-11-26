#!/usr/bin/env python3
"""R1349 2D 몹·보스 동작 일관성 검사(PIL 만, CI CPU).

완료 조건(사용자 2026-11-26 "2d몹들 모션및 일관성 떨어지는거 크기랑 전수조사해서 품질업"):
 ① 전수조사(qa/r1349/census-before.json, 헤드리스 렌더 단계 실측)에서 대상 몹이 그린 몸 시트(그려진 횟수 3% 이상)가
    전부 손질 사본으로 바뀌어 그려진다(표 frames 의 path, 또는 떠서 이동 float).
 ② 사본 시트마다: 한 칸 크기·한 pad(화면 배율 고정의 전제), 발 아래끝 y 가 기준 칸 ±1.2%, 발 x ±5%,
    걷기·이동 시트(scaleFrom sheetHeight)는 보이는 키 중앙값이 기준 칸 ±6%(시트 안 출렁임은 남김), 자세 열쇠 그림은 frames.json 배율 그대로(한 그림 한 배율).
 ③ 색: 피격 섬광 없는 칸은 몸 평균 RGB 차 8 이하(떠서 이동 안개처럼 color:false 로 둔 이펙트 칸은 색 제외).
 ④ 경계값: 기준 칸은 배율 1·차이 0. 대상은 nativeId(ids)로만 고른다(같은 그림을 다른 몹이 써도 안 건드림).
 ⑤ 회귀: 원본 그림 그대로(사본만 새로), R1337 표·오버레이가 R1349 표를 합침, 빌드 연결(index.html 순서·sync·공개 목록·CI 줄).
"""
import json, os, re, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); R96 = os.path.dirname(os.path.dirname(HERE)); ROOT = os.path.dirname(R96)
RT = os.path.join(R96, 'runtime-text'); SITE = os.path.join(R96, 'hospital-three-pc', 'site')
try: BASE = set(json.load(open(os.path.join(R96, 'runtime-inputs.json')))['basePaths'])
except Exception: BASE = set()
sys.path.insert(0, os.path.join(R96, 'qa', 'r1337'))
from metrics import measure  # noqa: E402
fails = 0
def ok(c, m):
    global fails
    print(('ok   ' if c else 'FAIL ') + m)
    if not c: fails += 1
def rd(p):
    try: return open(os.path.join(ROOT, p), encoding='utf-8').read()
    except Exception: return ''

js = rd('r96/client-source/mob-2d-consistency-r1349-data.js')
m = re.search(r'window\.__STORYWORLD_BOSS2D_R1349_DATA__=(\{.*?\});// @@TABLE@@', js)
table = json.loads(m.group(1))['bosses'] if m else {}
cfg = json.load(open(os.path.join(HERE, 'frames.json'), encoding='utf-8'))['bosses']
census = json.load(open(os.path.join(HERE, 'census-before.json'), encoding='utf-8'))
ok(bool(cfg), f'frames.json 대상 {len(cfg)}종')
for b, B in cfg.items():
    T = table.get(b)
    ok(T is not None, f'{B["name"]}: 표에 있음')
    if not T: continue
    ok(T.get('ids') == B.get('ids') and bool(B.get('ids')), f'{B["name"]}: nativeId 로만 고름 {B.get("ids")}')
    src = {f['path'] for f in T['frames']}
    # ① 전수조사에서 그 몹이 그린 몸 시트가 모두 표에 있음
    seen = {}
    for nid in B['ids']:
        for z, Z in census.items():
            M = Z.get(nid)
            if not M: continue
            for sh, n in M['sheets'].items(): seen[sh] = seen.get(sh, 0) + n
    tot = sum(seen.values()) or 1
    # 'r409:outline…' 같은 키는 그림 파일이 아니라 R409 가 몸 그림 위에 구운 테두리 캔버스(몸 그림을 바꾸면 따라온다) → 몸 시트만 센다
    miss = [s for s, n in seen.items() if n >= tot * .03 and s.startswith('assets/') and s not in src and s != T.get('float')]
    ok(bool(seen) and not miss, f'{B["name"]}: 전수조사 몸 시트 {len(seen)}장 모두 사본으로 {"" if not miss else "빠짐 " + str(miss)}')
    OW, OH = T['out']; pad = T['pad']; ref = None
    # 기준 칸
    for f in T['frames']:
        if f.get('ref'):
            im = Image.open(os.path.join(RT, f['out'])).convert('RGBA'); n = f.get('n', 1) if not f.get('rects') else len(f['rects'])
            rr = B['ref'].get('rect') if isinstance(B['ref'], dict) else None  # 기준 칸 = 생성기가 잰 그 칸(가로 한 줄 시트면 rect 위치로 몇째 칸인지)
            k = rr[0] // rr[2] if rr and not f.get('rects') and rr[2] and rr[0] // rr[2] < n else 0
            ref = measure(im.crop((k * OW, 0, (k + 1) * OW, OH)))
            hs0 = [c['h'] for c in (measure(im.crop((i * OW, 0, (i + 1) * OW, OH))) for i in range(n)) if c] if not f.get('rects') else []  # 아틀라스(자세마다 다른 칸)는 기준 칸 하나
            refH = sorted(hs0)[len(hs0) // 2] if hs0 else ref['h']  # 걷기 시트 키는 기준 시트 칸들의 키 중앙값과 견준다(생성기와 같은 기준)
    ok(ref is not None, f'{B["name"]}: 기준 칸 있음')
    if not ref: continue
    cfgf = {f['out']: f for f in B['frames']}
    for f in T['frames']:
        if f.get('alias'): continue
        p = os.path.join(RT, f['out']); im = Image.open(p).convert('RGBA')
        n = len(f['rects']) if f.get('rects') else f.get('n', 1)
        ok(im.size == (OW * n, OH), f'{B["name"]} {os.path.basename(p)}: 칸 {n}×({OW}×{OH}) 같은 크기')
        cf = cfgf.get(f['out'], {})
        if f.get('ref'): ok(all(abs(s - 1) < 1e-6 for s in f['sc']), f'{B["name"]}: 기준 칸 배율 1')
        if isinstance(cf.get('scale'), (int, float)) and not isinstance(cf.get('scale'), bool):
            ok(all(abs(s - cf['scale']) < 1e-3 for s in f['sc']), f'{B["name"]} {os.path.basename(p)}: 한 그림 한 배율 {cf["scale"]}')
        bad = []; hs = []
        for i in range(n):
            c = measure(im.crop((i * OW, 0, (i + 1) * OW, OH)))
            if not c: bad.append(f'{i}:빈칸'); continue
            if abs(c['footY'] - ref['footY']) > .012: bad.append(f'{i}:발y{c["footY"]-ref["footY"]:+.3f}')
            if abs(c['footX'] - ref['footX']) > .05: bad.append(f'{i}:발x{c["footX"]-ref["footX"]:+.3f}')
            hs.append(c['h'])
            if f.get('state') != 'hit' and cf.get('color', True) and max(abs(a - b) for a, b in zip(c['mean'], ref['mean'])) > 8: bad.append(f'{i}:색')
        if cf.get('scaleFrom') == 'sheetHeight' and hs:
            md = sorted(hs)[len(hs) // 2]
            if abs(md / refH - 1) > .06: bad.append(f'키 중앙값{md/refH:.2f}')
        ok(not bad, f'{B["name"]} {os.path.basename(p)}: 발·키·색 {bad if bad else "맞음"}')
        # 원본은 runtime-text, 또는 빌드가 기준 커밋에서 가져오는 runtime-inputs basePaths(빌드된 site)
        ok(os.path.exists(os.path.join(RT, f['path'])) or os.path.exists(os.path.join(SITE, f['path'])) or f['path'] in BASE, f'{B["name"]}: 원본 {f["path"]} 그대로 있음')
# ⑤ 빌드 연결·회귀
html = rd('r96/runtime-text/index.html')
i1 = html.find('mob-2d-consistency-r1349-data.js'); i2 = html.find('boss-2d-consistency-r1337.js')
ok(0 <= i1 < i2, 'index.html: R1349 표가 R1337 오버레이보다 먼저')
o37 = rd('r96/client-source/boss-2d-consistency-r1337.js')
ok('__STORYWORLD_BOSS2D_R1349_DATA__' in o37 and '__STORYWORLD_BOSS2D_R1337_DATA__=' in o37, 'R1337 오버레이가 R1349 표를 합치고 자기 표 유지')
ok('mob-2d-consistency-r1349-data.js' in rd('scripts/verify-r96-public.py'), '공개 검사 목록에 R1349 표')
ok('r96/qa/r1349/r1349-check.py' in rd('.github/workflows/pages.yml'), 'CI 줄에 R1349 검사')
ok('mob-2d-consistency-r1349-data.js' in rd('r96/runtime-inputs.json'), 'runtime-inputs.json 에 R1349 표(sync)')
print('ALL OK' if not fails else f'{fails} FAIL'); sys.exit(1 if fails else 0)
