#!/usr/bin/env python3
"""R198 잡몹 8키(Drive 2026-10-29~30 'eight-key' 묶음) -> 게임에 아직 없는 동작만 R109 형식 가로 스트립으로.

묶음마다 대기2·공격2·맞음2·이동2 원본 PNG(크기·캔버스가 동작마다 다름)가 들어 있다. 맞음은 R116 4키(같은 원본)가 이미 들어가 있으므로 쓰지 않는다.
게임에 이미 있는 동작(R92 이동·공격, R109 이동, R116/R119 대기)은 덮지 않고, 빈 동작만 채운다.
  · 동작 하나(2장)마다 각 장의 알파 상자로 자르고, 두 장 가시 높이 중앙값을 150px 로 맞춘다(같은 배율 → 몸 크기 유지).
  · 두 장을 발밑(알파 하단)·몸통 중심(위 60%)으로 맞춰 같은 칸에 놓는다. 피벗 = 칸 가운데 아래.
  · 원본이 바라보는 방향이 같은 몹의 기존 스트립과 반대이면(FLIP 표, 눈으로 확인) 좌우만 뒤집는다.
  · 두 장의 가시 높이 차가 35% 넘으면 그 동작은 쓰지 않는다(자세가 너무 달라 튐).
원본은 저장소 밖 스테이징에 그대로 두고, 파생본과 index.json(묶음 sha256·원본 프레임 sha256·고른 이유)만 넣는다.
Usage: python3 -I scripts/r198-mob-eightkey.py <zips dir> <audit snapshot zip> r96/runtime-text/assets r96/runtime-text/assets/r198/mobs
"""
import sys, json, hashlib, zipfile, io, re, csv, collections
from pathlib import Path
import numpy as np
from PIL import Image

src, audit, assets, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]), Path(sys.argv[4])
out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
TARGET_H, PAD, A = 150, 3, 16
FLIP = json.loads(sys.argv[5]) if len(sys.argv) > 5 else {}  # {"M022-move": true}
NAMES = {'move': '이동', 'attack': '공격', 'idle': '대기'}

# --- 이미 게임에 있는 동작 ---------------------------------------------------------------
have = collections.defaultdict(set); IDS = {}
r92 = json.loads((assets / 'r92/mobs/index.json').read_text())
for g, v in r92['groups'].items():
    IDS[g] = v.get('ids') or []
    have[g] |= set(v.get('tracks', {}))
for p in ['r109/mobs/index.json', 'r116/mobs/index.json']:
    for t in json.loads((assets / p).read_text())['tracks']:
        have[t['group']].add(t['track']); IDS.setdefault(t['group'], t.get('ids') or [])
rows = list(csv.DictReader(io.StringIO(zipfile.ZipFile(audit).read('MONSTER-AUDIT.csv').decode('utf-8-sig'))))
CSV = collections.defaultdict(list); NAME = {}
for r in rows:
    if r['registry_id'] not in CSV[r['group']]: CSV[r['group']].append(r['registry_id'])
    NAME.setdefault(r['group'], r['name'])

# --- 묶음 읽기(PART-MANIFEST sha256 확인) ------------------------------------------------------
G = collections.defaultdict(lambda: {'zips': [], 'frames': collections.defaultdict(dict), 'bad': 0})
for z in sorted(src.glob('StoryWorld-M*-eight-key*.zip')):
    gid = re.search(r'(M\d{3})', z.name).group(1); b = z.read_bytes(); Z = zipfile.ZipFile(z)
    g = G[gid]; g['zips'].append({'name': z.name, 'bytes': len(b), 'sha256': sha(b)})
    man = {}
    for n in Z.namelist():
        if n.endswith('PART-MANIFEST.json'): man = json.loads(Z.read(n)).get('files', {})
    for n in Z.namelist():
        m = re.search(r'frames/(idle|attack|move|hit)_(\d+)\.png$', n)
        if not m: continue
        data = Z.read(n); rel = n.split('/', 1)[1]
        if rel in man and man[rel].get('sha256') != sha(data): g['bad'] += 1; continue
        g['frames'][m.group(1)][int(m.group(2))] = (z.name, n, data)

def bbox(a):
    ys, xs = np.nonzero(a >= A); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

