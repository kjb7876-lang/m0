#!/usr/bin/env python3
"""R763: Dots CX-0070BM '불면귀에 잠식된 주민' 시트(384칸, 발 (192,352), 오른쪽 봄) → 게임용 256칸 webp.
입력: 그림 스레드의 검수·기계 손질본 폴더 둘(r1·r2 _c1.png). 원본은 지우거나 덮어쓰지 않는다.
출력: r96/runtime-text/assets/r763/villagers/<v>-<anim>.webp, 목록·해시 r96/r763-villagers.json.
usage: python3 scripts/r763-villager-sheets.py <cx0070bm-r1-cleaned> <cx0070bm-r2-cleaned>"""
import hashlib,io,json,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';OUT=R/'runtime-text/assets/r763/villagers';SPEC=R/'r763-villagers.json'
SRC={('fisher','idle'):('r1','CX-0070BM_vil1_idle6_r3_c1.png',6),('fisher','walk'):('r2','CX-0070BM_vil1_walk8_r3_c1.png',8),('fisher','atk'):('r2','CX-0070BM_vil1_atk8_r3_c1.png',8),
 ('fisher','hit'):('r1','CX-0070BM_vil1_hit4_r1_c1.png',4),('fisher','death'):('r1','CX-0070BM_vil1_death8_r2_c1.png',8),
 ('herbwife','idle'):('r1','CX-0070BM_vil2_idle6_r1_c1.png',6),('herbwife','walk'):('r2','CX-0070BM_vil2_walk8_r2_c1.png',8),('herbwife','atk'):('r2','CX-0070BM_vil2_atk8_r3_c1.png',8)}
CELL=384;NEW=256
def main(d1,d2):
  dirs={'r1':Path(d1),'r2':Path(d2)};OUT.mkdir(parents=True,exist_ok=True);rows=[]
  for (v,a),(r,f,n) in SRC.items():
    src=dirs[r]/f;im=Image.open(src).convert('RGBA');assert im.size==(CELL*n,CELL),(f,im.size)
    o=im.resize((NEW*n,NEW),Image.LANCZOS);buf=io.BytesIO();o.save(buf,'WEBP',quality=90,method=6);b=buf.getvalue();p=f'{v}-{a}.webp';(OUT/p).write_bytes(b)
    rows.append({'villager':v,'anim':a,'frames':n,'source':'Dots CX-0070BM '+f,'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'path':'assets/r763/villagers/'+p,
      'cell':NEW,'pivot':[NEW/2,round(352*NEW/CELL,2)],'size':list(o.size),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
  SPEC.write_text(json.dumps({'round':'R763','facing':'right','files':rows},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  for x in rows:print(x['path'],x['size'],x['bytes'])
if __name__=='__main__':main(sys.argv[1],sys.argv[2])
