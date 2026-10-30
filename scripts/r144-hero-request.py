#!/usr/bin/env python3
"""R144: 현재 자산으로 고칠 수 없는 영웅 동작을 새로 그려 받기 위한 요청 묶음(docs/gemini-hero-refs-r144/).
R143 전수 점검(8영웅 x 192장면)에서 남은 빈칸:
  · 모든 영웅: 스킬·막기·대시·궁극기가 정지 그림 한 장(움직임 없음), 기억사수 대시는 쓸 그림이 없어 걷기 칸으로 대신
  · 환도: 시트에 서 있기·피격·쓰러짐이 없어 공격 첫 칸으로 대신
기존 R1 요청(docs/gemini-hero-refs)과 같은 규격(칸 192x256, 발 96,226, 몸 키 180, 5방향, 투명 PNG)·같은 파일 이름 규칙.
reference/ 에는 지금 게임이 쓰는 새 시트(R130/R128 걷기·서 있기, R144 옆 걷기 v1, R143 공격)의 칸을 넣어 같은 인물·색·비율로 그리게 한다.
usage: python3 -I scripts/r144-hero-request.py <built site dir> <out dir>
"""
import hashlib, io, json, sys, zipfile
from pathlib import Path
from PIL import Image

site, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
NAMES = {'lauren': '로렌', 'hwando': '환도', 'seoha': '서하', 'neon': '네온', 'michaela': '미카엘라', 'hunter': '헌터', 'slayer': '슬레이어', 'gunner': '기억사수'}
ACT = {
    'skill': (6, '스킬 시전: 준비 2(무기·손에 힘을 모음) · 발동 2(가장 크게 뻗는 자세) · 회수 2(기본 태세로)'),
    'guard': (4, '막기: 무기·팔을 몸 앞으로 들어 막는 자세로 2프레임 → 버티는 2프레임(발은 제자리)'),
    'dash': (4, '대시: 몸을 낮추고 앞으로 박차는 2프레임 → 미끄러지며 멈추는 2프레임(발 기준점은 칸 가운데 그대로)'),
    'ultimate': (8, '궁극기: 크게 모으는 3 · 최대 동작 2 · 여운 3. 빛·마법진·날개 같은 효과는 그리지 말고 인물 자세만(효과는 게임이 따로 그림)'),
    'idle': (4, '대기: 숨쉬기·망토 흔들림 정도, 발은 제자리'),
    'hit': (2, '피격: 충격 → 상체와 고개가 뒤로 젖혀짐(발 기준점 유지)'),
    'death': (6, '쓰러짐: 휘청 2 → 무릎 꿇기 1 → 바닥에 눕기 3'),
}
PLAN = {h: ['skill', 'guard', 'dash', 'ultimate'] for h in NAMES}
PLAN['hwando'] = ['idle', 'hit', 'death', 'skill', 'guard', 'dash', 'ultimate']
WHY = {h: '스킬·막기·대시·궁극기가 지금은 정지 그림 한 장이라 동작이 끊겨 보임' for h in NAMES}
WHY['gunner'] = '스킬·막기·궁극기가 정지 그림 한 장, 대시는 쓸 그림이 없음(옛 대시 그림은 몸이 34% 작아 걷기 칸으로 대신 중)'
WHY['hwando'] = '흰 망토 시트에 서 있기·피격·쓰러짐이 없어 공격 첫 칸으로 대신 중, 스킬·막기·대시·궁극기도 정지 그림 한 장'
RANK = ['hwando', 'gunner', 'lauren', 'slayer', 'seoha', 'neon', 'michaela', 'hunter']

def cell(path, i):
    im = Image.open(site / path).convert('RGBA'); return im.crop((i * 192, 0, i * 192 + 192, 256))
def refs(h):
    walk = f"assets/{'r128' if h == 'gunner' else 'r130'}/{h}/walk-{{}}.webp"; atk = f'assets/r143/attack/{h}/attack-{{}}.webp'
    r = {f'{h}-walk-s-f0.png': (walk.format('s'), 0), f'{h}-walk-e-f0.png': (f'assets/r144/walk/{h}/walk-e.webp' if h in ('gunner', 'hwando') else walk.format('e'), 0), f'{h}-walk-n-f0.png': (walk.format('n'), 0),
         f'{h}-attack-e-strike.png': (atk.format('e'), 3), f'{h}-attack-s-ready.png': (atk.format('s'), 0)}
    if h != 'hwando':
        idle = f"assets/{'r128' if h == 'gunner' else 'r130'}/{h}/idle-{{}}.webp"; r[f'{h}-idle-s-f0.png'] = (idle.format('s'), 0)
    return r
