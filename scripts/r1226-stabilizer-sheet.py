# R1226 안정화 집행체(ep1a08) 임시 시트: 병원 주제 원래 그림(assets/episode1a/hallucinated_orderly.webp)을 R248 시트 틀(256×320 칸, 4×3,
#  걷기 0-7·공격 8-11, 발 128,300)로 묶는다. 백의 구속자(같은 가면 잡역부 계열)와 구분되게 흰 가운을 수술복 청록 쪽으로 옮긴다.
#  최종 아트 아님 — Dots 걷기·공격 시트가 오면 바꾼다. 원본은 읽기만 한다.
import sys,colorsys
from pathlib import Path
from PIL import Image
import numpy as np
root=Path(__file__).resolve().parents[1]
src=root/'r96/hospital-three-pc/site/assets/episode1a/hallucinated_orderly.webp'
if not src.exists(): src=root/'r96/runtime-text/assets/episode1a/hallucinated_orderly.webp'
out=Path(sys.argv[1]) if len(sys.argv)>1 else root/'r96/runtime-text/assets/r1226/mobs/m015-stabilizer.webp'
im=Image.open(src).convert('RGBA');a=np.array(im).astype(float)
rgb=a[:,:,:3]/255;mx=rgb.max(2);mn=rgb.min(2);l=(mx+mn)/2;s=np.where(mx>mn,(mx-mn)/np.maximum(1e-6,1-np.abs(2*l-1)),0)
w=np.clip((l-.42)/.25,0,1)*np.clip((.35-s)/.25,0,1)   # 밝고 채도 낮은 곳(흰 가운)만
teal=np.array([.55,.72,.70])
rgb2=rgb*(1-w[...,None]*.55)+(teal*l[...,None]*1.25)*(w[...,None]*.55)
a[:,:,:3]=np.clip(rgb2,0,1)*255
im=Image.fromarray(a.astype('uint8'),'RGBA');bb=im.getbbox();im=im.crop(bb)
BODY=226;k=BODY/im.height;im=im.resize((max(1,round(im.width*k)),BODY),Image.LANCZOS)
sheet=Image.new('RGBA',(1024,960),(0,0,0,0))
def put(i,ang=0,dy=0,dx=0):
    c=im.rotate(ang,resample=Image.BICUBIC,expand=True,center=(im.width/2,im.height))
    col,row=i%4,i//4;x=col*256+128-c.width//2+dx;y=row*320+300-c.height+dy
    cell=Image.new('RGBA',(256,320),(0,0,0,0));cell.alpha_composite(c,(x-col*256,y-row*320)) if False else None
    tmp=Image.new('RGBA',(1024,960),(0,0,0,0));tmp.paste(c,(x,y),c)
    box=(col*256,row*320,col*256+256,row*320+320);sheet.alpha_composite(tmp.crop(box),box[:2])
for i,(ang,dy) in enumerate([(0,0),(1.2,-2),(0,-3),(-1.2,-2),(0,0),(1.2,-2),(0,-3),(-1.2,-2)]): put(i,ang,dy)
for j,(ang,dx) in enumerate([(-3,3),(4,-4),(8,-9),(3,-3)]): put(8+j,ang,0,dx)
out.parent.mkdir(parents=True,exist_ok=True);sheet.save(out,'WEBP',lossless=True,method=6);print(out,out.stat().st_size)
