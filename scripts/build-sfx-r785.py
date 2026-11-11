#!/usr/bin/env python3
"""R785 — ElevenLabs(text-to-sound v2)로 만든 영웅 무기 재질별 적중음·처치 마무리음을 다듬는다.
사용: python3 scripts/build-sfx-r785.py [원본 폴더]   (기본 /mnt/project-files/elevenlabs-r785/raw, ffmpeg·numpy 필요)
사용자 2026-11-11 14:22Z "워크래프트3 효과음 많이 참고해서 … 기본공격과 스킬 그리고 피격시 효과음 적 피격과 죽음 효과음 타격감 있도록 퀄 좋게".
원본 음원을 복제하지 않고 같은 설계(짧고 마른 어택, 무기 재질마다 다른 몸통, 큰 타격은 낮은 음높이)만 참고해 새로 생성했다.
가공: 첫 소리 3ms 앞에서 자르기 → 150Hz 고역통과·4.5kHz 저역통과(스피커 터짐 방지, R545 기준) → 2ms 올림·끝 cos² 내림 → 전체 RMS 를 같은 값으로 맞추고 피크는 부드럽게 제한.
피치 변주는 재생 속도(asetrate)로 파일에 구워 넣는다(엔진은 변주를 순서대로 돌림). 같은 영웅: 원본 2개 × {1.0, 변주} = 적중 4개, 낮은 음높이(0.80) 2개 = 스킬 적중."""
import numpy as np,subprocess,os,sys,json,hashlib,pathlib
SR=44100;ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'r96/runtime-text/assets/r785/sfx';OUT.mkdir(parents=True,exist_ok=True)
SRC=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/elevenlabs-r785/raw')
P={'hwando':'Katana blade slicing into flesh, single crisp meaty slash impact with a short metallic edge, punchy and tight, no reverb, no bass rumble, very short',
 'slayer':'Heavy greatsword crashing into armored enemy, weighty crunchy metal-on-plate impact with a short thud, punchy, tight, no reverb, short',
 'hunter':'Arrow hitting a target, sharp wooden thunk with a short flesh thud, punchy and tight, no reverb, very short',
 'gunner':'Bullet impact on a body, short dry punchy thwack with a tiny metallic ping, tight, no reverb, no gunshot, very short',
 'neon':'Electric shock hitting an enemy, sharp zap crack with a short sizzle, punchy, tight, no reverb, very short',
 'michaela':'Holy light magic striking an enemy, bright soft thump with a short chime burst, punchy, tight, no reverb, very short',
 'lauren':'Crystal shard magic hitting an enemy, sharp glassy crack with a short tinkling shatter, punchy, tight, no reverb, very short',
 'seoha':'Clockwork time magic hitting an enemy, sharp clock gear clack with a short metallic tick burst, punchy, tight, no reverb, very short',
 'kill':'Monster killed, short wet crunchy collapse with a solid thud finish, punchy, tight, no reverb, no roar, very short'}
HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner']
HP,LP=160,4200;LP_HERO={'lauren':3400};TARGET_RMS=-24.0;CEIL=.40;HIT_LEN=.26;KILL_LEN=.40
def dec(p):return np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',str(p),'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout,dtype=np.float32).astype(float)
def onset(x):
    pk=np.abs(x).max();i=int(np.argmax(np.abs(x)>=.12*pk));return max(0,i-int(.003*SR))
