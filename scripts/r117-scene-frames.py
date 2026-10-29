#!/usr/bin/env python3
"""R117 장면 소품: Drive 2026-10-28 '적용본 · 게임 반영 전'(ASSET-READY) 한 번 재생 4키 + 정적 1장 -> 게임용 프레임 PNG.
묶음 프레임은 키마다 같은 캔버스에 놓여 있으므로 다시 정렬하지 않는다. 네 키의 합친 알파 상자(alpha>=16, PAD 3)로 같이 자르고
합친 높이가 표시 높이(th)가 되게 한 번에 줄인다. 발밑 기준(하단 중앙)은 게임이 소품 크기와 함께 처리한다.
Usage: python3 -I scripts/r117-scene-frames.py <dir with downloaded zips> r96/runtime-text/assets/r117/scene
"""
import sys, json, hashlib, zipfile, io, re
from pathlib import Path
import numpy as np
from PIL import Image
src, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
A, PAD = 16, 3
# id: (ZIP 이름 접두, 프레임 경로 정규식, 표시 높이, 사용 구역, 설명)
TRACKS = {
 'r02-petal':  ('StoryWorld-R02-sunflower-petal-closing4', r'candidate/frames/R02-petal-close-K([1-4])\.png$', 118, 'R-02 해바라기 침상 꽃잎 닫힘'),
 'r03-chair':  ('StoryWorld-R03-chair-separation4', r'frames/R03-chair-separation-K([1-4])-padded\.png$', 92, 'R-03 빈 의자 두 개 벌리기'),
 'r07-lotus':  ('StoryWorld-R07-lotus-opening4', r'candidate/frames/R07-lotus-open-K([1-4])\.png$', 120, 'R-07 감시 수련 개화'),
 'r07-lamp':   ('StoryWorld-R07-surveillance-lotus-lampoff4', r'frames/R07-lampoff-K([1-4])-padded\.png$', 120, 'R-07 감시 수련 내광 소등'),
 'r07-cloth':  ('StoryWorld-R07-care-cloth-fold4', r'candidate/frames/R07-care-cloth-fold-K([1-4])\.png$', 46, 'R-07 돌봄 흰 천 접기'),
 'r16-page':   ('StoryWorld-R16-care-record-page-turn4', r'frames/R16-page-turn-K([1-4])-padded\.png$', 54, 'R-16 돌봄 기록 한 장 넘김'),
 's03-ring':   ('StoryWorld-S03-ring-disconnect4', r'candidate/frames/S03-ring-sever-K([1-4])\.png$', 104, 'S-03 검은 반복명령 고리 연결 절단'),
 'ns09-casing':('StoryWorld-NS09-casing-inspect-turn4', r'frames/NS09-inspect-K([1-4])-padded\.png$', 34, 'NS09 빈 탄피 살펴 돌림'),
 'ep-cup':     ('StoryWorld-Epilogue-paper-cup-lid4', r'candidate/frames/EPILOGUE-cup-lid-K([1-4])\.png$', 40, '종장 종이컵 뚜껑 누름·복귀'),
 'ep-tissue':  ('StoryWorld-Epilogue-tissue-fold4', r'candidate/frames/EPILOGUE-tissue-fold-K([1-4])\.png$', 44, '종장 휴지 젖은 면 안으로 접기'),
 'r08-brush':  ('StoryWorld-R08-ordinary-paintbrush-STATIC1', r'static/R08-brush-static-baseline-padded\.png$', 34, 'R-08 평범한 붓 정적 기준'),
}
zips = sorted(src.glob('StoryWorld-*.zip'))
index = []
for tid, (pre, rx, th, use) in TRACKS.items():
    got, zl = {}, []
    for z in zips:
        if not z.name.startswith(pre): continue
        b = z.read_bytes(); zl.append({'name': z.name, 'bytes': len(b), 'sha256': sha(b)})
        Z = zipfile.ZipFile(io.BytesIO(b))
        for i in Z.infolist():
            m = re.search(rx, i.filename)
            if m: got[int(m.group(1)) if m.groups() else 1] = (z.name, i.filename, Z.read(i.filename))
    need = [1, 2, 3, 4] if tid != 'r08-brush' else [1]
    if sorted(got) != need: print('SKIP', tid, sorted(got)); continue
    arr = [np.asarray(Image.open(io.BytesIO(got[k][2])).convert('RGBA')).astype(np.float32) for k in need]
    assert len({a.shape for a in arr}) == 1, tid
    boxes = []
    for a in arr:
        ys, xs = np.nonzero(a[..., 3] >= A); boxes.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    x0, y0 = max(0, min(b[0] for b in boxes) - PAD), max(0, min(b[1] for b in boxes) - PAD)
    x1, y1 = min(arr[0].shape[1], max(b[2] for b in boxes) + PAD), min(arr[0].shape[0], max(b[3] for b in boxes) + PAD)
    sc = th / (y1 - y0); cw, ch = round((x1 - x0) * sc), round((y1 - y0) * sc)
    files = []
    for k, a in zip(need, arr):
        cell = a[y0:y1, x0:x1].copy(); cell[..., :3] *= cell[..., 3:4] / 255
        r = np.asarray(Image.fromarray(cell.clip(0, 255).astype(np.uint8), 'RGBA').resize((cw, ch), Image.LANCZOS)).astype(np.float32)
        aa = r[..., 3:4]; rgb = np.where(aa > 0, r[..., :3] * 255 / np.maximum(aa, 1), 0)
        name = f'{tid}-k{k}.png'; p = out / name
        Image.fromarray(np.concatenate([rgb, aa], -1).clip(0, 255).astype(np.uint8), 'RGBA').save(p, optimize=True)
        pb = p.read_bytes(); files.append({'path': 'assets/r117/scene/' + name, 'bytes': len(pb), 'sha256': sha(pb), 'source': {'zip': got[k][0], 'png': got[k][1], 'sha256': sha(got[k][2])}})
    index.append({'id': tid, 'use': use, 'frames': len(need), 'cell': [cw, ch], 'height': th, 'files': files, 'zips': zl, 'oneShot': len(need) == 4})
    print(tid, 'cell', cw, ch, 'bytes', sum(f['bytes'] for f in files))
(out / 'index.json').write_text(json.dumps({'schema': 'storyworld.r117.scene/v1', 'revision': 'R117', 'note': 'Drive 2026-10-28 적용본(게임 반영 전) 장면 소품. 원본 보존·가공 사본.', 'tracks': index}, ensure_ascii=False, indent=1))
print(len(index), 'tracks')
