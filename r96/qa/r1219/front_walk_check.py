#!/usr/bin/env python3
"""R1219 환도 앞모습(아래) 걷기 — 칼을 칼집에 둔 채 걷기 + 칸 일관성 검사(Pillow 만, numpy 없음).
사용자 2026-11-19 "환도영웅 앞모습모션 더 일관성있게 만들고싶은데 칼집에 칼을둔채로 간지나게 이동하게".
검사 대상 = 게임이 아래 걷기에 실제로 그리는 시트(hwando-r271.js 의 R1219 경로 바꿈을 따른다).
 A 정적: r271 이 R436 아래 걷기를 R1219 파생본으로 바꿔 그리고·미리 받는다, 끄기 키가 있다, EGO 파일은 손대지 않는다.
 B 칼날 없음: 칸마다 몸 바깥(가는 조각)의 강철빛 무채색 픽셀 ≤ 6, 손 위 오른쪽(칼날이 지나던 곳) 무채색 ≤ 12.
 C 구멍 없음: 칼날을 지운 자리 중 몸 윤곽(닫힘) 안쪽은 메워서 투명 ≤ 4, 칼날 아닌 옷 픽셀 지움 ≤ 40.
 D 나머지 그대로: 머리(위 38줄 × 왼쪽 80열 — 오른쪽은 칼끝이 지나던 곳)·다리와 발(아래 70줄)은 원본과 바이트까지 같다 → 몸 키·발 기준점·윤곽 불변.
 E 칸 일관성: 머리 꼭대기 흔들림 ≤ 2px, 몸통 가운데 x 흔들림 ≤ 1.5px, 몸 넓이 변화 ≤ 6%, 칼집(적갈색) 픽셀이 칸마다 있다.
 F 경계: 칸 수 6, 시트 크기 원본과 같음, 알파가 0 인 곳 색은 상관없음.
"""
import os,re,sys,json,warnings
warnings.filterwarnings('ignore',category=DeprecationWarning)
flat=lambda im:list(im.get_flattened_data() if hasattr(im,'get_flattened_data') else im.getdata())  # CI Pillow 11.3 엔 get_flattened_data 없음
from PIL import Image,ImageFilter
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..')
SRC='runtime-text/assets/r436/hwando/walk-s.webp'
DRV='runtime-text/assets/r1219/r436/hwando/walk-s.webp'
fails=[];oks=0
def ok(c,msg):
    global oks
    if c: oks+=1
    else: fails.append(msg)
# A 정적
js=open(os.path.join(R,'client-source','hwando-r271.js'),encoding='utf-8').read()
ok('R1219' in js,'A1 hwando-r271.js 에 R1219 없음')
ok(re.search(r"r1219",js) and re.search(r"r436\\?/hwando\\?/walk-s",js),'A2 R436 walk-s → R1219 경로 바꿈 없음')
ok('storyworld.r1219.hwandoSheath' in js,'A3 끄기 키 storyworld.r1219.hwandoSheath 없음')
pre=re.search(r"if\(WS\)image\(([^;]*)\);",js)
ok(bool(pre) and 'sheath(' in pre.group(1),'A4 R436 미리 받기가 sheath() 를 거치지 않음(파생본 미리 받기 안 됨)')
ok('p=sheath(tex(' in js,'A7 그리기 경로가 sheath() 를 거치지 않음')
ok(os.path.exists(os.path.join(R,DRV)),'A5 파생 시트 없음 '+DRV)
ego=open(os.path.join(R,'client-source','ego-motion-r1048.js'),encoding='utf-8').read()
ok('r1219' not in ego,'A6 EGO 모션 파일을 건드렸다')
if not os.path.exists(os.path.join(R,DRV)):
    print('\n'.join('FAIL '+f for f in fails));print(f'ok {oks} fail {len(fails)}');sys.exit(1)
