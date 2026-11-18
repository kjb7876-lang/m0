# R1161 b09 보스(기계 다리 위 노인) Dots CX-0142BI r2 대기 6칸·피격 4칸 HOLD 손질.
#  HOLD 사유: Dots 가 아래 기계 다리 모양(갈래·각도)을 원래 p4 와 다르게 다시 그림. → 다리·몸통 기계는 원래 p4 그대로 두고,
#  사람(정장·머리·신발)과 가슴 주황 핵만 Dots 칸에서 가져와 겹친다(밝고 채도 낮은 화소 + 주황 핵 마스크, 경계 7px 넓혀 3px 흐림).
#  자리: 사람 부분이 p4 와 색 차이가 가장 작게(±30,±20px). 사용: python3 -I scripts/r1161-b09-boss.py <out dir>
import sys;import numpy as np
from PIL import Image,ImageFilter
R='/mnt/project-files/dots-results/unified-r2/boss-qa/raw/'
OUT=sys.argv[1];RT='r96/runtime-text/'
p4=np.array(Image.open(RT+'assets/r104/bosses/b09-boss-p4.webp').convert('RGBA')).astype(np.float32);H,W=p4.shape[:2]
def man(a):
    rgb=a[...,:3];mx=rgb.max(-1);mn=rgb.min(-1);sat=(mx-mn)/np.maximum(mx,1);al=a[...,3]>64
    pale=al&(mx>120)&(sat<.22)            # 정장·머리·신발
    core=al&(rgb[...,0]>170)&(rgb[...,1]>90)&(rgb[...,2]<120)  # 주황 핵
    m=pale|core
    im=Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(5))
    return np.array(im)>127
def shift(a,dx,dy):
    o=np.zeros_like(a);ys=slice(max(0,dy),H+min(0,dy));yd=slice(max(0,-dy),H+min(0,-dy));xs=slice(max(0,dx),W+min(0,dx));xd=slice(max(0,-dx),W+min(0,-dx));o[ys,xs]=a[yd,xd];return o
mp4=man(p4)
def fit(c):
    best=None
    for dx in range(-30,31,1):
        for dy in range(-20,21,2):
            g=shift(c,dx,dy);mg=man(g) if False else None
            e=np.abs(g[...,:3]-p4[...,:3]).sum(-1)[mp4].mean()
            if best is None or e<best[0]:best=(e,dx,dy)
    return best
def comp(c,dx,dy):
    g=shift(c,dx,dy);m=man(g)|mp4
    mk=Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(3))
    k=np.array(mk).astype(np.float32)[...,None]/255
    pm=lambda a:np.concatenate([a[...,:3]*a[...,3:]/255,a[...,3:]],-1)
    o=pm(g)*k+pm(p4)*(1-k);al=o[...,3:];rgb=np.where(al>0,o[...,:3]*255/np.maximum(al,1e-6),0)
    return np.concatenate([rgb,al],-1)
for name,n in [('0142-b09-idle_r2_HOLD.png',6),('0142-b09-hit_r2_HOLD.png',4)]:
    sh=np.array(Image.open(R+name).convert('RGBA')).astype(np.float32)
    b=fit(sh[:,:W]);print(name,b)
    cells=[comp(sh[:,i*W:(i+1)*W],b[1],b[2]) for i in range(n)]
    o=np.round(np.concatenate(cells,1));o[...,3]=np.where(o[...,3]<=16,0,o[...,3]);o[o[...,3]==0]=0
    Image.fromarray(np.clip(np.round(o),0,255).astype(np.uint8),'RGBA').save(OUT+'/'+name.split('_')[0].replace('0142-','')+('6' if n==6 else '4')+'.webp',quality=90,method=6,alpha_quality=100,alpha_filter=0)
