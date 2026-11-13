#!/usr/bin/env python3
"""R955 — ElevenLabs(text-to-sound v2)로 만든 일반 몹 계열별 고유 피격·사망·공격 소리를 다듬는다.
사용: python3 scripts/build-sfx-r955.py [원본 폴더]   (기본 /mnt/project-files/elevenlabs-r955/raw, ffmpeg·numpy 필요)
사용자 2026-11-12 "모든 몹+보스들마다 고유 피격·사망·공격 효과음을 일레븐랩스로 생성해서 적용 (영웅, 보스, 불면귀몹, 일반몹 순서)".
일반 몹은 이름이 수백 개라 그림·성격이 같은 몹을 49 계열로 묶었다(코디네이터 동의). 가공은 R954 와 같다. 계열·슬롯마다 원본 2개 → 3개 고름(모자라면 속도 변주)."""
import numpy as np,subprocess,os,sys,json,hashlib,pathlib
SR=44100;ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'r96/runtime-text/assets/r955/sfx';OUT.mkdir(parents=True,exist_ok=True)
SRC=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/elevenlabs-r955/raw')
# R955 일반몹 계열(사용자 11-12 "모든 몹 고유 효과음", 코디네이터 동의: 계열 방식). 이름 → 계열, 계열 → 소리 설명(영문 프롬프트용).
F={
 'spider':('Giant nightmare spider',['망각의 거미','보랏빛 알집지기','진흙등 거미','기억 운반거미']),
 'boneguard':('Undead skeleton guard soldier with a rusty blade',['거미줄에 묶인 수호병','쓰러진 수호병','이름 잃은 전우','마지막 길의 호위병']),
 'goatdemon':('Goat-headed swamp demon',['늪의 염소머리 악마']),
 'horndemon':('Heavy horned demon brute',['소환진 순례악마','지옥문 파수악마','갈망의 도시짐승']),
 'trashheap':('Moldy garbage-bag sloth creature',['등에 붙은 쓰레기더미','곰팡이와 오물 봉투']),
 'stomach':('Gluttonous living stomach and kitchen-scrap monster',['살아 있는 거대한 위장','끓어오르는 검은 소화액','버려진 최고급 식재료']),
 'firebeast':('Burning wolf beast of wrath',['개와 늑대의 시간','불길 속의 늑대']),
 'firedragon':('Small fire dragon of wrath',['불길 속의 용']),
 'synslime':('Neon cult synapse slime',['과열 시냅스 점액체','세뇌 신호 점액체','ID 배양 점액체','ID 잔류 점액체']),
 'ghoul':('Ghoul corpse stalker',['늪에서 되살아난 전우','피냄새 추적자','피로 꿰맨 전령']),
 'cultmage':('Hooded cult sorcerer',['수렁 주문사','검은기둥 주문사','검은기둥 화염술사']),
 'fallenangel':('Fallen angel knight with a purple sword',['보라검 추격천사','되살아난 방패동료','보라검 부활자','소환진 타락천사','소독등 타락천사','거짓천국 근위천사']),
 'gargoyle':('Stone gargoyle guardian',['검은기둥 가고일 수호자']),
 'lust':('Lust marionette with high-heel blades',['붉은 하이힐 칼날','공중을 가르는 립스틱 탄환','얼굴 없는 남자의 박수']),
 'orderly':('Hallucinated hospital orderly in a white mask',['백의 구속자','안정화 집행체','주사실 감시환각','오만의 흰 가면','치료거부의 가면']),
 'screamecho':('Screaming corridor specter',['복도 비명잔영','부정의 잔영']),
 'glass':('Envy specter of broken glass shards',['이름 없던 공포','찢어진 사진의 망령','칼날과 유리 조각']),
 'bluewraith':('Blue memory wraith',['첫 기억 청람잔영','입양기억 청람잔영','이동문 청람잔영']),
 'voidwraith':('Hollow void wraith',['기억 공백 망령','학대기록 공허체','이동문 공허잔영']),
 'paperecho':('Ghost of unsent papers and records',['공실 표기 잔재','제출되지 못한 문장','은폐기록 연결체']),
 'vialcore':('Floating drug vial core',['갈망의 약병핵','중독의 폐허핵']),
 'sealresidual':('Residual occult seal spirit',['미뤄 둔 시간의 형상','낡은 장난감 요요','육망성의 흑마술 실험체','인간의 뇌를 닮은 투명 연산 장치','일흔두 번째 인장 잔류체']),
 'cultist':('Black-rose modern cultist',['흑장미 귀막은 신도','흑장미 눈가린 신도']),
 'crystal':('Black rose crystal guardian',['본능 추출 결정','죄책감 압축결정','SUPER EGO 절개결정','아마겟돈 계산결정','합일 주파수 결정']),
 'egovessel':('Ego-corroding flesh vessel',['초자아 잠식체']),
 'zombieknight':('Electrified zombie guardian knight',['창처럼 날아오는 역십자가','전극을 두른 좀비 수호기사']),
 'cyborghound':('Cyborg hound with steel jaws',['강철 턱의 사이보그 개','폭격기억 사이보그 사냥개','관리자 추적견']),
 'biomech':('Biomechanical nightmare with neural cables',['생체기계 악몽','신경 케이블 포식체','기계재판 연결자','EGO 구속 연결자']),
 'memoryorb':('Floating memory orb',['복종 봉인구','기억이주 연결자']),
 'sealguard':('Silver seal sentinel soldier',['성벽 침식 봉인병','붕괴선 파수병','코어 운반 집행자','의존 신호 포식자']),
 'chipwarden':('Cyborg cult chip warden',['SUPER EGO 판결인장','소환좌 칩 수호체']),
 'brainwave':('Black thread brainwave signal',['검은 실의 외부 신호']),
 'serpent':('Long serpent shadow',['긴 뱀의 그림자']),
 'trainwave':('Training pulse construct',['최초명령 훈련파동']),
 'timegate1':('Clockwork time gatekeeper',[]),'timegate2':('Hourglass time gatekeeper',[]),'timegate3':('Pendulum time gatekeeper',[]),
 'highgate':('Armored high time gatekeeper',['상위수문장']),
 'excision':('Memory excision connector',['기억절제 연결자','EGO 탈취 연결자']),
 'foxcoin':('Greedy fox demon of coins and banknotes',['칼날이 된 지폐','모든 면이 뒷면인 동전','눈보라 속 여우 악마','박제된 여우의 악마','고슴도치 가시 사탕']),
 'meadowslime':('Cute meadow slime',['중립초원 슬라임','장미이슬 슬라임']),
 'wolf':('Grey meadow wolf',['중립초원 늑대']),
 'goblin':('Forest goblin',['숲 고블린','피리 고블린']),
 'polarleg':('Mechanical leg walker under snow',['설원 아래의 기계 다리']),
 'resknight':('Resonance knight in heavy armor',['참호 공명기사','감옥 공명기사','중앙이주 공명기사','최종문 공명기사']),
 'drone':('Scout drone and observer spider bot',['전쟁기억 정찰드론','문턱 관측거미']),
 'collector':('Reactor collector machine',['가짜 자비 수집가','역전기록 수집가']),
 'phantomblade':('Phantom sword echo',['환수검 모조체','무명 검흔']),
 'silverscout':('Silverless shadow scout',['악몽 정찰체','백은 없는 그림자']),
}
# 시간수문장 NN(01~48): NN%3==1 → timegate1, ==2 → timegate3(timeless), ==0 → timegate2(collector) — 지역 표의 kind 와 같게.
KIND={'hit':'Hit','die':'Die','atk':'Atk'};USE={'hit':'피격','die':'사망','atk':'공격 시작'};COUNT={'hit':3,'die':3,'atk':3};GAIN={'hit':.55,'die':.8,'atk':.6};MOB_GAIN={'hit':.42,'die':.45,'atk':.45};BIG=();SKIP=set()  # 일반 몹은 여럿이 한꺼번에 나므로 조금 작게(MOB_GAIN)
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
    _,f,r,hp,lp,fr=c;x=shape(cache[f],LEN[slot],r,hp,lp,fr);tmp=OUT/f'_chk{os.getpid()}.wav';o=OUT/f'_chk{os.getpid()}.ogg'
    subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-c:a','pcm_f32le',str(tmp)],input=x.astype(np.float32).tobytes(),check=True)
    subprocess.run(['ffmpeg','-v','quiet','-y','-i',str(tmp),'-c:a','libvorbis','-q:a','3','-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact',str(o)],check=True)
    m=measure(dec(o));os.remove(tmp);os.remove(o);return good(m,slot) and m['duration']<=LEN[slot]+.01
