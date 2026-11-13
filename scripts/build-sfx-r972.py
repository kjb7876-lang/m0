#!/usr/bin/env python3
"""R972 — ElevenLabs(text-to-sound v2)로 만든 영웅 스킬 지속 피해(도트)·다단히트 틱 소리를 다듬는다.
사용: python3 scripts/build-sfx-r972.py [원본 폴더]   (기본 /mnt/project-files/elevenlabs-r972/raw, ffmpeg·numpy 필요)
사용자 2026-11-13 "스킬종류에 맞게 도트,다단히트도 넣어서 다양한 느낌들게 그거에 맞게 효과음도 들어가고".
가공은 R954 와 같다(첫 소리 앞 자르기 → 고역·저역통과 → 올림·내림 → RMS 맞춤·부드러운 피크 제한). 자주 나는 소리이므로 짧게(0.32~0.36초)·작게."""
import numpy as np,subprocess,os,sys,json,hashlib,pathlib
SR=44100;ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'r96/runtime-text/assets/r972/sfx';OUT.mkdir(parents=True,exist_ok=True)
SRC=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/elevenlabs-r972/raw')
# 슬러그 → 게임 안 이름(헤드리스로 last302·last303 의 room.enemies 에서 읽음). 몹 이름엔 '1'·'우두머리'·'증원'·'중간보스 · ' 같은 앞뒤 말이 붙는다.
_OLD={'bulmyeongwi':'불면귀','mistheart':'검은 안개 심장 · 불면의 기억','herbwoman':'잠식된 약방 아낙','fisherman':'잠식된 어부','maiden':'잠식된 소복 처녀','mistremnant':'불면귀의 안개 잔영'}
KIND={'hit':'Hit','die':'Die','atk':'Atk'};USE={'hit':'피격','die':'사망','atk':'공격 시작'};COUNT={'hit':3,'die':3,'atk':3};GAIN={'hit':.55,'die':.8,'atk':.6};MOB_GAIN={'hit':.42,'die':.45,'atk':.45};BIG=('bulmyeongwi','mistheart');SKIP={('bulmyeongwi','atk')}  # 불면귀 공격은 R762 가 이미 고유 소리를 낸다(원본은 보관만)  # 일반 몹은 여럿이 한꺼번에 나므로 조금 작게
LEN={'hit':.45,'die':1.3,'atk':.75};RISE={'hit':40,'die':260,'atk':160};TARGET_RMS=-22.0;CEIL=.36;RATES=[1.0,.94,1.06];HPS=[150,220,320];LPS=[4500,3400,2800];FRS=[.12,.5]
def dec(p):return np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',str(p),'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout,dtype=np.float32).astype(float)
def onset(x,fr=.12):
    pk=np.abs(x).max();i=int(np.argmax(np.abs(x)>=fr*pk));return max(0,i-int(.003*SR))
