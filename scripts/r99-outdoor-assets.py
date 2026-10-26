#!/usr/bin/env python3
"""R99: build the outdoor ground, water and tree runtime images from the R8
checkpoint06 art package (Drive, unpacked locally). Usage:
  python3 scripts/r99-outdoor-assets.py /path/to/R8/extracted
Each ground image is 2048x1024: floor texture on the left half, wall face on
the right half (L.surface.art floorRect / wallRect). Tree frames share one crop
per tree so the trunk base stays anchored while the rig sways. Outputs go to
r96/runtime-text/assets/r99/outdoor and are registered with sync-r99.py."""
import hashlib,json,subprocess,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'r96'/'runtime-text'/'assets'/'r99'/'outdoor'
src=Path(sys.argv[1])/'production'
P=lambda *a:Image.open(src.joinpath(*a))
def tile2(im,size=1024):
 im=im.convert('RGB');h=size//2;t=im.resize((h,h),Image.LANCZOS);c=Image.new('RGB',(size,size))
 for x in(0,h):
  for y in(0,h):c.paste(t,(x,y))
 return c
def pair(floor,wall):
 c=Image.new('RGB',(2048,1024));c.paste(floor.convert('RGB').resize((1024,1024),Image.LANCZOS),(0,0));c.paste(wall.convert('RGB').resize((1024,1024),Image.LANCZOS),(1024,0));return c
GROUND={
 'ground-paving':(lambda:tile2(P('P1','floor-mortar-derived-v2','tile.png')),lambda:P('P2','rock-ledge-derived-v1','face-common-density.png')),
 'ground-moss':(lambda:P('P2','rock-ledge-derived-v1','top-common-density.png'),lambda:P('P2','rock-ledge-derived-v1','face-common-density.png')),
 'ground-cliff':(lambda:P('P5','mountain-cliff-derived-v1','top-common-density.png'),lambda:P('P5','mountain-cliff-derived-v1','face-common-density.png')),
 'ground-ruin':(lambda:tile2(P('P1','floor-mortar-derived-v2','tile.png')),lambda:P('P5','mountain-cliff-derived-v1','face-common-density.png')),
}
SURROUND={'surround-moss':('P2','rock-ledge-derived-v1','top-common-density.png'),'surround-cliff':('P5','mountain-cliff-derived-v1','top-common-density.png')}
WATER={'water-swamp':('P2','black-swamp-water-pilot','derived-v1','periodic-base.png'),'water-canal':('P2','polluted-canal-water-pilot','derived-v2','periodic-base.png')}
CONTACT={'fire':('P6','fire-contact-pilot','derived-v2','A-authored-keys-tail','atlas-0.png'),'shock':('P6','shock-contact-pilot','derived-v1','atlas.png'),'splash':('P6','splash-impact-pilot','derived-v1','atlas.png')}
TREES={'tree-living':'living-tree-derived-v1','tree-dead':'dead-tree-motion-derived-v1'}
def frames(folder):
 out=[]
 for a in range(3):
  im=P('P1',folder,f'halfscale-atlas-{a}.png').convert('RGBA');w,h=im.size;cw,ch=w//2,h//2
  for i in range(4):out.append(im.crop(((i%2)*cw,(i//2)*ch,(i%2+1)*cw,(i//2+1)*ch)))
 return out
def main():
 OUT.mkdir(parents=True,exist_ok=True);written=[]
 def save(im,name,**kw):
  p=OUT/name;im.save(p,'WEBP',**kw);written.append(str(p.relative_to(ROOT/'r96'/'runtime-text')));return p
 for name,(f,w) in GROUND.items():save(pair(f(),w()),name+'.webp',quality=88,method=6)
 for name,parts in SURROUND.items():save(P(*parts).convert('RGB'),name+'.webp',quality=86,method=6)
 for name,parts in WATER.items():save(P(*parts).convert('RGB').resize((1024,1024),Image.LANCZOS),name+'.webp',quality=88,method=6)
 # P6 contact clips: the 9 drawn phases (8 authored + fade) as one 256 px strip.
 FX=ROOT/'r96'/'runtime-text'/'assets'/'r99'/'fx';FX.mkdir(parents=True,exist_ok=True)
 for name,parts in CONTACT.items():
  im=P(*parts).convert('RGBA');cols=im.width//512;strip=Image.new('RGBA',(256*9,256))
  for i in range(9):strip.paste(im.crop(((i%cols)*512,(i//cols)*512,(i%cols+1)*512,(i//cols+1)*512)).resize((256,256),Image.LANCZOS),(256*i,0))
  p=FX/('contact-'+name+'.webp');strip.save(p,'WEBP',quality=90,method=6);written.append(str(p.relative_to(ROOT/'r96'/'runtime-text')))
 meta={}
 for name,folder in TREES.items():
  fr=frames(folder);box=None
  for im in fr:
   b=im.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
   box=b if box is None else(min(box[0],b[0]),min(box[1],b[1]),max(box[2],b[2]),max(box[3],b[3]))
  box=(max(0,box[0]-4),max(0,box[1]-4),min(fr[0].width,box[2]+4),min(fr[0].height,box[3]+4))
  k=min(1,440/(box[3]-box[1]))
  for i,im in enumerate(fr):
   c=im.crop(box);c=c.resize((max(1,round(c.width*k)),max(1,round(c.height*k))),Image.LANCZOS);save(c,f'{name}-{i:02d}.webp',quality=90,method=6)
  meta[name]={'frames':len(fr),'seconds':.1,'size':[round((box[2]-box[0])*k),round((box[3]-box[1])*k)]}
 (OUT/'trees.json').write_text(json.dumps(meta,indent=1)+'\n');written.append('assets/r99/outdoor/trees.json')
 print(json.dumps(meta));subprocess.run([sys.executable,str(ROOT/'scripts'/'sync-r99.py'),*written],check=True)
if __name__=='__main__':main()
