#!/usr/bin/env python3
"""R1337 2D 보스 동작 일관성 손질(뿌리의 문지기 dist00 · 핏빛 수호로 추격자 mb-dist03 · 발록 dist06).

게임이 실제로 그리는 몸 그림 칸(qa/r1337/census.mjs 로 상태별 수집, 목록 qa/r1337/frames.json)을 보스마다 기준 그림(대기 p4)에 맞춘다.
  1) 몸통 크기: 칼·뿌리 같은 가는 부분을 깎은 넓이의 제곱근(qa/r1337/metrics.py mass)을 기준과 같게(걷기 옆모습은 키로).
  2) 발 자리: 알파 아래끝 y · 아래 8% 띠 가운데 x 를 기준 칸의 같은 자리로.
  3) 색: 불투명 픽셀 RGB 평균·표준편차를 기준으로(피격 칸은 섬광이 있어 색은 건드리지 않음).
  4) 무기 쪽: flip 표시 칸은 좌우를 뒤집어 기준과 같은 쪽을 보게.
발을 맞추면 그림이 원래 칸 밖으로 나가는 자세(팔·뿌리를 크게 뻗은 칸)가 있어, 보스마다 칸을 pad 비율만큼 넓힌 새 칸에 놓는다.
오버레이(boss-2d-consistency-r1337.js)가 같은 pad 로 화면 네 점을 넓혀 그린다. 원본은 건드리지 않고 assets/r1337/ 에 새로 쓴다.
쓰는 법: python3 scripts/r1337-boss-consistency.py [--site r96/hospital-three-pc/site] [--only lucifer,mask]  (원본 중 일부는 빌드된 site 에만 있다)
R1341 더함(천사의 가면 ep1a11 루시퍼·초천사의 웃는 가면):
  · --only: 고른 보스만 다시 만들고 나머지 표·사본은 그대로 둔다.
  · colorRef: 색 기준을 다른 그림으로(루시퍼 2·3단계 어두운 판은 어두운 p4 에 맞춘다 — 밝은 기준에 맞추면 단계 연출이 사라진다).
  · dePool: R1029 떠서 이동 시트에 구워진 검은 그림자 웅덩이를 지운다(게임이 그림자를 따로 그린다).
  · 칸 크기가 기준과 다른 시트(떠서 이동 256 높이)는 배율 한계를 칸 높이 비로 옮기고, 표에 cell 을 따로 적는다.
  · walkDark: 어두운 단계에서 걸을 때 쓸 시트(표 walk.dark).
"""
import argparse, json, os, re, sys, hashlib
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'r96', 'qa', 'r1337'))
from metrics import measure, compare, verdict  # noqa: E402

RT = os.path.join(ROOT, 'r96', 'runtime-text')
QA = os.path.join(ROOT, 'r96', 'qa', 'r1337')
OVERLAY = os.path.join(ROOT, 'r96', 'client-source', 'boss-2d-consistency-r1337.js')


def load(rel, site):
    for base in (RT, site):
        p = os.path.join(base, rel)
        if base and os.path.exists(p):
            return Image.open(p).convert('RGBA'), p
    raise FileNotFoundError(rel)


def color_match(arr, ref_arr, strength):
    a = arr.astype(np.float32); m = a[..., 3] > 40; rm = ref_arr[..., 3] > 40
    out = a.copy()
    for ch in range(3):
        src = a[..., ch][m]; ref = ref_arr[..., ch][rm].astype(np.float32)
        if src.size < 10: continue
        s_mu, s_sd = src.mean(), src.std() + 1e-3; r_mu, r_sd = ref.mean(), ref.std()
        mapped = (a[..., ch] - s_mu) * (r_sd / s_sd) + r_mu
        out[..., ch] = np.where(m, a[..., ch] * (1 - strength) + mapped * strength, a[..., ch])
    return np.clip(out, 0, 255).astype(np.uint8)


def premul_resize(im, size):
    a = np.asarray(im).astype(np.float32); al = a[..., 3:4] / 255
    pm = np.concatenate([a[..., :3] * al, a[..., 3:4]], -1)
    ch = [Image.fromarray(pm[..., i]).resize(size, Image.LANCZOS) for i in range(4)]
    pr = np.stack([np.asarray(c, dtype=np.float32) for c in ch], -1)
    al2 = np.clip(pr[..., 3:4], 0, 255) / 255
    rgb = np.where(al2 > 1e-3, pr[..., :3] / np.maximum(al2, 1e-3), 0)
    return Image.fromarray(np.clip(np.concatenate([rgb, al2 * 255], -1), 0, 255).astype(np.uint8), 'RGBA')


