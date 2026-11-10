"""CPU source-crop inspection sheet; not a browser/GPU screenshot."""
import json
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[2];here=Path(__file__).resolve().parent
rows=json.loads((here/'hero-frame-probe.json').read_text());heroes=list(dict.fromkeys(r['hero']for r in rows));states=['idle','move','attack','hit','skill','guard','dash','ultimate'];directions=['front','back','left','right']
sheet=Image.new('RGB',(len(states)*180,len(heroes)*4*150),(24,29,39));draw=ImageDraw.Draw(sheet);images={}
for hi,hero in enumerate(heroes):
 for di,direction in enumerate(directions):
  for si,state in enumerate(states):
   r=next((r for r in rows if r['hero']==hero and r['state']==state and r['direction']==direction and r['clock']==.23),None);x=si*180;y=(hi*4+di)*150
   draw.text((x+4,y+4),f'{hero} {state} {direction}',fill=(220,220,220));draw.line((x+5,y+128,x+175,y+128),fill=(60,90,130))
   if not r:continue
   p=r['path'];f=r['frame'];sx,sy,w,h=f['sourceRect']
   if p not in images:images[p]=Image.open(root/'hospital-three-pc/site'/p).convert('RGBA')
   im=images[p].crop((round(sx),round(sy),round(sx+w),round(sy+h)));b=im.getchannel('A').point(lambda a:255 if a>=24 else 0).getbbox();scale=66*r['scale']/f['visibleHeight'];alphaHeight=(b[3]-b[1])*scale if b else 0
   im=im.resize((max(1,round(w*scale)),max(1,round(h*scale))),Image.Resampling.LANCZOS)
   if r['native'].get('flip'):im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
   px=f['pivot'][0]*scale;py=f['pivot'][1]*scale;sheet.paste(im,(round(x+90-px),round(y+128-py)),im);draw.text((x+4,y+135),f'alpha H{alphaHeight:.1f}',fill=(130,170,195))
sheet.save(here/'hero-contact-sheet.png')
for i in range(4):sheet.crop((0,i*1200,1440,(i+1)*1200)).save(here/f'hero-contact-{i+1}.png')
