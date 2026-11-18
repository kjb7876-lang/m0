#!/usr/bin/env python3
"""R1177c: Dots CX-0156SP C1~C4(ROUGH r1) 사몽 에피소드 도트 이펙트 대체 시트를 손질한다(원본 PNG 는 읽기만, 칸 규격은 그대로).
  C1 memory-tower-implode-14.webp  : 세뇌당한 기억의 조각 탑이 깨질 때(7x2, 칸 256, 발 128,240)
  C2 crimson-fissure-12.webp       : 피의 육망성 균열 문(잡몹 부름), 반복(4x3, 칸 256, 128,160) — 육망성 무늬 없이 균열만
  C3 ash-crimson-moths-16.webp     : 기억 조각 수집물 줍기 나방(4x4, 칸 256, 128,128) — 분홍 덩어리 → 잿빛·검붉게
  C4 spectral-hands-20.webp        : B 광장 중간보스 등장 손(5x4, 칸 256, 128,224) — 분홍 → 짙은 핏빛 연기
 공통: 칸 가장자리 4px 부드럽게(칸 경계 직선 자국), 흰 매트 흔적(밝고 반투명한 가장자리) 어둡게.
사용: python3 scripts/r1177c-samong-fx-sheets.py <Dots PNG 폴더> <출력 assets/r1177 폴더>"""
import sys,hashlib,json
from pathlib import Path
import numpy as np
from PIL import Image
SRC=Path(sys.argv[1]);OUT=Path(sys.argv[2])
def fix(name,cols,rows,cw,ch,mul=(1,1,1),sat=1.0,matte=True):
    a=np.asarray(Image.open(SRC/name).convert('RGBA')).astype(np.float32);assert a.shape[1]==cols*cw and a.shape[0]==rows*ch,(name,a.shape)
    rgb,al=a[...,:3],a[...,3];l=rgb.mean(-1,keepdims=True);rgb=(l+(rgb-l)*sat)*np.array(mul,np.float32)
    if matte:m=(al<150)&(l[...,0]>200);rgb[m]=rgb[m]*0.55
    yy,xx=np.mgrid[0:a.shape[0],0:a.shape[1]];dx=np.minimum(xx%cw,cw-1-xx%cw);dy=np.minimum(yy%ch,ch-1-yy%ch);al=al*np.clip(np.minimum(dx,dy)/4,0,1)
    return Image.fromarray(np.dstack([rgb,al]).clip(0,255).astype(np.uint8),'RGBA')
JOBS=[('memory-tower-implode-14.webp','CX-0156SP_C1_memory-tower_implode14_r1_ROUGH.png',7,2,dict()),
 ('crimson-fissure-12.webp','CX-0156SP_C2_crimson-fissure_loop12_r1_ROUGH.png',4,3,dict()),
 ('ash-crimson-moths-16.webp','CX-0156SP_C3_ash-crimson-moths_loop16_r1_ROUGH.png',4,4,dict(mul=(.78,.5,.52),sat=.85)),
 ('spectral-hands-20.webp','CX-0156SP_C4_spectral-hands_entrance20_r1_ROUGH.png',5,4,dict(mul=(.82,.46,.5),sat=1.1))]
rep=[]
for out,src,cols,rows,kw in JOBS:
    im=fix(src,cols,rows,256,256,**kw);p=OUT/out;im.save(p,'WEBP',quality=84,method=6);b=p.read_bytes()
    rep.append(dict(file=out,size=list(im.size),bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),src=src,src_sha256=hashlib.sha256((SRC/src).read_bytes()).hexdigest()))
print(json.dumps(rep,ensure_ascii=False,indent=1))
