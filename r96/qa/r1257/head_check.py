#!/usr/bin/env python3
"""R1257 환도 방향별 머리(두건) 크기 일관성 — Pillow 만(CI 용).
 기준 = 좌·우 걷기(R1063 파생본, 이번에 안 바꿈)의 머리 크기.
 머리 크기 = 머리 꼭대기부터 몸 키(발 기준점-꼭대기)의 16% 띠 안 불투명 넓이의 제곱근 × (180/body) — 게임이 그리는 화면 배율과 같은 단위.
 H1 파생 시트 있음·크기 = 원본  H2 앞(걷기·서기)·뒤(걷기·피격)·옆 피격 머리 = 기준 ±5%
 H3 몸 키·발 기준선 그대로(칸마다 맨 아래 불투명 줄 같음, 키 ±1.5%)  H4 목 아래(띠+8px 아래)는 원본과 같은 픽셀(몸·옷·칼은 그대로)
 H5 칸끼리 머리 크기 흔들림 ≤6%  H6 머리 띠 밝기 중앙값 ±0.03(색 유지 — 먹+흰색)  H7 색인·sha 메타"""
import os,sys,json,hashlib,math,warnings
warnings.filterwarnings('ignore',category=DeprecationWarning)
from PIL import Image
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','runtime-text')
J=lambda p:json.load(open(os.path.join(R,p)))
I271=J('assets/r271/hwando/index.json')['anims'];I242=J('assets/r242/hwando/index.json')['anims'];SH=J('assets/r1219/r436/hwando/sheathed/index.json')
fails=[];oks=0
def ok(c,m):
    global oks
    if c: oks+=1
    else: fails.append(m)
def done():
    for f in fails: print('FAIL',f)
    print(f'R1257 head ok {oks} fail {len(fails)}');sys.exit(1 if fails else 0)
# 이름: (원본 경로, 색인 칸, body)
REF={'walk-e':('assets/r1063/r283/hwando/r271/walk-e.webp',I271['walk']['e'],I271['walk']['e']['body']),
     'walk-w':('assets/r1063/r283/hwando/r271/walk-w.webp',I271['walk']['w'],I271['walk']['w']['body'])}
FIX={'walk-s':('assets/r1219/r436/hwando/sheathed/walk-s.webp',SH['walk']['s'],SH['walk']['s']['body']),
     'idle-s':('assets/r1219/r436/hwando/sheathed/idle-s.webp',SH['idle']['s'],SH['idle']['s']['body']),
     'walk-n':('assets/r1063/r283/hwando/r271/walk-n.webp',I271['walk']['n'],I271['walk']['n']['body']),
     'hit-n':('assets/r1063/r283/hwando/r242/hit-n.webp',I242['hit']['n'],I242['walk']['n']['body']),
     'hit-e':('assets/r1063/r283/hwando/r242/hit-e.webp',I242['hit']['e'],I242['walk']['e']['body'])}
D=lambda p:'assets/r1257/'+p[7:]
def cells(path,A):
    im=Image.open(os.path.join(R,path)).convert('RGBA');cw,ch=A['cell'];out=[]
    for f in range(A['n']):
        c,r=f%A['cols'],f//A['cols'];out.append(im.crop((c*cw,r*ch,(c+1)*cw,(r+1)*ch)))
    return out
