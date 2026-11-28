#!/usr/bin/env python3
"""R1385 몹별 2D·3D 판정(docs/mob-2d3d-rule-r1385.md).
사용: r1385-decide.py <score.json> <fidelity.json> <out decision.json> [--write]
  --write 면 r96/client-source/mob-dim-rule-r1385.js 의 ==TABLE== 사이를 판정표로 다시 쓴다.
fidelity.json = {"<3D 촬영 열쇠 예: r1330_giantStomach>": [원화 닮음 점수, "한 줄 근거"]} (사람이 대조표를 보고 매김)
"""
import json,sys,re,os,collections
SC,FID,OUT=sys.argv[1:4];WRITE='--write' in sys.argv
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W=dict(con=.40,mot=.35,aes=.25);MARGIN=.8;FID_MIN=6
SIN3D={'ep1b02','ep1b03','ep1b04','ep1b05','ep1b06','ep1b07','ep1b08'};ZONE3D={'ep1b01'};NO3D={'last302','last303'}
ZONE_PICK={'r1315','r1316','r1317','r1322','r1322c','r1330','r1343','r1382'}
DEFAULT_ON={'r1312','r1315','r1329'}
NOGLB={'r1329:hornLord','r1329:bloodPursuer','r1329:balrog','r1312:boss'}# r1312:boss = R1337 로 3D 표에서 빠짐(사용자 '뿌리보스 2d로')
# 설정으로 켜고 끄기로 사용자가 정한 것 — 표에 넣지 않음
SETTING={'r1338:balrog':'사용자 11-26 "기본2d 3d키면3d로"','r1382:lucifer':'천사의 가면 맵 2D(사용자), R1382 설정으로만 3D','r1315:glutton':'사용자 11-25 "설정 켜면 보스 방 내내 3D 악마"',
 'r1382:wrathEar':'R1382 기본 2D·사용자 카드 대기(HF 스레드)','r1382:slothMan':'R1382 기본 2D·사용자 카드 대기(HF 스레드)'}
# 지역 단위로 사용자가 2D 로 정한 곳(그 지역에만 나오는 몹)
ZONE_LOCK2D={'ep1a11':'사용자: 천사의 가면 맵 2D','last302':'사용자 11-26: 불면귀 마을 전부 2D','last303':'사용자 11-26: 불면귀 마을 전부 2D'}
# 사용자가 몹 단위로 정한 것(잠금)
LOCK={
 'r1329:eggkeeper':('3d','사용자 11-26 08:18Z 알집지기 3D'),'r1329:violetAngel':('3d','사용자 11-26 08:18Z 보라검천사 3D'),
 'r1329:swampMage':('3d','사용자 11-26 08:22Z 수렁주문사 3D'),'r1329:swampStalker':('3d','사용자 11-26 08:22Z 늪 뿌리추적자 3D'),
 'r1329:bloodHound':('3d','사용자 11-26 08:46Z 피냄새추적자 3D'),'r1329:addictionCore':('3d','사용자 11-26 13:17Z 중독의 폐허핵 3D'),
 'r1322:clockwork':('2d','사용자 11-26 A/B/C 비교 "위 세개는 a"(2D)'),'r1322:clockworkLeader':('2d','사용자 11-26 A/B/C 비교(2D)'),
 'r1322:reversal':('2d','사용자 11-26 A/B/C 비교(2D)'),'r1322:censor':('2d','사용자 11-26 A/B/C 비교(2D)'),
 'r1322c:seoyun':('3d','사용자 11-26 A/B/C 비교 "서윤과 회장은 b"(3D)'),'r1322c:hotelChairman':('3d','사용자 11-26 A/B/C 비교(3D)'),
'r1322c:surgeon':('2d','사용자: 병원 집도의 2D'),
 'r1317:orb':('3d','R1372 사용자: 기계화 복종 봉인구만 3D 기본 켬'),
 'r1343:leviathan':('3d','사용자 11-26 13:39Z 금이 간 안경 모든 몹·보스 3D 고품질'),'r1343:jealousyWraith':('3d','사용자 11-26 13:39Z 금이 간 안경 3D'),
 'r1343:glassWraith':('3d','사용자 11-26 13:39Z 금이 간 안경 3D'),
}
def tagkind(e):
    o=e['own'][0];mod,k=o.split(':')
    t={'MOB3D_R1312':'r1312','MOB3D_R1315':'r1315','BOSS3D_R1322C':'r1322c','BALROG3D_R1338':'r1338'}.get(mod,mod.replace('MOB3D_R','r').lower())
    return t,k
