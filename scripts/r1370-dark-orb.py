#!/usr/bin/env python3
"""R1370 보라 암흑 구체(R1214 dark) 시트 흰 띠 빼기. PIL 만.
R1214 는 먹 시트가 어두운 바닥에 묻힌다고 칸마다 옅은 종이빛(236,232,245) 테를 밑에 깔았다 → 화면에서 '흰 띠'로 보였다(사용자 11-27).
같은 Dots 원본(CX-0167RA r1 ROUGH)에서 테 색만 짙은 보라 번짐으로 바꿔 다시 만든다. R1214 파일은 그대로 둔다(오버레이 경로 assets/r1370/r1214/).
"""
import os, json, hashlib
from PIL import Image, ImageFilter
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
OUT=os.path.join(ROOT,'r96','runtime-text','assets','r1370','r1214'); RAW='/mnt/project-files/dots-results/cx0167ra-r1/raw/'
os.makedirs(OUT,exist_ok=True); sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
GLOW=(124,78,176)  # 짙은 보라(채도 .56, 흰 띠 판정 밖)
def px(im): return list(im.get_flattened_data()) if hasattr(im,'get_flattened_data') else list(im.getdata())
def vis(im): return sum(1 for p in px(im) if p[3]>=24)
def glow(im,n):
    cw=im.size[0]//n; out=Image.new('RGBA',im.size,(0,0,0,0))
    for i in range(n):
        c=im.crop((i*cw,0,(i+1)*cw,im.size[1])); a=c.getchannel('A'); r=max(3,cw//40)|1
        g=a.filter(ImageFilter.MaxFilter(r)).filter(ImageFilter.GaussianBlur(r*.9)).point(lambda v:int(v*.62))
        base=Image.new('RGBA',c.size,GLOW+(0,)); base.putalpha(g); base.alpha_composite(c); out.paste(base,(i*cw,0))
    return out
idx={}
for k,use in [('dark-orb-flight8','암흑 구체 날아감(머리 오른쪽, 코드가 진행 방향으로 돌림)'),('dark-impact8','암흑 구체 맞음')]:
    p=RAW+'CX-0167RA_ghost-'+k+'_r1_ROUGH.png'; im=Image.open(p).convert('RGBA'); assert im.size[0]%8==0
    out=glow(im,8); o=os.path.join(OUT,k+'.webp'); out.save(o,'WEBP',quality=90,alpha_quality=95,method=6)
    idx[k]={'file':k+'.webp','frames':8,'grid':[8,1],'cell':[im.size[0]//8,im.size[1]],'source':'CX-0167RA_ghost-'+k+'_r1_ROUGH.png','sourceSha256':sha(p),'sourceVisible':vis(im),
            'sha256':sha(o),'bytes':os.path.getsize(o),'use':use,'final':False,'rim':'짙은 보라 번짐 %s (R1370, R1214 옅은 종이빛 테 대체)'%(GLOW,)}
json.dump(idx,open(os.path.join(OUT,'index.json'),'w',encoding='utf8'),ensure_ascii=False,indent=1); print({k:v['bytes'] for k,v in idx.items()})
