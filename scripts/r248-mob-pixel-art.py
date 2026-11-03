"""R248 몹 임시 픽셀 시트 — 사용자 2026-11-03 "몹 재활용하지마 … 몹이름에 맞게 나오고 서사에맞는 자산이 없으면 너가 픽셀스킬사용해서 몹임시생성후
향후 자산들어오면 그걸로 적용". 우리 코드로 직접 그린 임시 자산(CC0 상당, Aseprite 방식: 제한 팔레트·저해상도 칸 → 정수배 확대 → R166 결 다듬기).
몹 이름의 낱말로 몸 유형(사람형·망령·네발짐승·거미·점액·기계·결정·인형·식물·날개·물건·안개·덩어리·뱀)과 색·머리·무기를 고르고, 이름의 해시로 비율·무늬를 흔든다.
칸 64x80 → ×4 = 256x320. 4열×3행: 0~7 걷기 8프레임, 8~11 공격 4프레임(뒤로 젖힘 → 내지름 → 끝 → 돌아옴). 그림은 오른쪽을 본다. 발 기준점 (128,300).
사용: python3 -I scripts/r248-mob-pixel-art.py <assign.json> <out dir>
 assign.json = [{"id":"m001","name":"몹 이름"}, ...]  → <out>/<id>.webp + <out>/index.json(이름·유형·sha256·크기)"""
import sys, os, math, json, hashlib, random, colorsys
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
SRC,OUT=sys.argv[1],sys.argv[2];os.makedirs(OUT,exist_ok=True)
W,H,S=64,80,4;FX,FY=32,75;OL=(14,9,11,255)
# ---- 이름 → 유형·색 -----------------------------------------------------------------------------
KIND=[('spider',r'거미'),('slime',r'슬라임|점액|소화액'),('fog',r'안개|연기'),('crystal',r'결정|수정|인장'),
 ('drone',r'드론|정찰체'),('quad',r'개$|견$|사냥개|늑대|여우|곰|짐승|추적견|추적자$'),('winged',r'용$|나방|가고일|박쥐|까마귀'),('serpent',r'뱀'),
 ('puppet',r'마네킹|인형|꼭두각시|박제'),('plant',r'나무|뿌리|덩굴|곰팡이'),('golem',r'골렘|위장|쓰레기|봉투|식재료|덩어리|도시$'),
 ('blade',r'칼날|검흔|유리 조각|환수검'),('coin',r'동전|요요'),('mask',r'가면'),('paper',r'글씨|문장|종이|사진|지폐|기록의|CCTV|표기|교정 표시|호외'),
 ('heel',r'하이힐'),('lipstick',r'립스틱'),('candy',r'사탕|가시'),('cross',r'역십자가'),('bottle',r'약병|병핵'),
 ('mech',r'기계|장치|사이보그|연산|케이블|칩|연결자|연결체|봉인구|수집가|수집자|운반 집행|포식체|포식자|태엽|판결'),
 ('wraith',r'망령|잔영|잔향|그림자|유령|공허|잔재|환각|형상|잔류|파동|신호|공포|잠식|청람|시선|발자국|명령선|공허체')]
import re
HUMAN=r'기사$|근위$|병$|교주$|신도$|학생$|환자$|의료인$|집행체$|구속자$|감독$|주문사$|술사$|순찰자$|전우$|동료$|호위병$|부활자$|고블린$|사수$|재판관$|손님$|투사$|대련생$|도전자$|식객$|밀고자$|좀비$|악마$|천사$|실험체$|망자$|집도의$|사냥꾼$|군단병$|침공군$|침공병$|강재헌$|페르소나$|하수인$|수문장$'
def kind_of(n):
    """한국어 이름은 끝 낱말이 몸이다(예: '악마화 나무의 침식 근위' = 근위). 끝 낱말로 먼저, 없으면 이름 전체로 고른다."""
    last=n.split()[-1] if n.split() else n
    if re.search(HUMAN,last) and not re.search(r'여우 악마$|박제된',n):return 'human'
    for k,rx in KIND:
        if re.search(rx,last):return k
    for k,rx in KIND:
        if re.search(rx,n):return k
    return 'human'
COL=[(r'보라|보랏빛',(120,60,150)),(r'검은|흑|어둠|공허',(46,40,52)),(r'백의|흰|백은|은|하얀',(200,196,186)),(r'붉은|피|핏|화염|불길|불',(150,40,32)),
 (r'청람|푸른|파랑|설원|눈보라',(70,110,150)),(r'금|황금|금박',(190,150,70)),(r'늪|이끼|녹|곰팡이|진흙',(80,100,60)),(r'재|잿|먼지',(110,104,100)),
 (r'장미',(150,60,80)),(r'강철|철|기계|사이보그|전극',(110,116,124)),(r'유리|투명',(150,180,190)),(r'소독|병원|의료|환자',(170,190,180))]
