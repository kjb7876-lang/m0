#!/usr/bin/env python3
"""R115: 사몽 구역(서브맵) 데이터 생성기.
원문 문단(samong-text-r103.js)의 위치로 구역마다 들어설 때의 원문(cue)·단서(clues)·대면 진술(statements)·
뒤 장면(after)을 정하고, 각 문단을 '그 문단으로 시작하는 가장 짧은 앞부분(10자 이상)'으로 고정한다.
S-02 학교는 samong-zones-r115.js 에 손으로 그린 파일럿이 있으므로 여기서 만들지 않는다.
맵 수·이름·종류·순서는 설계 문서 "사몽~미카엘라 엔딩 맵 확장 설계안 (R115)" 표를 따른다.
사용: python3 scripts/build-samong-zones.py [samong-text-r103.js] [출력.js]
"""
import sys, json, re

SRC = sys.argv[1] if len(sys.argv) > 1 else 'r96/client-source/samong-text-r103.js'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'r96/client-source/samong-zones-r115-data.js'

raw = open(SRC, encoding='utf-8').read()
m = re.search(r'Object\.freeze\((\{.*\})\);\s*$', raw, re.S)
DATA = json.loads(m.group(1))
SEC = {k: [p for b in v['blocks'] for p in b['paras']] for k, v in DATA['sections'].items()}

def anchor(sec, i):
    ps = SEC[sec]; t = ps[i]
    for L in range(10, len(t) + 1):
        sub = t[:L]
        first = next(j for j, p in enumerate(ps) if p.startswith(sub))
        if first == i:
            return sub
    return t  # R122: 더 긴 앞 문단의 앞부분과 똑같은 짧은 문단(예: ‘도겸’.)은 고유 앞부분이 없다 — 위치 번호 i 로 찾는다

def label(t, lim=18):
    t = re.sub(r'\s+', ' ', t.strip().strip('"“”'))
    cut = re.split(r'[.,?!。…]', t)[0]
    if len(cut) > lim:
        cut = cut[:lim]
        if ' ' in cut[6:]: cut = cut[:cut.rfind(' ')]
        cut += '…'
    return cut

def ref(sec, a, b=None, lab=None):
    b = a if b is None else b
    r = {'key': sec, 'sub': anchor(sec, a), 'i': a, 'n': b - a + 1}
    if lab is not False: r['label'] = lab or label(SEC[sec][a])
    return r

def chunks(a, b, k):
    n = b - a + 1; k = max(1, min(k, n)); out = []; s = a
    for i in range(k):
        size = n // k + (1 if i < n % k else 0); out.append((s, s + size - 1)); s += size
    return out

# 소품(배치 틀 안에 흩어 둠)·단서 소품 — 실내/실외와 문체(style)에 맞춘다.
PROPS = {'clinical': [['cabinet', 3], ['empty-bed', 2], ['workbench', 2]], 'domestic': [['crate', 3], ['cabinet', 2], ['workbench', 2]],
         'forge': [['brazier', 3], ['crate', 3], ['obelisk', 1]], 'garden': [['statue', 2], ['well', 1], ['ferns', 4]],
         'snow': [['stump', 4], ['statue', 1], ['pine', 2]], 'swamp': [['ash-tree', 3], ['stump', 3], ['ferns', 3]],
         'coast': [['statue', 2], ['ferns', 3], ['crate', 2]], 'stone': [['brazier', 2], ['crate', 4], ['statue', 1]],
         'ash': [['ash-tree', 3], ['stump', 4], ['brazier', 1]]}
CLUEPROP = {'clinical': 'cabinet', 'domestic': 'workbench', 'forge': 'crate', 'garden': 'statue', 'snow': 'stump', 'swamp': 'stump',
            'coast': 'crate', 'stone': 'crate', 'ash': 'stump'}
OUT_TPL = {'garden': {'family': 'garden', 'trees': 'living', 'wall': 1}, 'snow': {'family': 'snow', 'trees': 'dead', 'wall': 1},
           'swamp': {'family': 'swamp', 'water': 'swamp', 'trees': 'dead', 'wall': .8}, 'coast': {'family': 'coast', 'water': 'sea', 'trees': None, 'wall': .8},
           'stone': {'family': 'stone', 'trees': None, 'wall': None}, 'ash': {'family': 'ash', 'trees': 'dead', 'wall': 1}}

EP_STYLE = {'P': 'forge', 'S-01': 'domestic', 'S-03': 'garden', 'S-04': 'clinical', 'S-05': 'domestic', 'S-06': 'forge', 'S-07': 'domestic',
            'RA': 'clinical', 'RB': 'domestic', 'RC': 'garden', 'RD': 'forge', 'RE': 'forge', 'RF': 'domestic', 'RG': 'forge', 'M': 'domestic'}
