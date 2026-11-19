#!/usr/bin/env python3
"""R1221: 옆 이동 그림이 없는(걷는 동안 한 장이 미끄러지는) 몹에 '옆' 방향 이동 시트를 기존 걷기 칸으로 만들어 R974 표에 더한다.
사용자 2026-11-19 10:04Z "이동모션 없으면 좌측이동모션은 꼭 넣어주고 우측은 좌우반전해서 적용해서 옆방향이동모션은 꼭 넣어줘",
10:42Z "일곱기둥에 늪지대보스랑 똑같은 몹 나오는데 그거 사용하면 되잖아"(늪의 뿔악마 군주 ← 일곱 기둥 '소환진 순례악마' 걷기 M008).
- 그림은 새로 그리지 않는다: 같은 인물의 게임 안 걷기 칸(원본은 지우거나 덮어쓰지 않음)을 384칸 4프레임 시트로 옮기고 색만 대상 그림 평균에 맞춘다(R974 와 같은 규칙).
- 원본 걷기 칸이 왼쪽을 보면 '좌측 이동'이 원본 그대로가 되도록, R974 규칙(옆 시트는 오른쪽을 보는 그림, 왼쪽으로 가면 엔진이 뒤집음)에 맞춰 시트에는 좌우를 뒤집어 넣는다.
- 이미 R974 표에 있는 적은 비어 있는 '옆'만 더한다(있는 값은 덮지 않는다).
- 11-19 12:2xZ: Dots CX-0169SW 시간수문장 좌측 걷기(사용자 승인 10종 34·40·05·07·08·10·13·16·15·20, _ROUGH)를 DOTS 표로 더한다.
  이미 384칸·발 357 인 시트라 다시 그리지 않고, 칸마다 몸통(위 절반) 가로 흔들림을 75% 줄여 중심을 맞추고(지지발 미끄러짐·몸통 흔들림 보정), 좌우를 뒤집어 넣고, 색을 게임 그림 평균에 맞춘다.
usage: python3 scripts/r1221-side-move.py <site/assets 폴더> [Dots CX-0169SW 폴더(기본 /mnt/project-files/dots-results/cx0169sw)]"""
import hashlib,importlib.util,io,json,sys
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';OUT=R/'runtime-text/assets/r1221/side'
sp=importlib.util.spec_from_file_location('r974',ROOT/'scripts/r974-move-dir.py');r974=importlib.util.module_from_spec(sp);sp.loader.exec_module(r974)
CELL,N,FILL=384,4,.82
def strip(w,h,n,y=0):return [[i*w,y,w,h] for i in range(n)]
# (열쇠, 적 nativeId 들, 대상 그림(걷는 동안 지금 한 장으로 그려지는 그림과 칸들 — 첫 그림이 색 기준), 걷기 원본(그림, 칸들), 원본이 보는 쪽)
TARGETS=[
 ('swamp-horned-lord',['mb-dist02'],[('r104/bosses/mb-dist02-p4.webp',None),('r104/bosses/mb-dist02-p1.webp',None),('r104/bosses/mb-dist02-p2.webp',None)],('r109/mobs/M008-move.png',strip(148,158,4)),'left'),
 ('denial-specter',['a10-s1'],[('episode1a/generated-v392/denial_specter.webp',None)],('r92/mobs/M016-move.png',strip(141,172,4)),'front'),
]
# (열쇠, 적 nativeId 들, 대상 그림, Dots 시트 파일 이름) — Dots 시트는 왼쪽을 본다
GV='generated-v3125/kair-guardians/guardian_%s.webp'
DOTS=[('kair-guardian-%s'%n,['kair-guardian-%s'%n],[(GV%n,[[0,0,192,192]])],'CX-0169SW_guardian_%s_walkL_r1_ROUGH.png'%n) for n in ['34','40','05','07','08','10','13','16','15','20','24']]
SWAY=.75
def idle_list(site,arts):
  idles=[];im0=None
  for rel,rects in arts:
    whole=Image.open(site/rel).convert('RGBA');wsz=list(whole.size)
    for rc in (rects or [[0,0]+wsz]):
      cell=whole.crop((rc[0],rc[1],rc[0]+rc[2],rc[1]+rc[3]));a=np.asarray(cell)[...,3]
      if not (a>16).any():continue
      idles.append({'path':'assets/'+rel,'rect':list(rc),'size':wsz,'bbox':r974.bbox(a),'body':r974.body(a)})
      if im0 is None:im0=r974.mean(cell)
  return idles,im0
