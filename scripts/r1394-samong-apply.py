#!/usr/bin/env python3
"""R1394 사몽 전용 2D 몹 그림 적용 — Dots SW-2D-R1394 시트를 검사해 webp 로 바꾸고 samong-art-r1394-data.js 를 만든다(PIL 만).
사용: python3 scripts/r1394-samong-apply.py <Dots 결과 폴더> [--apply]
- 몹 번호 → 사몽 이름은 아래 MOBS 표(요청서 SW-2D-R1394 와 같은 순서). 표에 있는 번호 중 시트가 모두(8장) 온 것만 넣는다.
- 칸마다 발 줄(알파>40 아래 끝, R1377 과 같은 잣대)을 feet 로, 서 있는 시트(idle·walk·hit) 몸통 키 중앙값을 vis 로.
- 폴더 이름(slug)에 R1369 몸 겹침 이펙트 낱말(guard·halo·aura·shield·veil·cloak·hurt 등)을 쓰지 않는다 — 몸 그림이 이펙트로 읽혀 알파 0.3 아래로 옅어진다(14 근위천사 실측).
- FIX: 시트별 손질(04 walk_down4 의 반투명 흰 번짐 — 몸 알파 150 아래를 지우고 150~225 를 255 로 늘림; 06 밝은 테·아래 공격 큰 구두 0.5배·위 공격 파편 벌림).
"""
import os, re, sys, json, hashlib
from PIL import Image, ImageFilter, ImageChops, ImageDraw

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
    '13': ('wall-clockhand-wreck', '성벽과 시곗바늘의 잔해'), '14': ('false-heaven-sentry-angel', '거짓천국 근위천사'),
}

def lift_haze(im, lo=150, hi=225):
    a = im.getchannel('A').point(lambda v: 0 if v < lo else min(255, int((v - lo) * 255 / (hi - lo))))
    im = im.copy(); im.putalpha(a.filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(.6))); return im

def shrink_step_shoe(im, frames=(3, 4), box=(96, 308, 284, 490), donor=2, k=.5):
    """06 atk_down 내딛는 큰 구두(칸 3·4 왼쪽 아래)를 k 배로 줄여 같은 발 자리(밑 가운데)에 두고, 빈 자리는 칸 donor 의 같은 영역으로 채운다."""
    im = im.copy()
    for f in frames:
        ox = f * CELL; x0, y0, x1, y1 = box
        shoe = im.crop((ox + x0, y0, ox + x1, y1))
        cell = im.crop((ox, 0, ox + CELL, CELL)); don = im.crop((donor * CELL, 0, donor * CELL + CELL, CELL))
        m = Image.new('L', (CELL, CELL), 0); m.paste(255, (x0 + 10, y0 + 10, x1 - 10, CELL)); m = m.filter(ImageFilter.GaussianBlur(7))
        mix = Image.composite(don, cell, m); a = mix.getchannel('A')
        a = Image.composite(a.point(lambda v: 0 if v < 110 else v), a, m.point(lambda v: 255 if v > 8 else 0)); mix.putalpha(a)
        im.paste(mix, (ox, 0))  # 큰 구두 자리를 칸 donor 로 부드럽게(경계 실 끊김 없이) 메움
        bb = shoe.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
        s = shoe.crop(bb); w, h = s.size; s = s.resize((max(1, int(w * k)), max(1, int(h * k))), Image.LANCZOS)
        cx = x0 + (bb[0] + bb[2]) / 2; bottom = y0 + bb[3]
        im.alpha_composite(s, (int(ox + cx - s.width / 2), int(bottom - s.height)))
    return im
def rim_light(im, w=4, amt=.38, col=(214, 206, 188), lift=.88):
    """작은 화면에서 어두운 구두가 바닥에 묻히지 않게: 알파 가장자리 w px 에 밝은 테, 몸 전체 명도 감마 lift."""
    r, g, b, a = im.split()
    lut = [int(255 * (v / 255) ** lift) for v in range(256)]
    r, g, b = (c.point(lut) for c in (r, g, b))
    hard = a.point(lambda v: 255 if v > 160 else 0)
    thick = hard.filter(ImageFilter.MinFilter(11)).filter(ImageFilter.MaxFilter(11))  # 실(가는 선)은 빼고 구두·파편 덩어리만
    edge = ImageChops.subtract(thick, thick.filter(ImageFilter.MinFilter(2 * w + 1))).filter(ImageFilter.GaussianBlur(1))
    edge = ImageChops.multiply(edge, hard)
    edge = edge.point(lambda v: int(v * amt))
    base = Image.merge('RGB', (r, g, b)); light = Image.new('RGB', im.size, col)
    out = Image.composite(light, base, edge); out.putalpha(a); return out
