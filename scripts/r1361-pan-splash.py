#!/usr/bin/env python3
"""R1361 — Dots SW-R1352 D10-04 베엘제붑 팬 먹 튐(256x256 24칸 가로 1줄, 피벗 128,128, 16fps)을 4096 한도용 12x2 격자로 다시 묶는다.
픽셀은 손대지 않음(webp 무손실 exact). 원본은 zip(SHA-256 d371441a…) 안 24f PNG(SHA-256 574f0db5…).
사용: python3 scripts/r1361-pan-splash.py <압축 푼 24f png>"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image
OUT = Path(__file__).resolve().parents[1] / 'r96/runtime-text/assets/r1361'; OUT.mkdir(exist_ok=True)
src = Path(sys.argv[1]); raw = src.read_bytes(); sha0 = hashlib.sha256(raw).hexdigest()
assert sha0.startswith('574f0db5'), sha0
im = Image.open(src).convert('RGBA'); assert im.size == (6144, 256), im.size
g = Image.new('RGBA', (3072, 512))
for i in range(24): g.paste(im.crop((i * 256, 0, i * 256 + 256, 256)), ((i % 12) * 256, (i // 12) * 256))
p = OUT / 'pan-splash24.webp'; g.save(p, 'WEBP', lossless=True, exact=True, method=6); b = p.read_bytes()
idx = {'pan-splash24': {'frames': 24, 'cell': [256, 256], 'cols': 12, 'pivot': [128, 128], 'fps': 16, 'final': True,
  'source': 'Dots SW-R1352-D10-04_beelzebub_pan_toss_24f.png (zip Drive 1w4ejuiWytMSmOYlyo2N1pOk3TtP_kfeO, SHA d371441a…)', 'dotsSha256': sha0,
  'process': 'repack 24x1 -> 12x2 grid (4096 limit), pixels unchanged, webp lossless exact', 'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b),
  'use': 'R1263 탐식 프라이팬 착지 자리 튐(판정 없음, 비행 그림 pan8 유지)'}}
(OUT / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, indent=1) + '\n'); print(idx)
