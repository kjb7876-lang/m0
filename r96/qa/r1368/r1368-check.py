"""R1368 검사(PIL만, CI): 공실 표기 잔재 시트 assets/r1368/m052.webp
 1) 원래 시트와 같은 격자 1024×960(4×3, 256×320). 2) 12칸 발 줄 294..299(pivot 300 바로 위). 3) 공격 타격 칸(9·10)의 윗몸(할퀴는 팔)이 pivot 에서 오른쪽으로 더 뻗는다(R248 은 그림이 오른쪽을 본다고 가정) — 원래 시트는 왼쪽이라 실패.
 4) 걷기 8칸: 반 박자 칸 다리 영역(몸 아래 40%) 화소 차 ≥ 6(원래 3.7~5.5로 실패). 5) 걷기 키 퍼짐 ≤ 3%, 걷기와 공격 회수 칸 키 차 ≤ 5%.
 6) 걷기·공격 몸 평균 색 차 ≤ 10(같은 그림체 — 원래 걷기는 옛 r92 그림이라 색이 다름).
 사용: python3 r96/qa/r1368/r1368-check.py [시트 경로]"""
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
ROOT = Path(__file__).resolve().parents[3]
P = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'r96/runtime-text/assets/r1368/m052.webp'
fails = []
def check(ok, msg):
    print(('OK   ' if ok else 'FAIL ') + msg)
    if not ok: fails.append(msg)
im = Image.open(P).convert('RGBA')
check(im.size == (1024, 960), f'격자 {im.size}')
cells = [im.crop(((i % 4) * 256, (i // 4) * 320, (i % 4 + 1) * 256, (i // 4 + 1) * 320)) for i in range(12)]
mask = lambda c: c.getchannel('A').point(lambda a: 255 if a > 40 else 0)
bbs = [mask(c).getbbox() for c in cells]
check(all(294 <= b[3] <= 299 for b in bbs), f'발 줄 {sorted(set(b[3] for b in bbs))}')
def reach(c, b):
    """윗몸(몸 상자 위 55%)이 pivot(x=128)에서 오른쪽으로 뻗은 길이 - 왼쪽으로 뻗은 길이(+면 오른쪽을 봄: 할퀴는 팔이 그쪽)"""
    A = mask(c).crop((0, b[1], 256, b[1] + int((b[3] - b[1]) * .55))); bb = A.getbbox()
    return (bb[2] - 128) - (128 - bb[0])
for i in (9, 10):
    r = reach(cells[i], bbs[i])
    check(r > 0, f'공격 칸 {i}: 윗몸이 오른쪽으로 뻗음(오른-왼 {r:+d}px)')
top = min(b[1] for b in bbs[:8]); bot = max(b[3] for b in bbs[:8]); ly = int(top + (bot - top) * .6)
d = [sum(ImageStat.Stat(ImageChops.difference(cells[k].crop((0, ly, 256, 320)), cells[(k + 4) % 8].crop((0, ly, 256, 320)))).mean[:4]) / 4 for k in range(8)]
check(min(d) >= 6, f'걷기 다리 반 박자 차 최소 {min(d):.1f} (≥6)')
hs = [b[3] - b[1] for b in bbs[:8]]
check((max(hs) - min(hs)) / max(hs) <= .03, f'걷기 키 퍼짐 {(max(hs)-min(hs))/max(hs):.3f}')
h11 = bbs[11][3] - bbs[11][1]
check(abs(sorted(hs)[4] - h11) / h11 <= .05, f'걷기 키 {sorted(hs)[4]} ≈ 공격 회수 칸 {h11}')
def mean(c):
    st = ImageStat.Stat(c.convert('RGB'), mask(c)); return st.mean
mw = mean(cells[0]); ma = mean(cells[11])
dc = sum(abs(a - b) for a, b in zip(mw, ma)) / 3
check(dc <= 10, f'걷기·공격 몸 평균 색 차 {dc:.1f} (≤10)')
print('ALL OK' if not fails else f'{len(fails)} FAIL'); sys.exit(1 if fails else 0)
