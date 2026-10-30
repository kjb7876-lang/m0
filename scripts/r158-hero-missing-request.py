#!/usr/bin/env python3
"""R158: 드라이브 sheet2 동작 중 '한 방향만 빠진 것'과 '방향끼리 그림이 다른 것'을 채우기 위한 요청 묶음(docs/gemini-hero-refs-r158/).
2026-10-30 21:15 UTC 드라이브 정리(scratchpad sheet2-inventory.json) 기준:
  서하 스킬 se 없음 · 환도 막기·서 있기 se 없음 · 로렌 막기 ne 없음 ·
  미카엘라 스킬은 s(ADDENDUM11)만 지금 게임의 미카엘라(회색 코트·검은 머리)와 같고 se·e·ne·n 은 갈색 머리·분홍 장식으로 달라 다시 그림.
이미 받은 방향의 시트를 reference/ 에 넣어 같은 인물·같은 박자(프레임 수·자세 순서)로 그리게 한다. 규격은 R144 와 같다(칸 192x256, 발 96,226, 몸 키 180).
usage: python3 -I scripts/r158-hero-missing-request.py <staging root> <built site dir> <out dir>
"""
import glob, hashlib, io, json, os, sys, zipfile
from pathlib import Path
from PIL import Image

root, site, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]); out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
NAMES = {'seoha': '서하', 'hwando': '환도', 'lauren': '로렌', 'michaela': '미카엘라'}
ACT = {'skill': '스킬', 'guard': '막기', 'idle': '서 있기(대기)'}
DIRK = {'s': 's(아래·정면)', 'se': 'se(오른아래)', 'e': 'e(오른쪽)', 'ne': 'ne(오른위)', 'n': 'n(위·등)'}
# (영웅, 동작, 새로 그릴 방향, 참고로 넣을 방향, 메모)
JOBS = [('seoha', 'skill', ['se'], ['s', 'e', 'ne', 'n'], ''),
        ('hwando', 'guard', ['se'], ['s', 'e', 'ne', 'n'], ''),
        ('hwando', 'idle', ['se'], ['s', 'e', 'ne', 'n'], ''),
        ('lauren', 'guard', ['ne'], ['s', 'se', 'e', 'n'], ''),
        ('michaela', 'skill', ['se', 'e', 'ne', 'n'], ['s'], 'reference 의 s 시트(회색·흰 코트, 검은 머리, 빨간 포인트)와 같은 옷·머리색으로 — 이전 se·e·ne·n 은 갈색 머리·분홍 장식으로 달라 쓰지 못했습니다.')]
def newest(hero, act, d):
    fs = glob.glob(str(root / '**' / f'HERO-{hero}-{act}-{d}.png'), recursive=True)
    return max(fs, key=os.path.getmtime) if fs else None
rows = []
for hero in dict.fromkeys(j[0] for j in JOBS):
    files, lines, want = {}, [], 0
    for h, act, need, ref, memo in [j for j in JOBS if j[0] == hero]:
        im0 = None
        for d in ref:
            f = newest(h, act, d)
            if not f: continue
            b = Path(f).read_bytes(); files[f'reference/{h}-{act}-{d}.png'] = b; im0 = im0 or Image.open(f)
        n = im0.width // 192 if im0 else '?'
        lines.append(f'- {ACT[act]}({act}) {n}프레임 — 새로 그릴 방향: {", ".join(DIRK[d] for d in need)}. 이미 있는 방향(reference): {", ".join(ref)}. {memo}'.rstrip())
        want += len(need)
    walk = site / 'assets' / ('r130' if hero != 'gunner' else 'r128') / hero / 'walk-s.webp'
    if walk.exists():
        b = io.BytesIO(); Image.open(walk).convert('RGBA').crop((0, 0, 192, 256)).save(b, 'PNG'); files[f'reference/{hero}-current-walk-s-f0.png'] = b.getvalue()
    prompt = f"""StoryWorld 합일몽세 — 영웅 「{NAMES[hero]}」({hero}) 빠진 방향 채우기 (R158)

이미 받은 sheet2 동작에서 한두 방향만 빠져 게임에 넣지 못하고 있습니다. reference/ 의 같은 동작 시트(다른 방향)와
{hero}-current-walk-s-f0.png(지금 게임의 모습)을 보고, 같은 인물·같은 옷 색·같은 프레임 수·같은 자세 순서로 아래 방향만 그려 주세요.

[그릴 것]
{chr(10).join(lines)}

[규격 — 지난 시트와 똑같이]
- 칸 192×256 px, 투명 배경 PNG, 프레임을 왼쪽에서 오른쪽으로 한 줄(reference 와 같은 칸 수).
- 모든 칸에서 발바닥 가운데가 (가로 96, 세로 226), 서 있는 몸 키 약 180px. 칸 밖으로 잘리지 않게.
- 아이소메트릭 3/4 위에서 내려다보는 시점, 빛은 왼쪽 위. 방향 이름: s 아래(정면), se 오른아래, e 오른쪽, ne 오른위, n 위(등).
- 글자·그림자·바닥·배경·이펙트(빛 고리·마법진·잔상) 없이 인물과 무기만. 프레임끼리 옷 색·밝기·크기 그대로.
- 기존 게임(디아블로 등)의 스프라이트를 따라 그리지 말고 새로 그려 주세요.

[파일 이름·돌려주기]
- HERO-{hero}-<동작>-<방향>.png  (예: HERO-{hero}-{JOBS[[j[0] for j in JOBS].index(hero)][1]}-{JOBS[[j[0] for j in JOBS].index(hero)][2][0]}.png) — 전부 {want}개.
- StoryWorld-HERO-{hero}-sheet2-20261031-FILL01.zip 으로 묶어 Google Drive 에 올려 주세요(MANIFEST.json·README.txt 있으면 좋음).
"""
    files['PROMPT-KO.txt'] = prompt.encode('utf-8')
    files['README.txt'] = f'사용법: 이 zip 을 Gemini 에 첨부하고 PROMPT-KO.txt 를 붙여 넣으세요. {NAMES[hero]} · 새로 그릴 파일 {want}개.\n'.encode('utf-8')
    files['MANIFEST.json'] = json.dumps({k: {'bytes': len(v), 'sha256': sha(v)} for k, v in sorted(files.items())}, ensure_ascii=False, indent=1).encode('utf-8')
    zp = out / f'StoryWorld-HERO-R158-FILL-{hero}.zip'
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
        for k in ['PROMPT-KO.txt', 'README.txt', 'MANIFEST.json'] + sorted(k for k in files if k.startswith('reference/')): z.writestr(k, files[k])
    rows.append({'hero': hero, 'zip': zp.name, 'bytes': zp.stat().st_size, 'sha256': sha(zp.read_bytes()), 'files': want, 'refs': sorted(k for k in files if k.startswith('reference/'))})
(out / 'index.json').write_text(json.dumps({'round': 'R158', 'purpose': 'sheet2 빠진 방향·방향별 불일치 채우기(2026-10-30 21:15 UTC 드라이브 정리 기준)', 'packages': rows}, ensure_ascii=False, indent=1), encoding='utf-8')
for r in rows: print(r['hero'], r['files'], r['bytes'], len(r['refs']))
