# 몹별 접촉 시트: R444 side 오른쪽/왼쪽 줄마다 시간 순으로 실제 그린 칸(뒤집힘·화면 크기·발 기준 그대로)
import json,sys,re,os
from PIL import Image,ImageDraw,ImageFont
sys.path.insert(0,__import__('os').path.dirname(__file__))
from ana import parse,img
FONT=ImageFont.truetype('/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',12) if os.path.exists('/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc') else ImageFont.load_default()
COL={'walk':(60,140,60),'idle':(90,90,90),'atk':(200,40,40),'hit':(200,140,0)}
def strip(rows,maxn=12,S=1.4):
    seq=[]
    for r in rows:
        p,rect,pad=parse(r['b']);key=(p,tuple(int(x) for x in rect),r['b']['flip'],r['st'])
        if seq and seq[-1][0]==key: continue
        seq.append((key,r))
    # 공격 전후를 고르게: 공격 칸은 모두, 나머지는 솎기
    atk=[s for s in seq if s[1]['st']=='atk'];oth=[s for s in seq if s[1]['st']!='atk']
    pick=set(id(s) for s in atk[:8])|set(id(s) for s in oth[:max(2,maxn-len(atk[:8]))])
    seq=[s for s in seq if id(s) in pick][:maxn]
    tiles=[]
    for key,r in seq:
        p,rect,pad=parse(r['b']);im=img(p)
        if im is None: continue
        c=im.crop((int(rect[0]),int(rect[1]),int(rect[0]+rect[2]),int(rect[1]+rect[3])))
        P=r['b']['pts'];w=abs(P[1][0]-P[0][0]);h=P[3][1]-P[0][1]
        sw=rect[2]+2*pad;sh=rect[3]+2*pad
        tw=max(1,int(rect[2]/sw*w*S));th=max(1,int(rect[3]/sh*h*S))
        c=c.resize((tw,th))
        if r['b']['flip']: c=c.transpose(Image.FLIP_LEFT_RIGHT)
        top=(P[0][1]+pad/sh*h - r['q'][1])*S  # 앵커(발) 기준 위쪽 오프셋
        tiles.append((c,top,r['st']))
    return tiles
def render(mobs,out):
    rowsimg=[]
    for z,m in mobs:
        R=[r for r in m.get('rows',[]) if r.get('b') and r['st']!='dead' and r.get('q')]
        lines=[]
        for sd in ('right','left'):
            rr=[r for r in R if r.get('sd')==sd]
            lines.append((sd,strip(rr)))
        H=200;W=1800
        canvas=Image.new('RGB',(W,H*2+18),(205,205,205));d=ImageDraw.Draw(canvas)
        d.text((4,0),f"{z} {m['k'].split('|')[0]} {m['k'].split('|')[1]}",fill=(0,0,0),font=FONT)
        for li,(sd,tiles) in enumerate(lines):
            y0=18+li*H;base=y0+H-20;x=40
            d.text((2,y0+4),'→R' if sd=='right' else 'L←',fill=(0,0,160),font=FONT)
            d.line((0,base,W,base),fill=(150,150,150))
            for c,top,st in tiles:
                if x+c.width>W: break
                canvas.paste(c,(x,int(base+top)),c)
                d.rectangle((x,base+2,x+c.width,base+8),fill=COL.get(st,(0,0,0)))
                x+=c.width+6
        rowsimg.append(canvas)
    if not rowsimg: return
    W=max(i.width for i in rowsimg);Ht=sum(i.height for i in rowsimg)
    big=Image.new('RGB',(W,Ht),(255,255,255));y=0
    for i in rowsimg: big.paste(i,(0,y));y+=i.height
    big.thumbnail((1800,4000));big.save(out,quality=85)
if __name__=='__main__':
    files=sys.argv[2:];outdir=sys.argv[1];os.makedirs(outdir,exist_ok=True)
    mobs=[]
    for fn in files:
        d=json.load(open(fn))
        for z,v in d.items():
            for m in v.get('mobs',[]): mobs.append((z,m))
    for i in range(0,len(mobs),4):
        render(mobs[i:i+4],f'{outdir}/s{i//4:03d}.jpg')
    print(len(mobs))
