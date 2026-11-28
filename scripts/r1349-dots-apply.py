#!/usr/bin/env python3
"""R1349 Dots SW-2D-R1349 시트 → 게임 시트(assets/r1349/dots). 입력: Dots 결과 PNG 폴더(인자). 규격: r96/qa/r1349/dots-spec.json.
 - 가로 한 줄 원화를 칸 그대로 잘라 cols 열 격자로 다시 놓는다(모바일 텍스처 4096 안).
 - mirror: 원본이 왼쪽을 보는 몹(코어 오염체)은 칸마다 좌우를 한 번 뒤집어 원본 쪽과 맞춘다(발 x 는 칸 가운데 기준 대칭).
 - dy: 발 아래끝을 원본 대기 칸에 맞추려 칸 안에서 아래로 옮기는 픽셀(EGO 구속 연결자 6).
 match: 몸 평균 색이 원본 모든 칸 중앙값과 8 넘게 다르면 시트 전체에 같은 RGB 차를 더해 맞춘다(칸끼리 명암 관계는 그대로).
 결과 해시는 r96/qa/r1349/dots-sheets.json 에 남긴다."""
import json, os, sys, hashlib
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RT = os.path.join(ROOT, 'r96', 'runtime-text')
spec = json.load(open(os.path.join(ROOT, 'r96', 'qa', 'r1349', 'dots-spec.json')))
src_dir = sys.argv[1]
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
rows = []
import statistics as stt
def body_mean(c):
    px = [p for p in c.getdata() if p[3] > 40]
    return tuple(sum(p[i] for p in px) / len(px) for i in range(3))
def orig_color(S):
    for b in (RT, os.path.join(ROOT, 'r96', 'hospital-three-pc', 'site')):
        q = os.path.join(b, S['orig'])
        if os.path.exists(q): break
    oi = Image.open(q).convert('RGBA'); ocw, och = S['origCell']; cols = S['origCols']
    n = (oi.size[0] // ocw) * (oi.size[1] // och)
    ms = [body_mean(oi.crop(((i % cols) * ocw, (i // cols) * och, (i % cols) * ocw + ocw, (i // cols) * och + och))) for i in range(n)]
    ms = [m for m in ms if m]
    return tuple(stt.median(m[k] for m in ms) for k in range(3))
for S in spec['sheets']:
    sp = os.path.join(src_dir, S['src']); im = Image.open(sp).convert('RGBA')
    cw, ch = S['cell']; n, cols = S['n'], S['cols']
    assert im.size == (cw * n, ch), (S['id'], im.size)
    out = Image.new('RGBA', (cw * cols, ch * ((n + cols - 1) // cols)), (0, 0, 0, 0))
    if S.get('match'):
        rc = orig_color(S); cm = [body_mean(im.crop((i * cw, 0, i * cw + cw, ch))) for i in range(n)]
        off = [round(rc[k] - stt.median(m[k] for m in cm)) for k in range(3)]
        r, g, b, a = im.split()
        r, g, b = [ch_.point(lambda v, o=off[k]: max(0, min(255, v + o))) for k, ch_ in enumerate((r, g, b))]
        im = Image.merge('RGBA', (r, g, b, a)); print(' color offset', S['id'], off)
    for i in range(n):
        c = im.crop((i * cw, 0, i * cw + cw, ch))
        if S.get('mirror'): c = c.transpose(Image.FLIP_LEFT_RIGHT)
        dy = S.get('dy', 0)
        if dy: c2 = Image.new('RGBA', c.size, (0, 0, 0, 0)); c2.alpha_composite(c.crop((0, 0, cw, ch - dy)), (0, dy)); c = c2
        out.alpha_composite(c, ((i % cols) * cw, (i // cols) * ch))
    op = os.path.join(RT, S['out']); os.makedirs(os.path.dirname(op), exist_ok=True)
    out.save(op, 'WEBP', quality=92, alpha_quality=100, method=6)
    rows.append({'id': S['id'], 'src': S['src'], 'srcSha256': sha(sp), 'out': S['out'], 'size': list(out.size), 'bytes': os.path.getsize(op), 'sha256': sha(op)})
    print(S['id'], out.size, os.path.getsize(op))
json.dump({'revision': spec['revision'], 'sheets': rows}, open(os.path.join(ROOT, 'r96', 'qa', 'r1349', 'dots-sheets.json'), 'w'), ensure_ascii=False, indent=1)
