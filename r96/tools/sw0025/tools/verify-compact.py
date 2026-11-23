from pathlib import Path
import argparse,base64,hashlib,json
from graft import read
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('full');p.add_argument('compact');a=p.parse_args()
j,b=read(a.source);cp=json.loads(Path(a.compact).read_text());j2,b2=read(a.full)
assert cp['version']==1 and len(b)==cp['sourceBinBytes']
assert hashlib.sha256(Path(a.source).read_bytes()).hexdigest()==cp['sourceSha256']
assert cp['animation']['name'].startswith('Attack_') and j['animations'][cp['animationIndex']]['name']==cp['animation']['name']
j['animations'][cp['animationIndex']]=cp['animation']
for k,v in cp['parentChildren'].items():j['nodes'][int(k)].setdefault('children',[]).extend(v)
for k,v in cp['append'].items():j[k].extend(v)
b+=base64.b64decode(cp['binBase64'],validate=True);j['buffers'][0]['byteLength']=len(b)
assert j==j2 and b==b2
print(cp['hero'],'compact reconstruction exact on parsed JSON and BIN; transport',Path(a.compact).stat().st_size)
