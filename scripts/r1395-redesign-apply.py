#!/usr/bin/env python3
"""R1395 2D 전면 재설계 몹 적용 — Dots SW-2D-R1395 필수 시트(walk·atk × side·up·down)를 검사해 webp 로 바꾸고 mob-2d-r1395-data.js 를 만든다(PIL 만).
사용: python3 scripts/r1395-redesign-apply.py <Dots 결과 폴더> [--apply]
- MOBS: 번호 → (영문, 엔진 nativeId, 지역, 이름). 표 키는 '<nativeId>@<지역>' 이라 같은 id 를 쓰는 다른 지역·사몽 몹에는 번지지 않는다.
- 7분야 심사(보스·중간보스 9.0) 통과분만 MOBS 에 넣는다. 002·003 은 Dots r2 대기라 아직 넣지 않음.
- 표 full=1(옛 엔진 원화 대신 새 시트 중립 칸으로 대기·피격), anyRef=1(지금 몸 그림 알파 키·발 줄 기준 — 화면 크기 그대로).
- FIX: 006 atk_down 3·4칸이 다른 칸보다 약 20% 커 보여(카메라 쪽으로 들이밀며 축척이 커짐) 발 줄 기준으로 0.9배.
"""
import os, re, sys, json, hashlib
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CELL, FOOT, CX = 512, 488, 256
NAME = re.compile(r'SW-2D-R1395_(\d{3})_(atk|walk|idle|hit)_(up|down|side)(\d+)_r(\d+)\.png$')
NEED = {'walk_side': 6, 'atk_side': 6, 'walk_up': 4, 'atk_up': 6, 'walk_down': 4, 'atk_down': 6}
OPT = {'idle_side': 4, 'hit_side': 3}
MOBS = {
    '001': ('violet-sword-pursuer-angel', 'mb-dist01', 'dist01', '보라검천사'),
    '004': ('echo-of-pride-gate72', 'mb-ep1b01', 'ep1b01', '교만의 잔향 · 제72문'),
    '005': ('man-consumed-by-sloth', 'b02-boss', 'ep1b02', '나태에 잠식된 남자'),
    '006': ('sloth-shell-warden', 'mb-ep1b02', 'ep1b02', '나태의 껍데기 파수'),
}

def shrink(cells, k=.9):
    def f(im):
        out = im.copy()
        for i in cells:
            c = im.crop((i * CELL, 0, i * CELL + CELL, CELL)); w = round(CELL * k)
            s = c.resize((w, w), Image.LANCZOS); n = Image.new('RGBA', (CELL, CELL))
            n.paste(s, (round(CX - CX * k), round(FOOT - FOOT * k)), s); out.paste(n, (i * CELL, 0))
        return out
    return f

FIX = {('006', 'atk_down'): shrink([3, 4])}

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
        if abs(bb[3] - FOOT) > 18: errs.append(f'칸 {i} 발 y={bb[3]}')
        feet.append(min(CELL, bb[3])); bodies.append(rows_body(a))
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
        slug, nid, zone, name = MOBS[num]; R = report[num] = {'name': name, 'key': f'{nid}@{zone}', 'errors': [], 'sheets': {}}
        miss = [k for k in NEED if k not in sheets]
        if miss: R['errors'].append('시트 없음 ' + ','.join(miss)); continue
        M = {'name': name, 'r1395': num, 'full': 1, 'anyRef': 1, 'idle': [], 'block': [], 'cell': CELL, 'foot': FOOT, 'cx': CX, 'sheets': {}}; stand = []
        for key, n in {**NEED, **{k: v for k, v in OPT.items() if k in sheets}}.items():
            p = sheets[key]; im = Image.open(p).convert('RGBA')
            if (num, key) in FIX: im = FIX[(num, key)](im)
            errs, feet, bodies = check(im, n); R['errors'] += [f'{key}: {e}' for e in errs]
            R['sheets'][key] = {'src': os.path.basename(p), 'sha256': hashlib.sha256(open(p, 'rb').read()).hexdigest(), 'feet': feet, 'body': bodies}
            if key.split('_')[0] in ('idle', 'walk', 'hit'): stand += bodies
            rel = f'assets/r1395/{num}-{slug}/{key}{n}.webp'; M['sheets'][key] = {'path': rel, 'n': n, 'feet': feet}
            if apply:
                dst = os.path.join(ROOT, 'r96', 'runtime-text', rel); os.makedirs(os.path.dirname(dst), exist_ok=True)
                im.save(dst, 'WEBP', quality=88, method=6)
        stand = sorted(b for b in stand if b > 0); M['vis'] = stand[len(stand) // 2] if stand else 340
        R['vis'] = M['vis']
        if not R['errors']: out[f'{nid}@{zone}'] = M
    print(json.dumps(report, ensure_ascii=False, indent=1))
    if apply:
        js = ("// R1395 2D 전면 재설계 몹 표 — scripts/r1395-redesign-apply.py 가 Dots SW-2D-R1395 결과(검사·심사 통과분)로 만든다.\n"
              "// 사용자 2026-11-28 \"영웅제외하고 모든몹 2d로 … 원점부터 재설계 … 상하옆 … 공격과이동모션은 필수이고 일관성이 중요\".\n"
              "// R1377 방향 그림 표(enemies)에 '<nativeId>@<지역>' 으로 덧붙인다(그 지역의 그 몹만). full=1 → 대기·피격도 새 시트 중립 칸(mob-dir-art-r1377.js).\n"
              "(function(){'use strict';const T=window.__STORYWORLD_MOB_DIR_ART_R1377_DATA__;if(!T||!T.enemies)return;const A="
              + json.dumps(out, ensure_ascii=False, separators=(',', ':')) +
              ";for(const k in A)T.enemies[k]=A[k];window.__STORYWORLD_MOB_2D_R1395__=Object.freeze({rev:'R1395-redesign-1',keys:Object.keys(A)});})();\n")
        open(os.path.join(ROOT, 'r96', 'client-source', 'mob-2d-r1395-data.js'), 'w', encoding='utf-8').write(js)
        print('적용', list(out))

if __name__ == '__main__':
    main()
