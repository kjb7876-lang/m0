#!/usr/bin/env python3
"""R615: Dots CX-0067MV 걷기 8칸 시트를 게임 시트로 붙인다(원본 그림은 그대로 두고 새 파일).

사용: python3 scripts/r615-dots-walk.py <Dots 결과 폴더>
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
EXTEND = ['swamp-root-stalker-darkgreen-v2', 'legacy-m119-nameless-scar-v4',
          'legacy-m134-nightmare-v4', 'root-stalker-r74-plain', 'legacy-m110-time-guardian-v3',
          'dys-siege-gunner-v2', 'dys-prism-stalker-v2', 'dys-pulse-raider-v2']
SITE = os.path.join(os.path.dirname(__file__), '..', 'r96', 'hospital-three-pc', 'site')  # 압축 묶음에서 풀린 원본(ep1b·cult·murder)
# 새 행을 만들 몹: dots id → (행 id, 원본 경로, 지역, 이름, pivot, visibleHeight) — pivot·키는 R306 표의 원본 값 그대로
NEW = {
    'timeless_silver_scout': ('hando-timeless-silver-scout-walk-d1', 'assets/r99/clean/assets/hando-v3123/timeless_silver_scout.webp', 'hando01', '^악몽 정찰체', [208.5, 397], 370),
    'silver_seal_sentinel': ('hando-silver-seal-sentinel-walk-d1', 'assets/r99/clean/assets/hando-v3123/silver_seal_sentinel.webp', 'hando02', '^붕괴선 파수병', [208.5, 401], 375),
    'memory_excision_connector': ('hando-memory-excision-connector-walk-d1', 'assets/r99/clean/assets/hando-v3123/memory_excision_connector.webp', 'hando02', '^기억절제 연결자', [208.5, 400], 377),
    'rooftop_echo': ('murder-rooftop-echo-float-d1', 'assets/murder/rooftop_echo.png', 'murder01', '^끊어진 통화의 인과 잔향', [330, 749], 730),
    'u2_memory_orb': ('cult-memory-orb-float-d1', 'assets/r99/clean/assets/u2/generated-v350/u2_memory_orb.webp', 'cult01', '^기계화 복종 봉인구', [256, 444], 393),
    'black_robed_nightmare_demon': ('cult-nerve-cable-devourer-walk-d1', 'assets/cult-v3123/black_robed_nightmare_demon.webp', 'cult02', '^신경 케이블 포식체', [213, 402], 380),
    'seal_residual': ('ep1b-seal-residual-float-d1', 'assets/episode1b/generated-v394/seal_residual.webp', 'ep1b01', '^일흔두 번째 인장 잔류체', [209.5, 417], 194),
    'lust_asmodai': ('ep1b-red-heel-blade-walk-d1', 'assets/episode1b/generated-v394/lust_asmodai.webp', 'ep1b05', '^붉은 하이힐 칼날', [209, 418], 273),
    'greed_fox_hound': ('ep1b-banknote-blade-walk-d1', 'assets/episode1b/generated-v394/greed_fox_hound.webp', 'ep1b06', '^칼날이 된 지폐', [209.5, 418], 186),
    'polar_cyborg_hound': ('ep1b-steel-jaw-hound-walk-d1', 'assets/episode1b/generated-v394/polar_cyborg_hound.webp', 'ep1b09', '^강철 턱의 사이보그 개', [208, 418], 287),
    'u2_reactor_collector': ('u2-false-mercy-collector-walk-d1', 'assets/r99/clean/assets/u2/generated-v350/u2_reactor_collector.webp', 'u202', '^가짜 자비 수집가', [255.5, 445], 394),
    'polar_chairman': ('cult-mech-legs-walk-d1', 'assets/episode1b/generated-v394/polar_chairman.webp', 'cult05', '^설원 아래의 기계 다리', [208, 417], 285),
    'black_rose_chip_penitent': ('cult-ego-binder-walk-d1', 'assets/cult-v3123/black_rose_chip_penitent.webp', 'cult03', '^EGO 구속 연결자', [209, 396], 365),
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
    # 걷기 8칸, 떠 있는 몹은 떠다니기 6칸(파일 이름은 둘 다 walk8)
    sheet = Image.open(os.path.join(dots_dir, f'CX-0067MV_{did}_walk8.png')).convert('RGBA')
    n = sheet.width // cw
    assert n in (6, 8) and sheet.size == (cw * n, ch), (did, sheet.size, cw, ch)
    return [match_color(sheet.crop((i * cw, 0, (i + 1) * cw, ch)), ref) for i in range(n)]


def original(rel):
    for root in (RT, SITE):
        p = os.path.join(root, rel)
        if os.path.exists(p):
            return Image.open(p).convert('RGBA')
    raise FileNotFoundError(rel)


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
        if m['path'].endswith('-walk-d1.webp'):
            continue
        cw, ch = m['cell']
        src = Image.open(os.path.join(RT, m['path'])).convert('RGBA')
        n = min(m['move']) if m.get('walkSource') else m['cols']  # R613 제미나이 4칸은 빼고 원본 칸만
        orig = [src.crop((i * cw, 0, (i + 1) * cw, ch)) for i in range(n)]
        walk = walk_frames(dots_dir, mid, cw, ch, orig[0])
        rel = f'assets/r380/mobs/{mid}-walk-d1.webp'
        m['bytes'], m['sha256'] = save(orig + walk, cw, ch, rel)
        m['path'] = rel
        m['cols'] = n + len(walk)
        m['move'] = list(range(n, n + len(walk)))
        m['walkSource'] = f'Dots CX-0067MV_{mid}_walk8.png (색은 원본 0칸에 맞춤, R615)'
    for did, (rid, opath, zone, name, pivot, vh) in NEW.items():
        if rid in byid:
            continue
        orig = original(opath)
        cw, ch = orig.size
        walk = walk_frames(dots_dir, did, cw, ch, orig)
        rel = f'assets/r380/mobs/{rid}.webp'
        size, sha = save([orig] + walk, cw, ch, rel)
        idx['mobs'].append({'id': rid, 'kind': 'strip', 'path': rel, 'cell': [cw, ch], 'cols': 1 + len(walk), 'pivot': pivot, 'visibleHeight': vh,
                            'move': list(range(1, 1 + len(walk))), 'attack': [0], 'idle': [0], 'facing': 'right',
                            'actor': {'layer': 'STORY', 'zone': zone, 'name': name}, 'bytes': size, 'sha256': sha,
                            'source': [{'file': opath}, {'file': f'CX-0067MV_{did}_walk8.png'}],
                            'walkSource': f'Dots CX-0067MV_{did}_walk8.png (색은 원본에 맞춤, R615)', 'finalArt': False})
    json.dump(idx, open(IDX, 'w'), ensure_ascii=False, indent=1)
    open(IDX, 'a').write('\n')




def recompress(quality):
    """Pages 예산(1.1GB) 때문에 R615 새 시트만 낮은 WebP 품질로 다시 저장하고 해시·크기를 고친다."""
    idx = json.load(open(IDX))
    total = 0
    for m in idx['mobs']:
        if not str(m.get('walkSource', '')).endswith('R615)'):
            continue
        p = os.path.join(RT, m['path'])
        Image.open(p).save(p, 'WEBP', quality=quality, method=6)
        b = open(p, 'rb').read()
        m['bytes'], m['sha256'] = len(b), hashlib.sha256(b).hexdigest()
        total += len(b)
    json.dump(idx, open(IDX, 'w'), ensure_ascii=False, indent=1)
    open(IDX, 'a').write('\n')
    print('R615 sheets bytes', total)


def shrink(max_h, quality):
    """칸 높이가 max_h 보다 큰 R615 시트를 비율대로 줄인다(pivot·키도 같은 비율 → 화면 크기 그대로)."""
    idx = json.load(open(IDX))
    total = 0
    for m in idx['mobs']:
        if not str(m.get('walkSource', '')).endswith('R615)'):
            continue
        p = os.path.join(RT, m['path'])
        im = Image.open(p).convert('RGBA')
        cw, ch = m['cell']
        if ch > max_h:
            s = max_h / ch
            ncw = round(cw * s)
            s = ncw / cw
            nch = round(ch * s)
            cells = [im.crop((i * cw, 0, (i + 1) * cw, ch)).resize((ncw, nch), Image.LANCZOS) for i in range(m['cols'])]
            im = Image.new('RGBA', (ncw * m['cols'], nch), (0, 0, 0, 0))
            for i, c in enumerate(cells):
                im.paste(c, (i * ncw, 0))
            m['cell'] = [ncw, nch]
            m['pivot'] = [round(m['pivot'][0] * s, 2), round(m['pivot'][1] * s, 2)]
            m['visibleHeight'] = round(m['visibleHeight'] * s, 2)
        im.save(p, 'WEBP', quality=quality, method=6)
        b = open(p, 'rb').read()
        m['bytes'], m['sha256'] = len(b), hashlib.sha256(b).hexdigest()
        total += len(b)
    json.dump(idx, open(IDX, 'w'), ensure_ascii=False, indent=1)
    open(IDX, 'a').write('\n')
    print('R615 sheets bytes', total)


if __name__ == '__main__':
    if sys.argv[1] == '--recompress':
        recompress(int(sys.argv[2]))
    elif sys.argv[1] == '--shrink':
        shrink(int(sys.argv[2]), int(sys.argv[3]))
    else:
        main(sys.argv[1])
