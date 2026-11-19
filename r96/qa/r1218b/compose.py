# R1218b: Dots CX-0175SB 사몽 보스 시트(idle4·move4·attack4, 칸 256, 발 128,236) → R380 검수 시트(move 0-3 · attack 4-7 · idle 8) + index.json 항목.
# 쓰기: python3 r96/qa/r1218b/compose.py <id> <이름 정규식> <idle.png> <move.png> <attack.png> <원본 파일 이름 3개(쉼표)> [visibleHeight] [사몽 구역 정규식]
import sys,json,hashlib
from PIL import Image
mid,name,pi,pm,pa,srcs=sys.argv[1:7];vis=float(sys.argv[7]) if len(sys.argv)>7 else None;sam=sys.argv[8] if len(sys.argv)>8 else '.'
R='r96/runtime-text/';out='assets/r380/mobs/'+mid+'.webp'
ims=[Image.open(p).convert('RGBA') for p in (pm,pa,pi)]
cells=[ims[0].crop((i*256,0,i*256+256,256)) for i in range(4)]+[ims[1].crop((i*256,0,i*256+256,256)) for i in range(4)]+[ims[2].crop((0,0,256,256))]
S=Image.new('RGBA',(256*len(cells),256),(0,0,0,0))
for i,c in enumerate(cells):S.paste(c,(i*256,0))
S.save(R+out,'WEBP',lossless=True,method=6)
bb=[c.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox() for c in cells[:4]]
h=max(b[3]-b[1] for b in bb if b)
b=open(R+out,'rb').read()
ent={"id":mid,"kind":"strip","path":out,"cell":[256,256],"cols":len(cells),"pivot":[128.0,236.0],"visibleHeight":round(vis or h,1),"move":[0,1,2,3],"attack":[4,5,6,7],"idle":[8],"facing":"right",
 "actor":{"layer":"DREAM","name":name,"boss":True,"samong":sam},"bytes":len(b),"sha256":hashlib.sha256(b).hexdigest(),
 "source":[{"file":f,"sha256":hashlib.sha256(open(p,'rb').read()).hexdigest()} for f,p in zip(srcs.split(','),(pi,pm,pa))],"status":"Dots CX-0175SB ROUGH r1 (R1218b)","finalArt":False}
p=R+'assets/r380/mobs/index.json';d=json.load(open(p));d['mobs']=[m for m in d['mobs'] if m['id']!=mid]+[ent];json.dump(d,open(p,'w'),ensure_ascii=False,indent=1);open(p,'a').write('\n')
print(mid,'body h',h,'vis',ent['visibleHeight'],len(b))
