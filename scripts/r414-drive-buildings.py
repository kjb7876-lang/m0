#!/usr/bin/env python3
"""R414: Drive 'StoryWorld-Resumed' building/prop candidates (Dots, 2026-11-08, REVIEW/HOLD) -> in-game derivatives.

User 2026-11-08: "구글드라이브자산 적절히 크기조절해서 배치 특히 건물자산의 경우 최소영웅2배높이이상"
(place the Drive assets at sensible sizes; buildings at least twice the hero's height).
The hero is drawn 66 px tall at zoom 1 (actorHeight), so every building row below is >= 132 px.

Originals are never changed. For each candidate folder (unzipped StoryWorld-ResumedNNN-*.zip):
  1. the PNG sha256 is checked against the candidate's MANIFEST.json;
  2. cleaned like R406: alpha LO..HI -> 0..255 (soft halo below LO dropped), 1 px erode, edge RGB from opaque
     neighbours, crop to the alpha box + 4 px;
  3. scaled so the long side is <= 600 px (buildings) / 384 px (props), WebP q90.
Buildings go to assets/r414/buildings (placed by r96/client-source/drive-buildings-r414.js behind the back edge of
outdoor dream zones); small props go to assets/r414/props in the R406 index format (placed by props-place-r406.js).
Zones follow the candidate's canon lines (hapil-canon-20261101.txt line numbers in each MANIFEST) and the nearest
outdoor samong zone; candidates whose scene is indoor-only are held with the reason written into index.json.

usage: python3 -I scripts/r414-drive-buildings.py <dir of unzipped candidate folders> [runtime-text dir]
"""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

src = Path(sys.argv[1]); rt = Path(sys.argv[2] if len(sys.argv) > 2 else 'r96/runtime-text')
LO, HI = 72, 230
# Dots asset id -> (file name, samong zone, draw height px at zoom 1). Hero = 66 px, so >= 132 = 2x hero.
BUILDINGS = {
  'S01-teacup-rose-house-building': ('teacup-rose-house', 'sz115-S01-2', 170),
  'S03-training-gym-building': ('training-gym', 'sz115-S03-5', 140),
  'S03-gym-impact-damaged': ('training-gym-ruin', 'sz115-S03-6', 140),
  'S04-windowless-emotion-tower': ('emotion-tower', 'sz115-S04-1', 300),
  'S04-shuttered-research-building': ('research-block', 'sz115-S04-1', 210),
  'S05-dressmaker-shop-building': ('dressmaker-shop', 'sz115-S05-2', 170),
  'S05-snowy-corner-tavern-building': ('corner-tavern', 'sz115-S05-2', 175),
  'S05-officer-residence-building': ('officer-residence', 'sz115-S05-4', 180),
  'S05-residence-attack-damaged': ('officer-residence-ruin', 'sz115-S05-6', 180),
  'S06-civilian-shelter-headhouse': ('shelter-headhouse', 'sz115-S06-3', 140),
  'S06-civilian-broadcast-station': ('broadcast-station', 'sz115-S06-10', 190),
  'S06-polar-shelter-access-block': ('polar-access', 'sz115-S06-17', 145),
  'S06-polar-access-attack-damaged': ('polar-access-ruin', 'sz115-S06-18', 145),
  'R02-gray-school-building-shell': ('gray-school', 'sz115-RA-4', 190),
  'R02-hospital-admissions-wing': ('hospital-admissions', 'sz115-RA-4', 200),
  'R07-red-garden-arched-bridge': ('red-garden-bridge', 'sz115-RD-1', 136),
  'R07-low-roof-waterside-house': ('waterside-house', 'sz115-RD-1', 165),
  'KAIR-workshop-attack-damaged': ('black-workshop-ruin', 'sz115-RD-6', 175),
  'R11-gallery-cathedral-damaged': ('gallery-cathedral-ruin', 'sz115-RD-6', 250),
  'TWIN-mixed-gatehouse-attack-damaged': ('twin-gatehouse-ruin', 'sz115-RG-1', 220),
  'R03-inner-keep-attack-damaged': ('inner-keep-ruin', 'sz115-RG-1', 230),
  'M02-abandoned-saebit-hotel': ('saebit-hotel', 'sz115-RG-8', 260),
  'R04-hotel-kitchen-service-annex': ('hotel-kitchen-annex', 'sz115-RG-8', 140),
  'R17-palace-garden-colonnade': ('palace-colonnade', 'sz115-RG-10', 140),
}
# small props -> R406 rows (mode wall: flush to a back wall, art parallel to the -y wall; inner: open floor near the anchor)
PROPS = {
  'teacup-room-floral-porcelain-wall': ('floral-porcelain-panel', 'sz115-S01-1', 'wall', 'y', 96),
  'R00-damaged-platform-pa-speaker': ('platform-speaker', 'sz115-RA-1', 'wall', 'y', 46),
  'S04-steel-elevator-entrance': ('steel-elevator', 'sz115-S04-2', 'wall', 'y', 100),
  'R07-fallen-ceiling-rafters': ('fallen-rafters', 'sz115-RD-1', 'inner', None, 52),
  'S05-residence-streetlamp-unlit': ('residence-lamppost', 'sz115-S05-4', 'inner', None, 140),
  'S05-residence-heavy-entry-door': ('residence-entry', 'sz115-S05-4', 'wall', 'y', 100),
  'S05-packed-departure-bag': ('departure-bag', 'sz115-S05-4', 'inner', None, 24),
}
HELD = {
  'S05-residence-entrance-eave-candidate': '처마 부품(단독 건물·소품 아님)',
  'twin-castle-mixed-masonry-wall': '이음벽 부품(단독 건물·소품 아님)',
  'R11-gallery-cathedral-building': '원문 장면(RD-7 성당 제단)이 실내형 — 같은 장소의 피해 변형을 야외 RD-6 에 배치',
  'KAIR-black-workshop-building': '원문 장면(kair07 검은 공방)이 실내 — 같은 장소의 피해 변형을 야외 RD-6(포격 거리)에 배치',
  'R03-inner-citadel-keep': '원문 장면(RB-2·RG-6)이 실내형 — 같은 장소의 피해 변형을 야외 RG-1 전장에 배치',
  'TWIN-mixed-masonry-gatehouse': '원문 장면(hando01·02)이 벽으로 둘린 이야기 지도라 뒤쪽 빈 땅이 없음 — 피해 변형을 야외 RG-1 전장에 배치',
  'EP-recovery-pavilion-building': '원문 장면(종장 병실 M-4)이 실내형',
  'R14-voluntary-atelier-building': '원문 장면(RG-4 도겸의 작업실)이 실내형',
  'M04-cheongrok-villa': '원문 장면(murder04 청록빌라)이 실내 이야기 지도',
  'R01-orphanage-courtyard-building': '원문 장면(RA-3)이 실내형, RA-4 에는 원문 건물 둘(학교·원무동)이 이미 있음',
  'R15-corridor-archive-wing': '원문 장면(RG-7 카이로 회랑)이 실내형',
  'S06-undersea-laboratory-module': '바다 밑 시설 — 맞는 야외 꿈 지역이 없음',
  'S06-undersea-lab-attack-damaged': '바다 밑 시설 — 맞는 야외 꿈 지역이 없음',
  'R00-station-concourse-shell': '속이 보이는 단면 구조(Dots HOLD_PROJECTION_MISMATCH)라 바깥 배치에 안 맞음',
}


