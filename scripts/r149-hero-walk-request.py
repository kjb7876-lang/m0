#!/usr/bin/env python3
"""R149: 영웅 이동(걷기·달리기) 시트를 새로 그려 받기 위한 요청 묶음(docs/gemini-hero-refs-r149/).
R148 측정: 지금 걷기 시트(2026-10-30 Gemini v2)는 8칸 내내 두 발 사이가 45~50px(몸 키 180)로 다리가 거의 벌어지지 않는다.
게임 속 영웅은 1초에 몸 키의 약 3.7배(옆 화면 이동은 약 4.7배)를 움직이므로, 이 시트로는 다리를 빨리 돌리면 종종걸음,
천천히 돌리면 발이 미끄러진다(사용자 2026-10-30 "어그적어그적", R148 박자 조정 뒤에도 "별로").
-> 보폭이 큰 가벼운 달리기 8프레임을 R144 묶음과 같은 규격(칸 192x256, 발 96,226, 몸 키 180, 5방향)·같은 인물로 다시 그려 받는다.
usage: python3 -I scripts/r149-hero-walk-request.py <built site dir> <out dir> <stride guide png out>
"""
import hashlib, io, json, sys, zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

site, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
NAMES = {'lauren': '로렌', 'hwando': '환도', 'seoha': '서하', 'neon': '네온', 'michaela': '미카엘라', 'hunter': '헌터', 'slayer': '슬레이어', 'gunner': '기억사수'}
RANK = ['hwando', 'gunner', 'lauren', 'slayer', 'seoha', 'neon', 'michaela', 'hunter']
# 프레임 순서(8칸, 왼쪽→오른쪽): 몸 높이는 발 기준점(96,226)에서 머리 꼭대기까지, 위·아래 출렁임은 이 표대로만.
FRAMES = [
    ('0', '오른발 앞 착지', '오른발 뒤꿈치가 앞에서 막 땅에 닿음, 왼발은 뒤에서 발끝으로 밀어냄, 두 발 사이 가장 넓음', 0),
    ('1', '내려앉기', '오른발로 체중을 받으며 무릎이 살짝 굽음 — 몸이 가장 낮다', 4),
    ('2', '지나가기', '왼다리가 무릎을 앞으로 들어 오른다리 옆을 지나감, 오른발은 몸 바로 아래', 1),
    ('3', '떠오르기', '오른발로 밀어 몸이 가장 높다, 왼무릎이 앞으로 높이 들림', -4),
    ('4', '왼발 앞 착지', '0번의 좌우 반대: 왼발 뒤꿈치가 앞에서 땅에 닿음, 오른발은 뒤에서 밀어냄', 0),
    ('5', '내려앉기', '1번의 좌우 반대 — 몸이 가장 낮다', 4),
    ('6', '지나가기', '2번의 좌우 반대', 1),
    ('7', '떠오르기', '3번의 좌우 반대 — 몸이 가장 높다', -4),
]
# 방향별 보폭(칸 안 px, 몸 키 180 기준). 아이소메트릭 2:1 이라 옆(e)이 가장 넓고 앞뒤(s,n)는 위아래로 짧게 보인다.
STRIDE = {
    'e': '착지 칸(0·4)에서 뒷발 끝~앞발 끝 가로 약 130px(발 기준점 96 의 좌우로 약 65px씩). 땅에 닿은 발은 0→1→2→3 동안 프레임마다 약 30px씩 뒤(왼쪽)로 고르게 이동',
    'se': '착지 칸에서 두 발 사이 가로 약 100px·세로 약 50px(오른아래로 대각선). 땅에 닿은 발은 프레임마다 왼위 방향으로 고르게 이동',
    'ne': '착지 칸에서 두 발 사이 가로 약 100px·세로 약 50px(오른위로 대각선). 땅에 닿은 발은 프레임마다 왼아래 방향으로 고르게 이동',
    's': '정면이라 보폭은 위아래로 보인다: 착지 칸에서 앞발(화면 아래쪽)과 뒷발의 세로 차이 약 45px, 들린 무릎이 몸 앞으로 분명히 보이게',
    'n': '등 쪽이라 보폭은 위아래로 보인다: 착지 칸에서 두 발 세로 차이 약 45px, 발바닥이 번갈아 보이게',
}

def cell(path, i):
    return Image.open(site / path).convert('RGBA').crop((i * 192, 0, i * 192 + 192, 256))

def refs(h):
    walk = f"assets/{'r128' if h == 'gunner' else 'r130'}/{h}/walk-{{}}.webp"; atk = f'assets/r143/attack/{h}/attack-{{}}.webp'
    r = {f'{h}-walk-s-f0.png': (walk.format('s'), 0), f'{h}-walk-se-f0.png': (walk.format('se'), 0),
         f'{h}-walk-e-f0.png': (f'assets/r144/walk/{h}/walk-e.webp' if h in ('gunner', 'hwando') else walk.format('e'), 0),
         f'{h}-walk-ne-f0.png': (walk.format('ne'), 0), f'{h}-walk-n-f0.png': (walk.format('n'), 0), f'{h}-attack-e-strike.png': (atk.format('e'), 3)}
    if h != 'hwando':
        r[f'{h}-idle-s-f0.png'] = (f"assets/{'r128' if h == 'gunner' else 'r130'}/{h}/idle-s.webp", 0)
    return r

