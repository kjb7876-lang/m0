#!/usr/bin/env python3
"""R1177b: Dots CX-0156SP(ROUGH r1) S-06 디스토피아 시트를 게임 칸 규격으로 손질한다(원본 PNG 는 읽기만).
 상대 초인(DYS-03, 칸 256x320 발 128,300) → R161 꼭두각시 칸(256x320, 발 101.8,299.5)으로 옮김:
   walk8·attack8·hit4·death8. 크기는 걷기 키(포구 고리 포함) 239 → 232(R1177 임시본과 같은 크기), 공격은 몸이 조금 작게 왔으므로 225 → 232.
 지휘 개체·지휘 기체(DYS-06·DYS-10 공용, 칸 320x320 발 160,300) → 칸·발 그대로(samong-r161 GEO 표가 칸 규격을 안다), 발선만 300 으로 맞춤:
   walk8·attack8·hit4·death8.
 공통: 알파 252 안팎으로 살짝 비치던 몸을 불투명하게(240 이상 → 255), 칸 가장자리 6px 부드럽게(공격 광채가 칸 경계에서 잘린 직선 자국 숨김).
   상대 초인은 붉은 코어·포구·광채 말고 채도 0.55(먹빛), 흰 테 제거(사망 연기 칸은 제외 — 잿빛 연기를 지우지 않게). 지휘 개체는 채도 0.85.
사용: python3 scripts/r1177b-dys-sheets.py <Dots PNG 폴더> <출력 assets/r1177 폴더>
 폴더 안 파일 이름: CX-0156SP_DYS-03_{walk8,attack8,hit4,death8}_r1_ROUGH.png, CX-0156SP_DYS-06_DYS-10_shared_{walk8,attack8,hit4,death8}_r1_ROUGH.png"""
import sys,hashlib,json
from pathlib import Path
import numpy as np
from PIL import Image
SRC=Path(sys.argv[1]);OUT=Path(sys.argv[2]);OUT.mkdir(parents=True,exist_ok=True)
def clean(c,sat,keep_red,fringe):
    a=np.asarray(c).astype(np.float32);al=a[...,3];al=np.where(al>=240,255,al*255/240)
    rgb=a[...,:3];l=rgb.mean(-1,keepdims=True);g=l+(rgb-l)*sat
    if keep_red:red=(rgb[...,0:1]-np.maximum(rgb[...,1:2],rgb[...,2:3]))>40;rgb=np.where(red,rgb,g)
    else:rgb=g
    if fringe:edge=(al<200)&(l[...,0]>150);rgb[edge]=[38,36,40]
    H,W=al.shape;yy,xx=np.mgrid[0:H,0:W];d=np.minimum(np.minimum(xx,W-1-xx),np.minimum(yy,H-1-yy));al=al*np.clip(d/6,0,1)
    return Image.fromarray(np.dstack([rgb,al]).clip(0,255).astype(np.uint8),'RGBA')
def foot(c):
    al=np.asarray(c)[...,3];ys=np.nonzero(al.max(1)>40)[0];return ys.max() if len(ys) else None
def sheet(name,cw,ch,n,cols,place,**kw):
    im=Image.open(SRC/name).convert('RGBA');rows=(n+cols-1)//cols
    cells=[im.crop(((k%cols)*cw,(k//cols)*ch,(k%cols)*cw+cw,(k//cols)*ch+ch)) for k in range(n)]
    fb=[foot(c) for c in cells];base=int(np.median([f for f in fb if f is not None]))
    out_cw,out_ch=place['cw'],place['ch'];sh=Image.new('RGBA',(out_cw*cols,out_ch*rows));lost=0
    for k,c in enumerate(cells):
        c=clean(c,**kw);s=place['s'];f=c.resize((round(cw*s),round(ch*s)),Image.LANCZOS) if s!=1 else c
        ox=round(place['px']-place['sx']*s);oy=round(place['py']-(place['sy']+(place['sy']-base if place.get('foot') else 0))*s)
        big=Image.new('RGBA',(out_cw*3,out_ch*3));big.alpha_composite(f,(ox+out_cw,oy+out_ch));cell=big.crop((out_cw,out_ch,2*out_cw,2*out_ch))
        tot=np.asarray(f)[...,3].astype(float).sum();kept=np.asarray(cell)[...,3].astype(float).sum();lost=max(lost,1-kept/max(1,tot))
        sh.alpha_composite(cell,((k%cols)*out_cw,(k//cols)*out_ch))
    return sh,lost,base
R161=dict(cw=256,ch=320,px=101.8,py=299.5,sx=128,sy=300)
CMD=dict(cw=320,ch=320,px=160,py=300,sx=160,sy=300,s=1,foot=True)
JOBS=[('s06-rival-dots-walk-right-8.webp','CX-0156SP_DYS-03_walk8_r1_ROUGH.png',256,320,8,dict(R161,s=232/239),dict(sat=.55,keep_red=True,fringe=True)),
 ('s06-rival-dots-attack-8.webp','CX-0156SP_DYS-03_attack8_r1_ROUGH.png',256,320,8,dict(R161,s=232/225,foot=True),dict(sat=.55,keep_red=True,fringe=True)),
 ('s06-rival-dots-hit-4.webp','CX-0156SP_DYS-03_hit4_r1_ROUGH.png',256,320,4,dict(R161,s=232/239),dict(sat=.55,keep_red=True,fringe=True)),
 ('s06-rival-dots-death-8.webp','CX-0156SP_DYS-03_death8_r1_ROUGH.png',256,320,8,dict(R161,s=232/239),dict(sat=.55,keep_red=True,fringe=False)),
 ('s06-commander-dots-walk-right-8.webp','CX-0156SP_DYS-06_DYS-10_shared_walk8_r1_ROUGH.png',320,320,8,CMD,dict(sat=.85,keep_red=False,fringe=True)),
 ('s06-commander-dots-attack-8.webp','CX-0156SP_DYS-06_DYS-10_shared_attack8_r1_ROUGH.png',320,320,8,CMD,dict(sat=.85,keep_red=False,fringe=True)),
 ('s06-commander-dots-hit-4.webp','CX-0156SP_DYS-06_DYS-10_shared_hit4_r1_ROUGH.png',320,320,4,CMD,dict(sat=.85,keep_red=False,fringe=True)),
 ('s06-commander-dots-death-8.webp','CX-0156SP_DYS-06_DYS-10_shared_death8_r1_ROUGH.png',320,320,8,CMD,dict(sat=.85,keep_red=False,fringe=False))]
rep=[]
for out,src,cw,ch,n,place,kw in JOBS:
    if place is not CMD and 'foot' not in place:place=dict(place)
    sh,lost,base=sheet(src,cw,ch,n,4,place,**kw);assert lost<.01,(out,lost)
    p=OUT/out;sh.save(p,'WEBP',quality=86,method=6);b=p.read_bytes()
    rep.append(dict(file=out,size=list(sh.size),bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),clip=round(lost,4),srcFoot=base,src=src,src_sha256=hashlib.sha256((SRC/src).read_bytes()).hexdigest()))
print(json.dumps(rep,ensure_ascii=False,indent=1))
