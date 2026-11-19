# R1226 안정화 집행체(ep1a08) 시트: 같은 가면 잡역부 계열(병원 그림)의 걷기 8칸·공격 4칸(assets/r92/mobs/M012-move·attack, '오만의 흰 가면'과 같은 원본)을
#  R248 시트 틀(256×320 칸, 4×3, 걷기 0-7·공격 8-11, 발 128,300)로 묶는다. 오만의 흰 가면·백의 구속자와 구분되게 흰 가운을 수술복 청록 쪽으로 옮긴다.
#  임시본 — Dots CX-0170SO(걷기 8·공격 4·피격 4) 가 오면 바꾼다. 원본은 읽기만 한다. 칸마다 몸 키·발 위치는 원본 그대로(확대하지 않음).
import sys
from pathlib import Path
from PIL import Image
import numpy as np
root=Path(__file__).resolve().parents[1]
def src(p):
    for b in ('r96/runtime-text/assets/','r96/hospital-three-pc/site/assets/'):
        if (root/b/p).exists(): return root/b/p
    raise SystemExit('missing '+p)
out=Path(sys.argv[1]) if len(sys.argv)>1 else root/'r96/runtime-text/assets/r1226/mobs/m015-stabilizer.webp'
def teal(im):
    a=np.array(im.convert('RGBA')).astype(float);rgb=a[:,:,:3]/255;mx=rgb.max(2);mn=rgb.min(2);l=(mx+mn)/2
    s=np.where(mx>mn,(mx-mn)/np.maximum(1e-6,1-np.abs(2*l-1)),0)
    w=np.clip((l-.40)/.25,0,1)*np.clip((.38-s)/.25,0,1)   # 밝고 채도 낮은 곳(흰 가운)만
    t=np.array([.50,.70,.68]);rgb=rgb*(1-w[...,None]*.6)+(t*l[...,None]*1.25)*(w[...,None]*.6)
    a[:,:,:3]=np.clip(rgb,0,1)*255;return Image.fromarray(a.astype('uint8'),'RGBA')
def cells(p,n):
    im=teal(Image.open(src(p)));w=im.width//n;return [im.crop((i*w,0,(i+1)*w,im.height)) for i in range(n)]
walk=cells('r92/mobs/M012-move.png',8);atk=cells('r92/mobs/M012-attack.png',4)
sheet=Image.new('RGBA',(1024,960),(0,0,0,0));bodies=[]
for i,c in enumerate(walk+atk):
    bb=c.getbbox();c=c.crop(bb);bodies.append(c.height)
    col,row=i%4,i//4;x=col*256+128-c.width//2;y=row*320+300-c.height
    sheet.alpha_composite(c,(x,y))
out.parent.mkdir(parents=True,exist_ok=True);sheet.save(out,'WEBP',lossless=True,method=6)
print(out,out.stat().st_size,'body(walk median)',sorted(bodies[:8])[4])
