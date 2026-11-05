#!/usr/bin/env python3
"""Create grayscale diagnostic copies, contact sheets and hashed audit index.

No art scores are inferred from image statistics. Original capture bytes remain
unchanged. Requires Pillow. All outputs belong outside the product repository.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps, ImageStat


def prepare(root):
    root = root.resolve()
    manifest = json.loads((root / 'capture-manifest.json').read_text())
    rows = []
    for row in manifest['captures']:
        source = root / row['file']
        with Image.open(source) as im:
            im.load()
            expected = row['state']['viewport']
            size = (expected['width'] * expected['dpr'], expected['height'] * expected['dpr'])
            if im.size != size:
                raise ValueError(f"{source.name}: {im.size} != {size}")
            gray = ImageOps.grayscale(im)
            gray_name = source.stem + '-gray.jpg'
            gray.save(root / gray_name, quality=88)
            stat = ImageStat.Stat(gray)
            rows.append({'id': row['id'], 'color': source.name, 'gray': gray_name,
                         'width': im.width, 'height': im.height,
                         'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                         'graySHA256': hashlib.sha256((root / gray_name).read_bytes()).hexdigest(),
                         'meanLuma601': round(stat.mean[0], 3),
                         'stdevLuma601': round(stat.stddev[0], 3),
                         'fixture': row['fixture']})
    contacts = []
    for device in ['pc', 'mobile']:
        selected = [r for r in rows if r['id'].startswith(device + '-')]
        for variant in ['color', 'gray']:
            for start in range(0, len(selected), 8):
                group = selected[start:start + 8]
                w, h, cols = (640, 360, 2) if device == 'pc' else (292, 633, 4)
                board = Image.new('RGB', (cols * w, ((len(group) + cols - 1) // cols) * (h + 26)), '#181818')
                draw = ImageDraw.Draw(board)
                for i, row in enumerate(group):
                    with Image.open(root / row[variant]) as im:
                        thumb = ImageOps.contain(im, (w, h), Image.Resampling.LANCZOS)
                    x, y = (i % cols) * w, (i // cols) * (h + 26)
                    board.paste(thumb, (x, y + 26))
                    draw.text((x + 5, y + 5), row['id'], fill='white')
                name = f'contact-{device}-{variant}-{start // 8 + 1:02}.jpg'
                board.save(root / name, quality=90)
                contacts.append({'file': name, 'images': [r['id'] for r in group], 'resized': True})
    index = {'schema': 'storyworld.art-evidence/v1', 'baseSHA': manifest['baseSHA'],
             'grayscale': 'Pillow RGB->L: ITU-R 601 luma (0.299R+0.587G+0.114B), gamma encoded; not CIE Lab or relative luminance',
             'statistics': 'whole screenshot only, includes HUD; not segmented floor/wall contrast and not art scores',
             'completeCaptureRun': bool(manifest.get('finishedAt')),
             'captures': rows, 'contacts': contacts}
    (root / 'evidence-index.json').write_text(json.dumps(index, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({'images': len(rows), 'gray': len(rows), 'contacts': len(contacts), 'complete': index['completeCaptureRun']}))
    return index


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('directory', type=Path)
    prepare(parser.parse_args().directory)
