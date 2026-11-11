#!/usr/bin/env python3
"""R745 시네마틱 영상 검사 (ffmpeg 필요, 로컬 실행).

게임이 실제로 트는 시네마틱 영상 9편을 디코딩해서 잰다.
  1) 생성 도구 표시(워터마크) 잔상: 표시 투명도 지도(scripts/r745/marks/*.png)를 최종 화면 좌표로 옮겨,
     프레임마다 '표시가 남은 정도' k 를 최소제곱으로 구한다(원래 표시 그대로 = 1, 완전히 없음 = 0).
     |중앙값 k| < 0.15(덜 지움·너무 지움 모두) 이고 상위 10% k < 0.30 이어야 통과.
  2) 화질: 해상도(r617 세 편은 1280×720 으로 올림), H.264 yuv420p, faststart,
     x264 설정(veryslow 급 subme≥9, crf≤23), 파일 크기 한도.
  3) 소리: 통합 음량 -16±1 LUFS, 트루 피크 ≤ -1.0 dBTP, 48 kHz 스테레오(소리 있는 영상만).
  4) 길이: 게임 코드가 기대하는 길이 ±0.06초.
결과를 r96/qa/r745/measure.json 에 파일 sha256 과 함께 쓴다(CPU 검사가 이 sha 와 실제 파일을 대조).
쓰기: python3 r96/qa/r745/cinematic-check.py [--write]
"""
import hashlib, json, os, re, subprocess, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
A = os.path.join(ROOT, 'r96/runtime-text/assets')
MARKS = json.load(open(os.path.join(ROOT, 'scripts/r745/marks/marks.json'), encoding='utf-8'))
S9 = 720 / 1280          # 세로 720×1280 원본을 720 높이로
SF = 720 / 834           # 추락 1112×834 원본을 720 높이로
SPEC = [
    # path, (w,h), seconds, marks[(name, scale, dx, dy)], maxBytes, audio
    ('r309/intro/opening-hapil.mp4', (1280, 720), 19.553, [('gem-hapil', 1, 0, 0)], 6_000_000, True),
    ('r372/opening-book.mp4', (1280, 720), 9.458, [('gem-hapil', 1, 0, 0)], 3_000_000, True),
    ('r372/root-gate.mp4', (1280, 720), 9.46, [('gem-hapil', 1, 0, 0)], 4_000_000, True),
    ('r369/poison-city.mp4', (1280, 720), 10.027, [('gem-poison', 1, 0, 0)], 4_500_000, True),
    ('r368/betrayal.mp4', (1280, 548), 10.027, [], 4_500_000, True),  # 표시 줄은 화면 비율 자르기로 화면 밖
    ('r617/knight.mp4', (1280, 720), 8.0, [('veo-knight', S9, 437, 0)], 2_000_000, True),
    ('r617/beach.mp4', (1280, 720), 8.0, [('veo-beach', S9, 437, 0)], 2_000_000, True),
    ('r617/fall.mp4', (1280, 720), 5.0, [('ai-fall', SF, 160, 0), ('dreamina-fall', SF, 160, 0)], 2_000_000, True),
    ('r667/title-video/loop.mp4', (960, 540), 10.0, [], 1_000_000, False),
]
R617_TOTAL = 6_000_000


def probe(p):
    j = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', p]))
    v = next(s for s in j['streams'] if s['codec_type'] == 'video')
    a = next((s for s in j['streams'] if s['codec_type'] == 'audio'), None)
    return v, a, float(j['format']['duration'])


def x264_opts(p):
    b = open(p, 'rb').read()
    i = b.find(b'x264 - core')
    if i < 0:
        return {}
    s = b[i:i + 3000].split(b'\x00')[0].decode('latin1')
    return dict(kv.split('=', 1) for kv in s.split('options: ', 1)[-1].split() if '=' in kv)


