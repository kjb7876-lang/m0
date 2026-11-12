#!/usr/bin/env python3
"""R911: 스킬·투사체 그림 가장자리 잔선 걷어내기(원본은 그대로, 사본만 만든다).
전수 대조(r96/qa/r911/audit.md)에서 영웅 이펙트·공용 VFX 그림 일부의 위·아래·옆 끝에 몸통과 떨어진 1~6px 짜리 가는 줄(시트에서 잘라낼 때 묻은 이웃 칸 조각)이
남아 있었다. 투사체를 영웅 키 절반까지 키우면(R911) 이 줄도 같이 커져 보인다.
빌드된 site 의 그림을 읽어, 몸통(가장 큰 불투명 덩어리)과 빈 띠로 떨어져 있고 불투명 픽셀의 4% 미만이며 그림 끝 15% 안에 있는 줄만 투명하게 한 사본을
r96/runtime-text/assets/r911/clean/<원래 경로> 에 쓴다. 목록·해시: r96/r911-vfx-clean.json.
usage: python3 scripts/r911-vfx-clean.py [--check]   (numpy 필요, 빌드된 site 필요)"""
import hashlib,io,json,sys
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';SITE=R/'hospital-three-pc/site';RT=R/'runtime-text';SPEC=R/'r911-vfx-clean.json'
PATHS=['assets/vfx/heroes/gunner-e.webp','assets/vfx/heroes/hwando-e.webp','assets/vfx/heroes/lauren-q.webp','assets/vfx/heroes/lauren-r.webp',
 'assets/vfx/heroes/neon-e.webp','assets/vfx/heroes/seoha-e.webp','assets/vfx/heroes/seoha-w.webp','assets/vfx/heroes/slayer-r.webp',
 'assets/vfx/generated/v300/barrier-sigil.webp','assets/vfx/generated/v300/time-ring.webp']
TH=40
# 품질 낮은 그림을 이미 있는 더 나은 그림으로 대체(돌리기·여백만, 칠은 그대로). 기억사수 기본탄 gunner-laser-bullet 은 평면 벡터 캡슐이라
# 같은 영웅의 칠한 혜성 그림 gunner-a(머리가 왼쪽 아래)를 135° 돌려 머리를 +x(진행 방향)로 두고 정사각 칸 가운데에 둔다(엔진 texture 는 가로:세로 1:.86 상자에 그린다).
DERIVE=[{'path':'assets/vfx/heroes/gunner-laser-bullet.webp','from':'assets/vfx/heroes/gunner-a.webp','rotate':135,'out':'assets/r911/derived/gunner-laser-bullet.webp',
  'reason':'평면 벡터 캡슐(그라데이션 계단) → 같은 영웅의 칠한 혜성 그림. 머리 방향을 진행 방향으로 돌림'}]
def derive(d):
  im=Image.open(SITE/d['from']).convert('RGBA').rotate(d['rotate'],resample=Image.BICUBIC,expand=True)
  a=np.array(im)[...,3];ys,xs=np.where(a>20);im=im.crop((int(xs.min())-4,int(ys.min())-4,int(xs.max())+5,int(ys.max())+5))
  side=max(im.size);out=Image.new('RGBA',(side,side),(0,0,0,0));out.paste(im,((side-im.width)//2,(side-im.height)//2),im);return out.resize((256,256),Image.LANCZOS)
def segs(occ,gap):
  idx=np.where(occ)[0]
  if not len(idx):return []
  cut=np.where(np.diff(idx)>gap)[0]
  return [(int(s[0]),int(s[-1])) for s in np.split(idx,cut+1)]
def clean(im):
  a=np.array(im.convert('RGBA'));al=a[...,3];op=al>TH;total=int(op.sum());h,w=al.shape;removed=0
  for axis,n in ((1,h),(0,w)):
    prof=op.sum(axis);ss=segs(prof>0,max(6,int(n*.06)))
    if len(ss)<2:continue
    for s0,s1 in ss:
      cnt=int(prof[s0:s1+1].sum())
      if cnt<total*.04 and (s0<n*.15 or s1>n*.85):
        if axis==1:sl=(slice(s0,s1+1),slice(None))
        else:sl=(slice(None),slice(s0,s1+1))
        removed+=int((al[sl]>0).sum());a[sl+(3,)]=0
  return Image.fromarray(a,'RGBA'),removed
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
  check='--check' in sys.argv;rows=[];bad=0
  for p in PATHS:
    src=SITE/p;raw=src.read_bytes();im=Image.open(io.BytesIO(raw));out,removed=clean(im)
    buf=io.BytesIO();out.save(buf,'WEBP',lossless=True);data=buf.getvalue();dst=RT/'assets/r911/clean'/p
    if check:
      if not dst.exists():print('missing',dst);bad+=1;continue
      chk=np.array(Image.open(dst).convert('RGBA'));org=np.array(im.convert('RGBA'))
      if chk.shape!=org.shape or not np.array_equal(chk[...,:3][chk[...,3]>0],org[...,:3][chk[...,3]>0]):print('pixels changed beyond alpha',p);bad+=1
    else:
      dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(data)
    rows.append({'path':p,'source_sha256':sha(raw),'source_bytes':len(raw),'clean':'assets/r911/clean/'+p,'clean_sha256':sha(data) if not check else sha(dst.read_bytes()),'size':list(im.size),'removed_pixels':removed,
      'reason':'몸통과 떨어진 가장자리 잔선(시트 이웃 칸 조각)만 투명하게, 다른 픽셀은 그대로'})
  der=[]
  for d in DERIVE:
    out=derive(d);buf=io.BytesIO();out.save(buf,'WEBP',lossless=True);data=buf.getvalue();dst=RT/d['out']
    if not check:dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(data)
    elif not dst.exists():print('missing',dst);bad+=1
    der.append({**d,'from_sha256':sha((SITE/d['from']).read_bytes()),'replaced_sha256':sha((SITE/d['path']).read_bytes()),'out_sha256':sha(dst.read_bytes()) if dst.exists() else None,'size':[256,256]})
  if not check:SPEC.write_text(json.dumps({'revision':'R911-vfx-clean-2','rows':rows,'derived':der},ensure_ascii=False,indent=1)+'\n')
  for r in rows:print(r['path'],'removed',r['removed_pixels'])
  sys.exit(1 if bad else 0)
if __name__=='__main__':main()
