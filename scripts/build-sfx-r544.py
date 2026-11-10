#!/usr/bin/env python3
"""R544 — ElevenLabs(text-to-sound v2)로 만든 효과음을 자르고 다듬어 적 테마별 피격·죽음, 영웅별 피격, 버튼 소리로 만든다.
사용: python3 scripts/build-sfx-r544.py <원본 폴더>   (기본 /mnt/project-files/elevenlabs-r544/raw, ffmpeg·numpy 필요)
게임의 SFX 조절기가 역할별로 높은 소리를 깎으므로(피격 3.0kHz·아군 피격 2.6kHz·그 밖 3.6~3.8kHz) 높은 소리는 재생 속도를 늦춰 음역을 내린다. CI 는 index.json 해시만 대조한다."""
import numpy as np,subprocess,os,sys,json,hashlib,pathlib
SR=44100;ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'r96/runtime-text/assets/r544/sfx';OUT.mkdir(parents=True,exist_ok=True)
SRC=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/elevenlabs-r544/raw')
P={'hit':'Blade hitting flesh, single dull wet thud, muffled, very short','death':'Dark creature dissolving into ash, soft airy hiss with a low muffled thump, short, close',
 'mach_hit':'Metal robot panel struck, short clank with small spark crackle','mach_death':'Small robot breaking down, servo whine dropping in pitch, metal parts collapsing, short',
 'beast_hit':'Monster creature short pained snarl, quick yelp','beast_death':'Monster creature dying whine fading, body falling to the ground, short',
 'slime_hit':'Wet slime squelch impact, short gooey splat','slime_death':'Slime blob bursting, wet splatter with a few bubbles, short',
 'glass_hit':'Glass crystal cracking, short crack with a small tinkle','glass_death':'Glass crystal shattering into small shards falling on stone, short',
 'spirit_hit':'Ghostly breathy hiss cut short, airy whoosh','spirit_death':'Ghost fading away, airy exhale whoosh with soft shimmer, short',
 'hero_hwando':'Sword blade parry clang with cloth rustle, short metallic ring','hero_seoha':'Clock mechanism jolted, sharp tick and spring twang, short',
 'hero_neon':'Short electric zap crackle with a soft body thud','hero_michaela':'Single heavy heartbeat thump with fabric rustle, short',
 'hero_lauren':'Crystal chime struck and cracked, short ping with soft thud','hero_hunter':'Leather armor hit, dull thump with bowstring creak, short',
 'hero_slayer':'Heavy plate armor struck, deep metal clank, short','hero_gunner':'Gun metal casing rattled by a hit, mechanical clack with thud, short',
 'ui_click':'Soft wooden button click, single short tick'}
#  이름: (원본, 시작, 길이, 재생 속도, 고역통과, 저역통과, 페이드인, 페이드아웃, 피크dB, 게임 소리 종류, 게임 배율, 쓰임)
ROWS={
 'hit-body':('hit_1',0,.24,1.0,110,3000,.004,.10,-10,'r544Hit_body',.8,'사람·갑주형 적 피격'),
 'hit-machine':('hero_slayer_1',.26,.36,1.0,110,3000,.006,.16,-10,'r544Hit_machine',.8,'기계형 적 피격 — 판금 타격 생성본의 쓰지 않은 변주'),
 'hit-beast':('beast_hit_3',0,.32,1.0,120,3000,.006,.12,-11,'r544Hit_beast',.7,'짐승형 적 피격'),
 'hit-slime':('slime_hit_2',0,.34,1.0,120,3000,.004,.14,-10,'r544Hit_slime',.8,'점액·오물형 적 피격'),
 'hit-glass':('glass_hit_3',.2,.19,.42,150,3000,.004,.2,-11,'r544Hit_glass',.7,'결정·유리·물건형 적 피격 — 재생 속도 0.42 로 음역 내림'),
 'hit-spirit':('spirit_hit_2',.1,.31,.70,120,3000,.02,.22,-11,'r544Hit_spirit',.7,'망령·잔영형 적 피격 — 재생 속도 0.70'),
 'death-body':('death_1',0,.62,1.0,100,3600,.01,.25,-10,'r544Death_body',.5,'사람·갑주형 적 죽음'),
 'death-machine':('mach_death_3',0,.30,.40,100,3600,.006,.4,-10,'r544Death_machine',.5,'기계형 적 죽음 — 재생 속도 0.40'),
 'death-beast':('beast_death_3',1.45,.80,.85,110,3400,.03,.35,-11,'r544Death_beast',.45,'짐승형 적 죽음 — 8초 생성본의 가장 큰 구간'),
 'death-slime':('slime_death_2',0,.85,1.0,110,3600,.006,.3,-10,'r544Death_slime',.5,'점액·오물형 적 죽음'),
 'death-glass':('glass_death_1',.12,.34,.42,150,3600,.004,.45,-11,'r544Death_glass',.45,'결정·유리·물건형 적 죽음 — 재생 속도 0.42'),
 'death-spirit':('spirit_death_3',.1,.56,.70,120,3600,.03,.45,-11,'r544Death_spirit',.45,'망령·잔영형 적 죽음 — 재생 속도 0.70'),
 'hurt-hwando':('hero_hwando_2',0,.17,.45,150,2600,.004,.26,-11,'r544Hurt_hwando',.8,'환도 피격 — 칼날 울림, 재생 속도 0.45'),
 'hurt-seoha':('hero_seoha_1',.85,.34,.75,150,2600,.004,.14,-11,'r544Hurt_seoha',.8,'윤서하 피격 — 태엽 튕김'),
 'hurt-neon':('hero_neon_2',.18,.28,.80,120,2600,.004,.12,-11,'r544Hurt_neon',.8,'네온 피격 — 전기 튐'),
 'hurt-michaela':('hero_michaela_2',.85,.9,3.2,160,2600,.004,.2,-10,'r544Hurt_michaela',.8,'미카엘라 피격 — 심장 박동, 재생 속도 3.2 로 음역 올림'),
 'hurt-lauren':('hero_lauren_2',0,.12,.30,150,2600,.004,.3,-11,'r544Hurt_lauren',.8,'라우렌 피격 — 결정 울림, 재생 속도 0.30'),
 'hurt-hunter':('hero_hunter_2',0,.26,1.0,110,2600,.004,.1,-10,'r544Hurt_hunter',.8,'헌터 피격 — 가죽 갑옷'),
 'hurt-slayer':('hero_slayer_2',0,.34,.80,100,2600,.004,.14,-10,'r544Hurt_slayer',.8,'슬레이어 피격 — 판금 갑옷'),
 'hurt-gunner':('hero_gunner_1',.22,.14,.36,150,2600,.004,.25,-11,'r544Hurt_gunner',.8,'기억사수 피격 — 총몸 쇳소리, 재생 속도 0.36'),
 'click-1':('ui_click_2',0,.12,1.0,150,3600,.002,.07,-14,'r544Click',.35,'버튼 누름')}
