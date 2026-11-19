#!/usr/bin/env python3
"""R1247 Dots 시트 입고 검사 — 칸 시트를 받아 쓰기 전에 숫자로 걸러 낸다(PIL 만, numpy 없음).

검사 규칙(oh-my-hermes 의 omh-sprite-forge 'fail-closed 시트 QC' 아이디어를 참고해 새로 짬, 코드 복사 없음):
  empty    — 그림이 없는 칸
  bleed    — 그림(알파 >= 64)이 칸 가장자리에 3px 이상 닿음 = 이웃 칸으로 넘쳤거나 잘림
  baseline — 발 맨 아래 줄(한 줄에 3px 이상인 가장 아래 줄)이 그룹 기준(낮은 중앙값 = 실제 한 칸의 값)에서 foot_tol 넘게 벗어남
  scale    — 몸 키(bbox 높이)가 그룹 중앙값의 scale_ratio 배를 넘거나 1/scale_ratio 보다 작음
  jitter   — 몸통·엉덩이 띠(몸 높이 40~75%)의 가로 무게중심이 그룹 기준에서 center_tol 넘게 벗어남
             (달리기 보폭·팔·무기 뻗기는 이 띠 밖이라 떨림으로 보지 않는다. 처음엔 발 부분을 쟀으나
              옆 달리기 시트(r164 run-e)에서 보폭 때문에 58px 거짓 경보가 나서 몸통으로 바꿈)
kind=fx 이면 empty·bleed 만 본다(이펙트는 발·몸이 없음). fx 끝에 이어진 빈 칸은 사라짐 연출로 허용(전부 비면 HOLD).
배경: 시트에 투명 픽셀이 있으면 알파를 그대로 쓰고, 없으면 --key(기본 FF00FF) 크로마키 ±tolerance.

사용:
  python3 -I scripts/r1247-sheet-intake.py check <sheet> (--cell WxH | --grid RxC) [--frames N] [--group S:N ...] [--kind char|fx]
      → JSON 출력, 종료 0=PASS 1=HOLD 2=입력 거부
  python3 -I scripts/r1247-sheet-intake.py census [assets 루트] [--out 디렉터리]
      → index.json 에 cell·cols 가 적힌 시트를 모두 재서 보고서(json·md)를 쓴다. 보고용이라 늘 종료 0.
"""
import argparse, json, pathlib, statistics, sys
from PIL import Image

ALPHA_ON = 64        # 그림으로 보는 알파
ROW_MIN = 3          # 발 줄·가장자리 넘침으로 보는 최소 픽셀 수
TORSO_BAND = (.40, .75)  # 몸통·엉덩이 = 몸 위에서 40~75% 높이(달리기 보폭·무기 뻗기에 덜 흔들림)
MAX_SIDE = 16384
SKIP_KEYS = ('source', 'replace', 'orig', 'upper', 'legs', 'prev', 'raw')


def default_tolerances(cell):
    cw, ch = cell
    return dict(foot_tol=max(2, round(.02 * ch)), center_tol=max(3, round(.08 * cw)), scale_ratio=1.25)


def _mask(im, key, tolerance):
    """그림 마스크(L, 255=그림)와 배경 방식."""
    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
        rgba = im.convert('RGBA')
        a = rgba.getchannel('A')
        if a.getextrema()[0] < 255:
            return a.point(lambda v: 255 if v >= ALPHA_ON else 0), 'alpha'
        im = rgba
    rgb = im.convert('RGB')
    kr, kg, kb = key
    chans = [c.point(lambda v, k=k: 255 if abs(v - k) <= tolerance else 0) for c, k in zip(rgb.split(), (kr, kg, kb))]
    from PIL import ImageChops
    bg = ImageChops.multiply(ImageChops.multiply(chans[0], chans[1]), chans[2])
    return ImageChops.invert(bg), 'key:%02X%02X%02X' % key


def _profile(m, axis):
    """마스크의 줄(axis=0 → 행)·열(axis=1) 별 그림 픽셀 수."""
    w, h = m.size
    if axis == 0:
        prof = m.resize((1, h), Image.BOX)
        return [round(v * w / 255) for v in prof.tobytes()]
    prof = m.resize((w, 1), Image.BOX)
    return [round(v * h / 255) for v in prof.tobytes()]


