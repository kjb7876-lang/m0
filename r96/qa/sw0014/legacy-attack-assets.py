"""Build fixed-pivot ordinary enemy attack strips from their existing own art."""

import argparse
import hashlib
import io
import json
import re
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import urlopen

from PIL import Image, ImageOps

ACTORS = {
    "dist01-sp2": "assets/r109/mobs/M002-move.png",
    "b01-c1": "assets/r109/mobs/M019-move.png",
    "u202-e1": None,
    "u204-e3": "assets/r92/mobs/M043-move.png",
    "kair-elite-52": "assets/r92/mobs/M076-move.png",
    "kair-elite-55": "assets/r92/mobs/M091-move.png",
    "kair-guardian-36": "assets/r92/mobs/M097-move.png",
    "kair-elite-60": "assets/r92/mobs/M114-move.png",
    "h102-t1": "assets/r109/mobs/M119-idle.png",
    "h102-s2": None,
    "murder04-e3": "assets/r116/mobs/M125-idle.png",
    "c102-e3": "assets/r116/mobs/M131-idle.png",
    "c106-e1": "assets/r92/mobs/M135-move.png",
    "c104-e1": "assets/r109/mobs/M137-move.png",
}
LEFT_ATTACK = {"c104-e1", "u204-e3"}
# Match these two painted contact frames to the cooler portraits used in the same room.
# The accent axis protects each actor's own green or blue attack light.
CONTACT_PALETTE = {
    "u202-e1": {"contrast": 1.24, "mid": 70, "bias": (2, 5, 9), "accent": 1},
    "h102-s2": {"contrast": .95, "mid": 111, "bias": (-4, 10, 18), "accent": 2},
}
DEST = Path("assets/sw0014/legacy-attack")
CELL = (256, 224)
PIVOT = (128, 190)
FRAMES = 4
MAX_HEIGHT = 132


def build_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--runtime", type=Path, default=Path(__file__).resolve().parents[2] / "runtime-text")
    parser.add_argument("--public-base", default=None, help="Read missing source files from this build URL.")
    parser.add_argument("--manifest", type=Path, default=None, help="Verify source file hashes against this manifest.")
    return parser


def normalize(path):
    return path.removeprefix("./")


def asset_frame(data):
    frame = data["assetFrame"]
    return {
        "path": normalize(data["path"]),
        "rect": frame["sourceRect"],
        "pivot": frame["pivot"],
        "height": frame["visibleHeight"],
    }


def track_data(track):
    width, height = track["cell"]
    return {
        "path": normalize(track["path"]),
        "rect": [0, 0, width, height],
        "pivot": track["pivot"] if "pivot" in track else track["pivots"][0],
        "height": track["visibleHeight"],
    }


def sprite(path, reader, spec):
    image = Image.open(io.BytesIO(reader(path))).convert("RGBA")
    x, y, width, height = spec["rect"]
    return image.crop((x, y, x + width, y + height))


def pose(image, spec, height, scale_x=1, scale_y=1, shear=0, mirrored=False):
    pivot_x, pivot_y = spec["pivot"]
    if mirrored:
        image = ImageOps.mirror(image)
        pivot_x = image.width - pivot_x
    sx, sy = height * scale_x / spec["height"], height * scale_y / spec["height"]
    # Inverse affine map. The original artwork's foot pivot stays on the same pixel.
    offset_x = pivot_x - (PIVOT[0] + shear * PIVOT[1]) / sx
    return image.transform(
        CELL,
        Image.Transform.AFFINE,
        (1 / sx, shear / sx, offset_x, 0, 1 / sy, pivot_y - PIVOT[1] / sy),
        resample=Image.Resampling.BICUBIC,
    )


def color_contact(image, actor):
    palette = CONTACT_PALETTE.get(actor)
    if not palette:
        return image
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, opacity = pixels[x, y]
            if not opacity:
                continue
            color = (r, g, b)
            accent = color[palette["accent"]] - r
            strength = min(1, opacity / 128) * (1 - max(0, min(1, (accent - 13) / 39)))
            luminance = .2126 * r + .7152 * g + .0722 * b
            tone = (luminance - palette["mid"]) * (palette["contrast"] - 1)
            adjusted = tuple(
                max(0, min(255, round(value + strength * (tone + bias))))
                for value, bias in zip(color, palette["bias"])
            )
            pixels[x, y] = (*adjusted, opacity)
    return image


