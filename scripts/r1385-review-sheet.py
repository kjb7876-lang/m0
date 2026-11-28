#!/usr/bin/env python3
"""R1385 심사용 대조: r1385-shots.mjs 장면에서 바뀌는 몹마다 [2D 원화 | 지금 화면 | 바뀐 화면] 한 칸(같은 축척·같은 발 줄), 몸 키 % 표.
사용: r1385-review-sheet.py <shots 폴더…(meta.json 포함)> --site <site> --out <out>"""
import json,sys,os,glob
from PIL import Image,ImageDraw,ImageFont,ImageChops,ImageFilter
a=sys.argv[1:];SITE=a[a.index('--site')+1];OUT=a[a.index('--out')+1];DIRS=[x for x in a if not x.startswith('--') and x not in(SITE,OUT)]
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));os.makedirs(OUT,exist_ok=True)
F=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',16);FS=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',13)
dec=json.load(open(f'{ROOT}/r96/qa/r1385/decision.json'));sc=json.load(open(f'{ROOT}/r96/qa/r1385/score.json'))
byname={}
for m in dec['mobs']:
    for n in m['names']:byname[n]=m
W,CX,SP,Y0,Y1=1280,640,92,250,470# 화면 1280×720: 영웅 가운데, 몹 i 는 640+(i-(n-1)/2)*92, 발 줄 약 430
def box(img,bg,cx):
    x0,x1=int(cx-SP*.42),int(cx+SP*.42);d=ImageChops.difference(img.crop((x0,Y0,x1,Y1)).convert('RGB'),bg.crop((x0,Y0,x1,Y1)).convert('RGB')).convert('L').point(lambda v:255 if v>18 else 0)
    d=d.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    # 세로로 이어진 가장 큰 덩어리: 행마다 점 수가 3 넘는 줄의 가장 긴 연속 구간
    w,h=d.size;px=d.load();rowc=[sum(1 for x in range(w) if px[x,y]) for y in range(h)];best=(0,0,0);st=None
    for y in range(h+1):
        on=y<h and rowc[y]>2
        if on and st is None:st=y
        if not on and st is not None:
            if y-st>best[0]:best=(y-st,st,y)
            st=None
    if not best[0]:return None
    sub=d.crop((0,best[1],w,best[2]));bb=sub.getbbox();bb=(bb[0],bb[1]+best[1],bb[2],bb[3]+best[1]);return (bb[0]+x0,bb[1]+Y0,bb[2]+x0,bb[3]+Y0) if bb else None
def orig(name,zone,h):
    e=next((e for e in sc if e['name']==name and e['zone']==zone),None) or next((e for e in sc if e['name']==name),None)
    idle=(e or {}).get('d2',{}).get('idle')
    if not idle:return None
    p,r,_=idle[0];im=Image.open(os.path.join(SITE,p)).convert('RGBA')
    if r:im=im.crop((r[0],r[1],r[0]+r[2],r[1]+r[3]))
    bb=im.getbbox();im=im.crop(bb) if bb else im;s=h/im.height;return im.resize((max(1,int(im.width*s)),max(1,int(h))))
rows=[];scenes=[]
for D in DIRS:
    meta=json.load(open(f'{D}/meta.json'))
    for z,mobs in meta.items():
        if not all(os.path.exists(f'{D}/{z}-{k}.png') for k in('off','on','bg')):continue
        off,on,bg=[Image.open(f'{D}/{z}-{k}.png').convert('RGB') for k in('off','on','bg')];n=len(mobs)
        scenes.append((z,D,mobs))
        for i,mo in enumerate(mobs):
            m=byname.get(mo['name'])
            if not m or not m.get('current') or m['decision']==m['current'] or mo['name']!=m['name']:continue
            cx=CX+(i-(n-1)/2)*SP;b0,b1=box(off,bg,cx),box(on,bg,cx)
            m3=mo.get('m3d_on') if m['decision']=='3d' else mo.get('m3d_off')
            rows.append(dict(m3=m3,z=z,i=i,name=mo['name'],key=m['key'],cur=m['current'],new=m['decision'],fid=(m.get('d3') or {}).get('aes'),note=(m.get('d3') or {}).get('fid_note'),
                             h0=b0 and b0[3]-b0[1],h1=b1 and b1[3]-b1[1],b0=b0,b1=b1,off=off,on=on,cx=cx))
