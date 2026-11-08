#!/usr/bin/env python3
"""R406: Drive SW-StoryProps candidates (2026-11-07/08, HOLD / REVIEW_CANDIDATE) -> cleaned in-game props for samong boss rooms.

The candidates are single static PNGs (1254-1536 px, RGBA) with a broad semi-transparent halo and thin coloured edge
noise around the object (the reason Dots marked them HOLD). Each one is improved here, never in place:
  1. the PNG hash is checked against the candidate's manifest;
  2. halo removal: alpha below LO becomes 0 and the rest is re-stretched to full range (LO..HI -> 0..255);
  3. edge clean-up: alpha is eroded by one pixel (3x3 min) so the coloured fringe falls outside the object, and the
     RGB of the remaining edge pixels is replaced by the mean of their fully opaque neighbours (no grey/yellow rim);
  4. crop to the alpha box + 4 px, scale so the long side is at most 384 px (props are drawn 14-90 px tall), WebP q92.
Then assets/r406/props/index.json records source zip, PNG sha, derived sha/size and the placement row used by
r96/client-source/boss-props-r406.js.

Indoor lamps (user 2026-11-08 "실내에는 불이없게 있어도 전구등"): two existing R92 enclosed lanterns are re-lit as electric
bulbs (flame-orange pixels -> warm white by luminance; shape and size unchanged, so the R92 foot/size metadata still fits).
They are read from the built site (r96/hospital-three-pc/site, the R92 files live in runtime packs) and checked against
r96/runtime-manifest.json before use; output assets/r406/lights/lantern-bulb-*.png ('lantern' keeps R123/R300 light pools).

usage: python -I scripts/r406-boss-props.py <dir holding the unzipped SW-StoryProps-* folders> [out-dir]
"""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

src = Path(sys.argv[1]); out = Path(sys.argv[2] if len(sys.argv) > 2 else 'r96/runtime-text/assets/r406/props')
LO, HI, LONG = 72, 230, 384
# name, candidate folder key, zone, mode (wall: flush to a back wall / inner: open floor a step away from walls),
# axis (wall the art is drawn parallel to: 'x' = the -x wall, 'y' = the -y wall), draw height (px at zoom 1)
PROPS = [
  ('teapot', 'S01-thread-knot-ceramic-teapot', 'sz115-S01-5', 'inner', None, 30),
  ('sewing-box', 'S01-sewing-box', 'sz115-S01-5', 'inner', None, 22),
  ('tethered-chair', 'S01-wall-tethered-obedience-chair', 'sz115-S01-5', 'wall', 'y', 44),
  ('bleacher', 'S03-duel-hall-empty-bleacher', 'sz115-S03-7', 'wall', 'x', 46),
  ('duel-wall', 'S03-impact-fractured-duel-wall', 'sz115-S03-7', 'wall', 'x', 52),
  ('lectern', 'S04-revisable-judgment-lectern', 'sz115-S04-11', 'inner', None, 46),
  ('dining-set', 'S04-fixed-chair-rule-dining-set', 'sz115-S04-14', 'inner', None, 44),
  ('tailor-window', 'S05-tailor-street-display-window', 'sz115-S05-6', 'wall', 'x', 62),
  ('server-cooler', 'S06-base-server-cooler', 'sz115-S06-5', 'wall', 'y', 50),
  ('ring-section', 'S06-quantum-computation-ring-section', 'sz115-S06-5', 'wall', 'y', 66),
  ('time-platform', 'S06-time-experiment-platform', 'sz115-S06-23', 'inner', None, 20),
  ('ribbon-chair', 'R04-ribbon-bound-dining-chair', 'sz115-RB-6', 'inner', None, 42),
  ('kitchen-bench', 'R04-hotel-kitchen-workbench', 'sz115-RB-6', 'wall', 'x', 32),
  ('verdict-fissure', 'R05-verdict-paper-fissure', 'sz115-RC-3', 'inner', None, 40),
  ('spectator-stand', 'R05-fallen-spectator-stand', 'sz115-RC-3', 'wall', 'x', 28),
  ('gilded-shells', 'R06-gilded-role-shell-display', 'sz115-RC-6', 'wall', 'y', 60),
  ('gold-chair', 'R06-gold-memory-chair', 'sz115-RC-6', 'inner', None, 44),
  ('uniform-display', 'R10-false-triumph-uniform-display', 'sz115-RE-3', 'wall', 'y', 58),
  ('victory-coat', 'R10-empty-white-victory-coat', 'sz115-RE-3', 'inner', None, 24),
  ('judgment-altar', 'R11-cathedral-judgment-altar', 'sz115-RF-1', 'inner', None, 40),
  ('judgment-scale', 'R11-unequal-judgment-scale', 'sz115-RF-1', 'inner', None, 54),
  ('record-book', 'R13-preserved-storyteller-record-book', 'sz115-RG-3', 'inner', None, 18),
  ('seventh-trumpet', 'R13-silent-seventh-trumpet', 'sz115-RG-3', 'inner', None, 14),
  ('throne-dais', 'R15-abandoned-black-throne-dais', 'sz115-RG-5', 'inner', None, 84),
]


