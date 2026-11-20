"""Bake short first-party ordinary enemy movement cycles from existing body crops."""
import argparse
import colorsys
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path("assets/sw0014/ordinary-walk")
FRAMES = 4
PAD = 1 / 16


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def warp_cell(image, bounds, phase, floating):
    """Inverse-map the original body, keeping the planted side at its contact line."""
    width, height = image.size
    left, top, right, foot = bounds
    xx, yy = np.meshgrid(np.arange(width, dtype=float), np.arange(height, dtype=float))
    body_w = right - left
    body_h = foot - top
    body_x = (left + right - 1) / 2
    side = np.tanh((xx - body_x) / max(2, .11 * body_w))
    side_force = math.sin(phase)
    sway = math.cos(phase)

    if floating:
        # Cloth, appendages and the inner floating body subtly counterbalance.
        train = np.clip((yy - top) / body_h, 0, 1)
        edge = np.clip(np.abs(xx - body_x) / (.55 * body_w), 0, 1)
        bend = (train * .018 + edge * .008) * body_w * side_force
        lift = body_h * (.012 + .012 * sway) * (1 - train * .32)
        lift += body_h * .019 * side * side_force * train
    else:
        # Each contact pose moves one side, allowing the other to support the body.
        # The smooth centre seam follows the original silhouette and keeps its colours.
        knees = np.clip((yy - (top + body_h * .45)) / (.55 * body_h), 0, 1)
        toe = np.maximum(0, side * side_force)
        forward = .037 * body_w * toe * side_force * knees
        lean = .012 * body_w * sway * (1 - knees)
        bend = forward + lean
        lift = .048 * body_h * toe * knees
        lift += .014 * body_h * (1 - knees) * (sway * sway)
    warped = image.transform(
        (width, height),
        Image.Transform.MESH,
        mesh(xx - bend, yy + lift),
        resample=Image.Resampling.BICUBIC,
    )
    return warped


def mesh(x, y):
    """A bounded grid keeps smooth deformation without a runtime pixel operation."""
    height, width = x.shape
    step = max(4, round(max(width, height) / 36))

    def point(u, v):
        col, row = min(width - 1, u), min(height - 1, v)
        return float(x[row, col] + u - col), float(y[row, col] + v - row)

    regions = []
    for top in range(0, height, step):
        for left in range(0, width, step):
            right, bottom = min(width, left + step), min(height, top + step)
            coords = (*point(left, top), *point(left, bottom), *point(right, bottom), *point(right, top))
            regions.append(((left, top, right, bottom), coords))
    return regions


def tint_pilgrim(base):
    pixels = np.array(base)
    for y, x in np.argwhere(pixels[:, :, 3] >= 8):
        r, g, b = pixels[y, x, :3]
        hue, light, sat = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        hue *= 360
        amount = min(1, (hue - 42) / 10, (190 - hue) / 10)
        if amount <= 0 or sat < .03:
            continue
        hue = ((345 + (hue - 116) * .25) % 360) / 360
        shifted = colorsys.hls_to_rgb(hue, light * .93, min(1, max(.28, sat * 1.6)))
        pixels[y, x, :3] = [round(v + (target * 255 - v) * amount) for v, target in zip((r, g, b), shifted)]
    return Image.fromarray(pixels)