def main():
    args = build_parser().parse_args()
    runtime = args.runtime
    checksums = {}
    if args.manifest:
        checksums = {row["path"]: row["sha256"] for row in json.loads(args.manifest.read_text())["files"]}

    cache = {}

    def read(path):
        if path in cache:
            return cache[path]
        local = runtime / path
        if local.is_file():
            data = local.read_bytes()
        elif args.public_base:
            with urlopen(urljoin(args.public_base, path), timeout=30) as reply:
                data = reply.read()
        else:
            raise FileNotFoundError(local)
        if path in checksums and hashlib.sha256(data).hexdigest() != checksums[path]:
            raise ValueError(f"Wrong source revision for {path}")
        cache[path] = data
        return data

    compiled = read("index.html").decode()
    raw = re.search(r'<script[^>]*id="portable-data"[^>]*>(.*?)</script>', compiled, flags=re.S)[1]
    originals = json.loads(raw)["enemyNativePresentation150"]
    indexed = {}
    for folder in ["r109", "r116"]:
        for track in json.loads(read(f"assets/{folder}/mobs/index.json"))["tracks"]:
            indexed[normalize(track["path"])] = track
    for group in json.loads(read("assets/r92/mobs/index.json"))["groups"].values():
        for track in group["tracks"].values():
            indexed[normalize(track["path"])] = track
    output = runtime / DEST
    output.mkdir(parents=True, exist_ok=True)
    manifest = {"cell": CELL, "pivot": PIVOT, "frames": FRAMES, "actors": {}}
    for actor, legacy in ACTORS.items():
        native = originals[actor]
        stance = track_data(indexed[legacy]) if legacy else asset_frame(native["idle"])
        contact = asset_frame(native["attack"])
        stance_image = sprite(stance["path"], read, stance)
        contact_image = color_contact(sprite(contact["path"], read, contact), actor)
        height = MAX_HEIGHT
        # If an unusually wide native effect touches a side, keep the entire pose by reducing the scale.
        while height >= 80:
            cells = [
                pose(stance_image, stance, height, 1.02, .95, -.035),
                pose(stance_image, stance, height, 1.04, .88, -.105),
                pose(contact_image, contact, height, mirrored=actor in LEFT_ATTACK),
                pose(stance_image, stance, height, 1, .99, .055),
            ]
            if all(
                (bounds := im.getchannel("A").point(lambda v: 255 if v >= 24 else 0).getbbox())
                and bounds[0] >= 3 and bounds[1] >= 3
                and bounds[2] <= CELL[0] - 3 and bounds[3] <= CELL[1] - 3
                for im in cells
            ):
                break
            height -= 3
        else:
            raise ValueError(f"Body and full contact pose cannot fit for {actor}")
        sheet = Image.new("RGBA", (FRAMES * CELL[0], CELL[1]))
        for i, im in enumerate(cells):
            sheet.paste(im, (i * CELL[0], 0))
        dest = DEST / (actor + ".webp")
        encoded = io.BytesIO()
        sheet.save(encoded, "WEBP", quality=90, method=6, exact=True)
        sheet_data = encoded.getvalue()
        (runtime / dest).write_bytes(sheet_data)
        for spec in (stance, contact):
            spec["sha256"] = hashlib.sha256(read(spec["path"])).hexdigest()
        related = {asset_frame(native[key])["path"] for key in ("idle", "move", "hit")}
        if legacy:
            related.add(legacy)
        manifest["actors"][actor] = {
            "path": dest.as_posix(),
            "height": height,
            "stance": stance,
            "contact": contact,
            "contactMirrored": actor in LEFT_ATTACK,
            **({"contactPalette": CONTACT_PALETTE[actor]} if actor in CONTACT_PALETTE else {}),
            "basePaths": sorted(related),
            "sha256": hashlib.sha256(sheet_data).hexdigest(),
        }
    (output / "index.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
