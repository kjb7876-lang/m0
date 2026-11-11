#!/usr/bin/env python3
# R524 자산 기록(assets/r524/index.json)을 실제 파일의 크기·해시로 다시 쓴다.
#   python3 r96/qa/r523/tools/index-r524.py
import hashlib, json, os
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'runtime-text'))
DIR = os.path.join(ROOT, 'assets', 'r524')
ROWS = {
    'sofa-n.webp': ('기존 시트 assets/sin-rooms/envy-lounge.webp 의 소파 칸(왼쪽 아래 보는 쪽)을 잘라 냄', '기존 게임 자산 재사용(잘라 내기)', '질투의 집 거실·서재·거울 회랑의 긴 소파(북쪽 벽용)'),
    'sofa-w.webp': ('기존 시트 assets/sin-rooms/envy-lounge.webp 의 소파 칸(오른쪽 아래 보는 쪽)을 잘라 냄', '기존 게임 자산 재사용(잘라 내기)', '질투의 집 거실·서재·거울 회랑의 긴 소파(서쪽 벽용)'),
    'range-n.webp': ('드라이브(최근 3일) FURNITURE-range-westwall-sw-v1-20261109.png → 여백 잘라 내고 크기 줄임, 밝기 0.9배(냉장고 그림과 밝기 맞춤)', 'Dots 두 방향 가구 그림', '폭식의 주방 화구 구획·준비대의 가스 화구(북쪽 벽용)'),
    'range-w.webp': ('드라이브(최근 3일) FURNITURE-range-northwall-se-v1-20261109.png → 여백 잘라 내고 크기 줄임, 밝기 0.9배(냉장고 그림과 밝기 맞춤)', 'Dots 두 방향 가구 그림', '폭식의 주방 화구 구획·준비대의 가스 화구(서쪽 벽용)'),
}
files = []
for name in sorted(f for f in os.listdir(DIR) if f != 'index.json'):
    b = open(os.path.join(DIR, name), 'rb').read()
    src, kind, use = ROWS[name]
    files.append({'file': 'assets/r524/' + name, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(),
                  'size': list(Image.open(os.path.join(DIR, name)).size), 'source': src, 'kind': kind, 'use': use, 'applied': True})
doc = {
    'round': 'R524',
    'note': '방 꾸미기 둘째 묶음(질투의 집 ep1b03 · 폭식의 주방 ep1b04)에서 새로 만든 그림. 원본은 그대로 둔다. 바닥 각도가 2:1 격자와 맞는 것만 넣었다. 드라이브 파일 ID 는 적지 않는다.',
    'reused': ['assets/world-r80/r80-026.webp', 'assets/world-r80/r80-025.webp', 'assets/r523/wardrobe-n.webp', 'assets/r523/wardrobe-w.webp',
               'assets/r523/table-n.webp', 'assets/r523/table-w.webp', 'assets/r523/chair-n.webp', 'assets/r523/chair-w.webp',
               'assets/r523/chair-back-n.webp', 'assets/r523/chair-back-w.webp', 'assets/r523/sloth-fridge.webp'],
    'stillMissing': [
        {'name': '책장·책상·조리대·식재료 선반', 'why': '각도 맞는 두 방향 그림이 아직 없음 → Dots 요청서로 보냄. 그때까지 서재는 옷장·책상(탁자+의자)·소파, 보관실은 냉장고·옷장으로 채움'},
    ],
    'files': files,
}
json.dump(doc, open(os.path.join(DIR, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('r524 index', len(files), 'files', sum(f['bytes'] for f in files), 'bytes')
