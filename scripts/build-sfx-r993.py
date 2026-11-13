#!/usr/bin/env python3
"""R993 — 역할 길이 상한에 본체가 잘리던 효과음 3개를 원본에서 다시 잘라 낸 파생본을 만든다(원본 파일은 그대로 둔다).

전수 측정(r96/qa/r993/README.md)에서 아래 셋은 소리의 '본체'가 쾌적 계층(__STORYWORLD_SFX_COMFORT__)의 역할 길이 상한
(awake 1.5초·boss 1.7초·별칭 없는 종류 1.2초) 뒤에 있어 게임에서는 앞의 작은 소리와 무음만 났다.
  - 윤서하 각성(rc141TimeAwakening5): 0.25초 작은 소리 뒤 1.2초 무음, 본체 1.5초부터 → 1.5초에서 잘림(11%)
  - 보스 'boss' 암흑 공격(Dark demonic attack): 1.35초 무음 뒤 본체 → 1.7초에서 잘림(52%)
  - 불면귀 실비 시전(r761BossRain, bmg-rain-1): 2.8초 크레셴도, 본체 1.1초부터 → 1.2초에서 잘림(16%)
앞의 짧은 머리 소리(누르자마자 반응)는 남기고 무음을 빼서 본체를 붙인다. 150Hz 고역통과(R545 기준)·5kHz 저역통과(찌르는 고음 걸러 냄)·모노 44.1kHz·피크 −9dB 근처.

사용: python3 scripts/build-sfx-r993.py [원본 폴더]  (원본 폴더에 게임 경로 그대로 파일이 있어야 한다. 없으면 공개 Pages 에서 받는다)
필요: ffmpeg, numpy."""
import numpy as np, subprocess, os, sys, json, hashlib, pathlib, urllib.request, tempfile
SR = 44100
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'r96/runtime-text/assets/r993/sfx'; OUT.mkdir(parents=True, exist_ok=True)
SRC = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
PUBLIC = 'https://kjb7876-lang.github.io/m0/'
# name: (원본 경로, 머리 구간 [시작,끝] 초 또는 None, 본체 시작 초, 전체 길이 상한 초, 쓰임, 역할 길이 상한)
JOBS = {
    'seoha-awake': ('delivery/additional-audio13-20261005/processed/sfx-candidate/Time_manipulation_aw__1-1791000657816-42a47f20.ogg',
                    (0.0, 0.22), 1.30, 1.42, '윤서하 EGO 각성 rc141TimeAwakening5', 1.5),
    'boss-dark-attack': ('audio/rc133/processed/enemy-heavy/Dark_demonic_attack___3-1790999830236-5780aca5.ogg',
                         (0.0, 0.20), 1.33, 1.25, "보스 등장·운석 'boss'", 1.7),
    'bmg-rain-1': ('assets/r761/sfx/bmg-rain-1.ogg', None, 1.00, 1.15, '불면귀 실비 시전 r761BossRain', 1.2),
}
TARGET_PEAK_DB = -9.0


def src_bytes(rel):
    if SRC and (SRC / rel).exists():
        return (SRC / rel).read_bytes()
    with urllib.request.urlopen(PUBLIC + rel, timeout=60) as r:
        return r.read()


def dec_bytes(b):
    with tempfile.NamedTemporaryFile(suffix='.ogg', delete=False) as t:
        t.write(b); name = t.name
    try:
        out = subprocess.run(['ffmpeg', '-v', 'quiet', '-i', name, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    finally:
        os.remove(name)
    return np.frombuffer(out, dtype=np.float32).astype(float)


def filt(x, af):
    t = subprocess.run(['ffmpeg', '-v', 'quiet', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', af, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                       input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(t, dtype=np.float32).astype(float)


def fade(y, fin, fout):
    n = len(y); ni = min(int(fin * SR), n // 4); no = min(int(fout * SR), n // 2)
    if ni > 0: y[:ni] *= np.sin(np.linspace(0, np.pi / 2, ni)) ** 2
    if no > 0: y[-no:] *= np.cos(np.linspace(0, np.pi / 2, no)) ** 2
    return y


def build(x, head, body_at, total):
    body = x[int(body_at * SR):].copy()
    parts = []
    if head:
        h = fade(x[int(head[0] * SR):int(head[1] * SR)].copy(), .004, .06)
        parts.append(h)
        parts.append(np.zeros(int(.03 * SR)))
        body = fade(body, .025, 0)
    else:
        body = fade(body, .04, 0)
    parts.append(body)
    y = np.concatenate(parts)[:int(total * SR)]
    y = filt(y, 'highpass=f=150,highpass=f=150,lowpass=f=5000,lowpass=f=5000')[:len(y)]
    y = fade(y, .004, .16)
    pk = np.abs(y).max()
    return y * (10 ** (TARGET_PEAK_DB / 20) / max(pk, 1e-9)) * .85  # ogg 인코딩이 피크를 1~2dB 올림


def measure(x, cap):
    S = np.abs(np.fft.rfft(x)) ** 2; f = np.fft.rfftfreq(len(x), 1 / SR)
    e = x ** 2
    return {'duration': round(len(x) / SR, 3), 'peakDb': round(float(20 * np.log10(np.abs(x).max())), 2),
            'rmsDb': round(float(20 * np.log10(np.sqrt(e.mean()))), 2), 'lowShare150': round(float(S[f < 150].sum() / S.sum()), 4),
            'hfShare5k': round(float(S[f > 5000].sum() / S.sum()), 5), 'energyWithinRoleCap': round(float(e[:int(cap * SR)].sum() / e.sum()), 3),
            'startAbs': round(float(abs(x[0])), 5), 'endAbs': round(float(abs(x[-1])), 5)}


rows = {}
for name, (rel, head, body_at, total, use, cap) in JOBS.items():
    raw = src_bytes(rel); x = dec_bytes(raw)
    before = x[:int(cap * SR)]
    y = build(x, head, body_at, total)
    tmp = OUT / (name + '.wav'); o = OUT / (name + '.ogg')
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_f32le', str(tmp)], input=y.astype(np.float32).tobytes(), check=True)
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-i', str(tmp), '-c:a', 'libvorbis', '-q:a', '3', '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', str(o)], check=True)
    os.remove(tmp)
    b = o.read_bytes(); z = dec_bytes(b)
    xe = x ** 2
    rows[name] = {'path': 'assets/r993/sfx/' + name + '.ogg', 'source': rel, 'sourceSha256': hashlib.sha256(raw).hexdigest(), 'sourceBytes': len(raw),
                  'use': use, 'roleCapSeconds': cap, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(),
                  'sourceEnergyWithinRoleCap': round(float(xe[:int(cap * SR)].sum() / xe.sum()), 3),
                  'sourceDecodedBytes48kStereo': int(len(x) / SR * 48000 * 2 * 4), 'decodedBytes44kMono': int(len(z) * 4),
                  **measure(z, cap)}
    print(name, json.dumps(rows[name], ensure_ascii=False))
idx = {'revision': 'R993', 'generator': 'scripts/build-sfx-r993.py',
       'origin': '게임에 이미 있는 효과음 원본 3개를 잘라 붙인 파생본(새 생성 없음, ElevenLabs 크레딧 0). 원본 파일은 그대로 둔다.',
       'params': {'sampleRate': SR, 'channels': 1, 'highpassHz': 150, 'targetPeakDb': TARGET_PEAK_DB, 'vorbisQuality': 3}, 'files': rows}
(OUT / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, indent=1) + '\n')
