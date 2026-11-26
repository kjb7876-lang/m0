#!/usr/bin/env python3
"""R1337 헤드리스 실측 분석: census.mjs 결과 폴더(전·후)에서 상태별로 그려진 몸 칸의
 · 화면 배율(화면 키 ÷ 그림 칸 키) 퍼짐, · 화면 발 자리(같은 카메라: 대기·공격·피격) 퍼짐, · 좌우(R444 left 와 거울 여부 짝) 일관성
을 재고, 전후 비교 그림(실제 화면 자리 그대로 겹친 칸 줄·GIF)을 만든다.
쓰는 법: python3 r96/qa/r1337/analyze.py <before폴더> <after폴더> <출력폴더>
"""
import json, os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from metrics import measure

NAMES = {'root': '뿌리의 문지기', 'blood': '핏빛 수호로 추격자', 'balrog': '발록'}


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


def stats(fr):
    still = [f for f in fr if f['state'] in ('idle', 'attack', 'hit')]
    w = lambda f: f['n']
    body = [f['body'] for f in fr]
    fy = [f['foot'][1] for f in still]; fx = [f['foot'][0] for f in still]
    bad_face = 0; tot_face = 0
    for f in fr:
        for k, c in f['face'].items():
            tot_face += c
            if k in ('Ln', 'Rm'): bad_face += c
    return {'frames': len(fr), 'bodySpread': round(spread(body), 4), 'bodyMin': round(min(body), 1), 'bodyMax': round(max(body), 1),
            'footYRange': round(max(fy) - min(fy), 1) if fy else None, 'footXRange': round(max(fx) - min(fx), 1) if fx else None,
            'faceOdd': f'{bad_face}/{tot_face}'}


def strip(fr, title, H=300):
    # 실제 화면 자리 그대로(같은 카메라) 상태별로 한 칸씩 — 발 자리 기준선은 대기 첫 칸
    cells = []
    ref = next((f for f in fr if f['state'] == 'idle'), fr[0])
    for f in fr:
        P = f['pts']; xs = [p[0] for p in P[:4]]; ys = [p[1] for p in P[:4]]
        w, h = max(xs) - min(xs), max(ys) - min(ys)
        im = f['im'].resize((max(1, int(w * 2)), max(1, int(h * 2))))
        if f['mir']: im = im.transpose(Image.FLIP_LEFT_RIGHT)
        cells.append((f, im, (min(xs) - ref['foot'][0]) * 2, (min(ys) - ref['foot'][1]) * 2))
    W = 150; C = Image.new('RGBA', (len(cells) * W + 10, H + 24), (214, 208, 196, 255)); d = ImageDraw.Draw(C)
    base = H - 14
    for i, (f, im, ox, oy) in enumerate(cells):
        x = i * W + W // 2 + int(ox); y = base + int(oy)
        C.alpha_composite(im, (max(0, x), max(0, y))) if x >= 0 and y >= 0 else C.paste(im, (x, y), im)
        d.text((i * W + 4, H + 6), f"{f['state']} {f['key'].split('|')[0].split('/')[-1][:14]}", fill=(0, 0, 0, 255))
    d.line((0, base, C.width, base), fill=(200, 0, 0, 255))
    d.text((4, 4), title, fill=(0, 0, 0, 255))
    return C


def main():
    bdir, adir, out = sys.argv[1:4]; os.makedirs(out, exist_ok=True); res = {}
    for boss, label in NAMES.items():
        b, a = frames(bdir, boss), frames(adir, boss)
        if not b or not a: continue
        res[boss] = {'before': stats(b), 'after': stats(a)}
        sb, sa = strip(b, label + ' 전(같은 카메라, 빨간 선 = 대기 발)'), strip(a, label + ' 후')
        W = max(sb.width, sa.width); C = Image.new('RGBA', (W, sb.height + sa.height + 6), (255, 255, 255, 255))
        C.alpha_composite(sb, (0, 0)); C.alpha_composite(sa, (0, sb.height + 6)); C.convert('RGB').save(os.path.join(out, f'{boss}-before-after.jpg'), quality=88)
        # GIF: 상태 순서대로 칸을 같은 화면 자리에 이어 그림(전·후 나란히)
        gif = []
        for k in range(max(len(b), len(a))):
            fb, fa = b[k % len(b)], a[k % len(a)]
            g = Image.new('RGBA', (560, 330), (214, 208, 196, 255)); d = ImageDraw.Draw(g)
            for j, (f, lst, tag) in enumerate(((fb, b, '전'), (fa, a, '후'))):
                ref = next((x for x in lst if x['state'] == 'idle'), lst[0]); P = f['pts']
                xs = [p[0] for p in P[:4]]; ys = [p[1] for p in P[:4]]; w, h = max(xs) - min(xs), max(ys) - min(ys)
                im = f['im'].resize((max(1, int(w * 2)), max(1, int(h * 2))))
                if f['mir']: im = im.transpose(Image.FLIP_LEFT_RIGHT)
                x = j * 280 + 140 + int((min(xs) - ref['foot'][0]) * 2); y = 300 + int((min(ys) - ref['foot'][1]) * 2)
                lay = Image.new('RGBA', g.size, (0, 0, 0, 0)); lay.paste(im, (x, y)); g.alpha_composite(lay)
                d.text((j * 280 + 6, 6), f"{label} {tag} · {f['state']}", fill=(0, 0, 0, 255))
            d.line((0, 300, 560, 300), fill=(200, 0, 0, 255))
            gif.append(g.convert('P', palette=Image.ADAPTIVE))
        gif[0].save(os.path.join(out, f'{boss}-before-after.gif'), save_all=True, append_images=gif[1:], duration=260, loop=0)
    json.dump(res, open(os.path.join(out, 'stats.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps(res, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
