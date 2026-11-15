# R1048 검수용 한 장 그림: 동작마다 고른 칸을 한 줄씩(한 방향) + 8방향 대기 + 게임 크기(키 약 70px) 축소본.
# 실행: python3 review_sheet.py <render_out> <out.png> [--dir se] [--cols 6]
import sys, os, json
from PIL import Image, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]
def opt(n, d): return type(d)(sys.argv[sys.argv.index(n) + 1]) if n in sys.argv else d
D = opt('--dir', 'se'); COLS = opt('--cols', 6)
meta = json.load(open(os.path.join(src, 'sheets.json'))); C = meta['cell']
try: F = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', 16)
except Exception: F = None
BG = (34, 28, 32, 255)
acts = [a for a in ('idle', 'walk', 'run', 'attack', 'hit', 'discard') if a in meta['actions']]
def frames(a, d):
    im = Image.open(os.path.join(src, f'{a}-{d}.png')).convert('RGBA'); n = im.width // C
    return [im.crop((i * C, 0, i * C + C, C)) for i in range(n)]
W = C * COLS; rows = len(acts) + 2
sheet = Image.new('RGBA', (W + 120, C * rows), BG); dr = ImageDraw.Draw(sheet)
for r, a in enumerate(acts):
    fr = frames(a, D); n = len(fr)
    pick = [round(i * (n - 1) / (COLS - 1)) for i in range(COLS)]
    for k, i in enumerate(pick): sheet.alpha_composite(fr[i], (120 + k * C, r * C))
    dr.text((8, r * C + 8), f'{a}\n{D}\n칸 {pick}', fill=(235, 220, 220, 255), font=F)
r = len(acts)
for k, d in enumerate(meta['dirs'][:COLS + 2]):
    if k >= COLS: break
    sheet.alpha_composite(frames('idle', d)[0], (120 + k * C, r * C))
dr.text((8, r * C + 8), 'idle\n8방향', fill=(235, 220, 220, 255), font=F)
# 게임 크기: 키가 약 70px 이 되게 줄인 걷기 8방향
r += 1; small = int(C * 70 / (C * .76)); x = 120
for d in meta['dirs']:
    f = frames('walk', d)[3].resize((small, small), Image.LANCZOS); sheet.alpha_composite(f, (x, r * C + (C - small) // 2)); x += small + 6
dr.text((8, r * C + 8), '게임 크기\n(키≈70px)', fill=(235, 220, 220, 255), font=F)
sheet.convert('RGB').save(out); print(out, sheet.size)
