#!/usr/bin/env python3
"""R437: 하늘맵(ep1b08 '하늘에 서려는 자') 전극기계수호기사 — Dots 2026-11-06 후보 v1 (검수 목록 41 "하늘맵에는 전극기계수호기사 재생성").
원본 Drive ZIP(SW-ep1b08-electrode-machine-knight-v1-02-frames-20261106.zip, sha256 e340760c…)은 읽기 전용. 축소·시트 묶기·투명 잔티 정리만 한다.
R380 index.json 에 줄 하나를 더하거나(같은 id 면 바꿈) — R380 스크립트 전체를 다시 돌리지 않는다(이전 stage 폴더 26개가 필요해서).
사용: python3 -I scripts/r437-electrode-knight.py <02-frames 를 푼 폴더>"""
import sys, json, hashlib, pathlib
from PIL import Image
ST = pathlib.Path(sys.argv[1]); ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'r96/runtime-text/assets/r380/mobs'; IDX = OUT / 'index.json'
ZIP_SHA = 'e340760c67e5c7fab059837c647c0f8d46529ccdc2e49cd4c3d33b97d1eb4ab6'
def sha(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
d = next(ST.glob('*/frames'))
names = [f'move-0{i}.png' for i in range(1, 5)] + [f'attack-0{i}.png' for i in range(1, 5)]
src = [Image.open(d / n).convert('RGBA') for n in names]
# 알파 1~16 잔티(README: move-02 하단 1/255 잔여) 지우기 — 발광 가장자리(17 이상)는 그대로
def clean(im):
    r, g, b, a = im.split(); a = a.point(lambda v: 0 if v <= 16 else v); return Image.merge('RGBA', (r, g, b, a))
src = [clean(f) for f in src]
bb = [f.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox() for f in src]
foot = ((min(b[0] for b in bb) + max(b[2] for b in bb)) / 2, max(b[3] for b in bb))
body = max(b[3] - b[1] for b in bb)
SC = .5; CW = CH = round(512 * SC); COLS = 8
S = Image.new('RGBA', (CW * COLS, CH), (0, 0, 0, 0))
for i, f in enumerate(src): S.paste(f.resize((CW, CH), Image.LANCZOS), (i * CW, 0))
p = OUT / 'electrode-machine-knight-v1.webp'; S.save(p, 'WEBP', lossless=True, method=6)
row = {'id': 'electrode-machine-knight-v1', 'kind': 'strip', 'path': 'assets/r380/mobs/' + p.name, 'cell': [CW, CH], 'cols': COLS,
       'pivot': [round(foot[0] * SC, 2), round(foot[1] * SC, 2)],
       # 같은 하늘맵 육망성의 흑마술 실험체(210)·되살아난 방패동료(168.5) 사이 — 갑주 기사라 실험체보다 조금 작게
       'visibleHeight': 196.0, 'move': [0, 1, 2, 3], 'attack': [4, 5, 6, 7], 'idle': [0], 'facing': 'right',
       'actor': {'layer': 'STORY', 'zone': 'ep1b08', 'name': '^(전극기계수호기사|전극을 두른 좀비 수호기사)'},  # 이름은 approved-mobs-r380.js RENAME 이 꼬리(우두머리·번호) 살려 바꿈
       'bytes': p.stat().st_size, 'sha256': sha(p),
       'source': {'zip': 'SW-ep1b08-electrode-machine-knight-v1-02-frames-20261106.zip', 'zipSha256': ZIP_SHA,
                  'frames': [{'file': n, 'sha256': sha(d / n)} for n in names], 'bodyPx512': body},
       'finalArt': False}
idx = json.loads(IDX.read_text())
idx['mobs'] = [m for m in idx['mobs'] if m['id'] != row['id']]
idx['mobs'].insert(0, row)  # 앞쪽 줄이 먼저 맞으므로 맨 앞
idx['revision'] = 'R437'
IDX.write_text(json.dumps(idx, ensure_ascii=False, indent=1))
print(row['id'], row['cell'], row['pivot'], row['bytes'], 'body512', body)
