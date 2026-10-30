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
 'root':   ('dist00-low-root-connector1', 'exec-a674651b-9a8b-436a-97fc-6c15b8699d54.png', 'Dist00-Low-Root-Connector1.zip', '1O-Yb-I0xTkRJm3ttMyA9InSHP56jJtav', 'dist00 돌바닥을 지나는 낮은 뿌리 연결부(에피소드1A L28), 바닥에 누운 비충돌 장식(R141)'),
 'window': ('dist00-corridor-window', 'exec-2a15a13c-f7bf-4346-8dd2-a3af80c33ad3.png', 'StoryWorld-corridor-window-faceless-static-candidate.zip', '14nRYLGrxTB5RWxxlVyiY5fMh5nEuv7F9', 'dist00 뒷벽 부착 창과 얼굴 없는 성상(에피소드1A L28), 비충돌·비상호작용 장식'),
 'weed':   ('dist02-waterweed-clump1', 'exec-13b0a057-b48e-4ee6-8f26-46305554a700.png', 'Dist02-Waterweed-Clump1.zip', '1WFaucz-Li0pzqQLylwEoe5bkcxJ-1P_s', 'dist02 늪지대 수초 덩어리(에피소드1A L45, 드라이브 10-30 R145), 바닥 비충돌 장식(붙잡기 판정 없음)'),
 'ripple': ('dist02-quiet-ripple2', 'exec-f6f56781-a6ee-49ad-a231-9523f558a31d.png', 'Dist02-Quiet-Ripple-v2.zip', '1EXrdaguXu6KehgPeKbhYzQy2B8vJIUlI', 'dist02 늪 수면 잔물결 v2(에피소드1A L47, R145), 바닥에 눕힌 비충돌 장식(애니 없음)'),
 'chain':  ('dist03-ash-chain1', 'exec-21b87d0b-549e-4878-a989-6954f6629543.png', 'Dist03-Ash-Chain1.zip', '1zanY1daqpUJDC_4xhp6ZmE-Vw1T75LW8', 'dist03 재에 묻힌 사슬(에피소드1A L59, R145), 바닥 비충돌 장식(당김·충돌 없음)'),
 'sign':    ('ep1a09-injection-room-sign1', 'exec-a70fb87b-25ed-4015-b6fa-bfb6bd43d6d0.png', 'Ep1A09-Injection-Room-Sign1.zip', '1DXL9GrVO7fTEIdO9tPov8B5z6Jj70fFe', 'ep1a09 주사실 벽 표지(에피소드1A L116, R146), 벽에 붙여 띄운 비충돌 장식'),
 'hwindow': ('ep1a11-hospital-window-lit2', 'exec-65406de3-a465-4587-929a-6977267c8e55.png', 'Ep1A11-Hospital-Window-Lit-v2.zip', '1rNXmFJgh3mNb80buhsaMnUHOGj-9jThm', 'ep1a11 불 켜진 병원 창문 v2(L154, R146), 벽에 붙인 비충돌 장식'),
 'syringe': ('ep1a11-scattered-syringes1', 'exec-1d6e16eb-870a-41a6-95bc-e4459c7c4399.png', 'Ep1A11-Scattered-Syringes1.zip', '1uyMhPUZR0WPR6BqQ_C0r-l-Bpzco7nSc', 'ep1a11 바닥에 흩어진 주사기(L140, R146), 바닥 비충돌 장식(획득·독 효과 없음)'),
 'fridge':  ('ep1b02-rusted-fridge1', 'exec-d8041d29-3d7b-4b5f-9426-e15228b977d3.png', 'Ep1B02-Rusted-Fridge1.zip', '1Q2x6yzmzL7rhkv6wzm2XXTfSgGiwTbWY', 'ep1b02 나태의 집 녹슨 냉장고(최종본2 L33, R146), 벽에 기댄 비충돌 장식(열림 없음)'),
 'pet':     ('ep1b02-crushed-pet-scatter1', 'exec-f833bd14-4d3a-4af9-9700-b2d780c005fb.png', 'Ep1B02-Crushed-PET-Scatter1.zip', '1ngS1YEyZblD7FeOu839xRMLn-3GAi2EG', 'ep1b02 찌그러진 페트병(L31, R146), 바닥 비충돌 장식'),
 'glasses': ('ep1b03-cracked-glasses1', 'exec-31c52fe0-1361-4ffc-9c92-9bcbd10cde4d.png', 'Ep1B03-Cracked-Glasses1.zip', '1BPCsu5tD-OA9na7K3q-VKckelDa5ldkX', 'ep1b03 금 간 안경(L48, R146), 바닥 비충돌 장식(획득 없음)'),
 'plate':   ('ep1b04-disturbed-food-plate1', 'exec-678e8efe-31ee-4aac-82e0-53c73e21ac45.png', 'Ep1B04-Disturbed-Food-Plate1.zip', '1a-rethceU4SpBO72x5G-EoF9KBBPx4EM', 'ep1b04 탐식의 주방 흐트러진 식사 접시(L58, R146), 바닥 비충돌 장식'),
 'counter': ('ep1b04-low-kitchen-counter1', 'exec-dd4024c1-8a69-4c32-a8d3-b1c077aaa1d9.png', 'Ep1B04-Low-Kitchen-Counter1.zip', '1UwJyLJH-LulUClr-Vhj5nBSK3n_a25Qd', 'ep1b04 낮은 조리대(L60, R146), 벽에 붙인 비충돌 장식'),
 'cwindow': ('ep1b06b-cabin-snow-window1', 'exec-0e472b10-f865-4e80-ac59-5dfbf0b97692.png', 'Ep1B06B-Cabin-Snow-Window1.zip', '1AjrEE46hTX_LVVEIhWuy3TsKQVjPTdFe', 'ep1b06b 눈보라 속 오두막 눈 쌓인 창문(R146), 벽에 붙인 비충돌 장식'),
}
idx_path = out / 'index.json'
index = json.loads(idx_path.read_text(encoding='utf-8')) if idx_path.exists() else {'revision': 'R138', 'props': {}}
for pid, (folder, name, zipname, drive_id, use) in JOBS.items():
    d = next((p for p in src.rglob(folder) if p.is_dir()), None)
    if not d or not (d / name).exists(): print('skip', pid, '(bundle not found)'); continue
    raw = (d / name).read_bytes(); man = json.loads(next(p for p in [d / 'manifest.json', d / 'MANIFEST.json'] if p.exists()).read_text(encoding='utf-8'))
    if isinstance(man, list): man = {e.get('file') or e.get('name') or e.get('path'): e for e in man}  # R146: 목록 형식 MANIFEST(오두막 창문 묶음)
    man = {k.split('/')[-1]: v for k, v in man.items()}
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
 'samong-puppet-ego': {'driveIds': ['1t2TyZV4aFJGRUIl_tX-7qyRTykPf5w3X', '1oz-tTJmho5E04AoUwWy7wqNxIXczx_Wc'], 'reason': '사몽 이후 대체 몹 — 적용 범위 정책상 지정된 맵·빈 슬롯이 확인되지 않아 보류'},
 'samong-memory-fallback': {'driveIds': ['1Qah1IFb-WLqbwOY_Hy1zt7B2BYr-_udz', '14UJQ_X4nLE2BI0CYz6PKvHg7uPUhHbaD', '1SOlmkZgJ1FYBbJ5Qtnoyyg-m1X_aVZZX'], 'reason': '사몽 이후 대체 조형물·타일 — 기존 적합 자산 있음, 타일 무봉합 미통과(범위 정책)'},
 'root-black-sap-v2': {'driveId': '11OJb8NC-43IW1eKWfaO4f1RO4GRHynaP', 'reason': '검 부착·타이밍 미검증 효과 원화'},
 'r74-root-tracker-short-contact1': {'driveId': '1-OOS85KGVx20Gmo_fYSmpY1BT_INOF60', 'reason': '공격 키 후보(몸 고정 실패)'},
 'M004-flight-render-review-aid': {'driveId': '1vLED3dhOrKdQlcV1VtrRxbvgyoRRcTxw', 'reason': 'NOT-runtime 표기'},
}
idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
