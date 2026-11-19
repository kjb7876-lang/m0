#!/usr/bin/env python3
"""R1219 환도 앞모습(아래) 걷기 — 칼을 칼집에 둔 채 걷기(임시 파생본, Dots 새 시트 전까지).
사용자 2026-11-19 "환도영웅 앞모습모션 더 일관성있게 만들고싶은데 칼집에 칼을둔채로 간지나게 이동하게".

원본 assets/r436/hwando/walk-s.webp(6칸 131×190)는 두 손으로 칼자루를 쥔 채 칼날을 오른쪽 위로 뽑아 든 그림이다.
허리 오른쪽에는 빈 적갈색 칼집이, 손 사이에는 칼자루·코등이가 이미 그려져 있다 → 강철빛 칼날만 지우면
'두 손을 칼집에 꽂힌 칼자루에 얹고 걷는' 거합 자세가 된다.
 1. 칼날 = 칼날 끝쪽 가는 조각(몸 윤곽 열기로 빠지는 픽셀, 칸 오른쪽 위)에서 시작해 무채색(강철빛) 픽셀로 이어 번지는 덩어리 + 1px 가장자리.
 2. 지운 자리 중 몸 윤곽(닫힘 9px) 안쪽은 둘레 옷 픽셀로 안쪽부터 메운다(가려졌던 망토·소매). 바깥은 투명.
 3. 머리·다리·발·칼자루·칼집·알파 윤곽(칼날 밖)은 그대로 → 몸 키·발 기준점·칸 크기·색인(index.json) 불변.
결과: assets/r1219/r436/hwando/walk-s.webp (원래 경로 꼬리를 품는다 — 다른 오버레이 정규식이 'r436/hwando/' 를 본다). 원본은 그대로 둔다.
사용: python3 scripts/r1219-hwando-front-sheath.py   (numpy·Pillow, 로컬 생성용 — CI 검사는 Pillow 만 쓴다)"""
import os,json,hashlib
from collections import deque
import numpy as np
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));AS=os.path.join(HERE,'..','r96','runtime-text','assets')
SRC=os.path.join(AS,'r436','hwando','walk-s.webp');OUT=os.path.join(AS,'r1219','r436','hwando','walk-s.webp')
def erode(m,n=1):
    for _ in range(n):
        p=np.pad(m,1,constant_values=False);m=p[1:-1,1:-1]&p[:-2,1:-1]&p[2:,1:-1]&p[1:-1,:-2]&p[1:-1,2:]&p[:-2,:-2]&p[2:,2:]&p[:-2,2:]&p[2:,:-2]
    return m
def dilate(m,n=1):
    for _ in range(n):
        p=np.pad(m,1,constant_values=False);m=p[1:-1,1:-1]|p[:-2,1:-1]|p[2:,1:-1]|p[1:-1,:-2]|p[1:-1,2:]|p[:-2,:-2]|p[2:,2:]|p[:-2,2:]|p[2:,:-2]
    return m
def cell(A):
    H,W=A.shape[:2];r,g,b,al=[A[:,:,i].astype(int) for i in range(4)]
    op=al>40;body=dilate(erode(op,2),2)
    neu=(al>0)&(abs(r-b)<14)&(abs(r-g)<12)&(abs(g-b)<12)
    X=np.arange(W)[None,:];Y=np.arange(H)[:,None]
    seed=op&~body&neu&(X>55)&(Y<150)
    M=seed.copy();q=deque(zip(*np.nonzero(seed)))
    while q:
        y,x=q.popleft()
        for dy in(-1,0,1):
            for dx in(-1,0,1):
                yy,xx=y+dy,x+dx
                if 0<=yy<H and 0<=xx<W and not M[yy,xx] and neu[yy,xx] and yy<150:M[yy,xx]=True;q.append((yy,xx))
    fr=dilate(M,1)&~M&((al<200)|(abs(r-b)<22))&(Y<150);M|=fr
    keep=(al>0)&~M;closed=erode(dilate(op&~M,4),4)
    fill=M&closed
    out=A.astype(float).copy();out[M]=0
    known=keep.copy();prem=out[:,:,:3]*(out[:,:,3:4]/255.0);a=out[:,:,3].copy()
    todo=fill.copy()
    while todo.any():
        p=np.pad(known,1);cnt=sum(p[1+dy:1+dy+H,1+dx:1+dx+W].astype(int) for dy in(-1,0,1) for dx in(-1,0,1) if dy or dx)
        front=todo&(cnt>=3)
        if not front.any(): front=todo&(cnt>=1)
        if not front.any(): break
        pp=np.pad(prem,((1,1),(1,1),(0,0)));pa=np.pad(a,1);pk=np.pad(known,1)
        sp=np.zeros_like(prem);sa=np.zeros_like(a);n=np.zeros_like(a)
        for dy in(-1,0,1):
            for dx in(-1,0,1):
                if not(dy or dx):continue
                k=pk[1+dy:1+dy+H,1+dx:1+dx+W]
                sp+=pp[1+dy:1+dy+H,1+dx:1+dx+W]*k[...,None];sa+=pa[1+dy:1+dy+H,1+dx:1+dx+W]*k;n+=k
        n=np.maximum(n,1);prem[front]=(sp/n[...,None])[front];a[front]=np.maximum(sa/n,220)[front]
        known|=front;todo&=~front
    res=np.zeros_like(out);aa=np.clip(a,0,255)
    res[:,:,3]=aa;nz=aa>0;res[:,:,:3][nz]=prem[nz]/(aa[nz,None]/255.0)
    res[~(keep|fill)]=0
    res[keep]=A[keep]
    return np.clip(res+.5,0,255).astype(np.uint8),int(M.sum()),int(fill.sum())
