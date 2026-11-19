#!/usr/bin/env python3
"""R1187: Dots CX-0163DU r1 ROUGH 중복 몹 새 그림 7종(DU-05·07~12) 손질.
사용자 11-19 01:27Z "중복나오는몹은 닷츠에게 요청하고 어려우면 코드로 색이라도 바꿔".
새 그림은 원래 시트와 같은 크기·칸 수·칸 순서(Dots 규격) → 칸마다 몸 아래 끝(발·옷자락 끝)을 원래 칸에 맞춰 세로로만 옮기고,
알파 16 이하는 0으로. 몸 키 차이는 모두 8% 안이라 크기는 그대로 둔다. 원본은 두고 파생본만 r96/runtime-text/assets/r1187/mobs/.
usage: python3 scripts/r1187-dup-mob-sheets.py <raw 폴더(du05.png …)>"""
import sys, json, hashlib
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]; RT = ROOT / 'r96/runtime-text'; OUT = RT / 'assets/r1187/mobs'
JOBS = [  # DU, 원래 시트, 칸 W·H, 새 파일, 새로 그릴 몹
    ('DU-05', 'r380/mobs/r200-stitched-golem-v2.webp', 184, 184, 'du05-rag-golem.webp', '기운 누더기 골렘'),
    ('DU-07', 'r290/mobs/m053.webp', 256, 320, 'du07-reverse-paper.webp', '제출되지 못한 문장(사몽 역행)'),
    ('DU-08', 'r290/mobs/m088.webp', 256, 320, 'du08-reverse-photo.webp', '찢어진 사진의 망령(사몽 역행)'),
    ('DU-09', 'r290/mobs/m082.webp', 256, 320, 'du09-vermilion-wraith.webp', '백은 없는 그림자(사몽 S-07)'),
    ('DU-10', 'r290/mobs/m066.webp', 256, 320, 'du10-ink-echo.webp', '부정의 잔영(사몽 P)'),
    ('DU-11', 'r410/mobs/m099.webp', 256, 320, 'du11-faded-guard.webp', '거짓천국 근위천사(미카엘라 엔딩)'),
    ('DU-12', 'r410/mobs/m063.webp', 256, 320, 'du12-root-rag.webp', '뿌리에서 쏟아진 잔영(사몽 S-01)')]
def bb(c): return c.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
def sha(b): return hashlib.sha256(b).hexdigest()
def main(raw):
    raw = Path(raw); OUT.mkdir(parents=True, exist_ok=True); rec = []
    for du, orig, W, H, name, who in JOBS:
        f = raw / (du.lower().replace('-', '') + '.png'); a = Image.open(f).convert('RGBA'); b = Image.open(RT / 'assets' / orig).convert('RGBA')
        assert a.size == b.size, (du, a.size, b.size)
        cols, rows = a.size[0] // W, a.size[1] // H; out = Image.new('RGBA', a.size); shifts = []; ratios = []
        for i in range(cols * rows):
            x, y = (i % cols) * W, (i // cols) * H; c = a.crop((x, y, x + W, y + H)); al = c.getchannel('A').point(lambda v: 0 if v <= 16 else v); c.putalpha(al)
            A, B = bb(c), bb(b.crop((x, y, x + W, y + H)))
            dy = 0
            if A and B:
                dy = max(-A[1], min(H - A[3], B[3] - A[3])); ratios.append(round((A[3] - A[1]) / max(1, B[3] - B[1]), 3))
            shifts.append(dy); out.paste(c, (x, y + dy), c)
        p = OUT / name; out.save(p, lossless=True, method=6); by = p.read_bytes()
        rec.append({'du': du, 'file': 'assets/r1187/mobs/' + name, 'replaces': 'assets/' + orig, 'mob': who, 'cell': [W, H], 'cells': cols * rows,
                    'source': f'Dots CX-0163DU {du} walk-attack r1 ROUGH', 'sourceSha256': sha(f.read_bytes()), 'sha256': sha(by), 'bytes': len(by),
                    'footShift': shifts, 'heightRatio': [min(ratios), max(ratios)], 'finalArt': False})
    (OUT / 'index.json').write_text(json.dumps({'schema': 'storyworld.r1187.dots/v1', 'request': 'CX-0163DU r1 ROUGH', 'assets': rec}, ensure_ascii=False, indent=1) + '\n', encoding='utf8')
    for r in rec: print(r['du'], r['bytes'], r['heightRatio'], max(map(abs, r['footShift'])))
if __name__ == '__main__': main(sys.argv[1])