def guide():
    """옆(e) 달리기 8칸의 발 위치·몸 높이 안내 그림(사람 그림 없음, 선과 점만)."""
    W, H = 192 * 8, 256
    try: fnt = ImageFont.truetype('/usr/share/fonts/opentype/unifont/unifont.otf', 16)
    except OSError: fnt = None
    im = Image.new('RGBA', (W, H), (255, 255, 255, 255)); d = ImageDraw.Draw(im)
    for i, (_, name, _, bob) in enumerate(FRAMES):
        x0 = i * 192; d.rectangle([x0, 0, x0 + 191, 255], outline=(180, 180, 180)); d.line([x0, 226, x0 + 191, 226], fill=(120, 120, 120))
        d.ellipse([x0 + 93, 223, x0 + 99, 229], fill=(220, 0, 0))  # 발 기준점 96,226
        top = 226 - 180 + bob; d.line([x0 + 70, top, x0 + 122, top], fill=(0, 90, 220), width=2)  # 머리 꼭대기
        d.line([x0 + 70, 46, x0 + 122, 46], fill=(0, 90, 220, 90))
        k = i % 4; plant = [65, 35, 5, -25][k]  # 땅에 닿은 발(가로 위치, 발 기준점 기준)
        d.ellipse([x0 + 96 + plant - 6, 220, x0 + 96 + plant + 6, 232], fill=(0, 160, 60))
        if k == 0: d.ellipse([x0 + 96 - 65 - 6, 214, x0 + 96 - 65 + 6, 226], outline=(0, 160, 60), width=2)  # 뒤에서 밀어내는 발
        d.text((x0 + 6, 6), f'{i} {name}', fill=(0, 0, 0), font=fnt); d.text((x0 + 6, 236), 'head base' if bob == 0 else f'head {"down" if bob > 0 else "up"} {abs(bob)}px', fill=(0, 90, 220))
    return im

