#!/usr/bin/env python3
"""R710 영웅 대기 6칸·피격 4칸(남쪽) 다듬은 시트 검사 (Pillow 만).
드라이브 초안(HOLD)을 다듬어 넣은 영웅(헌터·라우렌·미카엘라·윤서하·기억사수)의 남쪽 대기·피격 시트가
 1) 칸 크기(192×256)·칸 수(대기 6, 피격 4)
 2) 발 기준선: 대기 맨 아래 불투명 줄 226~228(R119 footY 226), 피격은 R143 FOOT.s ~ +2 / 발 가운데 x 96 근처, 칸끼리 발 흔들림
 3) 몸 키: 지금 게임 대기 그림(R128/R130 idle-s)과 ±3%(피격 ±6%), 칸끼리 키 차이
 4) 투명도: 알파 1~16 찌꺼기, 칸 가장자리 잘림
 5) 원본 일치: 지금 게임 대기 그림과 평균 색 차이, 칸끼리 다시 그린 떨림(색 차이) 상한, 숨쉬기·피격 움직임 존재
 6) 보류 영웅(환도·슬레이어·네온)은 넣지 않음, 기존 시트는 그대로(해시), 연결(index.html·sync·verify·CI)
를 지키는지 본다. usage: python3 r96/qa/r710/idle-hit-check.py"""
import json,re,hashlib,statistics
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[3];R=ROOT/'r96';RT=R/'runtime-text'
fails=[];oks=0
def ok(c,msg,extra=''):
  global oks
  if c:oks+=1;print('ok  ',msg)
  else:fails.append(msg);print('FAIL',msg,extra)
APPLY=['hunter','lauren','michaela','seoha','gunner','neon'];HOLD=['hwando','slayer']  # 네온: 사용자 06:19Z 대기 r4·피격 r2 선택
FOOT_HIT={'neon':225,'lauren':225,'seoha':226,'michaela':226,'hunter':226,'gunner':227}  # attack-anim-r143.js FOOT[h].s
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def frames(p,cw=192):
  im=Image.open(p).convert('RGBA');n=max(1,round(im.width/cw));return im,[im.crop((i*cw,0,(i+1)*cw,im.height)) for i in range(n)]
def meas(f):
  W,H=f.size;a=f.getchannel('A').load();px=f.load();top=None;bot=None;low=0;edge=0
  for y in range(H):
    for x in range(W):
      v=a[x,y]
      if 0<v<=16:low+=1
      if v>24:
        if top is None:top=y
        bot=y
        if x<2 or x>W-3 or y<2:edge+=1
  if bot is None:return None
  xs=[x for y in range(max(0,bot-12),bot+1) for x in range(W) if a[x,y]>24];fx=sum(xs)/len(xs)
  rs=gs=bs=n=0
  for y in range(H):
    for x in range(W):
      if a[x,y]>128:r,g,b,_=px[x,y];rs+=r;gs+=g;bs+=b;n+=1
  return dict(top=top,bot=bot,h=bot-top,fx=fx,low=low,edge=edge,rgb=(rs/n,gs/n,bs/n))
def flick(f0,f1):
  """칸끼리 다시 그린 떨림: 회색 바탕에 얹어 48×64 로 뭉갠 뒤 평균 색 차이(1~2px 흔들림이 아니라 그림이 바뀐 정도)."""
  def bg(f):
    c=Image.new('RGBA',f.size,(64,64,64,255));c.alpha_composite(f);return c.convert('RGB').resize((48,64),Image.BOX).load()
  A,B=bg(f0),bg(f1);return sum(abs(A[x,y][i]-B[x,y][i]) for y in range(64) for x in range(48) for i in range(3))/(48*64)
def cur_idle(h):
  d='assets/r128/gunner/' if h=='gunner' else f'assets/r130/{h}/'
  j=json.loads((RT/d/'index.json').read_text(encoding='utf8'));return j['idle']['s']
