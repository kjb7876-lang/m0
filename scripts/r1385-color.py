#!/usr/bin/env python3
"""R1385 화면 색 차이: r1385-shots.mjs 장면에서 바뀌는 몹마다 몸 픽셀(배경 차분)의 평균 색상·채도·밝기를 지금(off)·바뀐 뒤(on)로 재고 차이를 낸다.
사용: r1385-color.py <shots 폴더…> --out color.json   (결과 키 = 판정표 key)"""
import json,sys,os,colorsys,math
from PIL import Image,ImageChops,ImageFilter
a=sys.argv[1:];OUT=a[a.index('--out')+1];DIRS=[x for x in a if not x.startswith('--') and x!=OUT]
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dec=json.load(open(f'{ROOT}/r96/qa/r1385/decision.json'));byname={n:m for m in dec['mobs'] for n in m['names']}
CX,SP,Y0,Y1=640,92,250,470
def stat(img,bg,cx):
    x0,x1=int(cx-SP*.42),int(cx+SP*.42);A=img.crop((x0,Y0,x1,Y1)).convert('RGB');B=bg.crop((x0,Y0,x1,Y1)).convert('RGB')
    m=ImageChops.difference(A,B).convert('L').point(lambda v:255 if v>18 else 0).filter(ImageFilter.MinFilter(3))
    px=[p for p,k in zip(A.getdata(),m.getdata()) if k]
    if len(px)<40:return None
    sx=sy=ss=sv=0
    for r,g,b in px:
        h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255);sx+=s*math.cos(2*math.pi*h);sy+=s*math.sin(2*math.pi*h);ss+=s;sv+=v
    n=len(px);return dict(hue=round((math.degrees(math.atan2(sy,sx))+360)%360),sat=round(ss/n,3),val=round(sv/n,3),n=n)
out={}
for D in DIRS:
    meta=json.load(open(f'{D}/meta.json'))
    for z,mobs in meta.items():
        if not all(os.path.exists(f'{D}/{z}-{k}.png') for k in('off','on','bg')):continue
        off,on,bg=[Image.open(f'{D}/{z}-{k}.png') for k in('off','on','bg')];n=len(mobs)
        for i,mo in enumerate(mobs):
            m=byname.get(mo['name'])
            if not m or mo['name']!=m['name'] or not m.get('current') or not m.get('d3'):continue
            cx=CX+(i-(n-1)/2)*SP;s2,s3=(stat(off,bg,cx),stat(on,bg,cx)) if m['current']=='2d' else (stat(on,bg,cx),stat(off,bg,cx))
            if not(s2 and s3):continue
            dh=abs((s3['hue']-s2['hue']+180)%360-180);out.setdefault(m['key'],{})[z]=dict(d2=s2,d3=s3,dhue=dh,dsat=round(s3['sat']-s2['sat'],3),dval=round(s3['val']-s2['val'],3))
json.dump(out,open(OUT,'w'),ensure_ascii=False,indent=1)
for k,v in out.items():
    for z,c in v.items():print(f"{k:32} {z:8} dhue {c['dhue']:4} dsat {c['dsat']:+.3f} dval {c['dval']:+.3f}  2D h{c['d2']['hue']} s{c['d2']['sat']}  3D h{c['d3']['hue']} s{c['d3']['sat']}")
