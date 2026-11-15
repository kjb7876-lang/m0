#!/usr/bin/env python3
"""R1063 환도 옷 질감 통일 — 사용자 2026-11-15 "환도영웅 지금 아래이동모션 좋은데 옷등 질감이 다른모션이랑달라서 디테일개선적용해줘".

기준 = 아래 걷기 v2(assets/r436/hwando/walk-s.webp, 그림·동작 그대로 둔다). 게임이 그리는 나머지 환도 시트 9장
(R283 색 맞춤본 걷기 좌·우·위, R439 공격 우, R242 공격 아래·위, 피격 우·위·아래)은 색은 이미 R283 으로 같지만
옷 결이 다르다: 밝기를 세 띠(잔결 = 1px 흐림과의 차, 주름 = 1~3px, 덩어리 = 3~8px)로 나눠 재면
기준보다 잔결이 17~41% 거칠고 덩어리 명암이 8~29% 얕다(자글자글하고 납작해 보이는 까닭).
→ 시트마다 세 띠의 배율을 풀어 기준 수치에 맞춘 파생본을 assets/r1063/<원래 경로> 에 무손실로 쓴다.
바꾸지 않는 것: 알파(윤곽·몸 키·발 기준점·칸 크기), 색상·채도(밝기 비로만 곱함), 칼날 같은 가는 조각(R439 검끝 손질 유지), 원본 파일.
사용: python3 scripts/r1063-hwando-texture.py   (numpy·Pillow)"""
import os,json,hashlib
import numpy as np
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));A=os.path.join(HERE,'..','r96','runtime-text','assets')
REF='assets/r436/hwando/walk-s.webp'
CLIPS=['assets/r283/hwando/r271/walk-e.webp','assets/r283/hwando/r271/walk-w.webp','assets/r283/hwando/r271/walk-n.webp','assets/r439/hwando/attack-e.webp',
       'assets/r283/hwando/r242/attack-s.webp','assets/r283/hwando/r242/attack-n.webp','assets/r283/hwando/r242/hit-e.webp','assets/r283/hwando/r242/hit-n.webp','assets/r283/hwando/r242/hit-s.webp']
W=np.array([.299,.587,.114]);SIG=(1.0,3.0,8.0);GMIN,GMAX=.4,2.5
out_path=lambda src:src.replace('assets/','assets/r1063/',1)
def gauss(x,s):
    r=int(3*s+.5);k=np.exp(-.5*(np.arange(-r,r+1)/s)**2);k/=k.sum()
    p=np.pad(x,((0,0),(r,r)),mode='edge');x=sum(k[i]*p[:,i:i+x.shape[1]] for i in range(2*r+1))
    p=np.pad(x,((r,r),(0,0)),mode='edge');return sum(k[i]*p[i:i+x.shape[0],:] for i in range(2*r+1))
def erode(m,n=1):
    for _ in range(n):
        p=np.pad(m,1,constant_values=False);m=p[1:-1,1:-1]&p[:-2,1:-1]&p[2:,1:-1]&p[1:-1,:-2]&p[1:-1,2:]
    return m
def dilate(m,n=1):
    for _ in range(n):
        p=np.pad(m,1,constant_values=False);m=p[1:-1,1:-1]|p[:-2,1:-1]|p[2:,1:-1]|p[1:-1,:-2]|p[1:-1,2:]
    return m
def blur(x,s,msk):return gauss(np.where(msk,x,0),s)/np.maximum(gauss(msk.astype(float),s),1e-6)
def bands(lum,m):
    b1,b3,b8=(blur(lum,s,m) for s in SIG);return b1,b3,b8
def metrics(a):
    al=a[...,3];rgb=a[...,:3];lum=rgb@W;m=al>.8;inner=erode(m,3)
    mx,mn=rgb.max(2),rgb.min(2);sat=np.where(mx>0,(mx-mn)/np.maximum(mx,1e-6),0);cloth=inner&(sat<.3)&(lum>.35)
    if not cloth.any():return dict(grain=0.,fold=0.,form=0.,clothSat=0.,clothLum=0.)
    b1,b3,b8=bands(lum,m)
    return dict(grain=float(np.abs(lum-b1)[cloth].mean()),fold=float(np.abs(b1-b3)[cloth].mean()),form=float(np.abs(b3-b8)[cloth].mean()),
                clothSat=float(sat[cloth].mean()),clothLum=float(lum[cloth].mean()))
