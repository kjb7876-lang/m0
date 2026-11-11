#!/usr/bin/env python3
"""R667 타이틀 화면 배경 루프 영상 만들기 (재현용).

원천: 사용자 오프닝 영상 r96/runtime-text/assets/r309/intro/opening-hapil.mp4 의 18.50초(444번째 프레임) 한 장면
(악마화된 나무와 무너진 회랑, 번개 없는 순간). 생성 도구 표시(오른쪽 아래 별)는 delogo 로 지운다.
그 정지 화면 위에 시간이 정확히 10초마다 처음으로 돌아오는 움직임만 얹어 이음매 없는 루프를 만든다.
  · 카메라: 아주 느린 숨쉬기 확대(1.050~1.075배)와 좌우·상하 흔들림(주기 10초).
  · 붉은 핏줄·불씨 빛: 밝은 붉은 부분만 골라 두 번 맥동(주기 5초) + 불꽃 깜빡임(주기 10/7… 정수배).
  · 불티: 70개, 각자 주기 10/k 초로 위로 떠오르며 흔들림(한 주기마다 제자리).
  · 안개: 주기 경계에서 이어지는 FFT 잡음을 10초에 한 폭만큼 흘림.
  · 하늘의 먼 붉은 번쩍임: 10초에 한 번, 아주 약하게(광과민 기준 초당 3회보다 훨씬 적음).
  · 가장자리 비네트: 가운데 메뉴 글자가 잘 읽히게.
출력: 960×540 24fps 240프레임 H.264(yuv420p, faststart, 소리 없음) + 첫 프레임 포스터 JPEG.
쓰기: python3 scripts/build-title-loop-r667.py OUT_DIR
"""
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'r96/runtime-text/assets/r309/intro/opening-hapil.mp4')
FRAME, DELOGO = 444, 'delogo=x=1130:y=570:w=60:h=60'  # 444번째 프레임 = 18.50초
W, H, FPS, SECONDS = 960, 540, 24, 10
N = FPS * SECONDS
# 한 GOP 끝의 화질 흐림이 루프 이음매에서 튀지 않게 키프레임을 2초마다, I/P 화질 차이를 줄인다.
ENC = os.environ.get('R667_ENC', 'libx264 -preset veryslow -crf 26 -tune film -g 48 -keyint_min 48 -sc_threshold 0 -x264-params ipratio=1.1:pbratio=1.1').split()
ENC = ['-c:v'] + ENC
TAU = 2 * math.pi
rng = np.random.default_rng(667)


def base_frame(tmp):
    p = os.path.join(tmp, 'r667-base.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', SRC, '-vf', f'select=eq(n\\,{FRAME}),{DELOGO}', '-vsync', '0', '-frames:v', '1', p], check=True)
    return np.asarray(Image.open(p).convert('RGB'), dtype=np.float32) / 255.0


def periodic_noise(h, w, scale):
    """가로·세로 모두 이어지는(주기 경계) 부드러운 잡음 0..1."""
    f = np.fft.fft2(rng.standard_normal((h, w)))
    ky = np.fft.fftfreq(h)[:, None]
    kx = np.fft.fftfreq(w)[None, :]
    k = np.sqrt(kx * kx + ky * ky)
    f *= np.exp(-(k * scale) ** 2)
    n = np.real(np.fft.ifft2(f))
    n -= n.min()
    return n / max(n.max(), 1e-6)