def main():
    ents=[e for e in json.load(open(SC)) if e.get('own')];fid=json.load(open(FID)) if os.path.exists(FID) else {}
    by=collections.OrderedDict()
    for e in ents:
        t,k=tagkind(e);key=f'{t}:{k}'
        g=by.setdefault(key,dict(key=key,tag=t,kind=k,names=set(),zones=set(),ents=[]));g['names'].add(e['name']);g['zones'].add(e['zone']);g['ents'].append(e)
    mobs=[]
    for key,g in by.items():
        if key in NOGLB:continue
        e=max(g['ents'],key=lambda x:sum(x['d2']['frames'].values()))# 가장 많이 잡힌 판
        d2=e['d2'];d3=e.get('d3') or {}
        f=fid.get(d3.get('key'));fs=f[0] if f else None
        s2=dict(con=d2['con'],mot=round(d2['mot'],2),aes=d2['sharp']);s3=dict(con=d3.get('con',0),mot=d3.get('mot',0),aes=fs if fs is not None else 0)
        tot=lambda s:round(sum(W[a]*s[a] for a in W),2);t2,t3=tot(s2),tot(s3);diff=round(t3-t2,2)
        cur3d=any((z in SIN3D|ZONE3D and g['tag'] in ZONE_PICK) for z in g['zones']) or g['tag'] in DEFAULT_ON or key=='r1317:orb'
        if g['tag']=='r1322' and g['kind'] in('clockwork','clockworkLeader','reversal','censor'):cur3d=False
        if all(z in NO3D for z in g['zones']):cur3d=False
        m=dict(key=key,kinds=[key],name=sorted(g['names'],key=len)[0],names=sorted(g['names']),zones=sorted(g['zones']),boss=e['boss'],mid=e['mid'],
               d2=dict(s2,total=t2,spread=d2['spread'],frames=d2['frames'],upscale=d2['upscale'],blocked=bool(d2['blocked'])),
               d3=dict(s3,total=t3,clips=d3.get('clips'),fid_note=f[1] if f else None),diff=diff,current='3d' if cur3d else '2d')
        if key in SETTING:m.update(decision=None,reason='설정으로 정함: '+SETTING[key]);mobs.append(m);continue
        zl=[ZONE_LOCK2D[z] for z in g['zones'] if z in ZONE_LOCK2D]
        if key not in LOCK and zl and all(z in ZONE_LOCK2D for z in g['zones']):m.update(decision='2d',lock=zl[0],reason='잠금: '+zl[0])
        elif key in LOCK:m.update(decision=LOCK[key][0],lock=LOCK[key][1],reason='잠금: '+LOCK[key][1])
        elif fs is None:m.update(decision=None,reason='원화 닮음 미평가')
        elif fs<FID_MIN:m.update(decision='2d',reason=f'3D 원화 닮음 {fs} < {FID_MIN}: {f[1]}')
        elif diff>=MARGIN:m.update(decision='3d',reason=f'3D 가 {diff:+.2f} 앞섬')
        elif diff<=-MARGIN:m.update(decision='2d',reason=f'2D 가 {-diff:+.2f} 앞섬')
        else:m.update(decision='tie',reason=f'차 {diff:+.2f} (±{MARGIN} 안)')
        mobs.append(m)
    # 측정에 안 잡힌 잠금(순찰·사몽 전용 등)도 표에 넣는다
    have={m['key'] for m in mobs}
    for key,(v,why) in LOCK.items():
        if key not in have:mobs.append(dict(key=key,kinds=[key],name=key,names=[],zones=[],boss=None,mid=None,d2=None,d3=None,diff=None,current=None,decision=v,lock=why,reason='잠금(측정 안 됨): '+why))
    # 비슷함 → 지역 다수(지역마다 정해진 결정의 다수), 없으면 지금 상태
    for m in mobs:
        if m['decision']!='tie':continue
        votes=collections.Counter(x['decision'] for x in mobs if x is not m and x['decision'] in('2d','3d') and set(x['zones'])&set(m['zones']))
        if votes['3d']!=votes['2d']:m['decision']=max(('3d','2d'),key=lambda v:votes[v]);m['reason']+=f' → 지역 다수 {m["decision"]}({votes["3d"]}:{votes["2d"]})'
        else:m['decision']=m['current'];m['reason']+=f' → 지역 동률, 지금 상태 {m["current"]} 유지'
    # 이름 같은 짝(R1316↔R1343 망령)은 같은 결정
    pairs={'r1316:envy':'r1343:jealousyWraith','r1316:glass':'r1343:glassWraith'}
    for a,b in pairs.items():
        mb=next((x for x in mobs if x['key']==b),None)
        if mb and mb['decision'] and a not in mb['kinds']:mb['kinds'].append(a)
        mobs[:]=[x for x in mobs if x['key']!=a]
    rows=[m for m in mobs if m['decision'] in('2d','3d')]
    out=dict(rule='docs/mob-2d3d-rule-r1385.md',weights=W,margin=MARGIN,fid_min=FID_MIN,mobs=rows,
             skipped=[dict(key=m['key'],name=m['name'],reason=m['reason']) for m in mobs if m['decision'] not in('2d','3d')])
    json.dump(out,open(OUT,'w'),ensure_ascii=False,indent=1)
    c=collections.Counter(m['decision'] for m in rows);ch=[m for m in rows if m['current'] and m['decision']!=m['current']]
    print(f"{len(rows)} 결정 (3D {c['3d']}·2D {c['2d']}), 지금과 달라짐 {len(ch)}, 보류 {len(out['skipped'])}")
    if WRITE:
        p=os.path.join(ROOT,'r96/client-source/mob-dim-rule-r1385.js');s=open(p).read()
        tbl='const TABLE={'+','.join(f"'{k}':'{m['decision']}'" for m in rows for k in m['kinds'])+'};'
        s=re.sub(r'(// ==TABLE==[^\n]*\n)const TABLE=\{[^\n]*\};',lambda mm:mm.group(1)+tbl,s);open(p,'w').write(s)
main()
