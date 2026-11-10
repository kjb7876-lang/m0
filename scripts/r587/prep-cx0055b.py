# R587 Dots CX-0055B r3 손질본(슬레이어 9장) → 게임용 192 칸 webp + index.json.
# 입력 폴더는 신뢰하지 않는 데이터: 이미지(webp)만 읽고 그 안의 스크립트는 실행하지 않는다.
# 사용: python3 -I scripts/r587/prep-cx0055b.py <Dots sheets 폴더> r96/runtime-text/assets/r587
import json, os, sys, hashlib
import numpy as np
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
CELL, OUTCELL, COLS, ROWS = 256, 192, 6, 4
# 게임 이름 ← Dots 파일, 쓰임, 피벗(256 칸 기준), 타격 칸, 재생 속도
SHEETS = {
    'slayer-w-cross2':   ('slayer-blood-cross.webp',      'W 피의 희생 십자(SL07b)', [128, 192], 8, 14, False),
    'slayer-e-floor':    ('slayer-floor-slash.webp',      'E 피의 대시 바닥 자국(SL05b)', [128, 210], 4, 16, False),
    'slayer-bleed2':     ('slayer-bleed-drip.webp',       'Q 출혈 방울(SL06b)', [128, 220], None, 16, False),
    'slayer-q-thorn-back':  ('slayer-thorn-ring-back.webp',  'Q 시전 가시 고리 뒤(SL04b)', [128, 150], None, 40, True),
    'slayer-q-thorn-front': ('slayer-thorn-ring-front.webp', 'Q 시전 가시 고리 앞(SL04b)', [128, 150], None, 40, True),
    'slayer-hit':        ('slayer-slash-spray.webp',      'W·E 적중 베기+피 튐(SL11)', [132, 158], 3, 24, False),
    'slayer-exec':       ('slayer-blood-spike.webp',      'R586 처형 피 가시(SL12)', [128, 221], 9, 18, False),
    'slayer-chain':      ('slayer-chain-pull.webp',       'R586 피사슬 끌기(SL13, 왼쪽 끝=영웅)', [28, 200], 7, 30, False),
    'slayer-mark':       ('slayer-blood-mark.webp',       'R586 피의 낙인 5개(SL14)', [128, 105], None, 12.5, True),
}
index = {'schema': 'storyworld.r587.slayer-sheets.v1', 'request': 'CX-0055B r3', 'author': 'Dots 초안 + Dots 손질본 → Claude 192 칸',
         'sourceCell': CELL, 'sheets': {}}
for name, (src, use, pivot, hit, fps, loop) in SHEETS.items():
    p = os.path.join(SRC, src)
    raw = open(p, 'rb').read()
    im = Image.open(p).convert('RGBA')
    assert im.size == (CELL * COLS, CELL * ROWS), (src, im.size)
    a = np.asarray(im).astype(np.float32) / 255.0
    # 알파 곱한 뒤 줄이고 다시 나눈다(가장자리 검은 테 방지)
    pm = a.copy(); pm[..., :3] *= pm[..., 3:4]
    small = np.asarray(Image.fromarray((pm * 255).round().astype(np.uint8), 'RGBA').resize((OUTCELL * COLS, OUTCELL * ROWS), Image.LANCZOS)).astype(np.float32) / 255.0
    al = np.maximum(small[..., 3:4], 1e-6)
    small[..., :3] = np.where(small[..., 3:4] > 0, np.clip(small[..., :3] / al, 0, 1), 0)
    small[small[..., 3] < 3 / 255.0] = 0
    out = os.path.join(OUT, name + '.webp')
    Image.fromarray((small * 255).round().astype(np.uint8), 'RGBA').save(out, 'WEBP', quality=88, method=6)
    data = open(out, 'rb').read()
    index['sheets'][name] = {'use': use, 'loop': loop, 'hit': hit, 'pivot': pivot, 'fps': fps, 'frames': 24, 'cell': OUTCELL, 'cols': COLS, 'rows': ROWS,
                             'source': src, 'sourceSha256': hashlib.sha256(raw).hexdigest(), 'file': name + '.webp', 'bytes': len(data),
                             'sha256': hashlib.sha256(data).hexdigest()}
json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: v['bytes'] for k, v in index['sheets'].items()}), sum(v['bytes'] for v in index['sheets'].values()))