def base_col(n,rnd):
    for rx,c in COL:
        if re.search(rx,n):return c
    h=rnd.random();r,g,b=colorsys.hsv_to_rgb(h,.35,.42);return (int(r*255),int(g*255),int(b*255))
def shade(c,k):return tuple(max(0,min(255,int(v*k))) for v in c[:3])+(255,)
def head_of(n):
    if re.search(r'얼굴 없는|무안',n):return 'faceless'
    if re.search(r'가면|탈',n):return 'mask'
    if re.search(r'좀비|망자|되살아난|해골|부활자|전우|수호병|호위병',n):return 'skull'
    if re.search(r'신도|주문사|술사|사제|순례|식객',n):return 'hood'
    if re.search(r'기사|근위|파수|집행|순찰|수문장|봉인병|파수병|감독|대련생|도전자|투사|기사',n):return 'helmet'
    if re.search(r'사이보그|기계',n):return 'cyborg'
    if re.search(r'의료인|환자|학생|아이',n):return 'pale'
    return ['hood','faceless','helmet','pale'][len(n)%4]
def weapon_of(n):
    if re.search(r'창|역십자',n):return 'spear'
    if re.search(r'검|칼|도전자|대련생|기사|근위|수호',n):return 'blade'
    if re.search(r'주문사|술사|사제|신도',n):return 'staff'
    if re.search(r'의료|주사|구속자|집행',n):return 'needle'
    if re.search(r'사격|사수',n):return 'gun'
    if re.search(r'등|랜턴|순찰',n):return 'lantern'
    if re.search(r'악마|짐승|공포|포식',n):return 'claws'
    return 'none'
# ---- 그리기 도우미 -----------------------------------------------------------------------------
def L(d,pts,col,w):d.line(pts,fill=OL,width=w+2);d.line(pts,fill=col,width=w)
def E(d,box,col):d.ellipse(box,fill=col,outline=OL)
def R(d,box,col):d.rectangle(box,fill=col,outline=OL)
def P(d,pts,col):d.polygon(pts,fill=col,outline=OL)
def pose(f,atk):
    """걷기 f(0~7) 또는 공격 atk(0~3) → (다리 흔들림, 몸 들썩임, 앞으로 기울임, 팔 뻗음)"""
    if atk is None:ph=f/8*2*math.pi;return math.sin(ph),abs(math.cos(ph)),0.,.3+.2*math.sin(ph)
    return [(0,0,-.5,-.4),(.4,0,.9,1.),(.3,0,.6,.8),(0,0,.1,.3)][atk]
