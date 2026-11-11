#!/usr/bin/env python3
"""R546 — ElevenLabs(text-to-sound v2)로 만든 영웅별 공격·고유기, 블링크·회피·패링·EGO·각성·클리어·강화·쓰러짐·창 열기·적 탄환·이동 소리를 다듬는다.
사용: python3 scripts/build-sfx-r546.py <원본 폴더>   (기본 /mnt/project-files/elevenlabs-r546/raw, ffmpeg·numpy 필요)
사용자 2026-11-10 14:10Z "효과음 필요할만한건 모두 다 만들어서 적용하고 품질좋게", 14:14Z "스피커터지는 소리 … 듣기좋은거 위주로".
전에는 영웅 공격·고유기가 모두 엔진의 '악마 기운'·타격 소리(150Hz 아래가 65~97%인 둔한 쿵)를 돌려썼다. 새 소리는 150Hz 아래를 걷어 내고(고역통과 2단),
게임 조절기의 역할별 저역통과(공격 3.4kHz·고유기 3.8kHz·패링 4.4kHz 등) 아래로 들어오게 높은 소리는 재생 속도를 늦춘다. CI 는 index.json 해시만 대조한다."""
import numpy as np,subprocess,os,sys,json,hashlib,pathlib
SR=44100;ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'r96/runtime-text/assets/r546/sfx';OUT.mkdir(parents=True,exist_ok=True)
SRC=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/elevenlabs-r546/raw')
P={'atk_hwando':'Katana sword slash through the air, clean quick swish with a light metallic ring, crisp and soft, no bass rumble, very short',
 'atk_lauren':'Small crystal magic pulse being cast, soft glassy shimmer with a gentle airy whoosh, clean, very short',
 'atk_slayer':'Heavy greatsword swung through the air, weighty clean whoosh, no impact, short',
 'atk_gunner':'Single silenced pistol shot, soft muted pop with a small mechanical click, clean, no boom, very short',
 'atk_neon':'Quick small electric spark zap, light clean crackle, soft, very short',
 'atk_michaela':'Gentle holy light spell cast, soft bright chime with an airy shimmer, warm, very short',
 'atk_seoha':'Clockwork time magic cast, one soft clock tick followed by a quick airy whoosh, clean, very short',
 'sp_hwando':'Sword drawn fast from its sheath and a powerful slash, sharp shing then a clean air-cutting whoosh, short',
 'sp_lauren':'Gravity magic implosion, airy whoosh pulling inward then a soft crystalline burst, clean, short',
 'sp_slayer':'Berserker heavy weapon overhead slam, big whoosh and a solid impact with a short chain rattle, clean, short',
 'sp_gunner':'Sci-fi energy rifle charged shot, short rising hum then a clean bright laser blast, no distortion, short',
 'sp_hunter':'Flaming arrow released from a bow, bowstring snap and a fiery whoosh flying away, clean, short',
 'sp_neon':'Magic lightning bolt strike, bright electric crack with a short sizzling tail, clean, short',
 'sp_michaela':'Holy pillar of light descending, warm shimmering swell with a soft bell and gentle choir-like air, short',
 'sp_seoha':'Time stop magic, clock ticks slowing down into a soft glassy freeze chime, clean, short',
 'blink':'Short magical teleport blink, quick airy whoosh with a soft sparkle at the end, clean, very short',
 'parry':'Perfect sword parry, bright clean metal ting with a short pleasant ring, very short',
 'ego':'Magical resonance power-up, warm rising shimmer swell, pleasant and clean, short',
 'awake':'Dream awakening transformation, deep warm swell rising into a bright shimmering release, clean, about two seconds',
 'clear':'Area cleared, soft warm bell chord resolving gently, pleasant, short',
 'upgrade':'Skill upgrade selected, gentle rising three-note chime, soft and pleasant, short',
 'pdeath':'Hero falls defeated, soft low descending tone with a fading breath of wind, gentle, short',
 'uiopen':'Parchment menu opening, light paper slide with a tiny wooden tap, soft, very short',
 'eshot':'Dark magic projectile cast, soft airy whoosh with a faint whisper, clean, very short',
 'portal':'Magic portal travel, soft swirling whoosh rising and fading with a light sparkle, clean, short'}
