#!/usr/bin/env python3
"""R119 잡몹 맞음·대기 4키 추가: Drive 2026-10-29 묶음(M005 대기, M011 맞음, M041 대기 v2, M045 맞음, M046 맞음, M069 맞음 v3)을
R116과 같은 가로 스트립(가시 높이 150px, 발밑 피벗)으로 만들어 assets/r116/mobs/index.json 에 더한다(같은 몹·같은 동작은 교체).
묶음 형식: registered/idle_01..04.png(같은 캔버스에 정렬됨) 또는 crops/<M>-<act>-K1..K4[-exact].png(원본 2x2 사분면 컷, 셀 크기 1px 차 가능 -> 왼쪽 위 기준으로 같은 캔버스에 놓음).
몹 ID는 묶음 설명(CLAUDE-HANDOFF.md)에 적힌 대상만: M045 = 초록 슬라임 l304-e1(안개핵 제외), M046 = 늑대 l304-e2(검은 영혼 제외).
Usage: python -I scripts/r119-mob-frames.py <dir with downloaded zips> <audit snapshot zip> r96/runtime-text/assets/r116/mobs
"""
import sys, json, hashlib, zipfile, io, re, csv, collections
from pathlib import Path
import numpy as np
from PIL import Image
src, audit, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
sha = lambda b: hashlib.sha256(b).hexdigest()
TARGET_H, PAD, A = 150, 3, 16
rows = list(csv.DictReader(io.StringIO(zipfile.ZipFile(audit).read('MONSTER-AUDIT.csv').decode('utf-8-sig'))))
CSV = collections.defaultdict(list); NAME = {}
for r in rows:
    if r['registry_id'] not in CSV[r['group']]: CSV[r['group']].append(r['registry_id'])
    NAME.setdefault(r['group'], r['name'])
ONLY = {'M045': ['l304-e1'], 'M046': ['l304-e2']}
groups = collections.defaultdict(lambda: {'zips': [], 'frames': {}})
for z in sorted(src.glob('StoryWorld-M*-2026102*.zip')):
    m = re.match(r'StoryWorld-(M\d+)-(?:remake-)?(hit|idle)4', z.name)
    if not m: continue
    g = groups[(m.group(1), m.group(2))]; b = z.read_bytes(); g['zips'].append({'name': z.name, 'bytes': len(b), 'sha256': sha(b)}); Z = zipfile.ZipFile(z)
    for f in Z.namelist():
        k = re.search(r'/registered/(?:idle|hit)_0([1-4])\.png$', f) or re.search(r'/crops/M\d+-(?:hit|idle)-K([1-4])(?:-exact)?\.png$', f)
        if k: g['frames'].setdefault(int(k.group(1)), []).append((z.name, f, Z.read(f)))
def bbox(a):
    ys, xs = np.nonzero(a >= A); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
