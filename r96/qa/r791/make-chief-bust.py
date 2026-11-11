#!/usr/bin/env python3
"""R791: 고블린 두목 창 그림(흉상) 파생본. 원본(R99 clean GoblinFluteKing)은 그대로 두고 윗몸만 잘라 새 파일로 쓴다."""
from PIL import Image
SRC='r96/runtime-text/assets/r99/clean/assets/generated-v31224/actors-normalized/a43f2c5d3855_Monster_GoblinFluteKing.webp'
OUT='r96/runtime-text/assets/r790/npc/chief-bust.webp'
im=Image.open(SRC).convert('RGBA').crop((160,12,370,222)).resize((420,420),Image.LANCZOS)
im.save(OUT,'WEBP',quality=90,method=6)
print(OUT,im.size)
