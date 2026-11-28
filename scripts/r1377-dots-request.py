"""R1377 Dots 요청서 생성: 전수 측정(bodies.json·census 폴더)에서 보스·중간보스(물결 A) 또는 일반 몹(물결 B·C)의
필요 그림 목록 + 게임 속 실제 그린 칸 참고 그림(webp)·ZIP(3MB 이하로 나눔)을 만든다.
사용: python3 scripts/r1377-dots-request.py <bodies.json> <census 폴더> <출력 폴더> <물결 A|B|C>
"""
import json, os, re, sys, zipfile, hashlib, io
from PIL import Image
bodies, croot, out, wave = sys.argv[1:5]
g = json.load(open(bodies)); os.makedirs(out, exist_ok=True)
rank = {'B': 2, 'M': 1, 'm': 0}
s = open('r96/client-source/move-dir-r974-data.js').read() + open('r96/client-source/move-dir-r1018-data.js').read()
HAVE_UD_WALK = set(re.findall(r'"([A-Za-z0-9_\-]+)":\{"idle"', s))
# 손대지 않음: 맘몬 지역(사용자 승인 필요), 교만의 사이보그 교주(R1376 스레드), 7대죄 3D(측정에서 이미 빠짐)
SKIP_IDS = {'b06b-boss', 'mb-ep1b06b', 'c104-boss'}
SKIP_ZONES = {'ep1b06', 'ep1b06b'}
# 이미 정해진 추가 요청(그림 자체가 다른 칸·없는 칸)
EXTRA = {
 'dist00-boss': ['atk_side8 (지금 공격 열쇠 자세 p1~p3 은 옛 그림 — 날개 색·머리·뿌리 모양을 대기 시트와 같게; R1337 이월)'],
 'mb-dist03': ['idle_side6', 'walk_side8', 'atk_side8 (지금 p1 들기→p2 내려찍기→p3 이어 베기→p4 회수 흐름을 칸 사이 이어지게)', 'hit_side4 (R1337 이월)'],
 'dist06-boss': ['walk_side8', 'atk_side8 (대기 시트와 같은 칼 불꽃·망토; R1337 이월)'],
 'mb-murder01': ['walk_side8 (손그림, 무릎 굽힘 — 지금은 코드 관절 변형 #1061)'],
 'mb-murder02': ['walk_side8 (손그림 — 지금은 코드 관절 변형 #1061)'],
 'murder04-mid': ['walk_side8 (손그림 — 지금은 코드 관절 변형 #1061)'],
 'mb-murder03': ['walk_side8 (손그림 — 지금은 코드 관절 변형 #1061)'],
 'blue-executor': ['walk_side8 (손그림 — 지금은 코드 관절 변형 #1061)'],
}
# 전수 대조(qa/r1377/dir-art.json block): 걷기·공격·피격 그림 일부가 다른 인물·다른 결 → 대기 그림과 같은 인물로 옆 동작을 새로
MISMATCH = {M['id']: M['block'] for M in json.load(open('r96/qa/r1377/dir-art.json', encoding='utf-8'))['mobs'] if M.get('block')}
def need(x, boss):
    st = x['states']; n = []
    a = 6 if boss else 4
    if st.get('idle', {}).get('cells', 0) < 3: n.append(f'idle_side{6 if boss else 4}')
    if x['id'] not in HAVE_UD_WALK: n += ['walk_up4', 'walk_down4']
    if st.get('walk', {}).get('cells', 0) < 4 or x.get('slide'): n.append(f'walk_side{8 if boss else 6}')
    if st.get('attack', {}).get('cells', 0) < 3: n.append(f'atk_side{a}')
    n += [f'atk_up{a}', f'atk_down{a}']
    if st.get('hit', {}).get('cells', 0) < 2: n.append('hit_side4')
    if x['id'] in MISMATCH:
        bad = ', '.join(sorted({q.split('/')[-1] for q in MISMATCH[x['id']]}))
        for q in (f'walk_side{8 if boss else 6}', f'atk_side{a}', 'hit_side4'):
            if q not in n: n.append(q)
        n.append(f'(지금 {bad} 는 다른 인물·창백한 결이라 게임에서 막아 둠 — 참고 idle 그림과 같은 인물로)')
    for e in EXTRA.get(x['id'], []):
        base = e.split(' ')[0]; n = [q for q in n if q.split('_')[:2] != base.split('_')[:2] or q == base] ; n = [q for q in n if q != base] + [e]
    return n