DEF_TPL = {'explore': 'rooms', 'maze': 'grid', 'combat': 'arena', 'confront': 'dais'}

# R122: 최종검수본(2026-10-29)으로 원문을 바꾸면서 장마다 문단 수가 달라졌다. 아래 SPEC 의 문단 번호는 이전 원문(문단 수 OLD_N) 기준으로
# 정해 둔 것이라, 같은 장 안에서 새 문단 수에 비례해 옮긴다(서사 골격은 같고 문장만 늘거나 줄었으므로 구역이 맡는 대목은 그대로 따라간다).
OLD_N = {"prelude": 4, "threshold": 10, "S-01": 19, "S-02": 25, "S-03": 53, "S-04": 37, "S-05": 45, "S-06": 0, "NS-01": 14, "NS-02": 9, "NS-03": 10, "NS-04": 9, "NS-05": 12, "NS-06": 10, "NS-07": 8, "NS-08": 11, "NS-09": 9, "NS-10": 7, "S-07": 19, "R-00": 15, "R-01": 18, "R-02": 16, "R-03": 19, "R-04": 19, "R-05": 16, "R-06": 15, "R-07": 19, "R-08": 15, "R-09": 12, "R-10": 16, "R-11": 16, "R-12": 16, "R-13": 17, "R-14": 12, "R-15": 13, "R-16": 10, "R-17": 9, "M1": 12, "M2": 13, "M3": 7, "epilogue": 16, "record": 25}
def remap(sec, a, b):
    no, nn = OLD_N.get(sec), len(SEC[sec])
    if not no or no == nn: return (sec, a, b)
    na = round(a * nn / no); nb = round((b + 1) * nn / no) - 1
    return (sec, na, max(na, nb))

def Z(t, kind, seg, **o):
    """seg: (sec, a, b) 또는 그 목록. o: tpl, p, out(실외 계열), dark, kills, hold, noMobs, hz, boss, conf, ref, wander, mobs."""
    segs = seg if isinstance(seg, list) else [seg]
    if 'conf' in o:  # 대면 구역의 세부 문단(cue·bossCue·steps·after)도 같은 비율로 옮긴다
        sec = segs[0][0]; c = dict(o['conf'])
        rr = lambda r: remap(sec, r[0], r[1])[1:]
        for k in ('cue', 'steps'):
            if k in c: c[k] = [rr(r) for r in c[k]]
        for k in ('bossCue', 'after'):
            if k in c and c[k] is not None: c[k] = rr(c[k])
        o = {**o, 'conf': c}
    return {'title': t, 'kind': kind, 'seg': [remap(*s) for s in segs], **o}

