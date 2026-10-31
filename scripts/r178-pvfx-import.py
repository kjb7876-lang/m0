#!/usr/bin/env python3
"""R178: PVFX Foundry(CC0 1.0, nerijs.itch.io/pvfx-foundry) 프레임 시트 일부를 pixelfx(R163) 시트 칸에 더한다.

  python3 -I scripts/r178-pvfx-import.py <풀어 둔 PVFX-Foundry 폴더> [이름 ...]

- 읽기만 한다: 풀어 둔 폴더의 effects/<이름>/grid/sprite-sheet.png + manifest.json.
- 칸(96x96)을 2배로 키우고 R166 과 같은 결의 손질(계단 풀기 흐림·밝은 곳 빛 번짐·채도 낮춤)을 한 뒤
  r96/runtime-text/assets/r163/pixelfx/pvfx-<이름>.webp(무손실)로 쓰고, index.json 에 출처·라이선스·원본 sha256 을 남긴다.
- 기존 시트·항목은 그대로 둔다(같은 이름 항목만 다시 쓴다).
"""
import hashlib, json, os, sys
from PIL import Image, ImageFilter, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'r96', 'runtime-text', 'assets', 'r163', 'pixelfx')
DEFAULT = {
    'resonant-break': 'EGO 진입 — 공명이 깨지며 터지는 초승달 조각(영웅 색)',
    'rift-portal': '피의 육망성 조형물이 잡몹을 부를 때 — 균열 문(핏빛)',
    'void-implosion': '세뇌당한 기억의 조각(탑)이 깨질 때 — 안으로 무너짐(핏빛)',
    'choir-moths': '기억 조각 수집물을 주울 때 — 흩어지는 나방(핏빛)',
}
# 블링크(foldstep)·공명 방어(arcane-parry)는 화면에서 기존 연출에 묻히고 깔끔한 기하 무늬가 어두운 화풍과 맞지 않아 쓰지 않는다(사용자 "게임 화풍에 맞는 것만").
SCALE = 2


def soften(im):
    im = im.resize((im.width * SCALE, im.height * SCALE), Image.NEAREST)
    r, g, b, a = im.split()
    rgb = Image.merge('RGB', (r, g, b))
    rgb = ImageEnhance.Color(rgb).enhance(0.82)
    soft = Image.merge('RGBA', (*rgb.split(), a)).filter(ImageFilter.GaussianBlur(0.8))
    glow = soft.filter(ImageFilter.GaussianBlur(6))
    ga = glow.split()[3].point(lambda v: int(v * 0.4))
    glow.putalpha(ga)
    base = Image.new('RGBA', im.size, (0, 0, 0, 0))
    base.alpha_composite(glow)
    base.alpha_composite(soft)
    return base


def main():
    src = sys.argv[1]
    names = sys.argv[2:] or list(DEFAULT)
    idx_path = os.path.join(OUT, 'index.json')
    idx = json.load(open(idx_path, encoding='utf8'))
    for n in names:
        g = os.path.join(src, 'effects', n, 'grid')
        m = json.load(open(os.path.join(g, 'manifest.json'), encoding='utf8'))
        png = os.path.join(g, 'sprite-sheet.png')
        raw = open(png, 'rb').read()
        im = Image.open(png).convert('RGBA')
        sw, sh = m['source_size']
        cols = im.width // sw
        frames = len(m['frames'])
        ms = m['frames'][0]['duration']['numerator_ms'] / m['frames'][0]['duration']['denominator']
        out = soften(im)
        name = 'pvfx-' + n
        path = os.path.join(OUT, name + '.webp')
        out.save(path, 'WEBP', lossless=True, method=6)
        data = open(path, 'rb').read()
        idx['effects'][name] = {
            'source': 'PVFX Foundry 0.10.0 (CC0 1.0 Universal) — https://nerijs.itch.io/pvfx-foundry',
            'sourceFile': 'effects/%s/grid/sprite-sheet.png' % n,
            'sourceSha256': hashlib.sha256(raw).hexdigest(),
            'use': DEFAULT.get(n, ''),
            'file': name + '.webp', 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data),
            'frame': [sw * SCALE, sh * SCALE], 'pivot': [m['pivot'][0] * SCALE, m['pivot'][1] * SCALE],
            'columns': cols, 'frames': frames, 'fps': round(1000 / ms, 3), 'loop': m.get('loop_mode') == 'loop',
            'soften': 'x2 nearest, saturation .82, blur .8px, glow 6px .4',
        }
        print(name, frames, 'frames', len(data), 'bytes')
    json.dump(idx, open(idx_path, 'w', encoding='utf8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