def _edge_count(m):
    w, h = m.size
    boxes = [(0, 0, w, 1), (0, h - 1, w, h), (0, 0, 1, h), (w - 1, 0, w, h)]
    return max(m.crop(b).histogram()[255] for b in boxes)


def measure_cell(m):
    bbox = m.getbbox()
    if not bbox:
        return None
    rows = _profile(m, 0)
    feet = [y for y, n in enumerate(rows) if n >= ROW_MIN]
    top = bbox[1]
    foot = feet[-1] if feet else bbox[3] - 1
    body = foot - top + 1
    y0 = top + int(body * TORSO_BAND[0]); y1 = max(y0 + 1, top + int(body * TORSO_BAND[1]))
    band = m.crop((0, y0, m.size[0], y1))
    cols = _profile(band, 1)
    tot = sum(cols)
    cx = sum(x * n for x, n in enumerate(cols)) / tot if tot else (bbox[0] + bbox[2] - 1) / 2
    return dict(top=top, foot=foot, body=body, cx=round(cx, 2), edge=_edge_count(m))


def check_sheet(im, cell=None, grid=None, frames=None, groups=None, kind='char', key=(255, 0, 255), tolerance=30, tol=None):
    W, H = im.size
    if W > MAX_SIDE or H > MAX_SIDE:
        raise ValueError(f'sheet side larger than {MAX_SIDE}px: {W}x{H}')
    if cell is None and grid is None:
        raise ValueError('need cell (WxH) or grid (RxC)')
    if cell is None:
        r, c = grid
        if W % c or H % r:
            raise ValueError(f'cannot divide sheet {W}x{H} into grid {r}x{c}')
        cell = (W // c, H // r)
    cw, ch = cell
    if W % cw or H % ch:
        raise ValueError(f'cannot divide sheet {W}x{H} into cells {cw}x{ch}')
    cols, rows = W // cw, H // ch
    n = frames if frames else cols * rows
    if n > cols * rows:
        raise ValueError(f'frames {n} > cells {cols * rows}')
    t = dict(default_tolerances(cell), **(tol or {}))
    m, background = _mask(im, key, tolerance)
    cells = [measure_cell(m.crop(((i % cols) * cw, (i // cols) * ch, (i % cols + 1) * cw, (i // cols + 1) * ch))) for i in range(n)]
    issues = []
    def add(rule, idx, msg):
        if idx:
            issues.append(dict(rule=rule, cells=sorted(idx), msg=msg))
    empty = [i for i, c in enumerate(cells) if c is None]
    if kind == 'fx':  # 이펙트 끝에 이어진 빈 칸은 사라짐 연출로 본다
        k = n
        while k > 0 and cells[k - 1] is None:
            k -= 1
        empty = [i for i in empty if i < k] if k else empty
    add('empty', empty, 'no drawing in cell')
    add('bleed', [i for i, c in enumerate(cells) if c and c['edge'] >= ROW_MIN], 'drawing touches cell edge (overflow or cut)')
    foot_spread = center_spread = 0
    scale_ratio = 1.0
    if kind != 'fx':
        for s, cnt in (groups or [(0, n)]):
            g = [(i, cells[i]) for i in range(s, min(n, s + cnt)) if cells[i]]
            if len(g) < 2:
                continue
            mf = statistics.median_low([c['foot'] for _, c in g])
            mb = statistics.median_low([c['body'] for _, c in g])
            mx = statistics.median_low([c['cx'] for _, c in g])
            foot_spread = max(foot_spread, max(c['foot'] for _, c in g) - min(c['foot'] for _, c in g))
            center_spread = max(center_spread, round(max(c['cx'] for _, c in g) - min(c['cx'] for _, c in g), 2))
            scale_ratio = max(scale_ratio, max(c['body'] for _, c in g) / min(c['body'] for _, c in g))
            add('baseline', [i for i, c in g if abs(c['foot'] - mf) > t['foot_tol']], f"foot row off group median {mf} by > {t['foot_tol']}px")
            add('scale', [i for i, c in g if not (1 / t['scale_ratio'] <= c['body'] / mb <= t['scale_ratio'])], f"body height off group median {mb} by > x{t['scale_ratio']}")
            add('jitter', [i for i, c in g if abs(c['cx'] - mx) > t['center_tol']], f"torso center x off group median {mx} by > {t['center_tol']}px")
    return dict(verdict='HOLD' if issues else 'PASS', issues=issues, cell=[cw, ch], rows=rows, cols=cols, frames=n,
                kind=kind, background=background, tolerances=t, foot_spread=foot_spread, center_spread=center_spread,
                scale_ratio=round(scale_ratio, 4), cells=cells)


def _pair(s, sep='x'):
    a, b = s.lower().split(sep)
    return int(a), int(b)


def _group(s):
    a, b = s.split(':')
    return int(a), int(b)


# ---------- 전수(보고용) ----------
def _entries(d, base, assets):
    """index.json 안의 시트 파일 경로를 찾는다(dict 의 file·path 값)."""
    out = []
    def walk(v):
        if isinstance(v, dict):
            for k in ('file', 'path'):
                f = v.get(k)
                if isinstance(f, str) and f.lower().endswith(('.png', '.webp')):
                    p = (assets.parent / f) if f.startswith('assets/') else (base / f)
                    out.append(p)
            for k, x in v.items():
                # 원천(드라이브 원본·이전 판) 기록은 시트가 아니다
                if isinstance(x, (dict, list)) and not any(w in k.lower() for w in SKIP_KEYS):
                    walk(x)
        elif isinstance(v, list):
            for x in v:
                walk(x)
    walk(d)
    seen, uniq = set(), []
    for p in out:
        if p not in seen:
            seen.add(p); uniq.append(p)
    return uniq


# index.json 맨 위에 cell·cols 가 없는 묶음의 칸 규격(런타임 index 는 건드리지 않고 여기서 보충).
# R1233: scripts/r1233-mob-sheets.py 가 R290·R410 규격(256x320, 4x3, 걷기 0-7 · 공격 8-11)으로 만든다.
ADAPTERS = {
    'r1233/mobs': dict(cell=(256, 320), cols=4, walk=[0, 8], attack=[8, 4]),
}


def census(assets, out_dir, adapters=None):
    assets = pathlib.Path(assets).resolve()
    adapters = ADAPTERS if adapters is None else adapters
    sheets, skipped, seen, nometa = [], [], set(), []
    for idx in sorted(assets.rglob('index.json')):
        try:
            d = json.loads(idx.read_text())
        except Exception:
            continue
        if not isinstance(d, dict):
            continue
        rel = idx.parent.relative_to(assets).as_posix()
        layout = 'index'
        if 'cell' not in d or 'cols' not in d:
            if rel in adapters:
                d = dict(d, **adapters[rel]); layout = f'adapter:{rel}'
            else:
                # 칸 규격을 모르면 재지 않지만, 시트를 가리키는 index 면 이유를 남긴다(조용히 빠지지 않게)
                for p in _entries(d, idx.parent, assets):
                    try:
                        rp = p.resolve().relative_to(assets).as_posix()
                    except ValueError:
                        rp = str(p)
                    nometa.append(dict(path=rp, index=f'{rel}/index.json', reason='no cell/cols layout metadata (index 에도 ADAPTERS 에도 없음)'))
                continue
        c = d['cell']
        cell = (c, c) if isinstance(c, int) else tuple(c)
        groups = [tuple(d[k]) for k in ('walk', 'attack') if isinstance(d.get(k), list) and len(d[k]) == 2] or None
        kind = 'fx' if ('fx' in d or '/fx' in '/' + rel or 'fx' in rel.split('/')[-1:]) else 'char'
        for p in _entries(d, idx.parent, assets):
            try:
                rp = p.resolve().relative_to(assets).as_posix()
            except ValueError:
                rp = str(p)
            if rp in seen:
                continue  # 여러 index.json 이 같은 시트를 가리키면 처음 것만
            seen.add(rp)
            if not p.exists():
                skipped.append(dict(path=rp, index=f'{rel}/index.json', reason='missing file')); continue
            try:
                with Image.open(p) as im:
                    r = check_sheet(im, cell=cell, groups=groups, kind=kind)
            except Exception as e:
                skipped.append(dict(path=rp, index=f'{rel}/index.json', reason=str(e))); continue
            r.pop('cells'); r.pop('tolerances')
            sheets.append(dict(path=rp, index=f'{rel}/index.json', layout=layout, **r))
    for k in nometa:  # 다른 index 가 규격과 함께 가리켜 이미 잰 시트는 빼고, 한 번씩만
        if k['path'] not in seen:
            seen.add(k['path']); skipped.append(k)
    summary = dict(PASS=sum(s['verdict'] == 'PASS' for s in sheets), HOLD=sum(s['verdict'] == 'HOLD' for s in sheets), skipped=len(skipped))
    by_rule = {}
    for s in sheets:
        for i in s['issues']:
            by_rule[i['rule']] = by_rule.get(i['rule'], 0) + 1
    summary['by_rule'] = dict(sorted(by_rule.items()))
    rep = dict(revision='R1247', generator='scripts/r1247-sheet-intake.py census', mode='report-only (CI 를 막지 않음)',
               summary=summary, sheets=sheets, skipped=skipped)
    out = pathlib.Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    (out / 'sheet-intake-report.json').write_text(json.dumps(rep, ensure_ascii=False, indent=1) + '\n')
    md = ['# R1247 Dots 시트 입고 검사 — 기존 자산 전수(보고용)', '',
          f"PASS {summary['PASS']} · HOLD {summary['HOLD']} · 건너뜀 {summary['skipped']} · 규칙별 {summary['by_rule']}", '',
          '보고용이다. 그룹(walk·attack) 정보가 없는 시트는 모든 칸을 한 그룹으로 비교하므로 공격 돌진·달리기 체공 칸이 baseline·jitter 로 잡힐 수 있다(사람이 그림으로 확인할 후보 목록).', '',
          '| 시트 | 판정 | 문제(칸) | 발 줄 차이(px) | 몸통 중심 차이(px) | 키 비율 |', '|---|---|---|---|---|---|']
    for s in sorted(sheets, key=lambda s: (s['verdict'] != 'HOLD', s['path'])):
        iss = '; '.join(f"{i['rule']}{i['cells']}" for i in s['issues']) or '-'
        md.append(f"| {s['path']} | {s['verdict']} | {iss} | {s['foot_spread']} | {s['center_spread']} | {s['scale_ratio']} |")
    if skipped:
        groups = {}
        for k in skipped:
            groups.setdefault((k['reason'], k['index']), []).append(k['path'])
        md += ['', '## 건너뜀(이유·index 별)', '']
        for (reason, ix), ps in sorted(groups.items()):
            md.append(f"- {ix} — {reason}: {len(ps)}장" + (f" ({', '.join(ps)})" if len(ps) <= 5 else ''))
    (out / 'sheet-intake-report.md').write_text('\n'.join(md) + '\n')
    return rep


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    c = sub.add_parser('check')
    c.add_argument('sheet'); g = c.add_mutually_exclusive_group(required=True)
    g.add_argument('--cell'); g.add_argument('--grid')
    c.add_argument('--frames', type=int); c.add_argument('--group', action='append')
    c.add_argument('--kind', choices=['char', 'fx'], default='char')
    c.add_argument('--key', default='FF00FF'); c.add_argument('--tolerance', type=int, default=30)
    c.add_argument('--cells', action='store_true', help='칸별 측정값도 출력')
    s = sub.add_parser('census')
    root = pathlib.Path(__file__).resolve().parent.parent / 'r96'
    s.add_argument('assets', nargs='?', default=str(root / 'runtime-text' / 'assets'))
    s.add_argument('--out', default=str(root / 'qa' / 'r1247'))
    a = ap.parse_args(argv)
    if a.cmd == 'census':
        rep = census(a.assets, a.out)
        print(json.dumps(rep['summary'], ensure_ascii=False))
        return 0
    try:
        key = tuple(int(a.key[i:i + 2], 16) for i in (0, 2, 4))
        with Image.open(a.sheet) as im:
            r = check_sheet(im, cell=_pair(a.cell) if a.cell else None, grid=_pair(a.grid) if a.grid else None,
                            frames=a.frames, groups=[_group(x) for x in a.group] if a.group else None,
                            kind=a.kind, key=key, tolerance=a.tolerance)
    except (ValueError, OSError) as e:
        print(f'refused: {e}', file=sys.stderr)
        return 2
    if not a.cells:
        r.pop('cells')
    print(json.dumps(r, ensure_ascii=False, indent=1))
    return 0 if r['verdict'] == 'PASS' else 1


if __name__ == '__main__':
    sys.exit(main())
