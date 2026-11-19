#!/usr/bin/env python3
"""R1244c: Dots CX-0178CN 2차분 → assets/r1244/
- 베기 7종(slash-<형상>.webp): 투명 PNG 2048×384(4×3, 칸 512×128) 그대로, 알파 유지.
- 임팩트 10종(impact-<형상>.webp): 1280×720 흰 바탕 흑백 → 반전(검은 바탕 흰 먹, 영상의 반전 임팩트),
  회색 줄이기(대비 끌어올림), 머리 위 여백 8% 더함(그림을 92% 로 줄여 아래 가운데 정렬). 바탕이 검정이라 따로 빼지 않고 CSS 에서 screen 섞기.
- 눈(헌터·기억사수)은 scripts/r1244-eye-dots.py <이 폴더> 로 만든다.
원본: 아래 입력표(형상마다 쓸 판·폴더). R1244c-2: Dots r2 — 미카엘라(확정 복장)·네온·서하 임팩트 r2, 서하 베기 r2.
헌터 임팩트 r2 는 가슴 노출이 있어 15세 기준을 지키려고 r1 을 그대로 씀(Dots 에 다시 요청)."""
import sys,os
from PIL import Image,ImageOps
D='/mnt/project-files/dots-results/'
# 입력표: 형상 → (폴더, 판)
SLASH_IN={f:('cx0178cn-r2','r1') for f in ['gunner','hunter','lauren','michaela','neon','persona','slayer']}
SLASH_IN['seoha']=('cx0178cn-r3','r2')
IMPACT_IN={f:('cx0178cn-r2','r1') for f in ['ego','gunner','hunter','hwando','lauren','persona','slayer']}
IMPACT_IN.update({'michaela':('cx0178cn-r3','r2'),'neon':('cx0178cn-r3','r2'),'seoha':('cx0178cn-r3','r2')})
SRC=lambda d,kind,f,v:os.path.join(sys.argv[1] if len(sys.argv)>1 else D,d,f'CX-0178CN-{kind}_{f}_{v}_ROUGH.png')
OUT=os.path.join(os.path.dirname(__file__),'..','r96','runtime-text','assets','r1244')
os.makedirs(OUT,exist_ok=True)
for f,(d,v) in sorted(SLASH_IN.items()):
    im=Image.open(SRC(d,'slash',f,v)).convert('RGBA')
    assert im.size==(2048,384),(f,im.size)
    p=os.path.join(OUT,f'slash-{f}.webp');im.save(p,'WEBP',quality=82,method=6);print('slash',f,os.path.getsize(p))
for f,(d,v) in sorted(IMPACT_IN.items()):
    im=Image.open(SRC(d,'impact',f,v)).convert('L')
    assert im.size==(1280,720),(f,im.size)
    im=ImageOps.invert(im)
    im=im.point(lambda v:0 if v<56 else 255 if v>200 else int((v-56)*255/144))  # 회색 줄이기
    s=im.resize((int(1280*.92),int(720*.92)),Image.LANCZOS)
    c=Image.new('L',(1280,720),0);c.paste(s,((1280-s.width)//2,720-s.height))
    p=os.path.join(OUT,f'impact-{f}.webp');c.save(p,'WEBP',quality=72,method=6);print('impact',f,os.path.getsize(p))
