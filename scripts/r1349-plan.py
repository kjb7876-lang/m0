#!/usr/bin/env python3
"""R1349 전수조사 결과(census 폴더)로 몹 하나의 frames.json 항목 초안을 만든다(사람이 보고 고친 뒤 frames.json 에 넣는다).
사용: python3 scripts/r1349-plan.py <census 폴더> <zone> <nativeId> <key> [이름]  → JSON 한 항목 출력
 - 기준 = 대기 상태에서 가장 많이 그린 칸. 기준 시트는 한 배율 1.
 - 걷기·이동·떠서 이동 시트(move/side/up/down/walk/float 이름) → scaleFrom sheetHeight, 떠서 이동은 안개 때문에 color false.
 - 그 밖 여러 칸 시트 → scaleFrom sheetMass, 한 장 그림(자세 열쇠) → scaleFrom sheetMass + review 표시(눈으로 배율 확인).
"""
import json, os, re, sys
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RT = os.path.join(ROOT, 'r96', 'runtime-text'); SITE = os.path.join(ROOT, 'r96', 'hospital-three-pc', 'site')
def size(p):
    for b in (RT, SITE):
        q = os.path.join(b, p)
        if os.path.exists(q): return Image.open(q).size
    return None
root, z, nid, key = sys.argv[1:5]
M = json.load(open(os.path.join(root, z, 'census.json')))['mobs'][nid]
sheets = {}
for S, L in M['states'].items():
    for o in L:
        k = o['key'].split('|')[0]; parts = k.split(':'); path = parts[0]
        cell = tuple(int(v) for v in parts[1].split(',')) if len(parts) > 1 and re.match(r'^\d+,\d+,\d+,\d+$', parts[1]) else None
        g = sheets.setdefault(path, {'n': 0, 'cells': {}, 'idle': 0})
        g['n'] += o['n']; g['idle'] += o['n'] if S == 'idle' else 0
        c = cell or ('whole',); g['cells'][c] = g['cells'].get(c, 0) + o['n']
tot = sum(g['n'] for g in sheets.values())
refp = max(sheets, key=lambda p: (sheets[p]['idle'], sheets[p]['n']))
def geom(path, g):
    sz = size(path)
    if not sz: return None
    cells = [c for c in g['cells'] if c != ('whole',)]
    if not cells: return {'n': 1, 'W': sz[0], 'H': sz[1]}
    w, h = cells[0][2], cells[0][3]
    if all(c[1] == 0 and c[2] == w and c[3] == h for c in cells) and h == sz[1] and sz[0] % w == 0:
        return {'n': sz[0] // w, 'W': sz[0], 'H': sz[1], 'cw': w}
    return {'rects': sorted([list(c) for c in cells]), 'W': sz[0], 'H': sz[1]}
out = {'name': sys.argv[5] if len(sys.argv) > 5 else M['name'], 'ids': [nid], 'pad': [0.3, 0.2, 0.3], 'frames': [], 'scaleClamp': [0.5, 3.0]}
rg = geom(refp, sheets[refp]); rc = max(sheets[refp]['cells'], key=sheets[refp]['cells'].get)
out['ref'] = refp if rg.get('n', 0) == 1 else {'path': refp, 'rect': list(rc) if rc != ('whole',) else [0, 0, rg['W'], rg['H']]}
for path, g in sorted(sheets.items(), key=lambda kv: -kv[1]['n']):
    if g['n'] < tot * .005: continue
    G = geom(path, g)
    if not G: print('# 그림 없음', path, file=sys.stderr); continue
    base = os.path.splitext(os.path.basename(path))[0]
    F = {'path': path, 'out': f'assets/r1349/mobs/{key}-{base}.webp'}
    if 'rects' in G: F['rects'] = G['rects']
    elif G['n'] > 1: F['n'] = G['n']
    nm = path.lower()
    if path == refp: F.update(ref=True, state='idle', scale=1.0)
    elif re.search(r'(move|side|-up|-down|walk|float|gait)', nm):
        F.update(state='walk', scaleFrom='sheetHeight')
        if 'float' in nm: F.update(color=False, scaleFrom='float', out=F['out'][:-5] + '-float.webp')
    else:
        F.update(state='hit' if 'hit' in nm else 'attack' if re.search(r'(atk|attack|-p[123])', nm) else 'idle', scaleFrom='sheetMass')
        if G.get('n', 0) == 1 and 'rects' not in G: F['review'] = True
    F['draws'] = round(g['n'] / tot, 3)
    out['frames'].append(F)
print(json.dumps({key: out}, ensure_ascii=False))