def meas(c,A,body,lb=.16):
    a=c.split()[3].point(lambda v:255 if v>60 else 0);bb=a.getbbox()
    if not bb: return None
    top,bot=bb[1],bb[3]-1;H=A['anchor'][1]-top;y1=int(round(top+.16*H))
    band=a.crop((0,top,c.width,y1));area=band.histogram()[255]
    yl=int(round(top+lb*H));L=[0.299*r+0.587*g+0.114*b for (r,g,b,al) in c.crop((0,top,c.width,yl)).getdata() if al>200];L.sort()
    return dict(top=top,bot=bot,H=H*180/body,head=math.sqrt(area)*180/body,lum=L[len(L)//2]/255 if L else 0,y1=y1)
med=lambda v:sorted(v)[len(v)//2]
ref=med([m['head'] for n,(p,A,b) in REF.items() for m in (meas(c,A,b) for c in cells(p,A)) if m])
ATK=('assets/r1063/r439/hwando/attack-e.webp',I271['attack']['e'],I271['attack']['e']['body'])
atk=med([m['head'] for m in (meas(c,ATK[1],ATK[2]) for c in cells(*ATK[:2])) if m])/ref
print('기준(좌·우 걷기) 머리 %.2f · 좌우 공격 비 %.3f'%(ref,atk))
meta=None
try: meta=J('assets/r1257/r1257.json')
except Exception as e: ok(False,'H7 메타 없음 assets/r1257/r1257.json')
for n,(p,A,b) in FIX.items():
    dp=D(p)
    if not os.path.exists(os.path.join(R,dp)): ok(False,'H1 파생 없음 '+dp);continue
    s0=Image.open(os.path.join(R,p)).size;s1=Image.open(os.path.join(R,dp)).size;ok(s0==s1,f'H1 크기 {n} {s1}≠{s0}')
    sc=(meta or {}).get('sheets',{}).get(dp,{}).get('scale',1) or 1
    src=cells(p,A);dst=cells(dp,A);M0=[meas(c,A,b) for c in src];M1=[meas(c,A,b) for c in dst];ML=[meas(c,A,b,.16/sc) for c in src]
    h=med([m['head'] for m in M1]);print(f'{n}: 머리 {med([m["head"] for m in M0]):.2f} → {h:.2f} (기준비 {h/ref:.3f})')
    if n=='hit-e':
        h0=med([m['head'] for m in M0]);ok(abs(h/ref-1)<abs(h0/ref-1) and abs(h/ref-1)<=abs(atk-1)+.005,f'H2 {n} 머리 {h0:.2f}→{h:.2f} 기준 {ref:.2f} 공격 비 {atk:.3f}')
    else: ok(abs(h/ref-1)<=.05,f'H2 {n} 머리 {h:.2f} 기준 {ref:.2f} 비 {h/ref:.3f}')
    ok(all(m0['bot']==m1['bot'] for m0,m1 in zip(M0,M1)),f'H3 {n} 발 줄 바뀜')
    ok(all(abs(m1['H']/m0['H']-1)<=.015 for m0,m1 in zip(M0,M1)),f'H3 {n} 몸 키 {[round(m1["H"]/m0["H"],3) for m0,m1 in zip(M0,M1)]}')
    same=True
    for c0,c1,m0 in zip(src,dst,M0):
        y=min(c0.height,m0['y1']+int(round(.06*m0['H']*b/180))+8)
        if list(c0.crop((0,y,c0.width,c0.height)).getdata())!=list(c1.crop((0,y,c1.width,c1.height)).getdata()):same=False;break
    ok(same,f'H4 {n} 목 아래 픽셀이 바뀜')
    hs=[m['head'] for m in M1];ok((max(hs)-min(hs))/max(hs)<=.06,f'H5 {n} 칸끼리 머리 흔들림 {(max(hs)-min(hs))/max(hs):.3f}')
    ok(abs(med([m['lum'] for m in M1])-med([m['lum'] for m in ML]))<=.03,f'H6 {n} 머리 밝기 {med([m["lum"] for m in ML]):.3f}→{med([m["lum"] for m in M1]):.3f}')
    if meta:
        e=meta.get('sheets',{}).get(dp,{});ok(e.get('sha256')==hashlib.sha256(open(os.path.join(R,dp),'rb').read()).hexdigest() and e.get('source')==p and e.get('source_sha256')==hashlib.sha256(open(os.path.join(R,p),'rb').read()).hexdigest(),f'H7 메타 sha {dp}')
        ok(open(os.path.join(R,dp),'rb').read()[12:16]==b'VP8L',f'H7 무손실 WebP 아님 {dp}')
done()
