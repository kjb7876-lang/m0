#!/usr/bin/env python3
"""R1166: Dots CX-0115MD r1 ROUGH 사망 6칸 2벌(MD-01 병원 원거리 아틀라스 R52 셋째 줄 유령 환자 · MD-03 병원 잡역부 아틀라스 R51 앞모습 줄) → R1065 사망 표용 webp.
 · 아틀라스 한 장에 여러 줄(다른 인물·뒷모습)이 있어 bases 에 rows(살아 있는 칸 sourceRect y)를 달아 그 줄일 때만 고른다.
 · 칸 크기는 Dots 그대로. 5칸째(흩어짐) 옅은 안개는 Dots 권고대로 알파 48 미만을 0 으로 지운다. 알파 16 이하 0.
 · anchor = 첫 칸 발 줄·몸 가운데에 살아 있을 때 피벗의 몸 기준 차이를 더한 자리. bodyH = 살아 있을 때 키 × (첫 칸 몸 높이 / 살아 있는 칸 몸 높이).
 · 원본은 지우거나 덮어쓰지 않는다. 출력: r96/runtime-text/assets/r1166/mobs, 기록 r96/r1166-md-deaths.json, SHEETS 줄(표준 출력).
usage: python3 scripts/r1166-md-deaths.py <Dots raw 폴더(MD-01.png…)> <site 폴더>"""
import sys,json,hashlib
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'r96/runtime-text/assets/r1166/mobs'
# id, 파일 이름, 살아 있는 그림(site), 살아 있는 칸, 살아 있을 때 피벗 x(칸 안), 살아 있을 때 키, R1065 bases 키
# (살아 있는 칸 x,y,w,h 와 Dots 칸 크기가 다를 수 있음: MD-01 Dots 313 폭 / 아틀라스 350 폭)
ROWS=[('MD-01','md-01-ghost-patient-death','visual-test/hospital-ranged-motion-r52.png',(0,718,350,368),167.7,340,(313,368),[718]),
 ('MD-03','md-03-masked-orderly-death','visual-test/hospital-orderly-motion-r51-v2.png',(0,0,444,444),237.5,322,(444,444),[0])]
def bb(im):return im.getchannel('A').point(lambda v:255 if v>16 else 0).getbbox()
def red(im):px=[p for p in im.getdata() if p[3]>64];return sum(1 for r,g,b,_ in px if r>150 and r>g+80 and r>b+80)/max(1,len(px))
def main(raw,site):
  raw=Path(raw);site=Path(site);OUT.mkdir(parents=True,exist_ok=True);rec=[];sheets={}
  for k,name,live,(x,y,LW,LH),pvx,vh,(W,H),rows in ROWS:
    f=raw/f'{k}.png';im=Image.open(f).convert('RGBA');assert im.size==(W*6,H),(k,im.size)
    pad=0
    a=im.getchannel('A').point(lambda v:0 if v<=16 else v)
    f4=a.crop((4*W,0,5*W,H)).point(lambda v:0 if v<48 else v);a.paste(f4,(4*W,0))
    im.putalpha(a);p=OUT/f'{name}.webp';im.save(p,quality=92,method=6,alpha_quality=100,lossless=False)
    chk=Image.open(p).convert('RGBA');a2=chk.getchannel('A').point(lambda v:0 if v<=16 else v);chk.putalpha(a2);chk.save(p,lossless=True,method=6)
    s=Image.open(site/'assets'/live).convert('RGBA').crop((x,y,x+LW,y+LH));sb=bb(s);f0=Image.open(p).convert('RGBA').crop((0,0,W,H+pad));db=bb(f0)
    sh,dh=sb[3]-sb[1],db[3]-db[1];r=dh/sh;ax=round((db[0]+db[2])/2+(pvx-(sb[0]+sb[2])/2)*r,1);ay=db[3];bodyH=round(vh*dh/sh)
    by=p.read_bytes();rel='assets/r1166/mobs/'+p.name;CH=H+pad
    sheets[k]={'path':rel,'cell':[W,CH],'cells':6,'anchor':[ax,ay],'bodyH':bodyH,'kind':'death','liveH':sh,'liveRed':round(red(s),4),'bases':{live:{'bodyH':vh,'bottom':sb[3],'footX':pvx,'rows':rows}}}
    rec.append({'id':k,'source':'Dots CX-0115MD_'+k+'_death6_r1_ROUGH.png','sourceSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'liveArt':'assets/'+live,'path':rel,'bytes':len(by),'sha256':hashlib.sha256(by).hexdigest(),
      'use':'몹 사망 6칸(R1065 사망 표)','fix':'알파 16 이하 0, 5칸째 알파 48 미만 0','applied':True,'finalArt':False})
    print(k,'anchor',[ax,ay],'bodyH',bodyH,'live h',sh,'dots h',dh,len(by))
  (ROOT/'r96/r1166-md-deaths.json').write_text(json.dumps({'round':'R1166','request':'CX-0115MD r1 ROUGH','files':rec},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  print('SHEETS',json.dumps(sheets,ensure_ascii=False,separators=(',',':')))
if __name__=='__main__':main(sys.argv[1],sys.argv[2])
