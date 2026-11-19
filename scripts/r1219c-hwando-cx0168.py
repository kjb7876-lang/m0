#!/usr/bin/env python3
"""R1219c 환도 앞모습 칼집 정식 그림 — Dots CX-0168HW(걷기 8칸·서기 6칸, _ROUGH) 손질.
사용자 2026-11-19 "환도영웅 앞모습모션 더 일관성있게 … 칼집에 칼을둔채로 간지나게 이동", 10:20Z "환도영웅 아래모션 개선해서 적용해줘".
원본(드라이브 CX-0168HW 결과 폴더, 프로젝트 폴더 dots-requests/r1219-hwando-front-sheath/cx0168hw-raw)은 그대로 두고 손질본만 쓴다.
 1. 색: 지금 아래 걷기(R436, R283 색 목표)보다 어둡다(밝기 중앙 .554 vs .583) → 밝기 분위(10·50·90%)를 구간 선형으로 맞추고 RGB 는 같은 비로 곱한다(색상·채도 유지).
 2. 걷기 상체 박자: Dots 손질에서 칸마다 머리를 y=52 로 맞춰 오르내림이 0 → 뒤 발이 들린 만큼 상체(허리 위)를 올리고 두 발 다 딛은 칸에서 1.2px 내려앉힌다. 다리·발(아래 60줄)·좌우는 그대로.
 3. 칸 192×256, 발 기준점 (96,226), 몸 키 173(머리 52~발 225) — Dots 규격 그대로. 서기는 색만.
사용: python3 scripts/r1219c-hwando-cx0168.py <raw 폴더>   (numpy·Pillow)"""
import os,sys,json,hashlib
import numpy as np
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));AS=os.path.join(HERE,'..','r96','runtime-text','assets')
RAW=sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/dots-requests/r1219-hwando-front-sheath/cx0168hw-raw'
OUT=os.path.join(AS,'r1219','r436','hwando','sheathed')
WALK='CX-0168HW_hwando_walk-s8_sheathed_r1_ROUGH.png';IDLE='CX-0168HW_hwando_idle-s6_sheathed_r1_ROUGH.png'
LW=np.array([.299,.587,.114]);Q=(10,50,90)
def lumq(A):
    m=A[:,:,3]>200;return np.percentile((A[m][:,:3]/255.)@LW,Q)
def match(A,ref):
    A=A.astype(float);src=lumq(A);l=(A[:,:,:3]/255.)@LW
    xs=np.concatenate([[0],src,[1]]);ys=np.concatenate([[0],ref,[1]])
    t=np.interp(l,xs,ys);g=np.where(l>1e-4,t/np.maximum(l,1e-4),1.0)
    O=A.copy();O[:,:,:3]=np.clip(A[:,:,:3]*g[...,None],0,255);return O
LEG=60;BLEND=(110.0,170.0)
def lift_bob(C):
    a=C[:,:,3]>100;L=a[180:,:96];Rr=a[180:,96:]
    bl=np.nonzero(L.any(1))[0].max()+180 if L.any() else 225;br=np.nonzero(Rr.any(1))[0].max()+180 if Rr.any() else 225
    lift=225-min(bl,br);return float(round(np.clip(1.2-.12*lift,-.8,1.2))),int(lift)  # 정수 px — 재표본 흐림 없이
def shift_up(C,dy):
    H,W=C.shape[:2];y=np.arange(H,dtype=float)[:,None]
    t=np.clip((BLEND[1]-y)/(BLEND[1]-BLEND[0]),0,1);w=t*t*(3-2*t);w[H-LEG:]=0
    Y=np.broadcast_to(y-dy*w,(H,W));y0=np.floor(Y).astype(int);fy=(Y-y0)[...,None];x=np.broadcast_to(np.arange(W)[None,:],(H,W))
    a=C[:,:,3:4]/255.;Pm=np.concatenate([C[:,:,:3]*a,C[:,:,3:4]],2)
    def g(yy):
        ok=(yy>=0)&(yy<H);v=np.zeros((H,W,4));v[ok]=Pm[yy[ok],x[ok]];return v
    Rm=g(y0)*(1-fy)+g(y0+1)*fy;O=np.zeros_like(C);al=Rm[:,:,3];nz=al>.5
    O[:,:,3]=al;O[nz,:3]=Rm[nz,:3]/(al[nz,None]/255.);O[H-LEG:]=C[H-LEG:];return O
def save(A,name):
    os.makedirs(OUT,exist_ok=True);p=os.path.join(OUT,name);Image.fromarray(np.clip(A+.5,0,255).astype(np.uint8)).save(p,'WEBP',lossless=True,quality=100,method=6)
    b=open(p,'rb').read();return hashlib.sha256(b).hexdigest(),len(b)
def main():
    ref=lumq(np.array(Image.open(os.path.join(AS,'r436','hwando','walk-s.webp')).convert('RGBA')).astype(float))
    W=match(np.array(Image.open(os.path.join(RAW,WALK)).convert('RGBA')),ref);D=match(np.array(Image.open(os.path.join(RAW,IDLE)).convert('RGBA')),ref)
    bobs=[]
    for k in range(8):
        C=W[:,k*192:(k+1)*192];dy,lift=lift_bob(C);bobs.append({'frame':k,'back_foot_lift_px':lift,'body_dy_px':round(dy,2)});W[:,k*192:(k+1)*192]=shift_up(C,dy)
    ws,wb=save(W,'walk-s.webp');ds,db=save(D,'idle-s.webp')
    raw=lambda f:hashlib.sha256(open(os.path.join(RAW,f),'rb').read()).hexdigest()
    idx={'revision':'R1219c-hwando-front-sheathed-1','source':{'dots':'CX-0168HW r1 _ROUGH (드라이브 결과 폴더)','walk_raw_sha256':raw(WALK),'idle_raw_sha256':raw(IDLE),
          'processing':'밝기 분위를 R436 아래 걷기에 맞춤, 걷기 상체 박자(뒤 발 들림 비례)','ref_lum_q':[round(v,4) for v in ref]},
         'walk':{'s':{'file':'walk-s.webp','n':8,'cols':8,'cell':[192,256],'atlas':[1536,256],'ms':[100]*8,'anchor':[96,226],'body':173.0,'loop':True,'frames_per_stride':8,'sha256':ws,'bytes':wb,'bob':bobs}},
         'idle':{'s':{'file':'idle-s.webp','n':6,'cols':6,'cell':[192,256],'atlas':[1152,256],'ms':[160]*6,'anchor':[96,226],'body':173.0,'loop':True,'sha256':ds,'bytes':db}}}
    json.dump(idx,open(os.path.join(OUT,'index.json'),'w'),ensure_ascii=False,indent=1);print(json.dumps(bobs))
if __name__=='__main__':main()
