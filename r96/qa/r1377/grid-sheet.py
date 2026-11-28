#!/usr/bin/env python3
"""dir-grid.mjs 결과(<접두어>.json + .d/NN.png)를 QA 용 격자 그림과 표로 묶는다(PIL 만).
사용: python3 grid-sheet.py <접두어> <출력.jpg>  → 표는 <출력>.md"""
import json, sys, os
from PIL import Image, ImageDraw, ImageFont
import glob as _g
_FF = (_g.glob('/usr/share/fonts/truetype/wqy/*.tt[fc]') + _g.glob('/usr/share/fonts/opentype/unifont/unifont.otf'))
FONT = ImageFont.truetype(_FF[0], 13) if _FF else None
pre, out = sys.argv[1], sys.argv[2]; d = json.load(open(pre + '.json')); C = d['cells']
COLS = ['up', 'down', 'left', 'right']; ROWS = []
for c in C:
    k = (c['mode'], c['el'])
    if k not in ROWS: ROWS.append(k)
T = 200; W = Image.new('RGB', (90 + T * 4, 24 + T * len(ROWS)), (24, 24, 28)); dr = ImageDraw.Draw(W); _t = dr.text; dr.text = lambda xy, t, fill=None: _t(xy, t, fill=fill, font=FONT)
for j, col in enumerate(COLS): dr.text((90 + j * T + 6, 6), '영웅 ' + {'up': '위', 'down': '아래', 'left': '왼', 'right': '오른'}[col], fill=(255, 255, 160))
RT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'runtime-text'); _bb = {}
def vis(c):
    """그린 사각형 안 실제 몸(알파>24) 키·폭·발 줄 — 칸마다 투명 여백이 달라 사각형 키로는 비교가 안 된다."""
    sp = (c.get('src') or '').split(':'); src = sp[0]; R = c.get('rect') or []
    # 몸 명령 src 꼬리 'x,y,w,h' 가 실제로 자른 칸(rect 필드는 렌더러 칸이라 다를 수 있다)
    if len(sp) > 1 and sp[1].count(',') == 3: R = [float(v) for v in sp[1].split(',')]
    if not src or len(R) < 4 or not c.get('drawH'): return None
    k = (src, tuple(R))
    if k not in _bb:
        try:
            im = Image.open(os.path.join(RT, src)).convert('RGBA').crop(tuple(int(round(v)) for v in (R[0], R[1], R[0] + R[2], R[1] + R[3])))
            _bb[k] = im.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
        except Exception: _bb[k] = None
    b = _bb[k]
    if not b: return None
    H, Wd = c['drawH'], c['drawW']; sy, sx = H / R[3], Wd / R[2]
    return {'h': (b[3] - b[1]) * sy, 'w': (b[2] - b[0]) * sx, 'foot': c['footFromGround'] - (R[3] - b[3]) * sy}
V = [vis(c) for c in C]
iv = [v for c, v in zip(C, V) if v and c['mode'] == 'idle']
bh = sorted(v['h'] for v in iv)[len(iv) // 2] if iv else 1; bw = sorted(v['w'] for v in iv)[len(iv) // 2] if iv else 1
rows = []
for i, c in enumerate(C):
    r = ROWS.index((c['mode'], c['el'])); j = COLS.index(c['dir'])
    f = f"{pre}.d/{i:02d}.png"
    if os.path.exists(f):
        im = Image.open(f).convert('RGB'); im = im.resize((T, T)); W.paste(im, (90 + j * T, 24 + r * T))
    sheet = (c.get('src') or '').split('/')[-1].split(':')[0]; sp = (c.get('src') or '').split(':'); cell = sp[1].split(',')[0] if len(sp) > 1 else ''
    lab = f"{sheet.replace('.webp','')} #{int(cell)//max(1,int(sp[1].split(',')[2]) if len(sp)>1 and sp[1].count(',')==3 else 512) if cell.isdigit() else '-'}{' 뒤집' if c.get('mir') else ''}"
    dr.rectangle([90 + j * T, 24 + r * T + T - 16, 90 + j * T + T, 24 + r * T + T], fill=(0, 0, 0)); dr.text((90 + j * T + 3, 24 + r * T + T - 15), lab, fill=(200, 255, 200))
    v = V[i] or {}; rows.append((c['mode'], c['el'], c['dir'], sheet, lab.split('#')[1].split(' ')[0] if '#' in lab else '', 'O' if c.get('mir') else '', round(100 * v['h'] / bh, 1) if v else '-', round(100 * v['w'] / bw, 1) if v else '-', round(v['foot'], 1) if v else '-'))
for r, (m, el) in enumerate(ROWS): dr.text((6, 24 + r * T + T // 2), {'idle': '대기', 'walk': '걷기', 'atk': '공격', 'hit': '피격'}[m] + (f' {el}' if el else ''), fill=(255, 255, 255))
W.save(out, quality=88)
with open(out.rsplit('.', 1)[0] + '.md', 'w') as f:
    f.write(f"# {d['id']} @ {d['zone']} 방향 격자 표(헤드리스)\n\n몸 키·폭 = 그린 칸 안 실제 몸(알파) 크기, 대기 칸 중앙값 대비 %. 발 y = 몸 아래 끝 − 몹 바닥점(px, +면 아래). 뒤집힘 O = 좌우 거울.\n공격·몸짓 칸은 팔·무기가 뻗어 폭이 커지는 게 정상이다.\n\n| 상태 | 영웅 쪽 | 시트 | 칸 | 뒤집힘 | 몸 키 % | 몸 폭 % | 발 y |\n|---|---|---|---|---|---|---|---|\n")
    for m, el, di, sh, ce, mi, h, w, ft in rows: f.write(f"| {m}{' '+str(el) if el else ''} | {di} | {sh} | {ce} | {mi} | {h} | {w} | {ft} |\n")
print('ok', out)
