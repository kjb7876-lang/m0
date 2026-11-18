#!/usr/bin/env python3
"""R1177: 사몽 에피소드에 남은 픽셀(도트) 그림을 저장소 안의 칠한 그림으로 바꾼 자산을 만든다(원본은 읽기만).
  s06-invader-walk-right-8.webp   : R184 임시 픽셀 침공병 대신 — Dots CX-0067MV 펄스 척후병(dys-pulse-raider-v2 걷기 8칸)
  s06-rival-walk-right-8.webp     : R184 임시 픽셀 '상대 초인' 대신 — Dots 전선 절단자(dys-cleaver-v4 걷기 4칸×2)를 먹빛 강철로 물들이고 가슴에 붉은 AI 코어 빛
  s06-commander-walk-right-8.webp : R184 임시 픽셀 '지휘 개체' 대신 — Dots 심해 연산거수(dys-behemoth-v1 걷기 4칸×2)를 검붉게, 1.3배 크게
   (세 장 모두 R161 규격: 1024x640, 4x2, 칸 256x320, 발 기준 101.8,299.5, 오른쪽 보기)
  void-implosion-blood.webp : pixelfx pvfx-void-implosion(기억 조각 탑이 깨질 때) 대신 — R411 boss-gravity-well 11~23번(줄어드는 소용돌이)을 핏빛으로
  rift-blood.webp           : pixelfx pvfx-rift-portal(피의 육망성 조형물 균열 문, 반복) 대신 — R411 boss-gravity-well 6~12번을 핏빛으로(반복)
  choir-moths-blood.webp    : pixelfx pvfx-choir-moths(기억 조각 수집물 줍기, 반복) 대신 — Dots 잿빛 나방(ash-moth-v2) 날갯짓 칸 여섯 마리가 흩어지며 사라지는 20장
사용: python3 scripts/r1177-samong-pixel-art.py <runtime-text 경로> <출력 assets/r1177 경로>"""
import sys,json,hashlib,math
from pathlib import Path
import numpy as np
from PIL import Image,ImageFilter
SRC=Path(sys.argv[1]);OUT=Path(sys.argv[2]);OUT.mkdir(parents=True,exist_ok=True)
A=lambda p:Image.open(SRC/'assets'/p).convert('RGBA')
def rgb2hsv(a):
    r,g,b=a[...,0],a[...,1],a[...,2];mx=a[...,:3].max(-1);mn=a[...,:3].min(-1);d=mx-mn+1e-6
    h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))/6;s=np.where(mx>0,d/(mx+1e-6),0);return h,s,mx
def hsv2rgb(h,s,v):
    i=(np.floor(h*6)%6).astype(int);f=h*6-np.floor(h*6);p=v*(1-s);q=v*(1-f*s);t=v*(1-(1-f)*s)
    return np.stack([np.choose(i,[v,q,p,p,t,v]),np.choose(i,[t,v,v,q,p,p]),np.choose(i,[p,p,t,v,v,q])],-1)
def recolor(im,hue,sat=1.0,val=1.0):
    a=np.asarray(im).astype(np.float32)/255;h,s,v=rgb2hsv(a);out=hsv2rgb(np.full_like(h,hue),np.clip(s*sat,0,1),np.clip(v*val,0,1))
    return Image.fromarray((np.dstack([out,a[...,3]])*255+.5).clip(0,255).astype(np.uint8),'RGBA')
def grade(im,mul,sat=1.0):
    """색 곱하기 + 채도 조절(먹빛·검붉게)."""
    a=np.asarray(im).astype(np.float32)/255;rgb=a[...,:3];l=rgb.mean(-1,keepdims=True);rgb=l+(rgb-l)*sat;rgb=rgb*np.array(mul,np.float32)
    return Image.fromarray((np.dstack([rgb.clip(0,1),a[...,3]])*255+.5).astype(np.uint8),'RGBA')
def save(im,name,q=86,**kw):
    p=OUT/name;im.save(p,'WEBP',quality=q,method=6);b=p.read_bytes();return dict(file=name,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),size=list(im.size),**kw)
