#!/usr/bin/env python3
"""R700 보스 그림 전수조사 검사(Pillow 만, 빌드된 site 필요: python scripts/build-r96.py).
7대죄 보스가 실제로 그리는 몸 그림(r463 0단계 고정 기준: 나태 R380 시트, 질투·탐식·색욕 0단계 대기·공격, 분노·교만 R104 열쇠 자세)에 대해
 1) 크기 잠금 값(sin-boss-art-r463-data vis)이 그림의 실제 불투명 키와 3% 안에서 맞는가 — 아니면 보스끼리 몸 키가 어긋난다.
 2) 게임이 실제로 받는 그림(R99·R425·R700 깨끗한 사본 주소 돌리기 반영)의 가장자리에 밝은 회백 테두리(배경 지우기 잔티)가 2% 넘게 남지 않았는가.
 3) 깨끗한 사본이 몸을 깎지 않았는가(불투명 픽셀 97% 이상, 보이는 키 ±2px), 원본은 그대로인가(해시), 맘몬 그림은 손대지 않았는가.
 4) 연결: boss-art-r700.js 가 sync 목록·index.html·verify 기대 목록에 있고, 주소 돌리기 목록이 r700-boss-clean.json 과 같다.
usage: python3 r96/qa/r700/boss-art-check.py"""
import json,re,hashlib,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[3];R=ROOT/'r96';SITE=R/'hospital-three-pc/site';RT=R/'runtime-text'
fails=[];oks=0
def ok(c,msg):
  global oks
  if c:oks+=1;print('ok  ',msg)
  else:fails.append(msg);print('FAIL',msg)
def find(p):
  for b in (RT,SITE):
    if (b/p).exists():return b/p
  return None
def jsset(name,var):
  s=(R/'client-source'/name).read_text(encoding='utf8') if (R/'client-source'/name).exists() else ''
  m=re.search(var+r'=new Set\((\[.*?\])\)',s);return set(json.loads(m.group(1))) if m else set()
CLEAN99=jsset('assets-clean-r99.js','CLEAN');CLEAN425=jsset('combat-flow-r425.js','CLEAN425')
spec=json.loads((R/'r700-boss-clean.json').read_text(encoding='utf8')) if (R/'r700-boss-clean.json').exists() else {'images':[]}
CLEAN700={r['path'] for r in spec['images']}
def served(p):
  """게임이 이 경로로 실제 내려받는 파일(바깥쪽 덧씌우기 먼저: R700 → R425 → R99)."""
  if p in CLEAN700:return 'assets/r700/clean/'+p
  if p in CLEAN425:return 'assets/r425/clean/'+p
  if p in CLEAN99:return 'assets/r99/clean/'+p
  return p
def alpha_box(im,t=40):return im.getchannel('A').point(lambda v:255 if v>t else 0).getbbox()
def fringe(im):
  """밝은 회백 테두리 비율: 투명과 맞닿은 가장자리 픽셀 중 밝고(평균>150) 무채색(채도<60)이며 3px 안쪽 몸보다 38 이상 밝은 것."""
  W,H=im.size;px=im.load();edge=0;bad=0
  for y in range(1,H-1):
    for x in range(1,W-1):
      r,g,b,a=px[x,y]
      if a<=40:continue
      nb=[(dx,dy) for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)) if px[x+dx,y+dy][3]<=40]
      if not nb:continue
      edge+=1;l=(r+g+b)/3
      if l<=150 or max(r,g,b)-min(r,g,b)>=60:continue
      dx=-sum(d[0] for d in nb);dy=-sum(d[1] for d in nb);ins=[]
      for k in (3,4,5):
        X=min(W-1,max(0,x+dx*k));Y=min(H-1,max(0,y+dy*k));q=px[X,Y]
        if q[3]>200:ins.append(sum(q[:3])/3)
      if ins and l-sum(ins)/len(ins)>38:bad+=1
  return bad/max(1,edge)
def is_white(p):
  r,g,b,a=p;return a>40 and (r+g+b)/3>165 and max(r,g,b)-min(r,g,b)<110 and not (r>g>b and g-b>12)
def body_px(im):
  return sum(1 for p in im.get_flattened_data() if p[3]>40 and not is_white(p)) if hasattr(im,'get_flattened_data') else sum(1 for p in im.getdata() if p[3]>40 and not is_white(p))
def white_fx(im,kind):
  """효과(질투 청록 물살·색욕 붉은 꽃잎) 색 픽셀에서 14px 안에 있는 흰·연분홍 무채 픽셀 수(알파>40, 명도>165, 채도<110, 피부색 아님) — 효과 안에 남은 흰 배경 판."""
  from PIL import ImageFilter
  W,H=im.size;px=im.load();fx=Image.new('L',(W,H),0);fp=fx.load()
  for y in range(H):
    for x in range(W):
      r,g,b,a=px[x,y]
      if a>120 and (r+g+b)/3<165 and ((b>r+20 and g>r+20) if kind=='envy' else (r>g+50 and r>b+40)):fp[x,y]=255
  near=fx.filter(ImageFilter.MaxFilter(29)).load();n=0
  for y in range(H):
    for x in range(W):
      if near[x,y] and is_white(px[x,y]):n+=1
  return n