ROOT = ['dist00', 'dist00-boss']
SPEC = {
 'P': [
  Z('코어 곁의 열린 문', 'explore', [('prelude', 0, 3), ('threshold', 0, 2)], tpl='hall', p={'pillars': 1, 'name': '코어 곁', 'ante': '열린 문 앞'}),
  Z('가장 굵은 뿌리', 'combat', ('threshold', 3, 4), tpl='arena', kills=666,
    lead={'name': '코어 아래의 검은 뿌리', 'donor': ROOT, 'patterns': ['ground', 'sides']}),
  Z('바닥 아래 복도', 'maze', ('threshold', 5, 5), p={'c': 6, 'r': 6}),
  Z('여섯 물건의 계단', 'explore', ('threshold', 6, 9), tpl='tower', p={'floors': 3, 'names': ['계단 아래', '계단참', '여섯 물건의 계단']})],
 'S-01': [
  Z('찻잔 안의 집', 'explore', ('S-01', 0, 0), tpl='yard', p={'name': '찻잔 안의 집'}),
  Z('봉합 정원', 'combat', ('S-01', 1, 1), tpl='yard', out='garden', kills=40, p={'r': 15, 'name': '봉합 정원'}),
  Z('긴 식탁의 방', 'explore', ('S-01', 2, 4), tpl='hall', p={'name': '긴 식탁의 방', 'ante': '복도'}),
  Z('식탁 밑', 'maze', ('S-01', 5, 6), p={'c': 7, 'r': 5}, wall=1.9),
  Z('봉합부인과 찻주전자', 'confront', ('S-01', 7, 18), p={'name': '안주인의 방', 'ante': '식탁 끝'},
    conf={'cue': [(7, 7)], 'bossCue': (8, 8), 'steps': [(9, 10), (11, 12), (13, 13)], 'after': (14, 18), 'word': '매듭',
          'hint': '봉합부인은 HP만으로 끝나지 않습니다 · 둘레의 표식에서 얼굴을 돌려주고 매듭을 끊으세요(E).', 'unlock': '얼굴을 돌려주고 주전자 매듭을 끊어 끝냅니다'})],
 'S-03': [
  Z('검게 물드는 대련장', 'explore', ('S-03', 0, 4), tpl='hall', p={'name': '대련장', 'ante': '탈의실'}),
  Z('입문 시험장', 'combat', ('S-03', 5, 9), tpl='arena', kills=45, p={'name': '입문 시험장'}),
  Z('재인과의 대련', 'combat', ('S-03', 10, 25), tpl='arena', hold=40, noMobs=1, hz={'every': 2.2, 'n': 3, 'dmg': .05}, p={'r': 12, 'name': '대련 매트'}),
  Z('죽음의 시간', 'explore', ('S-03', 26, 34), tpl='hall', p={'pillars': 1, 'name': '멈춘 파편의 장'}),
  Z('스물세 해 전 빗속', 'combat', ('S-03', 35, 43), tpl='street', out='stone', hold=45, p={'len': 46}),
  Z('관람석 뒤 천막', 'maze', ('S-03', 44, 45), out='stone'),
  Z('검은 고리', 'confront', ('S-03', 46, 52), p={'name': '대련장 한가운데'},
    conf={'cue': [(46, 46)], 'bossCue': (47, 47), 'steps': [(48, 48), (49, 49)], 'after': (50, 52), 'word': '틈', 'floor': .5,
          'hint': '검은 고리는 되돌아갈 때만 약해집니다 · 둘레의 표식에서 그 틈을 잡으세요(E).'})],
 'S-04': [
  Z('공터와 창 없는 탑', 'explore', ('S-04', 0, 2), tpl='yard', out='stone', p={'name': '공터'}),
  Z('로비와 번호 없는 우편함', 'explore', ('S-04', 3, 5), tpl='hall', p={'name': '로비', 'ante': '우편함 앞'}),
  Z('4층 지연의 식당', 'combat', ('S-04', 6, 6), tpl='rooms', kills=40, p={'spine': '4층 복도', 'n': 4, 'names': ['식당', '주방', '식당 안쪽', '배식구']}),
  Z('2층 경비실', 'explore', ('S-04', 7, 7), tpl='rooms', p={'spine': '2층 복도', 'n': 3, 'names': ['경비실', '숙직실', '창고']}),
  Z('3층 수아의 서고', 'maze', ('S-04', 8, 8)),
  Z('5층 그림 복도', 'explore', ('S-04', 9, 10), tpl='rooms', p={'spine': '5층 그림 복도', 'n': 4}),
  Z('6층 무너지는 복도', 'combat', ('S-04', 11, 11), tpl='rooms', hold=35, p={'spine': '6층 복도', 'n': 3}),
  Z('7층 지수의 집들', 'maze', ('S-04', 12, 13)),
  Z('8~9층 기록실·계산실', 'explore', ('S-04', 14, 15), tpl='tower', p={'floors': 2, 'names': ['8층 기록실', '9층 계산실']}),
  Z('10~12층 반론·장례·객석', 'combat', ('S-04', 16, 18), tpl='tower', kills=50, p={'floors': 3, 'names': ['10층 반론실', '11층 장례식장', '12층 객석']}),
  Z('13층 후원자', 'confront', ('S-04', 19, 20), p={'name': '13층 후원자실'},
    conf={'bossCue': (19, 19), 'hold': 25, 'after': (20, 20), 'floor': .6, 'done': '능력을 빼앗긴 채 아래층으로 떨어집니다.', 'unlock': '이길 수 없는 대면 · 버티면 아래로 떨어집니다',
          'hint': '강재헌은 여기서 쓰러지지 않습니다 · 버티세요.'}),
  Z('14층 벽 너머 신호', 'maze', ('S-04', 21, 22)),
  Z('15층 감정을 태우는 불', 'combat', ('S-04', 23, 25), tpl='arena', hold=40, p={'name': '15층 불의 방'}),
  Z('16층 의자 열여섯', 'confront', ('S-04', 26, 36), p={'name': '16층 의자 열여섯'},
    conf={'cue': [(26, 26)], 'steps': [(27, 27), (28, 28), (29, 31), (32, 33)], 'after': (34, 36), 'floor': .45, 'word': '배달',
          'hint': '강재헌은 쓰러뜨려 끝내지 않습니다 · 둘레의 의자에서 원을 만드세요(E).', 'unlock': '원을 만들어 배달을 끝냅니다'})],
 'S-05': [
  Z('전차 지나는 술집', 'explore', ('S-05', 0, 7), tpl='hall', p={'name': '술집', 'ante': '문간'}),
  Z('계급장의 거리', 'combat', ('S-05', 8, 12), tpl='street', out='snow', kills=45),
  Z('사무실 책상', 'explore', ('S-05', 13, 19), tpl='rooms', p={'spine': '사무실 복도', 'n': 3, 'names': ['사무실', '서류 창고', '숙직실']}),
  Z('눈 내리는 골목', 'maze', ('S-05', 20, 25), out='snow'),
  Z('불타는 관사', 'combat', ('S-05', 26, 39), tpl='rooms', hold=40, clueN=2, p={'spine': '관사 복도', 'n': 4}),
  Z('불탄 거리', 'confront', ('S-05', 40, 44), out='ash', p={'name': '불탄 거리', 'square': 1},
    conf={'cue': [(40, 40)], 'bossCue': (41, 41), 'steps': [(42, 42)], 'after': (43, 44), 'floor': .5, 'word': '인장',
          'hint': '인장만 지웁니다 · 둘레의 표식에서 E', 'unlock': '교주의 인장만 지우고 기록과 죽음은 남깁니다'})],
 'S-06': [
  Z('폐쇄된 환승역', 'explore', ('NS-01', 0, 9), tpl='station', p={'platform': '폐쇄된 승강장', 'hall': '환승 통로'}),
  Z('무너진 교량', 'combat', ('NS-01', 10, 10), tpl='bridge', out='coast', kills=40),
  Z('만조 요새 중심부', 'confront', ('NS-01', 11, 13), p={'name': '요새 중심부', 'square': 1},
    boss={'name': '만조', 'donor': ['u203', 'u203-boss'], 'patterns': ['rain', 'sides']},
    conf={'bossCue': (11, 11), 'steps': [(12, 12)], 'after': (13, 13), 'floor': .5, 'word': '냉각관', 'hint': '장갑이 아니라 냉각관입니다 · 둘레의 표식에서 E'}),
  Z('2174 해안 공원', 'explore', ('NS-02', 0, 2), tpl='yard', out='coast', p={'name': '바다 위의 공원'}),
  Z('정비 다리와 가로등 포대', 'combat', ('NS-02', 3, 8), tpl='bridge', out='coast', kills=45),
  Z('병원이 된 환승역', 'explore', ('NS-03', 0, 2), tpl='station', p={'platform': '병상이 놓인 승강장', 'hall': '대합실 병동'}),
  Z('봉쇄된 거리와 통신탑', 'combat', ('NS-03', 3, 4), tpl='street', out='stone', kills=45),
  Z('대피 철로', 'confront', ('NS-03', 5, 9), p={'name': '대피 철로', 'square': 1},
    boss={'name': '유예관', 'donor': ['u205', 'u205-mid'], 'patterns': ['sides', 'rain']},
    conf={'bossCue': (5, 5), 'hold': 25, 'steps': [(6, 6)], 'after': (7, 9), 'floor': .55, 'word': '퇴로', 'unlock': '유예관을 물러나게 하고 사람들을 빼냅니다',
          'hint': '유예관은 처치하지 않습니다 · 버틴 뒤 둘레의 표식에서 E'}),
  Z('멈춘 비의 관제소', 'explore', ('NS-04', 0, 8), tpl='rooms', p={'spine': '관제소 복도', 'n': 4}),
  Z('연도가 없는 방', 'explore', ('NS-05', 0, 9), tpl='hall', p={'name': '연도가 없는 방', 'ante': '문 안쪽'}),
  Z('도시의 밑면', 'maze', ('NS-05', 10, 11), dark=1),
  Z('유예관의 문밖', 'confront', ('NS-06', 0, 9), p={'name': '문밖'},
    boss={'name': '유예관', 'donor': ['u205', 'u205-mid'], 'patterns': ['sides', 'ground']},
    conf={'cue': [(0, 0)], 'bossCue': (1, 5), 'steps': [(6, 6), (7, 7)], 'after': (8, 9), 'floor': .5, 'word': '장막',
          'hint': '유예관은 처치하지 않습니다 · 장막 연결부를 둘레의 표식에서 E', 'unlock': '장막 연결부를 쏘고 노란 장갑을 내려놓습니다'}),
  Z('자장가 창문 방들', 'combat', ('NS-07', 0, 7), tpl='rooms', hold=45, clueN=2, p={'spine': '창문 복도', 'n': 5}),
  Z('갈라지는 승강장', 'combat', ('NS-08', 0, 2), tpl='station', kills=50, p={'platform': '갈라지는 승강장', 'hall': '두 도시의 대합실'}),
  Z('달의 눈', 'confront', ('NS-08', 3, 10), p={'name': '달의 안쪽'},
    conf={'cue': [(3, 3)], 'bossCue': (4, 5), 'steps': [(6, 6), (7, 8)], 'after': (9, 10), 'floor': .4, 'word': '조준',
          'hint': '자정의 조준 표시를 끄고 날개가 벌어지는 틈을 노리세요 · 둘레의 표식에서 E'}),
  Z('날짜가 없는 서울', 'explore', ('NS-09', 0, 8), tpl='street', out='stone', p={'len': 44}),
  Z('환승역의 탄피', 'explore', ('NS-10', 0, 6), tpl='station', p={'platform': '환승역 건너편', 'hall': '인쇄 장치 뒤'})],
 'S-07': [
  Z('손님 자리 하나뿐인 식탁', 'explore', ('S-07', 0, 2), tpl='hall', p={'name': '식탁의 방', 'ante': '문 안'}),
  Z('여섯 물건이 비추는 길', 'maze', ('S-07', 3, 6), p={'c': 6, 'r': 6}),
  Z('페르소나', 'confront', ('S-07', 7, 18), p={'name': '내 얼굴을 쓴 자의 식탁', 'square': 1},
    conf={'cue': [(7, 7)], 'bossCue': (8, 8), 'steps': [(9, 11), (12, 12), (13, 14)], 'after': (15, 18), 'floor': .7, 'word': '가면',
          'hint': '페르소나는 벨수록 더 깨끗해집니다 · 가면을 벗어 탁자에 놓으세요(둘레의 표식에서 E).', 'unlock': '처치하지 않습니다 · 가면을 벗고 곁에 앉아 끝냅니다',
          'done': '가면이 탁자 위에 놓였습니다.'})],
 'RA': [
  Z('어제가 도착하는 승강장', 'explore', ('R-00', 0, 4), tpl='station', ref='R00-1', p={'platform': '어제가 도착하는 승강장', 'hall': '미술관 입구'}),
  Z('겹친 풍경의 철로', 'maze', ('R-00', 5, 14), ref='R00-2'),
  Z('도겸의 방·미술관', 'explore', ('R-01', 0, 17), tpl='rooms', ref='R01-1', p={'spine': '미술관 회랑', 'n': 4, 'names': ['도겸의 방', '이젤 앞', '전시실', '전시실 끝']}),
  Z('검은 태양 아래 눈밭 침대', 'combat', ('R-02', 0, 6), tpl='yard', out='snow', hold=40, ref='R02-1', p={'name': '눈밭 침대'}),
  Z('학교 창-병동-정원', 'explore', ('R-02', 7, 15), tpl='rooms', ref='R02-2', p={'spine': '이어진 복도', 'n': 3, 'names': ['학교 창가', '병동', '정원 문']})],
 'RB': [
  Z('두 의자와 세 컵의 대합실', 'explore', ('R-03', 0, 3), tpl='hall', ref='R03-1', p={'name': '대합실', 'ante': '매표소'}),
  Z('성문과 군단', 'combat', ('R-03', 4, 12), tpl='arena', kills=45, clueN=2, ref='R03-2', p={'name': '성문 앞'}),
  Z('성벽 너머와 그림 벽', 'explore', ('R-03', 13, 18), tpl='rooms', ref='R03-3', p={'spine': '성벽 안 길', 'n': 3}),
  Z('화형식당', 'combat', ('R-04', 0, 3), tpl='hall', hold=40, ref='R04-1', p={'name': '화형식당', 'ante': '주방 문'}),
  Z('방화문 두 화재', 'explore', ('R-04', 4, 9), tpl='rooms', ref='R04-2', p={'spine': '방화문 복도', 'n': 3}),
  Z('거울과 백색 손님', 'confront', ('R-04', 10, 18), ref='R04-3', p={'name': '거울의 식탁'},
    boss={'name': '백색 손님', 'donor': ['ep1b06', 'b06-boss'], 'patterns': ['ground', 'sides']},
    conf={'cue': [(10, 11)], 'bossCue': (12, 12), 'steps': [(13, 13), (14, 16)], 'after': (17, 18), 'floor': .5, 'word': '식탁보',
          'hint': '식탁보만 찢습니다 · 식탁 다리는 자르지 않습니다(둘레의 표식에서 E).'})],
 'RC': [
  Z('수직으로 선 대련장', 'combat', ('R-05', 0, 6), tpl='tower', kills=45, ref='R05-1', p={'floors': 3}),
  Z('빗속 골목의 면들', 'explore', ('R-05', 7, 8), tpl='street', out='stone', ref='R05-2'),
  Z('재판관', 'confront', ('R-05', 9, 15), ref='R05-3', p={'name': '재판정', 'square': 1},
    conf={'bossCue': (9, 9), 'steps': [(10, 10), (11, 12)], 'after': (13, 15), 'floor': .5, 'word': '저울',
          'hint': '단상에 오르지 않고 저울을 부숩니다 · 둘레의 표식에서 E'}),
  Z('매달린 탑 샹들리에 계단', 'explore', ('R-06', 0, 1), tpl='tower', ref='R06-1', p={'floors': 3}),
  Z('맘몬의 금고', 'combat', ('R-06', 2, 8), tpl='hall', kills=45, ref='R06-2', p={'name': '금고', 'ante': '금고 문', 'pillars': 1}),
  Z('종이 왕', 'confront', ('R-06', 9, 14), ref='R06-3', p={'name': '종이 왕의 단'},
    boss={'name': '종이 왕', 'donor': ['cult05', 'c105-mid'], 'patterns': ['sky', 'sides']},
    conf={'bossCue': (9, 9), 'steps': [(10, 11), (12, 13)], 'after': (14, 14), 'floor': .5, 'word': '서명칸',
          'hint': '재배치 도장을 막고 서명칸은 비워 둡니다 · 둘레의 표식에서 E'})],
 'RD': [
  Z('붉은 교각·병원 복도 다리', 'explore', ('R-07', 0, 2), tpl='bridge', out='swamp', ref='R07-1'),
  Z('사라지는 문들의 늪', 'maze', ('R-07', 3, 10), out='swamp', ref='R07-2'),
  Z('기우는 집들', 'combat', ('R-07', 11, 18), tpl='street', out='swamp', hold=40, clueN=2, ref='R07-3'),
  Z('스토리텔러의 수업 방', 'explore', ('R-08', 0, 10), tpl='hall', ref='R08-1', p={'name': '수업 방', 'ante': '교실 문'}),
  Z('문 위에 매달린 것들', 'combat', ('R-08', 11, 14), tpl='rooms', hold=35, ref='R08-2', p={'spine': '문이 늘어선 복도', 'n': 4}),
  Z('결말을 먹는 도시', 'combat', ('R-09', 0, 5), tpl='street', out='ash', kills=50, ref='R09-1'),
  Z('발록 기둥과 성당 제단', 'explore', ('R-09', 6, 11), tpl='hall', ref='R09-2', p={'name': '성당 제단', 'ante': '기둥 사이', 'pillars': 1})],
 'RE': [
  Z('객차가 지나는 플랫폼', 'combat', ('R-10', 0, 3), tpl='station', kills=45, ref='R10-1'),
  Z('승전식', 'confront', ('R-10', 4, 15), ref='R10-2', p={'name': '승전식 단상', 'square': 1},
    conf={'bossCue': (4, 5), 'steps': [(6, 7), (8, 9), (10, 11)], 'after': (12, 15), 'floor': .45, 'word': '자리'})],
 'RF': [
  Z('선생님의 빈 얼굴', 'confront', ('R-11', 0, 11), ref='R11-1', p={'name': '빈 교실'},
    conf={'cue': [(0, 0)], 'bossCue': (1, 3), 'steps': [(4, 5), (6, 8), (9, 11)], 'floor': .5, 'word': '함정',
          'hint': '바늘과 의자의 함정을 먼저 풉니다 · 둘레의 표식에서 E'}),
  Z('종이 아이들의 통로', 'combat', ('R-11', 12, 15), tpl='rooms', kills=45, ref='R11-2', p={'spine': '종이 통로', 'n': 4}),
  Z('그림을 그리지 않을 권리', 'explore', ('R-12', 0, 15), tpl='hall', ref='R12-1', p={'name': '빈 화실', 'ante': '이젤 뒤'})],
 'RG': [
  Z('겹친 밤의 전장', 'combat', ('R-13', 0, 4), tpl='arena', out='ash', hold=40, ref='R13-1', p={'kind': 'yard'}),
  Z('기둥 고리 안 연결들', 'maze', ('R-13', 5, 10), ref='R13-2'),
  Z('스토리텔러의 마지막 선', 'confront', ('R-13', 11, 16), ref='R13-3', p={'name': '마지막 선'},
    boss={'name': '스토리텔러', 'donor': ['cult03', 'c103-boss'], 'patterns': ['sides', 'ground', 'rain']},
    conf={'bossCue': (11, 12), 'steps': [(13, 13), (14, 14)], 'after': (15, 16), 'floor': .5, 'word': '획',
          'hint': '붉은 획만 자르고 일곱 번째 서명은 거부합니다 · 둘레의 표식에서 E'}),
  Z('도겸의 작업실·갈림길', 'explore', ('R-14', 0, 11), tpl='rooms', ref='R14-1', p={'spine': '갈림길', 'n': 4}),
  Z('교주의 빈 제단과 파란불 웅덩이', 'explore', ('R-15', 0, 4), tpl='hall', ref='R15-1', p={'name': '빈 제단', 'ante': '웅덩이 곁'}),
  Z('두 사람의 성', 'explore', ('R-15', 5, 6), tpl='tower', ref='R15-2', p={'floors': 2}),
  Z('카이로 회랑', 'maze', ('R-15', 7, 12), ref='R15-3', stealth=1,
    patrol={'name': '66 수문장', 'donor': ['kair04', 'kair-guardian-01'], 'sleep': 1, 'count': 6}),
  Z('두 줄 발자국 설원·호텔 재방문', 'explore', ('R-16', 0, 3), tpl='street', out='snow', ref='R16-1'),
  Z('열네 등 병동과 빈 캡슐', 'maze', ('R-16', 4, 9), dark=1, ref='R16-2'),
  Z('처음의 정원', 'explore', ('R-17', 0, 4), tpl='yard', out='garden', ref='R17-1', p={'name': '처음의 정원'}),
  Z('상담실 액자', 'explore', ('R-17', 5, 8), tpl='hall', ref='R17-2', p={'name': '상담실', 'ante': '복도'})],
 'M': [
  Z('상담실로 밀려온 성벽', 'confront', ('M1', 0, 11), p={'name': '상담실로 밀려온 성벽', 'square': 1},
    conf={'cue': [(0, 0)], 'bossCue': (1, 2), 'steps': [(3, 5), (6, 8), (9, 10), (11, 11)], 'floor': .7, 'word': '매듭',
          'hint': '미카엘라는 처치하지 않습니다 · 둘레의 표식에서 문을 돌려주고 매듭을 끊으세요(E).', 'unlock': '처치하지 않습니다 · 문을 돌려주고 손목 매듭을 끊습니다',
          'done': '손목의 매듭이 풀렸습니다.'}),
  Z('남의 밤의 방들', 'maze', ('M2', 0, 12)),
  Z('돌아갈 사람의 문', 'explore', ('M3', 0, 6), tpl='hall', p={'name': '돌아갈 사람의 문', 'ante': '귀환길'}),
  Z('종장 병실', 'explore', ('epilogue', 0, 15), tpl='rooms', noMobs=1, p={'spine': '병동 복도', 'n': 3, 'names': ['병실', '상담실', '간호사실']})],
}

