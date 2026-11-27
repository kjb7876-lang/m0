#!/usr/bin/env python3
"""R1343 레비아탄 '유리 조각 폭풍' 시트 — Dots SW-3D-R1343 02a·02b·02c 납품본을 게임 경로로 옮긴다(그림은 바꾸지 않음).
 02a shard_fly8.webp (1024×128, 8칸, 기준점 62,64) → assets/r1343/shard-fly8.webp  바이트 그대로
 02c embed8.webp     (1280×160, 8칸, 기준점 80,132) → assets/r1343/embed8.webp     바이트 그대로
 02b burst12 모바일 두 장(2304×384 ×2, 1~6·7~12칸) → assets/r1343/burst12.webp 6열×2행 격자(2304×768, 무손실 WebP)
   — 4608 가로 한 줄은 모바일 GPU 4096 한도를 넘어 Dots 권장대로 나눈 본을 위아래로 붙인다(픽셀 그대로).
사용: python3 scripts/r1343-glass-sheets.py <Dots SW-R1343-02_glass_SKILLS 를 푼 폴더>
"""
import sys, shutil, hashlib
from pathlib import Path
from PIL import Image
SRC=Path(sys.argv[1]);OUT=Path(__file__).resolve().parents[1]/'r96/runtime-text/assets/r1343';OUT.mkdir(parents=True,exist_ok=True)
shutil.copyfile(SRC/'SW-R1343-02a_shard_fly8.webp',OUT/'shard-fly8.webp')
shutil.copyfile(SRC/'SW-R1343-02c_embed8.webp',OUT/'embed8.webp')
a=Image.open(SRC/'SW-R1343-02b_burst12_mobile_01-06.png').convert('RGBA');b=Image.open(SRC/'SW-R1343-02b_burst12_mobile_07-12.png').convert('RGBA')
assert a.size==b.size==(2304,384)
g=Image.new('RGBA',(2304,768),(0,0,0,0));g.paste(a,(0,0));g.paste(b,(0,384));g.save(OUT/'burst12.webp','WEBP',lossless=True,method=6)
for n in ('shard-fly8.webp','embed8.webp','burst12.webp'):
    p=OUT/n;print(n,Image.open(p).size,p.stat().st_size,hashlib.sha256(p.read_bytes()).hexdigest()[:16])
