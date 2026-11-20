#!/usr/bin/env python3
"""R1247 Dots 시트 입고 검사(scripts/r1247-sheet-intake.py) CPU 테스트 — PIL 만 쓴다.
합성 시트로 정상(PASS)·경계값·회귀(떨림·칸 넘침·발 기준선·크기 흔들림·빈 칸·크로마키·티끌)와 보고용 전수 모드를 확인한다."""
import importlib.util, json, os, pathlib, subprocess, sys, tempfile
from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
SCRIPT = HERE / 'r1247-sheet-intake.py'
spec = importlib.util.spec_from_file_location('sheet_intake', SCRIPT)
si = importlib.util.module_from_spec(spec); spec.loader.exec_module(si)

CW, CH = 64, 80  # 칸 크기
fails = []
def check(name, cond, info=''):
    print(('ok   ' if cond else 'FAIL ') + name + ('' if cond else '  ' + str(info)))
    if not cond: fails.append(name)

def figure(d, ox, oy, foot=70, cx=32, h=40, w=16, color=(200, 40, 40, 255)):
    """칸 원점 ox,oy 에 몸통(사각형)+발(아래 4줄)을 그린다. foot = 발 맨 아래 줄 y."""
    d.rectangle([ox + cx - w // 2, oy + foot - h + 1, ox + cx + w // 2 - 1, oy + foot], fill=color)

def sheet(rows, cols, per=None, mode='RGBA', bg=(0, 0, 0, 0)):
    im = Image.new(mode, (cols * CW, rows * CH), bg)
    d = ImageDraw.Draw(im)
    for i in range(rows * cols):
        kw = (per or {}).get(i, {})
        if kw is None: continue  # 빈 칸
        figure(d, (i % cols) * CW, (i // cols) * CH, **kw)
    return im

def run(im, **kw):
    return si.check_sheet(im, cell=(CW, CH), **kw)

# 1 정상: 2x3 같은 그림 → PASS, 문제 0
r = run(sheet(2, 3))
check('clean PASS', r['verdict'] == 'PASS' and not r['issues'], r['issues'])
check('clean metrics', r['foot_spread'] == 0 and r['center_spread'] == 0 and abs(r['scale_ratio'] - 1) < 1e-9, r)
check('clean frames', r['frames'] == 6 and r['rows'] == 2 and r['cols'] == 3, r)

# 2 발 기준선 회귀: 4번 칸만 12px 아래 → HOLD, baseline, 칸 4 지목
r = run(sheet(2, 3, {4: dict(foot=76 - 4)}))  # 72: 2px 차이(허용)
check('foot 2px within tolerance', r['verdict'] == 'PASS', r['issues'])
r = run(sheet(2, 3, {4: dict(foot=58)}))
iss = [x for x in r['issues'] if x['rule'] == 'baseline']
check('foot drift HOLD', r['verdict'] == 'HOLD' and iss and 4 in iss[0]['cells'], r['issues'])

# 3 경계값: 허용치 foot_tol 정확히 → PASS, +1 → HOLD
tol = si.default_tolerances((CW, CH))['foot_tol']
r = run(sheet(1, 2, {1: dict(foot=70 - tol)}))
check('foot == tol PASS', r['verdict'] == 'PASS', (tol, r['issues']))
r = run(sheet(1, 2, {1: dict(foot=70 - tol - 1)}))
check('foot == tol+1 HOLD', r['verdict'] == 'HOLD' and any(x['rule'] == 'baseline' for x in r['issues']), (tol, r['issues']))

# 4 크기 흔들림: 한 칸만 1.5배 키 → scale
r = run(sheet(1, 4, {2: dict(h=60)}))
check('scale drift HOLD', any(x['rule'] == 'scale' and 2 in x['cells'] for x in r['issues']), r['issues'])
r = run(sheet(1, 4, {2: dict(h=48)}))  # 1.2배 → 허용(1.25)
check('scale 1.2 PASS', not any(x['rule'] == 'scale' for x in r['issues']), r['issues'])

# 5 좌우 떨림: 발 중심이 20px 옆 → jitter
r = run(sheet(1, 4, {3: dict(cx=52)}))
check('jitter HOLD', any(x['rule'] == 'jitter' and 3 in x['cells'] for x in r['issues']), r['issues'])
# 공격 자세처럼 윗몸만 옆으로 뻗고 발은 제자리면 떨림 아님(발 부분만 본다)
im = sheet(1, 4); d = ImageDraw.Draw(im); d.rectangle([CW + 40, 35, CW + 62, 42], fill=(200, 40, 40, 255))
r = run(im)
check('weapon reach not jitter', not any(x['rule'] == 'jitter' for x in r['issues']), r['issues'])

# 회귀(r164 옆 달리기 거짓 경보): 몸통은 제자리, 한 칸만 보폭이 넓어 다리가 한쪽으로 크게 뻗어도 떨림 아님
im = sheet(1, 4); d = ImageDraw.Draw(im)
d.rectangle([2 * CW + 24, 62, 2 * CW + 58, 70], fill=(200, 40, 40, 255))  # 3번째 칸 발치에 앞으로 뻗은 다리
r = run(im)
check('stride legs not jitter', not any(x['rule'] == 'jitter' for x in r['issues']), r['issues'])

# 6 칸 넘침: 그림이 칸 오른쪽 끝에 닿음 → bleed, 칸 지목
r = run(sheet(1, 3, {1: dict(cx=58, w=12)}))
check('bleed HOLD', any(x['rule'] == 'bleed' and 1 in x['cells'] for x in r['issues']), r['issues'])
# 티끌 1~2px 은 넘침이 아님(회귀: 노이즈로 HOLD 되지 않게)
im = sheet(1, 3); im.putpixel((CW - 1, 10), (255, 255, 255, 255)); im.putpixel((CW - 1, 11), (255, 255, 255, 255))
r = run(im)
check('speck not bleed', not any(x['rule'] == 'bleed' for x in r['issues']), r['issues'])
# 희미한 빛(알파 < 64)은 넘침이 아님
im = sheet(1, 3); ImageDraw.Draw(im).rectangle([0, 0, CW - 1, 3], fill=(255, 255, 255, 30))
r = run(im)
check('faint glow not bleed', not any(x['rule'] == 'bleed' for x in r['issues']), r['issues'])

# 7 빈 칸 → empty
r = run(sheet(1, 3, {2: None}))
check('empty HOLD', r['verdict'] == 'HOLD' and any(x['rule'] == 'empty' and 2 in x['cells'] for x in r['issues']), r['issues'])
# 빈 칸 수 지정(마지막 칸 비움 허용) → PASS
r = run(sheet(1, 3, {2: None}), frames=2)
check('declared frames skip trailing empty', r['verdict'] == 'PASS' and r['frames'] == 2, r['issues'])

# 8 칸 나누어떨어지지 않음 → 거부(ValueError)
try:
    si.check_sheet(Image.new('RGBA', (CW * 2 + 5, CH)), cell=(CW, CH)); check('indivisible refused', False)
except ValueError:
    check('indivisible refused', True)

# 9 크로마키 #FF00FF 바탕(알파 없음) → 투명으로 보고 PASS
im = sheet(1, 3, mode='RGB', bg=(255, 0, 255))
r = run(im)
check('chroma key PASS', r['verdict'] == 'PASS' and r['background'] == 'key:FF00FF', (r['background'], r['issues']))
# 알파 시트에 투명이 있으면 키 색을 추측하지 않음
r = run(sheet(1, 3))
check('alpha background', r['background'] == 'alpha', r['background'])

# 10 그룹: 걷기·공격이 서로 다른 기준선이어도 그룹 안에서만 비교
per = {i: dict(foot=60) for i in (2, 3)}
r = run(sheet(1, 4, per), groups=[(0, 2), (2, 2)])
check('groups compared separately', r['verdict'] == 'PASS', r['issues'])
r = run(sheet(1, 4, per))
check('single group catches it', any(x['rule'] == 'baseline' for x in r['issues']), r['issues'])

# 11 이펙트 시트(kind=fx)는 발 기준선·떨림·크기를 보지 않음(빈 칸·넘침만)
r = run(sheet(1, 4, {1: dict(foot=40), 2: dict(cx=50), 3: dict(h=70)}), kind='fx')
check('fx skips body rules', r['verdict'] == 'PASS', r['issues'])

# 회귀(r411·r438 이펙트 끝 칸 사라짐): fx 는 끝에 이어진 빈 칸을 사라짐 연출로 보고 허용, 가운데 빈 칸은 여전히 HOLD
r = run(sheet(1, 4, {2: None, 3: None}), kind='fx')
check('fx trailing empty allowed', r['verdict'] == 'PASS', r['issues'])
r = run(sheet(1, 4, {1: None}), kind='fx')
check('fx middle empty HOLD', any(x['rule'] == 'empty' and x['cells'] == [1] for x in r['issues']), r['issues'])
r = run(sheet(1, 4, {3: None}))
check('char trailing empty still HOLD', any(x['rule'] == 'empty' for x in r['issues']), r['issues'])

# 12 CLI: PASS=0, HOLD=1, 거부=2, JSON 출력
with tempfile.TemporaryDirectory() as td:
    td = pathlib.Path(td)
    sheet(2, 3).save(td / 'ok.png'); sheet(2, 3, {4: dict(foot=50)}).save(td / 'bad.png')
    Image.new('RGBA', (CW * 2 + 5, CH)).save(td / 'odd.png')
    def cli(*a):
        return subprocess.run([sys.executable, '-I', str(SCRIPT), *a], capture_output=True, text=True)
    p = cli('check', str(td / 'ok.png'), '--cell', f'{CW}x{CH}')
    check('cli PASS exit 0', p.returncode == 0 and json.loads(p.stdout)['verdict'] == 'PASS', p.stdout + p.stderr)
    p = cli('check', str(td / 'bad.png'), '--cell', f'{CW}x{CH}')
    check('cli HOLD exit 1', p.returncode == 1 and json.loads(p.stdout)['verdict'] == 'HOLD', p.stdout + p.stderr)
    p = cli('check', str(td / 'odd.png'), '--cell', f'{CW}x{CH}')
    check('cli refuse exit 2', p.returncode == 2 and 'divid' in p.stderr, p.stdout + p.stderr)
    p = cli('check', str(td / 'ok.png'), '--grid', '2x3')
    check('cli --grid', p.returncode == 0 and json.loads(p.stdout)['cell'] == [CW, CH], p.stdout + p.stderr)

    # 13 전수(보고용): index.json 을 찾아 HOLD 가 있어도 종료 0, 보고서 작성
    root = td / 'assets'; (root / 'rX' / 'mobs').mkdir(parents=True)
    sheet(1, 4).save(root / 'rX' / 'mobs' / 'a.png')
    sheet(1, 4, {1: dict(foot=40)}).save(root / 'rX' / 'mobs' / 'b.png')
    json.dump({'cell': [CW, CH], 'cols': 4, 'mobs': {'a': {'file': 'a.png'}, 'b': {'file': 'b.png'}}},
              open(root / 'rX' / 'mobs' / 'index.json', 'w'))
    (root / 'rY').mkdir(); json.dump({'note': 'no cell'}, open(root / 'rY' / 'index.json', 'w'))
    out = td / 'report'
    p = cli('census', str(root), '--out', str(out))
    check('census exit 0 even with HOLD', p.returncode == 0, p.stdout + p.stderr)
    rep = json.loads((out / 'sheet-intake-report.json').read_text()) if (out / 'sheet-intake-report.json').exists() else {}
    sheets = {s['path']: s for s in rep.get('sheets', [])}
    check('census found 2 sheets', len(sheets) == 2, list(sheets))
    check('census verdicts', sheets.get('rX/mobs/a.png', {}).get('verdict') == 'PASS' and sheets.get('rX/mobs/b.png', {}).get('verdict') == 'HOLD', sheets)
    check('census summary', rep.get('summary', {}).get('HOLD') == 1 and rep.get('summary', {}).get('PASS') == 1, rep.get('summary'))
    check('census markdown', (out / 'sheet-intake-report.md').exists())

# 14 회귀(Dots 검토 R1245_PR882_R1233_census_누락검증): index 맨 위에 cell·cols 가 없으면 조용히 빠지던 문제
with tempfile.TemporaryDirectory() as td:
    root = pathlib.Path(td) / 'assets'
    (root / 'rZ' / 'mobs').mkdir(parents=True); (root / 'rA' / 'mobs').mkdir(parents=True)
    sheet(1, 4).save(root / 'rZ' / 'mobs' / 'z1.png')
    json.dump({'mobs': [{'id': 'z1', 'file': 'z1.png'}]}, open(root / 'rZ' / 'mobs' / 'index.json', 'w'))  # 메타 없음
    sheet(1, 4).save(root / 'rA' / 'mobs' / 'a1.png'); sheet(1, 4, {1: dict(foot=40)}).save(root / 'rA' / 'mobs' / 'a2.png')
    json.dump({'mobs': [{'id': 'a1', 'file': 'a1.png'}, {'id': 'a2', 'file': 'a2.png'}]}, open(root / 'rA' / 'mobs' / 'index.json', 'w'))
    rep = si.census(root, pathlib.Path(td) / 'out', adapters={'rA/mobs': dict(cell=(CW, CH), cols=4, walk=[0, 2], attack=[2, 2])})
    sk = {k['path']: k for k in rep['skipped']}; sh = {k['path']: k for k in rep['sheets']}
    check('no-meta sheet recorded as skipped', 'rZ/mobs/z1.png' in sk and 'metadata' in sk['rZ/mobs/z1.png']['reason'], rep['skipped'])
    check('adapter sheets measured', set(sh) == {'rA/mobs/a1.png', 'rA/mobs/a2.png'}, list(sh))
    check('adapter groups used', sh.get('rA/mobs/a2.png', {}).get('verdict') == 'HOLD' and sh.get('rA/mobs/a2.png', {}).get('layout') == 'adapter:rA/mobs', sh.get('rA/mobs/a2.png'))

# 15 실제 저장소: R1233 몹 13종이 보고서(sheets+skipped)에 정확히 한 번씩
R1233 = ['m019', 'm025', 'm026', 'm027', 'm029', 'm043', 'm044', 'm057', 'm058', 'm069', 'm072', 'm087', 'm091']
assets = HERE.parent / 'r96' / 'runtime-text' / 'assets'
if (assets / 'r1233' / 'mobs' / 'index.json').exists():
    with tempfile.TemporaryDirectory() as td:
        rep = si.census(assets, td)
        allp = [s['path'] for s in rep['sheets']] + [s['path'] for s in rep['skipped']]
        cnt = {m: allp.count(f'r1233/mobs/{m}.webp') for m in R1233}
        check('r1233 13 mobs each exactly once', all(v == 1 for v in cnt.values()), cnt)
        check('r1233 mobs measured (not skipped)', all(any(s['path'] == f'r1233/mobs/{m}.webp' for s in rep['sheets']) for m in R1233))
        check('every listed sheet appears once', len(allp) == len(set(allp)), len(allp) - len(set(allp)))
else:
    check('r1233 index present', False, 'missing r96/runtime-text/assets/r1233/mobs/index.json')

print(f'{len(fails)} failed' if fails else 'all passed')
sys.exit(1 if fails else 0)
