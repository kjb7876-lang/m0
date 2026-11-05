# R359: Dots 몹 후보(드라이브 결과 폴더, Claude 검토용 인계) -> R290 과 같은 무손실 WebP 4x3 시트 + index.json 덧붙이기
#  usage: python3 -I scripts/r359-mob-sheets.py <dl root> <out dir r96/runtime-text/assets/r290/mobs> <r248 mobs dir>
#   <dl root>/<id>/zip/<드라이브 zip 이름>  (내려받은 그대로, 크기·sha256 기록)
#   <dl root>/<id>/x/frame_01..12.png, sheet.png, SCORECARD.json, MANIFEST.json  (zip 을 풀어 둔 것; 경로·링크·스크립트 검사 뒤)
#  · 칸 256x320 RGBA 12장(걷기/부유 8 + 공격 4)을 R290 과 같은 4x3 시트로 묶는다. 픽셀 값은 바꾸지 않는다.
#  · 발 없는 부유형(결정·종이·동전·망령 일부)은 후보가 칸 가운데쯤(발끝 y≈200~290)에 그려져 있다. R248 그리기는 피벗이
#    [128,300] 고정이라 그대로 쓰면 그림자 위로 몸 하나만큼 떠 보인다 → 12칸 전체를 같은 값(shiftY)만큼 아래로 옮겨
#    걷기 8칸의 가장 낮은 발끝을 y=296(R248 망령 시트의 부유 높이 279~295 와 같은 띠)에 둔다. 칸 사이 상대 움직임(부유·돌진)은 그대로.
#    아래로 옮겨도 칸 밖으로 잘리지 않게(가장 낮은 불투명 픽셀 <= 319) 상한을 둔다. 발이 있는 몹(발끝 >= 290)은 옮기지 않는다.
#  · 기존 index.json(R290 다섯 마리)은 그대로 두고 R359 줄만 더한다. 드라이브 파일 id 는 넣지 않는다(공개 저장소) — 이름·sha256·크기만.
import sys,os,json,hashlib,glob,numpy as np
from PIL import Image
S=sys.argv[1]; OUT=sys.argv[2]; OLD=sys.argv[3]
APPROVAL='dots 후보(Claude 검토용 인계, 조건부·최종 아님) → 사용자 2026-11-05 적용 지시, PR 승인 대기'
FOOT_TARGET=296
# id: (인계 메모 요약 — 드라이브 *_Claude-handoff-*.txt 에서)
NOTE={
 'm025':'조명 v2(검갈 액체·파랑 코어). 최대 타격은 공격 10번째 칸(11 아님). 걷기 1~4·5~8 은 액체 압축·신장 두 주기.',
 'm026':'지름 정리 v2: 측면 3·7만 0.915배 축소, 나머지 10장 원본 그대로. 부유 동전.',
 'm051':'기존 녹회색 망령, 새 제작 없음. 부유형.',
 'm053':'기존 종이 세 장, 새 제작 없음. 부유형.',
 'm055':'기존 상아색 무안 망령, 새 제작 없음. 부유형.',
 'm057':'기존 녹색 결정, 새 제작 없음. 부유형.',
 'm058':'기존 남보라 결정, 새 제작 없음. 부유형.',
 'm059':'기존 올리브 결정, 새 제작 없음. 부유형.',
 'm061':'기존 보라 결정·민트 코어, 새 제작 없음. 부유형.',
 'm064':'기존 나무 몬스터, 새 제작 없음. 뿌리로 서는 형.',
 'm066':'기존 보라 로브 망령, 새 제작 없음. 부유형.',
 'm073':'기존 회녹색 재킷 남성, 새 제작 없음. 걷기 4→5·8→1 넓은 보폭 미검증.',
 'm074':'기존 남보라 망토 망령, 새 제작 없음. 부유형.',
 'm076':'기존 회보라 결정, 새 제작 없음. 부유형.',
 'm082':'기존 상아색 망토 망령, 새 제작 없음. 부유형.',
 'm085':'기존 올리브 망령, 새 제작 없음. 평균 7.7714(근소 통과). 부유형.',
 'm087':'기존 녹색 망령, 새 제작 없음. 평균 7.7714(근소 통과). 부유형.',
 'm088':'기존 회녹색 망령, 새 제작 없음. 부유형.',
 'm090':'기존 종이 세 장, 새 제작 없음. 부유형.',
 'm095':'기존 황갈 망령, 새 제작 없음. 부유형.',
}
old=json.load(open(os.path.join(OLD,'index.json')))['mobs']
sha=lambda b:hashlib.sha256(b).hexdigest()
def st(a):
    al=a[:,:,3]; m=al>16; ys,xs=np.where(m); top=int(ys.min())
    foot=int(np.where((al>64).sum(1)>=3)[0].max())
    return dict(top=top,foot=foot,body=foot-top+1,bbox=[int(xs.min()),top,int(xs.max()),int(ys.max())])
