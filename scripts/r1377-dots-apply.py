#!/usr/bin/env python3
"""R1377 Dots SW-2D-R1377 결과 검사·적용(PIL 만).
사용: python3 scripts/r1377-dots-apply.py <결과 png 폴더> <물결 list.json 들…> [--ref <ref 폴더>] [--apply]
- 파일 이름 SW-2D-R1377_<코드>_<atk|walk|idle|hit>_<up|down|side><칸수>_r<판>.png
- 재는 것(요청서 규격): 가로 한 줄·칸 512·칸 수=이름, RGBA·네 귀퉁이 투명, 칸마다 발(알파 아래끝) y=488±8, 몸 가운데 x=256±48,
  같은 몹 모든 시트의 서 있는 몸통 키(칸 몸통 키 중앙값)가 서로 ±5%, 몸 픽셀 평균 RGB 가 참고 대기 그림과 8 이하(경고 12 이하),
  위·아래 공격은 옆 공격 시트를 돌리거나 뒤집은 것이 아님(첫 칸 실루엣 IoU<0.9).
- --apply 면 통과한 시트만 r96/client-source/assets/r1377/<id>/<동작>_<방향><칸수>.webp 로 바꾸고 qa/r1377/dir-art.json 에 넣는다.
  그다음 scripts/r1377-dir-art-table.py <census> 를 돌린다. 결과 표: qa/r1377/dots-check.json
"""
import json, os, re, sys
from PIL import Image, ImageChops
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = re.compile(r'SW-2D-R1377_([A-C]\d{2})_(atk|walk|idle|hit)_(up|down|side)(\d+)_r(\d+)\.png$')
CELL, FOOT, CX = 512, 488, 256

def rows_body(a):
    w, h = a.size; px = a.load(); rows = [sum(1 for x in range(0, w, 2) if px[x, y]) for y in range(h)]
    m = max(rows) or 1; ys = [y for y, n in enumerate(rows) if n >= m * .12]
    return (ys[-1] - ys[0] + 1) if ys else 0

def mean_rgb(im):
    im = im.copy(); im.thumbnail((128, 128)); px = [q for q in im.getdata() if q[3] > 120]
    if not px: return None
    return tuple(sum(q[i] for q in px) / len(px) for i in range(3))

