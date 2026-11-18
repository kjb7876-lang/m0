#!/usr/bin/env python3
"""R1167: Dots CX-0082MV v6 B1 m040 이동문 청람잔영 위·아래 떠다님 4칸(r1 ROUGH) → 게임용 webp + 표(move-dir-r1167-data.js, R974 엔진 표에 더한다).
걷는 동안 실제로 그려지는 그림은 R1001 조사표(r96/qa/r1001/actual-art.md: c103-e1·h101-s1·h101-s2·h101-t1·u203-e1 → r410/mobs/m040.webp 100%)로 정했다.
같은 nativeId 가 이미 다른 그림으로 표에 있으면 기존 항목은 그대로 두고 alt 로 붙인다(R1125 와 같은 방식, 손질 함수는 R974·R1125 그대로).
원본은 지우거나 덮어쓰지 않는다. 형태·자세는 Dots 원본 그대로, 칸만 정사각형으로 투명 여백, 색은 지금 떠다님 그림의 평균 색에 맞춘다.
usage: python3 scripts/r1167-m040-move.py <Dots raw 폴더(m040-down4.png·m040-up4.png)> <site 폴더>"""
import hashlib,importlib.util,io,json,sys
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';OUT=R/'runtime-text/assets/r1167/move'
sp=importlib.util.spec_from_file_location('r974',ROOT/'scripts/r974-move-dir.py');r974=importlib.util.module_from_spec(sp);sp.loader.exec_module(r974)
N=4
def strip(w,h,cols,y=0):return [[c*w,y,w,h] for c in cols]
M040=['c103-e1','h101-s1','h101-s2','h101-t1','u203-e1']
# m040 시트 셋째 줄(640~)은 공격이라 떠다님에서 뺀다(R1125 m033 과 같음)
MAP=[('m040',M040,[('r410/mobs/m040.webp',strip(256,320,range(4),0)+strip(256,320,range(4),320))],{'down':'m040-down4.png','up':'m040-up4.png'},(256,320))]
HOLD={}
def square(im,cw,ch):
  c=max(cw,ch);o=Image.new('RGBA',(c*N,c),(0,0,0,0))
  for i in range(N):o.alpha_composite(im.crop((i*cw,0,(i+1)*cw,ch)),(i*c+(c-cw)//2,c-ch))
  return o,c
def main(src,site):
  src=Path(src);site=Path(site);OUT.mkdir(parents=True,exist_ok=True);table={};rows=[]
  for key,ids,arts,dirs,(cw,ch) in MAP:
    idles=[];im0=None
    for rel,rects in arts:
      whole=Image.open(site/'assets'/rel).convert('RGBA');wsz=list(whole.size)
      for rc in rects:
        cell=whole.crop((rc[0],rc[1],rc[0]+rc[2],rc[1]+rc[3]));a=np.asarray(cell)[...,3]
        if not (a>16).any():continue
        bb=r974.bbox(a);idles.append({'path':'assets/'+rel,'rect':rc,'size':wsz,'bbox':bb,'body':r974.body(a)})
        if im0 is None:im0=r974.mean(cell)
    for rel in {i['path'] for i in idles}:
      grp=[i for i in idles if i['path']==rel];mb=int(np.median([i['body'] for i in grp]));bb=[int(np.median([i['bbox'][k] for i in grp])) for k in range(4)]
      for i in grp:i['body']=mb;i['bbox']=bb
    sheets={}
    for d,f in dirs.items():
      im=Image.open(src/f).convert('RGBA');assert im.size==(cw*N,ch),(f,im.size);sq,C=square(im,cw,ch);sheets[d]=(src/f,sq)
    pooled=np.concatenate([np.asarray(im).reshape(-1,4) for _,im in sheets.values()]).astype(np.float32);m1=pooled[pooled[:,3]>128][:,:3].mean(axis=0)
    g=[float(np.clip(im0[c]/max(1,m1[c]),.65,1.35)) for c in range(3)]
    ent={'idle':idles,'cell':C,'n':N,'fps':8,'dirs':{}}
    for d,(f,im) in sheets.items():
      o=r974.tone(im,g);a=np.asarray(o)[...,3];bbs=[r974.bbox(a[:,i*C:(i+1)*C]) for i in range(N)]
      py=float(np.median([q[3] for q in bbs]));vis=float(np.median([r974.body(a[:,i*C:(i+1)*C]) for i in range(N)]));px=float(np.median([(q[0]+q[2])/2 for q in bbs]))
      buf=io.BytesIO();o.save(buf,'WEBP',quality=88,method=6,exact=False);by=buf.getvalue();name=key+'-'+d+'.webp';(OUT/name).write_bytes(by)
      ent['dirs'][d]={'path':'assets/r1167/move/'+name,'px':round(px,1),'py':round(py,1),'vis':round(vis,1)}
      rows.append({'dots':str(Path(f).relative_to(src)),'enemies':ids,'dir':d,'source':'Dots '+Path(f).name,'sourceSha256':hashlib.sha256(Path(f).read_bytes()).hexdigest(),'toneGain':[round(v,3) for v in g],
        'path':'assets/r1167/move/'+name,'size':list(o.size),'bytes':len(by),'sha256':hashlib.sha256(by).hexdigest(),'use':'일반몹 위·아래 떠다님','applied':True})
    for i in ids:table.setdefault(i,[]).append(ent)
  for b,why in HOLD.items():rows.append({'dots':b,'applied':False,'why':why})
  js=('// R1167 일반몹 위·아래 떠다님 표(Dots CX-0082MV v6 B1 m040 이동문 청람잔영 r1 ROUGH) — scripts/r1167-m040-move.py 가 만든다(손으로 고치지 않는다). R974 표에 더한다.\n'
   '(()=>{const D=window.__STORYWORLD_MOVE_DIR_R974_DATA__,M='+json.dumps(table,ensure_ascii=False,separators=(',',':'))+';\n'
   '// 없는 번호는 첫 그림을 본 항목으로, 이미 있는 번호(다른 그림)는 기존 값을 덮지 않고 alt 에 붙인다. 엔진은 지금 그려진 대기 그림에 맞는 쪽을 고른다.\n'
   'if(D&&D.enemies)for(const k of Object.keys(M))for(const V of M[k]){const E=D.enemies[k];if(!E)D.enemies[k]=V;else{const A=E.alt||(E.alt=[]);if(A.indexOf(V)<0)A.push(V);}}\n'
   "window.__STORYWORLD_MOVE_DIR_R1167__=Object.freeze({rev:'R1167-m040-move-1',ids:Object.freeze(Object.keys(M)),joined:!!(D&&D.enemies)});})();\n")
  (R/'client-source/move-dir-r1167-data.js').write_text(js,encoding='utf8');(R/'runtime-text/move-dir-r1167-data.js').write_text(js,encoding='utf8')
  (R/'r1167-m040-move.json').write_text(json.dumps({'round':'R1167','request':'CX-0082MV v6 B1 m040','files':rows},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  print(len(table),'ids',sum(1 for r in rows if r.get('applied')),'sheets',sum(r.get('bytes',0) for r in rows),'bytes')
  for key,ids,*_ in MAP:
    V=[x for x in table[ids[0]] if any('m040' in i['path'] for i in x['idle'])][0];print(key,V['cell'],[(i['path'].split('/')[-1],i['rect'],i['body']) for i in V['idle'][:1]],{d:(q['px'],q['py'],q['vis']) for d,q in V['dirs'].items()})
if __name__=='__main__':main(sys.argv[1],sys.argv[2])