idx_path = out / 'index.json'; index = json.loads(idx_path.read_text(encoding='utf-8'))
made = []
for (gid, act), g in sorted(groups.items()):
    if sorted(g['frames']) != [1, 2, 3, 4]: print('SKIP incomplete', gid, act, sorted(g['frames'])); continue
    pick = {i: sorted(g['frames'][i], key=lambda t: '/registered/' not in t[1])[0] for i in (1, 2, 3, 4)}  # registered first
    imgs = [np.asarray(Image.open(io.BytesIO(pick[i][2])).convert('RGBA')).astype(np.float32) for i in (1, 2, 3, 4)]
    H = max(a.shape[0] for a in imgs); W = max(a.shape[1] for a in imgs)
    registered = all('/registered/' in pick[i][1] for i in (1, 2, 3, 4))
    keys = []
    if registered:  # already on one canvas: keep the artist's placement
        for a in imgs:
            c = np.zeros((H, W, 4), np.float32); c[:a.shape[0], :a.shape[1]] = a; keys.append(c)
    else:  # separate quadrant cuts: put every key's feet on one baseline and its body centre on one column
        bs = [bbox(a[..., 3]) for a in imgs]; foot = max(b[3] for b in bs)
        cxs = [float(np.nonzero(a[b[1]:b[1] + int((b[3] - b[1]) * .6), b[0]:b[2], 3] >= A)[1].mean() + b[0]) for a, b in zip(imgs, bs)]
        F = H + 8; H2, W2 = F + H, W * 2; mid = W
        for a, b, cx in zip(imgs, bs, cxs):
            c = np.zeros((H2, W2, 4), np.float32); dy = F - b[3]; dx = int(round(mid - cx))
            c[dy:dy + a.shape[0], dx:dx + a.shape[1]] = a; keys.append(c)
        H, W = H2, W2
    boxes = [bbox(k[..., 3]) for k in keys]
    ux0, uy0 = max(0, min(b[0] for b in boxes) - PAD), max(0, min(b[1] for b in boxes) - PAD)
    ux1, uy1 = min(W, max(b[2] for b in boxes) + PAD), min(H, max(b[3] for b in boxes) + PAD)
    vis = float(np.median([b[3] - b[1] for b in boxes])); sc = TARGET_H / vis
    cw, ch = round((ux1 - ux0) * sc), round((uy1 - uy0) * sc)
    strip = Image.new('RGBA', (cw * 4, ch), (0, 0, 0, 0))
    for i, a in enumerate(keys):
        cell = a[uy0:uy1, ux0:ux1].copy(); cell[..., :3] *= cell[..., 3:4] / 255
        r = np.asarray(Image.fromarray(cell.clip(0, 255).astype(np.uint8), 'RGBA').resize((cw, ch), Image.BOX if sc < .5 else Image.LANCZOS)).astype(np.float32)
        aa = r[..., 3:4]; rgb = np.where(aa > 0, r[..., :3] * 255 / np.maximum(aa, 1), 0)
        strip.paste(Image.fromarray(np.concatenate([rgb, aa], -1).clip(0, 255).astype(np.uint8), 'RGBA'), (i * cw, 0))
    ground = float(np.median([b[3] for b in boxes]))
    k1 = keys[0][..., 3]; x0, y0, x1, y1 = boxes[0]; core = k1[y0:y0 + int((y1 - y0) * .6), x0:x1]
    cx = float(np.nonzero(core >= A)[1].mean() + x0)
    pivot = [round((cx - ux0) * sc, 2), round((ground - uy0) * sc, 2)]
    name = f'{gid}-{act}.png'; p = out / name; strip.save(p, optimize=True); b = p.read_bytes()
    ids = ONLY.get(gid) or CSV[gid]
    t = {'group': gid, 'ids': ids, 'track': act, 'kind': 'walk', 'path': 'assets/r116/mobs/' + name, 'frames': 4, 'cell': [cw, ch], 'pivot': pivot,
         'visibleHeight': TARGET_H, 'bytes': len(b), 'sha256': sha(b), 'use': f"{NAME.get(gid, gid)} · {'맞음·회복' if act == 'hit' else '대기'} 4키 (R119)",
         'groundSpreadPx': int(max(bb[3] for bb in boxes) - min(bb[3] for bb in boxes)),
         'source': {'zips': g['zips'], 'frames': [{'zip': pick[i][0], 'png': pick[i][1], 'sha256': sha(pick[i][2])} for i in (1, 2, 3, 4)]}}
    index['tracks'] = [x for x in index['tracks'] if not (x['group'] == gid and x['track'] == act)] + [t]; made.append(t)
    print(gid, act, 'cell', cw, ch, 'pivot', pivot, 'ids', ids, 'bytes', len(b), 'spread', t['groundSpreadPx'])
index['revision'] = 'R116+R119'; index['note'] = index.get('note', '') + ' R119: Drive 2026-10-29 맞음·대기 4키 6종 추가.'
idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding='utf-8')
print(len(made), 'tracks added;', len(index['tracks']), 'total')
