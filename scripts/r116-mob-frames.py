#!/usr/bin/env python3
"""R116 잡몹 맞음·대기 4키: Drive 2026-10-28 '적용본 · 게임 반영 전'(ASSET-READY) 묶음 40동작 -> R92/R109 형식 가로 스트립.
묶음의 padded 프레임(키 4장이 이미 같은 캔버스·같은 배율로 정렬됨)을 그대로 쓰고, 다시 정렬하거나 키마다 늘리지 않는다.
네 키의 합친 알파 상자로 자르고, 가시 높이 중앙값을 150px로 맞춘다(R92·R109 규약). 피벗은 발밑(알파 하단 중앙값)과 K1 몸통 중심.
몹 ID는 묶음 문서에 적힌 ID를, 없으면 감사 스냅샷(MONSTER-AUDIT.csv)의 그룹 ID를 쓴다.
Usage: python3 -I scripts/r116-mob-frames.py <dir with downloaded StoryWorld-M*.zip> <audit snapshot zip> r96/runtime-text/assets/r116/mobs
"""
import sys, json, hashlib, zipfile, io, re, csv, collections
from pathlib import Path
import numpy as np
from PIL import Image
src, audit, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]); out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
TARGET_H, PAD, A = 150, 3, 16
IDRE = re.compile(r'\b([a-z]{1,6}\d{2,3}[a-z]?-[a-z]{1,3}\d{1,2})\b')
rows = list(csv.DictReader(io.StringIO(zipfile.ZipFile(audit).read('MONSTER-AUDIT.csv').decode('utf-8-sig'))))
CSV = collections.defaultdict(list); NAME = {}
for r in rows:
    if r['registry_id'] not in CSV[r['group']]: CSV[r['group']].append(r['registry_id'])
    NAME.setdefault(r['group'], r['name'])

groups = collections.defaultdict(lambda: {'zips': [], 'frames': {}, 'text': ''})
for z in sorted(src.glob('StoryWorld-M*.zip')):
    n = z.name
    if not re.search(r'ASSET-READY|asset-ready|-corrected-', n): continue
    m = re.match(r'StoryWorld-(M\d+)-([a-z-]+?)4', n)
    if not m: continue
    act = 'hit' if 'hit' in m.group(2) else 'idle' if 'idle' in m.group(2) else None
    if not act: continue
    g = groups[(m.group(1), act)]; Z = zipfile.ZipFile(z); b = z.read_bytes(); g['zips'].append({'name': n, 'bytes': len(b), 'sha256': sha(b)})
    for i in Z.infolist():
        f = i.filename; k = re.search(r'K([1-4])(?:-padded)?\.png$', f)
        if k and 'frames/' in f and 'crops' not in f and 'REVIEW' not in f: g['frames'][int(k.group(1))] = (n, f, Z.read(f))
        if f.endswith(('.json', '.txt')): g['text'] += Z.read(f).decode('utf-8', 'ignore') + '\n'

def bbox(a):
    ys, xs = np.nonzero(a >= A); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

tracks = []
for (gid, act), g in sorted(groups.items()):
    if sorted(g['frames']) != [1, 2, 3, 4]: print('SKIP incomplete', gid, act, sorted(g['frames'])); continue
    keys = [np.asarray(Image.open(io.BytesIO(g['frames'][i][2])).convert('RGBA')).astype(np.float32) for i in (1, 2, 3, 4)]
    if len({k.shape for k in keys}) != 1: print('SKIP canvas mismatch', gid, act); continue
    boxes = [bbox(k[..., 3]) for k in keys]
    ux0, uy0 = min(b[0] for b in boxes) - PAD, min(b[1] for b in boxes) - PAD
    ux1, uy1 = max(b[2] for b in boxes) + PAD, max(b[3] for b in boxes) + PAD
    ux0, uy0 = max(0, ux0), max(0, uy0)
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
    ids = sorted(set(IDRE.findall(g['text'])) & set(CSV[gid])) or CSV[gid]
    tracks.append({'group': gid, 'ids': ids, 'track': act, 'kind': 'walk', 'path': 'assets/r116/mobs/' + name, 'frames': 4, 'cell': [cw, ch], 'pivot': pivot,
                   'visibleHeight': TARGET_H, 'bytes': len(b), 'sha256': sha(b), 'use': f"{NAME.get(gid, gid)} · {'맞음·회복' if act == 'hit' else '대기'} 4키",
                   'groundSpreadPx': int(max(bb[3] for bb in boxes) - min(bb[3] for bb in boxes)),
                   'source': {'zips': g['zips'], 'frames': [{'zip': g['frames'][i][0], 'png': g['frames'][i][1], 'sha256': sha(g['frames'][i][2])} for i in (1, 2, 3, 4)]}})
    print(gid, act, 'cell', cw, ch, 'pivot', pivot, 'ids', ids, 'bytes', len(b))
(out / 'index.json').write_text(json.dumps({'schema': 'storyworld.r109.mobs/v1', 'revision': 'R116', 'note': 'Drive 2026-10-28 적용본(게임 반영 전) 맞음·대기 4키. 원본 보존·가공 사본.', 'tracks': tracks}, ensure_ascii=False, indent=1))
print(len(tracks), 'tracks')