D=json.loads(re.search(r'freeze\((\{.*\})\)',(R/'client-source/sin-boss-art-r463-data.js').read_text(encoding='utf8')).group(1))
r380=json.loads(find('assets/r380/mobs/index.json').read_text(encoding='utf8'))
R380={m['path']:m for m in r380['mobs']}
# 실제로 그려지는 그림(헤드리스 실측 qa/r700/census 와 같은 목록)
DRAWN={'b02-boss':['assets/r380/mobs/sloth-burden-man-v1.webp'],
 'b03-boss':[D['b03-boss']['idle'],D['b03-boss']['attack']],'b04-boss':[D['b04-boss']['idle'],D['b04-boss']['attack']],'b05-boss':[D['b05-boss']['idle'],D['b05-boss']['attack']],
 'b07-boss':['assets/r104/bosses/b07-boss-p%d.webp'%i for i in (1,2,4)],'b08-boss':['assets/r104/bosses/b08-boss-p%d.webp'%i for i in (1,2,4)]}
# 1) 크기 잠금 값
for b,L in DRAWN.items():
  for p in L:
    f=find(p);ok(f is not None,f'{b} 그림 있음 {p}')
    if not f:continue
    im=Image.open(f).convert('RGBA')
    if p in R380:
      cw,ch=R380[p]['cell'];n=im.width//cw;h=max(alpha_box(im.crop((i*cw,0,(i+1)*cw,ch)))[3]-alpha_box(im.crop((i*cw,0,(i+1)*cw,ch)))[1] for i in range(n))
    elif '/r104/' in p:
      bb=alpha_box(Image.open(find(p[:-7]+'p4.webp')).convert('RGBA'));h=bb[3]-bb[1]  # R104 키는 서 있는 자세(p4·회수) 기준
    else:
      bb=alpha_box(Image.open(find(D[b]['idle'])).convert('RGBA'));h=bb[3]-bb[1]  # 사람 0단계는 대기 그림 키를 기준으로 맞춘다(R463)
    v=D[b]['vis'].get(p)
    ok(v is not None and abs(v-h)/h<=.03,f'{b} 크기 잠금 값 {v} ≈ 실제 불투명 키 {h} (±3%) {p.split("/")[-1]}')
# 2) 가장자리 회백 테두리
for b,L in DRAWN.items():
  for p in L:
    s=served(p);f=find(s)
    if not f:ok(False,f'{b} 내려받는 그림 있음 {s}');continue
    fr=fringe(Image.open(f).convert('RGBA'))
    ok(fr<=.02,f'{b} 밝은 테두리 {fr*100:.1f}% ≤ 2% ({s.split("/")[-1]}{" · R700 사본" if s.startswith("assets/r700") else ""})')
# 2b) 효과 안 흰 판(사용자 2026-11-11 02:03Z "이런 흰색 배경나오는거 거슬림" — 질투 물살 가운데·색욕 꽃잎)
for b in ('b03-boss','b05-boss'):
  p=D[b]['attack'];s2=served(p);f=find(s2)
  if f:
    wb=white_fx(Image.open(f).convert('RGBA'),'envy' if b=='b03-boss' else 'lust');ok(wb<=60,f'{b} 공격 그림 효과 안 흰 픽셀 {wb}px ≤ 60px')
# 3) 사본 품질·원본 보존·맘몬
ok(len(spec['images'])>=3,f'R700 깨끗한 사본 {len(spec["images"])}장 (3장 이상)')
for r in spec['images']:
  src=find(served_prev:=( 'assets/r425/clean/'+r['path'] if r['path'] in CLEAN425 else ('assets/r99/clean/'+r['path'] if r['path'] in CLEAN99 else r['path'])))
  out=RT/'assets/r700/clean'/r['path']
  ok(out.exists(),'사본 있음 '+r['path'].split('/')[-1])
  if not out.exists() or not src:continue
  ok(hashlib.sha256(src.read_bytes()).hexdigest()==r['sourceSha256'],'입력 그림 그대로(해시) '+served_prev)
  ok(hashlib.sha256(out.read_bytes()).hexdigest()==r['outputSha256'],'사본 해시 기록과 같음 '+r['path'].split('/')[-1])
  a=Image.open(src).convert('RGBA');c=Image.open(out).convert('RGBA')
  na=body_px(a);nc=body_px(c)  # 흰 효과 덩어리(사용자 02:03Z 요청으로 지우는 것)는 빼고 센 몸 픽셀
  ba,bc=alpha_box(a),alpha_box(c)
  ok(nc>=na*.97 and abs((ba[3]-ba[1])-(bc[3]-bc[1]))<=2 and a.size==c.size,f'몸을 깎지 않음 {nc}/{na} 키 {bc[3]-bc[1]}/{ba[3]-ba[1]}')
  ok(not re.search(r'greed|mammon|ep1b06',r['path']),'맘몬 그림 아님 '+r['path'].split('/')[-1])
# 4) 연결
js=R/'client-source/boss-art-r700.js';s=js.read_text(encoding='utf8') if js.exists() else ''
ok(bool(s),'boss-art-r700.js 있음')
m=re.search(r'const CLEAN=new Set\((\[.*?\])\)',s);ok(bool(m) and set(json.loads(m.group(1)))==CLEAN700,'주소 돌리기 목록 = r700-boss-clean.json')
html=(RT/'index.html').read_text(encoding='utf8');ok('src="./boss-art-r700.js"' in html,'index.html 스크립트 태그')
ok('boss-art-r700.js' in (ROOT/'scripts/verify-r96-public.py').read_text(encoding='utf8'),'공개 검증 기대 목록')
inputs=(R/'runtime-inputs.json').read_text(encoding='utf8');ok('boss-art-r700.js' in inputs and all(('assets/r700/clean/'+p) in inputs for p in CLEAN700),'runtime-inputs 에 js·사본 등록')
ok((SITE/'boss-art-r700.js').exists(),'빌드된 site 에 들어감')
print(f'\n{oks} ok, {len(fails)} fail')
sys.exit(1 if fails else 0)