ip=os.path.join(OUT,'index.json'); idx=json.load(open(ip))
idx['r359']=dict(generator='scripts/r359-mob-sheets.py (candidate PNG -> lossless WebP 4x3 sheet; same-value vertical shift for floating mobs, pixels unchanged)',
                 source='Google Drive 결과 폴더(소유자 본인) SW-mNNN-*-candidate*.zip, 읽기 전용 재사용', approval=APPROVAL, footTarget=FOOT_TARGET)
for n in sorted(NOTE):
    x=os.path.join(S,n,'x'); zp=glob.glob(os.path.join(S,n,'zip','*.zip')); assert len(zp)==1,(n,zp)
    zb=open(zp[0],'rb').read()
    names=['frame_%02d.png'%i for i in range(1,13)]; cells=[]; src_files=[]
    for f in names:
        p=os.path.join(x,f); b=open(p,'rb').read(); im=Image.open(p); assert im.size==(256,320),(n,f,im.size)
        cells.append(np.array(im.convert('RGBA'))); src_files.append(dict(file=f,sha256=sha(b),bytes=len(b)))
    raw=np.zeros((960,1024,4),np.uint8)
    for i,c in enumerate(cells): r,cc=divmod(i,4); raw[r*320:(r+1)*320,cc*256:(cc+1)*256]=c
    sp=os.path.join(x,'sheet.png'); pre_eq=bool((np.array(Image.open(sp).convert('RGBA'))==raw).all())
    s0=[st(c) for c in cells]; wf=max(s['foot'] for s in s0[:8]); lowest=max(s['bbox'][3] for s in s0)
    shift=0 if wf>=290 else max(0,min(FOOT_TARGET-wf,319-lowest))
    sheet=np.zeros_like(raw)
    for i,c in enumerate(cells):
        r,cc=divmod(i,4); m=np.zeros_like(c)
        if shift: m[shift:]=c[:320-shift]; assert not c[320-shift:,:,3].any(),(n,i,'clip')
        else: m=c
        sheet[r*320:(r+1)*320,cc*256:(cc+1)*256]=m
    frames=[]
    for i in range(12):
        r,cc=divmod(i,4); frames.append(dict(cell=i,**st(sheet[r*320:(r+1)*320,cc*256:(cc+1)*256]),**src_files[i]))
    out=os.path.join(OUT,n+'.webp'); Image.fromarray(sheet,'RGBA').save(out,'WEBP',lossless=True,quality=100,method=6,exact=True)
    assert (np.array(Image.open(out).convert('RGBA'))==sheet).all(), n
    wb=sorted(f['body'] for f in frames[:8]); body=wb[len(wb)//2]
    ob=open(out,'rb').read(); sc=json.load(open(os.path.join(x,'SCORECARD.json')))
    idx['mobs'][n]=dict(name=old[n]['name'],key=old[n]['key'],kind=old[n]['kind'],file=n+'.webp',sha256=sha(ob),bytes=len(ob),size=[1024,960],
        body=body,foot=[min(f['foot'] for f in frames),max(f['foot'] for f in frames)],shiftY=shift,temporary=False,conditional=True,revision='R359',
        drive=dict(bundle=os.path.basename(zp[0]),sha256=sha(zb),bytes=len(zb),folder='결과 폴더(소유자 본인)'),
        dots=dict(mean=round(sc['mean'],4),scores=dict(zip(sc['fields'],sc['scores'])),status=sc.get('status'),actualPlayback=False,gameTested=False),
        source=dict(kind='frames',sheetMatchesPreassembled=pre_eq,sheetSha256=sha(open(sp,'rb').read())),
        replaces=dict(file='assets/r248/mobs/'+old[n]['file'],sha256=old[n]['sha256'],body=old[n]['body'],temporary=True,kept=True),
        reason='R248 임시 픽셀 시트(우리 코드가 그린 대체 그림)를 Dots 손그림 걷기·부유8+공격4 후보로 바꿈. '+NOTE[n]+(f' 부유형이라 12칸 모두 {shift}px 아래로 옮겨 걷기 발끝을 y≈{FOOT_TARGET}(그림자 바로 위)에 둠.' if shift else '')+' body=걷기 8칸 몸 높이 중앙값 → 화면 키는 R248 size 규칙 그대로.',
        approval=APPROVAL,lossless=True,frames=frames)
    print(n,'pre_eq',pre_eq,'shift',shift,'body',body,'foot',idx['mobs'][n]['foot'],'bytes',len(ob))
json.dump(idx,open(ip,'w'),ensure_ascii=False,indent=1)
