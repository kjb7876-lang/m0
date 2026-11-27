#!/usr/bin/env python3
"""R1370b Dots SW-R1370 고품질 보라 암흑 구체 시트 3장 → webp(가로 한 줄). PIL 만. 원본은 Dots 납품 그대로(손대지 않음)."""
import os, json, hashlib
from PIL import Image
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
OUT=os.path.join(ROOT,'r96','runtime-text','assets','r1370b'); RAW='/mnt/project-files/dots-results/SW-R1370/'
os.makedirs(OUT,exist_ok=True); sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
S=[('dark-orb-flight12','SW-R1370-01_dark-orb-flight12.png',12,'비행: 머리 오른쪽(+x), 회전 기준 (154,128)',[154,128]),
   ('dark-orb-impact10','SW-R1370-02_dark-orb-impact10.png',10,'적중: 보라 먹 소용돌이 터짐, 중심 (128,128)',[128,128]),
   ('dark-orb-cast8','SW-R1370-03_dark-orb-cast8.png',8,'예고: 가슴 앞에 모여 커짐, 중심 (96,96)',[96,96])]
# Dots DONE 파일의 원본 SHA. /mnt/project-files 사본은 올릴 때 PNG 가 다시 압축돼 SHA 가 다르다(픽셀 같음) →
# 받은 원본(드라이브 다운로드)이 있으면 SHA 와 픽셀 동일을 확인하고, 색인에는 Dots 원본 SHA 를 적는다.
DOTS={'dark-orb-flight12':'44eb4a70ebe29e5282253d9a8e712e877cfd78a6b511df97c6d6c8ab1b564b60','dark-orb-impact10':'9de88be8c2a27813e6cc78d7727c41115aa4986d4711d42e3abc99d0a13f3997','dark-orb-cast8':'6c86fc6d294eccc34470a867d3d791a00a6f76eb14e2d61677038100f1528253'}
ORIG=os.environ.get('R1370B_ORIG','')  # 'k=경로,k=경로'
orig=dict(x.split('=',1) for x in ORIG.split(',') if '=' in x)
idx={}
for k,src,n,use,piv in S:
    p=RAW+src; im=Image.open(p).convert('RGBA'); assert im.size[0]%n==0,(k,im.size)
    pixelCheck=False
    if k in orig:
        assert sha(orig[k])==DOTS[k],(k,'Dots SHA 다름'); assert Image.open(orig[k]).convert('RGBA').tobytes()==im.tobytes(),(k,'픽셀 다름'); pixelCheck=True
    o=os.path.join(OUT,k+'.webp'); im.save(o,'WEBP',quality=90,alpha_quality=95,method=6)
    idx[k]={'file':k+'.webp','frames':n,'grid':[n,1],'cell':[im.size[0]//n,im.size[1]],'pivot':piv,'source':src,'sourceSha256':DOTS[k],'projectCopySha256':sha(p),'pixelsCheckedAgainstOriginal':pixelCheck,'sha256':sha(o),'bytes':os.path.getsize(o),'use':use,'final':True,'dots':'SW-R1370 v1 (2026-11-27 07:59Z)'}
json.dump(idx,open(os.path.join(OUT,'index.json'),'w',encoding='utf8'),ensure_ascii=False,indent=1); print({k:v['bytes'] for k,v in idx.items()})
