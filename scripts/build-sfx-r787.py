#!/usr/bin/env python3
"""R787 — ElevenLabs(text-to-sound v2)로 만든 영웅별 스킬(W/E/R) 사용음·헌터 평타음을 다듬는다.
사용: python3 scripts/build-sfx-r787.py [원본 폴더]   (기본 /mnt/project-files/elevenlabs-r787/raw, ffmpeg·numpy 필요)
사용자 2026-11-12 "영웅들마다 고유 피격·스킬사용·공격 효과음을 일레븐랩스로 생성해서 적용".
가공: 첫 소리 3ms 앞에서 자르기 → 150Hz 고역통과·4.5kHz 저역통과(R545 '스피커 터짐' 기준) → 5ms 올림·끝 cos⁴ 내림 → RMS 를 같은 값으로 맞추고 부드러운 피크 제한.
피치 변주는 재생 속도(asetrate)로 파일에 구워 넣는다. 슬롯마다 서로 다른 원본·속도 조합 3개를 고른다."""
import numpy as np,subprocess,os,sys,json,hashlib,pathlib
SR=44100;ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'r96/runtime-text/assets/r787/sfx';OUT.mkdir(parents=True,exist_ok=True)
SRC=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/elevenlabs-r787/raw')
HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner']
NAME={'hwando':{'w':'월섬 회천','e':'백은 유영보','r':'EGO 환수검'},'seoha':{'w':'죽은 시간 개방','e':'카이로스의 순간','r':'최초명령 해방'},'neon':{'w':'성역 수복','e':'네온 돌파','r':'보스 낙인'},
 'michaela':{'w':'천상 방패','e':'응급 위상전이','r':'세라핌 대정화'},'lauren':{'w':'거짓 분리','e':'심문자의 전이','r':'진명 심판'},'hunter':{'w':'바운스 화살','e':'피의 대시','r':'진홍빛 꽃잎 폭풍'},
 'slayer':{'w':'피의 희생','e':'피의 대시','r':'피의 난도질'},'gunner':{'w':'상태 정화','e':'팬텀 블링크','r':'시간 지연포'}}
LEN={'w':.95,'e':.6,'r':1.4,'atk':.32};HP,LP=150,4500;TARGET_RMS=-22.0;CEIL=.36;RATES=[1.0,.94,1.06];HPS=[150,220,320];LPS=[4500,3400,2800];FRS=[.12,.5];RISE={'w':180,'e':90,'r':180,'atk':20}
def dec(p):return np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',str(p),'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout,dtype=np.float32).astype(float)
def onset(x,fr=.12):
    pk=np.abs(x).max();i=int(np.argmax(np.abs(x)>=fr*pk));return max(0,i-int(.003*SR))
