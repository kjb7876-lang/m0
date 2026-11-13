#!/usr/bin/env python3
"""R1019: Dots CX-0082MV 추가1 2차 일반몹 위·아래 이동 시트(각 4칸, 384칸) → 게임용 webp + 표(move-dir-r1019-data.js, R974 엔진의 표에 더한다).
지금 게임이 그 몹을 실제로 그리는 그림(헤드리스 조사, r96/qa/r1001/actual-art.md, 걷는 칸 r96/qa/r1019/walk-rects.json)과 같은 인물인 것만 넣는다. 옆 걷기는 지금 그림 그대로.
원본은 지우거나 덮어쓰지 않는다. 형태·자세는 Dots 원본 그대로, 색만 지금 걷기 그림의 평균 색에 맞춘다(R974 와 같은 규칙).
usage: python3 scripts/r1019-mob-move.py <cx0082mv-add1 폴더> <site/assets 폴더>"""
import glob,hashlib,importlib.util,io,json,os,sys
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';OUT=R/'runtime-text/assets/r1019/move'
sp=importlib.util.spec_from_file_location('r974',ROOT/'scripts/r974-move-dir.py');r974=importlib.util.module_from_spec(sp);sp.loader.exec_module(r974)
CELL,N=384,4
def strip(w,h,n,y=0):return [[i*w,y,w,h] for i in range(n)]
# (Dots 폴더, 열쇠, 적 nativeId 들, [(지금 걷는 동안 그리는 그림, 칸들)…] — 첫 그림이 색 기준). 칸은 헤드리스 조사(r96/qa/r1019/walk-rects.json)에서 공격·피격이 아닐 때 실제로 그려진 칸.
def grid(w,h,cols,rows=1):return [[c*w,r*h,w,h] for r in range(rows) for c in range(cols)]
MAP=[
 ('004_legacy-m134-nightmare-v4','m134-nightmare',['c105-e2'],[('r380/mobs/legacy-m134-nightmare-v4-walk-d1.webp',[[c*192,0,192,256] for c in (0,4,5,6,7,8,9,10,11)])]),
 ('005_ep1b-steel-jaw-hound','steel-jaw-hound',['b09-h1'],[('r380/mobs/ep1b-steel-jaw-hound-walk-d1.webp',grid(320,320,9))]),
 ('014_superego-inquisitor','superego-inquisitor',['c106-e2'],[('r275/mobs/superego-inquisitor.webp',grid(76,186,6))]),
 ('020_hando-silver-seal-sentinel','silver-seal-sentinel',['h102-s1'],[('r380/mobs/hando-silver-seal-sentinel-walk-d1.webp',grid(320,320,9))]),
 ('021_hando-timeless-silver-scout','timeless-silver-scout',['h101-t1'],[('r380/mobs/hando-timeless-silver-scout-walk-d1.webp',grid(320,320,9))]),
 ('033_swamp-mage-darkgreen-v1','swamp-mage',['dist02-m1'],[('r380/mobs/swamp-mage-darkgreen-v1.webp',grid(256,256,4))]),
 ('043_m005','m005',['dist01-sp1','dist03-sp1'],[('r290/mobs/m005.webp',grid(256,320,4,2))]),
 ('M050_sloth_moldling','sloth-moldling',['b02-m1'],[('r198/mobs/M022-move.png',grid(342,156,2)),('r116/mobs/M022-idle.png',grid(239,156,4)),('episode1b/generated-v394/sloth_moldling.webp',None)]),
]
FULL=set()
HOLD={'M051_wrath_fire_beast':'불길 속의 늑대(b07-f1): 게임은 몸 전체에 용암 균열이 빛나는 r198 M030 걷기 그림을 쓰는데 시트는 어두운 몸에 갈기 불꽃만 있어, 게임 안에서 앞·뒤로 바뀔 때 불빛이 꺼진 듯 보임 — 7.6 으로 보류',
 '014 옆(side) 시트':'기계재판 연결자는 게임에 옆 걷기가 이미 있어 옆은 그대로 둔다. 위(up) 시트는 Dots 가 보내지 않아 아래만 적용'}
