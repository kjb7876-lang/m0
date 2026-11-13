#!/usr/bin/env python3
"""R974: Dots CX-0082MV 보스·중간보스 방향 이동 시트(옆·아래·위 각 4칸, 384칸) → 게임용 webp + 표(move-dir-r974-data.js).
입력 ① Dots 결과 사본 폴더(/mnt/project-files/dots-results/cx0082mv, Bnn/…-walk-{side,down,up}.png) ② 빌드된 사이트 assets 폴더(지금 게임이 그리는 대기 그림 — 보이는 테두리·밝기 기준).
원본은 지우거나 덮어쓰지 않는다. 그림(형태·자세)은 Dots 원본 그대로, 색만 지금 게임 대기 그림의 평균 색에 맞춘다(채널별 배율 .65~1.35, 밝은 곳 150 위는 덜·230 위는 그대로).
지금 게임 그림과 단계·색이 다른 것은 뺀다(HOLD 표 참고): B11(게임은 붉은 톤)·B17·B19·B23·B27(게임은 사람 단계 그림)·B46(톤 다름)·B35·B36(R973 이 따로 적용).
출력: r96/runtime-text/assets/r974/move/<id>-<dir>.webp, r96/client-source/move-dir-r974-data.js, r96/r974-move-dir.json(출처·해시·크기·적용 여부).
usage: python3 scripts/r974-move-dir.py <cx0082mv 폴더> <site/assets 폴더>"""
import glob,hashlib,io,json,os,sys
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';OUT=R/'runtime-text/assets/r974/move'
# (Dots 번호, 적 nativeId, 지금 게임 대기 그림(assets/ 아래), 칸 [x,y,w,h] 또는 None=그림 전체)
MAP=[('B02','mb-dist01','r104/bosses/mb-dist01-p4.webp',None),('B05','mb-dist04','r104/bosses/mb-dist04-p4.webp',None),('B09','mb-ep1a08','r104/bosses/mb-ep1a08-p4.webp',None),
('B13','mb-ep1b01','r104/bosses/mb-ep1b01-p4.webp',None),('B14','mb-ep1b02','r104/bosses/mb-ep1b02-p4.webp',None),('B16','mb-ep1b03','r104/bosses/mb-ep1b03-p4.webp',None),
('B18','mb-ep1b04','r104/bosses/mb-ep1b04-p4.webp',None),('B20','mb-ep1b05','r104/bosses/mb-ep1b05-p4.webp',None),('B22','mb-ep1b07','r104/bosses/mb-ep1b07-p4.webp',None),
('B24','mb-ep1b08','r104/bosses/mb-ep1b08-p4.webp',None),('B26','mb-ep1b09','r104/bosses/mb-ep1b09-p4.webp',None),('B28','u201-mid','r104/bosses/u201-mid-p4.webp',None),
('B29','u202-mid','r104/bosses/u202-mid-p4.webp',None),('B30','u206-mid','rc140/story-cycle-motions/u206-mid.png',[0,0,680,724]),('B31','u203-mid','rc140/story-cycle-motions/u203-mid.png',[0,0,680,724]),
('B33','l305-boss','boss-actions-20261011/l305-boss-poses.png',[150,20,475,480]),('B34','l301-boss','r104/bosses/l301-boss-p4.webp',None),
('B38','mb-kair04-v31231','rc140/story-cycle-motions/mb-kair04-v31231.png',[0,0,681,724]),('B39','kair-great-01','actors/v31345/guardians/great-01-atlas.webp',[120,51,485,582]),
('B40','kair-great-02','actors/v31345/guardians/great-02-atlas.webp',[122,19,437,578]),('B42','kair-great-05','rc140/story-cycle-motions/kair-great-05.png',[0,0,680,724]),
('B43','mb-kair09-v31231','boss-actions-20261011/mb-kair09-v31231-poses.png',[200,10,410,490]),('B44','kair-great-06','actors/v31345/guardians/great-06-atlas.webp',[139,13,379,596]),
('B45','kair-great-03','r410/mobs/m048.webp',[0,0,256,320]),('B47','mb-hando01','r104/bosses/mb-hando01-p4.webp',None),('B48','mb-hando02','r104/bosses/mb-hando02-p4.webp',None)]
HOLD={'B11':'게임 대기 그림은 붉은 톤, 새 그림은 회갈색','B17':'게임은 사람 단계(시기의 언니) 그림, 새 그림은 청록 잔영 단계','B19':'게임은 사람 단계(총주방장) 그림, 새 그림은 탐식체 단계',
 'B23':'게임은 사람 단계(청소부) 그림, 새 그림은 검은 갑주 단계','B27':'게임은 사람 단계(회장) 그림, 새 그림은 사이보그 갑주 단계','B46':'게임 그림보다 밝고 붉은 톤, 옆 걷기 원본 미확인','B49':'Drive 파일 10MB 초과로 못 받음'}
