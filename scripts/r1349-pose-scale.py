#!/usr/bin/env python3
"""R1349 자세 그림끼리 '같은 인물 배율' 추정 — 칸마다 따로 꽉 채워 그린(R104 p1~p4 처럼 자세마다 캔버스에 맞춘) 그림의 진짜 배율 차를 잰다.
기준 칸의 머리·어깨 조각(몸 위 32%, 가운데 70%)을 배율 s 로 줄이고 늘려 대상 칸 안에서 가장 닮은 자리(정규화 상관)를 찾는다.
몸통 넓이(mass)로 맞추면 웅크린 자세가 작아지는 문제(R1337b 집도의)를 피한다 — 머리 크기는 자세가 바뀌어도 거의 같다.
쓰는 법(모듈): est(ref_img, tgt_img) -> (s, score)   s = 대상 그림을 s 배 하면 기준과 같은 인물 배율
"""
import numpy as np
from PIL import Image

def _prep(im, H):
    im = im.convert('RGBA'); k = H / im.height
    im = im.resize((max(1, round(im.width * k)), H), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    g = (a[..., 0] * .3 + a[..., 1] * .59 + a[..., 2] * .11) * a[..., 3]
    return np.stack([g, a[..., 3]], -1), k

def _bbox(al, t=.16):
    ys, xs = np.where(al > t)
    return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1) if len(xs) else None

def _ncc(T, P):
    # T: 대상(h,w,c) P: 조각(ph,pw,c) — 모든 위치 상관(FFT), 정규화
    h, w, _ = T.shape; ph, pw, _ = P.shape
    if ph > h or pw > w: return -1, None
    best = None
    num = np.zeros((h - ph + 1, w - pw + 1)); den_t = np.zeros_like(num); pe = 0
    for c in range(T.shape[2]):
        t = T[..., c]; p = P[..., c] - P[..., c].mean(); pe += (p ** 2).sum()
        F = np.fft.rfft2(t, (h, w)); G = np.fft.rfft2(p[::-1, ::-1], (h, w))
        cc = np.fft.irfft2(F * G, (h, w))[ph - 1:h, pw - 1:w]
        S = np.pad(t, ((1, 0), (1, 0))).cumsum(0).cumsum(1); S2 = np.pad(t * t, ((1, 0), (1, 0))).cumsum(0).cumsum(1)
        box = lambda I: I[ph:, pw:] - I[:-ph, pw:] - I[ph:, :-pw] + I[:-ph, :-pw]
        s1 = box(S); s2 = box(S2); n = ph * pw
        num += cc; den_t += np.maximum(s2 - s1 * s1 / n, 0)
    r = num / np.sqrt(np.maximum(den_t, .5 * pe) * pe + 1e-6)  # 빈 자리(분산 작음)가 큰 값 내는 것 막기
    i = np.unravel_index(np.argmax(r), r.shape)
    return float(r[i]), i

def est(ref, tgt, H=200, lo=.6, hi=1.6, steps=41, top=.32):
    R, kr = _prep(ref, H); bb = _bbox(R[..., 1])
    if bb is None: return 1.0, 0
    x0, y0, x1, y1 = bb; bh = y1 - y0; bw = x1 - x0
    cx = (x0 + x1) / 2; px0 = int(max(x0, cx - bw * .35)); px1 = int(min(x1, cx + bw * .35))
    P0 = R[y0:int(y0 + bh * top), px0:px1]
    T, kt = _prep(tgt, H)
    best = (-2, 1.0)
    for s in np.geomspace(lo, hi, steps):
        ph, pw = max(4, round(P0.shape[0] * s)), max(4, round(P0.shape[1] * s))
        P = np.stack([np.asarray(Image.fromarray(P0[..., c]).resize((pw, ph), Image.BILINEAR)) for c in range(2)], -1)
        sc, _ = _ncc(T, P)
        if sc > best[0]: best = (sc, s)
    # s = 대상에서 기준 머리가 s 배로 보임 → 대상 그림을 1/s 배 하면 같은 배율 (두 그림 높이 차 kr/kt 보정)
    s_img = best[1] * kt / kr
    return 1.0 / s_img, best[0]

if __name__ == '__main__':
    import sys
    ref = Image.open(sys.argv[1])
    for p in sys.argv[2:]:
        s, sc = est(ref, Image.open(p)); print(f'{p}\tscale={s:.3f}\tncc={sc:.3f}')
