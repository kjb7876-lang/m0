#!/usr/bin/env python3
"""R745 게임 시네마틱 영상 다시 만들기 — 생성 도구 표시 제거·화질·소리 정리 (재현용).

대상(게임이 실제로 트는 영상 8편 + 타이틀 루프는 build-title-loop-r667.py 가 이 결과로 다시 만든다):
  r309 오프닝 연결본 · r372 책 오프닝 · r372 뿌리 문지기 입장 · r368 배신 · r369 중독의 도시 · r617 기사·추락·해변

1) 표시 지우기 — 흐림(delogo)이 아니라 '역합성'.
   생성 도구 표시는 반투명 흰 그림을 화면에 얹은 것이라 관측 = (1-a)·배경 + a·흰색 이다.
   표시 투명도 지도 a(scripts/r745/marks/*.png, 영상 수백 프레임에서 중앙값으로 추정)를 알면
   배경 = (관측 - a·흰색)/(1-a) 로 원래 그림을 되살린다(YUV 4:2:0 그대로: Y(TV 범위 16~235) 는 흰색 235·a, U·V 는 중립 128·2×2 평균 a. 지도 a 는 전체 범위 회색(흰색 255)에서 잰 것과 같은 값).
   a 의 기본 세기(gain)는 marks.json, 프레임마다 세기 배율(0.85~1.15)·지도 흐림을 '남은 표시 세기'(둘레에서 이어 그린 배경 기준, 검사와 같은 잣대)가 0 에 가장 가까운 것으로 고르고,
   a 가 큰 곳(>0.5)과 표시 윤곽 1~2화소 띠는 둘레에서 정확한 라플라스 채움, 마지막으로 3×3 중앙값을 반쯤 섞는다.
2) 화질 — 사용자 원본이 있는 5편은 원본(업로드 파일)에서 바로 만든다(예전엔 원본→CRF27 960×540).
   r617 세 편은 1280×720 으로 올리고(원본 그림은 자르지 않고 가운데, 양옆은 같은 영상 흐림 채움),
   x264 veryslow·tune film·CRF(파일 크기 한도 안에서 가장 낮은 값)·약한 CAS 선명화.
   원본이 없는 r309 연결본(책+실사)은 저장소 이전 파일(git c5aba56)에서 표시만 지우고 압축 잡음만 줄여(hqdn3d 2) 다시 인코딩.
3) 소리 — 30Hz 아래 웅웅거림 자르기, 약한 FFT 잡음 줄이기(afftdn nr6), EBU R128 2단계 음량 맞춤
   −16 LUFS·트루 피크 −1.5 dBTP(뒤에 −3 dBFS 리미터, AAC 넘침 대비), 48 kHz 스테레오 AAC 128k(r617 은 예전 모노 64k).
   길이·페이드·느리게(추락 0.8배)는 예전과 같다(게임 코드의 seconds 와 맞춤).

쓰기: python3 scripts/build-cinematics-r745.py SRC_DIR [OUT_ASSETS_DIR]
  SRC_DIR: 사용자 원본 영상들이 든 폴더(이름 상관없음, sha256 으로 찾음).
  OUT_ASSETS_DIR 기본값 r96/runtime-text/assets
"""
import hashlib, json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKS = json.load(open(os.path.join(ROOT, 'scripts/r745/marks/marks.json'), encoding='utf-8'))
ORIG = {  # 사용자 업로드 원본 sha256
    'poison': '3232126ad2a7',   # gemini_generated_video_f5fb3f35.mp4 (R369)
    'betrayal': 'bc84d3136564',  # gemini_generated_video_ec6954db.mp4 (R368)
    'knight': 'b6f5357e3095',   # 「타락천사 기사 강림」 720×1280 (R617)
    'beach': '5f19da10a8fe',    # 「해변」 720×1280 (R617)
    'fall': '7491b55f07a8',     # 「추락」 1112×834 60fps (R617)
}
HAPIL_GIT = ('c5aba56', 'r96/runtime-text/assets/r309/intro/opening-hapil.mp4', '6854857dc1efa6ed')
ENC = ['-c:v', 'libx264', '-preset', 'veryslow', '-tune', 'film', '-profile:v', 'high', '-level', '4.0',
       '-pix_fmt', 'yuv420p', '-g', '48', '-movflags', '+faststart']
