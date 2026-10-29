#!/usr/bin/env python3
"""R119: Drive 2026-10-29 '교만의 사이보그 교주'(c104-boss) 아래쪽 키포즈 4장(cult-leader-downward-keyposes-v17.png, 2x2)을
R104 보스 키포즈 형식(준비·타격·마무리·회복)으로 잘라 assets/r104/bosses/c104-boss-p1..p4.webp 와 데이터 줄을 만든다.
시트 순서: ①서 있음 ②팔·칼날을 들어올림 ③몸을 낮춰 내려찍기 ④일어나며 마무리 -> p1=② p2=③ p3=④ p4=①.
네 칸을 발밑 한 선·몸 중심 한 열로 맞추고 같은 캔버스로 자른다. 원본은 그대로 둔다.
Usage: python -I scripts/r119-boss-keyposes.py <sheet.png> r96/runtime-text"""
import sys, json, numpy as np
from PIL import Image
src, rt = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32); H, W = im.shape[:2]
cells = [im[y * H // 2:(y + 1) * H // 2, x * W // 2:(x + 1) * W // 2] for y in (0, 1) for x in (0, 1)]
order = [1, 2, 3, 0]
def bbox(a): ys, xs = np.nonzero(a > 16); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
bs = [bbox(c[..., 3]) for c in cells]; cx = []
for c, b in zip(cells, bs):
    x0, y0, x1, y1 = b; h = y1 - y0; band = c[y1 - int(h * .3):y1, x0:x1, 3]; cx.append(float(np.nonzero(band > 60)[1].mean() + x0))
ch, cw = H // 2, W // 2; F = ch + 10; CH, CW = ch * 2 + 20, cw * 2; mid = cw; canv = []
for c, b, x in zip(cells, bs, cx):
    C = np.zeros((CH, CW, 4), np.float32); dy = F - b[3]; dx = int(round(mid - x)); C[dy:dy + c.shape[0], dx:dx + c.shape[1]] = c; canv.append(C)
U = [bbox(C[..., 3]) for C in canv]; ux0 = min(u[0] for u in U) - 4; uy0 = min(u[1] for u in U) - 4; ux1 = max(u[2] for u in U) + 4; uy1 = max(u[3] for u in U) + 4
frames = []
for k, i in enumerate(order):
    crop = canv[i][uy0:uy1, ux0:ux1].clip(0, 255).astype(np.uint8); p = f'{rt}/assets/r104/bosses/c104-boss-p{k + 1}.webp'
    Image.fromarray(crop, 'RGBA').save(p, 'WEBP', quality=90, alpha_quality=100, method=6)
    frames.append({'path': f'assets/r104/bosses/c104-boss-p{k + 1}.webp', 'w': int(ux1 - ux0), 'h': int(uy1 - uy0), 'label': ['anticipation', 'strike-down (toward screen bottom)', 'follow-through', 'recovery'][k]})
vis = int(round(float(np.median([U[0][3] - U[0][1], U[3][3] - U[3][1]]))))
row = {'set': 'pride-cult-leader', 'name': '교만의 사이보그 교주 (Drive v17 downward)', 'batch': 'drive-2026-10-29-cult-leader-v17', 'pivot': [int(round(mid - ux0)), int(F - uy0)], 'visibleHeight': vis, 'frames': frames}
p = f'{rt}/../client-source/bosses-r104-data.js'; t = open(p, encoding='utf-8').read()
key = 'window.__STORYWORLD_BOSS_KEYPOSES_R104_DATA__=Object.freeze('; i = t.index(key) + len(key); j = t.rindex(');')
data = json.loads(t[i:j]); data['c104-boss'] = row
open(p, 'w', encoding='utf-8', newline='\n').write(t[:i] + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + t[j:])
print(json.dumps(row, ensure_ascii=False)[:400])
