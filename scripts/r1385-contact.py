#!/usr/bin/env python3
"""R1385 원화 닮음 대조표: score.json 의 3D 있는 몹마다 [2D 대기 칸 | 3D 대기·걷기·공격·피격] 한 줄. 6줄씩 한 장.
사용: r1385-contact.py <score.json> <site 폴더> <3D 촬영 폴더> <out 폴더>"""
import json,sys,os
from PIL import Image,ImageDraw,ImageFont
S,SITE,G3,OUT=sys.argv[1:5];os.makedirs(OUT,exist_ok=True)
try:F=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',18)
except Exception:
    import glob;c=glob.glob('/usr/share/fonts/**/*CJK*.tt*',recursive=True)+glob.glob('/usr/share/fonts/**/*Nanum*.ttf',recursive=True);F=ImageFont.truetype(c[0],18) if c else ImageFont.load_default()
E=[e for e in json.load(open(S)) if e.get('d3')];seen=set();rows=[]
for e in E:
    k=e['d3']['key']
    if (k,e['name']) in seen:continue
    seen.add((k,e['name']));rows.append(e)
W,H=1260,300;n=0
for i in range(0,len(rows),6):
    sheet=Image.new('RGB',(W,H*len(rows[i:i+6])),(40,36,34));d=ImageDraw.Draw(sheet)
    for j,e in enumerate(rows[i:i+6]):
        y=j*H;idle=e['d2'].get('idle')
        if idle:
            p,r,_=idle[0];im=Image.open(os.path.join(SITE,p)).convert('RGBA')
            if r:im=im.crop((r[0],r[1],r[0]+r[2],r[1]+r[3]))
            bb=im.getbbox()
            if bb:im=im.crop(bb)
            s=min(270/im.height,290/im.width);im=im.resize((max(1,int(im.width*s)),max(1,int(im.height*s))))
            bg=Image.new('RGBA',(300,280),(90,80,72,255));bg.alpha_composite(im,((300-im.width)//2,280-im.height));sheet.paste(bg.convert('RGB'),(0,y+20))
        g=os.path.join(G3,k+'.png') if (k:=e['d3']['key']) else None
        if g and os.path.exists(g):sheet.paste(Image.open(g).convert('RGB'),(300,y+20))
        d.text((6,y+1),f"#{i+j+1} {e['name']} ({e['zone']}) · 3D {k}",fill=(255,230,180),font=F)
    sheet.save(f'{OUT}/contact-{i//6+1:02d}.jpg',quality=85);n+=1
json.dump([[i+1,e['name'],e['zone'],e['d3']['key']] for i,e in enumerate(rows)],open(OUT+'/index.json','w'),ensure_ascii=False,indent=0)
print(len(rows),'rows',n,'sheets')
