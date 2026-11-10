#!/usr/bin/env python3
"""R543 — 사용자가 준 늑대·고블린·천둥 소리를 변형(음높이)·다듬어 적 목소리와 먼 천둥으로 만든다.
사용: python3 scripts/build-sfx-r543.py <원본 폴더>   (기본 /mnt/project-files/sfx-sources-r542, ffmpeg·numpy 필요)
변형: 재생 속도로 음높이를 내리거나 올려 다른 몸집의 짐승·더 어두운 목소리로 만든다. CI 는 index.json 해시만 대조한다."""
import numpy as np,subprocess,os,sys,json,hashlib,pathlib
SR=44100;ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'r96/runtime-text/assets/r543/sfx';OUT.mkdir(parents=True,exist_ok=True)
SRC=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/sfx-sources-r542')
#  이름: (원본, 시작, 길이, 음높이 배율, 고역통과, 저역통과, 페이드인, 페이드아웃, 피크dB, 역할, 게임 배율, 쓰임)
ROWS={'growl-1':('wolf_growl_3.mp3',0,.55,1.0,80,3000,.02,.2,-10,'r543Growl',.5,'짐승형 적(도시짐승·추적견·사냥개) 공격'),
 'growl-2':('wolf_growl_3.mp3',0,.55,.80,70,2600,.02,.25,-10,'r543GrowlLow',.5,'큰 짐승(곰) 공격 — 음높이 20% 내림'),
 'growl-3':('wolf_growl_3.mp3',0,.55,1.14,100,3400,.02,.18,-11,'r543GrowlHigh',.45,'작은 짐승(여우 악마) 공격 — 음높이 14% 올림'),
 'goblin-1':('goblin_vocalizations_1.mp3',.36,.46,.88,150,3600,.02,.14,-11,'r543Goblin',.45,'피리 고블린 공격 — 음높이 12% 내림'),
 'goblin-2':('goblin_vocalizations_1.mp3',1.02,.50,.94,150,3600,.03,.16,-11,'r543Goblin',.45,'피리 고블린 공격 변주 — 음높이 6% 내림'),
 'thunder-1':('thunder_and_raining_1.mp3',.15,1.10,1.0,50,1400,.18,.55,-12,'r543Thunder',.5,'비 구역 먼 천둥'),
 'thunder-2':('thunder_and_raining_1.mp3',.15,.93,.86,45,1200,.18,.55,-12,'r543Thunder',.5,'비 구역 먼 천둥 변주 — 음높이 14% 내림')}
def dec(p):return np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',str(p),'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout,dtype=np.float32).astype(float)
def measure(x):
    S=np.abs(np.fft.rfft(x))**2;f=np.fft.rfftfreq(len(x),1/SR);w=441;e=np.sqrt((x[:len(x)//w*w].reshape(-1,w)**2).mean(1))
    return {'duration':round(len(x)/SR,3),'peakDb':round(float(20*np.log10(np.abs(x).max())),2),'rmsDb':round(float(20*np.log10(np.sqrt((x**2).mean()))),2),
            'hfShare5k':round(float(S[f>5000].sum()/S.sum()),5),'tailDb':round(float(20*np.log10(e[-2:].mean()/e.max()+1e-9)),1)}
rows={}
for name,(src,ss,dur,rate,hp,lp,fi,fo,peak,role,gain,use) in ROWS.items():
    s=SRC/src;tmp=OUT/(name+'.wav');o=OUT/(name+'.ogg');out=dur/rate
    af=f'asetrate={int(SR*rate)},aresample={SR},highpass=f={hp},lowpass=f={lp},afade=t=in:d={fi},afade=t=out:st={out-fo:.4f}:d={fo}'
    subprocess.run(['ffmpeg','-v','quiet','-y','-ss',str(ss),'-t',str(dur),'-i',str(s),'-ar',str(SR),'-ac','1','-af',af,str(tmp)],check=True)
    x=dec(tmp);g=10**(peak/20)/np.abs(x).max()
    subprocess.run(['ffmpeg','-v','quiet','-y','-i',str(tmp),'-af',f'volume={g:.5f}','-c:a','libvorbis','-q:a','3','-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact',str(o)],check=True);os.remove(tmp)
    b=o.read_bytes();rows[name]={'path':'assets/r543/sfx/'+name+'.ogg','role':role,'gain':gain,'use':use,'source':src,'sourceSha256':hashlib.sha256(s.read_bytes()).hexdigest(),'sourceBytes':s.stat().st_size,
        'trim':[ss,dur],'pitch':rate,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),**measure(dec(o))}
(OUT/'index.json').write_text(json.dumps({'revision':'R543','generator':'scripts/build-sfx-r543.py','origin':'사용자 제공 효과음(2026-11-10 프로젝트 업로드), 자르기·음높이 변형·필터·음량을 손봄','files':rows},ensure_ascii=False,indent=1)+'\n')
for k,v in rows.items():print(k,{a:v[a] for a in('bytes','duration','peakDb','rmsDb','hfShare5k','tailDb')})
