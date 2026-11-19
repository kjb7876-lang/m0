#!/usr/bin/env python3
"""R1198b: Dots CX-0165PH(페르소나 하이라이트 3종) 원본 → assets/r1198 시트(6열×192칸 webp, R946 시트 규격).
원본: /mnt/project-files/dots-results/cx0165ph-r1/raw/ (1536×1024, 256칸 24장, 투명, ROUGH).
손질(Dots 루프 검수 메모 반영): ph01 총구 대폭발 = 채도·밝기 조금 올리고 1~3칸은 왼쪽(언주 구)·오른쪽(흑 구)을 갈라 칠함.
 ph02 언주 충격 고리 = 그대로(알파 16 이하 지움). ph03 심연 붕괴 = 어두운 연기가 묻히지 않게 밝기·대비 올리고 가장자리에 검빨 테.
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageChops
SRC = Path(sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/dots-results/cx0165ph-r1/raw')
OUT = Path(__file__).resolve().parent.parent / 'r96/runtime-text/assets/r1198'
CELL, COLS, N, OC = 256, 6, 24, 192
JOBS = [('ph01_binary-annihilation-burst.png', 'persona-hl-burst', 'burst'),
        ('ph02_vermilion-ground-shockwave.png', 'persona-hl-ring', 'ring'),
        ('ph03_abyss-dwarf-collapse.png', 'persona-hl-collapse', 'collapse')]

def clean(c):
    a = c.getchannel('A').point(lambda v: 0 if v <= 16 else v)
    c.putalpha(a); return c

def burst(c, i):
    rgb = ImageEnhance.Brightness(ImageEnhance.Color(c.convert('RGB')).enhance(1.25)).enhance(1.15)
    if i < 3:  # 언주 구(왼쪽)·흑 구(오른쪽) 대비
        px = rgb.load(); a = c.getchannel('A').load()
        for y in range(CELL):
            for x in range(CELL):
                if a[x, y] == 0: continue
                r, g, b = px[x, y]
                if x < 92: px[x, y] = (min(255, int(r * 1.25 + 20)), min(255, int(g * 1.05 + 18)), int(b * .8))
                else: px[x, y] = (int(r * .45), int(g * .4), int(b * .45))
    rgb.putalpha(c.getchannel('A')); return rgb

def collapse(c, i):
    a = c.getchannel('A')
    rgb = ImageEnhance.Contrast(ImageEnhance.Brightness(c.convert('RGB')).enhance(1.7)).enhance(1.3)
    rim = ImageChops.subtract(a.filter(ImageFilter.MaxFilter(5)), a)  # 바깥 테
    red = Image.new('RGB', (CELL, CELL), (150, 22, 30))
    a2 = ImageChops.lighter(a, rim.point(lambda v: int(v * .7)))
    edge = ImageChops.subtract(a, a.filter(ImageFilter.MinFilter(5)))  # 안쪽 테
    m = ImageChops.lighter(rim, edge).point(lambda v: int(v * .6))
    rgb = Image.composite(red, rgb, m); rgb.putalpha(a2.point(lambda v: min(255, int(v * 1.35)))); return rgb  # 연기 알파도 올려 화면에서 묻히지 않게

def main():
    OUT.mkdir(parents=True, exist_ok=True); idx = {'request': 'CX-0165PH', 'source': 'Dots (Google Drive), ROUGH r1', 'cell': OC, 'cols': COLS, 'frames': N, 'sheets': {}}
    for src, name, kind in JOBS:
        p = SRC / src; im = Image.open(p).convert('RGBA'); assert im.size == (1536, 1024), im.size
        out = Image.new('RGBA', (COLS * OC, 4 * OC), (0, 0, 0, 0))
        for i in range(N):
            c = clean(im.crop(((i % 6) * CELL, (i // 6) * CELL, (i % 6) * CELL + CELL, (i // 6) * CELL + CELL)))
            if kind == 'burst': c = burst(c, i)
            elif kind == 'collapse': c = collapse(c, i)
            out.paste(c.resize((OC, OC), Image.LANCZOS), ((i % COLS) * OC, (i // COLS) * OC))
        dst = OUT / (name + '.webp'); out.save(dst, 'WEBP', quality=88, method=6)
        idx['sheets'][name] = {'from': src, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'bytes': p.stat().st_size,
                               'out_sha256': hashlib.sha256(dst.read_bytes()).hexdigest(), 'out_bytes': dst.stat().st_size, 'edit': kind}
        print(name, dst.stat().st_size)
    (OUT / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, indent=1) + '\n')
main()
