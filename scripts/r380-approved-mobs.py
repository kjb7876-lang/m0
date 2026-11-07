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
# ── R381: 검수 목록 v18 05·06·17·20·21·22·23 (두 번째 인자 = R381 stage 폴더) ──
def footpivot(frames):
    bs = [f.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox() for f in frames]
    return ((min(b[0] for b in bs) + max(b[2] for b in bs)) / 2, max(b[3] for b in bs))
def add2(id_, d, names, cols, scale, move, attack, idle, actor, fit):
    fs = L(d, names); body = bbox_h(fs) * scale
    add(id_, 'strip', fs, cols, scale, footpivot(fs), move, attack, idle, 'right', actor, fr(d, names), 1 / fit)
if len(sys.argv) > 2:
    S2 = pathlib.Path(sys.argv[2]); M4 = lambda a, b: [f'{a}-0{i}.png' for i in range(1, 5)] + [f'{b}-0{i}.png' for i in range(1, 5)]
    add2('drug-craver-v1', next(S2.glob('x-SW-a10*')) / 'frames', M4('a10-h1-move', 'a10-h1-attack'), 8, 1, [0, 1, 2, 3], [4, 5, 6, 7], [0],
         {'layer': 'STORY', 'zone': 'ep1a10', 'name': '약을 갈망하는 자'}, 1.0)
    add2('blackmarket-suspect-v1', next(S2.glob('x-SW-암시장*')) / 'frames', M4('move', 'attack'), 8, 1, [0, 1, 2, 3], [4, 5, 6, 7], [0],
         {'layer': 'STORY', 'zone': 'ep1a10', 'name': '암시장의 수상한 자'}, 1.0)
    add2('swamp-spirit-v1', next(S2.glob('x-SWAMP*')) / 'frames', M4('hover', 'grasp'), 8, .5, [0, 1, 2, 3], [4, 5, 6, 7], [0],
         {'layer': 'STORY', 'zone': 'dist02', 'name': '늪에서 되살아난 혼령체'}, 1.0)
    F8 = [f'frame-0{i}.png' for i in range(8)]
    add2('swamp-mage-darkgreen-v1', next(S2.glob('x-StoryWorld-swamp-mage*')) / 'mage', F8, 8, .5, [0, 1, 2, 3], [4, 5, 6, 7], [0],
         {'layer': 'STORY', 'zone': 'dist02', 'name': '수렁 주문사'}, 1.0)
    add2('swamp-goat-darkgreen-v1', next(S2.glob('x-StoryWorld-swamp-goat*')) / 'goat', F8, 8, .5, [0, 1, 2, 3], [4, 5, 6, 7], [0],
         {'layer': 'STORY', 'zone': 'dist02', 'name': '늪의 염소머리 악마'}, 1.15)
    add2('reborn-shieldmate-v4', next(S2.glob('x-SW-reborn*')) / 'frames', M4('walk-shuffle', 'spear-thrust') + [f'shield-bash-0{i}.png' for i in range(1, 5)], 6, .5,
         [0, 1, 2, 3], [4, 5, 6, 7], [0], {'layer': 'STORY', 'zone': 'dist04', 'name': '되살아난 방패동료'}, 1.0)
    add2('hospital-surgeon-v1', next(S2.glob('x-SW-hospital*')) / 'frames', M4('short-walk', 'scalpel-thrust'), 8, .5, [0, 1, 2, 3], [4, 5, 6, 7], [0],
         {'layer': 'STORY', 'zone': 'ep1a08', 'name': '^병원 심부의 집도의', 'boss': True}, 1.15)