def measure(x):
    S=np.abs(np.fft.rfft(x))**2;f=np.fft.rfftfreq(len(x),1/SR);h=np.sqrt((x[:len(x)//220*220].reshape(-1,220)**2).mean(1));e=np.sqrt((x[:len(x)//441*441].reshape(-1,441)**2).mean(1))
    return {'duration':round(len(x)/SR,3),'peakDb':round(float(20*np.log10(np.abs(x).max())),2),'rmsDb':round(float(20*np.log10(np.sqrt((x**2).mean()))),2),
            'riseMs':round(float(np.argmax(h>=.5*h.max())*220/SR*1000),1),'lowShare150':round(float(S[f<150].sum()/S.sum()),4),'harshShare2to5k':round(float(S[(f>=2000)&(f<5000)].sum()/S.sum()),4),
            'hfShare5k':round(float(S[f>5000].sum()/S.sum()),5),'centroidHz':int((S*f).sum()/S.sum()),'tailDb':round(float(20*np.log10(e[-2:].mean()/e.max()+1e-9)),1)}
def shape(x,length,rate,hp,lp,fr):
    s=onset(x,fr);seg=x[s:s+int(length*SR*rate)]
    t=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-af',f'asetrate={int(SR*rate)},aresample={SR},highpass=f={hp},highpass=f={hp},lowpass=f={lp},lowpass=f={lp},lowpass=f={lp}','-f','f32le','-ac','1','-ar',str(SR),'-'],input=seg.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
    y=np.frombuffer(t,dtype=np.float32).astype(float)[:int(length*SR)];n=len(y);ni=int(.005*SR);no=min(int(.18*SR),int(n*.5))
    y[:ni]*=np.sin(np.linspace(0,np.pi/2,ni))**2;y[-no:]*=np.cos(np.linspace(0,np.pi/2,no))**4
    g=10**(TARGET_RMS/20)/max(1e-9,np.sqrt((y**2).mean()))
    for _ in range(8):
        z=np.tanh(y*g/CEIL)*CEIL;r=np.sqrt((z**2).mean());g*=10**(TARGET_RMS/20)/max(1e-9,r)
    return np.tanh(y*g/CEIL)*CEIL*.8  # ogg 인코딩이 피크를 1~3dB 키우므로 미리 낮춘다
def good(m,slot):return m['harshShare2to5k']<=.35 and m['lowShare150']<=.10 and m['hfShare5k']<=.02 and -16<=m['peakDb']<=-6 and m['tailDb']<=-30 and m['riseMs']<=RISE[slot] and m['duration']>=.2
def score(m):return m['riseMs']/60+m['lowShare150']/.10+m['hfShare5k']/.02
def raws(prefix):return sorted(SRC.glob(prefix+'-[0-9].mp3'))
def pick(prefix,slot,k):
    cs=[];cache={};sel=[]
    # 단계마다 후보를 더하고 고른다. ogg 로 굳힌 뒤 기준을 못 지키는 후보는 빼므로 모자라면 다음 단계로 넘어간다.
    # 세 번째 단계(R789): 원본이 150Hz 아래뿐인 소리(예: 심장 박동 사망음)는 재생 속도를 올리고 고역통과를 높여 음역을 끌어올린다.
    for lps,rates,hps in ((LPS,RATES,HPS),([2200,1800,1500],RATES,HPS),(LPS,[1.25,1.5,1.8],[450])):
      for f in raws(prefix):
        x=cache.setdefault(f,dec(f))
        for r in rates:
            for hp in hps:
                for lp in lps:
                    for fr in FRS:
                        m=measure(shape(x,LEN[slot],r,hp,lp,fr))
                        if good(m,slot):cs.append((score(m)+(hp-150)/2000+(4500-lp)/20000+fr/10,f,r,hp,lp,fr))
      cs.sort(key=lambda c:c[0]);sel=[];used=set();bad=set()
      def ok(c):
          if c in bad:return False
          if enc_ok(c,slot,cache):return True
          bad.add(c);return False
      for c in cs:
          if c[1] not in used and len(sel)<k and ok(c):sel.append(c);used.add(c[1])
      for c in cs:
          if len(sel)>=k:break
          if all(abs(c[2]-s[2])>=.05 or c[1]!=s[1] for s in sel) and c not in sel and ok(c):sel.append(c)
      if len(sel)>=k:break
    return sel
def enc_ok(c,slot,cache):
    # ogg 로 굳힌 뒤에도 기준을 지키는지 본다(R789: 크기가 비슷한 두 덩어리가 있으면 인코딩 뒤 '올라오는 시간'이 뒤쪽 덩어리로 바뀌는 일이 있었다).
    _,f,r,hp,lp,fr=c;x=shape(cache[f],LEN[slot],r,hp,lp,fr);tmp=OUT/'_chk.wav';o=OUT/'_chk.ogg'
    subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-c:a','pcm_f32le',str(tmp)],input=x.astype(np.float32).tobytes(),check=True)
    subprocess.run(['ffmpeg','-v','quiet','-y','-i',str(tmp),'-c:a','libvorbis','-q:a','3','-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact',str(o)],check=True)
    m=measure(dec(o));os.remove(tmp);os.remove(o);return good(m,slot) and m['duration']<=LEN[slot]+.01

KINDS={'burn':'불꽃 도트','poison':'독 도트','bleed':'출혈 도트','shock':'감전 도트','holy':'성화 도트','slash':'연참 다단히트','gravity':'중력 압궤 다단히트','echo':'시간 메아리 다단히트'}
LEN.update({'tick':.36,'multi':.32});RISE.update({'tick':60,'multi':40});COUNT.update({'tick':2,'multi':2});TGAIN={'tick':.32,'multi':.4}
rows={};R=[]
PROMPTS=json.loads((SRC.parent/'prompts.json').read_text()) if (SRC.parent/'prompts.json').exists() else {}
for slug,use in KINDS.items():
    slot='tick' if 'doT' in use or '도트' in use else 'multi'
    sel=pick(slug,slot,COUNT[slot]);R.append((slug,len(sel),sorted({c[1].name for c in sel})))
    for i,(sc,f,r,hp,lp,fr) in enumerate(sel,1):
        name=f'{slug}-{i}';x=shape(dec(f),LEN[slot],r,hp,lp,fr);tmp=OUT/(name+'.wav');o=OUT/(name+'.ogg')
        subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-c:a','pcm_f32le',str(tmp)],input=x.astype(np.float32).tobytes(),check=True)
        subprocess.run(['ffmpeg','-v','quiet','-y','-i',str(tmp),'-c:a','libvorbis','-q:a','3','-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact',str(o)],check=True);os.remove(tmp)
        b=o.read_bytes();rows[name]={'path':'assets/r972/sfx/'+name+'.ogg','kind':'r972_'+slug,'gain':TGAIN[slot],'use':use+('' if r==1.0 else f', 재생 속도 {r}'),'source':f.name,'prompt':PROMPTS.get(slug,''),'sourceSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'sourceBytes':f.stat().st_size,
            'trim':'첫 소리 3ms 앞부터 %.2fs'%LEN[slot],'rate':r,'highpassHz':hp,'lowpassHz':lp,'onsetFrac':fr,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),**measure(dec(o))}
(OUT/'index.json').write_text(json.dumps({'revision':'R972','generator':'scripts/build-sfx-r972.py','origin':'ElevenLabs text-to-sound v2(eleven_text_to_sound_v2)로 2026-11-13 생성(플로우 3sOZRDJb4DqdudjqHJgT, 8종 × 변주 4 = 원본 31개), 자르기·재생 속도·필터·RMS 를 손봄',
 'kinds':KINDS,'params':{'gain':TGAIN,'highpassHzOptions':HPS,'lowpassHzOptions':LPS,'targetRmsDb':TARGET_RMS,'softCeil':CEIL,'length':{k:LEN[k] for k in ('tick','multi')}},'files':rows},ensure_ascii=False,indent=1))
for r in R:print(*r)
