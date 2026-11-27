#!/usr/bin/env python3
"""R1342 제72문 보스 2D 모션 시트(Dots SW-R1342 R3) → 게임용 WebP.
사용: python3 scripts/r1342-boss72-sheets.py <복원한 PNG 폴더> <MANIFEST.json>
- MANIFEST 의 SHA-256 로 원본 PNG 를 확인하고, 칸(752×870)·칸 수를 그대로 둔 채 WebP(q90, 알파 무손실에 가깝게)로 저장한다.
- 그림은 손대지 않는다(Dots 가 원본 p4 와 2배 크기·같은 원점으로 맞춰 보냄: p4 알파 상자 (6,6)-(327,405) ×2 = idle 첫 칸 (12,12)-(655,812)).
"""
import sys, json, hashlib, pathlib
from PIL import Image
src, man = pathlib.Path(sys.argv[1]), json.load(open(sys.argv[2]))
out = pathlib.Path(__file__).resolve().parents[1] / 'r96/runtime-text/assets/r1342/boss72'
out.mkdir(parents=True, exist_ok=True)
for motion, s in man['motions'].items():
    if motion == 'vfx':
        continue  # 독립 인장 이펙트는 R1241 그림자 스킬과 겹쳐 이번엔 쓰지 않음
    p = src / s['sheet']
    b = p.read_bytes()
    assert hashlib.sha256(b).hexdigest() == s['sha256'], motion + ' SHA 불일치'
    im = Image.open(p).convert('RGBA')
    n = s['frames']
    assert im.size == (752 * n, 870), (motion, im.size)
    dst = out / (motion + '.webp')
    im.save(dst, 'WEBP', quality=90, alpha_quality=100, method=6)
    print(motion, n, s['fps'], dst.stat().st_size)
