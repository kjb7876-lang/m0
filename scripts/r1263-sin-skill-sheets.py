#!/usr/bin/env python3
"""R1263 — 7대죄 보스 서사 스킬 임시 프레임 시트(기존 저장소 그림을 이미지 처리로 재가공, 원본은 건드리지 않음).
모두 가로 한 줄 시트. Dots 전용 시트가 오면 같은 이름으로 교체한다(index.json final:false)."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
A=Path(__file__).resolve().parents[1]/'r96/runtime-text/assets'; OUT=A/'r1263'; OUT.mkdir(exist_ok=True)
idx={}
def L(p): return Image.open(A/p).convert('RGBA')
def cells(im,cw,ch,n,cols=None):
    cols=cols or im.width//cw; return [im.crop(((i%cols)*cw,(i//cols)*ch,(i%cols+1)*cw,(i//cols+1)*ch)) for i in range(n)]
def save(name,frames,cw,ch,source,process,**kw):
    s=Image.new('RGBA',(cw*len(frames),ch))
    for i,f in enumerate(frames): s.alpha_composite(f.resize((cw,ch),Image.LANCZOS) if f.size!=(cw,ch) else f,(i*cw,0))
    s.save(OUT/f'{name}.webp','WEBP',quality=86,method=6)
    idx[name]={'frames':len(frames),'cell':[cw,ch],'source':source,'process':process,'final':False,**kw}
def recolor(im,r,g,b,lift=(0,0,0),keep=0.0):
    a=np.array(im).astype(np.float32); lum=(a[...,0]*.3+a[...,1]*.59+a[...,2]*.11)/255
    o=a.copy(); 
    for i,(c,l) in enumerate(zip((r,g,b),lift)): o[...,i]=a[...,i]*keep+(l+lum*c)*(1-keep)
    o[...,:3]=np.clip(o[...,:3],0,255); return Image.fromarray(o.astype(np.uint8),'RGBA')
def fit(im,cw,ch,h,ground):
    bb=im.getbbox(); im=im.crop(bb); s=h/im.height
    if im.width*s>cw*.96: s=cw*.96/im.width
    im=im.resize((max(1,int(im.width*s)),max(1,int(im.height*s))),Image.LANCZOS)
    c=Image.new('RGBA',(cw,ch)); c.alpha_composite(im,((cw-im.width)//2,ground-im.height)); return c
# 1) 탐식: 식칼(돌아가는 8칸) — 칼날에 기름·피 대신 검붉은 녹을 얹어 주방 살점 톤으로
cl=L('r118/drive/horn-cleaver.png'); cl=recolor(cl,190,120,104,(18,8,6),keep=.55)
base=fit(cl,160,160,120,140)
save('utensils8',[base.rotate(-i*45,resample=Image.BICUBIC,center=(80,80)) for i in range(8)],160,160,
     'assets/r118/drive/horn-cleaver.png','8-step spin + rust/flesh tint (frying pan missing: Dots)',pivot=[80,80])
# 2) 탐식: 독가스 24칸 — r438 독 안개를 담즙빛 녹색+검보라 그늘로
g=L('r438/fx/enemy-poison-mist.webp'); gf=cells(g,256,256,24,6)
save('gas24',[recolor(f,150,190,70,(20,10,26),keep=.35) for f in gf],256,256,'assets/r438/fx/enemy-poison-mist.webp','bile green + dark violet shade',loop=[6,17])
# 3) 색욕: 매혹의 빛 구슬 8칸 — r1227 화구를 진홍·자홍 빛으로
o=L('r1227/fireball-flight8.webp'); of=cells(o,128,96,8,8)
save('charm-orb8',[ImageEnhance.Brightness(recolor(f,255,70,160,(70,0,35),keep=0)).enhance(1.6) for f in of],128,96,'assets/r1227/fireball-flight8.webp','crimson-magenta recolor')
# 4) 색욕: 매혹 표식 12칸 — 미카엘라 하트 시트(20칸 중 12칸)를 검붉은 장미빛으로, 세워 그린다(영웅 목 높이)
h=L('r1041/fx-m5-michaela-ground-heart.webp'); hf=cells(h,128,128,20,20)
save('charm-mark12',[recolor(hf[i],230,30,70,(30,0,10),keep=0) for i in [1,2,3,4,5,6,7,8,9,10,11,12]],128,128,'assets/r1041/fx-m5-michaela-ground-heart.webp','deep rose recolor, frames 1-12')
# 5) 분노: 불 24칸 — r411 보스 불벽 그대로(가로 한 줄로)
fw=L('r411/fx/boss-fire-wall.webp'); ff=cells(fw,256,256,24,6)
save('fire24',ff,256,256,'assets/r411/fx/boss-fire-wall.webp','re-strip only')
fl=cells(L('r430/fire-loop.webp'),192,192,10,6)
# 6) 분노: 곰·늑대·용 — 불길에서 솟아 형체를 이루는 8칸(불타는 실루엣 + 아래 불꽃)
def beast(p,name,h):
    src=L(p); src=recolor(src,255,150,90,(30,6,0),keep=.25)
    body=fit(src,256,256,h,236); fr=[]
    for i in range(8):
        rev=min(1,(i+1)/5); c=Image.new('RGBA',(256,256))
        m=np.array(body); ys=np.arange(256)[:,None]; top=236-rev*h
        m[...,3]=(m[...,3]*np.clip((ys-top)/18,0,1)).astype(np.uint8)
        # 몸 뒤 열기 번짐
        glow=Image.fromarray(m,'RGBA').split()[3].filter(ImageFilter.GaussianBlur(8)).point(lambda v:int(v*.55))
        gl=Image.new('RGBA',(256,256),(200,60,10,0)); gl.putalpha(glow); c.alpha_composite(gl)
        c.alpha_composite(Image.fromarray(m,'RGBA'))
        f=fl[(i+2)%10].resize((256,120),Image.LANCZOS); fa=np.array(f); fa[...,3]=(fa[...,3]*max(.35,.95-i*.1)).astype(np.uint8)
        c.alpha_composite(Image.fromarray(fa,'RGBA'),(0,256-120-14)); fr.append(c)
    save(name,fr,256,256,p+' + assets/r430/fire-loop.webp','burning reveal 0-4, hold 5-7',pivot=[128,236])
beast('r118/drive/wrath-bear-manifest.png','bear8',190)
beast('r118/drive/wrath-wolf-manifest.png','wolf8',130)
beast('r118/drive/wrath-dragon-manifest.png','dragon8',220)
# 7) 부트로더: 검은 전선 9칸 — samong s06 명령 전선, 더 검게
w=L('r380/mobs/samong-s06-command-wire-v1.webp'); wf=cells(w,256,256,9,9)
save('wire9',[recolor(f,60,70,90,(4,4,8),keep=.3) for f in wf],256,256,'assets/r380/mobs/samong-s06-command-wire-v1.webp','darker ink-steel',pivot=[128,200])
# 8) 부트로더: 죽은 동료 환영 12칸 — R1241 그림자 솟음 시트를 잿빛 청회색 유령으로
p=L('r1241/shadow-rise12.webp'); pf=cells(p,192,256,12,12)
def ghost(f):
    a=np.array(f).astype(np.float32); lum=(a[...,0]*.3+a[...,1]*.59+a[...,2]*.11)/255
    o=np.zeros_like(a); o[...,0]=120+lum*300; o[...,1]=135+lum*300; o[...,2]=150+lum*300; o[...,:3]=np.clip(o[...,:3],0,235); o[...,3]=a[...,3]*.82
    return Image.fromarray(o.astype(np.uint8),'RGBA')
save('phantom12',[ghost(f) for f in pf],192,256,'assets/r1241/shadow-rise12.webp (r1166 ghost patient)','ash blue-grey ghost recolor',pivot=[96,246],rise=[0,5],sink=[6,11])
json.dump(idx,open(OUT/'index.json','w'),ensure_ascii=False,indent=1)
print('\n'.join(f'{k}: {v["frames"]}칸 {v["cell"]}' for k,v in idx.items()))
