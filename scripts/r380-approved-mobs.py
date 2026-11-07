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
# R383: 검수 목록 v18 19 분노의 사냥개 — "분노 맵 적용"(사용자 2026-11-07 "7대죄 분노의귀청수부나오는곳" = ep1b07). 그 지역 R74 순찰 몹 6마리를 이 이름·그림으로 바꾼다.
if len(sys.argv) > 2:
    add2('wrath-hound-v1', next(S2.glob('x-wrath-hound*')), [f'walk-0{i}.png' for i in range(1, 5)] + [f'attack-0{i}.png' for i in range(1, 5)], 8, .5,
         [0, 1, 2, 3], [4, 5, 6, 7], [0], {'layer': 'STORY', 'zone': 'ep1b07', 'name': '^분노의 사냥개'}, .8)
# R383: dist00(악마화 나무의 정원)으로 옮긴 그냥 뿌리 추적자 — 원래 R74 몹 그림(assets/r74/monsters.png root 4칸)을 같은 크기 칸으로만 다시 묶는다(새 그림 아님).
#  R74 그림 그리기는 좌우 뒤집기를 안 해서(R86 방향 검사) 이 시트로 좌우를 맞춘다. 칸 잘라 둔 폴더를 넷째 인자로 받는다.
if len(sys.argv) > 4:
    add2('root-stalker-r74-plain', pathlib.Path(sys.argv[4]), ['01-idle.png', '02-windup.png', '03-contact.png', '04-recover.png'], 4, .5, [0], [1, 2, 3], [0],
         {'layer': 'STORY', 'zone': 'dist00', 'name': '^뿌리 추적자'}, 1.22)
# R386: 사용자 채택 3종(2026-11-06 직접 검수 "둘다 좋네 적용"·"응 둘다 좋다 적용"·"미적용 흑마술실험체는 03에 적용"). 다섯째 인자 = R386 stage 폴더.
#  m031 제시본 candidate-v1(걷기8·공격4) → ep1b08 육망성의 흑마술 실험체, 유리 망령 v1 → ep1a09 순찰 유리 망령만(R385 가 r74Monster 를 지움),
#  나태 통합 남자 v1 → ep1b02 보스 나태에 잠식된 남자(별도 등짐 몹은 R385 가 살아 움직이는 쓰레기들로 돌림).
if len(sys.argv) > 5:
    S5 = pathlib.Path(sys.argv[5]); g5 = lambda pat: next(S5.glob(pat))
    F12 = [f'frame_{i:02d}.png' for i in range(1, 13)]
    add2('hexagram-experiment-m031-v1', g5('x-STORYWORLD-m031*') / 'candidate-v1', F12, 6, 1, list(range(8)), [8, 9, 10, 11], [0],
         {'layer': 'STORY', 'zone': 'ep1b08', 'name': '육망성의 흑마술 실험체'}, 1.0)
    add2('glass-wraith-v1', g5('x-SW-glass-wraith*') / 'frames', [f'hover-move-0{i}.png' for i in range(1, 5)] + [f'glass-reach-0{i}.png' for i in range(1, 5)], 8, .5,
         [0, 1, 2, 3], [4, 5, 6, 7], [0], {'layer': 'STORY', 'zone': 'ep1a09', 'name': '^유리 망령'}, 1.0)
    add2('sloth-burden-man-v1', g5('x-SW-sloth-burden*') / 'frames', [f'heavy-shuffle-0{i}.png' for i in range(1, 5)] + [f'burden-swipe-0{i}.png' for i in range(1, 5)], 8, .5,
         [0, 1, 2, 3], [4, 5, 6, 7], [0], {'layer': 'STORY', 'zone': 'ep1b02', 'name': '^나태에 잠식된 남자', 'boss': True}, .85)
# R387: 중독을 부르는 주사기 환영체 v1(사용자 채택 "둘다 좋네 적용", 위치 2026-11-07 "병원맵 주사실쪽에 보스가 나오지 않을걸 거기에 넣어줘").
#  여섯째 인자 = R387 stage 폴더. ep1a09 에 approved-mobs-r380.js 가 더하는 중간보스 한 마리에만 붙는다.
if len(sys.argv) > 6:
    S6 = pathlib.Path(sys.argv[6]) / 'frames'
    add2('syringe-phantom-boss-v1', S6, [f'spectral-drift-0{i}.png' for i in range(1, 5)] + [f'syringe-thrust-0{i}.png' for i in range(1, 5)], 8, .5,
         [0, 1, 2, 3], [4, 5, 6, 7], [0], {'layer': 'STORY', 'zone': 'ep1a09', 'name': '^중독을 부르는 주사기 환영체'}, .8)
