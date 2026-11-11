#!/usr/bin/env python3
"""R437 네온 새 초상화 — 사용자 2026-11-09 "네온 신규초상화 뒤에 무기만 없애서 적용해줘".
원천(읽기 전용, 비공개 드라이브): HERO-neon-portrait-selected-v1-20261109.png (1122×1402 RGB).
뒤에 세운 창(왼쪽 가장자리, 위 끝~어깨 갑옷 뒤)만 지운다. 얼굴·머리·갑옷 그림은 손대지 않는다:
 1) 어깨 갑옷 위쪽 창날·코등이 자리(다각형 MASK)를 그 줄의 바로 오른쪽 배경 띠(x 150~200, 창·머리카락 없음)에서 가져온 결로 채우고
    줄마다 중앙값을 세로로 부드럽게 이은 색+옅은 결, 가장자리 12px 페더로 배경 연기와 잇는다.
 2) 어깨 갑옷 아래로 내려가는 창 자루(x<64)는 잘라 낸다(초상화 틀은 원래 가운데를 잘라 씀).
 3) 3:4 로 맞춰 R108 초상화와 같은 384×512 WebP(q92)로 줄인다. 원래 assets/r108/heroes/neon.webp 는 그대로 둔다(덧씌우기).
사용: python3 -I scripts/r437-neon-portrait.py <원천 png> <출력 webp>
"""
import sys, hashlib, json
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
MASK = [(0, 0), (152, 0), (152, 700), (176, 738), (66, 866), (0, 866)]
BAND = (150, 200)
CROP_X0 = 64

def main(src, out):
    im = Image.open(src).convert('RGB'); W, H = im.size; a = np.array(im).astype(float)
    fill = a.copy()
    med = np.median(a[:701, BAND[0]:BAND[1]], axis=1)  # 줄마다 배경 띠의 중앙값(머리카락 한 올이 줄무늬로 번지지 않게)
    k = np.exp(-np.arange(-30, 31) ** 2 / (2 * 12.0 ** 2)); k /= k.sum()
    med = np.stack([np.convolve(np.pad(med[:, c], 30, mode='edge'), k, mode='valid') for c in range(3)], 1)
    rng = np.random.default_rng(437)
    for y in range(H):
        fill[y, :BAND[0] + 40] = med[min(y, 700)] + rng.normal(0, 1.6, (BAND[0] + 40, 3))  # 아주 옅은 결
    f = Image.fromarray(np.clip(fill, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(MASK, fill=255); m = m.filter(ImageFilter.GaussianBlur(6))
    res = Image.composite(f, im, m)
    w = W - CROP_X0; h = round(w * 4 / 3)
    if h > H: h = H; w = round(H * 3 / 4)
    res = res.crop((CROP_X0, 0, CROP_X0 + w, h)).resize((384, 512), Image.LANCZOS)
    res.save(out, 'WEBP', quality=92, method=6)
    b = open(out, 'rb').read(); s = open(src, 'rb').read()
    print(json.dumps({'out': out, 'size': [384, 512], 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(), 'source_sha256': hashlib.sha256(s).hexdigest(), 'mask': MASK, 'crop_x0': CROP_X0, 'crop_wh': [w, h]}, ensure_ascii=False))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
