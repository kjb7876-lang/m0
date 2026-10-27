#!/usr/bin/env python3
"""R106 둘째 묶음: Drive 2026-10-27 오후 정적 후보(R00 물감 철로 v2·R02 해바라기 침상·R13 연결기둥 v2·R16 돌봄 기록철·S04 마네킹 식사 v2 1번 칸) -> 게임 webp.
원본 PNG는 ZIP 안에 그대로 두고, 투명 여백만 잘라 줄입니다. S04는 동작 후보(완성 루프 아님·anchor 미등록)라 1번 칸만 정적으로 씁니다.
Usage: python3 -I scripts/r106-drive-assets-2.py <unzipped-root> r96/runtime-text/assets/r106/drive
"""
import sys, json, hashlib
from pathlib import Path
from PIL import Image
src, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
rows = []
def save(im, name, maxh, source, use):
    if im.height > maxh: im = im.resize((round(im.width * maxh / im.height), maxh), Image.LANCZOS)
    p = out / name; im.save(p, 'WEBP', quality=90, method=6, exact=False)
    rows.append({'file': 'assets/r106/drive/' + name, 'w': im.width, 'h': im.height, 'bytes': p.stat().st_size, 'sha256': sha(p), 'source': source, 'sourceSha256': sha(src / source), 'use': use})
def trimmed(path, box=None):
    im = Image.open(src / path).convert('RGBA')
    if box: im = im.crop(box)
    return im.crop(im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox())
for path, box, name, maxh, use in [
    ('r00rail/teal-painted-rail-v2/storyworld-reverse-r00-flat-teal-painted-rail-fragment-v2.png', None, 'teal-rail.webp', 360, 'R-00 청록 물감 철로 v2 · 바닥 조각(정적)'),
    ('r02gurney/sunflower-gurney/storyworld-reverse-r02-sunflower-gurney-idle-v1.png', None, 'sunflower-gurney.webp', 420, 'R-02 해바라기 이송침상 · 정적 조형물'),
    ('r13pillar/ending-link-pillar-v2/reverse-r13-ending-link-pillar-v2-web-thread-edit.png', None, 'link-pillar.webp', 480, 'R-13 결말 연결기둥 v2(조건부) · 정적 조형물'),
    ('r16record/care-record-spread/reverse-r16-care-record-spread.png', None, 'care-record.webp', 320, 'R-16 돌봄 기록철 · 바닥에 펼친 기록(이름 UI 없음)'),
    ('s04mannequin/mannequin-eating-v2/storyworld-samong-s04-mannequin-eating-6frames-v2.png', (0, 0, 512, 512), 'mannequin-eating-1.webp', 420, 'S-04 빈 접시 마네킹 · 6칸 후보 중 1번 칸만 정적(동작 미적용)')]:
    save(trimmed(path, box), name, maxh, path, use)
p = out / 'sources.json'; old = json.loads(p.read_text()) if p.exists() else []
keep = [r for r in old if r['file'] not in {x['file'] for x in rows}]
p.write_text(json.dumps(keep + rows, ensure_ascii=False, indent=1))
for r in rows: print(r['file'], r['w'], r['h'], r['bytes'])
