#!/usr/bin/env python3
"""R273: 드라이브 Batch66 데이터 기념석 측후면(2026-11-03, 조건부·최종 아님) -> assets/r273/props/<id>.webp (게임용 파생본).
원본 PNG 는 바꾸지 않는다. 묶음 MANIFEST 의 SHA-256 을 확인하고, R138 과 같은 방식(알파 상자 alpha>=16·PAD 6·긴 변 512·WebP 92, 알파 무손실 품질 100)으로 쓴다.
index.json 에 Drive id·zip 이름·zip/원본/파생 해시·크기·상태(README/QA 의 status 그대로)·용도를 남긴다.
usage: python3 -I scripts/r273-drive-angles.py <staging dir: <zip 이름>/x/<묶음>/...> [out-dir]"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image
src=Path(sys.argv[1]);out=Path(sys.argv[2] if len(sys.argv)>2 else 'r96/runtime-text/assets/r273/props');out.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest();A,PAD,MAX=16,6,512
# id: (zip 이름, Drive id, 원래 게임 소품(있으면), 쓰는 곳)
JOBS={
 'monolith-side':('StoryWorld-Data-Monument-side-rear-v1','1omEx9XdYChybHcSGftV6xLtAPkZky6HQ','r129 monolith','NS 데이터 세계 비석(samong-mood-r123 data deco 3개)의 측후면 — 같은 방 두 번째 비석에 써서 세 개가 같은 각도로 반복되지 않게(조건부·최종 아님)'),
}
idx={'revision':'R273','method':'alpha bbox (alpha>=16) + pad 6, long side <=512, WebP q92 alpha 100','items':{}}
for k,(zipname,did,base,use) in JOBS.items():
  root=src/zipname;zb=(root/'bundle.zip').read_bytes();bd=next((root/'x').iterdir())
  man=json.loads((bd/'MANIFEST.json').read_text());qa=json.loads((bd/'QA.json').read_text());so=json.loads((bd/'SOURCE.json').read_text())
  for f in man['files']:assert sha((bd/f['file']).read_bytes())==f['sha256'],(k,f['file'],'sha mismatch')
  ob=(bd/'original.png').read_bytes()
  im=Image.open(bd/'original.png').convert('RGBA');a=im.split()[3].point(lambda v:255 if v>=A else 0);bb=a.getbbox()
  bb=(max(0,bb[0]-PAD),max(0,bb[1]-PAD),min(im.width,bb[2]+PAD),min(im.height,bb[3]+PAD));im=im.crop(bb)
  if max(im.size)>MAX:s=MAX/max(im.size);im=im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.LANCZOS)
  p=out/(k+'.webp');im.save(p,'WEBP',quality=92,alpha_quality=100,method=6);db=p.read_bytes()
  idx['items'][k]={'path':'assets/r273/props/'+k+'.webp','driveZip':zipname+'.zip','driveId':did,'zipSHA256':sha(zb),'originalSHA256':sha(ob),'originalSize':list(Image.open(bd/'original.png').size),
   'derivedSHA256':sha(db),'derivedBytes':len(db),'derivedSize':list(im.size),'status':qa.get('status'),'region':so.get('region'),'canonLines':so.get('lines'),'baseInGame':base,'use':use,'applied':True,'note':'조건부·최종 아님(CONDITIONAL 각도 변형, R257 방식)'}
  print(k,im.size,len(db))
(out/'index.json').write_text(json.dumps(idx,ensure_ascii=False,indent=1)+'\n')
