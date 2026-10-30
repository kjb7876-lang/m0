#!/usr/bin/env python3
"""R138: Drive 2026-10-30 정적 소품 원화 -> assets/r138/props/<id>.webp (게임용 파생본).
원본 PNG 는 바꾸지 않는다. manifest.json 의 SHA-256 을 확인하고, 알파 상자(alpha>=16, PAD 6)로 잘라 긴 변을 MAX 로 줄여
알파는 그대로(alpha_quality 100) 둔 WebP(품질 92)로 쓴다. index.json 에 원본 zip·Drive id·원본/파생 해시·크기·용도를 남긴다.
usage: python3 -I scripts/r138-drive-props.py <staging dir with unzipped bundle folders> [out-dir]
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image

src = Path(sys.argv[1]); out = Path(sys.argv[2] if len(sys.argv) > 2 else 'r96/runtime-text/assets/r138/props'); out.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
A, PAD, MAX = 16, 6, 512
# id: (번들 폴더, 원본 파일, Drive zip, Drive id, 쓰는 곳)
JOBS = {
 'bones':  ('dist01-hanging-bones', 'exec-1f4c05ec-5e9f-4ed1-930a-668b9a6f4b83.png', 'StoryWorld-spider-cave-hanging-bones-static-candidate.zip', '1P0OUKt9QJowwBlHqESwE3v4xGsap9d89', 'dist01 거미동굴 천장에 매달린 뼈(에피소드1A L37), 비충돌 장식'),
 'window': ('dist00-corridor-window', 'exec-2a15a13c-f7bf-4346-8dd2-a3af80c33ad3.png', 'StoryWorld-corridor-window-faceless-static-candidate.zip', '14nRYLGrxTB5RWxxlVyiY5fMh5nEuv7F9', 'dist00 뒷벽 부착 창과 얼굴 없는 성상(에피소드1A L28), 비충돌·비상호작용 장식'),
}
idx_path = out / 'index.json'
index = json.loads(idx_path.read_text(encoding='utf-8')) if idx_path.exists() else {'revision': 'R138', 'props': {}}
for pid, (folder, name, zipname, drive_id, use) in JOBS.items():
    d = next((p for p in src.rglob(folder) if p.is_dir()), None)
    if not d or not (d / name).exists(): print('skip', pid, '(bundle not found)'); continue
    raw = (d / name).read_bytes(); man = json.loads((d / 'manifest.json').read_text(encoding='utf-8'))
    if sha(raw) != man[name]['sha256']: raise SystemExit('sha mismatch: ' + name)
    im = Image.open(d / name).convert('RGBA'); a = im.getchannel('A').point(lambda v: 255 if v >= A else 0); box = a.getbbox()
    x0, y0, x1, y1 = box; x0, y0 = max(0, x0 - PAD), max(0, y0 - PAD); x1, y1 = min(im.width, x1 + PAD), min(im.height, y1 + PAD)
    crop = im.crop((x0, y0, x1, y1)); k = min(1, MAX / max(crop.size)); crop = crop.resize((round(crop.width * k), round(crop.height * k)), Image.LANCZOS) if k < 1 else crop
    path = out / (pid + '.webp'); crop.save(path, 'WEBP', quality=92, alpha_quality=100, method=6); b = path.read_bytes()
    index['props'][pid] = {'path': 'assets/r138/props/' + pid + '.webp', 'size': list(crop.size), 'bytes': len(b), 'sha256': sha(b), 'use': use,
                           'source': {'drive': zipname, 'driveId': drive_id, 'file': name, 'sha256': man[name]['sha256'], 'bytes': len(raw), 'size': list(im.size), 'crop': [x0, y0, x1, y1]}}
    print(pid, crop.size, len(b))
index['held'] = {
 'spider-cave-low-rock-corner': {'driveId': '12suhKjR46n_IsGWF2wQGXXuQXisCxtRm', 'reason': '구조물(충돌·통행 폭·끝단 접합 미검증, README: 바닥·통행로 위 임의 적용 금지)'},
 'M004-flight-up/mid/down': {'driveIds': ['16vKY3QCyI-BC4jmwUwodOz75k7ZhaLqr', '1kesqWgxqGICT24xESKUFtmDWzYLKBBhW', '1qnnv2yNO-prA8yLT0CvhyqSXzo4bOazL'], 'reason': '비행 키 후보(루프·피벗·색 튐 미검증, README: 완성 비행 아님)'},
 'M004-three-key-review': {'driveIds': ['1H1diViUXe5xWMA1BaojpG-QtScI5Was9', '17Bi2iljIxXXW7N5Gk8rLwssUSpd2Blw-'], 'reason': '검수용 미리보기(게임 자산 아님)'},
 'M002-frontleg-recovery': {'driveId': '1DtDLEAdNuMdyfkFQy4RRKYieunY92dEP', 'reason': '단일 보행 키(8다리 루프·척도·피벗 미검증)'},
 'r74-root-tracker-low-windup2': {'driveId': '1wGTfSzW9QCQDiOHulcDjksiPoa8uejf4', 'reason': '공격 준비 단일 키(README: 승격하지 않음)'},
 'M004-flight-render-review-aid': {'driveId': '1vLED3dhOrKdQlcV1VtrRxbvgyoRRcTxw', 'reason': 'NOT-runtime 표기'},
}
idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