def loudness(p):
    out = subprocess.run(['ffmpeg', '-nostats', '-i', p, '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    summ = out[out.rfind('Summary:'):]
    i = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
    tp = float(re.search(r'Peak:\s+(-?[\d.inf]+) dBFS', summ).group(1))
    return i, tp


def harmonic(img, m, it=250):
    o = img.copy()
    o[m] = img[~m].mean()
    for _ in range(it):
        av = (np.roll(o, 1, 0) + np.roll(o, -1, 0) + np.roll(o, 1, 1) + np.roll(o, -1, 1)) / 4
        o[m] = av[m]
    return o


class Laplace:
    """마스크 안을 둘레 화소로 정확히 이어 그리는 라플라스(조화) 채움 — 마스크마다 한 번 풀어 두고 프레임마다 곱셈만."""
    def __init__(self, mask):
        mask = mask.copy()
        mask[0, :] = mask[-1, :] = mask[:, 0] = mask[:, -1] = False
        self.mask = mask
        H, W = mask.shape
        idx = -np.ones((H, W), int)
        ys, xs = np.nonzero(mask)
        idx[ys, xs] = np.arange(len(ys))
        nb = np.zeros((H, W), bool)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nb[ys + dy, xs + dx] = True
        nb &= ~mask
        bys, bxs = np.nonzero(nb)
        bidx = -np.ones((H, W), int)
        bidx[bys, bxs] = np.arange(len(bys))
        n, m = len(ys), len(bys)
        A = np.zeros((n, n)); B = np.zeros((n, m))
        for i, (y, x) in enumerate(zip(ys, xs)):
            A[i, i] = 4
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                j = idx[y + dy, x + dx]
                if j >= 0:
                    A[i, j] -= 1
                else:
                    B[i, bidx[y + dy, x + dx]] += 1
        self.G = np.linalg.solve(A, B).astype(np.float32)
        self.ys, self.xs, self.bys, self.bxs = ys, xs, bys, bxs

    def fill(self, img):
        o = img.astype(np.float32).copy()
        o[self.ys, self.xs] = self.G @ o[self.bys, self.bxs]
        return o


def placed(name, s, dx, dy, W, H):
    mk = MARKS[name]
    a = np.asarray(Image.open(os.path.join(ROOT, mk['png'])), dtype=np.float32) / 255.0
    x0, y0 = mk['x'] * s + dx, mk['y'] * s + dy
    im = Image.fromarray(a, 'F').transform((W, H), Image.AFFINE, (1 / s, 0, -x0 / s, 0, 1 / s, -y0 / s), Image.BILINEAR)
    return np.asarray(im, dtype=np.float32)


def mark_score(p, W, H, mk):
    a = placed(*mk, W, H)
    ys, xs = np.nonzero(a > 0.02)
    y0, y1 = max(0, ys.min() - 8), min(H, ys.max() + 9)
    x0, x1 = max(0, xs.min() - 8), min(W, xs.max() + 9)
    x0, y0 = x0 // 2 * 2, y0 // 2 * 2
    x1, y1 = x0 + (x1 - x0) // 2 * 2, y0 + (y1 - y0) // 2 * 2
    a = a[y0:y1, x0:x1]
    m = a > 0.01
    for _ in range(2):
        m = m | np.roll(m, 1, 0) | np.roll(m, -1, 0) | np.roll(m, 1, 1) | np.roll(m, -1, 1)
    m[0, :] = m[-1, :] = False
    m[:, 0] = m[:, -1] = False
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', p, '-vf', f'crop={x1-x0}:{y1-y0}:{x0}:{y0}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'])
    F = np.frombuffer(raw, np.uint8).reshape(-1, y1 - y0, x1 - x0).astype(np.float32)
    core = a > 0.08
    ks = []
    lap = Laplace(m)
    for f in F[::2]:
        bg = lap.fill(f)
        if bg[core].mean() > 200 or bg[core].mean() < 17:  # 하얗게 날아갔거나 페이드 검정이면 표시를 읽을 수 없음
            continue
        x = (a * (255 - bg))[core]
        y = (f - bg)[core]
        ks.append(float((x * y).sum() / max((x * x).sum(), 1e-6)))
    ks = np.array(ks)
    return {'frames': int(len(ks)), 'median': round(float(np.median(ks)), 3), 'p90': round(float(np.percentile(ks, 90)), 3)}


def main():
    write = '--write' in sys.argv
    res = []
    fails = []
    tot617 = 0
    for path, (w, h), sec, marks, maxb, audio in SPEC:
        p = os.path.join(A, path)
        b = open(p, 'rb').read()
        v, au, dur = probe(p)
        r = {'path': 'assets/' + path, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(),
             'size': [v['width'], v['height']], 'seconds': round(dur, 3), 'pix_fmt': v.get('pix_fmt'), 'codec': v['codec_name']}
        ok = lambda c, msg: (None if c else fails.append(path + ': ' + msg))
        ok((v['width'], v['height']) == (w, h), f'해상도 {v["width"]}x{v["height"]} != {w}x{h}')
        ok(v['codec_name'] == 'h264' and v.get('pix_fmt') == 'yuv420p', 'H.264 yuv420p 아님')
        ok(b.find(b'moov') < b.find(b'mdat'), 'faststart 아님')
        ok(abs(dur - sec) <= 0.06, f'길이 {dur:.3f} != {sec}')
        ok(len(b) <= maxb, f'크기 {len(b)} > {maxb}')
        o = x264_opts(p)
        r['x264'] = {k: o.get(k) for k in ('crf', 'subme', 'me', 'ref', 'psy_rd')}
        ok(o and float(o.get('crf', 99)) <= 23 and int(o.get('subme', 0)) >= 9, f'x264 설정 crf={o.get("crf")} subme={o.get("subme")} (crf≤23·subme≥9 필요)')
        if path.startswith('r617/'):
            tot617 += len(b)
        if audio:
            ok(au is not None, '소리 없음')
            if au:
                li, tp = loudness(p)
                r['audio'] = {'lufs': li, 'truePeak': tp, 'rate': int(au['sample_rate']), 'channels': au['channels'], 'codec': au['codec_name']}
                ok(-17 <= li <= -15, f'음량 {li} LUFS (−16±1 필요)')
                ok(tp <= -1.0, f'트루 피크 {tp} dBTP (≤ −1.0 필요)')
                ok(int(au['sample_rate']) == 48000 and au['channels'] == 2, f'소리 {au["sample_rate"]}Hz {au["channels"]}ch (48k 스테레오 필요)')
        r['marks'] = {}
        for mk in marks:
            if (v['width'], v['height']) != (w, h):
                fails.append(f'{path}: {mk[0]} 표시 잔상을 잴 수 없음(해상도 다름)')
                continue
            sc = mark_score(p, v['width'], v['height'], mk)
            r['marks'][mk[0]] = sc
            ok(sc['frames'] >= 10 and abs(sc['median']) < 0.15 and sc['p90'] < 0.30, f'{mk[0]} 표시 잔상 {sc}')
        res.append(r)
        print(json.dumps(r, ensure_ascii=False))
    if tot617 > R617_TOTAL:
        fails.append(f'r617 합계 {tot617} > {R617_TOTAL}')
    out = {'schema': 'storyworld-r745-measure/v1', 'files': res, 'r617TotalBytes': tot617, 'fails': fails}
    if write:
        with open(os.path.join(ROOT, 'r96/qa/r745/measure.json'), 'w', encoding='utf-8') as fh:
            json.dump(out, fh, ensure_ascii=False, indent=1)
            fh.write('\n')
    print('\n'.join('FAIL ' + f for f in fails) or 'R745_CINEMATIC_OK')
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
