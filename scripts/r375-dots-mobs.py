#!/usr/bin/env python3
"""R375: Dots 2026-11-06 몹 그림(카이로 4종 4방향 v3, 역병 사냥개 디스토피아 v1) → r96/runtime-text/assets/r375/mobs 시트 + index.json.
원본은 Drive 에 보존, 저장소엔 축소 파생본만. 사용: python3 scripts/r375-dots-mobs.py <staging 폴더>"""
import sys,os,json,hashlib,glob
from PIL import Image
S=sys.argv[1];OUT='r96/runtime-text/assets/r375/mobs';os.makedirs(OUT,exist_ok=True)
sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
DIRS=['east','west','south','north'];STATES=['idle','move','attack','hit','death']
KAIR=[('kair-44','kair02-02',{'layer':'STORY','profileId':'kair-guardian-44','name':'^시간수문장'}),
      ('kair-45','kair02-03',{'layer':'STORY','profileId':'kair-guardian-45','name':'^시간수문장'}),
      ('kair-48','kair02-06',{'layer':'STORY','profileId':'kair-guardian-48','name':'^시간수문장'}),
      ('kair03-residue','kair03-02',{'layer':'STORY','zone':'kair03','name':'^시간핵의 명령 잔류'})]
mobs=[];C=320
for mid,num,key in KAIR:
  d=glob.glob(os.path.join(S,f'{num}_*/{num}/'));assert len(d)==1,num;d=d[0];a=json.load(open(d+'actor.json'))
  assert a['canvas']==[640,640] and a['pivot']==[320,500]
  sheet=Image.new('RGBA',(C*12,C*4),(0,0,0,0));layout=None;bb=[]
  for r,dr in enumerate(DIRS):
    st=a['directions'][dr]['states'];col=0;lay={}
    for s in STATES:
      fr=st[s]['frames'];lay[s]=list(range(col,col+len(fr)))
      for f in fr:
        p=d+f['file'];assert sha(p)==f['sha256'],p;im=Image.open(p).convert('RGBA').resize((C,C),Image.LANCZOS)
        sheet.paste(im,(col*C,r*C));
        if s in('idle','move'):bb.append(im.getchannel('A').point(lambda v:255 if v>=16 else 0).getbbox())
        col+=1
    assert layout in(None,lay);layout=lay
  out=f'{OUT}/{mid}.webp';sheet.save(out,'WEBP',quality=88,method=6)
  vh=250-min(b[1] for b in bb)
  mobs.append({'id':mid,'kind':'dirs4','path':f'assets/r375/mobs/{mid}.webp','cell':[C,C],'pivot':[160,250],'visibleHeight':vh,'rows':{k:i for i,k in enumerate(DIRS)},'states':layout,'actor':key,
    'source':{'display':num,'actorId':a['actor_id'],'name':a['name'],'version':a['version'],'files':48,'sha256Checked':True,'scale':.5},'bytes':os.path.getsize(out),'sha256':sha(out),'finalArt':False})
  print(mid,vh,os.path.getsize(out))
p=glob.glob(os.path.join(S,'Plague_Hound*/plague-hound-dystopia-v1/plague-hound-runtime-8x1.png'))[0]
im=Image.open(p).convert('RGBA');assert im.size==(4096,512)
st=im.resize((2048,256),Image.LANCZOS);out=f'{OUT}/plague-hound.webp';st.save(out,'WEBP',quality=88,method=6)
mobs.append({'id':'plague-hound','kind':'strip','path':'assets/r375/mobs/plague-hound.webp','cell':[256,256],'pivot':[128,224],'visibleHeight':125,'move':[0,1,2,3],'attack':[4,5,6,7],'facing':'right',
  'actor':{'layer':'DREAM','r200Shade':'plague-hound'},'source':{'name':'변이된 사냥개 괴수 디스토피아 v1','file':'plague-hound-runtime-8x1.png','sha256':sha(p),'scale':.5},'bytes':os.path.getsize(out),'sha256':sha(out),'finalArt':False})
json.dump({'schema':'storyworld.r375.dotsmobs/v1','revision':'R375','note':'Dots 2026-11-06 몹 그림 파생본(축소·시트 묶기만). 원본 Drive 보존. 모션 자연스러움·GPU·실기기 미검증.','mobs':mobs},open(f'{OUT}/index.json','w'),ensure_ascii=False,indent=1)
