#!/usr/bin/env python3
"""R1039: R100 sig-aura·sig-gather 영웅색 시트(12칸 가로)의 칸마다 알파 평균과 이웃 칸 차이를 재서 r96/qa/r1039/sheet-stats.json 에 남긴다.
'정지 그림(1장)'이 아니라 칸마다 그림이 다른 프레임 애니메이션인지 CPU 검사가 확인하는 근거."""
import json, pathlib
from PIL import Image, ImageChops, ImageStat
R = pathlib.Path(__file__).resolve().parent.parent / 'r96'
COL = ['pale', 'cyan', 'teal', 'pink', 'violet', 'orange', 'red', 'blue']
out = {}
for c in COL:
    for k, size in (('aura', 160), ('gather', 192)):
        p = f'assets/r100/sig-{k}-{c}.webp'
        im = Image.open(R / 'runtime-text' / p).convert('RGBA')
        n = im.width // size
        cells = [im.crop((i * size, 0, (i + 1) * size, size)) for i in range(n)]
        alpha = [round(ImageStat.Stat(x.getchannel('A')).mean[0], 3) for x in cells]
        distinct = sum(1 for a, b in zip(cells, cells[1:]) if ImageStat.Stat(ImageChops.difference(a, b).convert('L')).mean[0] > 0.5)
        out[p] = {'frames': n, 'cell': size, 'alpha': alpha, 'distinct': distinct}
dst = R / 'qa' / 'r1039' / 'sheet-stats.json'
dst.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
print(len(out), 'sheets ->', dst)
