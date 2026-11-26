#!/usr/bin/env python3
"""R1337 헤드리스 실측 분석: census.mjs 결과 폴더(전·후)에서 상태별로 그려진 몸 칸의
 · 화면 배율(화면 키 ÷ 그림 칸 키) 퍼짐, · 화면 발 자리(같은 카메라: 대기·공격·피격) 퍼짐, · 좌우(R444 left 와 거울 여부 짝) 일관성
을 재고, 전후 비교 그림(실제 화면 자리 그대로 겹친 칸 줄·GIF)을 만든다.
쓰는 법: python3 r96/qa/r1337/analyze.py <before폴더> <after폴더> <출력폴더>
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
try: FONT = ImageFont.truetype('/usr/share/fonts/opentype/unifont/unifont.otf', 16)
except Exception: FONT = None
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from metrics import measure

NAMES = {'root': '뿌리의 문지기', 'blood': '핏빛 수호로 추격자', 'balrog': '발록',
         'lucifer': '루시퍼', 'mask': '초천사의 웃는 가면', 'angel': '거짓천국 근위천사'}  # R1341 더함


def frames(folder, boss):
    p = os.path.join(folder, boss, 'census.json')
    if not os.path.exists(p): return None
    m = json.load(open(p, encoding='utf-8')); out = []
    for st, fs in m['states'].items():
        for f in fs:
            im = Image.open(os.path.join(folder, boss, f['file'])).convert('RGBA')
            P = f['pts']; h = ((P[3][0] - P[0][0]) ** 2 + (P[3][1] - P[0][1]) ** 2) ** .5
            mm = measure(im)
            u, v = mm['footX'], mm['footY']
            gx = P[0][0] + (P[1][0] - P[0][0]) * u + (P[3][0] - P[0][0]) * v
            gy = P[0][1] + (P[1][1] - P[0][1]) * u + (P[3][1] - P[0][1]) * v
            mir = P[1][0] < P[0][0]
            # 몸통 화면 크기 = 깎은 넓이 제곱근 × (화면 키/그림 키)
            out.append({'state': st, 'key': f['key'], 'n': f['n'], 'im': im, 'pts': P, 'scale': h / im.height,
                        'body': mm['mass'] * h / im.height, 'foot': (gx, gy), 'mir': mir, 'face': f.get('face', {})})
    return out


def spread(vals):
    return (max(vals) / min(vals) - 1) if vals and min(vals) > 0 else 0


def wq(pairs, q):
    pairs = sorted(pairs); tot = sum(w for _, w in pairs); acc = 0
    for v, w in pairs:
        acc += w
        if acc >= q * tot: return v
    return pairs[-1][0]


def stats(fr):
    # 처음 본 순간의 네 점만 기록되므로(등장 연출 등) 화면 밖 발은 빼고, 그려진 횟수로 가중한 5~95% 폭을 본다.
    # 떠서 이동(r1029 float) 칸은 그림 밀도가 달라 배율 비교에서 뺀다.
    ok_ = [f for f in fr if 0 <= f['foot'][0] <= 960 and 0 <= f['foot'][1] <= 540]
    art = [f for f in ok_ if '/r1029/float/' not in f['key']]
    sc = [(f['scale'], f['n']) for f in art]; bd = [(f['body'], f['n']) for f in art]
    bad_face = 0; tot_face = 0
    for f in fr:
        for k, c in f['face'].items():
            tot_face += c
            if k in ('Ln', 'Rm'): bad_face += c
    walk = [f for f in fr if f['state'] == 'walk']; wsum = sum(f['n'] for f in walk) or 1
    return {'kinds': len(fr), 'scaleP5': round(wq(sc, .05), 4), 'scaleP95': round(wq(sc, .95), 4), 'scaleSpread': round(wq(sc, .95) / wq(sc, .05) - 1, 4),
            'scaleMinMax': [round(min(v for v, _ in sc), 4), round(max(v for v, _ in sc), 4)],
            'bodySpread': round(wq(bd, .95) / wq(bd, .05) - 1, 4),
            'faceFlipShare': round(bad_face / tot_face, 4) if tot_face else 0,
            'walkArt': {k: round(sum(f['n'] for f in walk if k in f['key']) / wsum, 3) for k in ('walk6', 'r1029/float', '-p1', '-p2', '-p3', '-p4', 'idle6')}}


def pick(fr, per=4):
    # 상태마다 가장 많이 그려진 칸 per 개(화면 밖 발 제외) — 그림이 너무 길어지지 않게
    out = []
    for st in ('idle', 'walk', 'attack', 'hit'):
        xs = sorted([f for f in fr if f['state'] == st and 0 <= f['foot'][0] <= 960 and 0 <= f['foot'][1] <= 540], key=lambda f: -f['n'])[:per]
        out += xs
    return out or fr


def screen_cell(f, zoom=2):
    # 실제 화면 크기·좌우 그대로의 그림과, 그 안의 발 자리(px)
    P = f['pts']; xs = [p[0] for p in P[:4]]; ys = [p[1] for p in P[:4]]
    w, h = max(xs) - min(xs), max(ys) - min(ys)
    im = f['im'].resize((max(1, int(w * zoom)), max(1, int(h * zoom))))
    if f['mir']: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    return im, ((f['foot'][0] - min(xs)) * zoom, (f['foot'][1] - min(ys)) * zoom)


def strip(fr, title, zoom=1.2):
    # 칸마다 그 칸의 발을 빨간 기준선 가운데에 놓는다 — 화면 크기(같은 카메라 배율 ×1.2)·몸 크기·좌우를 나란히 본다
    sel = pick(fr)
    cs = [screen_cell(f, zoom) for f in sel]
    W = int(max(c[0].width for c in cs) * .78) + 8; H = int(max(c[1][1] for c in cs)) + 50
    C = Image.new('RGBA', (len(sel) * W + 10, H + 24), (214, 208, 196, 255)); d = ImageDraw.Draw(C)
    base = H - 14
    for i, f in enumerate(sel):
        im, (fx, fy) = cs[i]
        lay = Image.new('RGBA', C.size, (0, 0, 0, 0)); lay.paste(im, (int(i * W + W // 2 - fx), int(base - fy))); C.alpha_composite(lay)
        d.text((i * W + 4, H + 4), f"{f['state']} {f['key'].split('|')[0].split('/')[-1][:16]}", fill=(0, 0, 0, 255), font=FONT)
    d.line((0, base, C.width, base), fill=(200, 0, 0, 255))
    d.text((4, 4), title, fill=(0, 0, 0, 255), font=FONT)
    return C


def main():
    bdir, adir, out = sys.argv[1:4]; os.makedirs(out, exist_ok=True); res = {}
    for boss, label in NAMES.items():
        b, a = frames(bdir, boss), frames(adir, boss)
        if not b or not a: continue
        res[boss] = {'before': stats(b), 'after': stats(a)}
        sb, sa = strip(b, label + ' 전(같은 카메라 ×1.2, 빨간 선 = 그 칸의 발)'), strip(a, label + ' 후')
        W = max(sb.width, sa.width); C = Image.new('RGBA', (W, sb.height + sa.height + 6), (255, 255, 255, 255))
        C.alpha_composite(sb, (0, 0)); C.alpha_composite(sa, (0, sb.height + 6)); C.convert('RGB').save(os.path.join(out, f'{boss}-before-after.jpg'), quality=88)
        # GIF: 상태 순서대로 칸을 같은 화면 자리에 이어 그림(전·후 나란히)
        gif = []; pb, pa = pick(b, 6), pick(a, 6)
        cb = [screen_cell(f, 1.2) for f in pb + pa]; GW = int(max(c[0].width for c in cb) * .8) + 20; GH = int(max(c[1][1] for c in cb)) + 50
        for k in range(max(len(pb), len(pa))):
            g = Image.new('RGBA', (GW * 2, GH), (214, 208, 196, 255)); d = ImageDraw.Draw(g)
            for j, (f, tag) in enumerate(((pb[k % len(pb)], '전'), (pa[k % len(pa)], '후'))):
                im, (fx, fy) = screen_cell(f, 1.2)
                lay = Image.new('RGBA', g.size, (0, 0, 0, 0)); lay.paste(im, (int(j * GW + GW // 2 - fx), int(GH - 20 - fy))); g.alpha_composite(lay)
                d.text((j * GW + 6, 6), f"{label} {tag} · {f['state']}", fill=(0, 0, 0, 255), font=FONT)
            d.line((0, GH - 20, GW * 2, GH - 20), fill=(200, 0, 0, 255))
            gif.append(g.convert('P', palette=Image.ADAPTIVE))
        gif[0].save(os.path.join(out, f'{boss}-before-after.gif'), save_all=True, append_images=gif[1:], duration=260, loop=0)
    json.dump(res, open(os.path.join(out, 'stats.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps(res, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
