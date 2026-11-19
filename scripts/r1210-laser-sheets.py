#!/usr/bin/env python3
"""R1210: Dots CX-0167RA 레이저 ROUGH 시트(조준 6·충전 8·몸통 8·적중 8) → assets/r1210/*.webp
원본: /mnt/project-files/dots-results/cx0167ra-r1/raw/ (드라이브 지시 결과 폴더 사본, 읽기 전용).
손질: 적중 시트의 옅은 흰 안개(채도 낮고 알파 140 미만)를 지운다 — 어두운 바닥에서 흰 네모로 보임. 나머지는 그대로(무손실 webp)."""
import sys,os,json,hashlib
from PIL import Image
SRC=sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/dots-results/cx0167ra-r1/raw'
OUT=os.path.join(os.path.dirname(__file__),'..','r96','runtime-text','assets','r1210');os.makedirs(OUT,exist_ok=True)
J={'aim6':('laser-aim6',6),'charge8':('laser-charge8',8),'body8':('laser-body8',8),'impact8':('laser-impact8',8)}
rows={}
for k,(name,n) in J.items():
    f=os.path.join(SRC,f'CX-0167RA_machine-laser-{k}_r1_ROUGH.png');raw=open(f,'rb').read();im=Image.open(f).convert('RGBA')
    if k=='impact8':
        px=im.load();w,h=im.size
        for y in range(h):
            for x in range(w):
                r,g,b,a=px[x,y]
                if a and a<140 and max(r,g,b)-min(r,g,b)<40 and min(r,g,b)>150:px[x,y]=(r,g,b,0)
    o=os.path.join(OUT,name+'.webp');im.save(o,'WEBP',lossless=True,method=6)
    rows[name]={'path':'assets/r1210/'+name+'.webp','frames':n,'cell':[im.width//n,im.height],'source':os.path.basename(f),'sourceSha256':hashlib.sha256(raw).hexdigest(),'bytes':os.path.getsize(o)}
json.dump(rows,open(os.path.join(OUT,'index.json'),'w'),ensure_ascii=False,indent=1)
print(json.dumps(rows,ensure_ascii=False))

# 음파 고리: R438 enemy-shockwave(Dots 계열 충격파, 6×4 칸)를 청회색으로 다시 칠한다(사용자 11-19 07:56Z "색바꿔서 재탕해도됨").
#  밝기는 그대로 두고 색만 (180,200,235) 쪽으로 — 어두운 칸은 먹색, 밝은 칸은 청회색.
src=os.path.join(os.path.dirname(__file__),'..','r96','runtime-text','assets','r438','fx','enemy-shockwave.webp')
im=Image.open(src).convert('RGBA');r,g,b,a=im.split()
L=Image.merge('RGB',(r,g,b)).convert('L')
lo,hi=(14,16,22),(196,214,246)
lut=[tuple(int(lo[c]+(hi[c]-lo[c])*(v/255)**.9) for c in range(3)) for v in range(256)]
rgb=Image.merge('RGB',[L.point([lut[v][c] for v in range(256)]) for c in range(3)])
out=Image.merge('RGBA',(*rgb.split(),a));o=os.path.join(OUT,'sonic-ring.webp');out.save(o,'WEBP',lossless=True,method=6)
rows['sonic-ring']={'path':'assets/r1210/sonic-ring.webp','frames':24,'grid':[6,4],'source':'assets/r438/fx/enemy-shockwave.webp','sourceSha256':hashlib.sha256(open(src,'rb').read()).hexdigest(),'bytes':os.path.getsize(o),'note':'청회색 재채색'}
json.dump(rows,open(os.path.join(OUT,'index.json'),'w'),ensure_ascii=False,indent=1)
print('sonic-ring',rows['sonic-ring'])