# 한 칸: 3열, 2배 확대
K=2;CW,CH=150*K//1,220*K//1
cells=[]
for r in rows:
    x0,x1=int(r['cx']-SP*.8),int(r['cx']+SP*.8);top=min([b[1] for b in(r['b0'],r['b1']) if b]+[Y1-210])-8;y0,y1=max(0,top),Y1
    c0=r['off'].crop((x0,y0,x1,y1)).resize(((x1-x0)*K,(y1-y0)*K),Image.NEAREST);c1=r['on'].crop((x0,y0,x1,y1)).resize(((x1-x0)*K,(y1-y0)*K),Image.NEAREST)
    h2=r['h0'] if r['cur']=='2d' else r['h1'];o=orig(r['name'],r['z'],(h2 or 60)*K)
    w=(x1-x0)*K;H=(y1-y0)*K;foot=((r['b0'] or r['b1'])[3]-y0)*K
    cell=Image.new('RGB',(w*3+20,H+70),(28,26,30));d=ImageDraw.Draw(cell)
    if o:
        bgc=Image.new('RGBA',(w,H),(60,56,60,255));bgc.alpha_composite(o,(max(0,(w-o.width)//2),max(0,foot-o.height)));cell.paste(bgc.convert('RGB'),(0,40))
    cell.paste(c0,(w+10,40));cell.paste(c1,(2*w+20,40))
    m3=r.get('m3');pct=f"{round(100*m3['h']/m3['target'])}%" if m3 and m3.get('target') else '?'
    d.text((4,2),f"{r['name']} ({r['z']})",fill=(255,230,180),font=F);d.text((4,21),f"{r['cur'].upper()}→{r['new'].upper()} · 3D 키/2D 키 {pct} · 원화 닮음 {r['fid']}",fill=(200,200,210),font=FS)
    for j,t in enumerate(('2D 원화(같은 축척)',f"지금 {r['cur'].upper()}",f"바뀐 뒤 {r['new'].upper()}")):d.text((j*(w+10)+4,H+44),t,fill=(220,220,220),font=FS)
    if r['note']:d.text((4,H+56),('근거: '+r['note'])[:60],fill=(170,170,180),font=FS)
    r['pct']=pct;cells.append(cell)
def sheet(cs,path,cols=2):
    if not cs:return
    cw=max(c.width for c in cs);ch=max(c.height for c in cs);S=Image.new('RGB',(cw*cols,ch*((len(cs)+cols-1)//cols)),(18,18,20))
    for i,c in enumerate(cs):S.paste(c,((i%cols)*cw,(i//cols)*ch))
    S.save(path,quality=86)
to3=[c for c,r in zip(cells,rows) if r['new']=='3d'];to2=[c for c,r in zip(cells,rows) if r['new']=='2d']
for nm,cs in(('to3d',to3),('to2d',to2)):
    for i in range(0,len(cs),6):sheet(cs[i:i+6],f'{OUT}/{nm}-{i//6+1:02d}.jpg')
for z,D,mobs in scenes:
    S=Image.new('RGB',(1280,720*2+40),(18,18,20));d=ImageDraw.Draw(S);S.paste(Image.open(f'{D}/{z}-off.png').convert('RGB'),(0,30));S.paste(Image.open(f'{D}/{z}-on.png').convert('RGB'),(0,720+40))
    d.text((8,6),f'{z} 지금(규칙 끔)  · 왼쪽부터: '+' | '.join(m['name'] for m in mobs),fill=(255,230,180),font=F);d.text((8,724+16),f'{z} 바뀐 뒤(R1385 규칙 켬)',fill=(255,230,180),font=F)
    S.resize((960,int(S.height*.75))).save(f'{OUT}/scene-{z}.jpg',quality=84)
tab=['| 몹 | 지역 | 지금→바뀐 | 3D 키 / 2D 보이는 키 (게임 투영) | 원화 닮음 | 근거 |','|---|---|---|---|---|---|']+[f"| {r['name']} | {r['z']} | {r['cur']}→{r['new']} | {r['pct']} | {r['fid']} | {r['note'] or ''} |" for r in rows]
open(f'{OUT}/size-table.md','w').write('\n'.join(tab)+'\n');print(len(rows),'mobs',len(scenes),'scenes')
