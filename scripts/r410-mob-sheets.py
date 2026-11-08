# R410: 남은 R248 임시 픽셀 몹 → 드라이브 손그림 후보(검토·HOLD 포함, 사용자 2026-11-07 "비승인도개선해서 적용", 2026-11-08 "픽셀몹다없앴는데 검토적용 꼼꼼히").
#  usage: python3 -I scripts/r410-mob-sheets.py <unzipped drive root> <out dir r96/runtime-text/assets/r410/mobs> <r248 mobs dir> <r380 mobs dir>
#  Output = R290 규격(칸 256x320, 4x3, 걷기 0-7 · 공격 8-11, pivot 128,300) 무손실 WebP + index.json.
#  원본 픽셀은 그대로 쓴다. 바꾸는 것은 칸 배치뿐: 1024x960 시트는 그대로, 이동 4장 후보는 걷기 칸에 두 번(0-3,0-3),
#  512px·384x480 후보는 같은 배율로 줄여 칸에 넣고 모든 칸을 같은 만큼 옮겨 걷기 발끝을 y=298 에 맞춘다(칸마다 따로 맞추지 않아 움직임 보존).
import sys,os,json,hashlib,numpy as np
from PIL import Image
S=sys.argv[1]; OUT=sys.argv[2]; OLD=sys.argv[3]; R380=sys.argv[4]
os.makedirs(OUT,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
CW,CH,FOOT=256,320,298
B16='SW-boss16-{0}-candidate-v1/sheet.png'
def sheet(p): return ('sheet',p)
SRC={
 'm007':('frames8','SW-m007-Canonical-Guard-REUSE-NOT-NEW-WALK-HOLD-20261106/frames',['m007-move-0%d.png'%i for i in range(1,5)],['m007-attack-0%d.png'%i for i in range(1,5)],1.0),
 'm009':('frames8','SW-m009-Codex-Canonical-Frames8-HOLD-20261106',['move0%d.png'%i for i in range(1,5)],['cast0%d.png'%i for i in range(1,5)],1.0),
 'm011':('frames8','hellgate-gargoyle-darkstripes-20261106-part01-of01/hellgate-gargoyle-darkstripes/frames',['move-0%d.png'%i for i in range(4)],['attack-0%d.png'%i for i in range(4)],.5),
 'm013':('frames12','summoning-fallen-angel-darkred-20261106-part01-of02/summoning-fallen-angel-darkred/frames',['move-0%d.png'%i for i in range(8)],['attack-0%d.png'%i for i in range(4)],.5),
 'm015':sheet('SW-boss16_m015_v1_review/SW-boss16-m015-candidate-v1/sheet.png'),
 'm016':sheet('SW-boss16_m016_v1_review/SW-boss16-m016-candidate-v1/sheet.png'),
 'm018':('strip8',os.path.join(R380,'glass-wraith-v1.webp'),1.0),
 'm027':sheet('SW-m027-lunge-v3-20261106/sheet.png'),
 'm028':sheet('SW-m028-grounded-v3-20261106/sheet.png'),
 'm029':sheet('SW-m029-existing-static-review-7.7857-20261105/sheet.png'),
 'm033':sheet('SW-boss16-m033-candidate-v1/SW-boss16-m033-candidate-v1/sheet.png'),
 'm039':sheet('SW-m039-existing-static-review-7.8429-20261105/sheet.png'),
 'm040':sheet('SW-boss16-m040-candidate-v1/SW-boss16-m040-candidate-v1/sheet.png'),
 'm043':sheet('SW-m043-phase-order-static-candidate-8.1286-20261105/sheet.png'),
 'm044':sheet('SW-boss16-m044-candidate-v1/SW-boss16-m044-candidate-v1/sheet.png'),
 'm045':sheet('SW-m045-anticipation-static-comparison-7.9714-20261105/sheet.png'),
 'm046':sheet('SW-m046-existing-static-candidate-7.9429-20261105/sheet.png'),
 'm047':sheet('SW-m047-existing-static-candidate-7.8857-20261105/sheet.png'),
 'm048':('frames8','SW-m048-Hover4-Cast4-Canonical-REVIEW-GIF-20261106/frames',['m048-move-0%d.png'%i for i in range(1,5)],['m048-attack-0%d.png'%i for i in range(1,5)],1.0),
 'm050':sheet('SW-m050-existing-static-candidate-7.7857-20261105/sheet.png'),
 'm054':sheet('SW-boss16-m054-candidate-v1-part01-of01/SW-boss16-m054-candidate-v1/sheet.png'),
 'm056':sheet('SW-boss16-m056-candidate-v1/SW-boss16-m056-candidate-v1/sheet.png'),
 'm060':sheet('SW-m060-right-lobe-comparison-8.0143-20261105/sheet.png'),
 'm062':('frames12','SW-boss16_m062_walk_review_v3/m062',['frame_%02d.png'%i for i in range(1,9)],['frame_%02d.png'%i for i in range(9,13)],2/3),
 'm063':sheet('SW-boss16-m063-candidate-v1/sheet.png'),
 'm069':sheet('SW-boss16_m062_m069_walk_review_v2/m069/sheet.png'),
 'm070':sheet('SW-boss16-m070-candidate-v1/sheet.png'),
 'm071':sheet('SW-m071-same-arm-prep-comparison-7.8286-20261105/sheet.png'),
 'm072':sheet('SW-boss16-m072-candidate-v1/sheet.png'),
 'm075':sheet('SW-boss16-m075-candidate-v1/sheet.png'),
 'm078':sheet('SW-boss16-m078-candidate-v1/sheet.png'),
 'm080':sheet('SW-boss16-m080-candidate-v1/sheet.png'),
 'm084':sheet('SW-m084-recovery-position-comparison-7.9143-20261105/sheet.png'),
 'm091':sheet('SW-boss16-m091-candidate-v1/sheet.png'),
 'm092':sheet('SW-boss16-m092-candidate-v1/sheet.png'),
 'm094':sheet('SW-boss16-m094-candidate-v1/sheet.png'),
 'm096':sheet('SW-boss16-m096-candidate-v1/sheet.png'),
 'm098':sheet('SW-boss16-m098-candidate-v1/sheet.png'),
 'm099':sheet('SW-boss16-m099-candidate-v1-part3/sheet.png'),
 'm100':sheet('SW-boss16-m100-candidate-v2/sheet.png'),
}
ONLY=set(os.environ.get('R410_ONLY','').split(','))-{''}
old=json.load(open(os.path.join(OLD,'index.json')))['mobs']
def st(a):
    al=a[:,:,3]; m=al>16
    if not m.any(): return dict(top=0,foot=0,body=0,bbox=None)
    ys,xs=np.where(m); top=int(ys.min()); rows=np.where((al>64).sum(1)>=3)[0]
    foot=int(rows.max()) if len(rows) else int(ys.max())
    return dict(top=top,foot=foot,body=foot-top+1,bbox=[int(xs.min()),top,int(xs.max()),int(ys.max())])
def place(imgs,k):
    """imgs: RGBA PIL list (walk first 8, then attack 4); scale k; one common offset so walk foot -> FOOT, x centre -> 128."""
    sc=[im.resize((round(im.width*k),round(im.height*k)),Image.LANCZOS) if k!=1 else im for im in imgs]
    arrs=[np.array(i) for i in sc]
    feet=[st(a)['foot'] for a in arrs[:8]]; foot=int(np.median(feet))
    xs=[(st(a)['bbox'][0]+st(a)['bbox'][2])/2 for a in arrs[:8]]; cx=float(np.median(xs))
    dy=FOOT-foot; dx=int(round(128-cx))
    sheet=np.zeros((960,1024,4),np.uint8)
    for i,a in enumerate(arrs):
        r,c=divmod(i,4); cell=np.zeros((CH,CW,4),np.uint8); h,w=a.shape[:2]
        y0,x0=max(0,dy),max(0,dx); y1,x1=min(CH,dy+h),min(CW,dx+w)
        if y1>y0 and x1>x0: cell[y0:y1,x0:x1]=a[y0-dy:y1-dy,x0-dx:x1-dx]  # 원본 픽셀 그대로 복사(섞지 않음)
        sheet[r*CH:(r+1)*CH,c*CW:(c+1)*CW]=cell
    return sheet,dict(scale=k,dx=dx,dy=dy)
idx={'revision':'R410','generator':'scripts/r410-mob-sheets.py','cell':[CW,CH],'cols':4,'walk':[0,8],'attack':[8,4],'pivot':[128,300],
     'source':'Google Drive Storyworld_Assets 후보 묶음(검토·HOLD 포함, 읽기 전용 재사용)','approval':'사용자 2026-11-07 "비승인도개선해서 적용" · 2026-11-08 "픽셀몹다없앴는데 검토적용 꼼꼼히"','mobs':{}}
for n,s in SRC.items():
    if ONLY and n not in ONLY: continue
    files=[]; fit=None
    if s[0]=='sheet':
        p=os.path.join(S,s[1]); b=open(p,'rb').read(); im=Image.open(p).convert('RGBA'); assert im.size==(1024,960),(n,im.size)
        sh=np.array(im); files.append(dict(file=s[1],sha256=sha(b),bytes=len(b)))
    elif s[0] in ('frames8','frames12'):
        _,d,mv,at,k=s; ims=[]
        for f in mv+at:
            p=os.path.join(S,d,f); b=open(p,'rb').read(); ims.append(Image.open(p).convert('RGBA')); files.append(dict(file=d+'/'+f,sha256=sha(b),bytes=len(b)))
        if s[0]=='frames8': ims=ims[:4]+ims[:4]+ims[4:]
        sh,fit=place(ims,k)
    elif s[0]=='strip8':
        _,p,k=s; b=open(p,'rb').read(); im=Image.open(p).convert('RGBA'); w=im.height
        cells=[im.crop((i*w,0,(i+1)*w,w)) for i in range(im.width//w)]; assert len(cells)==8
        files.append(dict(file='assets/r380/mobs/'+os.path.basename(p),sha256=sha(b),bytes=len(b)))
        sh,fit=place(cells[:4]+cells[:4]+cells[4:],k)
    shiftY=0
    if s[0]=='sheet':  # R359 과 같은 규칙: 칸 가운데에 그려진 부유형은 12칸을 같은 값만큼 내려 걷기 발끝을 y≈296 에
        wf=sorted(st(sh[(i//4)*CH:(i//4+1)*CH,(i%4)*CW:(i%4+1)*CW])['foot'] for i in range(8)); med=wf[4]
        if med<288:
            shiftY=min(296-med,CH-1-max(st(sh[(i//4)*CH:(i//4+1)*CH,(i%4)*CW:(i%4+1)*CW])['bbox'][3] for i in range(12)))
            if shiftY>0:
                for i in range(12):
                    r,c=divmod(i,4); cell=sh[r*CH:(r+1)*CH,c*CW:(c+1)*CW].copy(); nc=np.zeros_like(cell); nc[shiftY:]=cell[:CH-shiftY]; sh[r*CH:(r+1)*CH,c*CW:(c+1)*CW]=nc
            fit=dict(shiftY=int(shiftY))
    frames=[]
    for i in range(12):
        r,c=divmod(i,4); frames.append(dict(cell=i,**st(sh[r*CH:(r+1)*CH,c*CW:(c+1)*CW])))
    clip=[f['cell'] for f in frames if f['bbox'] and (f['bbox'][0]<=0 or f['bbox'][2]>=CW-1 or f['bbox'][1]<=0 or f['bbox'][3]>=CH-1)]
    out=os.path.join(OUT,n+'.webp'); Image.fromarray(sh,'RGBA').save(out,'WEBP',lossless=True,quality=100,method=6,exact=True)
    assert (np.array(Image.open(out).convert('RGBA'))==sh).all(), n
    wb=sorted(f['body'] for f in frames[:8]); body=wb[len(wb)//2]; ob=open(out,'rb').read()
    o=old[n]
    idx['mobs'][n]=dict(name=o['name'],key=o['key'],kind=o['kind'],file=n+'.webp',sha256=sha(ob),bytes=len(ob),size=[1024,960],body=body,
        foot=[min(f['foot'] for f in frames),max(f['foot'] for f in frames)],clipCells=clip,fit=fit,temporary=False,source=dict(kind=s[0],files=files),
        replaces=dict(file='assets/r248/mobs/'+o['file'],sha256=o['sha256'],body=o['body'],temporary=True,kept=True),frames=frames)
    print(n,s[0],'body',body,'foot',idx['mobs'][n]['foot'],'clip',clip,'fit',fit,'bytes',len(ob))
if not ONLY: json.dump(idx,open(os.path.join(OUT,'index.json'),'w'),ensure_ascii=False,indent=1)