g = guide(); gb = io.BytesIO(); g.save(gb, 'PNG'); Path(sys.argv[3]).write_bytes(gb.getvalue())
rows = []
for rank, h in enumerate(RANK, 1):
    files = {}
    for name, (p, i) in refs(h).items():
        b = io.BytesIO(); cell(p, i).save(b, 'PNG'); files['reference/' + name] = b.getvalue()
    files['reference/GUIDE-run-e-feet-and-head.png'] = gb.getvalue()
    flines = '\n'.join(f'  {k}번 {n}: {t} (머리 {"기준 높이" if b == 0 else f"{abs(b)}px " + ("아래" if b > 0 else "위")})' for k, n, t, b in FRAMES)
    slines = '\n'.join(f'  - {d}: {STRIDE[d]}' for d in ['s', 'se', 'e', 'ne', 'n'])
    prompt = f"""StoryWorld 합일몽세 — 영웅 「{NAMES[h]}」({h}) 이동(달리기) 스프라이트시트 다시 그리기 요청 (R149)

첨부한 reference/ 그림은 지금 게임이 쓰는 이 영웅의 그림 칸입니다(걷기 5방향 첫 칸, 공격, 서 있기).
같은 인물로(얼굴·머리·옷 모양·옷 색·무기·체형·선 굵기·채색 방식 그대로) 이동 동작만 새로 그려 주세요.

[왜 다시 그리나]
지금 걷기 그림은 8칸 내내 두 발 사이가 45~50px 정도로 다리가 거의 벌어지지 않아, 게임에서 빠르게 이동하면
다리가 종종거리거나 발이 미끄러져 '어기적어기적' 걷는 것처럼 보입니다. 게임 속 영웅은 1초에 자기 키의 약 4배를 움직이므로
보폭이 큰 '가벼운 달리기'가 자연스럽습니다(뛰는 듯 성큼성큼, 팔도 다리와 반대로 흔들기).

[규격 — R144 요청과 똑같이]
- 시점: 아이소메트릭 3/4 위에서 내려다보는 시점(2:1). 빛은 왼쪽 위.
- 방향 5개: s(아래·화면 쪽), se(오른아래), e(오른쪽), ne(오른위), n(위·등). 왼쪽 3방향은 게임에서 좌우 반전해 씁니다.
- 칸: 192×256 px, 투명 배경 PNG. 8프레임을 왼쪽에서 오른쪽으로 한 줄(가로 1536 × 세로 256).
- 몸 가운데(골반)는 모든 칸에서 가로 96 근처에 그대로 두고(제자리 달리기), 다리만 앞뒤로 움직입니다.
- 서 있는 몸 키는 약 180px(발바닥 226 ~ 머리 꼭대기 46)로 reference 와 같은 크기. 칸 밖으로 잘리지 않게(무기 끝·망토 포함).
- 글자·숫자·그림자·바닥·배경·이펙트(먼지·잔상·빛)를 넣지 마세요. 인물과 무기만.
- 프레임끼리 옷 색·밝기·크기·무기 모양이 바뀌지 않게.
- 기존 게임(디아블로 등)의 스프라이트를 따라 그리지 말고 새로 그려 주세요.

[8프레임 순서 — 모든 방향 같은 박자]
{flines}
- 몸이 위아래로 움직이는 건 위 표의 4px 정도만. 좌우로 흔들리거나 비틀거리지 않게(어기적거림 금지).
- 무기는 손에 고정된 채 팔과 함께 자연스럽게 흔들리고, 망토·코트 자락은 뒤로 살짝 날립니다.

[방향별 보폭 — 이게 가장 중요합니다]
{slines}
- reference/GUIDE-run-e-feet-and-head.png: 옆(e) 8칸의 발 기준점(빨간 점), 땅에 닿은 발 위치(초록 점), 머리 높이(파란 선) 안내입니다. 사람은 그리지 않은 안내선이니 그대로 따라 맞춰 주세요.
- 땅에 닿아 있는 발은 땅 위에서 미끄러지지 않고 프레임마다 같은 간격으로 뒤로 움직여야 합니다.

[파일 이름]
- HERO-{h}-run-<방향>.png  예) HERO-{h}-run-e.png  — 전부 5개 파일(s, se, e, ne, n).

[돌려주기]
- StoryWorld-HERO-{h}-run-날짜.zip 으로 묶어 Google Drive 에 올려 주세요.
- 가능하면 MANIFEST.json(파일 이름·SHA-256·크기)과 README.txt(무엇을 그렸는지)를 같이 넣어 주세요.
"""
    spec = {'hero': h, 'name': NAMES[h], 'round': 'R149', 'action': 'run', 'frames': 8, 'cell': [192, 256], 'sheet': [1536, 256],
            'foot': {'x': 96, 'y': 226}, 'bodyHeightPx': 180, 'view': 'isometric 3/4 top-down (2:1), light from upper-left', 'background': 'transparent PNG',
            'directions': ['s', 'se', 'e', 'ne', 'n'], 'mirroredInGame': {'w': 'e', 'sw': 'se', 'nw': 'ne'},
            'frameOrder': [{'i': int(k), 'pose': n, 'note': t, 'headOffsetPx': b, 'headOffsetNote': '+ = 아래, - = 위'} for k, n, t, b in FRAMES], 'stride': STRIDE,
            'why': 'R148 측정: 지금 걷기 시트는 두 발 사이 45~50px(몸 키 180)로 고정 — 게임 이동 속도(초당 몸 키 약 3.7~4.7배)에 맞는 보폭이 없다',
            'fileName': f'HERO-{h}-run-<dir>.png', 'returnZip': f'StoryWorld-HERO-{h}-run-YYYYMMDD.zip  (Drive 에 올리기)'}
    readme = (f"사용법: 이 zip 을 Gemini 에 첨부하고 PROMPT-KO.txt 내용을 붙여 넣으세요(R144 동작 요청 묶음과 같은 대화에서 이어 해도 됩니다).\n"
              f"순위 {rank}/8 · {NAMES[h]} · 이동(달리기) 8프레임 5방향 = 파일 5개\n"
              "reference/ = 지금 게임이 쓰는 그림 칸 + 옆 달리기 발·머리 위치 안내선. 게임 원본은 바뀌지 않았습니다.\n")
    files['PROMPT-KO.txt'] = prompt.encode('utf-8'); files['README.txt'] = readme.encode('utf-8'); files['SPEC.json'] = json.dumps(spec, ensure_ascii=False, indent=1).encode('utf-8')
    files['MANIFEST.json'] = json.dumps({k: {'bytes': len(v), 'sha256': sha(v)} for k, v in sorted(files.items())}, ensure_ascii=False, indent=1).encode('utf-8')
    zp = out / f'StoryWorld-HERO-R149-RUN-{rank}-{h}.zip'
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
        for k in ['PROMPT-KO.txt', 'README.txt', 'SPEC.json', 'MANIFEST.json'] + sorted(k for k in files if k.startswith('reference/')): z.writestr(k, files[k])
    rows.append({'rank': rank, 'hero': h, 'zip': zp.name, 'bytes': zp.stat().st_size, 'sha256': sha(zp.read_bytes()), 'files': 5})
(out / 'index.json').write_text(json.dumps({'round': 'R149', 'purpose': '영웅 이동(달리기) 8프레임 5방향 새로 받기 — 지금 걷기 시트는 보폭이 거의 없어 어기적거림(R148 측정)', 'packages': rows}, ensure_ascii=False, indent=1), encoding='utf-8')
for r in rows: print(r['rank'], r['hero'], r['bytes'])
