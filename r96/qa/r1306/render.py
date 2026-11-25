#!/usr/bin/env python3
"""R1306 대기 vs 공격 비교판·수치표 만들기.
capture.mjs 가 적은 rows-<영웅>.json 을 읽어, 실제 게임이 그린 그대로(경로·sourceRect·points·좌우 뒤집기)
영웅 발(project) 기준으로 다시 그린다. 칸마다 빨간 선 = 발(바닥), 파란 선 = 대기 머리 높이(중앙값).
수치: 불투명 픽셀 기준 키(px)·발 위치(바닥 - 불투명 맨 아래)·몸 가운데 x·평균 색(RGB)·보이는 방향(e/w).
python3 r96/qa/r1306/render.py <rows 폴더> <site 폴더> <출력 폴더>
"""
import json, sys, os, glob, statistics as st
from PIL import Image, ImageDraw, ImageFont

ROWS, SITE, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
S = 4  # 보기 배율
CW, CH = 96, 74  # 칸(게임 px)
EXCL = ('barrier', 'shadow', 'aura', '/fx', 'fx-', 'glow', 'ring', 'halo', 'summon')
_cache = {}


def img(src):
    if src not in _cache:
        _cache[src] = Image.open(os.path.join(SITE, src)).convert('RGBA')
    return _cache[src]


def body(r):
    best, bh = None, 0
    for i in r['imgs']:
        if any(k in i['src'] for k in EXCL) or i.get('comp') not in (None, 'source-over'):
            continue
        h = abs(i['pts'][3][1] - i['pts'][0][1])
        if h > bh:
            best, bh = i, h
    return best


def place(i, q):
    p0, p1, p3 = i['pts'][0], i['pts'][1], i['pts'][3]
    w, h = abs(p1[0] - p0[0]), p3[1] - p0[1]
    mir = p1[0] < p0[0]
    x0 = min(p0[0], p1[0]) - q[0]
    y0 = p0[1] - q[1]
    im = img(i['src'])
    if i['sr']:
        sx, sy, sw, sh = i['sr']
        im = im.crop((round(sx), round(sy), round(sx + sw), round(sy + sh)))
    im = im.resize((max(1, round(w * S)), max(1, round(h * S))), Image.LANCZOS)
    if mir:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    return im, x0, y0, mir


def metrics(im, x0, y0):
    a = im.getchannel('A').point(lambda v: 255 if v > 40 else 0)
    bb = a.getbbox()
    if not bb:
        return None
    px = [p for p, al in zip(im.get_flattened_data() if hasattr(im,'get_flattened_data') else im.getdata(), a.get_flattened_data() if hasattr(a,'get_flattened_data') else a.getdata()) if al]
    n = len(px)
    col = tuple(round(sum(c[k] for c in px) / n) for k in range(3))
    top = y0 + bb[1] / S
    bot = y0 + bb[3] / S
    return {'top': round(top, 1), 'bot': round(bot, 1), 'h': round(bot - top, 1), 'w': round((bb[2] - bb[0]) / S, 1),
            'cx': round(x0 + (bb[0] + bb[2]) / 2 / S, 1), 'col': col}


def uniq(rows, tag, act):
    seen, out = set(), []
    for r in rows:
        if r['tag'].split('|')[1] != tag or r['act'] != act:
            continue
        b = body(r)
        if not b:
            continue
        k = (b['src'], tuple(b['sr'] or ()), b['pts'][1][0] < b['pts'][0][0])
        if k in seen:
            continue
        seen.add(k)
        out.append((r, b))
    return out


try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', 22)
except Exception:
    try:
        FONT = ImageFont.truetype(glob.glob('/usr/share/fonts/**/*CJK*', recursive=True)[0], 18)
    except Exception:
        FONT = ImageFont.load_default()

try:
    SMALL = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', 16)
except Exception:
    SMALL = FONT
