#!/usr/bin/env python3
"""R1239 루시퍼 2·3단계(가면이 갈라진 뒤) 몸 그림 — 1단계 R104·R1147 그림을 다시 칠한다(생성용, numpy+PIL; CI 검사는 PIL 만).
정본 ep1a11 "흰 날개가 검게 물들고" → 밝고 채도 낮은 깃털을 연속 가중치(번짐 2px)로 먹빛 검정-자주 그라데이션에,
붉은 깃 끝은 짙은 핏빛으로. 피부·금빛 갑옷·후광은 색상을 두고 조금 어둡게(같은 인물로 읽히게).
픽셀 위치·크기·알파는 그대로라 칸·발 자리·시트 칸 나눔이 1단계와 같다. 원본은 건드리지 않고 assets/r1239/lucifer/ 에 새로 쓴다.
쓰는 법: python3 scripts/r1239-lucifer-dark.py <runtime-text 또는 site 경로>"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
ROOT=Path(sys.argv[1] if len(sys.argv)>1 else 'r96/runtime-text')
OUT=Path('r96/runtime-text/assets/r1239/lucifer');OUT.mkdir(parents=True,exist_ok=True)
SRC={'assets/r104/bosses/a11-boss-p1.webp':'a11-dark-p1.webp','assets/r104/bosses/a11-boss-p2.webp':'a11-dark-p2.webp',
     'assets/r104/bosses/a11-boss-p3.webp':'a11-dark-p3.webp','assets/r104/bosses/a11-boss-p4.webp':'a11-dark-p4.webp',
     'assets/r1147/bosses/a11-idle6.webp':'a11-dark-idle6.webp','assets/r1147/bosses/a11-hit4.webp':'a11-dark-hit4.webp',
     'assets/r1029/float/a11-boss-p4.webp':'a11-dark-float8.webp'}
def smooth(x,a,b):t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def dark(im):
    A=np.asarray(im.convert('RGBA')).astype(np.float32)/255;rgb=A[...,:3];al=A[...,3]
    mx=rgb.max(-1);mn=rgb.min(-1);l=(mx+mn)/2;s=np.where(mx>1e-4,(mx-mn)/np.maximum(mx,1e-4),0)
    hsv=np.asarray(im.convert('RGB').convert('HSV')).astype(np.float32)/255;h=hsv[...,0]*360
    feather=smooth(l,.30,.66)*(1-smooth(s,.22,.48))
    redw=(np.maximum(smooth(-np.minimum(h,360-h)+40,0,25),0))*smooth(s,.35,.6)*(1-feather)
    # 번짐: 가중치를 살짝 흐려 얼룩(점박이)이 생기지 않게
    def blur(w,r=1.6):return np.asarray(Image.fromarray((np.clip(w,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32)/255
    feather=blur(feather);redw=blur(redw)
    lum=(.3*rgb[...,0]+.59*rgb[...,1]+.11*rgb[...,2])
    # 먹-자주 그라데이션(어두운 쪽 = 거의 검정, 밝은 결 = 옅은 자주 윤) — 결(디테일)은 원래 밝기에서 온다
    g0=np.array([.02,.016,.026]);g1=np.array([.075,.04,.075]);g2=np.array([.26,.17,.25])
    t=np.clip((lum-.35)/.65,0,1)[...,None]
    ink=np.where(t<.6,g0+(g1-g0)*(t/.6),g1+(g2-g1)*((t-.6)/.4))
    crimson=np.stack([rgb[...,0]*.52+.02,rgb[...,1]*.12,rgb[...,2]*.20+.02],-1)
    base=rgb*.80
    out=base*(1-feather[...,None]-redw[...,None]).clip(0,1)+ink*feather[...,None]+crimson*redw[...,None]
    res=np.concatenate([np.clip(out,0,1),al[...,None]],-1)
    return Image.fromarray((res*255+.5).astype(np.uint8),'RGBA')
for s,d in SRC.items():
    p=ROOT/s
    if not p.exists():print('MISSING',p);continue
    im=Image.open(p);o=dark(im);assert o.size==im.size
    o.save(OUT/d,'WEBP',quality=86,method=6);print(d,o.size,(OUT/d).stat().st_size)
