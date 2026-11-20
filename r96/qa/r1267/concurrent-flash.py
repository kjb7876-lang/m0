# R1267 동시 섬광 분석(WCAG 2.3.1 '일반 섬광' 정의에 가장 가깝게): 같은 픽셀이 상대휘도 .1 이상 밝아졌다가(어두운 쪽 <.8)
#  다시 .1 이상 어두워질 때 그 픽셀의 섬광 한 번이 '완성'된다. 한 프레임(±1프레임)에 섬광을 완성한 픽셀이 창의 AREA(기본 4%) 이상이면
#  그 순간을 화면 섬광 1회로 센다(흩어진 스프라이트 움직임처럼 서로 다른 때 바뀌는 픽셀은 한데 묶이지 않음).
#  어느 1초(게임 시간) 창에서든 화면 섬광이 3회를 넘으면 실패.  python3 concurrent-flash.py raw.json [AREA]
import sys,json,base64
import numpy as np
d=json.load(open(sys.argv[1]));AREA=float(sys.argv[2]) if len(sys.argv)>2 else .04;B=int(sys.argv[3]) if len(sys.argv)>3 else 1
T=np.array(d['times'])-d['t0']
L=(np.stack([np.frombuffer(base64.b64decode(r),dtype=np.uint8).reshape(-1) for r in d['raw']]).astype(np.float64)/255.)**2.2
if B>1:  # B×B 칸 평균 휘도(눈이 느끼는 넓이 밝기 — 촘촘한 무늬가 자리만 바꾸는 움직임은 섬광이 아님)
    n0=L.shape[0];L=L.reshape(n0,80,105)[:,:80//B*B,:105//B*B].reshape(n0,80//B,B,105//B,B).mean(axis=(2,4)).reshape(n0,-1)
n,P=L.shape
state=np.zeros(P,dtype=np.int8);ref=L[0].copy();comp=np.zeros(n)
for i in range(1,n):
    x=L[i];lo=np.minimum(x,ref)<.8
    up=(state<=0)&(x-ref>=.1)&lo
    dn=(state>=0)&(ref-x>=.1)&lo
    comp[i]=(dn&(state==1)).mean()
    state[up]=1;state[dn]=-1;ref[up]=x[up];ref[dn]=x[dn]
    m1=(state==1)&(x>ref);ref[m1]=x[m1];m2=(state==-1)&(x<ref);ref[m2]=x[m2]
# ±1 프레임 묶음 넓이
c3=comp.copy();c3[1:]+=comp[:-1];c3[:-1]+=comp[1:]
ev=[];i=0
while i<n:
    if c3[i]>=AREA:
        j=i
        while j+1<n and c3[j+1]>=AREA:j+=1
        k=i+int(np.argmax(c3[i:j+1]));ev.append(float(T[k]));i=j+2
    else:i+=1
worst=max([sum(1 for b in ev if a<=b<a+1) for a in ev] or [0])
res={'frames':n,'flashes':len(ev),'worstPerSec':worst,'maxConcurrent':round(float(c3.max()),4),'p95Concurrent':round(float(np.percentile(c3,95)),4),'times':[round(t,2) for t in ev],'limitArea':AREA,'block':B,'pass':worst<=3}
print(json.dumps(res));sys.exit(0 if res['pass'] else 1)
