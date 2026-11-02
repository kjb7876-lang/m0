#!/usr/bin/env python3
"""R223 최근 몹 시트(Drive 2026-11-02 '합일몽세_2.5D_스토리모드_일반몹_스프라이트시트_21~28', 1376×768) → 몹마다 가로 스트립.

사용자 2026-11-02 "최근몹들"(+ 2026-11-01 "몹자산 10프레임 이상되는거 위주로 교체"). R200/R208 과 같은 방법(scripts/r200-samong-shades.py 의 clean_cell 복사)으로
배경·번호·그림자를 지우고, 이름이 게임 안 몹 이름과 맞는 것만 그 몹 그림으로 쓴다(이름·판정·체력·공격·보상은 그대로).
  · 시트 21·22·23·25·27: 3줄×12칸. 1~6칸 이동, 7~11칸 공격, 12칸은 쓰지 않는다(복귀 자세, 몇 장은 AI 생성 표시 ✦).
  · 시트 24·26·28: 3줄×16칸(01,02,02,03,03,04,05,06, 빈칸, 07,08,09,10,11,11,12). 앞 8칸 이동, 빈칸 다음 6칸 공격, 마지막 12 는 쓰지 않는다.
  · ✦ 표시가 남은 칸은 SKIP 으로 뺀다(눈으로 확인한 칸).
Usage: python3 -I scripts/r223-drive-mobs.py <dir with sheet21.png..sheet28.png> r96/runtime-text/assets/r223/mobs
"""
import sys, json, hashlib
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

src, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
TARGET_H, PAD, INSET = 150, 3, 6
def even(x0, x1, n): w = (x1 - x0) / n; return [(x0 + i * w, x0 + (i + 1) * w) for i in range(n)]
CARDS21 = [(15, 123), (132, 236), (238, 349), (353, 454), (464, 573), (577, 687), (691, 801), (807, 914), (920, 1018), (1034, 1137), (1147, 1245), (1251, 1358)]
CARDS23 = [(21, 128), (133, 240), (245, 351), (354, 462), (468, 574), (576, 685), (691, 797), (801, 908), (914, 1020), (1025, 1132), (1137, 1243), (1251, 1355)]
L12A = {'rows': [(40, 247), (303, 499), (556, 758)], 'cols': CARDS21, 'move': list(range(6)), 'attack': list(range(6, 11))}
L12B = {'rows': [(38, 229), (289, 478), (543, 741)], 'cols': CARDS23, 'move': list(range(6)), 'attack': list(range(6, 11))}
L16 = {'rows': [(35, 225), (298, 486), (552, 735)], 'cols': even(31, 1345, 16), 'move': list(range(8)), 'attack': list(range(9, 15))}
LAYOUT = {21: L12A, 22: {**L12A, 'rows': [(8, 249), (266, 499), (515, 762)]}, 23: L12B, 25: L12B, 27: {**L12B, 'rows': [(38, 229), (295, 478), (549, 741)]}, 24: L16, 26: L16, 28: L16}
# (시트, 줄, id, 시트 이름, 지역, 게임 안 몹 이름 정규식, 왜)
MOBS = [
 (22, 0, 'oblivion-spider', '(이름표 없음) 회오리 거미', 'dist01', '망각의 거미', '거미동굴 — 망각의 거미(한 장 그림 → 12칸)'),
 (21, 1, 'thread-nurse', '실타래 간호사 영령', 'ep1a09', '주사실 감시환각', '주사실 — 병원 감시환각을 간호사 영령으로'),
 (26, 1, 'vial-collector', '폐병동의 유리 약병 수집가', 'ep1a09', '갈망의 약병핵', '주사실 — 약병'),
 (23, 1, 'curtain-mannequin', '색욕의 붉은 커튼 마네킹', 'ep1b05', '얼굴 없는 남자의 박수', '붉은 하이힐 무대 — 얼굴 없는 객석'),
 (25, 1, 'ash-mason', '무너진 성곽의 잿빛 석공', 'hando01', '성벽 침식 봉인병', '성 안 — 무너지는 성벽'),
 (21, 2, 'signal-golem', '영원의 녹색 신호등 골렘', 'murder01', '빗속 횡단보도의 기억 잔향', '파란불 아래 횡단보도'),
 (27, 1, 'censer-priest', '잿더미 예배당의 향로 사제', 'cult01', '흑장미 귀막은 신도', '사이비 예배당 신도'),
 (25, 2, 'superego-inquisitor', '초자아의 눈동자 심문관', 'cult06', '기계재판 연결자', 'SUPER EGO 의 기계재판'),
 (27, 0, 'clockwork-sentinel', '태엽 심장의 파수병', 'kair01', '최초명령 훈련파동', '카이로노미콘 — 시간·태엽'),
]
# 그림이 보는 쪽(몬타주로 눈으로 확인). 엔진은 오른쪽을 기준으로 뒤집으므로 left 는 반대로 뒤집는다.
FACING = {"oblivion-spider": "right", "thread-nurse": "left", "vial-collector": "left", "curtain-mannequin": "left", "ash-mason": "left", "signal-golem": "left", "censer-priest": "left", "superego-inquisitor": "right", "clockwork-sentinel": "left"}
SKIP = {(26, 1): [13, 14]}  # (시트, 줄) → 뺄 칸 번호(0부터). 약병 수집가 마지막 두 칸은 몸이 사라지고 이펙트만 남아 뺀다


