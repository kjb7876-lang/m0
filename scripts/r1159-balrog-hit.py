# R1159 발록(dist06) 피격 4칸 — Dots unified r2 HOLD(용암 주황이 게임 그림보다 밝음·몸이 작음)를 직접 손질.
#  · 크기: 4칸 공통 배율로 발 줄(y437) 고정 확대 → 1칸 키가 게임 대기(R1147 idle6) 키의 95%(맞는 순간 움츠림 몫 5%).
#  · 자리: 1칸 발 가운데(아래 60px)를 게임 대기 1칸 발 가운데에 맞춤, 모든 칸 같은 양.
#  · 색: 보이는 화소 채널별 평균·표준편차를 게임 대기 시트에 맞춤(밝은 용암 → 게임 쪽 어두운 적갈색). 알파 16 이하 0, 칸 가장자리 8px 부드럽게.
# 사용: python3 -I scripts/r1159-balrog-hit.py <dots hit r2.png> <game idle6.webp> <out.webp>
import sys,json
import numpy as np
from PIL import Image
raw,idlep,out=sys.argv[1:4];W,H=508,501
idle=np.array(Image.open(idlep).convert('RGBA')).astype(np.float32);i0=idle[:,:W]
sh=np.array(Image.open(raw).convert('RGBA')).astype(np.float32);n=sh.shape[1]//W;assert sh.shape[:2]==(H,W*n)
vis=lambda a:a[...,3]>16
def bbox(a):
    ys,xs=np.nonzero(vis(a));return ys.min(),ys.max(),xs.min(),xs.max()
it,ib,_,_=bbox(i0);t0,b0,l0,r0=bbox(sh[:,:W]);foot=ib
s=0.95*(ib-it+1)/(b0-t0+1)
def scale(c):
    cx=(l0+r0)/2;im=Image.fromarray(np.clip(c,0,255).astype(np.uint8),'RGBA')
    # 역변환: 출력 (x,y) ← 입력 (cx+(x-cx)/s, foot+(y-foot)/s)
    a=1/s;return np.array(im.transform((W,H),Image.AFFINE,(a,0,cx-cx*a,0,a,foot-foot*a),resample=Image.BICUBIC)).astype(np.float32)
cells=[scale(sh[:,i*W:(i+1)*W]) for i in range(n)]
# 발 줄 맞춤(세로)
dy=int(foot-bbox(cells[0])[1])
def shift(a,dx,dy):
    o=np.zeros_like(a);ys=slice(max(0,dy),H+min(0,dy));yd=slice(max(0,-dy),H+min(0,-dy));xs=slice(max(0,dx),W+min(0,dx));xd=slice(max(0,-dx),W+min(0,-dx));o[ys,xs]=a[yd,xd];return o
def footx(a):
    ys,xs=np.nonzero(vis(a));b=ys.max();return xs[ys>b-60].mean()
# 가로: 발 60px 줄 가운데를 게임 대기 1칸 발 가운데에 맞춤(색 겹침으로 찾으면 기울어진 피격 자세 때문에 몸이 옆으로 밀림)
best=(0.0,int(round(footx(i0)-footx(shift(cells[0],0,dy)))))
dx=best[1];ramp=np.ones((H,W),np.float32);E=8
for k in range(E):
    v=k/E;ramp[k,:]=np.minimum(ramp[k,:],v);ramp[H-1-k,:]=np.minimum(ramp[H-1-k,:],v);ramp[:,k]=np.minimum(ramp[:,k],v);ramp[:,W-1-k]=np.minimum(ramp[:,W-1-k],v)
cells=[shift(c,dx,dy) for c in cells]
for c in cells:c[...,3]*=ramp
o=np.concatenate(cells,1);m=vis(o);mi=vis(idle)
mu_o,sd_o=o[m][:,:3].mean(0),o[m][:,:3].std(0);mu_i,sd_i=idle[mi][:,:3].mean(0),idle[mi][:,:3].std(0)
o[...,:3]=np.clip((o[...,:3]-mu_o)/np.maximum(1e-6,sd_o)*sd_i+mu_i,0,255)
o[...,3]=np.where(o[...,3]<=16,0,np.round(o[...,3]));o[~vis(o)]=0
Image.fromarray(np.round(o).astype(np.uint8),'RGBA').save(out,quality=90,method=6,alpha_quality=100,alpha_filter=0)
chk=np.array(Image.open(out).convert('RGBA')).astype(np.float32);mc=vis(chk)
print(json.dumps({'n':n,'scale':round(s,4),'shift':[dx,dy],'fit_err':round(best[0],1),'heights':[int(bbox(chk[:,i*W:(i+1)*W])[1]-bbox(chk[:,i*W:(i+1)*W])[0]+1) for i in range(n)],'idleH':int(ib-it+1),'rgb_out':[round(float(x),1) for x in chk[mc][:,:3].mean(0)],'rgb_idle':[round(float(x),1) for x in mu_i]}))
