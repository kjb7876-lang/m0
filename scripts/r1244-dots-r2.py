#!/usr/bin/env python3
"""R1244c: Dots CX-0178CN 2차분 → assets/r1244/
- 베기 7종(slash-<형상>.webp): 투명 PNG 2048×384(4×3, 칸 512×128) 그대로, 알파 유지.
- 임팩트 10종(impact-<형상>.webp): 1280×720 흰 바탕 흑백 → 반전(검은 바탕 흰 먹, 영상의 반전 임팩트),
  회색 줄이기(대비 끌어올림), 머리 위 여백 8% 더함(그림을 92% 로 줄여 아래 가운데 정렬). 바탕이 검정이라 따로 빼지 않고 CSS 에서 screen 섞기.
- 눈(헌터·기억사수)은 scripts/r1244-eye-dots.py <이 폴더> 로 만든다.
원본: /mnt/project-files/dots-results/cx0178cn-r2/"""
import sys,os
from PIL import Image,ImageOps
SRC=sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/dots-results/cx0178cn-r2'
OUT=os.path.join(os.path.dirname(__file__),'..','r96','runtime-text','assets','r1244')
os.makedirs(OUT,exist_ok=True)
for f in ['gunner','hunter','lauren','michaela','neon','persona','slayer']:
    im=Image.open(os.path.join(SRC,f'CX-0178CN-slash_{f}_r1_ROUGH.png')).convert('RGBA')
    assert im.size==(2048,384),(f,im.size)
    p=os.path.join(OUT,f'slash-{f}.webp');im.save(p,'WEBP',quality=82,method=6);print('slash',f,os.path.getsize(p))
for f in ['ego','gunner','hunter','hwando','lauren','michaela','neon','persona','seoha','slayer']:
    im=Image.open(os.path.join(SRC,f'CX-0178CN-impact_{f}_r1_ROUGH.png')).convert('L')
    assert im.size==(1280,720),(f,im.size)
    im=ImageOps.invert(im)
    im=im.point(lambda v:0 if v<56 else 255 if v>200 else int((v-56)*255/144))  # 회색 줄이기
    s=im.resize((int(1280*.92),int(720*.92)),Image.LANCZOS)
    c=Image.new('L',(1280,720),0);c.paste(s,((1280-s.width)//2,720-s.height))
    p=os.path.join(OUT,f'impact-{f}.webp');c.save(p,'WEBP',quality=72,method=6);print('impact',f,os.path.getsize(p))