S=Image.open(os.path.join(R,SRC)).convert('RGBA');D=Image.open(os.path.join(R,DRV)).convert('RGBA')
idx=json.load(open(os.path.join(R,'runtime-text/assets/r436/hwando/index.json')))['walk']['s']
N=idx['n'];CW,CH=idx['cell']
ok(S.size==D.size,'F1 크기 다름 %s %s'%(S.size,D.size));ok(N==6 and S.width==N*CW,'F2 칸 수/폭')
def masks(c):
    a=c.split()[3].point(lambda v:255 if v>40 else 0)
    o=a.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
    cl=o.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))
    return a,o,cl
def steel(p):
    r,g,b,al=p;return al>40 and abs(r-b)<14 and abs(r-g)<12 and abs(g-b)<12 and r>70
tops=[];cxs=[];areas=[]
for k in range(N):
    box=(k*CW,0,(k+1)*CW,CH);c=D.crop(box);s=S.crop(box)
    a,o,cl=masks(c);P=c.load();A=a.load();O=o.load();C=cl.load()
    thin=sum(1 for y in range(CH) for x in range(CW) if A[x,y] and not O[x,y] and steel(P[x,y]) and x>40)
    ok(thin<=6,f'B1 칸{k} 몸 밖 강철빛 가는 조각 {thin}px (>6)')
    up=sum(1 for y in range(0,100) for x in range(72,CW) if steel(P[x,y]))
    ok(up<=12,f'B2 칸{k} 손 위 오른쪽(x≥72, 소매 밝은 흰빛 제외) 무채색 {up}px (>12)')
    Q=s.load()
    holes=sum(1 for y in range(40,130) for x in range(CW) if C[x,y] and P[x,y][3]<=40 and Q[x,y][3]>40)
    ok(holes<=4,f'C1 칸{k} 칼날 지운 자리 몸 안 구멍 {holes}px (>4)')
    lost=sum(1 for y in range(CH) for x in range(CW) if Q[x,y][3]>40 and P[x,y][3]<=40 and not steel(Q[x,y]) and not (Q[x,y][3]<200))
    ok(lost<=40,f'C2 칸{k} 칼날 아닌 옷 픽셀 지워짐 {lost}px (>40)')
    nz=lambda im:[v if v[3] else (0,0,0,0) for v in flat(im)]
    same=lambda y0,y1,x1=CW:nz(c.crop((0,y0,x1,y1)))==nz(s.crop((0,y0,x1,y1)))
    ok(same(0,38,80),f'D1 칸{k} 머리(왼쪽 80열 × 위 38줄) 바뀜');ok(same(CH-70,CH),f'D2 칸{k} 다리·발 줄 바뀜')
    ys=[y for y in range(CH) if any(O[x,y] for x in range(CW))];tops.append(ys[0])
    xs=[x for y in range(ys[0]+30,ys[0]+100) for x in range(CW) if O[x,y]];cxs.append(sum(xs)/len(xs))
    areas.append(sum(1 for v in flat(o) if v))
    sheath=sum(1 for y in range(85,115) for x in range(55,95) if (lambda r,g,b,al:al>200 and r-b>45 and r<190 and g<140)(*P[x,y]))
    ok(sheath>=25,f'E4 칸{k} 칼집(적갈색) 픽셀 {sheath} (<25)')
ok(max(tops)-min(tops)<=2,f'E1 머리 꼭대기 흔들림 {max(tops)-min(tops)}px')
ok(max(cxs)-min(cxs)<=1.5,f'E2 몸통 가운데 흔들림 {max(cxs)-min(cxs):.2f}px')
ok((max(areas)-min(areas))/max(areas)<=.06,f'E3 몸 넓이 변화 {(max(areas)-min(areas))/max(areas):.3f}')
print('tops',tops,'cx',[round(v,1) for v in cxs],'area',areas)
for f in fails: print('FAIL',f)
print(f'ok {oks} fail {len(fails)}');sys.exit(1 if fails else 0)
