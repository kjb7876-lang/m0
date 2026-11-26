#!/usr/bin/env python3
"""R1337 2D 보스 동작 일관성 검사(PIL 만, CI CPU).

완료 조건(사용자 2026-11-26: 뿌리 보스 2D 로 되돌리고 일관성 극한 강화 · 핏빛 추격자 · 발록 같은 강화):
 ① 게임이 상태(대기·걷기·공격·피격)마다 실제로 그리는 몸 칸(qa/r1337/census-before.json 실측)이
    전부 손질 사본으로 바뀌어 그려진다(오버레이 표에 원본 → 사본).
 ② 그 사본 칸마다 기준 칸 대비 몸통 크기 ±6%, 발 y ±1.2%·발 x ±4%, 색 평균 ±6·표준편차 ±12% (피격 섬광 칸은 색 제외, 걷기 옆모습은 키로 비교).
 ③ 같은 보스의 모든 칸이 한 칸 크기·한 pad(화면 배율 고정의 전제), 발 자리 표가 칸 수와 같음.
 ④ 경계값: 기준 칸(대기 p4) 자신은 차이 0, 걷기 칸은 6장 모두 발 y 같음(±1.2%).
 ⑤ 회귀: 뿌리의 문지기 3D(R1312 boss 항목)가 다시 켜지지 않음 · 원본 그림 파일은 그대로(해시) · 빌드 연결 다섯 곳.
결과가 하나라도 어긋나면 FAIL 로 끝난다.
"""
import json, os, re, sys, hashlib
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); R96 = os.path.dirname(os.path.dirname(HERE)); ROOT = os.path.dirname(R96)
sys.path.insert(0, HERE)
from metrics import measure, compare, LIMITS  # noqa: E402

RT = os.path.join(R96, 'runtime-text')
fails = 0
def ok(c, m):
    global fails
    print(('ok   ' if c else 'FAIL ') + m)
    if not c: fails += 1

def rd(p):
    try: return open(os.path.join(ROOT, p), encoding='utf-8').read()
    except Exception: return ''

js = rd('r96/client-source/boss-2d-consistency-r1337.js')
m = re.search(r'window\.__STORYWORLD_BOSS2D_R1337_DATA__=(\{.*?\});// @@TABLE@@', js)
table = json.loads(m.group(1))['bosses'] if m else {}
if os.environ.get('R1337_RAW'):
    # 비교용: 손질 전 원본을 그대로 '사본'으로 보고 같은 기준을 적용한다(손질 전 수치 보고)
    cfg = json.load(open(os.path.join(HERE, 'frames.json'), encoding='utf-8'))['bosses']; table = {}
    for b, B in cfg.items():
        W, H = Image.open(os.path.join(RT, B['ref'])).size
        table[b] = {'out': [W, H], 'float': B.get('float'), 'frames': [dict(f, out=f['path'], foot=[0] * f.get('n', 1)) for f in B['frames'] if os.path.exists(os.path.join(RT, f['path']))]}
        if 'walk' in B: table[b]['walk'] = {'path': B['walk']['path'], 'n': 6}
ok(bool(table), '오버레이 표(boss-2d-consistency-r1337.js) 있음')
census = json.load(open(os.path.join(HERE, 'census-before.json'), encoding='utf-8'))
NAMES = {'root': '뿌리의 문지기', 'blood': '핏빛 수호로 추격자', 'balrog': '발록'}

def cells(path, n, OW=None):
    p = os.path.join(RT, path)
    if not os.path.exists(p): return None
    im = Image.open(p).convert('RGBA'); w = OW or im.width // n
    return [im.crop((i * w, 0, (i + 1) * w, im.height)) for i in range(n)]

