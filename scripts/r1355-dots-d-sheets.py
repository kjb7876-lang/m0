#!/usr/bin/env python3
"""R1355: Dots SW-R1352 D03(보스 메테오 v2 착탄·충격파)·D04(레비아탄 벽 유리 꽂힘·반짝) 납품 PNG 를 게임 경로 webp(무손실)로 옮긴다.
그림은 그대로(칸·피벗·알파 변경 없음). 원본 SHA-256 을 확인하고, 칸마다 보이는 범위(+2px) 표를 출력한다(코드의 CROP 표).
사용: python3 scripts/r1355-dots-d-sheets.py <납품 PNG 폴더>
"""
import hashlib, json, os, sys
from PIL import Image
SRC = {
 'SW-R1352-D03_meteor_v2_impact_16f.png': ('db7228c0b503a34b74cb5da32a7fed9243475098ef43fedd652617c5fd0ca927', 'r96/runtime-text/assets/r1355/boss-meteor-d03-impact16.webp', 16),
 'SW-R1352-D03_meteor_v2_aftershock_12f.png': ('7ef01b1872a85e7c980c423bf518ec56723fa66f971db685f796573c2981ace3', 'r96/runtime-text/assets/r1355/boss-meteor-d03-aftershock12.webp', 12),
 'SW-R1352-D04_leviathan_wall_shard_strike_12f.png': ('472ca8ea759ea71ec68f3b8a1d7c9d632492341a3086385acb9ba3f379b913d8', 'r96/runtime-text/assets/r1343/dots-d04-strike12.webp', 12),
 'SW-R1352-D04_leviathan_wall_shard_glint_8f.png': ('fa6268e8b9d3fcb1138f43af585585e9a0af37995eb2bcf35d85d8a2117aa958', 'r96/runtime-text/assets/r1343/dots-d04-glint8.webp', 8),
}
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src_dir = sys.argv[1]
out = {}
for name, (sha, dst, n) in SRC.items():
    p = os.path.join(src_dir, name)
    got = hashlib.sha256(open(p, 'rb').read()).hexdigest()
    if got != sha:
        sys.exit(f'{name}: SHA-256 불일치 {got}')
    im = Image.open(p).convert('RGBA')
    assert im.size == (256 * n, 256), (name, im.size)
    d = os.path.join(root, dst)
    os.makedirs(os.path.dirname(d), exist_ok=True)
    im.save(d, 'WEBP', lossless=True, quality=100, method=6, exact=True)
    back = Image.open(d).convert('RGBA')
    assert back.tobytes() == im.tobytes(), f'{dst}: 무손실 왕복 실패'
    crops = []
    for i in range(n):
        bb = im.crop((i * 256, 0, i * 256 + 256, 256)).getchannel('A').point(lambda v: 255 if v > 0 else 0).getbbox()
        crops.append(None if not bb else [max(0, bb[0] - 2), max(0, bb[1] - 2), min(256, bb[2] + 2) - max(0, bb[0] - 2), min(256, bb[3] + 2) - max(0, bb[1] - 2)])
    out[dst] = {'source': name, 'sha256': sha, 'bytes': os.path.getsize(d), 'frames': n, 'crop': crops}
print(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
