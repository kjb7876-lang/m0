#!/usr/bin/env python3
"""R374: Dots 승인 몹 그림(u203-02/03/05, u205 새 4종) → r96/runtime-text/assets/r374/mobs 한 줄 시트 + index.json.
원본 PNG 는 저장소에 넣지 않는다(파생본만). 사용: python3 scripts/r374-dots-mobs.py <staging 폴더>"""
import sys,os,json,hashlib,glob
from PIL import Image
S=sys.argv[1];OUT='r96/runtime-text/assets/r374/mobs';os.makedirs(OUT,exist_ok=True)
sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
JOBS=[
 # id, staging glob, kind, actor key, note
 ('u203-e2-mech','SW-u203-02-*/','frames8',{'layer':'STORY','nativeId':'u203-e2','name':'이동문 공허잔영'},'u203-02 기계화 이동문 공허잔영 v1 (승인). e2 액터만, m041 공유 매핑은 그대로.'),
 ('u203-e3-mech','SW-u203-03-*/','frames8',{'layer':'STORY','nativeId':'u203-e3','name':'최종문 공명기사'},'u203-03 기계화 최종문 공명기사 v1 (승인). 보행 HOLD: 4자세 보행, 자연 보행 미검증.'),
 ('u203-boss-mech','SW-u203-05-*/','frames8',{'layer':'STORY','nativeId':'u203-boss','name':'컨트롤러 · 기억의 문','bossStates':True},'u203-05 컨트롤러 부분기계화 v1 (승인). idle/이동/일반공격만, 특수상태 원본 유지.'),
 ('u205-e1-new','SW-u205-01-*/01-*/','sheet12',{'layer':'STORY','nativeId':'u205-e1','name':'학대기록 공허체'},'u205-01 new-four-v1 (승인).'),
 ('u205-e2-new','SW-u205-02-*/02-*/','sheet12',{'layer':'STORY','nativeId':'u205-e2','name':'관리자 추적견'},'u205-02 new-four-v1 (승인).'),
 ('u205-e3-new','SW-u205-03-*/03-*/','sheet12',{'layer':'STORY','nativeId':'u205-e3','name':'역전기록 수집가'},'u205-03 new-four-v1 (승인).'),
 ('u205-mid-new','SW-u205-04-*/04-*/','sheet12',{'layer':'STORY','nativeId':'u205-mid','name':'제14단계 역전 관리자'},'u205-04 new-four-v1 (승인). 중간보스 역할·단계 그대로.'),
]
mobs=[]
for mid,g,kind,key,note in JOBS:
  d=glob.glob(os.path.join(S,g));assert len(d)==1,(g,d);d=d[0];man=json.load(open(d+'manifest.json'))
  src=[]
  if kind=='frames8':
    for q in man['qa']:
      p=d+'frame_%02d.png'%q['frame'];im=Image.open(p).convert('RGBA');assert hashlib.sha256(im.tobytes()).hexdigest()==q['sha256'],p;src.append(im)  # manifest sha256 = RGBA 픽셀 바이트
    cells=[im.resize((256,256),Image.LANCZOS) for im in src];cw,ch=256,256;move=[0,1,2,3];attack=[4,5,6,7]
    origin={'files':['frame_%02d.png'%i for i in range(1,9)],'pixelSha256':[q['sha256'] for q in man['qa']],'scale':.5}
  else:
    sums=dict(l.split()[::-1] for l in open(d+'SHA256.txt') if l.strip());p=d+'sheet.png';assert sha(p)==sums['sheet.png']
    sh=Image.open(p).convert('RGBA');cw,ch=man['frame_size'];cols=sh.width//cw
    cells=[sh.crop((i%cols*cw,i//cols*ch,i%cols*cw+cw,i//cols*ch+ch)) for i in range(12)];move=list(range(8));attack=[8,9,10,11]
    origin={'files':['sheet.png'],'sha256':[sums['sheet.png']],'scale':1}
  # 발(아래 끝)·높이: alpha>=16 bbox 로 이동 칸에서 잰다
  bb=[c.getchannel('A').point(lambda a:255 if a>=16 else 0).getbbox() for c in cells]
  foot=max(b[3] for i,b in enumerate(bb) if i in move);top=min(b[1] for i,b in enumerate(bb) if i in move)
  strip=Image.new('RGBA',(cw*len(cells),ch),(0,0,0,0))
  for i,c in enumerate(cells):strip.paste(c,(i*cw,0))
  out=f'{OUT}/{mid}.webp';strip.save(out,'WEBP',quality=90,method=6)
  mobs.append({'id':mid,'path':f'assets/r374/mobs/{mid}.webp','cell':[cw,ch],'pivot':[cw//2,foot],'visibleHeight':foot-top,'move':move,'attack':attack,'facing':'right','actor':key,
    'note':note,'source':{'name':man.get('name'),'version':man.get('version','v1'),**origin},'bytes':os.path.getsize(out),'sha256':sha(out),'finalArt':False})
  print(mid,cw,ch,foot,foot-top,os.path.getsize(out))
json.dump({'schema':'storyworld.r374.dotsmobs/v1','revision':'R374','note':'Dots 승인 몹 그림 파생본(축소·한 줄 묶기만, 색·형태 그대로). 원본은 Drive 에 보존. 엔진 연결 외 모션 자연스러움·GPU·실기기는 미검증.','mobs':mobs},open(f'{OUT}/index.json','w'),ensure_ascii=False,indent=1)
