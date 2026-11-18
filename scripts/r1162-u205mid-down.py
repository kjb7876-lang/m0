#!/usr/bin/env python3
"""R1162: Dots CX-P3 B1 '제14단계 역전 관리자(u205-mid) 아래 걷기 4칸 r2'(HOLD: 4번 칸 들린 발이 무릎이 접혀 짧다)를 코드로 손질해 R974 방향 이동 표에 더한다.
사용자 2026-11-18 "hold 보류자산도 앵간하면 너가 코드나 스킬로 개선해서 적용해".
 · 손질: 4번 칸(왼발 들기)의 왼쪽 아래(x<124, y≥220)만 2번 칸(오른발 들기)을 좌우로 뒤집은 그림으로 바꾼다 — 걸음 위상을 좌우 반전으로 맞춤.
   몸통·오른쪽 지지발·칼(4번 칸 칼날 중심선 반폭 6.5px)은 4번 칸 그대로. 이음매는 8px(세로)·4~6px(가로) 부드럽게, 알파 곱한 색으로 섞는다. 알파 16 이하는 0.
 · 1~3번 칸은 Dots 원본 그대로. 원본은 지우거나 덮어쓰지 않는다.
 · 표: 걷는 동안 엔진이 그리는 그림은 R374 u205-mid-new.webp 이동 칸 0~7(256×320). 칸은 R1125 와 같이 정사각(320)으로, 색은 엔진 걷기 그림 평균에 맞춘다(R974 규칙).
   위·옆 시트는 Dots 결과가 없어 엔진 그림 그대로.
usage: python3 scripts/r1162-u205mid-down.py <Dots down4 r2 png> <site 폴더>"""
import hashlib,importlib.util,io,json,sys
from pathlib import Path
from PIL import Image,ImageOps
import numpy as np
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';OUT=R/'runtime-text/assets/r1162/move'
sp=importlib.util.spec_from_file_location('r1125',ROOT/'scripts/r1125-mob-move.py');r1125=importlib.util.module_from_spec(sp);sp.loader.exec_module(r1125);r974=r1125.r974
CW,CH,N=256,320,4;CX,Y0=124,220;SW0,SW1,HW=(72,211),(113,258),6.5
def fix4(im):
  f=[im.crop((i*CW,0,(i+1)*CW,CH)) for i in range(N)];F4=np.asarray(f[3]).astype(np.float32);M2=np.asarray(ImageOps.mirror(f[1])).astype(np.float32)
  Y,X=np.mgrid[0:CH,0:CW];w=(np.clip((Y-Y0)/8,0,1)*np.clip((CX-X)/4,0,1)*np.clip((X-64)/6,0,1))
  A=np.array(SW0,float);d=np.array(SW1,float)-A;t=np.clip(((X-A[0])*d[0]+(Y-A[1])*d[1])/(d@d),0,1)
  w[(np.hypot(X-(A[0]+t*d[0]),Y-(A[1]+t*d[1]))<=HW)&(F4[...,3]>16)]=0;w=w[...,None]
  pa=lambda Q:np.concatenate([Q[...,:3]*Q[...,3:]/255,Q[...,3:]],-1);P=pa(M2)*w+pa(F4)*(1-w);al=np.round(P[...,3:])
  rgb=np.where(al>0,P[...,:3]*255/np.maximum(al,1e-6),0);al[al<=16]=0;o=np.concatenate([rgb,al],-1).clip(0,255).astype(np.uint8)
  out=np.asarray(im).copy();out[:,3*CW:4*CW]=o;return Image.fromarray(out)
