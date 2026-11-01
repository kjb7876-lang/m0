#!/usr/bin/env python3
"""R190: OpenGameArt 'Animated particle effects #2' (para, CC0) 의 피 튐 시트 3장을 게임용 webp 로 옮긴다.
사용: python3 -I scripts/r190-oga-blood-import.py <para_CC0_particlefx-2.zip>
· zip SHA-256 을 확인하고, 경로 검사 후 필요한 PNG 3장만 메모리에서 읽는다(압축 해제 파일을 실행하지 않음).
· 4×4 칸(128px) 그대로, 무손실에 가까운 webp(q92)로 저장하고 원본 sha256·크기·출처·라이선스를 index.json 에 적는다."""
import sys,io,json,hashlib,zipfile,os
from PIL import Image
ZIP_SHA='469676f3fc08509e4ec824147d179a51a9a71c380a3d0fd142cf8e30355f50f8'
PICK={'blood-splash':'blood_hit_01.png','blood-burst':'blood_hit_04.png','blood-death':'blood_hit_08.png'}
OUT=os.path.join(os.path.dirname(__file__),'..','r96','runtime-text','assets','r190','blood')
def main(z):
    raw=open(z,'rb').read();h=hashlib.sha256(raw).hexdigest()
    if h!=ZIP_SHA: sys.exit('zip sha256 mismatch: '+h)
    zf=zipfile.ZipFile(io.BytesIO(raw))
    for n in zf.namelist():
        if n.startswith('/') or '..' in n.split('/'): sys.exit('unsafe member '+n)
    byname={os.path.basename(n):n for n in zf.namelist()}
    os.makedirs(OUT,exist_ok=True);eff={}
    for key,fn in PICK.items():
        data=zf.read(byname[fn]);im=Image.open(io.BytesIO(data)).convert('RGBA');W,H=im.size;c=W//4
        frames=[i for i in range(16) if im.crop(((i%4)*c,(i//4)*c,(i%4)*c+c,(i//4)*c+c)).getbbox()]
        out=os.path.join(OUT,key+'.webp');im.save(out,'WEBP',quality=92,method=6);ob=open(out,'rb').read()
        eff[key]={'file':key+'.webp','frame':[c,c],'columns':4,'frames':max(frames)+1,'pivot':[c//2,c//2],
                  'sha256':hashlib.sha256(ob).hexdigest(),'bytes':len(ob),'source_file':fn,'source_sha256':hashlib.sha256(data).hexdigest(),'source_bytes':len(data),'source_size':[W,H]}
    meta={'source':'https://opengameart.org/content/animated-particle-effects-2','author':'para','license':'CC0 (page license field: "License(s): CC0")',
          'download':'https://opengameart.org/sites/default/files/para_CC0_particlefx-2.zip','zip_sha256':ZIP_SHA,'zip_bytes':len(raw),
          'conversion':'PNG 512x512(4x4, 128px) -> WEBP q92, 크기·칸 그대로','use':'R190 몹 피격 피 튐(blood-splash/burst)·쓰러짐(blood-death) — 적대 효과 핏빛','effects':eff,
          'excluded':{'fire_*':'만화풍 밝은 주황 불꽃 — 그림체 불일치','teleporter_*':'청백 픽셀 느낌 — 불일치','air_bubbles_*':'쓸 곳 없음','blood_hit_02/03/05/06':'같은 역할 중복'}}
    json.dump(meta,open(os.path.join(OUT,'index.json'),'w',encoding='utf8'),ensure_ascii=False,indent=1)
    print(json.dumps({k:(v['frames'],v['bytes']) for k,v in eff.items()}))
if __name__=='__main__': main(sys.argv[1])
