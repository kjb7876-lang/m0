#!/usr/bin/env python3
"""R761 — 불면귀(동양몽세) 보스·잠식된 마을 사람 효과음. ElevenLabs text-to-sound v2 로 2026-11-11 생성(flow 5G40bv7tHlwuKds9iCJb, 6종×4변주).
사용: python3 build-sfx-r761.py <원본 폴더> <출력 폴더>   (ffmpeg·numpy). 다듬기 방식은 scripts/build-sfx-r546.py 와 같다(150Hz 아래 걷기·부드러운 시작/끝·피크 맞춤).
보스 실 소리(비)는 9~12kHz 위뿐이라 재생 속도를 늦추고, 핵 드러남은 100Hz 아래뿐이라 재생 속도를 올려 150Hz 위로 옮긴다."""
import numpy as np,subprocess,os,sys,json,hashlib,pathlib
SR=44100;SRC=pathlib.Path(sys.argv[1]);OUT=pathlib.Path(sys.argv[2]);OUT.mkdir(parents=True,exist_ok=True)
P={'thread_wrap':'Many dark silk threads whipping forward and wrapping tight around something, airy rustling whoosh, soft and clean, no hard impact, 1.2 seconds',
 'gaze':'Eerie glowing gaze beam, a warm low hum swelling into a soft glassy shimmer then fading, hypnotic and smooth, 1.5 seconds',
 'thread_rain':'Countless fine black threads falling from the sky like a soft drizzle, gentle hissing patter and light rustle, calm but uneasy, 2 seconds',
 'core_reveal':'Tangled threads slowly parting with a soft silk tearing sound, revealing a dark pulsing core with a deep breathing hum and a faint heartbeat, ominous, 2.5 seconds',
 'villager_groan':'Exhausted sleepless villager, a breathy weary moan and dry whisper sigh, tired not screaming, close and soft, 1.3 seconds',
 'snap_sleep':'A taut thread snapping softly, then a body slumping onto a wooden floor and a long relieved exhale of finally falling asleep, gentle, 2 seconds'}
ROWS={
 'bmg-wrap-1':('thread_wrap_2',.03,.40,1.0,180,3400,.008,.2,-10,'r761BossWrap',.7,'불면귀 실 휘감기(atkA) — 실 휘두름'),
 'bmg-wrap-2':('thread_wrap_3',.35,.40,1.0,180,3400,.008,.2,-10,'r761BossWrap',.7,'불면귀 실 휘감기 변주'),
 'bmg-gaze-1':('gaze_3',0,.95,1.0,180,3400,.03,.35,-11,'r761BossGaze',.65,'불면귀 눈빛(cast) — 낮은 웅웅임이 유리빛으로'),
 'bmg-gaze-2':('gaze_2',0,.70,1.0,180,3400,.03,.3,-11,'r761BossGaze',.65,'불면귀 눈빛 변주'),
 'bmg-rain-1':('thread_rain_4',0,.75,.26,180,2400,.08,.6,-12,'r761BossRain',.6,'불면귀 실비(atkB) — 쏟아지는 실, 재생 속도 0.26'),
 'bmg-rain-2':('thread_rain_1',.2,.75,.26,180,2400,.08,.6,-12,'r761BossRain',.6,'불면귀 실비 변주, 재생 속도 0.26'),
 'bmg-reveal-1':('core_reveal_2',0,5.0,3.2,200,3000,.15,.8,-10,'r761BossReveal',.75,'불면귀 핵 드러남(reveal) — 숨 쉬는 웅웅임과 맥박, 재생 속도 3.2'),
 'bmg-reveal-2':('core_reveal_4',0,1.9,3.2,200,3000,.1,.4,-10,'r761BossReveal',.75,'불면귀 핵 드러남 변주, 재생 속도 3.2'),
 'bmg-groan-1':('villager_groan_2',0,.65,1.0,180,3200,.03,.3,-13,'r761VillagerGroan',.55,'잠식된 마을 사람 — 지친 신음'),
 'bmg-groan-2':('villager_groan_3',0,.85,1.0,180,3200,.03,.35,-13,'r761VillagerGroan',.55,'잠식된 마을 사람 신음 변주'),
 'bmg-sleep-1':('snap_sleep_4',0,.30,.55,180,3200,.006,.18,-11,'r761VillagerSleep',.65,'마을 사람 쓰러짐(death) — 실 끊김, 재생 속도 0.55'),
 'bmg-sleep-2':('snap_sleep_1',.05,1.2,1.0,180,3200,.02,.5,-11,'r761VillagerSleep',.65,'마을 사람 쓰러짐 변주 — 끊김 뒤 잠드는 숨')}
