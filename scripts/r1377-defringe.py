#!/usr/bin/env python3
"""R1377 Dots 시트에 남은 빨간 윤곽(요청용 참고 그림의 표시선)을 걷어 낸다(PIL 만, numpy 없음).
가장자리(투명과 맞닿은 띠)에서 붉은 기가 도는 픽셀만 한 겹씩 지우기를 몇 번 되풀이하고, 남은 가장자리를 1px 부드럽게 한다.
사용: python3 scripts/r1377-defringe.py <입력.png> <출력.png> [겹수=6] [--desat]
--desat: 몸 안 틈에 갇혀 남은 어두운 붉은 점을 회색으로(몸에 붉은 색이 없는 몹만 — 불면귀 등, 밝은 눈빛은 그대로)"""
import sys
from PIL import Image, ImageChops, ImageFilter

def redmask(im):
    r, g, b, _ = im.split()
    rg = ImageChops.subtract(r, g).point(lambda v: 255 if v > 22 else 0)
    rb = ImageChops.subtract(r, b).point(lambda v: 255 if v > 22 else 0)
    return ImageChops.multiply(rg, rb)

def defringe(im, passes=6):
    im = im.convert('RGBA'); red = redmask(im)
    for _ in range(passes):
        a = im.getchannel('A'); solid = a.point(lambda v: 255 if v > 24 else 0)
        edge = ImageChops.subtract(solid, solid.filter(ImageFilter.MinFilter(3)))
        kill = ImageChops.multiply(edge, red)
        if not kill.getbbox(): break
        im.putalpha(ImageChops.subtract(a, kill))
    a = im.getchannel('A'); soft = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.8))
    im.putalpha(ImageChops.darker(a, ImageChops.lighter(soft, a.filter(ImageFilter.MinFilter(3)))))
    return im

def desat_dark_red(im):
    r, g, b, a = im.split(); red = redmask(im)
    lum = Image.merge('RGB', (r, g, b)).convert('L'); dark = lum.point(lambda v: 255 if v < 110 else 0)
    m = ImageChops.multiply(red, dark); gray = Image.merge('RGB', (ImageChops.darker(g, b),) * 3)
    rgb = Image.composite(gray, Image.merge('RGB', (r, g, b)), m); rgb.putalpha(a); return rgb

if __name__ == '__main__':
    args = [x for x in sys.argv[1:] if not x.startswith('--')]; n = int(args[2]) if len(args) > 2 else 6
    out = defringe(Image.open(args[0]), n)
    if '--desat' in sys.argv: out = desat_dark_red(out)
    out.save(args[1])
