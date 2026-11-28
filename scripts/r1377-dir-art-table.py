#!/usr/bin/env python3
"""R1377 상·하·옆 그림 표 만들기(PIL 만).
census(qa/r1377/census.mjs 결과 폴더)에서 몹마다 대기 그림 칸(경로·칸)을 읽고, 사이트 자산에서 몸통 키·알파 상자를 재어
qa/r1377/dir-art.json 의 block·sheets 와 합쳐 r96/client-source/mob-dir-art-r1377-data.js 를 쓴다.
몸통 키 = 불투명 폭이 가장 넓은 줄의 12% 이상인 줄의 위~아래(칼끝·꼬리 같은 가는 부분 뺌, R974·Dots 요청서와 같은 잣대).
쓰는 법: python3 scripts/r1377-dir-art-table.py <census 폴더> [--site r96/hospital-three-pc/site]
"""
import json, os, sys
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = os.path.join(ROOT, 'r96', 'qa', 'r1377', 'dir-art.json')
OUT = os.path.join(ROOT, 'r96', 'client-source', 'mob-dir-art-r1377-data.js')

def body(im):
    a = im.getchannel('A').point(lambda v: 255 if v > 40 else 0)
    bb = a.getbbox()
    if not bb: return None
    w, h = a.size; px = a.load(); rows = []
    for y in range(h):
        n = 0
        for x in range(0, w, 2):
            if px[x, y]: n += 1
        rows.append(n)
    m = max(rows) or 1; ys = [y for y, n in enumerate(rows) if n >= m * .12]
    return ys[-1] - ys[0] + 1, list(bb)

def main():
    cen = sys.argv[1]; site = os.path.join(ROOT, 'r96', 'hospital-three-pc', 'site')
    if '--site' in sys.argv: site = sys.argv[sys.argv.index('--site') + 1]
    cfg = json.load(open(CFG, encoding='utf-8')); out = {}
    for M in cfg['mobs']:
        d = json.load(open(os.path.join(cen, M['zone'], 'census.json')))['mobs'][M['id']]
        idle = []
        for o in sorted(d['states'].get('idle', []), key=lambda o: -o['n']):
            if o['n'] < 2: continue
            k = o['key'].split('|')[0].split(':'); p = k[0]
            if p.startswith('r409') or any(b in p for b in M.get('block', [])): continue
            r = [round(float(v)) for v in k[1].split(',')] if len(k) > 1 and k[1] else None
            f = os.path.join(site, p)
            if not os.path.exists(f): print('없음', p); continue
            im = Image.open(f).convert('RGBA')
            if not r: r = [0, 0, im.width, im.height]
            b = body(im.crop((r[0], r[1], r[0] + r[2], r[1] + r[3])))
            if not b: continue
            I = {'path': p, 'rect': r, 'body': b[0], 'bbox': b[1]}
            if I not in idle: idle.append(I)
        if not idle: print('대기 그림 없음', M['id']); continue
        # Dots 시트는 그 지역 인물 전용(같은 nativeId 가 다른 지역에선 다른 인물일 수 있다) → '<id>@<지역>'
        key = M['id'] + '@' + M['zone'] if M.get('sheets') else M['id']
        E = out.setdefault(key, {'name': M['name'], 'idle': [], 'cell': 512, 'foot': 488, 'cx': 256, 'vis': M.get('vis', 340), 'sheets': M.get('sheets', {}), 'block': []})
        for I in idle:
            if I not in E['idle']: E['idle'].append(I)
        # 엔진이 e.attack 없이 공격 그림만 바꾸는 몹(눈으로 확인해 dir-art.json 에 적은 그림 이름 조각) → atkArt
        if M.get('atkArt'): E['atkArt'] = list(M['atkArt'])
        for b in M.get('block', []):
            if b not in E['block']: E['block'].append(b)
    head = open(OUT, encoding='utf-8').read().split('window.__STORYWORLD_MOB_DIR_ART_R1377_DATA__=')[0]
    js = head + 'window.__STORYWORLD_MOB_DIR_ART_R1377_DATA__=' + json.dumps({'rev': 'R1377-dir-art-1', 'enemies': out}, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(OUT, 'w', encoding='utf-8').write(js); print(len(out), 'mobs →', OUT)

if __name__ == '__main__': main()
