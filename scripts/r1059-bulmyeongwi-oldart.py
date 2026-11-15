#!/usr/bin/env python3
"""R1059 옛 불면귀(회백 해골 저승사자) 그림 자리에 새 그림(Dots CX-0070BM 시트 한 칸)을 같은 크기·같은 몸 자리로 앉힌 사본을 만든다.
원본은 지우지 않는다. 결과는 r96/runtime-text/assets/r1059/<원래 경로>. 칸마다 옛 그림의 알파 테두리(알파>16)를 재고,
새 그림 한 칸의 알파 테두리를 같은 키로 줄여 같은 바닥 줄·같은 가운데에 둔다(엔진이 잘라 쓰는 crop·발 기준이 그대로 맞게).
python3 scripts/r1059-bulmyeongwi-oldart.py [옛 그림이 있는 사이트 폴더, 기본 r96/hospital-three-pc/site]"""
import sys,json,hashlib
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];RT=ROOT/'r96/runtime-text'
SITE=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'r96/hospital-three-pc/site'
OUT=RT/'assets/r1059'
def sheet(p,i,cell=512):return Image.open(RT/p).convert('RGBA').crop((i*cell,0,(i+1)*cell,cell))
B='assets/r760/boss/sheet-';M='assets/r760/mid/sheet-'
# (옛 경로, 칸 수(가로), [새 칸…]) — 옛 칸 하나에 새 칸 하나
JOBS=[
 ('assets/generated-v31224/actors-normalized/692e4ae01c29_bulmyeongwi_idle.webp',[(B+'idle.webp',0)]),
 ('assets/generated-v31224/actors-normalized/115b7fcea51e_bulmyeongwi_attack.webp',[(B+'atkA.webp',3)]),
 ('assets/generated-v31224/actors-normalized/35526bcfa1c2_bulmyeongwi_rain.webp',[(B+'cast.webp',5)]),
 ('assets/generated-v31224/actors-normalized/de4c1414da0d_bulmyeongwi_transition.webp',[(B+'reveal.webp',5)]),
 ('assets/r425/clean/assets/generated-v31224/actors-normalized/692e4ae01c29_bulmyeongwi_idle.webp',[(B+'idle.webp',0)]),
 ('assets/episode1b/generated-v394/bulmyeongwi_b.webp',[(M+'idle.webp',0)]),
 ('assets/r104/bosses/mb-last302-v31231-p1.webp',[(M+'atk.webp',1)]),
 ('assets/r104/bosses/mb-last302-v31231-p2.webp',[(M+'atk.webp',3)]),
 ('assets/r104/bosses/mb-last302-v31231-p3.webp',[(M+'atk.webp',5)]),
 ('assets/r104/bosses/mb-last302-v31231-p4.webp',[(M+'idle.webp',0)]),
 ('assets/rc140/story-cycle-motions/mb-last302-v31231.png',[(M+'idle.webp',0),(M+'atk.webp',3),(M+'atk.webp',5)]),
 ('assets/r760/boss/bulmyeongwi-p1.webp',[(B+'atkA.webp',1)]),
 ('assets/r760/boss/bulmyeongwi-p2.webp',[(B+'atkA.webp',3)]),
 ('assets/r760/boss/bulmyeongwi-p3.webp',[(B+'atkA.webp',5)]),
 ('assets/r760/boss/bulmyeongwi-p4.webp',[(B+'idle.webp',0)]),
 ('assets/r760/boss/bulmyeongwi-rain.webp',[(B+'cast.webp',5)]),
 ('assets/r760/boss/bulmyeongwi-transition.webp',[(B+'reveal.webp',5)]),
]
def bbox(im):return im.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
def src(p):
 for base in (SITE,RT):
  if (base/p).exists():return Image.open(base/p).convert('RGBA')
 raise SystemExit('옛 그림을 찾지 못함: '+p)
rows=[]
for path,news in JOBS:
 old=src(path);W,H=old.size;n=len(news);cw=W//n;out=Image.new('RGBA',(W,H),(0,0,0,0))
 for i,(sp,f) in enumerate(news):
  cell=old.crop((i*cw,0,(i+1)*cw,H));ob=bbox(cell);new=sheet(sp,f);nb=bbox(new);fig=new.crop(nb)
  k=(ob[3]-ob[1])/fig.height;fw,fh=max(1,round(fig.width*k)),max(1,round(fig.height*k));fig=fig.resize((fw,fh),Image.LANCZOS)
  cx=(ob[0]+ob[2])/2;x=round(i*cw+cx-fw/2);y=ob[3]-fh
  # 칸 밖으로 넘치면 칸 폭에 맞춰 더 줄인다(옆 칸을 침범하지 않게)
  if fw>cw:s=cw/fw;fig=fig.resize((cw,max(1,round(fh*s))),Image.LANCZOS);fw,fh=fig.size;x=i*cw;y=ob[3]-fh
  x=max(i*cw,min(x,(i+1)*cw-fw))
  layer=Image.new('RGBA',(W,H),(0,0,0,0));layer.paste(fig,(x,y));out=Image.alpha_composite(out,layer)
 dst=OUT/path;dst.parent.mkdir(parents=True,exist_ok=True)
 if dst.suffix=='.png':out.save(dst,optimize=True)
 else:out.save(dst,'WEBP',quality=90,method=6)
 b=dst.read_bytes();rows.append({'old':path,'new':str(dst.relative_to(RT)),'size':[W,H],'frames':[{'sheet':s,'frame':f} for s,f in news],'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(ROOT/'r96/r1059-bulmyeongwi-oldart.json').write_text(json.dumps({'revision':'R1059','note':'옛 회백 해골 불면귀·중간보스 그림 자리를 새 그림(Dots CX-0070BM) 한 칸으로 바꾼 사본. 원본 보존.','rows':rows},ensure_ascii=False,indent=1))
print(len(rows),'files')
