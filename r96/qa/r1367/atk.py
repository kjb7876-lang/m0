"""R1368 공격 방향 분석: walkprobe PATH_DIR=atkL/atkR 결과에서 공실 표기 잔재 우두머리가 공격 칸(시트 3줄)을 그릴 때
 화면에서 윗몸(할퀴는 팔)이 영웅 쪽으로 뻗는지 센다. 그림 칸의 '원본이 보는 쪽'은 r1368-check 와 같은 윗몸 뻗음으로 재고,
 그린 사각형이 뒤집혔으면(P[1].x < P[0].x) 반대로 본다.  사용: python3 atk.py <atk.json> <사이트 루트> <L|R>"""
import json, re, sys
from functools import lru_cache
from PIL import Image
D = json.load(open(sys.argv[1])); ROOT = sys.argv[2].rstrip('/') + '/'; WANT = sys.argv[3]
@lru_cache(None)
def face(path, rect):
    im = Image.open(ROOT + path).convert('RGBA'); x, y, w, h = rect
    c = im.crop((x, y, x + w, y + h)); A = c.getchannel('A').point(lambda a: 255 if a > 40 else 0); b = A.getbbox()
    u = A.crop((0, b[1], w, b[1] + int((b[3] - b[1]) * .55))).getbbox()
    return 'R' if (u[2] - w / 2) - (w / 2 - u[0]) > 0 else 'L'
tot = good = 0; rows = {}
for z, L in D.items():
    for id, o in L.items():
        if not id.startswith('murder04-e1'): continue
        for s in o['samples']:
            m = re.match(r'(assets/[^:|]+\.webp):([\d.]+),([\d.]+),([\d.]+),([\d.]+)', s['src'])
            if not m: continue
            path = m.group(1); r = tuple(int(float(v)) for v in m.groups()[1:])
            if r[1] < 640: continue  # 공격 줄만
            P = s['P']; mir = P[1][0] < P[0][0]; f = face(path, r)
            drawn = ('L' if f == 'R' else 'R') if mir else f
            tot += 1; good += drawn == WANT; k = path.split('/')[-2] + ' ' + str(r[0]); rows[k] = rows.get(k, '') + drawn
print(f'{sys.argv[1]}: 영웅 쪽({WANT}) 공격 칸 {good}/{tot}')
for k, v in rows.items(): print('  ', k, v[:60])
