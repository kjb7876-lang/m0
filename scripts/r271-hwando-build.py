#!/usr/bin/env python3
"""R271 환도 통합 v2 정리판 → 게임용 아틀라스 (사용자 2026-11-03 "구글드라이브에 환도신자산올라오면 그걸로 모두교체 디테일이랑 너가 보정개선해서 적용").

원천(읽기 전용, Drive 폴더 'Hwando Unified v2 polish' 의 v2 8팩 + 변경 없는 walk-S v1, SHA-256 은 DOWNLOADS.json 과 대조해 index.json 에 기록):
  걷기 N/E/W 12키·80ms, S 8키·100ms / 대기 N/S/E/W 13표시·2800ms(W 는 원천에서도 E 표시 미러) / 공격 E 12키(1290ms, 한 번 재생 후 마지막 자세 유지).
  원천은 512×512 칸·고정 등록점(256,400)·클립마다 다른 고정 배율(0.75~1.3) 이라 클립 사이 몸 키가 212~242px 로 다르다.

다듬기(그림 모양은 바꾸지 않는다 — 클립마다 한 번의 등비 배율·자르기·가장자리 정리만, 프레임별 재정렬 없음):
 1) 몸 키 통일: 클립마다 접지선(실루엣 바닥 중앙값)−머리 꼭대기(몸 중심 ±40px 열, 중앙값)를 재서 180px 가 되게 한 번 줄인다(등비, premultiplied 리샘플).
 2) 발 기준점: x 는 원천 고정 등록점(256)×배율(발 띠 중심은 칼끝·한 발에 끌려 흔들려 쓰지 않음), y 는 같은 클립 접지선 중앙값 → anchor. 게임은 이 점을 영웅 발 위치에 놓는다.
 3) 가장자리: 줄인 뒤 알파<6 은 0, 알파 0 픽셀의 RGB 는 0(밝은 테두리 번짐 방지).
 4) 동작마다 모든 칸 합집합으로 한 번 잘라 아틀라스(줄 최대 4096px) WebP 무손실로 저장.
 5) 걷기 보폭: E 옆모습 칸들의 발 띠 폭 최대−최소 = 한 걸음, 12칸 = 두 걸음 → px_per_frame.
사용: python3 scripts/r271-hwando-build.py <드라이브 zip 들을 각자 폴더에 풀어 둔 상위 폴더> <DOWNLOADS.json> <출력 assets/r271/hwando>
"""
import sys, os, json, glob, hashlib
import numpy as np
from PIL import Image

MAXW = 4096
BODY = 180.0
IDS = {
 'Hwando-Unified-walk-N-v2-polish.zip': '1cZFR-XARnFs0QO3bfnEOWgozCgdyyKnp',
 'Hwando-Unified-walk-E-v2-polish.zip': '1LnDWLyuA6STdevJQLW6ykR-907vHWPDF',
 'Hwando-Unified-walk-W-v2-polish.zip': '1cKbVjkYcyr5oMRTPoNnKHThRGY2DkVdB',
 'Hwando-Unified-walk-S-v1.zip': '1CYgpBAmTwGGwXDMda-5wNaQT6733j0T1',
 'Hwando-Unified-idle-N-v2-polish.zip': '1qz3ehPAd2bn2RRrmxgJKMTVb8TPh6hOs',
 'Hwando-Unified-idle-S-v2-polish.zip': '1lgeNp68ySp6hwPTJMW0hRCeA_KTO40u6',
 'Hwando-Unified-idle-E-v2-polish.zip': '17ioNMP11wTAQSFORh8KtHJfmobhAarDP',
 'Hwando-Unified-idle-W-v2-polish.zip': '10rcHGhso9nsVEK5XJnBjXQaFhU2cHbBS',
 'Hwando-Unified-attack-E-v2-polish.zip': '1U2vgjdl-Oq32B7Yh2D6lULvSwRrOcYfK',
}


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def measure(cells):
    bots, tops, cxs = [], [], []
    for im in cells:
        a = np.array(im)[..., 3] >= 16
        ys, xs = np.nonzero(a)
        bot = ys.max(); bots.append(int(bot))
        band = a[max(0, bot - 12):bot + 1]
        bx = np.nonzero(band)[1]
        cx = float(np.median(bx)) if len(bx) else float(np.median(xs)); cxs.append(cx)
        c = int(cx)
        col = a[:, max(0, c - 40):c + 40]
        ty = np.nonzero(col.any(1))[0]
        tops.append(int(ty.min()) if len(ty) else int(ys.min()))
    return np.array(bots), np.array(tops), np.array(cxs)


def clean(im):
    a = np.array(im)
    a[a[..., 3] < 6] = 0
    return Image.fromarray(a, 'RGBA')


