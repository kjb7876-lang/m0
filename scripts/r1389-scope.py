#!/usr/bin/env python3
"""R1389 3D 범위 판정(사용자 2026-11-28 06:02Z).
"발록·루시퍼 같은 챕터별 중요 보스, 7대죄 모든 보스, 나머지 중요 보스 + 둥근 구체·네모가 많은 몹(기계·유령형 포함)만 3D,
 3D 퀄 8점 이상만 3D, 나머지는 2D 로 해서 품질 높이기."

규칙
 1. 사용자 카드로 정한 몹(scope.json card_locks)은 그대로.
 2. 사용자가 2D 로 잠근 몹(R1385 lock 이 2d)은 그대로 2D.
 3. 대상(scope.json boss + shape)이 아니면 2D.
 4. 대상이면 3D 품질 = .40×일관성 9.5 + .35×모션(클립 점수 × 동작 폭 배율) + .25×원화 닮음.
    동작 폭 배율 = 공격·특수·시전 클립 중 가장 큰 정점 이동 p90 ÷ 키 를 0.25 로 나눔(0.3~1). 측정 = r96/qa/r1389/amp.cjs.
    품질 8.5 이상 그리고 원화 닮음 8 이상이면 3D(사용자 '3D 퀄 8점': 원화와 같은 몹으로 읽히고 움직임이 살아 있어야).
    지금 2D 인데 R1385 가 화면 색·전환 문턱으로 2D 유지한 몹은 2D(색 맞춘 GLB 가 오면 R1385 재측정).
    측정 못 한 사용자 3D 잠금(봉인구·유리 망령)은 R1385 결정 그대로.
 0. 사용자 지정 2D 지역(user_2d_zones)은 2D, 사용자 지정 목록(user_list·user_list_zones, 11-28 08:34Z·08:51Z·08:58Z)은 무조건 3D(문턱보다 우선).
 5. 설정으로 켜고 끄는 보스(발록·베엘제붑·분노의 귀·나태 남자)는 표에 넣지 않는다(설정 그대로). 루시퍼는 사용자 목록으로 3D.
사용: r1389-scope.py [--write]   /   r1389-scope.py --judge <품질> <원화닮음>
"""
import json,sys,os,re,glob,collections
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
Q_MIN=8.5;FID_MIN=8;AMP_FULL=.25
def judge(q,fid):return '3d' if q>=Q_MIN and fid>=FID_MIN else '2d'
if '--judge' in sys.argv:
    i=sys.argv.index('--judge');print(judge(float(sys.argv[i+1]),float(sys.argv[i+2])));sys.exit(0)
P=lambda *a:os.path.join(ROOT,*a)
r85=json.load(open(P('r96/qa/r1385/decision.json')))
SETTING={'r1338:balrog','r1315:glutton','r1382:wrathEar','r1382:slothMan'};scope=json.load(open(P('r96/qa/r1389/scope.json')));amp=json.load(open(P('r96/qa/r1389/amp.json')))
TARGET=set(scope['boss'])|{k for v in scope['shape'].values() for k in v}
CAT={k:'보스' for k in scope['boss']};CAT.update({k:c for c,v in scope['shape'].items() for k in v})
hq=dict(re.findall(r"'(assets/[^']+\.glb)':'(assets/r1339/[^']+\.glb)'",open(P('r96/client-source/mob-3d-hq-r1339.js')).read()))
for k in scope['old_3d_kept']:hq.pop(k,None)
glb={}
for f in sorted(glob.glob(P('r96/client-source/mob-3d-r13*.js'))):
    t=re.search(r'mob-3d-(r\d+c?)\.js',f).group(1)
    for m in re.finditer(r"['\"]?(\w+)['\"]?\s*:\s*[\{\[]\s*(?:glb\s*:\s*)?['\"](assets/[^'\"]+\.glb)",open(f).read()):glb[t+':'+m.group(1)]=m.group(2)
