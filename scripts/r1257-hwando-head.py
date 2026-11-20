#!/usr/bin/env python3
"""R1257 환도 방향별 머리(두건) 크기 맞춤 — 사용자 2026-11-20 "환도영웅 위아래랑 좌우 이미지 머리크기랑 몸체가 다른부분 일관성있게".
기준 = 좌·우 걷기(R1063 파생본). 앞(칼집 걷기·서기)·뒤(걷기·피격)·옆 피격 시트의 머리 띠(꼭대기~몸 키 22%)만
머리 꼭대기 가운데를 축으로 배율 s 로 키우거나 줄여 덮어쓴다. 목 아래 몸·옷·칼·발 기준선·칸·색인은 그대로.
출력: runtime-text/assets/r1257/<원래 경로 꼬리>.webp (무손실) + assets/r1257/r1257.json. numpy·Pillow 필요(컨테이너용, CI 검사는 Pillow 만)."""
import os,json,hashlib
import numpy as np
from PIL import Image
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','r96','runtime-text')
J=lambda p:json.load(open(os.path.join(R,p)))
I271=J('assets/r271/hwando/index.json')['anims'];I242=J('assets/r242/hwando/index.json')['anims'];SH=J('assets/r1219/r436/hwando/sheathed/index.json')
BAND=.22;FEATHER=6
# 배율은 head_check.py 의 머리 크기 단위로 기준(좌·우 걷기)에 맞도록 고른 값
SHEETS={'assets/r1219/r436/hwando/sheathed/walk-s.webp':(SH['walk']['s'],None),
 'assets/r1219/r436/hwando/sheathed/idle-s.webp':(SH['idle']['s'],None),
 'assets/r1063/r283/hwando/r271/walk-n.webp':(I271['walk']['n'],None),
 'assets/r1063/r283/hwando/r242/hit-n.webp':(I242['hit']['n'],None),
 'assets/r1063/r283/hwando/r242/hit-e.webp':(I242['hit']['e'],None)}
SCALE=json.loads(os.environ.get('R1257_SCALE','{}')) or {'walk-s':1.28,'idle-s':1.26,'walk-n':1.14,'hit-n':1.10,'hit-e':.80}
def fix(c,A,s):
    a=c[...,3]>60;ys=np.where(a.any(1))[0]
    if not len(ys): return c
    top=int(ys[0]);H=A['anchor'][1]-top;L=BAND*H
    xs=np.where(a[top:int(top+.1*H)+1].any(0))[0];w=a[top:int(top+.1*H)+1].sum(0).astype(float)
    px=float((np.arange(c.shape[1])*w).sum()/max(w.sum(),1))
    img=Image.fromarray(c,'RGBA')
    pm=np.asarray(img.convert('RGBa'))  # 미리 곱한 알파로 재표본(가장자리 번짐 방지)
    sc=Image.fromarray(pm,'RGBa').transform(img.size,Image.AFFINE,(1/s,0,px-px/s,0,1/s,top-top/s),resample=Image.BICUBIC)
    S=np.asarray(sc).astype(np.float32);O=pm.astype(np.float32)
    y=np.arange(c.shape[0],dtype=np.float32)[:,None];cut=top+min(s,1)*L
    m=np.clip((cut+FEATHER-y)/(2*FEATHER),0,1)  # 띠 안 1 → 목에서 0
    # 이음 구간에서 키운 어깨가 원래 윤곽 밖으로 번지지 않게 원래 불투명 안쪽만
    edge=(m>0)&(m<1);inside=(O[...,3]>0)
    Sm=S.copy();Sm[edge[...,0][:,None].repeat(c.shape[1],1)&~inside]=0
    out=Sm*m[...,None]+O*(1-m[...,None])
    o=np.asarray(Image.fromarray(np.clip(out+.5,0,255).astype(np.uint8),'RGBa').convert('RGBA')).copy()
    z=int(np.ceil(cut+FEATHER))+1;o[z:]=c[z:]  # 목 아래는 원본 그대로(왕복 변환 오차도 없게)
    return o
meta={'revision':'R1257-hwando-head-1','band':BAND,'feather':FEATHER,'scale':SCALE,'sheets':{}}
for p,(A,_) in SHEETS.items():
    name=os.path.basename(p)[:-5];s=SCALE[name]
    im=np.asarray(Image.open(os.path.join(R,p)).convert('RGBA')).copy();cw,ch=A['cell']
    for f in range(A['n']):
        cc,rr=f%A['cols'],f//A['cols'];sl=(slice(rr*ch,(rr+1)*ch),slice(cc*cw,(cc+1)*cw))
        im[sl]=fix(im[sl].copy(),A,s)
    dp='assets/r1257/'+p[7:];os.makedirs(os.path.dirname(os.path.join(R,dp)),exist_ok=True)
    Image.fromarray(im,'RGBA').save(os.path.join(R,dp),'WEBP',lossless=True,quality=100,method=6,exact=True)
    b=open(os.path.join(R,dp),'rb').read()
    meta['sheets'][dp]={'source':p,'source_sha256':hashlib.sha256(open(os.path.join(R,p),'rb').read()).hexdigest(),'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'scale':s}
    print(dp,s,len(b))
json.dump(meta,open(os.path.join(R,'assets/r1257/r1257.json'),'w'),ensure_ascii=False,indent=1)
