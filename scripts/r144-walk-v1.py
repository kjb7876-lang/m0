#!/usr/bin/env python3
"""R144: 옆 걷기(walk-e) 시트를 드라이브 v1 으로 되돌린다(기억사수·환도).
지금 게임이 쓰는 v2 걷기(R132, StoryWorld-HERO-<id>-sheet-20261030 v2) 의 walk-e 는 8칸 모두 뒷다리 아래가 잘려
장화 끝이 몸에서 떨어져 떠 있고(기억사수), 다리가 끊기고 망토에 가로 줄이 생겼다(환도). 같은 날 v1 시트의 walk-e 는 다리가 온전하다
(떨어진 조각 픽셀: 기억사수 v1 0 / v2 786, 환도 v1 189 / v2 419 — 환도의 남는 값은 칼자루 술·망토 자락 디자인).
나머지 방향(s·se·ne·n)은 v1·v2 가 거의 같아 그대로 둔다. MANIFEST SHA-256 확인, 원본 PNG 는 바꾸지 않는다.
usage: python3 -I scripts/r144-walk-v1.py <hero> <v1 staging dir> <v1 drive id> <out root e.g. r96/runtime-text/assets/r144/walk>
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image

hero, src, drive_id, outroot = sys.argv[1], Path(sys.argv[2]), sys.argv[3], Path(sys.argv[4])
sha = lambda b: hashlib.sha256(b).hexdigest(); out = outroot / hero; out.mkdir(parents=True, exist_ok=True)
man = json.loads((src / 'MANIFEST.json').read_text(encoding='utf-8')); name = f'HERO-{hero}-walk-e.png'; raw = (src / name).read_bytes()
if name not in man or sha(raw) != man[name]['sha256']: raise SystemExit('sha mismatch ' + name)
im = Image.open(src / name).convert('RGBA')
if im.size != (1536, 256): raise SystemExit('bad size')
dst = out / 'walk-e.webp'; im.save(dst, 'WEBP', quality=92, alpha_quality=100, method=4)
replaces = 'assets/r128/gunner/walk-e.webp' if hero == 'gunner' else f'assets/r130/{hero}/walk-e.webp'
(out / 'index.json').write_text(json.dumps({'hero': hero, 'path': f'assets/r144/walk/{hero}/walk-e.webp', 'replaces': replaces, 'cols': 8, 'rows': 1, 'cell': [192, 256], 'foot': [96, 226],
    'source': {'driveId': drive_id, 'version': 'v1 (2026-10-30)', 'file': name, 'sha256': man[name]['sha256'], 'bytes': len(raw)}, 'sha256': sha(dst.read_bytes()), 'bytes': dst.stat().st_size,
    'why': '옛(v1)·새(v2) 걷기 비교: v2 walk-e 는 뒷다리 아래가 잘려 장화가 떨어져 보임, v1 은 온전 — 더 자연스러운 v1 사용(나머지 방향은 v2 그대로)'}, ensure_ascii=False, indent=1), encoding='utf-8')
print(hero, dst.stat().st_size)
