"""R186 사몽 빈 공간(바닥 밖 검은 곳)용 뇌·내장 주름 타일 — 주기 함수만 써서 이음매 없이 반복되는 512px 텍스처를 직접 만든다(자체 생성, CC0 상당, 임시 자산).
사용: python3 -I scripts/r186-flesh-tile.py r96/runtime-text/assets/r186/flesh-void.webp"""
import sys, math, hashlib, json, os
import numpy as np
from PIL import Image, ImageFilter
N=512;rng=np.random.default_rng(186)
y,x=np.mgrid[0:N,0:N]/N*2*np.pi
def per(fx,fy,ph):return np.sin(fx*x+fy*y+ph)
# 정수 주파수 합 → 주기적(이음매 없음) 잡음
def noise(k,amp=1.0):
    acc=np.zeros((N,N))
    for _ in range(k):
        fx,fy=rng.integers(-6,7,2);acc+=per(fx,fy,rng.uniform(0,6.283))*rng.uniform(.4,1)
    return acc/k*amp
wx,wy=noise(10),noise(10)
# 도메인 비틀기 + 주름(뇌 이랑): |sin| 의 골
v=np.zeros((N,N))
for _ in range(14):
    fx,fy=rng.integers(-5,6,2)
    if fx==0 and fy==0:continue
    v+=np.sin(fx*(x+wx*1.6)+fy*(y+wy*1.6)+rng.uniform(0,6.283))
v/=14
folds=1-np.abs(np.sin(v*7.5))            # 이랑 사이 골은 어둡게
folds=folds**1.8
veins=np.clip(1-np.abs(noise(16)*3.2),0,1)**10   # 가는 핏줄
base=np.clip(.55+noise(6)*.25,0,1)
r=(38+70*folds*base+60*veins);g=(14+22*folds*base+8*veins);b=(20+30*folds*base+14*veins)
img=np.stack([r,g,b],-1).clip(0,255).astype(np.uint8)
im=Image.fromarray(img,'RGB').filter(ImageFilter.GaussianBlur(.6))
out=sys.argv[1];os.makedirs(os.path.dirname(out),exist_ok=True);im.save(out,'WEBP',quality=88,method=6)
b=open(out,'rb').read();meta={'file':os.path.basename(out),'size':[N,N],'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'tileable':True,'temporary':True,
 'use':'사몽 구역 바닥 밖 빈 공간(검은 곳) — 뇌·내장 주름(사용자 2026-10-31 요청)','source':'R186 scripts/r186-flesh-tile.py 자체 생성(CC0 상당), 좋은 자산이 오면 교체'}
json.dump(meta,open(os.path.join(os.path.dirname(out),'index.json'),'w',encoding='utf8'),ensure_ascii=False,indent=1);print(meta)
