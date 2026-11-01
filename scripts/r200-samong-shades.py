#!/usr/bin/env python3
"""R200 사몽 일반 몹(잔영·역행·다크판타지 시트) — Drive 2026-11-01 시트 6장(1376×768, 3줄×12칸) → 몹마다 가로 스트립.

사용자 2026-11-01 "적당히 서사에 맞게 이미지 보고 이름 부여해서 배치".
시트는 배경이 불투명한 회색 판이고 몹 이름·프레임 번호·칸 테두리·바닥 그림자가 함께 그려져 있다. 원본은 그대로 두고 파생본만 만든다.
  · 칸(3px 안쪽)마다 테두리에서 배경색을 흘려 채워(허용 22) 지우고, 오른쪽 아래 프레임 번호 자리를 지운다.
  · 바닥 그림자: 배경과 이어진, 칸 아래 30% 안의 무채색·배경보다 어두운 픽셀을 함께 지운다.
  · 12번 칸은 쓰지 않는다(몇 장에 AI 생성 표시 ✦가 있고, 1번과 같은 복귀 자세).
  · 몹 하나의 1~11칸을 같은 상자(합친 알파 상자)로 잘라 몸의 앞뒤 움직임을 살리고, 1번 칸(서 있는 자세) 가시 높이를 150px로 맞춘다.
  · 1~5칸 = 이동/대기, 6~11칸 = 공격(시트 설명 "이동 및 … 공격 사이클" 순서).
Usage: python3 -I scripts/r200-samong-shades.py <sheet dir with 01.png..08.png> r96/runtime-text/assets/r200/shades
       python3 -I scripts/r200-samong-shades.py <sheet dir with 15.png,16.png> r96/runtime-text/assets/r208/mobs story   (R208 스토리 일반몹)
"""
import sys, json, hashlib
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

src, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
ROWS = [(52, 238), (312, 514), (575, 760)]; X0, X1 = 35, 1341; CW = (X1 - X0) / 12; INSET = 3
# R203: 시트 07·08 은 칸 자리가 다르다(07 은 번호가 칸 위, 08 은 칸 밖 위·왼쪽에 번호·줄 이름). 이동 1~6칸, 공격 7~11칸.
LAYOUT = {i: {'rows': ROWS, 'x0': X0, 'x1': X1, 'bottom': 30, 'move': [0, 1, 2, 3, 4], 'attack': [5, 6, 7, 8, 9, 10]} for i in range(1, 7)}
LAYOUT[7] = {'rows': [(78, 272), (328, 524), (573, 764)], 'x0': 23.5, 'x1': 1351, 'bottom': 0, 'teal': True, 'move': [0, 1, 2, 3, 4, 5], 'attack': [6, 7, 8, 9, 10]}
LAYOUT[8] = {'rows': [(58, 241), (299, 488), (547, 729)], 'x0': 57, 'x1': 1353, 'bottom': 0, 'move': [0, 1, 2, 3, 4, 5], 'attack': [6, 7, 8, 9, 10]}
TARGET_H, PAD = 150, 3
# (시트, 줄) → 게임 id·이름·구역. 이름은 시트에 적힌 이름을 그대로 쓰고, 구역은 그림과 사몽 구역 서사로 정했다.
MOBS = [
 (5, 2, 'mannequin', '식탁의 마네킹 잔영', 'S-01', '긴 식탁의 방·찻잔 안의 집 — 의자에 묶인 마네킹'),
 (1, 0, 'stitched-golem', '기운 누더기 골렘', 'S-01', '꿰맨 장미의 집 — 꿰매 붙인 살덩이'),
 (2, 2, 'sun-patrol', '검은 태양의 학교 순찰자', 'S-02', '밤의 출석부 — 학교 순찰'),
 (3, 2, 'paper-child', '면도날 종이 아이', 'S-02', '밤의 출석부 — 종이 아이'),
 (5, 0, 'mono-fighter', '흑백 잔상의 투사', 'S-03', '흑과 백 — 도복 입은 대련자'),
 (5, 1, 'mirror-shade', '관람석 거울의 잔영', 'S-03', '흑과 백 — 관람석 뒤'),
 (3, 0, 'ring-sparrer', '검은 고리의 대련생', 'S-03', '흑과 백 — 검은 고리'),
 (3, 1, 'diner-ghoul', '화형식당 앞치마 식객', 'S-04', '감정의 탑 — 4층 식당'),
 (6, 0, 'applause-shade', '박수치는 객석의 잔영', 'S-04', '감정의 탑 — 10~12층 객석'),
 (4, 1, 'insomnia-patient', '불면병동 무안 환자', 'S-04', '감정의 탑 — 진료풍(clinical) 층'),
 (4, 0, 'gilded-hollow', '금박 박제 망자', 'S-04', '감정의 탑 — 13층 후원자'),
 (6, 2, 'extra-informant', '호외 신문의 밀고자 잔영', 'S-05', '경성의 밤 — 호외·밀고'),
 (6, 1, 'tram-passenger', '물감 철로의 유령 승객', 'S-05', '경성의 밤 — 전차 지나는 술집'),
 (2, 1, 'cephalopod-invader', '두족류 생체기계 침공병', 'S-06', '디스토피아 — 침공 기체'),
 (4, 2, 'clockwork-legionary', '폐선로 태엽 군단병', 'S-06', '디스토피아 — 기계의 반란'),
 (1, 2, 'plague-hound', '변이된 사냥개 괴수', 'S-06', '디스토피아 — 생체 도살장 겸 공장'),
 # R203 시트 07·08 — 사몽역행(제11부) 구역. 시트 이름이 가리키는 장(R-03 시계·R-10 승전식·R-11 낚싯바늘·R-13 일곱 번째 나팔·검은 공방·R-15 제단과 전선)에 둔다.
 (8, 0, 'clockhand-warden', '카이로 회랑의 시계침 수문장 잔영', 'RB', '두 개의 의자와 세 잔의 물 — 멈춘 시계·카이로(수문장) 몹 자리'),
 (7, 0, 'parade-mannequin', '승전식 제복 마네킹 잔영', 'RE', '네 번째 나팔 — 백색 사수의 승전식(훈장·행진)'),
 (7, 1, 'fishhook-manuscript', '낚싯바늘 원고지 망령', 'RF', '다섯 번째 나팔 — 낚싯바늘·원고지'),
 (7, 2, 'empty-sleeve-trumpet', '일곱 나팔의 빈 소매 잔영', 'RG', '일곱 번째 나팔 — 여백의 전쟁'),
 (8, 1, 'furnace-taxidermist', '검은 공방의 용광로 박제공 잔영', 'RG', '일곱 번째 나팔 — 검은 공방의 용광로'),
 (8, 2, 'wire-bound-dead', '검은 제단의 전선 망자 잔영', 'RG', '불탄 책의 뒤편(R-15) — 제단 뒤 전선'),
]
UNUSED = [(1, 1, '저주받은 무덤 기사', '사몽 구역 서사에 맞는 자리가 없어 보류'), (2, 0, '봉합부인', 'S-01 보스 이름이라 일반 몹으로 쓰지 않음')]
# R208 스토리모드 일반몹 시트 15·16(이름표 없음) — 그림을 보고 서사 자리에 맞춰 이름·지역을 정한다. 게임 안 이름은 원래 몹 이름을 그대로 쓰고, 여기 이름은 출처표용.
LAYOUT[15] = {'rows': [(44, 268), (276, 506), (515, 739)], 'x0': 33, 'x1': 1342, 'bottom': 0, 'move': [0, 1, 2, 3, 4, 5], 'attack': [6, 7, 8, 9, 10]}
LAYOUT[16] = {'rows': [(34, 250), (291, 506), (548, 766)], 'x0': 6, 'x1': 1369, 'bottom': 0, 'inset': 10, 'move': [0, 1, 2, 3, 4, 5], 'attack': [6, 7, 8, 9, 10]}
STORY_MOBS = [
 (15, 0, 'root-bound-ghoul', '뿌리에 감긴 망자', 'dist00', '악마화 나무의 정원 — 나무에 침식된 근위(보라 검·검은 날개 타락천사 그림 대체)'),
 (15, 2, 'web-bound-skeleton', '거미줄에 묶인 해골 병사', 'dist01', '거미동굴 — 거미줄에 묶인 수호병'),
 (15, 1, 'twin-head-corpse', '머리 둘 달린 되살아난 시체', 'dist04', '시체들이 되살아난 밤 — 되살아나는 몸'),
 (16, 1, 'halberd-revenant', '미늘창 든 성의 망령 기사', 'dist03', '무너진 성 — 성의 기사'),
 (16, 0, 'ember-hound', '불씨 사냥개', 'dist03', '피냄새 추적자 — 피 냄새를 쫓는 불씨 사냥개'),
]
STORY_UNUSED = [(16, 2, '붉은 눈 우리', '맞는 스토리 자리를 정하지 못해 보류')]
STORY = len(sys.argv) > 3 and sys.argv[3] == 'story'
PREFIX = 'assets/r208/mobs/' if STORY else 'assets/r200/shades/'
if STORY:
    MOBS, UNUSED = STORY_MOBS, STORY_UNUSED