def dec(p):return np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',str(p),'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout,dtype=np.float32).astype(float)
def measure(x,cut):
    S=np.abs(np.fft.rfft(x))**2;f=np.fft.rfftfreq(len(x),1/SR);w=441;e=np.sqrt((x[:len(x)//w*w].reshape(-1,w)**2).mean(1));h=np.sqrt((x[:len(x)//220*220].reshape(-1,220)**2).mean(1))
    return {'duration':round(len(x)/SR,3),'peakDb':round(float(20*np.log10(np.abs(x).max())),2),'rmsDb':round(float(20*np.log10(np.sqrt((x**2).mean()))),2),
            'riseMs':round(float(np.argmax(h>=.7*h.max())*220/SR*1000),1),'lowShare150':round(float(S[f<150].sum()/S.sum()),4),'lowShare200':round(float(S[f<200].sum()/S.sum()),4),
            'harshShare2to5k':round(float(S[(f>=2000)&(f<5000)].sum()/S.sum()),4),'hfShare5k':round(float(S[f>5000].sum()/S.sum()),5),'midShare':round(float(S[(f>=200)&(f<=cut)].sum()/S.sum()),4),
            'centroidHz':int((S*f).sum()/S.sum()),'tailDb':round(float(20*np.log10(e[-2:].mean()/e.max()+1e-9)),1)}
rows={}
for name,(src,ss,dur,rate,hp,lp,fi,fo,peak,kind,gain,use) in ROWS.items():
    s=SRC/(src+'.mp3');tmp=OUT/(name+'.wav');o=OUT/(name+'.ogg');out=dur/rate;fo=min(fo,out*.7)
    af=f'asetrate={int(SR*rate)},aresample={SR},highpass=f={hp},highpass=f={hp},lowpass=f={lp},lowpass=f={lp},lowpass=f={lp}'
    subprocess.run(['ffmpeg','-v','quiet','-y','-ss',str(ss),'-t',str(dur),'-i',str(s),'-ar',str(SR),'-ac','1','-af',af,str(tmp)],check=True)
    x=dec(tmp);ni=int(fi*SR);no=min(int(fo*SR),len(x)-ni);x[:ni]*=np.sin(np.linspace(0,np.pi/2,ni))**2;x[-no:]*=np.cos(np.linspace(0,np.pi/2,no))**2;nt=min(int(.04*SR),len(x)//3);x[-nt:]*=np.cos(np.linspace(0,np.pi/2,nt))**2;x=np.concatenate([x,np.zeros(int(.012*SR))]);x*=10**(peak/20)/np.abs(x).max()
    subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-c:a','pcm_f32le',str(tmp)],input=x.astype(np.float32).tobytes(),check=True)
    subprocess.run(['ffmpeg','-v','quiet','-y','-i',str(tmp),'-c:a','libvorbis','-q:a','3','-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact',str(o)],check=True);os.remove(tmp)
    b=o.read_bytes();rows[name]={'path':'assets/r761/sfx/'+name+'.ogg','kind':kind,'gain':gain,'use':use,'source':src+'.mp3','prompt':P[src.rsplit('_',1)[0]],'sourceSha256':hashlib.sha256(s.read_bytes()).hexdigest(),'sourceBytes':s.stat().st_size,
        'trim':[ss,dur],'rate':rate,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),**measure(dec(o),lp)}
(OUT/'index.json').write_text(json.dumps({'revision':'R761','generator':'scripts/build-sfx-r761.py','origin':'ElevenLabs text-to-sound v2(eleven_text_to_sound_v2)로 2026-11-11 생성, 자르기·재생 속도·필터·음량을 손봄','files':rows},ensure_ascii=False,indent=1)+'\n')
for k,v in rows.items():print(f"{k:15s}",v['bytes'],*[f"{a}={v[a]}" for a in('duration','peakDb','rmsDb','riseMs','lowShare150','harshShare2to5k','hfShare5k','centroidHz','tailDb')])
print('total',sum(v['bytes'] for v in rows.values()),len(rows))
