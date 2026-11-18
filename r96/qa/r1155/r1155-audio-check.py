#!/usr/bin/env python3
"""R1155 음원 검사 — EGO·페르소나 전용 효과음이 대규칙(docs/sound-rules.md, R1049)과 목표치를 지키고, 서로·원래 영웅 소리와 다른지.

재는 법은 R1049 전수 대조(scripts/audit-sfx-r1049.py)의 measure()를 그대로 쓴다(게임 재생 사슬 흉내 뒤 측정).
종류·경로 표는 오버레이(hidden-hero-sfx-r1155.js)의 API table 을 node 로 읽는다.
사용: python3 r96/qa/r1155/r1155-audio-check.py   필요: ffmpeg, numpy, node."""
import json, pathlib, subprocess, sys, importlib.util
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[3]
RT = ROOT / 'r96/runtime-text'
spec = importlib.util.spec_from_file_location('audit1049', ROOT / 'scripts/audit-sfx-r1049.py')
A = importlib.util.module_from_spec(spec); spec.loader.exec_module(A)
T = json.loads((ROOT / 'r96/qa/r1049/sound-rules.json').read_text(encoding='utf-8'))['target']
n = bad = 0


def ok(c, m, d=None):
    global n, bad
    n += 1
    if not c: bad += 1; print('FAIL', m, '' if d is None else json.dumps(d, ensure_ascii=False)[:400])
    else: print('ok  ', m)


js = ("const fs=require('fs'),vm=require('vm');const g={localStorage:{getItem:()=>null}};g.window=g;vm.createContext(g);"
      "vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),g);process.stdout.write(JSON.stringify(g.__STORYWORLD_HIDDEN_HERO_SFX_R1155__.table));")
try:
    table = json.loads(subprocess.run(['node', '-e', js, str(ROOT / 'r96/client-source/hidden-hero-sfx-r1155.js')], capture_output=True, text=True, check=True).stdout)
except Exception as e:
    table = {}; print('표 읽기 실패', str(e)[:200])
ok(len(table) >= 31, '표 종류 31개 이상', len(table))

rows = []
for kind, lst in table.items():
    role = 'attack' if kind.startswith('r546Atk_') else 'enemyHit' if kind.startswith('r785') else 'special'
    cat = {'attack': '타격', 'enemyHit': '적피격'}.get(role, '스킬')
    for r in lst:
        rows.append({'kind': kind, 'cat': cat, 'sub': 'atk' if role == 'attack' else ('tick' if kind.startswith('r972_') else 'cast'), 'role': role,
                     'reach': 'r1155', 'path': r['path'], 'remapTo': ''})

frequent = lambda k: k.startswith('r546Atk_') or k.startswith('r972_') or k.startswith('r785')
res = []
for row in rows:
    m = A.measure(row, {}, {})
    if m.get('error'): ok(False, row['path'] + ' 디코딩', m['error']); continue
    x = A.dec(RT / row['path']); pk = float(np.abs(x).max()) if len(x) else 0
    fdb = 20 * np.log10(pk) if pk > 0 else -120
    i50 = int(np.argmax(np.abs(x) >= pk * .5)) if pk > 0 else 0
    m['fileDb'] = round(fdb, 1); m['rise50Ms'] = round(i50 / A.SR * 1000, 1)
    sp = np.abs(np.fft.rfft(x)) ** 2; fr = np.fft.rfftfreq(len(x), 1 / A.SR)
    m['centroid'] = float((fr * sp).sum() / max(sp.sum(), 1e-20))
    env = np.array([np.sqrt((x[i:i + 441] ** 2).mean()) for i in range(0, len(x) - 441, 441)])
    m['env'] = env
    res.append(m)
    k = row['kind']
    ok(not m['violations'], f"{row['path']}: 큰 위반 없음(M1~M8)", m['violations'])
    ok(m['low150'] <= T['low150ShareMax'], f"{row['path']}: 150Hz 아래 {m['low150']} ≤ {T['low150ShareMax']}")
    if frequent(k): ok(m['harsh'] <= T['harsh2to5ShareMaxFrequent'], f"{row['path']}: 2~5kHz {m['harsh']} ≤ {T['harsh2to5ShareMaxFrequent']}(자주 나는 소리)")
    ok(-14.5 <= fdb <= -8.5, f"{row['path']}: 파일 피크 {round(fdb, 1)}dB 가 −9~−14dB")
    ok(m['rise50Ms'] >= 10, f"{row['path']}: 시작 10ms 넘게 올림({m['rise50Ms']}ms)")
    ok(m['leadMs'] < 60, f"{row['path']}: 누르고 바로 남(앞 {m['leadMs']}ms < 60)")
    ok(m['dur'] <= {'attack': .65, 'enemyHit': .45}.get(row['role'], 1.2) + .05, f"{row['path']}: 길이 {m['dur']}초 ≤ 역할 상한")

