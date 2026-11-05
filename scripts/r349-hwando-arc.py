#!/usr/bin/env python3
"""R349 환도 기본 공격 호(弧) — 원의 한 조각처럼 좌우 대칭인 ')' 모양(오른쪽으로 볼록).
게임은 이 그림을 적 쪽 화면 각도로 돌려 그린다(오른쪽 ')', 왼쪽 '(', 위·아래는 각도만 틀어짐).
색은 원래 hwando-a.webp(은빛·연보라)에서 뽑는다. 결과: r96/runtime-text/assets/r349/hwando-arc.webp (256×256 RGBA)."""
import math, sys, numpy as np
from pathlib import Path
from PIL import Image, ImageFilter
root=Path(__file__).resolve().parents[1]
# 원본 hwando-a.webp 는 빌드가 기반 묶음에서 풀어 site 에 둔다(저장소에는 없음) — 색만 읽는다
cand=[Path(sys.argv[1])] if len(sys.argv)>1 else []
cand+=[root/'r96/hospital-three-pc/site/assets/vfx/heroes/hwando-a.webp']
src=Image.open(next(c for c in cand if c.exists())).convert('RGBA')
a=np.array(src).astype(float);m=a[...,3]>200
core=a[...,:3][m&(a[...,:3].mean(-1)>200)].mean(0);edge=a[...,:3][m&(a[...,:3].mean(-1)<170)&(a[...,:3].mean(-1)>90)].mean(0)
N=256;S=4;W=N*S;yy,xx=np.mgrid[0:W,0:W].astype(float)/S
cx,cy,R=70.0,128.0,118.0          # 원 중심은 왼쪽 밖, 호는 오른쪽으로 볼록
dx,dy=xx-cx,yy-cy;r=np.hypot(dx,dy);th=np.arctan2(dy,dx)
span=math.radians(62)
u=np.clip(1-np.abs(th)/span,0,1)  # 가운데 1 → 끝 0
thick=3.0+24.0*np.sin(u*math.pi/2)**1.4
d=np.abs(r-R)
band=np.clip(1-d/np.maximum(thick,1e-3),0,1)*(u>0)
inner=np.clip(1-(d/np.maximum(thick*.38,1e-3)),0,1)*(u>0)
alpha=np.clip(band**1.3*.95+inner*.6,0,1)
mix=np.clip(inner*1.2,0,1)[...,None]
rgb=edge*(1-mix)+core*mix
img=np.zeros((W,W,4));img[...,:3]=rgb;img[...,3]=alpha*255
big=Image.fromarray(img.clip(0,255).astype('uint8'),'RGBA')
small=big.resize((N,N),Image.LANCZOS)
glow=small.filter(ImageFilter.GaussianBlur(7));g=np.array(glow).astype(float);g[...,3]*=.7
out=Image.alpha_composite(Image.fromarray(g.clip(0,255).astype('uint8'),'RGBA'),small)
# 칼바람 잔결: 호를 따라 가는 가는 줄 몇 개
o=np.array(out).astype(float);rng=np.random.default_rng(7)
for k in range(9):
  rr=R+rng.uniform(-16,16);sp=math.radians(rng.uniform(25,55));ph=rng.uniform(-.3,.3)
  for t in np.linspace(-sp,sp,240):
    x=cx+rr*math.cos(t+ph);y=cy+rr*math.sin(t+ph);xi,yi=int(x),int(y)
    if 0<=xi<N and 0<=yi<N:
      w=(1-abs(t)/sp)*.55
      o[yi,xi,:3]=o[yi,xi,:3]*(1-w)+core*w;o[yi,xi,3]=max(o[yi,xi,3],255*w*.8)
out=Image.fromarray(o.clip(0,255).astype('uint8'),'RGBA')
dst=root/'r96/runtime-text/assets/r349/hwando-arc.webp';out.save(dst,'WEBP',lossless=True)
print(dst,out.size,'core',core.round(),'edge',edge.round())
# R349c: hando-final-r49 렌더러는 그림을 (방향 − 180°)로 돌려 그린다(baked=π). 그 렌더러에 줄 파생본 두 장:
#  · hwando-arc-r49.webp  = 위 대칭 호를 180° 돌린 '(' — R49 가 돌리면 적 쪽으로 볼록한 ')'
#  · hwando-a-r49.webp    = 원래 베기를 시계 방향 66° 돌린 것 — R49 가 돌리면 볼록한 쪽(그림 안 114°)이 적을 향함
arc=Image.open(dst).convert('RGBA');arc.rotate(180,resample=Image.BICUBIC).save(root/'r96/runtime-text/assets/r349/hwando-arc-r49.webp','WEBP',lossless=True)
src.rotate(-66,resample=Image.BICUBIC).save(root/'r96/runtime-text/assets/r349/hwando-a-r49.webp','WEBP',lossless=True)
print('r49 variants written')
