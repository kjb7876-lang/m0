#!/usr/bin/env python3
"""R1026 — 적 피격·사망 소리 끝에 '띡' 하고 높은 음이 다시 나는 파일을 고친 파생본을 만든다(원본은 그대로 둔다).

사용자 2026-11-14 04:06Z: "맨끝에 띡하며 높은음나는거 없애 초반잘나온음들로사용", "일레븐랩스도사용해".
  1) 몹·보스 피격·사망 파일을 전수로 보고, 본체가 잦아든 뒤 다시 솟는 높은 음(재어택 +9dB 이상, 최대보다 8dB 이상 작고,
     중심 주파수 1.4kHz 이상, 시작 .15초 뒤)이 있으면 그 직전 골(가장 작은 20ms 칸)에서 25ms 코사인 페이드로 자른다.
     앞의 잘 나온 부분만 남는다. 음량·음색은 그대로(모노 44.1kHz 로만 바꿈).
  2) 유리 몹(r955 glass) 피격·사망은 끝 '띡' 이 그 계열 성격이라 자르면 너무 짧아지므로 ElevenLabs 로 새로 만든 소리
     (끝 핑·차임 없음, /mnt/project-files/sfx-r1026/elevenlabs-raw)로 바꾼다: 150Hz 고역통과·4kHz 저역통과(2단)·앞 무음 제거·
     길이 상한(피격 .42초·사망 .95초)·끝 페이드·피크 −10dB. 같은 검출기로 끝 핑을 찾아 그 앞에서 자르고, 남은 게 .1초 이상인 것만 쓴다.
결과: r96/runtime-text/assets/r1026/sfx/*.ogg + index.json(원본 경로 → 파생본, 자른 위치·근거).
사용: python3 scripts/build-sfx-r1026.py [ElevenLabs 원본 폴더]   필요: ffmpeg, numpy."""
import numpy as np, subprocess, sys, json, hashlib, pathlib, glob, os
SR = 44100
ROOT = pathlib.Path(__file__).resolve().parents[1]
RT = ROOT / 'r96/runtime-text'
OUT = RT / 'assets/r1026/sfx'; OUT.mkdir(parents=True, exist_ok=True)
EL = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/sfx-r1026/elevenlabs-raw')
PATS = ['assets/r955/sfx/hit-*.ogg', 'assets/r955/sfx/die-*.ogg', 'assets/r954/sfx/hit-*.ogg', 'assets/r954/sfx/die-*.ogg',
        'assets/r541/sfx/death*.ogg', 'assets/r785/sfx/*.ogg', 'assets/r544/sfx/hit-*.ogg', 'assets/r544/sfx/death-*.ogg',
        'assets/r788/sfx/hit-*.ogg', 'assets/r789/sfx/hit-*.ogg', 'assets/r967/sfx/hit-*.ogg']
W = int(.02 * SR); FADE = int(.025 * SR)


def load(p):
    b = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', str(p), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(b, dtype='<f4').astype(np.float64)


def frames(x):
    fr = np.fft.rfftfreq(W, 1 / SR); E = []; C = []
    for i in range(0, len(x) - W, W):
        s = x[i:i + W]; E.append(10 * np.log10((s * s).mean() + 1e-12)); sp = np.abs(np.fft.rfft(s * np.hanning(W))) ** 2
        C.append(float((fr * sp).sum() / max(sp.sum(), 1e-20)))
    return np.array(E), C


def late_ping(x):
    """끝쪽 높은 재어택. 없으면 None, 있으면 dict(cut 초 등)."""
    E, C = frames(x)
    if not len(E): return None
    mx = E.max(); first = int(np.argmax(E > mx - 20))
    for k in range(first + 6, len(E)):
        a = max(first, k - 4); lo = E[a:k].min()
        if E[k] - lo >= 9 and mx - 26 < E[k] <= mx - 8 and C[k] >= 1400 and k * W / SR >= .15:
            cut = a + int(np.argmin(E[a:k]))
            return {'cut': round(cut * W / SR, 3), 'pingAt': round(k * W / SR, 3), 'riseDb': round(float(E[k] - lo), 1),
                    'pingDbBelowMax': round(float(mx - E[k]), 1), 'centroidHz': int(C[k])}
    return None