idxp=RT/'assets/r710/index.json'
idx=json.loads(idxp.read_text(encoding='utf8')) if idxp.exists() else {'heroes':{}}
ok(idxp.exists(),'assets/r710/index.json 있음')
ok(sorted(idx['heroes'])==sorted(APPLY),'적용 영웅 = 헌터·라우렌·미카엘라·윤서하·기억사수·네온',sorted(idx['heroes']))
for h in HOLD:ok(h not in idx['heroes'] and not (RT/'assets/r710'/h).exists(),f'보류 영웅 {h} 은 넣지 않음')
for h in APPLY:
  e=idx['heroes'].get(h,{})
  ci=cur_idle(h);_,cf=frames(RT/ci['path']);cm=[meas(f) for f in cf];ch=statistics.median(m['h'] for m in cm)
  ok(sha(RT/ci['path'])==ci['sha256'],f'{h} 기존 대기 시트 그대로(해시)')
  hp=f'assets/r143/hit/{h}/hit-s.webp';hj=json.loads((RT/f'assets/r143/hit/{h}/index.json').read_text(encoding='utf8'))['directions']['s']
  ok(sha(RT/hp)==hj['sha256'],f'{h} 기존 피격 시트 그대로(해시)')
  cur_flick=max(flick(cf[i],cf[i+1]) for i in range(len(cf)-1))
  for act,N,cap_h,foot in (('idle',6,.03,(226,228)),('hit',4,.03,(FOOT_HIT[h],FOOT_HIT[h]+2))):
    p=RT/f'assets/r710/{h}/{act}-s.webp'
    if not p.exists():ok(False,f'{h} {act}-s.webp 있음');continue
    im,fs=frames(p);ms=[meas(f) for f in fs]
    ok(im.size==(192*N,256),f'{h} {act} 칸 {N}개 192×256',im.size)
    ok(all(foot[0]<=m['bot']<=foot[1] for m in ms),f'{h} {act} 발 기준선 {foot}',[m['bot'] for m in ms])
    ok(all(94<=m['fx']<=98 for m in ms),f'{h} {act} 발 가운데 x 96±2',[round(m['fx'],1) for m in ms])
    fxs=[m['fx'] for m in ms];ok(max(fxs)-min(fxs)<=(1.5 if act=='idle' else 3),f'{h} {act} 칸끼리 발 흔들림',round(max(fxs)-min(fxs),2))
    mh=statistics.median(m['h'] for m in ms) if act=='idle' else ms[0]['h']  # 피격은 몸을 숙이므로 첫 칸(충격, 선 자세)으로 잰다
    ok(abs(mh-ch)/ch<=cap_h,f'{h} {act} 몸 키({"중앙값" if act=="idle" else "첫 칸"}) 지금 대기({ch})와 ±{int(cap_h*100)}% — 대기→피격 넘어갈 때 크기 튐 없음',mh)
    if act=='idle':hs=[m['h'] for m in ms];ok(max(hs)-min(hs)<=4,f'{h} idle 칸끼리 키 차이 ≤4px',hs)
    ok(all(m['low']<=20 for m in ms),f'{h} {act} 알파 1~16 찌꺼기 ≤20',[m['low'] for m in ms])
    ok(all(m['edge']==0 for m in ms),f'{h} {act} 칸 가장자리 잘림 없음',[m['edge'] for m in ms])
    d=max(abs(a-b) for a,b in zip(ms[0]['rgb'],cm[0]['rgb']));ok(d<=25,f'{h} {act} 평균 색 지금 대기와 차이 ≤25(원본 일치)',round(d,1))
    if act=='idle':nz=[flick(fs[i],fs[i+1]) for i in range(N-1)];ok(max(nz)<=2*cur_flick,f'{h} idle 칸끼리 다시 그린 떨림 ≤ 지금 대기 시트의 2배({round(2*cur_flick,1)})',[round(v,1) for v in nz])
    mv=max(flick(fs[0],f) for f in fs[1:]);ok(mv>=(1.5 if act=='idle' else 5),f'{h} {act} 움직임 있음(정지 그림 아님)',round(mv,1))
    ent=e.get(act,{});ok(ent.get('path')==f'assets/r710/{h}/{act}-s.webp' and ent.get('frames')==N and ent.get('sha256')==sha(p),f'{h} {act} 색인 경로·칸 수·해시')
    src=R/'r710-source'/ent.get('source',{}).get('file','-')
    ok(src.exists() and sha(src)==ent['source'].get('sha256'),f'{h} {act} 초안 원본 보존(해시)')
# 연결
C=(R/'client-source/hero-idle-hit-r710.js');ok(C.exists() and (RT/'hero-idle-hit-r710.js').exists() and C.read_bytes()==(RT/'hero-idle-hit-r710.js').read_bytes(),'오버레이 원본·런타임 사본 같음')
html=(RT/'index.html').read_text(encoding='utf8');i=html.find('./hero-idle-hit-r710.js');
ok(html.count('./hero-idle-hit-r710.js')==1 and i>html.find('./visual-r119.js')>0 and 0<i<html.find('./combat-r118.js'),'index.html: 태그 한 번, visual-r119(대기 시트 표) 뒤, combat-r118 앞')
ok('hero-idle-hit-r710.js' in (ROOT/'scripts/verify-r96-public.py').read_text(encoding='utf8'),'공개 검증 기대 목록')
wf=(ROOT/'.github/workflows/pages.yml').read_text(encoding='utf8');ok('r96/qa/r710/idle-hit-check.py' in wf and 'r96/qa/r710/r710-cpu-check.cjs' in wf,'CI 가 두 검사를 돌림')
man=(R/'runtime-manifest.json').read_text(encoding='utf8');ok('hero-idle-hit-r710.js' in man and all(f'assets/r710/{h}/idle-s.webp' in man for h in APPLY),'sync 목록(runtime-manifest)에 오버레이·시트')
print(f'\nR710 idle/hit sheet check: {oks} ok, {len(fails)} fail');raise SystemExit(1 if fails else 0)
