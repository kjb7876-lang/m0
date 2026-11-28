#!/usr/bin/env python3
"""R1371 탐침 판정: 공격·원거리 준비 동안 그린 쪽(원본 방향 표 ⊕ 거울) = 영웅 쪽인지, 표 누락 시트는 무엇인지.
사용: face-judge.py <truth-data.js> <probe.json…> [--out summary.json] [--arts arts.json]"""
import json,re,sys,collections,os
args=sys.argv[1:];out=None;arts_out=None
if '--out' in args:i=args.index('--out');out=args[i+1];del args[i:i+2]
if '--arts' in args:i=args.index('--arts');arts_out=args[i+1];del args[i:i+2]
tsrc=open(args[0],encoding='utf8').read()
m=re.search(r'/\*JSON\*/(\{.*?\})/\*END\*/',tsrc,re.S)
T=json.loads(m.group(1)) if m else {}
r1226=dict(re.findall(r"'([^']+)':'([LR])'",re.search(r'const FACE=Object\.freeze\(\{([\s\S]*?)\n\}\);',open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../client-source/mob-motion-consistency-r1226.js'),encoding='utf8').read()).group(1)))
def face(a):
    if not a or not a.get('path'):return None
    return T.get(a['path']+'#'+str(a.get('cell')))or T.get(a['path'])or r1226.get(a['path'])
EXZ=re.compile(r'mammon|^ep1b06')
wrong=[];unl=collections.Counter();unl_ex={};probes=0;bossp=0;zones=0;arts=collections.defaultdict(lambda:{'n':0,'mir':collections.Counter(),'names':set(),'kinds':set()})
for f in args[1:]:
    d=json.load(open(f))
    for z,v in d.items():
        if 'mobs' not in v:continue
        zones+=1
        if EXZ.search(z):continue
        for mob in v['mobs']:
            for r in mob.get('rows',[]):
                rc=r.get('rec')
                if not rc or not rc.get('art'):continue
                a=rc['art']
                key=a['path']+'#'+str(a.get('cell'))
                A=arts[key];A['n']+=1;A['names'].add(mob['name']);A['kinds'].add(r['kind']);A['mir'][(r['side'],rc['mir'])]+=1
                if r['kind'] not in('atk','wind'):continue
                if r['kind']=='atk' and r.get('frac',1)<.3:continue  # 공격 첫 순간(R444 잠금 전 한 프레임)은 빼고
                probes+=1;bossp+=1 if (mob.get('boss') or mob.get('mid')) else 0
                fc=face(a)
                if fc is None:unl[a['path']]+=1;unl_ex.setdefault(a['path'],(z,mob['name']));continue
                if fc=='F':continue
                drawn='L' if ((fc=='L')!=rc['mir']) else 'R'
                if drawn!=r['side']:wrong.append({'zone':z,'name':mob['name'],'nid':mob.get('nid'),'boss':mob.get('boss'),'mid':mob.get('mid'),'kind':r['kind'],'frac':r.get('frac'),'hero':r['side'],'drawn':drawn,'art':key,'want':r.get('want')})
wn=sorted({(w['zone'],w['name'],w['art'].split('#')[0]) for w in wrong})
res={'zones':zones,'probes':probes,'bossProbes':bossp,'wrong':len(wrong),'wrongMobs':len({(w['zone'],w['name']) for w in wrong}),'wrongList':[{'zone':a,'name':b,'art':c} for a,b,c in wn],'unlabeled':len(unl),'unlabeledList':[{'path':p,'n':n,'ex':unl_ex[p]} for p,n in unl.most_common()]}
print(json.dumps({k:(v if not isinstance(v,list) else v[:60]) for k,v in res.items()},ensure_ascii=False,indent=1))
if out:json.dump(res,open(out,'w'),ensure_ascii=False,indent=1)
if arts_out:json.dump({k:{'n':v['n'],'names':sorted(v['names'])[:4],'kinds':sorted(v['kinds']),'mir':{f'{s}{int(m)}':c for (s,m),c in v['mir'].items()}} for k,v in arts.items()},open(arts_out,'w'),ensure_ascii=False,indent=1)