def manifest_row(folder, png):
    man = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
    rows = man['assets'] if isinstance(man.get('assets'), list) else [man]
    row = next((r for r in rows if r.get('file', png.name) == png.name or len(rows) == 1), rows[0])
    return man, row


def clean(im):
    a = np.asarray(im.convert('RGBA')).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3]
    al = np.clip((al - LO) * 255.0 / (HI - LO), 0, 255)
    al = np.asarray(Image.fromarray(al.astype(np.uint8)).filter(ImageFilter.MinFilter(3))).astype(np.float32)
    solid = al >= 250
    # edge pixels (partly transparent) take the mean colour of solid neighbours within 2 px
    w = solid.astype(np.float32)
    acc = np.zeros_like(rgb); cnt = np.zeros_like(w)
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            acc += np.roll(np.roll(rgb * w[..., None], dy, 0), dx, 1); cnt += np.roll(np.roll(w, dy, 0), dx, 1)
    edge = (al > 0) & ~solid & (cnt > 0)
    rgb[edge] = acc[edge] / cnt[edge][:, None]
    outa = np.dstack([rgb, al]).clip(0, 255).astype(np.uint8)
    img = Image.fromarray(outa, 'RGBA')
    box = img.getchannel('A').point(lambda v: 255 if v >= 16 else 0).getbbox()
    box = (max(0, box[0] - 4), max(0, box[1] - 4), min(img.width, box[2] + 4), min(img.height, box[3] + 4))
    img = img.crop(box)
    s = min(1.0, LONG / max(img.size))
    return img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)


out.mkdir(parents=True, exist_ok=True); index = {'revision': 'R406', 'method': f'alpha {LO}..{HI} -> 0..255, 1px erode, edge RGB from solid neighbours, crop+4, long side <= {LONG}, WebP q92', 'props': {}}
for name, key, zone, mode, axis, h in PROPS:
    folder = next(p for p in src.iterdir() if p.is_dir() and p.name.startswith('SW-StoryProps-' + key + '-'))
    png = next(folder.glob('*.png'))
    man, row = manifest_row(folder, png)
    data = png.read_bytes(); sha = hashlib.sha256(data).hexdigest()
    want = row.get('sha256') or row.get('png_sha256')
    assert want is None or want == sha, ('manifest mismatch', name, sha)
    img = clean(Image.open(png))
    p = out / (name + '.webp'); img.save(p, 'WEBP', quality=92, alpha_quality=100, method=6)
    index['props'][name] = {'zone': zone, 'mode': mode, 'axis': axis, 'height': h, 'path': 'assets/r406/props/' + p.name,
      'source': folder.name + '.zip', 'png': png.name, 'pngSHA256': sha, 'manifestChecked': want is not None,
      'dotsStatus': man.get('status') or row.get('status'), 'size': list(img.size), 'bytes': p.stat().st_size,
      'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
    print(name, zone, mode, img.size, p.stat().st_size, 'sha-checked' if want else 'no-sha-in-manifest')
(out / 'index.json').write_text(json.dumps(index, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')


# ---- indoor bulb lamps --------------------------------------------------------------------------
site = Path('r96/hospital-three-pc/site'); man = {f['path']: f['sha256'] for f in json.loads(Path('r96/runtime-manifest.json').read_text())['files']}
lights = out.parent.parent / 'r406' / 'lights'; lights.mkdir(parents=True, exist_ok=True); index['lights'] = {}
for src_id, name in (('lights_hospital_03', 'lantern-bulb-post'), ('lights_stone_03', 'lantern-bulb-hang')):
    rel = 'assets/r92/lights/' + src_id + '.png'; data = (site / rel).read_bytes()
    assert hashlib.sha256(data).hexdigest() == man[rel], ('R92 source mismatch', rel)
    a = np.asarray(Image.open(site / rel).convert('RGBA')).astype(np.float32); r, g, b, al = (a[..., i] for i in range(4))
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); sat = (mx - mn) / np.maximum(mx, 1)
    k = np.clip((sat - .25) / .45, 0, 1) * np.clip((r - 110) / 120, 0, 1) * ((r > g) & (g >= b * .9) & (r > 110) & (sat > .25))
    lum = .3 * r + .59 * g + .11 * b
    tgt = np.dstack([np.clip(lum * 1.18 + 40, 0, 255), np.clip(lum * 1.14 + 34, 0, 255), np.clip(lum * 1.02 + 22, 0, 255)])
    rgb = a[..., :3] * (1 - k[..., None]) + tgt * k[..., None]
    p = lights / (name + '.png'); Image.fromarray(np.dstack([rgb, al]).clip(0, 255).astype(np.uint8), 'RGBA').save(p, optimize=True)
    index['lights'][name] = {'path': 'assets/r406/lights/' + p.name, 'from': rel, 'fromSHA256': man[rel], 'bytes': p.stat().st_size,
      'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'size': list(Image.open(p).size)}
    print(name, p.stat().st_size)
(out / 'index.json').write_text(json.dumps(index, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