def clean_cell(im, bottom=30, teal=False):
    h, w, _ = im.shape
    border = np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]])
    bg = np.median(border, 0); bgL = bg.mean()
    d = np.abs(im - bg).sum(2); L = im.mean(2); sat = im.max(2) - im.min(2)
    gone = np.zeros((h, w), bool); seen = np.zeros((h, w), bool)
    q = deque([(y, x) for y in range(h) for x in (0, w - 1)] + [(y, x) for x in range(w) for y in (0, h - 1)])
    floor = int(h * .55)
    while q:
        y, x = q.popleft()
        if seen[y, x]: continue
        seen[y, x] = True
        # 07 시트: 칸마다 청록 둥근 조명 배경과 바닥 마름모 격자 — 청록 기운(G·B 가 R 보다 높음)이나 거의 검은 픽셀이면 배경
        #   어두운 청록·검정은 칸 가장자리 18px 안에서만 배경으로 본다(검은 옷자락이 청록 조명을 받아 같이 지워지지 않게)
        edge = min(y, x, h - 1 - y, w - 1 - x) < 18
        ok = d[y, x] <= 22 or (teal and (((im[y, x, 1] - im[y, x, 0] >= 5 and im[y, x, 2] - im[y, x, 0] >= 3) and (L[y, x] >= 24 or edge)) or (L[y, x] <= 14 and edge))) or (y >= floor and sat[y, x] < 12 and bgL - 24 < L[y, x] < bgL - 2)  # 바닥 그림자는 고른 무채색(≈21), 몸의 짙은 그늘(<10)은 남긴다
        if not ok: continue
        gone[y, x] = True
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < h and 0 <= xx < w and not seen[yy, xx]: q.append((yy, xx))
    # 칸마다 위에서 내려오는 1~2px 회색 가는 선(시트 안내선): 위 45% 안에서 가로 폭 2px 이하의 무채색 밝은 회색 픽셀
    for y in range(int(h * .45)):
        row = ~gone[y]; x = 0
        while x < w:
            if row[x]:
                x2 = x
                while x2 < w and row[x2]: x2 += 1
                if x2 - x <= 2 and all(sat[y, k] < 10 and 38 < L[y, k] < 90 for k in range(x, x2)): gone[y, x:x2] = True
                x = x2
            else: x += 1
    if bottom: gone[h - bottom:, :] = True  # 프레임 번호(칸 아래 가운데)와 칸 밑선 — 발은 이보다 위에 있다
    # 작은 외딴 덩어리(위쪽 칸 가는 선, 남은 글자 조각)를 지운다: 60px 미만이면서 칸 위 20%나 아래 35%에 있는 것
    lab = np.zeros((h, w), np.int32); n = 0
    keep = ~gone
    for sy in range(h):
        for sx in range(w):
            if keep[sy, sx] and not lab[sy, sx]:
                n += 1; stack = [(sy, sx)]; lab[sy, sx] = n; pts = []
                while stack:
                    y, x = stack.pop(); pts.append((y, x))
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < h and 0 <= xx < w and keep[yy, xx] and not lab[yy, xx]: lab[yy, xx] = n; stack.append((yy, xx))
                ys = [p[0] for p in pts]
                if len(pts) < 60 and (max(ys) < h * .2 or min(ys) > h * .65):
                    for y, x in pts: gone[y, x] = True
    a = np.where(gone, 0, 255).astype(np.uint8)
    a = np.asarray(Image.fromarray(a).filter(ImageFilter.GaussianBlur(.6)))
    a = np.where(gone & (a < 200), 0, a)  # 안쪽은 그대로, 가장자리만 부드럽게
    return np.dstack([im, a]).astype(np.float32)


def bbox(al):
    ys, xs = np.nonzero(al >= 40); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


