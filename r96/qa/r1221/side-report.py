#!/usr/bin/env python3
"""R1221 옆 이동 전수 결과 정리: side-census.json → 일반 몹 이름별 분류.
 분류: walk(옆걸음 그림 2장 이상, R1029 떠서 이동 아님) · float(R1029 떠서 이동 안개 시트뿐) · single(한 장) · mixed(일부 개체만 한 장)
usage: python3 side-report.py side-census.json [out.tsv]"""
import json,sys,re,collections
d=json.load(open(sys.argv[1]));rows=collections.defaultdict(list)
def kind(side):
  ks=[k for k,v in side.items()]
  if not ks:return 'none'
  fl=[k for k in ks if '/r1029/float/' in k];body=[k for k in ks if '/r1029/float/' not in k]
  if len(set(body))>=2:return 'walk'
  if fl:return 'float'
  return 'single'
for z,v in d.items():
  for r in v.get('rows',[]) or []:
    if r['boss'] or '중간보스' in r['name']:continue
    nm=re.sub(r'\s+(우두머리|증원|추격대|후속 증원)$','',r['name'])
    L,R=kind(r['left']),kind(r['right']);main=max(r['left'].items(),key=lambda x:x[1])[0] if r['left'] else (max(r['right'].items(),key=lambda x:x[1])[0] if r['right'] else '')
    rows[(z,nm)].append((L,R,main,r['nativeId']))
out=[];cnt=collections.Counter()
for (z,nm),a in sorted(rows.items()):
  kinds=set(x[0] for x in a)|set(x[1] for x in a)
  k='walk' if kinds=={'walk'} else ('float' if kinds<= {'float','walk'} and 'float' in kinds and 'walk' not in kinds else ('single' if kinds<= {'single','none'} else 'mixed:'+'/'.join(sorted(kinds))))
  cnt[k.split(':')[0]]+=1
  out.append((z,nm,k,len(a),sorted(set(x[3] for x in a))[0],sorted(set(x[2] for x in a))[0]))
if len(sys.argv)>2:
  with open(sys.argv[2],'w') as f:
    f.write('zone\tname\tside\tcount\tnativeId\tmainArt\n');[f.write('\t'.join(map(str,o))+'\n') for o in out]
print(dict(cnt))
for o in out:
  if o[2]!='walk':print('\t'.join(map(str,o)))
