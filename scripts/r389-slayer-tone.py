# usage: tone.py ref.webp src.png out.webp  -> luminance mean/std match to ref (opaque pixels), hue preserved, alpha untouched
import sys,numpy as np
from PIL import Image
ref=np.asarray(Image.open(sys.argv[1]).convert('RGBA')).astype(np.float32)
src=np.asarray(Image.open(sys.argv[2]).convert('RGBA')).astype(np.float32)
W=np.array([.299,.587,.114],np.float32)
def stats(a):
    m=a[...,3]>128;L=(a[...,:3]@W)[m];return L.mean(),L.std()
mr,sr=stats(ref);ms,ss=stats(src)
k=min(1.6,max(.8,sr/ss))
L=src[...,:3]@W
Lt=np.clip((L-ms)*k+mr,0,255)
g=np.where(L>1,Lt/np.maximum(L,1),1)[...,None]
rgb=src[...,:3]*g
# add back the lift for near-black pixels (gain can't lift 0) as neutral warm grey
lift=np.clip(Lt-L*g[...,0],0,None)[...,None]*np.array([1.0,.92,.9],np.float32)
rgb=np.clip(rgb+lift,0,255)
out=np.concatenate([rgb,src[...,3:]],-1).astype(np.uint8)
Image.fromarray(out,'RGBA').save(sys.argv[3],lossless=True,method=6)
o=np.asarray(Image.open(sys.argv[3]).convert('RGBA')).astype(np.float32)
assert (o[...,3]==src[...,3]).all()
print(sys.argv[2].split('/')[-1],'ref %.1f/%.1f src %.1f/%.1f -> %.1f/%.1f k=%.2f'%(mr,sr,ms,ss,*stats(o),k))
