#!/usr/bin/env python3
"""R1170: Dots CX-0159MM r1 ROUGH — 기억 지역(u204·u206)·u201·ep1b08 기계 몹 피격 4칸·사망 6칸 → R1156 피격 표·R1065 사망 표용 webp.
사용자 11-18 22:06Z "부족한거 닷츠랑계속협업"(Dots 지시서 v7 CX-0159MM).
 · 피격 1~3칸 몸 키가 원본 0칸과 8% 넘게 다르면(Dots ROUGH 메모: #5·#6·#8 2칸이 작음) 발 가운데 기준으로 원본 키에 맞춰 키운다.
 · 기억 검열기(u204-mech-04) 피격은 R1163 보스 대기·피격(R620, 같은 그림 경로)이 이미 맡아 빼고 사망만 붙인다. 설원 잠복 보행기는 Dots 가 HOLD(사망은 기존 MD-28).
 · Dots 시트는 살아 있는 칸과 같은 크기·발 줄(피벗)로 왔다. 알파 16 이하 0, 사망 마지막 칸은 알파 0.5배.
 · 피격 4칸째는 Dots 가 원본 0칸 그대로 넣었다. 1~3칸 색 평균을 원본 0칸에 맞춤(채널 이득 0.85~1.18).
 · 사망 anchor·bodyH 는 R1165 방식(첫 칸 발 줄·몸 가운데 + 살아 있을 때 피벗 차이, 살아 있을 때 키 × 몸 높이 비).
 · 원본은 두고 파생본만 r96/runtime-text/assets/r1170/. 있는 raw 만 처리(나머지는 다음 회차).
usage: python3 scripts/r1170-mech-sheets.py <raw 폴더(<mob>_hit4.png, <mob>_death6.png)>"""
import sys, json, hashlib
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]; RT = ROOT / 'r96/runtime-text'; OUT = RT / 'assets/r1170'
# 키, 사망 id, r380 id(=frameFor r208Mob), 살아 있는 그림, 칸, 피벗, 보이는 키(r380 index)
MOBS = [('mech01', 'MM-01', 'u204-mech-01-v1', 'r380/mobs/u204-mech-01-v1.webp', (256, 256), (133.75, 220.0)),
        ('mech02', 'MM-02', 'u204-mech-02-v1', 'r380/mobs/u204-mech-02-v1.webp', (256, 256), (132.25, 213.0)),
        ('mech03', 'MM-03', 'u204-mech-03-v1', 'r380/mobs/u204-mech-03-v1.webp', (256, 256), (131.0, 203.5)),
        ('mech04', 'MM-04', None, 'r380/mobs/u204-mech-04-v1.webp', (256, 256), (139.75, 224.5)),
        ('u206a', 'MM-05', 'u206-mech-01-v1', 'r380/mobs/u206-mech-01-v1.webp', (256, 320), (126.0, 291)),
        ('u206b', 'MM-06', 'u206-mech-02-v1', 'r380/mobs/u206-mech-02-v1.webp', (256, 320), (158.5, 292)),
        ('hound', 'MM-07', 'war-machine-hound-v1', 'r380/mobs/war-machine-hound-v1.webp', (256, 320), (129.5, 301)),
        ('knight', 'MM-08', 'electrode-machine-knight-v1', 'r380/mobs/electrode-machine-knight-v1.webp', (256, 256), (142.25, 240.5))]
DEHAZE = {}
HALO = {'u206b': (0, 1, 2)}  # 공명술사 사망 1~3칸 둘레 흰 번짐: 반투명(알파<220)·밝고 채도 낮은 화소만 지움(불투명한 은빛 몸은 그대로)
VH = {m['id']: m.get('visibleHeight') for m in json.loads((RT / 'assets/r380/mobs/index.json').read_text())['mobs']}
def bb(im): return im.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
def mean(im):
    px = [p for p in im.getdata() if p[3] > 200]; n = max(1, len(px)); return [sum(p[i] for p in px) / n for i in range(3)]
def clean(im, last=None):
    a = im.getchannel('A').point(lambda v: 0 if v <= 16 else v)
    if last:
        x, w = last; c = a.crop((x, 0, x + w, a.size[1])).point(lambda v: 0 if v * .5 <= 16 else int(v * .5)); a.paste(c, (x, 0))
    im.putalpha(a); return im
def dehaze(im, W, cells=(3, 4)):
    # 사망 4·5칸에 생성 배경(밝은 회색 판)이 남은 시트: 밝고 채도 낮은 화소의 알파를 밝기에 따라 줄인다(어두운 연기는 그대로).
    out = im.copy(); px = out.load(); w, h = out.size; n = 0
    for i in [c for c in cells if c >= 3]:  # 밝기 따라 엷게 하기는 연기 칸만(몸 칸의 은빛 부분 보존)
        for y in range(h):
            for x in range(i * W, (i + 1) * W):
                r, g, b, a = px[x, y]
                if a and min(r, g, b) > 150 and max(r, g, b) - min(r, g, b) < 28:
                    L = (r + g + b) / 3; k = max(0.0, min(1.0, (235 - L) / 85)); na = int(a * k)
                    if na != a: px[x, y] = (r, g, b, na); n += 1
    # 칸 테두리에서 이어진 밝은 회색 판(남은 배경)은 물들이기로 비운다.
    from collections import deque
    for i in cells:
        x0 = i * W; seen = set(); q = deque()
        for x in range(x0, x0 + W): q.append((x, 0)); q.append((x, h - 1))
        for y in range(h): q.append((x0, y)); q.append((x0 + W - 1, y))
        while q:
            x, y = q.popleft()
            if (x, y) in seen or not (x0 <= x < x0 + W and 0 <= y < h): continue
            seen.add((x, y)); r, g, b, a = px[x, y]
            if a == 0 or (min(r, g, b) > 120 and max(r, g, b) - min(r, g, b) < 28):
                if a: px[x, y] = (r, g, b, 0); n += 1
                q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return out, n
