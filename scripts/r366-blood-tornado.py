#!/usr/bin/env python3
"""R366 슬레이어 R '피의 회오리' 프레임 시트 (사용자 2026-11-06 "슬레이어 r도 .) 이거 없애줘 이펙트 그리고 디아바바리안 돌면서
스킬쓰는것처럼 피토네이도스킬이펙트로 변경해줘").

외부 게임 자산·원본 그림은 쓰지 않는다 — 이 스크립트가 수식(난수 씨앗 고정)으로 처음부터 그린다. 글자·육망성 없음.
모양: 발밑이 좁고 위로 갈수록 넓어지는 깔때기(높이 = 영웅 키의 약 1.9배). 깔때기 둘레를 도는 핏빛 띠(검붉음→거의 검정,
가장자리만 진홍 하이라이트) 9줄 + 튀는 핏방울. 한 바퀴 = 12칸(마지막 칸 → 첫 칸이 이어짐).
두 장을 만든다: back(영웅 뒤로 도는 반쪽) · front(영웅 앞으로 도는 반쪽). 게임은 back → 영웅 → front 순서로 그린다.
출력: <out>/tornado-back.webp, tornado-front.webp (가로 한 줄, 칸 256×320, 발 기준점 (128,286)), index.json(크기·sha256·용도).
사용: python3 -I scripts/r366-blood-tornado.py r96/runtime-text/assets/r366
"""
import sys, os, json, hashlib, math
import numpy as np
from PIL import Image, ImageFilter

CW, CH, N, SS = 256, 320, 12, 3          # 칸 크기, 칸 수, 슈퍼샘플
OX, OY = 128, 286                         # 발 기준점(칸 안)
H = 250.0                                 # 깔때기 높이(px)
DEEP = np.array([150, 12, 26.]); DARK = np.array([48, 4, 10.]); HI = np.array([245, 64, 62.])


def radius(v):  # v: 0 발밑 → 1 꼭대기
    return 22 + 80 * v ** .85