# 톤: EGO(먹+흰, 천체) 가 페르소나(언주, 악의) 보다 밝다. 서로 다른 소리인지(겉모습 상관).
ego = [m for m in res if m['kind'].endswith('_ego') or '_ego_' in m['kind'] or 'egoSlash' in m['kind']]
per = [m for m in res if m['kind'].endswith('_persona') or '_persona_' in m['kind'] or 'perGravity' in m['kind']]
if ego and per:
    ce, cp = np.median([m['centroid'] for m in ego]), np.median([m['centroid'] for m in per])
    ok(ce > cp * 1.25, f'EGO 가 페르소나보다 밝음(중심 주파수 중앙값 {int(ce)}Hz > {int(cp)}Hz×1.25)')
else: ok(False, 'EGO·페르소나 소리 둘 다 있음')


def logspec(p):
    x = A.dec(p)[:int(.6 * A.SR)]
    if len(x) < 2048: x = np.pad(x, (0, 2048 - len(x)))
    sp = np.abs(np.fft.rfft(x, n=16384)) ** 2; fr = np.fft.rfftfreq(16384, 1 / A.SR)
    edges = np.geomspace(150, 12000, 33); v = np.array([sp[(fr >= a) & (fr < b)].sum() for a, b in zip(edges[:-1], edges[1:])])
    v = np.log10(v + 1e-12); return (v - v.mean()) / (v.std() + 1e-9)


firsts = {}
for m in res: firsts.setdefault(m['kind'], m['path'])
specs = {k: logspec(RT / p) for k, p in firsts.items()}
keys = sorted(specs); dup = []
for i, a in enumerate(keys):
    for b in keys[i + 1:]:
        c = float(np.corrcoef(specs[a], specs[b])[0, 1])
        if c > .985: dup.append((a, b, round(c, 3)))
ok(not dup, '종류끼리 겉모습(스펙트럼)이 거의 같은 쌍 없음(상관 ≤ .985)', dup[:6])
orig = {'r546Atk_ego': 'assets/r546/sfx/atk-hwando-1.ogg', 'r546Sp_ego_q': 'assets/r546/sfx/sp-hwando-1.ogg',
        'r546Atk_persona': 'assets/r546/sfx/atk-lauren-1.ogg', 'r546Sp_persona_q': 'assets/r546/sfx/sp-lauren-1.ogg'}
for k, o in orig.items():
    if k in specs and (RT / o).exists():
        c = float(np.corrcoef(specs[k], logspec(RT / o))[0, 1]); ok(c < .95, f'{k} 가 원래 영웅 소리({o})와 다름(상관 {round(c, 3)} < .95)')
    else: ok(False, f'{k} 비교 대상 있음')
print(f"\n{n - bad}/{n}" + (f' — 실패 {bad}' if bad else ' — 모두 통과'))
sys.exit(1 if bad else 0)
