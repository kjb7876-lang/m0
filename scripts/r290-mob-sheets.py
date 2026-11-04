# R290: reviewed mob candidates (untrusted, read-only; run with python3 -I) -> lossless WebP 4x3 sheets + index.json
#  usage: python3 -I scripts/r290-mob-sheets.py <drive-review root> <out dir r96/runtime-text/assets/r290/mobs> <r248 mobs dir>
#  Each SRC entry is either 12 PNG frames (walk 0-7, attack 0-3, 256x320) or one 1024x960 sheet. Pixels are kept as is.
#  To add a future dots result: add one SRC entry and one ART line in r96/client-source/mob-art-r290.js, then sync/build.
import sys,os,json,hashlib,numpy as np
from PIL import Image
S=sys.argv[1]; OUT=sys.argv[2]; OLD=sys.argv[3]
os.makedirs(OUT,exist_ok=True)
APPROVAL='dots 생성 후보 → 사용자 승인 2026-11-04'
SRC={
 'm001':dict(frames='drive-review-1104/m001_rootbound_guard_walk8_attack4_v1',check='drive-review-1104/_sheets/m001_candidate_sheet1024x960.png',bundle='CANDIDATE_REVIEW_ONLY_m001_rootbound_guard_walk8_attack4_v1',drive='1ymldWAc1t0p0ZvyiYiogv_TIf1wYveP4'),
 'm003':dict(frames='drive-review-1104/m003_walk8_attack4_v1',check='drive-review-1104/_sheets/m003_candidate_sheet1024x960.png',bundle='CANDIDATE_REVIEW_ONLY_m003_walk8_attack4_v1',drive='11X3JvpCprrxlWbCCrOFSYDEZYrSSz1N_'),
 'm004':dict(frames='drive-review-1104/m004_walk8_attack4_v1',check='drive-review-1104/_sheets/m004_candidate_sheet1024x960.png',bundle='CANDIDATE_REVIEW_ONLY_m004_walk8_attack4_v1',drive='1pvHhvh7jbCkiD8suFzAdXPuAMgGHKevK'),
 'm005':dict(frames='drive-review-1104b/m005_x',check='drive-review-1104b/m005_x/m005_review_v2.png',bundle='CANDIDATE_REVIEW_ONLY_m005_anchor_v2.zip',drive='1dyITGlrvnTSPNk1XZp3FH78wiCbeontr'),
 'm014':dict(sheet='drive-review-1104b/m014_v1/04_m014_v1.png',bundle='04_m014_v1.png',drive='1MnlSxqbsy8MNxoxKFMRsmffEB2JOu-Ql'),
}
old=json.load(open(os.path.join(OLD,'index.json')))['mobs']
sha=lambda b:hashlib.sha256(b).hexdigest()
def st(a):
    al=a[:,:,3]; m=al>16; ys,xs=np.where(m); top=int(ys.min())
    foot=int(np.where((al>64).sum(1)>=3)[0].max())
    return dict(top=top,foot=foot,body=foot-top+1,bbox=[int(xs.min()),top,int(xs.max()),int(ys.max())])
idx={'revision':'R290','generator':'scripts/r290-mob-sheets.py (candidate PNG -> lossless WebP 4x3 sheet, pixels unchanged)','cell':[256,320],'cols':4,'walk':[0,8],'attack':[8,4],'pivot':[128,300],
     'source':'Google Drive folder Storyworld_Assets (CANDIDATE_REVIEW_ONLY bundles, read-only reuse)','approval':APPROVAL,'mobs':{}}
for n,s in SRC.items():
    frames=[];src_files=[]
    if 'frames' in s:
        names=[f'{n}_walk_{i:02d}.png' for i in range(8)]+[f'{n}_attack_{i:02d}.png' for i in range(4)];cells=[]
        for f in names:
            p=os.path.join(S,s['frames'],f); b=open(p,'rb').read(); im=Image.open(p); assert im.size==(256,320),(f,im.size)
            cells.append(np.array(im.convert('RGBA'))); src_files.append(dict(file=f,sha256=sha(b),bytes=len(b)))
        sheet=np.zeros((960,1024,4),np.uint8)
        for i,c in enumerate(cells): r,cc=divmod(i,4); sheet[r*320:(r+1)*320,cc*256:(cc+1)*256]=c
        pre_eq=bool((np.array(Image.open(os.path.join(S,s['check'])).convert('RGBA'))==sheet).all())
    else:
        p=os.path.join(S,s['sheet']); b=open(p,'rb').read(); im=Image.open(p); assert im.size==(1024,960),im.size
        sheet=np.array(im.convert('RGBA')); src_files.append(dict(file=os.path.basename(p),sha256=sha(b),bytes=len(b))); pre_eq=None
    for i in range(12):
        r,cc=divmod(i,4); frames.append(dict(cell=i,**st(sheet[r*320:(r+1)*320,cc*256:(cc+1)*256])))
        if len(src_files)==12: frames[-1].update(src_files[i])
    out=os.path.join(OUT,n+'.webp'); Image.fromarray(sheet,'RGBA').save(out,'WEBP',lossless=True,quality=100,method=6,exact=True)
    assert (np.array(Image.open(out).convert('RGBA'))==sheet).all(), n
    wb=sorted(f['body'] for f in frames[:8]); body=wb[len(wb)//2]
    ob=open(out,'rb').read()
    idx['mobs'][n]=dict(name=old[n]['name'],key=old[n]['key'],kind=old[n]['kind'],file=n+'.webp',sha256=sha(ob),bytes=len(ob),size=[1024,960],
        body=body,foot=[min(f['foot'] for f in frames),max(f['foot'] for f in frames)],temporary=False,
        drive=dict(id=s['drive'],bundle=s['bundle'],folder='Storyworld_Assets'),
        source=dict(kind='frames' if 'frames' in s else 'sheet',files=src_files if len(src_files)==1 else None,sheetMatchesPreassembled=pre_eq),
        replaces=dict(file='assets/r248/mobs/'+old[n]['file'],sha256=old[n]['sha256'],body=old[n]['body'],temporary=True,kept=True),
        reason='R248 임시 픽셀 시트(우리 코드가 그린 대체 그림)를 손그림 걷기8·공격4 후보로 바꿈. 발 그림자 없음(엔진 그림자 사용), 발끝 y≈297~301 → pivot 300 에 붙음. body=걷기 8칸 몸 높이 중앙값이라 화면 키는 R248 때와 같은 size 규칙으로 맞춰진다.',
        approval=APPROVAL,lossless=True,frames=frames)
    print(n,'pre_eq',pre_eq,'body',body,'foot',idx['mobs'][n]['foot'],'bytes',len(ob))
json.dump(idx,open(os.path.join(OUT,'index.json'),'w'),ensure_ascii=False,indent=1)
