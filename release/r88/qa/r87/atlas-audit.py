from pathlib import Path
import hashlib,json
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];SITE=ROOT/'hospital-three-pc/site'
text=(ROOT/'client-source/painted-vfx-data-r87.js').read_text();data=json.loads(text.split('=',1)[1].strip().removesuffix(';'))
checks=[];rows=[]
def check(name,passed,detail=None):
 checks.append({'name':name,'passed':bool(passed),'detail':detail})
for kind,spec in data.items():
 p=SITE/spec['path'];im=Image.open(p);im.load()
 check(kind+' atlas decodes to exact source RGBA dimensions',im.mode=='RGBA' and list(im.size)==spec['size'])
 hashes=[];border=[];nonempty=[]
 for f in spec['frames']:
  x,y,w,h=f['rect'];crop=im.crop((x,y,x+w,y+h));alpha=crop.getchannel('A');hashes.append(hashlib.sha256(crop.tobytes()).hexdigest());nonempty.append(alpha.getbbox() is not None)
  edge=[alpha.crop((0,0,w,1)).getextrema()[1],alpha.crop((0,h-1,w,h)).getextrema()[1],alpha.crop((0,0,1,h)).getextrema()[1],alpha.crop((w-1,0,w,h)).getextrema()[1]];border.append(max(edge))
 check(kind+' painted frames are distinct and have transparent outer cell edges',len(set(hashes))==len(hashes) and max(border)==0,{'frames':len(hashes),'maximumBorderAlpha':max(border)})
 if kind=='poison':check('Poison has15 nonempty frames and a fully transparent termination',nonempty==[True]*15+[False])
 rows.append({'kind':kind,'size':list(im.size),'frames':len(hashes),'RGBABytes':im.width*im.height*4,'frameHashes':hashes,'nonempty':nonempty})
check('Three original atlas sources are unchanged',all(hashlib.sha256((SITE/v['path']).read_bytes()).hexdigest()==v['sha256'] for v in data.values()))
report={'checks':checks,'passed':all(v['passed'] for v in checks),'atlases':rows,'browserVerified':False,'GPUVerified':False}
(Path(__file__).parent/'atlas-results.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['passed'],len(checks))
if not report['passed']:raise SystemExit(1)