def premul_resize(a, w, h, sc):
    a = a.copy(); a[..., :3] *= a[..., 3:4] / 255
    r = np.asarray(Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA').resize((w, h), Image.BOX if sc < .5 else Image.LANCZOS)).astype(np.float32)
    aa = r[..., 3:4]; rgb = np.where(aa > 0, r[..., :3] * 255 / np.maximum(aa, 1), 0)
    return np.concatenate([rgb, aa], -1)

tracks, skipped = [], []
for gid, g in sorted(G.items()):
    if g['bad']: skipped.append({'group': gid, 'why': 'sha256 mismatch %d' % g['bad']}); continue
    for act in ('move', 'attack', 'idle'):
        if act in have[gid]: continue
        fr = g['frames'].get(act, {})
        if sorted(fr) != [1, 2]: skipped.append({'group': gid, 'track': act, 'why': 'frames %s' % sorted(fr)}); continue
        keys = [np.asarray(Image.open(io.BytesIO(fr[i][2])).convert('RGBA')).astype(np.float32) for i in (1, 2)]
        boxes = [bbox(k[..., 3]) for k in keys]
        hs = [b[3] - b[1] for b in boxes]
        if max(hs) / min(hs) > 1.35: skipped.append({'group': gid, 'track': act, 'why': 'height jump %.2f' % (max(hs) / min(hs))}); continue
        sc = TARGET_H / float(np.median(hs))
        cells = []
        for k, (x0, y0, x1, y1) in zip(keys, boxes):
            crop = k[y0:y1, x0:x1]; w, h = max(1, round((x1 - x0) * sc)), max(1, round((y1 - y0) * sc))
            img = premul_resize(crop, w, h, sc)
            core = crop[: int((y1 - y0) * .6), :, 3]; cx = float(np.nonzero(core >= A)[1].mean()) * sc
            cells.append((img, cx))
        half = max(max(cx, img.shape[1] - cx) for img, cx in cells)
        cw, ch = int(np.ceil(half * 2)) + PAD * 2, max(img.shape[0] for img, _ in cells) + PAD
        strip = np.zeros((ch, cw * 2, 4), np.float32)
        for i, (img, cx) in enumerate(cells):
            ox = int(round(i * cw + cw / 2 - cx)); oy = ch - img.shape[0]
            strip[oy:oy + img.shape[0], ox:ox + img.shape[1]] = img
        im = Image.fromarray(strip.clip(0, 255).astype(np.uint8), 'RGBA')
        key = gid + '-' + act
        if FLIP.get(key):  # 칸마다 좌우 뒤집기(칸 순서는 그대로)
            im = Image.fromarray(np.concatenate([np.asarray(im)[:, i * cw:(i + 1) * cw][:, ::-1] for i in range(2)], 1), 'RGBA')
        name = key + '.png'; p = out / name; im.save(p, optimize=True); b = p.read_bytes()
        ids = IDS.get(gid) or CSV.get(gid) or []
        tracks.append({'group': gid, 'ids': ids, 'track': act, 'kind': 'walk', 'path': 'assets/r198/mobs/' + name, 'frames': 2, 'cell': [cw, ch],
                       'pivot': [round(cw / 2, 2), ch], 'visibleHeight': TARGET_H, 'bytes': len(b), 'sha256': sha(b), 'flipped': bool(FLIP.get(key)),
                       'use': f"{NAME.get(gid, gid)} · {NAMES[act]} 2키 (게임에 없던 동작만 채움)", 'heightRatio': round(max(hs) / min(hs), 3),
                       'source': {'zips': g['zips'], 'frames': [{'zip': fr[i][0], 'png': fr[i][1], 'sha256': sha(fr[i][2])} for i in (1, 2)]}})
        print(gid, act, 'cell', cw, ch, 'ids', ids, 'ratio %.2f' % (max(hs) / min(hs)), 'flip' if FLIP.get(key) else '')
(out / 'index.json').write_text(json.dumps({'schema': 'storyworld.r109.mobs/v1', 'revision': 'R198',
    'note': 'Drive 2026-10-29~30 eight-key 묶음에서 게임에 없던 이동·공격·대기만 채운 가공 사본. 원본 보존, 맞음은 R116 4키 유지. 완성 루프 승인 아님(묶음 표기: smooth_loop_validated=false).',
    'tracks': tracks, 'skipped': skipped}, ensure_ascii=False, indent=1))
print(len(tracks), 'tracks', len(skipped), 'skipped', skipped)
