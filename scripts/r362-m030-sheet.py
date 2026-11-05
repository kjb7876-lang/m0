# R362: Dots m030 손그림 후보(드라이브 결과 폴더 SW-m030-painted-static-candidate-*.zip, Claude 검토용 인계) -> R290/R359 와 같은 무손실 WebP 4x3 시트 + index.json 한 줄.
#  usage: python3 -I scripts/r362-m030-sheet.py <dl root> <out dir r96/runtime-text/assets/r290/mobs> <r248 mobs dir>
#   <dl root>/m030/zip/<드라이브 zip 이름>, <dl root>/m030/x/frame_01..12.png, sheet.png, SCORECARD.json, MANIFEST.json, reference-r248.webp
#  · R359 는 인계 메모의 '이름(불길 속의 곰)과 몸(개·늑대형) 불일치 · 자동 ID 매핑 금지' 때문에 m030 을 보류했다.
#    사용자 2026-11-06 결정: "쓰고 이름을바꿔 개와늑대의시간으로" → 그림은 쓰고, 게임 안 이름은 '개와 늑대의 시간'(mob-rename-r362.js).
#  · ID 연결 근거: 후보 zip 안 reference-r248.webp 의 sha256 == R248 m030 임시 시트 sha256 (MANIFEST original_reference_sha256 과도 같음).
#  · 칸 256x320 RGBA 12장(걷기 8 + 공격 4), 픽셀 값은 바꾸지 않는다. 네발 몹이라 발끝 >= 290 → 아래로 옮기지 않는다(R359 규칙 그대로).
#  · 드라이브 파일 id 는 넣지 않는다(공개 저장소) — 묶음 이름·sha256·크기만.
import sys,os,json,hashlib,glob,numpy as np
from PIL import Image
S=sys.argv[1]; OUT=sys.argv[2]; OLD=sys.argv[3]
N='m030'; NAME='개와 늑대의 시간'; OLDNAME='불길 속의 곰'; FOOT_TARGET=296
APPROVAL='dots 후보(Claude 검토용 인계, 조건부·최종 아님) → 사용자 2026-11-06 결정 "쓰고 이름을바꿔 개와늑대의시간으로", PR 승인 대기'
NOTE=('R248 픽셀 참조(붉은 몸·긴 다리·각진 주둥이·짧게 올라간 꼬리·등불꽃)를 손칠 질감으로 새로 그린 걷기8·공격4(웅크림→이륙→공중 신전→회복). '
      '인계 메모: 걷기 1·5 앞발 교대 미해결, 공격 12 앞발 공중(완전 착지 아님), 실제 재생·게임 미검증.')
sha=lambda b:hashlib.sha256(b).hexdigest()
def st(a):
    al=a[:,:,3]; m=al>16; ys,xs=np.where(m); top=int(ys.min())
    foot=int(np.where((al>64).sum(1)>=3)[0].max())
    return dict(top=top,foot=foot,body=foot-top+1,bbox=[int(xs.min()),top,int(xs.max()),int(ys.max())])
old=json.load(open(os.path.join(OLD,'index.json')))['mobs'][N]
assert old['name']==OLDNAME,old
x=os.path.join(S,N,'x'); zp=glob.glob(os.path.join(S,N,'zip','*.zip')); assert len(zp)==1,zp
zb=open(zp[0],'rb').read(); man=json.load(open(os.path.join(x,'MANIFEST.json')))
ref=sha(open(os.path.join(x,'reference-r248.webp'),'rb').read())
assert ref==old['sha256']==man['original_reference_sha256'],(ref,old['sha256'])
cells=[];src_files=[]
for i in range(1,13):
    p=os.path.join(x,'frame_%02d.png'%i); b=open(p,'rb').read(); im=Image.open(p); assert im.size==(256,320),(p,im.size)
    cells.append(np.array(im.convert('RGBA'))); src_files.append(dict(file='frame_%02d.png'%i,sha256=sha(b),bytes=len(b)))
sheet=np.zeros((960,1024,4),np.uint8)
for i,c in enumerate(cells): r,cc=divmod(i,4); sheet[r*320:(r+1)*320,cc*256:(cc+1)*256]=c
sp=os.path.join(x,'sheet.png'); pre_eq=bool((np.array(Image.open(sp).convert('RGBA'))==sheet).all())
frames=[]
for i in range(12):
    r,cc=divmod(i,4); frames.append(dict(cell=i,**st(sheet[r*320:(r+1)*320,cc*256:(cc+1)*256]),**src_files[i]))
wf=max(f['foot'] for f in frames[:8]); assert wf>=290,wf  # 발 있는 네발 몹: 옮기지 않음
out=os.path.join(OUT,N+'.webp'); Image.fromarray(sheet,'RGBA').save(out,'WEBP',lossless=True,quality=100,method=6,exact=True)
assert (np.array(Image.open(out).convert('RGBA'))==sheet).all()
wb=sorted(f['body'] for f in frames[:8]); body=wb[len(wb)//2]
ob=open(out,'rb').read(); sc=json.load(open(os.path.join(x,'SCORECARD.json')))
ip=os.path.join(OUT,'index.json'); idx=json.load(open(ip))
idx['r362']=dict(generator='scripts/r362-m030-sheet.py (candidate PNG -> lossless WebP 4x3 sheet, pixels unchanged)',
                 source='Google Drive 결과 폴더(소유자 본인) SW-m030-painted-static-candidate-*.zip, 읽기 전용 재사용', approval=APPROVAL,
                 rename=dict(old=OLDNAME,new=NAME,overlay='mob-rename-r362.js'),idLink='reference-r248.webp sha256 == R248 m030 sheet sha256')
idx['mobs'][N]=dict(name=NAME,nameBefore=OLDNAME,key=old['key'],kind=old['kind'],file=N+'.webp',sha256=sha(ob),bytes=len(ob),size=[1024,960],
    body=body,foot=[min(f['foot'] for f in frames),max(f['foot'] for f in frames)],shiftY=0,temporary=False,conditional=True,revision='R362',
    drive=dict(bundle=os.path.basename(zp[0]),sha256=sha(zb),bytes=len(zb),folder='결과 폴더(소유자 본인)'),
    dots=dict(mean=round(sc['mean'],4),scores=dict(zip(sc['fields'],sc['scores'])),status=sc.get('status'),actualPlayback=False,gameTested=False),
    source=dict(kind='frames',sheetMatchesPreassembled=pre_eq,sheetSha256=sha(open(sp,'rb').read()),referenceR248Sha256=ref),
    replaces=dict(file='assets/r248/mobs/'+old['file'],sha256=old['sha256'],body=old['body'],temporary=True,kept=True),
    reason='R248 임시 픽셀 시트(우리 코드가 그린 대체 그림)를 Dots 손그림 걷기8+공격4 후보로 바꿈. '+NOTE+' body=걷기 8칸 몸 높이 중앙값 → 화면 키는 R248 size 규칙 그대로.',
    approval=APPROVAL,lossless=True,frames=frames)
json.dump(idx,open(ip,'w'),ensure_ascii=False,indent=1)
print(N,'pre_eq',pre_eq,'body',body,'foot',idx['mobs'][N]['foot'],'bytes',len(ob))
