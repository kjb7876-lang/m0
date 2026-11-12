/* R955 일반 몹 계열별 고유 피격·사망·공격 효과음 (사용자 2026-11-12 "모든 몹+보스들마다 고유 피격·사망·공격 효과음을 일레븐랩스로 생성해서 적용 — 영웅, 보스, 불면귀몹, 일반몹 순서").
 * 일반 몹은 이름이 백수십 개라 그림·성격이 같은 몹을 49 계열로 묶었다(거미·해골 수호병·타락천사·백의 환각·시간수문장 등, 코디네이터 동의).
 * 소리는 ElevenLabs 로 새로 만들어 scripts/build-sfx-r955.py 로 다듬었다(계열마다 피격·사망·공격 3개씩). 엔진 적중음·처치음 위에 한 겹 얹는다.
 *  - 보스(R788)·중간보스(R789)·불면귀 구역 몹(R954)·영웅·소환수는 건드리지 않는다(e.boss·e.midboss·e.hero 는 빼고, 이름이 계열 표에 있어야만 소리를 낸다).
 *  - 이름은 앞뒤 말('중간보스 · '·' 3'·'우두머리'·'증원'·'추격대')을 떼고 맞춘다. '시간수문장 NN' 은 지역 표의 kind 와 같게 NN%3 로 세 계열(태엽·모래시계·추) 중 하나, '상위수문장 NN' 은 갑옷 수문장.
 *  - 피격: 계열마다 0.45초에 한 번, 전체 0.12초에 한 번. 사망: 계열마다 0.3초에 한 번(한꺼번에 쓰러져도 겹겹이 쌓이지 않게).
 *  - 공격 시작: 근접 공격 시작(e.attack.id 가 바뀐 순간)·서사 패턴 공격(storyAttackStart5 가 바뀐 순간)·bossVolley. 계열마다 0.9초, 전체 0.25초에 한 번, 전투 중·창 없을 때만.
 * 판정·체력·패턴·그림은 손대지 않는다. 끄기: localStorage storyworld.r955.sfx = '0'. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SFX_R955__)return;
 let on=true;try{on=localStorage.getItem('storyworld.r955.sfx')!=='0';}catch(_){}
 const FAMILIES={"spider":["망각의 거미","보랏빛 알집지기","진흙등 거미","기억 운반거미"],"boneguard":["거미줄에 묶인 수호병","쓰러진 수호병","이름 잃은 전우","마지막 길의 호위병"],"goatdemon":["늪의 염소머리 악마"],"horndemon":["소환진 순례악마","지옥문 파수악마","갈망의 도시짐승"],"trashheap":["등에 붙은 쓰레기더미","곰팡이와 오물 봉투"],"stomach":["살아 있는 거대한 위장","끓어오르는 검은 소화액","버려진 최고급 식재료"],"firebeast":["개와 늑대의 시간","불길 속의 늑대"],"firedragon":["불길 속의 용"],"synslime":["과열 시냅스 점액체","세뇌 신호 점액체","ID 배양 점액체","ID 잔류 점액체"],"ghoul":["늪에서 되살아난 전우","피냄새 추적자","피로 꿰맨 전령"],"cultmage":["수렁 주문사","검은기둥 주문사","검은기둥 화염술사"],"fallenangel":["보라검 추격천사","되살아난 방패동료","보라검 부활자","소환진 타락천사","소독등 타락천사","거짓천국 근위천사"],"gargoyle":["검은기둥 가고일 수호자"],"lust":["붉은 하이힐 칼날","공중을 가르는 립스틱 탄환","얼굴 없는 남자의 박수"],"orderly":["백의 구속자","안정화 집행체","주사실 감시환각","오만의 흰 가면","치료거부의 가면"],"screamecho":["복도 비명잔영","부정의 잔영"],"glass":["이름 없던 공포","찢어진 사진의 망령","칼날과 유리 조각"],"bluewraith":["첫 기억 청람잔영","입양기억 청람잔영","이동문 청람잔영"],"voidwraith":["기억 공백 망령","학대기록 공허체","이동문 공허잔영"],"paperecho":["공실 표기 잔재","제출되지 못한 문장","은폐기록 연결체"],"vialcore":["갈망의 약병핵","중독의 폐허핵"],"sealresidual":["미뤄 둔 시간의 형상","낡은 장난감 요요","육망성의 흑마술 실험체","인간의 뇌를 닮은 투명 연산 장치","일흔두 번째 인장 잔류체"],"cultist":["흑장미 귀막은 신도","흑장미 눈가린 신도"],"crystal":["본능 추출 결정","죄책감 압축결정","SUPER EGO 절개결정","아마겟돈 계산결정","합일 주파수 결정"],"egovessel":["초자아 잠식체"],"zombieknight":["창처럼 날아오는 역십자가","전극을 두른 좀비 수호기사"],"cyborghound":["강철 턱의 사이보그 개","폭격기억 사이보그 사냥개","관리자 추적견"],"biomech":["생체기계 악몽","신경 케이블 포식체","기계재판 연결자","EGO 구속 연결자"],"memoryorb":["복종 봉인구","기억이주 연결자"],"sealguard":["성벽 침식 봉인병","붕괴선 파수병","코어 운반 집행자","의존 신호 포식자"],"chipwarden":["SUPER EGO 판결인장","소환좌 칩 수호체"],"brainwave":["검은 실의 외부 신호"],"serpent":["긴 뱀의 그림자"],"trainwave":["최초명령 훈련파동"],"highgate":["상위수문장"],"excision":["기억절제 연결자","EGO 탈취 연결자"],"foxcoin":["칼날이 된 지폐","모든 면이 뒷면인 동전","눈보라 속 여우 악마","박제된 여우의 악마","고슴도치 가시 사탕"],"meadowslime":["중립초원 슬라임","장미이슬 슬라임"],"wolf":["중립초원 늑대"],"goblin":["숲 고블린","피리 고블린"],"polarleg":["설원 아래의 기계 다리"],"resknight":["참호 공명기사","감옥 공명기사","중앙이주 공명기사","최종문 공명기사"],"drone":["전쟁기억 정찰드론","문턱 관측거미"],"collector":["가짜 자비 수집가","역전기록 수집가"],"phantomblade":["환수검 모조체","무명 검흔"],"silverscout":["악몽 정찰체","백은 없는 그림자"]};
 const TIME_GATES=['timegate2','timegate1','timegate3'];// NN%3 → 0:collector(모래시계) 1:connector(태엽) 2:timeless(추)
 const ALL=[...new Set([...Object.keys(FAMILIES),...TIME_GATES,'highgate'])];
 // 실제 게임 이름(지역 표에 없거나 R385·R410 등이 런타임에 바꾼 이름, 헤드리스 전수 r955-name-sweep 로 모음)을 같은 성격의 계열에 잇는다.
 const REAL={'악마화 나무의 침식 근위':'boneguard','뿌리에 묶인 근위의 기억':'boneguard','뿌리 추적자':'ghoul','늪 뿌리 추적자':'ghoul','늪에서 되살아난 혼령체':'ghoul',
  '재 나방':'spider','되살아난 수호기사':'zombieknight','검은 소환 기둥':'gargoyle','격리실 감염 의료인':'orderly','유리 망령':'glass','암시장의 수상한 자':'cultist','약을 갈망하는 자':'cultist',
  '살아 움직이는 쓰레기들':'trashheap','질투로 얼룩진 망령':'glass','추녀의 한탄':'screamecho','분노의 사냥개':'firebeast','전극기계수호기사':'zombieknight','흑마법사의 저주창':'zombieknight',
  '걸어다니는 소형 로봇':'drone','설원 잠복 보행기':'polarleg','시간핵의 명령 파동':'trainwave','시간핵의 명령 잔류':'trainwave','전쟁기계사냥개':'cyborghound','태엽 수집자':'timegate1',
  '빗속 횡단보도의 기억 잔향':'screamecho','끊어진 통화의 인과 잔향':'screamecho','옥상으로 돌아온 기억 잔향':'screamecho','반복된 추락의 인과 잔향':'screamecho',
  '지워진 CCTV 기록의 잔향':'paperecho','새빛호텔 화재 기록의 잔향':'paperecho','망각거미':'spider','공명술사':'resknight','제8단계 자비 교정관':'collector'};
 const BY_NAME=new Map();for(const [f,ns] of Object.entries(FAMILIES))for(const n of ns)BY_NAME.set(n,f);for(const [n,f] of Object.entries(REAL))BY_NAME.set(n,f);
 const DIR='assets/r955/sfx/',SETS=[['Hit','hit',3],['Die','die',3],['Atk','atk',3]],GAIN={hit:.42,die:.45,atk:.45};
 const FEW={Hit_bluewraith:2};// 기준(저음·피크·올라오는 시간)을 지키는 변주가 2개뿐인 곳
 const GAP={hit:450,die:300,atk:900},ALL_GAP={hit:120,die:0,atk:250};
 const slugCache=new Map();
 function norm(n){let k=n.trim().replace(/^중간보스\s*·\s*/,'');for(let i=0;i<3;i++)k=k.replace(/\s*(우두머리|후속 증원|증원|추격대)\s*$/,'').replace(/\s+\d+$/,'');return k;}
 function slugOf(name){if(typeof name!=='string')return null;const raw=name.trim();if(slugCache.has(raw))return slugCache.get(raw);let s=null;
  const g=/^(시간|상위)수문장(?:\s*(\d+))?(?!\S)/.exec(raw.replace(/^중간보스\s*·\s*/,''));
  if(g)s=g[1]==='상위'?'highgate':TIME_GATES[(g[2]==null?1:+g[2])%3];
  else{const k=norm(raw);s=BY_NAME.get(k)||BY_NAME.get(raw)||(k.startsWith('기계화 ')?BY_NAME.get(k.slice(4))||null:null);}// '기계화 ' 접두 변종은 원래 이름의 계열
  slugCache.set(raw,s);return s;}
 const stats={hit:0,hitSkipped:0,die:0,dieSkipped:0,atk:0,atkSkipped:0,warmed:0,errors:0};const last={},seenAtk=new WeakMap();let warmKey='';
 const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
 const quiet=()=>typeof started!=='undefined'&&!started||typeof modal!=='undefined'&&!!modal||typeof loading!=='undefined'&&!!loading;
 const slugFor=e=>!e||e.hero||e.boss||e.midboss||e.summon||e.ally?null:slugOf(e.name);
 function gate(slot,s){const t=now(),k=slot+':'+s,a='*:'+slot;if(t-(last[k]??-1e9)<GAP[slot]||ALL_GAP[slot]&&t-(last[a]??-1e9)<ALL_GAP[slot])return false;last[k]=t;last[a]=t;return true;}
 function apply(){if(!on||typeof soundProfiles==='undefined'||!soundProfiles)return;
  for(const s of ALL)for(const [K,f,n] of SETS)soundProfiles['r955'+K+'_'+s]=Array.from({length:FEW[K+'_'+s]||n},(_,i)=>({key:'r955-'+f+'-'+s+'-'+(i+1),path:DIR+f+'-'+s+'-'+(i+1)+'.ogg',gain:GAIN[f],r541:true}));}
 function play(kind,allow){try{if(typeof sound==='function'&&soundProfiles?.[kind]?.length){allow?sound(kind,true):sound(kind);return true;}}catch(_){stats.errors++;}return false;}
 function attack(e){try{const s=slugFor(e);if(!s||!(e.hp>0)||quiet()||typeof room!=='undefined'&&room&&room.engaged===false)return;
  if(!gate('atk',s)){stats.atkSkipped++;return;}if(play('r955Atk_'+s))stats.atk++;}catch(_){stats.errors++;}}
 function warm(list){try{if(typeof audioBuffer!=='function'||typeof audioUnlocked!=='undefined'&&!audioUnlocked)return;const ss=[...new Set(list.map(slugFor).filter(Boolean))].sort(),key=ss.join();if(!key||key===warmKey)return;warmKey=key;
  for(const s of ss)for(const [K] of SETS)for(const r of soundProfiles?.['r955'+K+'_'+s]||[])try{Promise.resolve(audioBuffer(r.path)).catch(()=>{});}catch(_){}stats.warmed++;}catch(_){stats.errors++;}}
 function tick(){try{const list=typeof room!=='undefined'&&room&&Array.isArray(room.enemies)?room.enemies:null;if(!list)return;warm(list);
  for(const e of list){if(!slugFor(e))continue;const id=e.attack?.id,ps=typeof e.storyAttackStart5==='number'&&e.storyAttackStart5>0?e.storyAttackStart5:null,o=seenAtk.get(e);seenAtk.set(e,{id,ps});
   if(o&&((id!=null&&o.id!==id)||(ps!=null&&o.ps!==ps)))attack(e);}
 }catch(_){stats.errors++;}}
 if(on){
  try{apply();}catch(_){stats.errors++;}
  if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const r=base.apply(this,arguments);try{apply();}catch(_){stats.errors++;}return r;};}
  if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e){const r=base.apply(this,arguments);
   try{const s=r?slugFor(e):null;if(s&&e.hp>0){if(gate('hit',s)){if(play('r955Hit_'+s))stats.hit++;}else stats.hitSkipped++;}}catch(_){stats.errors++;}return r;};}
  if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e){const fresh=!!e&&!e.deadRecorded,r=base.apply(this,arguments);
   try{const s=fresh&&e.deadRecorded?slugFor(e):null;if(s){if(gate('die',s)){if(play('r955Die_'+s,true))stats.die++;}else stats.dieSkipped++;}}catch(_){stats.errors++;}return r;};}
  if(typeof bossVolley==='function'){const base=bossVolley;bossVolley=function(e){const r=base.apply(this,arguments);attack(e);return r;};}
  try{setInterval(tick,160);}catch(_){}
 }
 window.__STORYWORLD_SFX_R955__=Object.freeze({revision:'R955',enabled:()=>on,apply,slugOf,slugFor,families:FAMILIES,all:ALL,tick,inspect:()=>({on,stats:{...stats},gaps:GAP,allGaps:ALL_GAP,
  profiles:typeof soundProfiles==='undefined'?null:Object.fromEntries(Object.keys(soundProfiles).filter(k=>/^r955/.test(k)).map(k=>[k,soundProfiles[k].length])),generated:'ElevenLabs text-to-sound v2 (2026-11-12), scripts/build-sfx-r955.py'})});
})();