def clean(im, long_side):
    a = np.asarray(im.convert('RGBA')).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3]
    al = np.clip((al - LO) * 255.0 / (HI - LO), 0, 255)
    al = np.asarray(Image.fromarray(al.astype(np.uint8)).filter(ImageFilter.MinFilter(3))).astype(np.float32)
    solid = al >= 250
    w = solid.astype(np.float32); acc = np.zeros_like(rgb); cnt = np.zeros_like(w)
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            acc += np.roll(np.roll(rgb * w[..., None], dy, 0), dx, 1); cnt += np.roll(np.roll(w, dy, 0), dx, 1)
    edge = (al > 0) & ~solid & (cnt > 0)
    rgb[edge] = acc[edge] / cnt[edge][:, None]
    img = Image.fromarray(np.dstack([rgb, al]).clip(0, 255).astype(np.uint8), 'RGBA')
    box = img.getchannel('A').point(lambda v: 255 if v >= 16 else 0).getbbox()
    box = (max(0, box[0] - 4), max(0, box[1] - 4), min(img.width, box[2] + 4), min(img.height, box[3] + 4))
    img = img.crop(box)
    s = min(1.0, long_side / max(img.size))
    return img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)


# R414-2 (7-discipline review 6.81: buildings were the brightest shapes on screen and floated on the void):
# grade every building toward the samong palette and sink its base into the dark. Value is compressed so the
# lightest wall top lands near bone #A59487 * .55, saturation is cut to 45 %, the colour is pulled toward
# blood-black #321B27, the lower part darkens progressively and the bottom 16 % fades out (no hard cut on the void).
VOID = np.array([0x32, 0x1B, 0x27], np.float32)
def grade(img):
    a = np.asarray(img.convert('RGBA')).astype(np.float32); rgb, al = a[..., :3], a[..., 3]
    lum = rgb @ np.array([.299, .587, .114], np.float32)
    rgb = lum[..., None] + (rgb - lum[..., None]) * .45            # desaturate
    rgb = rgb * .52                                                 # value compression (L* ~60-75 -> ~35-45)
    rgb = rgb * .72 + VOID * .28                                    # atmospheric pull toward blood-black
    h = rgb.shape[0]; t = (np.arange(h, dtype=np.float32) / max(1, h - 1))[:, None]
    rgb = rgb * (1.0 - .35 * np.clip((t - .45) / .55, 0, 1))[..., None]   # lower half darker (top keeps a rim of light)
    al = al * np.clip((1.0 - t) / .16, 0, 1)                        # bottom 16 % fades into the void
    return Image.fromarray(np.dstack([rgb, al]).clip(0, 255).astype(np.uint8), 'RGBA')