def dec(p):return np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',str(p),'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout,dtype=np.float32).astype(float)
def measure(x,cut):
    S=np.abs(np.fft.rfft(x))**2;f=np.fft.rfftfreq(len(x),1/SR);w=441;e=np.sqrt((x[:len(x)//w*w].reshape(-1,w)**2).mean(1))
    return {'duration':round(len(x)/SR,3),'peakDb':round(float(20*np.log10(np.abs(x).max())),2),'rmsDb':round(float(20*np.log10(np.sqrt((x**2).mean()))),2),
            'hfShare5k':round(float(S[f>5000].sum()/S.sum()),5),'lowShare120':round(float(S[f<120].sum()/S.sum()),4),'midShare':round(float(S[(f>=200)&(f<=cut)].sum()/S.sum()),4),'tailDb':round(float(20*np.log10(e[-2:].mean()/e.max()+1e-9)),1)}
rows={}
for name,(src,ss,dur,rate,hp,lp,fi,fo,peak,kind,gain,use) in ROWS.items():
    s=SRC/(src+'.mp3');tmp=OUT/(name+'.wav');o=OUT/(name+'.ogg');out=dur/rate;fo=min(fo,out*.7)
    af=f'asetrate={int(SR*rate)},aresample={SR},highpass=f={hp},highpass=f={hp},lowpass=f={lp},lowpass=f={lp},afade=t=in:d={fi},afade=t=out:st={out-fo:.4f}:d={fo}'
    subprocess.run(['ffmpeg','-v','quiet','-y','-ss',str(ss),'-t',str(dur),'-i',str(s),'-ar',str(SR),'-ac','1','-af',af,str(tmp)],check=True)
    x=dec(tmp);g=10**(peak/20)/np.abs(x).max()
    subprocess.run(['ffmpeg','-v','quiet','-y','-i',str(tmp),'-af',f'volume={g:.5f}','-c:a','libvorbis','-q:a','3','-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact',str(o)],check=True);os.remove(tmp)
    b=o.read_bytes();rows[name]={'path':'assets/r544/sfx/'+name+'.ogg','kind':kind,'gain':gain,'use':use,'source':src+'.mp3','prompt':P[src.rsplit('_',1)[0]],'sourceSha256':hashlib.sha256(s.read_bytes()).hexdigest(),'sourceBytes':s.stat().st_size,
        'trim':[ss,dur],'rate':rate,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),**measure(dec(o),lp)}
(OUT/'index.json').write_text(json.dumps({'revision':'R544','generator':'scripts/build-sfx-r544.py','origin':'ElevenLabs text-to-sound v2(eleven_text_to_sound_v2)로 2026-11-10 생성, 자르기·재생 속도·필터·음량을 손봄','files':rows},ensure_ascii=False,indent=1)+'\n')
for k,v in rows.items():print(f"{k:15s}",{a:v[a] for a in('bytes','duration','peakDb','rmsDb','hfShare5k','lowShare120','midShare','tailDb')})