def body_weight(al):
    """몸통 무게 0~1: 4px 열기로 칼날·가는 조각을 빼고 가장자리는 부드럽게."""
    m=al>.8;core=dilate(erode(m,4),4)&m;return np.clip(gauss(core.astype(float),1.5),0,1)*core
def apply(a,gains):
    off=float(gains[3]) if len(gains)>3 and np.isfinite(gains[3]) else 0.;gG,gF,gM=(float(np.clip(g,GMIN,GMAX)) if np.isfinite(g) else 1. for g in gains[:3])
    al=a[...,3];rgb=a[...,:3];lum=rgb@W;m=al>.8;res=a.copy()
    if not m.any():return res
    b1,b3,b8=bands(lum,m);new=b8+gM*(b3-b8)+gF*(b1-b3)+gG*(lum-b1)+off
    l2=np.clip(lum+(new-lum)*body_weight(al),0,1);ratio=np.clip(np.where(lum>1e-4,l2/np.maximum(lum,1e-4),1),.5,2)
    out=np.clip(rgb*ratio[...,None],0,1);out=np.where(np.isfinite(out),out,rgb);res[...,:3]=np.where(m[...,None],out,rgb);return res
def quant(a):return np.round(np.clip(a,0,1)*255).astype(np.uint8).astype(np.float64)/255
def solve(a,ref,rounds=12):
    g=np.ones(3);off=0.;base=metrics(a)['clothLum']
    for _ in range(rounds):
        m=metrics(quant(apply(a,list(g)+[off])));cur=np.array([m['grain'],m['fold'],m['form']]);tgt=np.array([ref['grain'],ref['fold'],ref['form']])
        if not (cur>1e-6).all():break
        g=np.clip(g*(tgt/cur)**.85,GMIN,GMAX);off=float(np.clip(off+(base-m['clothLum'])*.8,-.08,.08))
    return [float(x) for x in g]+[off]
