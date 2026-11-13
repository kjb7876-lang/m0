#!/usr/bin/env python3
"""R990: 불면귀 안개 스킬용 Dots CX-0070BM fx_core24 r1(검은 안개 핵 · 보라 실, 7분야 심사 7.93 통과) → 게임용 webp.
입력: 그림 스레드 손질본 사본(/mnt/project-files/bulmyeongwi-art/cx0070bm-r2-cleaned/CX-0070BM_fx_core24_r1_c1.png). 원본은 지우거나 덮어쓰지 않는다.
그림은 Dots 원본 그대로(256칸 24장). 알파 16 이하만 0 으로(c1 과 같은 기준).
출력: r96/runtime-text/assets/r990/fog-core.webp, 목록·해시는 r96/r990-bulmyeongwi-fog.json.
usage: python3 scripts/r990-bulmyeongwi-fog.py <fx_core24 png>"""
import hashlib,io,json,sys
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';OUT=R/'runtime-text/assets/r990';SPEC=R/'r990-bulmyeongwi-fog.json'
CELL,N=256,24
def main(src):
  src=Path(src);im=Image.open(src).convert('RGBA');assert im.size==(CELL*N,CELL),im.size
  a=np.asarray(im).copy();m=a[...,3]<=16;a[m]=0;o=Image.fromarray(a,'RGBA')
  buf=io.BytesIO();o.save(buf,'WEBP',quality=88,method=6,exact=False);b=buf.getvalue()
  OUT.mkdir(parents=True,exist_ok=True);(OUT/'fog-core.webp').write_bytes(b)
  row={'key':'fog-core','source':'Dots CX-0070BM '+src.name,'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'review':'그림 스레드 7분야 7.93 통과(README_review r2)',
       'frames':N,'cell':CELL,'path':'assets/r990/fog-core.webp','size':list(o.size),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
  reuse={'key':'fog-mist','path':'assets/r430/mist-loop.webp','note':'R430 기존 자산(192칸 22장) 재사용, 게임 안에서 hue-rotate·brightness 로 먹빛 보라 안개'}
  SPEC.write_text(json.dumps({'revision':'R990','assets':[row],'reused':[reuse]},ensure_ascii=False,indent=1)+'\n',encoding='utf8');print(row['path'],row['size'],row['bytes'])
if __name__=='__main__':main(sys.argv[1])
