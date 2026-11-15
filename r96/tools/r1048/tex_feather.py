# R1048 EGO 깃털·머리 카드 텍스처를 코드로 그린다(손그림 대신, 사용자 11-15 10:35Z "닷츠말고").
# 실행: python3 tex_feather.py <out_dir>
#  · feather_a~d.png (256×1024 RGBA): 위 = 밑동, 아래 = 끝. 가운데 깃대, 비스듬한 깃가지 결, 톱니 가장자리,
#    상아색 #EFE6E0 → 끝 22~30% 진홍 #B3121B, 밑동 솜털. 알파로 모양을 오린다.
#  · hair_a~b.png (256×512 RGBA): 흰 머리 가닥 묶음(#E8E4E0), 끝이 갈라지고 가늘어짐.
import sys, os, math
import numpy as np
from PIL import Image

OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
IV = np.array([239, 230, 224]) / 255; CR = np.array([179, 18, 27]) / 255; DK = np.array([40, 6, 9]) / 255

def smooth(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)

def feather(seed, W=256, H=1024, red0=.72, width=.42, notches=7, split=.0):
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:H, 0:W].astype(float); t = y / (H - 1); u = (x - W / 2) / (W / 2)  # u: -1..1
    # 윤곽: 밑동 좁게 → 가운데 넓게 → 끝 뾰족
    prof = width * np.sin(np.pi * (.06 + .94 * t)) ** .55 * (1 - .2 * t)
    side = np.sign(u); au = np.abs(u)
    # 톱니(깃가지가 갈라진 틈): 양쪽 다른 위치, 깊이 난수
    cuts = np.zeros_like(t)
    for s_ in (-1, 1):
        for k in range(notches):
            c = .3 + .65 * (k + rng.random() * .6) / notches; d = .25 + .35 * rng.random()
            m = (side == s_) & (np.abs(t - c - au * .12) < .006 + .01 * au)
            cuts[m] = np.maximum(cuts[m], d)
    edge = prof * (1 - cuts * smooth((au / np.maximum(prof, 1e-3) - .35) / .5))
    # 깃가지 결: 바깥·아래로 비스듬한 줄무늬
    phase = (t * 210 - au * 38 + rng.random() * 6)
    barb = .5 + .5 * np.sin(phase * 2 * np.pi / 6.0)
    alpha = smooth((edge - au) / .03) * (au < .99)
    # 가장자리로 갈수록 가닥이 갈라져 반투명
    alpha *= 1 - .45 * smooth((au / np.maximum(edge, 1e-3) - .7) / .3) * (1 - barb)
    if split:  # 끝 갈래(맨 아래 단용)
        alpha *= 1 - (smooth((t - .82) / .1) * (np.abs(np.sin(u * np.pi * 2.5)) < .25))
    # 색: 상아 → 진홍, 밑동은 조금 어둡게, 결 명암
    red = smooth((t - red0 + .04 * np.sin(u * 5 + seed)) / .2)
    col = IV[None, None] * (1 - red[..., None]) + CR[None, None] * red[..., None]
    col = col * (1 - .25 * smooth((red - .85) / .15))[..., None] + DK[None, None] * (.25 * smooth((red - .85) / .15))[..., None]
    shade = .86 + .14 * barb - .12 * smooth((.12 - t) / .12)
    col = col * shade[..., None]
    # 깃대
    shaft = smooth((.025 * (1 - .8 * t) - au) / .012)
    scol = np.array([.82, .78, .74]) * (1 - red[..., None] * .5) + CR * red[..., None] * .4
    col = col * (1 - shaft[..., None]) + scol * shaft[..., None]
    alpha = np.maximum(alpha, shaft * (t < .985))
    # 밑동 솜털
    down = smooth((.1 - t) / .1) * (rng.random((H, W)) > .55) * smooth((prof * 1.3 - au) / .05)
    alpha = np.maximum(alpha, down * .6)
    img = np.dstack([np.clip(col, 0, 1), np.clip(alpha, 0, 1)])
    return Image.fromarray((img * 255).astype(np.uint8), 'RGBA')

def hair(seed, W=256, H=512, n=14):
    rng = np.random.default_rng(seed)
    img = np.zeros((H, W, 4))
    y = np.arange(H) / (H - 1)
    for k in range(n):
        x0 = W * (.2 + .6 * rng.random()); drift = (rng.random() - .5) * W * .25; L = .7 + .3 * rng.random(); w0 = 3 + 5 * rng.random()
        for j, t in enumerate(y):
            if t > L: break
            cx = x0 + drift * t * t; w = w0 * (1 - t / L) ** .7 + .4
            xs = np.arange(W); a = smooth((w - np.abs(xs - cx)) / 1.5)
            lum = .86 + .14 * math.sin(k * 3.1 + t * 9)
            col = np.array([232, 228, 224]) / 255 * lum
            img[j, :, :3] = img[j, :, :3] * (1 - a[:, None]) + col * a[:, None]
            img[j, :, 3] = np.maximum(img[j, :, 3], a)
    return Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), 'RGBA')

for i, (nm, kw) in enumerate([('a', {}), ('b', {'width': .36, 'red0': .7, 'notches': 6}), ('c', {'width': .46, 'red0': .78, 'notches': 8}),
                               ('d', {'width': .4, 'red0': .72, 'split': 1.})]):
    feather(1048 + i, **kw).save(os.path.join(OUT, f'feather_{nm}.png'))
for i, nm in enumerate('ab'):
    hair(2048 + i).save(os.path.join(OUT, f'hair_{nm}.png'))
print('textures', OUT)