def build(ep, n, z):
    k = ep.replace('-', '')
    style = EP_STYLE[ep]
    o = {'id': f'sz115-{k}-{n}', 'title': z['title'], 'kind': z['kind'], 'style': style, 'tpl': z.get('tpl') or DEF_TPL[z['kind']], 'p': z.get('p') or {}}
    if z.get('ref'): o['ref'] = z['ref']
    if ep == 'P':  # 문턱: 뿌리에서 쏟아진 잔영(S-01 과 같은 그림)
        o['mobs'] = [['ep1a10', 'a10-s1'], ['last302', 'l302-e1']]; o['mobName'] = '뿌리에서 쏟아진 잔영'
    fam = z.get('out')
    if fam: o['outdoor'] = OUT_TPL[fam]
    pal = fam or style
    if z.get('dark'): o['dark'] = True
    if z.get('noMobs'): o['noMobs'] = True
    if z.get('stealth'): o['stealth'] = True
    if z.get('patrol'):
        o['patrol'] = z['patrol']; o['patrol']['spotted'] = None
    if z.get('wall'):
        o['p'] = {**o['p'], 'wall': z['wall']}
    o['props'] = PROPS[pal]
    used = []
    def take(sec, a, b, lab=None):
        used.extend((sec, i) for i in range(a, b + 1)); return ref(sec, a, b, lab)
    segs = z['seg']; kind = z['kind']; clues = []; cue = []; after = []
    cp = CLUEPROP[pal]
    if kind == 'confront':
        sec, a, b = segs[0]; c = z['conf']
        for (x, y) in c.get('cue', []): cue.append(take(sec, x, y, False))
        if c.get('bossCue'): o['bossCue'] = take(sec, *c['bossCue'], lab=False)
        st = [take(sec, x, y) for (x, y) in c.get('steps', [])]
        for s in st: s['label'] = (c.get('word') or '진술') + ' · ' + s['label']
        if c.get('after'): after.append(take(sec, *c['after'], lab=False))
        sol = {'statements': st, 'floor': c.get('floor', .5)}
        for key in ('hold', 'word', 'hint', 'unlock', 'done'):
            if c.get(key) is not None: sol[key] = c[key]
        o['solve'] = sol
        if z.get('boss'): o['boss'] = z['boss']
        o['p'] = {**o['p']}
    else:
        for si, (sec, a, b) in enumerate(segs):
            first = si == 0
            if kind == 'explore':
                if first and b > a: cue.append(take(sec, a, a, False)); a += 1
                for (x, y) in chunks(a, b, 4 if len(segs) == 1 else 2): clues.append(take(sec, x, y))
            elif kind == 'maze':
                cue.append(take(sec, a, a, False))
                if b > a:
                    mid = (a + 1, b - 1)
                    if mid[1] >= mid[0]:
                        for (x, y) in chunks(mid[0], mid[1], 3): clues.append(take(sec, x, y))
                    after.append(take(sec, b, b, False))
            else:
                cue.append(take(sec, a, a, False)); a += 1
                if b >= a:
                    for (x, y) in chunks(a, b, z.get('clueN', 2)): clues.append(take(sec, x, y))
        for i, cl in enumerate(clues):
            cl['prop'] = cp
            if i and kind == 'explore': cl['after'] = i - 1
        g = {}
        if kind == 'explore': g = {'clues': True}
        elif kind == 'maze': g = {'reach': True}
        else:
            if z.get('kills'): g['kills'] = z['kills']
            if z.get('hold'): g['hold'] = z['hold']
            if clues: g['clues'] = True
        o['goal'] = g
        if kind == 'combat' and z.get('hz'): o['hazards'] = z['hz']
        if z.get('lead'): o['lead'] = z['lead']
        if kind == 'explore' and not z.get('noMobs'): o['wander'] = {'cap': 3, 'every': 12}
        if kind == 'maze': o['mobCap'] = 3 if z.get('stealth') else 5; o['mobEvery'] = 9 if z.get('stealth') else 6
    if cue: o['cue'] = cue
    if clues: o['clues'] = clues
    if after: o['after'] = after
    # 범위 안 모든 문단이 한 번씩 쓰였는지 확인
    want = [(s, i) for (s, a, b) in segs for i in range(a, b + 1)]
    if sorted(used) != sorted(want):
        raise SystemExit(f"{o['id']} 문단 누락/중복: {sorted(set(want) ^ set(used))[:6]}")
    return o, want

