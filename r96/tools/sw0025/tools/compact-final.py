from pathlib import Path
import argparse,hashlib,json
from graft import compact,read
p=argparse.ArgumentParser()
for name in ("hero","source","full","out"):p.add_argument(name)
a=p.parse_args()
j,b=read(a.full)
doc=compact(a.source,j,b,a.hero)
old,_=read(a.source)
assert j['materials'][:len(old['materials'])]==old['materials']
if len(j['materials'])!=len(old['materials']):
 m=j['materials'][len(old['materials']):]
 assert a.hero=="seoha" and len(m)==3
 for x in m:
  assert set(x)=={'name','doubleSided','pbrMetallicRoughness','emissiveFactor'}
  assert set(x['pbrMetallicRoughness'])=={'baseColorFactor','metallicFactor','roughnessFactor'}
 doc['append']['materials']=m
out=Path(a.out)
assert not out.exists()
out.write_text(json.dumps(doc,separators=(',',':'))+'\n')