AUD = ['-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2']
PRE_AUDIO = 'highpass=f=30,afftdn=nr=6:nf=-45:tn=1'


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, **kw)


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


# ---------------------------------------------------------------- 표시 지우기
def _gblur(a, sg):
    r = int(3 * sg + 1); x = np.arange(-r, r + 1); k = np.exp(-x * x / (2 * sg * sg)); k /= k.sum()
    o = np.apply_along_axis(lambda v: np.convolve(v, k, 'same'), 0, a)
    return np.apply_along_axis(lambda v: np.convolve(v, k, 'same'), 1, o).astype(np.float32)


def _dil(m, n=1):
    for _ in range(n):
        m = m | np.roll(m, 1, 0) | np.roll(m, -1, 0) | np.roll(m, 1, 1) | np.roll(m, -1, 1)
    return m


def _harm(img, mask, it=150):
    o = img.copy()
    for _ in range(it):
        av = (np.roll(o, 1, 0) + np.roll(o, -1, 0) + np.roll(o, 1, 1) + np.roll(o, -1, 1)) / 4
        o[mask] = av[mask]
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


def _med(img):
    return np.median(np.stack([np.roll(np.roll(img, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1)]), 0)


def unmark(src, out, names):
    """src 의 표시(names)를 역합성으로 지운 무손실 중간 파일(out .mkv, 소리 그대로)."""
    if os.path.exists(out) and os.path.getsize(out) > 1_000_000:
        return
    marks = []
    for nm in names:
        mk = MARKS[nm]
        a0 = np.asarray(Image.open(os.path.join(ROOT, mk['png'])), dtype=np.float32) / 255.0 * mk.get('gain', 1.0)
        cands = [a0 if sg == 0 else _gblur(a0, sg) for sg in (0, 0.4, 0.7, 1.0)]
        gy, gx = np.gradient(a0)
        reg = _dil(a0 > 0.01, 2)
        band = np.hypot(gx, gy) > 0.05
        hi = _dil(a0 > 0.5, 1) | band            # 거의 불투명한 곳·윤곽 띠는 되살리지 않고 둘레에서 채움
        H, W = a0.shape
        hi2 = _dil(_gblur(a0.reshape(H // 2, 2, W // 2, 2).mean((1, 3)), 0.8) > 0.5, 1) | band.reshape(H // 2, 2, W // 2, 2).any((1, 3))
        reg2 = reg.reshape(H // 2, 2, W // 2, 2).any((1, 3))
        marks.append((a0, mk['x'], mk['y'], cands, reg, Laplace(hi), Laplace(hi2), Laplace(_dil(reg, 1)), Laplace(_dil(reg2, 1))))
    w, h = map(int, subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src]).decode().split(','))
    fps = subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', src]).decode().strip()
    dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-'], stdout=subprocess.PIPE)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-s', f'{w}x{h}', '-r', fps, '-i', '-',
                            '-i', src, '-map', '0:v', '-map', '1:a?', '-c:v', 'libx264', '-qp', '0', '-preset', 'ultrafast', '-c:a', 'copy', out], stdin=subprocess.PIPE)
    ys, cs = w * h, (w // 2) * (h // 2)
    fs = ys + 2 * cs
    while True:
        b = dec.stdout.read(fs)
        if len(b) < fs:
            break
        buf = np.frombuffer(b, np.uint8).astype(np.float32)
        Y = buf[:ys].reshape(h, w); U = buf[ys:ys + cs].reshape(h // 2, w // 2); V = buf[ys + cs:].reshape(h // 2, w // 2)
        for a0, x, y, cands, reg, lhi, lhi2, lap, lap2 in marks:
            H, W = a0.shape
            r = Y[y:y + H, x:x + W]
            bg = lap.fill(r)  # 둘레에서 이어 그린 배경(바깥 화소만 쓰므로 후보마다 같다)
            core = a0 > 0.08 * a0.max() / 0.4
            xx = (a0 * (235 - bg))[core]
            best = None
            for ab in cands:
                for k in (0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15):
                    a = np.clip(ab * k, 0, 0.97)
                    rc = (r - a * 235) / np.maximum(1 - a, 0.05)
                    e = abs(float((xx * (rc - bg)[core]).sum() / max((xx * xx).sum(), 1e-6)))  # 남은 표시 세기(검사와 같은 잣대)
                    if best is None or e < best[0]:
                        best = (e, rc, a)
            _, rc, a = best
            # 어두운 장면에서는 작은 모형 오차로 rc 가 둘레보다 훨씬 검게(음수) 나와 채움에 검은 얼룩이 번진다 →
            # 둘레(표시 밖) 화소의 2% 밝기 아래로는 내려가지 않게 막는다(지나친 역합성만 막고, 밝은 결은 그대로).
            ring = r[lap.bys, lap.bxs]
            lo = float(np.percentile(ring, 2)) - 3
            rc = np.where(reg, np.maximum(rc, lo), rc)  # 표시 자리 안에서만(바깥의 진짜 어두운 결은 그대로)
            rc = lhi.fill(rc)
            rc = np.where(reg, 0.5 * rc + 0.5 * _med(rc), rc)
            # 아주 어두운 배경(둘레 중앙값 Y<40)에서는 역합성이 잡음을 키워 얼룩이 남는다 → 둘레에서 이어 그린 배경으로 넘긴다
            # (Y 40~80 사이는 섞음). 어두운 곳은 결이 거의 없어 채움이 자연스럽다.
            wv = float(np.clip((np.median(ring) - 40) / 40, 0, 1))
            rc = wv * rc + (1 - wv) * bg
            Y[y:y + H, x:x + W] = np.clip(rc, 16, 235)
            a2 = _gblur(a.reshape(H // 2, 2, W // 2, 2).mean((1, 3)), 0.8)
            reg2 = reg.reshape(H // 2, 2, W // 2, 2).any((1, 3))
            for P in (U, V):
                r2 = P[y // 2:y // 2 + H // 2, x // 2:x // 2 + W // 2]
                c2 = lhi2.fill((r2 - a2 * 128) / np.maximum(1 - a2, 0.05))
                c2 = np.where(reg2, _med(c2), c2)
                c2 = wv * c2 + (1 - wv) * lap2.fill(r2)
                P[y // 2:y // 2 + H // 2, x // 2:x // 2 + W // 2] = np.clip(c2, 16, 240)
        enc.stdin.write(np.clip(buf + 0.5, 0, 255).astype(np.uint8).tobytes())
    enc.stdin.close(); enc.wait(); dec.wait()
    if enc.returncode or dec.returncode:
        raise SystemExit('unmark failed: ' + src)


# ---------------------------------------------------------------- 소리
def audio(src, out, pre_af, dur):
    """pre_af(자르기·페이드·템포) → 잡음 정리 → 2단계 loudnorm → 48k 스테레오 wav."""
    chain = ','.join(x for x in (pre_af, PRE_AUDIO) if x)
    meas = subprocess.run(['ffmpeg', '-nostats', '-i', src, '-vn', '-af', chain + ',loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                          capture_output=True, text=True).stderr
    j = json.loads(meas[meas.rfind('{'):meas.rfind('}') + 1])
    ln = (f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
          f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-af', f'{chain},{ln},aresample=48000,alimiter=limit=0.7:level=false:attack=1:release=60,apad', '-t', str(dur), '-ac', '2', '-ar', '48000', out])


# ---------------------------------------------------------------- 영상
def encode(vsrc, vf, wav, out, dur, max_bytes, crf0=18):
    """크기 한도 안에서 가장 낮은 CRF 로 인코딩."""
    for crf in range(crf0, 24):
        cmd = ['ffmpeg', '-v', 'error', '-y', '-i', vsrc]
        if wav:
            cmd += ['-i', wav]
        cmd += ['-filter_complex', vf, '-map', '[v]'] + (['-map', '1:a'] if wav else ['-an']) + ['-t', f'{dur}'] + ENC + ['-crf', str(crf)] + (AUD if wav else []) + [out]
        run(cmd)
        n = os.path.getsize(out)
        print(f'  {os.path.basename(out)} crf{crf} {n} bytes', flush=True)
        if n <= max_bytes:
            return crf
    raise SystemExit(f'{out}: CRF 23 으로도 {max_bytes} 바이트를 넘음')


def poster(video, t, out, q=4):
    run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', video, '-frames:v', '1', '-q:v', str(q), out])


def side_fill(core_w, core_x, pre=''):
    """원본 그림을 자르지 않고 1280×720 가운데 두고, 양옆은 같은 영상 확대·흐림·어둡게."""
    return (f'[0:v]{pre}split[a][b];'
            f'[a]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,boxblur=40:2,eq=brightness=-0.30:saturation=0.8[bg];'
            f'[b]scale={core_w}:720:flags=lanczos,cas=0.25[fg];[bg][fg]overlay={core_x}:0')


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    src_dir = sys.argv[1]
    A = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'r96/runtime-text/assets')
    found = {}
    for f in os.listdir(src_dir):
        p = os.path.join(src_dir, f)
        if os.path.isfile(p) and os.path.getsize(p) > 1_000_000:
            h = sha(p)[:12]
            for k, v in ORIG.items():
                if h == v:
                    found[k] = p
    miss = set(ORIG) - set(found)
    if miss:
        raise SystemExit('원본 없음: ' + ', '.join(sorted(miss)))
    T = os.environ.get('R745_TMP') or tempfile.mkdtemp(prefix='r745-')  # R745_TMP: 지운 중간 파일 다시 쓰기
    hapil_src = os.path.join(T, 'hapil-src.mp4')
    with open(hapil_src, 'wb') as fh:
        fh.write(subprocess.check_output(['git', '-C', ROOT, 'show', f'{HAPIL_GIT[0]}:{HAPIL_GIT[1]}']))
    assert sha(hapil_src).startswith(HAPIL_GIT[2])
    C = {k: os.path.join(T, k + '.mkv') for k in ('hapil', 'poison', 'betrayal', 'knight', 'beach', 'fall')}
    unmark(hapil_src, C['hapil'], ['gem-hapil'])
    only = set(os.environ.get('R745_ONLY', '').split(',')) - {''}  # 일부만 다시 만들 때
    unmark(found['poison'], C['poison'], ['gem-poison'])
    run(['ffmpeg', '-v', 'error', '-y', '-i', found['betrayal'], '-c', 'copy', C['betrayal']])  # 표시 줄은 화면 자르기로 빠짐
    unmark(found['knight'], C['knight'], ['veo-knight'])
    unmark(found['beach'], C['beach'], ['veo-beach'])
    unmark(found['fall'], C['fall'], ['ai-fall', 'dreamina-fall'])
    W = lambda n: os.path.join(T, n + '.wav')
    out = {}
    # r309 오프닝 연결본 19.553초 (이미 끝 0.6초 소리 페이드 들어 있음)
    hd = 'hqdn3d=2:2:4:4'  # 이미 한 번 압축된 연결본이라 선명화 없이 압축 잡음만 줄임
    if not only or 'hapil' in only:
        audio(C['hapil'], W('hapil'), '', 19.553)
        out['hapil'] = encode(C['hapil'], f'[0:v]{hd}[v]', W('hapil'), os.path.join(A, 'r309/intro/opening-hapil.mp4'), 19.553, 6_000_000, 20)
    # r372 책 오프닝: 연결본 0~9.458초, 끝 0.8초 소리 페이드
    if not only or 'book' in only:
        audio(C['hapil'], W('book'), 'atrim=0:9.458333,afade=t=out:st=8.658:d=0.8', 9.458333)
        out['book'] = encode(C['hapil'], f'[0:v]trim=0:9.458333,setpts=PTS-STARTPTS,{hd}[v]', W('book'), os.path.join(A, 'r372/opening-book.mp4'), 9.458333, 3_000_000, 20)
    # r372 뿌리 문지기 입장: 연결본 10.04초~끝, 0.35초 페이드 인
    if not only or 'root' in only:
        audio(C['hapil'], W('root'), 'atrim=start=10.04,asetpts=PTS-STARTPTS,afade=t=in:d=0.35', 9.513)
        out['root'] = encode(C['hapil'], f'[0:v]trim=start=10.04,setpts=PTS-STARTPTS,{hd},fade=t=in:d=0.35[v]', W('root'), os.path.join(A, 'r372/root-gate.mp4'), 9.513, 4_000_000, 20)
    # r369 중독의 도시: 가짜 HUD 글자(3.55~6.55초) 는 예전처럼 delogo
    if not only or 'poison' in only:
        audio(C['poison'], W('poison'), '', 10.027)
        out['poison'] = encode(C['poison'], "[0:v]delogo=x=968:y=92:w=280:h=120:enable='between(t,3.55,6.55)',cas=0.2[v]", W('poison'), os.path.join(A, 'r369/poison-city.mp4'), 10.027, 4_500_000, 19)
    # r368 배신: 아래 가짜 게임 UI·자막·표시 줄을 예전처럼 화면 비율로 자름
    if not only or 'betrayal' in only:
        audio(C['betrayal'], W('betrayal'), '', 10.027)
        out['betrayal'] = encode(C['betrayal'], '[0:v]crop=1280:548:0:12,cas=0.2[v]', W('betrayal'), os.path.join(A, 'r368/betrayal.mp4'), 10.027, 4_500_000, 19)
    # r617 세 편 1280×720
    if not only or 'knight' in only:
        audio(C['knight'], W('knight'), 'afade=t=in:d=0.35,afade=t=out:st=7.55:d=0.45', 8.0)
        out['knight'] = encode(C['knight'], side_fill(405, 437) + ',fade=t=in:d=0.35,fade=t=out:st=7.55:d=0.45[v]', W('knight'), os.path.join(A, 'r617/knight.mp4'), 8.0, 2_000_000, 20)
    if not only or 'beach' in only:
        audio(C['beach'], W('beach'), 'afade=t=in:d=0.35,afade=t=out:st=7.4:d=0.6', 8.0)
        out['beach'] = encode(C['beach'], side_fill(405, 437) + ',fade=t=in:d=0.35,fade=t=out:st=7.4:d=0.6[v]', W('beach'), os.path.join(A, 'r617/beach.mp4'), 8.0, 2_000_000, 20)
    if not only or 'fall' in only:
        audio(C['fall'], W('fall'), 'atempo=0.8,afade=t=in:d=0.35,afade=t=out:st=4.4:d=0.6', 5.0)
        out['fall'] = encode(C['fall'], side_fill(960, 160, 'setpts=1.25*PTS,fps=24,eq=gamma=1.22:contrast=1.04,') + ',fade=t=in:d=0.35,fade=t=out:st=4.4:d=0.6[v]',
                             W('fall'), os.path.join(A, 'r617/fall.mp4'), 5.0, 2_000_000, 20)
    # 포스터(예전과 같은 순간)
    poster(os.path.join(A, 'r309/intro/opening-hapil.mp4'), 0.4, os.path.join(A, 'r309/intro/poster-hapil.jpg'))
    poster(os.path.join(A, 'r372/root-gate.mp4'), 0.6, os.path.join(A, 'r372/root-gate-poster.jpg'))
    poster(os.path.join(A, 'r368/betrayal.mp4'), 0.3, os.path.join(A, 'r368/betrayal-poster.jpg'))
    poster(os.path.join(A, 'r369/poison-city.mp4'), 0.3, os.path.join(A, 'r369/poison-city-poster.jpg'))
    for n, t in (('knight', 6.5), ('fall', 1.0), ('beach', 1.0)):
        poster(os.path.join(A, f'r617/{n}.mp4'), t, os.path.join(A, f'r617/{n}-poster.jpg'), 6)
    print(json.dumps({'crf': out, 'tmp': T}, ensure_ascii=False))


if __name__ == '__main__':
    main()
