#!/usr/bin/env python3
"""R1243: Dots CX-0172BW-07 한리안(c103-mid, 이단의 목사) 오른쪽 걷기 8칸(ROUGH, 384칸) → 게임용 webp + R974 표에 더하는 옆 방향.
위·아래 시트는 아직 없어 그 방향은 R1224 떠서 이동(검은 안개)이 그대로 맡는다. 형태·자세는 Dots 원본 그대로, 색만 지금 그림 평균 색에 맞춘다(R974 규칙).
usage: python3 scripts/r1243-c103-walk.py <walkR png> <site 폴더>"""
import hashlib,importlib.util,io,json,sys
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';OUT=R/'runtime-text/assets/r1243/move'
sp=importlib.util.spec_from_file_location('r974',ROOT/'scripts/r974-move-dir.py');r974=importlib.util.module_from_spec(sp);sp.loader.exec_module(r974)
CELL,N=384,8;REL='boss-actions-20261011/c103-mid-poses.png';RECT=[255,0,270,520]
def main(src,site):
  OUT.mkdir(parents=True,exist_ok=True);whole=Image.open(Path(site)/'assets'/REL).convert('RGBA');cell=whole.crop((RECT[0],RECT[1],RECT[0]+RECT[2],RECT[1]+RECT[3]));a=np.asarray(cell)[...,3]
  idle=[{'path':'assets/'+REL,'rect':RECT,'size':list(whole.size),'bbox':r974.bbox(a),'body':r974.body(a)}];im0=r974.mean(cell)
  im=Image.open(src).convert('RGBA');assert im.size==(CELL*N,CELL),im.size
  px=np.asarray(im).reshape(-1,4).astype(np.float32);m1=px[px[:,3]>128][:,:3].mean(axis=0);g=[float(np.clip(im0[c]/max(1,m1[c]),.65,1.35)) for c in range(3)]
  o=r974.tone(im,g);A=np.asarray(o)[...,3];bbs=[r974.bbox(A[:,i*CELL:(i+1)*CELL]) for i in range(N)]
  py=float(np.median([q[3] for q in bbs]));vis=float(np.median([r974.body(A[:,i*CELL:(i+1)*CELL]) for i in range(N)]));pxc=float(np.median([(q[0]+q[2])/2 for q in bbs]))
  buf=io.BytesIO();o.save(buf,'WEBP',quality=88,method=6,exact=False);by=buf.getvalue();name='c103-mid-side.webp';(OUT/name).write_bytes(by)
  ent={'idle':idle,'cell':CELL,'n':N,'fps':8,'dirs':{'side':{'path':'assets/r1243/move/'+name,'px':round(pxc,1),'py':round(py,1),'vis':round(vis,1)}}}
  js=('// R1243 한리안(c103-mid) 옆 걷기 — scripts/r1243-c103-walk.py 가 만든다(손으로 고치지 않는다). Dots CX-0172BW-07 walkR(ROUGH). R974 표에 더한다.\n'
   '(()=>{const D=window.__STORYWORLD_MOVE_DIR_R974_DATA__,M='+json.dumps({'c103-mid':ent},ensure_ascii=False,separators=(',',':'))+';\n'
   'if(D&&D.enemies)for(const k of Object.keys(M))if(!D.enemies[k])D.enemies[k]=M[k];\n'
   "window.__STORYWORLD_MOVE_DIR_R1243__=Object.freeze({rev:'R1243-c103-walk-1',ids:Object.freeze(Object.keys(M)),joined:!!(D&&D.enemies)});})();\n")
  for d in ('client-source','runtime-text'):(R/d/'move-dir-r1243-data.js').write_text(js,encoding='utf8')
  row={'dots':'CX-0172BW-07','source':Path(src).name,'sourceSha256':hashlib.sha256(Path(src).read_bytes()).hexdigest(),'toneGain':[round(v,3) for v in g],'path':'assets/r1243/move/'+name,'size':list(o.size),'bytes':len(by),'sha256':hashlib.sha256(by).hexdigest(),'use':'한리안 옆 걷기 8칸','applied':True,'finalArt':False}
  (R/'r1243-c103-walk.json').write_text(json.dumps({'round':'R1243','request':'CX-0172BW','files':[row]},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  print(ent['idle'][0]['bbox'],ent['idle'][0]['body'],ent['dirs'],g,len(by))
if __name__=='__main__':main(sys.argv[1],sys.argv[2])
