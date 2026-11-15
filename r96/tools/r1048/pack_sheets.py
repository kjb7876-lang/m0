# R1048 렌더 결과(<out>/sheets.json + <동작>-<방향>.png) → 게임 자산(webp) + 데이터 파일(ego-motion-r1048-sheets.js).
# 실행: python3 pack_sheets.py <render_out> <assets_dir(r96/runtime-text/assets/r1048/ego)> <data_js(r96/client-source/ego-motion-r1048-sheets.js)> [--quality 88] [--cell 160]
#  · 반투명 가장자리를 지키려고 무손실 알파 + 손실 색(quality)로 저장한다.
#  · 데이터 파일이 생기면 ego-motion-r1048.js 재생기가 켜진다(없으면 꺼져 있음). 임시 모델 결과는 게임에 넣지 않는다.
import sys, os, json
from PIL import Image
src, dst, js = sys.argv[1:4]
q = int(sys.argv[sys.argv.index('--quality') + 1]) if '--quality' in sys.argv else 88
CELL = int(sys.argv[sys.argv.index('--cell') + 1]) if '--cell' in sys.argv else 0  # 게임 칸 크기로 줄이기(모바일 메모리: 320 → 160 이면 1/4)
os.makedirs(dst, exist_ok=True)
meta = json.load(open(os.path.join(src, 'sheets.json')))
total = 0
for name in meta['actions']:
    for d in meta['dirs']:
        p = os.path.join(src, f'{name}-{d}.png')
        im = Image.open(p).convert('RGBA')
        if CELL and CELL != meta['cell']: im = im.resize((im.width * CELL // meta['cell'], CELL), Image.LANCZOS)
        out = os.path.join(dst, f'{name}-{d}.webp')
        im.save(out, 'WEBP', quality=q, method=6, exact=False, alpha_quality=100)
        total += os.path.getsize(out)
K = (CELL / meta['cell']) if CELL else 1
data = {'base': 'assets/r1048/ego/', 'ext': 'webp', 'cell': CELL or meta['cell'], 'bodyPx': round(meta['bodyPx'] * K, 1) if meta.get('bodyPx') else None,
        'foot': [round(v * K, 1) for v in meta['foot']] if meta.get('foot') else None,
        'dirs': meta['dirs'], 'model': meta.get('model'),
        'actions': {k: {kk: v[kk] for kk in ('frames', 'fps', 'loop', 'phases', 'strideSpeed') if v.get(kk) is not None} for k, v in meta['actions'].items()}}
open(js, 'w').write('/* R1048 EGO 8방향 미리 렌더 시트 목록 — r96/tools/r1048/pack_sheets.py 가 만든다(손으로 고치지 않음). */\n'
                    'window.__STORYWORLD_EGO_MOTION_R1048_SHEETS__=Object.freeze(' + json.dumps(data, ensure_ascii=False) + ');\n')
print('webp total bytes', total)
