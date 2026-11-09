# R445: 슬레이어 북향(뒷모습) 보행 4칸 후보 → 공개 R389 남향 walk-s 와 화풍·색감 맞춤.
# usage: python3 scripts/r445-slayer-walk-n.py <src-dir with walk-n-00..03.png> <ref walk-s.webp> <out walk-n.webp>
# - 밝기 평균·대비를 ref 불투명 픽셀에 맞춤(r389-slayer-tone.py 와 같은 식), 색조 유지, 채도만 ref 평균에 맞춤(최대 1.25배)
# - 몸에서 6px 넘게 떨어진 저알파(<40) 생성 잔여만 지움. 몸 윤곽 알파·픽셀 배치는 그대로
import sys,numpy as np
from PIL import Image,ImageFilter
src,ref,out=sys.argv[1:4]
W=np.array([.299,.587,.114],np.float32)
def opaque(a):return a[...,3]>128
r=np.asarray(Image.open(ref).convert('RGBA')).astype(np.float32)
fr=[np.asarray(Image.open(f'{src}/walk-n-0{i}.png').convert('RGBA')).astype(np.float32) for i in range(4)]
sheet=np.concatenate(fr,1)
def Lstat(a):L=(a[...,:3]@W)[opaque(a)];return L.mean(),L.std()
def sat(a):p=a[opaque(a)][:,:3];mx=p.max(1);mn=p.min(1);return float(np.mean((mx-mn)/np.maximum(mx,1)))
mr,sr=Lstat(r);ms,ss=Lstat(sheet)
k=min(1.6,max(.8,sr/ss))
L=sheet[...,:3]@W
Lt=np.clip((L-ms)*k+mr,0,255)
g=np.where(L>1,Lt/np.maximum(L,1),1)[...,None]
rgb=sheet[...,:3]*g
lift=np.clip(Lt-L*g[...,0],0,None)[...,None]*np.array([1.0,.92,.9],np.float32)
rgb=np.clip(rgb+lift,0,255)
tmp=np.concatenate([rgb,sheet[...,3:]],-1)
cs=min(1.25,max(1.0,sat(r)/max(sat(tmp),1e-6)))
Y=(rgb@W)[...,None]
rgb=np.clip(Y+(rgb-Y)*cs,0,255)
alpha=sheet[...,3].copy()
body=Image.fromarray((alpha>=128).astype(np.uint8)*255).filter(ImageFilter.MaxFilter(13))
far=(np.asarray(body)==0)&(alpha<40)
removed=int(((alpha>0)&far).sum());alpha[far]=0
o=np.concatenate([rgb,alpha[...,None]],-1).astype(np.uint8)
Image.fromarray(o,'RGBA').save(out,lossless=True,method=6)
oo=np.asarray(Image.open(out).convert('RGBA')).astype(np.float32)
print('ref L %.1f/%.1f sat %.3f | src L %.1f/%.1f -> out L %.1f/%.1f sat %.3f k=%.2f chroma=%.2f residue_removed=%d'%(mr,sr,sat(r),ms,ss,*Lstat(oo),sat(oo),k,cs,removed))
