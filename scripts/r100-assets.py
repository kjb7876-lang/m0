#!/usr/bin/env python3
"""R100 runtime images built from art already shipped with the game.
  python3 scripts/r100-assets.py
root-full.webp: the R96 root bind (24 frames) with its back and front halves
recomposed into whole frames on one sheet, for touch devices where the FINAL42
split renderer is declined. Outputs go to r96/runtime-text/assets/r100 and are
registered with sync-r99.py.
sig-<kind>-<colour>.webp: four painted FINAL42 clips (radial burst, crescent
slash, rising aura ring, gathering vortex) gradient-mapped into fourteen
signature colours, 12 frames per strip, so each boss and mob can cast in the
colour of its own artwork.
polish-r100-data.js: the root sheet layout, the signature strip layout and the
enemy art table (facing of the drawn art, winged/floating, signature colour)
from r96/r100/sprites.json + r96/r100/art-facing.json; the colour is the
dominant vivid hue of the art, or pale / dark when the art has none."""
import json,subprocess,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];RT=ROOT/'r96'/'runtime-text';OUT=RT/'assets'/'r100';SITE=ROOT/'r96'/'hospital-three-pc'/'site'
def asset(rel):
 for base in(RT,SITE):
  p=base/rel
  if p.exists():return Image.open(p).convert('RGBA')
 raise FileNotFoundError(rel)
