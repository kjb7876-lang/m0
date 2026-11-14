#!/usr/bin/env python3
"""R843: 곁일 인물(R840~R842) 임시 그림 → Dots 그림(CX-0076QN 불면귀 마을, CX-0077SN 사몽·의목사A) 게임용 파생본.
원본(프로젝트 파일 dots-results/cx0098dn-npc, 7분야 이미지 심사 7.86~8.07)은 그대로 두고 새 webp 로 쓴다.
 - 서 있기 시트: 칸마다 발(아래 18줄) 무게중심을 칸 가운데로 맞춘다(R792 와 같은 방법). 발 높이는 Dots 기준선 그대로.
 - 게임 색 보정이 그림을 어둡게 누르므로 밝기·대비를 조금 올린다(R790·R792 와 같은 까닭).
 - 흉상·단서 아이콘·소품은 크기 그대로(흉상만 조금 밝게).
사용: python3 scripts/r843-npc-art.py <dots-results/cx0098dn-npc>"""
import sys, os, hashlib
from PIL import Image, ImageEnhance
OUT = 'r96/runtime-text/assets/r843'

def tone(im, b, c):
    a = im.getchannel('A'); rgb = ImageEnhance.Contrast(ImageEnhance.Brightness(im.convert('RGB')).enhance(b)).enhance(c)
    rgb.putalpha(a); return rgb

def foot_shift(cell, cx):
    a = cell.getchannel('A'); box = a.getbbox()
    if not box: return 0
    strip = a.crop((0, box[3] - 18, cell.width, box[3])); px = strip.load(); sx = n = 0
    for y in range(strip.height):
        for x in range(cell.width):
            if px[x, y] > 16: sx += x; n += 1
    return round(cx - sx / n) if n else 0

def sheet(src, dst, cell, b=1.2, c=1.05, align=True):
    im = Image.open(src).convert('RGBA'); n = im.width // cell; assert im.size == (cell * n, cell), im.size
    out = Image.new('RGBA', im.size, (0, 0, 0, 0)); shifts = []
    # 칸마다 따로 맞추면 숨쉬기가 떨린다 → 첫 칸의 어긋남 하나로 모든 칸을 같이 민다.
    dx = foot_shift(im.crop((0, 0, cell, cell)), cell // 2) if align else 0
    for i in range(n):
        piece = im.crop((i * cell, 0, (i + 1) * cell, cell)); moved = Image.new('RGBA', (cell, cell), (0, 0, 0, 0)); moved.paste(piece, (dx, 0)); out.paste(moved, (i * cell, 0)); shifts.append(dx)
    out = tone(out, b, c); out.save(os.path.join(OUT, dst), 'WEBP', quality=92, method=6)
    feet = [Image.open(os.path.join(OUT, dst)).crop((i * cell, 0, (i + 1) * cell, cell)).getchannel('A').getbbox()[3] for i in range(n)]
    return shifts[:1], feet

def still(src, dst, b=1.08, c=1.03, q=90):
    tone(Image.open(src).convert('RGBA'), b, c).save(os.path.join(OUT, dst), 'WEBP', quality=q, method=6)

def main():
    d = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
    jobs = [
        # CX-0076QN 불면귀 마을(R840 last302·303) — 칸 256
        ('sheet', 'qn1ai/CX-0076QN_1a_fisher_idle6_r1.png', 'fisher-idle6.webp', 256),
        ('sheet', 'qn1bi/CX-0076QN_1b_herbwife_idle6_r1.png', 'herbwife-idle6.webp', 256),
        ('still', 'qn1a/CX-0076QN_1a_fisher_bust_r1.png', 'fisher-bust.webp', 0),
        ('still', 'qn1b/CX-0076QN_1b_herbwife_bust_r1.png', 'herbwife-bust.webp', 0),
        ('aura', 'qn2a/CX-0076QN_2a_corrupted_aura_loop8_r1.png', 'aura-loop8.webp', 0),
        ('icon', 'qn3a/CX-0076QN_3a_cut_thread_red_talisman_r1.png', 'clue-talisman.webp', 0),
        ('icon', 'qn3b/CX-0076QN_3b_misty_lantern_shard_r1.png', 'clue-lantern.webp', 0),
        ('icon', 'qn3c/CX-0076QN_3c_dirty_signpost_shard_r1.png', 'clue-signpost.webp', 0),
        ('icon', 'qn3d/CX-0076QN_3d_cracked_sky_stone_r1.png', 'clue-skystone.webp', 0),
        # CX-0077SN 사몽·의목사A(R841·R842) — 칸 384
        ('sheet', 'sn1/CX-0077SN_N1_jihyun_idle6_r1_anchorcenter_v2.png', 'jihyeon-idle6.webp', 384),
        ('sheet', 'sn2/CX-0077SN_N2_barstaff_idle6_r1.png', 'barstaff-idle6.webp', 384),
        ('sheet', 'sn3/CX-0077SN_N3_superior_idle6_r1_anchorcenter_v2.png', 'superior-idle6.webp', 384),
        ('sheet', 'sn4/CX-0077SN_N4_nurse_idle6_r1.png', 'nurse-idle6.webp', 384),
        ('sheet', 'sn5/CX-0077SN_N5_doctor_idle6_r1.png', 'doctor-idle6.webp', 384),
        ('sheet', 'sn6/CX-0077SN_N6_medical_support_idle6_r1.png', 'her-seated-idle6.webp', 384),
        ('sheet', 'sn7/CX-0077SN_N7_resistance_idle6_r1.png', 'garrison-idle6.webp', 384),
        ('sheet', 'sn10/CX-0077SN_N10_young_self_idle6_r1.png', 'young-self-idle6.webp', 384),
        ('still', 'snp1/CX-0077SN_P1_newspaper_stack_stand_r1.png', 'extra-newspaper.webp', 0),
    ]
    for kind, a, b, cell in jobs:
        src = os.path.join(d, a)
        if kind == 'sheet': r = sheet(src, b, cell)
        elif kind == 'aura': im = Image.open(src).convert('RGBA'); im.save(os.path.join(OUT, b), 'WEBP', quality=90, method=6); r = im.size
        elif kind == 'icon': still(src, b, 1.1, 1.04, 92); r = ''
        else: still(src, b); r = ''
        print(a, hashlib.sha256(open(src, 'rb').read()).hexdigest(), os.path.getsize(src), '→', b, os.path.getsize(os.path.join(OUT, b)), r)

main()