def main(root, downloads, out):
    os.makedirs(out, exist_ok=True)
    want = {a['name']: a for a in json.load(open(downloads))['assets']}
    idx = {'revision': 'R271-hwando-1', 'source': [], 'body': BODY, 'anims': {}, 'notes': [
        'W 대기는 원천에서도 E 표시 미러(장비손 반전). 공격은 E 한 종류뿐 — W 는 E 를 좌우로 뒤집어 그리고, N/S 공격·피격은 R242 그림을 쓴다(원천에 없음).',
        '공격 6→7 큰 방향 전환·끝 자세에서 대기 복귀 동작 부재는 원천의 알려진 제약 그대로.']}
    for zp in sorted(glob.glob(os.path.join(root, 'Hwando-Unified-*', '*.zip'))):
        name = os.path.basename(zp)
        if name not in IDS:
            continue
        zs = sha(zp)
        assert zs == want[name]['sha256'], name
        aj = glob.glob(os.path.join(os.path.dirname(zp), 'x', 'hwando-unified-v1', '*', '*', 'animation.json'))[0]
        j = json.load(open(aj)); d = os.path.dirname(aj)
        act, dr = j['action'], j['direction'].lower()
        sheet_p = os.path.join(d, j['sheet']['file'])
        sh = Image.open(sheet_p).convert('RGBA')
        cells = [sh.crop((x, y, x + w, y + h)) for x, y, w, h in (f['sheet_rect'] for f in j['frames'])]
        bots, tops, cxs = measure(cells)
        body0 = float(np.median(bots - tops)); s = BODY / body0
        W0, H0 = cells[0].size; nw, nh = round(W0 * s), round(H0 * s)
        sc = [clean(c.convert('RGBa').resize((nw, nh), Image.LANCZOS).convert('RGBA')) for c in cells]
        b2, t2, c2 = measure(sc)
        box = None
        for c in sc:
            bb = c.getbbox(); box = bb if box is None else (min(box[0], bb[0]), min(box[1], bb[1]), max(box[2], bb[2]), max(box[3], bb[3]))
        box = (max(0, box[0] - 2), max(0, box[1] - 2), min(nw, box[2] + 2), min(nh, box[3] + 2))
        cw, ch = box[2] - box[0], box[3] - box[1]
        n = len(sc); cols = max(1, min(n, MAXW // cw)); rows = -(-n // cols)
        A = Image.new('RGBA', (cols * cw, rows * ch), (0, 0, 0, 0))
        for i, c in enumerate(sc):
            A.paste(c.crop(box), ((i % cols) * cw, (i // cols) * ch))
        key = f'{act}-{dr}'
        p = os.path.join(out, key + '.webp'); A.save(p, 'WEBP', lossless=True, method=6)
        b = open(p, 'rb').read()
        rec = dict(file=key + '.webp', n=n, cols=cols, cell=[cw, ch], atlas=list(A.size), ms=[f['duration_ms'] for f in j['frames']],
                   anchor=[round(j['registration_point'][0] * s - box[0], 1), float(np.median(b2)) - box[1]], body=round(float(np.median(b2 - t2)), 1),
                   loop=bool(j.get('loop', True)), bytes=len(b), sha256=hashlib.sha256(b).hexdigest(),
                   measured=dict(src_body_px=body0, scale=round(s, 4), src_foot_px=[int(bots.min()), int(np.median(bots)), int(bots.max())],
                                 foot_jitter_px=round(float(b2.max() - b2.min()), 1), body_px=[int((b2 - t2).min()), int((b2 - t2).max())]))
        if act == 'walk' and dr == 'e':
            spans = []
            for c in sc:
                a = np.array(c)[..., 3] >= 16; bot = np.nonzero(a.any(1))[0].max(); xs = np.nonzero(a[bot - 10:bot + 1].any(0))[0]; spans.append(xs.max() - xs.min())
            step = float(max(spans) - min(spans))
            idx['anims'].setdefault('walk', {})['stride'] = dict(step_px=round(step, 1), frames_per_stride=n, px_per_frame=round(2 * step / n, 2),
                                                                 note='E 발 띠 폭 최대−최소 = 한 걸음, 12칸 = 두 걸음')
        idx['anims'].setdefault(act, {})[dr] = rec
        idx['source'].append(dict(zip=name, drive_id=IDS[name], zip_sha256=zs, zip_bytes=os.path.getsize(zp), sheet_sha256=sha(sheet_p),
                                  sheet_sha256_listed=j['sheet'].get('sha256'), clip=f'{act}-{j["direction"]}', mirror_in_source=bool(j.get('mirror')),
                                  purpose=f'환도 {act} {j["direction"]}', applied=True, derived=key + '.webp'))
        print(key, rec['measured'], 'anchor', rec['anchor'], 'cell', rec['cell'], 'bytes', len(b))
    json.dump(idx, open(os.path.join(out, 'index.json'), 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main(*sys.argv[1:4])
