#!/usr/bin/env python3
"""R143: Drive 영웅 시트(StoryWorld-HERO-<id>-sheet-20261030.zip)의 공격 6프레임(attack-<s|se|e|ne|n>.png, 칸 192×256, 발 96,226)
-> r96/runtime-text/assets/r143/attack/<id>/attack-<dir>.webp + index.json(출처·해시·칸·방향별 발 높이).
R130 은 공격·스킬·막기를 이 시트의 한 칸(정지 그림)으로만 바꿨다. 기본 공격을 예비 2·타격 2·회수 2 프레임으로 이어 그리기 위해 시트 그대로 옮긴다.
MANIFEST SHA-256 이 맞지 않으면 멈춘다. 원본 PNG 는 바꾸지 않는다(R130 걷기와 같은 webp 품질 92).
피격(hit, 2프레임)도 같은 방법으로 옮긴다(넷째 인자 다음 action=hit).
usage: python3 -I scripts/r143-attack-sheets.py <hero> <staging dir with MANIFEST.json> <drive file id> <out root> [attack|hit]
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image

hero, src, drive_id, outroot = sys.argv[1], Path(sys.argv[2]), sys.argv[3], Path(sys.argv[4]); act = sys.argv[5] if len(sys.argv) > 5 else 'attack'
out = outroot / hero; out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest(); CW, CH = 192, 256
man = json.loads((src / 'MANIFEST.json').read_text(encoding='utf-8'))
rows = {}
for d in ('s', 'se', 'e', 'ne', 'n'):
    name = f'HERO-{hero}-{act}-{d}.png'; raw = (src / name).read_bytes()
    if name not in man or sha(raw) != man[name]['sha256']: raise SystemExit('sha mismatch ' + name)
    im = Image.open(src / name).convert('RGBA'); W, H = im.size
    if H != CH or W % CW: raise SystemExit('bad cell ' + name)
    n = W // CW; a = im.getchannel('A'); feet = []
    for i in range(n):
        # 발: 가운데 80px 띠에서 불투명 6px 이상인 가장 아래 줄(늘어진 무기·옷자락 끝은 제외)
        ys = [y for y in range(CH) if sum(1 for x in range(i * CW + 56, i * CW + 136) if a.getpixel((x, y)) > 40) >= 6]
        feet.append(max(ys) if ys else 226)
    feet.sort(); foot = feet[len(feet) // 2]
    dst = out / f'{act}-{d}.webp'; im.save(dst, 'WEBP', quality=92, alpha_quality=100, method=4)
    rows[d] = {'path': f'assets/r143/{act}/{hero}/{act}-{d}.webp', 'frames': n, 'cell': [CW, CH], 'foot': [96, foot],
               'source': {'driveId': drive_id, 'file': name, 'sha256': man[name]['sha256'], 'bytes': len(raw)}, 'sha256': sha(dst.read_bytes()), 'bytes': dst.stat().st_size}
(out / 'index.json').write_text(json.dumps({'hero': hero, 'action': act, 'order': '예비 2 · 타격 2 · 회수 2 (README)' if act == 'attack' else '피격 충격 → 뒤로 젖힘 (README)', 'mirroredInGame': {'w': 'e', 'sw': 'se', 'nw': 'ne'},
    'applied': ('기본 공격(멈춰 서서)' if act == 'attack' else '맞았을 때') + ' 프레임 애니메이션 — client-source/attack-anim-r143.js', 'directions': rows}, ensure_ascii=False, indent=1), encoding='utf-8')
print(hero, {d: (r['frames'], r['foot'][1], r['bytes']) for d, r in rows.items()})
