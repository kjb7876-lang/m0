#!/usr/bin/env python3
"""R128: Gemini 기억사수 스프라이트시트(Drive StoryWorld-HERO-gunner-sheet-20261030.zip) -> assets/r128/gunner/
- walk-<s|se|e|ne|n>.webp : 8프레임 한 줄(1536x256, 칸 192x256) 그대로(알파 유지 WebP 품질 92). 왼쪽 3방향은 게임에서 반전.
- 기존 기억사수 정지·동작 그림(약 50장, 2~3등신 만화체)마다 새 시트의 같은 동작·방향 프레임으로 대체본을 만든다.
  원래 그림과 같은 512 캔버스·같은 발 위치(밑동 가운데)·같은 몸 키로 맞춰 게임 안 위치와 크기가 튀지 않게 한다.
  보는 방향은 원래 그림에서 소총(푸른 빛)이 뻗은 쪽을 재서 정했다(이름과 반대인 그림이 있음: ultimate-left/right, move-left).
원본(시트·기존 그림)은 바꾸지 않는다. index.json 에 Drive 출처·원본/파생 해시·대응표를 남긴다.
usage: python3 -I scripts/r128-gunner-sheet.py <staging dir with HERO-gunner-*.png + MANIFEST.json> <built site dir>
"""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from PIL import Image

src, site = Path(sys.argv[1]), Path(sys.argv[2]); out = Path('r96/runtime-text/assets/r128/gunner'); out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest(); CW, CH = 192, 256
man = json.loads((src / 'MANIFEST.json').read_text(encoding='utf-8'))
for k, v in man.items():
    if sha((src / k).read_bytes()) != v['sha256']: raise SystemExit('sha mismatch ' + k)
N = 'assets/heroes/normalized/'; G = N + 'gunner/'; AC = N + 'actions-consistent/gunner-'; V = N + 'actions-v3126/gunner-'
# 원래 그림 -> (동작, 방향, 프레임, 좌우 반전)
MAP = {'assets/hero_direction337/gunner/s.webp': ('idle', 's', 0, 0), 'assets/hero_direction337/gunner/n.webp': ('idle', 'n', 0, 0)}
for d, (b, m) in {'e': ('e', 0), 'w': ('e', 1), 'ne': ('ne', 0), 'nw': ('ne', 1), 'se': ('se', 0), 'sw': ('se', 1)}.items():
    MAP['assets/hero_direction334/gunner/' + d + '.webp'] = ('idle', b, 0, m)
MAP.update({G + 'player_idle.webp': ('idle', 'e', 0, 0),
  G + 'run_front_a.webp': ('walk', 's', 1, 0), G + 'run_front_b.webp': ('walk', 's', 5, 0), G + 'run_back_a.webp': ('walk', 'n', 1, 0), G + 'run_back_b.webp': ('walk', 'n', 5, 0),
  G + 'run_left_a.webp': ('walk', 'e', 1, 1), G + 'run_left_b.webp': ('walk', 'e', 5, 1), G + 'run_right_a.webp': ('walk', 'e', 1, 0), G + 'run_right_b.webp': ('walk', 'e', 5, 0),
  G + 'player_run1.webp': ('walk', 'e', 1, 0), G + 'player_run2.webp': ('walk', 'e', 5, 0),
  G + 'guard_left.webp': ('attack', 'e', 0, 1), G + 'guard_right.webp': ('attack', 'e', 0, 0), G + 'dash_left.webp': ('walk', 'e', 3, 1), G + 'dash_right.webp': ('walk', 'e', 3, 0),
  G + 'attack_left.webp': ('attack', 'e', 3, 1), G + 'attack_right.webp': ('attack', 'e', 3, 0),
  G + 'player_aim.webp': ('attack', 'e', 1, 0), G + 'player_aimup.webp': ('attack', 'ne', 1, 0), G + 'aim_front.webp': ('attack', 's', 1, 0), G + 'aim_back.webp': ('attack', 'n', 1, 0),
  G + 'player_crouch.webp': ('death', 'e', 2, 0), G + 'player_roll.webp': ('walk', 'e', 3, 0)})
for act, (a, f) in {'attack': ('attack', 3), 'skill': ('attack', 2), 'guard': ('attack', 0), 'dash': ('walk', 3)}.items():
    for side, (d, m) in {'front': ('s', 0), 'back': ('n', 0), 'left': ('e', 1), 'right': ('e', 0)}.items(): MAP[AC + act + '-' + side + '.webp'] = (a, d, f, m)
for side, (d, m) in {'front': ('s', 0), 'back': ('n', 0), 'left': ('e', 1), 'right': ('e', 0)}.items(): MAP[V + 'hurt-' + side + '.webp'] = ('hit', d, 1, m)
for side, d in {'front': 's', 'back': 'n', 'left': 'e', 'right': 'e'}.items(): MAP[V + 'move-' + side + '.webp'] = ('walk', d, 2, 0)  # 두 옆 그림 모두 오른쪽을 봄
# R131: 게임은 왼쪽을 볼 때 hurt-right, 오른쪽을 볼 때 hurt-left 를 그린다(브라우저 측정) — 쓰이는 방향으로 맞춘다
MAP[V + 'hurt-right.webp'] = ('hit', 'e', 1, 1); MAP[V + 'hurt-left.webp'] = ('hit', 'e', 1, 0)
for side, (d, m) in {'front': ('s', 0), 'back': ('n', 0), 'left': ('e', 0), 'right': ('e', 1)}.items(): MAP[V + 'ultimate-' + side + '.webp'] = ('attack', d, 3, m)  # 이름과 반대로 그려져 있음

