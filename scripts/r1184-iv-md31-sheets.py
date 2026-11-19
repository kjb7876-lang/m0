#!/usr/bin/env python3
"""R1184: Dots CX-0162IV r1 ROUGH(S-06 외계 침공군 m077 피격 4칸·사망 6칸) + CX-0115MD r1 ROUGH MD-31(악몽 정찰체 사망 6칸).
사용자 11-18 22:06Z "부족한거 닷츠랑계속협업". R1169 방식: 피격 1~3칸 색을 원본 0칸에 맞춤(이득 0.85~1.18), 4칸 = 원본 0칸, 알파 16 이하 0,
사망 마지막 칸 알파 0.5배, 사망 anchor·bodyH 는 R1165 방식. 원본은 두고 파생본만 r96/runtime-text/assets/r1184/.
usage: python3 scripts/r1184-iv-md31-sheets.py <m077 raw 폴더> <md31 raw 폴더>"""
import sys, json, hashlib
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]; RT = ROOT / 'r96/runtime-text'; OUT = RT / 'assets/r1184'
def bb(im): return im.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
def mean(im):
    px = [p for p in im.getdata() if p[3] > 200]; n = max(1, len(px)); return [sum(p[i] for p in px) / n for i in range(3)]
def clean(im, last=None):
    a = im.getchannel('A').point(lambda v: 0 if v <= 16 else v)
    if last:
        x, w = last; c = a.crop((x, 0, x + w, a.size[1])).point(lambda v: 0 if v * .5 <= 16 else int(v * .5)); a.paste(c, (x, 0))
    im.putalpha(a); return im
def save(im, p): im.save(p, lossless=True, method=6); return p.read_bytes()
def sha(b): return hashlib.sha256(b).hexdigest()
def death(f, live, W, H, pivot, vh, did, name, src):
    L = Image.open(RT / 'assets' / live).convert('RGBA').crop((0, 0, W, H)); lb = bb(L)
    im = Image.open(f).convert('RGBA'); assert im.size == (W * 6, H), (f, im.size)
    p = OUT / name; by = save(clean(im, (5 * W, W)), p)
    f0 = Image.open(p).convert('RGBA').crop((0, 0, W, H)); db = bb(f0); sh, dh = lb[3] - lb[1], db[3] - db[1]; r = dh / sh
    ax = round((db[0] + db[2]) / 2 + (pivot[0] - (lb[0] + lb[2]) / 2) * r, 1); ay = db[3]
    ent = {'path': 'assets/r1184/' + name, 'cell': [W, H], 'cells': 6, 'anchor': [ax, ay], 'bodyH': round(vh * dh / sh), 'kind': 'death', 'liveH': sh, 'liveRed': 0,
           'bases': {live: {'bodyH': round(vh, 2), 'bottom': lb[3], 'footX': pivot[0]}}}
    return ent, {'file': 'assets/r1184/' + name, 'source': src, 'sourceSha256': sha(f.read_bytes()), 'sha256': sha(by), 'bytes': len(by), 'use': f'사망 6칸(R1065 사망 표 {did})', 'finalArt': False}
def main(iv, md):
    iv, md = Path(iv), Path(md); OUT.mkdir(parents=True, exist_ok=True); rec = []; out = {}
    # m077: R1179 칠한 시트(칸 256×320, 4×3, 0칸 = 걷기 0), 발 (128,300), 몸 211
    live = 'r1179/mobs/m077.webp'; W, H = 256, 320
    L = Image.open(RT / 'assets' / live).convert('RGBA').crop((0, 0, W, H)); lm = mean(L)
    f = iv / 'm077_hit4.png'; im = Image.open(f).convert('RGBA'); assert im.size == (W * 4, H)
    gains = []
    for i in range(3):
        c = im.crop((i * W, 0, (i + 1) * W, H)); g = [min(1.18, max(.85, lm[j] / max(1, v))) for j, v in enumerate(mean(c))]; gains.append([round(x, 3) for x in g])
        r, gg, b, a = c.split(); c = Image.merge('RGBA', (r.point(lambda v, s=g[0]: min(255, int(v * s))), gg.point(lambda v, s=g[1]: min(255, int(v * s))), b.point(lambda v, s=g[2]: min(255, int(v * s))), a))
        im.paste(c, (i * W, 0))
    blank = Image.new('RGBA', (W, H)); im.paste(blank, (3 * W, 0)); im.paste(L, (3 * W, 0))  # 4칸 = 원래 그림 0칸(서기 자세 복귀)
    p = OUT / 'iv-m077-hit4.webp'; by = save(clean(im), p)
    out['hit'] = {'m077': {'path': 'assets/r1184/' + p.name, 'cell': [W, H], 'own': 'assets/' + live}}
    rec.append({'file': 'assets/r1184/' + p.name, 'source': 'Dots CX-0162IV m077 hit4 r1 ROUGH', 'sourceSha256': sha(f.read_bytes()), 'sha256': sha(by), 'bytes': len(by), 'use': '피격 4칸(R1156 표, R248 직접 그리기)', 'gains': gains, 'finalArt': False})
    e, r_ = death(iv / 'm077_death6.png', live, W, H, (128, 300), 211, 'IV-01', 'iv-m077-death6.webp', 'Dots CX-0162IV m077 death6 r1 ROUGH'); rec.append(r_); out['IV-01'] = e
    e, r_ = death(md / 'md31_death6.png', 'r380/mobs/hando-timeless-silver-scout-walk-d1.webp', 320, 320, (159.62, 303.92), 283.25, 'MD-31', 'md-31-timeless-silver-scout-death6.webp', 'Dots CX-0115MD r1 MD-31 death6 ROUGH'); rec.append(r_); out['MD-31'] = e
    (OUT / 'index.json').write_text(json.dumps({'schema': 'storyworld.r1184.dots/v1', 'request': 'CX-0162IV r1 ROUGH + CX-0115MD MD-31 r1 ROUGH', 'assets': rec}, ensure_ascii=False, indent=1) + '\n', encoding='utf8')
    print(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
if __name__ == '__main__': main(sys.argv[1], sys.argv[2])
