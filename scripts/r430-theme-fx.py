# R430: 드라이브 core24 이펙트 시트(2026-11-08 생성, QA_HOLD) → 테마 맵 생동감(최상 그래픽 전용) 시트.
#  usage: python3 -I scripts/r430-theme-fx.py <drive root: <name>/x/metadata.json + sheet png> <out r96/runtime-text/assets/r430>
#  개선(원본 PNG·ZIP 은 보존, 그림을 새로 그리지 않음):
#   ① 칸 경계 3px 알파 지우기(이웃 칸 연기 이음새) · 알파 ≤3 잔티 제거 · 투명 RGB 0(압축 번짐 방지)  — R411 과 같은 손질
#   ② 지속 루프 추출: 점화→타오름→꺼짐 한 번짜리 시트에서 타오르는 구간만 골라, 끝 K장을 앞 K장에 미리곱한 알파로 교차 혼합해
#      이음새 없는 반복 루프로 만든다(화염벽 14장→10장, 독안개 24장→20장). 맵에 오래 머물러도 '켜졌다 꺼졌다'가 반복되지 않는다.
#   ③ 칸 192px 로 줄여(맵 장식은 화면에서 1~2칸 크기) 용량을 줄인다. WebP q88, 알파 무손실.
import sys,os,json,hashlib,numpy as np
from PIL import Image
SRC,OUT=sys.argv[1:3];os.makedirs(OUT,exist_ok=True)
sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
CELL=256;OC=192
# 게임 이름 → (드라이브 폴더, 쓰는 프레임 범위, 루프 교차 장수 K(0=한 번 재생), 용도)
USE={
 'fire-loop':('fire_wall',(5,19),4,'방화 맵 불길(지속 루프)'),
 'mist-loop':('poison_mist',(0,24),4,'중독 도시·늪 독안개(지속 루프)'),
 'fissure':('ground_fissure',(0,24),0,'무너진 성·추락 지면 균열(가끔)'),
 'arc':('lightning_strike',(0,24),0,'기계 맵 전기 방전(가끔)'),
 'rift':('gravity_well',(0,24),0,'카이로노미콘 시간 균열(가끔)'),
 'blight':('infection_mark',(0,24),0,'피로 물든 병원 감염 번짐(가끔)'),
 'tendril':('tentacle_bind',(0,24),0,'늪 물가 촉수(드물게)'),
 'frost':('cold_wave',(0,24),0,'눈보라 냉기 돌풍(가끔)'),
 'brand':('curse_brand',(0,24),0,'사이비 성당 저주 낙인(가끔)'),
}
idx={'revision':'R430','generator':'scripts/r430-theme-fx.py','cell':OC,'source':'Google Drive core24 이펙트 시트(2026-11-08 생성, QA_HOLD, 읽기 전용 재사용)',
     'approval':'사용자 2026-11-08 "구글드라이브 이펙트자산 어제오늘생성한거 확인후 개선후 적절하게 배치" + "테마가 확실한 맵 곳곳에 프레임애니메이션(최상그래픽에서만)"','fx':{}}
def cells(a):
    out=[]
    for r in range(4):
        for c in range(6):
            cell=a[r*CELL:(r+1)*CELL,c*CELL:(c+1)*CELL].copy()
            for sl in (np.s_[:3,:],np.s_[-3:,:],np.s_[:,:3],np.s_[:,-3:]):cell[sl]=0
            out.append(cell)
    return out
for name,(folder,(a0,a1),K,use) in USE.items():
    d=os.path.join(SRC,folder,'x');m=json.load(open(os.path.join(d,'metadata.json')));sp=os.path.join(d,m['sheet']['file'])
    a=np.array(Image.open(sp).convert('RGBA')).astype(np.float32);assert a.shape[:2]==(1024,1536),(name,a.shape)
    fr=cells(a)[a0:a1]
    if K:
        N=len(fr);pm=[np.concatenate([f[...,:3]*f[...,3:]/255,f[...,3:]],-1) for f in fr]
        loop=[]
        for i in range(N-K):
            if i<K:w=(i+1)/(K+1);x=pm[N-K+i]*(1-w)+pm[i]*w
            else:x=pm[i]
            loop.append(x)
        fr=[np.concatenate([np.where(x[...,3:]>0,x[...,:3]*255/np.maximum(x[...,3:],1e-3),0),x[...,3:]],-1) for x in loop]
    n=len(fr);cols=min(6,n);rows=(n+cols-1)//cols
    sheet=Image.new('RGBA',(cols*OC,rows*OC),(0,0,0,0))
    for i,f in enumerate(fr):
        f=np.clip(f,0,255).astype(np.uint8);f[f[...,3]<=3]=0
        im=Image.fromarray(f,'RGBA').resize((OC,OC),Image.LANCZOS);b=np.array(im);b[b[...,3]<=3]=0;b[b[...,3]==0,:3]=0
        sheet.paste(Image.fromarray(b,'RGBA'),((i%cols)*OC,(i//cols)*OC))
    out=os.path.join(OUT,name+'.webp');sheet.save(out,'WEBP',quality=88,alpha_quality=100,method=6)
    piv=[round(p*OC/CELL,1) for p in m['pivot_px']]
    idx['fx'][name]=dict(file=name+'.webp',use=use,effect=m['effect_id'],nameKo=m.get('name_ko'),version=m.get('version'),status=m.get('status'),
        frames=n,cols=cols,rows=rows,loop=bool(K) or bool(m.get('loop')),sourceFrames=[a0,a1],crossfade=K,fps=m.get('fps'),pivot=piv,placement=m.get('placement'),
        sheetSha256=sha(sp),outSha256=sha(out),bytes=os.path.getsize(out))
    print(name,n,cols,rows,os.path.getsize(out),piv)
json.dump(idx,open(os.path.join(OUT,'index.json'),'w'),ensure_ascii=False,indent=1)
