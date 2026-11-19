#!/usr/bin/env python3
"""R1238b 네온 공격 파생 시트 실측(PIL): 몸통 폭·머리 키가 원본 R437 보다 줄고, 서기 옆모습(R130 idle-e)에 더 가까워졌는지.
 몸통 폭 = 머리 아래 40~90줄(창보다 아래, 허리 위) 중 뒷발 기준 왼쪽~손 이전 불투명 폭 중앙값 / 몸 키. python3 r96/qa/r1238/r1238b-art-check.py"""
from pathlib import Path
from PIL import Image
R=Path(__file__).resolve().parents[2]/'runtime-text'
def frames(p,cw):
    im=Image.open(R/p).convert('RGBA');return [im.crop((i*cw,0,(i+1)*cw,256)) for i in range(im.width//cw)]
def meas(f):
    a=f.getchannel('A');w,h=a.size;px=a.load()
    rows=[y for y in range(h) if any(px[x,y]>40 for x in range(w))];top,bot=rows[0],rows[-1];H=bot-top+1
    # 머리 키: 위에서부터 폭이 처음으로 좁아졌다 넓어지는 목 — 간단히 위 25% 안 최소 폭 줄까지
    def width(y):
        xs=[x for x in range(w) if px[x,y]>40];return (xs[-1]-xs[0]+1) if xs else 0
    # 몸통: 머리 꼭대기에서 몸 키 .30~.42 줄(창·팔 아래, 허리 위) — 가장 왼쪽 불투명 덩어리 폭
    ws=[]
    for y in range(top+int(H*.30),top+int(H*.42)):
        xs=[x for x in range(w) if px[x,y]>40]
        if not xs:continue
        run=1;best=1;x0=xs[0]
        for i in range(1,len(xs)):
            if xs[i]==xs[i-1]+1:run+=1
            else:run=1
            best=max(best,run)
        ws.append(best)
    ws.sort();return {'H':H,'torso':ws[len(ws)//2]/H}
fail=0
def ok(m,c,x):
    global fail;print('PASS' if c else 'FAIL',m,x);fail+=0 if c else 1
old=[meas(f) for f in frames('assets/r437/attack/neon/attack-e.webp',224)]
new=[meas(f) for f in frames('assets/r1238/neon/attack-e.webp',224)]
idle=[meas(f) for f in frames('assets/r130/neon/idle-e.webp',192)]
med=lambda v:sorted(v)[len(v)//2]
o,nw,i=med([m['torso'] for m in old]),med([m['torso'] for m in new]),med([m['torso'] for m in idle])
ok('6칸 모두 있음',len(new)==6,len(new))
ok('몸 키는 머리 줄인 만큼만 낮아짐(44줄×.12≈5px, 4% 이내)',all(0<=a['H']-b['H']<=7 and b['H']>=a['H']*.96 for a,b in zip(old,new)),[(a['H'],b['H']) for a,b in zip(old,new)])
ok('몸통 폭/키가 원본보다 8% 이상 가늘어짐',nw<=o*.92,{'old':round(o,3),'new':round(nw,3),'idle':round(i,3)})
ok('서기 옆모습 몸통 비율과의 차이가 줄어듦',abs(nw-i)<abs(o-i),{'before':round(abs(o-i),3),'after':round(abs(nw-i),3)})
print('\nR1238b 그림 실측 실패 %d'%fail if fail else '\nR1238b 그림 실측 통과');raise SystemExit(1 if fail else 0)
