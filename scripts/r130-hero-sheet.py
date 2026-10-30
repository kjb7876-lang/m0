#!/usr/bin/env python3
"""R130: Gemini 영웅 스프라이트시트(docs/gemini-hero-refs 규격, Drive StoryWorld-HERO-<id>-sheet-*.zip) -> assets/<out>/<id>/
R128(기억사수)과 같은 방식을 영웅 공통으로: MANIFEST SHA-256 확인, walk-<s|se|e|ne|n>.webp(8프레임 한 줄),
기존 정지·동작 그림마다 같은 동작·방향 프레임으로 대체본(같은 캔버스·발 위치·몸 키). 보는 방향은 그림을 직접 보고 정한 표(FACE)를 쓴다.
특수 효과가 그림에 들어 있는 동작(궁극기 날개, 방향 막기 방패 등)은 KEEP 에 두고 원래 그림을 쓴다.
usage: python3 -I scripts/r130-hero-sheet.py <hero> <staging dir> <built site dir> <out dir e.g. r96/runtime-text/assets/r130>
"""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from PIL import Image

hero, src, site, outroot = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3]), Path(sys.argv[4]); out = outroot / hero; out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest(); CW, CH = 192, 256
man = json.loads((src / 'MANIFEST.json').read_text(encoding='utf-8'))
for k, v in man.items():
    if sha((src / k).read_bytes()) != v['sha256']: raise SystemExit('sha mismatch ' + k)
N = 'assets/heroes/normalized/'; SIDE = {'front': ('s', 0), 'back': ('n', 0), 'left': ('e', 1), 'right': ('e', 0)}
# 영웅별: 그림을 보고 정한 예외(이름과 보는 방향이 다른 것)와 원래 그림을 둘 것
FACE = {'michaela': {'actions-v3126/michaela-move-left': ('e', 0)}}  # 달리기 옆 그림은 두 장 모두 오른쪽을 봄
KEEP = {'michaela': ['actions-v3126/michaela-ultimate-', 'actions-directional/michaela-guard-']}
MAP = {f'assets/hero_direction337/{hero}/s.webp': ('idle', 's', 0, 0), f'assets/hero_direction337/{hero}/n.webp': ('idle', 'n', 0, 0)}
for d, (b, m) in {'e': ('e', 0), 'w': ('e', 1), 'ne': ('ne', 0), 'nw': ('ne', 1), 'se': ('se', 0), 'sw': ('se', 1)}.items(): MAP[f'assets/hero_direction334/{hero}/{d}.webp'] = ('idle', b, 0, m)
for side, (d, m) in SIDE.items(): MAP[f'{N}directions/{hero}-{side}.webp'] = ('idle', d, 0, m)
for act, (a, f) in {'attack': ('attack', 3), 'skill': ('attack', 2), 'guard': ('attack', 0), 'dash': ('walk', 3)}.items():
    for side, (d, m) in SIDE.items(): MAP[f'{N}actions-consistent/{hero}-{act}-{side}.webp'] = (a, d, f, m)
for side, (d, m) in SIDE.items():
    MAP[f'{N}actions-v3126/{hero}-hurt-{side}.webp'] = ('hit', d, 1, m); MAP[f'{N}actions-v3126/{hero}-move-{side}.webp'] = ('walk', d, 2, m); MAP[f'{N}actions-v3126/{hero}-ultimate-{side}.webp'] = ('attack', d, 3, m)
for act, (a, f) in {'attack': ('attack', 3), 'guard': ('attack', 0)}.items():
    for side in ('left', 'right'): MAP[f'{N}actions-directional/{hero}-{act}-{side}.webp'] = (a, 'e', f, 1 if side == 'left' else 0)
for k, (d, m) in FACE.get(hero, {}).items():
    p = N + k + '.webp'
    if p in MAP: a, _, f, _ = MAP[p]; MAP[p] = (a, d, f, m)
MAP = {k: v for k, v in MAP.items() if (site / k).exists() and not any(s in k for s in KEEP.get(hero, []))}
def box(a, thr=24):
    ys, xs = np.nonzero(a > thr); return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1) if len(xs) else None
def foot(a, b):
    x0, y0, x1, y1 = b; rows = a[max(y0, y1 - 8):y1, x0:x1] > 24; xs = np.nonzero(rows.any(0))[0]; return x0 + (xs.mean() if len(xs) else (x1 - x0) / 2), y1
sheets = {}
def frame(act, d, i):
    k = (act, d)
    if k not in sheets: sheets[k] = Image.open(src / f'HERO-{hero}-{act}-{d}.png').convert('RGBA')
    return sheets[k].crop((i * CW, 0, (i + 1) * CW, CH))
rel = str(outroot).split('runtime-text/')[-1]
index = {'revision': rel.split('/')[-1].upper(), 'hero': hero, 'source': {'files': {k: v['sha256'] for k, v in man.items()}}, 'keep': KEEP.get(hero, []), 'walk': {}, 'swap': {}}
name_of = lambda orig: orig.split('/')[-2].replace(hero, 'g') + '-' + orig.split('/')[-1].rsplit('.', 1)[0] + '.webp'
for d in ['s', 'se', 'e', 'ne', 'n']:
    p = out / f'walk-{d}.webp'; Image.open(src / f'HERO-{hero}-walk-{d}.png').convert('RGBA').save(p, 'WEBP', quality=92, alpha_quality=100, method=4)
    index['walk'][d] = {'path': f'{rel}/{hero}/walk-{d}.webp', 'cols': 8, 'rows': 1, 'cell': [CW, CH], 'sha256': sha(p.read_bytes())}
for orig, (act, d, i, m) in MAP.items():
    o = np.asarray(Image.open(site / orig).convert('RGBA'))[..., 3]; ob = box(o)
    fr = frame(act, d, i); fr = fr.transpose(Image.FLIP_LEFT_RIGHT) if m else fr; fa = np.asarray(fr)[..., 3]; fb = box(fa)
    oh, nh = ob[3] - ob[1], fb[3] - fb[1]; k = oh / max(nh, 90) if act in ('idle', 'walk', 'attack', 'hit') else oh / 180
    big = fr.resize((max(1, round(fr.width * k)), max(1, round(fr.height * k))), Image.LANCZOS); fx, fy = foot(fa, fb); ox, oy = foot(o, ob)
    canvas = Image.new('RGBA', Image.open(site / orig).size, (0, 0, 0, 0)); canvas.alpha_composite(big, (int(round(ox - fx * k)), int(round(oy - fy * k))))
    p = out / name_of(orig); canvas.save(p, 'WEBP', quality=90, alpha_quality=100, method=4)
    index['swap'][orig] = {'path': f'{rel}/{hero}/{p.name}', 'from': f'HERO-{hero}-{act}-{d}.png#{i}', 'mirror': bool(m), 'sha256': sha(p.read_bytes()), 'bytes': p.stat().st_size}
(out / 'index.json').write_text(json.dumps(index, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(hero, 'walk', len(index['walk']), 'swap', len(index['swap']), 'bytes', sum(f.stat().st_size for f in out.glob('*.webp')))
