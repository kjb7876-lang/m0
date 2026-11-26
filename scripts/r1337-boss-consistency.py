#!/usr/bin/env python3
"""R1337 2D 보스 동작 일관성 손질(뿌리의 문지기 dist00 · 핏빛 수호로 추격자 mb-dist03 · 발록 dist06).

게임이 실제로 그리는 몸 그림 칸(qa/r1337/census.mjs 로 상태별 수집, 목록 qa/r1337/frames.json)을 보스마다 기준 그림(대기 p4)에 맞춘다.
  1) 몸통 크기: 칼·뿌리 같은 가는 부분을 깎은 넓이의 제곱근(qa/r1337/metrics.py mass)을 기준과 같게(걷기 옆모습은 키로).
  2) 발 자리: 알파 아래끝 y · 아래 8% 띠 가운데 x 를 기준 칸의 같은 자리로.
  3) 색: 불투명 픽셀 RGB 평균·표준편차를 기준으로(피격 칸은 섬광이 있어 색은 건드리지 않음).
  4) 무기 쪽: flip 표시 칸은 좌우를 뒤집어 기준과 같은 쪽을 보게.
발을 맞추면 그림이 원래 칸 밖으로 나가는 자세(팔·뿌리를 크게 뻗은 칸)가 있어, 보스마다 칸을 pad 비율만큼 넓힌 새 칸에 놓는다.
오버레이(boss-2d-consistency-r1337.js)가 같은 pad 로 화면 네 점을 넓혀 그린다. 원본은 건드리지 않고 assets/r1337/ 에 새로 쓴다.
쓰는 법: python3 scripts/r1337-boss-consistency.py [--site r96/hospital-three-pc/site]  (원본 중 일부는 빌드된 site 에만 있다)
"""
import argparse, json, os, re, sys, hashlib
import numpy as np
from PIL import Image

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


def place(cell, s, foot_src, foot_dst, OW, OH):
    nw, nh = max(1, round(cell.width * s)), max(1, round(cell.height * s))
    sc = premul_resize(cell, (nw, nh)) if (nw, nh) != cell.size else cell
    tx, ty = foot_dst[0] - foot_src[0] * s, foot_dst[1] - foot_src[1] * s
    lay = Image.new('RGBA', (OW, OH), (0, 0, 0, 0)); lay.paste(sc, (int(round(tx)), int(round(ty))))
    return lay


def alias_row(a, site):
    # 다른 그림(또는 srcN 칸 시트의 모든 칸)을 사본의 한 칸으로 바꿔 그린다 — 발 자리는 원본 첫 칸에서 잰다
    im = load(a['path'], site)[0]; n = a.get('srcN', 1); cw = im.width // n
    mm = measure(im.crop((0, 0, cw, im.height)))
    return dict(a, alias=True, cw=cw, ch=im.height, foot=[[round(mm['footX'], 4), round(mm['footY'], 4)]])


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--site', default=os.path.join(ROOT, 'r96', 'hospital-three-pc', 'site'))
    args = ap.parse_args()
    cfg = json.load(open(os.path.join(QA, 'frames.json'), encoding='utf-8'))
    report = {}; table = {}
    for boss, B in cfg['bosses'].items():
        if isinstance(B['ref'], dict):  # R1337b: 아틀라스의 한 칸을 기준으로
            ref_im = load(B['ref']['path'], args.site)[0].crop(tuple(B['ref']['rect'][:2]) + (B['ref']['rect'][0] + B['ref']['rect'][2], B['ref']['rect'][1] + B['ref']['rect'][3]))
        else:
            ref_im, _ = load(B['ref'], args.site)
        W, H = ref_im.size
        pl, pt, pr = B['pad']; OW, OH = round(W * (1 + pl + pr)), round(H * (1 + pt))
        r0 = measure(ref_im)
        ref_foot = ((pl + r0['footX']) * W, (pt + r0['footY']) * H)
        ref_out = place(ref_im, 1.0, (r0['footX'] * W, r0['footY'] * H), ref_foot, OW, OH)
        ref_m = measure(ref_out); ref_arr = np.asarray(ref_out)
        bb = ref_out.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox()
        ref_frac = {'top': round(bb[1] / OH, 4), 'bot': round(bb[3] / OH, 4), 'cx': round(ref_foot[0] / OW, 4)}
        tframes = []
        for F in B['frames'] + ([dict(B['walk'], walk=True)] if 'walk' in B else []):
            src, src_path = load(F['path'], args.site)
            rects = F.get('rects'); n = len(rects) if rects else F.get('n', 1); cw = src.width // n
            outs = []; rows = []; feet = []
            for i in range(n):
                cell = src.crop((rects[i][0], rects[i][1], rects[i][0] + rects[i][2], rects[i][1] + rects[i][3])) if rects else src.crop((i * cw, 0, (i + 1) * cw, src.height))
                if F.get('flipAll') or i in F.get('flip', []):
                    cell = cell.transpose(Image.FLIP_LEFT_RIGHT)
                m = measure(cell)
                feet.append([round(m['footX'], 4), round(m['footY'], 4)])
                before = compare(r0, m)
                if F.get('scaleBy') == 'height':
                    s = r0['h'] * H / (m['h'] * cell.height)
                elif F.get('scale', True):
                    s = r0['mass'] / m['mass']
                else:
                    s = 1.0
                lo, hi = B.get('scaleClamp', [.8, 1.25]); s = max(lo, min(hi, s))
                if abs(s - 1) < .01: s = 1.0
                out = place(cell, s, (m['footX'] * cell.width, m['footY'] * cell.height), ref_foot, OW, OH)
                if F.get('color', True):
                    c = compare(ref_m, measure(out))
                    if F.get('colorAlways') or c['meanDiff'] > 3 or c['stdRatioDev'] > .06:
                        out = Image.fromarray(color_match(np.asarray(out), ref_arr, F.get('strength', 1.0)), 'RGBA')
                after = compare(ref_m, measure(out))
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
                row = dict({k: F[k] for k in ('path', 'out', 'n', 'ref', 'state', 'rects') if k in F}, foot=feet)
                if not rects: row.update(cw=cw, ch=src.height)
                tframes.append(row)
            print(boss, F['out'], [r['badAfter'] for r in rows])
        table[boss] = {'name': B['name'], 'cell': [W, H], 'out': [OW, OH], 'pad': B['pad'], 'nativeLeft': B.get('nativeLeft', False),
                       'float': B.get('float'), 'refFoot': [round(r0['footX'], 4), round(r0['footY'], 4)], 'refFrac': ref_frac,
                       'frames': tframes + [alias_row(a, args.site) for a in B.get('alias', [])]}
        if 'ids' in B: table[boss]['ids'] = B['ids']
        if 'walk' in B:
            w = B['walk']; table[boss]['walk'] = {'path': w['out'], 'n': w['n'], 'fps': w['fps'], 'nativeLeft': w.get('nativeLeft', False)}
    json.dump(report, open(os.path.join(QA, 'process-report.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    # 오버레이 표 갱신(손으로 고치지 않는다)
    js = open(OVERLAY, encoding='utf-8').read()
    line = 'window.__STORYWORLD_BOSS2D_R1337_DATA__=' + json.dumps({'revision': 'R1337', 'bosses': table}, ensure_ascii=False, separators=(',', ':')) + ';// @@TABLE@@ scripts/r1337-boss-consistency.py 가 만든다'
    js = re.sub(r'^.*@@TABLE@@.*$', lambda _: line, js, count=1, flags=re.M)
    open(OVERLAY, 'w', encoding='utf-8').write(js)


if __name__ == '__main__':
    main()
