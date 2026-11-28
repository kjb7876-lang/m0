"""R1377: motion-census json + probe3d jsonl → 실제 2D 몸 그림(대기 주 그림 출처)별 묶음과 필요한 그림 목록.
사용: python3 r96/qa/r1377/bodies.py mc.json p3d.jsonl out.json"""
import json, sys, collections
rows = json.load(open(sys.argv[1])); three = {}
for l in open(sys.argv[2]):
    d = json.loads(l); three[d['zone']] = set(d['threeD'])
r2 = [r for r in rows if r.get('twoD') and r['id'] not in three.get(r['zone'], set())]
g = collections.OrderedDict()
for r in sorted(r2, key=lambda r: -r['score']):
    k = None
    for S in ('idle', 'walk', 'attack', 'hit'):
        if S in r['states'] and r['states'][S].get('srcs'): k = r['states'][S]['srcs'][0]; break
    g.setdefault(k, []).append(r)
json.dump(g, open(sys.argv[3], 'w'), ensure_ascii=False, indent=1)
rank = {'B': 2, 'M': 1, 'm': 0}
print('2D rows', len(r2), 'bodies', len(g), collections.Counter(max((x['kind'] for x in v), key=rank.get) for v in g.values()))
for k, v in g.items():
    x = v[0]; kind = max((y['kind'] for y in v), key=rank.get)
    print(f"{kind} {x['score']:3} {x['name'][:14]:14} n{len(v)} {str(k)[-46:]:46} mix{x.get('nmix')} sp{x['spread']:.2f} UD:" + ''.join(('o' if x['ud'][s][b] else 'x' if x['ud'][s][b] is False else '-') for s in ('walk', 'attack') for b in ('up', 'down')) + ' ' + ' '.join(f"{s[:2]}{x['states'][s]['cells']}" for s in x['states']))
