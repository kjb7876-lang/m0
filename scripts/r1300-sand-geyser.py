#!/usr/bin/env python3
"""R1300 붕괴 의식장 보스방 기둥 — 검은 모래 솟구침 프레임 시트.
원본: 드라이브 'kair10-black-sand-column-v1-runtime512.png'(2026-11-02, 붕괴 의식장 검은 모래 기둥 정지 참고 그림, 투명 배경) 사본
      scripts/r1300/kair10-black-sand-column-v1-runtime512.png
처리: 그림 자체를 쓰고(코드로 그린 선·원 없음) 모래 결을 위로 흘려 12프레임 루프를 만든다.
      · 결: 원본 기둥 몸통의 빽빽한 구간을 이음새 없는 세로 띠로 만들어 프레임마다 1/12 씩 위로 흘림(루프) + 높이에 따라 좌우로 살짝 휘감음
      · 모양: 원본 실루엣(조금 부풀림)을 그대로 틀로 써서 기둥 모양은 유지, 밑동(기둥 머리)과 꼭대기(하늘)는 옅게 사라짐
출력: r96/runtime-text/assets/r1300/sand-geyser.webp (칸 192×384, 6열×2행, 12프레임)
"""
import sys, numpy as np
from PIL import Image, ImageFilter
SRC='scripts/r1300/kair10-black-sand-column-v1-runtime512.png'
OUT='r96/runtime-text/assets/r1300/sand-geyser.webp'
N,COLS,CW,CH=12,6,192,384
im=Image.open(SRC).convert('RGBA')
a=np.array(im)
ys,xs=np.where(a[:,:,3]>8)
x0,x1,y0,y1=xs.min()-8,xs.max()+9,max(0,ys.min()-4),min(a.shape[0],ys.max()+5)
crop=im.crop((x0,y0,x1,y1))
crop=crop.resize((CW,CH),Image.LANCZOS)
c=np.array(crop).astype(np.float32)
mask=np.array(crop.split()[3].filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(5))).astype(np.float32)/255
yy=np.arange(CH)[:,None].astype(np.float32);xx=np.arange(CW)[None,:].astype(np.float32)
fade=np.clip((CH-1-yy)/(CH*.07),0,1)*np.clip(yy/(CH*.2),0,1)
# 결 띠: 기둥 몸통 가운데(빽빽한 구간)를 잘라 위아래 끝을 겹쳐 이음새 없는 세로 띠로 만든다
a0=c[:,:,3]/255;cx=CW/2
r0,r1=int(CH*.18),int(CH*.70);band=c[r0:r1].copy();BH=band.shape[0];OV=int(BH*.25)
w=np.linspace(0,1,OV)[:,None,None]
band[:OV]=band[:OV]*w+band[BH-OV:]*(1-w);band=band[:BH-OV];BH=band.shape[0]
# 띠의 줄마다 폭(가운데 기준) — 줄 폭이 다른 곳에 옮겨 붙일 때 좌우로 늘이고 줄임
def half(al):
    xs=np.where(al>.15)[0];return max(6.0,(xs.max()-xs.min())/2) if len(xs) else 6.0
bw=np.median([half(band[i,:,3]/255) for i in range(BH)])
rw=np.array([half(mask[i]) for i in range(CH)])
sheet=Image.new('RGBA',(CW*COLS,CH*((N+COLS-1)//COLS)),(0,0,0,0))
for k in range(N):
    p=k/N
    sy=((yy+p*BH)%BH).astype(int).repeat(CW,1)          # 결이 위로 흐름(12프레임에 띠 한 바퀴)
    sw=5*np.sin(2*np.pi*(yy/150.0+p))*(1-yy/CH*.5)      # 휘감김
    sx=cx+(xx-cx+sw)*(bw/rw[:,None])
    ix=np.clip(np.rint(sx).astype(int),0,CW-1)
    t=band[sy,ix]
    alpha=mask*np.clip(.25+.95*t[:,:,3]/255,0,1)*fade*255
    rgb=t[:,:,:3]
    fr=np.dstack([np.clip(rgb,0,255),np.clip(alpha,0,255)]).astype(np.uint8)
    sheet.paste(Image.fromarray(fr,'RGBA'),((k%COLS)*CW,(k//COLS)*CH))
sheet.save(OUT,'WEBP',quality=88,method=6)
print(OUT,sheet.size)
