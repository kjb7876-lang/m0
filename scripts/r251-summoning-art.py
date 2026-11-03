"""R251 발록 소환진(파괴 가능한 원거리 탑) + 기괴한 빨간 손 이펙트 — 우리 코드로 직접 그린 임시 픽셀 자산(CC0 상당, Aseprite 방식: 저해상도 칸 → 정수배 확대 → R166 결 다듬기).
좋은 자산이 오면 r96/client-source/summoning-r251.js 의 ART 표만 바꾼다.
사용: python3 -I scripts/r251-summoning-art.py r96/runtime-text/assets/r251
 circle.webp : 소환진 4프레임(가로 4칸) 칸 96x64 ×4 = 384x256 — 바닥 핏빛 육망성 + 검은 돌기둥 셋 + 가운데 검은 불꽃 핵
 hands.webp  : 빨간 손 8프레임(4x2) 칸 64x80 ×4 = 256x320 — 바닥에서 손 여러 개가 솟아 움켜쥐고 가라앉는다"""
import sys, os, math, json, hashlib, random
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
OUT=sys.argv[1];os.makedirs(OUT,exist_ok=True)
S=4;OL=(14,6,8,255)
def soften(im):
    # R166 결: 가장자리 0.8px 흐림(알파만), 채도 0.85
    a=im.getchannel('A').filter(ImageFilter.GaussianBlur(.8));rgb=ImageEnhance.Color(im.convert('RGB')).enhance(.85);out=rgb.convert('RGBA');out.putalpha(a);return out
def up(c,w,h):return soften(c.resize((w*S,h*S),Image.NEAREST))
# ---- 소환진 -------------------------------------------------------------------------------------
CW,CH=96,64
def circle_frame(f):
    c=Image.new('RGBA',(CW,CH),(0,0,0,0));d=ImageDraw.Draw(c);cx,cy=48,44;pulse=.5+.5*math.sin(f/4*2*math.pi)
    # 바닥 그을음
    d.ellipse((cx-44,cy-17,cx+44,cy+17),fill=(26,8,10,200))
    d.ellipse((cx-40,cy-15,cx+40,cy+15),outline=(110+int(60*pulse),10,20,255),width=2)
    d.ellipse((cx-35,cy-13,cx+35,cy+13),outline=(80,6,14,255),width=1)
    # 육망성(납작한 원근)
    rot=f/4*math.pi/3*.25
    for k in range(2):
        pts=[(cx+math.cos(rot+k*math.pi/3+i*2*math.pi/3)*34,cy+math.sin(rot+k*math.pi/3+i*2*math.pi/3)*12.5) for i in range(3)]
        d.polygon(pts,outline=(170+int(70*pulse),20,30,255))
    # 룬 점
    for i in range(12):
        a=i/12*2*math.pi+rot*2;x=cx+math.cos(a)*38;y=cy+math.sin(a)*14
        d.rectangle((x-.5,y-.5,x+.5,y+.5),fill=(230,80,70,255) if (i+f)%3==0 else (120,20,26,255))
    # 검은 돌기둥 셋(뒤 둘, 앞 하나)
    for px,py,hgt in ((cx-28,cy-5,26),(cx+28,cy-5,26),(cx-8,cy+11,18)):
        d.polygon([(px-4,py),(px-3,py-hgt),(px,py-hgt-4),(px+3,py-hgt),(px+4,py)],fill=(22,18,22,255),outline=OL)
        d.line([(px-1,py-2),(px-1,py-hgt+2)],fill=(48,40,46,255))
        for k in range(3):
            y=py-6-k*7;d.point((px+1,y),fill=(200+int(50*pulse),40,40,255))
    # 가운데 검은 불꽃 핵
    for k in range(6):
        h=10+k*2+int(4*math.sin(f*1.7+k));w=9-k
        col=(20+k*22,2+k*3,6+k*2,235) if k<5 else (210,40,40,255)
        d.ellipse((cx-w/2,cy-4-h,cx+w/2,cy-4),fill=col)
    return c
