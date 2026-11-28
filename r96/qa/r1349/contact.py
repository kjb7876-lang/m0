"""R1349 몹 한 종의 시트별 대표 칸을 화면에 그려진 크기 그대로(발 맞춤) 나란히 — 사람 눈으로 크기 튐 확인용.
사용: python3 contact.py <census 폴더> <zone> <id> <out.png> [배율 2]"""
import json, os, sys
from PIL import Image, ImageDraw
root, z, mid, out = sys.argv[1:5]; K = float(sys.argv[5]) if len(sys.argv) > 5 else 2.0
d = json.load(open(os.path.join(root, z, 'census.json')))['mobs'][mid]
best = {}
for S, L in d['states'].items():
    for o in L:
        sh = o['key'].split('|')[0].split(':')[0]
        if sh not in best or o['n'] > best[sh][0]['n']: best[sh] = (o, S)
cells = []
for sh, (o, S) in sorted(best.items(), key=lambda kv: -kv[1][0]['n']):
    p = os.path.join(root, z, d['dir'], o['file'])
    if not os.path.exists(p): continue
    im = Image.open(p).convert('RGBA'); q = o['pts']
    qh = ((q[3][0] - q[0][0]) ** 2 + (q[3][1] - q[0][1]) ** 2) ** .5; qw = ((q[1][0] - q[0][0]) ** 2 + (q[1][1] - q[0][1]) ** 2) ** .5
    im = im.resize((max(1, round(qw * K)), max(1, round(qh * K))), Image.LANCZOS)
    if q[1][0] < q[0][0]: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    bb = im.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox()
    if bb: im = im.crop((bb[0], 0, bb[2], bb[3]))
    cells.append((im, sh.split('/')[-1][:26], S, o['n']))
if not cells: sys.exit('no cells')
H = max(c[0].height for c in cells) + 40; W = sum(c[0].width + 16 for c in cells) + 16
bg = Image.new('RGBA', (W, H), (52, 52, 60, 255)); dr = ImageDraw.Draw(bg); x = 16; base = H - 30
dr.line((0, base, W, base), fill=(120, 120, 130, 255))
for im, name, S, n in cells:
    bg.alpha_composite(im, (x, base - im.height)); dr.text((x, base + 4), f'{name}', fill=(230, 230, 230, 255)); dr.text((x, base + 15), f'{S} n{n} h{im.height/K:.0f}', fill=(180, 180, 190, 255)); x += im.width + 16
bg.convert('RGB').save(out)