items = []
for k, v in g.items():
    kind = max((y['kind'] for y in v), key=rank.get)
    boss = rank[kind] >= 1
    if (wave == 'A') != boss: continue
    x = sorted(v, key=lambda y: (y['zone'].startswith('sz'), -y['score']))[0]
    if x['id'] in SKIP_IDS or x['zone'] in SKIP_ZONES: continue
    items.append((kind, x, k, v))
# 순서: 보스 먼저, 스토리 → 사몽 계열, 점수 높은 순
items.sort(key=lambda t: (-rank[t[0]], t[1]['id'] not in MISMATCH, t[1]['zone'].startswith('sz'), -t[1]['score']))
# 일반 몹은 물결 B(앞 100종: 다른 인물 섞임·점수 높은 순)와 C(나머지)로 나눈다
if wave == 'B': items = items[:100]
elif wave == 'C': items = items[100:]
ref = os.path.join(out, 'ref'); os.makedirs(ref, exist_ok=True)
lines = []; refs = []
for i, (kind, x, k, v) in enumerate(items, 1):
    code = f'{wave}{i:02d}'
    M = json.load(open(os.path.join(croot, x['zone'], 'census.json')))['mobs'][x['id']]
    pics = []
    for S in ('idle', 'attack', 'walk'):
        L = sorted(M['states'].get(S, []), key=lambda o: -o['n'])
        if not L: continue
        p = os.path.join(croot, x['zone'], M['dir'], L[0]['file'])
        if not os.path.exists(p): continue
        im = Image.open(p).convert('RGBA'); bb = im.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
        if bb: im = im.crop(bb)
        sc = min(1, 360 / im.height); im = im.resize((max(1, round(im.width * sc)), max(1, round(im.height * sc))), Image.LANCZOS)
        fn = f'{code}_{S}.webp'; im.save(os.path.join(ref, fn), 'WEBP', quality=82, method=6); pics.append(fn); refs.append(fn)
    zones = sorted({y['zone'] for y in v})
    n = need(x, rank[kind] >= 1)
    lines.append(f"{code}  [{ {'B':'보스','M':'중간보스','m':'몹'}[kind] }] {x['name']}  (id {x['id']}, 지역 {', '.join(zones[:4])}{' 외' if len(zones) > 4 else ''})\n"
                 f"     지금 게임 그림: {k}\n     참고: {', '.join(pics)}\n     그릴 것: {' · '.join(n)}")
# ZIP 3MB 이하로 나눔
parts = []; cur = []; size = 0
for fn in refs:
    b = os.path.getsize(os.path.join(ref, fn))
    if cur and size + b > 2_900_000: parts.append(cur); cur = []; size = 0
    cur.append(fn); size += b
if cur: parts.append(cur)
zips = []
for j, P in enumerate(parts, 1):
    zp = os.path.join(out, f'SW-2D-R1377-{wave}_ref_part{j}of{len(parts)}.zip')
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_STORED) as z:
        for fn in P: z.write(os.path.join(ref, fn), fn)
    zips.append((os.path.basename(zp), os.path.getsize(zp), hashlib.sha256(open(zp, 'rb').read()).hexdigest()))
json.dump({'wave': wave, 'items': [{'code': f'{wave}{i:02d}', 'id': t[1]['id'], 'zone': t[1]['zone'], 'name': t[1]['name'], 'kind': t[0], 'body': t[2], 'need': need(t[1], rank[t[0]] >= 1)} for i, t in enumerate(items, 1)], 'zips': zips}, open(os.path.join(out, f'SW-2D-R1377-{wave}_list.json'), 'w'), ensure_ascii=False, indent=1)
open(os.path.join(out, f'SW-2D-R1377-{wave}_items.txt'), 'w').write('\n\n'.join(lines) + '\n')
print(len(items), 'items', [(z[0], z[1]) for z in zips])