def legs2(d,sw,x,y,col,dark,ln=13,gap=5,w=3):
    for dx,s,c in ((-gap//2,sw,dark),(gap//2,-sw,col)):
        hx=x+dx;fx=hx+s*4;L(d,[(hx,y),(hx+s*2,y+ln*.5),(fx,y+ln)],c,w);d.line([(fx,y+ln),(fx+3,y+ln)],fill=OL,width=2)
# ---- 유형별 몸 ---------------------------------------------------------------------------------
def human(d,f,atk,p):
    sw,bob,lean,reach=pose(f,atk);c,dk,lt=p['c'],p['dk'],p['lt'];y0=40-int(bob*1.5);x=FX+int(lean*3)
    legs2(d,sw,FX,y0+12,dk,shade(p['c'],.45),ln=FY-(y0+12))
    # 몸통(외투) — 아래로 퍼짐
    P(d,[(x-7,y0),(x+7,y0),(x+9+lean,y0+16),(x-9+lean*0,y0+16)],c);d.line([(x,y0+1),(x,y0+15)],fill=dk)
    if p['wings']:
        for s in (-1,1):
            wy=y0+2-int(bob*2);P(d,[(x+s*4,wy),(x+s*22,wy-14+int(sw*3)),(x+s*18,wy+2),(x+s*12,wy+8)],p['wingc'])
    # 팔·무기(오른쪽 = 앞)
    ax,ay=x+6,y0+3;hx=ax+int(4+reach*9);hy=ay+int(10-reach*6);L(d,[(ax,ay),(ax+3,ay+6),(hx,hy)],c,3);E(d,(hx-2,hy-2,hx+2,hy+2),p['skin'])
    L(d,[(x-6,y0+3),(x-8,y0+10),(x-7,y0+16)],dk,3)
    wpn=p['weapon']
    if wpn=='blade':L(d,[(hx,hy),(hx+int(10+reach*4),hy-int(9-reach*8))],(200,200,206,255),2)
    elif wpn=='spear':L(d,[(hx-8,hy+4),(hx+16,hy-6+int(reach*4))],(120,90,60,255),1);P(d,[(hx+16,hy-8+int(reach*4)),(hx+22,hy-6+int(reach*4)),(hx+16,hy-4+int(reach*4))],(200,200,206,255))
    elif wpn=='staff':L(d,[(hx,hy+10),(hx+2,hy-16)],(90,70,50,255),2);E(d,(hx-1,hy-21,hx+5,hy-15),p['glow'])
    elif wpn=='needle':L(d,[(hx,hy),(hx+9+int(reach*3),hy-3)],(210,220,225,255),1);R(d,(hx-1,hy-2,hx+4,hy+1),(170,190,200,255))
    elif wpn=='gun':
        L(d,[(hx-6,hy+1),(hx+12+int(reach*2),hy-1)],(60,60,66,255),2);R(d,(hx-4,hy,hx,hy+4),(80,60,40,255))
        if reach>.7:d.ellipse((hx+12,hy-4,hx+18,hy+2),fill=(255,200,120,230))
    elif wpn=='lantern':L(d,[(hx,hy),(hx,hy+5)],OL,1);R(d,(hx-2,hy+5,hx+3,hy+11),p['glow'])
    elif wpn=='claws':
        for k in range(3):d.line([(hx,hy),(hx+5+reach*3,hy-3+k*2)],fill=(220,210,200,255),width=1)
    # 머리
    hd=p['head'];hx0,hy0=x-5+int(lean*2),y0-12
    if hd=='hood':P(d,[(hx0-1,hy0+12),(hx0+5,hy0-1),(hx0+11,hy0+12)],dk);E(d,(hx0+2,hy0+4,hx0+8,hy0+11),(10,8,10,255));d.point((hx0+4,hy0+7),fill=p['glow']);d.point((hx0+6,hy0+7),fill=p['glow'])
    elif hd=='helmet':R(d,(hx0,hy0+1,hx0+10,hy0+12),shade(p['metal'],1));d.line([(hx0+2,hy0+6),(hx0+9,hy0+6)],fill=(20,14,16,255),width=1);d.point((hx0+7,hy0+6),fill=p['glow'])
    elif hd=='skull':E(d,(hx0,hy0+1,hx0+10,hy0+12),(200,190,170,255));d.point((hx0+3,hy0+6),fill=OL);d.point((hx0+7,hy0+6),fill=OL);d.line([(hx0+4,hy0+10),(hx0+7,hy0+10)],fill=OL)
    elif hd=='cyborg':E(d,(hx0,hy0+1,hx0+10,hy0+12),p['skin']);R(d,(hx0+5,hy0+3,hx0+10,hy0+9),shade(p['metal'],1));d.point((hx0+8,hy0+6),fill=(255,60,50,255))
    elif hd=='mask':E(d,(hx0,hy0+1,hx0+10,hy0+12),(26,22,26,255));E(d,(hx0+1,hy0+2,hx0+9,hy0+11),(232,228,220,255));d.line([(hx0+3,hy0+6),(hx0+4,hy0+6)],fill=OL);d.line([(hx0+6,hy0+6),(hx0+7,hy0+6)],fill=OL)
    elif hd=='faceless':E(d,(hx0,hy0+1,hx0+10,hy0+12),(214,206,196,255));d.line([(hx0+3,hy0+4),(hx0+5,hy0+9)],fill=(180,170,160,255))
    else:E(d,(hx0,hy0+1,hx0+10,hy0+12),p['skin']);d.point((hx0+6,hy0+6),fill=OL);d.point((hx0+8,hy0+6),fill=OL)
    if p['horns']:
        for s in (0,10):L(d,[(hx0+s,hy0+3),(hx0+s+(-3 if s==0 else 3),hy0-4)],(60,50,44,255),1)
    if p['halo']:d.ellipse((hx0-1,hy0-5,hx0+11,hy0-1),outline=(200,170,100,255))
def wraith(d,f,atk,p):
    sw,bob,lean,reach=pose(f,atk);c,dk=p['c'],p['dk'];y0=30+int(math.sin(f/8*2*math.pi)*2);x=FX+int(lean*4)
    pts=[(x-8,y0),(x+8,y0)]
    for k in range(5):tx=x+10-k*5+int(math.sin(f*.8+k)*2);pts.append((tx,FY-6-int(abs(math.sin(f*.6+k))*5)+(k%2)*4))
    P(d,pts,(c[0],c[1],c[2],210))
    for k in range(3):d.line([(x-4+k*4,y0+6),(x-5+k*4+int(math.sin(f+k)*2),FY-12)],fill=(dk[0],dk[1],dk[2],200))
    L(d,[(x+6,y0+4),(x+10+int(reach*10),y0+8-int(reach*4))],c,2)
    for k in range(3):d.line([(x+10+int(reach*10),y0+8-int(reach*4)),(x+14+int(reach*12),y0+6-int(reach*4)+k*2)],fill=(220,210,210,255))
    E(d,(x-6,y0-12,x+6,y0+1),dk if p['head']!='faceless' else (210,204,196,255))
    if p['head']!='faceless':d.point((x-1,y0-6),fill=p['glow']);d.point((x+3,y0-6),fill=p['glow'])
def quad(d,f,atk,p):
    sw,bob,lean,reach=pose(f,atk);c,dk=p['c'],p['dk'];y0=50-int(bob*1.5);x=FX-2+int(lean*4);big=p.get('big',1)
    for k,(lx,ph) in enumerate(((x-10,0),(x-6,math.pi),(x+6,math.pi),(x+10,0))):
        s=math.sin(f/8*2*math.pi+ph) if atk is None else 0;L(d,[(lx,y0+4),(lx+s*3,y0+12),(lx+s*4,FY)],dk if k%2 else c,3)
    E(d,(x-14,y0-5,x+12,y0+8),c);d.line([(x-10,y0-3),(x+8,y0-3)],fill=shade(c,1.25))
    if p['metal']:R(d,(x-6,y0-4,x+4,y0+2),shade(p['metal'],1))
    if p['fire']:
        for k in range(4):fx_=x-10+k*6;fh=6+int(abs(math.sin(f+k))*4);P(d,[(fx_-2,y0-4),(fx_,y0-4-fh),(fx_+2,y0-4)],(230,120,40,230))
    L(d,[(x-14,y0-2),(x-20,y0-8+int(sw*2))],c,2)  # 꼬리
    hx=x+12+int(reach*4);hy=y0-8-int(lean*2);E(d,(hx-5,hy-5,hx+5,hy+5),c)
    jaw=2+int(max(0,reach)*4);P(d,[(hx+3,hy-2),(hx+12,hy),(hx+3,hy+1)],c);P(d,[(hx+3,hy+2),(hx+11,hy+2+jaw),(hx+3,hy+4)],dk)
    for k in range(3):d.point((hx+5+k*2,hy+1),fill=(235,230,220,255))
    P(d,[(hx-3,hy-4),(hx-1,hy-10),(hx+1,hy-4)],dk);d.point((hx+2,hy-1),fill=p['glow'])
def spider(d,f,atk,p):
    sw,bob,lean,reach=pose(f,atk);c,dk=p['c'],p['dk'];y0=56-int(bob);x=FX+int(lean*3)
    for s in (-1,1):
        for k in range(4):
            a=(k-1.5)*.45;ph=math.sin(f/8*2*math.pi+k*1.3+(s>0)*math.pi) if atk is None else 0
            kx=x+s*(10+k*2);ky=y0-10+int(ph*2);fx_=x+s*(18+k*3);L(d,[(x+s*3,y0-2+k),(kx,ky),(fx_,FY-k%2)],dk,2)
    E(d,(x-16,y0-14,x+2,y0+4),c);d.line([(x-12,y0-8),(x-4,y0-2)],fill=p['glow'])
    E(d,(x,y0-8,x+10,y0+2),dk)
    for k in range(4):d.point((x+5+k%2*3,y0-6+k//2*2),fill=p['glow'])
    L(d,[(x+9,y0),(x+12+int(reach*4),y0+3)],(230,220,210,255),1)
def slime(d,f,atk,p):
    sw,bob,lean,reach=pose(f,atk);c=p['c'];sq=math.sin(f/8*2*math.pi)*2 if atk is None else [0,-3,3,1][atk];x=FX+int(lean*3)
    w=14+sq;h=18-sq;E(d,(x-w,FY-h*2+4,x+w,FY+1),(c[0],c[1],c[2],220));E(d,(x-w+4,FY-h*2+7,x-w+9,FY-h*2+12),(255,255,255,120))
    E(d,(x-4,FY-h-4,x+4,FY-h+4),p['glow']);d.point((x+3,FY-h*2+12),fill=OL);d.point((x+7,FY-h*2+12),fill=OL)
    for k in range(3):d.point((x-8+k*7,FY-2-k%2),fill=shade(c,.6))
def mech(d,f,atk,p):
    sw,bob,lean,reach=pose(f,atk);m=p['metal'];c=p['c'];y0=36-int(bob);x=FX+int(lean*3)
    legs2(d,sw,FX,y0+20,shade(m,.8),shade(m,.55),ln=FY-(y0+20),gap=10,w=4)
    R(d,(x-10,y0,x+10,y0+20),shade(m,1));R(d,(x-7,y0+3,x+7,y0+12),c)
    for k in range(3):d.line([(x-6,y0+14+k*2),(x+6,y0+14+k*2)],fill=shade(m,.6))
    E(d,(x+1,y0+4,x+7,y0+10),(20,10,10,255));E(d,(x+3,y0+6,x+5,y0+8),p['glow'])
    L(d,[(x+10,y0+6),(x+16+int(reach*6),y0+10-int(reach*3))],shade(m,.9),3);R(d,(x+15+int(reach*6),y0+8-int(reach*3),x+19+int(reach*6),y0+12-int(reach*3)),c)
    L(d,[(x,y0),(x+2,y0-6)],shade(m,.7),1);d.point((x+2,y0-7),fill=p['glow'])
def drone(d,f,atk,p):
    sw,bob,lean,reach=pose(f,atk);m=p['metal'];y0=34+int(math.sin(f/8*2*math.pi)*2);x=FX+int(lean*4)
    d.ellipse((x-12,FY-4,x+12,FY+1),fill=(0,0,0,90))
    R(d,(x-9,y0,x+9,y0+10),shade(m,1));E(d,(x+2,y0+2,x+8,y0+8),(20,10,10,255));E(d,(x+4,y0+4,x+6,y0+6),p['glow'])
    for s in (-1,1):
        L(d,[(x+s*9,y0+2),(x+s*16,y0-2)],shade(m,.7),1);rw=6 if (f%2==0) else 3;d.line([(x+s*16-rw,y0-3),(x+s*16+rw,y0-3)],fill=(200,200,210,200),width=1)
    L(d,[(x,y0+10),(x+4+int(reach*6),y0+16)],shade(m,.7),1)
def crystal(d,f,atk,p):
    sw,bob,lean,reach=pose(f,atk);c=p['c'];y0=30+int(math.sin(f/8*2*math.pi)*2);x=FX+int(lean*3)
    d.ellipse((x-12,FY-4,x+12,FY+1),fill=(0,0,0,90))
    for k,(dx,h,w) in enumerate(((0,26,7),(-9,16,5),(9,18,5),(-4,12,4),(5,10,4))):
        a=f*.3+k;bx=x+dx;by=y0+18+int(math.sin(a)*2)
        P(d,[(bx-w,by),(bx,by-h),(bx+w,by),(bx,by+6)],shade(c,1.1-k*.08))
        d.line([(bx,by-h+2),(bx,by+4)],fill=shade(c,1.5))
    E(d,(x-3,y0+12,x+3,y0+18),p['glow'])
def puppet(d,f,atk,p):
    sw,bob,lean,reach=pose(f,atk);c,dk=p['c'],p['dk'];y0=38-int(bob*1.5);x=FX+int(lean*3)
    for k in (-6,0,6):d.line([(x+k,0),(x+k+int(sw),y0-12+abs(k))],fill=(220,220,220,110))
    for dx,s in ((-3,sw),(3,-sw)):L(d,[(x+dx,y0+16),(x+dx+s*3,y0+26),(x+dx+s*5,FY)],shade(c,.8),2);E(d,(x+dx+s*3-1,y0+25,x+dx+s*3+1,y0+27),dk)
    R(d,(x-6,y0,x+6,y0+16),c);d.line([(x-6,y0+8),(x+6,y0+8)],fill=dk)
    for k in range(3):d.point((x-3+k*3,y0+4),fill=dk)
    L(d,[(x+6,y0+2),(x+10+int(reach*6),y0+10-int(reach*6))],shade(c,.9),2);L(d,[(x-6,y0+2),(x-9,y0+11)],shade(c,.9),2)
    big=p['head']=='pale'
    E(d,(x-6-big*2,y0-13-big*3,x+6+big*2,y0+1),p['skin'] if p['head']!='faceless' else (226,218,206,255))
    if p['head']!='faceless':d.point((x-2,y0-7),fill=OL);d.point((x+3,y0-7),fill=OL)
    d.line([(x-5,y0-3),(x+5,y0-3)],fill=(150,40,40,255))  # 꿰맨 입
def plant(d,f,atk,p):
    sw,bob,lean,reach=pose(f,atk);c=(70,52,40);dk=(40,30,24,255);y0=26;x=FX+int(lean*3)
    for k in range(4):s=math.sin(f/8*2*math.pi+k);L(d,[(x-3+k*2,FY-14),(x-10+k*6+int(s*2),FY)],dk,2)
    P(d,[(x-7,FY-14),(x-5,y0+6),(x+5,y0+6),(x+7,FY-14)],c+(255,))
    for k in range(4):d.line([(x-4+k*3,y0+8),(x-4+k*3+1,FY-16)],fill=dk)
    L(d,[(x+4,y0+10),(x+12+int(reach*8),y0+4-int(reach*4)),(x+18+int(reach*8),y0+2)],c+(255,),2);L(d,[(x-4,y0+10),(x-12,y0+2),(x-16,y0-2)],c+(255,),2)
    for k in range(5):E(d,(x-10+k*5,y0-4+(k%2)*3,x-4+k*5,y0+2+(k%2)*3),p['leaf'])
    E(d,(x-4,y0+10,x-1,y0+13),p['glow']);E(d,(x+2,y0+10,x+5,y0+13),p['glow'])
def winged(d,f,atk,p):
    sw,bob,lean,reach=pose(f,atk);c,dk=p['c'],p['dk'];flap=math.sin(f/8*2*math.pi*2) if atk is None else [.8,-1,-.6,0][atk];y0=32+int(flap*2);x=FX+int(lean*4)
    d.ellipse((x-14,FY-4,x+14,FY+1),fill=(0,0,0,90))
    for s in (-1,1):P(d,[(x,y0),(x+s*26,y0-10-int(flap*10)),(x+s*22,y0+4),(x+s*12,y0+8)],p['wingc'])
    E(d,(x-6,y0-4,x+6,y0+14),c);E(d,(x+2,y0-12,x+12,y0-2),c);d.point((x+9,y0-8),fill=p['glow'])
    if p['fire'] and atk in (1,2):P(d,[(x+12,y0-8),(x+30,y0-14),(x+30,y0),(x+12,y0-5)],(230,120,40,220))
    L(d,[(x,y0+14),(x-4,y0+24)],dk,2)
def serpent(d,f,atk,p):
    sw,bob,lean,reach=pose(f,atk);c=p['c'];x=FX+int(lean*5)
    pts=[(x-20+k*4,FY-4-int(math.sin(f/8*2*math.pi+k*.8)*3)-max(0,k-7)*4) for k in range(11)]
    for k in range(1,len(pts)):L(d,[pts[k-1],pts[k]],c,5-k//4)
    hx,hy=pts[-1];hx+=int(reach*4);E(d,(hx-4,hy-4,hx+5,hy+3),c);d.point((hx+2,hy-1),fill=p['glow'])
    if reach>.5:d.line([(hx+5,hy),(hx+9,hy-1)],fill=(200,30,40,255))
def golem(d,f,atk,p):
    sw,bob,lean,reach=pose(f,atk);c,dk=p['c'],p['dk'];y0=30-int(bob);x=FX+int(lean*3)
    legs2(d,sw,FX,y0+30,dk,shade(c,.5),ln=FY-(y0+30),gap=12,w=5)
    E(d,(x-16,y0,x+16,y0+34),c)
    rnd=random.Random(p['seed'])
    for k in range(7):px,py=x-12+rnd.randint(0,22),y0+4+rnd.randint(0,24);R(d,(px,py,px+4,py+3),shade(c,.7+rnd.random()*.6))
    for k in range(5):d.line([(x-10+k*5,y0+6),(x-9+k*5,y0+10)],fill=(30,20,20,255))
    L(d,[(x+14,y0+12),(x+20+int(reach*6),y0+22-int(reach*8))],c,5);L(d,[(x-14,y0+12),(x-18,y0+24)],c,5)
    d.point((x+4,y0+10),fill=p['glow']);d.point((x+9,y0+10),fill=p['glow'])
def fog(d,f,atk,p):
    sw,bob,lean,reach=pose(f,atk);c=p['c'];x=FX+int(lean*4)
    for k in range(7):a=f/8*2*math.pi+k;r=7+(k%3)*2;cx=x-10+k*3+int(math.cos(a)*2);cy=46-k%3*6+int(math.sin(a)*2);d.ellipse((cx-r,cy-r,cx+r,cy+r),fill=(c[0],c[1],c[2],120+k*10))
    E(d,(x-1,38,x+3,42),p['glow']);E(d,(x+6,38,x+10,42),p['glow'])
    if reach>.5:d.ellipse((x+12,36,x+24+int(reach*4),48),fill=(c[0],c[1],c[2],150))
def obj(kind):
    def draw(d,f,atk,p):
        sw,bob,lean,reach=pose(f,atk);c=p['c'];y0=40+int(math.sin(f/8*2*math.pi)*3);x=FX+int(lean*6+reach*3);sp=f/8*2*math.pi
        d.ellipse((x-10,FY-3,x+10,FY+1),fill=(0,0,0,90))
        if kind=='blade':
            a=-.6+math.sin(sp)*.2+(reach*1.2 if atk is not None else 0);L(d,[(x-math.cos(a)*14,y0-math.sin(a)*14),(x+math.cos(a)*14,y0+math.sin(a)*14)],(214,214,222,255),3);d.line([(x-math.cos(a)*12,y0-math.sin(a)*12),(x+math.cos(a)*12,y0+math.sin(a)*12)],fill=(255,255,255,255))
            E(d,(x-math.cos(a)*14-2,y0-math.sin(a)*14-2,x-math.cos(a)*14+2,y0-math.sin(a)*14+2),c)
        elif kind=='coin':w=max(1,int(abs(math.cos(sp*2))*10));E(d,(x-w,y0-10,x+w,y0+10),(200,170,80,255));d.line([(x,y0-6),(x,y0+6)],fill=(120,90,30,255))
        elif kind=='mask':E(d,(x-9,y0-12,x+9,y0+10),(234,230,222,255));d.line([(x-5,y0-3),(x-2,y0-2)],fill=OL,width=2);d.line([(x+2,y0-2),(x+5,y0-3)],fill=OL,width=2);d.arc((x-4,y0+2,x+4,y0+7),200,340,fill=(150,30,30,255))
        elif kind=='paper':
            for k in range(3):a=math.sin(sp+k)*.3;bx=x-8+k*6;by=y0-6+k*3+int(math.sin(sp+k)*2);P(d,[(bx-5,by-7),(bx+5,by-7+a*4),(bx+5,by+7),(bx-5,by+7-a*4)],(222,214,190,255));d.line([(bx-3,by-3),(bx+3,by-3)],fill=(60,40,40,255));d.line([(bx-3,by),(bx+2,by)],fill=(60,40,40,255))
        elif kind=='heel':P(d,[(x-10,y0+6),(x+6,y0+6),(x+10,y0-4),(x+4,y0-6),(x-2,y0+2),(x-10,y0+2)],(150,20,30,255));L(d,[(x-9,y0+6),(x-9,y0+14)],(150,20,30,255),2);L(d,[(x+8,y0-4),(x+16+int(reach*6),y0-8)],(214,214,222,255),1)
        elif kind=='lipstick':R(d,(x-4,y0-2,x+4,y0+12),(200,170,80,255));P(d,[(x-3,y0-2),(x-3,y0-10),(x+3,y0-13),(x+3,y0-2)],(190,20,40,255))
        elif kind=='candy':
            E(d,(x-8,y0-8,x+8,y0+8),(170,90,120,255))
            for k in range(10):a=k/10*2*math.pi+sp*.3;L(d,[(x+math.cos(a)*7,y0+math.sin(a)*7),(x+math.cos(a)*13,y0+math.sin(a)*13)],(220,200,200,255),1)
        elif kind=='cross':L(d,[(x,y0-16),(x,y0+16)],(60,30,30,255),3);L(d,[(x-6,y0+8),(x+6,y0+8)],(60,30,30,255),3);d.point((x,y0+16),fill=(255,80,80,255))
        elif kind=='bottle':R(d,(x-6,y0-4,x+6,y0+12),(120,160,150,200));R(d,(x-2,y0-10,x+2,y0-4),(160,180,170,255));R(d,(x-5,y0+3,x+5,y0+11),p['glow'])
        d.point((x+2,y0-1),fill=p['glow'])
    return draw
DRAW={'human':human,'wraith':wraith,'quad':quad,'spider':spider,'slime':slime,'mech':mech,'drone':drone,'crystal':crystal,'puppet':puppet,'plant':plant,'winged':winged,'serpent':serpent,'golem':golem,'fog':fog,
 **{k:obj(k) for k in ('blade','coin','mask','paper','heel','lipstick','candy','cross','bottle')}}
# ---- 시트 --------------------------------------------------------------------------------------
def soften(im):
    a=im.getchannel('A').filter(ImageFilter.GaussianBlur(.7));rgb=ImageEnhance.Color(im.convert('RGB')).enhance(.86);out=rgb.convert('RGBA');out.putalpha(a);return out
def params(name,key=None):
    seed=int(hashlib.sha256((key or name).encode()).hexdigest()[:8],16);rnd=random.Random(seed);c=base_col(name,rnd)
    j=lambda v:max(0,min(255,v+rnd.randint(-14,14)));c=(j(c[0]),j(c[1]),j(c[2]))
    glow={'red':(255,70,60,255),'blue':(120,200,255,255),'gold':(255,210,110,255),'green':(140,255,140,255),'violet':(210,120,255,255)}
    g='red' if re.search(r'피|붉|화염|불|악마|지옥',name) else 'blue' if re.search(r'청람|푸른|설원|공명|신호|기계',name) else 'gold' if re.search(r'금|천사|성',name) else 'violet' if re.search(r'보라|공허|흑마술|잔향',name) else ['red','blue','violet','green'][seed%4]
    metal=(118,122,130) if not re.search(r'금|황금',name) else (170,140,70)
    return {'c':c+(255,),'dk':shade(c,.55),'lt':shade(c,1.3),'skin':(196,170,150,255) if not re.search(r'좀비|망자|감염',name) else (130,150,110,255),'glow':glow[g],'metal':metal,
     'head':head_of(name),'weapon':weapon_of(name),'wings':bool(re.search(r'천사|날개',name)),'wingc':(40,34,40,255) if re.search(r'타락|검은|악마',name) else (210,200,180,255),
     'horns':bool(re.search(r'악마|염소',name)),'halo':bool(re.search(r'천사',name)) and not re.search(r'타락',name),'fire':bool(re.search(r'불길|화염|용$',name)),
     'leaf':(60,90,50,255) if not re.search(r'악마화|흑|검은',name) else (60,30,50,255),'seed':seed}
def sheet(name,key=None):
    kind=kind_of(name);p=params(name,key);p['metal']=p['metal'] if kind in ('mech','drone') or re.search(r'사이보그|강철|기계|전극',name) else (None if kind=='quad' else p['metal'])
    if kind=='quad':p['metal']=(110,116,124) if re.search(r'사이보그|강철',name) else None
    draw=DRAW[kind];im=Image.new('RGBA',(W*S*4,H*S*3),(0,0,0,0))
    for i in range(12):
        c=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(c)
        draw(d,i if i<8 else 0,None if i<8 else i-8,p)
        c=soften(c.resize((W*S,H*S),Image.NEAREST));im.alpha_composite(c,((i%4)*W*S,(i//4)*H*S))
    # 걷기 칸들의 보이는 높이(알파>40 합집합) — 게임에서 몹 키에 맞춰 늘리는 기준
    top,bot=10**9,-1
    for i in range(8):
        a=im.crop(((i%4)*W*S,(i//4)*H*S,(i%4+1)*W*S,(i//4+1)*H*S)).getchannel('A').point(lambda v:255 if v>40 else 0);bb=a.getbbox()
        if bb:top=min(top,bb[1]);bot=max(bot,bb[3])
    p['body']=max(40,bot-top) if bot>0 else 300;p['top']=top
    return im,kind,p
rows=json.load(open(SRC,encoding='utf8'));index={'generator':'scripts/r248-mob-pixel-art.py','license':'CC0 equivalent (drawn by our own code)','temporary':True,'cell':[W*S,H*S],'cols':4,'walk':[0,8],'attack':[8,4],'pivot':[FX*S,FY*S],'mobs':{}}
for r in rows:
    im,kind,p=sheet(r['name'],r.get('key'));fn=r['id']+'.webp';path=os.path.join(OUT,fn);im.save(path,lossless=False,quality=88,method=6)
    index['mobs'][r['id']]={'name':r['name'],'key':r.get('key',r['name']),'layer':r.get('layer'),'kind':kind,'head':p['head'],'weapon':p['weapon'],'body':p['body'],'file':fn,'sha256':hashlib.sha256(open(path,'rb').read()).hexdigest(),'bytes':os.path.getsize(path)}
json.dump(index,open(os.path.join(OUT,'index.json'),'w',encoding='utf8'),ensure_ascii=False,indent=1)
print(len(rows),'sheets',sum(v['bytes'] for v in index['mobs'].values()),'bytes')
