#!/usr/bin/env python3
"""R196 환도 색감 맞추기(사용자 2026-11-01 "환도 색감도 일관성 있게").

드라이브에서 온 피격(r143/hit/hwando)·쓰러짐(r194/death/hwando) 시트는 기존 걷기(r130/r144)·공격(r143/attack)
시트보다 누렇고 채도가 높다(채도 평균 .19~.26 대 .14~.18). 방향마다 같은 방향의 걷기+공격 시트 불투명 픽셀을
기준으로 CIELAB 에서 맞춘다.
  · a·b(색조·채도): 평균과 표준편차를 기준에 맞춘다.
  · L(밝기): 평균 차이의 70%만 옮긴다(몸짓이 다른 시트라 그림자 양이 달라서).
알파와 원본 파일은 건드리지 않고 assets/r196/hwando/ 에 새로 쓴다. index.json 에 원본 경로·sha256·전후 통계를 남긴다.
쓰는 법: python3 scripts/r196-hwando-color.py
"""
import hashlib, json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'r96', 'runtime-text', 'assets')
OUT = os.path.join(ROOT, 'r196', 'hwando')
DIRS = ['s', 'se', 'e', 'ne', 'n']
REF = {d: ([f'r144/walk/hwando/walk-e.webp'] if d == 'e' else [f'r130/hwando/walk-{d}.webp']) + [f'r143/attack/hwando/attack-{d}.webp'] for d in DIRS}
SRC = [('hit', d, f'r143/hit/hwando/hit-{d}.webp') for d in ['s', 'se', 'e', 'n']] + [('death', d, f'r194/death/hwando/death-{d}.webp') for d in DIRS]
L_WEIGHT = 0.7

# --- sRGB <-> CIELAB (D65) ---
M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
MI = np.linalg.inv(M)
WP = np.array([0.95047, 1.0, 1.08883])

def to_lab(rgb):
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    xyz = c @ M.T / WP
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)

def to_rgb(lab):
    fy = (lab[..., 0] + 16) / 116
    fx = fy + lab[..., 1] / 500
    fz = fy - lab[..., 2] / 200
    f = np.stack([fx, fy, fz], -1)
    xyz = np.where(f ** 3 > 216 / 24389, f ** 3, (116 * f - 16) / (24389 / 27)) * WP
    c = xyz @ MI.T
    c = np.where(c > 0.0031308, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055, 12.92 * c)
    return np.clip(c * 255 + 0.5, 0, 255)

def opaque_lab(path):
    a = np.asarray(Image.open(os.path.join(ROOT, path)).convert('RGBA')).astype(np.float64)
    return to_lab(a[a[..., 3] > 200][:, :3])

def stats(lab):
    sat = np.hypot(lab[:, 1], lab[:, 2])
    return {'L': round(float(lab[:, 0].mean()), 2), 'a': round(float(lab[:, 1].mean()), 2), 'b': round(float(lab[:, 2].mean()), 2), 'chroma': round(float(sat.mean()), 2)}

def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()

def main():
    os.makedirs(OUT, exist_ok=True)
    rows = []
    for act, d, src in SRC:
        ref = np.concatenate([opaque_lab(p) for p in REF[d]])
        im = np.asarray(Image.open(os.path.join(ROOT, src)).convert('RGBA')).astype(np.float64)
        lab = to_lab(im[..., :3])
        m = im[..., 3] > 200
        s = lab[m]
        out = lab.copy()
        for ch in (1, 2):
            mu, sd, rmu, rsd = s[:, ch].mean(), s[:, ch].std() + 1e-6, ref[:, ch].mean(), ref[:, ch].std()
            out[..., ch] = (lab[..., ch] - mu) * (rsd / sd) + rmu
        out[..., 0] = lab[..., 0] + L_WEIGHT * (ref[:, 0].mean() - s[:, 0].mean())
        rgb = to_rgb(out)
        res = np.concatenate([rgb, im[..., 3:4]], -1).astype(np.uint8)
        name = f'{act}-{d}.webp'
        dst = os.path.join(OUT, name)
        Image.fromarray(res, 'RGBA').save(dst, 'WEBP', quality=92, method=6)
        after = opaque_lab(os.path.relpath(dst, ROOT))
        rows.append({'file': name, 'source': src, 'sourceSha256': sha(os.path.join(ROOT, src)), 'sha256': sha(dst), 'bytes': os.path.getsize(dst),
                     'reference': REF[d], 'before': stats(s), 'after': stats(after), 'referenceStats': stats(ref)})
        print(name, 'before', stats(s), 'after', stats(after), 'ref', stats(ref))
    json.dump({'revision': 'R196-hwando-color-1', 'method': 'CIELAB a/b mean+std match, L mean shift x0.7, alpha unchanged',
               'note': '원본(r143/hit/hwando, r194/death/hwando)은 그대로 두고 파생본만 여기에 쓴다', 'files': rows},
              open(os.path.join(OUT, 'index.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)

if __name__ == '__main__':
    sys.exit(main())
