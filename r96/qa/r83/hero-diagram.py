"""CPU sprite-layout contact sheet only; not a browser screenshot."""
import json,math
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2];rows=json.loads((ROOT/'qa/r83/hero-presented-frames.json').read_text());heroes=['hwando','slayer','seoha','neon','michaela','lauren','hunter','gunner'];states=['idle','move','attack','hit','dash','guard'];directions=['front','back','left','right'];sheet=Image.new('RGB',(len(states)*220,len(heroes)*180),(35,39,46));draw=ImageDraw.Draw(sheet)
for iy,hero in enumerate(heroes):
 for ix,state in enumerate(states):
  draw.text((ix*220+4,iy*180+2),hero+':'+state,fill='white')
  for idir,direction in enumerate(directions):
   r=next(r for r in rows if r['key']==':'.join([hero,state,direction]) and r['clock']==.4);a=r['assetFrame'];sx,sy,sw,sh=a['sourceRect'];im=Image.open(ROOT/'hospital-three-pc/site'/r['path']).convert('RGBA');im=im.crop((round(sx),round(sy),round(sx+sw),round(sy+sh)));k=66*r['scale']/a['visibleHeight'];im=im.resize((max(1,round(im.width*k)),max(1,round(im.height*k))));x=ix*220+idir*54+27;y=iy*180+120;px,py=a['pivot'];sheet.paste(im,(round(x-px*k),round(y-py*k)),im);draw.line((x-25,y,x+25,y),fill=(80,110,90));draw.text((x-20,iy*180+150),direction,fill='white')
sheet.save(ROOT/'qa/r83/hero-v7-audit-sheet.png')
print(ROOT/'qa/r83/hero-v7-audit-sheet.png')
