# 칸마다 R444 쪽(sd)에 따라 뒤집힘이 바뀌는지(따름 +1 / 반대 -1 / 안 따름 0) — 같은 몹 안에서 기준(걷기·대기 최다)과 다른 칸을 찾는다
import json,sys,re,collections,glob
sys.path.insert(0,__import__('os').path.dirname(__file__))
from ana import parse
def mot(p):
    s=p.lower()
    for k,pat in [('atk',r'attack|atk|strike|cast|aim|slash|bite|-p[123]\.'),('hit',r'-hit|hurt|hit4'),('walk',r'move|walk|-up\.|-down\.|side'),('idle',r'idle')]:
        if re.search(pat,s): return k
    return 'base'
res=[]
for fn in sys.argv[1:]:
    try: d=json.load(open(fn))
    except Exception: continue
    for z,v in d.items():
        for m in v.get('mobs',[]):
            R=[r for r in m.get('rows',[]) if r.get('b') and r['st']!='dead' and r.get('sd')]
            C=collections.defaultdict(lambda:collections.Counter())
            Hs=collections.defaultdict(list)
            for r in R:
                p,rect,pad=parse(r['b']);key=p+'#'+','.join(str(int(x)) for x in rect[:2])
                C[key][(r['sd'],r['b']['flip'])]+=1
            # 칸 단위 극성
            def pol(c):
                rt=c[('right',True)]+c[('right',False)];lt=c[('left',True)]+c[('left',False)]
                if rt<2 or lt<2: return None
                fr=c[('right',True)]/rt;fl=c[('left',True)]/lt
                if fr-fl>.6: return '+'   # 오른쪽 볼 때 뒤집음 = 원본 L
                if fl-fr>.6: return '-'   # 왼쪽 볼 때 뒤집음 = 원본 R
                if fr>.8 and fl>.8: return 'F'  # 늘 뒤집음(안 따름)
                if fr<.2 and fl<.2: return 'N'  # 늘 그대로(안 따름)
                return '~'
            # 시트 단위로 묶기
            S=collections.defaultdict(collections.Counter)
            for k,c in C.items(): S[k.split('#')[0]].update(c)
            sheets={p:(mot(p),pol(c),sum(c.values())) for p,c in S.items()}
            cells={k:(mot(k),pol(c),sum(c.values())) for k,c in C.items()}
            res.append(dict(z=z,k=m['k'],name=m.get('name'),sheets=sheets,cells=cells))
json.dump(res,open('flips.json','w'),ensure_ascii=False)
for r in res:
    pols=set(v[1] for v in r['sheets'].values() if v[1] in('+','-'))
    bad=[p for p,v in r['sheets'].items() if v[1] in('N','F','~')]
    mixedcell=[k for k,v in r['cells'].items() if v[1] in('+','-') and r['sheets'][k.split('#')[0]][1] in('+','-') and v[1]!=r['sheets'][k.split('#')[0]][1]]
    flag=('POL' if len(pols)>1 else '')+(' CONST' if bad else '')+(' CELL' if mixedcell else '')
    print(f"{flag:14s} {r['z']:8s} {r['k'][:40]:40s} "+'  '.join(f"{p.split('/')[-1][:34]}:{v[0]}{v[1]}{v[2]}" for p,v in sorted(r['sheets'].items(),key=lambda x:-x[1][2])))
