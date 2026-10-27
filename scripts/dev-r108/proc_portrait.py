"""ChatGPT portrait (any size, ~3:4) -> 384x512 webp card portrait + meta line.
usage: python -I proc_portrait.py <src.png> <hero> <outdir>"""
import sys, os, json, hashlib
from PIL import Image, ImageOps

src, hero, out = sys.argv[1], sys.argv[2], sys.argv[3]
W, H = 384, 512
im = Image.open(src).convert('RGB')
im = ImageOps.fit(im, (W, H), Image.LANCZOS, centering=(0.5, 0.32))
os.makedirs(out, exist_ok=True)
p = os.path.join(out, hero + '.webp')
im.save(p, 'WEBP', quality=84, method=6)
b = open(p, 'rb').read()
mp = os.path.join(out, 'meta.json')
meta = json.load(open(mp)) if os.path.exists(mp) else {'portraits': {}, 'w': W, 'h': H, 'source': 'ChatGPT image generation 2026-10-27, reference = the hero illustration already shipped in assets/heroes'}
meta['portraits'][hero] = {'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()}
json.dump(meta, open(mp, 'w'), indent=1, sort_keys=True)
print(hero, im.size, len(b))
