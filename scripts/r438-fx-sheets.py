# R438: 드라이브 core24 남은 이펙트 시트(피격·상태·회복·보호·정화·블링크·광폭화)(24장, 256x256, 6x4, 12.5fps, QA_HOLD) → 게임용 WebP + index.json.
#  usage: python3 -I scripts/r438-fx-sheets.py <unzipped core24 root> <zip dir> <out dir r96/runtime-text/assets/r438/fx>
#  손질(그림 자체는 그대로): ① 칸 경계 3px 안의 알파를 지워 이웃 칸 연기 이음새가 새지 않게, ② 알파 ≤3 잔티 제거(원본 규칙과 같음),
#  ③ 완전 투명 RGB 를 0 으로(손실 압축 때 가장자리 색 번짐 방지). 그 뒤 WebP(q90, 알파 무손실)로 묶는다. 원본 PNG·ZIP 은 보존.
import sys,os,json,hashlib,glob,numpy as np
from PIL import Image
SRC,ZIPS,OUT=sys.argv[1:4]; os.makedirs(OUT,exist_ok=True)
sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
# 게임 이름 → (core24 폴더, 쓰는 쪽). R411(전투 14종)·R430(배경 9종)이 안 쓴 것 중 결함 없는 8종. 같은 그림을 다른 자리에 두 번 쓰지 않는다.
USE={
 'enemy-shockwave':('shockwave_v001','enemy'),'enemy-curse-brand':('curse_brand_v001','enemy'),'enemy-poison-mist':('poison_mist_v002','enemy'),
 'enemy-cold-wave':('cold_wave_v001','enemy'),'enemy-wraith-dash':('wraith_dash_v001','enemy'),
 'hero-healing':('healing_v001','hero'),'hero-barrier':('protective_barrier_v002','hero'),'hero-cleanse':('cleanse_wave_v001','hero'),
}
idx={'revision':'R438','generator':'scripts/r438-fx-sheets.py','cell':256,'cols':6,'rows':4,'frames':24,'fps':12.5,
     'source':'Google Drive core24 이펙트 시트(QA_HOLD, 읽기 전용 재사용)','approval':'사용자 2026-11-09 "구글드라이브에 이펙트 및 이펙트 적중효과 많으니까 알아서 잘적용해주고"','fx':{}}
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
    recolor=None
    if name=='hero-healing':
        # 호러 톤 맞춤(R438 1차 심사 조명색채 7.7): 선명한 잎 초록을 명도는 두고 채도 45%로 낮춘 뒤 창백한 은녹(0.93,1.0,0.95)으로.
        f=a[...,:3].astype(np.float32); g=(f*np.array([.299,.587,.114],np.float32)).sum(-1,keepdims=True)
        f=(g*.55+f*.45)*np.array([.93,1.0,.95],np.float32); a[...,:3]=np.clip(f,0,255).astype(np.uint8); recolor='saturation 45% + pale silver-green tint'
    out=os.path.join(OUT,name+'.webp'); Image.fromarray(a,'RGBA').save(out,'WEBP',quality=90,alpha_quality=100,method=6)
    zp=glob.glob(os.path.join(ZIPS,folder+'_sheet_qa_hold.zip'))
    idx['fx'][name]=dict(file=name+'.webp',side=side,effect=m['effect_id'],nameKo=m.get('name_ko'),version=m.get('version'),status=m.get('status'),
        pivot=m.get('pivot_px'),placement=m.get('placement'),direction=m.get('direction'),loop=m.get('loop'),fps=m.get('fps'),
        sheetSha256=sha(sp),zipSha256=sha(zp[0]) if zp else None,outSha256=sha(out),bytes=os.path.getsize(out),
        cleaned=dict(edgePixels=edge,faintPixels=faint),recolor=recolor)
    print(name,side,os.path.getsize(out),'edge',edge,'faint',faint)
json.dump(idx,open(os.path.join(OUT,'index.json'),'w'),ensure_ascii=False,indent=1)