def clean_cell(im, bottom=0, teal=False):
    """R223 카드 판(비네트 그라데이션 회색) 지우기: 가장자리에서 시작해 이웃과 색이 조금씩만 변하는(합 ≤ 16) 저채도 픽셀을 따라 흘려 지운다.
    그 뒤 몸통(가장 큰 덩어리)의 2% 보다 작은 조각은 버린다(칸 아래 프레임 번호, 테두리 부스러기). 바닥 그림자도 판과 이어져 함께 지워진다."""
    h, w, _ = im.shape
    L = im.mean(2); sat = im.max(2) - im.min(2)
    gone = np.zeros((h, w), bool)
    q = deque()
    RING = 8  # 칸 자르기가 카드 테두리 위에 걸려도 판 안쪽에서 흘리기를 시작하도록 가장자리 8px 띠의 판 색 픽셀을 씨앗으로
    for y in range(h):
        for x in range(w):
            if min(y, x, h - 1 - y, w - 1 - x) < RING and (min(y, x, h - 1 - y, w - 1 - x) == 0 or (sat[y, x] < 38 and L[y, x] < 120)):
                gone[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft(); c = im[y, x]
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < h and 0 <= xx < w and not gone[yy, xx]:
                if np.abs(im[yy, xx] - c).sum() <= 16 and sat[yy, xx] < 38 and L[yy, xx] < 120:
                    gone[yy, xx] = True; q.append((yy, xx))
    keep = ~gone; lab = np.zeros((h, w), np.int32); n = 0; sizes = {}; spans = {}
    for sy in range(h):
        for sx in range(w):
            if keep[sy, sx] and not lab[sy, sx]:
                n += 1; st = [(sy, sx)]; lab[sy, sx] = n; cnt = 0; ymin = sy; ymax = sy
                while st:
                    y, x = st.pop(); cnt += 1; ymin = min(ymin, y); ymax = max(ymax, y)
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < h and 0 <= xx < w and keep[yy, xx] and not lab[yy, xx]: lab[yy, xx] = n; st.append((yy, xx))
                sizes[n] = cnt; spans[n] = (ymin, ymax)
                ys_, xs_ = np.nonzero(lab == n); spans[n] = (ys_.min(), ys_.max(), xs_.min(), xs_.max())
    if sizes:
        big = max(sizes.values()); bk = max(sizes, key=sizes.get); body_bottom = spans[bk][1]
        for k, cnt in sizes.items():
            y0, y1, x0, x1 = spans[k]
            thin = (x1 - x0) <= 3 or (y1 - y0) <= 3  # 카드 테두리 조각
            below = y0 > body_bottom - 2 and cnt < big * .15  # 몸 아래 프레임 번호
            if k != bk and (cnt < big * .02 or thin or below or (y0 > h * .8 and cnt < big * .08)): gone[lab == k] = True
    a = np.where(gone, 0, 255).astype(np.uint8)
    a = np.asarray(Image.fromarray(a).filter(ImageFilter.GaussianBlur(.6)))
    a = np.where(gone & (a < 200), 0, a)
    return np.dstack([im, a]).astype(np.float32)


def bbox(al):
    ys, xs = np.nonzero(al >= 40); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


rows, sheets = [], {}
for s in sorted({m[0] for m in MOBS}):
    p = src / ('sheet%02d.png' % s); b = p.read_bytes(); sheets[s] = {'file': '합일몽세_2.5D_스토리모드_일반몹_스프라이트시트_%02d.png' % s, 'bytes': len(b), 'sha256': sha(b)}
for sheet, row, gid, sname, zone, game, why in MOBS:
    im = np.asarray(Image.open(src / ('sheet%02d.png' % sheet)).convert('RGB')).astype(int)
    L = LAYOUT[sheet]; y0, y1 = L['rows'][row]; skip = set(SKIP.get((sheet, row), []))
    want = [k for k in L['move'] + L['attack'] if k not in skip]
    cells = []
    for k in want:
        cx0, cx1 = L['cols'][k]; x0 = int(round(cx0)) + INSET; x1 = int(round(cx1)) - INSET
        cells.append(clean_cell(im[y0 + INSET:y1 - INSET, x0:x1], 0, False))
    hh = min(c.shape[0] for c in cells); ww = min(c.shape[1] for c in cells)
    cells = [c[:hh, :ww] for c in cells]
    boxes = [bbox(c[..., 3]) for c in cells]
    ux0, uy0 = max(0, min(b[0] for b in boxes) - PAD), max(0, min(b[1] for b in boxes) - PAD)
    ux1, uy1 = min(ww, max(b[2] for b in boxes) + PAD), min(hh, max(b[3] for b in boxes) + PAD)
    vis = float(boxes[0][3] - boxes[0][1]); sc = TARGET_H / vis
    cw, ch = round((ux1 - ux0) * sc), round((uy1 - uy0) * sc)
    strip = Image.new('RGBA', (cw * len(cells), ch), (0, 0, 0, 0))
    for k, c in enumerate(cells):
        cc = c[uy0:uy1, ux0:ux1].copy(); cc[..., :3] *= cc[..., 3:4] / 255
        r = np.asarray(Image.fromarray(cc.clip(0, 255).astype(np.uint8), 'RGBA').resize((cw, ch), Image.LANCZOS)).astype(np.float32)
        aa = r[..., 3:4]; rgb = np.where(aa > 0, r[..., :3] * 255 / np.maximum(aa, 1), 0)
        strip.paste(Image.fromarray(np.concatenate([rgb, aa], -1).clip(0, 255).astype(np.uint8), 'RGBA'), (k * cw, 0))
    nmove = len([k for k in L['move'] if k not in skip]); move = list(range(nmove)); attack = list(range(nmove, len(cells)))
    ground = float(np.median([b[3] for b in boxes[:nmove]])); footx = float(np.median([(b[0] + b[2]) / 2 for b in boxes[:nmove]]))
    pivot = [round((footx - ux0) * sc, 2), round((ground - uy0) * sc, 2)]
    fn = gid + '.webp'; dst = out / fn; strip.save(dst, 'WEBP', quality=90, method=6); b = dst.read_bytes()
    rows.append({'id': gid, 'name': sname, 'zone': zone, 'game': game, 'why': why, 'path': 'assets/r223/mobs/' + fn, 'frames': len(cells), 'move': move, 'attack': attack,
                 'cell': [cw, ch], 'pivot': pivot, 'visibleHeight': TARGET_H, 'facing': FACING.get(gid, 'right'), 'bytes': len(b), 'sha256': sha(b),
                 'source': {'sheet': sheets[sheet], 'row': row + 1, 'cells': [k + 1 for k in want]}})
    print(gid, zone, 'frames', len(cells), 'cell', cw, ch, 'pivot', pivot, 'bytes', len(b))
(out / 'index.json').write_text(json.dumps({'schema': 'storyworld.r208.storymobs/v1', 'revision': 'R223',
    'note': 'Drive 2026-11-02 일반몹 스프라이트시트 21~28(사용자 업로드) 파생본. 배경·번호·그림자를 지우고 마지막(복귀) 칸과 ✦ 칸은 쓰지 않음. 원본 시트는 저장소에 넣지 않음(해시만). 임시 파생본 — 최종 아트 확정 아님.',
    'sheets': sheets, 'mobs': rows}, ensure_ascii=False, indent=1))
print(len(rows), 'mobs')