#  이름: (원본, 시작, 길이, 재생 속도, 고역통과, 저역통과, 페이드인, 페이드아웃, 피크dB, 게임 소리 종류, 게임 배율, 쓰임)
A,S=-9,-9
ROWS={
 'atk-hwando-1':('atk_hwando_2',0,.20,1.0,180,3200,.008,.12,A,'r546Atk_hwando',.7,'환도 기본 공격 — 칼 휘두름'),
 'atk-hwando-2':('atk_hwando_1',.49,.20,.85,180,2200,.010,.12,A,'r546Atk_hwando',.7,'환도 기본 공격 변주'),
 'atk-lauren-1':('atk_lauren_1',.36,.08,.20,180,3200,.012,.22,A,'r546Atk_lauren',.65,'라우렌 기본 공격 — 결정 파동, 재생 속도 0.20'),
 'atk-lauren-2':('atk_lauren_2',.44,.08,.22,180,3200,.012,.22,A,'r546Atk_lauren',.65,'라우렌 기본 공격 변주, 재생 속도 0.22'),
 'atk-slayer-1':('atk_slayer_1',.33,.34,1.0,180,3000,.02,.2,A,'r546Atk_slayer',.7,'슬레이어 기본 공격 — 대검 휘두름'),
 'atk-slayer-2':('atk_slayer_2',.04,.32,1.0,180,3000,.015,.18,A,'r546Atk_slayer',.7,'슬레이어 기본 공격 변주'),
 'atk-gunner-1':('atk_gunner_1',0,.09,.50,180,3200,.006,.12,A,'r546Atk_gunner',.7,'기억사수 기본 공격 — 소음 권총, 재생 속도 0.50'),
 'atk-gunner-2':('atk_gunner_1',0,.09,.42,180,3000,.006,.14,A,'r546Atk_gunner',.7,'기억사수 기본 공격 변주, 재생 속도 0.42'),
 'atk-neon-1':('atk_neon_1',0,.06,.22,180,2600,.008,.16,A,'r546Atk_neon',.65,'네온 기본 공격 — 전기 튐, 재생 속도 0.22'),
 'atk-neon-2':('atk_neon_2',.12,.07,.19,180,2200,.012,.2,A,'r546Atk_neon',.65,'네온 기본 공격 변주, 재생 속도 0.19'),
 'atk-michaela-1':('atk_michaela_1',0,.30,1.0,180,3200,.012,.18,A,'r546Atk_michaela',.6,'미카엘라 기본 공격 — 빛 종소리'),
 'atk-michaela-2':('atk_michaela_2',.3,.16,.50,180,3200,.015,.2,A,'r546Atk_michaela',.6,'미카엘라 기본 공격 변주, 재생 속도 0.50'),
 'atk-seoha-1':('atk_seoha_2',1.80,.20,1.0,180,3200,.012,.12,A,'r546Atk_seoha',.7,'윤서하 기본 공격 — 태엽 똑딱과 바람'),
 'atk-seoha-2':('atk_seoha_1',2.70,.20,.70,180,3200,.012,.16,A,'r546Atk_seoha',.7,'윤서하 기본 공격 변주, 재생 속도 0.70'),
 'sp-hwando-1':('sp_hwando_1',0,.36,.42,180,3600,.01,.35,S,'r546Sp_hwando',.7,'환도 고유기 — 발도, 재생 속도 0.42'),
 'sp-hwando-2':('sp_hwando_2',0,.35,.42,180,3600,.01,.35,S,'r546Sp_hwando',.7,'환도 고유기 변주, 재생 속도 0.42'),
 'sp-lauren-1':('sp_lauren_2',0,.90,1.0,180,3600,.03,.4,S,'r546Sp_lauren',.7,'라우렌 고유기 — 중력 붕괴'),
 'sp-lauren-2':('sp_lauren_1',1.2,.90,1.0,180,3600,.03,.4,S,'r546Sp_lauren',.7,'라우렌 고유기 변주'),
 'sp-slayer-1':('sp_slayer_2',0,.38,1.0,180,3600,.01,.2,S,'r546Sp_slayer',.7,'슬레이어 고유기 — 내려찍기와 사슬'),
 'sp-slayer-2':('sp_slayer_1',0,.48,1.0,180,3600,.01,.25,S,'r546Sp_slayer',.7,'슬레이어 고유기 변주'),
 'sp-gunner-1':('sp_gunner_1',.78,.45,1.0,180,3600,.02,.3,S,'r546Sp_gunner',.7,'기억사수 고유기 — 충전 사격'),
 'sp-gunner-2':('sp_gunner_2',2.0,.60,1.0,180,3600,.02,.35,S,'r546Sp_gunner',.7,'기억사수 고유기 변주'),
 'sp-hunter-1':('sp_hunter_1',0,.34,1.0,180,2600,.008,.2,S,'r546Sp_hunter',.7,'헌터 고유기 — 불화살'),
 'sp-hunter-2':('sp_hunter_2',0,.36,1.0,180,3600,.008,.2,S,'r546Sp_hunter',.7,'헌터 고유기 변주'),
 'sp-neon-1':('sp_neon_1',0,.33,.45,180,3600,.01,.35,S,'r546Sp_neon',.7,'네온 고유기 — 번개, 재생 속도 0.45'),
 'sp-neon-2':('sp_neon_2',0,.42,.45,180,3600,.01,.4,S,'r546Sp_neon',.7,'네온 고유기 변주, 재생 속도 0.45'),
 'sp-michaela-1':('sp_michaela_1',.2,1.1,1.0,180,3600,.04,.45,S,'r546Sp_michaela',.65,'미카엘라 고유기 — 빛기둥'),
 'sp-michaela-2':('sp_michaela_2',.1,.5,.45,180,3600,.04,.45,S,'r546Sp_michaela',.65,'미카엘라 고유기 변주, 재생 속도 0.45'),
 'sp-seoha-1':('sp_seoha_1',0,.52,.85,180,3600,.012,.3,S,'r546Sp_seoha',.7,'윤서하 고유기 — 시간 정지, 재생 속도 0.85'),
 'sp-seoha-2':('sp_seoha_2',.6,1.0,.90,180,3600,.02,.4,S,'r546Sp_seoha',.7,'윤서하 고유기 변주, 재생 속도 0.90'),
 'blink-1':('blink_1',0,.42,1.0,180,3200,.012,.2,-10,'r546Blink',.7,'블링크'),
 'blink-2':('blink_2',0,.48,1.0,180,3200,.012,.24,-10,'r546Blink',.7,'블링크 변주'),
 'dodge-1':('blink_2',.08,.24,1.25,180,3200,.012,.14,-11,'r546Dodge',.7,'회피 — 블링크 생성본의 다른 구간(회피 생성본 2개는 150Hz 아래뿐이라 쓰지 않음), 재생 속도 1.25'),
 'parry-1':('parry_1',0,.22,.36,180,4200,.004,.4,-10,'r546Parry',.7,'패링 — 맑은 쇳소리, 재생 속도 0.36'),
 'parry-2':('parry_2',0,.20,.30,180,4200,.004,.4,-10,'r546Parry',.7,'패링 변주, 재생 속도 0.30'),
 'ego-1':('ego_2',0,.62,.60,180,3400,.03,.45,-10,'r546Ego',.7,'EGO 발동, 재생 속도 0.60'),
 'awake-1':('awake_1',0,.68,.70,220,3800,.04,.4,-9,'r546Awake',.75,'사몽 각성 — 따뜻한 상승음, 재생 속도 0.70'),
 'clear-1':('clear_1',0,.95,1.0,180,3400,.01,.5,-10,'r546Clear',.75,'지역 클리어 — 종 화음'),
 'clear-2':('clear_2',0,1.1,1.0,180,3400,.01,.5,-10,'r546Clear',.75,'지역 클리어 변주'),
 'upgrade-1':('upgrade_2',0,1.0,1.0,180,3400,.01,.45,-10,'r546Upgrade',.7,'강화 선택 — 세 음 차임'),
 'fall-1':('pdeath_1',0,.34,.80,150,3000,.02,.25,-10,'r546Fall',.7,'영웅 쓰러짐, 재생 속도 0.80'),
 'open-1':('uiopen_2',.1,.12,.20,180,3200,.02,.4,-14,'r546Open',.4,'창 열기 — 종이 넘김, 재생 속도 0.20'),
 'eshot-1':('eshot_1',0,.25,1.0,180,3200,.01,.14,-11,'r546EnemyShot',.6,'적 탄환 발사'),
 'eshot-2':('eshot_2',0,.36,1.0,180,3200,.01,.2,-11,'r546EnemyShot',.6,'적 탄환 발사 변주'),
 'portal-1':('portal_2',.23,.74,1.0,180,3400,.03,.35,-10,'r546Portal',.7,'지역 이동')}
