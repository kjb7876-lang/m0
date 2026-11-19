#!/usr/bin/env python3
"""R1212 — 코드로 합성하던 효과음(WebAudio 오실레이터·잡음)을 ElevenLabs(text-to-sound v3)로 만든 소리로 바꾼다.
사용자 2026-11-19 "단순코드로만든 모든효과음 조사해서 일레븐랩스로 각각상황에 맞는 고품질 효과음으로 바꿔".
사용: python3 scripts/build-sfx-r1212.py [원본 폴더]  (기본 /mnt/project-files/elevenlabs-r1212, ffmpeg·numpy 필요)
 · 변주 4개 중 상황(길이·음색)에 맞는 것을 수치로 고르고(쓰는 소리 1~2개), 첫 소리 3ms 앞부터 자른 뒤 끝을 부드럽게 줄인다.
 · 듣기 편하게: 저음 위주가 아닌 소리는 150Hz 고역통과, 쉿 소리 많은 것은 저역통과, 피크 -6dBFS 이하.
 · 음량은 예전 합성 소리와 같게: 예전 합성(아래 synth_*)을 numpy 로 흉내 내 가장 큰 구간 RMS 를 재고, 표 게인 = 합성 RMS / 파일 RMS.
 · 깔리는 소리(leaves·hum·drone)는 가운데 14초를 잘라 끝 1.6초를 처음에 등전력 교차해 이음매를 지운다(R664 방식). wind·room 은 R664 파일 재사용.
결과: r96/runtime-text/assets/r1212/sfx/*.ogg + index.json, r96/client-source/synth-sfx-r1212.js 의 /*TABLE*/ 표."""
import numpy as np,subprocess,sys,json,hashlib,pathlib,re
SR=44100;BSR=22050;ROOT=pathlib.Path(__file__).resolve().parents[1];RT=ROOT/'r96/runtime-text';OUT=RT/'assets/r1212/sfx';OUT.mkdir(parents=True,exist_ok=True)
SRC=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/elevenlabs-r1212')
JOBS=json.loads((SRC/'sessions.json').read_text())['jobs']
# 이름: (목표 길이 s, 최대 길이 s, 고역통과 Hz, 저역통과 Hz, 변주 수, 쓰임)
SPEC={
 'amb_steps':(1.6,2.6,90,6000,2,'R125 학교·만화·경성: 빈 건물 발소리'),
 'amb_bell':(1.5,2.6,150,8000,1,'R125 학교: 먼 종'),
 'amb_ding':(1.0,1.8,150,8000,1,'R125 감정의 탑: 작은 종 두 음'),
 'amb_gust':(2.0,3.0,120,7000,1,'R125 탑·경성·달리: 바람 한 줄기'),
 'amb_clank':(.6,1.4,150,6500,1,'R125 기계: 쇠 부딪는 소리'),
 'amb_boom':(1.6,2.4,45,5000,1,'R125 기계: 먼 기계 쿵'),
 'amb_chirp':(.4,1.0,300,7000,2,'R125 데이터: 전자 짹짹'),
 'amb_glitch':(.3,.8,150,7000,2,'R125 데이터: 신호 깨짐'),
 'amb_chime':(2.2,3.2,200,8000,1,'R125 숲·클림트·모네: 풍경(유리 종)'),
 'amb_music':(1.6,3.2,150,7000,1,'R125 장미: 낡은 오르골'),
 'amb_tick':(.05,.35,200,8000,2,'R125 장미·페르소나·달리·초현실: 시계 초침 / R356 카이로 초침'),
 'amb_drip':(.3,1.2,150,7000,2,'R125 만화·먹·갤러리·모네: 물방울'),
 'amb_brush':(.5,1.2,150,7000,2,'R125 먹·갤러리·고흐: 붓질'),
 'amb_tram':(.9,2.0,150,7000,1,'R125 경성: 전차 종'),
 'amb_whisper':(1.1,2.2,150,7000,1,'R125 페르소나: 속삭임 숨'),
 'amb_heart':(.5,.9,35,4000,2,'R125 뿌리(문턱): 심장 박동'),
 'kairo_chime':(1.0,2.4,150,8000,1,'R356 카이로: 시간 제어 종'),
 'kairo_toll':(3.2,4.5,60,6000,1,'R356 카이로: 구역 입장 쇠종'),
 'boss_reveal':(2.0,2.6,35,5000,1,'R568 보스 등장 울림'),
 'banner_tick':(.05,.25,200,8000,2,'R123 층·연도 숫자 딸깍'),
}
BEDS={'bed_leaves':(150,6000,'R125 숲·고흐·모네·정원: 나뭇잎 바람'),'bed_hum':(90,5000,'R125 기계: 기계 웅웅'),'bed_drone':(60,4000,'R125 장미·만화·먹·뿌리·페르소나·초현실: 낮은 울림')}
REUSE={'bed_wind':'assets/r664/ambience/wind.ogg','bed_room':'assets/r664/ambience/hall.ogg'}
ALIAS={'amb_glass':('amb_chime',1.5)}  # 예전 glass = 2637Hz 짧은 유리음 → 풍경을 높게
def dec(p,sr=SR):return np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',str(p),'-f','f32le','-ac','1','-ar',str(sr),'-'],capture_output=True,check=True).stdout,dtype=np.float32).astype(float)
def filt(x,hp,lp,sr=SR):
    t=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(sr),'-ac','1','-i','-','-af',f'highpass=f={hp},highpass=f={hp},lowpass=f={lp},lowpass=f={lp}','-f','f32le','-ac','1','-ar',str(sr),'-'],input=x.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
    return np.frombuffer(t,dtype=np.float32).astype(float)