def root_sheet(written):
 s=(RT/'assets-r96.js').read_text();spec=json.loads(s[s.index('=')+1:s.rindex('}')+1])['root']
 atl=[asset(a['path']) for a in spec['atlases']];full=[]
 for f in spec['frames']:
  c=Image.new('RGBA',(512,512))
  for p in f['parts']:
   x,y,w,h=p['rect'];c.alpha_composite(atl[p['atlas']].crop((x,y,x+w,y+h)),tuple(p['offset']))
  full.append(c)
 box=None
 for c in full:
  b=c.getchannel('A').point(lambda v:255 if v>6 else 0).getbbox()
  if b:box=b if box is None else(min(box[0],b[0]),min(box[1],b[1]),max(box[2],b[2]),max(box[3],b[3]))
 box=(box[0]-2,box[1]-2,box[2]+2,box[3]+2);k=.5;w=round((box[2]-box[0])*k);h=round((box[3]-box[1])*k);cols=6
 sheet=Image.new('RGBA',(w*cols,h*((len(full)+cols-1)//cols)))
 for i,c in enumerate(full):sheet.paste(c.crop(box).resize((w,h),Image.LANCZOS),((i%cols)*w,(i//cols)*h))
 p=OUT/'root-full.webp';sheet.save(p,'WEBP',quality=88,method=6);written.append(str(p.relative_to(RT)))
 # pivot: feet sit at y=440 of the 512 canvas, x=256
 return{'cols':cols,'w':w,'h':h,'frames':len(full),'pivot':[(256-box[0])*k/w,(440-box[1])*k/h],'canvasHeight':512*k/h,'seconds':[f['seconds'] for f in spec['frames']],'clips':spec['clips']}
SIG_SRC={'hit':('F094',160),'slash':('F246',160),'aura':('F248',160),'gather':('F114',192)}
SIG_COLOURS={'red':(235,52,52),'orange':(255,128,32),'gold':(255,200,60),'lime':(150,230,60),'green':(60,210,110),'teal':(40,210,190),
 'cyan':(70,200,255),'blue':(70,120,255),'violet':(150,90,255),'purple':(190,70,240),'magenta':(240,70,200),'pink':(255,90,140),
 'pale':(225,212,186),'dark':(118,84,150)}
def ramp(c):
 # gradient map stops: shadow, body, highlight, hot core
 dark=tuple(int(v*.42) for v in c);light=tuple(int(v+(255-v)*.55) for v in c);core=(255,250,240)
 stops=[(0,(0,0,0)),(.34,dark),(.64,c),(.86,light),(1,core)];lut=[]
 for i in range(256):
  t=i/255
  for (a,ca),(b,cb) in zip(stops,stops[1:]):
   if t<=b:
    k=(t-a)/(b-a);lut.append(tuple(round(ca[j]+(cb[j]-ca[j])*k) for j in range(3)));break
 return lut
def sig_strips(written,meta):
 d=(RT/'final42-data-r88.js').read_text();E=json.loads(d[d.index('Object.freeze(')+14:d.rindex(')')])['effects']
 from PIL import ImageChops
 for kind,(fid,size) in SIG_SRC.items():
  e=E[fid];atlas=asset(e['atlases'][0]['path']);n=len(e['frames']);pick=[round(i*(n-1)/11) for i in range(12)]
  frames=[]
  for i in pick:
   x,y,w,h=e['frames'][i]['rect'];frames.append(atlas.crop((x,y,x+w,y+h)).resize((size,size),Image.LANCZOS))
  for name,c in SIG_COLOURS.items():
   lut=ramp(c);strip=Image.new('RGBA',(size*12,size))
   for j,f in enumerate(frames):
    r,g,b,a=f.split();mx=ImageChops.lighter(ImageChops.lighter(r,g),b);luma=f.convert('L')
    L=Image.blend(mx,luma,.5)
    rgb=Image.merge('RGB',[L.point([lut[i][k] for i in range(256)]) for k in range(3)])
    strip.paste(Image.merge('RGBA',(*rgb.split(),a)),(j*size,0))
   p=OUT/f'sig-{kind}-{name}.webp';strip.save(p,'WEBP',quality=84,method=6);written.append(str(p.relative_to(RT)))
  meta.setdefault('sig',{})[kind]={'source':fid,'size':size,'frames':12,'pivot':e['frames'][0].get('pivot')}
 meta['sigColours']=SIG_COLOURS
HUES={'red':0,'orange':24,'gold':46,'lime':82,'green':135,'teal':168,'cyan':193,'blue':222,'violet':256,'purple':280,'magenta':308,'pink':338}
def signature(im):
 import numpy as np
 a=np.asarray(im.convert('RGBA'),dtype=np.float32)/255;rgb=a[...,:3];al=a[...,3]>.5
 mx=rgb.max(-1);mn=rgb.min(-1);d=mx-mn;s=np.where(mx>0,d/np.maximum(mx,1e-6),0);v=mx
 r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
 h=np.where(d==0,0,np.where(mx==r,((g-b)/np.maximum(d,1e-6))%6,np.where(mx==g,(b-r)/np.maximum(d,1e-6)+2,(r-g)/np.maximum(d,1e-6)+4)))*60
 total=max(1,int(al.sum()))
 # warm browns (skin, rust, wood) are the ground of most art, not its signature
 brown=(h<48)&(v<.62)&(s<.75)
 def peak(mask,w):
  hist=np.histogram(h[mask],bins=72,range=(0,360),weights=w[mask])[0];hist=hist+np.roll(hist,1)+np.roll(hist,-1)
  c=(np.argmax(hist)+.5)*5;return min(HUES,key=lambda k:min(abs(HUES[k]-c),360-abs(HUES[k]-c)))
 vivid=al&(s>.35)&(v>.3)&~brown
 if vivid.sum()/total>.012:return peak(vivid,s*v**1.5)
 mid=al&(s>.18)&(v>.18)
 if mid.sum()/total>.08:return peak(mid,np.where(brown,.4,1)*s*v)
 return 'pale' if v[al].mean()>.42 else 'dark'
def art_table(meta):
 sprites=json.loads((ROOT/'r96'/'r100'/'sprites.json').read_text());cls=json.loads((ROOT/'r96'/'r100'/'art-facing.json').read_text())
 L=set(cls['L']);R=set(cls['R']);F=set(cls['fly']);art={}
 for it in sprites:
  im=asset(it['path']);rect=it['rect']
  full=not rect or (rect[0]==0 and rect[1]==0 and rect[2]==im.width and rect[3]==im.height)
  if not full:x,y,w,h=rect;im=im.crop((x,y,x+w,y+h))
  key=it['path'] if full else it['path']+'#'+','.join(map(str,rect))
  row={'c':signature(im)}
  if not it['boss']:row['f']='L' if it['i'] in L else 'R' if it['i'] in R else 'F'
  if it['i'] in F and not it['boss']:row['fly']=1
  art[key]=row
 d=(RT/'index.html').read_text();i=d.index('"monsters":{"path":"assets/r74/monsters.png"')+len('"monsters":');depth=0
 for k in range(i,len(d)):
  if d[k]=='{':depth+=1
  elif d[k]=='}':
   depth-=1
   if depth==0:break
 atlas=json.loads(d[i:k+1]);sheet=asset(atlas['path'])
 for style,row in cls['r74'].items():
  x,y,w,h=next(c['sourceRect'] for c in atlas['cells'] if c['key']==style+':idle')
  art['r74:'+style]={**row,'c':signature(sheet.crop((x,y,x+w,y+h)))}
 meta['art']=art
 (RT/'polish-r100-data.js').write_text('/* R100 generated by scripts/r100-assets.py: root sheet, signature strips, enemy art table. */\nwindow.__STORYWORLD_POLISH_R100_DATA__=Object.freeze('+json.dumps(meta,ensure_ascii=False,separators=(',',':'))+');\n')
def main():
 OUT.mkdir(parents=True,exist_ok=True);written=[];meta={'root':root_sheet(written)};sig_strips(written,meta);art_table(meta);written.append('polish-r100-data.js')
 (OUT/'meta.json').write_text(json.dumps(meta,indent=1)+'\n');print(json.dumps(meta))
 if '--no-sync' not in sys.argv:subprocess.run([sys.executable,str(ROOT/'scripts'/'sync-r99.py'),*written],check=True)
if __name__=='__main__':main()
