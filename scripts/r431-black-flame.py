# R431: 검은 불꽃 프레임 시트 — 보스가 끌어당겨 던지는 조형물을 휘감는 불길·터질 때 폭발(사용자 2026-11-08 14:06Z).
#  usage: python3 -I scripts/r431-black-flame.py <fireball_v003 sheet png> <out dir r96/runtime-text/assets/r431>
#  원천(읽기 전용, 그림은 Dots core24 협업 시트): fireball_v003(드라이브, 비행 루프) · R411 hit-explosion·hit-fire · R430 fire-loop.
#  손질: 칸마다 ① 밝기→'검은 불꽃' 색(뜨거운 속=먹빛 #0B0D0E 쪽, 채도 높은 불 가장자리=핏빛 #641B25→#D12835, 연기=보랏빛 먹)
#        ② 알파를 흐려 칸 안에 핏빛 테두리 빛(halo)을 구워 넣어 어두운 바닥에서도 모양이 읽히게(게임 ctx.filter blur 금지 규칙 때문에 미리 굽는다)
#        ③ 칸 경계 3px 알파 0 · 알파 ≤3 잔티 제거 · 투명 RGB 0. 결과는 WebP(q90, 알파 q100). 원본은 바꾸지 않는다.
import sys,os,json,hashlib,numpy as np
from PIL import Image,ImageFilter
SRC_FB,OUT=sys.argv[1:3];os.makedirs(OUT,exist_ok=True)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A=lambda *p:os.path.join(ROOT,'r96','runtime-text','assets',*p)
sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
INK=np.array([11,13,14],float);BRU=np.array([34,12,30],float);BLOOD=np.array([100,27,37],float);RED=np.array([209,40,53],float);HALO=np.array([170,30,48],float)
def black(cell):
    a=cell[...,3]/255.;rgb=cell[...,:3].astype(float)
    mx=rgb.max(-1);mn=rgb.min(-1);L=(0.299*rgb[...,0]+0.587*rgb[...,1]+0.114*rgb[...,2])/255.;sat=np.where(mx>0,(mx-mn)/np.maximum(mx,1),0)
    heat=np.clip((L-.35)/.5,0,1)                       # 뜨거운 속일수록 1 → 먹빛
    rim=np.clip(sat*(1-heat)*1.15,0,1)                  # 채도 높은 바깥 불꽃 → 핏빛
    col=BRU[None,None]*(1-heat[...,None])+INK[None,None]*heat[...,None]
    edge=np.clip(rim*(1-a)*2.4+rim*.18,0,1)[...,None]
    col=col*(1-edge)+(BLOOD*(1-edge)+RED*edge)*edge
    smoke=(sat<.18)[...,None];col=np.where(smoke,BRU*.8+INK*.2,col)
    na=np.clip(a**.85*1.05,0,1)
    # 핏빛 halo(뒤에 깔림)
    ha=np.array(Image.fromarray((a*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(cell.shape[0]/42)))/255.*.5
    oa=na+ha*(1-na);oc=(col*na[...,None]+HALO*ha[...,None]*(1-na[...,None]))/np.maximum(oa[...,None],1e-6)
    out=np.dstack([np.clip(oc,0,255),np.clip(oa*255,0,255)]).astype(np.uint8)
    out[:3]=0;out[-3:]=0;out[:,:3]=0;out[:,-3:]=0;out[out[...,3]<=3]=0;return out
def sheet(src,cell,cols,frames,name,scale=1.):
    im=np.array(Image.open(src).convert('RGBA'));rows=(frames+cols-1)//cols;oc=int(cell*scale)
    out=np.zeros((rows*oc,cols*oc,4),np.uint8)
    for f in range(frames):
        r,c=divmod(f,cols);cl=im[r*cell:(r+1)*cell,c*cell:(c+1)*cell]
        if scale!=1:cl=np.array(Image.fromarray(cl).resize((oc,oc),Image.LANCZOS))
        out[r*oc:(r+1)*oc,c*oc:(c+1)*oc]=black(cl)
    p=os.path.join(OUT,name+'.webp');Image.fromarray(out,'RGBA').save(p,'WEBP',quality=90,alpha_quality=100,method=6)
    return dict(file=name+'.webp',source=os.path.relpath(src,ROOT) if src.startswith(ROOT) else os.path.basename(src),sourceSha256=sha(src),cell=oc,cols=cols,frames=frames,outSha256=sha(p),bytes=os.path.getsize(p))
idx={'revision':'R431','generator':'scripts/r431-black-flame.py','note':'Dots core24 불꽃 시트의 검은 불꽃 파생본(색·테두리 빛만 손질, 움직임은 원본 그대로)','fx':{}}
idx['fx']['black-trail']=dict(sheet('%s'%SRC_FB,256,6,24,'black-trail',.75),use='던진 조형물 뒤 꼬리(비행 루프, 동쪽 향함, 피벗 174,128→130.5,96)',fps=12.5,loop=True,pivot=[130.5,96])
idx['fx']['black-wreath']=dict(sheet(A('r430','fire-loop.webp'),192,6,10,'black-wreath'),use='조형물을 휘감는 불길(루프)',fps=10,loop=True,pivot=[96,131])
idx['fx']['black-burst']=dict(sheet(A('r411','fx','hit-explosion.webp'),256,6,24,'black-burst',.75),use='터질 때 폭발',fps=12.5,loop=False,pivot=[96,151.5])
idx['fx']['black-flare']=dict(sheet(A('r411','fx','hit-fire.webp'),256,6,24,'black-flare',.75),use='폭발 뒤 솟는 불꽃(닿으면 흑염 화상)',fps=12.5,loop=False,pivot=[96,151.5])
json.dump(idx,open(os.path.join(OUT,'index.json'),'w'),ensure_ascii=False,indent=1)
for k,v in idx['fx'].items():print(k,v['bytes'])
