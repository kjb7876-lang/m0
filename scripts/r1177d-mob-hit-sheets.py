#!/usr/bin/env python3
"""R1177d: Dots CX-0156SP D 지역 몹 타격 이펙트 9종(ROUGH r1)을 R169 몹 타격 pixelfx 칸(mob-*) 규격으로 옮긴다(원본 PNG 는 읽기만).
  Dots 원본: 4열, 칸 192x192, 투명 배경. 원래 mob-* 도트 칸(index.json)과 화면 크기·기준점이 같게 되도록
   ① 원래 칸에서 모든 장면을 합친 그림 범위(알파>30)와 기준점의 상대 위치를 재고
   ② Dots 칸에서도 그림 범위를 재서, 그림 높이 비율(그림 높이/칸 높이)이 원래와 같은 새 칸을 잘라 낸다(기준점도 같은 상대 위치).
   ③ 칸 가장자리 4px 부드럽게. 색은 Dots 그대로(물들이지 않는다 — 부르는 쪽에서 tint 를 뺀다).
  재생 길이: 원래 칸 길이(장수/15fps)에 맞추되 12~18fps 사이로(너무 느린 불티·돌가시 방지).
사용: python3 scripts/r1177d-mob-hit-sheets.py <Dots PNG 폴더> <pixelfx index.json> <출력 assets/r1177 폴더>"""
import sys,hashlib,json,math
from pathlib import Path
import numpy as np
from PIL import Image
SRC=Path(sys.argv[1]);IDX=Path(sys.argv[2]);OUT=Path(sys.argv[3]);CELL=192;COLS=4
META=json.loads(IDX.read_text())['effects']
JOBS=[('mob-domestic','D_house-double-claw12.png',12),('mob-forge','D_forge-hammer-sparks12.png',12),
 ('mob-neural','D_nerve-branch-current12.png',12),('mob-clinical','D_hospital-silver-hit8.png',8),
 ('mob-garden','D_garden-foliage-arc12.png',12),('mob-stone','D_stone-rising-spines12.png',12),
 ('mob-snow','D_snow-ice-break12.png',12),('mob-coast','D_coast-water-splash12.png',12),
 ('mob-regional','D_common-crescent-slash8.png',8)]
def union(a,fw,fh,cols,n):
    U=np.zeros((fh,fw),bool)
    for i in range(n):r,c=divmod(i,cols);U|=a[r*fh:(r+1)*fh,c*fw:(c+1)*fw]>30
    ys,xs=np.nonzero(U);return xs.min(),ys.min(),xs.max()+1,ys.max()+1
# 사방으로 퍼지는 칸(얼음 깨짐·신경 전류)은 Dots 그림 한가운데가 맞은 자리 — 원래 도트 칸은 오른쪽으로 뻗는 그림이라 기준점이 왼쪽이었다
CENTER={'mob-snow':None,'mob-neural':.5}
# R1177e: Dots 인계 메모 '눈가루가 서리 장판처럼 보임 → 연무 투명도 낮춤' — 반투명(알파<230) 연무만 옅게, 단단한 얼음 조각(불투명)은 그대로
HAZE={'mob-snow':.5}
rows=[]
for key,src,n in JOBS:
    m=META[key];fw,fh=m['frame'];px,py=m['pivot']
    o=np.asarray(Image.open(IDX.parent/m['file']).convert('RGBA'))[...,3]
    ox0,oy0,ox1,oy1=union(o,fw,fh,m['columns'],m['frames'])
    d=np.asarray(Image.open(SRC/src).convert('RGBA'));assert d.shape[1]==COLS*CELL and d.shape[0]>=math.ceil(n/COLS)*CELL,(src,d.shape)
    dx0,dy0,dx1,dy1=union(d[...,3],CELL,CELL,COLS,n)
    k=(dy1-dy0)/(oy1-oy0)# 원래 1px = Dots k px
    rx,ry=(px-ox0)/(ox1-ox0),(py-oy0)/(oy1-oy0)
    if key in CENTER:rx=.5;ry=CENTER[key] if CENTER[key] is not None else ry
    Px,Py=dx0+rx*(dx1-dx0),dy0+ry*(dy1-dy0)
    X0,Y0=Px-px*k,Py-py*k;X1,Y1=X0+fw*k,Y0+fh*k
    X0,Y0,X1,Y1=min(X0,dx0-6),min(Y0,dy0-6),max(X1,dx1+6),max(Y1,dy1+6)# 그림이 잘리지 않게만 넓힘
    X0,Y0=math.floor(X0),math.floor(Y0);W,H=math.ceil(X1)-X0,math.ceil(Y1)-Y0
    sheet=np.zeros((math.ceil(n/COLS)*H,COLS*W,4),np.float32)
    yy,xx=np.mgrid[0:CELL,0:CELL];fe=np.clip(np.minimum(np.minimum(xx,CELL-1-xx),np.minimum(yy,CELL-1-yy))/4,0,1)
    for i in range(n):
        r,c=divmod(i,COLS);cell=d[r*CELL:(r+1)*CELL,c*CELL:(c+1)*CELL].astype(np.float32).copy();cell[...,3]*=fe
        if key in HAZE:al=cell[...,3];t=np.clip((al-150)/80,0,1);cell[...,3]=al*(HAZE[key]+(1-HAZE[key])*t*t*(3-2*t))
        big=np.zeros((H,W,4),np.float32)# 칸 좌표 (X0,Y0) 기준으로 옮김(넘치는 곳은 투명)
        sx0,sy0=max(0,X0),max(0,Y0);sx1,sy1=min(CELL,X0+W),min(CELL,Y0+H)
        big[sy0-Y0:sy1-Y0,sx0-X0:sx1-X0]=cell[sy0:sy1,sx0:sx1]
        sheet[r*H:(r+1)*H,c*W:(c+1)*W]=big
    im=Image.fromarray(sheet.clip(0,255).astype(np.uint8),'RGBA');name=key+'-dots-'+str(n)+'.webp';p=OUT/name;im.save(p,'WEBP',quality=84,method=6);b=p.read_bytes()
    dur=m['frames']/m['fps'];fps=round(min(18,max(12,n/dur)),2)
    rows.append(dict(key=key,file=name,frame=[W,H],pivot=[round(Px-X0),round(Py-Y0)],columns=COLS,frames=n,fps=fps,
        visual_ratio_orig=round((oy1-oy0)/fh,3),visual_ratio_new=round((dy1-dy0)/H,3),bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),
        src=src,src_sha256=hashlib.sha256((SRC/src).read_bytes()).hexdigest()))
print(json.dumps(rows,ensure_ascii=False,indent=1))