rows = []
for rank, h in enumerate(RANK, 1):
    acts = PLAN[h]; files = {}
    for name, (p, i) in refs(h).items():
        b = io.BytesIO(); cell(p, i).save(b, 'PNG'); files['reference/' + name] = b.getvalue()
    lines = '\n'.join(f'- {a}: {ACT[a][0]}프레임 — {ACT[a][1]}' for a in acts)
    nfile = len(acts) * 5
    prompt = f"""StoryWorld 합일몽세 — 영웅 「{NAMES[h]}」({h}) 스프라이트시트 추가 요청 (R144)

첨부한 reference/ 그림은 지금 게임이 쓰는 이 영웅의 걷기·공격 시트 칸입니다(같은 2026-10-30 시트).
같은 인물로(얼굴·머리·옷 모양·옷 색·무기·체형·선 굵기·채색 방식 그대로) 아래 동작만 새로 그려 주세요.
이유: {WHY[h]}.

[규격 — 지난 시트와 똑같이]
- 시점: 아이소메트릭 3/4 위에서 내려다보는 시점(2:1). 빛은 왼쪽 위.
- 방향 5개: s(아래·화면 쪽), se(오른아래), e(오른쪽), ne(오른위), n(위·등). 왼쪽 3방향은 게임에서 좌우 반전해 씁니다.
- 칸: 192×256 px, 투명 배경 PNG. 프레임을 왼쪽에서 오른쪽으로 한 줄.
- 모든 칸에서 발바닥 가운데가 같은 점(가로 96, 세로 226)에 오고, 서 있는 몸 키는 약 180px로 reference 와 같은 크기. 칸 밖으로 잘리지 않게(무기 끝 포함).
- 글자·숫자·그림자·바닥·배경·이펙트(빛 고리·불꽃·마법진·잔상)를 넣지 마세요. 인물과 무기만.
- 프레임끼리 옷 색·밝기·크기가 바뀌지 않게, 발이 미끄러지지 않게.
- 기존 게임(디아블로 등)의 스프라이트를 따라 그리지 말고 새로 그려 주세요.

[동작]
{lines}

[파일 이름]
- HERO-{h}-<동작>-<방향>.png  예) HERO-{h}-{acts[0]}-se.png
- 전부 {nfile}개 파일. 한 번에 어려우면 동작 하나씩(5개씩) 나눠도 됩니다.

[돌려주기]
- 파일들을 StoryWorld-HERO-{h}-sheet2-날짜.zip 으로 묶어 Google Drive 에 올려 주세요(나눠 만들었으면 -part1, -part2 …).
- 가능하면 MANIFEST.json(파일 이름·SHA-256·크기)과 README.txt(무엇을 그렸는지)를 같이 넣어 주세요.
"""
    spec = {'hero': h, 'name': NAMES[h], 'round': 'R144', 'cell': [192, 256], 'foot': {'x': 96, 'y': 226, 'note': '모든 칸에서 발바닥 가운데가 이 점'},
            'bodyHeightPx': 180, 'view': 'isometric 3/4 top-down (2:1), light from upper-left', 'background': 'transparent PNG',
            'directions': ['s', 'se', 'e', 'ne', 'n'], 'mirroredInGame': {'w': 'e', 'sw': 'se', 'nw': 'ne'},
            'actions': [{'id': a, 'frames': ACT[a][0], 'note': ACT[a][1]} for a in acts],
            'fileName': f'HERO-{h}-<action>-<dir>.png  (한 파일 = 한 동작 한 방향, 프레임을 왼쪽→오른쪽 한 줄로, 칸 192×256)',
            'returnZip': f'StoryWorld-HERO-{h}-sheet2-YYYYMMDD.zip  (Drive 에 올리기)', 'issue': WHY[h]}
    readme = f"사용법: 이 zip 을 Gemini 에 첨부하고 PROMPT-KO.txt 내용을 붙여 넣으세요.\n순위 {rank}/8 · {NAMES[h]} · {WHY[h]}\nreference/ = 지금 게임이 쓰는 2026-10-30 시트의 칸(걷기 s·e·n 첫 칸, 공격 e 타격·s 준비{', 서 있기 s' if h != 'hwando' else ''}). 게임 원본은 바뀌지 않았습니다.\n"
    files['PROMPT-KO.txt'] = prompt.encode('utf-8'); files['README.txt'] = readme.encode('utf-8'); files['SPEC.json'] = json.dumps(spec, ensure_ascii=False, indent=1).encode('utf-8')
    files['MANIFEST.json'] = json.dumps({k: {'bytes': len(v), 'sha256': sha(v)} for k, v in sorted(files.items())}, ensure_ascii=False, indent=1).encode('utf-8')
    zp = out / f'StoryWorld-HERO-R144-{rank}-{h}.zip'
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
        for k in ['PROMPT-KO.txt', 'README.txt', 'SPEC.json', 'MANIFEST.json'] + sorted(k for k in files if k.startswith('reference/')): z.writestr(k, files[k])
    rows.append({'rank': rank, 'hero': h, 'zip': zp.name, 'bytes': zp.stat().st_size, 'sha256': sha(zp.read_bytes()), 'actions': acts, 'files': nfile, 'why': WHY[h]})
(out / 'index.json').write_text(json.dumps({'round': 'R144', 'purpose': '현재 자산으로 고칠 수 없는 영웅 동작 새로 받기(R143 전수 점검 결과)', 'packages': rows}, ensure_ascii=False, indent=1), encoding='utf-8')
for r in rows: print(r['rank'], r['hero'], r['files'], r['bytes'])
