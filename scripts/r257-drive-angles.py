#!/usr/bin/env python3
"""R257: 드라이브 각도·배치 변형본(2026-11-03) -> assets/r257/props/<id>.webp (게임용 파생본).
원본 PNG 는 바꾸지 않는다. 묶음 MANIFEST 의 SHA-256 을 확인하고, R138 과 같은 방식(알파 상자 alpha>=16·PAD 6·긴 변 512·WebP 92, 알파 무손실 품질 100)으로 쓴다.
index.json 에 Drive id·zip 이름·zip/원본/파생 해시·크기·상태(README/QA 의 status 그대로)·용도를 남긴다.
usage: python3 -I scripts/r257-drive-angles.py <staging dir: <zip 이름>/x/<묶음>/...> [out-dir]"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image
src=Path(sys.argv[1]);out=Path(sys.argv[2] if len(sys.argv)>2 else 'r96/runtime-text/assets/r257/props');out.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest();A,PAD,MAX=16,6,512
# id: (zip 이름, Drive id, 원래 게임 소품(있으면), 쓰는 곳)
JOBS={
 'chain-end':('StoryWorld-Ash-Chain-end-oblique-v1','1nyd5zfcdytZouD_JRAe9dNnhl8mYz4mU','r138 chain','dist03 재에 묻힌 사슬의 끝 쪽 비스듬한 각도 — 같은 방의 두 번째 사슬에 써서 두 개가 같은 각도로 반복되지 않게'),
 'weed-opp':('StoryWorld-Plain-Waterweed-opposite-placement-v1','1NIpEXEONefhczbxmc7QJl4atoJfEicIc','r138 weed','dist02 늪 수초의 반대 방향 배치 — 두 번째 수초'),
 'cwindow-obl':('StoryWorld-Cabin-Window-opposite-oblique-v1','16tlkGy_F9pHjrfWaOvKzgKQk8n4XoDuv','r138 cwindow','ep1b06b 오두막 창문의 반대 사선 — 왼쪽(-x) 벽에 붙을 때(뒷벽 -y 은 원래 정면 그림)'),
 'armor':('StoryWorld-Anonymous-Armor-low-placement-v1','15aUThDm9OZmYEiMvSqX62vmyd38JRf3d',None,'dist04 재에 묻힌 이름 없는 부서진 갑옷(바닥 비충돌 장식)'),
 'kitchen':('StoryWorld-Organic-Kitchen-low-placement-v1','1hGbjkOpmeNz9F1P4Jj6oMpBnuh81xZ1-',None,'ep1b04 탐식의 주방 유기질 바닥 전이(바닥 비충돌 장식)'),
 'cable':('StoryWorld-Snow-Cable-end-placement-v1','1zUDa5ff5JJsbDXyHGsWKm4Hi_OSwDne7',None,'ep1b09 눈 속 검은 케이블 이음(바닥 비충돌 장식)'),
}
idx={'revision':'R257','method':'alpha bbox (alpha>=16) + pad 6, long side <=512, WebP q92 alpha 100','items':{}}
for k,(zipname,did,base,use) in JOBS.items():
  root=src/zipname;zb=(root/'bundle.zip').read_bytes();bd=next((root/'x').iterdir())
  man=json.loads((bd/'MANIFEST.json').read_text());qa=json.loads((bd/'QA.json').read_text());so=json.loads((bd/'SOURCE.json').read_text())
  for f in man['files']:assert sha((bd/f['file']).read_bytes())==f['sha256'],(k,f['file'],'sha mismatch')
  ob=(bd/'original.png').read_bytes()
  im=Image.open(bd/'original.png').convert('RGBA');a=im.split()[3].point(lambda v:255 if v>=A else 0);bb=a.getbbox()
  bb=(max(0,bb[0]-PAD),max(0,bb[1]-PAD),min(im.width,bb[2]+PAD),min(im.height,bb[3]+PAD));im=im.crop(bb)
  if max(im.size)>MAX:s=MAX/max(im.size);im=im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.LANCZOS)
  p=out/(k+'.webp');im.save(p,'WEBP',quality=92,alpha_quality=100,method=6);db=p.read_bytes()
  idx['items'][k]={'path':'assets/r257/props/'+k+'.webp','driveZip':zipname+'.zip','driveId':did,'zipSHA256':sha(zb),'originalSHA256':sha(ob),'originalSize':list(Image.open(bd/'original.png').size),
   'derivedSHA256':sha(db),'derivedBytes':len(db),'derivedSize':list(im.size),'status':qa.get('status'),'region':so.get('region'),'canonLines':so.get('lines'),'baseInGame':base,'use':use}
  print(k,im.size,len(db))
(out/'index.json').write_text(json.dumps(idx,ensure_ascii=False,indent=1)+'\n')
