#!/usr/bin/env python3
"""R1238 네온 좌우 공격(R437 시트) 몸 두께·얼굴 크기를 서기·걷기 시트(R130)에 가깝게 다듬은 파생본.
원본 assets/r437/attack/neon/attack-e.webp 는 그대로 두고 assets/r1238/neon/attack-e.webp 를 만든다.
 ① 칸마다 뒷발 기준(x=69) 가로 SX 배 — 몸·코트·팔이 가늘어진다(창끝 표도 같은 식으로 옮김).
 ② 머리(머리 꼭대기~목, HEAD px)를 목 가운데 기준 HS 배로 줄인다(얼굴·머리 크기를 걷기 그림 비율로).
사용: python3 scripts/r1238-neon-attack-slim.py  → 결과 json 을 출력."""
import json, hashlib, sys
from pathlib import Path
from PIL import Image
R=Path(__file__).resolve().parents[1]/'r96'/'runtime-text'
SRC=R/'assets/r437/attack/neon/attack-e.webp'; DST=R/'assets/r1238/neon/attack-e.webp'
CW,CH,FX,SX,HS,HEAD=224,256,69,0.88,0.88,44
TIPS=[[198.0,102.0],[190.0,101.0],[210.0,100.0],[219.0,97.0],[209.0,101.0],[198.0,102.0]]
im=Image.open(SRC).convert('RGBA'); n=im.width//CW; out=Image.new('RGBA',im.size,(0,0,0,0))
for i in range(n):
    f=im.crop((i*CW,0,(i+1)*CW,CH))
    a=f.getchannel('A'); bb=a.point(lambda v:255 if v>40 else 0).getbbox(); top=bb[1]
    neck=top+HEAD
    # 머리 띠 가운데: 목 줄 근처 불투명 픽셀 가운데(창·손은 머리보다 낮아 이 띠 밖)
    row=[x for x in range(CW) if a.getpixel((x,neck))>40 and x<FX+70]
    hc=(min(row)+max(row))/2 if row else FX+15
    # ② 머리 줄이기: 머리 띠를 잘라 줄여 목에 맞춰 붙이되, 원래 머리 자리는 지운다(목 아래는 그대로)
    head=f.crop((0,0,CW,neck)); body=f.copy(); body.paste((0,0,0,0),(0,0,CW,neck))
    hw,hh=round(CW*HS),round(neck*HS); hs=head.resize((hw,hh),Image.LANCZOS)
    g=Image.new('RGBA',(CW,CH),(0,0,0,0)); g.alpha_composite(body)
    ox=round(hc-hc*HS); g.alpha_composite(hs,(ox,neck-hh))
    # 목 이음새: 원래 머리 아랫부분 4줄을 줄인 머리 아래에 깔아 틈을 메운다
    seam=f.crop((0,neck-4,CW,neck)); g2=Image.new('RGBA',(CW,CH),(0,0,0,0)); g2.alpha_composite(seam,(0,neck-4)); g2.alpha_composite(g)
    # ① 가로 SX 배(뒷발 x=FX 기준)
    nw=round(CW*SX); sq=g2.resize((nw,CH),Image.LANCZOS); cell=Image.new('RGBA',(CW,CH),(0,0,0,0))
    cell.alpha_composite(sq,(round(FX-FX*SX),0))
    out.alpha_composite(cell,(i*CW,0))
DST.parent.mkdir(parents=True,exist_ok=True); out.save(DST,'WEBP',lossless=True,quality=100,method=6)
tips=[[round(FX+(x-FX)*SX,1),y] for x,y in TIPS]
b=DST.read_bytes()
print(json.dumps({'path':'assets/r1238/neon/attack-e.webp','sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'tips':tips,'sx':SX,'hs':HS,'head':HEAD,
 'source':{'path':'assets/r437/attack/neon/attack-e.webp','sha256':hashlib.sha256(SRC.read_bytes()).hexdigest()}},ensure_ascii=False))
