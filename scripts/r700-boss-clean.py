#!/usr/bin/env python3
"""R700: 7대죄 보스 공격 그림의 밝은 회백 테두리(배경 지우기 잔티) 걷어내기.
전수조사(r96/qa/r700/audit.md)에서 게임이 실제로 그리는 질투·탐식·색욕 0단계 공격 그림만 가장자리의 40% 안팎이 회백 1~3px 테두리였다
(대기 그림·R104·R380 은 0~1%). 지금 게임이 받는 판(R425·R99 사본 또는 원본)을 입력으로, 픽셀을 지우지 않고 테두리 색만 안쪽 몸 색으로 바꿔 r96/runtime-text/assets/r700/clean/<원래 경로> 사본을 만든다. 원본·이전 사본은 그대로, boss-art-r700.js 가 주소만 돌린다.
목록·해시: r96/r700-boss-clean.json. usage: python3 scripts/r700-boss-clean.py (numpy·scipy 필요, 빌드된 site 필요)"""
import hashlib,io,json,re,subprocess,sys,importlib.util
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';SITE=R/'hospital-three-pc/site';RT=R/'runtime-text';SPEC=R/'r700-boss-clean.json'
import numpy as np
from scipy import ndimage
def defringe(im,depth=4,delta=38):
  """R99 halo 와 달리 픽셀을 지우지 않는다: 투명 경계에서 depth px 안의 밝은 무채색 픽셀 가운데 안쪽 몸(경계에서 depth+1px 넘게 들어간 불투명 픽셀)의
  가장 가까운 색보다 delta 넘게 밝은 것만 그 몸 색으로 바꾸고 알파를 조금(×.85) 낮춘다. 흰 조리복처럼 원래 밝은 가장자리는 안쪽도 밝아 그대로 남는다."""
  a=np.asarray(im).astype(np.float32);rgb=a[...,:3].copy();al=a[...,3].copy()
  solid=al>40;dist=ndimage.distance_transform_edt(al>0)
  lum=rgb.mean(-1);sat=rgb.max(-1)-rgb.min(-1);grey=(lum>90)&(sat<60);dim=(lum>55)&(sat<60)
  core=(ndimage.distance_transform_edt(solid)>depth-1)&(al>200)&~(grey&(dist<=depth+2))
  _,(iy,ix)=ndimage.distance_transform_edt(~core,return_indices=True)
  corec=rgb[iy,ix];corel=corec.mean(-1)
  f=(al>0)&(dist<=depth)&dim&(lum-corel>delta)
  rgb[f]=corec[f];al[f&solid]=np.maximum(41,al[f&solid]*.85)
  return Image.fromarray(np.dstack([rgb,al]).clip(0,255).astype(np.uint8),'RGBA'),int(f.sum())
sha=lambda b:hashlib.sha256(b).hexdigest()
IMAGES=[('assets/generated-v31224/actors-normalized/9f845f4d58bf_envy-human-attack.webp','질투(b03) 0단계 공격'),
 ('assets/generated-v31224/actors-normalized/27ef01c10a8f_gluttony-human-attack.webp','탐식(b04) 0단계 공격'),
 ('assets/generated-v31224/actors-normalized/53c9ce212489_lust-human-attack.webp','색욕(b05) 0단계 공격')]
def jsset(name,var):
  m=re.search(var+r'=new Set\((\[.*?\])\)',(R/'client-source'/name).read_text(encoding='utf8'));return set(json.loads(m.group(1)))
C99=jsset('assets-clean-r99.js','CLEAN');C425=jsset('combat-flow-r425.js','CLEAN425')
def find(p):
  for b in (RT,SITE):
    if (b/p).exists():return b/p
  raise SystemExit('missing '+p)
def main():
  rows=[];done=[]
  for p,use in IMAGES:
    src='assets/r425/clean/'+p if p in C425 else ('assets/r99/clean/'+p if p in C99 else p)
    b=find(src).read_bytes();im=Image.open(io.BytesIO(b)).convert('RGBA')
    out,nfix=defringe(im)
    buf=io.BytesIO();out.save(buf,'WEBP',lossless=True,quality=100,method=6,exact=True)
    o=RT/'assets/r700/clean'/p;o.parent.mkdir(parents=True,exist_ok=True);o.write_bytes(buf.getvalue())
    rows.append({'path':p,'use':use,'input':src,'sourceSha256':sha(b),'ops':['defringe-recolor'],'fixedPx':nfix,'output':'assets/r700/clean/'+p,'outputSha256':sha(buf.getvalue()),'outputBytes':len(buf.getvalue())})
    done.append('assets/r700/clean/'+p)
  SPEC.write_text(json.dumps({'schema':'r700-boss-clean-v1','why':'사용자 2026-11-11 00:57Z 보스들 특히 7대죄 이미지 일관성 및 품질 전수조사검사 개선. 공격 그림만 회백 테두리.','originalsModified':False,'images':rows},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  for r in rows:print(r['path'].split('/')[-1],r['input'][:20],r['outputBytes'])
if __name__=='__main__':main()
