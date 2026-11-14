#!/usr/bin/env python3
"""R1029: 걷는 동안 그림이 한 장뿐인 몹·보스의 '떠서 이동' 8칸 시트 → webp + 표(move-float-r1029-data.js, R974 엔진이 그림으로 찾아 쓴다).
사용자 2026-11-14: 날개 달린 것은 날개를 펄럭이며, 유령형은 아랫자락을 흩날리며, 그 밖은 다리 쪽을 짙은 흑색 불꽃·안개 구름으로 덮어 떠다니게.
원본 그림은 그대로 두고(지우거나 덮어쓰지 않음) 그 그림에서 만든다: 몸은 원본 그대로, 날개 바깥쪽만 위아래로(wing)·아랫자락만 좌우로 물결(ghost)·몸 전체 오르내림.
발밑 안개는 게임에 이미 있는 R430 안개 시트(assets/r430/mist-loop.webp, 20칸)를 검게 물들여 쓴다. 대상·유형은 r96/qa/r1029/static-arts.json(헤드리스 전수 조사).
usage: python3 scripts/r1029-move-float.py <site/assets 폴더>"""
import hashlib,io,json,math,re,sys
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';OUT=R/'runtime-text/assets/r1029/float'
N,FPS,MAXH=8,8,256;PAD=(.16,.08,.16,.10)  # 왼·위·오른·아래(칸 크기 대비)
def mist_frames():
  im=Image.open(R/'runtime-text/assets/r430/mist-loop.webp').convert('RGBA');cells=[im.crop((c*192,r*192,c*192+192,r*192+192)) for r in range(4) for c in range(6)]
  cells=[c for c in cells if np.asarray(c)[...,3].max()>16][:20];pick=[cells[round(i*len(cells)/N)%len(cells)] for i in range(N)]
  a=np.max([np.asarray(c)[...,3] for c in pick],axis=0);ys,xs=np.where(a>10);box=(xs.min(),ys.min(),xs.max()+1,ys.max()+1);out=[]
  for c in pick:
    p=np.asarray(c.crop(box)).astype(np.float32);L=(p[...,:3]@np.array([.3,.59,.11],np.float32))/255;al=np.clip((p[...,3]/255)**.55*1.45,0,1)
    rgb=np.stack([7+L*38,5+L*24,11+L*58],-1);out.append(Image.fromarray(np.dstack([np.clip(rgb,0,255),al*255]).astype(np.uint8),'RGBA'))
  return out
def body_box(a):
  # 몸 덩어리: 빈 줄(키의 3% 이상)로 떨어진 바닥 문양·조각은 빼고 가장 키 큰 덩어리의 테두리
  rows=(a>16).any(axis=1);h=len(rows);gap=max(2,int(.03*h));segs=[];y=0
  while y<h:
    if rows[y]:
      s=y;e=y;z=y
      while z<h and (rows[z] or z-e<=gap):
        if rows[z]:e=z
        z+=1
      segs.append((s,e+1));y=z
    else:y+=1
  s,e=max(segs,key=lambda q:q[1]-q[0]);xs=np.where((a[s:e]>16).any(axis=0))[0];return (int(xs.min()),int(s),int(xs.max())+1,int(e))
def warp(p,bb,kind,ph):
  x0,y0,x1,y1=bb;bw,bh=x1-x0,y1-y0;o=p.copy()
  if kind=='ghost':
    for y in range(y0,y1):
      t=(y-y0)/bh
      if t>.55:
        k=((t-.55)/.45)**1.4;dx=int(round(.05*bw*k*math.sin(ph+t*10)));o[y]=np.roll(p[y],dx,axis=0);o[y,:,3]=(o[y,:,3]*(1-.5*k)).astype(np.uint8)
  elif kind=='wing':
    cx=(x0+x1)/2
    for x in range(x0,x1):
      u=abs(x-cx)/(bw/2)
      if u>.38:
        k=((u-.38)/.62)**1.2;dy=int(round(.09*bh*k*math.sin(ph)));o[:,x]=np.roll(p[:,x],dy,axis=0)
  return o