def finish(key,ids,idles,im0,sheet,n,table,rows,extra):
  m1=np.asarray(sheet).reshape(-1,4).astype(np.float32);m1=m1[m1[:,3]>128][:,:3].mean(axis=0)
  gain=[float(np.clip(im0[c]/max(1,m1[c]),.75,1.3)) for c in range(3)];o=r974.tone(sheet,gain);a=np.asarray(o)[...,3]
  qs=[r974.bbox(a[:,i*CELL:(i+1)*CELL]) for i in range(n)]
  py=float(np.median([q[3] for q in qs]));px=float(np.median([(q[0]+q[2])/2 for q in qs]));vis=float(np.median([r974.body(a[:,i*CELL:(i+1)*CELL]) for i in range(n)]))
  buf=io.BytesIO();o.save(buf,'WEBP',quality=88,method=6,exact=False);by=buf.getvalue();name=key+'-side.webp';(OUT/name).write_bytes(by)
  table.update({i:{'idle':idles,'cell':CELL,'n':n,'fps':8,'dirs':{'side':{'path':'assets/r1221/side/'+name,'px':round(px,1),'py':round(py,1),'vis':round(vis,1)}}} for i in ids})
  rows.append({'key':key,'enemies':ids,'dir':'side',**extra,'toneGain':[round(v,3) for v in gain],'path':'assets/r1221/side/'+name,'size':list(o.size),'bytes':len(by),'sha256':hashlib.sha256(by).hexdigest(),'applied':True,'final':False})
def dots(site,folder,table,rows):
  for key,ids,arts,fname in DOTS:
    f=Path(folder)/fname
    if not f.exists():print('없음(건너뜀)',fname);continue
    idles,im0=idle_list(site,arts);src=Image.open(f).convert('RGBA');n=src.width//CELL
    frames=[src.crop((i*CELL,0,(i+1)*CELL,CELL)).transpose(Image.FLIP_LEFT_RIGHT) for i in range(n)]
    tor=[]
    for g in frames:
      c=np.asarray(g)[...,3]>16;ys,xs=np.nonzero(c);top,bot=ys.min(),ys.max();ty,tx=np.nonzero(c[top:top+max(1,int((bot-top)*.5))]);tor.append(float(tx.mean()))
    med=float(np.median(tor));sheet=Image.new('RGBA',(CELL*n,CELL),(0,0,0,0));shifts=[]
    for i,(g,t) in enumerate(zip(frames,tor)):
      dx=round((CELL/2-med)-SWAY*(t-med));shifts.append(dx);b=r974.bbox(np.asarray(g)[...,3]);dy=round(CELL*.93)-b[3]
      sheet.alpha_composite(g,(i*CELL+dx,dy))
    finish(key,ids,idles,im0,sheet,n,table,rows,{'source':'Dots '+fname,'sourceSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'sourceFacing':'left','flippedIntoSheet':True,
      'frames':n,'torsoSwayPx':round(max(tor)-min(tor),1),'shiftsPx':shifts,'use':'옆 이동(왼쪽=Dots 원본 방향, 오른쪽=좌우반전)','note':'Dots CX-0169SW _ROUGH, 사용자 승인 10종. 몸통 흔들림 75% 보정·색 맞춤만'})
