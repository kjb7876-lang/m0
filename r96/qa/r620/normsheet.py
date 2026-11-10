# Dots 원본 생성 시트(크기 제각각) → 게임 칸 규격(원본과 같은 칸 크기·발 줄·키) 가로 한 줄 시트로 맞춘다.
# 사용: python -I normsheet.py <raw.png> <n> <source.png> <out.webp> [--keep-alpha]
import sys,json
from PIL import Image
raw,n,srcp,out=sys.argv[1],int(sys.argv[2]),sys.argv[3],sys.argv[4]
A=lambda im:im.getchannel('A').point(lambda a:255 if a>16 else 0)
src=Image.open(srcp).convert('RGBA');W,H=src.size;sb=A(src).getbbox();svh=sb[3]-sb[1]
def footx(im,bb):
    a=im.getchannel('A');h=bb[3]-bb[1];y0=bb[3]-max(2,int(h*.06));xs=0;c=0
    px=a.load()
    for y in range(y0,bb[3]):
        for x in range(bb[0],bb[2]):
            if px[x,y]>16:xs+=x;c+=1
    return xs/c if c else (bb[0]+bb[2])/2
sfx=footx(src,sb)
im=Image.open(raw).convert('RGBA');m=A(im);bb=m.getbbox();cols=[any(m.getpixel((x,y)) for y in range(bb[1],bb[3],2)) for x in range(im.size[0])]
runs=[];x=0
while x<len(cols):
    if cols[x]:
        s=x
        while x<len(cols) and cols[x]:x+=1
        runs.append([s,x])
    else:x+=1
while len(runs)>n:# 가장 좁은 틈을 합친다
    g=min(range(len(runs)-1),key=lambda i:runs[i+1][0]-runs[i][1]);runs[g]=[runs[g][0],runs[g+1][1]];del runs[g+1]
assert len(runs)==n,('groups',len(runs))
fr=[];hs=[]
for s,e in runs:
    c=im.crop((s,0,e,im.size[1]));b=A(c).getbbox();c=c.crop(b);fr.append(c);hs.append(c.size[1])
hs2=sorted(hs);k=svh/hs2[len(hs2)//2]
sheet=Image.new('RGBA',(W*n,H),(0,0,0,0));rep=[]
for i,c in enumerate(fr):
    c=c.resize((max(1,round(c.size[0]*k)),max(1,round(c.size[1]*k))),Image.LANCZOS)
    cb=(0,0,c.size[0],c.size[1]);fx=footx(c,A(c).getbbox())
    ox=round(sfx-fx);oy=sb[3]-c.size[1]
    cell=Image.new('RGBA',(W,H),(0,0,0,0));cell.alpha_composite(c,(max(0,ox),max(0,oy))) if ox>=0 and oy>=0 else cell.paste(c,(ox,oy),c)
    a=cell.getchannel('A').point(lambda v:0 if v<=16 else v);cell.putalpha(a)
    sheet.alpha_composite(cell,(i*W,0));b=A(cell).getbbox();rep.append({'i':i,'bbox':b,'vh':b[3]-b[1],'foot':b[3]})
def meanrgb(img):
    px=[p for p in img.getdata() if p[3]>16];return [sum(p[j] for p in px)/len(px) for j in range(3)]
ms=meanrgb(src);mo0=meanrgb(sheet)
# 원본 색에 맞춤: 보이는 화소 평균 RGB 비율로 채널별 곱(투명도 그대로)
g=[ms[j]/max(1e-6,mo0[j]) for j in range(3)]
r_,g_,b_,a_=sheet.split();r_=r_.point(lambda v:min(255,round(v*g[0])));g_=g_.point(lambda v:min(255,round(v*g[1])));b_=b_.point(lambda v:min(255,round(v*g[2])));sheet=Image.merge('RGBA',(r_,g_,b_,a_))
mo=meanrgb(sheet)
r={'n':n,'cell':[W,H],'scale':k,'src_vh':svh,'src_foot':sb[3],'frames':rep,'rgb_src':ms,'rgb_raw':mo0,'gain':g,'rgb_out':mo,'rgb_delta':sum(abs(a-b) for a,b in zip(ms,mo))/3,
   'vh_dev_pct':max(abs(f['vh']-svh)/svh*100 for f in rep),'foot_dev':max(abs(f['foot']-sb[3]) for f in rep)}
sheet.save(out,quality=88,method=6) if out.endswith('.webp') else sheet.save(out)
print(json.dumps(r,ensure_ascii=False))
