#!/usr/bin/env python3
"""R1345c — Dots 정식 시트 SW-R1352-D01 gastric_floor_ripple(256x256 24칸 가로 1줄, 피벗 128,128)를
4096 텍스처 한도에 맞게 12x2 격자(3072x512)로 다시 묶는다. 칸 내용·순서는 그대로(픽셀 손대지 않음, webp 무손실).
원본: Drive SW-R1352-D01_gastric_floor_ripple_24f.png SHA-256 2b639de4126503202babae7f3a84cd22cdeb1b8b13a0cf8a72575d66ab4df91e
(프로젝트 폴더 사본은 PNG 재압축으로 파일 SHA 가 다르나 픽셀 동일 — Dots 스레드 확인 2026-11-27).
사용: python3 scripts/r1345c-dots-ripple.py <원본 png>"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image
OUT = Path(__file__).resolve().parents[1] / 'r96/runtime-text/assets/r1345'
src = Path(sys.argv[1])
im = Image.open(src).convert('RGBA'); assert im.size == (6144, 256), im.size
g = Image.new('RGBA', (3072, 512))
for i in range(24):
    g.paste(im.crop((i * 256, 0, i * 256 + 256, 256)), ((i % 12) * 256, (i // 12) * 256))
p = OUT / 'gastric-ripple24.webp'; g.save(p, 'WEBP', lossless=True, exact=True, method=6)
b = p.read_bytes()
idx = json.loads((OUT / 'index.json').read_text())
idx['gastric-ripple24'] = {'frames': 24, 'cell': [256, 256], 'cols': 12, 'pivot': [128, 128], 'final': True, 'peak': 10,
  'source': 'Dots SW-R1352-D01_gastric_floor_ripple_24f.png (Drive, r1)', 'dotsSha256': '2b639de4126503202babae7f3a84cd22cdeb1b8b13a0cf8a72575d66ab4df91e',
  'process': 'repack 24x1 -> 12x2 grid (4096 limit), pixels unchanged, webp lossless', 'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b),
  'note': 'floor ink ripple, no hit data; frame 23 empty'}
(OUT / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, indent=1) + '\n')
print(idx['gastric-ripple24'])
