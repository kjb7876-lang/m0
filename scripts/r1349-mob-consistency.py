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

def resolve(cfg):
    for b, B in cfg['bosses'].items():
        need = [F for F in B['frames'] if F.get('scaleFrom') in ('sheetHeight', 'sheetMass')]
        if not need: continue
        ref = ref_image(B); r0 = m.measure(ref); H = ref.height
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
