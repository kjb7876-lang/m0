#!/usr/bin/env python3
"""R700: 보스 그림 전수조사(7대죄 우선). 그림마다 크기·보이는 상자·잘림·배경·윤곽선·팔레트·발 줄을 재서
r96/qa/r700/audit.json 과 audit.md 표로 쓴다. 판정 기준은 아래 상수. 사이트(빌드 결과)나 runtime-text 에서 그림을 읽는다.
usage: python3 scripts/r700-boss-art-audit.py"""
import json,re,colorsys,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
BASES=[ROOT/'r96/runtime-text',ROOT/'r96/hospital-three-pc/site']
OUT=ROOT/'r96/qa/r700'
SINS={'b02-boss':('ep1b02','나태'),'b03-boss':('ep1b03','질투'),'b04-boss':('ep1b04','탐식'),'b05-boss':('ep1b05','색욕'),
      'b06-boss':('ep1b06','탐욕(맘몬, 보고만)'),'b06b-boss':('ep1b06b','탐욕2(맘몬, 보고만)'),'b07-boss':('ep1b07','분노'),'b08-boss':('ep1b08','교만')}
def find(rel):
  rel=re.sub(r'^\./','',rel)
  for b in BASES:
    if (b/rel).exists():return b/rel
  return None
def cells(path,meta):
  """시트면 칸들로, 아니면 한 장."""
  im=Image.open(path).convert('RGBA')
  if meta and meta.get('cell'):
    cw,ch=meta['cell'];n=im.width//cw
    return [im.crop((i*cw,0,(i+1)*cw,ch)) for i in range(n)]
  if meta and meta.get('n'):
    n=meta['n'];cw=im.width//n
    return [im.crop((i*cw,0,(i+1)*cw,im.height)) for i in range(n)]
  return [im]
def measure(im):
  a=im.getchannel('A');W,H=im.size
  bb=a.point(lambda v:255 if v>40 else 0).getbbox()
  if not bb:return {'empty':True}
  x0,y0,x1,y1=bb
  px=im.load();al=a.load()
  # 잘림: 캔버스 가장자리 줄의 불투명 비율
  def edge(xs,ys):
    c=[al[x,y]>128 for x in xs for y in ys];return sum(c)/max(1,len(c))
  cut={'top':edge(range(W),[0]),'bottom':edge(range(W),[H-1]),'left':edge([0],range(H)),'right':edge([W-1],range(H))}
  # 배경: 네 모서리 8px 상자 불투명 + 전체 불투명 비율
  corners=sum(1 for (cx,cy) in [(0,0),(W-8,0),(0,H-8),(W-8,H-8)] if sum(al[cx+i,cy+j]>128 for i in range(8) for j in range(8))>40)
  # 윤곽선: 몸 가장자리(투명 이웃이 있는 불투명 픽셀)의 명도 / 안쪽 명도
  step=max(1,(x1-x0)*(y1-y0)//60000)
  edgeL=[];inL=[];sat=[];val=[];hues=[];semi=0;opq=0
  for y in range(y0,y1,1 if step==1 else 2):
    for x in range(x0,x1,1 if step==1 else 2):
      A=al[x,y]
      if A<=40:continue
      r,g,b,_=px[x,y];h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
      opq+=1
      if A<230:semi+=1
      nb=any(al[min(W-1,max(0,x+dx)),min(H-1,max(0,y+dy))]<=40 for dx,dy in ((2,0),(-2,0),(0,2),(0,-2)))
      (edgeL if nb else inL).append(v)
      sat.append(s);val.append(v)
      if s>.25 and v>.2:hues.append(h)
  mean=lambda L:sum(L)/len(L) if L else 0
  # 대표 색상(채도 있는 픽셀의 색상 12칸 중 최빈)
  hb=[0]*12
  for h in hues:hb[int(h*12)%12]+=1
  dom=max(range(12),key=lambda i:hb[i])*30 if hues else None
  colors=len(set(im.crop(bb).convert('RGB').quantize(64).get_flattened_data()))
  return {'size':[W,H],'bbox':[x0,y0,x1,y1],'visH':y1-y0,'visW':x1-x0,'fill':round((x1-x0)*(y1-y0)/(W*H),3),
    'footY':round(y1/H,3),'centerX':round((x0+x1)/2/W,3),'cut':{k:round(v,3) for k,v in cut.items()},'bgCorners':corners,
    'outline':round(mean(edgeL)/max(.01,mean(inL)),3),'edgeV':round(mean(edgeL),3),'sat':round(mean(sat),3),'val':round(mean(val),3),
    'domHue':dom,'chromaShare':round(len(hues)/max(1,opq),3),'semi':round(semi/max(1,opq),3),'q64':colors}
def main():
  s=(BASES[0]/'index.html').read_text(encoding='utf8');dec=json.JSONDecoder()
  rows={}
  for m in re.finditer(r'\{"id":"([^"]+)","name"',s):
    try:o,_=dec.raw_decode(s[m.start():])
    except ValueError:continue
    if isinstance(o,dict) and o.get('boss') and o.get('actionSpritesByPhase'):rows[o['id']]=o
  r104=json.loads(re.search(r'freeze\((\{.*\})\)',(ROOT/'r96/client-source/bosses-r104-data.js').read_text(encoding='utf8')).group(1))
  r380=json.loads(find('assets/r380/mobs/index.json').read_text(encoding='utf8'))
  r620=(ROOT/'r96/client-source/boss-motion-r620.js').read_text(encoding='utf8')
  r620sheets=json.loads(re.sub(r'(\w+):',r'"\1":',re.search(r'const SHEETS=(\{.*?\}\}\});',r620).group(1)).replace("'",'"').replace('"assets/generated','"assets/generated')) if 'const SHEETS=' in r620 else {}
  out={}
  for bid,o in rows.items():
    zone=SINS.get(bid,(None,''))[0]
    arts=[]
    p0=o['actionSpritesByPhase'][0]
    for k in ('idle','attackA','hit','death'):
      arts.append(('phase0.'+k,p0.get(k),None))
    for i,ph in enumerate(o['actionSpritesByPhase'][1:],1):arts.append((f'phase{i}.idle',ph.get('idle'),None))
    if bid in r104:
      for f in r104[bid]['frames']:arts.append(('r104.'+f['path'][-7:-5],f['path'],None))
    for mob in r380['mobs']:
      a=mob['actor']
      if a.get('boss') and zone and a.get('zone')==zone:arts.append(('r380.strip',mob['path'],mob))
    for src,sh in r620sheets.items():
      if src.split('/')[-1] in json.dumps(o):
        for k in ('idle','hit'):arts.append(('r620.'+k,sh[k]['path'],{'n':sh[k]['n']}))
    seen=set();res=[]
    for role,p,meta in arts:
      if not p:res.append({'role':role,'path':None,'missing':True});continue
      p=re.sub(r'^\./','',p)
      if (role,p) in seen:continue
      seen.add((role,p));f=find(p)
      if not f:res.append({'role':role,'path':p,'missing':True});continue
      cs=cells(f,meta);ms=[measure(c) for c in cs]
      res.append({'role':role,'path':p,'frames':len(cs),'m':ms[0],'all':ms if len(ms)>1 else None})
    out[bid]={'name':o['name'],'zone':zone,'sin':SINS.get(bid,(None,''))[1],'phaseNames':o.get('phaseNames'),'arts':res}
  OUT.mkdir(parents=True,exist_ok=True)
  (OUT/'audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=1),encoding='utf8')
  print(len(out),'bosses')
if __name__=='__main__':main()
