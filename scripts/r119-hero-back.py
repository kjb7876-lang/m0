#!/usr/bin/env python3
"""R119 영웅 북쪽(뒷모습) 그림: ChatGPT가 마젠타 배경에 그린 뒷모습을 원래 512 캔버스·같은 키·같은 발 위치로 맞춘다.
Usage: python -I scripts/r119-hero-back.py <generated.png> <hero> <site assets dir> <out dir>"""
import sys, numpy as np
from PIL import Image
src, hero, assets, out = sys.argv[1:5]
a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
r, g, b = a[..., 0], a[..., 1], a[..., 2]; mag = np.minimum(r, b) - g
alpha = np.clip(1 - (mag - 0.25) / 0.35, 0, 1); rgb = a.copy(); sp = np.clip(mag, 0, 1) * (1 - alpha); rgb[..., 0] -= sp * .6; rgb[..., 2] -= sp * .6
im = Image.fromarray((np.dstack([np.clip(rgb, 0, 1), alpha]) * 255).astype(np.uint8), 'RGBA')
A = np.asarray(im)[..., 3]; ys, xs = np.nonzero(A > 16); im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
base = 'hero_direction338' if hero == 'lauren' else 'hero_direction337'
s = Image.open(f'{assets}/{base}/{hero}/s.webp').convert('RGBA'); SA = np.asarray(s)[..., 3]; sy, sx = np.nonzero(SA > 16)
target = int((sy.max() - sy.min()) * .97); sc = target / im.height; im = im.resize((max(1, int(im.width * sc)), target), Image.LANCZOS)
if im.width > 500: f = 500 / im.width; im = im.resize((500, int(im.height * f)), Image.LANCZOS)
c = Image.new('RGBA', (512, 512), (0, 0, 0, 0)); c.alpha_composite(im, (max(0, int(round(256 - im.width / 2))), sy.max() + 1 - im.height))
c.save(f'{out}/{hero}-n.webp', 'WEBP', quality=92, alpha_quality=100, method=6); print(hero, im.size)
