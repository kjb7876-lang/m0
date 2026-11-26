#!/usr/bin/env python3
"""R1349 2D 몹·보스 동작 일관성 손질 — R1337 방식(scripts/r1337-boss-consistency.py)을 그대로 쓰되
목록은 qa/r1349/frames.json, 결과 표는 mob-2d-consistency-r1349-data.js(window.__STORYWORLD_BOSS2D_R1349_DATA__)에 쓴다.
R1337 오버레이(boss-2d-consistency-r1337.js)가 두 표를 합쳐 그린다. 사본은 assets/r1349/ 에 새로 쓰고 원본은 건드리지 않는다.
R1349 더한 것: 시트 한 장 한 배율 — frames.json 의 "scaleFrom": "sheetHeight"(보이는 키 중앙값) · "sheetMass"(몸통 넓이 중앙값)
  칸마다 따로 맞추면 걷기 출렁임·웅크린 자세가 지워진다(R1337b 집도의 교훈) → 시트 안 모든 칸에 같은 숫자 배율을 써 넣는다.
쓰는 법: python3 scripts/r1349-mob-consistency.py [--site r96/hospital-three-pc/site]
"""
import importlib.util, json, os, statistics, sys
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('r1337', os.path.join(ROOT, 'scripts', 'r1337-boss-consistency.py'))
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
m.QA = os.path.join(ROOT, 'r96', 'qa', 'r1349')
m.OVERLAY = os.path.join(ROOT, 'r96', 'client-source', 'mob-2d-consistency-r1349-data.js')
SITE = os.path.join(ROOT, 'r96', 'hospital-three-pc', 'site')

def ref_image(B):
    if isinstance(B['ref'], dict):
        r = B['ref']['rect']; return m.load(B['ref']['path'], SITE)[0].crop((r[0], r[1], r[0] + r[2], r[1] + r[3]))
    return m.load(B['ref'], SITE)[0]

def float_arts():
    """R1029·R1224 떠서 이동 표: 사본 경로 → (원본 경로, 원본 칸 높이, 칸 높이, pad)"""
    import re
    out = {}
    for f in ('move-float-r1029-data.js', 'move-float-r1224-data.js'):
        js = open(os.path.join(ROOT, 'r96', 'client-source', f), encoding='utf-8').read()
        i = js.find('const A=') + 8 if 'const A=' in js else js.find('{"revision"')
        d, _ = json.JSONDecoder().raw_decode(js[i:]); arts = d.get('arts', d)
        for k, v in arts.items():
            src, rect = k.split('|'); w, h = int(rect.split(',')[2]), int(rect.split(',')[3])
            out[v['path']] = ('assets/' + src, w, h, v['cw'], v['ch'], v['pad'], [int(t) for t in rect.split(',')])
    return out

def _alpha(im):
    import numpy as np
    return np.asarray(im.convert('RGBA'))[..., 3].astype('float32') / 255

def float_fit(path, a):
    """떠서 이동 칸 0 의 윗몸(안개 없는 위쪽 절반)과 원본 칸을 배율·가로 위치로 겹쳐 가장 잘 맞는 축소 비율.
    pad 상자 맞춤 공식은 날개·안개 여백 때문에 실제보다 10~20% 작게(→ 사본이 크게) 나왔다."""
    import numpy as np
    src = m.load(a[0], SITE)[0]; r = a[6]; src = src.crop((r[0], r[1], r[0] + r[2], r[1] + r[3]))
    fl = m.load(path, SITE)[0]; C = _alpha(fl.crop((0, 0, a[3], fl.height)))
    top = int(np.where(C.max(1) > .5)[0][0])
    def score(s):
        S = _alpha(src.resize((max(4, int(src.width * s)), max(4, int(src.height * s)))))
        sy = np.where(S.max(1) > .5)[0]
        band = int((sy[-1] - sy[0]) * .5); Sb = S[sy[0]:sy[0] + band]; Cb = C[top:top + band]
        if Cb.shape[0] < band or band < 8: return -1
        best = -1
        for dx in range(-Sb.shape[1] + 10, Cb.shape[1] - 10, 2):
            x0, x1 = max(0, dx), min(Cb.shape[1], dx + Sb.shape[1])
            if x1 - x0 < 10: continue
            A, B = Cb[:, x0:x1], Sb[:, x0 - dx:x1 - dx]
            inter = np.minimum(A, B).sum(); uni = np.maximum(A, B).sum() + Cb.sum() - A.sum() + Sb.sum() - B.sum() + 1e-6
            best = max(best, inter / uni)
        return best
    lo, hi = .1, 1.6; s0 = max(lo, min(hi, min(a[3] / a[1], a[4] / a[2])))
    grid = [s0 * k for k in np.arange(.5, 1.3, .04)]
    sc = [(score(s), s) for s in grid]; b = max(sc)[1]
    sc = [(score(s), s) for s in np.arange(b * .95, b * 1.05, b * .01)]
    return float(max(sc)[1])

