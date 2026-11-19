# hprobe 결과(json)의 각 그림 칸에서 불투명(알파>40) 몸 높이 비율을 재어 화면 '보이는 키'로 바꿔 그림별로 비교한다.
import json,sys,re,collections
from PIL import Image
import numpy as np
site,js=sys.argv[1],sys.argv[2];rows=json.load(open(js));cache={}
def vis(src,sr):
  m=re.match(r'(assets/.+?\.(?:webp|png|jpg))(?::(\d+),(\d+),(\d+),(\d+))?',src)
  if not m:return None
  p=m.group(1);rc=[int(m.group(i)) for i in range(2,6)] if m.group(2) else None
  k=(p,tuple(rc) if rc else None,sr)
  if k in cache:return cache[k]
  try:im=Image.open(f'{site}/{p}').convert('RGBA')
  except Exception:return None
  if rc:im=im.crop((rc[0],rc[1],rc[0]+rc[2],rc[1]+rc[3]))
  a=np.asarray(im)[...,3];ys=np.where((a>40).any(1))[0];xs=np.where((a>40).any(0))[0]
  if not len(ys):return None
  # 렌더된 rect(sr)는 바깥 테두리 패딩을 더한 캔버스: 비율 보정
  sw,sh=[int(v) for v in sr.split(',')[2:4]] if sr else im.size;padh=(sh-im.height)/2
  r=( (ys.max()+1-ys.min())/sh, (ys.max()+1+padh)/sh );cache[k]=r;return r
g=collections.defaultdict(list)
for r in rows:
  v=vis(r['src'],r['sr'])
  if not v:continue
  key=re.sub(r':\d+:enemy$','',r['src']).split('/')[-1][:70]
  g[key].append((r['h']*v[0],r['top']+r['h']*v[1],r['mode']+('A' if r['att'] else '')))
allv=[]
for k,v in g.items():
  hs=[x[0] for x in v];allv+=hs;print(f"{k:72} n={len(v):2} 보이는키={min(hs):.0f}~{max(hs):.0f} 발={min(x[1] for x in v):.0f}~{max(x[1] for x in v):.0f} {''.join(sorted(set(x[2] for x in v)))}")
if allv:print(f'전체 보이는 키 {min(allv):.0f}~{max(allv):.0f} 비 {max(allv)/min(allv):.2f}')
