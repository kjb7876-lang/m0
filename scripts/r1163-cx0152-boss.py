#!/usr/bin/env python3
"""R1163: Dots CX-0152 r1 ROUGH(게임이 실제로 그리는 그림 기준 보스 대기 6칸·피격 4칸) → 게임 칸에 맞춘 webp.
 b02 나태(R380 sloth-burden-man-v1, 256×256) · u204 제12단계 기억 검열기(R380 u204-mech-04-v1, 256×256) · u205 제14단계 역전 관리자(R374 u205-mid-new, 256×320).
 · 기준: 대기 때 엔진이 그리는 0번 칸. 세로는 발 줄, 가로는 대기 1번 칸을 0번 칸과 겹쳐 색 차이가 가장 작은 자리(±40px, qa/r1147/fitsheet.py 와 같은 방식).
 · 피격은 대기와 같은 이동량을 쓴다(Dots 피격 F4 = 대기 F1 이라 대기↔피격 사이에 몸이 옆으로 튀지 않게). 색은 시트마다 0번 칸 평균 색에 채널별 곱. 알파 16 이하 0.
 · 원본은 지우거나 덮어쓰지 않는다. b04 는 Dots 가 원본을 못 찾아 건너뜀(이번 판 없음).
usage: python3 scripts/r1163-cx0152-boss.py <Dots raw 폴더> <site 폴더>"""
import sys,json,hashlib
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'r96/runtime-text/assets/r1163/bosses'
BOSSES=[('b02','r380/mobs/sloth-burden-man-v1.webp',256,256,'CX-0152-1_b02'),('u204','r380/mobs/u204-mech-04-v1.webp',256,256,'CX-0152-3_u204'),('u205','r374/mobs/u205-mid-new.webp',256,320,'CX-0152-4_u205')]
foot=lambda a:np.nonzero((a[...,3]>16).any(1))[0].max()
pm=lambda a:a[...,:3]*a[...,3:]/255
vis=lambda a:a[a[...,3]>16][:,:3].mean(0)
def shift(a,dx,dy):
  H,W=a.shape[:2];o=np.zeros_like(a);ys=slice(max(0,dy),H+min(0,dy));yd=slice(max(0,-dy),H+min(0,-dy));xs=slice(max(0,dx),W+min(0,dx));xd=slice(max(0,-dx),W+min(0,-dx));o[ys,xs]=a[yd,xd];return o
def main(raw,site):
  raw=Path(raw);site=Path(site);OUT.mkdir(parents=True,exist_ok=True);rows=[]
  for key,rel,W,H,pre in BOSSES:
    src=np.array(Image.open(site/'assets'/rel).convert('RGBA').crop((0,0,W,H))).astype(np.float32)
    sheets={s:np.array(Image.open(raw/f'{pre}_{s}_r1_ROUGH.png').convert('RGBA')).astype(np.float32) for s in ('idle6','hit4')}
    f0=sheets['idle6'][:,:W];assert sheets['idle6'].shape[:2]==(H,W*6) and sheets['hit4'].shape[:2]==(H,W*4),key
    dy=int(foot(src)-foot(f0));best=None
    for dx in range(-40,41):
      g=shift(f0,dx,dy);m=(src[...,3]>16)|(g[...,3]>16);e=float(np.abs(pm(src)-pm(g)).sum(-1)[m].mean())
      if best is None or e<best[0]:best=(e,dx)
    dx=best[1];ramp=np.ones((H,W),np.float32)
    for i in range(8):v=i/8;ramp[i,:]=np.minimum(ramp[i,:],v);ramp[H-1-i,:]=np.minimum(ramp[H-1-i,:],v);ramp[:,i]=np.minimum(ramp[:,i],v);ramp[:,W-1-i]=np.minimum(ramp[:,W-1-i],v)
    for s,sh in sheets.items():
      n=sh.shape[1]//W;cells=[]
      for i in range(n):c=shift(sh[:,i*W:(i+1)*W],dx,dy);c[...,3]*=ramp;cells.append(c)
      o=np.concatenate(cells,1);g=vis(src)/np.maximum(1e-6,vis(o));o[...,:3]=np.clip(np.round(o[...,:3]*g),0,255);o[...,3]=np.round(o[...,3]);o[...,3]=np.where(o[...,3]<=16,0,o[...,3])
      p=OUT/f'{key}-{s}.webp';Image.fromarray(o.astype(np.uint8),'RGBA').save(p,quality=90,method=6,alpha_quality=100,alpha_filter=0);by=p.read_bytes()
      f=raw/f'{pre}_{s}_r1_ROUGH.png'
      rows.append({'boss':key,'sheet':s,'source':'Dots '+f.name,'sourceSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'engineArt':'assets/'+rel,'cell':[W,H],'n':n,'shift':[dx,dy],'fitErr':round(best[0],1),'gain':[round(float(x),3) for x in g],
        'path':'assets/r1163/bosses/'+p.name,'bytes':len(by),'sha256':hashlib.sha256(by).hexdigest(),'use':'보스 대기 8fps' if s=='idle6' else '보스 피격 16fps','applied':True,'finalArt':False})
      print(key,s,'shift',[dx,dy],'err',round(best[0],1),'gain',[round(float(x),3) for x in g],len(by))
  rows.append({'boss':'b04','applied':False,'why':'Dots 가 실제 그리는 원본(phase0)을 못 찾아 건너뜀 — 다음 판 재요청'})
  (ROOT/'r96/r1163-cx0152-boss.json').write_text(json.dumps({'round':'R1163','request':'CX-0152 r1 ROUGH','files':rows},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
if __name__=='__main__':main(sys.argv[1],sys.argv[2])
