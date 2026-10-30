#!/usr/bin/env python3
"""R129: Drive 2026-10-30 사몽 분위기 원화 묶음 -> 게임 파생본 (원본은 바꾸지 않음, MANIFEST SHA-256 확인).
- 소품 6점(거대 숲나무·데이터 비석v2·기계 철탑·모네 목재 붓·클림트 금박 핀셋v2·마네 라일락 화병) -> assets/r129/props/<id>.webp
  알파 상자(alpha>=16, PAD 6)로 잘라 긴 변 512, WebP 품질 92(알파 그대로).
- 녹는 시계 키4(K1~K4, 661x595 같은 칸) -> assets/r129/props/clock-k1..k4.webp: 키마다 알파 상자로 자르고 같은 캔버스에
  밑면 가운데를 맞춰 놓는다(README: 키마다 바닥 y·폭이 달라 원래 칸 그대로는 받침이 튐). 형태 4단계는 원화 그대로.
- 감정의 탑 14층 시멘트 벽(1254² 2분할 ORIGINAL 을 이어 붙여 SHA 7d1c6167… 확인) -> assets/r118/tiles/cement14.webp
  (R118 타일 규격 2048x1024, 오른쪽 1024 가 벽; 왼쪽은 같은 재질로 채우지만 바닥에는 쓰지 않음), r118 tiles index.json 에 look 추가.
usage: python3 -I scripts/r129-drive-assets.py <staging dir with unzipped bundles>
"""
import hashlib, json, sys, glob
from pathlib import Path
from PIL import Image

src = Path(sys.argv[1]); sha = lambda b: hashlib.sha256(b).hexdigest()
out = Path('r96/runtime-text/assets/r129/props'); out.mkdir(parents=True, exist_ok=True)
A, PAD, MAX = 16, 6, 512
def verify(folder):
    for m in folder.glob('MANIFEST*.json'):
        for k, v in json.loads(m.read_text(encoding='utf-8')).items():
            if sha((folder / k).read_bytes()) != v['sha256']: raise SystemExit('sha mismatch ' + str(folder / k))
def find(name): return next(Path(p) for p in glob.glob(str(src / '*' / name)))
PROPS = {  # id: (번들 폴더, 원본, Drive zip, Drive id, 쓰는 곳)
 'tree': ('giant-forest-tree', 'giant-forest-tree-original.png', 'StoryWorld-giant-forest-tree-20261030.zip', '18Gx-rzSnNB8U0us25GV_wPklRQg0JNbf', 'NS 빛의 숲·R-17 정원 거대 나무'),
 'monolith': ('data-monument-v2', 'data-monument-v2-original.png', 'StoryWorld-data-monument-v2-20261030.zip', '1yvTbouSc67l7Xrp9ite5zMOEUtR7-QcD', 'NS 데이터 세계 비석'),
 'pylon': ('machine-steel-tower', 'machine-steel-tower-original.png', 'StoryWorld-machine-steel-tower-20261030.zip', '1snMzcYhT1y9Jeau8I9oR7sFNttH64brI', 'NS 기계 폐허 철탑'),
 'brush': ('monet-wooden-brush', 'monet-wooden-brush-original.png', 'StoryWorld-monet-wooden-brush-20261030.zip', '1uf4KpfIfl4m-U0YAvygvqTzgfO8hP-4c', 'R-07 모네 구역 목재 붓(원문 L42)'),
 'tweezers': ('klimt-goldleaf-tweezers-v2', 'klimt-goldleaf-tweezers-v2-original.png', 'StoryWorld-klimt-goldleaf-tweezers-v2-20261030.zip', '12p6t6MMH5-bD-gcSHbwHnNI1zJ8lry9-', 'R-06 클림트 구역 금박 핀셋(원문 L602·604)'),
 'vase': ('manet-lilac-vase', 'manet-lilac-vase-original.png', 'StoryWorld-manet-lilac-vase-20261030.zip', '1wgnMiIdwxmPqK6kC_TvvKi3l5IW63ktl', 'R-04 마네 구역 라일락 유리 화병(원문 L468·472)'),
}
def cropped(im):
    a = im.getchannel('A').point(lambda v: 255 if v >= A else 0); x0, y0, x1, y1 = a.getbbox()
    return im.crop((max(0, x0 - PAD), max(0, y0 - PAD), min(im.width, x1 + PAD), min(im.height, y1 + PAD)))
