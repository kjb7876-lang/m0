#!/usr/bin/env python3
"""R121: 기억사수(gunner) 동작 그림 화풍 맞추기 -> assets/r121/heroes/gunner/<name>.webp (원본은 그대로).

heroes/normalized/gunner 의 일부 프레임은 다른 세대에서 와서
  - 바깥에 두꺼운 흰 스티커 테두리(run_left_b, run_right_b, player_run2)가 있거나
  - 몸 둘레에 반투명 검은 번짐(attack/guard/aim/idle/run_a 등)이 있어
8방향 서기 그림(깨끗한 외곽선)과 섞이면 다른 캐릭터처럼 보였다.
  1) 반투명(alpha<160)이면서 어두운 번짐 픽셀은 지운다(가장자리 안티앨리어싱은 밝기로 구분해 남긴다).
  2) 투명과 맞닿은 매우 밝은 외곽 픽셀을 바깥부터 최대 8겹 벗겨 흰 테두리를 없앤다(몸 안쪽 흰 망토는 투명과 닿지 않아 남는다).
크기는 그대로(키 맞추기는 visual-r119 heroFit 이 런타임에 한다). index.json 에 원본·결과 해시를 남긴다.
usage: python -I scripts/r121-gunner-clean.py <site-or-runtime assets dir> <out dir>
"""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from PIL import Image

src, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
OUTLINED = {'run_left_b', 'run_right_b', 'player_run2'}
SKIP = {'dash_left', 'dash_right', 'player_roll'}  # 구르기 원형 잔상은 의도된 효과
sha = lambda b: hashlib.sha256(b).hexdigest()
rows = {}
for f in sorted((src / 'heroes/normalized/gunner').glob('*.webp')):
    name = f.stem
    if name in SKIP: continue
    a = np.asarray(Image.open(f).convert('RGBA')).astype(np.int16)
    rgb, al = a[..., :3], a[..., 3]
    lum = rgb.mean(-1)
    halo = (al > 0) & (al < 160) & (lum < 125)
    a[halo, 3] = 0
    peeled = 0
    if name in OUTLINED:
        for _ in range(8):
            al = a[..., 3]; solid = al > 24
            nb = np.zeros_like(solid)
            nb[1:] |= ~solid[:-1]; nb[:-1] |= ~solid[1:]; nb[:, 1:] |= ~solid[:, :-1]; nb[:, :-1] |= ~solid[:, 1:]
            bright = (a[..., :3].min(-1) > 185)
            edge = solid & nb & bright
            if not edge.any(): break
            a[edge, 3] = 0; peeled += int(edge.sum())
    p = out / (name + '.webp'); Image.fromarray(a.clip(0, 255).astype(np.uint8), ).save(p, 'WEBP', quality=92, method=6)
    rows[name] = {'source': 'assets/heroes/normalized/gunner/' + f.name, 'sourceSha256': sha(f.read_bytes()), 'file': p.name, 'sha256': sha(p.read_bytes()),
                  'haloPixelsRemoved': int(halo.sum()), 'outlinePixelsRemoved': peeled}
(out / 'index.json').write_text(json.dumps({'schema': 'storyworld.r121.gunner-clean/v1', 'frames': rows}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps({k: [v['haloPixelsRemoved'], v['outlinePixelsRemoved']] for k, v in rows.items()}))
