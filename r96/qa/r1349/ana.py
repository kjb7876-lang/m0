"""R1349 전수 분석(PIL 만): census.json + 칸 그림 → 몹마다 상태별 화면 몸 키(보이는 알파 키)·몸통 크기·발 자리, 상태 간 퍼짐·좌우 섞임.
사용: python3 r96/qa/r1349/ana.py <census 폴더> [--tsv out.tsv]
퍼짐(spread) = 상태별 중앙 화면 몸통크기(mass 기반)의 최대/최소 - 1. 키 퍼짐도 함께.
"""
import json, os, sys, statistics as stt
from PIL import Image, ImageFilter

def meas(path):
    im = Image.open(path).convert('RGBA'); m = im.getchannel('A').point(lambda a: 255 if a > 40 else 0)
    bb = m.getbbox()
    if not bb: return None
    k = max(3, int(im.height * .02) | 1); core = m.filter(ImageFilter.MinFilter(k)); area = core.histogram()[255]
    return {'h': (bb[3] - bb[1]) / im.height, 'w': (bb[2] - bb[0]) / im.width, 'mass': area ** .5 / im.height, 'W': im.width, 'H': im.height, 'foot': bb[3] / im.height}

def analyze(root):
    rows = []
    for z in sorted(os.listdir(root)):
        cj = os.path.join(root, z, 'census.json')
        if not os.path.exists(cj): continue
        d = json.load(open(cj))
        for mid, M in d['mobs'].items():
            st = {}; faces = {}; paths = set(); sheets = {}
            for S, L in M['states'].items():
                hs = []; ms = []
                for o in L:
                    p = os.path.join(root, z, M['dir'], o['file'])
                    if not os.path.exists(p): continue
                    q = o['pts']; qh = ((q[3][0] - q[0][0]) ** 2 + (q[3][1] - q[0][1]) ** 2) ** .5
                    mm = meas(p)
                    if not mm: continue
                    paths.add(o['key'].split('|')[0])
                    for _ in range(min(o['n'], 50)):
                        hs.append(qh * mm['h']); ms.append(qh * mm['mass'])
                    sh = o['key'].split('|')[0].split(':')[0]; g = sheets.setdefault(sh, {'h': [], 'mass': [], 'cells': set(), 'n': 0})
                    g['h'].append(qh * mm['h']); g['mass'].append(qh * mm['mass']); g['cells'].add(o['key']); g['n'] += o['n']
                    for k, v in (o.get('face') or {}).items(): faces[k] = faces.get(k, 0) + v
                if hs: st[S] = {'h': stt.median(hs), 'mass': stt.median(ms), 'hmin': min(hs), 'hmax': max(hs), 'cells': len(L)}
            if not st: rows.append({'zone': z, 'id': mid, 'name': M['name'], 'kind': 'B' if M['boss'] else 'M' if M['midboss'] else 'm', 'twoD': False}); continue
            shs = {k: {'h': round(stt.median(v['h']), 1), 'mass': round(stt.median(v['mass']), 1), 'cells': len(v['cells']), 'n': v['n']} for k, v in sheets.items()}
            tot = sum(v['n'] for v in shs.values()) or 1
            big = {k: v for k, v in shs.items() if v['n'] >= tot * .03}
            bm = [v['mass'] for v in big.values()] or [1]
            sheetSpread = round(max(bm) / min(bm) - 1, 3)
            mv = [v['mass'] for v in st.values()]; hv = [v['h'] for v in st.values()]
            allh = [v['hmin'] for v in st.values()] + [v['hmax'] for v in st.values()]
            # 좌우 섞임: L 인데 그림이 안 뒤집힘(n)·뒤집힘(m) 이 둘 다 많이 나오면 상태마다 좌우 규칙이 다름
            rows.append({'zone': z, 'id': mid, 'name': M['name'], 'kind': 'B' if M['boss'] else 'M' if M['midboss'] else 'm', 'twoD': M['no2d'] < M['frames'] * .9,
                         'states': {k: {kk: round(vv, 3) if isinstance(vv, float) else vv for kk, vv in v.items()} for k, v in st.items()},
                         'massSpread': round(max(mv) / min(mv) - 1, 3), 'hSpread': round(max(hv) / min(hv) - 1, 3), 'hJump': round(max(allh) / max(1e-3, min(allh)) - 1, 3),
                         'idleH': round(st.get('idle', next(iter(st.values())))['h'], 1), 'faces': faces, 'nPaths': len(paths), 'paths': sorted(paths), 'sheets': shs, 'sheetSpread': sheetSpread})
    return rows

if __name__ == '__main__':
    rows = analyze(sys.argv[1])
    for r in sorted(rows, key=lambda r: -r.get('sheetSpread', -1)):
        if not r['twoD']: print(f"{r['zone']:8} {r['kind']} {r['id'][:22]:22} {r['name'][:14]:14} 3D/없음"); continue
        print(f"{r['zone']:8} {r['kind']} {r['id'][:22]:22} {r['name'][:14]:14} SHEET±{r['sheetSpread']:.2f} cells{r['nPaths']} mass±{r['massSpread']:.2f} h±{r['hSpread']:.2f} jump{r['hJump']:.2f} idleH{r['idleH']} paths{r['nPaths']} " + ' '.join(f"{k}:{v['mass']:.0f}/{v['h']:.0f}" for k, v in r['states'].items()) + ' ' + str(r['faces']))
    if '--json' in sys.argv: json.dump(rows, open(sys.argv[sys.argv.index('--json') + 1], 'w'), ensure_ascii=False, indent=1)

def before_json(root, out):
    """CI 검사용 요약: {zone: {nativeId: {name, kind, sheets: {시트 경로: 그린 횟수}}}}"""
    res = {}
    for z in sorted(os.listdir(root)):
        cj = os.path.join(root, z, 'census.json')
        if not os.path.exists(cj): continue
        d = json.load(open(cj))
        for mid, M in d['mobs'].items():
            sh = {}
            for L in M['states'].values():
                for o in L:
                    k = o['key'].split('|')[0].split(':')[0]; sh[k] = sh.get(k, 0) + o['n']
            res.setdefault(z, {})[mid] = {'name': M['name'], 'kind': 'B' if M['boss'] else 'M' if M['midboss'] else 'm', 'sheets': sh}
    json.dump(res, open(out, 'w'), ensure_ascii=False, indent=0, sort_keys=True)
