#!/usr/bin/env python3
"""R425 몹 그림 배경처리 정리(사용자 2026-11-08 "전수조사하는 김에 배경처리 등 디테일 퀄리티업도 함께").
전수조사(모든 지역 몹의 실제 그려진 몸 그림)에서 눈으로 고른 그림만 고친다. 원본은 그대로 두고
r96/runtime-text/assets/r425/clean/<원래 경로> 에 무손실 WebP 사본을 쓰며, combat-flow-r425.js 가 그 경로로만 이미지 주소를 돌린다.
 cloud: AI 생성 때 남은 베이지·회색 구름 배경(타락천사 기사 3장)을 바깥 투명 영역에서부터 밝고 색이 빠진 픽셀을 따라 지운다.
        안쪽 몸(어두운 갑옷·날개·붉은 검)은 이어져 있지 않으면 남고, 새 윤곽은 1~2px 부드럽게 하고 안쪽 색으로 가장자리 색을 맞춘다.
 speck: 몸에서 떨어진 작은 조각(남은 배경 점·옆 칸 찌꺼기)을 지운다.
목록·결과 해시는 r96/r425-mob-clean.json. 사용: python3 scripts/r425-mob-clean.py [--dry]"""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT = Path(__file__).resolve().parents[1]; R = ROOT / 'r96'; SITE = R / 'hospital-three-pc/site'; SPEC = R / 'r425-mob-clean.json'
sha = lambda b: hashlib.sha256(b).hexdigest()

def cloud(im, lum_min=88, sat_max=62, grow=60):
    a = np.asarray(im).astype(np.float32); rgb = a[..., :3]; al = a[..., 3].copy()
    lum = rgb.mean(-1); sat = rgb.max(-1) - rgb.min(-1)
    bgish = (lum >= lum_min) & (sat <= sat_max) | (al < 40)
    seed = al <= 8
    reg = seed.copy()
    for _ in range(grow):
        nxt = ndimage.binary_dilation(reg) & bgish
        if (nxt == reg).all(): break
        reg = nxt | reg
    lab, n = ndimage.label(reg); keep = np.zeros_like(reg)
    edge_ids = set(np.unique(lab[seed])) - {0}
    for i in edge_ids: keep |= lab == i
    kill = keep & ~seed
    al[kill] = 0
    # 작은 구멍·점 정리: 몸에서 떨어진 작은 조각 지우기
    al = speck_alpha(al)
    # 새 윤곽 1px 부드럽게 + 가장자리 색을 안쪽 몸 색으로
    solid = al > 8; core = ndimage.binary_erosion(solid, iterations=3)
    if core.any():
        _, (iy, ix) = ndimage.distance_transform_edt(~core, return_indices=True); corec = rgb[iy, ix]
        edge = solid & ~ndimage.binary_erosion(solid)
        rgb = np.where(edge[..., None], rgb * .4 + corec * .6, rgb); al = np.where(edge, al * .7, al)
        rgb = np.where((al <= 8)[..., None], corec, rgb)
    al[al <= 8] = 0
    return Image.fromarray(np.dstack([rgb, al]).clip(0, 255).astype(np.uint8), 'RGBA')

def speck_alpha(al, frac=.02, gap=6):
    m = al > 16; lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    if n < 2: return al
    sizes = ndimage.sum(np.ones_like(al), lab, index=range(1, n + 1)); big = sizes.max()
    main = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= big * .05])
    near = ndimage.binary_dilation(main, iterations=gap)
    al = al.copy()
    for i, s in enumerate(sizes):
        if s < big * frac:
            comp = lab == i + 1
            if not (comp & near).any() or s < 12: al[comp] = 0
    al[(al > 0) & (al <= 16) & ~ndimage.binary_dilation(al > 16, iterations=2)] = 0
    return al

def speck(im):
    a = np.asarray(im).copy(); a[..., 3] = speck_alpha(a[..., 3].astype(np.float32)).astype(np.uint8)
    return Image.fromarray(a, 'RGBA')

OPS = {'cloud': cloud, 'speck': speck}
def main():
    dry = '--dry' in sys.argv; spec = json.loads(SPEC.read_text(encoding='utf8')); done = []
    for row in spec['images']:
        src = SITE / row['path']; raw = src.read_bytes()
        if row.get('sourceSha256') and row['sourceSha256'] != sha(raw): raise SystemExit('원본이 바뀜: ' + row['path'])
        row['sourceSha256'] = sha(raw)
        im = Image.open(src).convert('RGBA')
        for op in row['ops']: im = OPS[op](im)
        out = R / 'runtime-text' / ('assets/r425/clean/' + row['path'])
        if not dry:
            out.parent.mkdir(parents=True, exist_ok=True); im.save(out, 'WEBP', lossless=True, quality=100, method=6)
            b = out.read_bytes(); row['output'] = 'assets/r425/clean/' + row['path']; row['outputSha256'] = sha(b); row['outputBytes'] = len(b)
        done.append(str(out.relative_to(R / 'runtime-text')))
    if not dry: SPEC.write_text(json.dumps(spec, ensure_ascii=False, indent=1) + '\n', encoding='utf8')
    print('\n'.join(done))
if __name__ == '__main__': main()
