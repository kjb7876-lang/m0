#!/usr/bin/env python3
"""R930 카이로노미콘 사이버펑크×마법공학 임시 타일(코드로 그린 것, Dots CX-0081KC 결과가 오면 교체).
결정적 생성: 같은 시드면 같은 그림. 출력 r96/client-source/../runtime-text/assets/r930/tiles/<look>.webp (2048x1024, 왼쪽 바닥·오른쪽 벽, 각 반쪽 무봉합 반복).
빛은 왼쪽 위(CX-0056): 판 윗변·왼변 밝게, 아랫변·오른변 어둡게. 발광은 가늘고 약하게."""
import sys, os, hashlib, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'r96', 'runtime-text', 'assets', 'r930', 'tiles')
N = 1024

def wrapnoise(rng, scale, n=N):
    """무봉합 값 노이즈: 작은 격자를 tile 후 확대, 가장자리 순환."""
    g = rng.random((n // scale, n // scale)).astype(np.float32)
    im = Image.fromarray((g * 255).astype(np.uint8)).resize((n, n), Image.BICUBIC)
    # 순환 블러로 이음매 제거
    big = Image.new('L', (n * 3, n * 3))
    for i in range(3):
        for j in range(3):
            big.paste(im, (i * n, j * n))
    big = big.filter(ImageFilter.GaussianBlur(scale / 2))
    return np.asarray(big.crop((n, n, 2 * n, 2 * n)), dtype=np.float32) / 255.0

def fbm(rng):
    return (wrapnoise(rng, 128) * .45 + wrapnoise(rng, 32) * .3 + wrapnoise(rng, 8) * .17 + wrapnoise(rng, 2) * .08)

def wrapdraw(size, fn, mode='RGBA'):
    """fn(draw, dx, dy) 를 9번 그려 순환 이음매 없이."""
    im = Image.new(mode, (size, size), (0, 0, 0, 0) if mode == 'RGBA' else 0)
    d = ImageDraw.Draw(im)
    for dx in (-size, 0, size):
        for dy in (-size, 0, size):
            fn(d, dx, dy)
    return im

def wrapblur(im, r):
    n = im.size[0]
    big = Image.new(im.mode, (n * 3, n * 3))
    for i in range(3):
        for j in range(3):
            big.paste(im, (i * n, j * n))
    return big.filter(ImageFilter.GaussianBlur(r)).crop((n, n, 2 * n, 2 * n))

def tint(arr, rgb):
    return np.stack([arr * c for c in rgb], -1)

def base_metal(rng, rgb, contrast=.35):
    f = fbm(rng)
    a = tint(1 - contrast / 2 + (f - .5) * contrast * 2, rgb)
    # 가는 긁힘
    s = wrapnoise(rng, 1)
    a *= (0.96 + 0.06 * (s > .62))[..., None]
    return a

def plates(rng, arr, cell, gap, light=1.0):
    """판재: 이음 홈 + 왼쪽 위 빛 베벨."""
    n = arr.shape[0]
    y, x = np.mgrid[0:n, 0:n]
    lx, ly = x % cell, y % cell
    m = np.ones((n, n), np.float32)
    bevel = 7
    m += .16 * light * ((lx < bevel) | (ly < bevel)) * ((lx >= gap) & (ly >= gap))
    m -= .22 * light * ((lx > cell - bevel - 1) | (ly > cell - bevel - 1))
    groove = (lx < gap) | (ly < gap)
    m[groove] = .28
    return arr * m[..., None], groove

def rivets(d, dx, dy, cell, brass, step=32, r=4, inset=14, n=N):
    for gx in range(0, n, cell):
        for gy in range(0, n, cell):
            for t in range(inset, cell - inset + 1, step):
                for (px, py) in ((gx + t, gy + inset), (gx + inset, gy + t), (gx + t, gy + cell - inset), (gx + cell - inset, gy + t)):
                    X, Y = px + dx, py + dy
                    d.ellipse((X - r, Y - r, X + r, Y + r), fill=brass + (255,))
                    d.ellipse((X - r + 1, Y - r + 1, X, Y), fill=tuple(min(255, c + 60) for c in brass) + (255,))

def traces(rng, cell, n=N, count=26):
    """판 틈에서 시작해 직각으로 꺾이는 회로 선분 목록."""
    segs, nodes = [], []
    for _ in range(count):
        gx = int(rng.integers(0, n // cell)) * cell
        gy = int(rng.integers(0, n // cell)) * cell
        x, y = gx + int(rng.integers(24, cell - 24)), gy + 12
        pts = [(x, y)]
        for k in range(int(rng.integers(2, 5))):
            if k % 2 == 0:
                y += int(rng.integers(30, 110))
            else:
                x += int(rng.choice([-1, 1]) * rng.integers(30, 90))
            pts.append((x, y))
        segs.append(pts)
        nodes.append(pts[-1])
    return segs, nodes

def glow_layer(segs, nodes, col, width=6, n=N):
    def fn(d, dx, dy):
        for pts in segs:
            d.line([(px + dx, py + dy) for px, py in pts], fill=col + (255,), width=width)
        for (px, py) in nodes:
            d.rectangle((px + dx - 8, py + dy - 8, px + dx + 8, py + dy + 8), fill=col + (255,))
    core = wrapdraw(n, fn)
    return core

def glyphs(rng, cell, col, n=N, count=10):
    """판 가운데 작은 직사각 룬 각인(글자 아님, 짧은 획)."""
    def fn(d, dx, dy):
        r2 = np.random.default_rng(int(rng.integers(1 << 30)))
        for _ in range(count):
            gx = int(r2.integers(0, n // cell)) * cell + cell // 2
            gy = int(r2.integers(0, n // cell)) * cell + cell // 2
            w = 80
            d.rectangle((gx - w // 2 + dx, gy - 12 + dy, gx + w // 2 + dx, gy + 12 + dy), outline=col + (200,), width=2)
            x = gx - w // 2 + 8
            while x < gx + w // 2 - 8:
                h = int(r2.integers(4, 9))
                d.line((x + dx, gy - h + dy, x + dx, gy + h + dy), fill=col + (200,), width=2)
                if r2.random() < .5:
                    d.line((x + dx, gy - h + dy, x + 5 + dx, gy - h + dy), fill=col + (200,), width=2)
                x += 9
    return wrapdraw(n, fn)

def compose(arr, layers):
    im = Image.fromarray(np.clip(arr * 255, 0, 255).astype(np.uint8), 'RGB').convert('RGBA')
    for lay, mode, alpha in layers:
        if mode == 'over':
            a = lay.split()[3].point(lambda v: int(v * alpha))
            lay = lay.copy(); lay.putalpha(a)
            im = Image.alpha_composite(im, lay)
        elif mode == 'add':
            rgb = Image.new('RGB', lay.size)
            rgb.paste(lay.convert('RGB'), mask=lay.split()[3])
            rgb = rgb.point(lambda v: int(v * alpha))
            im = Image.merge('RGBA', (*ImageChops.add(im.convert('RGB'), rgb).split(), im.split()[3]))
    return im.convert('RGB')

def floor(seed, metal, brass, neon, accent):
    rng = np.random.default_rng(seed)
    arr = base_metal(rng, metal)
    # 판마다 명암·녹 얼룩을 다르게(반복 티 줄이기)
    y0, x0 = np.mgrid[0:N, 0:N]
    pv = rng.random((N // 256, N // 256)).astype(np.float32)
    arr *= (0.82 + 0.3 * pv[y0 // 256, x0 // 256])[..., None]
    rust = np.clip((wrapnoise(rng, 64) - .62) * 4, 0, 1) * wrapnoise(rng, 16)
    arr = arr * (1 - .45 * rust[..., None]) + tint(rust * .45, (.42, .26, .14))
    arr, groove = plates(rng, arr, 256, 6)
    # 홈 주변 때(AO)
    g = Image.fromarray((groove * 255).astype(np.uint8))
    ao = np.asarray(wrapblur(g, 10), np.float32) / 255
    arr *= (1 - .35 * ao)[..., None]
    # 큰 판 안쪽 작은 판(128) 교차 무늬: 반만
    y, x = np.mgrid[0:N, 0:N]
    inner = ((x // 128 + y // 128) % 2 == 0) & ((x % 128 < 3) | (y % 128 < 3)) & ~groove
    arr[inner] *= .72
    rv = wrapdraw(N, lambda d, dx, dy: rivets(d, dx, dy, 256, brass, step=60, r=5))
    segs, nodes = traces(rng, 256)
    core = glow_layer(segs, nodes, neon)
    halo = wrapblur(core, 14)
    acc_s, acc_n = traces(rng, 256, count=4)
    acc = glow_layer(acc_s, acc_n, accent)
    gl = glyphs(rng, 256, brass)
    # 금속 홈(회로 바닥) 먼저 어둡게, 그 위 발광
    dark = wrapdraw(N, lambda d, dx, dy: [d.line([(px + dx, py + dy) for px, py in p], fill=(10, 12, 16, 255), width=14) for p in segs])
    return compose(arr, [(gl, 'over', .55), (rv, 'over', .9), (dark, 'over', .8), (halo, 'add', .9), (core, 'add', .85), (wrapblur(acc, 6), 'add', .4), (acc, 'add', .55)])

def wall(seed, metal, brass, neon):
    rng = np.random.default_rng(seed)
    arr = base_metal(rng, metal, .3)
    y, x = np.mgrid[0:N, 0:N]
    # 세로 판넬 256, 가로 띠 (위 1/3 황동 띠)
    lx = x % 256
    m = np.ones((N, N), np.float32)
    m += .14 * (lx < 8)
    m -= .2 * (lx > 246)
    m[(lx >= 124) & (lx <= 132)] = .25  # 판 사이 홈(네온 자리)
    band = (y % 512 >= 300) & (y % 512 < 340)
    m[band] = 1.0
    arr *= m[..., None]
    b = np.array(brass, np.float32) / 255
    arr[band] = b * .62 * (0.55 + 0.45 * fbm(np.random.default_rng(seed + 1))[band])[..., None]
    arr[(y % 512 == 300) | (y % 512 == 301)] *= 1.35
    arr[(y % 512 == 338) | (y % 512 == 339)] *= .45
    def fn(d, dx, dy):
        for gx in range(0, N, 256):
            X = gx + 128 + dx
            for gy in range(0, N, 512):
                d.line((X, gy + dy + 20, X, gy + dy + 280), fill=neon + (255,), width=8)
                d.line((X, gy + dy + 360, X, gy + dy + 500), fill=neon + (255,), width=8)
    core = wrapdraw(N, fn)
    def rv(d, dx, dy):
        for gx in range(0, N, 256):
            for gy in range(0, N, 512):
                for t in (316, 324):
                    pass
                for px in range(gx + 20, gx + 256, 40):
                    X, Y = px + dx, gy + 320 + dy
                    d.ellipse((X - 4, Y - 4, X + 4, Y + 4), fill=tuple(max(0, c - 70) for c in brass) + (255,))
    rvl = wrapdraw(N, rv)
    gl = glyphs(np.random.default_rng(seed + 2), 256, brass, count=6)
    return compose(arr, [(gl, 'over', .35), (rvl, 'over', .9), (wrapblur(core, 16), 'add', 1.0), (core, 'add', .75)])

LOOKS = {
    # 명령 갑판: 흑철 + 황동 + 시안 회로(자홍 포인트 조금)
    'kc-deck': dict(seed=930, metal=(.20, .22, .26), brass=(150, 118, 62), neon=(70, 190, 210), accent=(170, 60, 150)),
    # 검은 공방: 주철 + 그을음 + 호박·자홍 회로
    'kc-forge': dict(seed=931, metal=(.21, .19, .18), brass=(140, 100, 52), neon=(215, 120, 50), accent=(175, 55, 120)),
}

def main():
    os.makedirs(OUT, exist_ok=True)
    meta = {}
    for name, p in LOOKS.items():
        f = floor(p['seed'], p['metal'], p['brass'], p['neon'], p['accent'])
        w = wall(p['seed'] + 10, p['metal'], p['brass'], p['neon'])
        im = Image.new('RGB', (2 * N, N)); im.paste(f, (0, 0)); im.paste(w, (N, 0))
        path = os.path.join(OUT, name + '.webp')
        im.save(path, 'WEBP', quality=86, method=6)
        data = open(path, 'rb').read()
        meta[name] = {'file': name + '.webp', 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'size': [2 * N, N], 'made': 'code (scripts/r930-kairo-tiles.py), temporary until Dots CX-0081KC'}
    with open(os.path.join(OUT, 'index.json'), 'w') as fh:
        json.dump({'schema': 'storyworld.r930.tiles/v1', 'temporary': True, 'dots': 'CX-0081KC', 'looks': meta}, fh, ensure_ascii=False, indent=1)
    print(json.dumps(meta, indent=1))

if __name__ == '__main__':
    main()
