#!/usr/bin/env python3
"""R283 환도 색감 맞추기: 지금 게임이 쓰는 환도 그림(R271 걷기 4·공격 E, R242 공격 S·N, 피격 E·N·S)을
R271 걷기 4방향 평균(밝기 p10/p50/p90, 채도, 채널 평균 비)에 맞춘 파생본을 assets/r283/hwando/<r271|r242>/ 에 쓴다.
원본은 건드리지 않고, 칸 크기·발 기준점·알파는 그대로다(색만)."""
import json,hashlib,os,sys
import numpy as np
from PIL import Image
R=os.path.join(os.path.dirname(__file__),'..','r96','runtime-text','assets')
OUT=os.path.join(R,'r283','hwando')
REF=[('r271','walk-e'),('r271','walk-w'),('r271','walk-n'),('r271','walk-s')]
CLIPS=REF+[('r271','attack-e'),('r242','attack-s'),('r242','attack-n'),('r242','hit-e'),('r242','hit-n'),('r242','hit-s')]
W=np.array([.299,.587,.114])
def load(pack,name):return np.array(Image.open(os.path.join(R,pack,'hwando',name+'.webp')).convert('RGBA')).astype(np.float64)/255
def measure(a):
    m=a[...,3]>.8;px=a[m][:,:3];lum=px@W;mx,mn=px.max(1),px.min(1);sat=np.where(mx>0,(mx-mn)/np.maximum(mx,1e-6),0)
    return dict(p10=float(np.percentile(lum,10)),p50=float(np.percentile(lum,50)),p90=float(np.percentile(lum,90)),sat=float(sat.mean()),rgb=(px.mean(0)/px.mean()).tolist())
def piece(x,src,dst):# 밝기 p10/p50/p90 을 잇는 조각 직선(양끝은 기울기 유지)
    s0,s1,s2=src;d0,d1,d2=dst;lo=(d1-d0)/max(s1-s0,1e-6);hi=(d2-d1)/max(s2-s1,1e-6)
    return np.where(x<s1,d1+(x-s1)*lo,d1+(x-s1)*hi)
def fix(a,src,tgt,k=None):
    """채도 배율 k 는 측정 채도가 목표에 닿을 때까지 몇 번 고쳐 잡는다(흰 균형과 밝기 곡선이 채도도 바꾸므로)."""
    if k is None:
        k=tgt['sat']/max(src['sat'],1e-6)
        for _ in range(6):
            got=measure(fix(a,src,tgt,k))['sat'];k*=tgt['sat']/max(got,1e-6)
    rgb=a[...,:3];lum=rgb@W;nl=np.clip(piece(lum,(src['p10'],src['p50'],src['p90']),(tgt['p10'],tgt['p50'],tgt['p90'])),0,1)
    chroma=(rgb-lum[...,None])*k
    wb=np.array(tgt['rgb'])/np.array(src['rgb'])
    out=np.clip((nl[...,None]+chroma)*wb,0,1);res=a.copy();res[...,:3]=out;return res
def main():
    refs=[measure(load(*c)) for c in REF];tgt={k:float(np.mean([r[k] for r in refs])) for k in ('p10','p50','p90','sat')};tgt['rgb']=np.mean([r['rgb'] for r in refs],0).tolist()
    idx={'revision':'R283-hwando-color-1','target':tgt,'clips':{}}
    for pack,name in CLIPS:
        a=load(pack,name);src=measure(a);b=fix(a,src,tgt);after=measure(b)
        os.makedirs(os.path.join(OUT,pack),exist_ok=True);p=os.path.join(OUT,pack,name+'.webp')
        Image.fromarray((b*255+.5).astype(np.uint8),'RGBA').save(p,'WEBP',quality=92,method=6)
        sp=os.path.join(R,pack,'hwando',name+'.webp')
        idx['clips'][pack+'/'+name]={'source':f'assets/{pack}/hwando/{name}.webp','source_sha256':hashlib.sha256(open(sp,'rb').read()).hexdigest(),'derived':f'assets/r283/hwando/{pack}/{name}.webp',
          'sha256':hashlib.sha256(open(p,'rb').read()).hexdigest(),'bytes':os.path.getsize(p),'size':list(Image.open(p).size),'source_size':list(Image.open(sp).size),'before':src,'after':after}
        print(pack,name,{k:round(src[k],3) for k in ('p10','p50','p90','sat')},'->',{k:round(after[k],3) for k in ('p10','p50','p90','sat')})
    json.dump(idx,open(os.path.join(OUT,'index.json'),'w'),ensure_ascii=False,indent=1)
if __name__=='__main__':main()