def box(a, thr=24):
    ys, xs = np.nonzero(a > thr); return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1) if len(xs) else None
def foot(a, b):
    # R131: 발 = 몸통 폭이 있는 가장 아래 줄(칼끝·창끝처럼 가는 것은 건너뜀), x 는 그 위 10% 높이 안의 알파 무게 중심
    x0, y0, x1, y1 = b; m = a[y0:y1, x0:x1] > 24; cnt = m.sum(1); need = max(4, int((x1 - x0) * .10))
    rows = np.nonzero(cnt >= need)[0]; fy = (rows[-1] + 1) if len(rows) else (y1 - y0)
    band = a[y0 + max(0, fy - max(6, int((y1 - y0) * .10))):y0 + fy, x0:x1].astype(float); w = band.sum(0)
    return x0 + (float((w * np.arange(len(w))).sum() / w.sum()) if w.sum() else (x1 - x0) / 2), y0 + fy
sheets = {}
def frame(act, d, i):
    k = (act, d)
    if k not in sheets: sheets[k] = Image.open(src / f'HERO-gunner-{act}-{d}.png').convert('RGBA')
    return sheets[k].crop((i * CW, 0, (i + 1) * CW, CH))
index = {'revision': 'R128', 'source': {'drive': 'StoryWorld-HERO-gunner-sheet-20261030.zip', 'driveId': '13-unzqWeeD2_9N7q2KInxcXm29JTI3JR', 'maker': 'Gemini (사용자 요청, docs/gemini-hero-refs 규격)',
         'files': {k: v['sha256'] for k, v in man.items()}}, 'walk': {}, 'swap': {}}
index['idle'] = {}  # R131: 8방향 서 있기(R93 idle 대신) 4프레임, 왼쪽 3방향은 미리 뒤집음
for d, (b, m) in {'s': ('s', 0), 'se': ('se', 0), 'e': ('e', 0), 'ne': ('ne', 0), 'n': ('n', 0), 'sw': ('se', 1), 'w': ('e', 1), 'nw': ('ne', 1)}.items():
    im = Image.open(src / f'HERO-gunner-idle-{b}.png').convert('RGBA'); fr = [im.crop((i * CW, 0, (i + 1) * CW, CH)) for i in range(im.width // CW)]
    if m: fr = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in fr]
    im = Image.new('RGBA', (CW * len(fr), CH)); [im.alpha_composite(f, (i * CW, 0)) for i, f in enumerate(fr)]
    a = np.asarray(fr[0])[..., 3]; b0 = box(a); fx, fy = foot(a, b0); p = out / f'idle-{d}.webp'; im.save(p, 'WEBP', quality=92, alpha_quality=100, method=4)
    index['idle'][d] = {'path': f'assets/r128/gunner/idle-{d}.webp', 'frames': len(fr), 'cellW': CW, 'cellH': CH, 'footX': round(float(fx), 1), 'footY': int(fy), 'refBody': int(b0[3] - b0[1]), 'sha256': sha(p.read_bytes())}
for d in ['s', 'se', 'e', 'ne', 'n']:
    p = out / f'walk-{d}.webp'; Image.open(src / f'HERO-gunner-walk-{d}.png').convert('RGBA').save(p, 'WEBP', quality=92, alpha_quality=100, method=4)
    index['walk'][d] = {'path': f'assets/r128/gunner/walk-{d}.webp', 'cols': 8, 'rows': 1, 'cell': [CW, CH], 'sha256': sha(p.read_bytes())}
for orig, (act, d, i, m) in MAP.items():
    o = np.asarray(Image.open(site / orig).convert('RGBA'))[..., 3]; ob = box(o)
    fr = frame(act, d, i); fr = fr.transpose(Image.FLIP_LEFT_RIGHT) if m else fr; fa = np.asarray(fr)[..., 3]; fb = box(fa)
    oh = ob[3] - ob[1]; nh = fb[3] - fb[1]
    # 몸 키는 서 있는 그림 기준으로 맞춘다(쓰러짐·웅크림처럼 키가 낮은 프레임은 같은 비율로 줄여 납작해지지 않게)
    ref = 180; k = oh / max(nh, ref * .5) if act in ('idle', 'walk', 'attack', 'hit') else oh / ref
    sw, sh = max(1, round(fr.width * k)), max(1, round(fr.height * k)); big = fr.resize((sw, sh), Image.LANCZOS)
    fx, fy = foot(fa, fb); ox, oy = foot(o, ob)
    canvas = Image.new('RGBA', Image.open(site / orig).size, (0, 0, 0, 0)); canvas.alpha_composite(big, (int(round(ox - fx * k)), int(round(oy - fy * k))))
    name = orig.split('/')[-2].replace('gunner', 'g') + '-' + orig.split('/')[-1].rsplit('.', 1)[0] + '.webp'; p = out / name
    canvas.save(p, 'WEBP', quality=90, alpha_quality=100, method=6)
    index['swap'][orig] = {'path': f'assets/r128/gunner/{name}', 'from': f'HERO-gunner-{act}-{d}.png#{i}', 'mirror': bool(m), 'sha256': sha(p.read_bytes()), 'bytes': p.stat().st_size}
(out / 'index.json').write_text(json.dumps(index, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('walk', len(index['walk']), 'swap', len(index['swap']), 'bytes', sum(f.stat().st_size for f in out.glob('*.webp')))
