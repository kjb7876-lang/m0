#!/usr/bin/env python3
"""R1243: R620 계열 대기(idle6)·맞음(hit4) 시트의 '보이는 키'를 R463 표와 같은 잣대로 잰다.
시트 칸의 불투명 키(알파>40, 칸 가운데 최댓값) ÷ 원본 그림의 불투명 키 × R463 원본 vis → 시트 경로의 vis.
출력: r96/client-source/sin-boss-sheet-vis-r1243-data.js (손으로 고치지 않는다)."""
import json,re,pathlib
from PIL import Image
R=pathlib.Path(__file__).resolve().parents[1]/'r96';CS=R/'client-source'
# 원본 정규화 그림은 저장소에 없고 빌드된 site 에만 있다 → runtime-text 먼저, 없으면 site
def A(p):
  for b in (R/'runtime-text',R/'hospital-three-pc/site'):
    if (b/p).exists():return b/p
  raise FileNotFoundError(p)
def opaque_h(p,box=None):
  im=Image.open(A(p)).convert('RGBA')
  if box:im=im.crop(box)
  bb=im.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox();return (bb[3]-bb[1]) if bb else 0
src=(CS/'sin-boss-art-r463-data.js').read_text();D=json.loads(src[src.index('Object.freeze(')+14:src.rindex(')')])
s620=(CS/'boss-motion-r620.js').read_text()
pairs=[(m[0],int(m[1]),int(m[2]),m[3],m[4]) for m in re.findall(r"'(assets/[^']+)':\{w:(\d+),h:(\d+)(?:,cells:\[[^\]]*\])?,idle:\{path:'([^']+)'[^}]*\}(?:,hit:\{path:'([^']+)')?",s620)]
out={}
for bid,d in D.items():
  if bid.startswith('b06'):continue  # 맘몬은 손대지 않음
  for still,w,h,idle,hit in pairs:
    if still not in d['vis']:continue
    sh=opaque_h(still,(0,0,w,h))
    for sheet in [x for x in (idle,hit) if x]:
      im=Image.open(A(sheet));n=im.width//w
      mh=max(opaque_h(sheet,(i*w,0,i*w+w,h)) for i in range(n))
      v=round(d['vis'][still]*mh/sh,2);out.setdefault(bid,{})[sheet]=v
      print(bid,sheet,'칸',n,'시트키',mh,'원본키',sh,'vis',d['vis'][still],'→',v)
hdr='// R1243 7대죄 보스 대기·맞음 시트(R620·R1147·R1160·R1163·R1164)의 보이는 키 — scripts/r1243-sheet-vis.py 가 만든다(손으로 고치지 않는다).\n// R463 sizeLock 이 원본 그림 표(vis)에 없는 시트 경로를 만나면 이 값을 쓴다 → 서 있을 때·맞을 때도 몸 키가 공격·걷기와 같다.\n'
(CS/'sin-boss-sheet-vis-r1243-data.js').write_text(hdr+'window.__STORYWORLD_SIN_BOSS_SHEET_VIS_R1243__=Object.freeze('+json.dumps(out,ensure_ascii=False,sort_keys=True)+');\n')