def env_rms(x,w):
    n=max(1,int(w*SR));c=np.convolve(x**2,np.ones(n)/n,'valid') if len(x)>n else np.array([np.mean(x**2)]);return float(np.sqrt(c.max()))
def stats(x,sr=SR):
    S=np.abs(np.fft.rfft(x))**2+1e-20;f=np.fft.rfftfreq(len(x),1/sr);e=np.sqrt(np.convolve(x**2,np.ones(int(.05*sr))/int(.05*sr),'same'))
    return {'duration':round(len(x)/sr,3),'peakDb':round(float(20*np.log10(np.abs(x).max()+1e-12)),2),'activeSec':round(float((e>.05*e.max()).sum()/sr),2),
     'lowShare150':round(float(S[f<150].sum()/S.sum()),3),'harshShare2to5k':round(float(S[(f>=2000)&(f<5000)].sum()/S.sum()),3),'centroidHz':int((S*f).sum()/S.sum())}
# ── 예전 합성 소리 흉내(ambience-r125.js·kairo-homage-r356.js·boss-cinematic-r568.js·samong-mood-r123.js 와 같은 수치) ──
rng=np.random.default_rng(1212)
def envl(n0,a,d,peak,L):
    t=np.arange(L)/SR-n0;g=np.zeros(L);m1=(t>=0)&(t<a);g[m1]=.0001*(max(.0002,peak)/.0001)**(t[m1]/a);m2=(t>=a)&(t<a+d);g[m2]=max(.0002,peak)*(.0001/max(.0002,peak))**((t[m2]-a)/d);return g
def osc(typ,f0,f1,d,L,t0):
    t=np.arange(L)/SR-t0;fr=np.where(t<0,f0,f0*(f1/f0)**np.clip(t/d,0,1)) if f1 else np.full(L,f0);ph=np.cumsum(fr)/SR;ph=ph-ph[int(max(0,t0)*SR)]
    p=ph%1;return {'sine':np.sin(2*np.pi*ph),'square':np.sign(np.sin(2*np.pi*ph)),'triangle':2*np.abs(2*p-1)-1,'sawtooth':2*p-1}[typ]
def tone(o,t,fq,d,peak,typ='sine',to=None,a=.005):
    L=len(o);o+=osc(typ,fq,to,d,L,t)*envl(t,a,d,peak,L)*(np.arange(L)/SR<t+d+.05)
def brown(L):
    w=rng.uniform(-1,1,L);last=np.zeros(L);l=0
    for i in range(L):l=l*.97+w[i]*.03;last[i]=l
    return w*.6+last*2.5
