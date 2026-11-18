#!/usr/bin/env python3
"""R1139b: Dots 최종 인계 그림(EGO-R1139 A·B·C)을 게임용 webp 로 줄여 담는다. 원본은 건드리지 않는다.
usage: python3 -I pack_dots.py <raw dir(A,B,C 가 풀린 곳)> <out dir(r96/runtime-text/assets/r1139/ego)>"""
import sys, os, json, hashlib
from PIL import Image
raw, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
JOBS = [  # (원본, 결과, 원본 칸, 결과 칸, 칸 수, 용도)
 ('A/body/01_front.png', 'slash-front.webp', 512, 256, 8, '기본 공격 가로 베기 · 앞'),
 ('A/body/01_rear.png', 'slash-rear.webp', 512, 256, 8, '기본 공격 가로 베기 · 뒤'),
 ('B/body/01_right.png', 'slash-right.webp', 512, 256, 8, '기본 공격 가로 베기 · 오른쪽(왼쪽은 좌우 뒤집기)'),
 ('C/fx/07A_horizontal.png', 'trail-horizontal.webp', 512, 256, 6, '가로 베기 붓 궤적'),
 ('C/fx/08_impact.png', 'impact.webp', 256, 128, 8, '적중 먹 튐'),
 ('C/fx/09_shield.png', 'shield.webp', 512, 256, 8, '되비친 집착 보호막 고리'),
 ('C/ui/10_icons.png', 'icons.webp', 256, 128, 7, 'EGO 조작 아이콘 7'),
]
rows = []
for src, dst, c0, c1, n, use in JOBS:
    p = os.path.join(raw, src); im = Image.open(p).convert('RGBA')
    assert im.size == (c0 * n, c0), (src, im.size)
    small = im.resize((c1 * n, c1), Image.LANCZOS)
    q = os.path.join(out, dst); small.save(q, 'WEBP', quality=92, method=6, exact=False)
    rows.append({'source': src, 'sourceSha256': hashlib.sha256(open(p, 'rb').read()).hexdigest(), 'sourceBytes': os.path.getsize(p), 'sourceCell': c0,
                 'file': dst, 'sha256': hashlib.sha256(open(q, 'rb').read()).hexdigest(), 'bytes': os.path.getsize(q), 'cell': c1, 'frames': n, 'use': use})
json.dump({'handoff': 'EGO-R1139_클로드_사용자선택_최종인계 (A·B·C)', 'files': rows}, open(os.path.join(out, 'index.json'), 'w'), ensure_ascii=False, indent=1)
for r in rows: print(r['file'], r['bytes'])