def measure(x):
    S=np.abs(np.fft.rfft(x))**2;f=np.fft.rfftfreq(len(x),1/SR);h=np.sqrt((x[:len(x)//220*220].reshape(-1,220)**2).mean(1));e=np.sqrt((x[:len(x)//441*441].reshape(-1,441)**2).mean(1))
    return {'duration':round(len(x)/SR,3),'peakDb':round(float(20*np.log10(np.abs(x).max())),2),'rmsDb':round(float(20*np.log10(np.sqrt((x**2).mean()))),2),
            'riseMs':round(float(np.argmax(h>=.5*h.max())*220/SR*1000),1),'lowShare150':round(float(S[f<150].sum()/S.sum()),4),'harshShare2to5k':round(float(S[(f>=2000)&(f<5000)].sum()/S.sum()),4),
            'hfShare5k':round(float(S[f>5000].sum()/S.sum()),5),'centroidHz':int((S*f).sum()/S.sum()),'tailDb':round(float(20*np.log10(e[-2:].mean()/e.max()+1e-9)),1)}
def shape(x,length,rate,hp=HP,lp=LP,fr=.12):
    s=onset(x,fr);seg=x[s:s+int(length*SR*rate)]
    t=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-af',f'asetrate={int(SR*rate)},aresample={SR},highpass=f={hp},highpass=f={hp},lowpass=f={lp},lowpass=f={lp},lowpass=f={lp}','-f','f32le','-ac','1','-ar',str(SR),'-'],input=seg.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
    y=np.frombuffer(t,dtype=np.float32).astype(float)[:int(length*SR)];n=len(y);ni=int(.005*SR);no=min(int(.18*SR),int(n*.5))
    y[:ni]*=np.sin(np.linspace(0,np.pi/2,ni))**2;y[-no:]*=np.cos(np.linspace(0,np.pi/2,no))**4
    g=10**(TARGET_RMS/20)/max(1e-9,np.sqrt((y**2).mean()))
    for _ in range(8):
        z=np.tanh(y*g/CEIL)*CEIL;r=np.sqrt((z**2).mean());g*=10**(TARGET_RMS/20)/max(1e-9,r)
    return np.tanh(y*g/CEIL)*CEIL*.8  # 소리 인코딩(ogg)이 피크를 1~3dB 키우므로 미리 낮춘다
def good(m,slot):return m['lowShare150']<=.10 and m['hfShare5k']<=.02 and -16<=m['peakDb']<=-6 and m['tailDb']<=-30 and m['riseMs']<=RISE[slot]
def score(m):return m['riseMs']/60+m['lowShare150']/.10+m['hfShare5k']/.02
rows={};R=[]
def raws(prefix):return sorted(SRC.glob(prefix+'-[0-9].mp3'))
def pick(prefix,length,slot,k=3):
    cs=[]
    for lps in (LPS,[2200,1800,1500]):
      if len(cs)>=k:break
      for f in raws(prefix):
        x=dec(f)
        for r in RATES:
            for hp in HPS:
                for lp in lps:
                    for fr in FRS:
                        m=measure(shape(x,length,r,hp,lp,fr))
                        if good(m,slot):cs.append((score(m)+(hp-150)/2000+(4500-lp)/20000+fr/10,f,r,hp,lp,fr))
    cs.sort(key=lambda c:c[0]);sel=[];used=set()
    for c in cs:  # 먼저 원본마다 가장 좋은 것, 그다음 속도 변주
        if c[1] not in used and len(sel)<k:sel.append(c);used.add(c[1])
    for c in cs:
        if len(sel)>=k:break
        if all(abs(c[2]-s[2])>=.05 or c[1]!=s[1] for s in sel):sel.append(c)
    return sel
def emit(name,f,length,rate,kind,gain,use,prompt,hp=HP,lp=LP,fr=.12):
    x=shape(dec(f),length,rate,hp,lp,fr);tmp=OUT/(name+'.wav');o=OUT/(name+'.ogg')
    subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-c:a','pcm_f32le',str(tmp)],input=x.astype(np.float32).tobytes(),check=True)
    subprocess.run(['ffmpeg','-v','quiet','-y','-i',str(tmp),'-c:a','libvorbis','-q:a','4','-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact',str(o)],check=True);os.remove(tmp)
    b=o.read_bytes();rows[name]={'path':'assets/r787/sfx/'+name+'.ogg','kind':kind,'gain':gain,'use':use,'source':f.name,'prompt':prompt,'sourceSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'sourceBytes':f.stat().st_size,
        'trim':'첫 소리 3ms 앞부터 %.2fs'%length,'rate':rate,'highpassHz':hp,'lowpassHz':lp,'onsetFrac':fr,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),**measure(dec(o))}
PROMPTS=json.loads((SRC.parent/'prompts.json').read_text()) if (SRC.parent/'prompts.json').exists() else {}
for h in HEROES:
    for s in 'wer':
        p=f'{h}-{s}';sel=pick(p,LEN[s],s);R.append((p,len(sel),sorted({c[1].name for c in sel})))
        for i,(sc,f,r,hp,lp,fr) in enumerate(sel,1):emit(f'sk-{h}-{s}-{i}',f,LEN[s],r,f'r787Sk_{h}_{s}',.8,f'{h} {s.upper()} {NAME[h][s]} 사용음'+('' if r==1.0 else f', 재생 속도 {r}'),PROMPTS.get(p,''),hp,lp,fr)
sel=pick('hunter-atk',LEN['atk'],'atk');R.append(('hunter-atk',len(sel),sorted({c[1].name for c in sel})))
for i,(sc,f,r,hp,lp,fr) in enumerate(sel,1):emit(f'atk-hunter-{i}',f,LEN['atk'],r,'r787Atk_hunter',.7,'hunter 평타(활 시위·화살) 소리'+('' if r==1.0 else f', 재생 속도 {r}'),PROMPTS.get('hunter-atk',''),hp,lp,fr)
(OUT/'index.json').write_text(json.dumps({'revision':'R787','generator':'scripts/build-sfx-r787.py','origin':'ElevenLabs text-to-sound v2(eleven_text_to_sound_v2)로 2026-11-12 생성(플로우 Y5q0Nqa2h2qnM3xCvwRJ, 25건·변주 47개), 자르기·재생 속도·필터·RMS 를 손봄',
 'params':{'highpassHzOptions':HPS,'lowpassHzOptions':LPS,'targetRmsDb':TARGET_RMS,'softCeil':CEIL},'files':rows},ensure_ascii=False,indent=1))
for t in R:print('선택',t)
for k,v in rows.items():print(f"{k:16s}",v['bytes'],*[f"{a}={v[a]}" for a in('duration','peakDb','rmsDb','riseMs','lowShare150','hfShare5k','tailDb')])
print('total',sum(v['bytes'] for v in rows.values()),len(rows))
