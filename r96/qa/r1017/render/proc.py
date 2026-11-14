import json,sys,hashlib,os,math
from PIL import Image,ImageFilter,ImageEnhance,ImageDraw
S=1024;MAX=384;out={}
names=['gate','statue','chest','candles','bed','firepit']
meta={}
for n in names:
    im=Image.open(f'rend/{n}.png').convert('RGBA');j=json.load(open(f'rend/{n}.json'))
    d=j['dims'];R=math.sqrt(sum(x*x for x in d));mpp=R/S
    if n=='firepit':
        # 잔불: 가운데 아래쪽에 어두운 주황 빛을 알파 안에서만 더한다
        w,h=im.size;glow=Image.new('RGBA',im.size,(0,0,0,0));g=ImageDraw.Draw(glow)
        bb=im.getbbox();cx=(bb[0]+bb[2])/2;cy=(bb[1]+bb[3])/2+ (bb[3]-bb[1])*.05;rx=(bb[2]-bb[0])*.28;ry=(bb[3]-bb[1])*.26
        for k in range(30,0,-1):
            t=k/30;g.ellipse([cx-rx*t,cy-ry*t,cx+rx*t,cy+ry*t],fill=(255,int(90+60*(1-t)),20,int(9+5*(1-t))))
        glow=glow.filter(ImageFilter.GaussianBlur(18))
        a=im.getchannel('A');rgb=Image.alpha_composite(im,glow);rgb.putalpha(a);im=rgb
    bb=im.getbbox();im=im.crop(bb);px=j['pivot'][0]-bb[0];py=j['pivot'][1]-bb[1]
    Hm=im.height*mpp
    k=MAX/max(im.size);im=im.resize((max(1,round(im.width*k)),max(1,round(im.height*k))),Image.LANCZOS);px*=k;py*=k
    im=ImageEnhance.Contrast(im).enhance(1.08);im=im.filter(ImageFilter.UnsharpMask(1.2,60,2))
    fn=f'out/x1017-{n}.webp';im.save(fn,'WEBP',quality=88,method=6)
    b=open(fn,'rb').read()
    meta[n]=dict(w=im.width,h=im.height,Hm=Hm,pivot=[round(px,3),round(min(py,im.height-1),3)],bytes=len(b),sha256=hashlib.sha256(b).hexdigest())
bedH=meta['bed']['Hm']
for n in names: meta[n]['scale']=round(meta[n]['Hm']/bedH*1.0,3)
json.dump(meta,open('out/meta.json','w'),indent=1);print(json.dumps(meta,indent=0))
