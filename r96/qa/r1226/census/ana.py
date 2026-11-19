# R1226 전수 분석: 몹마다 동작(걷기·대기·공격·피격)별로 실제 그린 칸의 '실효 방향'과 화면 키·발 위치를 비교
import json,sys,re,os,math,collections
import numpy as np
from PIL import Image
SITE=__import__('os').environ.get('SW_SITE','r96/hospital-three-pc/site/')
IMC={}
def img(p):
    if p not in IMC:
        try: IMC[p]=Image.open(SITE+p).convert('RGBA')
        except Exception as e: IMC[p]=None
    return IMC[p]
def parse(b):
    s=b['src'];m=re.match(r'(.+?\.(?:png|webp|jpg))(?:#[^:]*)?:(\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?):(\d+):',s)
    if m:
        p=m.group(1);r=[float(m.group(i)) for i in range(2,6)];pad=(b['sr'][2]-r[2])/2 if b['sr'] else 0
        return p,r,pad
    p=re.sub(r'#.*$','',s);r=b['sr'] or [0,0,0,0];return p,[float(x) for x in r],0
CELL={}
def cell(p,r):
    k=(p,tuple(int(round(x)) for x in r))
    if k in CELL: return CELL[k]
    im=img(p);res=None
    if im is not None and r[2]>0:
        c=im.crop((int(r[0]),int(r[1]),int(r[0]+r[2]),int(r[1]+r[3])))
        a=np.asarray(c)[:,:,3]
        ys,xs=np.where(a>96)
        if len(ys)>20:
            x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
            sub=c.crop((x0,y0,x1,y1)).resize((32,32))
            A=np.asarray(sub).astype(float);g=(A[:,:,:3].mean(2)/255.)*(A[:,:,3]/255.);m=A[:,:,3]/255.
            colw=a[y0:y1,x0:x1].astype(float).sum(0)
            cx=(colw*np.arange(len(colw))).sum()/max(1,colw.sum())/(x1-x0) # 무게중심 가로 비율
            res=dict(bb=(int(x0),int(y0),int(x1),int(y1)),f=np.concatenate([g.ravel(),m.ravel()]),cx=float(cx))
    CELL[k]=res;return res
def corr(a,b):
    a=a-a.mean();b=b-b.mean();d=math.sqrt((a*a).sum()*(b*b).sum());return float((a*b).sum()/d) if d else 0
def mirror(f):
    g=f[:1024].reshape(32,32)[:,::-1].ravel();m=f[1024:].reshape(32,32)[:,::-1].ravel();return np.concatenate([g,m])
def rows_of(files):
    for fn in files:
        d=json.load(open(fn))
        for z,v in d.items():
            for m in v.get('mobs',[]):
                yield z,m
if __name__=='__main__':
    out=[]
    for z,m in rows_of(sys.argv[1:]):
        R=[r for r in m.get('rows',[]) if r.get('b') and r['st']!='dead']
        if not R: out.append(dict(z=z,k=m['k'],name=m.get('name'),err=m.get('err') or 'norows'));continue
        cells={}
        for r in R:
            p,rect,pad=parse(r['b']);c=cell(p,rect)
            if not c: continue
            P=r['b']['pts'];w=P[1][0]-P[0][0];h=P[3][1]-P[0][1]
            sh=rect[3]+2*pad;sw=rect[2]+2*pad
            top=P[0][1]+(c['bb'][1]+pad)/sh*h;bot=P[0][1]+(c['bb'][3]+pad)/sh*h
            key=(p,tuple(int(x) for x in rect))
            cells.setdefault(key,[]).append(dict(st=r['st'],ph=r['ph'],sd=r.get('sd'),hero=r['hero'],flip=r['b']['flip'],H=bot-top,foot=bot-(r['q'][1] if r['q'] else bot)))
        # 동작 분류: 시트 이름으로
        def mot(p):
            s=p.lower()
            for k,pat in [('atk',r'attack|atk|strike|cast|aim|slash|bite'),('hit',r'-hit|hurt|hit4|_hit'),('walk',r'move|walk|-up\.|-down\.|side'),('idle',r'idle')]:
                if re.search(pat,s): return k
            return 'base'
        # 기준: 가장 많이 그린 걷기/대기/base 칸
        keys=list(cells)
        refk=max([k for k in keys if mot(k[0]) in('walk','idle','base')] or keys,key=lambda k:len(cells[k]))
        ref=cell(*refk)
        info=[]
        for k in keys:
            c=cell(*k);s=corr(ref['f'],c['f']);sm=corr(ref['f'],mirror(c['f']))
            L=cells[k];
            # 실효 방향 = (상대 방향 mirrored?) xor flip, R444 side 별로 모음
            rel= 'M' if sm>s+0.04 else ('S' if s>sm+0.04 else '?')
            eff=collections.Counter()
            for x in L:
                if rel=='?' or not x['sd']: continue
                e=x['flip']^(rel=='M')
                eff[(x['sd'],'F' if e else 'N')]+=1
            Hs=sorted(x['H'] for x in L);Fs=sorted(x['foot'] for x in L)
            info.append(dict(path=k[0],rect=k[1],mot=mot(k[0]),n=len(L),rel=rel,s=round(s,3),sm=round(sm,3),eff=dict((a+b,c) for (a,b),c in eff.items()),H=round(Hs[len(Hs)//2],1),foot=round(Fs[len(Fs)//2],1),cx=round(c['cx'],3)))
        out.append(dict(z=z,k=m['k'],name=m.get('name'),ref=list(refk),cells=info))
    json.dump(out,open('ana.json','w'),ensure_ascii=False,default=str)
    print(len(out))