# R1219b(사용자 2026-11-19 10:20Z "환도영웅 아래모션 개선해서 적용해줘"): 원화는 머리·몸통이 6칸 내내 한 픽셀도 안 움직여(머리 꼭대기 3·몸통 x ±0.3)
# 팔·어깨가 굳어 보인다 → 다리·발(아래 60줄)은 그대로 두고 상체만 걸음 박자로 움직인다.
#  · 오르내림: 딛는 칸(0·3)에서 1.5px 내려앉고 지나가는 칸에서 올라온다.
#  · 체중 이동: 엉덩이(y=HIP)를 축으로 기울이듯 머리 쪽일수록 더 옮긴다 — 첫 걸음(0~2칸)은 왼쪽, 둘째 걸음(3~5칸)은 오른쪽, 머리에서 최대 SWAY px.
#  허리 아래 BLEND 구간에서 0 으로 부드럽게 줄여 다리와 이음매가 없게 한다(쌍선형 재표본, 알파 곱한 색).
HIP=120.0;SWAY=2.0;BOB=1.0;LEG=60;BLEND=(95.0,130.0)
def motion(k,n):
    ph=2*np.pi*(k+.5)/n
    return -SWAY*np.sin(ph),BOB*np.cos(4*np.pi*k/n)+.5
def warp(C,k,n):
    H,W=C.shape[:2];sx,dy=motion(k,n)
    y=np.arange(H,dtype=float)[:,None];x=np.arange(W,dtype=float)[None,:]
    t=np.clip((BLEND[1]-y)/(BLEND[1]-BLEND[0]),0,1);w=t*t*(3-2*t);w[H-LEG:]=0
    dx=sx*w*np.clip((HIP-y)/(HIP-3),0,None)/1.0;dyy=dy*w
    X=np.broadcast_to(x-dx,(H,W));Y=np.broadcast_to(y-dyy,(H,W))
    a=C[:,:,3:4].astype(float)/255.0;P=np.concatenate([C[:,:,:3]*a,a*255],axis=2)
    x0=np.floor(X).astype(int);y0=np.floor(Y).astype(int);fx=(X-x0)[...,None];fy=(Y-y0)[...,None]
    def g(yy,xx):
        ok=(yy>=0)&(yy<H)&(xx>=0)&(xx<W);v=np.zeros((H,W,4));v[ok]=P[yy[ok],xx[ok]];return v
    R=g(y0,x0)*(1-fx)*(1-fy)+g(y0,x0+1)*fx*(1-fy)+g(y0+1,x0)*(1-fx)*fy+g(y0+1,x0+1)*fx*fy
    out=np.zeros_like(C);al=R[:,:,3];nz=al>0.5
    out[:,:,3]=np.clip(al+.5,0,255).astype(np.uint8);out[nz,:3]=np.clip(R[nz,:3]/(al[nz,None]/255.0)+.5,0,255).astype(np.uint8)
    out[H-LEG:]=C[H-LEG:]
    return out
def main():
    j=json.load(open(os.path.join(AS,'r436','hwando','index.json')))['walk']['s'];n=j['n'];cw,ch=j['cell']
    A=np.array(Image.open(SRC).convert('RGBA'));O=np.zeros_like(A);rep=[]
    for k in range(n):
        o,m,f=cell(A[:,k*cw:(k+1)*cw]);o=warp(o,k,n);O[:,k*cw:(k+1)*cw]=o;sx,dy=motion(k,n);rep.append({'frame':k,'blade_px':m,'filled_px':f,'sway_head_px':round(float(sx),2),'bob_px':round(float(dy),2)})
    os.makedirs(os.path.dirname(OUT),exist_ok=True)
    Image.fromarray(O).save(OUT,'WEBP',lossless=True,quality=100,method=6)
    b=open(OUT,'rb').read()
    meta={'revision':'R1219b-hwando-front-sheath-2','source':'assets/r436/hwando/walk-s.webp','source_sha256':hashlib.sha256(open(SRC,'rb').read()).hexdigest(),
          'file':'walk-s.webp','sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'frames':rep,'temporary':True,
          'front_idle_frame':2,'note':'칼날을 지우고 상체에 걸음 박자 오르내림·체중 이동을 넣은 임시 파생본(다리·발 불변). Dots 칼집 걷기 시트가 오면 바꾼다. 색인·발 기준점·몸 키는 R436 index.json 그대로.'}
    json.dump(meta,open(os.path.join(os.path.dirname(OUT),'r1219.json'),'w'),ensure_ascii=False,indent=1);print(json.dumps(meta,ensure_ascii=False))
if __name__=='__main__':main()
