"""Turn a ChatGPT 4x4 effect sheet (flat black background, additive-blend art) into a game atlas.
usage: python -I proc_fx.py <sheet.png> <name> <outdir> [cell=256] [cols=4] [rows=4]
Writes <outdir>/<name>.webp (cols*cell x rows*cell, straight RGBA: alpha = max channel, colour = rgb/alpha, so
'lighter' blending reproduces the original pixels) and <outdir>/<name>.json meta, plus a preview jpg in ../preview."""
import sys, os, json, hashlib
import numpy as np
from PIL import Image

src, name, out = sys.argv[1], sys.argv[2], sys.argv[3]
cell = int(sys.argv[4]) if len(sys.argv) > 4 else 256
cols = int(sys.argv[5]) if len(sys.argv) > 5 else 4
rows = int(sys.argv[6]) if len(sys.argv) > 6 else 4
im = Image.open(src).convert('RGB')
W, H = im.size
cw, ch = W / cols, H / rows
atlas = np.zeros((rows * cell, cols * cell, 4), np.float32)
prev = []
for r in range(rows):
    for c in range(cols):
        crop = im.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch)))
        # square the crop around its centre so aspect is preserved, then resample
        s = max(crop.size)
        sq = Image.new('RGB', (s, s), (0, 0, 0))
        sq.paste(crop, ((s - crop.width) // 2, (s - crop.height) // 2))
        f = np.asarray(sq.resize((cell, cell), Image.LANCZOS)).astype(np.float32) / 255
        m = f.max(axis=2)
        # remove the faint non-black wash that image generators leave in the background
        a = np.clip((m - 0.035) / 0.965, 0, 1)
        col = np.where(a[..., None] > 1e-4, f / np.maximum(a[..., None], 1e-4), 0)
        col = np.clip(col, 0, 1)
        atlas[r * cell:(r + 1) * cell, c * cell:(c + 1) * cell] = np.dstack([col, a])
        prev.append(float(a.mean()))
img = Image.fromarray((atlas * 255 + .5).astype(np.uint8), 'RGBA')
os.makedirs(out, exist_ok=True)
p = os.path.join(out, name + '.webp')
img.save(p, 'WEBP', quality=88, alpha_quality=100, method=6)
b = open(p, 'rb').read()
meta = {'name': name, 'cell': cell, 'cols': cols, 'rows': rows, 'frames': cols * rows, 'w': cols * cell, 'h': rows * cell,
        'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(), 'blend': 'lighter', 'meanAlphaPerFrame': [round(v, 4) for v in prev],
        'source': 'ChatGPT image generation 2026-10-27/28 flat-black sheet, keyed by max channel'}
json.dump(meta, open(os.path.join(out, name + '.json'), 'w'), indent=1)
# preview: composite over dark grey
pv = os.path.join(os.path.dirname(os.path.abspath(out)), 'preview')
os.makedirs(pv, exist_ok=True)
bg = np.full((rows * cell, cols * cell, 3), 0.18, np.float32)
rgb = np.clip(bg + atlas[..., :3] * atlas[..., 3:4], 0, 1)
Image.fromarray((rgb * 255).astype(np.uint8)).save(os.path.join(pv, name + '.jpg'), quality=86)
print(name, img.size, len(b), 'frames', cols * rows)
