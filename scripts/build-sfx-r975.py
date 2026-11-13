#!/usr/bin/env python3
"""R975 — 환도 E 「유영 일섬」 7연 다단히트의 타마다 짧은 칼날 타격음 7개.
새 녹음·유료 생성 없이 이미 들어 있는 R785 환도 적중음(ElevenLabs 로 만든 우리 소리, hit-hwando-1~4·hitbig-hwando-1)만 다시 다듬는다.
 - 1~6타: 짧은 칼날 적중(0.17초), 타마다 음높이를 반음 남짓씩 올려(×1.00→×1.16) 몰아치는 느낌, 좌·우 번갈아 소리 위치(팬 ±0.45) — 화면의 좌우 베기와 맞춘다.
 - 7타(마무리): 큰 타격음을 조금 낮춰(×0.94) 무게를 주고 가운데에서 0.32초.
 - 150Hz 아래·5kHz 위는 걷어 내고(R545 스피커 기준), 끝은 부드럽게 줄인다. 피크 -7dBFS 안팎.
사용: python3 scripts/build-sfx-r975.py  (ffmpeg·numpy 필요)"""
import numpy as np,subprocess,pathlib,json,hashlib
SR=44100;ROOT=pathlib.Path(__file__).resolve().parents[1];A=ROOT/'r96/runtime-text/assets';OUT=A/'r975/sfx';OUT.mkdir(parents=True,exist_ok=True)
def dec(p):return np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',str(p),'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout,dtype=np.float32).astype(float)
def onset(x):pk=np.abs(x).max();i=int(np.argmax(np.abs(x)>=.12*pk));return max(0,i-int(.002*SR))
def filt(x,rate):
    t=subprocess.run(['ffmpeg','-v','quiet','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-af',f'asetrate={int(SR*rate)},aresample={SR},highpass=f=170,highpass=f=170,lowpass=f=4600,lowpass=f=4600',
                      '-f','f32le','-ac','1','-ar',str(SR),'-'],input=x.astype(np.float32).tobytes(),capture_output=True,check=True).stdout
    return np.frombuffer(t,dtype=np.float32).astype(float)
def shape(src,rate,length,peak_db):
    x=dec(src);x=x[onset(x):];y=filt(x,rate)[:int(length*SR)];n=len(y);ni=int(.003*SR);no=int(n*.55)
    y[:ni]*=np.sin(np.linspace(0,np.pi/2,ni))**2;y[-no:]*=np.cos(np.linspace(0,np.pi/2,no))**3
    return y*(10**(peak_db/20)/max(1e-9,np.abs(y).max()))
def pan(y,p):# 등파워 팬: p=-1 왼쪽 … +1 오른쪽
    th=(p+1)*np.pi/4;return np.stack([y*np.cos(th),y*np.sin(th)],1)
def enc(st,path):
    subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','-','-c:a','libvorbis','-q:a','3',str(path)],input=st.astype(np.float32).tobytes(),check=True)
rows=[]
for i in range(1,8):
    if i<7:src=A/f'r785/sfx/hit-hwando-{(i-1)%4+1}.ogg';rate=1+.032*(i-1);y=shape(src,rate,.17,-8.0);p=-.45 if i%2 else .45
    else:src=A/'r785/sfx/hitbig-hwando-1.ogg';rate=.94;y=shape(src,rate,.32,-6.5);p=0.0
    out=OUT/f'ilseom-{i}.ogg';enc(pan(y,p),out);b=out.read_bytes()
    rows.append({'file':str(out.relative_to(ROOT)),'source':str(src.relative_to(ROOT)),'rate':round(rate,3),'pan':p,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(OUT/'manifest.json').write_text(json.dumps({'round':'R975','use':'환도 E 유영 일섬 7연 다단히트 타마다 1개','generatedFrom':'R785 ElevenLabs 환도 적중음 재가공(새 생성·비용 없음)','directListeningVerified':False,'files':rows},ensure_ascii=False,indent=1))
print(json.dumps(rows,ensure_ascii=False,indent=1))
