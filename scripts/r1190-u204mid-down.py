#!/usr/bin/env python3
"""R1190: Dots CX-0129MV 'u204-mid(제12단계 기억 검열기) 앞/아래 걷기 4칸 r1 ROUGH'를 R974 방향 이동 표에 더한다.
사용자 2026-11-18 "hold 보류자산도 앵간하면 너가 코드나 스킬로 개선해서 적용해" · R1162(u205-mid 아래 걷기)와 같은 붙이기.
 · Dots 4칸은 같은 인물(거울 얼굴·망치 지팡이·주황 핵)이고 발 줄(y219)·여백이 고르다 → 칸 손질 없이 그대로 쓴다. 원본은 지우거나 덮어쓰지 않는다.
 · 표: 엔진이 그리는 그림은 R380 u204-mech-04-v1.webp(256×256, 8칸). 0·1·2·3·4·7번 칸이 대기·걷기(헤드리스 실측: 걷는 동안 0·1·4번), 5·6번은 공격 자세라 표에 넣지 않는다(공격 프레임은 건드리지 않음).
   칸은 R1125 와 같이 정사각으로, 색은 엔진 걷기 그림 평균에 맞춘다(R974 규칙). 위·옆 시트는 Dots 결과가 없어 엔진 그림 그대로.
usage: python3 scripts/r1190-u204mid-down.py <Dots down4 png>"""
import hashlib,importlib.util,io,json,sys
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';A=R/'runtime-text/assets';OUT=A/'r1190/move'
sp=importlib.util.spec_from_file_location('r1125',ROOT/'scripts/r1125-mob-move.py');r1125=importlib.util.module_from_spec(sp);sp.loader.exec_module(r1125);r974=r1125.r974
CW=CH=256;N=4;CELLS=(0,1,2,3,4,7)
def main(src):
  src=Path(src);OUT.mkdir(parents=True,exist_ok=True)
  raw=Image.open(src).convert('RGBA');assert raw.size==(CW*N,CH),raw.size
  rel='r380/mobs/u204-mech-04-v1.webp';whole=Image.open(A/rel).convert('RGBA');wsz=list(whole.size);idles=[];im0=None
  for k in CELLS:
    rc=[k*CW,0,CW,CH];cell=whole.crop((rc[0],0,rc[0]+CW,CH));a=np.asarray(cell)[...,3];idles.append({'path':'assets/'+rel,'rect':rc,'size':wsz,'bbox':r974.bbox(a),'body':r974.body(a)})
    if im0 is None:im0=r974.mean(cell)
  mb=int(np.median([i['body'] for i in idles]));bb=[int(np.median([i['bbox'][k] for i in idles])) for k in range(4)]
  for i in idles:i['body']=mb;i['bbox']=bb
  sq,C=r1125.square(raw,CW,CH);px_=np.asarray(sq).reshape(-1,4).astype(np.float32);m1=px_[px_[:,3]>128][:,:3].mean(axis=0)
  g=[float(np.clip(im0[c]/max(1,m1[c]),.65,1.35)) for c in range(3)];o=r974.tone(sq,g);a=np.asarray(o)[...,3]
  bbs=[r974.bbox(a[:,i*C:(i+1)*C]) for i in range(N)];py=float(np.median([q[3] for q in bbs]));vis=float(np.median([r974.body(a[:,i*C:(i+1)*C]) for i in range(N)]));px=float(np.median([(q[0]+q[2])/2 for q in bbs]))
  buf=io.BytesIO();o.save(buf,'WEBP',quality=88,method=6,exact=False);by=buf.getvalue();name='u204-mid-down.webp';(OUT/name).write_bytes(by)
  ent={'idle':idles,'cell':C,'n':N,'fps':8,'dirs':{'down':{'path':'assets/r1190/move/'+name,'px':round(px,1),'py':round(py,1),'vis':round(vis,1)}}};table={'u204-mid':[ent]}
  rows=[{'dots':src.name,'enemies':['u204-mid'],'dir':'down','source':'Dots '+src.name+' (칸 손질 없음, 색만 엔진 그림에 맞춤)','sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'toneGain':[round(v,3) for v in g],
    'path':'assets/r1190/move/'+name,'size':list(o.size),'bytes':len(by),'sha256':hashlib.sha256(by).hexdigest(),'use':'중간보스 아래 이동','applied':True,'finalArt':False},
   {'dots':'u204-mid 위·옆 걷기','applied':False,'why':'Dots 시트 없음 → 엔진 그림 그대로'}]
  js=('// R1190 중간보스 아래 이동 표(Dots CX-0129MV u204-mid 아래 걷기 r1) — scripts/r1190-u204mid-down.py 가 만든다(손으로 고치지 않는다). R974 표에 더한다(R1125·R1162 와 같은 붙이기).\n'
   '(()=>{const D=window.__STORYWORLD_MOVE_DIR_R974_DATA__,M='+json.dumps(table,ensure_ascii=False,separators=(',',':'))+';\n'
   'if(D&&D.enemies)for(const k of Object.keys(M))for(const V of M[k]){const E=D.enemies[k];if(!E)D.enemies[k]=V;else{const A=E.alt||(E.alt=[]);if(A.indexOf(V)<0)A.push(V);}}\n'
   "window.__STORYWORLD_MOVE_DIR_R1190__=Object.freeze({rev:'R1190-u204mid-down-1',ids:Object.freeze(Object.keys(M)),joined:!!(D&&D.enemies)});})();\n")
  (R/'client-source/move-dir-r1190-data.js').write_text(js,encoding='utf8');(R/'runtime-text/move-dir-r1190-data.js').write_text(js,encoding='utf8')
  (R/'r1190-u204mid-down.json').write_text(json.dumps({'round':'R1190','request':'CX-0129MV u204-mid down4 r1 ROUGH','files':rows},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  print('cell',C,'gain',[round(v,3) for v in g],'down',ent['dirs']['down'],'idle body',mb,'bbox',bb,'bytes',len(by))
if __name__=='__main__':main(sys.argv[1])