# R389: 사몽 S-07 대면 '페르소나'(내 얼굴을 쓴 자) 보스 = 지금 고른 영웅의 페르소나 좌측(W) 보행4·공격4.
#  일곱째 인자 = Persona_7heroes_W_20261106 폴더(7영웅), 여덟째 = Slayer_mirrored_PersonaW_PlayerE delivery 폴더(슬레이어 persona-mob-w).
#  사용자 2026-11-07 "페르소나자산 ... 적용". 원본은 축소·시트 묶기만, 색·포즈 그대로. actor.hero = 그 영웅으로 플레이할 때만.
def add3(id_, d, names, cols, scale, actor, fit, facing='left'):
    fs = L(d, names)
    add(id_, 'strip', fs, cols, scale, footpivot(fs), [0, 1, 2, 3], [4, 5, 6, 7], [0], facing, actor, fr(d, names), 1 / fit)
if len(sys.argv) > 8:
    P7 = pathlib.Path(sys.argv[7]) / 'frames'; SL = pathlib.Path(sys.argv[8]) / 'frames/persona-mob-w'
    PA = lambda h: {'layer': 'DREAM', 'name': '^페르소나$', 'boss': True, 'hero': h}
    for h in ('hwando', 'michaela', 'seoha', 'lauren', 'neon', 'hunter', 'gunner'):
        add3('persona-' + h + '-w', P7 / h, [f'walk-w-0{i}.png' for i in range(1, 5)] + [f'attack-w-0{i}.png' for i in range(1, 5)], 8, .5, PA(h), .55)
    add3('persona-slayer-w', SL, [f'walk-0{i}.png' for i in range(1, 5)] + [f'attack-0{i}.png' for i in range(1, 5)], 8, .5, PA('slayer'), .55)
    # 사용자 정정(11-07): 보스 8명(지금 영웅 얼굴) + 페르소나 분신 8종 일반몹. S-07 의 '여섯 물건의 그림자'를 8영웅 얼굴로 고르게 나눈다(같은 시트 재사용, 능력치·수 그대로).
    HEROES8 = ('hwando', 'michaela', 'seoha', 'lauren', 'neon', 'hunter', 'gunner', 'slayer')
    for i, h in enumerate(HEROES8):
        b = next(m for m in mobs if m['id'] == 'persona-' + h + '-w')
        mobs.append({**b, 'id': 'persona-clone-' + h, 'actor': {'layer': 'DREAM', 'name': '^(여섯 물건의 그림자|페르소나 분신)', 'samong': '(^|[^0-9])S-?07([^0-9]|$)', 'slot': [i, 8], 'rename': '페르소나 분신'}})
# ── R390: 디스토피아(사몽 S-06) 승인분. 사용자 11-07 "비승인도 개선해서 적용 버그없이" ──
#  · 일반 '외계 침공군' → 일반몹 3종(낫팔 잠복체·포낭 곡사체·막익 급습체, 이동6·공격6)을 id 끝 번호로 고르게. 수·능력치·AI 그대로.
#  · 정예 '외계 침공군 · 짙은 형상' → 보스형 2종(전선 절단자 짧은 보폭 v4, 심해 연산거수 v1, 이동4·공격4)을 번갈아. 새 스폰 없음.
if len(sys.argv) > 11:
    G3 = pathlib.Path(sys.argv[9]) / 'frames'; CUT = pathlib.Path(sys.argv[10]) / 'frames'; DEEP = pathlib.Path(sys.argv[11]) / 'behemoth/frames'
    S06 = '(^|[^0-9])S-?06([^0-9]|$)'
    GEN = [('scythe', 'walk', '낫팔 잠복체'), ('sacshell', 'walk', '포낭 곡사체'), ('membrane', 'fly', '막익 급습체')]
    for i, (k, mv, nm) in enumerate(GEN):
        names = [f'{k}-{mv}/0{j}.png' for j in range(1, 7)] + [f'{k}-attack/0{j}.png' for j in range(1, 7)]
        add2('dys-' + k + '-v1', G3, names, 12, .4, list(range(6)), list(range(6, 12)), [0],
             {'layer': 'DREAM', 'name': '^(외계 침공군|낫팔 잠복체|포낭 곡사체|막익 급습체)( \\d+)?$', 'samong': S06, 'slot': [i, 3], 'rename': nm}, .85)
    BOSS = [('cleaver-v4', CUT, '전선 절단자'), ('behemoth-v1', DEEP, '심해 연산거수')]
    for i, (k, d, nm) in enumerate(BOSS):
        names = [f'move_0{j}.png' for j in range(1, 5)] + [f'attack_0{j}.png' for j in range(1, 5)]
        add2('dys-' + k, d, names, 8, .5, [0, 1, 2, 3], [4, 5, 6, 7], [0],
             {'layer': 'DREAM', 'name': '^(외계 침공군|전선 절단자|심해 연산거수) · 짙은 형상', 'samong': S06, 'slot': [i, 2], 'rename': nm + ' · 짙은 형상'}, 1.0)
