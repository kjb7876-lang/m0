#!/usr/bin/env python3
"""R106: Drive 2026-10-27 reverse bundles (R05/R06/R07/R08/R13/R14) -> game webp copies.
Originals stay untouched in the Drive ZIPs; this only trims transparent margins and scales down.
Usage: python3 -I scripts/r106-drive-assets.py <unzipped-root> r96/runtime-text/assets/r106/drive
"""
import sys, json, hashlib
from pathlib import Path
from PIL import Image
src, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
rows = []
def save(im, name, maxh, source, use):
    im = im.copy()
    if im.height > maxh: im = im.resize((round(im.width * maxh / im.height), maxh), Image.LANCZOS)
    p = out / name; im.save(p, 'WEBP', quality=90, method=6, exact=False)
    rows.append({'file': 'assets/r106/drive/' + name, 'w': im.width, 'h': im.height, 'bytes': p.stat().st_size, 'sha256': sha(p), 'source': source, 'sourceSha256': sha(src / source), 'use': use})
def trimmed(path, box=None):
    im = Image.open(src / path).convert('RGBA')
    if box: im = im.crop(box)
    bb = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox(); return im.crop(bb)
# R05: two key states in fixed 887px cells; state 2 drawn 34px right as the bundle proposes, union box keeps registration
hp = 'R05-judgment-hammer/judgment-hammer/reverse-r05-judgment-hammer-two-key-states.png'
im = Image.open(src / hp).convert('RGBA'); a = im.crop((0, 0, 887, 887)); b = Image.new('RGBA', (887, 887)); b.alpha_composite(im.crop((887, 0, 1774, 887)), (34, 0))
u = [min(x, y) if i < 2 else max(x, y) for i, (x, y) in enumerate(zip(a.getchannel('A').getbbox(), b.getchannel('A').getbbox()))]
save(a.crop(u), 'hammer-1.webp', 420, hp, 'R-05 재판관의 망치 · 저울판 온전 (보스 대기·체력 절반 위)')
save(b.crop(u), 'hammer-2.webp', 420, hp, 'R-05 재판관의 망치 · 저울판 일부 깨짐 (보스 체력 절반 이하·격파)')
for path, name, maxh, use in [
    ('R06-paper-king/paper-king/storyworld-reverse-r06-paper-king-idle-v1.png', 'paper-king.webp', 512, 'R-06 금고 안쪽의 종이 왕 · 전신 정적 조형물'),
    ('R07-surveillance-lotus/surveillance-lotus/reverse-r07-surveillance-lotus.png', 'lotus.webp', 420, 'R-07 감시의 연꽃 · 늪 다리·병동 환경 개체'),
    ('R08-tactile-table-v2/tactile-table-v2/reverse-r08-tactile-table-drawing-v2-underpaper-emboss.png', 'table-drawing.webp', 320, 'R-11 작은 식탁 그림(종이 밑 실 양각 v2) · 바닥의 작은 종이'),
    ('R13-empty-sleeve-trumpet/empty-sleeve-trumpet/storyworld-reverse-r13-empty-sleeve-trumpet-idle-v1.png', 'trumpet.webp', 420, 'R-13 빈 소매 나팔 · 정적 1장'),
    ('R14-thread-door/thread-door-drawing/reverse-r14-thread-door-drawing.png', 'thread-door.webp', 320, 'R-14 실로 그린 문 그림 · 바닥의 종이')]:
    save(trimmed(path), name, maxh, path, use)
(out / 'sources.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1))
for r in rows: print(r['file'], r['w'], r['h'], r['bytes'])
