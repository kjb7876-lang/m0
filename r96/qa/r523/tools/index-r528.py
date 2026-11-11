#!/usr/bin/env python3
# R528 자산 기록(assets/r528/index.json)을 실제 파일의 크기·해시로 다시 쓴다.
#   python3 r96/qa/r523/tools/index-r528.py
import hashlib, json, os
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'runtime-text'))
DIR = os.path.join(ROOT, 'assets', 'r528')
ROWS = {
    'bookshelf-n.webp': ('Dots CX-0066RM r1 FURNITURE-bookshelf-westwall-sw-v1-20261110.png -> 바닥 모서리를 2:1 로 바로잡음(세로줄 그대로, 열마다 세로 밀기 k=0.109·늘이기 c=1.087), 여백 잘라 내고 크기 줄임', 'Dots 두 방향 가구 그림(각도 보정)', '질투의 집 서재의 책장(북쪽 벽용)'),
    'bookshelf-w.webp': ('Dots CX-0066RM r1 FURNITURE-bookshelf-northwall-se-v1-20261110.png -> 바닥 모서리를 2:1 로 바로잡음(k=-0.108·c=1.031), 여백 잘라 내고 크기 줄임', 'Dots 두 방향 가구 그림(각도 보정)', '질투의 집 서재의 책장(서쪽 벽용)'),
}
files = []
for name in sorted(f for f in os.listdir(DIR) if f != 'index.json'):
    b = open(os.path.join(DIR, name), 'rb').read()
    src, kind, use = ROWS[name]
    files.append({'file': 'assets/r528/' + name, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(),
                  'size': list(Image.open(os.path.join(DIR, name)).size), 'source': src, 'kind': kind, 'use': use, 'applied': True})
doc = {
    'round': 'R528',
    'note': '질투의 집 서재 책장. Dots 원본은 바닥 긴 모서리가 약 20도라 그대로 쓰지 않고, 세로줄은 둔 채 기울기만 2:1 로 바로잡았다. 두 장 높이는 게임에서 같게 맞췄다. 원본은 그대로 둔다. 드라이브 파일 ID 는 적지 않는다.',
    'reused': ['assets/r523/wardrobe-n.webp', 'assets/r523/table-n.webp', 'assets/r523/chair-back-n.webp'],
    'stillMissing': [{'name': '서재 책상·찬장·조리대·식재료 선반·개수대·벽등', 'why': 'Dots CX-0066RM 추가1 요청(r2) 대기'}],
    'files': files,
}
json.dump(doc, open(os.path.join(DIR, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('r528 index', len(files), 'files', sum(f['bytes'] for f in files), 'bytes')
