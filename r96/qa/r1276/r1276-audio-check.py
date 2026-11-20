#!/usr/bin/env python3
"""R1276 소리 기준 검사(로컬 전용: numpy). R545·R1049 기준 — 150Hz 아래 8% 이하, 2~5kHz 35% 이하(에너지), 5kHz 위 3% 이하, 시작 10ms 안 최대치 40% 미만(올라 감), 피크 -9~-14dBFS, 길이 적중 60~200ms·스킬 적중 150~330ms."""
import subprocess, pathlib, json, sys, numpy as np
D = pathlib.Path(__file__).resolve().parents[2] / 'runtime-text/assets/r1276/sfx'; SR = 44100; bad = []; rows = {}
for f in sorted(D.glob('*.ogg')):
    x = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout,dtype=np.float32)
    big = 'hitbig' in f.name; dur = len(x)/SR*1000; pk = 20*np.log10(abs(x).max()+1e-9)
    S = np.abs(np.fft.rfft(x*np.hanning(len(x))))**2; fr = np.fft.rfftfreq(len(x),1/SR); tot = S.sum()
    lo = S[fr<150].sum()/tot; mid = S[(fr>=2000)&(fr<5000)].sum()/tot; hi = S[fr>=5000].sum()/tot
    att = abs(x[:int(.010*SR)]).max()/abs(x).max()
    r = dict(ms=round(float(dur)), peak=round(float(pk),1), lo=round(float(lo),3), mid=round(float(mid),3), hi=round(float(hi),3), att10=round(float(att),2)); rows[f.name]=r
    why = []
    if lo > .08: why.append('150Hz 아래 '+str(r['lo']))
    if mid > .35: why.append('2~5kHz '+str(r['mid']))
    if hi > .03: why.append('5kHz 위 '+str(r['hi']))
    if att >= .4: why.append('시작이 너무 빠름 '+str(att))
    if not (-14.5 <= pk <= -8.5): why.append('피크 '+str(pk))
    lo_ms, hi_ms = (150,330) if big else (60,200)
    if not (lo_ms <= dur <= hi_ms): why.append('길이 '+str(dur))
    if why: bad.append((f.name, why))
(pathlib.Path(__file__).parent/'audio-report.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1))
for b in bad[:30]: print('FAIL', *b)
print('files', len(rows), 'fail', len(bad)); sys.exit(1 if bad else 0)
