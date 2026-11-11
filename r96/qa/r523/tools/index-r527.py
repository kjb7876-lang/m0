#!/usr/bin/env python3
# R527 자산 기록(assets/r527/index.json)을 실제 파일의 크기·해시로 다시 쓴다.
#   python3 r96/qa/r523/tools/index-r527.py
import hashlib, json, os
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'runtime-text'))
DIR = os.path.join(ROOT, 'assets', 'r527')
FIX = '기존 게임 그림 %s -> 바닥 모서리를 2:1 로 바로잡음(tools/shear.py, 세로줄 그대로, 늘이기 c=%s·밀기 k=%s), 여백 잘라 내고 크기 줄임'
ROWS = {
    'body-rig.webp': (FIX % ('assets/world-r80/r80-002.webp', '0.857', '0.048'), '기계 육체 거치대(한 방향 그림)', '중앙 코어 이주실 기계 육체실, 닫힌 구획'),
    'pod.webp': (FIX % ('assets/world-r80/r80-152.webp', '0.873', '-0.064'), '캡슐(한 방향 그림)', '기억의 방·중앙 이주실·보호 구획'),
    'gothic-tank.webp': (FIX % ('assets/world-r80/r80-075.webp', '0.881', '0.147'), '고딕 기계 수조(한 방향 그림)', '기억의 방·중앙 이주실·수확실'),
    'lantern-steps.webp': (FIX % ('assets/world-r80/r80-064.webp', '1.016', '-0.110'), '등불 계단(한 방향 그림)', '사몽의 문턱 수확실·방벽 구획·코어 전실·입구'),
    'stone-barrier.webp': (FIX % ('assets/world-r80/r80-069.webp', '0.953', '0.095'), '돌 방벽(한 방향 그림)', '사몽의 문턱 방벽 구획'),
}
files = []
for name in sorted(f for f in os.listdir(DIR) if f != 'index.json'):
    b = open(os.path.join(DIR, name), 'rb').read()
    src, kind, use = ROWS[name]
    files.append({'file': 'assets/r527/' + name, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(),
                  'size': list(Image.open(os.path.join(DIR, name)).size), 'source': src, 'kind': kind, 'use': use, 'applied': True})
doc = {
    'round': 'R527',
    'note': '넷째 묶음(관리자 권한·중앙 코어 이주실·사몽의 문턱) 방 꾸미기용. 기존 게임 그림의 바닥 각도만 바로잡은 사본이며 새로 그린 그림이 아니다. 원본 r80 그림은 그대로 두고 다른 곳에서 계속 쓴다. 한 방향 그림이라 반대쪽 벽에서는 좌우 거울로 쓴다.',
    'reused': ['assets/world-r80/r80-001.webp', 'assets/world-r80/r80-054.webp', 'assets/world-r80/r80-058.webp', 'assets/world-r80/r80-061.webp', 'assets/world-r80/r80-065.webp', 'assets/world-r80/r80-151.webp', 'assets/r406/props/server-cooler.webp'],
    'notUsed': [{'name': 'assets/world-r80/r80-062.webp(팔각 관)', 'why': '바닥 모서리가 한 선으로 재어지지 않아 바로잡으면 그림이 뭉개짐'}],
    'files': files,
}
json.dump(doc, open(os.path.join(DIR, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('r527 index', len(files), 'files', sum(f['bytes'] for f in files), 'bytes')