summary = {}
for fn in sorted(glob.glob(os.path.join(ROWS, 'rows-*.json'))):
    hero = fn.split('rows-')[1][:-5]
    rows = json.load(open(fn))
    groups = [('대기 오른쪽', 'idleE', 'idle'), ('공격 오른쪽', 'A:e', 'attack'), ('대기 왼쪽', 'idleW', 'idle'), ('공격 왼쪽', 'A:w', 'attack')]
    data = {}
    for lab, tag, act in groups:
        fr = uniq(rows, tag, act)[:10]
        ms = []
        for r, b in fr:
            im, x0, y0, mir = place(b, r['q'])
            m = metrics(im, x0, y0)
            if m:
                m.update(src=b['src'], sr=b['sr'], mir=mir, im=im, x0=x0, y0=y0)
                ms.append(m)
        data[lab] = ms
    idle = data['대기 오른쪽'] + data['대기 왼쪽']
    ih = st.median([m['h'] for m in idle]) if idle else 0
    itop = st.median([m['top'] for m in idle]) if idle else 0
    ncol = max(1, max(len(v) for v in data.values()))
    sheet = Image.new('RGBA', ((CW * ncol) * S + 160, (CH * 4 + 10) * S), (58, 58, 64, 255))
    d = ImageDraw.Draw(sheet)
    for gi, (lab, _, _) in enumerate(groups):
        oy = gi * CH * S
        d.text((6, oy + 10), lab, fill=(255, 255, 255), font=FONT)
        for ci, m in enumerate(data[lab]):
            ox = 160 + ci * CW * S
            fx, fy = ox + CW * S // 2, oy + (CH - 8) * S
            d.rectangle([ox + 2, oy + 2, ox + CW * S - 2, oy + CH * S - 2], outline=(90, 90, 98))
            sheet.alpha_composite(m['im'], (round(fx + m['x0'] * S), round(fy + m['y0'] * S)))
            d.line([ox, fy, ox + CW * S, fy], fill=(230, 60, 60), width=1)
            d.line([ox, fy + itop * S, ox + CW * S, fy + itop * S], fill=(80, 140, 255), width=1)
            d.line([fx, fy - 6, fx, fy + 6], fill=(230, 60, 60), width=1)
            nm = m['src'].split('/')[-3] + '/' + m['src'].split('/')[-1].split('.')[0]
            d.text((ox + 6, oy + 4), f"{ci+1}. {nm}{' ⇄' if m['mir'] else ''}  키{m['h']:.0f}", fill=(220, 220, 220), font=SMALL)
    sheet.convert('RGB').save(os.path.join(OUT, f'compare-{hero}.png'))
    # 머리 확대(같은 배율): 대기 오른쪽 첫 칸 + 공격 오른쪽 전 칸 — 몸 비율(머리 크기) 비교용
    heads = []
    for lab in ('대기 오른쪽', '공격 오른쪽'):
        for m in data[lab][:5]:
            im = m['im']; A = im.getchannel('A')
            w0, h0 = im.size; top = None
            for y in range(h0):
                row = [A.getpixel((x, y)) > 60 for x in range(w0)]
                if sum(row) >= 5 * S:
                    top = y; xs = [x for x in range(w0) if row[x]]; break
            if top is None:
                continue
            xs = []
            for y in range(top, min(h0, top + 10 * S)):
                xs += [x for x in range(w0) if A.getpixel((x, y)) > 60]
            cx = int(st.median(xs))
            heads.append((lab[:2], im.crop((cx - 14 * S, top - 2 * S, cx + 14 * S, top + 20 * S))))
    if heads:
        hs = Image.new('RGBA', (len(heads) * 28 * S * 2 + 10, 22 * S * 2 + 40), (58, 58, 64, 255)); hd = ImageDraw.Draw(hs)
        for i, (lab, c) in enumerate(heads):
            c2 = c.resize((c.size[0] * 2, c.size[1] * 2), Image.LANCZOS)
            hs.alpha_composite(c2, (i * 28 * S * 2 + 5, 36)); hd.text((i * 28 * S * 2 + 10, 4), lab, fill=(230, 230, 230), font=FONT)
        hs.convert('RGB').save(os.path.join(OUT, f'heads-{hero}.png'))

    def agg(ms):
        if not ms:
            return None
        return {'n': len(ms), 'h': round(st.median([m['h'] for m in ms]), 1), 'hmin': min(m['h'] for m in ms), 'hmax': max(m['h'] for m in ms),
                'w': round(st.median([m['w'] for m in ms]), 1), 'bot': round(st.median([m['bot'] for m in ms]), 1),
                'cx': round(st.median([m['cx'] for m in ms]), 1),
                'col': tuple(round(st.median([m['col'][k] for m in ms])) for k in range(3)),
                'srcs': sorted({m['src'] + (' (반전)' if m['mir'] else '') for m in ms})}
    summary[hero] = {lab: agg(v) for lab, v in data.items()}
    summary[hero]['idleH'] = ih
json.dump(summary, open(os.path.join(OUT, 'summary.json'), 'w'), ensure_ascii=False, indent=1)
for h, s in summary.items():
    print('==', h, 'idleH', s['idleH'])
    for k, v in s.items():
        if k != 'idleH' and v:
            print('  ', k, {x: v[x] for x in ('n', 'h', 'hmin', 'hmax', 'w', 'bot', 'cx', 'col')}, v['srcs'])
