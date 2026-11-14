# R1027 영웅 칠한 이펙트 시트 — 엔진 PXF 픽셀 아틀라스(도트)·정지 문장(보호막·회복)을 대신할 프레임 시트를 저장소 안 칠한 원본에서 만든다.
#  usage: python3 -I scripts/r1027-hero-paint.py   (저장소 루트에서; 원본은 읽기만, 출력 r96/runtime-text/assets/r1027/ + index.json)
#  · barrier / heal / mend: R438 core24(256칸 6x4, 24장) → 160칸으로 줄임(모바일 메모리: 디코드 6.3MB → 2.5MB). 색·모양 그대로.
#  · slash-<영웅>: R952 hs03 초승달 베기(384x256 칸 6x2, 12장 중 거의 빈 끝 2장 뺀 10장) → 192x128 칸 5x2, 밝기 → 영웅 색 사다리(hero-fx-recolor 규칙). 슬레이어는 원래 진홍.
#  · hit-hunter / hit-michaela: 이미 게임에 있는 R912 pj02-hit / R948 heart-hit6 을 그대로 가리킨다(복사 안 함).
import os,json,hashlib,numpy as np
from PIL import Image
A='r96/runtime-text/assets';OUT=os.path.join(A,'r1027');os.makedirs(OUT,exist_ok=True)
sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
SIL=(226,232,242);GOLD=(255,198,72)
LAD={'hwando':[(24,26,34),(110,116,130),SIL,GOLD,(255,248,220)],
 'lauren':[(16,6,34),(80,40,150),(164,98,255),(214,190,255),(246,240,255)],
 'neon':[(2,24,20),(14,120,96),(52,236,176),(170,255,228),(240,255,250)]}
def lad(name,L):
    st=np.array(LAD[name],np.float32);x=np.clip(L,0,1)*(len(st)-1);i=np.minimum(x.astype(int),len(st)-2);f=(x-i)[...,None]
    return st[i]*(1-f)+st[i+1]*f
def recolor(a,hero):
    rgb=a[...,:3].astype(np.float32)/255;al=a[...,3];L=0.2126*rgb[...,0]+0.7152*rgb[...,1]+0.0722*rgb[...,2]
    m=al>8;hi=np.percentile(L[m],99.5) if m.any() else 1;L=np.clip(L/max(hi,1e-3),0,1)**.8
    out=a.copy();out[...,:3]=np.clip(lad(hero,L),0,255).astype(np.uint8);out[al==0,:3]=0;return out
def regrid(src,cols,rows,frames,cw,ch,ow,oh,hero=None,ocols=None):
    ocols=ocols or cols;orows=(frames+ocols-1)//ocols
    im=Image.open(src).convert('RGBA');out=Image.new('RGBA',(ocols*ow,orows*oh),(0,0,0,0))
    for f in range(frames):
        c=im.crop(((f%cols)*cw,(f//cols)*ch,(f%cols+1)*cw,(f//cols+1)*ch)).resize((ow,oh),Image.LANCZOS)
        a=np.array(c);a[:2,:]=0;a[-2:,:]=0;a[:,:2]=0;a[:,-2:]=0;a[a[...,3]<=3]=0
        if hero:a=recolor(a,hero)
        out.paste(Image.fromarray(a),((f%ocols)*ow,(f//ocols)*oh))
    return out
def stats(p,cols,rows,frames,cw,ch):
    a=np.array(Image.open(p).convert('RGBA')).astype(np.float32);cells=[a[(f//cols)*ch:(f//cols+1)*ch,(f%cols)*cw:(f%cols+1)*cw] for f in range(frames)]
    al=[float((c[...,3]>16).mean()) for c in cells];std=[float(c[...,3].std()) for c in cells]
    diff=sum(1 for i in range(frames-1) if np.abs(cells[i]-cells[i+1]).mean()>0.5)
    return al,std,diff
rows=[];idx={'revision':'R1027','generator':'scripts/r1027-hero-paint.py','approval':'사용자 2026-11-14 05:44Z \"영웅들 스킬이펙트 아직 도트로 나오는것들 프레임애니메이션으로 개선\" · \"버프 같은 주기적으로 나오는 이미지 전수조사해서 어색한 부분 개선\"','sheets':{}}
def add(key,path,src,cols,rows_,frames,cw,ch,pivot,use,made=True):
    full=os.path.join('r96/runtime-text',path);al,std,diff=stats(full,cols,rows_,frames,cw,ch)
    idx['sheets'][key]={'path':path,'file':os.path.basename(path),'cols':cols,'rows':rows_,'frames':frames,'cellW':cw,'cellH':ch,'pivot':pivot,'use':use,
      'source':src,'sourceSha256':sha(os.path.join('r96/runtime-text',src)),'sha256':sha(full),'bytes':os.path.getsize(full),'made':made,
      'cellAlpha':[round(x,4) for x in al],'cellStd':[round(x,2) for x in std],'distinctPairs':diff}
for key,src,use in [('barrier','assets/r438/fx/hero-barrier.webp','막기·보호막·패링(정지 보호막 문장·PXF pxf-17/06/19 대신)'),
                    ('heal','assets/r438/fx/hero-healing.webp','큰 회복(레벨업·5연타 회복 문장 대신)'),
                    ('mend','assets/r438/fx/hero-cleanse.webp','작은 회복 틱(흡혈 회복 문장·PXF pxf-09 대신)')]:
    o=regrid(os.path.join('r96/runtime-text',src),6,4,24,256,256,160,160);p='assets/r1027/'+key+'.webp';o.save(os.path.join('r96/runtime-text',p),'WEBP',quality=88,method=6,exact=True)
    add(key,p,src,6,4,24,160,160,[80,{'barrier':94,'heal':130,'mend':96}[key]],use)
SL='assets/r952/hs03-shade-slash.webp'
for hero in ['lauren','neon','hwando',None]:
    k='slash-'+(hero or 'slayer');o=regrid(os.path.join('r96/runtime-text',SL),6,2,10,384,256,192,128,hero,ocols=5);p='assets/r1027/'+k+'.webp'
    o.save(os.path.join('r96/runtime-text',p),'WEBP',quality=88,method=6,exact=True);add(k,p,SL,5,2,10,192,128,[40,64],'근접 휘두르기(PXF claw-magic·pxf-28·pxf-05·silver-slash 대신)')
add('hit-hunter','assets/r912/pj02-hit.webp','assets/r912/pj02-hit.webp',6,1,6,256,256,[125,130],'헌터 기본 적중(PXF melee-spark 대신)',False)
add('hit-michaela','assets/r948/heart-hit6.webp','assets/r948/heart-hit6.webp',6,1,6,256,256,[128,128],'미카엘라 기본 적중(PXF melee-spark 대신)',False)
json.dump(idx,open(os.path.join(OUT,'index.json'),'w'),ensure_ascii=False,indent=1)
for k,v in idx['sheets'].items():print(k,v['path'],v['bytes'],'frames',v['frames'],'distinct',v['distinctPairs'])
