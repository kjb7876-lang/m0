#!/usr/bin/env python3
"""R761: Dots CX-0070BM r1 불면귀 보스 시트(768칸, 발 (384,704)) → 게임용 512칸 webp.
입력: 검수·기계 손질본 폴더(_c1.png, 알파 16 이하 0·4칸 두 장을 8칸 한 줄로 이음 — 그림 자체는 Dots 원본 그대로). 원본은 지우거나 덮어쓰지 않는다.
출력: r96/runtime-text/assets/r760/boss/sheet-<key>.webp (칸 512, 발 (256,469.33)), 목록·해시는 r96/r760-bulmyeongwi.json 의 sheets.
usage: python3 scripts/r761-bulmyeongwi-sheets.py <cx0070bm-r1-cleaned 폴더>"""
import hashlib,io,json,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';OUT=R/'runtime-text/assets/r760/boss';SPEC=R/'r760-bulmyeongwi.json'
SRC={'idle':('CX-0070BM_boss_idle6_r2_c1.png',6),'move':('CX-0070BM_boss_move6_r1_c1.png',6),'atkA':('CX-0070BM_boss_atkA8_c1.png',8),
 'atkB':('CX-0070BM_boss_atkB8_c1.png',8),'cast':('CX-0070BM_boss_cast8_c1.png',8),'reveal':('CX-0070BM_boss_reveal8_c1.png',8)}
CELL=768;NEW=512
def main(d):
  d=Path(d);rows=[]
  for k,(f,n) in SRC.items():
    src=d/f;im=Image.open(src).convert('RGBA');assert im.size==(CELL*n,CELL),(f,im.size)
    o=im.resize((NEW*n,NEW),Image.LANCZOS);buf=io.BytesIO();o.save(buf,'WEBP',quality=90,method=6,exact=False);b=buf.getvalue()
    (OUT/('sheet-'+k+'.webp')).write_bytes(b)
    rows.append({'key':k,'source':'Dots CX-0070BM r1 '+f,'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'frames':n,'cell':NEW,
      'pivot':[NEW/2,round(704*NEW/CELL,2)],'path':'assets/r760/boss/sheet-'+k+'.webp','size':list(o.size),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
  spec=json.loads(SPEC.read_text(encoding='utf8'));spec['sheets']=rows;SPEC.write_text(json.dumps(spec,ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  for r in rows:print(r['path'],r['size'],r['bytes'])
if __name__=='__main__':main(sys.argv[1])
