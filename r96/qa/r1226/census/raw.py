import sys,os
from PIL import Image,ImageDraw
A=__import__('os').environ.get('SW_SITE','r96/hospital-three-pc/site/')+'assets/'
out=sys.argv[1];paths=sys.argv[2:]
rows=[]
for p in paths:
    f=A+p
    if not os.path.exists(f): print('missing',p);continue
    im=Image.open(f).convert('RGBA');h=110;w=int(im.width*h/im.height)
    if w>900: w=900;h=int(im.height*w/im.width)
    t=im.resize((max(1,w),max(1,h)));bg=Image.new('RGB',(920,h+16),(200,200,200));bg.paste(t,(0,16),t)
    ImageDraw.Draw(bg).text((2,1),p,fill=(0,0,0));rows.append(bg)
H=sum(r.height for r in rows);C=Image.new('RGB',(920,H),(255,255,255));y=0
for r in rows: C.paste(r,(0,y));y+=r.height
C.save(out,quality=85);print(C.size)
