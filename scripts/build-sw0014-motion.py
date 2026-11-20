"""Bake six-frame movement for the shipped boss forms with single-cell idle art.

Run with the root of a built game as the first argument. Geometry is in the
visible silhouette's coordinate system. No mesh or per-pixel work runs in-game.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "r96/runtime-text/assets/sw0014"
N = 6
# Each set defines body-specific motion and its two main articulations. The
# point positions are measured in the opaque body, not the atlas rectangle.
GAITS = {
    "mb-dist06": ("ember", (.48, .28), (.50, .66)),
    "mb-ep1a10": ("stride", (.27, .93), (.75, .91)),
    "b02-boss": ("seated", (.40, .22), (.62, .43)),
    "mb-ep1b06": ("stride", (.26, .77), (.74, .95)),
    "b06-boss": ("stride", (.20, .95), (.72, .93)),
    "mb-ep1b06b": ("stride", (.20, .95), (.83, .94)),
    "b06b-boss": ("stride", (.34, .94), (.73, .89)),
    "u204-mid": ("drape", (.44, .83), (.73, .88)),
    "u203-boss": ("flight", (.19, .32), (.80, .37)),
    "mb-kair01-v31231": ("bound", (.37, .24), (.81, .48)),
    "k103-boss": ("drape", (.27, .80), (.77, .80)),
    "c101-mid": ("stride", (.37, .94), (.79, .91)),
    "c102-boss": ("wings", (.12, .29), (.87, .28)),
    "c105-mid": ("drape", (.27, .83), (.76, .80)),
    "c106-mid": ("drape", (.22, .85), (.79, .85)),
}
# The exact region selected by the shipping renderer, including different
# native presentation atlases and the scoped DREAM body of u204-mid.
SOURCES = {
    "mb-dist06": ("assets/r104/bosses/mb-dist06-p4.webp", (0, 0, 398, 432)),
    "mb-ep1a10": ("assets/r104/bosses/mb-ep1a10-p4.webp", (0, 0, 455, 473)),
    "b02-boss": ("assets/r104/bosses/b02-boss-p4.webp", (0, 0, 388, 443)),
    "mb-ep1b06": ("assets/r104/bosses/mb-ep1b06-p4.webp", (0, 0, 334, 425)),
    "b06-boss": ("assets/r104/bosses/b06-boss-p4.webp", (0, 0, 265, 439)),
    "mb-ep1b06b": ("assets/r104/bosses/mb-ep1b06b-p4.webp", (0, 0, 424, 458)),
    "b06b-boss": ("assets/r104/bosses/b06b-boss-p4.webp", (0, 0, 296, 433)),
    "u204-mid": ("assets/r104/bosses/u204-mid-p4.webp", (0, 0, 386, 438)),
    "u203-boss": ("assets/generated-v31224/actors-normalized/c5859bd35492_controller_idle.webp", (0, 0, 672, 384)),
    "mb-kair01-v31231": ("assets/rc140/story-cycle-motions/mb-kair01-v31231.png", (0, 0, 726, 724)),
    "k103-boss": ("assets/generated-v31224/actors-normalized/b19d67bb1973_siren_idle.webp", (0, 0, 672, 384)),
    "c101-mid": ("assets/rc140/story-cycle-motions/c101-mid.png", (0, 0, 661, 724)),
    "c102-boss": ("assets/boss-actions-20261011/c102-boss-poses.png", (160, 5, 545, 505)),
    "c105-mid": ("assets/rc140/story-cycle-motions/c105-mid.png", (0, 0, 728, 724)),
    "c106-mid": ("assets/rc140/story-cycle-motions/c106-mid.png", (0, 0, 685, 724)),
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def body_box(image):
    return image.getchannel("A").point(lambda a: 255 if a > 32 else 0).getbbox()


def remap(cell, bbox, controls):
    """Inverse smooth skinning on a coarse mesh, with premultiplied RGBA filtering."""
    w, h = cell.size
    x0, y0, x1, y1 = bbox
    xs = np.linspace(0, w, 26).round().astype(int)
    ys = np.linspace(0, h, 30).round().astype(int)
    x, y = np.meshgrid(xs, ys)
    u = (x - x0) / (x1 - x0)
    v = (y - y0) / (y1 - y0)
    dx, dy = np.zeros_like(u), np.zeros_like(v)
    for cx, cy, rx, ry, shift_x, shift_y in controls:
        influence = np.exp(-.5 * (((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2))
        dx += influence * shift_x
        dy += influence * shift_y
    xi, yi = x - dx * (x1 - x0), y - dy * (y1 - y0)
    mesh = []
    for j in range(len(ys) - 1):
        for i in range(len(xs) - 1):
            corners = ((j, i), (j + 1, i), (j + 1, i + 1), (j, i + 1))
            source = tuple(val for pair in corners for val in (xi[pair], yi[pair]))
            mesh.append(((xs[i], ys[j], xs[i + 1], ys[j + 1]), source))
    return cell.transform(cell.size, Image.Transform.MESH, mesh, Image.Resampling.BICUBIC)


def gait_controls(style, left, right, phase):
    a, b = math.sin(phase), math.cos(phase)
    spring = math.sin(phase * 2)
    if style == "stride":
        # One sole takes the weight while the opposite knee passes it.
        return [
            (*left, .18, .20, .043*a, -.033*max(0, b)),
            (*right, .18, .20, -.043*a, -.033*max(0, -b)),
            (.49, .44, .24, .28, -.018*a, .007*spring),
            (.20, .43, .20, .20, -.033*a, .012*b),
            (.78, .42, .19, .25, .032*a, -.013*b),
        ]
    if style == "seated":
        # The sloth's chair and feet remain planted. Only its slumped torso and wrist stir.
        return [(*left, .15, .12, .010*a, .016*b),
                (*right, .14, .15, -.013*b, .026*a)]
    if style == "ember":
        # The black pillar's foundation remains rigid. Its internal molten throat churns.
        return [(*left, .12, .17, .024*a, -.023*b),
                (*right, .13, .15, -.023*b, -.015*a)]
    if style == "bound":
        return [(*left, .20, .19, .023*a, .010*b),
                (*right, .23, .16, -.027*b, .017*a)]
    if style in ("wings", "flight"):
        return [(*left, .22, .25, -.025*b, -.065*a),
                (*right, .22, .25, .027*b, -.055*a),
                (.48, .67, .17, .23, .016*a, .009*b)]
    # Robed and spectral shapes trail at the hem. The head and held props stay readable.
    return [(*left, .19, .20, .049*a, -.022*max(0, b)),
            (*right, .19, .19, .043*b, -.021*max(0, -b)),
            (.52, .42, .22, .26, -.012*a, .008*b)]


def gait_sheet(site, out, actor, source_hashes):
    source, rect = SOURCES[actor]
    path = site / source
    if not path.exists():
        path = ROOT / "r96/runtime-text" / source
    source_hash = digest(path)
    if source_hash != source_hashes[source]:
        raise ValueError(f"Use the manifest-owned source from a local game build: {source}")
    x, y, w, h = rect
    with Image.open(path) as im:
        cell = im.convert("RGBA").crop((x, y, x+w, y+h))
    bbox = body_box(cell)
    # Remove off-body transparent atlas margins before allocating GPU pixels.
    # Include faint details and room on each side for limbs to change pose.
    bounds = cell.getbbox()
    margin_x = math.ceil((bbox[2]-bbox[0])*.08)
    margin_y = math.ceil((bbox[3]-bbox[1])*.08)
    crop = (bounds[0]-margin_x, bounds[1]-margin_y,
            bounds[2]+margin_x, bounds[3]+margin_y)
    cropped = cell.crop(crop)
    factor = min(1, 332/cropped.width, 344/cropped.height)
    size = (round(cropped.width*factor), round(cropped.height*factor))
    crop_body = tuple((p-crop[i%2])*size[i%2]/cropped.size[i%2] for i,p in enumerate(bbox))
    art = cropped.resize(size, Image.Resampling.LANCZOS)
    style, left, right = GAITS[actor]
    sheet = Image.new("RGBA", (size[0]*N, size[1]))
    for i in range(N):
        controls = gait_controls(style, left, right, 2*math.pi*i/N)
        sheet.paste(remap(art, crop_body, controls), (size[0]*i, 0))
    name = actor+"-gait.webp"
    target = out / name
    sheet.save(target, "WEBP", quality=87, method=6)
    pad = [-crop[0]/w, -crop[1]/h, (crop[2]-w)/w, (crop[3]-h)/h]
    return {
        "actor": actor, "source": source, "sourceRect": list(rect), "sourceSha256": source_hash,
        "method": "articulated mesh, "+style, "path": "assets/sw0014/"+name,
        "cw": size[0], "ch": size[1], "n": N, "fps": 7,
        "pad": [round(p, 7) for p in pad], "bytes": target.stat().st_size, "sha256": digest(target),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site", type=Path, help="built game directory containing assets/")
    parser.add_argument("--output", type=Path, default=ASSETS)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((ROOT / "r96/runtime-manifest.json").read_text())
    source_hashes = {row["path"]: row["sha256"] for row in manifest["files"]}
    rows = [gait_sheet(args.site, args.output, actor, source_hashes) for actor in SOURCES]
    metadata = {"origin": "StoryWorld first-party shipped actor art, SW-0014 movement derivatives",
                "usage": "StoryWorld project artwork and derivatives for use in kjb7876-lang/m0",
                "layout": "single row, original facing and native flip", "sheets": rows}
    (args.output/"boss-gaits.json").write_text(json.dumps(metadata, indent=2)+"\n")


if __name__ == "__main__":
    main()
