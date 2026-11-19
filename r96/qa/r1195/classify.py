import json,glob,sys
import numpy as np
from PIL import Image
SITE='/home/user/m0/r96/hospital-three-pc/site/'
def classify(a):
  sh,sw=a.shape
  if sw<8 or sh<8: return None
  soft=(a>=40).sum(1);hard=(a>=200).sum(1);maxW=soft.max()
  nz=np.nonzero(soft)[0]
  if len(nz)==0 or maxW<6: return None
  last=nz[-1];out={}
  sf=a>=40
  tight=(int(sf[0,:].sum()>=2)+int(sf[-1,:].sum()>=2)+int(sf[:,0].sum()>=2)+int(sf[:,-1].sum()>=2))>=3
  ye=sh-1 if hard[sh-1]>=hard[sh-2] else sh-2
  if (not tight) and hard[ye]>=max(4,.06*maxW) and soft[sh-1]>0: out['bottom']='edge'
  else:
    y3=max(0,last-3)
    if hard[last]>=max(8,.22*maxW) and hard[last]>=.6*soft[last] and soft[y3]<=soft[last]*1.35+3: out['bottom']='art'
  for nm,x in ((() if tight else (('left',0),('right',sw-1)))):
    xi=1 if x==0 else sw-2
    if ((a[:,x]>=200)|((a[:,x]>=40)&(a[:,xi]>=200))).sum()>=max(6,.04*sh): out[nm]=1
  return out
B={}
for f in glob.glob('s1.jsonl')+glob.glob('s2.jsonl')+glob.glob('sm.jsonl'):
  for l in open(f):
    j=json.loads(l)
    for k,v in j['bodies'].items():
      b=B.setdefault(k,{'names':set(),'regions':set(),'boss':v['boss'] or v['mid']})
      b['names'].update(v['names']);b['regions'].add(j['id'])
imgs={};rows=[]
for k,b in B.items():
  p,r=k.split('|');r=[int(x) for x in r.split(',')]
  if p in('original-actor-canvas','?') or not p.startswith('assets'): continue
  try:
    if p not in imgs: imgs[p]=np.asarray(Image.open(SITE+p).convert('RGBA'))[...,3]
    a=imgs[p][r[1]:r[1]+r[3],r[0]:r[0]+r[2]]
  except Exception as e: continue
  c=classify(a)
  if c: rows.append((p,r,c,b))
print('bodies',len(B),'flagged',len(rows))
by={}
for p,r,c,b in rows:
  n=sorted(b['names'])[0]; e=by.setdefault(p,{'names':set(),'cells':0,'kinds':set(),'regions':set(),'boss':False})
  e['names'].update(b['names']);e['cells']+=1;e['kinds'].update(f"{x}:{y}" if x=='bottom' else x for x,y in c.items());e['regions'].update(b['regions']);e['boss']|=b['boss']
with open('cut-table.tsv','w') as f:
  f.write('그림\t몹 이름\t잘린 칸 수\t잘림 종류\t보스·중간보스\t구역\n')
  for p,e in sorted(by.items(),key=lambda x:-x[1]['cells']):
    f.write(f"{p}\t{', '.join(sorted(e['names'])[:3])}\t{e['cells']}\t{' '.join(sorted(e['kinds']))}\t{'예' if e['boss'] else ''}\t{' '.join(sorted(e['regions'])[:6])}\n")
print(open('cut-table.tsv').read()[:4000])