def save(im, p):
    im.save(p, lossless=True, method=6); return p.read_bytes()
def sha(b): return hashlib.sha256(b).hexdigest()
def main(raw):
    raw = Path(raw); OUT.mkdir(parents=True, exist_ok=True); hit, death, rec = {}, {}, []
    for k, did, rid, live, (W, H), (px, py) in MOBS:
        L = Image.open(RT / 'assets' / live).convert('RGBA').crop((0, 0, W, H)); lb = bb(L); lm = mean(L)
        f = raw / f'{k}_hit4.png'
        if rid and f.exists():
            im = Image.open(f).convert('RGBA'); assert im.size == (W * 4, H), (k, im.size); scaled = []
            for i in range(3):
                c = im.crop((i * W, 0, (i + 1) * W, H)); g = [min(1.18, max(.85, lm[j] / max(1, v))) for j, v in enumerate(mean(c))]
                r, gg, b, a = c.split(); c = Image.merge('RGBA', (r.point(lambda v, s=g[0]: min(255, int(v * s))), gg.point(lambda v, s=g[1]: min(255, int(v * s))), b.point(lambda v, s=g[2]: min(255, int(v * s))), a))
                cb = bb(c); lh = lb[3] - lb[1]; ch = cb[3] - cb[1]
                if abs(ch - lh) / lh > .08:  # 몸 키 맞춤(발 가운데 고정)
                    sc = lh / ch; body = c.crop(cb); nw, nh = max(1, round(body.size[0] * sc)), max(1, round(body.size[1] * sc)); body = body.resize((nw, nh), Image.LANCZOS)
                    fx = (cb[0] + cb[2]) / 2; c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); c.alpha_composite(body, (int(round(fx - nw / 2)), cb[3] - nh)); scaled.append([i, round(sc, 3)])
                im.paste(c, (i * W, 0))
            p = OUT / f'mm-{k}-hit4.webp'; by = save(clean(im), p)
            hit[rid] = {'path': 'assets/r1170/' + p.name, 'cell': [W, H], 'own': 'assets/' + live}
            rec.append({'file': 'assets/r1170/' + p.name, 'source': f'Dots CX-0159MM {k} hit4 r1 ROUGH', 'sourceSha256': sha(f.read_bytes()), 'sha256': sha(by), 'bytes': len(by), 'use': '피격 4칸(R1156 표)', 'heightFix': scaled, 'finalArt': False})
        f = raw / f'{k}_death6.png'
        if f.exists():
            im = Image.open(f).convert('RGBA'); assert im.size == (W * 6, H), (k, im.size)
            im, nh = dehaze(im, W, DEHAZE.get(k, (3, 4)))
            pa = im.load()
            for i in HALO.get(k, ()):
                for y in range(H):
                    for x in range(i * W, (i + 1) * W):
                        r, g, b, a = pa[x, y]
                        if 0 < a < 220 and min(r, g, b) > 140 and max(r, g, b) - min(r, g, b) < 30: pa[x, y] = (r, g, b, 0); nh += 1
            p = OUT / f'mm-{k}-death6.webp'; by = save(clean(im, (5 * W, W)), p)
            f0 = Image.open(p).convert('RGBA').crop((0, 0, W, H)); db = bb(f0); sh, dh = lb[3] - lb[1], db[3] - db[1]; r = dh / sh
            vh = VH.get(rid or Path(live).stem, sh)  # 살아 있을 때 보이는 키(r380 index visibleHeight)
            ax = round((db[0] + db[2]) / 2 + (px - (lb[0] + lb[2]) / 2) * r, 1); ay = db[3]
            death[did] = {'path': 'assets/r1170/' + p.name, 'cell': [W, H], 'cells': 6, 'anchor': [ax, ay], 'bodyH': round(vh * dh / sh), 'kind': 'death', 'liveH': sh, 'liveRed': 0,
                          'bases': {live: {'bodyH': round(vh, 2), 'bottom': lb[3], 'footX': px}}}
            rec.append({'file': 'assets/r1170/' + p.name, 'source': f'Dots CX-0159MM {k} death6 r1 ROUGH', 'sourceSha256': sha(f.read_bytes()), 'sha256': sha(by), 'bytes': len(by), 'use': '사망 6칸(R1065 사망 표)', 'dehazedPx': nh, 'finalArt': False})
    (OUT / 'index.json').write_text(json.dumps({'schema': 'storyworld.r1170.dots/v1', 'request': 'CX-0159MM r1 ROUGH', 'assets': rec}, ensure_ascii=False, indent=1) + '\n', encoding='utf8')
    print('HIT', json.dumps(hit, ensure_ascii=False, separators=(',', ':'))); print('DEATH', json.dumps(death, ensure_ascii=False, separators=(',', ':')))
if __name__ == '__main__': main(sys.argv[1])
