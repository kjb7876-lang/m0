/* R541 빈 자리 효과음 (사용자 2026-11-10 "직접 녹음 말고 너가 여러 효과음 참조해서 적절하게 생성" → "소리 거슬리지 않게 개선해서 적용").
 * 기억 조각·쪽지 줍기 sound('pickup') 은 soundProfiles.pickup 이 없어 무음이었고, 몹 소멸·문 열림은 전용 소리가 없었다.
 * scripts/build-sfx-r541.py 로 합성한 부드러운 음원(느린 어택·5kHz 위 억제·낮은 피크) 5개를 게임의 sound()·SFX 조절기에
 * 프로필로만 얹는다. 자체 재생기는 만들지 않으며 기존 프로필(공격·피격·보스 등)·밸런스·저장은 건드리지 않는다.
 * R542 (사용자 2026-11-10 "검토후 개선하여 쓸만한것들 적절히 사용"): 사용자가 준 효과음에서 고른 4개(scripts/build-sfx-r542.py 로 자르고 다듬음) —
 *   헌터 평타 → 활시위(r542Bow), 회복 swHeal → 치유음(전에는 강화음 돌려쓰기), 상자 부수기 → r542Crush(crates-r108 이 부름), 보스 포효 → 변주 1개 추가.
 *   영웅 파일은 건드리지 않고 sound() 를 한 겹 감싸 헌터의 'attack' 만 바꾼다.
 * R543 (사용자 2026-11-10 "늑대고블린은 변형개선해서 적이 쓰게"): scripts/build-sfx-r543.py 로 음높이를 바꿔 만든 적 목소리 —
 *   이름에 짐승·추적견·사냥개·늑대가 든 적 / 곰(낮게) / 여우(높게)가 공격을 시작할 때 으르렁, '피리 고블린'은 고블린 목소리(가까운 적만, 계열마다 2.5초 간격).
 *   R450 날씨가 비(rain)·폭풍(storm)인 구역에서만 먼 천둥을 드물게(첫 12~30초, 그 뒤 40~90초). 몹·영웅 파일은 고치지 않고 0.16초마다 관찰만 한다.
 * R544 (사용자 2026-11-10 "적 죽음과 피격시 효과음(적종-테마를 정해서) 아군 피격시 효과음(영웅별 다르게)" + "기본적으로 있으면 좋을 효과음"): ElevenLabs 로 만든 소리를 scripts/build-sfx-r544.py 로 다듬음 —
 *   적 이름으로 테마 6개(body 사람·갑주 / machine 기계 / beast 짐승 / slime 점액·오물 / glass 결정·물건 / spirit 망령·잔영)를 정해 피격음(hitEnemy 가 부르는 enemyHit 한 번 동안만 프로필을 바꿔 끼움 — 엔진의 7번에 1번·1.15초 간격은 그대로)과 죽음음(R541 소멸음 r541Death 한 번 동안만 바꿔 끼움 — 0.6초 간격·보스 제외는 그대로)을 가른다.
 *   영웅 8명은 hurt 프로필을 같은 방식으로 바꿔 끼운다. 버튼 누름은 새 소리(레벨은 지역을 끝낼 때 오르고 그때 clear 소리가 이미 나므로 레벨 업 소리는 넣지 않음). R544 만 끄기: storyworld.r544.sfx = '0'.
 * 끄기: localStorage storyworld.r541.sfx = '0'. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SFX_R541__)return;
 let on=true;try{on=localStorage.getItem('storyworld.r541.sfx')!=='0';}catch(_){}
 const DIR='assets/r541/sfx/',ROWS={pickup:[['pickup-1',.55],['pickup-2',.55]],r541Death:[['death-1',.5],['death-2',.5]],r541Door:[['door-1',.6]]};
 const DIR2='assets/r542/sfx/',row2=(name,gain)=>({key:'r542-'+name,path:DIR2+name+'.ogg',gain,r541:true});
 const DIR3='assets/r543/sfx/',ROWS3={r543Growl:[['growl-1',.5]],r543GrowlLow:[['growl-2',.5]],r543GrowlHigh:[['growl-3',.45]],r543Goblin:[['goblin-1',.45],['goblin-2',.45]],r543Thunder:[['thunder-1',.5],['thunder-2',.5]]};
 let on4=on;try{on4=on&&localStorage.getItem('storyworld.r544.sfx')!=='0';}catch(_){}
 const DIR4='assets/r544/sfx/',THEMES=['body','machine','beast','slime','glass','spirit'],HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'],
  GAIN4={beast:.45,glass:.45,spirit:.45}, // 죽음음 배율. 피격·아군 피격은 바꾸기 전 소리(배율 1) 바로 아래인 .7~.8 — 절반으로 두면 전보다 훨씬 작게 들린다.
  row4=(name,gain)=>({key:'r544-'+name,path:DIR4+name+'.ogg',gain,r541:true}),themeCache=new Map();let hitNow=null,deathNow=null;
 // 적 테마: 이름의 낱말로 정한다(위에서부터 먼저 맞는 것). 어느 것도 아니면 body(사람·갑주형).
 const THEME_RE=[['machine',/기계|로봇|사이보그|드론|보행기|프레임|코어|연산핵|집행핵|칩|전극|검열기|방화벽|부트로더|네트워크|회로|톱니|포탑/],
  ['beast',/늑대|추적견|사냥개|짐승|여우|고블린|뱀|(?:^|\s)용(?=$|\s)|거미(?!줄)|나방|가고일|곰(?!팡)|박쥐|까마귀/],
  ['slime',/점액|슬라임|소화액|위장|곰팡이|오물|쓰레기|식재료|알집|포식체|배양/],
  ['glass',/결정|인장|봉인구|약병|동전|지폐|립스틱|하이힐(?!의)|요요|사탕|가면(?! 벗은)|유리|거울|기둥(?! ?주문사)|저주창|주사기|핵|칼날|태엽(?! 수집자)|석상|조각상/],
  ['spirit',/망령|잔영|잔향|혼령|유령|안개|그림자|환각|환영|공허|악몽|공포|한탄|비명|파동|신호|잔류|잔재|기억/]];
 const themeOf=name=>{if(typeof name!=='string')return'body';let t=themeCache.get(name);if(!t){t='body';for(const[k,re]of THEME_RE)if(re.test(name)){t=k;break;}themeCache.set(name,t);}return t;};
 const VOICE_GAP=2500,VOICE_RANGE=9,seenAttack=new WeakMap(),lastVoice={beast:-1e9,goblin:-1e9};let thunderRoom=null,thunderAt=0;
 const voiceOf=name=>typeof name!=='string'?null:/고블린/.test(name)?['goblin','r543Goblin']:/곰(?!팡)/.test(name)?['beast','r543GrowlLow']:/여우/.test(name)?['beast','r543GrowlHigh']:/짐승|추적견|사냥개|늑대/.test(name)?['beast','r543Growl']:null;
 const DEATH_GAP=600,DOOR_GAP=1500,stats={applied:0,death:0,door:0,bow:0,voice:0,thunder:0,themeHit:0,themeDeath:0,heroHurt:0,click:0,skipped:0,errors:0};let lastDeath=-1e9,lastDoor=-1e9,seenRoom=null,seenOpen=new Map();
 const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
 const quiet=()=>typeof started!=='undefined'&&!started||typeof modal!=='undefined'&&!!modal||typeof loading!=='undefined'&&!!loading;
 function apply(){if(!on||typeof soundProfiles==='undefined'||!soundProfiles)return;
  for(const[kind,list]of Object.entries(ROWS)){if(kind==='pickup'&&soundProfiles.pickup?.length&&!soundProfiles.pickup.every(r=>r.r541))continue;
   soundProfiles[kind]=list.map(([name,gain])=>({key:'r541-'+name,path:DIR+name+'.ogg',gain,r541:true}));}
  soundProfiles.r542Bow=[row2('bow-1',.6)];soundProfiles.r542Crush=[row2('crush-1',.5)];soundProfiles.swHeal=[row2('heal-1',.55)];
  for(const[kind,list]of Object.entries(ROWS3))soundProfiles[kind]=list.map(([name,gain])=>({key:'r543-'+name,path:DIR3+name+'.ogg',gain,r541:true}));
  const boss=Array.isArray(soundProfiles.boss)?soundProfiles.boss:[];if(!boss.some(r=>r.path===DIR2+'roar-1.ogg'))soundProfiles.boss=[...boss,row2('roar-1',.6)];
  if(on4){for(const t of THEMES){soundProfiles['r544Hit_'+t]=[row4('hit-'+t,GAIN4[t]?.7:.8)];soundProfiles['r544Death_'+t]=[row4('death-'+t,GAIN4[t]||.5)];}
   for(const h of HEROES)soundProfiles['r544Hurt_'+h]=[row4('hurt-'+h,.8)];
   soundProfiles.r544Click=[row4('click-1',.35)];}
  stats.applied++;}
 // R544: 이번 한 번의 sound(kind) 가 어떤 프로필로 울릴지. 엔진은 호출 첫머리에 soundProfiles[kind] 를 읽으므로 그 동안만 바꿔 끼웠다가 되돌린다(간격·역할·음량 규칙은 엔진 것 그대로).
 function swapFor(kind){if(!on4||typeof soundProfiles==='undefined')return null;const p=typeof player!=='undefined'?player:null;let rows=null,stat=null;
  if(kind==='enemyHit'&&hitNow){rows=soundProfiles['r544Hit_'+themeOf(hitNow.name)];stat='themeHit';}
  else if(kind==='r541Death'&&deathNow){rows=soundProfiles['r544Death_'+themeOf(deathNow.name)];stat='themeDeath';}
  else if(kind==='hurt'&&p){rows=soundProfiles['r544Hurt_'+p.hero];stat='heroHurt';}
  if(!rows?.length)return null;stats[stat]++;return rows;}
 function play(kind){try{if(typeof sound==='function')sound(kind);return true;}catch(_){stats.errors++;return false;}}
 if(on){
  try{apply();}catch(_){stats.errors++;}
  if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const result=base.apply(this,arguments);try{apply();}catch(_){stats.errors++;}return result;};}
  if(typeof sound==='function'){const base=sound;sound=function(kind,...a){let k=kind;try{if(kind==='attack'&&typeof player!=='undefined'&&player?.hero==='hunter'&&typeof soundProfiles!=='undefined'&&soundProfiles.r542Bow?.length){k='r542Bow';stats.bow++;}}catch(_){k=kind;}
    let rows=null;try{rows=k===kind?swapFor(kind):null;}catch(_){stats.errors++;}if(!rows)return base.call(this,k,...a);
    const keep=soundProfiles[kind];soundProfiles[kind]=rows;try{return base.call(this,k,...a);}finally{soundProfiles[kind]=keep;}};}
  if(on4&&typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e){const prev=hitNow;hitNow=e||null;try{return base.apply(this,arguments);}finally{hitNow=prev;}};}
  if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e){const fresh=!!e&&!e.deadRecorded,result=base.apply(this,arguments);
   try{if(fresh&&e.deadRecorded&&!e.boss){const t=now();if(t-lastDeath>=DEATH_GAP){lastDeath=t;stats.death++;const prev=deathNow;deathNow=e;try{play('r541Death');}finally{deathNow=prev;}}else stats.skipped++;}}catch(_){stats.errors++;}return result;};}
 }
 // 문: R74 문이 닫힘→열림으로 바뀐 순간 한 번. 방에 처음 들어온 때의 상태는 기억만 한다.
 function doorTick(){try{const r=typeof room!=='undefined'?room:null,W=window.__STORYWORLD_WORLD_R74__,doors=r?.exploration?.worldR74?.doors;
   if(!r||!W?.isOpen||!Array.isArray(doors)){seenRoom=null;return;}
   const first=seenRoom!==r.id,next=new Map();let opened=false;for(const d of doors){const o=!!W.isOpen(r,d);next.set(d.id,o);if(!first&&o&&seenOpen.get(d.id)===false)opened=true;}
   seenRoom=r.id;seenOpen=next;if(!opened||quiet())return;const t=now();if(t-lastDoor<DOOR_GAP){stats.skipped++;return;}lastDoor=t;stats.door++;play('r541Door');
  }catch(_){stats.errors++;}}
 // 적 목소리: 새 공격(e.attack.id 가 바뀜)을 시작한 가까운 짐승형 적·피리 고블린. 조용해야 할 때(창·불러오기) 시작한 공격은 본 것으로만 적는다.
 function voiceTick(){try{const r=typeof room!=='undefined'?room:null,list=r?.enemies,p=typeof player!=='undefined'?player:null;if(!Array.isArray(list))return;const q=quiet(),t=now(),fired={};
   for(const e of list){const id=e?.attack?.id;if(id==null||seenAttack.get(e)===id)continue;seenAttack.set(e,id);if(q||!(e.hp>0)||!p)continue;const v=voiceOf(e.name);if(!v||fired[v[0]])continue;
    if(Math.hypot(e.x-p.x,e.y-p.y)>VOICE_RANGE)continue;if(t-lastVoice[v[0]]<VOICE_GAP){stats.skipped++;continue;}lastVoice[v[0]]=t;fired[v[0]]=true;stats.voice++;play(v[1]);}
  }catch(_){stats.errors++;}}
 // 먼 천둥: R450 날씨가 비인 구역에서만.
 function thunderTick(){try{const r=typeof room!=='undefined'?room:null,kind=r?window.__STORYWORLD_WEATHER_R450__?.pick?.(r)?.kind:null;if(kind!=='rain'&&kind!=='storm'){thunderRoom=null;return;}
   const t=now();if(thunderRoom!==r.id){thunderRoom=r.id;thunderAt=t+12000+Math.random()*18000;return;}
   if(t<thunderAt||quiet())return;thunderAt=t+40000+Math.random()*50000;stats.thunder++;play('r543Thunder');
  }catch(_){stats.errors++;}}
 // 버튼 누름: 화면의 button 을 누른 순간(창이 떠 있어도 울리도록 allowModal).
 if(on4)try{if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('click',ev=>{try{if(!ev?.target?.closest?.('button')||typeof sound!=='function')return;stats.click++;sound('r544Click',true);}catch(_){stats.errors++;}},true);}catch(_){}
 function tick(){if(!on)return;doorTick();voiceTick();thunderTick();}
 if(on)try{setInterval(tick,160);}catch(_){}
 window.__STORYWORLD_SFX_R541__=Object.freeze({revision:'R544',enabled:()=>on,enabledR544:()=>on4,themeOf,themes:THEMES,heroes:HEROES,tick,apply,inspect:()=>({on,stats:{...stats},profiles:typeof soundProfiles!=='undefined'?Object.fromEntries(Object.keys(ROWS).map(k=>[k,(soundProfiles[k]||[]).map(r=>r.path)])):null,
  synthesized:true,recorded:false,generatedR544:'ElevenLabs text-to-sound v2',directListeningVerified:false,existingProfilesChanged:false})});
})();
