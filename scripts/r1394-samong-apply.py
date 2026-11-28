#!/usr/bin/env python3
"""R1394 사몽 전용 2D 몹 그림 적용 — Dots SW-2D-R1394 시트를 검사해 webp 로 바꾸고 samong-art-r1394-data.js 를 만든다(PIL 만).
사용: python3 scripts/r1394-samong-apply.py <Dots 결과 폴더> [--apply]
- 몹 번호 → 사몽 이름은 아래 MOBS 표(요청서 SW-2D-R1394 와 같은 순서). 표에 있는 번호 중 시트가 모두(8장) 온 것만 넣는다.
- 칸마다 발 줄(알파>40 아래 끝, R1377 과 같은 잣대)을 feet 로, 서 있는 시트(idle·walk·hit) 몸통 키 중앙값을 vis 로.
- FIX: 시트별 손질(04 walk_down4 의 반투명 흰 번짐 — 몸 알파 150 아래를 지우고 150~225 를 255 로 늘림).
"""
import os, re, sys, json, hashlib
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CELL, FOOT, CX = 512, 488, 256
NAME = re.compile(r'SW-2D-R1394_(\d{2})_(atk|walk|idle|hit)_(up|down|side)(\d+)_r(\d+)\.png$')
NEED = {'idle_side': 4, 'walk_side': 6, 'atk_side': 6, 'hit_side': 3, 'walk_up': 4, 'atk_up': 6, 'walk_down': 4, 'atk_down': 6}
MOBS = {
    '01': ('faceless-applause', '얼굴 없는 남자의 박수'), '02': ('root-spilled-afterimage', '뿌리에서 쏟아진 잔영'),
    '03': ('chalk-escaped-writing', '칠판을 벗어난 글씨'), '04': ('cult-seal', '교주의 인장'),
    '05': ('alien-invader', '외계 침공군'), '06': ('late-footsteps', '정해진 시각에 도착하지 못한 발자국'),
    '07': ('stand-gaze', '관람석의 시선'), '08': ('torn-photo-wraith', '찢어진 사진의 망령'),
    '09': ('paper-king', '종이 왕'), '10': ('city-eating-endings', '서로의 결말을 먹는 도시'),
    '11': ('ending-splice', '결말 접합체'), '12': ('sealed-names', '막힌 이름들'),
    '13': ('wall-clockhand-wreck', '성벽과 시곗바늘의 잔해'), '14': ('false-heaven-guard-angel', '거짓천국 근위천사'),
}

def lift_haze(im, lo=150, hi=225):
    a = im.getchannel('A').point(lambda v: 0 if v < lo else min(255, int((v - lo) * 255 / (hi - lo))))
    im = im.copy(); im.putalpha(a.filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(.6))); return im

FIX = {('04', 'walk_down'): lift_haze}

def rows_body(a):
    w, h = a.size; px = a.load(); rows = [sum(1 for x in range(0, w, 2) if px[x, y]) for y in range(h)]
    m = max(rows) or 1; ys = [y for y, n in enumerate(rows) if n >= m * .12]
    return (ys[-1] - ys[0] + 1) if ys else 0

def check(im, n):
    errs, feet, bodies = [], [], []
    if im.size != (CELL * n, CELL): errs.append(f'크기 {im.size}')
    for i in range(n):
        c = im.crop((i * CELL, 0, i * CELL + CELL, CELL)); a = c.getchannel('A').point(lambda v: 255 if v > 40 else 0); bb = a.getbbox()
        if not bb: errs.append(f'칸 {i} 비었음'); feet.append(FOOT); bodies.append(0); continue
        if any(c.getpixel(p)[3] > 20 for p in ((0, 0), (CELL - 1, 0), (0, CELL - 1), (CELL - 1, CELL - 1))): errs.append(f'칸 {i} 귀퉁이 불투명')
        if abs(bb[3] - FOOT) > 8: errs.append(f'칸 {i} 발 y={bb[3]}')
        feet.append(bb[3]); bodies.append(rows_body(a))
    return errs, feet, bodies

