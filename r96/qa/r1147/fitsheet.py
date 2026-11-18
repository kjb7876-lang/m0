# R1147 Dots CX-0142BI 대기 6칸 시트(이미 게임 칸 크기) → 게임 원본 p4 와 같은 자리·같은 색으로 맞춘 webp.
# 사용: python -I fitsheet.py <dots.png> <source p4.webp> <out.webp>
#  · 세로: 발 줄(보이는 맨 아래 줄)을 원본과 같게. 가로: 1번 칸을 원본 p4 와 겹쳐 색 차이가 가장 작은 자리(±40px)로.
#    대기 ↔ 공격 열쇠 자세(p1~p3, p4 와 같은 자리)로 바뀔 때 몸이 옆으로 튀지 않게 하려는 것(발록은 Dots 판이 27px 옆에 있었다).
#  · 모든 칸을 같은 양만큼 옮긴다(칸끼리 흔들림 없음). 옮겨서 칸 밖으로 나가는 망토 끝은 칸 가장자리 8px 에서 부드럽게 사라지게.
#  · 색: 보이는 화소 평균 RGB 비율로 채널별 곱. 알파 16 이하 0.
import sys,json
import numpy as np
from PIL import Image
raw,srcp,out=sys.argv[1:4]
src=np.array(Image.open(srcp).convert('RGBA')).astype(np.float32);H,W=src.shape[:2]
sh=np.array(Image.open(raw).convert('RGBA')).astype(np.float32);n=sh.shape[1]//W;assert sh.shape[:2]==(H,W*n),(sh.shape,W,H)
foot=lambda a:np.nonzero((a[...,3]>16).any(1))[0].max()
f0=sh[:,:W];dy=int(foot(src)-foot(f0))
def shift(a,dx,dy):
    o=np.zeros_like(a);ys=slice(max(0,dy),H+min(0,dy));yd=slice(max(0,-dy),H+min(0,-dy));xs=slice(max(0,dx),W+min(0,dx));xd=slice(max(0,-dx),W+min(0,-dx));o[ys,xs]=a[yd,xd];return o
pm=lambda a:a[...,:3]*a[...,3:]/255
best=None
for dx in range(-40,41):
    g=shift(f0,dx,dy);m=(src[...,3]>16)|(g[...,3]>16);e=float(np.abs(pm(src)-pm(g)).sum(-1)[m].mean())
    if best is None or e<best[0]:best=(e,dx)
dx=best[1]
ramp=np.ones((H,W),np.float32);E=8
for i in range(E):
    v=i/E;ramp[i,:]=np.minimum(ramp[i,:],v);ramp[H-1-i,:]=np.minimum(ramp[H-1-i,:],v);ramp[:,i]=np.minimum(ramp[:,i],v);ramp[:,W-1-i]=np.minimum(ramp[:,W-1-i],v)
cells=[]
for i in range(n):
    c=shift(sh[:,i*W:(i+1)*W],dx,dy);c[...,3]*=ramp;cells.append(c)
o=np.concatenate(cells,1)
vis=lambda a:a[a[...,3]>16][:,:3].mean(0)
g=vis(src)/np.maximum(1e-6,vis(o));o[...,:3]=np.clip(np.round(o[...,:3]*g),0,255);o[...,3]=np.round(o[...,3]);o[...,3]=np.where(o[...,3]<=16,0,o[...,3])
Image.fromarray(o.astype(np.uint8),'RGBA').save(out,quality=90,method=6,alpha_quality=100,alpha_filter=0)
chk=np.array(Image.open(out).convert('RGBA')).astype(np.float32)
print(json.dumps({'cell':[W,H],'n':n,'shift':[dx,dy],'fit_err':round(best[0],1),'gain':[round(float(x),3) for x in g],'rgb_src':[round(float(x),1) for x in vis(src)],'rgb_out':[round(float(x),1) for x in vis(chk)]}))