def sample(img, s, dx, dy):
    """img(1280×720) 를 s 배 확대·(dx,dy) 이동해 W×H 로 뽑는다(쌍선형)."""
    ih, iw = img.shape[:2]
    cover = max(W / iw, H / ih) * s
    ys = (np.arange(H) - H / 2) / cover + ih / 2 + dy
    xs = (np.arange(W) - W / 2) / cover + iw / 2 + dx
    ys = np.clip(ys, 0, ih - 1.001)
    xs = np.clip(xs, 0, iw - 1.001)
    y0 = ys.astype(int)
    x0 = xs.astype(int)
    fy = (ys - y0)[:, None, None]
    fx = (xs - x0)[None, :, None]
    a = img[y0][:, x0]
    b = img[y0][:, x0 + 1]
    c = img[y0 + 1][:, x0]
    d = img[y0 + 1][:, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def frame_at(img, glow_mask, fire_mask, fog, embers, vignette, t):
    ph = TAU * t / SECONDS
    s = 1.0625 + 0.0125 * math.sin(ph)
    dx = 9.0 * math.sin(ph + 0.6)
    dy = 4.0 * math.sin(2 * ph + 1.1)
    lay = np.concatenate([img, glow_mask[..., None], fire_mask[..., None]], axis=2)
    out = sample(lay, s, dx, dy)
    rgb, g, fmask = out[..., :3], out[..., 3:4], out[..., 4:5]
    pulse = 0.5 + 0.5 * math.sin(2 * ph - 1.2)
    flick = 0.55 + 0.25 * math.sin(7 * ph) + 0.2 * math.sin(11 * ph + 0.7)
    rgb = rgb + g * np.array([0.30, 0.05, 0.04]) * (0.35 + 0.65 * pulse)
    rgb = rgb + fmask * np.array([0.32, 0.14, 0.03]) * flick
    # 먼 하늘 번쩍임: t=6.2초 근처 0.5초, 위쪽만, 아주 약하게.
    fl = math.exp(-((((t - 6.2 + SECONDS / 2) % SECONDS) - SECONDS / 2) / 0.16) ** 2)
    if fl > 1e-3:
        sky = np.clip(1.0 - np.arange(H) / (H * 0.55), 0, 1)[:, None, None]
        rgb = rgb + sky * fl * np.array([0.10, 0.025, 0.03])
    # 안개: 10초에 한 폭(가로 주기)만큼 흘림 → 이음매 없음.
    fh, fw = fog.shape
    off = int(round(fw * t / SECONDS)) % fw
    f = np.roll(fog, -off, axis=1)[:H, :W]
    f2 = np.roll(fog[::-1], off, axis=1)[:H, :W]  # 뒤집은 안개를 반대로 한 폭/주기
    low = np.clip((np.arange(H) / H - 0.45) / 0.55, 0, 1)[:, None]
    fogA = (0.05 + 0.15 * low) * (0.6 * f + 0.4 * f2)
    rgb = rgb * (1 - fogA[..., None]) + np.array([0.20, 0.17, 0.18]) * fogA[..., None]
    # 불티
    for (x0, y0, k, amp, wph, size, br) in embers:
        p = (t * k / SECONDS) % 1.0
        x = (x0 + amp * math.sin(TAU * p * 2 + wph)) % W
        y = y0 - p * (H + 80) + 40
        y = y % (H + 80) - 40
        a = br * math.sin(math.pi * p) ** 0.6
        r = size
        x1, x2 = int(max(0, x - 3 * r)), int(min(W, x + 3 * r + 1))
        y1, y2 = int(max(0, y - 3 * r)), int(min(H, y + 3 * r + 1))
        if x1 >= x2 or y1 >= y2:
            continue
        yy, xx = np.mgrid[y1:y2, x1:x2]
        d = np.exp(-(((xx - x) ** 2 + (yy - y) ** 2) / (r * r)))[..., None]
        rgb[y1:y2, x1:x2] += d * a * np.array([1.0, 0.42, 0.12])
    rgb = rgb * vignette[..., None]
    return np.clip(rgb, 0, 1)


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    os.makedirs(out, exist_ok=True)
    tmp = os.path.join(out, '.r667tmp')
    os.makedirs(tmp, exist_ok=True)
    img = base_frame(tmp)
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    red = np.clip((r - np.maximum(g, b) - 0.12) * 3.0, 0, 1) * np.clip(r * 1.4, 0, 1)
    fire = np.clip((r + g * 0.6 - b * 1.2 - 0.85) * 3.0, 0, 1) * (np.arange(img.shape[0])[:, None] > img.shape[0] * 0.55)
    fog = periodic_noise(H, W, 18.0)
    yy, xx = np.mgrid[0:H, 0:W]
    v = ((xx - W / 2) / (W / 2)) ** 2 * 0.55 + ((yy - H * 0.48) / (H / 2)) ** 2 * 0.75
    vignette = np.clip(1.0 - 0.5 * v, 0.32, 1.0) * 0.95
    embers = []
    for _ in range(70):
        embers.append((rng.uniform(0, W), rng.uniform(0, H + 80), int(rng.integers(1, 4)), rng.uniform(4, 18),
                       rng.uniform(0, TAU), rng.uniform(0.9, 2.2), rng.uniform(0.35, 0.9)))
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                            '-i', '-', '-an', *ENC,
                            '-pix_fmt', 'yuv420p', '-profile:v', 'main', '-movflags', '+faststart',
                            os.path.join(out, 'loop.mp4')], stdin=subprocess.PIPE)
    first = None
    for i in range(N):
        fr = (frame_at(img, red, fire, fog, embers, vignette, i / FPS) * 255 + 0.5).astype(np.uint8)
        if first is None:
            first = fr
        enc.stdin.write(fr.tobytes())
    enc.stdin.close()
    if enc.wait():
        sys.exit('ffmpeg failed')
    Image.fromarray(first).save(os.path.join(out, 'poster.jpg'), quality=80, optimize=True, progressive=True)
    # 루프 확인용: t=10초(=다음 루프 0초) 프레임과 0초 프레임의 차이
    wrap = (frame_at(img, red, fire, fog, embers, vignette, SECONDS) * 255 + 0.5).astype(np.uint8)
    print('wrap max diff', int(np.abs(wrap.astype(int) - first.astype(int)).max()))


if __name__ == '__main__':
    main()
