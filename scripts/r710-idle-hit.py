#!/usr/bin/env python3
"""R710 영웅 대기 6칸·피격 4칸(남쪽) 초안 다듬기.

드라이브 결과 폴더의 HOLD 초안(r96/r710-source/<영웅>-idle6-s.png, -hit4-s.png, 칸 192×256)을 게임 기준에 맞춘다.
  1) 투명도: 알파 1~16 찌꺼기를 지우고, 몸에서 떨어진 작은 점(불투명 30px 미만 덩어리)을 지운다.
  2) 크기: 영웅마다 한 배율 — 초안 대기 칸 몸 키의 중앙값을 지금 게임 대기(R128/R130 idle-s) 몸 키 중앙값에 맞춘다(피격도 같은 배율).
     줄일 때는 미리곱한 알파(RGBa)로 LANCZOS — 가장자리 검은 테 방지.
  3) 발: 칸마다 맨 아래 12줄 불투명 픽셀 가운데를 x 96 에, 맨 아래 불투명 줄을 대기 227(R119 footY 226 실측과 같음)·
     피격 R143 FOOT.s+1 에 놓는다 — 초안의 칸끼리 좌우 미끄러짐(±5px)과 발 높이(240) 차이를 없앤다.
그림(픽셀 색)은 다시 그리지 않는다. 결과 r96/runtime-text/assets/r710/<영웅>/{idle,hit}-s.webp + index.json.
usage: python3 scripts/r710-idle-hit.py [--raw]   (--raw: 다듬지 않고 그대로 옮김 — 검사가 초안에서 실패하는지 확인용)
"""
import hashlib, json, statistics, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
R = ROOT / 'r96'; RT = R / 'runtime-text'; SRC = R / 'r710-source'; OUT = RT / 'assets/r710'
HEROES = ['hunter', 'lauren', 'michaela', 'seoha', 'gunner', 'neon']
FOOT_HIT = {'neon': 225, 'lauren': 225, 'seoha': 226, 'michaela': 226, 'hunter': 226, 'gunner': 227}  # attack-anim-r143.js FOOT[h].s
IDLE_BOTTOM = 227
DRIVE = {  # 드라이브 결과 폴더 초안 묶음(이름만 — 공개 저장소라 파일 ID 는 적지 않음)
  'hunter': 'HERO-Hunter-idle6-hit4-r1-HOLD', 'lauren': 'HERO-Lauren-idle6-hit4-r1-HOLD',
  'michaela': 'HERO-Michaela-idle6-hit4-r1-HOLD', 'seoha': 'HERO-Seoha-idle6-hit4-r1-HOLD',
  'gunner': 'HERO-Gunner-tall-idle6-hit4-r2-HOLD',
  'neon': 'HERO-Neon-idleonly-r4-HOLD-512cell(대기, 사용자 06:19Z 선택) + HERO-Neon-idle6-hit4-r2-HOLD(피격, 사용자 06:19Z 선택)'}
GRID = {('neon', 'idle'): (512, 512, 3)}  # 칸 가로·세로·한 줄 칸 수(나머지는 192×256 한 줄)
CW, CH = 192, 256


def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def cells(im, grid=None):
    if grid:
        w, h, cols = grid; rows = im.height // h
        return [im.crop((c * w, r * h, (c + 1) * w, (r + 1) * h)) for r in range(rows) for c in range(cols)]
    n = max(1, round(im.width / CW)); return [im.crop((i * CW, 0, (i + 1) * CW, CH)) for i in range(n)]


def measure(f):
    a = f.getchannel('A').load(); W, H = f.size; top = bot = None
    for y in range(H):
        for x in range(W):
            if a[x, y] > 24:
                if top is None: top = y
                bot = y
    xs = [x for y in range(max(0, bot - 12), bot + 1) for x in range(W) if a[x, y] > 24]
    return top, bot, sum(xs) / len(xs)


def clean(f):
    """알파 ≤16 지우기 + 몸에서 떨어진 30px 미만 불투명 덩어리 지우기."""
    f = f.copy(); px = f.load(); W, H = f.size
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if 0 < a <= 16: px[x, y] = (0, 0, 0, 0)
    seen = [[False] * W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            if seen[y][x] or px[x, y][3] == 0: continue
            comp = []; st = [(x, y)]; seen[y][x] = True; solid = 0
            while st:
                cx, cy = st.pop(); comp.append((cx, cy)); solid += px[cx, cy][3] > 24
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1), (cx + 1, cy + 1), (cx - 1, cy - 1), (cx + 1, cy - 1), (cx - 1, cy + 1)):
                    if 0 <= nx < W and 0 <= ny < H and not seen[ny][nx] and px[nx, ny][3] > 0:
                        seen[ny][nx] = True; st.append((nx, ny))
            if solid < 30:
                for cx, cy in comp: px[cx, cy] = (0, 0, 0, 0)
    return f


