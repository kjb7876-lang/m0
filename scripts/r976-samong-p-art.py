#!/usr/bin/env python3
"""R976: 사몽 첫 지역(P '주인 없는 자장가')의 도트(pixelfx)·코드 그림 대신 쓸 칠한 그림을 저장소 안의 기존 칠한 자산에서 만든다.
원본은 읽기만 한다(assets/r411/fx 드라이브 core24 시트, assets/r430/tendril.webp). 결과는 assets/r976/*.webp + index.json.
  tendrils-blood.webp : R411 boss-tentacle-bind(보라 촉수 24장)를 핏빛으로 물들임 — pixelfx tendrils-blood 대신
  portal-teal.webp    : R411 boss-gravity-well 6~12번 7장(소용돌이가 가장 큰 구간)을 청록으로 — pixelfx portal-teal 대신(반복)
  root-tendril.webp   : R430 촉수 5번 칸 한 장을 검붉게 — 코드로 칠하던 '검은 뿌리' 장식 대신
  ash-flakes.webp     : R411 boss-meteor 12~17번 칸에서 떨어져 날리는 작은 불티 조각 8개(윗줄) + 같은 조각을 잿빛으로(아랫줄) — 화면에 원으로 찍던 재·불티 점 대신
사용: python3 scripts/r976-samong-p-art.py <site 또는 원본 assets 상위 경로> <출력 assets/r976 경로>"""
import sys,json,hashlib
from pathlib import Path
import numpy as np
from PIL import Image
SRC=Path(sys.argv[1]);OUT=Path(sys.argv[2]);OUT.mkdir(parents=True,exist_ok=True)
def rgb2hsv(a):
    r,g,b=a[...,0],a[...,1],a[...,2];mx=a[...,:3].max(-1);mn=a[...,:3].min(-1);d=mx-mn+1e-6
    h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))/6;s=np.where(mx>0,d/(mx+1e-6),0);return h,s,mx
def hsv2rgb(h,s,v):
    i=np.floor(h*6)%6;f=h*6-np.floor(h*6);p=v*(1-s);q=v*(1-f*s);t=v*(1-(1-f)*s)
    r=np.choose(i.astype(int),[v,q,p,p,t,v]);g=np.choose(i.astype(int),[t,v,v,q,p,p]);b=np.choose(i.astype(int),[p,p,t,v,v,q]);return np.stack([r,g,b],-1)
def recolor(im,hue,sat=1.0,val=1.0):
    a=np.asarray(im.convert('RGBA')).astype(np.float32)/255;h,s,v=rgb2hsv(a);out=hsv2rgb(np.full_like(h,hue),np.clip(s*sat,0,1),np.clip(v*val,0,1))
    return Image.fromarray((np.dstack([out,a[...,3]])*255+.5).clip(0,255).astype(np.uint8),'RGBA')
def save(im,name,q=86):
    p=OUT/name;im.save(p,'WEBP',quality=q,method=6);b=p.read_bytes();return {'file':name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'size':list(im.size)}
fx=SRC/'assets/r411/fx';idx={'revision':'R976','generator':'scripts/r976-samong-p-art.py','files':{}}
# 1 촉수: 보라 → 핏빛(색상 .99, 채도 1.1, 밝기 .9)
t=Image.open(fx/'boss-tentacle-bind.webp');idx['files']['tendrils-blood']=dict(save(recolor(t,.985,1.15,.88),'tendrils-blood.webp'),source='assets/r411/fx/boss-tentacle-bind.webp',frame=[256,256],columns=6,frames=24,pivot=[128,200])
# 2 문: 소용돌이가 가장 큰 6~12번 칸 → 청록 7장(한 줄, 반복)
g=Image.open(fx/'boss-gravity-well.webp').convert('RGBA');sheet=Image.new('RGBA',(256*7,256))
for i,fr in enumerate(range(6,13)):
    c=g.crop(((fr%6)*256,(fr//6)*256,(fr%6)*256+256,(fr//6)*256+256));sheet.alpha_composite(c,(i*256,0))
idx['files']['portal-teal']=dict(save(recolor(sheet,.48,1.6,.95),'portal-teal.webp'),source='assets/r411/fx/boss-gravity-well.webp 6-12',frame=[256,256],columns=7,frames=7,pivot=[128,150])
# 3 뿌리 장식: R430 촉수 5번 칸(192x192 6x4) → 검붉게
r=Image.open(SRC/'assets/r430/tendril.webp').convert('RGBA');cw,ch=r.size[0]//6,r.size[1]//4;cell=r.crop((5*cw,0,6*cw,ch));bb=cell.getbbox();cell=cell.crop(bb)
idx['files']['root-tendril']=dict(save(recolor(cell,.99,.75,.42),'root-tendril.webp'),source='assets/r430/tendril.webp cell 5')
# 4 재·불티: 운석 12~17번 칸에서 떨어진 작은 조각(연결 요소 6~26px) 8개 → 32px 칸
from collections import deque
m=Image.open(fx/'boss-meteor.webp').convert('RGBA');flakes=[]
for fr in range(12,18):
    c=np.asarray(m.crop(((fr%6)*256,(fr//6)*256,(fr%6)*256+256,(fr//6)*256+256)));A=c[...,3]>40;seen=np.zeros_like(A)
    for y in range(256):
        for x in range(256):
            if A[y,x] and not seen[y,x]:
                q=deque([(y,x)]);seen[y,x]=1;pts=[]
                while q:
                    yy,xx=q.popleft();pts.append((yy,xx))
                    for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
                        ny,nx=yy+dy,xx+dx
                        if 0<=ny<256 and 0<=nx<256 and A[ny,nx] and not seen[ny,nx]:seen[ny,nx]=1;q.append((ny,nx))
                ys=[p[0] for p in pts];xs=[p[1] for p in pts];h=max(ys)-min(ys)+1;w=max(xs)-min(xs)+1
                if 5<=h<=24 and 5<=w<=24 and len(pts)>=18:flakes.append((len(pts),fr,min(xs)-3,min(ys)-3,w+6,h+6))
flakes.sort(key=lambda f:-f[0]);atlas=Image.new('RGBA',(32*8,64));used=0
for n,fr,x,y,w,h in flakes:
    if used>=8:break
    c=m.crop(((fr%6)*256+x,(fr//6)*256+y,(fr%6)*256+x+w,(fr//6)*256+y+h));s=min(1,28/max(w,h));c=c.resize((max(1,round(w*s)),max(1,round(h*s))),Image.LANCZOS)
    atlas.alpha_composite(c,(used*32+(32-c.size[0])//2,(32-c.size[1])//2));used+=1
assert used==8,used
ash=recolor(atlas.crop((0,0,256,32)),.08,.12,.75);atlas.alpha_composite(ash,(0,32))  # 아랫줄: 잿빛(불기 뺀) 재
idx['files']['ash-flakes']=dict(save(atlas,'ash-flakes.webp',90),source='assets/r411/fx/boss-meteor.webp 12-17',frame=[32,32],columns=8,frames=16,rows={'ember':0,'ash':1})
(OUT/'index.json').write_text(json.dumps(idx,ensure_ascii=False,indent=1)+'\n');print(json.dumps(idx,ensure_ascii=False))
