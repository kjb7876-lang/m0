#!/usr/bin/env python3
"""R1092 서사 창 장면 그림 만들기.
원본: 사용자 드라이브의 세로판 장면 그림 A01~A56(768x1376 PNG, 읽기 전용 재사용). 원본은 저장소에 넣지 않는다.
처리: 아래쪽 워터마크 줄(y>1216)을 잘라내고(붉은 하이힐은 위아래가 같은 그림을 이어 붙인 판이라 이음매 위 한 판 y<688 만),
      가로 600 으로 줄여 webp(q80)로 r96/runtime-text/assets/r1092/scene-<지역>.webp 에 쓴다. 맘몬(ep1b06)은 만들지 않는다.
사용: python3 scripts/r1092-scene-art.py <원본 폴더>
"""
import sys, os, re, json, hashlib
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1]
idx = open(os.path.join(ROOT, 'r96/runtime-text/index.html'), encoding='utf8').read()
regions = re.findall(r'"id":"([a-z0-9]+)","index":\d+,"chapter":"[^"]*","chapterIndex":\d+,"title":"([^"]*)"', idx)
norm = lambda s: re.sub(r'[\s_,.·\-]', '', s)
title_to_id = {}
for rid, title in regions:
    title_to_id[norm(title)] = (rid, title)
    title_to_id[norm(title.split('·')[0])] = (rid, title)
out_dir = os.path.join(ROOT, 'r96/runtime-text/assets/r1092')
os.makedirs(out_dir, exist_ok=True)
items = []
for fn in sorted(os.listdir(SRC)):
    m = re.match(r'A(\d+)_장면[0-9\-]+_(.+)\.png$', fn)
    if not m:
        continue
    key = norm(m.group(2))
    hit = title_to_id.get(key) or next((v for k, v in title_to_id.items() if k.startswith(key) or key.startswith(k)), None)
    if not hit:
        print('no region for', fn); continue
    rid, title = hit
    if rid == 'ep1b06':
        continue  # 맘몬 지역은 Codex 몫
    raw = open(os.path.join(SRC, fn), 'rb').read()
    im = Image.open(os.path.join(SRC, fn)).convert('RGB')
    crop = [0, 0, im.width, 688 if rid == 'ep1b05' else 1216]
    im = im.crop(tuple(crop))
    w = 600; h = round(im.height * w / im.width)
    im = im.resize((w, h), Image.LANCZOS)
    rel = f'assets/r1092/scene-{rid}.webp'
    im.save(os.path.join(ROOT, 'r96/runtime-text', rel), 'WEBP', quality=80, method=6)
    items.append({'region': rid, 'title': title, 'path': rel, 'size': [w, h], 'crop': crop,
                  'source': fn, 'sourceSize': [768, 1376], 'sourceBytes': len(raw),
                  'sourceSha256': hashlib.sha256(raw).hexdigest(),
                  'bytes': os.path.getsize(os.path.join(ROOT, 'r96/runtime-text', rel))})
items.sort(key=lambda i: [r for r, _ in regions].index(i['region']))
meta = {'revision': 'R1092', 'use': '서사 창(advanceScene) 왼쪽 그림 칸 배경', 'origin': '사용자 드라이브 세로판 장면 그림(사용자 업로드, 2026-11-14). 생성 도구 표식(오른쪽 아래 별 모양)은 잘라냄.',
        'excluded': {'ep1b06': '맘몬 지역은 Codex 작업 몫이라 손대지 않음'}, 'items': items}
json.dump(meta, open(os.path.join(ROOT, 'r96/r1092-scene-art.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print(len(items), 'items', sum(i['bytes'] for i in items), 'bytes')