# ── 가죽(신발): 기준은 짙은 적갈색 가죽인데 다른 시트는 밝고 누런 가죽이라 발밑만 따로 맞춘다 ──
def foot_bands(rec,H):
    """칸 줄마다 발 띠(발 기준점 위 몸 키 16% ~ 아래 3px) 행 범위."""
    ch=rec['cell'][1];ay=rec['anchor'][1];body=rec.get('body') or 180;rows=max(1,-(-rec['n']//rec.get('cols',rec['n'])))
    return [(max(0,int(r*ch+ay-body*.16)),min(H,int(r*ch+ay+3))) for r in range(rows)]
def leather_weight(a,bands):
    al=a[...,3];rgb=a[...,:3];lum=rgb@W;mx,mn=rgb.max(2),rgb.min(2);sat=np.where(mx>0,(mx-mn)/np.maximum(mx,1e-6),0)
    w=np.zeros(al.shape)
    for y0,y1 in bands:
        if y1<=y0:continue
        v=np.clip((np.arange(y0,y1)-y0)/6.,0,1)[:,None];w[y0:y1]=v
    return w*np.clip((sat-.26)/.10,0,1)*np.clip((.70-lum)/.08,0,1)*body_weight(al)# 몸통 무게: 발 띠를 지나는 칼날·가는 조각은 건드리지 않는다
def leather_stats(a,bands,w=None):
    """w = 가죽 무게. 파생본을 잴 때는 원본에서 고른 무게를 넘긴다(결과 밝기에 따라 고르는 픽셀이 바뀌면 같은 가죽을 재는 게 아니다)."""
    w=leather_weight(a,bands) if w is None else w;n=w.sum()
    if n<1:return dict(lum=0.,sat=0.,rb=0.,px=0.)
    rgb=a[...,:3];lum=rgb@W;mx,mn=rgb.max(2),rgb.min(2);sat=np.where(mx>0,(mx-mn)/np.maximum(mx,1e-6),0);m=(rgb*w[...,None]).sum((0,1))/n
    return dict(lum=float((lum*w).sum()/n),sat=float((sat*w).sum()/n),rb=float(m[0]/max(m[2],1e-6)),px=float(n))
def leather_fix(a,bands,ref,w=None,rounds=10):
    """발 띠의 가죽 픽셀만 밝기 배율·채도 배율로 기준 가죽에 맞춘다. 무게 w 는 원본 시트에서 한 번 고른 것(같은 픽셀을 끝까지)."""
    w=leather_weight(a,bands) if w is None else w
    if w.sum()<1 or not ref.get('px'):return a.copy(),[1.,1.]
    rgb=a[...,:3];kL,kS=1.,1.
    def run(kL,kS):
        lum=rgb@W;out=np.clip((lum*kL)[...,None]+(rgb-lum[...,None])*kL*kS,0,1);res=a.copy();res[...,:3]=rgb+(out-rgb)*w[...,None];return res
    for _ in range(rounds):
        m=leather_stats(quant(run(kL,kS)),bands,w)
        if m['px']<1 or m['lum']<1e-6 or m['sat']<1e-6:break
        kL=float(np.clip(kL*ref['lum']/m['lum'],.6,1.6));kS=float(np.clip(kS*ref['sat']/m['sat'],.5,2.));
    return run(kL,kS),[kL,kS]
def rec_of(src):
    """시트의 칸·발 기준점 기록(R271·R242 색인)."""
    name=os.path.basename(src)[:-5];anim,d=name.split('-');pack='r242' if '/r242/' in src else 'r271'
    return json.load(open(os.path.join(A,pack,'hwando','index.json')))['anims'][anim][d]
def ref_leather():
    r=json.load(open(os.path.join(A,'r436','hwando','index.json')))['walk']['s'];a=load(REF);return leather_stats(a,foot_bands(r,a.shape[0]))
sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
load=lambda rel:np.array(Image.open(os.path.join(A,rel.replace('assets/','',1))).convert('RGBA')).astype(np.float64)/255
def main():
    refp=os.path.join(A,REF.replace('assets/','',1));ref=metrics(load(REF))
    CACHE={}
    try:CACHE={k:v['gains'] for k,v in json.load(open(os.path.join(A,'r1063','hwando','index.json')))['clips'].items()}
    except Exception:pass
    refL=ref_leather();idx=dict(revision='R1063-hwando-texture-1',reference=dict(file=REF,sha256=sha(refp),metrics=ref,leather=refL),sigma=list(SIG),clips={})
    for src in CLIPS:
        a=load(src);before=metrics(a);g=(CACHE.get(src) or solve(a,ref)) if os.environ.get('R1063_REUSE') else solve(a,ref);fb=foot_bands(rec_of(src),a.shape[0]);lw=leather_weight(a,fb);lb=leather_stats(a,fb,lw);t=apply(a,g);t,lg=leather_fix(t,fb,refL,lw);b8=np.round(np.clip(t,0,1)*255).astype(np.uint8)
        src8=np.array(Image.open(os.path.join(A,src.replace('assets/','',1))).convert('RGBA'));b8[...,3]=src8[...,3];b8[src8[...,3]==0]=src8[src8[...,3]==0]
        rel=out_path(src);p=os.path.join(A,rel.replace('assets/','',1));os.makedirs(os.path.dirname(p),exist_ok=True)
        Image.fromarray(b8,'RGBA').save(p,'WEBP',lossless=True,method=6,exact=True)
        back=np.array(Image.open(p).convert('RGBA'));after=metrics(back.astype(np.float64)/255)
        idx['clips'][src]=dict(derived=rel,source_sha256=sha(os.path.join(A,src.replace('assets/','',1))),sha256=sha(p),bytes=os.path.getsize(p),size=list(Image.open(p).size),source_size=[src8.shape[1],src8.shape[0]],
            alpha_identical=bool(np.array_equal(back[...,3],src8[...,3])),gains=g,before=before,after=after,
            leather=dict(gains=lg,before=lb,after=leather_stats(back.astype(np.float64)/255,fb,lw)))
        print(src,[round(x,3) for x in g],[round(x,3) for x in lg],{k:round(v,3) for k,v in lb.items()},'=>',{k:round(v,3) for k,v in idx['clips'][src]['leather']['after'].items()},{k:round(before[k],4) for k in ('grain','fold','form')},'->',{k:round(after[k],4) for k in ('grain','fold','form')},os.path.getsize(p))
    os.makedirs(os.path.join(A,'r1063','hwando'),exist_ok=True);json.dump(idx,open(os.path.join(A,'r1063','hwando','index.json'),'w'),ensure_ascii=False,indent=1)
if __name__=='__main__':main()
