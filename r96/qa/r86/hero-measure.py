import json,sys
from pathlib import Path
from PIL import Image
rows=json.loads(Path(sys.argv[1]).read_text());root=Path(sys.argv[2]);images={};metrics={};invalid=[];blank=[];calibrated=[];raised=[];ranges={};worst=0
for r in rows:
 p=r['path']; f=r['frame'];x,y,w,h=f['sourceRect']
 if p not in images:images[p]=Image.open(root/p).convert('RGBA')
 im=images[p]
 if min(x,y)<0 or w<=0 or h<=0 or x+w>im.width+.001 or y+h>im.height+.001:invalid.append(r['key']);continue
 key=(p,tuple(f['sourceRect']))
 if key not in metrics:
  crop=im.crop((round(x),round(y),round(x+w),round(y+h)));metrics[key]=crop.getchannel('A').point(lambda a:255 if a>=24 else 0).getbbox()
 b=metrics[key]
 if not b:blank.append(r['key']);continue
 height=(b[3]-b[1])*66*r['scale']/f['visibleHeight'];foot=(f['pivot'][1]-b[3])*66*r['scale']/f['visibleHeight'];worst=max(worst,abs(foot));ranges.setdefault(r['hero'],[]).append(height)
 if r['native'].get('r83RenderOnly'):calibrated.append({'key':r['key'],'height':height,'target':44 if r['scale']<1 else 66})
 if height>80:raised.append({'key':r['key'],'height':height,'bodyTarget':r['native']['bodyTarget']})
print(json.dumps({'images':len(images),'uniqueCrops':len(metrics),'invalidCrops':invalid,'blank':blank,'worstFootGap66':worst,'calibrated':calibrated,'raisedWeapons':raised,'heroRanges':{k:[min(v),max(v)]for k,v in ranges.items()}}))