# ── R391: 사몽 승인·후보 모션(같은 사용자 지시). 모두 사몽(DREAM, samongR103 있음)만, 수·능력치 그대로 ──
#  · 포구 검은 안개 m065·부정의 잔영 m066(이동6·공격6), 66 수문장 m097(이동4·공격6): R200 그림자로 안 바뀐 원래 이름 몹.
#  · 봉합부인(S-01 보스, R105 정적 한 장) → 이동4·시전4. 종이 형상(RF) → R109 이동4(PAPER-move) + 새 공격4.
if len(sys.argv) > 13:
    X35 = pathlib.Path(sys.argv[12]) / 'frames'; X24 = pathlib.Path(sys.argv[13]); SAM = '.'
    for mid, nm, mv in (('m065', '포구 검은 안개', 6), ('m066', '부정의 잔영', 6), ('m097', '66 수문장', 4)):
        names = [f'{mid}/move/0{j}.png' for j in range(mv)] + [f'{mid}/attack/0{j}.png' for j in range(6)]
        add2('samong-' + mid + '-v3', X35, names, len(names), .4, list(range(mv)), list(range(mv, mv + 6)), [0],
             {'layer': 'DREAM', 'name': '^(사몽:)?' + nm + '( \\d+)?$', 'samong': SAM}, .9 if mid == 'm097' else .85)
    H = X24 / 'hostess/frames'; names = [f'move_0{j}.png' for j in range(1, 5)] + [f'cast_0{j}.png' for j in range(1, 5)]
    add2('samong-hostess-boss-v1', H, names, 8, .5, [0, 1, 2, 3], [4, 5, 6, 7], [0], {'layer': 'DREAM', 'name': '^봉합부인$', 'boss': True, 'samong': SAM}, 1.0)
    # 종이 형상: R109 이동 4칸(107x153)을 새 공격 칸(543x724) 몸 높이에 맞춰 같은 크기 캔버스에 놓는다(이동은 원래 그림 그대로, 확대만).
    PA = X24 / 'paper-figure/frames'; an = ['attack-01-ready.png', 'attack-02-anticipate.png', 'attack-03-strike.png', 'attack-04-recover.png']
    atk = L(PA, an); W, Hh = atk[0].size; ah = bbox_h(atk); pm = Image.open(RT / 'assets/r109/mobs/PAPER-move.png').convert('RGBA'); cw = pm.width // 4
    mvf = []
    for j in range(4):
        c = pm.crop((j * cw, 0, (j + 1) * cw, pm.height)); b = c.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox(); c = c.crop(b)
        k = ah / c.height; c = c.resize((round(c.width * k), round(c.height * k)), Image.LANCZOS); cv = Image.new('RGBA', (W, Hh), (0, 0, 0, 0))
        cv.paste(c, (254 - c.width // 2, 680 - c.height), c); mvf.append(cv)
    add('samong-paper-figure-v1', 'strip', mvf + atk, 8, .3, (254 * 1.0, 680), [0, 1, 2, 3], [4, 5, 6, 7], [0], 'right',
        {'layer': 'DREAM', 'name': '^종이 형상( \\d+)?$', 'samong': SAM}, [{'file': 'r109/PAPER-move.png', 'sha256': sha(RT / 'assets/r109/mobs/PAPER-move.png')}] + fr(PA, an), 1 / .85)
# ── R392: 사몽 S-06 상대 초인(보스)·적 지휘 개체(구역 우두머리) 고해상도 후보, 열쇠 순찰자(S-02·RA 보스) 공격4 ──
if len(sys.argv) > 14:
    R2 = pathlib.Path(sys.argv[14]); S06 = '(^|[^0-9])S-?06([^0-9]|$)'; MA = [f'move_0{j}.png' for j in range(1, 5)] + [f'attack_0{j}.png' for j in range(1, 5)]
    add2('s06-rival-v1', R2 / 'x23/s06-rival-candidate/frames', MA, 8, .5, [0, 1, 2, 3], [4, 5, 6, 7], [0], {'layer': 'DREAM', 'name': '^상대 초인', 'boss': True, 'samong': S06}, 1.0)
    add2('s06-commander-v1', R2 / 'x23/s06-commander-candidate/frames', MA, 8, .5, [0, 1, 2, 3], [4, 5, 6, 7], [0], {'layer': 'DREAM', 'name': '^적 지휘 (개체|기체)', 'boss': True, 'samong': S06}, .9)
    # 열쇠 순찰자: 걷기 그림은 아직 보류(분할 대기) → R105 정적 한 장을 이동 칸으로, 새 공격 4칸.
    KD = R2 / 'key/frames'; an = [f'attack_0{j}.png' for j in range(1, 5)]; atk = L(KD, an); W, Hh = atk[0].size; ah = bbox_h(atk)
    st = Image.open(RT / 'assets/r105/drive/boss-patroller.webp').convert('RGBA'); st = st.crop(st.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox())
    k = ah / st.height; st = st.resize((round(st.width * k), round(st.height * k)), Image.LANCZOS); fx, fy = footpivot(atk)
    cv = Image.new('RGBA', (W, Hh), (0, 0, 0, 0)); cv.paste(st, (round(fx - st.width / 2), round(fy - st.height)), st)
    add('samong-patroller-boss-v1', 'strip', [cv] + atk, 5, .5, (fx, fy), [0], [1, 2, 3, 4], [0], 'right',
        {'layer': 'DREAM', 'name': '^순찰자$', 'boss': True, 'samong': '.'}, [{'file': 'r105/boss-patroller.webp', 'sha256': sha(RT / 'assets/r105/drive/boss-patroller.webp')}] + fr(KD, an), 1.0)
# ── R393: 사몽역행 RB-6 백색 손님 v4·RC-3 재판관 v4 — 좌우를 따로 그린 시트(뒤집지 않음, twin) ──
if len(sys.argv) > 15:
    R3 = pathlib.Path(sys.argv[15])
    for mid, sub, nm, rg, mv in (('m086', 'x28/RB-6_m086/frames', '^백색 손님', '(^|-)RB-?6([^0-9]|$)', 'walk'), ('m089', 'x26/RC-3_m089/frames', '^재판관$', '(^|-)RC-?3([^0-9]|$)', 'move')):
        d = R3 / sub; ids = {}
        for side in ('right', 'left'):
            names = [f'{mid}_{mv}_{side}_0{j}.png' for j in range(1, 5)] + [f'{mid}_attack_{side}_0{j}.png' for j in range(1, 5)]
            act = {'layer': 'DREAM', 'name': nm, 'boss': True, 'samong': rg} if side == 'right' else {'layer': 'NONE', 'name': '^$'}
            add2(f'reverse-{mid}-v4-{side}', d, names, 8, .4, [0, 1, 2, 3], [4, 5, 6, 7], [0], act, .8)
            if side == 'left': mobs[-1]['facing'] = 'left'
        mobs[-2]['twin'] = mobs[-1]['id']
idx = {'schema': 'storyworld.r380.approvedmobs/v1', 'revision': 'R393',
       'note': '사용자 직접 검수 목록 v18 채택본 파생(축소·시트 묶기만). 원본 Drive 보존. 피격·사망 전용 그림 없음, GPU·실기기 미검증.',
       'mobs': mobs}
(OUT / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, indent=1))
for m in mobs: print(m['id'], m['cell'], m['visibleHeight'], m['bytes'])