def main():
    src = sys.argv[1]; apply = '--apply' in sys.argv
    by = {}
    for f in sorted(os.listdir(src)):
        m = NAME.search(f)
        if not m or m.group(1) not in MOBS: continue
        key = f'{m.group(2)}_{m.group(3)}'; cur = by.setdefault(m.group(1), {}).get(key)
        if not cur or int(m.group(5)) > int(NAME.search(os.path.basename(cur)).group(5)): by[m.group(1)][key] = os.path.join(src, f)
    out, report = {}, {}
    for num, sheets in sorted(by.items()):
        slug, name = MOBS[num]; R = report[num] = {'name': name, 'errors': [], 'sheets': {}}
        miss = [k for k in NEED if k not in sheets]
        if miss: R['errors'].append('시트 없음 ' + ','.join(miss)); continue
        M = {'name': name, 'anyRef': 1, 'idle': [], 'block': [], 'cell': CELL, 'foot': FOOT, 'cx': CX, 'sheets': {}}; stand = []
        for key, n in NEED.items():
            p = sheets[key]; im = Image.open(p).convert('RGBA')
            if (num, key) in FIX: im = FIX[(num, key)](im)
            errs, feet, bodies = check(im, n); R['errors'] += [f'{key}: {e}' for e in errs]
            R['sheets'][key] = {'src': os.path.basename(p), 'sha256': hashlib.sha256(open(p, 'rb').read()).hexdigest(), 'feet': feet, 'body': bodies}
            if key.split('_')[0] in ('idle', 'walk', 'hit'): stand += bodies
            rel = f'assets/r1394/{num}-{slug}/{key}{n}.webp'; M['sheets'][key] = {'path': rel, 'n': n, 'feet': feet}
            if apply:
                dst = os.path.join(ROOT, 'r96', 'runtime-text', rel); os.makedirs(os.path.dirname(dst), exist_ok=True)
                im.save(dst, 'WEBP', quality=90, method=6)
        stand = sorted(b for b in stand if b > 0); M['vis'] = stand[len(stand) // 2] if stand else 340
        R['vis'] = M['vis']
        if not R['errors']: out['@samong:' + name] = M
    print(json.dumps(report, ensure_ascii=False, indent=1))
    if apply:
        js = ("// R1394 사몽 전용 2D 몹 그림 표 — scripts/r1394-samong-apply.py 가 Dots SW-2D-R1394 결과(검사 통과분)로 만든다.\n"
              "// R1377 방향 그림 표(enemies)에 '@samong:<사몽 이름>' 으로 덧붙인다. mob-dir-art-r1377.js entry() 가 사몽 몹(id 'sm103:')만 이 이름으로 찾는다.\n"
              "(function(){'use strict';const T=window.__STORYWORLD_MOB_DIR_ART_R1377_DATA__;if(!T||!T.enemies)return;const A="
              + json.dumps(out, ensure_ascii=False, separators=(',', ':')) +
              ";for(const k in A)T.enemies[k]=A[k];const N=new Set(Object.keys(A).map(k=>k.slice(8))),nm=e=>String(e&&e.name||'').replace(/^(?:보스격|보스|중간보스|준보스)\\s*·\\s*/,'').replace(/\\s*·\\s*짙은 형상$/,'').trim();"
              "window.__STORYWORLD_SAMONG_ART_R1394__=Object.freeze({rev:'R1394-samong-art-1',names:[...N],covers:e=>!!e&&String(e.id||'').startsWith('sm103:')&&N.has(nm(e))});})();\n")
        open(os.path.join(ROOT, 'r96', 'client-source', 'samong-art-r1394-data.js'), 'w', encoding='utf-8').write(js)
        print('적용', list(out))

if __name__ == '__main__':
    main()
