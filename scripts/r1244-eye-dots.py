#!/usr/bin/env python3
"""R1244b: Dots CX-0178CN 눈 클로즈업(4칸) → assets/r1244/eye-<형상>.webp (2×2, 칸 1280×320).
원본: /mnt/project-files/dots-results/cx0178cn-r1/ (두 줄로 나뉜 파일은 row0·row1 을 위아래로 붙임).
손질: 환도는 먹+흰 규칙대로 완전 흑백. 나머지는 그대로(크기만 줄임)."""
import sys,os,glob
from PIL import Image
SRC=sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/dots-results/cx0178cn-r1'
OUT=os.path.join(os.path.dirname(__file__),'..','r96','runtime-text','assets','r1244')
CW,CH=1280,320
os.makedirs(OUT,exist_ok=True)
for form in ['ego','hwando','lauren','michaela','neon','persona','seoha','slayer','hunter','gunner']:
    one=os.path.join(SRC,f'CX-0178CN-eye_{form}_r1_ROUGH.png')
    r0=os.path.join(SRC,f'CX-0178CN-eye_{form}_r1_ROUGH_row0.png')
    if os.path.exists(one):im=Image.open(one).convert('RGB')
    elif os.path.exists(r0):
        a=Image.open(r0).convert('RGB');b=Image.open(r0.replace('row0','row1')).convert('RGB')
        im=Image.new('RGB',(a.width,a.height+b.height));im.paste(a,(0,0));im.paste(b,(0,a.height))
    else:print('없음',form);continue
    assert im.size==(3072,768),(form,im.size)
    if form=='hwando':im=im.convert('L').convert('RGB')
    im=im.resize((CW*2,CH*2),Image.LANCZOS)
    p=os.path.join(OUT,f'eye-{form}.webp');im.save(p,'WEBP',quality=80,method=6)
    print(form,p,os.path.getsize(p))