def de_pool(cell, light=False):
    """떠서 이동 시트 아래쪽의 검은 그림자 웅덩이를 투명하게(게임이 그림자를 따로 그린다).
    몸 = 밝거나(명도 ≥ 60) 채도가 높은(≥ .45, 명도 ≥ 45 — 웅덩이도 보랏빛이라 채도가 높다) 픽셀을 7px 넓힌 곳. 칸 아래 45% 에서 몸 밖의 어두운 픽셀(명도 < 110)은 웅덩이로 본다.
    실측(R1341): 웅덩이는 명도 17~32·알파 ≤ 230 — 어두운 루시퍼 판의 깃은 붉은 깃에 붙어 있어 몸 안에 남는다.
    light=True(dePool 'light'): 몸 전체가 밝은 그림(가면)은 칸 아래 45% 의 명도 90 미만을 모두 웅덩이로 본다(발밑에 붙은 얼룩까지)."""
    a = np.asarray(cell).astype(np.float32); h = a.shape[0]
    rgb = a[..., :3]; v = rgb.max(-1); mn = rgb.min(-1); sat = (v - mn) / np.maximum(v, 1)
    body = (a[..., 3] > 200) & ((v >= 60) | ((sat >= .45) & (v >= 45)))
    bm = Image.fromarray((body * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(15))
    near = np.asarray(bm) > 0
    ys = np.arange(h)[:, None] / h
    pool = (a[..., 3] > 0) & (ys > .55) & (~near & (v < 110) | (v < 40) & (a[..., 3] < 250) | (light & (v < 90)))  # 발밑 웅덩이(몸에 붙은 곳)는 명도·알파로
    out = a.copy(); out[..., 3] = np.where(pool, 0, a[..., 3])
    # 남은 웅덩이 조각(몸에서 떨어진 덩어리, 압축 네모 자국)을 지운다: 가장 큰 덩어리(몸)에 이어지지 않고 칸 아래 45% 에만 있는 것
    m = out[..., 3] > 24; H_, W_ = m.shape; lab = np.zeros(m.shape, np.int32); sizes = [0]; lows = [True]; n = 0
    for y0 in range(H_):
        for x0 in np.nonzero(m[y0] & (lab[y0] == 0))[0]:
            if lab[y0, x0]: continue
            n += 1; st = [(y0, x0)]; lab[y0, x0] = n; cnt = 0; low = True
            while st:
                y, x = st.pop(); cnt += 1
                if y < .55 * H_: low = False
                for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= yy < H_ and 0 <= xx < W_ and m[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n; st.append((yy, xx))
            sizes.append(cnt); lows.append(low)
    if n > 1:
        big = int(np.argmax(sizes))
        drop = np.array([i != big and lows[i] for i in range(n + 1)]); drop[0] = False
        out[..., 3] = np.where(drop[lab], 0, out[..., 3])
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA')


def place(cell, s, foot_src, foot_dst, OW, OH):
    nw, nh = max(1, round(cell.width * s)), max(1, round(cell.height * s))
    sc = premul_resize(cell, (nw, nh)) if (nw, nh) != cell.size else cell
    tx, ty = foot_dst[0] - foot_src[0] * s, foot_dst[1] - foot_src[1] * s
    lay = Image.new('RGBA', (OW, OH), (0, 0, 0, 0)); lay.paste(sc, (int(round(tx)), int(round(ty))))
    return lay


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--site', default=os.path.join(ROOT, 'r96', 'hospital-three-pc', 'site'))
    ap.add_argument('--only', default='')
    args = ap.parse_args(); only = set(x for x in args.only.split(',') if x)
    cfg = json.load(open(os.path.join(QA, 'frames.json'), encoding='utf-8'))
    report = {}; table = {}
    if only:
        js0 = open(OVERLAY, encoding='utf-8').read()
        table = json.loads(re.search(r'__STORYWORLD_BOSS2D_R1337_DATA__=(\{.*?\});//', js0).group(1))['bosses']
        rp = os.path.join(QA, 'process-report.json')
        if os.path.exists(rp): report = json.load(open(rp, encoding='utf-8'))
    for boss, B in cfg['bosses'].items():
        if only and boss not in only: continue
        ref_im, _ = load(B['ref'], args.site); W, H = ref_im.size
        pl, pt, pr = B['pad']; OW, OH = round(W * (1 + pl + pr)), round(H * (1 + pt))
        r0 = measure(ref_im)
        ref_foot = ((pl + r0['footX']) * W, (pt + r0['footY']) * H)
        ref_out = place(ref_im, 1.0, (r0['footX'] * W, r0['footY'] * H), ref_foot, OW, OH)
        ref_m = measure(ref_out); ref_arr = np.asarray(ref_out)
        bb = ref_out.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox()
        ref_frac = {'top': round(bb[1] / OH, 4), 'bot': round(bb[3] / OH, 4), 'cx': round(ref_foot[0] / OW, 4)}
        tframes = []
        cref = {}
        def color_ref(path):
            if path not in cref:
                im_, _ = load(path, args.site); mm = measure(im_)
                cref[path] = np.asarray(place(im_, 1.0, (mm['footX'] * W, mm['footY'] * H), ref_foot, OW, OH))
            return cref[path]
        for F in B['frames'] + ([dict(B['walk'], walk=True)] if 'walk' in B else []) + ([dict(B['walkDark'], walk=True)] if 'walkDark' in B else []):
            src, src_path = load(F['path'], args.site)
            n = F.get('n', 1); cw = src.width // n
            outs = []; rows = []; feet = []
            for i in range(n):
                cell = src.crop((i * cw, 0, (i + 1) * cw, src.height))
                if F.get('flipAll') or i in F.get('flip', []):
                    cell = cell.transpose(Image.FLIP_LEFT_RIGHT)
                if F.get('dePool'):
                    cell = de_pool(cell, F.get('dePool') == 'light')
                m = measure(cell)
                feet.append([round(m['footX'], 4), round(m['footY'], 4)])
                before = compare(r0, m)
                if F.get('scaleBy') == 'height':
                    s = r0['h'] * H / (m['h'] * cell.height)
                elif F.get('scale', True):
                    s = r0['mass'] / m['mass']
                else:
                    s = 1.0
                base = H / cell.height  # 칸 높이가 기준과 다르면(떠서 이동 256) 한계도 그만큼 옮긴다
                s = max(.8 * base, min(1.25 * base, s))
                tgt = color_ref(F['colorRef']) if F.get('colorRef') else ref_arr
                tgt_m = measure(Image.fromarray(tgt, 'RGBA')) if F.get('colorRef') else ref_m
                def make(s):
                    o = place(cell, s, (m['footX'] * cell.width, m['footY'] * cell.height), ref_foot, OW, OH)
                    if F.get('color', True):
                        c = compare(tgt_m, measure(o))
                        if F.get('colorAlways') or c['meanDiff'] > 3 or c['stdRatioDev'] > .06:
                            o = Image.fromarray(color_match(np.asarray(o), tgt, F.get('strength', 1.0)), 'RGBA')
                    return o
                if F.get('refine'):
                    # R1341b: 놓은 뒤(크기 바꿈·색 맞춤 포함) 다시 재서 몸통 넓이가 기준과 ±0.3% 안에 들 때까지 배율을 고친다(최대 4번).
                    for _ in range(4):
                        out = make(s); mr = compare(ref_m, measure(out))['massRatio']
                        if abs(mr - 1) <= .003: break
                        s = max(.8 * base, min(1.25 * base, s / mr))
                    else:
                        out = make(s)
                else:
                    if abs(s - 1) < .01: s = 1.0
                    out = make(s)
                after = compare(tgt_m, measure(out))
                rows.append({'i': i, 'scale': round(s, 4), 'before': {k: round(v, 4) for k, v in before.items()},
                             'after': {k: round(v, 4) for k, v in after.items()}, 'badAfter': verdict(after)})
                outs.append(out)
            sheet = Image.new('RGBA', (OW * n, OH), (0, 0, 0, 0))
            for i, c in enumerate(outs): sheet.alpha_composite(c, (i * OW, 0))
            dst = os.path.join(RT, F['out']); os.makedirs(os.path.dirname(dst), exist_ok=True)
            sheet.save(dst, 'WEBP', quality=94, method=6, exact=True)
            report[F['out']] = {'boss': boss, 'state': F.get('state', 'walk' if F.get('walk') else ''), 'source': F['path'],
                                'sourceSha256': hashlib.sha256(open(src_path, 'rb').read()).hexdigest(),
                                'sha256': hashlib.sha256(open(dst, 'rb').read()).hexdigest(), 'bytes': os.path.getsize(dst), 'cells': rows}
            if not F.get('walk'):
                tf = dict({k: F[k] for k in ('path', 'out', 'n', 'ref', 'state', 'dark') if k in F}, foot=feet)
                if (cw, src.height) != (W, H): tf['cell'] = [cw, src.height]
                tframes.append(tf)
            print(boss, F['out'], [r['badAfter'] for r in rows])
        table[boss] = {'name': B['name'], 'cell': [W, H], 'out': [OW, OH], 'pad': B['pad'], 'nativeLeft': B.get('nativeLeft', False),
                       'float': B.get('float'), 'refFoot': [round(r0['footX'], 4), round(r0['footY'], 4)], 'refFrac': ref_frac,
                       'frames': tframes + [dict(a, alias=True, foot=[[round(v, 4) for v in (lambda mm: (mm['footX'], mm['footY']))(measure(load(a['path'], args.site)[0]))]]) for a in B.get('alias', [])]}
        if 'walk' in B:
            w = B['walk']; table[boss]['walk'] = {'path': w['out'], 'n': w['n'], 'fps': w['fps'], 'nativeLeft': w.get('nativeLeft', False)}
            if 'walkDark' in B: table[boss]['walk']['dark'] = B['walkDark']['out']
    json.dump(report, open(os.path.join(QA, 'process-report.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    # 오버레이 표 갱신(손으로 고치지 않는다)
    js = open(OVERLAY, encoding='utf-8').read()
    line = 'window.__STORYWORLD_BOSS2D_R1337_DATA__=' + json.dumps({'revision': 'R1337', 'bosses': table}, ensure_ascii=False, separators=(',', ':')) + ';// @@TABLE@@ scripts/r1337-boss-consistency.py 가 만든다'
    js = re.sub(r'^.*@@TABLE@@.*$', lambda _: line, js, count=1, flags=re.M)
    open(OVERLAY, 'w', encoding='utf-8').write(js)


if __name__ == '__main__':
    main()
