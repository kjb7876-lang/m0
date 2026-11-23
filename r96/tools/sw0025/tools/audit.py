from pathlib import Path
import argparse, struct, hashlib, json
from graft import read,HERO_CLIPS
p=argparse.ArgumentParser();p.add_argument('stock');p.add_argument('review');p.add_argument('authors',nargs='?');a=p.parse_args()
review=Path(a.review); rows=[]
for hero,clip in sorted(HERO_CLIPS.items()):
 n=hero+'-3d.glb';s=Path(a.stock)/n;f=review/'full'/n;d=review/'compact'/(hero+'.runtime-delta.json')
 j,b=read(s);k,c=read(f);delta=json.loads(d.read_text());assert c.startswith(b)
 assert k['images']==j['images'] and k['textures']==j['textures'] and k['skins']==j['skins']
 assert k['materials'][:len(j['materials'])]==j['materials']
 assert k['bufferViews'][:len(j['bufferViews'])]==j['bufferViews'] and k['accessors'][:len(j['accessors'])]==j['accessors']
 assert [x for x in k['animations'] if x['name']!=clip]==[x for x in j['animations'] if x['name']!=clip]
 sizes=[]
 for i in j['images']:
  assert i['mimeType']=='image/webp'
  v=j['bufferViews'][i['bufferView']];start=v.get('byteOffset',0);x=b[start:start+v['byteLength']]
  assert x[:4]==b'RIFF' and x[8:12]==b'WEBP' and struct.unpack_from('<I',x,4)[0]+8==len(x)
  if x[12:16]==b'VP8X': w,h=(1+int.from_bytes(x[q:q+3],'little') for q in (24,27))
  elif x[12:16]==b'VP8L':
   assert x[20]==47;t=int.from_bytes(x[21:25],'little');w=1+(t&16383);h=1+((t>>14)&16383)
  elif x[12:16]==b'VP8 ':
   assert x[23:26]==b'\x9d\x01\x2a';w,h=(z&16383 for z in struct.unpack_from('<HH',x,26))
  else: raise AssertionError(x[12:16])
  assert (w,h)==(512,512)
  sizes.append(f'{w}×{h}')
 aa=delta['animation'];old=j['animations'][delta['animationIndex']]
 changed=[aa['samplers'][x['sampler']] for x in aa['channels'] if x['sampler']>=len(old['samplers'])]
 assert all(k['accessors'][x[y]]['componentType']==5126 and not k['accessors'][x[y]].get('normalized',False) for x in changed for y in ('input','output'))
 if hero in ('hunter','gunner'):
  targets=[(k['nodes'][x['target']['node']].get('name',''),x['target']['path']) for x in aa['channels'] if x['sampler']>=len(old['samplers'])]
  assert not any(any(y in t.lower() for y in ('hip','knee','ankle','pelvis','thigh','shin','foot','leg')) for t,path in targets if path=='rotation'), targets
 sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
 rows.append(dict(hero=hero,clip=clip,sourceSha256=sha(s),fullSha256=sha(f),compactSha256=sha(d),authorSha256=sha((Path(a.authors) if a.authors else review/'authors')/(hero+'.json')),compactBytes=d.stat().st_size,webpSizes=sizes,editedAttackChannels=len(changed)))
 print(hero, sizes, len(changed),d.stat().st_size)
print('compact total',sum(x['compactBytes'] for x in rows))
(review/'provenance/manifest.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False)+'\n')
