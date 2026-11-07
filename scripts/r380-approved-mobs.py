#!/usr/bin/env python3
"""R380: 사용자 직접 검수 목록 v18 채택 몹(재 나방 v2, 보랏빛 알집지기 실사풍 v1, 거미줄에 묶인 수호병 검은안개 v4 일반·픽셀,
기계화 망각거미 새 관절형) 파생본 시트. 원본 Drive ZIP 은 읽기 전용, 축소·시트 묶기만 한다.
사용: python3 -I scripts/r380-approved-mobs.py <stage 폴더>"""
import sys, json, hashlib, pathlib
from PIL import Image
ST = pathlib.Path(sys.argv[1]); ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'r96/runtime-text/assets/r380/mobs'; OUT.mkdir(parents=True, exist_ok=True)
RT = ROOT / 'r96/runtime-text'
def sha(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def bbox_h(ims):
    hs = []
    for im in ims:
        a = im.getchannel('A').point(lambda v: 255 if v > 16 else 0); b = a.getbbox()
        if b: hs.append(b[3] - b[1])
    return max(hs)
def old_body(path, cell, n):
    im = Image.open(RT / path).convert('RGBA'); cw, ch = cell
    return bbox_h([im.crop((i * cw, 0, (i + 1) * cw, ch)) for i in range(n)])
def sheet(frames, cols, scale):
    w, h = frames[0].size; cw, ch = round(w * scale), round(h * scale); rows = (len(frames) + cols - 1) // cols
    S = Image.new('RGBA', (cw * cols, ch * rows), (0, 0, 0, 0))
    for i, f in enumerate(frames): S.paste(f.resize((cw, ch), Image.LANCZOS), ((i % cols) * cw, (i // cols) * ch))
    return S, (cw, ch)
def save(S, name):
    p = OUT / (name + '.webp'); S.save(p, 'WEBP', lossless=True, method=6); return p
mobs = []; src = {}
def add(id_, kind, frames, cols, scale, pivot, move, attack, idle, facing, actor, srcfiles, ref):
    S, cell = sheet(frames, cols, scale); p = save(S, id_)
    body = bbox_h(frames) * scale
    vh = round(body * ref, 1)
    mobs.append({'id': id_, 'kind': kind, 'path': 'assets/r380/mobs/' + p.name, 'cell': list(cell), 'cols': cols,
                 'pivot': [round(pivot[0] * scale, 2), round(pivot[1] * scale, 2)], 'visibleHeight': vh, 'move': move, 'attack': attack,
                 'idle': idle, 'facing': facing, 'actor': actor, 'bytes': p.stat().st_size, 'sha256': sha(p),
                 'source': srcfiles, 'finalArt': False})
L = lambda d, names: [Image.open(d / n).convert('RGBA') for n in names]
fr = lambda d, names: [{'file': n, 'sha256': sha(d / n)} for n in names]
# 기존 그림과 화면 크기를 맞추는 비: 예전 몸 높이/150(visibleHeight)
spider_ref = 150 / old_body('assets/r223/mobs/oblivion-spider.webp', (128, 309), 11)
skel_ref = 150 / old_body('assets/r208/mobs/web-bound-skeleton.webp', (130, 183), 11)
# 재 나방 v2 (256x320, 비행 4 + 공격 4)
d = next(ST.glob('x-SW-m002*')) / 'frames'; n = [f'm002-flight-0{i}.png' for i in range(1, 5)] + [f'm002-attack-0{i}.png' for i in range(1, 5)]
add('ash-moth-v2', 'strip', L(d, n), 8, .75, (128, 300), [0, 1, 2, 3], [4, 5, 6, 7], [0], 'right',
    {'layer': 'STORY', 'zone': 'dist01', 'name': '^재 나방'}, fr(d, n), 1.2)  # 화면 확인(R380 스크린샷) 뒤 영웅보다 조금 큰 정도로
# 보랏빛 알집지기 실사풍 v1 (512x512, 이동 4 + 공격 4)
d = next(ST.glob('x-보랏빛*')) / 'purple-eggkeeper-art-v1/frames'; n = [f'dist01-sp2-move-0{i}.png' for i in range(1, 5)] + [f'dist01-sp2-attack-0{i}.png' for i in range(1, 5)]
add('purple-eggkeeper-v1', 'strip', L(d, n), 8, .5, (256, 448), [0, 1, 2, 3], [4, 5, 6, 7], [0], 'right',
    {'layer': 'STORY', 'zone': 'dist01', 'name': '보랏빛 알집지기'}, fr(d, n), spider_ref * 3.0)  # 알 주머니까지 몸이 커서 예전 거미 크기로 줄임
# 거미줄에 묶인 수호병 검은안개 v4 일반·픽셀 (256x512, 이동 6 + 공격 5)
for tag, g in (('', '일반'), ('-pixel', '픽셀')):
    d = next(ST.glob(f'x-수호병*{g}*')) / 'frames'; n = [f'{i:02d}.png' for i in range(11)]
    add('web-bound-guardian-v4' + tag, 'strip', L(d, n), 11, .5, (128, 400), [0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [0], 'right',
        {'layer': 'STORY', 'zone': 'dist01', 'name': '거미줄에 묶인 수호병', 'artMode': 'pixel' if tag else 'painted'}, fr(d, n), skel_ref)
# 기계화 망각거미 새 관절형 (362x362, 이동 6 + 공격 5 + 대기 1)
d = next(ST.glob('x-기계화*')) / 'frames'; n = [f'{i:02d}.png' for i in range(12)]
add('mech-oblivion-spider', 'strip', L(d, n), 6, .75, (181, 278), [0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11], 'right',
    {'layer': 'STORY', 'name': '^기계화 망각거미'}, fr(d, n), spider_ref * 1.6)
idx = {'schema': 'storyworld.r380.approvedmobs/v1', 'revision': 'R380',
       'note': '사용자 직접 검수 목록 v18 채택본 파생(축소·시트 묶기만). 원본 Drive 보존. 피격·사망 전용 그림 없음, GPU·실기기 미검증.',
       'mobs': mobs}
(OUT / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, indent=1))
for m in mobs: print(m['id'], m['cell'], m['visibleHeight'], m['bytes'])
