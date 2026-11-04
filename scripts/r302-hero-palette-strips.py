#!/usr/bin/env python3
"""R302 영웅 2색 팔레트(고유색+보조색) 재채색 띠 — 사용자 2026-11-04
 "모든 플레이어 스킬 및 공격은 플레이어 고유색 + 보조색으로만 이펙트가 이루어져야 함", "네온 창끝끼리 나오는 이펙트 별론데, 스킬 이펙트 민트색으로 통일".

원천: r96/runtime-text/assets/r292/fx/<영웅>/<동작>.webp (읽기 전용, 덮어쓰지 않음).
출력: r96/runtime-text/assets/r302/fx/<영웅>/<동작>.webp + index.json (R292 표와 같은 꼴 + 원천 sha256·팔레트).
재채색: 픽셀 밝기(명암)만 남기고 색은 [그림자(고유색×.28) → 고유색 → 보조색 → 보조색 밝게] 기울기로 바꾼다(알파 그대로).
네온 basic(창끝 둘이 모이는 화살촉 모양, R292 neon/basic.webp 2~5칸)은 쓰지 않고, 네온 special(회로 폭주) 1~2칸의 외줄 번개를
 8칸(번쩍→사그라듦)으로 다시 엮어 쓴다.
사용: python3 -I scripts/r302-hero-palette-strips.py
"""
import hashlib, json
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'r96/runtime-text/assets/r292/fx'
OUT = ROOT / 'r96/runtime-text/assets/r302/fx'
CELL = 384
SILVER, GOLD = [226, 232, 242], [255, 198, 72]
# hero-palette-r302.js PALETTE 와 같은 값(CPU 검사가 대조)
PALETTE = {
 'hwando': ([214, 222, 234], GOLD), 'seoha': ([120, 206, 255], SILVER), 'neon': ([62, 230, 193], SILVER),
 'michaela': ([178, 26, 62], SILVER), 'lauren': ([164, 98, 255], SILVER), 'hunter': ([255, 96, 40], SILVER),
 'slayer': ([222, 22, 52], SILVER), 'gunner': ([70, 124, 255], SILVER)}


def sha(b):
    return hashlib.sha256(b).hexdigest()


def ramp(a, b):
    a, b = np.array(a, float), np.array(b, float)
    if a.sum() > b.sum():  # 고유색이 더 밝으면(환도 실버+골드) 보조색을 중간톤, 고유색을 밝은 쪽에
        stops = [(0, b * .28), (.55, b), (.88, a), (1, a + (255 - a) * .5)]
    else:
        stops = [(0, a * .28), (.6, a), (.9, b), (1, b + (255 - b) * .5)]
    xs = np.linspace(0, 1, 256)
    out = np.zeros((256, 3))
    for i in range(3):
        out[:, i] = np.interp(xs, [s[0] for s in stops], [s[1][i] for s in stops])
    return out


def recolor(im, hero):
    arr = np.asarray(im.convert('RGBA')).astype(float)
    L = (arr[..., :3].max(-1) * .6 + (arr[..., :3] @ [.299, .587, .114]) * .4)
    lut = ramp(*PALETTE[hero])
    rgb = lut[np.clip(L, 0, 255).astype(int)]
    res = np.concatenate([rgb, arr[..., 3:4]], -1)
    res[arr[..., 3] == 0] = 0
    return Image.fromarray(res.round().clip(0, 255).astype(np.uint8), 'RGBA')


def neon_basic():
    sp = Image.open(SRC / 'neon/special.webp').convert('RGBA')
    f1, f2 = sp.crop((CELL, 0, 2 * CELL, CELL)), sp.crop((2 * CELL, 0, 3 * CELL, CELL))
    seq = [(f1, 1), (f2, 1), (f2, 1), (f2, .8), (f2, .6), (f2, .4), (f2, .22), (f2, .1)]
    out = Image.new('RGBA', (8 * CELL, CELL), (0, 0, 0, 0))
    for i, (f, k) in enumerate(seq):
        a = np.asarray(f).copy()
        a[..., 3] = (a[..., 3] * k).astype(np.uint8)
        out.paste(Image.fromarray(a, 'RGBA'), (i * CELL, 0))
    return out


def main():
    src_idx = json.loads((SRC / 'index.json').read_text())
    effects = {}
    for hero, acts in src_idx['effects'].items():
        for action, row in acts.items():
            srcf = SRC / row['file']
            raw = srcf.read_bytes()
            if sha(raw) != row['sha256']:
                raise SystemExit('r292 sha mismatch ' + row['file'])
            how = 'recolor'
            if hero == 'neon' and action == 'basic':
                im, how = neon_basic(), 'neon/special.webp 1~2칸 외줄 번개 → 8칸 재구성 + recolor (창끝 모임 R292 neon/basic 대체)'
            else:
                im = Image.open(srcf)
            im = recolor(im, hero)
            dst = OUT / hero / f'{action}.webp'
            dst.parent.mkdir(parents=True, exist_ok=True)
            im.save(dst, 'WEBP', lossless=True, quality=100, method=4, exact=True)
            b = dst.read_bytes()
            back = np.asarray(Image.open(dst).convert('RGBA')).reshape(-1, 4)
            back = back[back[:, 3] > 0][:, :3].astype(float)
            lut = ramp(*PALETTE[hero])
            uniq = np.unique(back, axis=0)
            dist = np.sqrt(((uniq[:, None, :] - lut[None, :, :]) ** 2).sum(-1)).min(1)
            off = int((dist > 3).sum())
            if off:
                raise SystemExit(f'off-palette colours {off}: {dst}')
            r = dict(row)
            r.update({'file': f'{hero}/{action}.webp', 'sha256': sha(b), 'bytes': len(b), 'size': list(im.size),
                      'frames': im.size[0] // CELL, 'derivedFrom': 'assets/r292/fx/' + row['file'], 'derivedFromSha256': row['sha256'],
                      'palette': {'main': PALETTE[hero][0], 'sub': PALETTE[hero][1]}, 'how': how, 'blend': row['blend'], 'offPaletteColours': off, 'uniqueColours': int(len(uniq))})
            if hero == 'neon' and action == 'basic':
                r['derivedFrom'] = 'assets/r292/fx/neon/special.webp'
                r['derivedFromSha256'] = src_idx['effects']['neon']['special']['sha256']
                r['note'] = '기본 전격 찌르기 — 외줄 번개(창끝 모임 그림 대체)'
            effects.setdefault(hero, {})[action] = r
            print(hero, action, len(b))
    idx = {'revision': 'R302-hero-palette-strips-1', 'cell': CELL,
           'reason': '사용자 2026-11-04: 영웅 이펙트는 고유색+보조색 2색만 / 네온 창끝 이펙트 교체·민트 통일',
           'source': 'R292 띠(assets/r292/fx, 원본 보존) 재채색 파생본', 'palette': {h: {'main': a, 'sub': b} for h, (a, b) in PALETTE.items()},
           'effects': effects}
    (OUT / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, indent=1) + '\n')


if __name__ == '__main__':
    main()