glb.update(scope['glb_extra'])
def quality(m):
    g=glb.get(m['key']);g=hq.get(g,g);a=(amp.get(g) or {}).get('clips')
    if not a:return None
    atk=max([v for k,v in a.items() if re.search('attack|special|cast',k,re.I)]+[0]);f=max(.3,min(1,atk/AMP_FULL))
    fx=scope['fid_extra'].get(m['key']);fid=fx[0] if fx else (m.get('d3') or {}).get('aes')
    if fid is None:return None
    mot=(m.get('d3') or {}).get('mot',9)
    return dict(q=round(.4*9.5+.35*mot*f+.25*fid,2),fid=fid,atk=atk,amp_factor=round(f,2),glb=g)
UL=set(scope['user_list']);ULZ=set(scope['user_list_zones']);UL2Z=set(scope.get('user_2d_zones',[]))
src=list(r85['mobs'])+[dict(key=x['key'],kinds=[x['key']],name=x['name'],zones=[],decision=None,current=None) for x in r85['skipped'] if x['key'] in UL]
rows=[]
for m in src:
    if any(z in scope['skip_zones'] for z in m.get('zones') or []):continue
    k=m['key'];Q=quality(m) if k in TARGET else None
    r=dict(key=k,kinds=m['kinds'],name=m['name'],zones=m.get('zones'),cat=CAT.get(k,'그 밖(사람·동물형)'),r1385=m['decision'],current=m.get('current'),quality=Q)
    if k in SETTING:continue
    zs=set(m.get('zones') or [])
    if k in scope.get('hold_2d',{}):r.update(decision='2d',reason='보류 2D: '+scope['hold_2d'][k])
    elif zs and zs<=UL2Z:r.update(decision='2d',reason='사용자 지정 2D 지역(11-28 08:51Z)')
    elif k in UL or (zs and zs<=ULZ):r.update(decision='3d',reason='사용자 지정 목록(11-28 08:34Z·08:51Z·08:58Z)')
    elif k in scope['card_locks']:r.update(decision=scope['card_locks'][k],reason='사용자 카드 잠금')
    elif m.get('lock') and m['decision']=='2d':r.update(decision='2d',reason='사용자 2D 잠금: '+m['lock'])
    elif k not in TARGET:r.update(decision='2d',reason='3D 대상 아님(R1389: 보스·구체·네모·기계·유령형만)')
    elif not Q:r.update(decision=m['decision'],reason='3D 품질 미측정 → R1385 결정 유지')
    else:
        v=judge(Q['q'],Q['fid']);why=f"3D 품질 {Q['q']}(동작 폭 {Q['atk']:.2f}) · 원화 닮음 {Q['fid']} → {v}"
        if v=='3d' and m.get('current')=='2d' and m['decision']=='2d' and '2D 유지' in (m.get('reason') or ''):v='2d';why+=' → R1385 전환 문턱(화면 색) 미통과로 2D 유지'
        r.update(decision=v,reason=why)
    rows.append(r)
out=dict(rule='scripts/r1389-scope.py',q_min=Q_MIN,fid_min=FID_MIN,amp_full=AMP_FULL,mobs=rows)
json.dump(out,open(P('r96/qa/r1389/scope-decision.json'),'w'),ensure_ascii=False,indent=1)
c=collections.Counter(r['decision'] for r in rows);ch=[r for r in rows if r['decision']!=r['r1385']]
print(f"{len(rows)} 결정 (3D {c['3d']}·2D {c['2d']}), R1385 와 달라짐 {len(ch)}")
for r in rows:
    if r['decision']=='3d':print('  3D',r['key'],r['name'],'—',r['reason'])
if '--write' in sys.argv:
    p=P('r96/client-source/mob-scope-r1389.js');s=open(p).read()
    tbl='const TABLE={'+','.join(f"'{k}':'{r['decision']}'" for k,r in sorted(((k,r) for r in rows for k in r['kinds']),key=lambda x:x[0]))+'};'
    s2=re.sub(r'(// ==TABLE==[^\n]*\n)const TABLE=\{[^\n]*\};',lambda mm:mm.group(1)+tbl,s)
    assert s2!=s or tbl in s,'TABLE 자리 못 찾음';open(p,'w').write(s2)