def up_attack_flare(im, spread=(1, 1.08, 1.22, 1.34, 1.3, 1.06), rise=(1, 1.02, 1.06, 1.1, 1.08, 1.01)):
    """06 atk_up: 위(등 쪽)에서는 실 기둥만 보여 공격이 안 읽힘 → 내딛는 칸일수록 위쪽 시계 파편을 좌우로 벌리고(행마다 가로 배율, 위로 갈수록 커짐) 기둥을 발 기준으로 위로 늘린다."""
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    for f in range(im.width // CELL):
        c = im.crop((f * CELL, 0, f * CELL + CELL, CELL)); bb = c.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
        if not bb: continue
        top, h = bb[1], bb[3] - bb[1]; cx = (bb[0] + bb[2]) / 2; sp = spread[f]
        w = Image.new('RGBA', c.size, (0, 0, 0, 0))
        for y in range(CELL):
            t = min(1, max(0, (top + h * .45 - y) / (h * .4)))  # 몸 위 45% 에서 시작해 꼭대기에서 최대
            k = 1 + (sp - 1) * t * t * (3 - 2 * t)
            row = c.crop((0, y, CELL, y + 1))
            if k == 1: w.paste(row, (0, y)); continue
            nw = int(CELL * k); r2 = row.resize((nw, 1), Image.BICUBIC); w.alpha_composite(r2.crop((int(cx * k - cx), 0, int(cx * k - cx) + CELL, 1)), (0, y))
        if rise[f] != 1:
            nh = int(CELL * rise[f]); w2 = w.resize((CELL, nh), Image.BICUBIC); w = w2.crop((0, nh - CELL, CELL, CELL)) if FOOT == CELL else w2.crop((0, int(FOOT * rise[f]) - FOOT, CELL, int(FOOT * rise[f]) - FOOT + CELL))
        out.paste(w, (f * CELL, 0))
    return out

def shrink_blob(im, f, box, donor, k=.5, open_px=41):
    """칸 f 의 box 안 큰 덩어리(가는 실·작은 구두는 열림 연산으로 빠짐)만 골라 k 배로 줄여 같은 가운데에 두고, 원래 자리는 칸 donor 로 메운다."""
    im = im.copy(); ox = f * CELL
    cell = im.crop((ox, 0, ox + CELL, CELL)); don = im.crop((donor * CELL, 0, donor * CELL + CELL, CELL))
    hard = cell.getchannel('A').point(lambda v: 255 if v > 120 else 0)
    lim = Image.new('L', (CELL, CELL), 0); lim.paste(255, box)
    blob = ImageChops.multiply(hard.filter(ImageFilter.MinFilter(open_px)).filter(ImageFilter.MaxFilter(open_px)), lim)
    take = blob.filter(ImageFilter.MaxFilter(9))  # 덩어리 + 가장자리
    shoe = cell.copy(); shoe.putalpha(ImageChops.multiply(cell.getchannel('A'), take))
    m = take.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(4))
    mix = Image.composite(don, cell, m); a = mix.getchannel('A')
    a = Image.composite(a.point(lambda v: 0 if v < 110 else v), a, m.point(lambda v: 255 if v > 8 else 0)); mix.putalpha(a)
    im.paste(mix, (ox, 0))
    bb = shoe.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    if not bb: return im
    s = shoe.crop(bb); s = s.resize((max(1, int(s.width * k)), max(1, int(s.height * k))), Image.LANCZOS)
    cx = (bb[0] + bb[2]) / 2; cy = (bb[1] + bb[3]) / 2
    im.alpha_composite(s, (int(ox + cx - s.width / 2), int(cy - s.height / 2))); return im
def walk_down_fix(im):
    im = shrink_blob(im, 0, (110, 225, 260, 400), 1); return shrink_blob(im, 2, (220, 255, 380, 410), 3)

def paper_ink(im, w=9, ink=(26, 24, 28), amt=.42, gamma=1.13, hole=(14, 12, 16, 215)):
    """08 찢어진 사진의 망령(QA 8.62): 작은 화면에서 회색 유령으로만 읽힘 → 종이 오린 자국 같은 어두운 테, 몸 안 사진 대비(국소 대비+감마), 찢긴 얼굴 구멍을 먹색으로 메움."""
    r, g, b, a = im.split(); rgb = Image.merge('RGB', (r, g, b))
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=14, percent=70, threshold=2))
    lut = [int(255 * (v / 255) ** gamma) for v in range(256)]; rgb = rgb.point(lut * 3)
    hard = a.point(lambda v: 255 if v > 90 else 0)
    edge = ImageChops.subtract(hard, hard.filter(ImageFilter.MinFilter(2 * w + 1))).filter(ImageFilter.GaussianBlur(1.5)).point(lambda v: int(v * amt))
    rgb = Image.composite(Image.new('RGB', im.size, ink), rgb, edge)
    out = rgb.copy(); out.putalpha(a)
    # 구멍: 칸마다 바깥에서 닿지 않는 투명 영역(작은 틈 제외) = 몸에 둘러싸인 얼굴 구멍
    for f in range(im.width // CELL):
        m = hard.crop((f * CELL, 0, f * CELL + CELL, CELL)).filter(ImageFilter.MaxFilter(3)).convert('L')
        fl = m.copy(); ImageDraw.floodfill(fl, (0, 0), 128)
        holes = fl.point(lambda v: 255 if v == 0 else 0)
        bb = holes.getbbox()
        if not bb: continue
        holes = holes.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(7))  # 실 같은 틈은 버림
        fill = Image.new('RGBA', (CELL, CELL), hole); fill.putalpha(holes.point(lambda v: hole[3] if v else 0).filter(ImageFilter.GaussianBlur(1)))
        cell = out.crop((f * CELL, 0, f * CELL + CELL, CELL)); cell = Image.alpha_composite(fill, cell); out.paste(cell, (f * CELL, 0))
    return out

# 06 발자국(QA 8.30 → R1377 8.7 손질): 모든 시트 밝은 테(작은 화면에서 구두 광택), 아래 공격 큰 구두 줄임, 위 공격 파편 벌림·기둥 늘림
FIX = {('04', 'walk_down'): lift_haze, **{('06', k): rim_light for k in NEED},
       ('06', 'atk_down'): lambda im: rim_light(shrink_step_shoe(im)), ('06', 'atk_up'): lambda im: rim_light(up_attack_flare(im)),
       ('06', 'walk_down'): lambda im: rim_light(walk_down_fix(im))}  # 재심사 8.65: 아래 걷기 0·2칸 큰 구두도 0.5배
FIX.update({('08', k): paper_ink for k in NEED})  # 08 QA 8.62: 어두운 테·사진 대비·얼굴 구멍 먹색

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