def measure(x):
    S=np.abs(np.fft.rfft(x))**2;f=np.fft.rfftfreq(len(x),1/SR);h=np.sqrt((x[:len(x)//220*220].reshape(-1,220)**2).mean(1));e=np.sqrt((x[:len(x)//441*441].reshape(-1,441)**2).mean(1))
    return {'duration':round(len(x)/SR,3),'peakDb':round(float(20*np.log10(np.abs(x).max())),2),'rmsDb':round(float(20*np.log10(np.sqrt((x**2).mean()))),2),
            'riseMs':round(float(np.argmax(h>=.5*h.max())*220/SR*1000),1),'lowShare150':round(float(S[f<150].sum()/S.sum()),4),'harshShare2to5k':round(float(S[(f>=2000)&(f<5000)].sum()/S.sum()),4),
            'hfShare5k':round(float(S[f>5000].sum()/S.sum()),5),'centroidHz':int((S*f).sum()/S.sum()),'tailDb':round(float(20*np.log10(e[-2:].mean()/e.max()+1e-9)),1)}
def shape(x,length,rate,lp=None):
    lp=lp or LP
    """첫 소리부터 length 초(원본 시간)를 자르고 rate 만큼 재생 속도를 바꾼 뒤 필터·페이드·정규화."""
    s=onset(x);seg=x[s:s+int(length*SR)]
    t=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-af',f'asetrate={int(SR*rate)},aresample={SR},highpass=f={HP},highpass=f={HP},lowpass=f={lp},lowpass=f={lp},lowpass=f={lp}','-f','f32le','-ac','1','-ar',str(SR),'-'],input=seg.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
    y=np.frombuffer(t,dtype=np.float32).astype(float);n=len(y);ni=int(.002*SR);no=min(int(.12*SR),int(n*.55))
    y[:ni]*=np.sin(np.linspace(0,np.pi/2,ni))**2;y[-no:]*=np.cos(np.linspace(0,np.pi/2,no))**4
    g=10**(TARGET_RMS/20)/max(1e-9,np.sqrt((y**2).mean()))
    for _ in range(8):  # 부드러운 피크 제한 아래에서 RMS 를 목표에 맞춘다
        z=np.tanh(y*g/CEIL)*CEIL;r=np.sqrt((z**2).mean());g*=10**(TARGET_RMS/20)/max(1e-9,r)
    return np.tanh(y*g/CEIL)*CEIL
def good(m):return m['riseMs']<=15 and m['lowShare150']<=.10 and m['hfShare5k']<=.02 and -14<=m['peakDb']<=-6 and m['tailDb']<=-30
def score(m):return m['riseMs']/20+m['lowShare150']/.10+m['hfShare5k']/.02
def cands(prefix,n,length,rates):
    lp=LP_HERO.get(prefix)
    out=[]
    for i in range(1,n+1):
        f=SRC/f'{prefix}_{i}.mp3';x=dec(f)
        for r in rates:
            m=measure(shape(x,length,r,lp));
            if good(m):out.append((score(m),f'{prefix}_{i}',r))
    out.sort();return out
def choose(cs,k,minsrc):
    """점수 좋은 순으로 k 개. 서로 다른 원본이 minsrc 개 이상 들어가게 한다."""
    sel=[];srcs=set()
    for c in cs:
        if len(sel)>=k:break
        sel.append(c);srcs.add(c[1])
    if len(srcs)<minsrc:
        for c in cs:
            if c[1] not in srcs:sel[-1]=c;srcs.add(c[1]);break
    return sel
rows={};R=[]
def emit(name,srcname,length,rate,kind,gain,use,prompt):
    f=SRC/(srcname+'.mp3');x=shape(dec(f),length,rate,LP_HERO.get(srcname.rsplit('_',1)[0]));tmp=OUT/(name+'.wav');o=OUT/(name+'.ogg')
    subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-c:a','pcm_f32le',str(tmp)],input=x.astype(np.float32).tobytes(),check=True)
    subprocess.run(['ffmpeg','-v','quiet','-y','-i',str(tmp),'-c:a','libvorbis','-q:a','4','-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact',str(o)],check=True);os.remove(tmp)
    b=o.read_bytes();rows[name]={'path':'assets/r785/sfx/'+name+'.ogg','kind':kind,'gain':gain,'use':use,'source':srcname+'.mp3','prompt':prompt,'sourceSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'sourceBytes':f.stat().st_size,
        'trim':'첫 소리 3ms 앞부터 %.2fs'%length,'rate':rate,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),**measure(dec(o))}
for h in HEROES:
    hits=choose(cands(h,4,HIT_LEN,[1.0,1.07,.93,.88,1.03,.96]),4,2);big=choose(cands(h,4,HIT_LEN,[.80,.78,.85,.82,.75,.88]),2,1)
    R.append((h,len(hits),len(big)))
    for i,(sc,s,r) in enumerate(hits,1):emit(f'hit-{h}-{i}',s,HIT_LEN,r,f'r785Hit_{h}',.85,f'{h} 무기 적중음'+('' if r==1.0 else f', 재생 속도 {r}'),P[h])
    for i,(sc,s,r) in enumerate(big,1):emit(f'hitbig-{h}-{i}',s,HIT_LEN,r,f'r785HitBig_{h}',1.0,f'{h} 스킬 적중음 — 낮은 음높이, 재생 속도 {r}',P[h])
for i,(sc,s,r) in enumerate(choose(cands('kill',4,KILL_LEN,[1.0,1.1,.9]),5,2),1):emit(f'kill-{i}',s,KILL_LEN,r,'r785Kill',1.0,'적 처치 마무리 타격'+('' if r==1.0 else f', 재생 속도 {r}'),P['kill'])
(OUT/'index.json').write_text(json.dumps({'revision':'R785','generator':'scripts/build-sfx-r785.py','origin':'ElevenLabs text-to-sound v2(eleven_text_to_sound_v2)로 2026-11-11 생성(플로우 TKFsW6Tju3He6IXIdLtj, 9건·변주 36개), 자르기·재생 속도·필터·RMS 를 손봄. 워크래프트3 음원은 쓰지 않고 설계 느낌만 참고',
 'params':{'highpassHz':HP,'lowpassHz':LP,'targetRmsDb':TARGET_RMS,'softCeil':CEIL},'files':rows},ensure_ascii=False,indent=1))
for t in R:print('선택 개수',t)
for k,v in rows.items():print(f"{k:14s}",v['bytes'],*[f"{a}={v[a]}" for a in('duration','peakDb','rmsDb','riseMs','lowShare150','hfShare5k','centroidHz','tailDb')])
print('total',sum(v['bytes'] for v in rows.values()),len(rows))
