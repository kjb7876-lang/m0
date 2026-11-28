"""R1377 2D 몹·보스 동작 빈곤·크기 튐 순위(PIL 만).
census.mjs(R1349) 결과 폴더를 읽어 몹마다 상태(대기·걷기·공격·피격)별
 - 서로 다른 그림 칸 수(작게 줄인 알파+명도 해시로 같은 그림 묶음)
 - 화면 몸 키 퍼짐(상태 안 최대/최소-1, 상태 사이 중앙값 퍼짐)
 - 걷기 칸이 대기 칸과 같은 그림인지(미끄러짐)
를 내고, 점수(빈곤+튐)로 순위를 매긴다.
사용: python3 r96/qa/r1377/motion-census.py <census 폴더> [--json out.json]
"""
import json, os, sys, statistics as stt
from PIL import Image

def sig(path):
    im = Image.open(path).convert('RGBA')
    a = im.getchannel('A'); bb = a.point(lambda v: 255 if v > 40 else 0).getbbox()
    if not bb: return None, 0
    c = im.crop(bb); g = Image.new('RGBA', c.size, (0, 0, 0, 255)); g.alpha_composite(c)
    s = g.convert('L').resize((12, 16)); px = list(s.get_flattened_data() if hasattr(s, 'get_flattened_data') else s.getdata()); m = sum(px) / len(px)
    return tuple(1 if v > m else 0 for v in px), (bb[3] - bb[1]) / im.height

def ham(a, b): return sum(x != y for x, y in zip(a, b))

def distinct(sigs, tol=14):
    reps = []
    for s in sigs:
        if s is None: continue
        if not any(ham(s, r) <= tol for r in reps): reps.append(s)
    return reps

def run(root):
    rows = []
    for z in sorted(os.listdir(root)):
        cj = os.path.join(root, z, 'census.json')
        if not os.path.exists(cj): continue
        d = json.load(open(cj))
        for mid, M in d['mobs'].items():
            twoD = M['no2d'] < M['frames'] * .5 and sum(1 for L in M['states'].values() if L) >= 3  # 대기에서만 2D 로 잡히고 나머지가 3D 면 3D(늦게 실린 GLB)
            st = {}; allsig = {}; dirs = {}
            for S, L in M['states'].items():
                sigs = []; hs = []
                for o in L:
                    p = os.path.join(root, z, M['dir'], o['file'])
                    if not os.path.exists(p): continue
                    s, fh = sig(p)
                    q = o['pts']; qh = ((q[3][0] - q[0][0]) ** 2 + (q[3][1] - q[0][1]) ** 2) ** .5
                    if s is None: continue
                    if o['n'] >= 2: sigs.append(s)
                    hs += [qh * fh] * min(o['n'], 30)
                reps = distinct(sigs); allsig[S] = reps
                # R1377 방향별: 위·아래·옆(좌우) 에서 그려진 그림 묶음
                dsig = {}
                for o in L:
                    pth = os.path.join(root, z, M['dir'], o['file'])
                    if not os.path.exists(pth): continue
                    sg, _ = sig(pth)
                    for dk, c in (o.get('dir') or {}).items():
                        b = 'side' if dk in ('left', 'right') else dk
                        if sg is not None and c >= 2: dsig.setdefault(b, []).append(sg)
                dirs[S] = {b: distinct(v) for b, v in dsig.items()}
                srcN = {}
                for o in L: srcN[o['key'].split('|')[0].split(':')[0]] = srcN.get(o['key'].split('|')[0].split(':')[0], 0) + o['n']
                tot = sum(srcN.values()) or 1; srcs = sorted(((v / tot, k) for k, v in srcN.items()), reverse=True)
                mix = [k for f, k in srcs if f >= .1]
                if hs: st[S] = {'mix': len(mix), 'srcs': [k for f, k in srcs[:3]], 'cells': len(reps), 'h': round(stt.median(hs), 1), 'in': round(max(hs) / max(1e-3, min(hs)) - 1, 3)}
            if not twoD or not st:
                rows.append({'zone': z, 'id': mid, 'name': M['name'], 'kind': 'B' if M['boss'] else 'M' if M['midboss'] else 'm', 'twoD': False}); continue
            hv = [v['h'] for v in st.values()]
            slide = bool(allsig.get('walk') and allsig.get('idle') and len(allsig['walk']) <= 1 and any(ham(allsig['walk'][0], r) <= 14 for r in allsig['idle']))
            poor = sum(max(0, need - st.get(S, {'cells': 0})['cells']) for S, need in (('idle', 3), ('walk', 4), ('attack', 3), ('hit', 2)))
            spread = round(max(hv) / min(hv) - 1, 3); inn = max(v['in'] for v in st.values())
            kind = 'B' if M['boss'] else 'M' if M['midboss'] else 'm'
            nmix = sum(1 for v in st.values() if v.get('mix', 1) > 1)
            score = nmix * 2 + poor * (2 if kind != 'm' else 1) + (spread > .08) * 4 + (inn > .12) * 2 + slide * 3
            # 위·아래 전용 그림이 있는가: 그 방향 그림 묶음이 옆 묶음과 다른 그림을 하나라도 갖는가
            def own(S, b):
                D = dirs.get(S, {}); A = D.get(b) or []; Sd = D.get('side') or []
                if not A: return None
                return any(all(ham(a, x) > 14 for x in Sd) for a in A)
            ud = {S: {b: own(S, b) for b in ('up', 'down')} for S in ('walk', 'attack')}
            noUD = sum(1 for S in ud for b in ud[S] if ud[S][b] is False)
            score += noUD * (2 if kind != 'm' else 1)
            rows.append({'zone': z, 'id': mid, 'name': M['name'], 'kind': kind, 'twoD': True, 'states': st, 'ud': ud, 'noUD': noUD, 'spread': spread, 'inState': inn, 'nmix': nmix, 'slide': slide, 'poor': poor, 'score': score})
    return rows

if __name__ == '__main__':
    rows = run(sys.argv[1])
    for r in sorted(rows, key=lambda r: -r.get('score', -1)):
        if not r['twoD']: print(f"{r['zone']:8} {r['kind']} {r['id'][:18]:18} {r['name'][:16]:16} 3D/없음"); continue
        print(f"{r['score']:3} {r['zone']:8} {r['kind']} {r['id'][:18]:18} {r['name'][:16]:16} spread{r['spread']:.2f} in{r['inState']:.2f} slide{int(r['slide'])} UD:" + ''.join(('o' if r['ud'][S][b] else 'x' if r['ud'][S][b] is False else '-') for S in ('walk','attack') for b in ('up','down')) + ' ' + ' '.join(f"{k[:2]}{v['cells']}" for k, v in r['states'].items()))
    if '--json' in sys.argv: json.dump(rows, open(sys.argv[sys.argv.index('--json') + 1], 'w'), ensure_ascii=False, indent=1)
