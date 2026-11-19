#!/usr/bin/env python3
"""R1241 — 제72문 보스 '72 그림자 소환' 프레임 시트 만들기(이미지 처리, 원본은 건드리지 않음).
 1) shadow-rise12.webp : 192x256 칸 12개(가로 한 줄). 0~5 = 땅 밑에서 솟아오름, 6~11 = 무너져 땅으로 가라앉음.
    원천: r1166 md-01-ghost-patient-death.webp(5자세: 서기→웅크림→누움→흩어짐) — 먹빛 검은 그림자로 다시 칠함.
 2) shadow-seal8.webp  : 256x256 칸 8개. 원천: Dots r1213 bomb-warning8.webp(먹 고리가 감겨 닫힘) — 먹+검보라로 다시 칠함.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
A=Path(__file__).resolve().parents[1]/'r96/runtime-text/assets'
OUT=A/'r1241'; OUT.mkdir(exist_ok=True)
src=Image.open(A/'r1166/mobs/md-01-ghost-patient-death.webp').convert('RGBA')
SEGS=[(76,258),(386,575),(699,888),(1013,1199),(1332,1506)]
def pose(i):
    x0,x1=SEGS[i]; im=src.crop((x0-6,0,x1+7,src.height)); bb=im.getbbox(); return im.crop(bb)
def ink(im):
    a=np.array(im).astype(np.float32); lum=(a[...,0]*.3+a[...,1]*.59+a[...,2]*.11)/255
    out=np.zeros_like(a)
    # 먹 그림자: 거의 검정, 옷 주름만 아주 어두운 회보라로 남긴다
    out[...,0]=10+lum*34; out[...,1]=8+lum*26; out[...,2]=14+lum*40
    out[...,3]=np.clip(a[...,3]*1.05,0,255)
    o=Image.fromarray(out.astype(np.uint8),'RGBA')
    # 먹 번짐 테(바깥 연기)
    al=o.split()[3].filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(4))
    halo=Image.new('RGBA',o.size,(6,4,10,0)); halo.putalpha(al.point(lambda v:int(v*.42)))
    halo.alpha_composite(o); return halo
CW,CH,GROUND=192,256,246
SC=230/max(pose(0).height,1)
P=[ink(pose(i)) for i in range(5)]
P=[p.resize((max(1,int(p.width*SC)),max(1,int(p.height*SC))),Image.LANCZOS) for p in P]
def cell(p,reveal=1.0,alpha=1.0):
    c=Image.new('RGBA',(CW,CH),(0,0,0,0))
    if p.width>CW: p=p.resize((CW,int(p.height*CW/p.width)),Image.LANCZOS)
    x=(CW-p.width)//2; y=GROUND-p.height+int((1-reveal)*p.height)
    layer=Image.new('RGBA',(CW,CH),(0,0,0,0)); layer.alpha_composite(p,(x,max(-p.height,y)) if y>=0 else (x,0)) if y>=0 else layer.alpha_composite(p.crop((0,-y,p.width,p.height)),(x,0))
    # 땅 아래(GROUND 밑) 지우기 + 땅 경계 6px 부드럽게
    m=np.array(layer); ys=np.arange(CH)[:,None]
    fade=np.clip((GROUND+2-ys)/6,0,1); m[...,3]=(m[...,3]*fade*alpha).astype(np.uint8)
    c.alpha_composite(Image.fromarray(m,'RGBA')); return c
frames=[cell(P[0],r,al) for r,al in [(.12,.55),(.32,.75),(.55,.9),(.78,1),(.94,1),(1,1)]]
frames+=[cell(P[1]),cell(P[2]),cell(P[3]),cell(P[3],.72,.9),cell(P[4],.5,.7),cell(P[4],.22,.4)]
sheet=Image.new('RGBA',(CW*12,CH),(0,0,0,0))
for i,f in enumerate(frames): sheet.alpha_composite(f,(i*CW,0))
sheet.save(OUT/'shadow-rise12.webp','WEBP',quality=88,method=6)
w=Image.open(A/'r1213/bomb-warning8.webp').convert('RGBA'); a=np.array(w).astype(np.float32)
lum=(a[...,0]*.3+a[...,1]*.59+a[...,2]*.11)/255
o=np.zeros_like(a); k=np.clip((lum-.25)/.6,0,1)
# 어두운 먹 테 → 먹검정, 밝은 안쪽 물빛 → 검보라·검붉은 기운(주황 금지 #712)
o[...,0]=8+k*84; o[...,1]=6+k*20; o[...,2]=12+k*62; o[...,3]=a[...,3]
Image.fromarray(o.astype(np.uint8),'RGBA').save(OUT/'shadow-seal8.webp','WEBP',quality=88,method=6)
# 3) shadow-burst12.webp: Dots r1213 ink-dispersal12 의 밝은 물빛 갈래가 게임 조명 아래 노랗게 떠 보임 → 먹·검보라로 다시 칠함
b=Image.open(A/'r1213/ink-dispersal12.webp').convert('RGBA');a=np.array(b).astype(np.float32)
lum=(a[...,0]*.3+a[...,1]*.59+a[...,2]*.11)/255;k=np.clip(lum,0,1);o=np.zeros_like(a)
o[...,0]=6+k*60;o[...,1]=4+k*14;o[...,2]=10+k*52;o[...,3]=a[...,3]
Image.fromarray(o.astype(np.uint8),'RGBA').save(OUT/'shadow-burst12.webp','WEBP',quality=88,method=6)
import json
json.dump({'shadow-rise12':{'frames':12,'cell':[CW,CH],'pivot':[CW//2,GROUND],'rise':[0,5],'sink':[6,11],'source':'assets/r1166/mobs/md-01-ghost-patient-death.webp','process':'ink recolor + ground reveal mask','final':False},
 'shadow-burst12':{'frames':12,'cell':[256,256],'source':'assets/r1213/ink-dispersal12.webp (Dots)','process':'ink+dark violet recolor','final':False},
 'shadow-seal8':{'frames':8,'cell':[256,256],'ringDiameterRatio':.68,'source':'assets/r1213/bomb-warning8.webp (Dots CX-0167RA r1)','process':'ink+dark violet recolor','final':False}},
 open(OUT/'index.json','w'),ensure_ascii=False,indent=1)
print('ok',sheet.size)