CELL,N=384,4
def bbox(a):
  ys,xs=np.where(a>16);return [int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1]
def mean(im):
  a=np.asarray(im).astype(np.float32);m=a[...,3]>128;return a[...,:3][m].mean(axis=0)
def tone(im,g):
  a=np.asarray(im).astype(np.float32);mx=a[...,:3].max(axis=2);t=np.clip((mx-150)/80,0,1);t=t*t*(3-2*t)
  for c in range(3):a[...,c]*=g[c]+(1-g[c])*t
  low=a[...,3]<=16;a[low]=0;return Image.fromarray(np.clip(a+.5,0,255).astype(np.uint8),'RGBA')
def main(src,site):
  src=Path(src);site=Path(site);OUT.mkdir(parents=True,exist_ok=True);table={};rows=[]
  for b,eid,rel,rect in MAP:
    ip=site/rel;idle=Image.open(ip).convert('RGBA');full=list(idle.size)
    if rect:idle=idle.crop((rect[0],rect[1],rect[0]+rect[2],rect[1]+rect[3]))
    ib=bbox(np.asarray(idle)[...,3]);im0=mean(idle)
    sheets={}
    for d in ('side','down','up'):
      f=glob.glob(str(src/b/('*-walk-'+d+'.png')))
      if f:
        im=Image.open(f[0]).convert('RGBA');assert im.size==(CELL*N,CELL),(b,d,im.size);sheets[d]=(f[0],im)
    pooled=np.concatenate([np.asarray(im).reshape(-1,4) for _,im in sheets.values()]).astype(np.float32);m1=pooled[pooled[:,3]>128][:,:3].mean(axis=0)
    g=[float(np.clip(im0[c]/max(1,m1[c]),.65,1.35)) for c in range(3)]
    ent={'idle':[{'path':'assets/'+rel,'rect':rect or [0,0]+full,'size':full,'bbox':ib}],'cell':CELL,'n':N,'fps':8,'dirs':{}}
    for d,(f,im) in sheets.items():
      o=tone(im,g);a=np.asarray(o)[...,3];bbs=[bbox(a[:,i*CELL:(i+1)*CELL]) for i in range(N)]
      py=float(np.median([q[3] for q in bbs]));top=float(np.median([q[1] for q in bbs]));px=float(np.median([(q[0]+q[2])/2 for q in bbs]))
      buf=io.BytesIO();o.save(buf,'WEBP',quality=88,method=6,exact=False);by=buf.getvalue();name=eid+'-'+d+'.webp';(OUT/name).write_bytes(by)
      ent['dirs'][d]={'path':'assets/r974/move/'+name,'px':round(px,1),'py':round(py,1),'vis':round(py-top,1)}
      rows.append({'dots':b,'enemy':eid,'dir':d,'source':'Dots CX-0082MV '+b+'/'+os.path.basename(f),'sourceSha256':hashlib.sha256(Path(f).read_bytes()).hexdigest(),'toneGain':[round(v,3) for v in g],
        'path':'assets/r974/move/'+name,'size':list(o.size),'bytes':len(by),'sha256':hashlib.sha256(by).hexdigest(),'use':'보스·중간보스 방향 이동','applied':True})
    table[eid]=ent
  for b,why in HOLD.items():rows.append({'dots':b,'applied':False,'why':why})
  js='// R974 방향 이동 표 — scripts/r974-move-dir.py 가 만든다(손으로 고치지 않는다). 적 nativeId → 대기 그림(경로·칸·보이는 테두리)·방향 시트(경로·가운데 x·발 줄·보이는 키).\nwindow.__STORYWORLD_MOVE_DIR_R974_DATA__='+json.dumps({'revision':'R974','enemies':table},ensure_ascii=False,separators=(',',':'))+';\n'
  (R/'client-source/move-dir-r974-data.js').write_text(js,encoding='utf8')
  (R/'r974-move-dir.json').write_text(json.dumps({'round':'R974','request':'CX-0082MV','files':rows},ensure_ascii=False,indent=1)+'\n',encoding='utf8')
  print(len(table),'enemies',sum(1 for r in rows if r.get('applied')),'sheets',sum(r.get('bytes',0) for r in rows),'bytes')
  for k,v in table.items():print(k,v['idle'][0]['bbox'],{d:(q['px'],q['py'],q['vis']) for d,q in v['dirs'].items()})
if __name__=='__main__':main(sys.argv[1],sys.argv[2])
