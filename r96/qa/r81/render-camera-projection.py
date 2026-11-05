#!/usr/bin/env python3
"""Debug figure from exact CPU projection data, not a game screenshot."""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'camera-projection.json').read_text())
im=Image.new('RGB',(1280,1260),'#0d151b');d=ImageDraw.Draw(im)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def text(pos,s,size=16):d.text(pos,s,font=ImageFont.truetype(font,size),fill='#dde8e9')
text((24,12),'Hospital camera / floor coverage diagnostic',24)
text((24,48),'CPU geometry only. No game textures, GPU, enemies, or natural-play claim.',15)
text((24,73),'Same zoom 1.12 and 1280 x 720 viewport. Red marker = hero. Walls and floor unchanged.',15)
for row,v in enumerate(D['views']):
 for col,stage in enumerate(['before','after']):
  ox=20+col*640;oy=118+row*380;w=620;h=349;s=w/1280;p=v[stage]
  text((ox,oy-23),v['name']+' - '+('centered baseline' if stage=='before' else 'R81 inward camera'),16)
  pan=Image.new('RGB',(w,h),'#586268' if stage=='before' else '#101b20');pd=ImageDraw.Draw(pan)
  def project(x,y):return (((x-y-p['camX']+p['camY'])*34*1.12+640)*s,((x+y-p['camX']-p['camY'])*17*1.12+720*.52)*s)
  for rects,color in [(D['roofRects'],'#27383c'),(D['floorRects'],'#728d89')]:
   for r in rects:
    pts=[project(r['x'],r['y']),project(r['x']+r['width'],r['y']),project(r['x']+r['width'],r['y']+r['depth']),project(r['x'],r['y']+r['depth'])];pd.polygon(pts,fill=color)
  for wall in D['walls']:
   if 'endpoints' in wall:pd.line([project(*q) for q in wall['endpoints']],fill='#c3cfca',width=1)
  x,y=project(**v['hero']);pd.ellipse((x-6,y-6,x+6,y+6),fill='#ff7265',outline='#f9e5dc',width=2)
  c=v[stage+'Coverage'];label=f'Floor {c["floor"]*100:.1f}% / exterior {c["exterior"]*100:.1f}% (384 samples)'
  pd.rectangle((4,h-29,w-4,h-3),fill='#0d151b');pd.text((10,h-27),label,font=ImageFont.truetype(font,14),fill='#dde8e9');im.paste(pan,(ox,oy))
im.save(ROOT/'camera-projection.png')
