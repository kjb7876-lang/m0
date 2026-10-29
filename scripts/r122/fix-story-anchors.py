"""R122: 원문을 최종검수본으로 바꾼 뒤, JS 안의 {key:'구간',sub:'문단 앞부분'} 연결을 새 원문으로 옮긴다.
이전 원문에서 그 앞부분이 있던 문단 번호를 찾아, 같은 구간의 새 문단 수에 비례한 번호로 옮기고 그 문단의 고유 앞부분과 위치 번호(i)를 적는다.
usage: python -I fix_anchors.py <old samong-text.js> <new samong-text.js> <target.js> [--sec S-02 ...]"""
import json, re, sys
OLD, NEW, ZJS = sys.argv[1], sys.argv[2], sys.argv[3]
only = set(sys.argv[sys.argv.index('--sec') + 1:]) if '--sec' in sys.argv else None
def load(p):
    t = open(p, encoding='utf-8').read(); return json.loads(t[t.index('Object.freeze(') + 14:t.rindex(');')])
OS = {k: [p for b in v['blocks'] for p in b['paras']] for k, v in load(OLD)['sections'].items()}
NS = {k: [p for b in v['blocks'] for p in b['paras']] for k, v in load(NEW)['sections'].items()}
def uniq(sec, i):
    N = NS[sec]; t = N[i]
    for L in range(10, len(t) + 1):
        s = t[:L]
        if next(j for j, p in enumerate(N) if p.startswith(s)) == i: return s
    return t
src = open(ZJS, encoding='utf-8').read(); cnt = 0; miss = []; same = 0
def fix(m):
    global cnt, same
    q, sec, sub, rest = m.group(1), m.group(2), m.group(3), m.group(4) or ''
    if only and sec not in only or sec not in OS or sec not in NS: return m.group(0)
    O, N = OS[sec], NS[sec]
    idx = next((j for j, x in enumerate(O) if x.startswith(sub)), None)
    if idx is None: idx = next((j for j, x in enumerate(O) if sub in x), None)
    if idx is None: miss.append((sec, sub)); return m.group(0)
    ni = min(len(N) - 1, round(idx * len(N) / len(O))) if len(O) != len(N) else idx
    cnt += 1; ns = uniq(sec, ni).replace('\\', '\\\\').replace(q, '\\' + q).replace('\n', '\\n')
    return 'key:' + q + sec + q + ',sub:' + q + ns + q + ',i:' + str(ni)
src2 = re.sub(r"key:(['\"])([A-Za-z0-9-]+)\1,sub:\1((?:(?!\1).)+)\1(,i:\d+)?", fix, src)
open(ZJS, 'w', encoding='utf-8').write(src2); print(ZJS, 'fixed', cnt, 'miss', miss[:5])

# 배열 형태 ['구간','앞부분',장수] (samong-r103.js CUES)
src = open(ZJS, encoding='utf-8').read(); cnt2 = 0; miss2 = []
def fix2(m):
    global cnt2
    q, sec, sub, n = m.group(1), m.group(2), m.group(3), m.group(4)
    if sec not in OS or sec not in NS: return m.group(0)
    O, N = OS[sec], NS[sec]
    if any(p.startswith(sub) for p in N) and not any(p.startswith(sub) for p in O): return m.group(0)
    idx = next((j for j, x in enumerate(O) if x.startswith(sub)), None)
    if idx is None: idx = next((j for j, x in enumerate(O) if sub in x), None)
    if idx is None: miss2.append((sec, sub)); return m.group(0)
    ni = min(len(N) - 1, round(idx * len(N) / len(O))) if len(O) != len(N) else idx
    cnt2 += 1; ns = uniq(sec, ni).replace('\\', '\\\\').replace(q, '\\' + q).replace('\n', '\\n')
    return '[' + q + sec + q + ',' + q + ns + q + ',' + n + ']'
src2 = re.sub(r"\[(['\"])([A-Za-z0-9-]+)\1,\1((?:(?!\1).){4,})\1,(\d+)\]", fix2, src)
open(ZJS, 'w', encoding='utf-8').write(src2); print(ZJS, 'array-form fixed', cnt2, 'miss', miss2[:5])
