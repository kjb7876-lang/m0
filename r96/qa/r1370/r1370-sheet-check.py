#!/usr/bin/env python3
"""R1370 시트 검사(PIL 만) — 보라 암흑 구체·적중 시트에서 흰 띠(옅은 종이빛 테) 빼기.
흰 띠 = 보이는 픽셀(알파>=24) 중 밝고(최대 채널>=170) 무채색(채도<0.2)인 비율.
① R1370 판 흰 띠 비율 <= 1%(R1214 판 47%·60%)  ② 어두운 바닥에서 읽히는 보라 번짐은 남김: 보이는 픽셀 수 >= Dots 원본의 1.25배
③ 번짐 색은 보라(번짐 픽셀 평균 B>G, R>G)  ④ 비행 시트 8칸 모두 머리(밝은 구체)가 오른쪽, 꼬리가 왼쪽 → 코드의 '시트 +x = 머리' 전제
"""
import os, sys, json
from PIL import Image
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','runtime-text','assets')
n=0
def ok(c,m,d=''):
    global n
    print(('PASS ' if c else 'FAIL ')+m,'' if c else d)
    if not c: sys.exit(1)
    n+=1
def px(im):
    return list(im.get_flattened_data()) if hasattr(im,'get_flattened_data') else list(im.getdata())
def pale(im):
    t=w=0
    for r,g,b,a in px(im):
        if a<24: continue
        t+=1; mx=max(r,g,b); mn=min(r,g,b)
        if mx>=170 and (mx-mn)/mx<0.2: w+=1
    return t,w
idx_p=os.path.join(R,'r1370','r1214','index.json')
ok(os.path.exists(idx_p),'R1370 시트 목록 index.json')
idx=json.load(open(idx_p,encoding='utf8'))
for k,nf in [('dark-orb-flight8',8),('dark-impact8',8)]:
    p=os.path.join(R,'r1370','r1214',k+'.webp'); ok(os.path.exists(p),k+' 파일')
    im=Image.open(p).convert('RGBA'); old=Image.open(os.path.join(R,'r1214',k+'.webp')).convert('RGBA')
    ok(im.size==old.size and im.size[0]%nf==0 and idx.get(k,{}).get('frames')==nf,k+': 칸 수·크기 R1214 와 같음',(im.size,old.size))
    t,w=pale(im); t0,w0=pale(old)
    ok(w/t<=0.01,k+': 흰 띠 비율 %.2f%% <= 1%% (R1214 %.1f%%)'%(100*w/t,100*w0/t0))
    src=idx[k].get('sourceVisible',0)
    ok(src>0 and t>=1.25*src,k+': 보라 번짐으로 어두운 바닥에서 읽힘(보이는 픽셀 %d >= 원본 %d x1.25)'%(t,src))
    rs=gs=bs=c=0
    for r,g,b,a in px(im):
        if 24<=a<110: rs+=r;gs+=g;bs+=b;c+=1
    ok(c>0 and bs>gs and rs>gs,k+': 번짐 색 보라(R%d G%d B%d)'%(rs//max(c,1),gs//max(c,1),bs//max(c,1)))
im=Image.open(os.path.join(R,'r1370','r1214','dark-orb-flight8.webp')).convert('RGBA'); cw=im.size[0]//8; bad=[]
for i in range(8):
    c=im.crop((i*cw,0,(i+1)*cw,im.size[1])); W,H=c.size; ax=at=bx=bt=0
    for j,(r,g,b,a) in enumerate(px(c)):
        x=j%W
        if a>=24: ax+=x*a; at+=a
        if a>=200: bx+=x; bt+=1  # 머리 = 불투명한 구체 덩어리, 꼬리 = 반투명 먹 자락
    if not(at and bt and bx/bt>ax/at+2): bad.append(i)
ok(not bad,'비행 시트 8칸 모두 머리 오른쪽·꼬리 왼쪽',bad)
print('R1370 시트 검사 %d개 통과'%n)
