#!/usr/bin/env python3
"""R1229 헌터 걷기 시트: R130 헌터 걷기(8칸이 거의 서 있는 그림 — 다리가 안 움직임) 대신
R91 헌터 걷기(4x2 8프레임, 실제 보폭)를 R128/R130 칸 형식(192x256 8칸 한 줄, 발 96,226, 몸 키 180)으로 맞춘 사본을 만든다.
원본(R91·R130)은 그대로 두고 assets/r130/hunter/walk1229-{s,se,e,ne,n}.webp 를 새로 쓴다(기존 R130 파일은 덮지 않음 — 경로를 r130/hunter/ 아래에 두어 몸 그림 판별 정규식들이 그대로 알아보게 함).
색은 R130 헌터 걷기 시트 쪽으로 반쯤 맞춘다(불투명 화소의 채널 평균·표준편차 50% 이동)."""
import json, hashlib, os, sys
import numpy as np
from PIL import Image
ROOT = os.path.join(os.path.dirname(__file__), '..', 'r96', 'runtime-text', 'assets')
SITE = os.path.join(os.path.dirname(__file__), '..', 'r96', 'hospital-three-pc', 'site', 'assets')  # R91 걷기는 빌드 묶음에서 나오므로 빌드 결과를 읽는다(읽기 전용)
SRC = os.path.join(SITE, 'r91', 'walk', 'walk-hunter-{}.png')
REF = os.path.join(ROOT, 'r130', 'hunter', 'walk-{}.webp')
OUT = os.path.join(ROOT, 'r130', 'hunter')
# 영웅 화면 방향 → R91 시트 방향 (R91 에는 정옆 e 가 없어 3/4 옆 se 를 쓴다)
MAP = {'s': 's', 'se': 'se', 'e': 'se', 'ne': 'ne', 'n': 'n'}
CW, CH, FX, FY, BODY = 192, 256, 96, 226, 180

def frames(path):
    im = Image.open(path).convert('RGBA'); W, H = im.size; cw, ch = W // 4, H // 2
    return [im.crop(((i % 4) * cw, (i // 4) * ch, (i % 4 + 1) * cw, (i // 4 + 1) * ch)) for i in range(8)]

def bbox(a):
    ys, xs = np.where(a[:, :, 3] > 24)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

def stats(arr):
    m = arr[:, :, 3] > 128; px = arr[:, :, :3][m].astype(float)
    return px.mean(0), px.std(0) + 1e-3

def tone(arr, ref):
    mu, sd = stats(arr); rmu, rsd = ref
    rgb = arr[:, :, :3].astype(float); full = (rgb - mu) / sd * rsd + rmu
    arr[:, :, :3] = np.clip(rgb * .5 + full * .5, 0, 255).astype(np.uint8); return arr

def build(d):
    fr = [np.asarray(f).copy() for f in frames(SRC.format(MAP[d]))]
    ref = stats(np.asarray(Image.open(REF.format(d)).convert('RGBA')))
    hs = [bbox(a)[3] - bbox(a)[1] for a in fr]; k = BODY / float(np.median(hs))
    sheet = Image.new('RGBA', (CW * 8, CH), (0, 0, 0, 0))
    for i, a in enumerate(fr):
        a = tone(a, ref); x0, y0, x1, y1 = bbox(a)
        # 발 기준: 맨 아래 12px 의 불투명 화소 가로 가운데
        low = a[max(y0, y1 - 12):y1, :, 3] > 24; fxs = np.where(low.any(0))[0]
        foot = (fxs.min() + fxs.max() + 1) / 2 if len(fxs) else (x0 + x1) / 2
        crop = Image.fromarray(a).crop((x0, y0, x1, y1))
        w, h = max(1, round((x1 - x0) * k)), max(1, round((y1 - y0) * k))
        crop = crop.resize((w, h), Image.LANCZOS)
        px = round(i * CW + FX - (foot - x0) * k); py = round(FY - h)
        cell = Image.new('RGBA', (CW + 2 * CW, CH + CH), (0, 0, 0, 0))  # 칸 밖으로 나간 옷자락은 잘라 낸다(발 자리는 그대로)
        cell.alpha_composite(crop, (px - i * CW + CW, py + CH))
        sheet.alpha_composite(cell.crop((CW, CH, 2 * CW, 2 * CH)), (i * CW, 0))
    os.makedirs(OUT, exist_ok=True); p = os.path.join(OUT, 'walk1229-%s.webp' % d)
    sheet.save(p, 'WEBP', quality=90, method=6)
    return p

def main():
    idx = {'revision': 'R1229', 'hero': 'hunter', 'format': 'R128 sheet: 8 cells x 192x256, foot (96,226), body 180', 'files': {}}
    for d in MAP:
        p = build(d); b = open(p, 'rb').read(); s = SRC.format(MAP[d])
        idx['files'][os.path.basename(p)] = {'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b),
            'source': os.path.relpath(s, SITE), 'sourceSha256': hashlib.sha256(open(s, 'rb').read()).hexdigest(), 'mirrorOf': MAP[d]}
    json.dump(idx, open(os.path.join(OUT, 'walk1229-index.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(idx, ensure_ascii=False)[:600])

if __name__ == '__main__':
    main()
