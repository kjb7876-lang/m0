#!/usr/bin/env python3
from pathlib import Path
import argparse, base64, copy, hashlib, json, math, struct
HERO_CLIPS={'ego':'Attack_AwakenedBurst','gunner':'Attack_AimFire','hunter':'Attack_BowShot','lauren':'Attack_LanceThrust','michaela':'Attack_HealPulse','neon':'Attack_EgoCast','persona':'Attack_EgoCast','seoha':'Attack_EgoCast','slayer':'Attack_DownCleave'}
TYPES={'rotation':('VEC4',4),'translation':('VEC3',3),'scale':('VEC3',3)}
def read(p):
 b=Path(p).read_bytes();magic,ver,end=struct.unpack_from('<4sII',b);assert (magic,ver,end)==(b'glTF',2,len(b))
 nl,kind=struct.unpack_from('<I4s',b,12);assert kind==b'JSON';j=json.loads(b[20:20+nl])
 p=20+nl;bl,kind=struct.unpack_from('<I4s',b,p);assert kind==b'BIN\0' and p+8+bl==len(b)
 assert j['buffers'][0]['byteLength']==bl
 return j,b[p+8:]
def build(j,b):
 m=json.dumps(j,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode();m+=b' '*((-len(m))%4)
 return struct.pack('<4sII',b'glTF',2,28+len(m)+len(b))+struct.pack('<I4s',len(m),b'JSON')+m+struct.pack('<I4s',len(b),b'BIN\0')+b
def unpack(j,b,i):
 a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];assert v['buffer']==0 and not a.get('sparse') and 'extensions' not in v and a['componentType'] in (5126,5122)
 n={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']];o=v.get('byteOffset',0)+a.get('byteOffset',0);ct=a['componentType'];char,size={5126:('f',4),5122:('h',2)}[ct];stride=v.get('byteStride',n*size)
 rows=[struct.unpack_from('<'+char*n,b,o+k*stride) for k in range(a['count'])]
 return [tuple(max(x/32767,-1) for x in q) for q in rows] if ct==5122 and a.get('normalized') else rows
def append(j,b,typ,rows,minmax=False):
 assert len(b)%4==0
 off=len(b);n=len(rows[0]);b.extend(struct.pack('<'+'f'*(n*len(rows)),*(x for row in rows for x in row)))
 i=len(j['bufferViews']);j['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(b)-off})
 a={'bufferView':i,'componentType':5126,'count':len(rows),'type':typ}
 if minmax:
  vals=struct.unpack_from('<'+'f'*len(rows),b,off)
  assert all(x<y for x,y in zip(vals,vals[1:])),'Float32 key collapse'
  a.update(min=[vals[0]],max=[vals[-1]])
 j['accessors'].append(a);return len(j['accessors'])-1
def verify(j,b,original,old,clip,props=()):
 assert b.startswith(old)
 allowed={'bufferViews','accessors','buffers','animations'}
 if props:allowed|={'nodes','meshes'}
 for k in original:
  if k not in allowed: assert j[k]==original[k],k
 for k in ('bufferViews','accessors'):assert j[k][:len(original[k])]==original[k]
 assert j['buffers'][1:]==original['buffers'][1:] and j['buffers'][0]=={**original['buffers'][0],'byteLength':len(b)}
 assert [a for a in j['animations'] if a['name']!=clip]==[a for a in original['animations'] if a['name']!=clip]
 if props:
  nodes=copy.deepcopy(original['nodes'])
  for i,pr in enumerate(props):nodes[pr['parentId']].setdefault('children',[]).append(len(original['nodes'])+i)
  assert j['nodes'][:len(nodes)]==nodes
  assert j['meshes'][:len(original['meshes'])]==original['meshes']
  assert len(j['meshes'])==len(original['meshes'])+len(props) and len(j['nodes'])==len(nodes)+len(props)

def add_prop(j,b,ns,p,hero):
 name,parent=p['name'],p['parent'];assert name.startswith('contact-') and name not in ns
 assert parent in ns and (parent in ('Weapon_Socket_L','Weapon_Socket_R') or parent==hero+'_Weapon')
 positions,normals,indices=p['positions'],p['normals'],p['indices'];m=p['material']
 assert isinstance(m,int) and 0<=m<len(j['materials'])
 n=len(positions);assert 3<=n<=2048 and len(normals)==n and 3<=len(indices)<=12288 and len(indices)%3==0
 assert all(len(p)==3 and all(math.isfinite(x) and abs(x)<=10 for x in p) for p in positions)
 assert all(len(q)==3 and all(math.isfinite(x) for x in q) and abs(sum(x*x for x in q)-1)<.02 for q in normals)
 assert all(type(i)is int and 0<=i<n for i in indices)
 a=append(j,b,'VEC3',positions);ac=j['accessors'][a]
 decoded=unpack(j,b,a);ac['min']=[min(v) for v in zip(*decoded)];ac['max']=[max(v) for v in zip(*decoded)]
 g=append(j,b,'VEC3',normals)
 o=len(b);b.extend(struct.pack('<'+'H'*len(indices),*indices));v=len(j['bufferViews'])
 j['bufferViews'].append({'buffer':0,'byteOffset':o,'byteLength':len(indices)*2,'target':34963})
 b.extend(b'\x00'*((-len(b))%4));k=len(j['accessors']);j['accessors'].append({'bufferView':v,'componentType':5123,'count':len(indices),'type':'SCALAR'})
 mesh=len(j['meshes']);j['meshes'].append({'name':name,'primitives':[{'attributes':{'POSITION':a,'NORMAL':g},'indices':k,'material':m,'mode':4}]})
 node=len(j['nodes']);entry={'name':name,'mesh':mesh}
 for key in ('translation','rotation','scale'):
  if key not in p:continue
  v=list(p[key]);assert len(v)==TYPES[key][1] and all(math.isfinite(i) and abs(i)<=10 for i in v)
  if key=='scale':assert all(i>=0 for i in v)
  entry[key]=unit(v) if key=='rotation' else v
 j['nodes'].append(entry)
 ns[name]=node;parentId=ns[parent];j['nodes'][parentId].setdefault('children',[]).append(node)
 return {'parentId':parentId}
def unit(q):
 n=math.sqrt(sum(x*x for x in q));assert n>.000001
 return [x/n for x in q]
def patch(source,delta):
 j0,b0=read(source);j=copy.deepcopy(j0);b=bytearray(b0)
 hero=delta['hero'];clip=HERO_CLIPS[hero];assert Path(source).name==hero+'-3d.glb' and delta['clip']==clip
 expected=delta.get('sourceSha256')
 if expected:assert hashlib.sha256(Path(source).read_bytes()).hexdigest()==expected
 a,=filter(lambda a:a['name']==clip,j['animations']); ns={}
 for i,n in enumerate(j['nodes']):
  name=n.get('name')
  if name: assert name not in ns;ns[name]=i
 start=math.inf;end=-math.inf
 for s in a['samplers']:
  assert s.get('interpolation','LINEAR') in ('LINEAR','STEP'),'Unexpected stock CUBICSPLINE; handle tangents separately'
  samples=unpack(j0,b0,s['input']);start=min(start,samples[0][0]);end=max(end,samples[-1][0])
 props=[add_prop(j,b,ns,pr,hero) for pr in delta.get('props',[])]
 seen=set();assert delta['channels']
 for c in delta['channels']:
  n,path=c['node'],c['path'];assert n in ns and path in TYPES and (n,path) not in seen;seen.add((n,path))
  assert path!='scale' or ns[n]>=len(j0['nodes']),'Scale is versioned prop-only'
  typ,w=TYPES[path];ip=c.get('interpolation','LINEAR');assert ip in ('STEP','LINEAR')
  t=list(c['times']);v=list(c['values']);assert 1<=len(t)==len(v)<=1024
  assert all(math.isfinite(x) and start-1e-6<=x<=end+1e-6 for x in t) and all(x < y for x,y in zip(t,t[1:]))
  # Clamp only representational end rounding, never change clip duration.
  t=[max(start,min(end,x)) for x in t]
  assert all(len(r)==w and all(math.isfinite(x) for x in r) for r in v)
  if path=='scale':assert all(all(0<=x<=10 for x in r) for r in v)
  if path=='rotation':
   v=[unit(q) for q in v]
   for k in range(1,len(v)):
    if sum(x*y for x,y in zip(v[k-1],v[k]))<0:v[k]=[-x for x in v[k]]
  dest={'node':ns[n],'path':path}; matches=[x for x in a['channels'] if x['target']==dest]
  assert len(matches)<=1 and (matches or c.get('newChannel') is True),'Existing node but non-stock channel; explicitly mark newChannel true'
  ix=append(j,b,'SCALAR',[(x,) for x in t],True); ox=append(j,b,typ,v)
  sm=len(a['samplers']);a['samplers'].append({'input':ix,'output':ox,'interpolation':ip})
  if matches:matches[0]['sampler']=sm
  else:a['channels'].append({'sampler':sm,'target':dest})
 used=[unpack(j,b,a['samplers'][c['sampler']]['input']) for c in a['channels']]
 assert min(xs[0][0] for xs in used)==start and max(xs[-1][0] for xs in used)==end,'Changed attack clip duration'
 j['buffers'][0]['byteLength']=len(b);verify(j,b,j0,b0,clip,props)
 return j,b
def compact(source,j,b,hero):
 j0,b0=read(source);clip=HERO_CLIPS[hero]
 ix=next(i for i,a in enumerate(j['animations']) if a['name']==clip)
 n0=len(j0['nodes'])
 return {'version':1,'hero':hero,'sourceSha256':hashlib.sha256(Path(source).read_bytes()).hexdigest(),
  'sourceBinBytes':len(b0),'animationIndex':ix,'animation':j['animations'][ix],
  'append':{'accessors':j['accessors'][len(j0['accessors']):],'bufferViews':j['bufferViews'][len(j0['bufferViews']):],
  'nodes':j['nodes'][n0:],'meshes':j['meshes'][len(j0['meshes']):]},
  'parentChildren':{str(i):n['children'][len(j0['nodes'][i].get('children',[])):] for i,n in enumerate(j['nodes'][:n0]) if n!=j0['nodes'][i]},
  'binBase64':base64.b64encode(b[len(b0):]).decode()}
def main():
 p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('delta');p.add_argument('output');p.add_argument('--compact-out');a=p.parse_args()
 out=Path(a.output);assert not out.exists() and Path(a.source).resolve()!=out.resolve()
 delta=json.loads(Path(a.delta).read_text());j,b=patch(a.source,delta);data=build(j,b)
 out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(data)
 if a.compact_out:
  p=Path(a.compact_out);assert not p.exists();p.parent.mkdir(parents=True,exist_ok=True)
  p.write_text(json.dumps(compact(a.source,j,b,delta['hero']),separators=(',',':'),ensure_ascii=False,allow_nan=False)+'\n')
 print(out,hashlib.sha256(data).hexdigest())
if __name__=='__main__':main()