rows={};R=[]
PROMPTS=json.loads((SRC.parent/'prompts.json').read_text()) if (SRC.parent/'prompts.json').exists() else {}
def emit(name,f,slot,rate,kind,use,prompt,hp,lp,fr):
    x=shape(dec(f),LEN[slot],rate,hp,lp,fr);tmp=OUT/(name+'.wav');o=OUT/(name+'.ogg')
    subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-c:a','pcm_f32le',str(tmp)],input=x.astype(np.float32).tobytes(),check=True)
    subprocess.run(['ffmpeg','-v','quiet','-y','-i',str(tmp),'-c:a','libvorbis','-q:a','3','-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact',str(o)],check=True);os.remove(tmp)
    b=o.read_bytes();rows[name]={'path':'assets/r955/sfx/'+name+'.ogg','kind':kind,'gain':(GAIN if kind.split('_',1)[1] in BIG else MOB_GAIN)[slot],'use':use,'source':f.name,'prompt':prompt,'sourceSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'sourceBytes':f.stat().st_size,
        'trim':'첫 소리 3ms 앞부터 %.2fs'%LEN[slot],'rate':rate,'highpassHz':hp,'lowpassHz':lp,'onsetFrac':fr,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),**measure(dec(o))}
def job(slug):
    out=[];desc=F[slug][0]
    for slot in ('hit','die','atk'):
        p=f'{slug}-{slot}';sel=pick(p,slot,COUNT[slot]);r_=(p,len(sel),sorted({c[1].name for c in sel}))
        loc={}
        global rows
        rows={}
        for i,(sc,f,r,hp,lp,fr) in enumerate(sel,1):
            emit(f'{slot}-{slug}-{i}',f,slot,r,f'r955{KIND[slot]}_{slug}',f'{desc} {USE[slot]}'+('' if r==1.0 else f', 재생 속도 {r}'),PROMPTS.get(p,''),hp,lp,fr)
        out.append((r_,rows))
    return out