rows = []
sheets = {}
for i in sorted({m[0] for m in MOBS}):
    p = src / ('%02d.png' % i); b = p.read_bytes(); sheets[i] = {'file': p.name, 'bytes': len(b), 'sha256': sha(b)}
for sheet, row, gid, name, zone, why in MOBS:
    im = np.asarray(Image.open(src / ('%02d.png' % sheet)).convert('RGB')).astype(int)
    L = LAYOUT[sheet]; y0, y1 = L['rows'][row]; cwid = (L['x1'] - L['x0']) / 12
    cells = []
    for c in range(11):
        ins = L.get('inset', INSET); x0 = int(round(L['x0'] + c * cwid)) + ins; x1 = int(round(L['x0'] + (c + 1) * cwid)) - ins
        cells.append(clean_cell(im[y0 + ins:y1 - ins, x0:x1], L['bottom'], L.get('teal', False)))
    hh = min(c.shape[0] for c in cells); ww = min(c.shape[1] for c in cells)
    cells = [c[:hh, :ww] for c in cells]
    boxes = [bbox(c[..., 3]) for c in cells]
    ux0, uy0 = max(0, min(b[0] for b in boxes) - PAD), max(0, min(b[1] for b in boxes) - PAD)
    ux1, uy1 = min(ww, max(b[2] for b in boxes) + PAD), min(hh, max(b[3] for b in boxes) + PAD)
    vis = float(boxes[0][3] - boxes[0][1]); sc = TARGET_H / vis  # 1번 칸(서 있는 자세) 키 기준 — 기어가는 이동 칸(종이 아이) 때문에 커지지 않게
    cw, ch = round((ux1 - ux0) * sc), round((uy1 - uy0) * sc)
    strip = Image.new('RGBA', (cw * 11, ch), (0, 0, 0, 0))
    for k, c in enumerate(cells):
        cc = c[uy0:uy1, ux0:ux1].copy(); cc[..., :3] *= cc[..., 3:4] / 255
        r = np.asarray(Image.fromarray(cc.clip(0, 255).astype(np.uint8), 'RGBA').resize((cw, ch), Image.LANCZOS)).astype(np.float32)
        aa = r[..., 3:4]; rgb = np.where(aa > 0, r[..., :3] * 255 / np.maximum(aa, 1), 0)
        strip.paste(Image.fromarray(np.concatenate([rgb, aa], -1).clip(0, 255).astype(np.uint8), 'RGBA'), (k * cw, 0))
    nm = len(L['move']); ground = float(np.median([b[3] for b in boxes[:nm]]))
    footx = float(np.median([(b[0] + b[2]) / 2 for b in boxes[:nm]]))
    pivot = [round((footx - ux0) * sc, 2), round((ground - uy0) * sc, 2)]
    fn = gid + '.webp'; dst = out / fn; strip.save(dst, 'WEBP', quality=90, method=6); b = dst.read_bytes()
    rows.append({'id': gid, 'name': name, 'zone': zone, 'why': why, 'path': PREFIX + fn, 'frames': 11, 'move': L['move'], 'attack': L['attack'],
                 'cell': [cw, ch], 'pivot': pivot, 'visibleHeight': TARGET_H, 'facing': 'right', 'bytes': len(b), 'sha256': sha(b),
                 'source': {'sheet': sheets[sheet], 'row': row + 1, 'cells': '1-11 of 12'}})
    print(gid, zone, 'cell', cw, ch, 'pivot', pivot, 'bytes', len(b))
(out / 'index.json').write_text(json.dumps({'schema': 'storyworld.r208.storymobs/v1' if STORY else 'storyworld.r200.shades/v1', 'revision': 'R208' if STORY else 'R200',
    'note': ('Drive 2026-11-01 몹 스프라이트시트 15·16(사용자 업로드) 파생본.' if STORY else 'Drive 2026-11-01 몹 스프라이트시트 01~08(사용자 업로드) 파생본.')+' 배경·번호·그림자를 지우고 1~11칸만 씀. 원본 보존. 최종 아트 확정 아님.',
    'sheets': sheets, 'mobs': rows, 'unused': [{'sheet': s, 'row': r + 1, 'name': n, 'why': w} for s, r, n, w in UNUSED]}, ensure_ascii=False, indent=1))
print(len(rows), 'mobs')
