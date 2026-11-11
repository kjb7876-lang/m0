#!/usr/bin/env python3
"""R664 — ElevenLabs(text-to-sound v2, 20초 loop=true)로 만든 지역 환경음 6종을 다듬는다.
사용: python3 scripts/build-ambience-r664.py <원본 폴더>   (기본 /mnt/project-files/elevenlabs-r664/raw, ffmpeg·numpy 필요)
사용자 2026-11-11 "지역 배경음·환경음": 효과음·음성보다 작게, 듣기 편하게(150Hz 아래 쿵·웅웅 걷어냄, 고음 쉿 소리 억제), 이음매 없이 반복.
처리: 150Hz 고역통과 3단 → 저역통과 → 순간 소리(물방울) 눌러주기 → 목표 음량(RMS -32dBFS)·피크 -14dB 이하로 → 끝 1.6초를 처음에 겹쳐(등전력 교차) 이음매를 지움 → 22.05kHz 모노 ogg."""
import numpy as np,subprocess,sys,json,hashlib,pathlib
SR=22050;ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'r96/runtime-text/assets/r664/ambience';OUT.mkdir(parents=True,exist_ok=True)
SRC=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/elevenlabs-r664/raw')
XF=1.6;TARGET_RMS=-32.0;PEAK_MAX=-14.0
# 이름: (원본, 저역통과 Hz, 쓰임, 생성 문구)
BEDS={
 'hall':('hall','4000','병원·통제자·카이로노미콘·사이비 등 실내 공기','Quiet empty hospital corridor room tone, faint air vent breath, very soft steady ambience, seamless loop'),
 'wind':('wind','5000','마지막 수호자 거리 바깥 바람','Airy wind blowing through trees and over rooftops, soft whooshing breeze with mid-range airy texture, steady, no deep rumble, no gusts'),
 'water':('water','6000','파란불 아래 젖은 터널 물소리','Gentle water trickling and soft drips in a damp stone tunnel, light echo, steady ambience, seamless loop'),
 'crowd':('crowd','3500','피난 거점·마을의 먼 웅성임','Distant quiet murmur of a small crowd, indistinct voices, muffled, steady ambience, seamless loop'),
 'stone':('stone','4000','솔로몬 봉인식·일곱 대죄·두 사람의 성 돌 공간 공기','Large empty stone hall, faint reverberant air, soft distant wind through cracks, steady ambience, seamless loop'),
 'night':('night','4800','밤공기·벌레','Quiet night air with soft crickets and faint breeze, steady ambience, seamless loop')}
def dec(p,af=None):
    a=['ffmpeg','-v','quiet','-i',str(p)]+(['-af',af] if af else [])+['-f','f32le','-ac','1','-ar',str(SR),'-']
    return np.frombuffer(subprocess.run(a,capture_output=True,check=True).stdout,dtype=np.float32).astype(float)
def db(v):return float(20*np.log10(max(v,1e-9)))
def rms(x):return float(np.sqrt((x**2).mean()))
def measure(x):
    S=np.abs(np.fft.rfft(x))**2;f=np.fft.rfftfreq(len(x),1/SR);t=S.sum()
    return {'duration':round(len(x)/SR,3),'peakDb':round(db(np.abs(x).max()),2),'rmsDb':round(db(rms(x)),2),'lowShare150':round(float(S[f<150].sum()/t),4),
            'harshShare2to5k':round(float(S[(f>=2000)&(f<5000)].sum()/t),4),'hfShare6k':round(float(S[f>6000].sum()/t),4),'centroidHz':int((S*f).sum()/t),
            'seamJump':round(float(abs(x[-1]-x[0])),5)}
rows={}
for name,(src,lp,use,prompt) in BEDS.items():
    s=SRC/(src+'.mp3')
    x=dec(s,f'highpass=f=150,highpass=f=150,highpass=f=150,lowpass=f={lp},lowpass=f={lp}')
    x*=10**((-26-db(rms(x)))/20)                       # 압축 전에 -26dB 로 맞춤
    tmp=pathlib.Path('/tmp/_amb_'+name+'.wav')
    subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-af','acompressor=threshold=-34dB:ratio=4:attack=3:release=120:makeup=1','-c:a','pcm_f32le',str(tmp)],input=x.astype(np.float32).tobytes(),check=True)
    x=dec(tmp);tmp.unlink()
    n=int(XF*SR);w=np.linspace(0,np.pi/2,n)                # 끝을 처음에 겹쳐 이음매 지우기
    head=x[:n]*np.sin(w)+x[-n:]*np.cos(w);x=np.concatenate([head,x[n:-n]])
    x-=x.mean();g=min(10**((TARGET_RMS-db(rms(x)))/20),10**((PEAK_MAX-db(np.abs(x).max()))/20));x*=g
    pcm=pathlib.Path('/tmp/_amb_'+name+'.raw.wav')
    subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-c:a','pcm_f32le',str(pcm)],input=x.astype(np.float32).tobytes(),check=True)
    o=OUT/(name+'.ogg')
    subprocess.run(['ffmpeg','-v','quiet','-y','-i',str(pcm),'-c:a','libvorbis','-q:a','2','-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact',str(o)],check=True);pcm.unlink()
    b=o.read_bytes();rows[name]={'path':'assets/r664/ambience/'+name+'.ogg','use':use,'source':src+'.mp3','prompt':prompt,'sourceSha256':hashlib.sha256(s.read_bytes()).hexdigest(),'sourceBytes':s.stat().st_size,
        'lowpassHz':int(lp),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),**measure(dec(o))}
(OUT/'index.json').write_text(json.dumps({'revision':'R664','generator':'scripts/build-ambience-r664.py','origin':'ElevenLabs text-to-sound v2(eleven_text_to_sound_v2, duration 20초·loop=true)로 2026-11-11 생성, 150Hz 고역통과·눌러주기·음량·이음매 교차를 손봄','sampleRate':SR,'crossfadeSec':XF,'targetRmsDb':TARGET_RMS,'files':rows},ensure_ascii=False,indent=1)+'\n')
for k,v in rows.items():print(f"{k:6s}",v['bytes'],*[f"{a}={v[a]}" for a in('duration','peakDb','rmsDb','lowShare150','harshShare2to5k','hfShare6k','centroidHz','seamJump')])
print('total',sum(v['bytes'] for v in rows.values()),len(rows))
