# R363: Dots 'legacy-r92' 몹 다시 그림(드라이브 결과 폴더 SW-legacy-*.zip) -> R248/R290 과 같은 4x3 시트(칸 256x320, 걷기 8 + 공격 4, pivot [128,300])
#  usage: python3 -I scripts/r363-legacy-mob-sheets.py <dl root> <r92 strips dir(site/assets/r92/mobs)> <repo r96/runtime-text/assets>
#   <dl root>/<Mnnn>/zip/<드라이브 zip 이름>, <dl root>/<Mnnn>/x/ (zip 을 풀어 둔 것; 경로·링크 검사 뒤)
#  · 사용자 2026-11-06 "레거시도써봐". 인계 메모는 '자동 게임 적용·배포 금지'(자동 적용 금지) → 사람이 하나씩 맞춰 보고 확정 줄만 넣는다(r96/qa/r363/legacy-mapping.json).
#  · 걷기·공격이 다 있는 묶음(M102)은 8칸을 같은 배율·같은 기준점으로 옮긴다(걷기 4칸은 1-2-3-4-1-2-3-4 로 8칸).
#    공격만 온 묶음(M127·M128)은 게임이 지금 쓰는 그 몹의 옛 r92 걷기 8칸(같은 원본에서 나온 그림, assets/r92/mobs/Mnnn-move.png)을 그대로 걷기로 쓰고
#    새 공격 4칸만 붙인다. 두 묶음의 몸 키(걷기 중앙값 = 공격 4번째 대기 자세 키)를 같게 맞춘다.
#  · 발끝은 R359 처럼 y=296(그림자 바로 위)에 둔다. 가로 기준은 걷기·대기 자세의 몸 가운데(공격 칸 사이 상대 움직임은 그대로).
#  · 배율을 바꾸므로 픽셀은 다시 뽑힌다(LANCZOS). 원본(zip·PNG)은 건드리지 않는다. 드라이브 파일 id 는 넣지 않는다(공개 저장소).
import sys,os,json,glob,hashlib,numpy as np
from PIL import Image
DL,R92,ASSETS=sys.argv[1],sys.argv[2],sys.argv[3]
CW,CH,FOOT=256,320,296
APPROVAL="Dots legacy-r92 다시 그림 후보(조건부·최종 아님, 인계 메모의 '자동 게임 적용 금지'는 자동 적용 금지) → 사용자 2026-11-06 '레거시도써봐' 수동 적용, PR 승인 대기"
sha=lambda b:hashlib.sha256(b).hexdigest()
r92idx=json.load(open(os.path.join(ASSETS,'r92/mobs/index.json')))
# 확정 줄만(근거는 r96/qa/r363/legacy-mapping.json). out: 'r290'(R248 시트 교체 = R290 ART 표) | 'r363'(원래 그림 몹을 R248 시트 그리기에 새로 붙임)
ROWS=[
 dict(m='M127',id='m052',out='r290',name='공실 표기 잔재',walk='r92'),
 dict(m='M128',id='L128',out='r363',name='흑장미 눈가린 신도',nativeId='c101-e1',kind='human',weapon='claws',walk='r92'),
 dict(m='M102',id='L102',out='r363',name='시간수문장',nativeId='kair-guardian-39',kind='golem',weapon='none',walk='pack'),
]
def bbox(a,t=24):
    ys,xs=np.where(a[:,:,3]>t); return int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())
def foot(a): return int(np.where((a[:,:,3]>64).sum(1)>=3)[0].max())
def scaled(a,k):
    im=Image.fromarray(a,'RGBA'); w,h=im.size
    return np.array(im.resize((max(1,round(w*k)),max(1,round(h*k))),Image.LANCZOS))
def place(cell,a,ax,fy):
    # a 의 (ax,fy) 를 칸의 (128,FOOT) 에 놓는다
    ox,oy=128-round(ax),FOOT-round(fy); h,w=a.shape[:2]
    x0,y0=max(0,ox),max(0,oy); x1,y1=min(CW,ox+w),min(CH,oy+h)
    sub=a[y0-oy:y1-oy,x0-ox:x1-ox]
    lost=int((a[:,:,3]>24).sum())-int((sub[:,:,3]>24).sum())
    cell[y0:y1,x0:x1]=sub; return lost
