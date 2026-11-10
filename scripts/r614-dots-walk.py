#!/usr/bin/env python3
"""R614: Dots CX-0067MV 걷기 8칸 시트를 게임 시트로 붙인다(원본 그림은 그대로 두고 새 파일).

사용: python3 scripts/r614-dots-walk.py <Dots 결과 폴더>
- 걷기 칸 색을 원본 첫 칸(불투명 픽셀) 평균·편차에 맞춘다(Dots 결과가 15~30 밝았음).
- R380 시트가 있는 몹: 원본 칸 + 걷기 8칸을 한 줄로 이어 새 webp, move 를 걷기 칸으로.
- R380 행이 없는 몹(환도 418×418 한 장): [원본 한 장 + 걷기 8칸] 새 webp + 새 R380 행(공격·서 있기 = 원본 한 장).
"""
import hashlib, json, os, sys
import numpy as np
from PIL import Image

RT = os.path.join(os.path.dirname(__file__), '..', 'r96', 'runtime-text')
IDX = os.path.join(RT, 'assets/r380/mobs/index.json')

# 기존 R380 행에 걷기 칸을 덧붙일 몹
EXTEND = ['swamp-root-stalker-darkgreen-v2', 'legacy-m119-nameless-scar-v4']
# 새 행을 만들 몹: dots id → (행 id, 원본 경로, 지역, 이름, pivot, visibleHeight) — pivot·키는 R306 표의 원본 값 그대로
NEW = {
    'timeless_silver_scout': ('hando-timeless-silver-scout-walk-d1', 'assets/r99/clean/assets/hando-v3123/timeless_silver_scout.webp', 'hando01', '^악몽 정찰체', [208.5, 397], 370),
    'silver_seal_sentinel': ('hando-silver-seal-sentinel-walk-d1', 'assets/r99/clean/assets/hando-v3123/silver_seal_sentinel.webp', 'hando02', '^붕괴선 파수병', [208.5, 401], 375),
    'memory_excision_connector': ('hando-memory-excision-connector-walk-d1', 'assets/r99/clean/assets/hando-v3123/memory_excision_connector.webp', 'hando02', '^기억절제 연결자', [208.5, 400], 377),
}


def stats(im):
    a = np.asarray(im).astype(np.float32)
    m = a[..., 3] > 128
    px = a[m][:, :3]
    return px.mean(0), px.std(0)


def match_color(frame, ref):
    rm, rs = stats(ref)
    a = np.asarray(frame).astype(np.float32)
    m = a[..., 3] > 0
    fm, fs = stats(frame)
    a[..., :3] = np.where(m[..., None], np.clip((a[..., :3] - fm) / np.maximum(fs, 1) * rs + rm, 0, 255), a[..., :3])
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def walk_frames(dots_dir, did, cw, ch, ref):
    sheet = Image.open(os.path.join(dots_dir, f'CX-0067MV_{did}_walk8.png')).convert('RGBA')
    assert sheet.size == (cw * 8, ch), (did, sheet.size, cw, ch)
    return [match_color(sheet.crop((i * cw, 0, (i + 1) * cw, ch)), ref) for i in range(8)]


def save(cells, cw, ch, rel):
    out = Image.new('RGBA', (cw * len(cells), ch), (0, 0, 0, 0))
    for i, c in enumerate(cells):
        out.paste(c, (i * cw, 0))
    p = os.path.join(RT, rel)
    out.save(p, 'WEBP', quality=88, method=6)
    b = open(p, 'rb').read()
    return len(b), hashlib.sha256(b).hexdigest()


def main(dots_dir):
    idx = json.load(open(IDX))
    byid = {m['id']: m for m in idx['mobs']}
    for mid in EXTEND:
        m = byid[mid]
        if m.get('walkSource'):
            continue
        cw, ch = m['cell']
        src = Image.open(os.path.join(RT, m['path'])).convert('RGBA')
        n = m['cols']
        orig = [src.crop((i * cw, 0, (i + 1) * cw, ch)) for i in range(n)]
        walk = walk_frames(dots_dir, mid, cw, ch, orig[0])
        rel = m['path'].replace('.webp', '-walk-d1.webp')
        m['bytes'], m['sha256'] = save(orig + walk, cw, ch, rel)
        m['path'] = rel
        m['cols'] = n + 8
        m['move'] = list(range(n, n + 8))
        m['walkSource'] = f'Dots CX-0067MV_{mid}_walk8.png (색은 원본 0칸에 맞춤, R614)'
    for did, (rid, opath, zone, name, pivot, vh) in NEW.items():
        if rid in byid:
            continue
        orig = Image.open(os.path.join(RT, opath)).convert('RGBA')
        cw, ch = orig.size
        walk = walk_frames(dots_dir, did, cw, ch, orig)
        rel = f'assets/r380/mobs/{rid}.webp'
        size, sha = save([orig] + walk, cw, ch, rel)
        idx['mobs'].append({'id': rid, 'kind': 'strip', 'path': rel, 'cell': [cw, ch], 'cols': 9, 'pivot': pivot, 'visibleHeight': vh,
                            'move': list(range(1, 9)), 'attack': [0], 'idle': [0], 'facing': 'right',
                            'actor': {'layer': 'STORY', 'zone': zone, 'name': name}, 'bytes': size, 'sha256': sha,
                            'source': [{'file': opath}, {'file': f'CX-0067MV_{did}_walk8.png'}],
                            'walkSource': f'Dots CX-0067MV_{did}_walk8.png (색은 원본에 맞춤, R614)', 'finalArt': False})
    json.dump(idx, open(IDX, 'w'), ensure_ascii=False, indent=1)
    open(IDX, 'a').write('\n')


if __name__ == '__main__':
    main(sys.argv[1])
