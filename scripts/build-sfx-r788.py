#!/usr/bin/env python3
"""R788 — ElevenLabs(text-to-sound v2)로 만든 보스별 고유 피격·사망·공격 소리를 다듬는다.
사용: python3 scripts/build-sfx-r788.py [원본 폴더]   (기본 /mnt/project-files/elevenlabs-r788/raw, ffmpeg·numpy 필요)
사용자 2026-11-12 "모든 몹+보스들마다 고유 피격·사망·공격 효과음을 일레븐랩스로 생성해서 적용 (영웅, 보스, 불면귀몹, 일반몹 순서)".
가공은 R787 과 같다: 첫 소리 3ms 앞에서 자르기 → 고역·저역통과(R545 '스피커 터짐' 기준) → 5ms 올림·끝 cos⁴ 내림 → RMS 맞춤·부드러운 피크 제한.
피치 변주는 재생 속도로 파일에 구워 넣는다. 피격 3개, 사망·공격 2개씩 고른다(원본이 다르면 먼저, 모자라면 속도 변주)."""
import numpy as np,subprocess,os,sys,json,hashlib,pathlib
SR=44100;ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'r96/runtime-text/assets/r788/sfx';OUT.mkdir(parents=True,exist_ok=True)
SRC=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/elevenlabs-r788/raw')
# 슬러그 → 게임 안 보스 이름(regionById 에서 읽은 그대로). 맘몬(Codex 작업)·불면귀(불면귀 묶음)는 뺀다.
BOSSES={'root':'뿌리의 문지기','balrog':'발록','lucifer':'루시퍼','sloth':'나태에 잠식된 남자','leviathan':'레비아탄','beelzebub':'베엘제붑','seoyun':'붉은 하이힐의 서윤','satan':'사탄',
 'chairman':'백색 정장의 호텔 그룹 회장','bootloader':'생체 부트로더','controller':'컨트롤러 · 기억의 문','goblin':'고블린 추장','knight':'타락천사 기사','gate01':'대수문장 01','gate02':'대수문장 02',
 'gate04':'대수문장 04','gravekeeper':'망각 묘지기','gate06':'대수문장 06','arbelia':'아르벨리아를 묶은 변조 명령','siren':'세이렌 모르','nightmare':'EGO 강탈 악몽왕','bluelight':'파란불',
 'choir':'네트워크 합창체','hanrian':'이단의목사 한리안','baekion':'이단의목사 백이온','cultleader':'교만의 사이보그 교주'}
KIND={'hit':'BHit','die':'BDie','atk':'BAtk'};USE={'hit':'피격','die':'사망','atk':'공격 시작'};COUNT={'hit':3,'die':2,'atk':2};GAIN={'hit':.55,'die':.8,'atk':.6}
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
def good(m,slot):return m['lowShare150']<=.10 and m['hfShare5k']<=.02 and -16<=m['peakDb']<=-6 and m['tailDb']<=-30 and m['riseMs']<=RISE[slot] and m['duration']>=.2
def score(m):return m['riseMs']/60+m['lowShare150']/.10+m['hfShare5k']/.02
def raws(prefix):return sorted(SRC.glob(prefix+'-[0-9].mp3'))
def pick(prefix,slot,k):
    cs=[];cache={}
    for lps in (LPS,[2200,1800,1500]):
      if len(cs)>=k:break
      for f in raws(prefix):
        x=cache.setdefault(f,dec(f))
        for r in RATES:
            for hp in HPS:
                for lp in lps:
                    for fr in FRS:
                        m=measure(shape(x,LEN[slot],r,hp,lp,fr))
                        if good(m,slot):cs.append((score(m)+(hp-150)/2000+(4500-lp)/20000+fr/10,f,r,hp,lp,fr))
    cs.sort(key=lambda c:c[0]);sel=[];used=set()
    for c in cs:
        if c[1] not in used and len(sel)<k:sel.append(c);used.add(c[1])
    for c in cs:
        if len(sel)>=k:break
        if all(abs(c[2]-s[2])>=.05 or c[1]!=s[1] for s in sel):sel.append(c)
    return sel
rows={};R=[]
PROMPTS=json.loads((SRC.parent/'prompts.json').read_text()) if (SRC.parent/'prompts.json').exists() else {}
def emit(name,f,slot,rate,kind,use,prompt,hp,lp,fr):
    x=shape(dec(f),LEN[slot],rate,hp,lp,fr);tmp=OUT/(name+'.wav');o=OUT/(name+'.ogg')
    subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-c:a','pcm_f32le',str(tmp)],input=x.astype(np.float32).tobytes(),check=True)
    subprocess.run(['ffmpeg','-v','quiet','-y','-i',str(tmp),'-c:a','libvorbis','-q:a','3','-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact',str(o)],check=True);os.remove(tmp)
    b=o.read_bytes();rows[name]={'path':'assets/r788/sfx/'+name+'.ogg','kind':kind,'gain':GAIN[slot],'use':use,'source':f.name,'prompt':prompt,'sourceSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'sourceBytes':f.stat().st_size,
        'trim':'첫 소리 3ms 앞부터 %.2fs'%LEN[slot],'rate':rate,'highpassHz':hp,'lowpassHz':lp,'onsetFrac':fr,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),**measure(dec(o))}
for slug,name in BOSSES.items():
    for slot in ('hit','die','atk'):
        p=f'{slug}-{slot}';sel=pick(p,slot,COUNT[slot]);R.append((p,len(sel),sorted({c[1].name for c in sel})))
        for i,(sc,f,r,hp,lp,fr) in enumerate(sel,1):
            emit(f'{slot}-{slug}-{i}',f,slot,r,f'r788{KIND[slot]}_{slug}',f'{name} {USE[slot]}'+('' if r==1.0 else f', 재생 속도 {r}'),PROMPTS.get(p,''),hp,lp,fr)
(OUT/'index.json').write_text(json.dumps({'revision':'R788','generator':'scripts/build-sfx-r788.py','origin':'ElevenLabs text-to-sound v2(eleven_text_to_sound_v2)로 2026-11-12 생성(플로우 9nDXmU3Cup6XmxqQ1Fxo, 보스 26 × 피격·사망·공격 78건·원본 156개), 자르기·재생 속도·필터·RMS 를 손봄',
 'bosses':BOSSES,'params':{'highpassHzOptions':HPS,'lowpassHzOptions':LPS,'targetRmsDb':TARGET_RMS,'softCeil':CEIL,'length':LEN},'files':rows},ensure_ascii=False,indent=1))
for t in R:print('선택',t)
short=[t for t in R if t[1]<COUNT[t[0].rsplit('-',1)[1]]]
print('모자람',short)
print('total',sum(v['bytes'] for v in rows.values()),len(rows))
