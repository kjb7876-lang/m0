import sys,json,os
from PIL import Image,ImageDraw
D='./';rows=[]
for pre in sys.argv[2:]:
    s=json.load(open(D+pre+'.json'));ims=[Image.open(D+x['f']) for x in s]
    W=sum(i.width for i in ims);C=Image.new('RGB',(W,ims[0].height+14),(255,255,255));x=0
    for i,t in zip(ims,s):C.paste(i,(x,14));ImageDraw.Draw(C).text((x+3,1),pre.split('/')[-1]+' '+t['lab'],fill=(0,0,0));x+=i.width
    rows.append(C)
W=max(r.width for r in rows);H=sum(r.height for r in rows);M=Image.new('RGB',(W,H),(255,255,255));y=0
for r in rows:M.paste(r,(0,y));y+=r.height
M=M.resize((int(M.width*1.6),int(M.height*1.6)));M.save(sys.argv[1],quality=88);print(M.size)
