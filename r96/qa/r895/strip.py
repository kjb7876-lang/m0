# 기록(probe.mjs)의 몸 그림 명령을 사이트 자산으로 다시 그려 프레임 띠를 만든다(헤드리스 캡처 대신 — 몸 그림만).
# 사용: python3 strip.py rec.json hero t0 t1 out.png [siteDir]
import json,sys
from PIL import Image,ImageDraw
rec=json.load(open(sys.argv[1]));hero=sys.argv[2];t0=float(sys.argv[3]);t1=float(sys.argv[4]);out=sys.argv[5];site=sys.argv[6] if len(sys.argv)>6 else '/home/user/m0/r96/hospital-three-pc/site/'
fr=[f for f in rec[hero]['rec'] if t0<=f['t']<=t1 and f.get('b') and f['b'].get('pts')]
S=3;W=70*S;H=90*S;cache={}
sheet=Image.new('RGB',(W*len(fr),H+40),(40,44,52));d=ImageDraw.Draw(sheet)
for i,f in enumerate(fr):
  b=f['b'];p=site+b['s'];im=cache.get(p)
  if im is None:
    try: im=Image.open(p).convert('RGBA')
    except Exception: im=Image.new('RGBA',(1,1));
    cache[p]=im
  sr=b['sr'] or [0,0,im.width,im.height];cell=im.crop((round(sr[0]),round(sr[1]),round(sr[0]+sr[2]),round(sr[1]+sr[3])))
  P=b['pts'];x0,x1=P[0][0],P[1][0];y0,y3=P[0][1],P[3][1]
  if x1<x0: cell=cell.transpose(Image.FLIP_LEFT_RIGHT);x0,x1=x1,x0
  w=max(1,round((x1-x0)*S));h=max(1,round((y3-y0)*S));cell=cell.resize((w,h))
  ox=i*W+W//2+round((x0-f['px'])*S);oy=H-12*S+round((y0-f['py'])*S)
  tile=Image.new('RGBA',(W,H+40),(0,0,0,0));sheet.paste(cell,(ox,oy),cell)
  d.line([(i*W+W//2-8,H-12*S),(i*W+W//2+8,H-12*S)],fill=(255,80,80),width=2)
  d.line([(i*W,0),(i*W,H+40)],fill=(80,80,90))
  d.text((i*W+4,H+2),f"{f['t']:.2f} {f['ph'][:10]}",fill=(230,230,230));d.text((i*W+4,H+16),b['s'].split('/')[-1][:22],fill=(150,200,255))
sheet.save(out);print(out,len(fr))
