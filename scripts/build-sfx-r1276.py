#!/usr/bin/env python3
"""R1276 영웅 적중 효과음 — 빗방울 (사용자 2026-11-20 "빗소리 … 모든영웅들 적중효과음에 적절하게 배치, 전자음 다 빼고").
원본: ElevenLabs 로 만든 잔잔한 빗소리 한 조각(scripts/sfx-src-r1276/rain_C_raw.mp3, 2초). 새 생성·유료 호출 없음. 로컬 전용(numpy·ffmpeg).
 · 빗소리 배경(bed): 원본 조각을 속도 ±12%·무작위 겹침으로 이어 붙여 빗방울 튐을 눌러 둔 30초.
 · 물방울(drop): 원본에서 튀는 순간(평균 대비 큰 값)을 60ms 씩 잘라 낸 것.
 · 적중음 = 짧은 빗방울 몸통(bed 조각, 10ms 넘게 올라 감) + 물방울 1~3개(영웅마다 음높이·간격). 스킬 적중 = 음높이를 낮추고 길게(.24초) + 낮은 '툭'.
 · 필터: 150Hz 고역통과·영웅마다 저역통과(4~5kHz) — R545 '스피커 터짐'·R1049 소리 규칙. 피크 -10dBFS 언저리.
사용: python3 scripts/build-sfx-r1276.py   → r96/runtime-text/assets/r1276/sfx/*.ogg 와 r96/qa/r1276/audio-report.json"""
import subprocess, json, pathlib, numpy as np
SR = 44100
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'r96/runtime-text/assets/r1276/sfx'; OUT.mkdir(parents=True, exist_ok=True)
SRC = ROOT / 'scripts/sfx-src-r1276/rain_C_raw.mp3'
def load(p):
    r = subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout
    return np.frombuffer(r,dtype=np.float32).copy()
def speed(g, s):
    n = int(len(g)/s); return np.interp(np.arange(n)*s, np.arange(len(g)), g).astype(np.float32)
raw = load(SRC)[int(.05*SR):]; raw = raw/raw.std(); raw = np.tanh(raw/2.5)*2.5
rng = np.random.default_rng(1276)
# 배경 30초
N = 30*SR; bed = np.zeros(N+3*SR, dtype=np.float32); t = 0
while t < N+SR:
    g = speed(raw, rng.uniform(.88,1.12))
    g = g*np.sqrt(np.hanning(len(g)))
    if rng.random() < .5: g = g[::-1]
    bed[t:t+len(g)] += g*rng.uniform(.6,1); t += int(len(g)*rng.uniform(.18,.3))
bed = bed[SR:N+SR]; bed /= bed.std()
# 물방울: 원본 튐 지점 60ms
r0 = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',str(SRC),'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout,dtype=np.float32)
r0 = r0/r0.std(); drops = []; W = int(.06*SR); i = int(.05*SR)
while i < len(r0)-W:
    if abs(r0[i]) > 5:
        g = r0[i-int(.004*SR):i-int(.004*SR)+W].copy()
        if len(g) == W: drops.append(g)
        i += int(.12*SR)
    else: i += 1
