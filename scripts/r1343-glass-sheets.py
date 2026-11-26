#!/usr/bin/env python3
"""R1343 금이 간 안경 보스(레비아탄) '유리 조각 폭풍' 임시 프레임 시트 3종.
원천(게임에 이미 쓰는 승인 그림만, 읽기 전용): R1206 유리 조각 그림(assets/r1206/props/shard.webp),
R106 금 이펙트(assets/r106/fx/crack.webp).
※ 임시: Dots SW-3D-R1343 02a·02b·02c 가 오면 교체한다(최종 아트 아님).
 shard-fly8  : 128×128 ×8 — +X 로 날아가는 조각이 축 둘레로 돌며(가로 폭 cos) 반사광이 스친다.
 burst12     : 384×384 ×12 — 보스 몸 앞 공중에서 조각 20개가 사방으로 터져 흩날림(바닥 원 없음).
 embed8      : 160×160 ×8 — 조각 끝이 아래 가운데(벽면 점)로 박히며 튐·작은 금, 뒤 칸은 꽂힌 채 반사광 한 번.
"""
import math, random, sys
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageChops
ROOT=Path(__file__).resolve().parents[1]/'r96/runtime-text/assets'
OUT=ROOT/'r1343'; OUT.mkdir(parents=True,exist_ok=True)
SH=Image.open(ROOT/'r1206/props/shard.webp').convert('RGBA')   # 136×208, 끝이 위
CR=Image.open(ROOT/'r106/fx/crack.webp').convert('RGBA')
TEAL=(70,200,190)

def tint(im,col,amt):
    r,g,b,a=im.split();base=Image.merge('RGB',(r,g,b));t=Image.new('RGB',im.size,col)
    m=Image.blend(base,t,amt);out=m.convert('RGBA');out.putalpha(a);return out
def glint(im,u,strength=.9):
    """대각선 반사광 띠(u: 0~1 위치) — 조각 알파 안에서만 밝힌다."""
    w,h=im.size;band=Image.new('L',(w,h),0);px=band.load()
    for y in range(h):
        for x in range(w):
            d=(x/w+y/h)/2-u
            v=max(0.,1-abs(d)/.09);px[x,y]=int(255*v*strength)
    a=im.split()[3];band=ImageChops.multiply(band,a)
    white=Image.new('RGBA',(w,h),(255,255,255,0));white.putalpha(band)
    return Image.alpha_composite(im,white)
def pointing_right(im):
    return im.rotate(-90,expand=True,resample=Image.BICUBIC)  # 끝이 위 → 오른쪽
def sheet(frames,cw,ch,name):
    S=Image.new('RGBA',(cw*len(frames),ch),(0,0,0,0))
    for i,f in enumerate(frames):S.alpha_composite(f,(i*cw,0))
    S.save(OUT/name,'WEBP',quality=92,method=6);print(name,S.size,(OUT/name).stat().st_size)

# ---- shard-fly8 ----
base=tint(SH,TEAL,.22);base=ImageEnhance.Contrast(base).enhance(1.25)
R=pointing_right(base)  # 208×136
fly=[]
for i in range(8):
    spin=i/8*math.pi*2;k=.35+.65*abs(math.cos(spin))
    f=R.resize((104,max(6,int(68*k))),Image.BICUBIC)
    f=glint(f,(i/8*1.6-.3)%1.2-.1,.85 if abs(math.cos(spin))>.5 else .5)
    f=f.rotate(math.sin(spin)*9,expand=True,resample=Image.BICUBIC)
    c=Image.new('RGBA',(128,128),(0,0,0,0));c.alpha_composite(f,((128-f.width)//2,(128-f.height)//2));fly.append(c)
sheet(fly,128,128,'shard-fly8.webp')

# ---- burst12 ----
rnd=random.Random(1343)
pieces=[]
for n in range(20):
    a=n/20*math.pi*2+rnd.uniform(-.12,.12);s=rnd.uniform(.16,.34);sp=rnd.uniform(.8,1.15)
    pieces.append((a,s,sp,rnd.uniform(0,360),rnd.uniform(-200,200)))
burst=[]
for i in range(12):
    u=i/11;c=Image.new('RGBA',(384,384),(0,0,0,0))
    # 청록 섬광(앞 4칸) — 공중의 빛, 바닥 원 아님
    if i<5:
        g=Image.new('L',(384,384),0);gp=g.load();R0=40+30*i;amp=(1-i/5)
        for y in range(120,264):
            for x in range(120,264):
                d=math.hypot(x-192,y-192);gp[x,y]=int(max(0,1-d/R0)**2*230*amp)
        glow=Image.new('RGBA',(384,384),(150,240,230,0));glow.putalpha(g.filter(ImageFilter.GaussianBlur(6)));c.alpha_composite(glow)
    ease=1-(1-u)**2.2
    for (a,s,sp,r0,rv) in pieces:
        d=12+ease*150*sp;x=192+math.cos(a)*d;y=192+math.sin(a)*d*.92
        p=base.resize((max(4,int(136*s)),max(6,int(208*s))),Image.BICUBIC)
        p=p.rotate(r0+rv*u-math.degrees(a)-90,expand=True,resample=Image.BICUBIC)
        al=p.split()[3].point(lambda v:int(v*max(0,min(1,(1.15-u)*1.4))));p.putalpha(al)
        c.alpha_composite(p,(int(x-p.width/2),int(y-p.height/2)))
    burst.append(c)
sheet(burst,384,384,'burst12.webp')

# ---- embed8 ----
# 금(벽 균열): R106 금 이펙트를 작게, 청록 기운으로.
crack=tint(CR.resize((96,96),Image.BICUBIC),(190,235,230),.35)
emb=[]
P=base.resize((58,90),Image.BICUBIC).rotate(180,expand=True)  # 끝이 아래(벽면 점)
for i in range(8):
    c=Image.new('RGBA',(160,160),(0,0,0,0))
    if i>=1:
        ca=crack.copy();k=min(1,i/3)*.55;ca.putalpha(ca.split()[3].point(lambda v:int(v*k)))
        c.alpha_composite(ca,(80-48,150-48))
    depth=[-26,-6,6,10,10,10,10,10][i]
    sq=[1.0,1.0,.86,1.04,1.0,1.0,1.0,1.0][i]
    q=P.resize((P.width,int(P.height*sq)),Image.BICUBIC)
    if 4<=i<=6:q=glint(q,(i-4)/2*1.1-.05,.9)
    c.alpha_composite(q,(80-q.width//2,160-q.height+depth-10))
    if i in (1,2):  # 튀는 작은 조각
        for j in range(5):
            a=math.pi*(1.1+j*.2);d=14+i*12
            m=base.resize((10,16)).rotate(j*70,expand=True)
            c.alpha_composite(m,(int(80+math.cos(a)*d*1.3),int(150+math.sin(a)*d)))
    if i==1:
        fl=Image.new('L',(160,160),0);fp=fl.load()
        for y in range(110,160):
            for x in range(50,110):fp[x,y]=int(max(0,1-math.hypot(x-80,y-148)/26)**2*255)
        w=Image.new('RGBA',(160,160),(230,255,250,0));w.putalpha(fl);c.alpha_composite(w)
    emb.append(c)
sheet(emb,160,160,'embed8.webp')