def st(c):
    x0,y0,x1,y1=bbox(c,16); f=foot(c); return dict(top=y0,foot=f,body=f-y0+1,bbox=[x0,y0,x1,y1])
idx_r363={'revision':'R363','cell':[CW,CH],'cols':4,'walk':[0,8],'attack':[8,4],'pivot':[128,300],'footTarget':FOOT,
 'generator':'scripts/r363-legacy-mob-sheets.py (Dots legacy-r92 repaint attack/walk + r92 legacy walk -> lossless WebP 4x3 sheet, resampled)',
 'source':'Google Drive 결과 폴더(소유자 본인) SW-legacy-*.zip, 읽기 전용 재사용','approval':APPROVAL,'mobs':{}}
p290=os.path.join(ASSETS,'r290/mobs/index.json'); idx290=json.load(open(p290))
for R in ROWS:
    m=R['m']; x=os.path.join(DL,m,'x'); zp=glob.glob(os.path.join(DL,m,'zip','*.zip')); assert len(zp)==1,(m,zp); zb=open(zp[0],'rb').read()
    sc=json.load(open(os.path.join(x,'SCORECARD.json')))
    src=[]
    def load(p):
        b=open(p,'rb').read(); src.append(dict(file=os.path.basename(p),sha256=sha(b),bytes=len(b))); a=np.array(Image.open(p).convert('RGBA')); return a
    if R['walk']=='pack':
        fr=[load(os.path.join(x,'frame_%02d.png'%i)) for i in range(1,9)]; walk4,att=fr[:4],fr[4:]
        # 같은 배율·같은 기준점: Dots 가 걷기·공격 발 높이를 맞춰 둔 배치를 그대로 지킨다
        fy=max(foot(a) for a in walk4); ax=np.median([(bbox(a)[0]+bbox(a)[2])/2 for a in walk4])
        wb=sorted(foot(a)-bbox(a)[1]+1 for a in walk4)[2]
        allb=[bbox(a) for a in fr];
        k=min(FOOT*0.93/max(fy-b[1] for b in allb),  # 위로 칸 안
              min((128-2)/max(1,ax-b[0]) for b in allb),min((128-2)/max(1,b[2]-ax) for b in allb),1.0)
        cells=[(scaled(a,k),ax*k,fy*k) for a in walk4+walk4+att]
        walksrc=dict(kind='pack',frames=[1,2,3,4,1,2,3,4])
    else:
        t=r92idx['groups'][m]['tracks']['move']; sp=os.path.join(R92,os.path.basename(t['path'])); sb=open(sp,'rb').read(); assert sha(sb)==t['sha256'],(m,'r92 strip sha')
        S=np.array(Image.open(sp).convert('RGBA')); n=t['frames']; cw=S.shape[1]//n
        walk=[S[:,i*cw:(i+1)*cw] for i in range(n)]
        att=[load(os.path.join(x,'frame_%02d.png'%i)) for i in range(1,5)]
        wfy=max(foot(a) for a in walk); wax=np.median([(bbox(a)[0]+bbox(a)[2])/2 for a in walk]); wbody=sorted(foot(a)-bbox(a)[1]+1 for a in walk)[n//2]
        afy=max(foot(a) for a in att); aax=(bbox(att[3])[0]+bbox(att[3])[2])/2; abody=foot(att[3])-bbox(att[3])[1]+1
        ka_per_kw=wbody/abody  # 공격 4번째(대기) 키 = 걷기 키
        # 몸 키 B: 칸 안에 들어가는 가장 큰 값(위·좌우 2px 여유), 최대 260
        def fits(B):
            kw,ka=B/wbody,B/abody
            for a,k,ax,fy in [(a,kw,wax,wfy) for a in walk]+[(a,ka,aax,afy) for a in att]:
                b=bbox(a);
                if (fy-b[1])*k>FOOT-2 or (ax-b[0])*k>126 or (b[2]-ax)*k>126:return False
            return True
        B=260
        while B>60 and not fits(B):B-=2
        kw,ka=B/wbody,B/abody
        cells=[(scaled(a,kw),wax*kw,wfy*kw) for a in walk]+[(scaled(a,ka),aax*ka,afy*ka) for a in att]
        walksrc=dict(kind='r92-legacy-walk',path=t['path'],sha256=t['sha256'],bytes=len(sb),frames=n,finalStatus=t.get('finalStatus'),
                     note='게임이 지금 이 몹에 쓰는 옛 r92 걷기 8칸(같은 원본 계열). Dots 묶음에는 걷기가 없음(이동 보류).')
    sheet=np.zeros((CH*3,CW*4,4),np.uint8); frames=[]; lost=0
    for i,(a,ax,fy) in enumerate(cells):
        c=np.zeros((CH,CW,4),np.uint8); lost+=place(c,a,ax,fy); r,cc=divmod(i,4); sheet[r*CH:(r+1)*CH,cc*CW:(cc+1)*CW]=c; frames.append(dict(cell=i,**st(c)))
    assert lost==0,(m,'clipped',lost)
    outdir=os.path.join(ASSETS,R['out'],'mobs'); os.makedirs(outdir,exist_ok=True); fn=R['id']+'.webp'; op=os.path.join(outdir,fn)
    Image.fromarray(sheet,'RGBA').save(op,'WEBP',lossless=True,quality=100,method=6,exact=True)
    assert (np.array(Image.open(op).convert('RGBA'))==sheet).all(),m
    ob=open(op,'rb').read(); wb=sorted(f['body'] for f in frames[:8]); body=wb[4]
    row=dict(name=R['name'],legacy=m,file=fn,sha256=sha(ob),bytes=len(ob),size=[CW*4,CH*3],body=body,
        foot=[min(f['foot'] for f in frames),max(f['foot'] for f in frames)],temporary=False,conditional=True,revision='R363',
        drive=dict(bundle=os.path.basename(zp[0]),sha256=sha(zb),bytes=len(zb),folder='결과 폴더(소유자 본인)'),
        dots=dict(mean=round(sc['mean'],4),scores=dict(zip(sc['fields'],sc['scores'])),scope=sc.get('scope'),actualPlayback=False,gameTested=False),
        sourceFrames=src,walkSource=walksrc,approval=APPROVAL,lossless=True,resampled=True,frames=frames)
    if R['out']=='r290':
        old=idx290['mobs'].get(R['id']); r248=json.load(open(os.path.join(ASSETS,'r248/mobs/index.json')))['mobs'][R['id']]
        assert r248['name']==R['name']
        row.update(key=r248['key'],kind=r248['kind'],replaces=dict(file='assets/r248/mobs/'+r248['file'],sha256=r248['sha256'],body=r248['body'],temporary=True,kept=True),
                   reason='R248 임시 픽셀 시트(이름 낱말로 그린 대체 그림)를 그 몹의 원래 그림(옛 r92 '+m+', murder04-e1 원본) 계열 Dots 다시 그림 공격 4 + 옛 걷기 8 로 바꿈.')
        idx290['mobs'][R['id']]=row
        idx290['r363']=dict(generator=idx_r363['generator'],source=idx_r363['source'],approval=APPROVAL,footTarget=FOOT,mobs=[R['id']])
    else:
        row.update(nativeId=R['nativeId'],kind=R['kind'],weapon=R['weapon'],layer='STORY',
                   reason='원래 그림(옛 r92 '+m+')으로 그려지던 몹에 Dots 다시 그림을 붙임. R248 시트 그리기에 nativeId+이름 열쇠로만 붙인다(같은 이름의 다른 원본 몹은 그대로).')
        idx_r363['mobs'][R['id']]=row
    print(m,R['id'],'body',body,'foot',row['foot'],'bytes',len(ob))
json.dump(idx290,open(p290,'w'),ensure_ascii=False,indent=1)
os.makedirs(os.path.join(ASSETS,'r363/mobs'),exist_ok=True)
json.dump(idx_r363,open(os.path.join(ASSETS,'r363/mobs/index.json'),'w'),ensure_ascii=False,indent=1)
