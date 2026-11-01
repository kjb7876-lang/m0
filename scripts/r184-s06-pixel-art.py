"""R184 사몽 S-06 디스토피아 생물 픽셀 시트(Aseprite 방식: 제한 팔레트·저해상도 칸을 정수배 확대). 우리 코드로 직접 그린 임시 자산(CC0 상당).
칸 64x80 → ×4 = 256x320, 4열×2행 걷기 8프레임(오른쪽 보기), R161 꼭두각시 시트와 같은 발 기준(101.8,299.5 / 4 = 25.45, 74.9).
사용: python3 -I scripts/r184-s06-pixel-art.py r96/runtime-text/assets/r184/s06"""
import sys, math, os, hashlib, json
from PIL import Image, ImageDraw
OUT=sys.argv[1];os.makedirs(OUT,exist_ok=True)
W,H,S=64,80,4;FX,FY=25,75
def sheet(draw_frame):
    im=Image.new('RGBA',(W*4*S,H*2*S),(0,0,0,0))
    for f in range(8):
        c=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(c);draw_frame(d,f,c)
        c=c.resize((W*S,H*S),Image.NEAREST);im.alpha_composite(c,((f%4)*W*S,(f//4)*H*S))
    return im
def ol(d,xy,fill,out=(14,10,12,255),w=1,kind='rect'):
    if kind=='rect':d.rectangle(xy,fill=fill,outline=out,width=w)
    else:d.ellipse(xy,fill=fill,outline=out,width=w)
def legs(d,f,x,y,col,dark,len_=14,gap=4):
    ph=f/8*2*math.pi;a=math.sin(ph)*4;b=-a
    for dx,sw,cl in ((-gap//2,a,dark),(gap//2,b,col)):
        hx=x+dx;kx=hx+sw*.5;fx=hx+sw
        d.line([(hx,y),(kx,y+len_*.5),(fx,y+len_)],fill=(14,10,12,255),width=5);d.line([(hx,y),(kx,y+len_*.5),(fx,y+len_)],fill=cl,width=3)
    return math.cos(ph)
# 팔레트(게임 화풍: 낮은 채도·피·녹)
TI=(118,122,128,255);TI2=(78,82,90,255);MU=(122,28,36,255);MU2=(70,14,22,255);GL=(150,200,170,140);GF=(70,130,90,200);NV=(230,230,220,230);RC=(220,40,40,255)
def invader(d,f,c):  # 외계 침공군
    bob=legs(d,f,FX,52,TI,TI2,len_=22,gap=6)
    y0=30+int(abs(bob));ol(d,(FX-8,y0,FX+8,y0+22),TI2)  # 몸통 외골격
    d.rectangle((FX-6,y0+3,FX+6,y0+19),fill=MU)          # 드러난 근육
    for k in range(3):d.line([(FX-6,y0+5+k*5),(FX+6,y0+7+k*5)],fill=MU2,width=1)
    for sx in (-1,1):  # 팔: 관절마다 촉수 근육 다발
        ax=FX+sx*9;d.line([(ax,y0+3),(ax+sx*3,y0+13),(ax+sx*2+math.sin(f)*1.5,y0+22)],fill=(14,10,12,255),width=5);d.line([(ax,y0+3),(ax+sx*3,y0+13),(ax+sx*2,y0+22)],fill=TI,width=3)
        d.ellipse((ax+sx*3-2,y0+11,ax+sx*3+2,y0+15),fill=MU)
    d.rectangle((FX+9,y0+16,FX+20,y0+19),fill=TI2,outline=(14,10,12,255))  # 팔에 붙은 총열
    hy=y0-15;ol(d,(FX-6,hy,FX+6,hy+15),GF)  # 유리관 머리 + 녹색 배양액
    d.rectangle((FX-5,hy+1,FX-3,hy+14),fill=GL)
    for k in range(4):x=FX-3+k*2;d.line([(x,hy+3),(x+math.sin(f*.8+k)*1.5,hy+12)],fill=NV,width=1)  # 해파리 신경
    d.rectangle((FX-7,hy+14,FX+7,hy+16),fill=TI2,outline=(14,10,12,255))
def rival(d,f,c):  # 상대 초인
    for k in range(6):  # 등 뒤 부유 포구(16개 중 화면에 보이는 6)
        a=k/6*math.pi+f*.12;x=FX+math.cos(a)*20;y=24+math.sin(a)*8-6;d.ellipse((x-2,y-2,x+2,y+2),fill=(60,60,70,255),outline=(14,10,12,255));d.point((x,y),fill=RC)
    bob=legs(d,f,FX,50,(30,30,36,255),(18,18,22,255),len_=24,gap=6)
    y0=28+int(abs(bob));ol(d,(FX-8,y0,FX+8,y0+22),(26,24,30,255))
    d.rectangle((FX-7,y0+2,FX+7,y0+20),outline=(140,146,156,255))  # 합금 골격선
    d.line([(FX,y0+2),(FX,y0+20)],fill=(140,146,156,255))
    for sx in (-1,1):ax=FX+sx*9;d.line([(ax,y0+3),(ax+sx*2,y0+13),(ax+sx*1,y0+22)],fill=(14,10,12,255),width=5);d.line([(ax,y0+3),(ax+sx*2,y0+13),(ax+sx,y0+22)],fill=(40,40,46,255),width=3)
    d.line([(FX+10,y0+20),(FX+22,y0+14)],fill=(200,220,240,255),width=2)  # 고주파 진동 블레이드
    hy=y0-14;ol(d,(FX-6,hy,FX+6,hy+14),(60,70,80,200));r=2+abs(math.sin(f*.9))*1.5;d.ellipse((FX-r,hy+7-r,FX+r,hy+7+r),fill=RC)  # 붉은 코어
def commander(d,f,c):  # 적 지휘 개체(대왕문어 형태 + 복합 중장갑)
    for k in range(6):  # 촉수 다리
        x0=FX-12+k*5;ph=f/8*2*math.pi+k;pts=[(x0,52)]
        for j in range(1,5):pts.append((x0+math.sin(ph+j)*3+(k-2.5)*j*.8,52+j*6))
        d.line(pts,fill=(14,10,12,255),width=5);d.line(pts,fill=MU,width=3)
    ol(d,(FX-16,26,FX+16,56),MU2,kind='ellipse')                 # 비대한 몸통
    for k in range(4):d.rectangle((FX-14+k*7,30,FX-9+k*7,52),fill=(84,88,94,255),outline=(14,10,12,255))  # 겹겹 장갑판
    d.ellipse((FX-5,38,FX+5,48),fill=(30,24,26,255),outline=(160,60,50,255))  # 흉부 음파 증폭기
    hy=8;ol(d,(FX-9,hy,FX+9,hy+20),GF);d.rectangle((FX-8,hy+1,FX-5,hy+19),fill=GL)
    for k in range(5):x=FX-4+k*2;d.line([(x,hy+3),(x+math.sin(f*.7+k)*2,hy+16)],fill=NV,width=1)
    d.point((FX+3,hy+8),fill=RC);d.point((FX+4,hy+8),fill=RC)
rows=[]
for name,fn,use in (('invader',invader,'외계 침공군(DYS-01 원문 외형)'),('rival',rival,'상대 초인(DYS-03)'),('commander',commander,'적 지휘 개체·적 지휘 기체(DYS-02·DYS-10)')):
    im=sheet(fn);p=os.path.join(OUT,f's06-{name}-walk-right-8.webp');im.save(p,'WEBP',lossless=True,method=6);b=open(p,'rb').read()
    rows.append({'file':os.path.basename(p),'use':use,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'cell':[W*S,H*S],'frames':8,'grid':[4,2],'foot':[FX*S+1.8,FY*S-.5],'source':'R184 scripts/r184-s06-pixel-art.py (자체 생성, CC0 상당) — Aseprite 방식 임시 픽셀 자산, 더 좋은 자산이 오면 교체'})
json.dump({'revision':'R184','temporary':True,'sheets':rows},open(os.path.join(OUT,'index.json'),'w',encoding='utf8'),ensure_ascii=False,indent=1)
print(json.dumps(rows,ensure_ascii=False)[:400])
