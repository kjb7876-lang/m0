#!/usr/bin/env python3
"""R1156 페르소나 보스(기본형) 뒤 피격 Dots r2(CX-0136 A5, 2026-11-18 REVIEW·발 맞춤 HOLD) → assets/r1156/persona-hit-base-rear-r2.webp
- 원본 6칸(3072×512) 중 2(젖힘)·3(최대 펄럭)·5(가라앉음)·6(원래 자세 = R1119 원본과 같은 그림) 네 칸을 골라 지금 게임의 뒤 피격 4칸·시간(65·100·110·100ms)에 맞춘다.
- HOLD 사유(왼쪽 지지발 아랫단 478/477 vs 원래 474, 3~4px 어긋남) 손질: 칸마다 x180..249 지지발 덩어리 아랫단을 6칸(원래 자세)과 같게 위로 옮긴다.
- 알파 1~16 → 0, 칸 테두리 3px 비움. 원본은 그대로 두고 파생본만 만든다.
"""
import sys, os, json, hashlib
import numpy as np
from PIL import Image
SRC = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/dots-results/unified-r2/raw/CX_P3_A5_HIT_R2_QA/P3_A5/CX-0136_A5_PersonaBoss_base_rear_hit6_r2_REVIEW.png'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'r96', 'runtime-text', 'assets', 'r1156')
PICK = [1, 2, 4, 5]
def support_bottom(c):
    al = c[:, 180:250, 3]; rows = np.where((al > 100).sum(1) > 3)[0]; return int(rows.max())
def main():
    a = np.array(Image.open(SRC).convert('RGBA'))
    assert a.shape == (512, 3072, 4), a.shape
    cells = [a[:, i*512:(i+1)*512].copy() for i in range(6)]
    ref = support_bottom(cells[5])
    out = np.zeros((512, 2048, 4), np.uint8); shifts = []
    for j, i in enumerate(PICK):
        c = cells[i]; d = support_bottom(c) - ref; shifts.append(d)
        if d > 0: c = np.concatenate([c[d:], np.zeros((d, 512, 4), np.uint8)])
        elif d < 0: c = np.concatenate([np.zeros((-d, 512, 4), np.uint8), c[:d]])
        c[..., 3][c[..., 3] <= 16] = 0; c[c[..., 3] == 0] = 0
        c[:3] = 0; c[-3:] = 0; c[:, :3] = 0; c[:, -3:] = 0
        out[:, j*512:(j+1)*512] = c
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, 'persona-hit-base-rear-r2.webp')
    Image.fromarray(out, 'RGBA').save(p, 'WEBP', quality=90, alpha_quality=100, method=6)
    b = open(p, 'rb').read()
    idx = {'schema': 'storyworld.r1156.dots/v1', 'assets': [{'file': 'assets/r1156/persona-hit-base-rear-r2.webp', 'source': 'Dots CX-0136 A5 CX-0136_A5_PersonaBoss_base_rear_hit6_r2_REVIEW.png (드라이브 CX_P3_A5_HIT_R2_QA.zip, 2026-11-18)',
        'sourceSha256': hashlib.sha256(open(SRC, 'rb').read()).hexdigest(), 'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b), 'size': [2048, 512],
        'frames': [f + 1 for f in PICK], 'footShiftPx': shifts, 'supportBottom': ref, 'note': 'REVIEW·발 HOLD → 지지발 아랫단 원래 자세와 같게, 4칸 골라 지금 피격 시간에 맞춤'}]}
    json.dump(idx, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(idx['assets'][0], ensure_ascii=False))
if __name__ == '__main__': main()