def dec(p):return np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',str(p),'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout,dtype=np.float32).astype(float)
def measure(x,cut):
    S=np.abs(np.fft.rfft(x))**2;f=np.fft.rfftfreq(len(x),1/SR);w=441;e=np.sqrt((x[:len(x)//w*w].reshape(-1,w)**2).mean(1));h=np.sqrt((x[:len(x)//220*220].reshape(-1,220)**2).mean(1))
    return {'duration':round(len(x)/SR,3),'peakDb':round(float(20*np.log10(np.abs(x).max())),2),'rmsDb':round(float(20*np.log10(np.sqrt((x**2).mean()))),2),
            'riseMs':round(float(np.argmax(h>=.7*h.max())*220/SR*1000),1),'lowShare150':round(float(S[f<150].sum()/S.sum()),4),'lowShare200':round(float(S[f<200].sum()/S.sum()),4),
            'harshShare2to5k':round(float(S[(f>=2000)&(f<5000)].sum()/S.sum()),4),'hfShare5k':round(float(S[f>5000].sum()/S.sum()),5),'midShare':round(float(S[(f>=200)&(f<=cut)].sum()/S.sum()),4),
            'centroidHz':int((S*f).sum()/S.sum()),'tailDb':round(float(20*np.log10(e[-2:].mean()/e.max()+1e-9)),1)}
rows={}
for name,(src,ss,dur,rate,hp,lp,fi,fo,peak,kind,gain,use) in ROWS.items():
    s=SRC/(src+'.mp3');tmp=OUT/(name+'.wav');o=OUT/(name+'.ogg');out=dur/rate;fo=min(fo,out*.7)
    af=f'asetrate={int(SR*rate)},aresample={SR},highpass=f={hp},highpass=f={hp},lowpass=f={lp},lowpass=f={lp},lowpass=f={lp}'
    subprocess.run(['ffmpeg','-v','quiet','-y','-ss',str(ss),'-t',str(dur),'-i',str(s),'-ar',str(SR),'-ac','1','-af',af,str(tmp)],check=True)
    x=dec(tmp);ni=int(fi*SR);no=min(int(fo*SR),len(x)-ni);x[:ni]*=np.sin(np.linspace(0,np.pi/2,ni))**2;x[-no:]*=np.cos(np.linspace(0,np.pi/2,no))**2;nt=min(int(.04*SR),len(x)//3);x[-nt:]*=np.cos(np.linspace(0,np.pi/2,nt))**2;x=np.concatenate([x,np.zeros(int(.012*SR))]);x*=10**(peak/20)/np.abs(x).max()
    subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-c:a','pcm_f32le',str(tmp)],input=x.astype(np.float32).tobytes(),check=True)
    subprocess.run(['ffmpeg','-v','quiet','-y','-i',str(tmp),'-c:a','libvorbis','-q:a','3','-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact',str(o)],check=True);os.remove(tmp)
    b=o.read_bytes();rows[name]={'path':'assets/r546/sfx/'+name+'.ogg','kind':kind,'gain':gain,'use':use,'source':src+'.mp3','prompt':P[src.rsplit('_',1)[0]],'sourceSha256':hashlib.sha256(s.read_bytes()).hexdigest(),'sourceBytes':s.stat().st_size,
        'trim':[ss,dur],'rate':rate,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),**measure(dec(o),lp)}
(OUT/'index.json').write_text(json.dumps({'revision':'R546','generator':'scripts/build-sfx-r546.py','origin':'ElevenLabs text-to-sound v2(eleven_text_to_sound_v2)로 2026-11-10 생성, 자르기·재생 속도·필터·음량을 손봄','files':rows},ensure_ascii=False,indent=1)+'\n')
for k,v in rows.items():print(f"{k:15s}",v['bytes'],*[f"{a}={v[a]}" for a in('duration','peakDb','rmsDb','riseMs','lowShare150','harshShare2to5k','hfShare5k','centroidHz','tailDb')])
print('total',sum(v['bytes'] for v in rows.values()),len(rows))