def main(src,site):
  src=Path(src);site=Path(site);OUT.mkdir(parents=True,exist_ok=True)
  raw=Image.open(src).convert('RGBA');assert raw.size==(CW*N,CH),raw.size;fixed=fix4(raw)
  rel='r374/mobs/u205-mid-new.webp';whole=Image.open(site/'assets'/rel).convert('RGBA');wsz=list(whole.size);idles=[];im0=None
  for k in range(8):
    rc=[k*CW,0,CW,CH];cell=whole.crop((rc[0],0,rc[0]+CW,CH));a=np.asarray(cell)[...,3];idles.append({'path':'assets/'+rel,'rect':rc,'size':wsz,'bbox':r974.bbox(a),'body':r974.body(a)})
    if im0 is None:im0=r974.mean(cell)
  mb=int(np.median([i['body'] for i in idles]));bb=[int(np.median([i['bbox'][k] for i in idles])) for k in range(4)]
  for i in idles:i['body']=mb;i['bbox']=bb
  sq,C=r1125.square(fixed,CW,CH);px_=np.asarray(sq).reshape(-1,4).astype(np.float32);m1=px_[px_[:,3]>128][:,:3].mean(axis=0)
  g=[float(np.clip(im0[c]/max(1,m1[c]),.65,1.35)) for c in range(3)];o=r974.tone(sq,g);a=np.asarray(o)[...,3]
  bbs=[r974.bbox(a[:,i*C:(i+1)*C]) for i in range(N)];py=float(np.median([q[3] for q in bbs]));vis=float(np.median([r974.body(a[:,i*C:(i+1)*C]) for i in range(N)]));px=float(np.median([(q[0]+q[2])/2 for q in bbs]))
  buf=io.BytesIO();o.save(buf,'WEBP',quality=88,method=6,exact=False);by=buf.getvalue();name='u205-mid-down.webp';(OUT/name).write_bytes(by)
  ent={'idle':idles,'cell':C,'n':N,'fps':8,'dirs':{'down':{'path':'assets/r1162/move/'+name,'px':round(px,1),'py':round(py,1),'vis':round(vis,1)}}};table={'u205-mid':[ent]}
  rows=[{'dots':src.name,'enemies':['u205-mid'],'dir':'down','source':'Dots '+src.name+' (4번 칸 왼다리를 2번 칸 좌우 반전으로 손질)','sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'toneGain':[round(v,3) for v in g],
    'path':'assets/r1162/move/'+name,'size':list(o.size),'bytes':len(by),'sha256':hashlib.sha256(by).hexdigest(),'use':'중간보스 아래 이동','applied':True,'finalArt':False},
   {'dots':'u205-mid 위·옆 걷기','applied':False,'why':'Dots 시트 없음 → 엔진 그림 그대로'}]
  js=('// R1162 중간보스 아래 이동 표(Dots CX-P3 B1 u205-mid 아래 걷기 r2, 4번 칸 코드 손질) — scripts/r1162-u205mid-down.py 가 만든다(손으로 고치지 않는다). R974 표에 더한다(R1125 와 같은 붙이기).\n'
   '(()=>{const D=window.__STORYWORLD_MOVE_DIR_R974_DATA__,M='+json.dumps(table,ensure_ascii=False,separators=(',',':'))+';\n'
   'if(D&&D.enemies)for(const k of Object.keys(M))for(const V of M[k]){const E=D.enemies[k];if(!E)D.enemies[k]=V;else{const A=E.alt||(E.alt=[]);if(A.indexOf(V)<0)A.push(V);}}\n'
   "window.__STORYWORLD_MOVE_DIR_R1162__=Object.freeze({rev:'R1162-u205mid-down-1',ids:Object.freeze(Object.keys(M)),joined:!!(D&&D.enemies)});})();\n")
  (R/'client-source/move-dir-r1162-data.js').write_text(js,encoding='utf8');(R/'runtime-text/move-dir-r1162-data.js').write_text(js,encoding='utf8')
  (R/'r1162-u205mid-down.json').write_text(json.dumps({'round':'R1162','request':'CX-P3 B1 u205-mid down4 r2 HOLD','files':rows},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  print('cell',C,'gain',[round(v,3) for v in g],'down',ent['dirs']['down'],'idle body',mb,'bbox',bb,'bytes',len(by))
if __name__=='__main__':main(sys.argv[1],sys.argv[2])
