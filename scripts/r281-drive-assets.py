#!/usr/bin/env python3
"""R281 드라이브 자산 파생본 만들기(원본은 읽기만).

사용: python3 -I scripts/r281-drive-assets.py <드라이브 풀어 둔 폴더(drive-r281)> <r96/runtime-text/assets/r281>
 · 보스 이동6 시트(1536x1024, 3열2행, 512칸) → 6칸 가로 띠(칸 = 6장 합친 알파 상자 + 여백), WebP.
   발 기준점: 칸마다 가장 낮은 불투명 줄(알파>64)을 재서 index.json 에 넣는다(엔진이 칸별 피벗으로 접지).
 · 정원 흙띠: 제공된 512 파생본을 그대로 복사(바이트 동일).
"""
import sys, json, hashlib, shutil
from pathlib import Path
import numpy as np
from PIL import Image

src, out = Path(sys.argv[1]), Path(sys.argv[2])
BK = .75  # 보스 띠 축소 배율(화면 보스 키 ~250px 보다 넉넉, 용량 절반)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
BOSSES = [
    # id, 드라이브 시트 경로, 시트 파일 id, 이름(게임 안), 문서 피벗 x, visibleHeight(문서 제안 공통 축척), 고정 피벗 y(None=칸별 발)
    ('dist00-boss', 'root-sheet/x/root-guardian-walk-v6/dist00-boss-walk6-sheet.png', '1_BLoOLH2ouTWv9ilqEauIbqi_uHq2Q_R', '뿌리의 문지기', 310, 463, None, 130),
    ('mb-ep1a07', 'memory-sheet/x/memory-devourer-v2/sheet.png', '13T2t1XhEzvJ7TQ8xQKnA_g2OLlX-yAET', '무의 기억포식자', 270, 451, 435, 140),
    ('mb-dist02', 'swamp-sheet/x/swamp-demon-v3/sheet.png', '1ftH3yyLm63L-RJ2bIUcqhr4vZL2K5TmG', '늪의 뿔악마 군주', 285, 466, None, 160),
]
index = {'revision': 'R281-drive-1', 'note': '조건부·최종 아님(드라이브 Limited-Candidate/CONDITIONAL). 원본은 드라이브 읽기 전용, 여기는 파생본.', 'bosses': {}, 'patches': {}}
(out / 'bosses').mkdir(parents=True, exist_ok=True)
for bid, rel, fid, name, pvx, vh, fixy, ms in BOSSES:
    p = src / rel
    im = np.array(Image.open(p).convert('RGBA'))
    cells = [im[r*512:(r+1)*512, c*512:(c+1)*512] for r in range(2) for c in range(3)]
    al = np.max([c[..., 3] for c in cells], axis=0) > 8
    ys, xs = np.where(al.any(1))[0], np.where(al.any(0))[0]
    x0, y0, x1, y1 = max(0, xs[0]-4), max(0, ys[0]-4), min(512, xs[-1]+5), min(512, ys[-1]+5)
    w, h = x1-x0, y1-y0
    strip = Image.new('RGBA', (w*6, h), (0, 0, 0, 0))
    feet = []
    for i, c in enumerate(cells):
        strip.paste(Image.fromarray(c[y0:y1, x0:x1]), (i*w, 0))
        m = c[..., 3] > 64; feet.append(int(np.where(m.any(1))[0][-1]) - y0)
    dst = out / 'bosses' / f'{bid}-walk6.webp'
    strip = strip.resize((round(w*BK)*6, round(h*BK)), Image.LANCZOS)
    strip.save(dst, 'WEBP', quality=90, method=6, alpha_quality=100)
    index['bosses'][bid] = {
        'name': name, 'driveSheetId': fid, 'sourceSha256': sha(p), 'sourceBytes': p.stat().st_size,
        'path': 'assets/r281/bosses/' + dst.name, 'bytes': dst.stat().st_size, 'sha256': sha(dst),
        'cell': [round(w*BK), round(h*BK)], 'frames': 6, 'facing': 'right', 'frameMs': ms,
        'pivotX': round((pvx - x0)*BK, 1), 'pivotY': [round(((fixy - y0) if fixy else f)*BK, 1) for f in feet], 'footRows': feet,
        'visibleHeight': round(vh*BK, 1), 'scaleFromSource': BK, 'use': '보스 이동(걷기·부유) 6칸, 기존 공격4·피격·사망 그림은 그대로', 'applied': True,
        'status': '조건부·최종 아님', 'crop': [int(x0), int(y0), int(x1), int(y1)]}
# 정원 흙띠
gd = src / 'garden/x/garden-soil-fringe-outer-fringe-v1'
(out / 'garden').mkdir(exist_ok=True)
dst = out / 'garden' / 'garden-soil-fringe-outer-01.png'; shutil.copyfile(gd / 'runtime512.png', dst)
gz = src / 'garden/StoryWorld-Garden-Soil-Fringe-outer-fringe-v1.zip'
index['patches']['garden-soil-fringe-outer-01'] = {'driveId': '1yNz_aXUA9HsgFpFj43NEZJidGR_l3RlV', 'sourceSha256': sha(gz), 'sourceBytes': gz.stat().st_size,
    'originalPngSha256': sha(gd / 'original.png'), 'path': 'assets/r281/garden/' + dst.name, 'bytes': dst.stat().st_size, 'sha256': sha(dst),
    'use': 'dist00(악마화 나무의 정원) 바닥 데칼 — 기존 garden_soil_paving_transition_01 옆 배치 변형', 'applied': True, 'status': '조건부·최종 아님'}
(out / 'index.json').write_text(json.dumps(index, ensure_ascii=False, indent=1, default=int) + '\n')
print(json.dumps(index, ensure_ascii=False, indent=1, default=int))
