#!/usr/bin/env python3
# R529 자산 기록(assets/r529/index.json)을 실제 파일의 크기·해시로 다시 쓴다.
#   python3 r96/qa/r523/tools/index-r529.py
import hashlib, json, os
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'runtime-text'))
DIR = os.path.join(ROOT, 'assets', 'r529')
ROWS = {
    'floor-lamp.webp': ('Dots CX-0066RM r1 서 있는 전등(RM-07) 한 장 -> 여백 잘라 내고 크기 줄임(덧칠·각도 보정 없음)', 'Dots 가구 그림(방향 없는 서 있는 물건)', '질투의 집 응접실·읽는 서재의 소파 곁 전등'),
}
files = []
for name in sorted(f for f in os.listdir(DIR) if f != 'index.json'):
    b = open(os.path.join(DIR, name), 'rb').read()
    src, kind, use = ROWS[name]
    files.append({'file': 'assets/r529/' + name, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(),
                  'size': list(Image.open(os.path.join(DIR, name)).size), 'source': src, 'kind': kind, 'use': use, 'applied': True})
doc = {
    'round': 'R529',
    'note': '질투의 집 소파 곁에 서 있는 전등. 그림만 놓는다(빛을 따로 그리지 않음). 원본은 그대로 둔다. 드라이브 파일 ID 는 적지 않는다.',
    'reused': ['assets/r524/sofa-n.webp', 'assets/r524/sofa-w.webp'],
    'stillMissing': [{'name': '서재 책상·찬장·조리대·식재료 선반·개수대·벽등', 'why': 'Dots CX-0066RM 추가1 요청(r2) 대기'}],
    'files': files,
}
json.dump(doc, open(os.path.join(DIR, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('r529 index', len(files), 'files', sum(f['bytes'] for f in files), 'bytes')
