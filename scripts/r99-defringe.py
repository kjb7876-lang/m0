#!/usr/bin/env python3
"""R99: clear background-removal leftovers on a reviewed list of actor images.
- halo: the light outline ringing the U2 (Controller) sketch-style monsters is
  peeled 1-4 px where it is much brighter than the body just inside it; the
  new rim takes the interior colour and a softer alpha.
- matte: flat near-white patches left inside the seven-sins attack effects
  (swirls, flames, flying furniture) become transparent; highlights ringed by
  light cloth stay.
Reads the original bytes from the reconstructed site (scripts/build-r96.py),
checks them against r96/r99-defringe.json, writes lossless WebP replacements
under r96/runtime-text and registers them with scripts/sync-r99.py."""
import hashlib,io,json,subprocess,sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';SITE=R/'hospital-three-pc/site';SPEC=R/'r99-defringe.json'
sha=lambda b:hashlib.sha256(b).hexdigest()

def halo(im,passes=4,depth=6,delta=38):
    a=np.asarray(im).astype(np.float32);rgb=a[...,:3].copy();al=a[...,3].copy()
    core=ndimage.binary_erosion(al>8,iterations=depth)
    _,(iy,ix)=ndimage.distance_transform_edt(~core,return_indices=True)
    corec=rgb[iy,ix];corel=corec.mean(-1);lum=rgb.mean(-1);sat=rgb.max(-1)-rgb.min(-1)
    for _ in range(passes):
        solid=al>8;edge=solid&~ndimage.binary_erosion(solid)
        h=edge&(lum>150)&(sat<60)&(lum-corel>delta)&~core
        if not h.any():break
        al[h]=0
    solid=al>8;edge=solid&~ndimage.binary_erosion(solid)
    rgb=np.where(edge[...,None],rgb*.35+corec*.65,rgb);al=np.where(edge,np.minimum(al,200),al)
    rgb=np.where((al<=8)[...,None],corec,rgb)
    return Image.fromarray(np.dstack([rgb,al]).clip(0,255).astype(np.uint8),'RGBA')

def matte(im,lum_min=222,sat_max=30,std_max=7.0,min_px=12):
    a=np.asarray(im).astype(np.float32);rgb=a[...,:3];al=a[...,3].copy()
    lum=rgb.mean(-1);sat=rgb.max(-1)-rgb.min(-1);cand=(al>8)&(lum>lum_min)&(sat<sat_max)
    lab,n=ndimage.label(cand)
    if not n:return im
    idx=np.arange(1,n+1);size=ndimage.sum(cand,lab,idx);sd=ndimage.standard_deviation(lum,lab,idx)
    ring=ndimage.binary_dilation(cand,iterations=3)&~cand;near=ndimage.grey_dilation(lab,size=7)*ring
    rl=ndimage.labeled_comprehension(lum,near,idx,np.mean,float,255);ra=ndimage.labeled_comprehension(al<=8,near,idx,np.mean,float,0)
    kill=np.zeros(n+1,bool);kill[1:]=(size>=min_px)&(sd<std_max)&((rl<165)|(ra>.25));m=kill[lab]
    soft=ndimage.binary_dilation(m)&~m&(lum>190);al[m]=0;al[soft]*=.45
    return Image.fromarray(np.dstack([rgb,al]).clip(0,255).astype(np.uint8),'RGBA')

def main():
    spec=json.loads(SPEC.read_text());done=[]
    for row in spec['files']:
        src=SITE/row['path'];out=R/'runtime-text'/row['path']
        if out.exists()and sha(out.read_bytes())==row.get('outputSHA256'):done.append(row['path']);continue
        b=src.read_bytes()
        if sha(b)!=row['sourceSHA256']:raise SystemExit('source changed: '+row['path'])
        im=Image.open(io.BytesIO(b)).convert('RGBA');im={'halo':halo,'matte':matte}[row['fix']](im)
        buf=io.BytesIO();im.save(buf,'WEBP',lossless=True,quality=100,method=6,exact=True)
        out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(buf.getvalue());row['outputSHA256']=sha(buf.getvalue());done.append(row['path'])
    SPEC.write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n')
    subprocess.run([sys.executable,str(ROOT/'scripts/sync-r99.py'),*done],check=True)
if __name__=='__main__':main()
