#!/usr/bin/env python3
"""R425 헌터 공격 7프레임 좌·우 시트(사용자 2026-11-08 09:58 드라이브 'hunter_left_sheet_v001.zip'·'hunter_right_sheet_v001.zip', 우 = 좌 정확 반전)
 -> r96/runtime-text/assets/r425/hunter/attack-{l,r}.webp (칸 384x512 -> 192x256, 4x2 격자 그대로, 알파 그대로) + index.json.
사용: python3 scripts/r425-hunter-attack.py <left_sheet.png> <right_sheet.png> <metadata.json> <left_zip> <right_zip>
원본 zip 은 저장소에 넣지 않는다(드라이브가 원천). 해시만 기록."""
import sys,json,hashlib,os
from PIL import Image
L,R,M,LZ,RZ=sys.argv[1:6]
out='r96/runtime-text/assets/r425/hunter';os.makedirs(out,exist_ok=True)
meta=json.load(open(M,encoding='utf8'))
sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
idx={'revision':'R425-hunter-1','hero':'hunter','source_id':meta['id'],'source_status':meta['status']+' (사용자 2026-11-08 09:58 게임 적용 지시)',
 'sources':{'left_sheet_zip':{'file':'hunter_left_sheet_v001.zip','bytes':os.path.getsize(LZ),'sha256':sha(LZ)},'right_sheet_zip':{'file':'hunter_right_sheet_v001.zip','bytes':os.path.getsize(RZ),'sha256':sha(RZ)}},
 'frames':meta['frame_count'],'cols':4,'cell':[192,256],'ms':meta['durations_ms'],'phases':meta['phases'],'release':4,'anims':{}}
for side,src in [('l',L),('r',R)]:
    im=Image.open(src).convert('RGBA');assert im.size==(1536,1024),im.size
    small=im.resize((768,512),Image.LANCZOS);p=f'{out}/attack-{side}.webp';small.save(p,'WEBP',quality=90,method=6)
    a=small.split()[3];heights=[]
    for f in range(meta['frame_count']):
        c,r=f%4,f//4;bb=a.crop((c*192,r*256,c*192+192,r*256+256)).point(lambda v:255 if v>40 else 0).getbbox()
        heights.append(bb[3]-bb[1] if bb else 0)
    pv=meta['pivots']['left' if side=='l' else 'right']
    idx['anims'][side]={'file':f'attack-{side}.webp','bytes':os.path.getsize(p),'sha256':sha(p),'source_sheet_sha256':sha(src),'anchor':[pv[0]/2,pv[1]/2],'body':sorted(heights)[len(heights)//2],'body_per_frame':heights,'faces':'left' if side=='l' else 'right'}
json.dump(idx,open(f'{out}/index.json','w',encoding='utf8'),ensure_ascii=False,indent=1)
print(json.dumps(idx,ensure_ascii=False)[:600])
