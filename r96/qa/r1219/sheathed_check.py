#!/usr/bin/env python3
"""R1219c 환도 앞모습 칼집 정식 그림(Dots CX-0168HW 걷기 8칸·서기 6칸) 손질본 검사 — Pillow 만.
 N1 파일·크기  N2 걷기 칸 일관성(딛는 발 y=225, 두건 폭 ±4%, 몸통 x 범위 ≤3.5·이웃 ≤1.6, 걸음 박자 머리 오르내림 1~3px)
 N3 칼날 안 보임(몸 밖 가는 강철빛 ≤6)  N4 색이 기존 아래 걷기(R436, R283 색 목표)와 맞음
 N5 서기 칸 일관성(발 y=225, 머리 흔들림 ≤1, 몸통 ≤2, 두건 ±4%)  N6 색인 수치·sha"""
import os,sys,json,hashlib,warnings
warnings.filterwarnings('ignore',category=DeprecationWarning)
from PIL import Image,ImageFilter
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..');B='runtime-text/assets/r1219/r436/hwando/sheathed/'
flat=lambda im:list(im.get_flattened_data() if hasattr(im,'get_flattened_data') else im.getdata())
fails=[];oks=0
def ok(c,m):
    global oks
    if c: oks+=1
    else: fails.append(m)
def done():
    for f in fails: print('FAIL',f)
    print(f'ok {oks} fail {len(fails)}');sys.exit(1 if fails else 0)
P=lambda f:os.path.join(R,B,f)
for f in ('walk-s.webp','idle-s.webp','index.json'): ok(os.path.exists(P(f)),'N1 없음 '+f)
if fails: done()
I=json.load(open(P('index.json')))
def meas(im,n,cw=192,ch=256):
    out=[]
    for k in range(n):
        c=im.crop((k*cw,0,(k+1)*cw,ch));a=c.split()[3].point(lambda v:255 if v>40 else 0)
        o=a.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5));A=a.load();O=o.load();Pp=c.load()
        rows=[y for y in range(ch) if any(A[x,y] for x in range(cw))];top,bot=rows[0],rows[-1]
        xs=[x for y in range(top+30,top+100) for x in range(cw) if O[x,y]];cx=sum(xs)/len(xs)
        hood=[];
        for y in range(top+4,top+12):
            r=[x for x in range(cw) if A[x,y]]
            if r: hood.append(r[-1]-r[0])
        thin=sum(1 for y in range(ch) for x in range(cw) if A[x,y] and not O[x,y] and (lambda r,g,b,al:abs(r-b)<14 and abs(r-g)<12 and abs(g-b)<12 and r>70)(*Pp[x,y]))
        out.append(dict(top=top,bot=bot,cx=cx,hood=sum(hood)/len(hood),thin=thin))
    return out
def lum(im):
    v=sorted(0.299*r+0.587*g+0.114*b for r,g,b,a in flat(im) if a>200);n=len(v)
    return [v[int(n*q)]/255 for q in (.1,.5,.9)]
W=Image.open(P('walk-s.webp')).convert('RGBA');D=Image.open(P('idle-s.webp')).convert('RGBA')
ok(W.size==(1536,256),'N1 걷기 크기 %s'%(W.size,));ok(D.size==(1152,256),'N1 서기 크기 %s'%(D.size,))
w=meas(W,8);d=meas(D,6)
print('walk',[(m['top'],m['bot'],round(m['cx'],1),round(m['hood'],1),m['thin']) for m in w])
print('idle',[(m['top'],m['bot'],round(m['cx'],1),round(m['hood'],1)) for m in d])
rng=lambda L:max(L)-min(L)
ok(all(224<=m['bot']<=226 for m in w),'N2 걷기 딛는 발 y≠225 '+str([m['bot'] for m in w]))
ok(1<=rng([m['top'] for m in w])<=3,'N2 걷기 머리 오르내림 %d (1~3)'%rng([m['top'] for m in w]))
H=[m['hood'] for m in w];ok(rng(H)/max(H)<=.04,'N2 걷기 두건 폭 변화 %.3f'%(rng(H)/max(H)))
C=[m['cx'] for m in w];ok(rng(C)<=3.5,'N2 걷기 몸통 x 범위 %.2f'%rng(C));ok(all(abs(C[i]-C[(i+1)%8])<=1.6 for i in range(8)),'N2 걷기 이웃 칸 몸통 이동 >1.6')
ok(all(m['thin']<=6 for m in w+d),'N3 몸 밖 강철빛 가는 조각 '+str([m['thin'] for m in w+d]))
ref=lum(Image.open(os.path.join(R,'runtime-text/assets/r436/hwando/walk-s.webp')).convert('RGBA'))
for nm,im in (('걷기',W),('서기',D)):
    L=lum(im);ok(abs(L[1]-ref[1])<=.015 and abs(L[2]-ref[2])<=.025 and abs(L[0]-ref[0])<=.03,f'N4 {nm} 밝기 분위 {[round(v,3) for v in L]} vs 기준 {[round(v,3) for v in ref]}')
ok(all(224<=m['bot']<=226 for m in d),'N5 서기 발 y≠225')
ok(rng([m['top'] for m in d])<=1,'N5 서기 머리 흔들림 >1');ok(rng([m['cx'] for m in d])<=2,'N5 서기 몸통 x 범위 %.2f'%rng([m['cx'] for m in d]))
Hd=[m['hood'] for m in d];ok(rng(Hd)/max(Hd)<=.04,'N5 서기 두건 폭 변화')
ws=I.get('walk',{}).get('s',{});ids=I.get('idle',{}).get('s',{})
ok(ws.get('n')==8 and ws.get('cols')==8 and ws.get('cell')==[192,256] and ws.get('anchor')==[96,226] and ws.get('frames_per_stride')==8 and ws.get('loop') is True,'N6 걷기 색인 '+str({k:ws.get(k) for k in ('n','cell','anchor','frames_per_stride')}))
ok(170<=(ws.get('body') or 0)<=176,'N6 걷기 body 수치');ok(ids.get('n')==6 and ids.get('cell')==[192,256] and ids.get('anchor')==[96,226] and ids.get('loop') is True,'N6 서기 색인')
for e,f in ((ws,'walk-s.webp'),(ids,'idle-s.webp')): ok(e.get('file')==f and e.get('sha256')==hashlib.sha256(open(P(f),'rb').read()).hexdigest(),'N6 sha '+f)
done()
