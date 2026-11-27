#!/usr/bin/env python3
"""R1345 — 탐식 보스 '위장의 꿈틀거림' 임시 프레임 시트 2종(오프라인 래스터 렌더, 게임 안 코드 도형 아님).

* gut-fold12: 바닥에서 위장 주름(위 점막 주름) 덩어리가 솟아 → 쥐어짜듯 수축(점액 방울) → 가라앉는 12칸. 256x256, 아래 가운데 피벗(128,236).
* gut-wall12: 보스방 가장자리에 서는 위벽 조각이 연동(꿈틀)하는 고리 12칸. 256x192, 피벗(128,184).

높이장(heightfield)을 3/4 시점으로 세워 앞쪽부터 덮어 그리고, 법선 조명·점막 광택·먹선 테두리를 더한다.
표면 무늬는 저장소의 assets/r186/flesh-void.webp(R186 자체 생성 내장 주름 타일)를 빌려 쓴다(원본은 건드리지 않음).
Dots 전용 시트가 오면 같은 이름으로 교체한다(index.json final:false). 15세: 피·장기 노출 없이 검붉은 점막 주름만.
"""
from pathlib import Path
import hashlib, json, math
import numpy as np
from PIL import Image, ImageFilter

A = Path(__file__).resolve().parents[1] / 'r96/runtime-text/assets'
OUT = A / 'r1345'; OUT.mkdir(exist_ok=True)
TEX = np.asarray(Image.open(A / 'r186/flesh-void.webp').convert('RGB'), dtype=np.float32) / 255.0
RNG = np.random.default_rng(1345)

def noise2(x, y, seed, oct=3):
    """값 잡음(부드러운) — 좌표 배열 → [-1,1]."""
    out = np.zeros_like(x); amp = 1.0; tot = 0
    for o in range(oct):
        f = 2 ** o
        r = np.random.default_rng(int(seed) + o).random((66, 66)).astype(np.float32)
        X = (x * f) % 64; Y = (y * f) % 64
        x0 = np.floor(X).astype(int); y0 = np.floor(Y).astype(int); fx = X - x0; fy = Y - y0
        fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
        v = (r[y0, x0] * (1 - fx) + r[y0, x0 + 1] * fx) * (1 - fy) + (r[y0 + 1, x0] * (1 - fx) + r[y0 + 1, x0 + 1] * fx) * fy
        out += (v * 2 - 1) * amp; tot += amp; amp *= .5
    return out / tot

def tex(u, v):
    h, w, _ = TEX.shape
    return TEX[(v * h).astype(int) % h, (u * w).astype(int) % w]

