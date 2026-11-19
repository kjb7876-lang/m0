#!/usr/bin/env python3
"""R1239 '수천 개의 얼굴' 가면 스킬 프레임 시트(생성용 numpy+PIL, 결정적 seed).
원천(읽기 전용, 저장소에 이미 있는 드라이브 HAPIL 그림): r105/drive/prop-mask-1·2·3(갈라진 가면 포함), r408/props/mask-panel(표정 가면 5개).
정본 ep1a11 "가면이 갈라지자 수천 개의 내 얼굴이 나타났다 … 저마다 다른 표정 … 하나의 입을 함께 쓰고".
 · crack8  : 큰 가면이 떨다가 갈라지고(prop-mask-2 금) 두 쪽이 벌어지며 틈에서 작은 얼굴들이 쏟아진다 — 시전자 가슴 앞(256칸 8장).
 · swarm12 : 작은 가면 약 70개가 겹겹이 맴도는 무리(12장 이음 반복) — 영웅 둘레 고리·화면 군중에 여러 장 깔아 '수천 개'.
 · burst10 : 가면 무리가 한 점(하나의 입)으로 모였다가 산산이 깨져 먹·재로 흩어지는 터짐(10장).
 · *-crimson : 루시퍼판(먹 검정+핏빛). 마스크(중간보스)판은 원색(상아·먹).
가로 한 줄 시트, 칸 256×256, 투명 배경. 쓰는 법: python3 scripts/r1239-mask-sheets.py <runtime-text 또는 site>"""
import sys, math, random
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageChops
ROOT=Path(sys.argv[1] if len(sys.argv)>1 else 'r96/runtime-text')
OUT=Path('r96/runtime-text/assets/r1239/fx');OUT.mkdir(parents=True,exist_ok=True)
C=256
def load(p):
    im=Image.open(ROOT/p).convert('RGBA');a=im.getchannel('A').point(lambda v:0 if v<28 else v);im.putalpha(a);return im  # 원본의 옅은 알파 찌꺼기(배경 사각형 비침) 걷기
