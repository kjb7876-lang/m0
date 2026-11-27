import json,base64,io,sys
from PIL import Image,ImageDraw
S=json.load(open('/tmp/claude-0/r1378-shots.json'));W=240;sc=2
out=Image.new('RGB',(2*W*sc+30,len(S)*(W*sc+24)+10),(20,20,24));d=ImageDraw.Draw(out)
for i,s in enumerate(S):
    y=10+i*(W*sc+24)
    for j,k in enumerate(('a','c')):
        im=Image.open(io.BytesIO(base64.b64decode(s[k]))).convert('RGB').resize((W*sc,W*sc),Image.LANCZOS);out.paste(im,(10+j*(W*sc+10),y+18))
    d.text((12,y),s['label']+'   before (no weapon)  |  after R1378',fill=(230,230,230))
out.save(sys.argv[1],quality=88);print(out.size)
