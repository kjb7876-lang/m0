# R523 그림 표 만들기: 그림(또는 시트 칸)에서 그려지는 사각형 r, 알파 칸 m(20×28), 바닥 자리 ft, 아래 여백 up 을 잰다.
#  쓰기: SLMAX=4 [R523_SRC=<밖 원본 폴더>] python3 mkart.py spec1.json art1.json   (spec: [{key,src,h|L|ch,face,flat?,ang?,cut?:[x,y,w,h],trim?,out?,max?,pair?,d?}])
#  그다음 python3 apply-art.py art1.json art2.json 이 client-source/rooms-r523.js 의 /*ART*/ 사이를 바꿔 넣는다. 표를 손으로 고치지 않는다.
import sys,json,os,numpy as np
from PIL import Image
def lower_hull(pts):  # pts sorted by x; y down. 아래쪽(큰 y) 껍질
    h=[]
    for p in pts:
        while len(h)>=2:
            (x1,y1),(x2,y2)=h[-2],h[-1]
            if (x2-x1)*(p[1]-y1)-(y2-y1)*(p[0]-x1)>=0: h.pop()
            else: break
        h.append(p)
    return h
SLMAX=float(os.environ.get('SLMAX','1.6'));U=34*2**.5;MW,MH=20,28;R96=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..'));ROOT=R96+'/runtime-text/';SITE=R96+'/hospital-three-pc/site/';EXT=os.environ.get('R523_SRC','')+'/'  # EXT: 저장소 밖 원본(드라이브에서 받은 그림·3D 렌더)을 둔 폴더
def measure(im,h,athr=48):
    im=im.convert('RGBA');W,H=im.size;A=np.array(im)[:,:,3];a=A>athr
    ys,xs=np.nonzero(a);cx0,cx1,cy0,cy1=xs.min(),xs.max(),ys.min(),ys.max()
    s=h/H
    r=[(cx0-W/2)*s/U,(cx1+1-W/2)*s/U,0,(cy1+1-cy0)*s/U]
    up=(H-1-cy1)/H
    # 알파 칸
    bits=[]
    for j in range(MH):
        ya=cy0+(cy1+1-cy0)*j/MH;yb=cy0+(cy1+1-cy0)*(j+1)/MH
        for i in range(MW):
            xa=cx0+(cx1+1-cx0)*i/MW;xb=cx0+(cx1+1-cx0)*(i+1)/MW
            cell=a[int(ya):max(int(ya)+1,int(np.ceil(yb))),int(xa):max(int(xa)+1,int(np.ceil(xb)))]
            bits.append(1 if cell.mean()>=.35 else 0)
    m=''.join('%x'%int(''.join(map(str,bits[k:k+4])),2) for k in range(0,MW*MH,4))
    # 바닥 자리
    cols=np.nonzero(a.any(axis=0))[0]
    bot=[(int(x),int(np.nonzero(a[:,x])[0].max())) for x in cols]
    hull=lower_hull(bot);segs=[]
    for (xa,ya),(xb,yb) in zip(hull,hull[1:]):
        dx=xb-xa
        if dx>0: segs.append((xa,xb,(yb-ya)/dx))
    Ls=[xa for xa,xb,sl in segs if .15<sl<=SLMAX];Rs=[xb for xa,xb,sl in segs if -SLMAX<=sl<-.15]
    B=max(hull,key=lambda p:p[1])
    lx=min(Ls) if Ls else cx0;rx=max(Rs) if Rs else cx1
    ft=[(lx-W/2)*s/U,(rx+1-W/2)*s/U,(B[0]+.5-W/2)*s/U]
    return dict(r=[round(float(v),3) for v in r],up=round(up,3),m=m,ft=[round(v,3) for v in ft],cw=int(cx1-cx0+1),ch=int(cy1-cy0+1),W=W,H=H)
def main(spec,out):
    res={}
    for a in json.load(open(spec)):
        src=EXT+a['src'][4:] if a['src'].startswith('ext:') else (ROOT+a['src'] if os.path.exists(ROOT+a['src']) else SITE+a['src'])
        im=Image.open(src).convert('RGBA')
        if a.get('cut'):
            x,y,w,h=a['cut'];im=im.crop((x,y,x+w,y+h))
        if a.get('trim'):
            bb=im.getchannel('A').point(lambda v:255 if v>24 else 0).getbbox();im=im.crop(bb)
        if a.get('out'):
            mx=a.get('max',256);sc=min(1,mx/max(im.size))
            if sc<1: im=im.resize((max(1,round(im.size[0]*sc)),max(1,round(im.size[1]*sc))),Image.LANCZOS)
            os.makedirs(os.path.dirname(ROOT+a['out']),exist_ok=True);im.save(ROOT+a['out'],quality=90,method=6)
            path=a['out']
        else: path=a['src']
        if 'L' in a:
            m=measure(im,100);sL,sR,sB=m['ft'];a['h']=round(100*a['L']/max((sB-sL)*2**.5,(sR-sB)*2**.5))
        elif 'ch' in a:
            m=measure(im,100);a['h']=round(a['ch']*m['H']/m['ch'])
        m=measure(im,a['h'])
        sL,sR,sB=m['ft'];lenX=(sB-sL)*2**.5;lenY=(sR-sB)*2**.5
        e=dict(path=path,h=a['h'],face=a.get('face','s'),ang=a.get('ang','iso'))
        if a.get('flat',True) and e['ang']=='iso': e['flat']=True
        if m['up']>=.004: e['up']=m['up']
        if e['ang']=='iso': e['ft']=m['ft']
        else: e['d']=a.get('d',.5)
        if a.get('pair'): e['pair']=a['pair']
        if a.get('lift') is not None: e['lift']=a['lift']
        e['r']=m['r'];e['m']=m['m']
        res[a['key']]=e
        print(a['key'].ljust(12),'h',a['h'],'content',m['cw'],'x',m['ch'],'of',m['W'],'x',m['H'],'up',m['up'],'r',m['r'],'ft',m['ft'],'lenX %.2f lenY %.2f'%(lenX,lenY))
    json.dump(res,open(out,'w'),ensure_ascii=False,separators=(',',':'))
if __name__=='__main__': main(sys.argv[1],sys.argv[2])
