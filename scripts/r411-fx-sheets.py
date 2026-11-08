# R411: 드라이브 core24 스킬·적중 이펙트 시트(24장, 256x256, 6x4, 12.5fps, QA_HOLD) → 게임용 WebP + index.json.
#  usage: python3 -I scripts/r411-fx-sheets.py <unzipped core24 root> <zip dir> <out dir r96/runtime-text/assets/r411/fx>
#  손질(그림 자체는 그대로): ① 칸 경계 3px 안의 알파를 지워 이웃 칸 연기 이음새가 새지 않게, ② 알파 ≤3 잔티 제거(원본 규칙과 같음),
#  ③ 완전 투명 RGB 를 0 으로(손실 압축 때 가장자리 색 번짐 방지). 그 뒤 WebP(q90, 알파 무손실)로 묶는다. 원본 PNG·ZIP 은 보존.
import sys,os,json,hashlib,glob,numpy as np
from PIL import Image
SRC,ZIPS,OUT=sys.argv[1:4]; os.makedirs(OUT,exist_ok=True)
sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
# 게임 이름 → (core24 폴더, 쓰는 쪽). 영웅용 적중 시트는 파일 이름에 hit 를 넣어 R409 가림(veil)에서 빠지게 한다.
USE={
 'boss-meteor':('meteor_v001','boss'),'boss-fire-wall':('fire_wall_v001','boss'),'boss-corpse-explosion':('corpse_explosion_v001','boss'),
 'boss-tentacle-bind':('tentacle_bind_v002','boss'),'boss-gravity-well':('gravity_well_v001','boss'),'boss-bone-spikes':('bone_spikes_v001','boss'),
 'boss-infection-mark':('infection_mark_v001','boss'),'boss-lightning-strike':('lightning_strike_v002','boss'),'boss-ground-fissure':('ground_fissure_v001','boss'),
 'hit-explosion':('explosion_hit_v001','hero'),'hit-fire':('fire_hit_v001','hero'),'hit-ice-spikes':('ice_spikes_v001','hero'),
 'hit-chain-lightning':('chain_lightning_v001','hero'),'hit-teleport':('teleport_v001','hero'),
}
idx={'revision':'R411','generator':'scripts/r411-fx-sheets.py','cell':256,'cols':6,'rows':4,'frames':24,'fps':12.5,
     'source':'Google Drive core24 이펙트 시트(QA_HOLD, 읽기 전용 재사용)','approval':'사용자 2026-11-08 "구글드라이브 업로드된 이펙트 스킬 및적중 검토개선해서 보스와 영웅들에 차별점있게 적용"','fx':{}}
for name,(folder,side) in USE.items():
    d=os.path.join(SRC,folder); m=json.load(open(os.path.join(d,'metadata.json'))); sp=os.path.join(d,m['sheet']['file'])
    a=np.array(Image.open(sp).convert('RGBA')); assert a.shape[:2]==(1024,1536),(name,a.shape)
    edge=0
    for r in range(4):
        for c in range(6):
            cell=a[r*256:(r+1)*256,c*256:(c+1)*256]
            for sl in (np.s_[:3,:],np.s_[-3:,:],np.s_[:,:3],np.s_[:,-3:]):
                edge+=int((cell[sl][...,3]>0).sum()); cell[sl]=0
    faint=int(((a[...,3]>0)&(a[...,3]<=3)).sum()); a[a[...,3]<=3]=0
    out=os.path.join(OUT,name+'.webp'); Image.fromarray(a,'RGBA').save(out,'WEBP',quality=90,alpha_quality=100,method=6)
    zp=glob.glob(os.path.join(ZIPS,folder+'_sheet_qa_hold.zip'))
    idx['fx'][name]=dict(file=name+'.webp',side=side,effect=m['effect_id'],nameKo=m.get('name_ko'),version=m.get('version'),status=m.get('status'),
        pivot=m.get('pivot_px'),placement=m.get('placement'),direction=m.get('direction'),loop=m.get('loop'),fps=m.get('fps'),
        sheetSha256=sha(sp),zipSha256=sha(zp[0]) if zp else None,outSha256=sha(out),bytes=os.path.getsize(out),
        cleaned=dict(edgePixels=edge,faintPixels=faint))
    print(name,side,os.path.getsize(out),'edge',edge,'faint',faint)
json.dump(idx,open(os.path.join(OUT,'index.json'),'w'),ensure_ascii=False,indent=1)
