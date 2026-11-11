import sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np
src,out,prev=sys.argv[1:4]
im=Image.open(src).convert('RGBA');W,H=im.size
a=np.asarray(im).astype(np.float32);rgb=a[...,:3];al=a[...,3]
lum=rgb@np.array([.299,.587,.114],dtype=np.float32)
def poly(pts):
    m=Image.new('L',(W,H),0);ImageDraw.Draw(m).polygon([(x/2,y/2) for x,y in pts],fill=255);return np.asarray(m).astype(np.float32)/255
# 1024 배율에서 본 좌표
winL=poly([(212,390),(280,396),(280,450),(212,443)])
winR=poly([(722,470),(780,460),(780,526),(722,538)])
door=poly([(392,398),(498,410),(498,560),(392,548)])
amber=np.array([255,158,44],dtype=np.float32)
# 창살 창: 어두운 틈이 불빛, 살은 그림자로 남는다
def gapof(m):
    v=lum[m>.5];lo,hi=np.percentile(v,35),np.percentile(v,75)
    return np.clip((hi-lum)/max(6,hi-lo),0,1)*m
gapL,gapR=gapof(winL),gapof(winR)
# 문 한지: 밝은 종이가 불빛
paper=np.clip((lum-95)/50,0,1)
k=np.maximum((gapL+gapR)*1.0,door*paper*.94)*(al>200)
lit=rgb*(1-k[...,None])+(amber*(0.9+0.1*np.clip(lum/200,0,1))[...,None])*k[...,None]
# 번짐: 불빛 자리에서 주변 벽·마루로 흐린 호박색을 더한다
g=Image.fromarray((k*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(13))
gl=np.asarray(g).astype(np.float32)/255
lit=np.clip(lit+amber[None,None,:]*gl[...,None]*.6,0,255)
res=np.dstack([lit,al]).astype(np.uint8)
o=Image.fromarray(res,'RGBA');o.save(out,'WEBP',quality=88,method=6)
print('lit px',int((k>.3).sum()))
bg=Image.new('RGBA',(W*2,H),(34,40,62,255))
d=Image.new('RGBA',(W,H),(34,40,62,255));d.alpha_composite(Image.eval(im,lambda v:v));bg.paste(d,(0,0))
d=Image.new('RGBA',(W,H),(34,40,62,255));d.alpha_composite(o);bg.paste(d,(W,0))
bg.convert('RGB').resize((W*3,int(H*1.5)),Image.LANCZOS).save(prev,quality=90)
