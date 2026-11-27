"""R1349 손질 사본 나란히 보기: frames.json 항목(key)의 사본 시트마다 가운데 칸 하나를 같은 캔버스 배율로 나란히(=게임 화면에서의 상대 크기).
사용: python3 r96/qa/r1349/strip.py <key> <out.png> [--raw] (--raw: 손질 전 원본을 원본 칸 높이 하나로 맞춰 나란히 — 엔진이 칸 높이로 그리던 모습 근사)"""
import json, os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); RT = os.path.join(HERE, '..', '..', 'runtime-text'); SITE = os.path.join(HERE, '..', '..', 'hospital-three-pc', 'site')
key, out = sys.argv[1], sys.argv[2]; raw = '--raw' in sys.argv
B = json.load(open(os.path.join(HERE, 'frames.json')))['bosses'][key]
def op(p):
    for b in (RT, SITE):
        q = os.path.join(b, p)
        if os.path.exists(q): return Image.open(q).convert('RGBA')
tiles = []
for F in B['frames']:
    im = op(F['path'] if raw else F['out'])
    if im is None: continue
    rects = F.get('rects'); n = len(rects) if rects else F.get('n', 1)
    i = n // 2
    if raw:
        c = im.crop((rects[i][0], rects[i][1], rects[i][0] + rects[i][2], rects[i][1] + rects[i][3])) if rects else im.crop((i * (im.width // n), 0, (i + 1) * (im.width // n), im.height))
        c = c.resize((max(1, round(c.width * 300 / c.height)), 300))
    else:
        W = im.width // n; c = im.crop((i * W, 0, (i + 1) * W, im.height)); k = 360 / c.height; c = c.resize((max(1, round(c.width * k)), 360))
    bb = c.getchannel('A').getbbox()
    if bb: c = c.crop((bb[0], 0, bb[2], c.height))
    tiles.append((c, os.path.basename(F['path'])[:24], F.get('state', '')))
H = max(t[0].height for t in tiles) + 30; Wt = sum(t[0].width + 12 for t in tiles) + 12
bg = Image.new('RGBA', (Wt, H), (52, 52, 60, 255)); d = ImageDraw.Draw(bg); x = 12
for c, nm, st in tiles:
    bg.alpha_composite(c, (x, H - 30 - c.height)); d.text((x, H - 26), nm, fill=(230, 230, 230, 255)); d.text((x, H - 14), st, fill=(170, 170, 180, 255)); x += c.width + 12
bg.convert('RGB').save(out)