def resolve(cfg):
    FA = float_arts()
    for b, B in cfg['bosses'].items():
        refp = B['ref']['path'] if isinstance(B['ref'], dict) else B['ref']
        need = [F for F in B['frames'] if F.get('scaleFrom') in ('sheetHeight', 'sheetMass')]
        if not need: continue
        ref = ref_image(B); r0 = dict(m.measure(ref)); H = ref.height
        # 기준이 가로 한 줄 시트의 한 칸이면 그 시트 모든 칸의 키 중앙값을 쓴다(숨쉬기 칸 하나가 커서 걷기 시트가 10% 크게 나오던 것, 부정의 잔영)
        rf = next((G for G in B['frames'] if G.get('ref') and G.get('n', 1) > 1 and not G.get('rects')), None)
        if rf:
            sh = m.load(rf['path'], SITE)[0]; cw = sh.width // rf['n']
            hs = [mm['h'] * sh.height / H for mm in (m.measure(sh.crop((i * cw, 0, (i + 1) * cw, sh.height))) for i in range(rf['n'])) if mm]
            if hs: r0['h'] = statistics.median(hs)
        for F in need:
            src = m.load(F['path'], SITE)[0]; rects = F.get('rects'); n = len(rects) if rects else F.get('n', 1); cw = src.width // n
            vals = []
            for i in range(n):
                cell = src.crop((rects[i][0], rects[i][1], rects[i][0] + rects[i][2], rects[i][1] + rects[i][3])) if rects else src.crop((i * cw, 0, (i + 1) * cw, src.height))
                mm = m.measure(cell)
                if not mm: continue
                if F['scaleFrom'] == 'sheetHeight':
                    vals.append(r0['h'] * H / (mm['h'] * cell.height))
                else:
                    vals.append((r0['mass'] / r0['H'] * H) / (mm['mass'] / mm['H'] * cell.height))
            F['scale'] = round(statistics.median(vals) * F.get('adjust', 1.0), 4)
    # 떠서 이동 시트는 발밑 안개가 키를 늘린다 → 그 시트를 만든 원본 칸의 배율(기준이면 1, 표의 다른 시트면 그 배율) ÷ 원본을 안쪽 상자에 맞춘 비율
    for b, B in cfg['bosses'].items():
        refp = B['ref']['path'] if isinstance(B['ref'], dict) else B['ref']
        for F in B['frames']:
            if F.get('scaleFrom') != 'float': continue
            a = FA.get(F['path'])
            base = None
            if a:  # 원본 칸을 쓴 표 줄(같은 아틀라스 칸이면 그 줄) → 기준 칸 → 같은 원본 경로 줄
                num = lambda G: isinstance(G.get('scale'), (int, float)) and not isinstance(G.get('scale'), bool)
                same = [G for G in B['frames'] if G is not F and G['path'] == a[0] and num(G)]
                hit = [G for G in same if a[6] in (G.get('rects') or [])]
                rr = B['ref'].get('rect') if isinstance(B['ref'], dict) else None
                if hit: base = hit[0]['scale']
                elif a[0] == refp and (rr is None or list(rr) == a[6]): base = 1.0
                elif same: base = same[0]['scale']
            if base is None:
                F['scaleFromFallback'] = True; continue
            fit = float_fit(F['path'], a)  # 떠서 이동 첫 칸 안에서 원본 그림이 실제로 줄어든 비율(윗몸 실루엣 맞추기)
            F['scale'] = round(base / fit * F.get('adjust', 1.0), 4)
        # 원본을 못 찾은 떠서 이동 시트는 키 중앙값으로
        fb = [F for F in B['frames'] if F.pop('scaleFromFallback', False)]
        if fb:
            for F in fb: F['scaleFrom'] = 'sheetHeight'
            resolve({'bosses': {b: {**B, 'frames': fb}}})
            for F in fb: F['scaleFrom'] = 'float'
    # 표에 숫자로 정한 배율은 가두지 않는다(가두면 큰 원본 칸의 떠서 이동 시트가 작게 나온다)
    for B in cfg['bosses'].values():
        nums = [F['scale'] for F in B['frames'] if isinstance(F.get('scale'), (int, float)) and not isinstance(F.get('scale'), bool)]
        if nums:
            lo, hi = B.get('scaleClamp', [.8, 1.25])
            B['scaleClamp'] = [round(min(lo, min(nums) * .95), 3), round(max(hi, max(nums) * 1.05), 3)]
    return cfg

if __name__ == '__main__':
    p = os.path.join(m.QA, 'frames.json')
    cfg = resolve(json.load(open(p, encoding='utf-8')))
    json.dump(cfg, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    m.main()
    js = open(m.OVERLAY, encoding='utf-8').read()
    js = js.replace('window.__STORYWORLD_BOSS2D_R1337_DATA__={"revision":"R1337"', 'window.__STORYWORLD_BOSS2D_R1349_DATA__={"revision":"R1349"')
    js = js.replace('scripts/r1337-boss-consistency.py 가 만든다', 'scripts/r1349-mob-consistency.py 가 만든다')
    open(m.OVERLAY, 'w', encoding='utf-8').write(js)