def main(site):
  site=Path(site);OUT.mkdir(parents=True,exist_ok=True);arts=json.loads((R/'qa/r1029/static-arts.json').read_text());mist=mist_frames();table={};rows=[];used=set()
  for A in arts:
    rel,rc,kind=A['path'],A['rect'],A['kind'];whole=Image.open(site/rel).convert('RGBA');cell=whole.crop((rc[0],rc[1],rc[0]+rc[2],rc[1]+rc[3]));p=np.asarray(cell).copy();w,h=cell.size
    bb=body_box(p[...,3]);bw,bh=bb[2]-bb[0],bb[3]-bb[1]
    ox,oy=int(round(PAD[0]*w)),int(round(PAD[1]*h));CW,CH=w+ox+int(round(PAD[2]*w)),h+oy+int(round(PAD[3]*h));cx=ox+(bb[0]+bb[2])//2
    mh=int(.38*bh);mw=int(min(CW,max(1.15*bw,mh*1.7)));my=min(CH-mh,oy+bb[3]+int(.07*bh)-mh);mx=max(0,min(CW-mw,cx-mw//2));tw,th=int(mw*.62),int(mh*1.35);tx,ty=max(0,min(CW-tw,cx-tw//2)),my+mh-th-int(.02*bh)
    ma={'mist':1.,'ghost':.8,'wing':.6,'hover':.5}[kind];lift={'mist':.012,'ghost':.016,'wing':.02,'hover':.022}[kind]
    ramp=np.clip(np.linspace(0,1,mh)/.28,0,1)[:,None];sc=min(1.,MAXH/CH);cw,ch=int(round(CW*sc)),int(round(CH*sc));sheet=Image.new('RGBA',(cw*N,ch),(0,0,0,0))
    for f in range(N):
      ph=2*math.pi*f/N;m=np.asarray(mist[f].resize((mw,mh),Image.LANCZOS)).astype(np.float32)
      back=m.copy();back[...,3]*=.95*ma;front=m.copy();front[...,3]*=1.0*ma*ramp;tong=np.asarray(mist[(f+N//2)%N].transpose(Image.FLIP_LEFT_RIGHT).resize((tw,th),Image.LANCZOS)).astype(np.float32);tong[...,3]*=.6*ma
      cv=Image.new('RGBA',(CW,CH),(0,0,0,0));cv.alpha_composite(Image.fromarray(tong.astype(np.uint8),'RGBA'),(tx,ty));cv.alpha_composite(Image.fromarray(back.astype(np.uint8),'RGBA'),(mx,my))
      bob=-int(round(lift*bh*(1+math.sin(ph))));cv.alpha_composite(Image.fromarray(warp(p,bb,kind,ph),'RGBA'),(ox,oy+bob))
      cv.alpha_composite(Image.fromarray(front.astype(np.uint8),'RGBA'),(mx,my));sheet.paste(cv.resize((cw,ch),Image.LANCZOS),(f*cw,0))
    slug=re.sub(r'[^a-z0-9]+','-',Path(rel).stem.lower()).strip('-')[-40:].strip('-');base=slug;i=2
    while slug in used:slug=f'{base}-{i}';i+=1
    used.add(slug);q=78
    while True:
      buf=io.BytesIO();sheet.save(buf,'WEBP',quality=q,method=4);by=buf.getvalue()
      if len(by)<380000 or q<=50:break
      q-=8
    (OUT/(slug+'.webp')).write_bytes(by);key=rel+'|'+','.join(str(v) for v in rc)
    table[key]={'path':'assets/r1029/float/'+slug+'.webp','n':N,'fps':FPS,'cw':cw,'ch':ch,'pad':[round(ox/w,4),round(oy/h,4),round((CW-w-ox)/w,4),round((CH-h-oy)/h,4)],'kind':kind}
    rows.append({'who':A['who'],'source':'assets/'+rel,'sourceRect':rc,'sourceSha256':hashlib.sha256((site/rel).read_bytes()).hexdigest(),'kind':kind,'mist':'assets/r430/mist-loop.webp(검게 물들임)',
      'path':'assets/r1029/float/'+slug+'.webp','size':[cw*N,ch],'bytes':len(by),'sha256':hashlib.sha256(by).hexdigest(),'use':'이동 그림이 없는 몹·보스의 떠서 이동(임시 연출, Dots 방향 시트가 오면 그 방향은 시트가 먼저)','applied':True})
  js=('// R1029 떠서 이동 표 — scripts/r1029-move-float.py 가 만든다(손으로 고치지 않는다). 열쇠 = 걷는 동안 그려지는 몸 그림 경로|칸. R974 엔진(move-dir-r974.js)이 방향 시트가 없을 때 쓴다.\n'
      'window.__STORYWORLD_MOVE_FLOAT_R1029_DATA__='+json.dumps({'revision':'R1029','arts':table},ensure_ascii=False,separators=(',',':'))+';\n')
  for d in ('client-source','runtime-text'):(R/d/'move-float-r1029-data.js').write_text(js)
  (R/'r1029-move-float.json').write_text(json.dumps({'revision':'R1029','rows':rows},ensure_ascii=False,indent=1))
  print(len(rows),'sheets',sum(r['bytes'] for r in rows),'bytes')
if __name__=='__main__':main(sys.argv[1])
