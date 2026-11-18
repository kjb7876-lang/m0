#!/usr/bin/env python3
"""R1155 — 히든 영웅 EGO·페르소나 전용 효과음을 numpy 로 직접 합성한다(유료 생성·외부 음원 없음, 결과는 이 저장소 몫).

사용자 2026-11-18 "EGO·페르소나 전용 효과음도 음원-생성적용". 톤(코디네이터 전달):
  EGO = 먹 + 흰색, 천체 — 먹 붓질 바람(띠 잡음 쓸기) + 흰 종·유리 결(비조화 배음 1·2.76·5.4) + 별빛 반짝임(느린 떨림).
  페르소나 = 언주색, 악의 — 낮은 가운데 음역(200Hz 이상)의 어긋난 화음(단2도), 거꾸로 부푸는 소리, 으르렁 떨림(AM), 속삭임 결(형성음 잡음).
대규칙(docs/sound-rules.md) 목표: 150Hz 아래 8% 이하, 자주 나는 소리 2~5kHz 35% 이하, 시작 10ms 넘게 올림, 파일 피크 −9~−14dB, 변주 2개,
끝 '띡' 없음, 역할 길이 상한(공격 .65초·스킬 1.2초) 안에 본체.
결과: r96/runtime-text/assets/r1155/sfx/*.ogg + index.json(종류·파일·설계·sha256). 검사: r96/qa/r1155/r1155-audio-check.py
사용: python3 scripts/build-sfx-r1155.py   필요: numpy, ffmpeg."""
import hashlib, json, pathlib, subprocess, tempfile, wave
import numpy as np

SR = 44100
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'r96/runtime-text/assets/r1155/sfx'
rng = np.random.default_rng(1155)


def T(d): return np.arange(int(d * SR)) / SR


def pad(x, d):
    n = int(d * SR)
    return np.pad(x, (0, max(0, n - len(x))))[:n]


def at(buf, x, t0, g=1.0):
    i = int(t0 * SR); n = min(len(x), len(buf) - i)
    if n > 0: buf[i:i + n] += g * x[:n]
    return buf


def env(d, a=.012, decay=.2, hold=0.0):
    t = T(d); e = np.where(t < a, np.sin(np.pi / 2 * t / max(a, 1e-4)) ** 2, np.exp(-np.maximum(t - a - hold, 0) / decay))
    return e


def swell(d, p=2.5, floor=.35):
    """부풂. 누르고 바로 들리게(M3) 처음부터 floor 만큼은 난다."""
    t = T(d); return floor + (1 - floor) * (t / d) ** p


def noise(d): return rng.standard_normal(int(d * SR))


def fft_band(x, lo, hi, soft=1.3):
    """정적 띠 거르기(가장자리 부드럽게)."""
    n = len(x); sp = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    m = 1 / (1 + (lo / np.maximum(f, 1)) ** (2 * soft)) / (1 + (f / hi) ** (2 * soft)) if hi else 1 / (1 + (lo / np.maximum(f, 1)) ** (2 * soft))
    return np.fft.irfft(sp * m, n)


def sweep_band(x, lo0, lo1, hi0, hi1, curve=1.0):
    """시간에 따라 움직이는 띠(STFT 겹쳐 더하기)."""
    W, H = 1024, 256; n = len(x); out = np.zeros(n + W); wsum = np.zeros(n + W); win = np.hanning(W)
    f = np.fft.rfftfreq(W, 1 / SR); xp = np.pad(x, (0, W))
    for s in range(0, n, H):
        u = min(1, s / max(n - 1, 1)) ** curve; lo = lo0 + (lo1 - lo0) * u; hi = hi0 + (hi1 - hi0) * u
        m = 1 / (1 + (lo / np.maximum(f, 1)) ** 2.6) / (1 + (f / hi) ** 2.6)
        seg = np.fft.irfft(np.fft.rfft(xp[s:s + W] * win) * m, W)
        out[s:s + W] += seg * win; wsum[s:s + W] += win * win
    return (out / np.maximum(wsum, 1e-3))[:n]