def cells(im,cw,ch,idx,cols):return [im.crop(((i%cols)*cw,(i//cols)*ch,(i%cols)*cw+cw,(i//cols)*ch+ch)) for i in idx]
CW,CH,PX,PY=256,320,101.8,299.5
def r161sheet(frames,pivot,scale,glow=None):
    """프레임(원본 칸, 원본 발 기준점)을 R161 칸(발 101.8,299.5)으로 옮겨 4x2 시트로. 칸 밖으로 잘리는 비율을 돌려준다."""
    sheet=Image.new('RGBA',(CW*4,CH*2));lost=0
    for k,fr in enumerate(frames):
        w,h=fr.size;f=fr.resize((max(1,round(w*scale)),max(1,round(h*scale))),Image.LANCZOS)
        if glow:f=glow(f,scale,k)
        ox=round(PX-pivot[0]*scale);oy=round(PY-pivot[1]*scale)
        cell=Image.new('RGBA',(CW,CH));cell.alpha_composite(f,(0,0),(max(0,-ox),max(0,-oy))) if False else None
        big=Image.new('RGBA',(CW*3,CH*3));big.alpha_composite(f,(ox+CW,oy+CH));cell=big.crop((CW,CH,2*CW,2*CH))
        tot=np.asarray(f)[...,3].astype(float).sum();kept=np.asarray(cell)[...,3].astype(float).sum();lost=max(lost,1-kept/max(1,tot))
        sheet.alpha_composite(cell,((k%4)*CW,(k//4)*CH))
    return sheet,lost
idx={'revision':'R1177','generator':'scripts/r1177-samong-pixel-art.py','files':{}}
# 1 침공병: 펄스 척후병 걷기 8칸(4~11), 칸 256x320 발 148.75,300 → 몸 높이 265 → R161 몸 214.5
pr=A('r380/mobs/dys-pulse-raider-v2-walk-d1.webp');fr=cells(pr,256,320,range(4,12),12)
sh,lost=r161sheet(fr,(148.75,300),214.5/265*1.05);assert lost<.03,('invader clip',lost)
idx['files']['s06-invader']=save(sh,'s06-invader-walk-right-8.webp',source='assets/r380/mobs/dys-pulse-raider-v2-walk-d1.webp 4-11 (Dots CX-0067MV)',clip=round(lost,4),use='외계 침공군(DYS-01) — R161 꼭두각시 자리 S-06')
# 2 상대 초인: 전선 절단자 걷기 0~3 ×2, 먹빛 강철 + 붉은 AI 코어(가슴) 빛
cl=A('r380/mobs/dys-cleaver-v4.webp');fr=[grade(c,(0.62,0.6,0.66),0.35) for c in cells(cl,256,256,[0,1,2,3,0,1,2,3],8)]
def core(f,s,k):
    a=np.asarray(f).astype(np.float32);H,W=a.shape[:2];al=a[...,3]>40;ys,xs=np.nonzero(al)
    if not len(xs):return f
    cx=xs.mean()-0.06*W;cy=ys.min()+(ys.max()-ys.min())*0.36;pul=1+0.12*math.sin(k*math.pi/2)
    yy,xx=np.mgrid[0:H,0:W];d=np.hypot(xx-cx,yy-cy)/(9*s*pul);g=np.exp(-d*d)*al;g2=np.exp(-(d/2.6)**2)*al
    rgb=a[...,:3];rgb=rgb+np.stack([255*g*0.95+120*g2*0.5,40*g+10*g2,40*g+12*g2],-1)
    a[...,:3]=rgb.clip(0,255);return Image.fromarray(a.astype(np.uint8),'RGBA')
sh,lost=r161sheet(fr,(128.25,240.5),232/199.5,glow=core);assert lost<.03,('rival clip',lost)
idx['files']['s06-rival']=save(sh,'s06-rival-walk-right-8.webp',source='assets/r380/mobs/dys-cleaver-v4.webp 0-3 (Dots) 먹빛 강철 + 붉은 코어',clip=round(lost,4),use='상대 초인(DYS-03 보스)')
# 3 지휘 개체: 심해 연산거수 걷기 0~3 ×2, 검붉게, 크게
bh=A('r380/mobs/dys-behemoth-v1.webp');fr=[grade(c,(1.0,0.72,0.72),0.9) for c in cells(bh,256,256,[0,1,2,3,0,1,2,3],8)]
sh,lost=r161sheet(fr,(129.5,240.5),282/212.5);assert lost<.06,('commander clip',lost)
idx['files']['s06-commander']=save(sh,'s06-commander-walk-right-8.webp',source='assets/r380/mobs/dys-behemoth-v1.webp 0-3 (Dots) 검붉게',clip=round(lost,4),use='상급 지휘 개체/지휘 기체(DYS-06·DYS-10)')
# 4 기억 조각 파괴: 중력 우물 11~23(줄어듦) 핏빛 13장
gw=A('r411/fx/boss-gravity-well.webp');fr=cells(gw,256,256,range(11,24),6);s=Image.new('RGBA',(256*13,256))
for i,c in enumerate(fr):s.alpha_composite(c,(i*256,0))
idx['files']['void-implosion-blood']=save(recolor(s,.985,1.6,.72),'void-implosion-blood.webp',source='assets/r411/fx/boss-gravity-well.webp 11-23',frame=[256,256],columns=13,frames=13,pivot=[128,150])
# 5 균열 문: 6~12 핏빛 7장(반복)
fr=cells(gw,256,256,range(6,13),6);s=Image.new('RGBA',(256*7,256))
for i,c in enumerate(fr):s.alpha_composite(c,(i*256,0))
idx['files']['rift-blood']=save(recolor(s,.985,1.6,.7),'rift-blood.webp',source='assets/r411/fx/boss-gravity-well.webp 6-12',frame=[256,256],columns=7,frames=7,pivot=[128,150])
# 6 나방: ash-moth-v2 칸(1536x240 → 8칸 192x240) 날갯짓 6마리가 바깥으로 흩어지며 사라짐, 20장 반복, 핏빛 기운
mo=A('r380/mobs/ash-moth-v2.webp');mw=mo.size[0]//8;mc=[c.crop(c.getbbox()) for c in cells(mo,mw,240,range(8),8)]
mc=[grade(c,(1.35,0.95,0.9),1.05) for c in mc];N=20;s=Image.new('RGBA',(256*N,256));rng=np.random.default_rng(1177)
moths=[(i*math.tau/6+rng.uniform(-.3,.3),rng.uniform(.75,1.1),int(rng.integers(0,8)),rng.uniform(0,1)) for i in range(6)]
for f in range(N):
    for ang,spd,ph,off in moths:
        u=((f/N)+off)%1.0;r=18+92*u*spd;x=128+math.cos(ang)*r;y=150+math.sin(ang)*r*.62-36*u
        c=mc[(ph+f)%8];sc=(0.44-0.12*u)*(1 if math.cos(ang)>=0 else 1);m=c.resize((max(1,round(c.size[0]*sc)),max(1,round(c.size[1]*sc))),Image.LANCZOS)
        if math.cos(ang)<0:m=m.transpose(Image.FLIP_LEFT_RIGHT)
        al=np.asarray(m).astype(np.float32);al[...,3]*=min(1,u*6)*(1-u)**.8;m=Image.fromarray(al.astype(np.uint8),'RGBA')
        s.alpha_composite(m,(f*256+round(x-m.size[0]/2),round(y-m.size[1]/2)))
idx['files']['choir-moths-blood']=save(s,'choir-moths-blood.webp',source='assets/r380/mobs/ash-moth-v2.webp (Dots) 날갯짓 8칸',frame=[256,256],columns=N,frames=N,pivot=[128,150])
# 7 중간보스 등장 손: R411 촉수 감기(24장)를 더 짙은 핏빛으로, 바닥에서 솟는 앞 18장만(손이 움켜쥐고 가라앉는 길이)
tb=A('r411/fx/boss-tentacle-bind.webp');fr=cells(tb,256,256,range(18),6);s=Image.new('RGBA',(256*6,256*3))
for i,c in enumerate(fr):s.alpha_composite(c,((i%6)*256,(i//6)*256))
idx['files']['hands-blood']=save(recolor(s,.99,1.3,.78),'hands-blood.webp',82,source='assets/r411/fx/boss-tentacle-bind.webp 0-17',frame=[256,256],columns=6,frames=18,pivot=[128,200])
(OUT/'index.json').write_text(json.dumps(idx,ensure_ascii=False,indent=1)+'\n');print(json.dumps({k:(v['bytes'],v.get('clip')) for k,v in idx['files'].items()}))