def check(path, n):
    im = Image.open(path); out = {'file': os.path.basename(path), 'errors': [], 'warn': []}
    if im.mode != 'RGBA': out['errors'].append(f'RGBA 아님({im.mode})'); im = im.convert('RGBA')
    if im.size != (CELL * n, CELL): out['errors'].append(f'크기 {im.size} ≠ {(CELL*n, CELL)}')
    n = max(1, im.width // CELL); cells = []
    for i in range(n):
        c = im.crop((i * CELL, 0, i * CELL + CELL, CELL)); a = c.getchannel('A').point(lambda v: 255 if v > 40 else 0)
        bb = a.getbbox()
        if not bb: out['errors'].append(f'칸 {i} 비었음'); continue
        if any(c.getpixel(p)[3] > 20 for p in ((0, 0), (CELL - 1, 0), (0, CELL - 1), (CELL - 1, CELL - 1))): out['errors'].append(f'칸 {i} 귀퉁이 불투명(배경·테두리)')
        if abs(bb[3] - FOOT) > 8: out['errors'].append(f'칸 {i} 발 y={bb[3]} (488±8)')
        cx = (bb[0] + bb[2]) / 2
        if abs(cx - CX) > 48: out['warn'].append(f'칸 {i} 가운데 x={cx:.0f}')
        cells.append({'body': rows_body(a), 'bb': bb, 'a': a, 'rgb': mean_rgb(c)})
    out['n'] = n; out['cells'] = [{'body': c['body'], 'bb': c['bb']} for c in cells]
    return out, cells

def iou(a, b):
    i = ImageChops.multiply(a, b).getbbox(); 
    A = sum(1 for v in a.getdata() if v); B = sum(1 for v in b.getdata() if v); I = sum(1 for v in ImageChops.multiply(a, b).getdata() if v)
    return I / max(1, A + B - I)

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    res = args[0]; lists = args[1:]; refdir = sys.argv[sys.argv.index('--ref') + 1] if '--ref' in sys.argv else None
    if refdir: lists = [l for l in lists if l != refdir]
    items = {}
    for L in lists:
        for it in json.load(open(L, encoding='utf-8'))['items']: items[it['code']] = it
    by = {}
    for f in sorted(os.listdir(res)):
        m = NAME.search(f)
        if m: by.setdefault(m.group(1), []).append((m, os.path.join(res, f)))
    report = {}
    for code, L in by.items():
        it = items.get(code); R = report[code] = {'id': it['id'] if it else None, 'name': it['name'] if it else None, 'sheets': {}, 'pass': False}
        latest = {}
        for m, p in L:
            k = (m.group(2), m.group(3)); 
            if k not in latest or int(m.group(5)) > int(latest[k][0].group(5)): latest[k] = (m, p)
        stand = []; sil = {}
        for (act, d), (m, p) in latest.items():
            o, cells = check(p, int(m.group(4))); key = f'{act}_{d}'; R['sheets'][key] = o; o['path'] = p
            if cells:
                bs = sorted(c['body'] for c in cells); o['vis'] = bs[len(bs) // 2]
                if act in ('idle', 'walk', 'hit'): stand.append((key, o['vis']))
                sil[key] = cells[0]['a']
                rg = [c['rgb'] for c in cells if c['rgb']]; o['rgb'] = [round(sum(x[i] for x in rg) / len(rg), 1) for i in range(3)] if rg else None
        if stand:
            ref = sorted(v for _, v in stand)[len(stand) // 2]; R['vis'] = ref
            for key, o in R['sheets'].items():
                if 'vis' in o and key.split('_')[0] in ('idle', 'walk', 'hit') and abs(o['vis'] / ref - 1) > .05: o['errors'].append(f'몸통 키 {o["vis"]} ≠ 기준 {ref}±5%')
        for d in ('up', 'down'):
            if f'atk_{d}' in sil and 'atk_side' in sil:
                s = sil['atk_side']
                for t in (s, s.transpose(Image.FLIP_LEFT_RIGHT), s.transpose(Image.FLIP_TOP_BOTTOM)):
                    if iou(sil[f'atk_{d}'], t) > .9: R['sheets'][f'atk_{d}']['errors'].append('옆 공격 그림과 거의 같음(돌리기·뒤집기 금지)'); break
        if refdir and it:
            rp = os.path.join(refdir, f'{code}_idle.webp')
            if os.path.exists(rp):
                rr = mean_rgb(Image.open(rp).convert('RGBA'))
                for key, o in R['sheets'].items():
                    if o.get('rgb') and rr:
                        dif = sum(abs(a - b) for a, b in zip(o['rgb'], rr)) / 3; o['rgbDiff'] = round(dif, 1)
                        (o['errors'] if dif > 12 else o['warn'] if dif > 8 else []).append(f'색 차 {dif:.1f}') if dif > 8 else None
        R['pass'] = all(not o['errors'] for o in R['sheets'].values())
    for R in report.values():
        for o in R['sheets'].values(): o.pop('cells', None)
    os.makedirs(os.path.join(ROOT, 'r96', 'qa', 'r1377'), exist_ok=True)
    json.dump(report, open(os.path.join(ROOT, 'r96', 'qa', 'r1377', 'dots-check.json'), 'w'), ensure_ascii=False, indent=1)
    for code, R in report.items():
        print(code, R['id'], R['name'], '통과' if R['pass'] else '다시', {k: (o['errors'] or o['warn'] or 'ok') for k, o in R['sheets'].items()})
    if '--apply' in sys.argv:
        cfgp = os.path.join(ROOT, 'r96', 'qa', 'r1377', 'dir-art.json'); cfg = json.load(open(cfgp, encoding='utf-8'))
        for code, R in report.items():
            it = items.get(code)
            if not it: continue
            M = next((x for x in cfg['mobs'] if x['id'] == it['id']), None)
            if not M: M = {'zone': it['zone'], 'id': it['id'], 'name': it['name']}; cfg['mobs'].append(M)
            M.setdefault('sheets', {})
            for key, o in R['sheets'].items():
                if o['errors']: continue
                rel = f"assets/r1377/{it['id']}/{key}{o['n']}.webp"; dst = os.path.join(ROOT, 'r96', 'client-source', rel)
                os.makedirs(os.path.dirname(dst), exist_ok=True); Image.open(o['path']).convert('RGBA').save(dst, 'WEBP', quality=90, method=6)
                M['sheets'][key] = {'path': rel, 'n': o['n'], 'vis': o.get('vis')}
            if R.get('vis'): M['vis'] = R['vis']
        json.dump(cfg, open(cfgp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); print('dir-art.json 갱신')

if __name__ == '__main__': main()
