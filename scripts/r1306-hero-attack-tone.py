#!/usr/bin/env python3
"""R1306 2D 영웅 공격 그림 색을 대기 그림에 맞춘 파생본(원본은 그대로, 윤곽·칸·발 기준점 그대로).
 ① 라우렌 R437 좌우 공격 attack-e: 보라 계열(색상 150~250/255) 픽셀만 색상을 대기(R130 idle-e) 중앙값 쪽으로 돌린다
    — 원본은 머리칼·외투가 자홍빛(중앙값 216)이라 남보라(191)인 서기·걷기와 다른 옷처럼 보였다. 금색 자수·은 갑옷(다른 색상·저채도)과 빛나는 장갑·창날(밝은 픽셀)은 그대로.
 ② 헌터 R425 좌우 공격 attack-l/r: 정면 원화가 서기(R130 idle)보다 밝고 덜 짙다(V 75·S 130 대 V 57·S 154)
    → 명도 곡선(감마)과 채도 배율로 대기 평균에 맞춘다. 색상은 그대로.
 결과는 assets/r1306-2d/<원래 경로> (경로 꼬리를 품어 몸 그림 정규식 r437/·r425/hunter/ 가 그대로 통한다).
사용: python3 scripts/r1306-hero-attack-tone.py  → 결과 json 출력. numpy 없이 PIL 만 쓴다."""
import json, hashlib
from pathlib import Path
from PIL import Image, ImageStat, ImageChops

RT = Path(__file__).resolve().parents[1] / 'r96' / 'runtime-text'
OUT = 'assets/r1306-2d/'


def hsv_stats(im):
    A = im.getchannel('A'); hsv = im.convert('RGB').convert('HSV'); H, S, V = hsv.split()
    m = A.point(lambda v: 255 if v > 200 else 0)
    st = ImageStat.Stat(hsv, m)
    ms = ImageChops.multiply(m, S.point(lambda v: 255 if v > 40 else 0))
    hist = H.histogram(ms); tot = sum(hist); acc = 0; med = None
    for k, c in enumerate(hist):
        acc += c
        if acc * 2 >= tot:
            med = k; break
    return {'S': st.mean[1], 'V': st.mean[2], 'hue': med}


def rebuild(im, H, S, V):
    rgb = Image.merge('HSV', (H, S, V)).convert('RGB')
    out = rgb.convert('RGBA'); out.putalpha(im.getchannel('A'))
    return out


def lauren():
    src = 'assets/r437/attack/lauren/attack-e.webp'
    im = Image.open(RT / src).convert('RGBA')
    tgt = hsv_stats(Image.open(RT / 'assets/r130/lauren/idle-e.webp').convert('RGBA'))
    cur = hsv_stats(im)
    d = tgt['hue'] - cur['hue']  # 음수: 자홍 → 남보라
    H, S, V = im.convert('RGB').convert('HSV').split()
    # 보라 계열만 돌리고(가장자리 150·250 근처는 천천히), 채도 낮은 회색·은빛은 채도에 비례해 덜 돌린다
    def w_h(h):
        if h < 140 or h > 250: return 0.0
        if h < 160: return (h - 140) / 20
        if h > 235: return (250 - h) / 15
        return 1.0
    hp, sp, vp = H.load(), S.load(), V.load(); w, h = im.size
    for y in range(h):
        for x in range(w):
            hh = hp[x, y]; ww = w_h(hh)
            if ww <= 0: continue
            ww *= min(1.0, sp[x, y] / 60)
            # 빛나는 장갑·창날(밝은 픽셀)은 대기에서도 연보라 빛이라 덜 돌린다(파랗게 식지 않게)
            vv = vp[x, y]
            if vv > 150: ww *= max(0.0, 1 - (vv - 150) / 60)
            hp[x, y] = int(round(hh + d * ww)) % 256
    # 채도: 대기 쪽으로 반만(옷 결이 뭉개지지 않게)
    k = 1 + (tgt['S'] / max(1, cur['S']) - 1) * .5
    S = S.point(lambda v: min(255, int(round(v * k))))
    return src, rebuild(im, H, S, V), {'hueShift': d, 'satK': round(k, 3), 'target': tgt, 'source': cur}


def hunter(side):
    src = f'assets/r425/hunter/attack-{side}.webp'
    im = Image.open(RT / src).convert('RGBA')
    tgt = hsv_stats(Image.open(RT / 'assets/r130/hunter/idle-e.webp').convert('RGBA'))
    cur = hsv_stats(im)
    H, S, V = im.convert('RGB').convert('HSV').split()
    # 명도: v' = 255*(v/255)^g, 평균이 대기와 같아지는 g 를 이분 탐색
    m = im.getchannel('A').point(lambda v: 255 if v > 200 else 0)
    def meanV(g):
        return ImageStat.Stat(V.point(lambda v: int(round(255 * (v / 255) ** g))), m).mean[0]
    lo, hi = 1.0, 3.0
    for _ in range(30):
        mid = (lo + hi) / 2
        if meanV(mid) > tgt['V']: lo = mid
        else: hi = mid
    g = (lo + hi) / 2
    V2 = V.point(lambda v: int(round(255 * (v / 255) ** g)))
    k = tgt['S'] / max(1, cur['S'])
    S2 = S.point(lambda v: min(255, int(round(v * k))))
    return src, rebuild(im, H, S2, V2), {'gamma': round(g, 4), 'satK': round(k, 3), 'target': tgt, 'source': cur}


res = []
for f in (lauren, lambda: hunter('l'), lambda: hunter('r')):
    src, out, info = f()
    dst = RT / (OUT + src[len('assets/'):])
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, 'WEBP', lossless=True, quality=100, method=6)
    b = dst.read_bytes()
    res.append({'path': OUT + src[len('assets/'):], 'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b),
                'source': {'path': src, 'sha256': hashlib.sha256((RT / src).read_bytes()).hexdigest()}, 'result': hsv_stats(out), **info})
print(json.dumps(res, ensure_ascii=False, indent=1))
