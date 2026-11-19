#!/usr/bin/env python3
"""R1227 추락(dist06) 불 계열 Dots CX-0167RA r1 ROUGH 시트 3장 → webp(가로 한 줄). PIL 만.
원본은 드라이브 다운로드 도구가 다시 인코딩해 저장한 PNG(크기가 드라이브 원본과 다를 수 있음)."""
import os, json, hashlib
from PIL import Image
R=os.path.join(os.path.dirname(__file__),'..','r96','runtime-text','assets','r1227'); RAW='/mnt/project-files/dots-results/cx0167ra-r1/raw/'
os.makedirs(R,exist_ok=True); sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest(); idx={}
S={'fireball-flight8':(8,'불: 날아가는 불덩이'),'crimson-impact12':(12,'불: 맞은 자리 진홍 폭발, 근접 타격 자국'),'cast-tell8':(8,'마법 시전 예고(발밑 고리)')}
for k,(n,use) in S.items():
    p=RAW+'CX-0167RA_magic-'+k+'_r1_ROUGH.png'; im=Image.open(p).convert('RGBA'); assert im.size[0]%n==0,(k,im.size)
    o=os.path.join(R,k+'.webp'); im.save(o,'WEBP',quality=90,alpha_quality=95,method=6)
    idx[k]={'file':k+'.webp','frames':n,'grid':[n,1],'cell':[im.size[0]//n,im.size[1]],'source':'CX-0167RA_magic-'+k+'_r1_ROUGH.png','sourceSha256':sha(p),'sha256':sha(o),'bytes':os.path.getsize(o),'use':use,'final':False}
json.dump(idx,open(os.path.join(R,'index.json'),'w',encoding='utf8'),ensure_ascii=False,indent=1); print({k:v['bytes'] for k,v in idx.items()})
