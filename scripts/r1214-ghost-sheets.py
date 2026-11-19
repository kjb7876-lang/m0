#!/usr/bin/env python3
"""R1214 귀신 계열 Dots CX-0167RA r1 ROUGH 시트 8장 → webp(가로 한 줄). PIL 만."""
import os, json, hashlib
from PIL import Image, ImageFilter
R=os.path.join(os.path.dirname(__file__),'..','r96','runtime-text','assets','r1214'); RAW='/mnt/project-files/dots-results/cx0167ra-r1/raw/'
os.makedirs(R,exist_ok=True); sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest(); idx={}
S={'fear-gaze12':(12,'공포: 머리 위 눈(0~5 뜨기, 6~11 감기)'),'fear-status8':(8,'공포에 걸린 영웅 머리 위 먹 소용돌이'),'dark-orb-flight8':(8,'암흑 구체 날아감'),'dark-impact8':(8,'암흑 구체 맞음'),
 'shadow-hand-warning8':(8,'그림자 손 예고(발밑 먹 웅덩이)'),'shadow-rise12':(12,'그림자 손 솟음'),'fissure-warning8':(8,'촉수 예고(땅 갈라짐 줄)'),'ink-rise10':(10,'촉수 먹 솟음')}
# 먹 시트는 어두운 바닥에 묻힌다(헤드리스 장면 확인) → 칸마다 옅은 종이빛 테두리(알파 넓혀 흐림)를 밑에 깐다. 먹 그림은 그대로 위에.
def rim(im,n):
    cw=im.size[0]//n; out=Image.new('RGBA',im.size,(0,0,0,0))
    for i in range(n):
        c=im.crop((i*cw,0,(i+1)*cw,im.size[1])); a=c.getchannel('A'); r=max(3,cw//40)|1
        g=a.filter(ImageFilter.MaxFilter(r)).filter(ImageFilter.GaussianBlur(r*.9)).point(lambda v:int(v*.72))
        base=Image.new('RGBA',c.size,(236,232,245,0)); base.putalpha(g); base.alpha_composite(c); out.paste(base,(i*cw,0))
    return out
for k,(n,use) in S.items():
    p=RAW+'CX-0167RA_ghost-'+k+'_r1_ROUGH.png'; im=Image.open(p).convert('RGBA'); assert im.size[0]%n==0,(k,im.size)
    im=rim(im,n)
    o=os.path.join(R,k+'.webp'); im.save(o,'WEBP',quality=90,alpha_quality=95,method=6)
    idx[k]={'file':k+'.webp','frames':n,'grid':[n,1],'cell':[im.size[0]//n,im.size[1]],'source':'CX-0167RA_ghost-'+k+'_r1_ROUGH.png','sourceSha256':sha(p),'sha256':sha(o),'bytes':os.path.getsize(o),'use':use,'final':False,'rim':'옅은 종이빛 테두리(R1214c)'}
json.dump(idx,open(os.path.join(R,'index.json'),'w',encoding='utf8'),ensure_ascii=False,indent=1); print({k:v['bytes'] for k,v in idx.items()})
