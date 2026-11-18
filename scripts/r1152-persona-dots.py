#!/usr/bin/env python3
"""R1152 페르소나 Dots 시트(CX-0143PL·0144PW·0145PR) 정리 → r96/runtime-text/assets/r1152/ (원본은 그대로 두고 파생본만 만든다).
- HOLD 손질(사용자 2026-11-18 07:53Z "앵간하면 홀드도 개선적용해 배경처리같은거 잘하고"):
  · 0143PL A 레이저 몸통·0144PW B 번개 몸통: 좌우 이음매가 안 맞음 → 칸 양 끝 EDGE 화소를 알파 0까지 부드럽게 줄이고(코사인), 게임에서 칸을 EDGE 만큼 겹쳐 이어 붙인다.
  · 0143PL B 레이저 시작: 불투명 회색 배경 → 칸 테두리 중앙값을 배경색으로 잡고 색→알파(GIMP color-to-alpha 방식)로 뺀 뒤 옅은 얼룩(알파<.14)·칸 테두리 4px 를 지운다.
  · 0143PL C 레이저 끝: 들어오는 줄이 왼쪽 끝에 못 닿음 → 이어 붙이지 않고 줄 끝에 겹쳐 그리는 착탄 그림으로 쓴다(왼쪽 들어오는 줄도 부드럽게 줄임).
- 그 밖(REVIEW 후보)은 낮은 알파(1~16) 정리만.
출처 표·sha256 은 assets/r1152/index.json.
"""
import json, hashlib, os, sys
import numpy as np
from PIL import Image
RAW = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/dots-results/cx0141-0150/raw'
OUT = os.path.join(os.path.dirname(__file__), '..', 'r96', 'runtime-text', 'assets', 'r1152')
EDGE = 24
os.makedirs(OUT, exist_ok=True)
def load(p): return np.array(Image.open(os.path.join(RAW, p)).convert('RGBA')).astype(np.float32)
def clean(a):
    a[..., 3][a[..., 3] <= 16] = 0
    a[..., :3][a[..., 3] == 0] = 0
    return a
def feather_x(a, cw, n, left=True, right=True, edge=EDGE):
    w = (1 - np.cos(np.linspace(0, np.pi, edge))) / 2
    for i in range(n):
        x = i * cw
        if left: a[:, x:x+edge, 3] *= w[None, :]
        if right: a[:, x+cw-edge:x+cw, 3] *= w[::-1][None, :]
    return a
def color_to_alpha(a, cw, ch, n):
    """밝은 무채색 구름 배경 빼기: 배경은 밝고(밝기 170↑) 채도가 거의 없다(.06↓). 붉은 결(채도)·먹(어두움)만 남기고, 반투명 가장자리는 배경색을 덜어 낸다."""
    def smooth(x, a0, a1):
        t = np.clip((x - a0) / (a1 - a0), 0, 1); return t * t * (3 - 2 * t)
    for i in range(n):
        x = i * cw; c = a[:, x:x+cw]
        border = np.concatenate([c[:6].reshape(-1, 4), c[-6:].reshape(-1, 4), c[:, :6].reshape(-1, 4)])
        bg = np.median(border[:, :3], axis=0)
        rgb = c[..., :3]; mx = rgb.max(-1); mn = rgb.min(-1); sat = (mx - mn) / np.maximum(1, mx)
        lum = rgb @ np.array([.299, .587, .114], np.float32)
        al = np.maximum(smooth(sat, .10, .32), smooth(-lum, -165, -95))
        safe = np.maximum(al, 1e-3)[..., None]
        c[..., :3] = np.clip((rgb - bg * (1 - safe)) / safe, 0, 255)
        c[..., 3] = al * 255
        c[:4, :, 3] = 0; c[-4:, :, 3] = 0; c[:, :4, 3] = 0   # 칸 경계선(격자) 지우기, 오른쪽은 줄이 이어지므로 남김
    return a
def save(name, a, src, note, **meta):
    a = clean(a)
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
    p = os.path.join(OUT, name); im.save(p, 'WEBP', lossless=False, quality=90, alpha_quality=100, method=6)
    b = open(p, 'rb').read()
    return {'file': 'assets/r1152/' + name, 'source': src, 'sourceSha256': hashlib.sha256(open(os.path.join(RAW, src), 'rb').read()).hexdigest(),
            'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b), 'size': list(im.size), 'note': note, **meta}
idx = []
idx.append(save('laser-body.webp', feather_x(load('0143PL/0143PL/CX-0143PL_A_BODY_HOLD_SEAM.png'), 256, 8), '0143PL/0143PL/CX-0143PL_A_BODY_HOLD_SEAM.png',
                'HOLD 이음매 → 양 끝 24px 코사인 페이드, 게임에서 24px 겹쳐 이음', cell=[256, 128], frames=8, coreY=66, edge=EDGE))
idx.append(save('laser-start.webp', feather_x(color_to_alpha(load('0143PL/0143PL/CX-0143PL_B_HOLD.png'), 256, 256, 8), 256, 8, left=False), '0143PL/0143PL/CX-0143PL_B_HOLD.png',
                'HOLD 불투명 배경 → 색→알파로 배경 제거, 격자 지움, 오른쪽 끝 페이드', cell=[256, 256], frames=8, coreY=128))
idx.append(save('laser-end.webp', feather_x(load('0143PL/0143PL/CX-0143PL_C_HOLD.png'), 256, 8, right=False, edge=60), '0143PL/0143PL/CX-0143PL_C_HOLD.png',
                'HOLD 접합 틈 → 이어 붙이지 않는 착탄 그림, 들어오는 줄 왼쪽 60px 페이드', cell=[256, 256], frames=8, coreY=127))
idx.append(save('w-chain.webp', feather_x(load('0144PW-0145PR/0144PW/CX-0144PW_B-chain_r1.png'), 256, 8), '0144PW-0145PR/0144PW/CX-0144PW_B-chain_r1.png',
                'HOLD 이음매 → 양 끝 24px 코사인 페이드(마디 하나에 한 칸을 늘려 씀)', cell=[256, 128], frames=8, coreY=66, edge=EDGE))
for name, src, cell, n, note in [
    ('w-mark.webp', '0144PW-0145PR/0144PW/CX-0144PW_A-mark_r1.png', [256, 256], 8, 'REVIEW 후보 그대로(낮은 알파 정리)'),
    ('w-hit.webp', '0144PW-0145PR/0144PW/CX-0144PW_C-hit_r1.png', [256, 256], 6, 'REVIEW 후보 그대로'),
    ('r-orb.webp', '0144PW-0145PR/0145PR/A-orb/CX-0145PR_A-orb_r1_REVIEW.png', [256, 256], 24, 'REVIEW 후보 그대로'),
    ('r-tail.webp', '0144PW-0145PR/0145PR/B-tail/CX-0145PR_B-tail_r1_REVIEW.png', [256, 256], 8, 'REVIEW 후보 그대로'),
    ('e-ember.webp', '0144PW-0145PR/0145PR/C-ember/CX-0145PR_C-ember_r1_REVIEW.png', [256, 256], 6, 'REVIEW 후보 그대로')]:
    idx.append(save(name, load(src), src, note, cell=cell, frames=n))
json.dump({'schema': 'storyworld.r1152.persona-dots/v1', 'from': 'Dots CX-0143PL·CX-0144PW·CX-0145PR (사용자 드라이브, 2026-11-18)', 'assets': idx},
          open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps([[d['file'], d['size'], d['bytes']] for d in idx], ensure_ascii=False))
