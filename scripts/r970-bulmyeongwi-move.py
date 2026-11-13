#!/usr/bin/env python3
"""R970: Dots CX-0082MV 불면귀(B36 위·아래)·검은 안개 심장(B35 옆·아래·위) 이동 4프레임 시트 → 게임용 webp(384칸 그대로).
입력: Dots 결과 폴더 사본(예: /mnt/project-files/bulmyeongwi-art/cx0082mv-bmg-move). 원본은 지우거나 덮어쓰지 않는다.
그림(형태·자세)은 Dots 원본 그대로. 밝기만 지금 게임 시트에 맞춘다(불투명 평균 밝기: 보스 옆 걷기 59·새 그림 79 → ×.76, 중간보스 대기·공격 48~50·새 그림 70 → ×.70).
밝은 곳(호박색 눈빛, 가장 밝은 채널 150 위)은 덜 낮춰 230 위는 그대로 둔다 — R760 톤 사본과 같은 뜻.
출력: r96/runtime-text/assets/r760/{boss,mid}/sheet-move{Up,Down,Side}.webp, 목록·해시는 r96/r760-bulmyeongwi.json 의 sheets970.
usage: python3 scripts/r970-bulmyeongwi-move.py <cx0082mv-bmg-move 폴더>"""
import hashlib,io,json,sys
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';OUT=R/'runtime-text/assets/r760';SPEC=R/'r760-bulmyeongwi.json'
SRC=[('boss','moveDown','692e4ae01c29_bulmyeongwi_idle-walk-down.png',.76),('boss','moveUp','692e4ae01c29_bulmyeongwi_idle-walk-up.png',.76),
 ('mid','moveSide','bulmyeongwi_b-walk-side.png',.70),('mid','moveDown','bulmyeongwi_b-walk-down.png',.70),('mid','moveUp','bulmyeongwi_b-walk-up.png',.70)]
CELL,N=384,4
def tone(im,g):
  a=np.asarray(im).astype(np.float32);mx=a[...,:3].max(axis=2);t=np.clip((mx-150)/80,0,1);t=t*t*(3-2*t);f=(g+(1-g)*t)[...,None]
  a[...,:3]*=f;a[...,:3][a[...,3]<=16]=0;a[...,3][a[...,3]<=16]=0;return Image.fromarray(np.clip(a+.5,0,255).astype(np.uint8),'RGBA')
def main(d):
  d=Path(d);rows=[]
  for sub,k,f,g in SRC:
    src=d/f;im=Image.open(src).convert('RGBA');assert im.size==(CELL*N,CELL),(f,im.size)
    o=tone(im,g);buf=io.BytesIO();o.save(buf,'WEBP',quality=90,method=6,exact=False);b=buf.getvalue()
    (OUT/sub).mkdir(parents=True,exist_ok=True);(OUT/sub/('sheet-'+k+'.webp')).write_bytes(b)
    rows.append({'who':sub,'key':k,'source':'Dots CX-0082MV '+f,'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'frames':N,'cell':CELL,'toneGain':g,
      'path':'assets/r760/'+sub+'/sheet-'+k+'.webp','size':list(o.size),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
  spec=json.loads(SPEC.read_text(encoding='utf8'));spec['sheets970']=rows;SPEC.write_text(json.dumps(spec,ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  for r in rows:print(r['path'],r['size'],r['bytes'])
if __name__=='__main__':main(sys.argv[1])