for boss, label in NAMES.items():
    T = table.get(boss)
    ok(T is not None, f'{label}: 표에 있음')
    if not T: continue
    OW, OH = T['out']; frames = {f['path']: f for f in T['frames']}
    # ① 실측으로 그려진 칸이 모두 표에 있음
    drawn = census[boss]
    for st, keys in drawn.items():
        for key in keys:
            path = key.split('|')[0]
            if '/r1029/float/' in path:
                ok(T.get('float') == path, f'{label}·{st}: 떠서 이동 칸 {path} 는 배율 고정 대상')
                continue
            ok(path in frames, f'{label}·{st}: 그려진 칸 {path.split("/")[-1]} → 손질 사본으로 바뀜')
    # ②③④ 사본 칸 수치
    ref_f = next((f for f in T['frames'] if f.get('ref') and not f.get('n', 1) > 1 and not f.get('alias')), None)
    ref_cells = cells(ref_f['out'], 1) if ref_f else None
    ok(bool(ref_cells), f'{label}: 기준 사본 있음')
    if not ref_cells: continue
    R = measure(ref_cells[0])
    ok(ref_cells[0].size == (OW, OH), f'{label}: 기준 칸 크기 = 표의 out {OW}×{OH}')
    z = compare(R, measure(ref_cells[0]))
    ok(abs(z['massRatio'] - 1) < 1e-9 and z['footDy'] == 0 and z['meanDiff'] == 0, f'{label}: 경계값 — 기준 칸 자신은 차이 0')
    for f in T['frames']:
        if f.get('alias'):
            ok(os.path.exists(os.path.join(RT, f['out'])) and 0 <= f['cell'] < f['n'], f'{label}: 다른 그림체 {f["path"].split("/")[-1]} → {f["out"].split("/")[-1]} {f["cell"]}번 칸')
            continue
        n = f.get('n', 1); cs = cells(f['out'], n, OW)
        ok(cs is not None, f'{label}: 사본 {f["out"]} 있음')
        if not cs: continue
        ok(all(c.size == (OW, OH) for c in cs), f'{label}: {f["out"].split("/")[-1]} 칸 크기 {OW}×{OH}')
        ok(len(f.get('foot') or []) == n, f'{label}: {f["out"].split("/")[-1]} 원래 발 자리 {n}칸')
        for i, c in enumerate(cs):
            k = compare(R, measure(c)); hitc = f.get('state') == 'hit'
            bad = []
            if not (LIMITS['massRatio'][0] <= k['massRatio'] <= LIMITS['massRatio'][1]): bad.append('몸통 %.3f' % k['massRatio'])
            if k['footDy'] > LIMITS['footDy']: bad.append('발y %.3f' % k['footDy'])
            if k['footDx'] > LIMITS['footDx']: bad.append('발x %.3f' % k['footDx'])
            if not hitc and k['meanDiff'] > LIMITS['meanDiff']: bad.append('색평균 %.1f' % k['meanDiff'])
            if not hitc and k['stdRatioDev'] > LIMITS['stdRatioDev']: bad.append('색편차 %.3f' % k['stdRatioDev'])
            ok(not bad, f'{label}·{f.get("state","")}: {f["out"].split("/")[-1]} {i}번 칸 기준과 일관 ' + ' '.join(bad))
    if boss == 'root':
        W = T.get('walk'); ok(bool(W) and W.get('n') == 6, '뿌리의 문지기: 걷기 6칸 연결')
        cs = cells(W['path'], 6, None if os.environ.get('R1337_RAW') else OW) if W else None
        ok(bool(cs), '뿌리의 문지기: 걷기 사본 있음')
        if cs:
            ms = [measure(c) or {'h': 1e-3, 'footY': 0, 'footX': 0, 'mass': 1, 'mean': [0, 0, 0], 'std': [1, 1, 1], 'H': 1, 'w': 1} for c in cs]
            hs = [m_['h'] for m_ in ms]
            ok(max(abs(m_['footY'] - R['footY']) for m_ in ms) <= LIMITS['footDy'], '뿌리의 문지기: 걷기 6칸 발 y 일치')
            ok(max(hs) / min(hs) <= 1.06 and abs(sum(hs) / 6 / R['h'] - 1) <= .06, '뿌리의 문지기: 걷기 키 = 대기 키 ±6%%(%.3f)' % (sum(hs) / 6 / R['h']))
            k = [compare(R, m_) for m_ in ms]
            ok(max(x['meanDiff'] for x in k) <= LIMITS['meanDiff'] and max(x['stdRatioDev'] for x in k) <= LIMITS['stdRatioDev'], '뿌리의 문지기: 걷기 색 = 대기 색(밝은 옛 색 → 맞춤)')

# ⑤ 회귀
s1312 = rd('r96/client-source/mob-3d-r1312.js')
ok(not re.search(r"\bboss:\{glb:", s1312) and "glb:'assets/r1312/boss-dist00" not in s1312 and "if(e.boss)return 'boss'" not in s1312 and "if(e.boss)return null" in s1312, '뿌리의 문지기 3D 꺼짐(R1312 에 보스 항목 없음)')
ok(os.path.exists(os.path.join(RT, 'assets/r1312/boss-dist00-root-gatekeeper-3d.glb')), '문지기 GLB 파일은 지우지 않음')
rep = json.load(open(os.path.join(HERE, 'process-report.json'), encoding='utf-8')) if os.path.exists(os.path.join(HERE, 'process-report.json')) else {}
for out, r in rep.items():
    p = os.path.join(RT, r['source'])
    if os.path.exists(p):
        ok(hashlib.sha256(open(p, 'rb').read()).hexdigest() == r['sourceSha256'], f'원본 보존 {r["source"].split("/")[-1]}')
    q = os.path.join(RT, out)
    ok(os.path.exists(q) and hashlib.sha256(open(q, 'rb').read()).hexdigest() == r['sha256'], f'사본 해시 {out.split("/")[-1]}')
html = rd('r96/runtime-text/index.html'); tag = '<script src="./boss-2d-consistency-r1337.js"></script>'
ok(html.count(tag) == 1, 'index.html 태그 1개')
ok(0 < html.find('"./mob-3d-r1315.js"') < html.find(tag) < html.find('"./combat-guide-r1249.js"'), '태그 자리: mob-3d-r1315 뒤 · combat-guide-r1249 앞')
ok(rd('r96/runtime-text/boss-2d-consistency-r1337.js') == js and bool(js), 'runtime-text 사본 = client-source')
man = rd('r96/runtime-manifest.json')
ok('boss-2d-consistency-r1337.js' in man and all(o in man for o in rep), 'runtime-manifest 에 스크립트·사본')
ok("'boss-2d-consistency-r1337.js'" in rd('scripts/verify-r96-public.py'), '공개 확인 목록')
ok('r96/qa/r1337/r1337-check.py' in rd('.github/workflows/pages.yml'), 'CI 에 이 검사')
print('R1337 ' + ('ALL OK' if not fails else f'FAIL {fails}')); sys.exit(1 if fails else 0)