def render(cw, ch, pivot, a, b, heightfn, ridgefn, glossy=1.0, seed=0, drops=None):
    """바닥 타원(a,b) 위 높이장을 세워 그림. heightfn(nx,ny)->높이(px), ridgefn(gx,gy)->주름 높이(px)."""
    S = 3  # 세로 촘촘히
    gx = np.linspace(-a, a, int(2 * a * 1.6)).astype(np.float32)
    gy = np.linspace(-b, b, int(2 * b * S * 2)).astype(np.float32)
    GX, GY = np.meshgrid(gx, gy)
    nx = GX / a; ny = GY / b
    edge = noise2(GX * .06 + seed, GY * .12, 77) * .12
    rr = np.sqrt(nx ** 2 + ny ** 2)
    inside = rr < 1 + edge
    H = heightfn(nx, ny, rr) + ridgefn(GX, GY) * np.clip(1 - rr, 0, 1) ** .4
    H = np.where(inside, np.maximum(H, 0), 0)
    # 법선
    dHx = np.gradient(H, axis=1) / (gx[1] - gx[0]); dHy = np.gradient(H, axis=0) / (gy[1] - gy[0])
    n = np.stack([-dHx, -dHy * .8, np.ones_like(H)], -1); n /= np.linalg.norm(n, axis=-1, keepdims=True)
    L = np.array([-.45, -.55, .7], np.float32); L /= np.linalg.norm(L)
    dif = np.clip((n * L).sum(-1), 0, 1)
    Hh = np.array([-.2, -.3, 1.0], np.float32); Hh = (L + Hh / np.linalg.norm(Hh)); Hh /= np.linalg.norm(Hh)
    spec = np.clip((n * Hh).sum(-1), 0, 1) ** 28 * glossy
    t = tex(GX / 180 + .3 + seed * .1, (GY - H * .6) / 180 + .7)
    hn = np.clip(H / (H.max() + 1e-6), 0, 1)
    deep = np.array([.30, .06, .09]); flesh = np.array([.70, .25, .28]); pink = np.array([.95, .62, .58])
    base = deep + (flesh - deep) * dif[..., None] + (pink - flesh) * (dif[..., None] ** 3) * hn[..., None]
    base = base * (.72 + .55 * t[..., :1]) + t * .10
    groove = np.clip(-ridgefn(GX, GY) / 6, 0, 1)[..., None]
    base = base * (1 - .45 * groove)
    col = np.clip(base + spec[..., None] * np.array([1.0, .86, .86]), 0, 1)
    # 먹선: 바깥 테두리·가파른 곳
    slope = np.clip(np.hypot(dHx, dHy) / 5, 0, 1)
    rim = np.clip((rr - (.86 + edge)) / .14, 0, 1)
    ink = np.clip(rim * .8 + slope * .35, 0, .85)[..., None]
    col = col * (1 - ink) + np.array([.05, .01, .02]) * ink
    # 세워 그리기: 뒤(작은 gy)부터 앞으로 덮어쓰기
    img = np.zeros((ch, cw, 4), np.float32)
    px, py = pivot
    SX = np.round(px + GX).astype(int); SY = np.round(py + GY * 1.0 - H).astype(int)
    m = inside & (SX >= 0) & (SX < cw) & (SY >= 0) & (SY < ch)
    GYs = np.round(py + GY).astype(int)
    for row in range(GX.shape[0]):
        mm = m[row]
        if not mm.any(): continue
        xs = SX[row, mm]; ys = SY[row, mm]; c = col[row, mm]
        # 표면점에서 그 자리 바닥까지 세로로 채움(앞면). 아래로 갈수록 그늘
        L = np.clip(GYs[row, mm] - ys, 0, ch) + 2
        rep = np.repeat(np.arange(len(xs)), L)
        k = np.arange(rep.size) - np.repeat(np.cumsum(L) - L, L)
        yy = np.clip(ys[rep] + k, 0, ch - 1)
        shade = (1 - np.clip(k / 120.0, 0, .38))[:, None]
        img[yy, xs[rep], :3] = c[rep] * shade
        img[yy, xs[rep], 3] = 1
    if drops:
        for (dx, dy, r, al) in drops:
            yy, xx = np.mgrid[0:ch, 0:cw]
            d = np.hypot(xx - (px + dx), (yy - (py + dy)) * 1.15)
            msk = np.clip((r - d) / 1.2, 0, 1) * al
            sh = np.clip(1 - np.hypot(xx - (px + dx - r * .35), yy - (py + dy - r * .4)) / (r * .9 + 1e-6), 0, 1)
            dc = np.stack([.42 + .5 * sh, .12 + .45 * sh, .14 + .42 * sh], -1)
            img[..., :3] = img[..., :3] * (1 - msk[..., None]) + dc * msk[..., None]
            img[..., 3] = np.maximum(img[..., 3], msk)
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), 'RGBA')
    # 수묵 번짐 살짝(알파 테두리 부드럽게) — 오프스크린 처리라 게임 ctx.filter 와 무관
    a_ = im.getchannel('A').filter(ImageFilter.GaussianBlur(.7)); im.putalpha(a_)
    return im

def ease(u): return u * u * (3 - 2 * u)

