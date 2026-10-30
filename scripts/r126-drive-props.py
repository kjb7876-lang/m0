#!/usr/bin/env python3
"""R126: Drive 2026-10-29 사몽 분위기 소품 원화(단일 정적 PNG) -> assets/r126/props/<id>.webp (게임용 파생본).
원본 PNG 는 바꾸지 않는다. MANIFEST 의 SHA-256 을 확인하고, 알파 상자(alpha>=16, PAD 6)로 잘라 긴 변을 MAX 로 줄여
알파는 그대로(alpha_quality 100) 둔 WebP(품질 92)로 쓴다. assets/r126/props/index.json 에 원본 zip·Drive id·원본/파생 해시·크기·용도를 남긴다.
usage: python3 -I scripts/r126-drive-props.py <staging dir with unzipped bundle folders> [out-dir]
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image

src = Path(sys.argv[1]); out = Path(sys.argv[2] if len(sys.argv) > 2 else 'r96/runtime-text/assets/r126/props'); out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
A, PAD, MAX = 16, 6, 512
# id: (번들 폴더, 원본 파일, Drive zip, Drive id, 쓰는 곳)
JOBS = {
 'locker':      ('R123-two-front-lockers', 'R123-two-lockers-original.png', 'StoryWorld-R123-two-front-lockers-20261029.zip', '1wiYVlf73M_NaF21UtLTAXzjffk6BTDfK', 'S-02 밤의 학교 뒷벽 사물함 2칸'),
 'teacup':      ('ROSEHOUSE-cup-saucer', 'ROSEHOUSE-cup-saucer-original.png', 'StoryWorld-ROSEHOUSE-cup-saucer-20261029.zip', '1pNniTEtZQw8zRq7NdTFLjMhDpL5w-ink', 'S-01 꿰맨 장미의 집 거대 찻잔'),
 'needle':      ('ROSEHOUSE-needle-thread', 'ROSEHOUSE-needle-thread-original.png', 'StoryWorld-ROSEHOUSE-needle-thread-20261029.zip', '1Eax4OZHd47qzgPu251XV72m0f8Nupee1', 'S-01 꿰맨 장미의 집 바늘과 실(원문 L641)'),
 'noticeboard': ('SCHOOL-blank-noticeboard', 'SCHOOL-noticeboard-original.png', 'StoryWorld-SCHOOL-blank-noticeboard-20261029.zip', '1t75leEFgw-TT94yZq12J_skzr5W4J3rp', 'S-02 밤의 학교 복도 빈 게시판'),
}
idx_path = out / 'index.json'
index = json.loads(idx_path.read_text(encoding='utf-8')) if idx_path.exists() else {'revision': 'R126', 'props': {}}
for pid, (folder, name, zipname, drive_id, use) in JOBS.items():
    d = src / folder
    if not (d / name).exists(): print('skip', pid, '(bundle not found)'); continue
    raw = (d / name).read_bytes(); man = json.loads((d / 'MANIFEST.json').read_text(encoding='utf-8'))
    if sha(raw) != man[name]['sha256']: raise SystemExit('sha mismatch: ' + name)
    im = Image.open(d / name).convert('RGBA'); a = im.getchannel('A').point(lambda v: 255 if v >= A else 0); box = a.getbbox()
    x0, y0, x1, y1 = box; x0, y0 = max(0, x0 - PAD), max(0, y0 - PAD); x1, y1 = min(im.width, x1 + PAD), min(im.height, y1 + PAD)
    crop = im.crop((x0, y0, x1, y1)); k = min(1, MAX / max(crop.size)); crop = crop.resize((round(crop.width * k), round(crop.height * k)), Image.LANCZOS) if k < 1 else crop
    path = out / (pid + '.webp'); crop.save(path, 'WEBP', quality=92, alpha_quality=100, method=6); b = path.read_bytes()
    index['props'][pid] = {'path': 'assets/r126/props/' + pid + '.webp', 'size': list(crop.size), 'bytes': len(b), 'sha256': sha(b), 'use': use,
                           'source': {'drive': zipname, 'driveId': drive_id, 'file': name, 'sha256': man[name]['sha256'], 'bytes': len(raw), 'size': list(im.size), 'crop': [x0, y0, x1, y1]}}
    print(pid, crop.size, len(b))
idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