def main(site,dots_dir='/mnt/project-files/dots-results/cx0169sw'):
  site=Path(site);OUT.mkdir(parents=True,exist_ok=True);table={};rows=[]
  for key,ids,arts,(wrel,wrects),facing in TARGETS:
    idles=[];im0=None
    for rel,rects in arts:
      whole=Image.open(site/rel).convert('RGBA');wsz=list(whole.size)
      for rc in (rects or [[0,0]+wsz]):
        cell=whole.crop((rc[0],rc[1],rc[0]+rc[2],rc[1]+rc[3]));a=np.asarray(cell)[...,3]
        if not (a>16).any():continue
        bb=r974.bbox(a);idles.append({'path':'assets/'+rel,'rect':list(rc),'size':wsz,'bbox':bb,'body':r974.body(a)})
        if im0 is None:im0=r974.mean(cell)
    src=Image.open(site/wrel).convert('RGBA');frames=[src.crop((r[0],r[1],r[0]+r[2],r[1]+r[3])) for r in wrects]
    # 몸 테두리를 칸마다 모아 같은 배율로(프레임마다 크기가 흔들리지 않게), 발은 칸 아래 쪽 같은 줄에
    bbs=[r974.bbox(np.asarray(f)[...,3]) for f in frames];bw=max(b[2]-b[0] for b in bbs);bh=max(b[3]-b[1] for b in bbs);k=min(CELL*FILL/bh,CELL*FILL/bw)
    sheet=Image.new('RGBA',(CELL*N,CELL),(0,0,0,0))
    for i,(f,b) in enumerate(zip(frames,bbs)):
      g=f.resize((max(1,round(f.width*k)),max(1,round(f.height*k))),Image.LANCZOS)
      if facing=='left':g=g.transpose(Image.FLIP_LEFT_RIGHT)
      gb=r974.bbox(np.asarray(g)[...,3]);foot=round(CELL*.93);cx=CELL//2
      sheet.alpha_composite(g,(i*CELL+cx-round((gb[0]+gb[2])/2),foot-gb[3]))
    m1=np.asarray(sheet).reshape(-1,4).astype(np.float32);m1=m1[m1[:,3]>128][:,:3].mean(axis=0)
    gain=[float(np.clip(im0[c]/max(1,m1[c]),.75,1.3)) for c in range(3)];o=r974.tone(sheet,gain);a=np.asarray(o)[...,3]
    qs=[r974.bbox(a[:,i*CELL:(i+1)*CELL]) for i in range(N)]
    py=float(np.median([q[3] for q in qs]));px=float(np.median([(q[0]+q[2])/2 for q in qs]));vis=float(np.median([r974.body(a[:,i*CELL:(i+1)*CELL]) for i in range(N)]))
    buf=io.BytesIO();o.save(buf,'WEBP',quality=88,method=6,exact=False);by=buf.getvalue();name=key+'-side.webp';(OUT/name).write_bytes(by)
    table.update({i:{'idle':idles,'cell':CELL,'n':N,'fps':8,'dirs':{'side':{'path':'assets/r1221/side/'+name,'px':round(px,1),'py':round(py,1),'vis':round(vis,1)}}} for i in ids})
    rows.append({'key':key,'enemies':ids,'dir':'side','source':'assets/'+wrel,'sourceRects':wrects,'sourceSha256':hashlib.sha256((site/wrel).read_bytes()).hexdigest(),'sourceFacing':facing,
      'flippedIntoSheet':facing=='left','toneGain':[round(v,3) for v in gain],'path':'assets/r1221/side/'+name,'size':list(o.size),'bytes':len(by),'sha256':hashlib.sha256(by).hexdigest(),
      'use':'옆 이동(왼쪽=원본 방향, 오른쪽=좌우반전)','applied':True,'final':False,'note':'게임 안 같은 인물 걷기 칸 재사용(임시, Dots 정식 옆 걷기 오면 교체)'})
  dots(site,dots_dir,table,rows)
  js=('// R1221 옆 이동 표 — scripts/r1221-side-move.py 가 만든다(손으로 고치지 않는다). R974 표(move-dir-r974-data.js)에 옆 시트가 없던 적의 \'옆\'을 더한다.\n'
   '(()=>{const D=window.__STORYWORLD_MOVE_DIR_R974_DATA__,M='+json.dumps(table,ensure_ascii=False,separators=(',',':'))+';\n'
   '// 없는 적은 통째로 더하고, 이미 있는 적은 빠진 방향 시트만 더한다(있는 값은 덮지 않는다).\n'
   'if(D&&D.enemies)for(const k of Object.keys(M)){const E=D.enemies[k];if(!E)D.enemies[k]=M[k];else if(E.dirs)for(const d of Object.keys(M[k].dirs))if(!E.dirs[d])E.dirs[d]=M[k].dirs[d];}\n'
   "window.__STORYWORLD_MOVE_DIR_R1221__=Object.freeze({rev:'R1221-side-move-1',ids:Object.freeze(Object.keys(M)),joined:!!(D&&D.enemies)});})();\n")
  (R/'client-source/move-side-r1221-data.js').write_text(js,encoding='utf8');(R/'runtime-text/move-side-r1221-data.js').write_text(js,encoding='utf8')
  (R/'r1221-side-move.json').write_text(json.dumps({'round':'R1221','files':rows},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  print(len(table),'ids',sum(r['bytes'] for r in rows),'bytes')
  for k,v in table.items():print(k,len(v['idle']),v['dirs'])
if __name__=='__main__':main(*sys.argv[1:3])
