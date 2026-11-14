# 전후 비교 묶음: python3 sheet.py <shots dir> <out.jpg> <tag pc|mobile> name...
import sys
from PIL import Image,ImageDraw,ImageFont
d,out,tag=sys.argv[1:4];names=sys.argv[4:]
try:F=ImageFont.truetype('/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',22)
except Exception:
  try:F=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',22)
  except Exception:F=ImageFont.load_default()
S=2
for n in names:pass
def crop(n,k):
  im=Image.open(f'{d}/{n}-{tag}-{k}.png').convert('RGB');W,H=im.size;cx,cy=W//2,int(H*.51)
  bw,bh=(260,170) if tag=='pc' else (200,130)
  return im.crop((cx-bw//2,cy-bh//2,cx+bw//2,cy+bh//2)).resize((bw*S,bh*S),Image.LANCZOS)
c0=crop(names[0],'before');w,h=c0.size;G=8;T=34
sheet=Image.new('RGB',(w*2+G,(h+T)*len(names)),(16,14,18));dr=ImageDraw.Draw(sheet)
for i,n in enumerate(names):
  for j,k in enumerate(['before','after']):
    sheet.paste(crop(n,k),(j*(w+G),i*(h+T)+T))
    dr.text((j*(w+G)+8,i*(h+T)+4),('BEFORE (live)' if j==0 else 'AFTER R1030')+'  '+n,font=F,fill=(240,220,150))
sheet.save(out,quality=88)
