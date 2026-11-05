#!/usr/bin/env python3
"""R356 윤서하 특수 패시브 '시간 제어' 프레임 애니메이션 띠(결정적 생성, 외부 원천 없음).

사용자 2026-11-05 "모든 스킬은 프레임 애니메이션 형태로 고퀄" + "마법진=적, 십자가=아군" 규칙.
384×384 칸 10장 가로 띠, RGBA, 칸 가운데 (192,192) 가 영웅 몸 가운데.
  0~2  은빛 십자가가 번지며 선다(아이스 블루 빛무리 + 실버 심).
  1~8  십자 가운데에서 초침이 시계 방향으로 한 바퀴 돈다(짧은 꼬리 잔광, 원 고리는 그리지 않음).
  3~7  되감기 잔상: 반대로 기운 십자가 그림자 둘이 따라오다 겹친다.
  0~9  서리 알갱이가 바깥으로 흩어지다 4~6 에서 멈춘다(시간이 멈추는 물결), 8~9 에 사라진다.
손칠 결: 2배 크기로 그려 흐림·잡음으로 가장자리를 깨고 줄여서 계단을 없앤다. 색은 윤서하 고유색 2색(R302)만.
사용: python3 -I scripts/r356-seoha-time-sheet.py   → r96/runtime-text/assets/r356/seoha-time-control.webp
그 뒤 python3 scripts/sync-r99.py assets/r356/seoha-time-control.webp
"""
import math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'r96' / 'runtime-text' / 'assets' / 'r356' / 'seoha-time-control.webp'
CELL, FRAMES, SS = 384, 10, 2
ICE = np.array([120, 206, 255], np.float32) / 255
SILVER = np.array([226, 232, 242], np.float32) / 255
rng = np.random.default_rng(356)
S = CELL * SS
C = S / 2
# 잡음(손칠 결) — 고정 씨앗
grain = Image.fromarray((rng.random((S // 8, S // 8)) * 255).astype(np.uint8)).resize((S, S), Image.BICUBIC)
grain = np.asarray(grain.filter(ImageFilter.GaussianBlur(3)), np.float32) / 255
motes = [(rng.uniform(0, 2 * math.pi), rng.uniform(.26, .78), rng.uniform(.5, 1.0), rng.uniform(1.6, 3.4)) for _ in range(46)]


def layer():
    return Image.new('L', (S, S), 0)


def blur(img, r):
    return np.asarray(img.filter(ImageFilter.GaussianBlur(r * SS)), np.float32) / 255


def cross(draw, cx, cy, scale, ang, width):
    # 라틴 십자가: 세로가 길고 가로대는 위쪽 1/3
    h, arm, top = 150 * scale * SS, 62 * scale * SS, -0.42
    pts_v = [(0, top * h * 1.0), (0, h * .58)]
    pts_h = [(-arm, top * h * .35), (arm, top * h * .35)]
    ca, sa = math.cos(ang), math.sin(ang)
    for (x0, y0), (x1, y1) in (pts_v, pts_h):
        p0 = (cx + x0 * ca - y0 * sa, cy + x0 * sa + y0 * ca)
        p1 = (cx + x1 * ca - y1 * sa, cy + x1 * sa + y1 * ca)
        draw.line([p0, p1], fill=255, width=max(1, int(width * SS)))
        for p in (p0, p1):
            r = width * SS * .5
            draw.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=255)


def frame(k):
    t = k / (FRAMES - 1)
    appear = min(1, (k + 1) / 3)
    fade = 1 if k < 7 else max(0, 1 - (k - 6) / 3.2)
    scale = .72 + .28 * appear
    cy = C - 10 * SS
    # 1) 십자가 빛무리·심
    core, halo = layer(), layer()
    cross(ImageDraw.Draw(core), C, cy, scale, 0, 9)
    cross(ImageDraw.Draw(halo), C, cy, scale, 0, 26)
    core_a = blur(core, .9) * (.75 + .25 * grain)
    halo_a = blur(halo, 9) * .55 + blur(halo, 22) * .35
    # 2) 되감기 잔상(반대로 기운 십자가 둘)
    ghost = np.zeros((S, S), np.float32)
    if 2 <= k <= 7:
        g = (k - 2) / 5
        for i, off in enumerate((1, 2)):
            gl = layer()
            ang = -math.radians(14 * off * (1 - g))
            cross(ImageDraw.Draw(gl), C - 8 * SS * off * (1 - g), cy + 4 * SS * off * (1 - g), scale * (1 + .06 * off), ang, 7)
            ghost += blur(gl, 2.0 + off) * (.85 / off) * math.sin(math.pi * min(.999, g + .08))
    # 3) 초침(시계 방향 한 바퀴) + 짧은 꼬리
    hand, tail = layer(), layer()
    hd, td = ImageDraw.Draw(hand), ImageDraw.Draw(tail)
    py = cy - .42 * 150 * scale * SS * .35  # 초침 축 = 십자 교차점
    if 1 <= k <= 8:
        a0 = -math.pi / 2 + 2 * math.pi * (k - 1) / 7
        L = 96 * scale * SS
        hx, hy = C + math.cos(a0) * L, py + math.sin(a0) * L
        hd.line([(C, py), (hx, hy)], fill=255, width=3 * SS)
        hd.polygon([(hx, hy), (C + math.cos(a0 + .05) * L * .86, py + math.sin(a0 + .05) * L * .86), (C + math.cos(a0 - .05) * L * .86, py + math.sin(a0 - .05) * L * .86)], fill=255)
        for j in range(1, 7):  # 꼬리: 지나온 방향으로 옅어지는 잔광(짧은 부채, 고리 아님)
            aj = a0 - j * .07
            td.line([(C + math.cos(aj) * L * .25, py + math.sin(aj) * L * .25), (C + math.cos(aj) * L * .95, py + math.sin(aj) * L * .95)], fill=int(170 * (1 - j / 7)), width=3 * SS)
        r = 6 * SS
        hd.ellipse([C - r, py - r, C + r, py + r], fill=255)
    hand_a = blur(hand, .8)
    hand_glow = blur(hand, 6) * .6 + blur(tail, 5) * .7
    # 4) 서리 알갱이: 퍼지다 4~6 에서 멈춤
    frost = layer()
    fd = ImageDraw.Draw(frost)
    travel = min(t, 4 / 9) / (4 / 9)
    for ang, r0, br, sz in motes:
        rr = (r0 * .45 + r0 * .55 * (1 - (1 - travel) ** 2)) * S * .5
        x, y = C + math.cos(ang) * rr, cy + math.sin(ang) * rr * .82
        s = sz * SS * (1.25 if 4 <= k <= 6 else 1)
        fd.ellipse([x - s, y - s, x + s, y + s], fill=int(255 * br))
        if 4 <= k <= 6:  # 멈춘 순간 짧게 반짝이는 결정 가시
            fd.line([(x - s * 2.2, y), (x + s * 2.2, y)], fill=int(170 * br), width=max(1, SS))
            fd.line([(x, y - s * 2.2), (x, y + s * 2.2)], fill=int(170 * br), width=max(1, SS))
    frost_a = blur(frost, .7) + blur(frost, 4) * .5
    frost_a *= (.25 + .75 * min(1, k / 2)) * (1 if k < 8 else .35)
    # 합성: 빛무리=아이스 블루, 심·초침=실버
    a_ice = np.clip(halo_a * appear + ghost * .9 + hand_glow + frost_a * .8, 0, 1) * fade
    a_sil = np.clip(core_a * appear + hand_a + frost_a * .35, 0, 1) * fade
    a = np.clip(a_ice + a_sil - a_ice * a_sil, 0, 1)
    w = np.where(a > 1e-4, a_sil / np.maximum(a, 1e-4), 0)[..., None]
    rgb = ICE * (1 - w) + SILVER * np.clip(w * 1.1, 0, 1)
    rgb = rgb * (.9 + .1 * grain[..., None])
    img = np.dstack([np.clip(rgb, 0, 1), a[..., None]])
    im = Image.fromarray((img * 255 + .5).astype(np.uint8), 'RGBA')
    return im.resize((CELL, CELL), Image.LANCZOS)


def main():
    sheet = Image.new('RGBA', (CELL * FRAMES, CELL), (0, 0, 0, 0))
    for k in range(FRAMES):
        sheet.paste(frame(k), (k * CELL, 0))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, 'WEBP', lossless=True, quality=100, method=6)
    print(OUT.relative_to(ROOT), sheet.size, OUT.stat().st_size)


if __name__ == '__main__':
    main()