def fade_out(x, n):
    y = x[:n].copy(); f = min(FADE, len(y)); y[len(y) - f:] *= 0.5 * (1 + np.cos(np.linspace(0, np.pi, f))); return y


def biquad(x, kind, f0, q=.7071):
    w = 2 * np.pi * f0 / SR; c = np.cos(w); a = np.sin(w) / (2 * q)
    if kind == 'hp': b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
    else: b = [(1 - c) / 2, 1 - c, (1 - c) / 2]
    A = [1 + a, -2 * c, 1 - a]; b = [v / A[0] for v in b]; A = [v / A[0] for v in A]
    y = np.zeros_like(x); x1 = x2 = y1 = y2 = 0.0
    for i, v in enumerate(x):
        o = b[0] * v + b[1] * x1 + b[2] * x2 - A[1] * y1 - A[2] * y2; x2, x1, y2, y1 = x1, v, y1, o; y[i] = o
    return y


def save(y, name):
    p = OUT / name
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libvorbis', '-q:a', '5', str(p)],
                   input=y.astype('<f4').tobytes(), check=True)
    b = p.read_bytes(); return {'path': str(p.relative_to(RT)), 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(), 'duration': round(len(y) / SR, 3)}


index = {'round': 'R1026', 'rule': 'late high re-attack ("띡") trimmed at preceding valley with 25ms fade; glass family replaced by ElevenLabs', 'trimmed': {}, 'replaced': {}}
scanned = 0
for pat in PATS:
    for p in sorted(glob.glob(str(RT / pat))):
        rel = str(pathlib.Path(p).relative_to(RT))
        if '/r955/sfx/' in rel and ('-glass-' in rel): continue  # 유리 계열은 ElevenLabs 새 소리로
        scanned += 1; x = load(p); d = late_ping(x)
        if not d: continue
        n = int(d['cut'] * SR) + FADE // 2
        if n < int(.1 * SR): continue  # 남는 앞부분이 너무 짧으면 손대지 않음
        y = fade_out(x, n); name = rel.split('/')[1] + '-' + pathlib.Path(rel).stem + '.ogg'
        info = save(y, name); info.update(d); info['sourceDuration'] = round(len(x) / SR, 3); index['trimmed'][rel] = info
# 유리 계열 ElevenLabs
for kind, cap, prefix in [('hit', .42, 'glass-hit'), ('die', .95, 'glass-die')]:
    good = []
    for f in sorted(EL.glob(prefix + '-*.mp3')):
        x = load(f); x = biquad(biquad(biquad(x, 'hp', 150), 'lp', 4000), 'lp', 4000)
        mx = np.abs(x).max()
        if mx <= 0: continue
        on = int(np.argmax(np.abs(x) > mx * .05)); x = x[max(0, on - int(.004 * SR)):]
        x = x[:int(cap * SR)]
        # 끝쪽 무음 정리: 마지막으로 최대−45dB 넘는 곳까지
        thr = np.abs(x).max() * 10 ** (-45 / 20); last = len(x) - int(np.argmax(np.abs(x[::-1]) > thr))
        x = fade_out(x, max(int(.12 * SR), min(len(x), last + FADE)))
        x[:int(.004 * SR)] *= np.linspace(0, 1, int(.004 * SR))
        x *= 10 ** (-10 / 20) / np.abs(x).max()
        d = late_ping(x)
        if d:  # 끝쪽 '띡'(파편 재어택)이 있으면 그 앞 골에서 자른다 — 앞의 잘 나온 부분만
            n = int(d['cut'] * SR) + FADE // 2
            if n < int(.1 * SR): continue
            x = fade_out(x, n)
        if late_ping(x): continue
        good.append((f.name, x))
    for i, (src, x) in enumerate(good[:3], 1):
        info = save(x, f'el-{prefix}-{i}.ogg'); info['elevenlabsSource'] = src; index['replaced'].setdefault('r955/' + kind + '-glass', []).append(info)
index['scanned'] = scanned
(OUT / 'index.json').write_text(json.dumps(index, ensure_ascii=False, indent=1))
print('scanned', scanned, 'trimmed', len(index['trimmed']), 'replaced', {k: len(v) for k, v in index['replaced'].items()})
