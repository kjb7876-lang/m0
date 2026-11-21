import json,struct,sys,io
from PIL import Image
src,dst,size=sys.argv[1],sys.argv[2],int(sys.argv[3])
b=open(src,'rb').read();cl=struct.unpack('<I',b[12:16])[0];j=json.loads(b[20:20+cl])
bo=20+cl;bl=struct.unpack('<I',b[bo:bo+4])[0];bin_=b[bo+8:bo+8+bl]
imgviews={im['bufferView'] for im in j['images']}
out=bytearray();newviews=[]
for i,bv in enumerate(j['bufferViews']):
  data=bin_[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']]
  if i in imgviews:
    im=Image.open(io.BytesIO(data));im=im.resize((size,size),Image.LANCZOS);o=io.BytesIO()
    im.save(o,'WEBP',quality=88,method=6);data=o.getvalue()
  while len(out)%4:out.append(0)
  nb=dict(bv);nb['byteOffset']=len(out);nb['byteLength']=len(data);out+=data;newviews.append(nb)
while len(out)%4:out.append(0)
j['bufferViews']=newviews;j['buffers'][0]['byteLength']=len(out)
js=json.dumps(j,separators=(',',':')).encode()
while len(js)%4:js+=b' '
total=12+8+len(js)+8+len(out)
open(dst,'wb').write(struct.pack('<III',0x46546C67,2,total)+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(out),0x004E4942)+bytes(out))
print(dst,total)
