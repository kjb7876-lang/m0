#!/usr/bin/env python3
"""R436 환도 아래(남향) 걷기 v2 적용 — 사용자 2026-11-09 "이거 일관성있게 개선해서 환도영웅 아래이동모션으로 적용해줘".

원천(읽기 전용): Drive 'Hwando-walk-S-v2-slim-review-20261109.zip' (frames/walk-s-00..05.png, 192×256 칸, 등록점 96,226, 6키 120ms).
다른 방향(R271 걷기 N/E/W·R283 색)과 맞추는 것 — 그림 모양은 바꾸지 않는다(클립 전체에 한 번의 등비 배율·자르기·가장자리 정리·색 곡선만):
 1) 몸 키: R271 과 같은 측정(접지선 중앙값 − 몸 중심 ±40px 열 머리 꼭대기 중앙값)으로 180px 가 되게 한 번 줄인다(premultiplied LANCZOS).
 2) 발 기준점: x = 원천 등록점 96 × 배율, y = 줄인 뒤 접지선 중앙값(R271 과 같은 규칙).
 3) 가장자리: 알파<6 → 0.
 4) 색: R283 목표(R271 걷기 4방향 평균 밝기 p10/p50/p90·채도·채널 비)에 r283-hwando-color.py 의 fix() 로 맞춘다.
 5) 6칸 합집합으로 잘라 한 줄 아틀라스 WebP 무손실.
 6) 보폭: 6칸 = 두 걸음(원천 README: 왼발 전진→복귀→모임→오른발 전진→복귀→모임) → frames_per_stride=6.
사용: python3 -I scripts/r436-hwando-walk-s.py <zip 을 푼 폴더> <zip 경로>
"""
import sys, os, json, glob, hashlib, importlib.util
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(HERE, '..', 'r96', 'runtime-text', 'assets')
OUT = os.path.join(R, 'r436', 'hwando')
BODY = 180.0
spec = importlib.util.spec_from_file_location('r283', os.path.join(HERE, 'r283-hwando-color.py')); C = importlib.util.module_from_spec(spec); spec.loader.exec_module(C)
spec = importlib.util.spec_from_file_location('r271', os.path.join(HERE, 'r271-hwando-build.py')); B = importlib.util.module_from_spec(spec); spec.loader.exec_module(B)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()

def main(src, zp):
    man = json.load(open(os.path.join(src, 'manifest.json')))
    files = sorted(glob.glob(os.path.join(src, 'frames', 'walk-s-*.png')))
    assert len(files) == man['frames'] == 6
    cells = [Image.open(f).convert('RGBA') for f in files]
    for f, c, st in zip(files, cells, man['frame_stats']):  # manifest 의 sha256 은 RGBA 픽셀 바이트 해시
        assert hashlib.sha256(c.tobytes()).hexdigest() == st['sha256'], f
    bots, tops, _ = B.measure(cells)
    body0 = float(np.median(bots - tops)); s = BODY / body0
    W0, H0 = cells[0].size; nw, nh = round(W0 * s), round(H0 * s)
    sc = [B.clean(c.convert('RGBa').resize((nw, nh), Image.LANCZOS).convert('RGBA')) for c in cells]
    b2, t2, _ = B.measure(sc)
    box = None
    for c in sc:
        bb = c.getbbox(); box = bb if box is None else (min(box[0], bb[0]), min(box[1], bb[1]), max(box[2], bb[2]), max(box[3], bb[3]))
    box = (max(0, box[0] - 2), max(0, box[1] - 2), min(nw, box[2] + 2), min(nh, box[3] + 2))
    cw, ch = box[2] - box[0], box[3] - box[1]
    A = Image.new('RGBA', (6 * cw, ch), (0, 0, 0, 0))
    for i, c in enumerate(sc):
        A.paste(c.crop(box), (i * cw, 0))
    # 색: R283 목표
    tgt = json.load(open(os.path.join(R, 'r283', 'hwando', 'index.json')))['target']
    a = np.array(A).astype(np.float64) / 255; before = C.measure(a); b = C.fix(a, before, tgt); after = C.measure(b)
    A = Image.fromarray((b * 255 + .5).astype(np.uint8), 'RGBA')
    os.makedirs(OUT, exist_ok=True); p = os.path.join(OUT, 'walk-s.webp'); A.save(p, 'WEBP', lossless=True, method=6)
    raw = open(p, 'rb').read()
    rec = dict(file='walk-s.webp', n=6, cols=6, cell=[cw, ch], atlas=list(A.size), ms=[man['preview_ms']] * 6,
               anchor=[round(man['anchor'][0] * s - box[0], 1), float(np.median(b2)) - box[1]], body=round(float(np.median(b2 - t2)), 1),
               loop=True, frames_per_stride=6, bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest(),
               measured=dict(src_body_px=body0, scale=round(s, 4), src_foot_px=[int(bots.min()), int(np.median(bots)), int(bots.max())],
                             foot_jitter_px=round(float(b2.max() - b2.min()), 1), body_px=[int((b2 - t2).min()), int((b2 - t2).max())]),
               color=dict(target=tgt, before=before, after=after))
    idx = dict(revision='R436-hwando-walk-s-1', source=dict(zip=os.path.basename(zp), zip_sha256=sha(zp), zip_bytes=os.path.getsize(zp),
               frames_rgba_sha256=[st['sha256'] for st in man['frame_stats']], src_cell=man['cell'], src_anchor=man['anchor'], purpose='환도 walk S (아래 이동)', applied=True,
               derived='walk-s.webp', replaces='assets/r271/hwando/walk-s.webp (R349 이후 쓰이지 않던 v1 8키) — 원본은 그대로 둔다'), walk={'s': rec})
    json.dump(idx, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps({k: rec[k] for k in ('cell', 'anchor', 'body', 'bytes', 'measured')}, ensure_ascii=False))
    print('color', {k: round(before[k], 3) for k in ('p10', 'p50', 'p90', 'sat')}, '->', {k: round(after[k], 3) for k in ('p10', 'p50', 'p90', 'sat')})

if __name__ == '__main__':
    main(*sys.argv[1:3])
