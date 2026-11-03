#!/usr/bin/env python3
"""R275 mob/boss image audit.

Measures every mob/boss image (and every frame rect) the game draws for enemies:
  border alpha (sprite touching the cell edge = clipped), opaque corners (matte / box background),
  checkerboard, bright/dark halo fringe, bbox height + foot-row spread per sheet, oversize (texture px per drawn px).
Inputs: --site <built site dir>, --census <census json from qa headless run> (optional), extra static sheet tables
read from client-source data (R248 sheets, R208/R223 index cells).
Outputs: --csv, --json.  Read-only: never writes into the asset tree.
"""
import argparse, csv, json, math, os, re, sys, hashlib
from PIL import Image

A_TH = 32  # alpha threshold for "visible"


def load(site, path, cache={}):
    if path in cache:
        return cache[path]
    f = os.path.join(site, path)
    im = None
    if os.path.isfile(f):
        try:
            im = Image.open(f)
            im.load()
            im = im.convert('RGBA')
        except Exception:
            im = None
    cache[path] = im
    return im


def rect_metrics(im, r):
    x, y, w, h = [int(round(v)) for v in r]
    x = max(0, x); y = max(0, y)
    w = min(w, im.width - x); h = min(h, im.height - y)
    if w <= 2 or h <= 2:
        return None
    c = im.crop((x, y, x + w, y + h))
    a = c.getchannel('A')
    px = a.load()
    rgb = c.convert('RGB').load()
    bbox = a.point(lambda v: 255 if v > A_TH else 0).getbbox()
    vis = int((__import__('numpy').asarray(a) > A_TH).sum())
    if not bbox or vis == 0:
        return {'empty': True, 'w': w, 'h': h}
    # border band (1px)
    border = [(i, 0) for i in range(w)] + [(i, h - 1) for i in range(w)] + [(0, j) for j in range(h)] + [(w - 1, j) for j in range(h)]
    bvis = sum(1 for (i, j) in border if px[i, j] > A_TH) / len(border)
    # per side: count visible px on that edge row/col
    side = {
        'top': sum(1 for i in range(w) if px[i, 0] > A_TH),
        'bottom': sum(1 for i in range(w) if px[i, h - 1] > A_TH),
        'left': sum(1 for j in range(h) if px[0, j] > A_TH),
        'right': sum(1 for j in range(h) if px[w - 1, j] > A_TH),
    }
    # corners: 6x6 patches fully opaque -> matte / box background
    k = max(2, min(6, w // 10, h // 10))
    corners = 0
    cols = []
    for (cx, cy) in [(0, 0), (w - k, 0), (0, h - k), (w - k, h - k)]:
        op = all(px[cx + i, cy + j] > 200 for i in range(k) for j in range(k))
        if op:
            corners += 1
            cols.append(rgb[cx + k // 2, cy + k // 2])
    opaque_ratio = float((__import__('numpy').asarray(a) > 200).mean())
    # checkerboard: opaque near-gray pixels at the typical checker values in the corner 16px squares
    chk = 0
    if corners:
        vals = set()
        for (cx, cy) in [(0, 0), (w - 1, h - 1)]:
            for i in range(min(16, w)):
                for j in range(min(16, h)):
                    xx = cx - i if cx else i; yy = cy - j if cy else j
                    r_, g_, b_ = rgb[xx, yy]
                    if abs(r_ - g_) < 6 and abs(g_ - b_) < 6:
                        vals.add(r_ // 16)
        chk = 1 if len(vals) == 2 and max(vals) >= 9 else 0
    # fringe: semi-transparent pixels next to transparent ones; compare luminance with solid interior
    fr_l = []; in_l = []
    step = max(1, int(math.sqrt(w * h / 40000)))
    for j in range(1, h - 1, step):
        for i in range(1, w - 1, step):
            av = px[i, j]
            if av <= A_TH:
                continue
            r_, g_, b_ = rgb[i, j]
            L = 0.299 * r_ + 0.587 * g_ + 0.114 * b_
            edge = px[i - 1, j] <= 8 or px[i + 1, j] <= 8 or px[i, j - 1] <= 8 or px[i, j + 1] <= 8
            if edge:
                fr_l.append(L)
            elif av > 240:
                in_l.append(L)
    fr = sum(fr_l) / len(fr_l) if fr_l else 0
    inn = sum(in_l) / len(in_l) if in_l else 0
    bw = sorted(set(cols))
    return {
        'w': w, 'h': h, 'bbox': [bbox[0], bbox[1], bbox[2], bbox[3]], 'bboxH': bbox[3] - bbox[1], 'foot': bbox[3],
        'border': round(bvis, 3), 'side': side, 'corners': corners, 'cornerColor': bw[:2], 'opaque': round(opaque_ratio, 3),
        'checker': chk, 'fringeL': round(fr, 1), 'innerL': round(inn, 1), 'fringeN': len(fr_l),
    }


def classify(m, drawnH=None, nat=None):
    probs = []
    if m.get('empty'):
        return ['empty-cell']
    if m['corners'] >= 3 or m['opaque'] > 0.93:
        probs.append('matte-background')
    if m['checker']:
        probs.append('checkerboard')
    cut = [s for s, n in m['side'].items() if n >= 3 and (n / (m['w'] if s in ('top', 'bottom') else m['h'])) > 0.01]
    if cut and 'matte-background' not in probs:
        probs.append('clipped-' + '+'.join(sorted(cut)))
    if m['fringeN'] > 40 and m['innerL'] < 140 and m['fringeL'] - m['innerL'] > 55:
        probs.append('bright-halo')
    return probs


def static_rects(root):
    """R248 sheets (12 cells 256x320) + R208/R223 move/attack cells from the source tables."""
    out = []
    t = open(os.path.join(root, 'r96/client-source/mob-unique-r248-data.js'), encoding='utf8').read()
    j = json.loads(t[t.index('Object.freeze(') + 14: t.rindex(')')])
    for sid, s in j['sheets'].items():
        p = j['dir'] + s['file']
        for fr in range(12):
            out.append((p, [(fr % 4) * 256, (fr // 4) * 320, 256, 320], 'R248 ' + sid, 'r248'))
    for idx in ['r96/runtime-text/assets/r208/mobs/index.json', 'r96/runtime-text/assets/r223/mobs/index.json']:
        f = os.path.join(root, idx)
        if not os.path.isfile(f):
            continue
        for m in json.load(open(f, encoding='utf8')).get('mobs', []):
            cw, ch = m['cell']
            for k in sorted(set(m.get('move', []) + m.get('attack', []))):
                out.append((m['path'], [k * cw, 0, cw, ch], 'R208 ' + m['id'], 'r208'))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--site', required=True)
    ap.add_argument('--root', default='.')
    ap.add_argument('--census', action='append', default=[])
    ap.add_argument('--csv', required=True)
    ap.add_argument('--json', required=True)
    a = ap.parse_args()
    rows = {}
    owners = {}
    drawn = {}
    for cf in a.census:
        c = json.load(open(cf, encoding='utf8'))
        for name, R in (c.get('per') or {}).items():
            kind = 'boss' if R.get('boss') or R.get('persona') else 'midboss' if R.get('mid') else 'mob'
            for k, I in R['imgs'].items():
                p, r = k.split('|', 1)
                if not p.startswith('assets/'):
                    continue
                rr = [int(v) for v in r.split(',')] if r else [0, 0, I['nw'], I['nh']]
                key = (p, tuple(rr))
                owners.setdefault(key, set()).add((kind, name, R.get('zone')))
                drawn[key] = max(drawn.get(key, 0), I.get('h') or 0)
                # same-size grid cells of that sheet (frames not caught during the short census window)
                x0, y0, cw, ch = rr
                if cw > 8 and ch > 8 and x0 % cw == 0 and y0 % ch == 0 and I['nw'] % cw == 0 and I['nh'] % ch == 0 and (I['nw'] // cw) * (I['nh'] // ch) <= 64:
                    for gy in range(0, I['nh'], ch):
                        for gx in range(0, I['nw'], cw):
                            owners.setdefault((p, (gx, gy, cw, ch)), set()).add((kind, name, R.get('zone')))
        for z, Z in (c.get('zones') or {}).items():
            for e in Z.get('stat') or []:
                kind = 'boss' if e.get('boss') else 'mob'
                for p in [e.get('r248'), e.get('r208'), e.get('path')] + (e.get('r54') or []) + (e.get('prof') or []):
                    if p and isinstance(p, str) and p.startswith('assets/'):
                        im = load(a.site, p)
                        if im is not None and not any(k[0] == p for k in owners):
                            owners.setdefault((p, (0, 0, im.width, im.height)), set()).add((kind, e.get('name'), z))
    for p, r, who, src in static_rects(a.root):
        owners.setdefault((p, tuple(r)), set()).add(('static', who, src))
    sheets = {}
    for (p, r), own in sorted(owners.items()):
        im = load(a.site, p)
        if im is None:
            rows[(p, r)] = {'path': p, 'rect': list(r), 'missing': True}
            continue
        m = rect_metrics(im, r)
        if m is None:
            continue
        dh = drawn.get((p, r), 0)
        probs = classify(m)
        # effects / shadows drawn inside drawEnemy are not bodies
        body = not re.search(r'shadow|ring|glow|hp|bar|effects/|vfx|/fx|atlas|aura|halo|sig-|mark', p, re.I)
        ov = round(r[3] / dh, 2) if dh else None
        row = {'path': p, 'rect': list(r), 'nat': [im.width, im.height], 'body': body, 'drawnH': dh, 'texPerPx': ov,
               'owners': sorted({f'{k}:{n}' for k, n, z in own})[:6], 'nOwners': len(own), 'kind': sorted({k for k, n, z in own}),
               'zones': sorted({z for k, n, z in own if z})[:8], 'probs': probs, **m}
        rows[(p, r)] = row
        sheets.setdefault(p, []).append(row)
    # per-sheet consistency: bbox height and foot row spread over frames of the same sheet with the same cell size
    for p, rs in sheets.items():
        grp = {}
        for row in rs:
            if row.get('empty'):
                continue
            grp.setdefault((row['rect'][2], row['rect'][3]), []).append(row)
        for (cw, ch), g in grp.items():
            if len(g) < 3:
                continue
            hs = [x['bboxH'] for x in g]; fs = [x['foot'] for x in g]
            mh = sorted(hs)[len(hs) // 2]; mf = sorted(fs)[len(fs) // 2]
            for x in g:
                x['sheetMedH'] = mh; x['sheetMedFoot'] = mf
                if mh and abs(x['bboxH'] - mh) / mh > 0.35 and x['body']:
                    x['probs'].append('scale-jump')
                if abs(x['foot'] - mf) > 0.08 * ch and x['body']:
                    x['probs'].append('foot-drift')
    for row in rows.values():
        if row.get('missing'):
            row['probs'] = ['missing-file']
            continue
        if row['body'] and row.get('texPerPx') and row['texPerPx'] > 3.5 and row['nat'][0] * row['nat'][1] > 1024 * 1024:
            row['probs'].append('oversized')
    out = sorted(rows.values(), key=lambda x: (x['path'], x['rect']))
    json.dump(out, open(a.json, 'w', encoding='utf8'), ensure_ascii=False)
    with open(a.csv, 'w', newline='', encoding='utf8') as f:
        w = csv.writer(f)
        w.writerow(['path', 'rect', 'nat', 'body', 'drawnH', 'texPerPx', 'bboxH', 'foot', 'border', 'top', 'bottom', 'left', 'right', 'corners', 'opaque', 'checker', 'fringeL', 'innerL', 'probs', 'owners'])
        for r in out:
            if r.get('missing'):
                w.writerow([r['path'], r['rect'], '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'missing-file', ''])
                continue
            if r.get('empty'):
                w.writerow([r['path'], r['rect'], r['nat'], r['body'], r['drawnH'], r['texPerPx'], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'empty-cell', ';'.join(r['owners'])])
                continue
            s = r['side']
            w.writerow([r['path'], r['rect'], r['nat'], r['body'], r['drawnH'], r['texPerPx'], r['bboxH'], r['foot'], r['border'], s['top'], s['bottom'], s['left'], s['right'], r['corners'], r['opaque'], r['checker'], r['fringeL'], r['innerL'], ' '.join(r['probs']), ';'.join(r['owners'])])
    cnt = {}
    for r in out:
        for p in r.get('probs', []):
            cnt[p.split('-')[0] if p.startswith('clipped') else p] = cnt.get(p.split('-')[0] if p.startswith('clipped') else p, 0) + 1
    print(json.dumps({'rects': len(out), 'images': len({r['path'] for r in out}), 'problems': cnt}, ensure_ascii=False))


if __name__ == '__main__':
    main()
