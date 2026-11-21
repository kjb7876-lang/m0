#!/usr/bin/env python3
"""R1299c 발록 소환진 공격의 영웅 발밑 육망성 프레임 시트.

원본: Dots 바닥 데칼 r96/runtime-text/assets/r299/hexagram.webp(R299 검수 통과분, 원본 faint_red_hexagram_decal_v1.png).
그동안 R251 은 이 육망성을 ctx.arc·lineTo 로 코드로 그렸다 → 같은 핏빛 육망성 그림을 이미지 처리로 8칸 시트로 만든다.
 0~5칸: 육망성이 시계 방향으로 그어지며 드러남(예고 1.2초 동안), 핏빛 번짐이 점점 짙어짐.
 6~7칸: 다 그어진 육망성이 맥박처럼 밝아졌다 어두워짐(손이 솟는 동안).
PIL 만 쓴다(CI 에 numpy 없음). 같은 입력이면 같은 출력.
"""
import hashlib, json, math, os, sys
from PIL import Image, ImageChops, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'r96', 'runtime-text', 'assets')
SRC = os.path.join(ROOT, 'r299', 'hexagram.webp')
OUT_DIR = os.path.join(ROOT, 'r1299')
OUT = os.path.join(OUT_DIR, 'hexagram-sheet.webp')
CELL, COLS, ROWS, N = 256, 4, 2, 8


def base_cell():
    im = Image.open(SRC).convert('RGBA')
    cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    cell.alpha_composite(im, ((CELL - im.width) // 2, (CELL - im.height) // 2))
    # 위아래가 조금 눌린 원본을 정원으로 맞춘다(게임이 바닥 원근으로 다시 누른다)
    return cell.resize((CELL, CELL), Image.LANCZOS)


def tint(alpha, rgb, gain):
    a = alpha.point(lambda v: min(255, int(v * gain)))
    layer = Image.new('RGBA', alpha.size, rgb + (0,))
    layer.putalpha(a)
    return layer


def sweep_mask(u):
    """시계 방향 부채꼴(위쪽 0시에서 시작) 마스크, 끝은 부드럽게."""
    m = Image.new('L', (CELL, CELL), 0)
    if u <= 0:
        return m
    px = m.load()
    c = CELL / 2
    lim = u * 2 * math.pi
    soft = 0.35
    for y in range(CELL):
        for x in range(CELL):
            a = math.atan2(x - c, -(y - c)) % (2 * math.pi)
            if u >= 1 or a <= lim - soft:
                px[x, y] = 255
            elif a <= lim:
                px[x, y] = int(255 * (lim - a) / soft)
    return m


def frame(cell, i):
    alpha = cell.getchannel('A')
    if i < 6:
        u = (i + 1) / 6
        mask = sweep_mask(u)
        glow_gain, line_gain = 0.45 + 0.55 * u, 0.7 + 0.3 * u
    else:
        mask = Image.new('L', (CELL, CELL), 255)
        glow_gain, line_gain = (1.15, 1.0) if i == 6 else (0.85, 0.92)
    a = ImageChops.multiply(alpha, mask)
    out = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    # 짙은 핏빛 번짐(바닥에 스민 피) → 선 → 밝은 심
    out.alpha_composite(tint(a.filter(ImageFilter.GaussianBlur(7)), (110, 6, 14), 2.0 * glow_gain))
    out.alpha_composite(tint(a.filter(ImageFilter.GaussianBlur(2.5)), (235, 26, 38), 2.0 * glow_gain))
    out.alpha_composite(tint(a, (210, 18, 30), 1.8 * line_gain))
    core = a.point(lambda v: 0 if v < 90 else min(255, int((v - 90) * 1.8)))
    out.alpha_composite(tint(core, (255, 128, 112), 1.2 * glow_gain))
    return out


def main():
    cell = base_cell()
    sheet = Image.new('RGBA', (CELL * COLS, CELL * ROWS), (0, 0, 0, 0))
    for i in range(N):
        sheet.alpha_composite(frame(cell, i), ((i % COLS) * CELL, (i // COLS) * CELL))
    os.makedirs(OUT_DIR, exist_ok=True)
    sheet.save(OUT, 'WEBP', quality=90, alpha_quality=100, method=6)
    sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
    idx = {
        'revision': 'R1299c',
        'temporary': False,
        'items': {'hexagram-sheet': {
            'path': 'assets/r1299/hexagram-sheet.webp', 'cell': CELL, 'cols': COLS, 'rows': ROWS, 'frames': N,
            'source': 'assets/r299/hexagram.webp', 'sourceSHA256': sha(SRC),
            'sourceOriginal': 'faint_red_hexagram_decal_v1.png (Dots, R299 검수 통과)',
            'method': 'scripts/r1299-hexagram-sheet.py: 정원 맞춤, 시계 방향 그어짐 0~5칸, 맥박 6~7칸, 핏빛 번짐·선·심 3겹',
            'sha256': sha(OUT), 'bytes': os.path.getsize(OUT),
            'use': '발록의 소환진(R251) 공격 — 영웅 발밑 육망성 예고·손 솟는 동안(코드로 그리던 원·육망성 대신)'}}}
    with open(os.path.join(OUT_DIR, 'index.json'), 'w', encoding='utf8') as f:
        json.dump(idx, f, ensure_ascii=False, indent=1)
    print(OUT, os.path.getsize(OUT))


if __name__ == '__main__':
    sys.exit(main())