assert drops, 'no drops found'
# 영웅별 성격: 음높이(speed)·길이(ms)·물방울 수·간격(ms)·저역통과 Hz·몸통 비율
HERO = {
 'hwando':  dict(sp=1.00, ln=110, nd=1, gap=0,  lp=4000, body=.55),  # 칼날: 단정한 한 방울
 'seoha':   dict(sp=1.08, ln=100, nd=2, gap=55, lp=4400, body=.5),   # 태엽: 두 번 똑똑
 'neon':    dict(sp=1.22, ln=95,  nd=2, gap=38, lp=4200, body=.5),   # 번개였던 자리: 가볍게 튀는 두 방울(전자음 없음)
 'michaela':dict(sp=1.15, ln=135, nd=1, gap=0,  lp=4300, body=.65),  # 빛: 부드럽고 긴 여운
 'lauren':  dict(sp=1.32, ln=120, nd=3, gap=42, lp=3900, body=.4),   # 결정: 맑은 세 방울
 'hunter':  dict(sp=1.12, ln=80,  nd=1, gap=0,  lp=4800, body=.45),  # 화살: 짧고 가는 한 방울
 'slayer':  dict(sp=.78,  ln=150, nd=1, gap=0,  lp=3800, body=.8),   # 대검: 무겁고 굵게
 'gunner':  dict(sp=1.04, ln=70,  nd=1, gap=0,  lp=4600, body=.4),   # 탄환: 가장 짧고 또렷
 'ego':     dict(sp=.90,  ln=140, nd=2, gap=60, lp=4000, body=.7),   # 먹: 낮고 번지는 두 방울
 'persona': dict(sp=.82,  ln=145, nd=2, gap=70, lp=3800, body=.7),   # 언주: 더 낮고 어긋난 두 방울
}
def env_attack(n, att_ms):
    a = max(int(att_ms/1000*SR),2); e = np.ones(n,dtype=np.float32); e[:a] = .5-.5*np.cos(np.linspace(0,np.pi,a)); return e
def make(h, v, big):
    p = HERO[h]; s = .72*p['sp']*(.7 if big else 1)*(1+.05*(v-1.5)*(2 if not big else 1))
    ln = int(max(p['ln']*1.9, 180) if big else p['ln'])*SR//1000
    o = int(rng.integers(0, len(bed)-ln-1))
    body = bed[o:o+ln].copy(); e = env_attack(ln, 24)*np.exp(-np.linspace(0, 5.2 if not big else 4.2, ln)); body *= e*p['body']
    y = body.copy()
    for k in range(p['nd']+(1 if big else 0)):
        d = speed(drops[int(rng.integers(len(drops)))], s*(1+.1*k))
        at = max(0, int((10+max(k*p['gap'], 30*k)+(0 if k==0 else rng.integers(-4,5)))/1000*SR))
        d = d*env_attack(len(d), 18)*np.exp(-np.linspace(0,3,len(d)))
        amp = 1.0/(1+.45*k)
        end = min(len(y), at+len(d)); y[at:end] += d[:end-at]*amp*(1.4 if big else 1)
    if big:  # 낮은 '툭' — 200~350Hz 쯤의 짧은 울림(고역통과 150Hz 위)
        t = np.arange(int(.09*SR))/SR; th = np.sin(2*np.pi*(260-90*t/.09)*t)*np.exp(-t*38)*env_attack(len(t), 20)
        y[:len(th)] += th*1.1
    y = y*np.hanning(2*len(y))[len(y):]**.35  # 끝을 부드럽게
    return y.astype(np.float32), p['lp']
def enc(y, lp, out):
    # 1) 필터(고역통과 150Hz·저역통과 4극·300~500Hz 몸통 살림) 2) 필터 뒤 피크를 -10.5dBFS 에 맞춤 3) 시작·끝 다듬기 후 ogg
    f = f'highpass=f=150,lowpass=f={int(lp*.6)},lowpass=f={int(lp*.6)},equalizer=f=420:t=q:w=1:g=4'
    z = np.frombuffer(subprocess.run(['ffmpeg','-y','-v','error','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-af',f,'-f','f32le','-'],input=y.astype(np.float32).tobytes(),capture_output=True,check=True).stdout,dtype=np.float32).copy()
    z = z/abs(z).max()*10**(-10.5/20)
    f2 = f'afade=t=in:d=0.004,afade=t=out:st={len(z)/SR-.035:.3f}:d=0.035'
    subprocess.run(['ffmpeg','-y','-v','error','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-af',f2,'-c:a','libvorbis','-q:a','3',str(out)],input=z.tobytes(),check=True)
report = {}
for h in HERO:
    for v in range(1,5):
        y, lp = make(h, v, False); out = OUT/f'rain-hit-{h}-{v}.ogg'; enc(y, lp, out); report[out.name] = out.stat().st_size
    for v in range(1,3):
        y, lp = make(h, v, True); out = OUT/f'rain-hitbig-{h}-{v}.ogg'; enc(y, lp, out); report[out.name] = out.stat().st_size
print(len(report), 'files', sum(report.values()), 'bytes')
