#!/usr/bin/env python3
"""R770: 불면귀 주민 몹 Dots CX-0070BM 새 시트 → 게임용 webp(256칸, 발 234.67). 원본·이전 webp 는 지우거나 덮어쓰지 않는다.
 · 소복 처녀(vil3) 부유 이동 float8 r1 (사용자 검수 통과, 걷기 대신 부유로 — 그림 스레드 23:5xZ) + 같은 인물 r1 대기 idle6·공격 atk8.
 · R771 소복 피격 hit4 r1(16fps, 떠 있는 채 젖혀짐 — 그림 스레드 01:38Z).
 · 약방 아낙(vil2) 피격 hit4 r1(16fps)·죽음 death8 r1(10fps, 반복 없음) — 사용자 검수 통과.
 모두 384칸·발 (192,352)·c1 손질본. 출력 r96/runtime-text/assets/r770/villagers/*.webp, 목록·해시 r96/r770-villager-dots.json.
usage: python3 scripts/r770-villager-dots.py <r5-cleaned 폴더> <r1-cleaned 폴더>"""
import hashlib,io,json,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';RT=R/'runtime-text';SPEC=R/'r770-villager-dots.json'
JOBS=[('sobok','float','r5','CX-0070BM_vil3_float8_r1_c1.png',8),('sobok','idle','r1','CX-0070BM_vil3_idle6_r1_c1.png',6),('sobok','atk','r1','CX-0070BM_vil3_atk8_r1_c1.png',8),
 ('sobok','hit','r5','CX-0070BM_vil3_hit4_r1_c1.png',4),('herbwife','hit','r5','CX-0070BM_vil2_hit4_r1_c1.png',4),('herbwife','death','r5','CX-0070BM_vil2_death8_r1_c1.png',8)]
def vis(o,n,cell,foot):
  hs=[]
  for i in range(n):
    a=o.crop((i*cell,0,(i+1)*cell,cell)).getchannel('A');w,h=a.size;px=a.load()
    top=next((y for y in range(h) if sum(1 for x in range(w) if px[x,y]>64)>=3),None)
    if top is not None:hs.append(round(foot-top,1))
  return hs
def main(r5,r1):
  rows=[];dirs={'r5':Path(r5),'r1':Path(r1)}
  for k,a,d,name,n in JOBS:
    src=dirs[d]/name;im=Image.open(src).convert('RGBA');assert im.size==(384*n,384),(name,im.size)
    o=im.resize((256*n,256),Image.LANCZOS);rel=f'assets/r770/villagers/{k}-{a}.webp'
    buf=io.BytesIO();o.save(buf,'WEBP',quality=90,method=6);b=buf.getvalue();p=RT/rel;p.parent.mkdir(parents=True,exist_ok=True);assert not p.exists() or p.read_bytes()==b,rel;p.write_bytes(b)
    hs=vis(o,n,256,234.67)
    rows.append({'villager':k,'anim':a,'frames':n,'source':'Dots CX-0070BM '+name+' (그림 스레드 c1 손질)','sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),
     'path':rel,'cell':256,'pivot':[128,234.67],'heights':hs,'size':list(o.size),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
  SPEC.write_text(json.dumps({'round':'R770','files':rows},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  for x in rows:print(x['path'],x['size'],x['bytes'],x['heights'])
if __name__=='__main__':main(sys.argv[1],sys.argv[2])
