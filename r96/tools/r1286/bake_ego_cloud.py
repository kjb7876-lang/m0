# R1286 — 미카엘라 EGO 구름 오라(R1041 Dots M3 시트)를 모든 영웅이 쓰도록 '중립 밝기' 시트로 굽는다.
#  · 칸마다 알파 덩어리 중 큰 것(1500px 이상, 불꽃 몸통)만 남기고 작은 덩어리(하트 장식 100~550px·잔티)는 지운다 → 미카엘라 고유 하트가 다른 영웅에게 나오지 않게.
#  · 색은 밝기(0.3R+0.59G+0.11B)만 남긴 회색으로 저장 → 게임에서 ego-cloud-r1286.js 가 영웅 고유색 사다리로 물들인다.
#  원본(assets/r1041/fx-m3-*.webp)은 그대로 둔다(미카엘라는 원본 그대로).
# 실행: python3 r96/tools/r1286/bake_ego_cloud.py   (numpy·scipy·PIL)
import os, sys, hashlib
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC=os.path.join(ROOT,'runtime-text','assets','r1041')
DST=os.path.join(ROOT,'runtime-text','assets','r1286')
CELL=384; KEEP=1500; TH=110
os.makedirs(DST,exist_ok=True)
for src,dst,n in [('fx-m3-michaela-ego-on.webp','ego-cloud-on.webp',6),('fx-m3-michaela-ego-loop.webp','ego-cloud-loop.webp',10)]:
    im=np.array(Image.open(os.path.join(SRC,src)).convert('RGBA')).astype(np.float32)
    out=np.zeros_like(im)
    removed=0
    for f in range(n):
        sl=im[:,f*CELL:(f+1)*CELL]
        a=sl[...,3]>TH
        lab,k=ndimage.label(a,structure=np.ones((3,3)))
        sizes=ndimage.sum(a,lab,range(1,k+1)) if k else []
        keep=np.zeros(k+1,bool)
        for i,s in enumerate(sizes,1):
            if s>=KEEP: keep[i]=True
        mask=keep[lab]
        # 반투명 가장자리까지 같은 덩어리에 붙이려고 1px 넓힌다
        mask=ndimage.binary_dilation(mask,iterations=5)&(sl[...,3]>0)
        removed+=int(((sl[...,3]>8)&~mask).sum())
        L=sl[...,0]*.3+sl[...,1]*.59+sl[...,2]*.11
        o=out[:,f*CELL:(f+1)*CELL]
        o[...,0]=o[...,1]=o[...,2]=L
        o[...,3]=np.where(mask,sl[...,3],0)
    Image.fromarray(np.clip(out,0,255).astype(np.uint8),'RGBA').save(os.path.join(DST,dst),'WEBP',quality=88,method=6)
    p=os.path.join(DST,dst);print(dst,os.path.getsize(p),hashlib.sha256(open(p,'rb').read()).hexdigest()[:16],'removed px',removed)
