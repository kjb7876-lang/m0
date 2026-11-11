#!/usr/bin/env python3
"""R792: 서사 NPC Dots 시트(CX-0072NP 앳된 남자, CX-0073SN 의료진·의목사) → 게임용 파생본.
원본(프로젝트 파일의 손질본 PNG)은 그대로 두고 새 webp 로 쓴다.
 - 시트: 칸 384, 칸마다 발(아래 18줄) 무게중심을 x=192 로 맞춘다(내미는 동작 시트는 팔 때문에 몸이 칸 안에서 밀려 있다).
 - 게임 색 보정이 그림을 어둡게 누르므로 밝기·대비를 조금 올린다(R790 과 같은 까닭).
사용: python3 scripts/r792-npc-sheets.py <bulmyeongwi-art/cx0072np-dots-cleaned> <story-npc-art/cx0073sn-dots-cleaned>"""
import sys, os, hashlib
from PIL import Image, ImageEnhance
OUT = 'r96/runtime-text/assets/r790/npc'
CELL, FOOT_X, FOOT_Y = 384, 192, 352

def tone(im, b, c):
    a = im.getchannel('A'); rgb = ImageEnhance.Contrast(ImageEnhance.Brightness(im.convert('RGB')).enhance(b)).enhance(c)
    rgb.putalpha(a); return rgb

def foot_shift(cell):
    a = cell.getchannel('A'); box = a.getbbox()
    if not box: return 0
    strip = a.crop((0, box[3] - 18, CELL, box[3])); px = strip.load(); sx = n = 0
    for y in range(strip.height):
        for x in range(CELL):
            if px[x, y] > 16: sx += x; n += 1
    return round(FOOT_X - sx / n) if n else 0

def sheet(src, dst, b=1.2, c=1.05, align=True):
    im = Image.open(src).convert('RGBA'); n = im.width // CELL; assert im.size == (CELL * n, CELL), im.size
    out = Image.new('RGBA', im.size, (0, 0, 0, 0)); shifts = []
    for i in range(n):
        cell = im.crop((i * CELL, 0, (i + 1) * CELL, CELL)); dx = foot_shift(cell) if align else 0; shifts.append(dx)
        moved = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0)); moved.paste(cell, (dx, 0)); out.paste(moved, (i * CELL, 0))
    out = tone(out, b, c); out.save(os.path.join(OUT, dst), 'WEBP', quality=92, method=6)
    return shifts

def bust(src, dst, size=512, b=1.08, c=1.03):
    im = Image.open(src).convert('RGBA')
    if im.size != (size, size): im = im.resize((size, size), Image.LANCZOS)
    tone(im, b, c).save(os.path.join(OUT, dst), 'WEBP', quality=90, method=6)

def main():
    y, s = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
    jobs = [('sheet', y, 'CX-0072NP_npc_youth_idle6_r1_c1.png', 'youth-idle6.webp'), ('sheet', y, 'CX-0072NP_npc_youth_offer6_r2_c1.png', 'youth-offer6.webp'),
            ('bust', y, 'CX-0072NP_npc_youth_bust_r1_c1.png', 'youth-bust-d.webp'),
            ('sheet', s, 'CX-0073SN_01_idle6_r1_c1.png', 'medic-idle6.webp'), ('bust', s, 'CX-0073SN_01_bust_r1_c1.png', 'medic-bust.webp'),
            ('sheet', s, 'CX-0073SN_02_idle6_r1_c1.png', 'physician-idle6.webp'), ('bust', s, 'CX-0073SN_02_bust_r1_c1.png', 'physician-bust.webp'),
            # R793: 서윤(ep1b05)
            ('sheet', s, 'CX-0073SN_03_idle6_r1_c1.png', 'seoyun-idle6.webp'), ('bust', s, 'CX-0073SN_03_bust_r1_c1.png', 'seoyun-bust.webp')]
    for kind, d, a, b in jobs:
        src = os.path.join(d, a); r = sheet(src, b, align='physician' not in b) if kind == 'sheet' else bust(src, b)
        print(a, hashlib.sha256(open(src, 'rb').read()).hexdigest()[:8], os.path.getsize(src), '→', b, os.path.getsize(os.path.join(OUT, b)), r or '')

main()