def lines(man):
    v = man.get('source_lines', man.get('source_line'))
    return [v] if isinstance(v, int) else list(v or [])


def candidates():
    for folder in sorted(p for p in src.iterdir() if p.is_dir()):
        man_p = folder / 'MANIFEST.json'
        if not man_p.exists():
            continue
        man = json.loads(man_p.read_text(encoding='utf-8'))
        pngs = [p for p in folder.glob('*.png') if not p.name.startswith('CPU-')]
        if len(pngs) != 1:
            raise SystemExit(f'{folder}: expected one candidate PNG, found {len(pngs)}')
        yield folder, man, pngs[0]


def derive(folder, man, png, out, name, long_side, graded=False):
    data = png.read_bytes(); sha = hashlib.sha256(data).hexdigest()
    assert man.get('sha256') == sha, ('manifest sha mismatch', folder.name, sha)
    img = clean(Image.open(png), long_side)
    if graded: img = grade(img)
    p = out / (name + '.webp'); img.save(p, 'WEBP', quality=90, alpha_quality=100, method=6)
    return img, p, sha


bout = rt / 'assets/r414/buildings'; pout = rt / 'assets/r414/props'
bout.mkdir(parents=True, exist_ok=True); pout.mkdir(parents=True, exist_ok=True)
bidx = {'revision': 'R414', 'method': f'alpha {LO}..{HI} -> 0..255, 1px erode, edge RGB from opaque neighbours, crop+4, long side <= 600, samong grade (sat .45, value .52, 28% toward #321B27, lower half darker, bottom 16% alpha fade), WebP q90',
        'hero': {'drawnHeightPx': 66, 'minBuildingPx': 132}, 'buildings': {}, 'held': {}}
pidx = {'revision': 'R414', 'method': f'alpha {LO}..{HI} -> 0..255, 1px erode, edge RGB from opaque neighbours, crop+4, long side <= 384, WebP q90', 'props': {}}
seen = set()
for folder, man, png in candidates():
    aid = man.get('id'); seen.add(aid)
    common = {'png': png.name, 'dotsId': aid, 'dotsStatus': man.get('status'), 'canonLines': lines(man), 'manifestChecked': True}
    if aid in BUILDINGS:
        name, zone, h = BUILDINGS[aid]; assert h >= 132, (name, h)
        img, p, sha = derive(folder, man, png, bout, name, 600, graded=True)
        bidx['buildings'][name] = {'zone': zone, 'height': h, 'path': 'assets/r414/buildings/' + p.name, **common, 'pngSHA256': sha,
                                   'size': list(img.size), 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
        print('building', name, zone, h, img.size, p.stat().st_size)
    elif aid in PROPS:
        name, zone, mode, axis, h = PROPS[aid]
        img, p, sha = derive(folder, man, png, pout, name, 384)
        pidx['props'][name] = {'zone': zone, 'mode': mode, 'axis': axis, 'height': h, 'path': 'assets/r414/props/' + p.name, **common,
                               'pngSHA256': sha, 'part': None, 'size': list(img.size), 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
        print('prop', name, zone, mode, h, img.size, p.stat().st_size)
    elif aid in HELD:
        bidx['held'][aid] = {'reason': HELD[aid], 'dotsStatus': man.get('status'), 'canonLines': lines(man)}
        print('held', aid)
    else:
        raise SystemExit(f'unlisted candidate {aid} in {folder}')
missing = (set(BUILDINGS) | set(PROPS) | set(HELD)) - seen
assert not missing, ('missing candidates', sorted(missing))
(bout / 'index.json').write_text(json.dumps(bidx, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
(pout / 'index.json').write_text(json.dumps(pidx, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
print(len(bidx['buildings']), 'buildings,', len(pidx['props']), 'props,', len(bidx['held']), 'held')