sheet=Image.new('RGBA',(CW*S*4,CH*S),(0,0,0,0))
for f in range(4):sheet.alpha_composite(up(circle_frame(f),CW,CH),(f*CW*S,0))
sheet.save(os.path.join(OUT,'circle.webp'),lossless=True)
# ---- 기괴한 빨간 손 ------------------------------------------------------------------------------
HW,HH=64,80
def hand(d,x,y,h,open_,lean,skin,dark):
    # 팔뚝(바닥에서 솟음) + 손바닥 + 마디 긴 손가락 다섯(벌림↔움켜쥠)
    tx=x+lean*h*.25;ty=y-h
    d.line([(x,y),(x+lean*h*.12,y-h*.5),(tx,ty)],fill=OL,width=7);d.line([(x,y),(x+lean*h*.12,y-h*.5),(tx,ty)],fill=skin,width=5)
    for k in range(1,4):bx=x+(tx-x)*k/4;by=y+(ty-y)*k/4;d.ellipse((bx-2,by-1,bx+2,by+1),fill=dark)  # 마디·핏줄
    d.line([(x+1,y-2),(tx+1,ty+3)],fill=dark,width=1)
    d.ellipse((tx-4,ty-5,tx+4,ty+2),fill=skin,outline=OL)
    for i in range(5):
        a=-math.pi/2+(i-2)*(.38*open_+.12)+lean*.3;ln=7+((i*7)%3)-(2 if i in (0,4) else 0)
        mx=tx+math.cos(a)*ln*.55;my=ty-2+math.sin(a)*ln*.55
        ca=a+(1-open_)*(.9 if i<2 else -.9 if i>2 else 0)*.8
        ex=mx+math.cos(ca)*ln*.6;ey=my+math.sin(ca)*ln*.6+(1-open_)*3
        d.line([(tx,ty-2),(mx,my),(ex,ey)],fill=OL,width=4);d.line([(tx,ty-2),(mx,my),(ex,ey)],fill=skin,width=2)
        d.point((ex,ey),fill=(240,210,200,255))  # 손톱
def hands_frame(f):
    c=Image.new('RGBA',(HW,HH),(0,0,0,0));d=ImageDraw.Draw(c);rnd=random.Random(7)
    # 0-2 솟음, 3-4 벌림, 5 움켜쥠, 6-7 가라앉음
    rise=[.25,.6,.95,1,1,1,.6,.2][f];open_=[.9,1,1,1,.8,.05,.1,.2][f]
    d.ellipse((6,66,58,78),fill=(40,4,8,170));d.ellipse((12,68,52,76),fill=(90,8,14,200))
    for k,(x,h0,lean) in enumerate(((32,46,0),(18,34,-.6),(46,36,.6),(25,24,-.25),(40,26,.3))):
        skin=(150+rnd.randint(0,40),18+rnd.randint(0,14),26,255);dark=(70,6,12,255)
        hand(d,x,72,h0*rise*(1 if k<3 else .9),open_,lean+math.sin(f*.9+k)*.08,skin,dark)
    # 피 방울
    if f in (5,6):
        for i in range(6):x=20+i*5+rnd.randint(-2,2);y=40+rnd.randint(0,20);d.point((x,y),fill=(200,20,30,255))
    return c
sheet=Image.new('RGBA',(HW*S*4,HH*S*2),(0,0,0,0))
for f in range(8):sheet.alpha_composite(up(hands_frame(f),HW,HH),((f%4)*HW*S,(f//4)*HH*S))
sheet.save(os.path.join(OUT,'hands.webp'),lossless=True)
idx={'generator':'scripts/r251-summoning-art.py','license':'CC0 equivalent (drawn by our own code)','temporary':True,
 'files':{n:{'sha256':hashlib.sha256(open(os.path.join(OUT,n),'rb').read()).hexdigest(),'bytes':os.path.getsize(os.path.join(OUT,n))} for n in ('circle.webp','hands.webp')},
 'circle':{'cell':[CW*S,CH*S],'frames':4,'cols':4,'pivot':[48*S,44*S]},'hands':{'cell':[HW*S,HH*S],'frames':8,'cols':4,'pivot':[32*S,72*S]}}
json.dump(idx,open(os.path.join(OUT,'index.json'),'w'),ensure_ascii=False,indent=1)
print(json.dumps(idx['files']))