def place(f, k, bottom):
    f = clean(f); top, bot, fx = measure(f)
    w, h = round(f.width * k), round(f.height * k)
    s = f.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
    px = s.load()
    for y in range(h):
        for x in range(w):
            if px[x, y][3] <= 16: px[x, y] = (0, 0, 0, 0)
    t2, b2, fx2 = measure(s)
    out = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
    dx, dy = round(96 - fx2), bottom - b2
    # alpha_composite 는 음수 위치를 못 받으므로 잘라서 붙인다
    sx0, sy0 = max(0, -dx), max(0, -dy); sx1, sy1 = min(w, CW - dx), min(h, CH - dy)
    out.alpha_composite(s.crop((sx0, sy0, sx1, sy1)), (dx + sx0, dy + sy0))
    return out


def strip(fs):
    im = Image.new('RGBA', (CW * len(fs), CH), (0, 0, 0, 0))
    for i, f in enumerate(fs): im.alpha_composite(f, (i * CW, 0))
    return im


def cur_idle(h):
    d = 'assets/r128/gunner/' if h == 'gunner' else f'assets/r130/{h}/'
    return json.loads((RT / d / 'index.json').read_text(encoding='utf8'))['idle']['s']


def main():
    raw = '--raw' in sys.argv
    index = {'revision': 'R710-idle-hit-1', 'note': '남쪽 대기 6칸·피격 4칸(드라이브 HOLD 초안을 발·크기·투명도만 다듬음, 그림은 초안 그대로). 다른 방향은 R119/R143 그대로. 환도·슬레이어·네온은 보류.',
             'raw': raw, 'heroes': {}}
    for h in HEROES:
        ci = cur_idle(h); cur = cells(Image.open(RT / ci['path']).convert('RGBA'))
        cur_h = statistics.median(measure(f)[1] - measure(f)[0] for f in cur)
        idle = cells(Image.open(SRC / f'{h}-idle6-s.png').convert('RGBA'), GRID.get((h, 'idle'))); hit = cells(Image.open(SRC / f'{h}-hit4-s.png').convert('RGBA'), GRID.get((h, 'hit')))
        d_h = statistics.median(measure(clean(f))[1] - measure(clean(f))[0] for f in idle)
        k = cur_h / d_h; kh = k
        if raw:
            oi, oh = idle, hit
        else:
            # 피격 초안은 대기보다 크게 그려진 것이 있어(서하·미카엘라·라우렌 첫 칸 +8~10%) 첫 칸(충격, 선 자세) 키를 대기 키에 맞춘 배율을 따로 쓴다
            h0 = measure(clean(hit[0])); kh = cur_h / (h0[1] - h0[0])
            oi = [place(f, k, IDLE_BOTTOM) for f in idle]; oh = [place(f, kh, FOOT_HIT[h] + 1) for f in hit]
        (OUT / h).mkdir(parents=True, exist_ok=True); e = {}
        new_h = statistics.median(measure(f)[1] - measure(f)[0] for f in oi)
        for act, fs, src in (('idle', oi, f'{h}-idle6-s.png'), ('hit', oh, f'{h}-hit4-s.png')):
            p = OUT / h / f'{act}-s.webp'
            strip(fs).save(p, 'WEBP', quality=92, method=6, alpha_quality=100)
            e[act] = {'path': f'assets/r710/{h}/{act}-s.webp', 'frames': len(fs), 'cell': [CW, CH], 'foot': [96, 226 if act == 'idle' else FOOT_HIT[h]],
                      'sha256': sha(p), 'bytes': p.stat().st_size,
                      'source': {'file': src, 'sha256': sha(SRC / src), 'drive': DRIVE[h]}}
        e['scale'] = round(k, 4); e['hitScale'] = round(kh, 4) if not raw else 1; e['hitBody'] = round(ci['refBody'] * (measure(oh[0])[1] - measure(oh[0])[0]) / cur_h, 1); e['refBody'] = round(ci['refBody'] * new_h / cur_h, 1)
        index['heroes'][h] = e
        print(h, 'scale', round(k, 3), 'cur body', cur_h, 'draft body', d_h, 'new body', new_h)
    (OUT / 'index.json').write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding='utf8')


if __name__ == '__main__':
    main()