def fold_frame(i):
    # 0-4 솟음, 5-8 쥐어짬(수축·점액), 9-11 가라앉음
    if i <= 4: k = max(.22, ease((i + 1) / 5)) * (1.08 if i == 4 else 1); squeeze = 0
    elif i <= 8: k = 1.0 + .15 * math.sin((i - 4) / 4 * math.pi); squeeze = math.sin((i - 4) / 4 * math.pi)
    else: k = max(0.18, 1 - (i - 8) / 3.4); squeeze = 0
    ph = i * .62
    def hf(nx, ny, rr):
        w = 1 - .16 * squeeze
        prof = np.clip(1 - (nx / w) ** 2 - ny ** 2, 0, 1) ** .6
        return 104 * k * prof * (1 + .2 * squeeze)
    def rf(gx, gy):
        warp = noise2(gx * .03 + 3, gy * .05, 11, 2) * 2.2
        lines = np.sin(gx * (.16 + .05 * squeeze) + warp + ph) + .5 * np.sin(gy * .22 - warp * .7 - ph * .5)
        return 5 * k * lines
    drops = None
    if 5 <= i <= 9:
        u = (i - 5) / 4
        drops = [(-40 + 18 * j + 8 * math.sin(j * 2.1), -120 * k - 30 * u * (1 + j % 3) + 60 * u * u * 3, 4 + (j % 3), max(0, 1 - u * .8)) for j in range(5)]
    sc = .5 + .5 * min(1.0, k)
    return render(256, 256, (128, 236), (98 - 14 * squeeze) * sc, 34 * sc, hf, rf, glossy=1.0 + .6 * squeeze, seed=i * .13, drops=drops)

def wall_frame(i):
    ph = i / 12 * 2 * math.pi
    def hf(nx, ny, rr):
        wave = .78 + .22 * np.sin(nx * 3.2 - ph) + .06 * np.sin(nx * 7 + ph * 2)
        prof = np.clip(1 - ny ** 2, 0, 1) ** .55 * np.clip(1 - np.abs(nx) ** 4, 0, 1)
        return 128 * wave * prof
    def rf(gx, gy):
        warp = noise2(gx * .025 + 7, gy * .04, 23, 2) * 2.4
        return 5 * np.sin(gy * .05 + gx * .09 + warp - ph) + 3 * np.sin(gx * .21 + ph)
    return render(256, 192, (128, 168), 124, 22, hf, rf, glossy=1.1, seed=1.7)

def save(name, frames, cw, ch, pivot, process, **kw):
    s = Image.new('RGBA', (cw * len(frames), ch))
    for i, f in enumerate(frames): s.alpha_composite(f, (i * cw, 0))
    p = OUT / f'{name}.webp'; s.save(p, 'WEBP', quality=86, method=6)
    b = p.read_bytes()
    return name, {'frames': len(frames), 'cell': [cw, ch], 'cols': len(frames), 'pivot': pivot, 'final': False,
                  'source': 'scripts/r1345-gut-sheets.py (offline heightfield raster) + assets/r186/flesh-void.webp surface',
                  'process': process, 'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b), 'dots': 'pending (Dots 전용 시트 오면 교체)', **kw}

if __name__ == '__main__':
    old = json.loads((OUT / 'index.json').read_text()) if (OUT / 'index.json').exists() else {}
    idx = {**old, **dict([
        save('gut-fold12', [fold_frame(i) for i in range(12)], 256, 256, [128, 236],
             'rise 0-4 / squeeze+mucus 5-8 (hit at 6) / sink 9-11', hit=6),
        save('gut-wall12', [wall_frame(i) for i in range(12)], 256, 192, [128, 184],
             'peristaltic writhe loop 12', loop=True),
    ])}  # 다른 항목(Dots 시트 등)은 그대로 둔다
    (OUT / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, indent=1) + '\n')
    print(json.dumps(idx, ensure_ascii=False))
