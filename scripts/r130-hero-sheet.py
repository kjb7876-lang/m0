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
KEEP = {'michaela': ['actions-v3126/michaela-ultimate-', 'actions-directional/michaela-guard-'],
        'seoha': ['actions-v3126/seoha-ultimate-'], 'lauren': ['actions-v3126/lauren-ultimate-'],
        'neon': ['actions-v3126/neon-ultimate-'], 'slayer': ['actions-v3126/slayer-ultimate-', 'actions-directional/slayer-guard-'], 'hunter': ['actions-v3126/hunter-ultimate-']}
WALK_ONLY = {'hwando'}  # R131: 환도는 서 있기 그림이 좋아 걷기만 받았다(시트에 walk·attack 만) — 정지·동작 그림은 그대로  # R131: 궁극기 그림에 큰 효과(마법진·빛)가 들어 있어 원래 그림 유지
MAP = {f'assets/hero_direction{v}/{hero}/{d}.webp': ('idle', d, 0, 0) for v in ('337', '338') for d in ('s', 'n')}  # R131: 로렌은 338 묶음도 쓴다
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
MAP = {k: v for k, v in MAP.items() if (site / k).exists() and not any(s in k for s in KEEP.get(hero, [])) and hero not in WALK_ONLY}
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
    if k not in sheets: sheets[k] = Image.open(src / f'HERO-{hero}-{act}-{d}.png').convert('RGBA')
    return sheets[k].crop((i * CW, 0, (i + 1) * CW, CH))
rel = str(outroot).split('runtime-text/')[-1]
index = {'revision': rel.split('/')[-1].upper(), 'hero': hero, 'source': {'files': {k: v['sha256'] for k, v in man.items()}}, 'keep': KEEP.get(hero, []), 'walk': {}, 'swap': {}}
name_of = lambda orig: orig.split('/')[-2].replace(hero, 'g') + '-' + orig.split('/')[-1].rsplit('.', 1)[0] + '.webp'
index['idle'] = {}
for d, (b, m) in ({} if hero in WALK_ONLY else {'s': ('s', 0), 'se': ('se', 0), 'e': ('e', 0), 'ne': ('ne', 0), 'n': ('n', 0), 'sw': ('se', 1), 'w': ('e', 1), 'nw': ('ne', 1)}).items():
    im = Image.open(src / f'HERO-{hero}-idle-{b}.png').convert('RGBA'); fr = [im.crop((i * CW, 0, (i + 1) * CW, CH)) for i in range(im.width // CW)]
    if m: fr = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in fr]
    im = Image.new('RGBA', (CW * len(fr), CH)); [im.alpha_composite(f, (i * CW, 0)) for i, f in enumerate(fr)]
    a = np.asarray(fr[0])[..., 3]; b0 = box(a); fx, fy = foot(a, b0)
    p = out / f'idle-{d}.webp'; im.save(p, 'WEBP', quality=92, alpha_quality=100, method=4)
    index['idle'][d] = {'path': f'{rel}/{hero}/idle-{d}.webp', 'frames': len(fr), 'cellW': CW, 'cellH': CH, 'footX': round(float(fx), 1), 'footY': int(fy), 'refBody': int(b0[3] - b0[1]), 'sha256': sha(p.read_bytes())}
for d in ['s', 'se', 'e', 'ne', 'n']:
    p = out / f'walk-{d}.webp'; Image.open(src / f'HERO-{hero}-walk-{d}.png').convert('RGBA').save(p, 'WEBP', quality=92, alpha_quality=100, method=4)
    index['walk'][d] = {'path': f'{rel}/{hero}/walk-{d}.webp', 'cols': 8, 'rows': 1, 'cell': [CW, CH], 'sha256': sha(p.read_bytes())}
REF = (lambda b_: b_[3] - b_[1])(box(np.asarray(frame('idle', 's', 0))[..., 3])) if MAP else 0
for orig, (act, d, i, m) in MAP.items():
    o = np.asarray(Image.open(site / orig).convert('RGBA'))[..., 3]; ob = box(o)
    fr = frame(act, d, i); fr = fr.transpose(Image.FLIP_LEFT_RIGHT) if m else fr; fa = np.asarray(fr)[..., 3]; fb = box(fa)
    oh, nh = ob[3] - ob[1], fb[3] - fb[1]; k = oh / max(nh, 90) if act in ('idle', 'walk', 'attack', 'hit') else oh / 180
    big = fr.resize((max(1, round(fr.width * k)), max(1, round(fr.height * k))), Image.LANCZOS); fx, fy = foot(fa, fb); ox, oy = foot(o, ob)
    canvas = Image.new('RGBA', Image.open(site / orig).size, (0, 0, 0, 0)); canvas.alpha_composite(big, (int(round(ox - fx * k)), int(round(oy - fy * k))))
    p = out / name_of(orig); canvas.save(p, 'WEBP', quality=90, alpha_quality=100, method=4)
    # R131: 아틀라스로 그리던 영웅(슬레이어)이 이 그림을 그릴 때 쓰는 발 위치·몸 키(서 있기 첫 칸 키 x 배율 — 동작마다 몸 크기가 같게)
    fr_ = {'size': list(canvas.size), 'pivot': [round(float(ox), 1), int(oy)], 'visibleHeight': round(float(REF * k), 1)}
    index['swap'][orig] = {'path': f'{rel}/{hero}/{p.name}', 'from': f'HERO-{hero}-{act}-{d}.png#{i}', 'mirror': bool(m), 'sha256': sha(p.read_bytes()), 'bytes': p.stat().st_size, 'frame': fr_}
(out / 'index.json').write_text(json.dumps(index, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(hero, 'walk', len(index['walk']), 'swap', len(index['swap']), 'bytes', sum(f.stat().st_size for f in out.glob('*.webp')))