def frame(i, layer, rng_seed=366):
    rng = np.random.default_rng(rng_seed)
    W, Hh = CW * SS, CH * SS
    acc = np.zeros((Hh, W, 4))
    ph = i / N * 2 * math.pi
    bands = 14
    for b in range(bands):
        v0 = (b + .3) / bands * .92
        thick = (3.5 + 5 * v0) * SS
        a_start = rng.uniform(0, 2 * math.pi)
        span = rng.uniform(2.2, 3.6)
        speed = 1 + (b % 3)  # 띠마다 1·2·3 바퀴 / 루프 → 칸 이음 매끄러움
        steps = 220
        for s in range(steps):
            k = s / (steps - 1)
            ang = a_start + k * span + ph * speed
            v = v0 + .07 * k
            r = radius(v)
            front = math.sin(ang) > 0
            if (layer == 'front') != front:
                continue
            x = (OX + math.cos(ang) * r) * SS
            y = (OY - v * H + math.sin(ang) * r * .34) * SS
            taper = math.sin(math.pi * k) ** .7
            rad = thick * (.35 + .65 * taper)
            # 색: 가운데는 검붉음, 띠 앞쪽 끝 · 앞면일수록 진홍 하이라이트
            hl = (k ** 3) * (.55 + .45 * max(0, math.sin(ang)))
            col = DEEP * (1 - hl) + HI * hl
            col = col * (1 - .5 * v) + DARK * (.5 * v)
            alpha = (.55 + .4 * taper) * (1 - .35 * v)
            y0, y1 = int(max(0, y - rad - 2)), int(min(Hh, y + rad + 3))
            x0, x1 = int(max(0, x - rad - 2)), int(min(W, x + rad + 3))
            if y1 <= y0 or x1 <= x0:
                continue
            yy, xx = np.mgrid[y0:y1, x0:x1]
            d = np.hypot((xx - x) / 1.6, yy - y) / max(1, rad)  # 가로로 긴 붓 자국
            m = np.clip(1 - d, 0, 1) ** 1.4 * alpha
            sub = acc[y0:y1, x0:x1]
            sub[..., :3] = sub[..., :3] * (1 - m[..., None]) + col * m[..., None]
            sub[..., 3] = sub[..., 3] + m * (1 - sub[..., 3])
    # 깔때기 몸(옅은 핏빛 안개): 띠 사이를 메워 한 덩어리 회오리로 읽히게
    yy, xx = np.mgrid[0:Hh, 0:W]
    v = np.clip((OY * SS - yy) / (H * SS), 0, 1)
    r = (22 + 80 * v ** .85) * SS
    dx = (xx - OX * SS) / r
    inside = np.clip(1 - np.abs(dx), 0, 1)
    swirl = .5 + .5 * np.sin(dx * 3.0 + v * 9 - ph * 2)
    fog = inside ** .6 * (v > 0) * (v < 1) * (.10 + .10 * swirl) * (1 - .6 * v) * (.6 if layer == 'front' else 1)
    fog *= np.clip(v / .06, 0, 1)
    col = DEEP * .8 + DARK * .2
    acc[..., :3] = acc[..., :3] * (1 - fog[..., None]) + col * fog[..., None]
    acc[..., 3] = acc[..., 3] + fog * (1 - acc[..., 3])
    # 핏방울: 깔때기 바깥으로 튀며 돈다
    for d_ in range(26):
        a0 = rng.uniform(0, 2 * math.pi); v = rng.uniform(.05, .95); out = rng.uniform(1.0, 1.25)
        ang = a0 + ph * (1 + d_ % 2)
        if (layer == 'front') != (math.sin(ang) > 0):
            continue
        r = radius(v) * out
        x = (OX + math.cos(ang) * r) * SS; y = (OY - v * H + math.sin(ang) * r * .34) * SS
        rad = rng.uniform(1.6, 3.4) * SS
        y0, y1 = int(max(0, y - rad - 1)), int(min(Hh, y + rad + 2)); x0, x1 = int(max(0, x - rad * 2 - 1)), int(min(W, x + rad * 2 + 2))
        if y1 <= y0 or x1 <= x0:
            continue
        yy, xx = np.mgrid[y0:y1, x0:x1]
        m = np.clip(1 - np.hypot((xx - x) / 1.8, yy - y) / rad, 0, 1) ** .8 * .9
        col = HI * .7 + DEEP * .3
        sub = acc[y0:y1, x0:x1]
        sub[..., :3] = sub[..., :3] * (1 - m[..., None]) + col * m[..., None]
        sub[..., 3] = sub[..., 3] + m * (1 - sub[..., 3])
    # 칠한 결: 고정 잡음으로 알파·명도 얼룩
    noise = np.random.default_rng(9).random((Hh // 6 + 1, W // 6 + 1))
    noise = np.array(Image.fromarray((noise * 255).astype(np.uint8)).resize((W, Hh), Image.BICUBIC)) / 255.
    acc[..., 3] *= .78 + .22 * noise
    acc[..., :3] *= (.85 + .3 * noise)[..., None]
    rgba = np.dstack([np.clip(acc[..., :3], 0, 255), np.clip(acc[..., 3] * 255, 0, 255)]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA').resize((CW, CH), Image.LANCZOS)
    a = np.array(im); a[a[..., 3] < 6] = 0
    return Image.fromarray(a, 'RGBA')


def main(out):
    os.makedirs(out, exist_ok=True)
    files = {}
    for layer in ('back', 'front'):
        sheet = Image.new('RGBA', (CW * N, CH))
        for i in range(N):
            sheet.paste(frame(i, layer), (i * CW, 0))
        p = os.path.join(out, f'tornado-{layer}.webp')
        sheet.save(p, 'WEBP', quality=88, method=6)
        b = open(p, 'rb').read()
        files[layer] = {'file': f'tornado-{layer}.webp', 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()}
    idx = {'revision': 'R366-tornado-1', 'cell': [CW, CH], 'frames': N, 'cols': N, 'origin': [OX, OY], 'height_px': H,
           'loop_s': .5, 'blend': 'source-over', 'layers': files,
           'provenance': '수식으로 새로 그림(scripts/r366-blood-tornado.py, 씨앗 366·9 고정). 외부 게임·드라이브 원천 없음. 글자·육망성 없음.',
           'use': '슬레이어 R(피의 난도질) 시전 동안 영웅 둘레 피의 회오리 — back 은 영웅 뒤, front 는 영웅 앞.'}
    with open(os.path.join(out, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump(idx, f, ensure_ascii=False, indent=1)
    print(json.dumps(idx, ensure_ascii=False))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'r96/runtime-text/assets/r366')
