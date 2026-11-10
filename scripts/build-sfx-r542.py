#!/usr/bin/env python3
"""R542 — 사용자가 준 효과음(2026-11-10) 가운데 고른 4개를 자르고 다듬어 게임용 ogg 로 만든다.
사용: python3 scripts/build-sfx-r542.py <원본 폴더>   (기본 /mnt/project-files/sfx-sources-r542, ffmpeg·numpy 필요)
다듬기: 쓸 구간만 자르기, 저역 웅웅거림·고역 날카로움 걸러내기, 앞뒤 페이드, 피크 맞춤, 모노 44.1kHz vorbis q3.
CI 는 다시 만들지 않고 index.json 의 해시만 대조한다."""
import numpy as np,subprocess,os,sys,json,hashlib,pathlib
SR=44100;ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'r96/runtime-text/assets/r542/sfx';OUT.mkdir(parents=True,exist_ok=True)
SRC=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/sfx-sources-r542')
#  이름: (원본, 시작, 길이, 고역통과, 저역통과, 페이드인, 페이드아웃, 피크dB, 역할, 게임 배율, 쓰임)
ROWS={'bow-1':('bow_attack_2.mp3',2.04,.21,90,6000,.010,.10,-9,'r542Bow',.6,'헌터 평타(활시위)'),
 'heal-1':('magic_attack_healing_2.mp3',1.25,1.0,120,5000,.12,.30,-10,'swHeal',.55,'회복'),
 'crush-1':('short_anything_crush_3.mp3',.17,.42,150,4500,.012,.12,-9,'r542Crush',.5,'상자 부수기'),
 'roar-1':('devil_roar_1.mp3',0,.85,70,3500,.03,.25,-9,'boss',.6,'보스 포효 변주')}
def dec(p):return np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',str(p),'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout,dtype=np.float32).astype(float)
def measure(x):
    S=np.abs(np.fft.rfft(x))**2;f=np.fft.rfftfreq(len(x),1/SR);w=441;e=np.sqrt((x[:len(x)//w*w].reshape(-1,w)**2).mean(1))
    return {'duration':round(len(x)/SR,3),'peakDb':round(float(20*np.log10(np.abs(x).max())),2),'rmsDb':round(float(20*np.log10(np.sqrt((x**2).mean()))),2),
            'hfShare5k':round(float(S[f>5000].sum()/S.sum()),5),'tailDb':round(float(20*np.log10(e[-2:].mean()/e.max()+1e-9)),1)}
rows={}
for name,(src,ss,dur,hp,lp,fi,fo,peak,role,gain,use) in ROWS.items():
    s=SRC/src;tmp=OUT/(name+'.wav');o=OUT/(name+'.ogg')
    af=f'highpass=f={hp},lowpass=f={lp},afade=t=in:d={fi},afade=t=out:st={dur-fo}:d={fo}'
    subprocess.run(['ffmpeg','-v','quiet','-y','-ss',str(ss),'-t',str(dur),'-i',str(s),'-af',af,'-ac','1','-ar',str(SR),str(tmp)],check=True)
    x=dec(tmp);g=10**(peak/20)/np.abs(x).max()
    subprocess.run(['ffmpeg','-v','quiet','-y','-i',str(tmp),'-af',f'volume={g:.5f}','-c:a','libvorbis','-q:a','3','-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact',str(o)],check=True);os.remove(tmp)
    b=o.read_bytes();rows[name]={'path':'assets/r542/sfx/'+name+'.ogg','role':role,'gain':gain,'use':use,'source':src,'sourceSha256':hashlib.sha256(s.read_bytes()).hexdigest(),'sourceBytes':s.stat().st_size,
        'trim':[ss,dur],'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),**measure(dec(o))}
(OUT/'index.json').write_text(json.dumps({'revision':'R542','generator':'scripts/build-sfx-r542.py','origin':'사용자 제공 효과음(2026-11-10 프로젝트 업로드), 자르기·필터·음량만 손봄','files':rows},ensure_ascii=False,indent=1)+'\n')
for k,v in rows.items():print(k,{a:v[a] for a in('bytes','duration','peakDb','rmsDb','hfShare5k','tailDb')})
