#!/usr/bin/env python3
"""R1156b 몹 피격 4칸(Dots CX-0136 A4 r2, 2026-11-18 HOLD 3종) 손질 → r96/runtime-text/assets/r1156/mob-hit/
사용자 11-18 08:41Z "hold 보류자산도 앵간하면 너가 코드나 스킬로 개선해서 적용해".
- u203-e3 공명기사: 2칸 반동 15.8%(목표 8~12%) → 발 줄(235)을 고정한 전단으로 칸마다 머리 이동을 0.62배(최대 약 10%).
- u203-e2 공허잔영: 머리 이동 45px(목표 16~24) → 같은 전단으로 0.45배, 4칸은 게임 그림(r374 이동 0칸)으로 바꿔 서기 자세 복귀.
- 늪 뿌리 추적자: 1~3칸 색이 밝음 → 불투명 화소 평균·분산을 4칸(원래 그림)에 맞춤, 아래 뿌리(발 줄 위 36px 아래)를 4칸 뿌리로 바꿔 끼움(16px 섞음).
알파 1~16 → 0, 칸 테두리 3px 비움. 원본은 두고 파생본만. 출처표 assets/r1156/index.json 에 덧붙인다.
"""
import os, sys, json, hashlib
import numpy as np
from PIL import Image
RAW = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/dots-results/unified-r2/raw/CX_P3_A4_HIT_R2_QA'
HERE = os.path.dirname(os.path.abspath(__file__)); RT = os.path.join(HERE, '..', 'r96', 'runtime-text')
OUT = os.path.join(RT, 'assets', 'r1156', 'mob-hit'); os.makedirs(OUT, exist_ok=True)
def cells(a, cw): return [a[:, i*cw:(i+1)*cw].copy() for i in range(a.shape[1] // cw)]
def head(c, rows=23):
    al = c[..., 3] > 100; ys = np.where(al.any(1))[0]; top = ys.min(); band = al[top:top+rows]
    xs = np.where(band)[1]; return float(xs.mean()), int(top)
def shear(c, dx, foot):
    if abs(dx) < .5: return c
    h = c.shape[0]; _, hy = head(c); k = dx / max(1, foot - hy)
    im = Image.fromarray(c); return np.array(im.transform(im.size, Image.AFFINE, (1, -k, k*foot, 0, 1, 0), resample=Image.BICUBIC))
def tidy(c):
    c[..., 3][c[..., 3] <= 16] = 0; c[c[..., 3] == 0] = 0; c[:3] = 0; c[-3:] = 0; c[:, :3] = 0; c[:, -3:] = 0; return c
def scale_recoil(cs, f, foot):
    hx4, _ = head(cs[-1]); out = []
    for c in cs[:-1]:
        hx, _ = head(c); out.append(shear(c, (1 - f) * (hx - hx4), foot))
    return out + [cs[-1]]
def save(name, cs, src, note, **meta):
    a = np.concatenate([tidy(c) for c in cs], 1); p = os.path.join(OUT, name)
    Image.fromarray(a, 'RGBA').save(p, 'WEBP', quality=92, alpha_quality=100, method=6); b = open(p, 'rb').read()
    return {'file': 'assets/r1156/mob-hit/' + name, 'source': src, 'sourceSha256': hashlib.sha256(open(os.path.join(RAW, src), 'rb').read()).hexdigest(),
            'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b), 'size': [a.shape[1], a.shape[0]], 'note': note, **meta}
def heads(cs): return [round(head(c)[0], 1) for c in cs]
rows = []
# u203-e3
src = 'P3_A4_u203e3/CX-P3_A4_u203-e3_hit4_r2_HOLD.png'; cs = cells(np.array(Image.open(os.path.join(RAW, src)).convert('RGBA')), 256)
before = heads(cs); cs = scale_recoil(cs, .62, 235)
rows.append(save('u203-e3-hit4.webp', cs, src, 'HOLD 반동 15.8% → 발 고정 전단 0.62배', cell=[256, 256], pivot=[128, 235], frames=4, headXBefore=before, headXAfter=heads(cs)))
# u203-e2
src = 'P3_A4_u203e2/u203-e2_hit4_r2_HOLD.png'; cs = cells(np.array(Image.open(os.path.join(RAW, src)).convert('RGBA')), 256)
game = np.array(Image.open(os.path.join(RT, 'assets/r374/mobs/u203-e2-mech.webp')).convert('RGBA'))[:, 0:256].copy()
before = heads(cs); cs = cs[:3] + [game]; cs = scale_recoil(cs, .45, 235)
rows.append(save('u203-e2-hit4.webp', cs, src, 'HOLD 머리 이동 45px → 전단 0.45배, 4칸 = 게임 그림 r374 이동 0칸', cell=[256, 256], pivot=[128, 235], frames=4, headXBefore=before, headXAfter=heads(cs)))
# swamp root stalker
src = 'P3_A4_swamp/A4_swamp_hit4_r2_HOLD.png'; cs = cells(np.array(Image.open(os.path.join(RAW, src)).convert('RGBA')), 373)
ref = cs[3].astype(np.float32); m = ref[..., 3] > 128; mu = ref[..., :3][m].mean(0); sd = ref[..., :3][m].std(0)
foot = 271; cut = foot - 36; out = []
for c in cs[:3]:
    f = c.astype(np.float32); q = f[..., 3] > 128; cm = f[..., :3][q].mean(0); cs_ = f[..., :3][q].std(0)
    f[..., :3] = np.clip((f[..., :3] - cm) / np.maximum(cs_, 1) * sd + mu, 0, 255)
    w = np.clip((np.arange(f.shape[0]) - (cut - 8)) / 16, 0, 1)[:, None, None]
    f = f * (1 - w) + ref * w
    out.append(f.astype(np.uint8))
out.append(cs[3])
rows.append(save('swamp-root-hit4.webp', out, src, 'HOLD 색·아래 뿌리 → 색 평균·분산을 원래 그림에 맞춤, 발 줄 위 36px 아래는 원래 뿌리', cell=[373, 320], pivot=[203.36, 271.01], frames=4))
idx_p = os.path.join(RT, 'assets', 'r1156', 'index.json'); idx = json.load(open(idx_p)) if os.path.exists(idx_p) else {'schema': 'storyworld.r1156.dots/v1', 'assets': []}
idx['assets'] = [a for a in idx['assets'] if not a['file'].startswith('assets/r1156/mob-hit/')] + rows
json.dump(idx, open(idx_p, 'w'), ensure_ascii=False, indent=1)
for r in rows: print(r['file'], r['size'], r['bytes'], r.get('headXBefore'), r.get('headXAfter'))
