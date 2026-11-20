# R1267 픽셀 단위 섬광 분석(WCAG 2.3.1 정의에 맞춤): 같은 자리(픽셀)가 상대휘도 .1 이상 밝아졌다가(어두운 쪽 <.8) 다시 .1 이상 어두워지면 그 픽셀의 섬광 1회.
#  각 픽셀의 1초(게임 시간) 창 최대 섬광 수를 세고, 1초에 3회 넘게 번쩍인 픽셀이 창의 AREA(기본 4%) 이상이면 실패.
#  flicker-probe.mjs 를 DUMP=1 로 돌린 raw-*.json(105×80 감마 8비트)을 읽는다.  python3 pixel-flash.py raw.json [AREA]
import sys,json,base64
import numpy as np
d=json.load(open(sys.argv[1]));AREA=float(sys.argv[2]) if len(sys.argv)>2 else .04
t0=d['t0'];T=np.array(d['times'])-t0
F=np.stack([np.frombuffer(base64.b64decode(r),dtype=np.uint8).reshape(-1) for r in d['raw']]).astype(np.float64)
L=(F/255.)**2.2
n,P=L.shape
# 픽셀마다 극값 추적: 기준값에서 .1 이상 오르면 '밝음' 상태(그 뒤 최대값 갱신), 거기서 .1 이상 내리면 섬광 1회 기록 후 '어두움' 상태
state=np.zeros(P,dtype=np.int8);ref=L[0].copy();flash_t=[[] for _ in range(P)]
for i in range(1,n):
    x=L[i]
    up=(state<=0)&(x-ref>=.1)&(np.minimum(x,ref)<.8)
    dn=(state>=0)&(ref-x>=.1)&(np.minimum(x,ref)<.8)
    for j in np.nonzero(dn&(state==1))[0]:flash_t[j].append(T[i])
    state[up]=1;state[dn]=-1;ref[up]=x[up];ref[dn]=x[dn]
    # 같은 상태에서는 극값 갱신
    m1=(state==1)&(x>ref);ref[m1]=x[m1];m2=(state==-1)&(x<ref);ref[m2]=x[m2]
worst=np.zeros(P,dtype=int)
for j in range(P):
    ts=flash_t[j]
    for a in range(len(ts)):
        c=sum(1 for b in ts[a:] if b<ts[a]+1)
        if c>worst[j]:worst[j]=c
over=(worst>3).mean()
res={'pixels':P,'frames':n,'areaOver3PerSec':round(float(over),4),'areaOver2PerSec':round(float((worst>2).mean()),4),'maxPerPixel':int(worst.max()),'p99':int(np.percentile(worst,99)),'limitArea':AREA,'pass':bool(over<AREA)}
print(json.dumps(res))
sys.exit(0 if res['pass'] else 1)
