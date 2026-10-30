#!/usr/bin/env python3
"""R127: Gemini 에 줄 영웅 스프라이트시트 참고 묶음 -> docs/gemini-hero-refs/StoryWorld-HERO-REF-<순위>-<id>.zip
각 묶음: 지금 게임의 대기 4방향·공격·스킬 그림(PNG, 원본 비율), 기억사수는 화풍 기준으로 다른 영웅 대기 2장,
PROMPT-KO.txt(그대로 붙여 넣을 요청문), SPEC.json(칸·방향·동작·파일 이름 규칙), README.txt.
게임 파일은 바꾸지 않는다. usage: python3 -I scripts/r127-gemini-hero-refs.py <built site dir> <heroart.json>
"""
import io, json, sys, zipfile, hashlib
from pathlib import Path
from PIL import Image

site, art = Path(sys.argv[1]), json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'))
out = Path('docs/gemini-hero-refs'); out.mkdir(parents=True, exist_ok=True)
# 순위: 화풍·색이 가장 어긋난 영웅부터 (R127 비교: 대기 vs 걷기 vs 공격)
ORDER = [
 ('gunner', '기억사수', '혼자 2~3등신 만화체 — 다른 영웅과 같은 7~8등신 사실 비율·다크 판타지 화풍으로. 흰 후드 망토·푸른 빛 소총은 유지', ['slayer', 'hunter']),
 ('michaela', '미카엘라', '걷기 그림이 분홍·빨강 옷으로 바뀜 — 참고 대기 그림의 흰 옷·색을 그대로', []),
 ('seoha', '서하', '걷기 그림이 갈색 옷·다른 체형 — 참고 대기 그림의 흰 코트·푸른 빛 구체를 그대로', []),
 ('lauren', '로렌', '걷기 그림이 자홍색 — 참고 대기 그림의 남보라 옷·창을 그대로', []),
 ('neon', '네온', '걷기 그림이 대기보다 작고 거침 — 같은 크기·선명도로', []),
 ('slayer', '슬레이어', '걷기 그림이 대기보다 작고 거침 — 같은 크기·선명도로', []),
 ('hunter', '헌터', '걷기 그림이 대기보다 작고 거침 — 같은 크기·선명도로', []),
 ('hwando', '환도', '대기는 좋음. 걷기만 황갈색으로 달라짐 — 흰 망토 대기와 같은 색으로 걷기·공격만', []),
]
DIRS = ['s', 'se', 'e', 'ne', 'n']
ACTIONS = [('walk', 8, '걷기: 양다리가 번갈아 앞뒤로, 몸이 살짝 오르내림'), ('attack', 6, '공격: 예비동작 2·타격 2·회수 2'),
           ('idle', 4, '대기: 숨쉬기·망토 흔들림 정도'), ('hit', 2, '피격: 뒤로 젖힘'), ('death', 6, '쓰러짐: 무릎 꿇고 바닥에 눕기')]
vals = lambda h, k: list(h[k].values()) if isinstance(h[k], dict) else [h[k]]

def png(path):
    im = Image.open(site / path).convert('RGBA'); bb = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    im = im.crop(bb) if bb else im; b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return b.getvalue()