NB=brown(SR*2)
def rbj(x,kind,f,q):
    w=2*np.pi*f/SR;al=np.sin(w)/(2*q);c=np.cos(w)
    if kind=='lowpass':b=[(1-c)/2,1-c,(1-c)/2]
    elif kind=='highpass':b=[(1+c)/2,-(1+c),(1+c)/2]
    else:b=[al,0,-al]
    a=[1+al,-2*c,1-al];y=np.zeros_like(x);x1=x2=y1=y2=0
    for i in range(len(x)):
        v=(b[0]*x[i]+b[1]*x1+b[2]*x2-a[1]*y1-a[2]*y2)/a[0];x2,x1,y2,y1=x1,x[i],y1,v;y[i]=v
    return y
def burst(o,t,fq,q,d,peak,kind='bandpass',noise=None):
    L=len(o);n=int((d+.05)*SR);s=(noise if noise is not None else NB);st=int(rng.uniform(0,1.5 if noise is None else 0)*SR)%len(s)
    seg=np.resize(np.roll(s,-st),n);y=rbj(seg,kind,fq,q);i0=int(t*SR);g=envl(0,.004 if noise is None else .002,d,peak,n);seg=y*g
    o[i0:i0+n]+=seg[:max(0,min(n,L-i0))]
def synth(name):
    o=np.zeros(int(SR*4.5))
    if name=='amb_steps':[burst(o,i*.5,160,1.2,.12,.5,'lowpass') for i in range(3)]
    elif name=='amb_bell':tone(o,0,659,2.4,.18);tone(o,0,988,1.8,.08)
    elif name=='amb_ding':tone(o,0,1318,.9,.12);tone(o,.25,1046,1.2,.12)
    elif name=='amb_gust':burst(o,0,700,.7,2.2,.35)
    elif name=='amb_clank':burst(o,0,2200,8,.35,.35);tone(o,0,420,.5,.08,'triangle')
    elif name=='amb_boom':tone(o,0,70,1.6,.5,'sine',38)
    elif name=='amb_chirp':[tone(o,i*.09,1600,.06,.05,'square',2600) for i in range(2)]
    elif name=='amb_glitch':[burst(o,i*.04,3000+i*500,6,.03,.15) for i in range(5)]
    elif name=='amb_chime':tone(o,0,1760,2.2,.06)
    elif name=='amb_music':[tone(o,i*.38,f,.5,.04,'triangle') for i,f in enumerate([784,659,587,523])]
    elif name=='amb_tick':[burst(o,i*.5,3500,10,.02,.18) for i in range(1)]
    elif name=='amb_drip':tone(o,0,1400,.12,.1,'sine',600)
    elif name=='amb_brush':burst(o,0,4200,.6,.5,.12,'highpass')
    elif name=='amb_tram':tone(o,0,1046,.6,.1);tone(o,.18,1318,.8,.1)
    elif name=='amb_whisper':burst(o,0,3200,2,1.1,.12)
    elif name=='amb_heart':tone(o,0,58,.18,.7,'sine',40);tone(o,.26,52,.22,.55,'sine',36)
    elif name=='kairo_tick':burst(o,0,1500,6,.03,.05,noise=rng.uniform(-1,1,SR//2));tone(o,0,1508,.035,.012,'triangle',a=.004)
    elif name=='kairo_chime':[tone(o,0,f,d,p,a=.004) for f,p,d in [[1318.5,.035,.9],[1975.5,.018,.7],[3290,.006,.35]]]
    elif name=='kairo_toll':[tone(o,0,f,d,p,a=.004) for f,p,d in [[82.4,.06,3.2],[123.5,.03,2.6],[164.8,.025,2.2],[226.6,.012,1.4]]];burst(o,0,420,6,.12,.03,noise=rng.uniform(-1,1,SR//2))
    elif name=='boss_reveal':tone(o,0,74,1.9,.55,'sine',31,a=.04);n=int(.5*SR);w=rng.uniform(-1,1,n)*(1-np.arange(n)/n)**3;o[:n]+=rbj(w,'lowpass',420,.707)*.55*.5
    elif name=='banner_tick':tone(o,0,1700,.05,.05,'square',a=.004)
    return o
def synth_bed(kind):
    L=SR*4;n=np.resize(NB,L)
    if kind=='bed_leaves':return rbj(n,'highpass',2600,.4)*.35
    if kind=='bed_wind':return rbj(n,'bandpass',520,.9)*.9
    if kind=='bed_room':return rbj(n,'lowpass',380,.707)*.45
    t=np.arange(L)/SR
    if kind=='bed_hum':return rbj(sum(a*(2*((f*t)%1)-1) for f,a in [[55,.5],[110,.25],[165,.1]]),'lowpass',320,.707)*.22
    if kind=='bed_drone':return sum((.18 if f>90 else .4)*np.sin(2*np.pi*f*t) for f in [61.7,62.3,92.5])*.5
# 예전 합성 중 거의 안 들리던 것(잡음 좁은 대역 초침 -55dB 등)은 같은 음량으로 맞추면 또 안 들린다 → 바닥값(사몽 분위기 -34·카이로 -40·숫자 딸깍 -36 dBFS, 버스 게인 전).
def floor(name):return -40 if name.startswith('kairo') else -36 if name=='banner_tick' else -34
WIN=lambda tgt:min(.4,max(.05,tgt))
def onset(x,fr=.1):
    e=np.abs(x);i=int(np.argmax(e>=fr*e.max()));return max(0,i-int(.003*SR))
def shape(x,tgt,mx,hp,lp):
    s=onset(x);seg=x[s:s+int(mx*SR)]
    tr=np.sqrt(np.convolve(seg**2,np.ones(441)/441,'same'));act=np.nonzero(tr>.03*tr.max())[0];end=min(len(seg),int((act[-1] if len(act) else len(seg))+.08*SR))
    seg=seg[:max(int(.04*SR),end)];y=filt(seg,hp,lp)[:len(seg)];n=len(y);ni=int(.004*SR);no=min(int(.25*SR),int(n*.35))
    y[:ni]*=np.sin(np.linspace(0,np.pi/2,ni))**2;y[-no:]*=np.cos(np.linspace(0,np.pi/2,no))**2
    pk=np.abs(y).max();return y*(10**(-8/20)/pk) if pk>0 else y  # 피크 -8dBFS 로 맞춤(ogg 가 1~2dB 키움 → -6 아래)
def score(name,x):
    tgt,mx,hp,lp,_,_=SPEC[name];y=shape(x,tgt,mx,hp,lp);m=stats(y);low=name in('amb_heart','boss_reveal','amb_boom','kairo_toll')
    return abs(m['activeSec']-tgt)/max(tgt,.2)+2*m['harshShare2to5k']+(0 if low else m['lowShare150'])+(.6 if m['centroidHz']>9000 else 0),y,m
def enc(y,path,sr=SR,q=3):
    tmp=path.with_suffix('.wav');subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(sr),'-ac','1','-i','-','-c:a','pcm_f32le',str(tmp)],input=y.astype(np.float32).tobytes(),check=True)
    subprocess.run(['ffmpeg','-v','quiet','-y','-i',str(tmp),'-c:a','libvorbis','-q:a',str(q),'-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact',str(path)],check=True);tmp.unlink()
files={};table={}
def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
for name,(tgt,mx,hp,lp,k,use) in SPEC.items():
    cands=[]
    for f in sorted((SRC/'raw').glob(name+'-[0-9].mp3')):
        s,y,m=score(name,dec(f));cands.append((s,f,y,m))
    cands.sort(key=lambda c:c[0]);sel=cands[:k];paths=[]
    ref=max(env_rms(synth(name),WIN(tgt)),10**(floor(name)/20));gains=[]
    for i,(s,f,y,m) in enumerate(sel):
        p=OUT/f'{name.replace("_","-")}-{i+1}.ogg';enc(y,p);rel='assets/r1212/sfx/'+p.name;paths.append(rel)
        yy=dec(p);gains.append(ref/max(1e-9,env_rms(yy,WIN(tgt))))
        files[rel]={'use':use,'origin':'ElevenLabs text-to-sound v3 (eleven_text_to_sound_v3), 2026-11-19','prompt':JOBS[name]['prompt'],'source':f.name,'sourceSha256':sha(f),'sourceBytes':f.stat().st_size,
          'highpassHz':hp,'lowpassHz':lp,'pickScore':round(s,3),'bytes':p.stat().st_size,'sha256':sha(p),**stats(yy)}
    g=float(np.clip(np.median(gains),.01,2.5))
    table[name]={'files':paths,'gain':round(g,3),'synthRmsDb':round(20*np.log10(ref),1)}
for name,(hp,lp,use) in BEDS.items():
    best=None
    for f in sorted((SRC/'raw').glob(name+'-[0-9].mp3')):
        x=dec(f,BSR);mid=len(x)//2;seg=x[mid-int(7.8*BSR):mid+int(7.8*BSR)]
        t=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(BSR),'-ac','1','-i','-','-af',f'highpass=f={hp},highpass=f={hp},lowpass=f={lp},lowpass=f={lp},acompressor=threshold=-24dB:ratio=3:attack=5:release=200','-f','f32le','-ac','1','-ar',str(BSR),'-'],input=seg.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
        y=np.frombuffer(t,dtype=np.float32).astype(float);r=np.sqrt(np.mean(y**2));y*=10**(-22/20)/max(r,1e-9)
        xf=int(1.6*BSR);a=np.linspace(0,np.pi/2,xf);body=y[:-xf].copy();body[:xf]=y[-xf:]*np.cos(a)+y[:xf]*np.sin(a)
        e=np.sqrt(np.convolve(body**2,np.ones(BSR//2)/(BSR//2),'valid'));steady=float(e.std()/e.mean());S=stats(body,BSR)
        sc=steady+2*S['harshShare2to5k']+S['lowShare150']+(np.abs(body).max()>.4)
        if best is None or sc<best[0]:best=(sc,f,body,S,steady)
    sc,f,body,S,steady=best;p=OUT/(name.replace('_','-')+'.ogg');enc(body,p,BSR,2);rel='assets/r1212/sfx/'+p.name
    yy=dec(p);ref=float(np.sqrt(np.mean(synth_bed(name)**2)))
    table[name]={'files':[rel],'gain':round(float(np.clip(ref/np.sqrt(np.mean(yy**2)),.01,2.5)),3),'loop':True,'synthRmsDb':round(20*np.log10(ref),1)}
    files[rel]={'use':use,'origin':'ElevenLabs text-to-sound v3 (eleven_text_to_sound_v3), 2026-11-19','prompt':JOBS[name]['prompt'],'source':f.name,'sourceSha256':sha(f),'sourceBytes':f.stat().st_size,
      'highpassHz':hp,'lowpassHz':lp,'loopCrossfadeSec':1.6,'steadiness':round(steady,3),'bytes':p.stat().st_size,'sha256':sha(p),**stats(yy)}
for name,rel in REUSE.items():
    yy=dec(RT/rel);ref=float(np.sqrt(np.mean(synth_bed(name)**2)))
    table[name]={'files':[rel],'gain':round(float(np.clip(ref/np.sqrt(np.mean(yy**2)),.01,2.5)),3),'loop':True,'reuse':'R664 ElevenLabs 환경음'}
tk=table['amb_tick'];kt=max(env_rms(synth('kairo_tick'),.05),10**(floor('kairo_tick')/20));ft=np.median([env_rms(dec(RT/f),.05) for f in tk['files']])
table['kairo_tick']={'files':tk['files'],'gain':round(float(np.clip(kt/ft,.01,2.5)),3),'synthRmsDb':round(20*np.log10(kt),1),'alias':'amb_tick'}
for name,(src,rate) in ALIAS.items():table[name]={**table[src],'rate':rate,'alias':src}
table=dict(sorted(table.items()))
(OUT/'index.json').write_text(json.dumps({'revision':'R1212','generator':'scripts/build-sfx-r1212.py','flow':'ElevenLabs flow (R1212 합성음 교체), 23 prompts x 4 variants, 약 1,564 credits',
  'loudness':'표 게인 = 예전 합성 소리 가장 큰 구간 RMS / 파일 RMS(같은 창)','table':table,'files':files},ensure_ascii=False,indent=1)+'\n')
js=ROOT/'r96/client-source/synth-sfx-r1212.js'
if js.exists():
    s=js.read_text();s=re.sub(r'/\*TABLE\*/.*?/\*END\*/','/*TABLE*/'+json.dumps({k:{kk:v[kk] for kk in ('files','gain','rate','loop') if kk in v} for k,v in table.items()},ensure_ascii=False,separators=(',',':'))+'/*END*/',s,flags=re.S);js.write_text(s)
for k,v in table.items():print(f"{k:14s} gain {v['gain']:6.3f} {v['files']}")
print('bytes',sum(v['bytes'] for v in files.values()),'files',len(files))
