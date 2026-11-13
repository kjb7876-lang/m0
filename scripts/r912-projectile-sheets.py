#!/usr/bin/env python3
"""R912: Dots CX-0084PJ 투사체 시트(fly8·hit6, 256px 칸 한 줄)를 게임용 webp 로 옮긴다.
원본 PNG 는 드라이브 결과 폴더의 것(저장소에 넣지 않음)을 SRC 폴더에서 읽고, 알파 16 이하를 0 으로 한 뒤
r96/runtime-text/assets/r912/<이름>.webp 로 쓴다(그림 픽셀은 그대로, 크기·칸 배치 그대로). 표: r96/r912-sheets.json
(원본 이름·sha256·크기, 결과 sha256·크기, 칸 수, 몸통 긴 변·중심 — 모듈 표와 CPU 검사가 이 값을 본다).
usage: python3 scripts/r912-projectile-sheets.py <SRC 폴더> | --check"""
import hashlib,io,json,sys
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';OUT=R/'runtime-text/assets/r912';SPEC=R/'r912-sheets.json'
ROWS=[('pj01-fly','PJ01/PJ-01-fly8.png',8,'서하 기본탄 비행'),('pj01-hit','PJ01/PJ-01-hit6.png',6,'서하 기본탄 적중'),
 ('pj02-fly','PJ02/PJ-02-fly8.png',8,'헌터 기본 화살 비행'),('pj02-hit','PJ02/PJ-02-hit6.png',6,'헌터 기본 화살 적중'),
 ('pj03-fly','PJ03heart/PJ-03-heart-fly8.png',8,'미카엘라 기본탄(하트) 비행'),('pj03-hit','PJ03heart/PJ-03-heart-hit6.png',6,'미카엘라 기본탄(하트) 적중'),
 ('pj03x-fly','PJ03r2/PJ-03-fly.png',8,'미카엘라 기본탄(십자가) 비행 — 예비'),('pj03x-hit','PJ03r2/PJ-03-hit.png',6,'미카엘라 기본탄(십자가) 적중 — 예비'),
 ('pj04-fly','PJ04/PJ-04-fly8.png',8,'기억사수 기본탄 비행'),('pj04-hit','PJ04/PJ-04-hit6.png',6,'기억사수 기본탄 적중'),
 ('pj05-fly','PJ05/PJ-05-fly8.png',8,'서하 시간 분신탄 비행'),('pj05-hit','PJ05/PJ-05-hit6.png',6,'서하 시간 분신탄 적중'),
 ('pj06-fly','PJ06/PJ-06-fly8.png',8,'서하 Q 얼음 창 비행'),('pj06-hit','PJ06/PJ-06-hit6.png',6,'서하 Q 얼음 창 적중'),
 ('pj07-fly','PJ07/PJ-07-fly8.png',8,'헌터 연사 화살 비행'),
 ('pj09a-fly','PJ09A/PJ-09A-fly.png',8,'몹 저주 구슬 비행'),('pj09a-hit','PJ09A/PJ-09A-hit.png',6,'몹 저주 구슬 적중'),
 ('pj09b-fly','PJ09b/PJ-09b-fly8.png',8,'몹 부패 독 덩어리 비행'),('pj09b-hit','PJ09b/PJ-09b-hit6.png',6,'몹 부패 독 덩어리 적중'),
 ('pj09c-fly','PJ09C/PJ-09C-fly8.png',8,'몹 주삿바늘 비행'),('pj09c-hit','PJ09C/PJ-09C-hit6.png',6,'몹 주삿바늘 적중'),
 ('pj10-fly','PJ10/PJ-10-fly.png',8,'보스 저주 해골탄 비행'),('pj10-hit','PJ10/PJ-10-hit.png',6,'보스 저주 해골탄 적중')]
CELL=256
def sha(b):return hashlib.sha256(b).hexdigest()
def metrics(a,n):
  longs=[];cx=[];cy=[]
  for i in range(n):
    c=a[:,i*CELL:(i+1)*CELL];ys,xs=np.where(c>40)
    if not len(xs):continue
    longs.append(max(int(xs.max()-xs.min()+1),int(ys.max()-ys.min()+1)));cx.append((int(xs.min())+int(xs.max())+1)/2);cy.append((int(ys.min())+int(ys.max())+1)/2)
  return {'bodyLong':int(np.median(longs)),'bodyMax':int(max(longs)),'cx':round(float(np.median(cx)),1),'cy':round(float(np.median(cy)),1)}
def main():
  if '--check' in sys.argv:
    spec=json.loads(SPEC.read_text());bad=0
    for r in spec['rows']:
      p=OUT/(r['name']+'.webp')
      if not p.exists() or sha(p.read_bytes())!=r['out_sha256']:print('mismatch',r['name']);bad+=1;continue
      im=Image.open(p)
      if list(im.size)!=[CELL*r['frames'],CELL]:print('size',r['name'],im.size);bad+=1
    print('rows',len(spec['rows']),'bad',bad);sys.exit(1 if bad else 0)
  src=Path(sys.argv[1]);OUT.mkdir(parents=True,exist_ok=True);rows=[]
  for name,rel,n,use in ROWS:
    raw=(src/rel).read_bytes();im=Image.open(io.BytesIO(raw)).convert('RGBA')
    assert im.size==(CELL*n,CELL),(name,im.size)
    a=np.array(im);a[a[...,3]<=16]=0;m=metrics(a[...,3],n)
    buf=io.BytesIO();Image.fromarray(a,'RGBA').save(buf,'WEBP',quality=92,method=6,exact=True);data=buf.getvalue();(OUT/(name+'.webp')).write_bytes(data)
    rows.append({'name':name,'use':use,'source':'Dots CX-0084PJ '+rel,'source_sha256':sha(raw),'source_bytes':len(raw),'out':'assets/r912/'+name+'.webp','out_sha256':sha(data),'out_bytes':len(data),'frames':n,'cell':CELL,**m,'applied':not name.startswith('pj03x')})
    print(name,len(data),m)
  SPEC.write_text(json.dumps({'revision':'R912-sheets-1','request':'CX-0084PJ','rows':rows},ensure_ascii=False,indent=1)+'\n')
if __name__=='__main__':main()