if __name__=='__main__':
    import multiprocessing as mp
    with mp.Pool(int(os.environ.get('JOBS','4'))) as pool:
        res=pool.map(job,list(F))
    allrows={}
    for out in res:
        for r_,rw in out:R.append(r_);allrows.update(rw)
    rows=dict(sorted(allrows.items()))
    (OUT/'index.json').write_text(json.dumps({'revision':'R955','generator':'scripts/build-sfx-r955.py','origin':'ElevenLabs text-to-sound v2(eleven_text_to_sound_v2)로 2026-11-12 생성(플로우 C3VxOKt4sCGwh16plQ4x, 일반 몹 49 계열 × 피격·사망·공격 147건 × 변주 2 = 원본 294개), 자르기·재생 속도·필터·RMS 를 손봄',
     'families':{k:{'desc':v[0],'names':v[1]} for k,v in F.items()},'params':{'mobGain':MOB_GAIN,'highpassHzOptions':HPS,'lowpassHzOptions':LPS,'targetRmsDb':TARGET_RMS,'softCeil':CEIL,'length':LEN},'files':rows},ensure_ascii=False,indent=1))
    for t in R:print('선택',t)
    short=[t for t in R if t[1]<COUNT[t[0].rsplit('-',1)[1]]]
    print('모자람',short)
    print('total',sum(v['bytes'] for v in rows.values()),len(rows))
