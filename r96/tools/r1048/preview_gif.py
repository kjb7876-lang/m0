# R1048 시안 미리보기: 렌더 결과 → (1) 동작 6종 한 화면 GIF(한 방향), (2) 8방향 GIF(한 동작). 게임 바닥색 위에 겹쳐 보여 준다.
# 실행: python3 preview_gif.py <render_out> <out_dir> [--dir se] [--turn walk] [--scale 1]
import sys, os, json
from PIL import Image, ImageDraw, ImageFont
try: FONT = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', 13)
except Exception: FONT = None
src, out = sys.argv[1], sys.argv[2]
def opt(n, d): return type(d)(sys.argv[sys.argv.index(n) + 1]) if n in sys.argv else d
D = opt('--dir', 'se'); TURN = opt('--turn', 'walk')
os.makedirs(out, exist_ok=True)
meta = json.load(open(os.path.join(src, 'sheets.json'))); C = meta['cell']
LABEL = {'idle': '대기', 'walk': '걷기', 'run': '달리기', 'attack': '공격', 'hit': '피격', 'discard': '관측 폐기'}
BG = (34, 28, 32, 255)
def frames(a, d):
    im = Image.open(os.path.join(src, f'{a}-{d}.png')).convert('RGBA'); n = im.width // C
    return [im.crop((i * C, 0, i * C + C, C)) for i in range(n)]
def ground(w, h):
    g = Image.new('RGBA', (w, h), BG); dr = ImageDraw.Draw(g)
    for y in range(0, h, 16): dr.line([(0, y), (w, y)], fill=(44, 36, 40, 255))
    return g
TICK = 1 / 30
def timeline(a, total):
    m = meta['actions'][a]; fr = frames(a, D if a != '__' else D); n = len(fr); fps = m['fps']; seq = []
    hold = 0 if m['loop'] else int(.5 / TICK)  # 한 번 하는 동작은 끝에서 0.5초 쉬었다 다시
    i = 0; t = 0.
    while len(seq) < total:
        k = int(t * fps)
        if k >= n:
            if m['loop']: t = 0; k = 0
            else:
                seq += [fr[-1]] * hold; t = 0; continue
        seq.append(fr[k]); t += TICK
    return seq[:total]
acts = [a for a in ('idle', 'walk', 'run', 'attack', 'hit', 'discard') if a in meta['actions']]
TOTAL = int(3.0 / TICK)
cols = 3; rows = (len(acts) + cols - 1) // cols
tl = {a: timeline(a, TOTAL) for a in acts}
gif = []
for f in range(TOTAL):
    g = ground(C * cols, (C + 18) * rows); dr = ImageDraw.Draw(g)
    for k, a in enumerate(acts):
        x, y = (k % cols) * C, (k // cols) * (C + 18)
        g.alpha_composite(tl[a][f], (x, y + 18)); dr.text((x + 8, y + 3), f'{a} ({LABEL[a]})', fill=(230, 210, 210, 255), font=FONT)
    gif.append(g.convert('RGB'))
p1 = os.path.join(out, f'ego-r1048-6motions-{D}.gif')
gif[0].save(p1, save_all=True, append_images=gif[1:], duration=int(TICK * 1000), loop=0, optimize=True)
# 8방향
dirs = meta['dirs']; m = meta['actions'][TURN]; seqs = {d: frames(TURN, d) for d in dirs}; gif = []
for f in range(int(2 / TICK)):
    g = ground(C * 4, C * 2); dr = ImageDraw.Draw(g)
    for k, d in enumerate(dirs):
        fr = seqs[d]; i = int(f * TICK * m['fps']) % len(fr)
        g.alpha_composite(fr[i], ((k % 4) * C, (k // 4) * C)); dr.text(((k % 4) * C + 8, (k // 4) * C + 4), d, fill=(230, 210, 210, 255), font=FONT)
    gif.append(g.convert('RGB'))
p2 = os.path.join(out, f'ego-r1048-8dirs-{TURN}.gif')
gif[0].save(p2, save_all=True, append_images=gif[1:], duration=int(TICK * 1000), loop=0, optimize=True)
print(p1, os.path.getsize(p1)); print(p2, os.path.getsize(p2))
