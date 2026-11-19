#!/usr/bin/env python3
"""R1213 폭탄 터짐 시트: R411 hit-explosion(24칸 6x4, 256px)을 보라·청록 플라스마로 다시 칠한다(원본은 그대로 둔다).
주황 불길 → 밝은 부분은 흰 청록, 중간은 보라, 연기는 먹빛 청회. PIL 만 쓴다."""
import colorsys, json, hashlib, os
from PIL import Image
R=os.path.join(os.path.dirname(__file__),'..','r96','runtime-text')
src=os.path.join(R,'assets/r411/fx/hit-explosion.webp'); out=os.path.join(R,'assets/r1213/bomb-blast24.webp')
im=Image.open(src).convert('RGBA'); px=im.load(); W,H=im.size
for y in range(H):
    for x in range(W):
        r,g,b,a=px[x,y]
        if a==0: continue
        h,l,s=colorsys.rgb_to_hls(r/255,g/255,b/255)
        if s>.25 and (h<.14 or h>.95):  # 불길(주황·빨강)
            nh=.72-.22*l  # 어두운 불 = 보라, 밝은 불 = 청록 쪽
            ns=min(1,s*.9)
            nr,ng,nb=colorsys.hls_to_rgb(nh,min(.97,l*1.08),ns)
        else:  # 연기·잔해: 차가운 청회
            nr,ng,nb=colorsys.hls_to_rgb(.6,l*.95,min(.25,s*.4+.08))
        px[x,y]=(int(nr*255),int(ng*255),int(nb*255),a)
os.makedirs(os.path.dirname(out),exist_ok=True); im.save(out,'WEBP',quality=86,alpha_quality=90,method=6)
sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
idx={'bomb-blast24':{'file':'bomb-blast24.webp','frames':24,'grid':[6,4],'cell':[256,256],'source':'assets/r411/fx/hit-explosion.webp','sourceSha256':sha(src),'sha256':sha(out),'bytes':os.path.getsize(out),
 'use':'R1213 기계 계열 몹 폭탄 터짐(임시 재채색 — Dots CX-0167RA MR-10~12 오면 교체)','final':False}}
json.dump(idx,open(os.path.join(os.path.dirname(out),'index.json'),'w',encoding='utf8'),ensure_ascii=False,indent=1)
print(out,os.path.getsize(out))

# ---- Dots CX-0167RA r1 ROUGH 기계 시트(11-19 08:26Z 도착) → 무손실에 가까운 webp ----
RAW='/mnt/project-files/dots-results/cx0167ra-r1/raw/'
DOTS={'bomb-warning8':(8,256,256,'폭탄 떨어질 자리 예고(먹 고리가 감겨 닫힘)'),'ink-dispersal12':(12,256,256,'폭탄 터진 뒤 먹 흩어짐'),
 'orb-flight8':(8,96,96,'폭탄 통(날아가는 구체)'),'capsule-flight8':(8,96,96,'방사능 포낭(날아가는 캡슐)'),
 'green-warning8':(8,256,256,'방사능 떨어질 자리 예고(녹색으로 차오름)'),'sonic-charge6':(6,128,128,'음파 모으기(가슴 앞 고리)')}
for k,(n,cw,ch,use) in DOTS.items():
    p=RAW+'CX-0167RA_machine-'+k+'_r1_ROUGH.png'
    if not os.path.exists(p): continue
    im=Image.open(p).convert('RGBA'); assert im.size==(n*cw,ch),(k,im.size)
    o=os.path.join(os.path.dirname(out),k+'.webp'); im.save(o,'WEBP',quality=90,alpha_quality=95,method=6)
    idx[k]={'file':k+'.webp','frames':n,'grid':[n,1],'cell':[cw,ch],'source':'CX-0167RA_machine-'+k+'_r1_ROUGH.png','sourceSha256':sha(p),'sha256':sha(o),'bytes':os.path.getsize(o),'use':use,'final':False}
json.dump(idx,open(os.path.join(os.path.dirname(out),'index.json'),'w',encoding='utf8'),ensure_ascii=False,indent=1)
print({k:v['bytes'] for k,v in idx.items()})