chapters = {}; cover = {}
for ep, zs in SPEC.items():
    chapters[ep] = []
    for n, z in enumerate(zs, 1):
        o, want = build(ep, n, z); chapters[ep].append(o)
        for s, i in want: cover.setdefault(s, []).append(i)
# 장마다 원문 문단을 빠짐없이, 겹치지 않게, 순서대로 썼는지
for s, ids in cover.items():
    if ids != list(range(len(SEC[s]))): raise SystemExit(f'{s} 문단 덮기 오류: {ids[:5]}… / {len(SEC[s])}')
missing = [s for s in SEC if s not in cover and s not in ('S-02', 'S-06', 'record')]
if missing: raise SystemExit('구역이 없는 원문 구간: ' + ', '.join(missing))

total = sum(len(v) for v in chapters.values())
js = ('/* R115: 사몽 구역 데이터 — scripts/build-samong-zones.py 가 samong-text-r103.js 문단 위치로 만든 파일입니다. 손으로 고치지 마세요.\n'
      ' * 원문 sha256 ' + DATA.get('sha256', '')[:16] + '…, 구역 ' + str(total) + '개(S-02 파일럿 8개는 samong-zones-r115.js). */\n'
      'window.__STORYWORLD_SAMONG_ZONES_R115_DATA__=Object.freeze(' + json.dumps({'source': DATA.get('source'), 'sha256': DATA.get('sha256'), 'chapters': chapters}, ensure_ascii=False, separators=(',', ':')) + ');\n')
open(OUT, 'w', encoding='utf-8').write(js)
print(f'{OUT}: {total} zones', {k: len(v) for k, v in chapters.items()})