def tone(f0, d, glide=None, vib=0.0, vibHz=5.0, phase=0.0):
    t = T(d); f = np.full_like(t, float(f0)) if glide is None else f0 * (glide / f0) ** (t / d)
    if vib: f = f * (1 + vib * np.sin(2 * np.pi * vibHz * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def bell(f0, d, decay=.35, bright=1.0):
    """흰 종·유리 결: 비조화 배음."""
    out = np.zeros(int(d * SR))
    for r, g, dk in ((1, 1, 1), (2.756, .45 * bright, .6), (5.404, .22 * bright, .35), (8.933, .08 * bright, .2)):
        out += g * tone(f0 * r, d, phase=rng.uniform(0, 6.28)) * env(d, .006, decay * dk)
    return out


def saw(f0, d, glide=None, harm=14, tilt=1.15, vib=0.0, vibHz=5.0):
    t = T(d); f = np.full_like(t, float(f0)) if glide is None else f0 * (glide / f0) ** (t / d)
    if vib: f = f * (1 + vib * np.sin(2 * np.pi * vibHz * t))
    ph = 2 * np.pi * np.cumsum(f) / SR; out = np.zeros_like(t)
    for k in range(1, harm + 1):
        out += np.sin(k * ph) / k ** tilt
    return out


def shimmer(d, fs=(1568, 2093, 2637, 3136), rate=7.0, decay=.4):
    out = np.zeros(int(d * SR)); t = T(d)
    for i, f in enumerate(fs):
        out += tone(f, d, phase=rng.uniform(0, 6.28)) * (.5 + .5 * np.sin(2 * np.pi * (rate + i * 1.7) * t + i)) * env(d, .03 + .02 * i, decay) / (1 + i * .6)
    return out


def swish(d, lo=900, hi=2600, fall=.55, a=.02):
    """먹 붓질 바람: 띠 잡음이 위에서 아래로 쓸림."""
    x = sweep_band(noise(d), lo, lo * fall, hi, hi * fall)
    t = T(d); e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * env(d, a, d * .45)
    return x * e


def whisper(d, formants=(520, 1180), q=.18):
    x = noise(d); out = np.zeros_like(x)
    for f in formants: out += fft_band(x, f * (1 - q), f * (1 + q), 2.2)
    return out


def growl(x, hz=38, depth=.45):
    t = np.arange(len(x)) / SR; return x * (1 - depth + depth * (.5 + .5 * np.sin(2 * np.pi * hz * t + rng.uniform(0, 6.28))))


def rev(x, floor=.35):
    """거꾸로 부풂. 앞이 비지 않게(M3) 처음부터 floor 만큼 옅은 숨결을 깐다."""
    y = x[::-1].copy(); e = np.abs(y).max() or 1; n = len(y)
    return y + floor * e * fft_band(noise(n / SR), 400, 1600) * np.linspace(1, .2, n) / 3


def finish(x, peak_db=-11.0, lp=None, fade_in=.024, fade_out=.045):
    x = fft_band(x, 175, lp, 1.6)  # 150Hz 아래 쿵 걷기(재생 사슬 R545 와 같은 방향), 위 끝은 선택
    n = len(x); a = int(fade_in * SR); b = int(fade_out * SR)
    x[:a] *= np.sin(np.pi / 2 * np.arange(a) / a) ** 2; x[n - b:] *= np.cos(np.pi / 2 * np.arange(b) / b) ** 2
    pk = np.abs(x).max() or 1
    return x / pk * 10 ** (peak_db / 20)


# ─────────────────────────────── EGO (먹 + 흰색, 천체) ───────────────────────────────
def ego_atk(v):
    d = .42; b = np.zeros(int(d * SR))
    at(b, swish(.26, 1000 + 160 * v, 2300 + 200 * v, .6), 0, 1.0)
    at(b, bell(1175 * (1.06 if v else 1), .3, .09, .45), .03, .32)
    at(b, fft_band(noise(.05), 500, 1400) * env(.05, .004, .015), .02, .25)  # 먹 '탁'
    return finish(b, -10.5, 5200)


def ego_q():
    d = 1.0; b = np.zeros(int(d * SR))
    at(b, swish(.4, 900, 2800, .45), 0, 1.0)
    for f, g, t0 in ((659, .5, .05), (988, .38, .07), (1319, .22, .09)): at(b, bell(f, .8, .28, .7), t0, g)
    at(b, fft_band(noise(.7), 350, 1300) * env(.7, .05, .22), .1, .35)  # 수묵 번짐 꼬리
    at(b, shimmer(.8, decay=.3), .12, .16)
    return finish(b, -11, 6500)


def ego_w():
    d = .75; b = np.zeros(int(d * SR))
    for i, t0 in enumerate((0, .085, .17)): at(b, swish(.2, 1100 + 150 * i, 2700 + 200 * i, .6), t0, .85)
    at(b, bell(1568, .5, .14, .5), .19, .3)
    return finish(b, -11, 6000)


def ego_e():
    d = .95; b = np.zeros(int(d * SR))
    sw = rev(fft_band(noise(.24), 700, 2400) * env(.24, .004, .1)); at(b, sw, 0, .7)
    for f, g in ((880, .55), (1318, .35)): at(b, bell(f, .7, .3, .6), .24, g)
    at(b, shimmer(.6, (1760, 2349, 2794), 5.5, .3), .26, .2)
    at(b, bell(1175, .25, .06, .4), 0, .3)  # 첫 눈뜸 '팅'
    return finish(b, -11, 6500)


def ego_r():
    d = 1.15; b = np.zeros(int(d * SR))
    at(b, swish(.5, 700, 2600, .4), 0, .95)
    ring = sum(g * tone(f, 1.0, phase=rng.uniform(0, 6)) * env(1.0, .01, .38) for f, g in ((440, .6), (660, .38), (1213, .22), (2382, .07)))
    at(b, ring, .08, .7)
    at(b, shimmer(.9, (1760, 2093, 2637), 6, .45), .15, .22)
    at(b, fft_band(noise(.06), 600, 1600) * env(.06, .004, .03), 0, .6)
    return finish(b, -10, 6500)


def ego_moon():
    d = .85; b = np.zeros(int(d * SR))
    at(b, tone(560, .7, glide=470) * env(.7, .008, .2), 0, .6)  # 먹방울 '퉁'
    at(b, fft_band(noise(.12), 600, 1800) * env(.12, .004, .04), 0, .35)
    at(b, bell(1397, .6, .22, .5), .05, .3)
    at(b, shimmer(.7, (1865, 2489), 4.5, .3), .1, .15)
    return finish(b, -11, 6000)


def ego_violet():
    d = 1.1; b = np.zeros(int(d * SR))
    at(b, sweep_band(noise(.4), 700, 1500, 1800, 3400, .7) * swell(.4, 1.6), 0, .55)  # 두 구가 합쳐지며 솟음
    at(b, (tone(440, .45, glide=880) + .5 * tone(660, .45, glide=1320)) * swell(.45, 1.2, .5) * env(.45, .015, .5), 0, .35)  # 두 구 맞물리는 오름음
    for f, g in ((587, .45), (880, .4), (1319, .3), (1760, .18)): at(b, bell(f, .7, .26, .6), .4, g)  # 흰 관통
    at(b, fft_band(noise(.6), 500, 2000) * env(.6, .01, .2), .4, .35)
    at(b, shimmer(.6, (2093, 2637, 3136), 9, .3), .42, .18)
    return finish(b, -10, 7000)


def ego_clones():
    d = .65; b = np.zeros(int(d * SR))
    for i in range(7): at(b, swish(.09, 1200 + 120 * i, 2500 + 160 * i, .7, .012), i * .05, .7 + .04 * i)
    at(b, bell(1760, .35, .1, .4), .33, .25)
    return finish(b, -11, 6000)


def ego_trio():
    d = .95; b = np.zeros(int(d * SR))
    for i, f in enumerate((659, 831, 988)): at(b, bell(f, .6, .22, .6), i * .12, .55 - .05 * i)
    at(b, shimmer(.7, decay=.32), .25, .2)
    at(b, swish(.3, 800, 2200, .5), 0, .45)
    return finish(b, -11, 6500)


def ego_trio_hit():
    d = .85; b = np.zeros(int(d * SR))
    for i in range(3): at(b, swish(.16, 1100, 2700, .55, .01), i * .04, .9)
    at(b, fft_band(noise(.5), 450, 1700) * env(.5, .006, .14), .1, .5)
    for f, g in ((988, .4), (1480, .28)): at(b, bell(f, .6, .2, .6), .12, g)
    return finish(b, -10.5, 6500)


def ego_star():
    d = .85; b = np.zeros(int(d * SR))
    at(b, sweep_band(noise(.5), 600, 1400, 1600, 3600, .8) * swell(.5, 1.4) * env(.5, .02, .5), 0, .7)
    at(b, bell(1760, .5, .2, .5), .32, .4)
    at(b, shimmer(.5, (2093, 2637, 3136), 8, .25), .3, .18)
    return finish(b, -11, 7000)


def ego_abyss():
    d = 1.0; b = np.zeros(int(d * SR))
    pull = tone(700, .55, glide=330) * swell(.55, 1.8) + .5 * fft_band(noise(.55), 500, 1500) * swell(.55, 2.2)
    at(b, pull, 0, .55)
    at(b, sum(g * tone(f, .45, phase=1) for f, g in ((330, .5), (495, .3), (912, .15))) * env(.45, .006, .15), .55, .6)
    at(b, shimmer(.4, (1568, 1976), 3.5, .2), .56, .12)
    return finish(b, -11, 5500)


def ego_repulse():
    d = .75; b = np.zeros(int(d * SR))
    at(b, fft_band(noise(.25), 320, 1600) * env(.25, .005, .07), 0, .8)
    for i, f in enumerate((523, 784, 1175, 1760)): at(b, bell(f, .6, .2, .5), .01 + i * .03, .4 / (1 + i * .3))
    at(b, sweep_band(noise(.5), 900, 400, 2600, 1200) * env(.5, .02, .18), .03, .4)
    return finish(b, -10.5, 6500)


def ego_slash(v):
    d = .2; b = np.zeros(int(d * SR))
    at(b, swish(.13, 1150 + 140 * v, 2400 + 180 * v, .65, .012), 0, 1)
    at(b, bell(1319 + 110 * v, .14, .05, .35), .02, .22)
    return finish(b, -11, 5200)


def ego_slash_end():
    d = .55; b = np.zeros(int(d * SR))
    at(b, swish(.3, 900, 2600, .45), 0, 1)
    for f, g in ((784, .45), (1175, .3)): at(b, bell(f, .45, .16, .55), .06, g)
    return finish(b, -10.5, 6000)


# ─────────────────────────────── 페르소나 (언주색, 악의) ───────────────────────────────
def per_atk(v):
    d = .45; b = np.zeros(int(d * SR))
    f = 247 if v == 0 else 220
    body = (saw(f, .4, glide=f * .92, harm=10) + .7 * saw(f * 1.059, .4, glide=f * 1.059 * .92, harm=10)) * env(.4, .014, .12)
    at(b, growl(fft_band(body, 200, 1100), 34 + 6 * v, .35), 0, 1)
    at(b, whisper(.25, (480, 1050)) * env(.25, .02, .08), .0, .35)
    return finish(b, -10.5, 2400)


def per_q():
    d = 1.05; b = np.zeros(int(d * SR))
    sw = fft_band(noise(.3), 300, 1300) * swell(.3, 2.6); at(b, sw, 0, .7)
    drone = (saw(294, .7, glide=262, harm=9) + saw(311, .7, glide=277, harm=9)) * env(.7, .01, .26)
    at(b, growl(fft_band(drone, 200, 1200), 31, .4), .3, .9)
    at(b, whisper(.5, (560, 1240)) * env(.5, .03, .2), .3, .3)
    at(b, growl(fft_band(saw(277, .25, harm=7), 200, 900) * env(.25, .01, .08), 30, .4), 0, .45)  # 첫 박동
    return finish(b, -11, 2600)


def per_w():
    d = .85; b = np.zeros(int(d * SR))
    hum = fft_band(saw(233, .8, glide=196, harm=8), 200, 1000) * env(.8, .015, .3); at(b, hum, 0, .55)
    for i in range(9):
        t0 = .02 + i * .07 + rng.uniform(0, .02); cr = fft_band(noise(.04), 600, 1900) * env(.04, .003, .009)
        at(b, cr, t0, .9 - .06 * i)
    return finish(b, -11, 3200)


def per_e():
    d = 1.0; b = np.zeros(int(d * SR))
    at(b, fft_band(noise(.35), 250, 1100) * swell(.35, 2.2), 0, .6)
    ring = (tone(196, .65) + .7 * tone(208, .65) + .35 * tone(392, .65)) * env(.65, .008, .25)
    at(b, growl(ring, 27, .3), .35, .8)
    at(b, fft_band(noise(.3), 300, 900) * env(.3, .004, .08), .35, .45)
    return finish(b, -11, 2400)


def per_r():
    d = 1.15; b = np.zeros(int(d * SR))
    orb = (saw(262, 1.1, harm=8, vib=.03, vibHz=6) + .6 * saw(277, 1.1, harm=8, vib=.03, vibHz=6.5)) * env(1.1, .05, .5, .2)
    t = T(1.1); orb = orb * (.6 + .4 * np.sin(2 * np.pi * 3.2 * t))  # 둘레를 도는 느낌
    at(b, fft_band(orb, 200, 1200), 0, .9)
    at(b, whisper(1.0, (600, 1300)) * env(1.0, .1, .4), .05, .3)
    return finish(b, -11, 2600)


def per_repulse():
    d = .75; b = np.zeros(int(d * SR))
    at(b, fft_band(noise(.3), 220, 1200) * env(.3, .006, .09), 0, .9)
    at(b, growl(fft_band(saw(208, .6, glide=185, harm=8) + saw(220, .6, glide=196, harm=8), 200, 1000) * env(.6, .01, .2), 36, .45), .02, .7)
    return finish(b, -10.5, 2400)


def per_star():
    d = .85; b = np.zeros(int(d * SR))
    at(b, sweep_band(noise(.55), 300, 600, 900, 1700, .8) * swell(.55, 1.2) * env(.55, .02, .5), 0, .7)
    at(b, fft_band(saw(330, .5, glide=247, harm=8) + saw(349, .5, glide=262, harm=8), 200, 1300) * env(.5, .01, .18), .3, .6)
    at(b, fft_band(saw(311, .2, harm=7) + saw(330, .2, harm=7), 200, 1000) * env(.2, .01, .07), 0, .4)
    return finish(b, -11, 2800)


def per_abyss():
    d = 1.0; b = np.zeros(int(d * SR))
    pull = rev(fft_band(noise(.5), 220, 900) * env(.5, .004, .2)) + .5 * rev(tone(330, .5, glide=220) * env(.5, .004, .2))
    at(b, pull, 0, .7)
    at(b, growl(fft_band(saw(185, .45, harm=7) + saw(196, .45, harm=7), 200, 800) * env(.45, .006, .16), 24, .5), .5, .75)
    at(b, fft_band(saw(247, .2, harm=7) + saw(262, .2, harm=7), 200, 900) * env(.2, .01, .07), 0, .45)
    return finish(b, -11, 2000)


def per_violet_charge():
    d = .7; b = np.zeros(int(d * SR))
    t = T(.65); cl = sum(saw(f, .65, glide=f * 1.5, harm=7) for f in (220, 233, 262)) * swell(.65, 1.6) * (.65 + .35 * np.sin(2 * np.pi * (8 + 10 * t / .65) * t))
    at(b, fft_band(cl, 200, 1400), 0, .9)
    at(b, whisper(.6, (700, 1400)) * swell(.6, 2.0), 0, .3)
    return finish(b, -11, 3000)


def per_violet_fire():
    d = 1.15; b = np.zeros(int(d * SR))
    beam = (saw(330, 1.0, glide=311, harm=12, tilt=1.0) + saw(349, 1.0, glide=330, harm=12, tilt=1.0)) * env(1.0, .012, .45, .25)
    at(b, growl(fft_band(beam, 220, 1800), 42, .35), 0, .75)
    at(b, sweep_band(noise(1.0), 900, 500, 1800, 1100) * env(1.0, .01, .4, .2), 0, .4)  # 레이저 결 쉿
    at(b, fft_band(noise(.25), 220, 1000) * env(.25, .005, .06), 0, .7)  # 첫 꿰뚫음
    return finish(b, -10, 3400)


def per_meteor():
    d = 1.0; b = np.zeros(int(d * SR))
    at(b, sweep_band(noise(.6), 250, 400, 700, 1300, 1.2) * swell(.6, 1.0) * env(.6, .03, .6), 0, .7)
    at(b, fft_band(noise(.35), 200, 900) * env(.35, .005, .1), .55, .8)
    at(b, growl(fft_band(saw(196, .4, harm=7), 200, 900) * env(.4, .006, .14), 30, .4), .56, .5)
    return finish(b, -10.5, 2400)


def per_gravity(v):
    d = .22; b = np.zeros(int(d * SR))
    f = 277 if v == 0 else 262
    at(b, fft_band(saw(f, .18, glide=f * .85, harm=7) + .6 * saw(f * 1.06, .18, glide=f * .9, harm=7), 200, 1100) * env(.18, .012, .05), 0, 1)
    at(b, whisper(.12, (500, 1000)) * env(.12, .012, .04), 0, .3)
    return finish(b, -11, 2200)


def ego_hit(v, big=False):
    """EGO 적중: 먹 묻은 칼날이 닿는 마른 '착' + 흰 쇳결. 큰 적중은 낮고 길게."""
    d = .4 if big else .28; b = np.zeros(int(d * SR)); k = (.82 if big else 1) * (1 + .06 * v)
    at(b, fft_band(noise(.08), 650 * k, 2100 * k) * env(.08, .004, .022 if not big else .035), 0, 1)
    at(b, bell(1245 * k, .2 if not big else .32, .05 if not big else .1, .35), .004, .3 if not big else .38)
    if big: at(b, fft_band(noise(.3), 300, 1100) * env(.3, .006, .08), .01, .45)
    return finish(b, -10.5, 4800)


def per_hit(v, big=False):
    """페르소나 적중: 언주 구슬이 터지는 둔탁한 '퍽' + 어긋난 짧은 화음 + 거친 결."""
    d = .42 if big else .3; b = np.zeros(int(d * SR)); k = (.8 if big else 1) * (1 + .05 * v)
    at(b, fft_band(noise(.1), 260 * k, 1150 * k) * env(.1, .004, .03 if not big else .05), 0, 1)
    at(b, growl(fft_band(saw(311 * k, .25, glide=262 * k, harm=7) + saw(330 * k, .25, glide=277 * k, harm=7), 200, 1100) * env(.25, .005, .06 if not big else .11), 40, .4), .003, .5 if not big else .65)
    return finish(b, -10.5, 2600, fade_in=.03)


# 종류 → [(파일, 함수, 설계 한 줄, gain)]
SPEC = {
    'r546Atk_ego': [('ego-atk-1', lambda: ego_atk(0), '먹 붓질 바람 + 작은 흰 종 + 먹 탁', .7), ('ego-atk-2', lambda: ego_atk(1), '같은 결 높은 변주', .7)],
    'r546Sp_ego_q': [('ego-q-1', ego_q, '큰 붓질 + 흰 종 화음 + 수묵 번짐 꼬리 + 별빛', .72)],
    'r546Sp_ego_w': [('ego-w-1', ego_w, '세 번 붓질 + 유리 종', .72)],
    'r546Sp_ego_e': [('ego-e-1', ego_e, '거꾸로 빨려든 바람 → 흰 종 + 별빛(시선)', .72)],
    'r546Sp_ego_r': [('ego-r-1', ego_r, '환수검: 큰 붓질 + 칼 울림 + 별빛 꼬리', .75)],
    'r546Sp_ego_moon': [('ego-moon-1', ego_moon, '묵월: 먹방울 퉁 + 흰 종 + 달빛 떨림', .72)],
    'r546Sp_ego_violet': [('ego-violet-1', ego_violet, '쌍성 소멸(EGO 백적): 합쳐지며 솟는 바람 → 흰 종 관통 + 별빛', .75)],
    'r546Sp_ego_clones': [('ego-clones-1', ego_clones, '칠묵영: 일곱 짧은 붓질 + 끝 종', .72)],
    'r546Sp_ego_trio': [('ego-trio-1', ego_trio, '삼협묵희: 올라가는 흰 종 셋 + 별빛', .75)],
    'r546Sp_ego_trioHit': [('ego-triohit-1', ego_trio_hit, '삼협묵희 일격: 세 겹 베기 + 번짐 + 종', .75)],
    'r546Sp_ego_star': [('ego-star-1', ego_star, '은빛 거성(백적): 밝게 솟는 바람 + 별 종', .72)],
    'r546Sp_ego_abyss': [('ego-abyss-1', ego_abyss, '심연 왜성(백적): 끌려드는 하강 → 고리 울림', .72)],
    'r546Sp_ego_repulse': [('ego-repulse-1', ego_repulse, '항성 반발(백적): 터짐 + 퍼지는 종 + 바깥 바람', .72)],
    'r972_egoSlash': [('ego-slash-1', lambda: ego_slash(0), '연참·일섬 한 타: 짧은 붓질 + 작은 종', .42), ('ego-slash-2', lambda: ego_slash(1), '높은 변주', .42)],
    'r972_egoSlashEnd': [('ego-slashend-1', ego_slash_end, '일섬 마무리: 큰 붓질 + 종 둘', .55)],
    'r546Atk_persona': [('per-atk-1', lambda: per_atk(0), '언주 구슬 박동: 단2도 어긋난 낮은 화음 + 으르렁 + 속삭임', .7), ('per-atk-2', lambda: per_atk(1), '낮은 변주', .7)],
    'r546Sp_persona_q': [('per-q-1', per_q, '거꾸로 부풂 → 어긋난 화음 하강 + 속삭임', .72)],
    'r546Sp_persona_w': [('per-w-1', per_w, '순수악의의 분기: 검은 지직 연쇄 + 하강 웅', .72)],
    'r546Sp_persona_e': [('per-e-1', per_e, '욕망의 일식: 부풂 → 어두운 고리 + 둔탁 터짐', .72)],
    'r546Sp_persona_r': [('per-r-1', per_r, '악의의 관통: 둘레를 도는 어긋난 웅 + 속삭임', .72)],
    'r546Sp_persona_repulse': [('per-repulse-1', per_repulse, '(진) 항성 반발: 어두운 터짐 + 으르렁', .72)],
    'r546Sp_persona_star': [('per-star-1', per_star, '(진) 은빛 거성(언주): 낮게 쓸리는 바람 + 하강 화음', .72)],
    'r546Sp_persona_abyss': [('per-abyss-1', per_abyss, '(진) 심연 왜성(흑): 거꾸로 빨림 → 깊은 으르렁', .72)],
    'r546Sp_persona_violetCharge': [('per-violet-charge-1', per_violet_charge, '(진) 쌍성 소멸 충전: 조여 오르는 떨림 화음', .72)],
    'r546Sp_persona_violetFire': [('per-violet-fire-1', per_violet_fire, '(진) 쌍성 소멸 발사: 흑적 레이저 빔 + 으르렁 + 꿰뚫음', .78)],
    'r546Sp_persona_meteor': [('per-meteor-1', per_meteor, '(진) 유성 궤도: 낮게 몰려오는 바람 → 둔탁 충돌', .72)],
    'r972_perGravity': [('per-gravity-1', lambda: per_gravity(0), '중력 틱: 짧은 어두운 박동', .42), ('per-gravity-2', lambda: per_gravity(1), '낮은 변주', .42)],
    'r785Hit_ego': [('ego-hit-%d' % (i + 1), (lambda i=i: ego_hit(i)), '적중: 먹 칼날 마른 착 + 흰 쇳결' if i == 0 else '음높이 변주', .85) for i in range(4)],
    'r785HitBig_ego': [('ego-hitbig-%d' % (i + 1), (lambda i=i: ego_hit(i, True)), '스킬 적중: 낮은 착 + 종 + 번짐' if i == 0 else '변주', 1.0) for i in range(2)],
    'r785Hit_persona': [('per-hit-%d' % (i + 1), (lambda i=i: per_hit(i)), '적중: 언주 구슬 퍽 + 어긋난 짧은 화음' if i == 0 else '음높이 변주', .85) for i in range(4)],
    'r785HitBig_persona': [('per-hitbig-%d' % (i + 1), (lambda i=i: per_hit(i, True)), '스킬 적중: 낮고 긴 퍽 + 으르렁' if i == 0 else '변주', 1.0) for i in range(2)],
}


def write_ogg(x, path):
    with tempfile.TemporaryDirectory() as td:
        w = pathlib.Path(td) / 'a.wav'
        with wave.open(str(w), 'wb') as f:
            f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(w), '-c:a', 'libvorbis', '-q:a', '4', '-ac', '1', '-ar', str(SR), str(path)], check=True)


def main():
    OUT.mkdir(parents=True, exist_ok=True); idx = {'revision': 'R1155', 'source': 'scripts/build-sfx-r1155.py (numpy 합성, 시드 1155, 외부 음원·유료 생성 없음)', 'kinds': {}}
    for kind, rows in SPEC.items():
        idx['kinds'][kind] = []
        for name, fn, note, gain in rows:
            p = OUT / (name + '.ogg'); write_ogg(fn(), p)
            idx['kinds'][kind].append({'path': 'assets/r1155/sfx/' + p.name, 'gain': gain, 'design': note, 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()})
    (OUT / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(sum(len(v) for v in idx['kinds'].values()), 'files', sum(r['bytes'] for v in idx['kinds'].values() for r in v), 'bytes')


if __name__ == '__main__':
    main()
