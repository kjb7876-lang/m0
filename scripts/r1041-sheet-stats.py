#!/usr/bin/env python3
"""R1041: Dots CX-0099FX 시트(가로 한 줄)의 칸마다 알파 평균과 이웃 칸 차이를 재서 r96/qa/r1041/sheet-stats.json 에 남긴다.
CPU 검사가 '칸 수·빈 칸 없음·정지 그림 아님'을 확인하는 근거."""
import json, pathlib
from PIL import Image, ImageChops, ImageStat
R = pathlib.Path(__file__).resolve().parent.parent / 'r96'
SHEETS = {'fx-m1-michaela-halo': (256, 8), 'fx-a5-slayer-flame': (256, 8), 'fx-c2-hero-hurt': (192, 6), 'fx-c4-ground-ring': (256, 8), 'fx-h6-hwando-iai': (512, 8),
          'fx-m3-michaela-ego-on': (384, 6), 'fx-m3-michaela-ego-loop': (384, 10), 'fx-m4-michaela-hit': (256, 8), 'fx-m5-michaela-ground-heart': (256, 10), 'fx-m7-michaela-sky-pillar': (256, 12)}
out = {}
for k, (cw, n) in SHEETS.items():
    p = f'assets/r1041/{k}.webp'
    im = Image.open(R / 'runtime-text' / p).convert('RGBA')
    cells = [im.crop((i * cw, 0, (i + 1) * cw, im.height)) for i in range(im.width // cw)]
    alpha = [round(ImageStat.Stat(x.getchannel('A')).mean[0], 3) for x in cells]
    distinct = sum(1 for a, b in zip(cells, cells[1:]) if ImageStat.Stat(ImageChops.difference(a, b).convert('L')).mean[0] > 0.3)
    out[p] = {'width': im.width, 'height': im.height, 'frames': len(cells), 'alpha': alpha, 'distinct': distinct}
dst = R / 'qa' / 'r1041' / 'sheet-stats.json'
dst.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
print(len(out), 'sheets ->', dst)
