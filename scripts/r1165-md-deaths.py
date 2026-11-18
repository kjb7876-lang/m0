#!/usr/bin/env python3
"""R1165: Dots CX-0115MD r1 ROUGH 사망 6칸 3벌(MD-15 붉은 커튼 마네킹 · MD-17 붉은 날개 인물(M027 둘째 칸) · MD-25 태엽 수집자) → R1065 사망 표용 webp.
 · 칸 크기는 Dots 그대로(살아 있는 칸과 같은 크기)이되, 발 아래 여백이 모자란 MD-15·MD-17 은 칸 아래에 투명 8px 를 덧댐(R1065 '발 아래 자리' 규칙). 알파 16 이하 0. MD-25 는 Dots 권고대로 마지막 칸 알파를 0.5 배(잔해가 끝까지 남지 않게).
 · anchor = 첫 칸 발 줄·몸 가운데에 살아 있을 때 피벗의 몸 기준 차이를 더한 자리. bodyH = 살아 있을 때 키 × (첫 칸 몸 높이 / 살아 있는 칸 몸 높이).
 · 원본은 지우거나 덮어쓰지 않는다. 출력: r96/runtime-text/assets/r1165/mobs, 기록 r96/r1165-md-deaths.json, SHEETS 줄(표준 출력).
usage: python3 scripts/r1165-md-deaths.py <Dots raw 폴더(MD-15.png…)> <site 폴더>"""
import sys,json,hashlib
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'r96/runtime-text/assets/r1165/mobs'
# id, 파일 이름, 살아 있는 그림(site), 살아 있는 칸, 살아 있을 때 피벗 x(칸 안), 살아 있을 때 키, R1065 bases 키
ROWS=[('MD-15','md-15-curtain-mannequin-death','r275/mobs/curtain-mannequin.webp',(87,0,87,158),37.99,150),
 ('MD-17','md-17-red-wing-figure-death','r92/mobs/M027-move.png',(186,0,186,158),92.5,151),
 ('MD-25','md-25-clockwork-collector-death','r410/mobs/m033.webp',(0,0,256,320),133.0,217)]
def bb(im):return im.getchannel('A').point(lambda v:255 if v>16 else 0).getbbox()
def red(im):px=[p for p in im.getdata() if p[3]>64];return sum(1 for r,g,b,_ in px if r>150 and r>g+80 and r>b+80)/max(1,len(px))
def main(raw,site):
  raw=Path(raw);site=Path(site);OUT.mkdir(parents=True,exist_ok=True);rec=[];sheets={}
  for k,name,live,(x,y,W,H),pvx,vh in ROWS:
    f=raw/f'{k}.png';im=Image.open(f).convert('RGBA');assert im.size==(W*6,H),(k,im.size)
    pad=8 if k in ('MD-15','MD-17') else 0
    if pad:
      big=Image.new('RGBA',(W*6,H+pad),(0,0,0,0));big.paste(im,(0,0));im=big
    a=im.getchannel('A').point(lambda v:0 if v<=16 else v)
    if k=='MD-25':
      last=a.crop((5*W,0,6*W,H)).point(lambda v:0 if v*.5<=16 else int(v*.5));a.paste(last,(5*W,0))
    im.putalpha(a);p=OUT/f'{name}.webp';im.save(p,quality=92,method=6,alpha_quality=100,lossless=False)
    chk=Image.open(p).convert('RGBA');a2=chk.getchannel('A').point(lambda v:0 if v<=16 else v);chk.putalpha(a2);chk.save(p,lossless=True,method=6)
    s=Image.open(site/'assets'/live).convert('RGBA').crop((x,y,x+W,y+H));sb=bb(s);f0=Image.open(p).convert('RGBA').crop((0,0,W,H+pad));db=bb(f0)
    sh,dh=sb[3]-sb[1],db[3]-db[1];r=dh/sh;ax=round((db[0]+db[2])/2+(pvx-(sb[0]+sb[2])/2)*r,1);ay=db[3];bodyH=round(vh*dh/sh)
    by=p.read_bytes();rel='assets/r1165/mobs/'+p.name;CH=H+pad
    sheets[k]={'path':rel,'cell':[W,CH],'cells':6,'anchor':[ax,ay],'bodyH':bodyH,'kind':'death','liveH':sh,'liveRed':round(red(s),4),'bases':{live:{'bodyH':vh,'bottom':sb[3],'footX':pvx}}}
    rec.append({'id':k,'source':'Dots CX-0115MD_'+k+'_death6_r1_ROUGH.png','sourceSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'liveArt':'assets/'+live,'path':rel,'bytes':len(by),'sha256':hashlib.sha256(by).hexdigest(),
      'use':'몹 사망 6칸(R1065 사망 표)','fix':'알파 16 이하 0'+(', 마지막 칸 알파 0.5배' if k=='MD-25' else ''),'applied':True,'finalArt':False})
    print(k,'anchor',[ax,ay],'bodyH',bodyH,'live h',sh,'dots h',dh,len(by))
  (ROOT/'r96/r1165-md-deaths.json').write_text(json.dumps({'round':'R1165','request':'CX-0115MD r1 ROUGH','files':rec},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  print('SHEETS',json.dumps(sheets,ensure_ascii=False,separators=(',',':')))
if __name__=='__main__':main(sys.argv[1],sys.argv[2])
