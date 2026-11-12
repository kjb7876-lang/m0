#!/usr/bin/env python3
"""R760: 불면귀 보스 그림 톤 — 회백 연기의 저승사자 → 먹색 실타래·보랏빛(귀비탕 영상 '불면귀 不眠鬼'·정본 35장).
입력은 빌드된 site 의 원본 그림(지우거나 덮어쓰지 않음). 밝기만 보고 먹색→짙은 보라→연보라 그라디언트로 다시 칠한다(알파·모양 그대로).
 · 보스 몸(4 자세): R104 열쇠 자세 mb-last302-v31231-p1~p4 — 같은 인물의 밀도 높은 그림이라 불면귀 보스가 이것을 쓴다(R760 js).
 · 보스 패턴 그림: actors-normalized 의 rain(실비)·transition(흩어짐).
출력 r96/runtime-text/assets/r760/boss/*.webp, 목록·해시 r96/r760-bulmyeongwi.json.
usage: python3 scripts/r760-bulmyeongwi-tone.py  (Pillow·numpy, 빌드된 site 필요)"""
import hashlib,io,json
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';SITE=R/'hospital-three-pc/site';RT=R/'runtime-text';OUT=RT/'assets/r760/boss';SPEC=R/'r760-bulmyeongwi.json'
SRC={
 'p1':'assets/r104/bosses/mb-last302-v31231-p1.webp','p2':'assets/r104/bosses/mb-last302-v31231-p2.webp',
 'p3':'assets/r104/bosses/mb-last302-v31231-p3.webp','p4':'assets/r104/bosses/mb-last302-v31231-p4.webp',
 'rain':'assets/generated-v31224/actors-normalized/35526bcfa1c2_bulmyeongwi_rain.webp',
 'transition':'assets/generated-v31224/actors-normalized/de4c1414da0d_bulmyeongwi_transition.webp'}
# 밝기 0..1 → 색. 먹색(영상의 실타래) · 짙은 보라 · 연보라(핵 둘레 빛). 맨 밝은 곳도 흰색이 아니라 연보라에서 멈춘다.
STOPS=[(0,(6,4,12)),(.22,(20,13,32)),(.45,(48,30,74)),(.7,(104,78,150)),(1,(206,190,236))]
def tone(rgb):
  L=(rgb[...,0]*.299+rgb[...,1]*.587+rgb[...,2]*.114)/255.
  out=np.zeros_like(rgb)
  xs=[s[0] for s in STOPS]
  for c in range(3):out[...,c]=np.interp(L,xs,[s[1][c] for s in STOPS])
  return out
# 정본 35장 '잠을 빼앗는 시선'·영상의 호박색 눈빛 한 점: 가면(머리 쪽 가장 밝은 덩어리) 안쪽의 어두운 눈구멍만 호박색으로 켠다.
AMBER=np.array([255,176,64],np.float32)
def eyes(a,rgb):
  al=a[...,3];L=(a[...,0]*.299+a[...,1]*.587+a[...,2]*.114)/255.
  ys,xs=np.nonzero(al>40);top,bot=ys.min(),ys.max();head=np.zeros_like(al,bool);head[top:top+int((bot-top)*.4)]=True
  bright=head&(L>.55)&(al>200);lab,n=ndimage.label(bright)
  if n==0:return rgb,0
  # 가면 = 머리 쪽(위 40%) 밝은 덩어리 가운데 100px 넘고 세로로 선 모양(키/폭 .7~2)이면서 꽉 찬 정도(넓이/상자)가 가장 높은 것.
  #  손톱·연기 줄기는 성기고 가로로 길어 빠진다. 가면은 눈구멍에 끊기므로 그 둘레 조각을 합친다.
  best=None
  for i,sl in enumerate(ndimage.find_objects(lab)):
    sz=int((lab[sl]==i+1).sum());h=sl[0].stop-sl[0].start;w=sl[1].stop-sl[1].start
    if sz<100 or not(.7<=h/w<=2):continue
    f=sz/(h*w)
    if best is None or f>best[0]:best=(f,i,(sl[0].start+sl[0].stop)/2,(sl[1].start+sl[1].stop)/2)
  if best is None:return rgb,0
  cm=ndimage.center_of_mass(bright,lab,np.arange(1,n+1));sz=ndimage.sum(bright,lab,np.arange(1,n+1))
  mask=np.isin(lab,[1+i for i in range(n) if sz[i]>=10 and abs(cm[i][0]-best[2])<30 and abs(cm[i][1]-best[3])<20])
  ys2,xs2=np.nonzero(mask);mh=ys2.max()-ys2.min()+1
  if mh<12:return rgb,0
  band=np.zeros_like(mask);band[ys2.min()+int(mh*.18):ys2.min()+int(mh*.6)]=True  # 눈 높이 띠(가면 위 18~60%)
  closed=ndimage.binary_closing(mask,structure=np.ones((3,3)),iterations=4)
  holes=ndimage.binary_fill_holes(closed)&~mask&band&(L<.35)&(al>160)
  if not holes.any():return rgb,0
  glow=ndimage.gaussian_filter(holes.astype(np.float32),1.1);glow=(np.clip(glow*1.5,0,1)*.9)[...,None]
  rgb=rgb*(1-glow)+AMBER*glow;return rgb,int(holes.sum())
def main():
  OUT.mkdir(parents=True,exist_ok=True);rows=[]
  for k,p in SRC.items():
    src=SITE/p;im=Image.open(src).convert('RGBA');a=np.asarray(im).astype(np.float32)
    rgb=tone(a[...,:3]);rgb,ne=eyes(a,rgb);al=a[...,3:4];o=Image.fromarray(np.concatenate([rgb,al],-1).clip(0,255).astype(np.uint8),'RGBA')
    buf=io.BytesIO();o.save(buf,'WEBP',quality=92,method=6);b=buf.getvalue();dst=OUT/('bulmyeongwi-'+k+'.webp');dst.write_bytes(b)
    rows.append({'key':k,'source':p,'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'path':'assets/r760/boss/bulmyeongwi-'+k+'.webp','size':list(o.size),'bytes':len(b),'eyePx':ne,'sha256':hashlib.sha256(b).hexdigest()})
  SPEC.write_text(json.dumps({'round':'R760','stops':STOPS,'files':rows},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  for r in rows:print(r['path'],r['size'],r['bytes'],'eye',r['eyePx'])
if __name__=='__main__':main()
