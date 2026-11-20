#!/usr/bin/env python3
"""Make an eight-frame gait from the approved memory gunner aim artwork."""

import hashlib
import json
import math
from pathlib import Path

from PIL import Image


ASSETS = Path(__file__).resolve().parents[1] / 'r96/runtime-text/assets'
OUTPUT = ASSETS / 'sw0015/gunner'
CELL = (192, 256)
FOOT = (96, 226)
FRAMES = 8
SOURCES = {
    'se': ('r1101c/gunner/attack-se9.webp', 7, (148, 137), 1, 102),
    'ne': ('r1101c/gunner/attack-ne9.webp', 7, (150, 63), -1, 93),
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def blend(a, b, amount):
    return a + (b - a) * amount


def smoothstep(value):
    unit = max(0.0, min(value, 1.0))
    return unit * unit * (3 - 2 * unit)


def lower_body_field(x, y, phase, pitch, center, settle):
    """Move the feet in opposite phases without moving the hood, arms or rifle."""
    left_leg = 1.0 - smoothstep((x - center + 15) / 30)
    left_stride = 12 * math.cos(phase)
    left_lift = 9 * max(0, math.sin(phase))
    right_lift = 9 * max(0, -math.sin(phase))
    stride = blend(-left_stride, left_stride, left_leg)
    lift = blend(right_lift, left_lift, left_leg)
    hip = smoothstep((y - 144) / 82)
    knee = smoothstep((y - 175) / 51)
    return x - hip * stride, y - hip * stride * pitch * .30 + knee * (lift - settle)


def warp(art, phase, pitch, center, settle=0):
    width, height = CELL
    grid = []
    for top in range(0, height, 8):
        for left in range(0, width, 8):
            right, bottom = left + 8, top + 8
            corners = [(left, top), (left, bottom), (right, bottom), (right, top)]
            quad = tuple(value for x, y in corners
                         for value in lower_body_field(x, y, phase, pitch, center, settle))
            grid.append(((left, top, right, bottom), quad))
    pose = art.transform(CELL, Image.Transform.MESH, grid, Image.Resampling.BICUBIC)
    pose.paste(art.crop((0, 0, width, 144)), (0, 0))
    return pose


def sole(art):
    return art.getchannel('A').point(lambda alpha: 255 if alpha >= 32 else 0).getbbox()[3] - 1


def gait(art, pitch, center):
    """Keep the planted foot on the walk-sheet foot line in every cell."""
    for frame in range(FRAMES):
        phase = (frame + .5) * (2 * math.pi / FRAMES)
        settle = 0
        pose = warp(art, phase, pitch, center)
        for _ in range(3):
            offset = FOOT[1] - sole(pose)
            if offset == 0:
                break
            # Leave the settled motion under the knees so the muzzle stays stable.
            settle += offset
            pose = warp(art, phase, pitch, center, settle)
        yield pose


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    provenance = {}
    for direction, (source, source_frame, tip, pitch, center) in SOURCES.items():
        source_path = ASSETS / source
        width, height = CELL
        with Image.open(source_path) as sheet:
            art = sheet.crop((source_frame * width, 0, (source_frame + 1) * width, height)).convert('RGBA')
        poses = list(gait(art, pitch, center))
        atlas = Image.new('RGBA', (width * FRAMES, height))
        for frame, pose in enumerate(poses):
            atlas.paste(pose, (frame * width, 0))
        path = OUTPUT / f'walk-{direction}.webp'
        atlas.save(path, 'WEBP', lossless=True, method=6, exact=True)
        with Image.open(path) as encoded:
            cells = [encoded.crop((frame * width, 0, (frame + 1) * width, height)).convert('RGBA')
                     for frame in range(FRAMES)]
        assert len({hashlib.sha256(cell.tobytes()).hexdigest() for cell in cells}) == FRAMES
        assert all(sole(cell) == FOOT[1] for cell in cells)
        upper = art.crop((0, 0, width, 144)).tobytes()
        assert all(cell.crop((0, 0, width, 144)).tobytes() == upper for cell in cells)
        provenance[direction] = {
            'path': f'assets/sw0015/gunner/{path.name}',
            'source': f'assets/{source}',
            'sourceSHA256': digest(source_path),
            'sourceFrame': source_frame,
            'sha256': digest(path),
            'cell': CELL,
            'frames': FRAMES,
            'foot': FOOT,
            'tips': [tip] * FRAMES,
            'mirror': 'sw' if direction == 'se' else 'nw',
        }
    (OUTPUT / 'index.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