def trim(im):b=im.getbbox();return im.crop(b) if b else im
# 표정 가면: 판넬에서 밝은(가면) 픽셀만 부드럽게 뽑는다
def panel_masks():
    pn=load('assets/r408/props/mask-panel.webp');A=np.asarray(pn).astype(np.float32)
    boxes=[(86,72,142,152),(50,162,107,228),(118,132,174,206),(42,232,110,302),(112,226,172,292)]
    out=[]
    for b in boxes:
        sub=A[b[1]:b[3],b[0]:b[2]].copy();rgb=sub[...,:3]/255;l=rgb.mean(-1);s=rgb.max(-1)-rgb.min(-1)
        w=np.clip((l-.30)/.22,0,1)*np.clip(1-(s-.10)/.25,0,1)
        wi=Image.fromarray((w*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(.7))
        w=np.asarray(wi).astype(np.float32)/255;sub[...,3]=sub[...,3]*w
        im=trim(Image.fromarray(sub.astype(np.uint8),'RGBA'));out.append(im)
    return out
BASE=[trim(load(f'assets/r105/drive/prop-mask-{i}.webp')) for i in (1,2,3)]
FACES=panel_masks()+BASE
def tint(im,mode):
    if mode=='ivory':return im
    A=np.asarray(im).astype(np.float32)/255;rgb=A[...,:3];l=(rgb*[.3,.59,.11]).sum(-1,keepdims=True)
    # 루시퍼판: 밝은 면 = 상아(얼굴이 읽히게), 중간 = 핏빛, 그늘 = 먹 검정
    lo=np.array([.05,.02,.03]);mid=np.array([.58,.10,.14]);hi=np.array([.97,.88,.84])
    t=np.clip(l,0,1);col=np.where(t<.5,lo+(mid-lo)*(t/.5),mid+(hi-mid)*((t-.5)/.5))
    return Image.fromarray((np.concatenate([col,A[...,3:]],-1)*255).astype(np.uint8),'RGBA')
def sprite(k,size,rot,alpha,mode,flip=False,cache={}):
    key=(k,int(size),int(rot)%360,round(alpha,2),mode,flip)
    if key in cache:return cache[key]
    im=tint(FACES[k],mode)
    if flip:im=im.transpose(Image.FLIP_LEFT_RIGHT)
    s=size/max(im.size);im=im.resize((max(2,int(im.width*s)),max(2,int(im.height*s))),Image.LANCZOS).rotate(rot,expand=True,resample=Image.BICUBIC)
    if alpha<1:a=im.getchannel('A').point(lambda v:int(v*alpha));im.putalpha(a)
    cache[key]=im;return im
def ink_shadow(im,alpha=.55):
    a=im.getchannel('A').filter(ImageFilter.GaussianBlur(2.2)).point(lambda v:int(v*alpha))
    sh=Image.new('RGBA',im.size,(8,6,10,0));sh.putalpha(a);return sh
def paste(canvas,im,cx,cy,shadow=True):
    x,y=int(cx-im.width/2),int(cy-im.height/2)
    if shadow:canvas.alpha_composite(ink_shadow(im),(max(-999,x+2),y+3)) if x+2>=0 and y+3>=0 and x+2+im.width<=canvas.width and y+3+im.height<=canvas.height else None
    if x>=0 and y>=0 and x+im.width<=canvas.width and y+im.height<=canvas.height:canvas.alpha_composite(im,(x,y))
    else:
        tmp=Image.new('RGBA',canvas.size,(0,0,0,0));tmp.paste(im,(x,y),im);canvas.alpha_composite(tmp)
def strip(frames):
    s=Image.new('RGBA',(C*len(frames),C),(0,0,0,0))
    for i,f in enumerate(frames):s.paste(f,(i*C,0),f)
    return s
def swarm(mode,n=72,N=12,seed=1239):
    R=random.Random(seed);ms=[]
    for i in range(n):
        depth=R.random()
        ms.append(dict(k=R.randrange(len(FACES)),r=R.uniform(18,112),a0=R.uniform(0,2*math.pi),cyc=R.choice([1,1,2,-1]),sq=R.uniform(.42,.62),
            size=13+30*depth**1.3,depth=depth,rot0=R.uniform(-35,35),wob=R.uniform(6,22),ph=R.uniform(0,2*math.pi),bob=R.uniform(2,7),flip=R.random()<.5))
    ms.sort(key=lambda m:m['depth'])
    fr=[]
    for f in range(N):
        cv=Image.new('RGBA',(C,C),(0,0,0,0));u=f/N
        for m in ms:
            a=m['a0']+2*math.pi*m['cyc']*u;x=C/2+math.cos(a)*m['r'];y=C/2+math.sin(a)*m['r']*m['sq']+math.sin(2*math.pi*u*2+m['ph'])*m['bob']
            rot=m['rot0']+math.sin(2*math.pi*u+m['ph'])*m['wob'];alpha=.45+.55*m['depth']
            paste(cv,sprite(m['k'],m['size'],rot,alpha,mode,m['flip']),x,y,shadow=m['depth']>.35)
        fr.append(cv)
    return strip(fr)
def crack(mode):
    whole=tint(BASE[0],mode);cr=tint(BASE[1],mode);fr=[];R=random.Random(7)
    small=[dict(k=R.randrange(len(FACES)),a=R.uniform(-2.6,-.5) if R.random()<.5 else R.uniform(.5,2.6),v=R.uniform(.5,1),s=R.uniform(10,24),rot=R.uniform(-40,40)) for _ in range(46)]
    for f in range(8):
        cv=Image.new('RGBA',(C,C),(0,0,0,0))
        H=170
        if f<3:
            im=whole.resize((int(whole.width*H/whole.height),H),Image.LANCZOS);jit=(f%2*2-1)*(1+f)
            glow=ink_shadow(im,.35+.12*f);paste(cv,glow.filter(ImageFilter.GaussianBlur(3)),C/2,C/2+4,False);paste(cv,im.rotate(jit,expand=True,resample=Image.BICUBIC),C/2+jit,C/2,True)
        else:
            im=cr.resize((int(cr.width*H/cr.height),H),Image.LANCZOS);g=(f-3)/4
            w=im.width;cut=int(w*.55)
            L=im.crop((0,0,cut,im.height));Rr=im.crop((cut,0,w,im.height))
            off=g*40;al=max(0,1-g*1.55)
            for half,dx,rot in ((L,-off,-g*14),(Rr,off,g*18)):
                h2=half.rotate(rot,expand=True,resample=Image.BICUBIC);a=h2.getchannel('A').point(lambda v:int(v*al));h2.putalpha(a)
                paste(cv,h2,C/2+dx+(-cut/2 if half is L else (w-cut)/2)*.0+( -w*.18 if half is L else w*.22),C/2+g*10,True)
            k=int(len(small)*min(1,g*1.3+.15))
            for m in small[:k]:
                d=40+g*110*m['v'];x=C/2+math.cos(m['a'])*d*.55;y=C/2+math.sin(m['a'])*d*.45-10
                paste(cv,sprite(m['k'],m['s']*(.6+.6*g),m['rot']+g*60,min(1,.4+g),mode),x,y,True)
        fr.append(cv)
    return strip(fr)
def burst(mode):
    R=random.Random(99);parts=[dict(k=R.randrange(len(FACES)),a=R.uniform(0,2*math.pi),r0=R.uniform(60,120),v=R.uniform(.6,1.25),s=R.uniform(10,30),rot=R.uniform(-60,60)) for _ in range(90)]
    fr=[]
    for f in range(10):
        cv=Image.new('RGBA',(C,C),(0,0,0,0));u=f/9
        if f<4:# 모여든다(하나의 입)
            g=f/3
            for m in parts:
                r=m['r0']*(1-g*.85);x=C/2+math.cos(m['a']+g*1.2)*r;y=C/2+math.sin(m['a']+g*1.2)*r*.6
                paste(cv,sprite(m['k'],m['s']*(1-.3*g),m['rot']*(1-g),.55+.45*g,mode),x,y,True)
        else:# 깨져 흩어진다 — 조각은 작아지고 먹·재로 옅어진다
            g=(f-4)/5
            core=Image.new('RGBA',(C,C),(0,0,0,0));A=np.zeros((C,C,4),np.float32)
            yy,xx=np.mgrid[0:C,0:C];d=np.hypot(xx-C/2,(yy-C/2)/.6)
            ring=np.exp(-((d-(30+150*g))/(16+14*g))**2)*(1-g)
            col=(np.array([.92,.86,.80]) if mode=='ivory' else np.array([.55,.06,.10]))
            A[...,:3]=col*(.7+.3*ring[...,None]);A[...,3]=np.clip(ring*.42,0,1)
            ink=np.exp(-(d/(40+90*g))**2)*(1-g)*.55;A[...,:3]=A[...,:3]*(1-ink[...,None])+np.array([.03,.02,.03])*ink[...,None];A[...,3]=np.clip(A[...,3]+ink,0,1)
            core=Image.fromarray((A*255).astype(np.uint8),'RGBA').filter(ImageFilter.GaussianBlur(1.5));cv.alpha_composite(core)
            for m in parts:
                r=10+m['v']*170*g;x=C/2+math.cos(m['a'])*r;y=C/2+math.sin(m['a'])*r*.6
                sp=sprite(m['k'],max(4,m['s']*(1-.7*g)),m['rot']+g*200*m['v'],max(.05,1-g*1.05),mode)
                # 깨짐: 반쪽만 남긴다
                if g>.2:sp=sp.crop((0,0,max(2,sp.width//2),sp.height)) if m['v']>.9 else sp
                paste(cv,sp,x,y,g<.6)
        fr.append(cv)
    return strip(fr)
for mode,suf in (('ivory',''),('crimson','-crimson')):
    for name,fn in (('crack8',crack),('swarm12',swarm),('burst10',burst)):
        im=fn(mode);p=OUT/f'mask-{name}{suf}.webp';im.save(p,'WEBP',quality=84,method=6);print(p.name,im.size,p.stat().st_size)
