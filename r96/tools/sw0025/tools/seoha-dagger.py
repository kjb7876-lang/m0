import struct,json,pathlib,hashlib,math,sys
from scipy.spatial.transform import Rotation as R
source,out=map(pathlib.Path,sys.argv[1:]); assert not out.exists() and source!=out
def pack(p):return struct.pack('<I4s',len(p[0]),p[1])+p[0]
def gen():
 src=source.read_bytes()
 jn=struct.unpack_from('<I',src,12)[0]; dj=json.loads(src[20:20+jn]); assert src[24+jn:28+jn]==b'BIN\0'
 old=src[28+jn:]; data=bytearray(old)
 olddoc=json.loads(src[20:20+jn])
 def push(vals,typ):
  dims=len(vals[0]); fmt='f' if typ==5126 else 'H'; b=struct.pack('<'+fmt*(len(vals)*dims),*(x for v in vals for x in v))
  data.extend(b'\0'*(-len(data)%4)); offset=len(data);data.extend(b)
  v=len(dj['bufferViews']);dj['bufferViews'].append(dict(buffer=0,byteOffset=offset,byteLength=len(b)))
  i=len(dj['accessors']);dj['accessors'].append(dict(bufferView=v,componentType=typ,count=len(vals),type={1:'SCALAR',3:'VEC3'}[dims],min=list(map(min,zip(*vals))),max=list(map(max,zip(*vals)))));return i
 # Stylized cyan crescent shard with indigo binding and brass jewel; game-only proportions.
 def extr(poly,depth,col):
  xyz=[(x,y,z) for z in (depth,-depth) for x,y in poly];n=len(poly); tri=[]
  for i in range(1,n-1):tri+= [(0,i,i+1),(n,n+i+1,n+i)]
  for i in range(n):
   k=(i+1)%n; tri +=[(i,k,n+k),(i,n+k,n+i)]
  coords=[];norms=[]
  for i,j,k in tri:
   a,b,c=[xyz[q] for q in (i,j,k)]
   u=[y-x for x,y in zip(a,b)];v=[y-x for x,y in zip(a,c)]
   nn=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];l=math.sqrt(sum(z*z for z in nn))
   if l>0:
    norms +=[tuple(z/l for z in nn)]*3; coords.extend([a,b,c])
  m=len(dj['materials']);dj['materials'].append(dict(name=col[0],doubleSided=True,pbrMetallicRoughness=dict(baseColorFactor=col[1],metallicFactor=.22,roughnessFactor=.5),emissiveFactor=col[2]))
  return dict(attributes=dict(POSITION=push(coords,5126),NORMAL=push(norms,5126)),material=m)
 prim=[
 extr([(-.022,.017),(.021,.017),(.026,.082),(.016,.162),(0,.216),(-.019,.171),(-.029,.078)],.009,('Blue steel sleeve shard',[.29,.45,.51,1],[.016,.055,.065])),
 extr([(-.042,.000),(.042,.000),(.052,.017),(.04,.046),(-.04,.046),(-.05,.021)],.022,('Muted steel hilt',[.43,.49,.50,1],[.013,.016,.017])),
 extr([(-.039,-.107),(.039,-.107),(.051,-.070),(.050,-.013),(.035,.013),(-.035,.013),(-.051,-.013),(-.052,-.073)],.024,('Dark wrist wrap',[.045,.057,.073,1],[0,0,0]))]
 mesh=len(dj['meshes']);dj['meshes'].append(dict(name='Seoha_Attack_DecorativeShard',primitives=prim))
 socket=next(i for i,node in enumerate(dj['nodes']) if node.get('name')=='Weapon_Socket_R'); idx=len(dj['nodes'])
 dj['nodes'].append(dict(name='Seoha_Attack_DecorativeShard',mesh=mesh,translation=[.012,.040,.013],rotation=(R.from_quat(dj['nodes'][socket]['rotation']).inv()*R.from_euler('YXZ',[30,-12,10],degrees=True)).as_quat().tolist(),scale=[0,0,0]))
 assert 'children' not in dj['nodes'][socket];dj['nodes'][socket]['children']=[idx]
 a=next(x for x in dj['animations'] if x['name']=='Attack_EgoCast')
 times=[.03333333507180214,.18,7/30,8/30,.35,.45,.6666667461395264]
 s=len(a['samplers']);a['samplers'].append(dict(input=push([(t,) for t in times],5126),output=push([(x,x,x) for x in [0,0,.4,1,1,0,0]],5126),interpolation='LINEAR'));a['channels'].append(dict(sampler=s,target=dict(node=idx,path='scale')))
 dj['buffers'][0]['byteLength']=len(data);data.extend(b'\0'*(-len(data)%4)); jp=json.dumps(dj,separators=(',',':')).encode();jp+=b' '*(-len(jp)%4)
 # Every old binary byte retained and all original clips/channels/materials unchanged.
 assert data[:len(old)]==old
 for k in ('meshes','materials','accessors','bufferViews','skins'):
  assert dj[k][:len(olddoc[k])]==olddoc[k]
 assert dj['animations'][:2]==olddoc['animations'][:2] and a['channels'][:-1]==olddoc['animations'][2]['channels'] and a['samplers'][:-1]==olddoc['animations'][2]['samplers']
 assert all(olddoc['nodes'][i]==node for i,node in enumerate(dj['nodes'][:-1]) if i!=socket)
 out.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(jp)+len(data))+pack((jp,b'JSON'))+pack((data,b'BIN\0')))
 print(out.name,out.stat().st_size,hashlib.sha256(out.read_bytes()).hexdigest())
gen()