def main(src,site):
  src=Path(src);site=Path(site);OUT.mkdir(parents=True,exist_ok=True);table={};rows=[]
  for b,key,ids,arts in MAP:
    full=key in FULL
    idles=[];im0=None
    for rel,rects in arts:
      whole=Image.open(site/rel).convert('RGBA');wsz=list(whole.size)
      for rc in (rects or [[0,0]+wsz]):
        rc=list(rc);cell=whole.crop((rc[0],rc[1],rc[0]+rc[2],rc[1]+rc[3]));a=np.asarray(cell)[...,3]
        if not (a>16).any():continue
        bb=r974.bbox(a);idles.append({'path':'assets/'+rel,'rect':rc,'size':wsz,'bbox':bb,'body':(bb[3]-bb[1]) if full else r974.body(a)})
        if im0 is None:im0=r974.mean(cell)
    # 같은 그림의 걷기 칸끼리는 몸통 키·테두리를 가운데값 하나로 쓴다(칸마다 흩날리는 조각·팔 벌림이 달라 키가 들쭉날쭉하면 바꾼 그림 크기가 프레임마다 흔들린다)
    for rel in {i['path'] for i in idles}:
      grp=[i for i in idles if i['path']==rel];mb=int(np.median([i['body'] for i in grp]));bb=[int(np.median([i['bbox'][k] for i in grp])) for k in range(4)]
      for i in grp:i['body']=mb;i['bbox']=bb
    sheets={}
    for d in ('down','up'):
      f=glob.glob(str(src/b/('*walk-'+d+'.png')))
      if not f:continue
      im=Image.open(f[0]).convert('RGBA');assert im.size==(CELL*N,CELL),(b,d,im.size);sheets[d]=(f[0],im)
    pooled=np.concatenate([np.asarray(im).reshape(-1,4) for _,im in sheets.values()]).astype(np.float32);m1=pooled[pooled[:,3]>128][:,:3].mean(axis=0)
    g=[float(np.clip(im0[c]/max(1,m1[c]),.65,1.35)) for c in range(3)]
    ent={'idle':idles,'cell':CELL,'n':N,'fps':8,'dirs':{}}
    for d,(f,im) in sheets.items():
      o=r974.tone(im,g);a=np.asarray(o)[...,3];bbs=[r974.bbox(a[:,i*CELL:(i+1)*CELL]) for i in range(N)]
      py=float(np.median([q[3] for q in bbs]));vis=float(np.median([(q[3]-q[1]) if full else r974.body(a[:,i*CELL:(i+1)*CELL]) for i,q in enumerate(bbs)]));px=float(np.median([(q[0]+q[2])/2 for q in bbs]))
      buf=io.BytesIO();o.save(buf,'WEBP',quality=88,method=6,exact=False);by=buf.getvalue();name=key+'-'+d+'.webp';(OUT/name).write_bytes(by)
      ent['dirs'][d]={'path':'assets/r1019/move/'+name,'px':round(px,1),'py':round(py,1),'vis':round(vis,1)}
      rows.append({'dots':b,'enemies':ids,'dir':d,'source':'Dots CX-0082MV 추가1 '+b+'/'+os.path.basename(f),'sourceSha256':hashlib.sha256(Path(f).read_bytes()).hexdigest(),'toneGain':[round(v,3) for v in g],
        'path':'assets/r1019/move/'+name,'size':list(o.size),'bytes':len(by),'sha256':hashlib.sha256(by).hexdigest(),'use':'일반몹 위·아래 이동','applied':True})
    for i in ids:table[i]=ent
  for b,why in HOLD.items():rows.append({'dots':b,'applied':False,'why':why})
  js=('// R1019 일반몹 방향 이동 표(추가1 2차) — scripts/r1019-mob-move.py 가 만든다(손으로 고치지 않는다). R974 표(move-dir-r974-data.js)에 일반몹 nativeId 를 더한다.\n'
   '(()=>{const D=window.__STORYWORLD_MOVE_DIR_R974_DATA__,M='+json.dumps(table,ensure_ascii=False,separators=(',',':'))+';\n'
   'if(D&&D.enemies)for(const k of Object.keys(M))if(!D.enemies[k])D.enemies[k]=M[k];\n'
   "window.__STORYWORLD_MOVE_DIR_R1019__=Object.freeze({rev:'R1019-mob-move-1',ids:Object.freeze(Object.keys(M)),joined:!!(D&&D.enemies)});})();\n")
  (R/'client-source/move-dir-r1019-data.js').write_text(js,encoding='utf8');(R/'runtime-text/move-dir-r1019-data.js').write_text(js,encoding='utf8')
  (R/'r1019-mob-move.json').write_text(json.dumps({'round':'R1019','request':'CX-0082MV','files':rows},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  print(len(table),'ids',sum(1 for r in rows if r.get('applied')),'sheets',sum(r.get('bytes',0) for r in rows),'bytes')
  for k,v in table.items():print(k,[(i['path'].split('/')[-1],i['rect'][2:],i['body']) for i in v['idle'][:2]],{d:(q['px'],q['py'],q['vis']) for d,q in v['dirs'].items()})
if __name__=='__main__':main(sys.argv[1],sys.argv[2])
