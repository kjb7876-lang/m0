#!/usr/bin/env python3
"""R1125: Dots 몹 위·아래 걷기 시트(CX-0127MV m033 위·아래, CX-0135 B4 최종문 공명기사 위·아래, B7 잠식된 어부 아래) → 게임용 webp + 표(move-dir-r1125-data.js, R974 엔진 표에 더한다).
걷는 동안 실제로 그려지는 그림·칸은 헤드리스 조사(r96/qa/r1125/census.mjs, r96/qa/r1125/census.json)와 R1001 조사표(r96/qa/r1001/actual-art.md)로 정했다.
같은 nativeId 가 이미 다른 그림으로 표에 있으면 기존 항목은 그대로 두고 alt(같은 번호의 다른 그림)로 붙인다 — R974 엔진이 지금 그린 대기 그림에 맞는 쪽을 고른다.
원본은 지우거나 덮어쓰지 않는다. 형태·자세는 Dots 원본 그대로, 칸만 정사각형으로 투명 여백을 더하고(엔진 표는 정사각 칸), 색은 지금 걷기 그림의 평균 색에 맞춘다(R974 규칙).
usage: python3 scripts/r1125-mob-move.py <dots-results 폴더> <site 폴더>"""
import hashlib,importlib.util,io,json,sys
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';OUT=R/'runtime-text/assets/r1125/move'
sp=importlib.util.spec_from_file_location('r974',ROOT/'scripts/r974-move-dir.py');r974=importlib.util.module_from_spec(sp);sp.loader.exec_module(r974)
N=4
def strip(w,h,cols,y=0):return [[c*w,y,w,h] for c in cols]
M033=['b09-c1','b09-h1','b09-o1','c104-e1','c104-e2','c106-e1','c106-e2','c106-e3','kair-guardian-25','kair-guardian-26','kair-guardian-27','kair-guardian-28','kair-guardian-43','kair-guardian-44','kair-guardian-46',
 'u201-e1','u201-e2','u201-e3','u202-e1','u202-e2','u202-e3','u203-e1','u203-e2','u203-e3','u204-e1','u204-e2','u204-e3','u205-e1','u205-e2','u205-e3','u206-e1','u206-e2','u206-e3']
# (열쇠, 적 nativeId 들, [(걷는 동안 그리는 그림, 칸들)…] (첫 그림이 색 기준), {방향: Dots 파일}, Dots 원 칸 [w,h])
MAP=[
 ('m033',M033,[('r410/mobs/m033.webp',strip(256,320,range(4),0)+strip(256,320,range(4),320))],
  {'down':'week/m033pair/CX-0127MV_r1_m033_walk-down.png','up':'week/m033pair/CX-0127MV_r1_m033_walk-up.png'},(256,320)),
 # 공명기사 시트 뒤 4칸(1024~)은 칼 휘두르기라 걷기에서 뺀다(조사: 걷는 동안 0·256 칸, 1280 은 공격 2회)
 ('u203-e3-mech',['c103-e1','c103-e3','h103-c1','h103-s1','h103-t1','u203-e3'],[('r374/mobs/u203-e3-mech.webp',strip(256,256,range(4)))],
  {'down':'cx0135/r4/cx0135-B4-u203e3/CX-0135_B4_u203-e3_down4_r1.png','up':'cx0135/r4/cx0135-B4-u203e3-up/CX-0135_B4_u203-e3_up4_r1.png'},(256,256)),
 # 어부: 엔진은 걷는 동안 fisher-walk(8칸), 멈칫할 때 fisher-idle(6칸)을 그린다. 위(뒷모습)는 Dots 시트가 없어 엔진 그림 그대로.
 ('fisher',['l302-e3'],[('r763/villagers/fisher-walk.webp',strip(256,256,range(8))),('r763/villagers/fisher-idle.webp',strip(256,256,range(6)))],
  {'down':'cx0135/r4/cx0135-B7-fisher/CX-0135_B7_fisher_south4_r1.png'},(256,256)),
]
HOLD={'CX-0135 B6 cult-mech-legs south4':'Dots ROUTING 메모 "검토 전용, 실제 접지 확인 전 자동 적용 금지" + 사용자 결정 전',
 'CX-0135 B7 fisher north(위)':'Dots 시트 없음 → 위로 걸을 때 엔진 옆 그림 그대로',
 'wrath-hound·swamp-root 위·아래':'CX-0135 r5 는 피격 4칸(hit4)뿐, 위·아래 걷기 시트 없음',
 'CX-0127MV u203-e3 위·아래 r1':'Dots HOLD(걸음 높이·무기 손) → CX-0135 B4 로 대체'}
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
      ent['dirs'][d]={'path':'assets/r1125/move/'+name,'px':round(px,1),'py':round(py,1),'vis':round(vis,1)}
      rows.append({'dots':str(Path(f).relative_to(src)),'enemies':ids,'dir':d,'source':'Dots '+Path(f).name,'sourceSha256':hashlib.sha256(Path(f).read_bytes()).hexdigest(),'toneGain':[round(v,3) for v in g],
        'path':'assets/r1125/move/'+name,'size':list(o.size),'bytes':len(by),'sha256':hashlib.sha256(by).hexdigest(),'use':'일반몹 위·아래 이동','applied':True})
    for i in ids:table.setdefault(i,[]).append(ent)
  for b,why in HOLD.items():rows.append({'dots':b,'applied':False,'why':why})
  js=('// R1125 일반몹 위·아래 이동 표(Dots CX-0127MV m033·CX-0135 B4 공명기사·B7 어부) — scripts/r1125-mob-move.py 가 만든다(손으로 고치지 않는다). R974 표에 더한다.\n'
   '(()=>{const D=window.__STORYWORLD_MOVE_DIR_R974_DATA__,M='+json.dumps(table,ensure_ascii=False,separators=(',',':'))+';\n'
   '// 없는 번호는 첫 그림을 본 항목으로, 이미 있는 번호(다른 그림)는 기존 값을 덮지 않고 alt 에 붙인다. 엔진은 지금 그려진 대기 그림에 맞는 쪽을 고른다.\n'
   'if(D&&D.enemies)for(const k of Object.keys(M))for(const V of M[k]){const E=D.enemies[k];if(!E)D.enemies[k]=V;else{const A=E.alt||(E.alt=[]);if(A.indexOf(V)<0)A.push(V);}}\n'
   "window.__STORYWORLD_MOVE_DIR_R1125__=Object.freeze({rev:'R1125-mob-move-1',ids:Object.freeze(Object.keys(M)),joined:!!(D&&D.enemies)});})();\n")
  (R/'client-source/move-dir-r1125-data.js').write_text(js,encoding='utf8');(R/'runtime-text/move-dir-r1125-data.js').write_text(js,encoding='utf8')
  (R/'r1125-mob-move.json').write_text(json.dumps({'round':'R1125','request':'CX-0127MV·CX-0135','files':rows},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  print(len(table),'ids',sum(1 for r in rows if r.get('applied')),'sheets',sum(r.get('bytes',0) for r in rows),'bytes')
  for key,ids,*_ in MAP:
    V=table[ids[0]][-1] if key!='m033' else table[ids[0]][0];print(key,V['cell'],[(i['path'].split('/')[-1],i['rect'],i['body']) for i in V['idle'][:1]],{d:(q['px'],q['py'],q['vis']) for d,q in V['dirs'].items()})
if __name__=='__main__':main(sys.argv[1],sys.argv[2])