index = {'revision': 'R129', 'props': {}, 'clock': None}
for pid, (folder, name, zipname, did, use) in PROPS.items():
    p0 = find(f'{folder}/{name}'); verify(p0.parent); raw = p0.read_bytes(); im = cropped(Image.open(p0).convert('RGBA'))
    k = min(1, MAX / max(im.size)); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS) if k < 1 else im
    p = out / f'{pid}.webp'; im.save(p, 'WEBP', quality=92, alpha_quality=100, method=6)
    index['props'][pid] = {'path': f'assets/r129/props/{pid}.webp', 'size': list(im.size), 'bytes': p.stat().st_size, 'sha256': sha(p.read_bytes()), 'use': use,
                           'source': {'drive': zipname, 'driveId': did, 'file': name, 'sha256': sha(raw), 'bytes': len(raw)}}
    print(pid, im.size, p.stat().st_size)
# 녹는 시계 4키
kd = find('melting-clock4-PART02/K1.png').parent; verify(kd); verify(find('melting-clock4-PART01/melting-clock4-original.png').parent)
keys = [cropped(Image.open(kd / f'K{i}.png').convert('RGBA')) for i in range(1, 5)]
W, H = max(k.width for k in keys), max(k.height for k in keys); k = min(1, 384 / max(W, H)); frames = []
for i, im in enumerate(keys, 1):
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); c.alpha_composite(im, ((W - im.width) // 2, H - im.height))  # 밑면 가운데 맞춤
    c = c.resize((round(W * k), round(H * k)), Image.LANCZOS); p = out / f'clock-k{i}.webp'; c.save(p, 'WEBP', quality=92, alpha_quality=100, method=6)
    frames.append({'path': f'assets/r129/props/clock-k{i}.webp', 'sha256': sha(p.read_bytes()), 'bytes': p.stat().st_size, 'source': f'K{i}.png', 'sourceSha256': sha((kd / f'K{i}.png').read_bytes())})
index['clock'] = {'frames': frames, 'size': [round(W * k), round(H * k)], 'use': 'R-03·R-13 달리 구역 녹는 시계(가까이 가면 K1→K4 한 번, K4 유지)',
                  'source': {'drive': ['StoryWorld-melting-clock4-PART01-20261030.zip', 'StoryWorld-melting-clock4-PART02-20261030.zip'], 'driveId': ['1kuRnfcTU9S-arcK_FAEk1GV69PEzdJyj', '1e0E-kbDXczfsBC1kH132rkz1roc2XMeG']}}
(out / 'index.json').write_text(json.dumps(index, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
# 14층 시멘트 벽
parts = [find('cement-wall-original/original.png.part01'), find('cement-wall-original/original.png.part02')]
for p in parts: verify(p.parent)
b = parts[0].read_bytes() + parts[1].read_bytes(); assert sha(b) == '7d1c6167e42dc8fa0dda0aa5eff4d6d294370dd6654b10f4e7a7853c912a3189'
import io
full = Image.open(io.BytesIO(b)).convert('RGB'); rgb = sha(full.tobytes()); half = full.resize((1024, 1024), Image.LANCZOS)
sheet = Image.new('RGB', (2048, 1024)); sheet.paste(half, (0, 0)); sheet.paste(half, (1024, 0))
tiles = Path('r96/runtime-text/assets/r118/tiles'); p = tiles / 'cement14.webp'; sheet.save(p, 'WEBP', quality=90, method=6)
ip = tiles / 'index.json'; idx = json.loads(ip.read_text(encoding='utf-8'))
idx['looks']['cement14'] = {'family': 'S04-14F-cement-wall', 'regions': ['sz115-S04-12'], 'floor': None,
  'wall': {'source': 'cement-wall-original.png (StoryWorld-S04-14F-cement-wall-ORIGINAL-PART01/02-20261030.zip, SHA 7d1c6167…)', 'decodedRgbSha256': rgb, 'size': list(full.size)},
  'file': p.name, 'bytes': p.stat().st_size, 'sha256': sha(p.read_bytes()), 'added': 'R129'}
ip.write_text(json.dumps(idx, indent=1, ensure_ascii=False) + '\n'); print('cement14', p.stat().st_size)
