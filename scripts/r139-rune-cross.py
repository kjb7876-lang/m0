#!/usr/bin/env python3
"""R139: 라우렌 바닥 표식 — assets/r106/fx/rune.webp(육망성 마법진)의 바깥 룬 고리는 두고 안쪽 육망성 자리를 지워
cross.webp(십자가)를 넣은 회색 텍스처 runecross.webp 를 새로 만든다(원본 두 파일은 그대로)."""
import hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
D = Path('r96/runtime-text/assets/r106/fx')
rune = Image.open(D / 'rune.webp').convert('RGBA'); cross = Image.open(D / 'cross.webp').convert('RGBA')
W, H = rune.size; R = W / 2
mask = Image.new('L', rune.size, 0); g = ImageDraw.Draw(mask)
g.ellipse([R - R * .66, R - R * .66, R + R * .66, R + R * .66], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(3))
out = rune.copy(); clear = Image.new('RGBA', rune.size, (0, 0, 0, 0))
out = Image.composite(clear, out, mask)
# 안쪽 원 테두리 하나를 다시 그어 고리가 비어 보이지 않게
ring = Image.new('RGBA', rune.size, (0, 0, 0, 0)); ImageDraw.Draw(ring).ellipse([R - R * .62, R - R * .62, R + R * .62, R + R * .62], outline=(235, 235, 235, 230), width=5)
out.alpha_composite(ring.filter(ImageFilter.GaussianBlur(1.2)))
bb = cross.getbbox(); c = cross.crop(bb); k = (R * 1.1) / max(c.size); c = c.resize((round(c.width * k), round(c.height * k)), Image.LANCZOS)
out.alpha_composite(c, (round(R - c.width / 2), round(R - c.height / 2)))
p = D / 'runecross.webp'; out.save(p, 'WEBP', quality=92, alpha_quality=100, method=6)
b = p.read_bytes(); print(p, out.size, len(b), hashlib.sha256(b).hexdigest())
