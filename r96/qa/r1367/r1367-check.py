"""R1367 검사(PIL만, CI): 제7부 중간보스 4종이 걷는 동안 다리가 움직이는 걷기 시트를 쓰는지.
 1) murder-boss-walk-r1367.js 가 R1029 표의 네 열쇠(r104/bosses/<id>-p4.webp|0,0,w,h)를 걷기 시트로 바꾼다.
 2) runtime-text/index.html 에서 이 파일이 move-float-r1029-data.js·move-float-r1224-data.js 뒤, move-dir-r974 가 처음 그리기 전에 실린다.
 3) 시트: 6칸 이상, 칸마다 다리 영역(몸 아래 40%)이 서로 다르다(평균 화소 차 ≥ 4) — 원래 안개 시트는 다리가 같아 실패.
 4) 칸 사이 크기 일관: 보이는 키 퍼짐 ≤ 4%, 발 줄(불투명 아래 끝) 퍼짐 ≤ 2% 칸 높이, 머리 중심 가로 흔들림 ≤ 6%.
 5) 발밑 안개 웅덩이 없음: 몸 아래 8% 줄의 불투명 폭이 p4 원본의 같은 줄 폭의 1.5배 이하.
 6) 시트 몸 크기 = p4 원본 몸 크기 × (시트 칸 / 원본 칸) — 걷기로 바뀌어도 보스가 커지거나 작아지지 않음(±4%).
 (파란불 원본 PNG 는 빌드된 사이트 r96/hospital-three-pc/site 에서 읽는다 — CI 는 검사 전에 build-r96.py 를 돌린다)
 사용: python3 r96/qa/r1367/r1367-check.py"""
import json, re, sys
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
ROOT = Path(__file__).resolve().parents[3]; RT = ROOT / 'r96/runtime-text'; CS = ROOT / 'r96/client-source'
SITE = ROOT / 'r96/hospital-three-pc/site'
# 바꿔야 하는 R1029/R1224 열쇠: 중간보스 4종 회수 자세 + 본보스 파란불 서 있기·돌진 준비(걷는 동안 그려지는 두 그림)
IDS = {'mb-murder01': 'r104/bosses/mb-murder01-p4.webp|0,0,367,418', 'mb-murder02': 'r104/bosses/mb-murder02-p4.webp|0,0,305,412',
       'murder04-mid': 'r104/bosses/murder04-mid-p4.webp|0,0,517,471', 'mb-murder03': 'r104/bosses/mb-murder03-p4.webp|0,0,443,416',
       'blue-executor-idle': 'generated-story10-cycle-20261005/cyclic-murder/blue_executor_idle.png|270,73,768,1134',
       'blue-executor-charge': 'generated-story10-cycle-20261005/cyclic-murder/blue_executor_charge.png|160,26,1054,1210'}
def source(key):
    p, r = key.split('|'); x, y, w, h = map(int, r.split(','))
    f = RT / 'assets' / p
    if not f.exists(): f = SITE / 'assets' / p
    return Image.open(f).convert('RGBA').crop((x, y, x + w, y + h)), w, h
fails = []
def check(ok, msg):
    print(('OK   ' if ok else 'FAIL ') + msg)
    if not ok: fails.append(msg)
src = CS / 'murder-boss-walk-r1367.js'
W = {}
if src.exists():
    m = re.search(r'const W=(\{.*?\});\n', src.read_text(encoding='utf8'), re.S)
    W = json.loads(m.group(1)) if m else {}
check(src.exists() and bool(W), 'murder-boss-walk-r1367.js 표')
html = (RT / 'index.html').read_text(encoding='utf8')
def pos(n):
    i = html.find(f'<script src="./{n}"></script>'); return i
a, b, c = pos('move-float-r1224-data.js'), pos('murder-boss-walk-r1367.js'), pos('move-dir-r974.js')
check(a >= 0 and b > a, 'index.html: R1224 표 뒤에 R1367 태그')
def body(im):
    return im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
def rowwidth(im, y):
    A = im.getchannel('A'); w = im.width; xs = [x for x in range(w) if A.getpixel((x, y)) > 40]
    return (xs[-1] - xs[0]) if xs else 0
for i, key in IDS.items():
    S = W.get(key)
    check(bool(S) and S.get('kind') == 'gait', f'{i}: R1029 열쇠가 걷기 시트(kind gait)')
    if not S: continue
    sheet = Image.open(RT / S['path']).convert('RGBA'); n, cw, ch = S['n'], S['cw'], S['ch']
    check(n >= 6 and sheet.size == (cw * n, ch), f'{i}: {n}칸 {cw}x{ch}')
    cells = [sheet.crop((k * cw, 0, (k + 1) * cw, ch)) for k in range(n)]
    bbs = [body(c) for c in cells]
    hs = [bb[3] - bb[1] for bb in bbs]; feet = [bb[3] for bb in bbs]
    top = min(bb[1] for bb in bbs); bot = max(feet); legY = int(top + (bot - top) * .6)
    diffs = []
    for k in range(n):
        x = ImageChops.difference(cells[k].crop((0, legY, cw, ch)), cells[(k + n // 2) % n].crop((0, legY, cw, ch)))
        diffs.append(sum(ImageStat.Stat(x).mean[:4]) / 4)
    check(min(diffs) >= 4, f'{i}: 다리 영역 반 박자 칸 차 최소 {min(diffs):.1f} (≥4)')
    hm = sorted(hs)[n // 2]
    check((max(hs) - min(hs)) / hm <= .04, f'{i}: 보이는 키 퍼짐 {(max(hs)-min(hs))/hm:.3f} (≤.04)')
    check((max(feet) - min(feet)) / ch <= .02, f'{i}: 발 줄 퍼짐 {(max(feet)-min(feet))/ch:.3f} (≤.02)')
    heads = []
    for c, bb in zip(cells, bbs):
        hb = body(c.crop((0, bb[1], cw, bb[1] + int((bb[3] - bb[1]) * .2))))
        heads.append((hb[0] + hb[2]) / 2 if hb else 0)
    check((max(heads) - min(heads)) / (bbs[0][2] - bbs[0][0]) <= .06, f'{i}: 윗몸 가로 흔들림 {(max(heads)-min(heads))/(bbs[0][2]-bbs[0][0]):.3f} (≤.06)')
    p4, w, h = source(key); pb = body(p4)
    sc = (cw / (w * (1 + S['pad'][0] + S['pad'][2])))  # 시트 칸 픽셀 / 원본 픽셀
    want = (pb[3] - pb[1]) * sc
    check(abs(hm - want) / want <= .04, f'{i}: 몸 키 {hm} ≈ 원본×배율 {want:.1f}')
    py = pb[1] + int((pb[3] - pb[1]) * .96); sy = [bb[1] + int((bb[3] - bb[1]) * .96) for bb in bbs]
    base = rowwidth(p4, py) * sc
    worst = max(rowwidth(c, y) for c, y in zip(cells, sy))
    check(worst <= max(8, base * 1.5), f'{i}: 발밑 줄 폭 {worst} ≤ 원본 {base:.0f}×1.5 (안개 웅덩이 없음)')
print('ALL OK' if not fails else f'{len(fails)} FAIL'); sys.exit(1 if fails else 0)