for rank, (hid, ko, issue, style) in enumerate(ORDER, 1):
    h = art[hid]; idle = vals(h, 'idle'); files = {}
    for name, p in zip(['front', 'back', 'left', 'right'], idle): files[f'reference/{hid}-idle-{name}.png'] = png(p)
    files[f'reference/{hid}-attack-front.png'] = png(vals(h, 'attack')[0]); files[f'reference/{hid}-skill-front.png'] = png(vals(h, 'skill')[0])
    for s in style: files[f'style-reference/{s}-idle-front.png'] = png(vals(art[s], 'idle')[0])
    walk_only = hid == 'hwando'; acts = ACTIONS[:2] if walk_only else ACTIONS
    spec = {'hero': hid, 'name': ko, 'cell': [192, 256], 'foot': {'x': 96, 'y': 226, 'note': '모든 칸에서 발바닥 가운데가 이 점'},
            'bodyHeightPx': 180, 'view': 'isometric 3/4 top-down (2:1), light from upper-left', 'background': 'transparent PNG',
            'directions': DIRS, 'mirroredInGame': {'w': 'e', 'sw': 'se', 'nw': 'ne'},
            'actions': [{'id': a, 'frames': n, 'note': t} for a, n, t in acts],
            'fileName': 'HERO-' + hid + '-<action>-<dir>.png  (한 파일 = 한 동작 한 방향, 프레임을 왼쪽→오른쪽 한 줄로, 칸 192×256)',
            'returnZip': 'StoryWorld-HERO-' + hid + '-sheet-YYYYMMDD.zip  (Drive 에 올리기)', 'issue': issue}
    lines = [f'StoryWorld 합일몽세 — 영웅 「{ko}」({hid}) 스프라이트시트 요청', '',
             '첨부한 reference/ 그림은 지금 게임 속 이 영웅입니다. 같은 인물로(얼굴·머리·옷 모양·옷 색·무기·체형 그대로) 움직이는 스프라이트시트를 만들어 주세요.',
             f'고칠 점: {issue}.']
    if style: lines.append('style-reference/ 는 다른 영웅입니다. 머리·몸 비율과 그림체(사실적인 다크 판타지 일러스트)를 이 그림들에 맞춰 주세요. 옷과 무기는 reference/ 를 따릅니다.')
    lines += ['', '[규격]', '- 시점: 아이소메트릭 3/4 위에서 내려다보는 시점(2:1). 빛은 왼쪽 위.',
              '- 방향 5개: s(아래·화면 쪽), se(오른아래), e(오른쪽), ne(오른위), n(위·등). 왼쪽 3방향은 게임에서 좌우 반전해 씁니다.',
              '- 칸: 192×256 px, 투명 배경 PNG. 프레임을 왼쪽에서 오른쪽으로 한 줄.',
              '- 모든 칸에서 발바닥 가운데가 같은 점(가로 96, 세로 226)에 오고, 몸 키는 약 180px로 같게. 칸 밖으로 잘리지 않게.',
              '- 글자·숫자·그림자·바닥·배경·이펙트(빛 고리·불꽃)를 넣지 마세요. 인물만.',
              '- 기존 게임(디아블로 등)의 스프라이트를 따라 그리지 말고 새로 그려 주세요.', '', '[동작]']
    lines += [f'- {a}: {n}프레임 — {t}' for a, n, t in acts]
    lines += ['', '[파일 이름]', f'- HERO-{hid}-<동작>-<방향>.png  예) HERO-{hid}-walk-se.png, HERO-{hid}-attack-n.png',
              f'- 전부 {len(acts) * len(DIRS)}개 파일. 한 번에 어려우면 walk 5개 → attack 5개 → 나머지 순서로 나눠도 됩니다.', '',
              '[돌려주기]', f'- 파일들을 StoryWorld-HERO-{hid}-sheet-날짜.zip 으로 묶어 Google Drive 에 올려 주세요(나눠 만들었으면 -part1, -part2).',
              '- 가능하면 MANIFEST.json(파일 이름·SHA-256·크기)과 README.txt(무엇을 그렸는지·미술 해석)를 같이 넣어 주세요.']
    prompt = '\n'.join(lines) + '\n'
    files['PROMPT-KO.txt'] = prompt.encode('utf-8'); files['SPEC.json'] = (json.dumps(spec, ensure_ascii=False, indent=1) + '\n').encode('utf-8')
    files['README.txt'] = (f'사용법: 이 zip 을 Gemini 에 첨부하고 PROMPT-KO.txt 내용을 붙여 넣으세요.\n순위 {rank}/8 · {ko} · {issue}\n'
                           'reference/ = 지금 게임 그림(대기 앞·뒤·왼쪽·오른쪽, 공격, 스킬). 게임 원본은 바뀌지 않았습니다.\n').encode('utf-8')
    zpath = out / f'StoryWorld-HERO-REF-{rank}-{hid}.zip'
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
        for k in sorted(files): z.writestr(zipfile.ZipInfo(k, (2026, 10, 30, 0, 0, 0)), files[k])
        z.writestr(zipfile.ZipInfo('MANIFEST.json', (2026, 10, 30, 0, 0, 0)), json.dumps({k: {'bytes': len(v), 'sha256': hashlib.sha256(v).hexdigest()} for k, v in sorted(files.items())}, indent=1))
    print(rank, hid, zpath.stat().st_size)
