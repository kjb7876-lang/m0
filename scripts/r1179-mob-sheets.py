# R1179: 무한생존 사몽 단계에 남은 R248 임시 픽셀 몹 → 드라이브 손그림 후보(R290·R410 규격: 칸 256x320, 4x3, 걷기 0-7 · 공격 8-11, pivot 128,300).
#  usage: python3 -I scripts/r1179-mob-sheets.py <out dir r96/runtime-text/assets/r1179/mobs> <id>=<sheet.png>[@<drive zip name>] ...
#  1024x960 후보 시트는 원본 픽셀 그대로 무손실 WebP 로 묶는다(배치·크기 안 바꿈). 원본 R248 시트는 지우지 않는다.
#  <id>=<sheet.png>:soften — HOLD 검토에서 '손·외곽에 픽셀처럼 각진 경계'가 지적된 후보는 미리곱한 RGBA 에 반지름 .6 가우시안을 한 번 걸어
#  계단 외곽만 누그러뜨린다(색·모양·칸 배치 그대로, 사용자 2026-11-18 'HOLD 자산도 코드·이미지 처리로 직접 고쳐 적용').
import sys,os,json,hashlib,numpy as np
from PIL import Image,ImageFilter
OUT=sys.argv[1];os.makedirs(OUT,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
def st(a):
    al=a[:,:,3];m=al>16
    if not m.any(): return None
    ys,xs=np.where(m);top=int(ys.min());rows=np.where((al>64).sum(1)>=3)[0]
    foot=int(rows.max()) if len(rows) else int(ys.max())
    return dict(top=top,foot=foot,body=foot-top+1)
idx={'revision':'R1179','generator':'scripts/r1179-mob-sheets.py','cell':[256,320],'cols':4,'walk':[0,8],'attack':[8,4],'pivot':[128,300],
     'source':'Google Drive 후보 묶음(검토·HOLD 포함, 읽기 전용 재사용)','approval':'사용자 2026-11-18 "사몽에피소드쪽에 픽셀몹 및 픽셀자산 남아있던데 … 닷츠랑협업해서 이미지잘적용", 2026-11-18 HOLD 자산 직접 개선 적용','mobs':{}}
for arg in sys.argv[2:]:
    mid,rest=arg.split('=',1);src,_,zipname=rest.partition('@');soft=src.endswith(':soften')
    if soft: src=src[:-len(':soften')]
    raw=open(src,'rb').read();im=Image.open(src).convert('RGBA')
    if soft:
        f=np.array(im).astype(np.float32);a=f[:,:,3:4]/255.0;pm=np.concatenate([f[:,:,:3]*a,f[:,:,3:4]],2)
        bl=[np.array(Image.fromarray(np.clip(pm[:,:,c],0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.6))).astype(np.float32) for c in range(4)]
        A=bl[3];rgb=np.stack(bl[:3],2)/np.maximum(A[:,:,None]/255.0,1e-3)
        im=Image.fromarray(np.dstack([np.clip(rgb,0,255),A]).astype(np.uint8),'RGBA')
    assert im.size==(1024,960),im.size
    a=np.array(im);cells=[a[r*320:(r+1)*320,c*256:(c+1)*256] for r in range(3) for c in range(4)]
    s=[st(x) for x in cells];body=int(np.median([x['body'] for x in s[:8]]));feet=[x['foot'] for x in s[:8]]
    out=os.path.join(OUT,mid+'.webp');im.save(out,'WEBP',lossless=True,quality=100,method=6)
    b=open(out,'rb').read()
    idx['mobs'][mid]=dict(file=mid+'.webp',sha256=sha(b),bytes=len(b),size=[1024,960],body=body,foot=[min(feet),max(feet)],
        source=dict(kind='sheet',zip=zipname,file='sheet.png',sha256=sha(raw),bytes=len(raw)),processing=('soften: premultiplied gaussian r=.6 (edge staircase only)' if soft else 'none (pixels as-is)'),replaces='assets/r248/mobs/'+mid+'.webp')
    print(mid,body,feet,len(b))
json.dump(idx,open(os.path.join(OUT,'index.json'),'w'),ensure_ascii=False,indent=1)
