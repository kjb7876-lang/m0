#!/usr/bin/env python3
"""R541 — 빈 자리 효과음(기억 조각 줍기·몹 소멸·문 열림)을 numpy 로 합성한다.
녹음·외부 음원 없이 만든다. 거슬리지 않게: 느린 어택, 5kHz 위 에너지 억제, 낮은 피크.
사용: python3 scripts/build-sfx-r541.py   (ffmpeg·numpy 필요, 결과 r96/runtime-text/assets/r541/sfx/)
ogg 인코딩은 ffmpeg 판에 따라 바이트가 달라질 수 있으므로 CI 는 다시 만들지 않고 index.json 의 해시만 대조한다."""
import numpy as np,subprocess,os,json,hashlib,pathlib
SR=44100;ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'r96/runtime-text/assets/r541/sfx';OUT.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(541)
def t(d):return np.arange(int(SR*d))/SR
def noise(d):return rng.standard_normal(int(SR*d))
def bp(x,lo,hi):
    X=np.fft.rfft(x);f=np.fft.rfftfreq(len(x),1/SR)
    return np.fft.irfft(X/(1+(lo/np.maximum(f,1))**6)/(1+(f/hi)**6),len(x))
def mix(*parts):
    n=max(len(p[0])+int(SR*p[1]) for p in parts);y=np.zeros(n)
    for x,off,g in parts:
        i=int(SR*off);y[i:i+len(x)]+=x*g
    return y
def reverb(x,d,wet,lo,hi):
    ir=bp(noise(d),lo,hi)*np.exp(-t(d)/(d/5));ir/=np.sqrt((ir**2).sum())
    n=len(x)+len(ir);return np.pad(x,(0,n-len(x)))+np.fft.irfft(np.fft.rfft(x,n)*np.fft.rfft(ir,n),n)*wet
def bell(d,f0,parts,dec,atk=.010):
    x=t(d);y=np.zeros(len(x))
    for r,a,dm in parts:y+=a*np.sin(2*np.pi*f0*r*x)*np.exp(-x/(dec*dm))
    return y*np.minimum(x/atk,1)**2
def fin(x,dur,peak_db,atk=.008,rel=.12):
    x=bp(x[:int(SR*dur)],40,5200);x=x-x.mean();a=int(SR*atk);r=int(SR*rel)
    x[:a]*=np.linspace(0,1,a)**2;x[-r:]*=np.linspace(1,0,r)**2
    return x/np.abs(x).max()*10**(peak_db/20)
def measure(x):
    S=np.abs(np.fft.rfft(x))**2;f=np.fft.rfftfreq(len(x),1/SR);w=441
    e=np.sqrt((x[:len(x)//w*w].reshape(-1,w)**2).mean(1))
    return {'duration':round(len(x)/SR,3),'peakDb':round(float(20*np.log10(np.abs(x).max())),2),'rmsDb':round(float(20*np.log10(np.sqrt((x**2).mean()))),2),
            'hfShare5k':round(float(S[f>5000].sum()/S.sum()),5),'centroidHz':round(float((np.sqrt(S)*f).sum()/np.sqrt(S).sum())),
            'attackMs':round(float(np.argmax(e>=e.max()*.9)*10),1),'tailDb':round(float(20*np.log10(e[-3:].mean()/e.max()+1e-9)),1)}
def decode(p):
    return np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',str(p),'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout,dtype=np.float32).astype(float)
rows={}
def save(name,x,role,gain):
    w=OUT/(name+'.wav');o=OUT/(name+'.ogg')
    subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-',str(w)],input=x.astype(np.float32).tobytes(),check=True)
    subprocess.run(['ffmpeg','-v','quiet','-y','-i',str(w),'-c:a','libvorbis','-q:a','3','-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact',str(o)],check=True);os.remove(w)
    b=o.read_bytes();rows[name]={'path':'assets/r541/sfx/'+name+'.ogg','role':role,'gain':gain,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),**measure(decode(o))}
# 기억 조각 줍기: 낮고 둥근 유리 종 두 음(완전4도·장3도), 딸깍 없음
GL=[(1,1,1),(2.01,.28,.55),(3.0,.10,.35),(4.2,.035,.22)]
for i,(a,b) in enumerate([(784,1046.5),(659.3,830.6)],1):
    x=reverb(mix((bell(.8,a,GL,.20),0,1),(bell(.75,b,GL,.22),.11,.72)),.7,.22,300,4200)
    save(f'pickup-{i}',fin(x,1.05,-10),'pickup',.55)
# 몹 소멸: 꺼지는 낮은 숨 + 흩어지는 재(낮은 대역의 부드러운 잡음)
for i,(f0,f1) in enumerate([(170,62),(150,55)],1):
    d=.8;x=t(d);fr=f0*(f1/f0)**((x/d)**.6);car=np.sin(2*np.pi*np.cumsum(fr)/SR)*(1+.35*np.sin(2*np.pi*23*x))
    mo=bp(np.tanh(car*1.2),70,600)*np.minimum(x/.04,1)*np.exp(-x/.24)
    ash=bp(noise(d),900,3200)*np.minimum(x/.12,1)*np.exp(-x/.22)
    save(f'death-{i}',fin(reverb(mix((mo,0,1),(ash,.03,.16)),.5,.2,150,3000),.9,-10,.02),'r541Death',.5)
# 문 열림: 낮게 끌리는 돌·쇠 + 멎는 둔한 쿵
d=.8;x=t(d);gr=bp(noise(d),60,520)*(.55+.45*np.abs(np.sin(2*np.pi*9*x+2*np.sin(2*np.pi*1.7*x))))*np.sin(np.pi*x/d)**.9
fr=62+8*np.sin(2*np.pi*1.1*x);gm=bp(np.tanh(np.sin(2*np.pi*np.cumsum(fr)/SR)*(1+.6*np.sin(2*np.pi*np.cumsum(fr*2.7)/SR))*1.5),70,700)*np.sin(np.pi*x/d)
d2=.34;x2=t(d2);th=np.sin(2*np.pi*np.cumsum(72*(30/72)**(x2/d2))/SR)*np.minimum(x2/.006,1)*np.exp(-x2/.1)
save('door-1',fin(reverb(mix((gr,0,.8),(gm,0,.4),(th,.74,.9)),.5,.22,60,1800),1.18,-9,.03),'r541Door',.6)
(OUT/'index.json').write_text(json.dumps({'revision':'R541','generator':'scripts/build-sfx-r541.py','seed':541,'sampleRate':SR,'files':rows},ensure_ascii=False,indent=1)+'\n')
for k,v in rows.items():print(k,v)