def build(runtime, source_root, case):
    source = source_root / case["source"]
    dest = runtime / OUT / (case["name"] + ".webp")
    sx, sy, width, height = case["rect"]
    with Image.open(source) as original:
        if min(sx, sy) < 0 or width <= 0 or height <= 0 or sx + width > original.width or sy + height > original.height:
            raise ValueError(f"{source} has invalid crop {case['rect']}")
        base = original.convert("RGBA").crop((sx, sy, sx + width, sy + height))

    if case["tint"]:
        base = tint_pilgrim(base)
    scale = min(1, 190 / (max(width, height) * (1 + PAD * 2)))
    width, height = round(width * scale), round(height * scale)
    pad_x, pad_y = max(2, round(width * PAD)), max(2, round(height * PAD))
    cell = width + pad_x * 2, height + pad_y * 2
    base = base.resize((width, height), Image.Resampling.LANCZOS)
    rgba = np.array(base)
    rgba[rgba[:, :, 3] <= 16] = 0
    base = Image.fromarray(rgba)
    padded = Image.new("RGBA", cell)
    padded.paste(base, (pad_x, pad_y))
    a = padded.getchannel("A").point(lambda x: 255 if x > 40 else 0)
    bounds = a.getbbox()
    if not bounds or (bounds[3] - bounds[1]) < 8 or (bounds[2] - bounds[0]) < 8:
        raise ValueError(f"{source} has no measurable body")

    sheet = Image.new("RGBA", (cell[0] * FRAMES, cell[1]))
    alphas = set()
    for i in range(FRAMES):
        frame = warp_cell(padded, bounds, (i + .5) * math.tau / FRAMES, case["floating"])
        rgba = np.array(frame)
        rgba[rgba[:, :, 3] <= 16] = 0
        alphas.add(hashlib.sha256(rgba[:, :, 3].tobytes()).hexdigest())
        if rgba[0, :, 3].any() or rgba[-1, :, 3].any() or rgba[:, 0, 3].any() or rgba[:, -1, 3].any():
            raise ValueError(f"{source} frame {i} touches the cell boundary")
        sheet.paste(Image.fromarray(rgba), (i * cell[0], 0))
    if len(alphas) != FRAMES:
        raise ValueError(f"{source} does not contain {FRAMES} distinct silhouettes")

    dest.parent.mkdir(parents=True, exist_ok=True)
    draft = dest.with_suffix(".webp.tmp")
    sheet.save(draft, "WEBP", quality=90, exact=True, method=3)
    draft.replace(dest)
    return {
        **case, "file": dest.relative_to(runtime).as_posix(),
        "sourceSha256": digest(source), "sha256": digest(dest), "bytes": dest.stat().st_size,
        "frames": FRAMES, "cell": list(cell), "pad": [pad_x / width, pad_y / height],
    }


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--runtime", type=Path, default=Path("r96/runtime-text"))
    p.add_argument("--source-root", type=Path, help="Hydrated runtime site containing the published source art")
    p.add_argument("--module", type=Path, help="Update the marked R613 registry from the generated metadata")
    p.add_argument("--catalog", type=Path, help="Audit JSON with asset name, source path, crop and locomotion type")
    args = p.parse_args()
    dest = args.runtime / OUT / "index.json"
    registry = json.loads((args.catalog or dest).read_text())
    cases = registry if isinstance(registry, list) else registry["assets"]
    keep = ("name", "source", "rect", "floating", "targets", "tint")
    with ThreadPoolExecutor(max_workers=4) as pool:
        rows = list(pool.map(lambda c: build(args.runtime, args.source_root or args.runtime, {k: c[k] for k in keep}), cases))
    dest.write_text(json.dumps({
        "schema": "storyworld.ordinary-walk/v1",
        "origin": "First-party published game assets; provisional baked movement from exact body crops.",
        "assets": rows,
    }, ensure_ascii=False, indent=2) + "\n")
    if args.module:
        start, end = "/*SW0014_WALK_ROWS_START*/", "/*SW0014_WALK_ROWS_END*/"
        prefix, tail = args.module.read_text().split(start, 1)
        _, suffix = tail.split(end, 1)
        keys = ("name", "source", "rect", "cell", "pad", "targets", "tint")
        lines = [json.dumps([r[key] for key in keys], separators=(",", ":")) for r in rows]
        args.module.write_text(prefix + start + "[\n " + ",\n ".join(lines) + "\n]" + end + suffix)
    print(f"{dest} {len(rows)} sheets, {sum(r['bytes'] for r in rows):,} bytes")


if __name__ == "__main__":
    main()