# ── R382: 검수 목록 v18 3차 (세 번째 인자 = R382 stage 폴더) ──
if len(sys.argv) > 3:
    S3 = pathlib.Path(sys.argv[3]); g = lambda pat: next(S3.glob(pat))
    M4 = lambda a, b: [f'{a}-0{i}.png' for i in range(1, 5)] + [f'{b}-0{i}.png' for i in range(1, 5)]
    A = lambda z, n: {'layer': 'STORY', 'zone': z, 'name': n}
    d = g('x-false-heaven*') / 'false-heaven-guard-whiteblood-v1/frames'
    add2('false-heaven-guard-v1', d, [f'move-0{i}.png' for i in range(8)] + [f'attack-0{i}.png' for i in range(4)], 6, .5, list(range(8)), [8, 9, 10, 11], [0], A('ep1a11', '거짓천국 근위천사'), 1.0)
    add2('treatment-refusal-mask-v1', g('x-SW-treatment*') / 'frames', M4('spectral-hover', 'curse-lunge'), 8, .5, [0, 1, 2, 3], [4, 5, 6, 7], [0], A('ep1a11', '치료거부의 가면'), .9)
    add2('living-trash-v1', g('x-SW-living-trash*') / 'frames', M4('shuffle', 'refuse-strike'), 8, .5, [0, 1, 2, 3], [4, 5, 6, 7], [0], A('ep1b02', '살아 움직이는 쓰레기들'), 1.0)
    add2('jealousy-wraith-v1', g('x-SW-hotel-jealousy*') / 'jealousy-wraith/frames', M4('spectral-glide', 'curse-claw'), 8, .5, [0, 1, 2, 3], [4, 5, 6, 7], [0], A('ep1b03', '질투로 얼룩진 망령'), 1.0)
    add2('mirror-lament-v1', g('x-SW-hotel-lament*') / 'lament/frames', M4('spectral-glide', 'mirror-lament'), 8, .5, [0, 1, 2, 3], [4, 5, 6, 7], [0], A('ep1b03', '추녀의 한탄'), 1.0)
    add2('discarded-delicacy-v1', g('x-SW-discarded*') / 'frames', M4('crawl', 'bite'), 8, .5, [0, 1, 2, 3], [4, 5, 6, 7], [0], A('ep1b04', '버려진 최고급 식재료'), .7)
    F12 = [f'frame_{i:02d}.png' for i in range(1, 13)]
    add2('small-walking-robot-v1', g('x-STORYWORLD-m032*') / 'candidate-v1', F12, 6, 1, list(range(8)), [8, 9, 10, 11], [0], A('ep1b09', '걸어다니는 소형 로봇'), .8)
    add2('snow-lurker-walker-v1', g('x-STORYWORLD-ep1b09*') / 'frames320', M4('move', 'attack'), 8, .8, [0, 1, 2, 3], [4, 5, 6, 7], [0], A('ep1b09', '설원 잠복 보행기'), .9)
    add2('war-machine-hound-v1', g('x-STORYWORLD-m078*') / 'candidate-v1', F12, 6, 1, list(range(8)), [8, 9, 10, 11], [0], A('u201', '전쟁기계사냥개'), .75)
    F8 = [f'frame_{i:02d}.png' for i in range(1, 9)]
    for k, (pat, n, fit) in enumerate([('x-u204-01*', '기계화 첫 기억 청람잔영', 1.0), ('x-u204-02*', '기계화 기억 공백 망령', 1.0),
                                        ('x-u204-03*', '기계화 문턱 관측거미', .7), ('x-u204-04*', '기계화 제12단계 기억 검열기', 1.2)], 1):
        add2(f'u204-mech-0{k}-v1', g(pat), F8, 8, .5, [0, 1, 2, 3], [4, 5, 6, 7], [0], A('u204', n), fit)
    for k, n in ((1, '기계화 기억이주 연결자'), (2, '기계화 공명술사')):
        add2(f'u206-mech-0{k}-v1', g(f'x-SW-u206-0{k}*') / f'u206-0{k}/frames', M4(f'u206-0{k}-move', f'u206-0{k}-attack'), 8, 1, [0, 1, 2, 3], [4, 5, 6, 7], [0], A('u206', n), 1.0)
    d = g('x-SWAMP-ROOT*') / 'frames'
    add2('swamp-root-stalker-darkgreen-v2', d, ['01-idle.png', '02-windup.png', '03-contact.png', '04-recover.png'], 4, .5, [0], [1, 2, 3], [0], A('dist02', '^뿌리 추적자'), 1.0)
idx = {'schema': 'storyworld.r380.approvedmobs/v1', 'revision': 'R382',
       'note': '사용자 직접 검수 목록 v18 채택본 파생(축소·시트 묶기만). 원본 Drive 보존. 피격·사망 전용 그림 없음, GPU·실기기 미검증.',
       'mobs': mobs}
(OUT / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, indent=1))
for m in mobs: print(m['id'], m['cell'], m['visibleHeight'], m['bytes'])
