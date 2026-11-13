/* R789 중간보스별 고유 피격·사망·공격 효과음 (사용자 2026-11-12 "모든 몹+보스들마다 고유 피격·사망·공격 효과음을 일레븐랩스로 생성해서 적용 — 영웅, 보스, 불면귀몹, 일반몹 순서").
 * R788(보스 26종)과 같은 방식을 중간보스(e.midboss) 38종에 쓴다. 전에는 중간보스도 일반 몹과 같은 적중음(R785 무기 재질음)·엔진 처치음만 났다.
 * 맘몬 맵(금고 장부감시자, Codex 작업)·불면귀(검은 안개 심장, 불면귀 묶음)는 뺐다. 소리는 ElevenLabs 로 새로 만들어 scripts/build-sfx-r789.py 로 다듬었다.
 *  - 피격: hitEnemy 가 받아들인 타격 뒤, 중간보스가 아직 살아 있으면 r789MHit_<이름>. 중간보스마다 0.9초에 한 번. 무기 재질 적중음(R785)은 그대로.
 *  - 사망: killEnemy 로 처음 죽은 중간보스에 r789MDie_<이름>(allowModal). 엔진 처치음은 그대로.
 *  - 공격 시작: bossVolley, 근접 공격 시작(e.attack.id 가 바뀐 순간), 서사 패턴 공격 시작(e.storyAttackStart5 가 바뀐 순간, R965)에 r789MAtk_<이름>. 1.2초에 한 번, 전투 중·창 없을 때만.
 *  - 보스(e.boss)는 R788 몫이라 건드리지 않는다. 판정·체력·패턴은 손대지 않는다. 끄기: localStorage storyworld.r789.sfx = '0'. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SFX_R789__)return;
 let on=true;try{on=localStorage.getItem('storyworld.r789.sfx')!=='0';}catch(_){}
 const BOSSES={spiderangel:'보라검천사',swamphorn:'늪의 뿔악마 군주',bloodpursuer:'핏빛 수호로 추격자',comradeecho:'첫 동료의 악마잔영',messenger:'숨이 끊긴 전령의 그림자',blackpillar:'소환진 검은기둥',stabilizer:'백의 안정화 감독',
  prideruin:'오만의 폐허핵',smilemask:'초천사의 웃는 가면',gate72echo:'교만의 잔향 · 제72문',slothshell:'나태의 껍데기 파수',crackmirror:'금이 간 비교잔영',kitchenboss:'폐기주방 감독',stagedirector:'심장빛 무대감독',thornwarden:'겨울숲 가시파수',
  flameknight:'호텔 화염기사',corpseguard:'역십자가 시체경호체',bootcore:'생체부트로더 연산핵',warmanager:'제4단계 전쟁관리자',mercypriest:'제8단계 자비 교정관',censor:'제12단계 기억 검열기',reverser:'제14단계 역전 관리자',
  voidcore:'제17단계 중앙이주 코어',memoryframe:'기억의 문 수호 프레임',firstcommand:'최초명령 코어 오염체',restharvest:'휴식 수확관 · 과로의 수문장',gate05:'대수문장 05',signaleater:'의존 신호 포식자',coreenforcer:'코어 운반 집행자',
  phantomblade:'환수검 모조체',rainwitness:'파란불 역주행 목격자',hotelclerk:'공실장부 당직감사',silentalarm:'진술 봉쇄 인과핵',rooftopecho:'옥상 인과보관인',chipfirewall:'칩 제단 방화벽',idmanager:'ID 생체조 관리자',judgecore:'기계재판 집행핵',
  antichristcradle:'적그리스도 배양좌'};
 const DIR='assets/r789/sfx/',SETS=[['MHit','hit',3,.55],['MDie','die',2,.8],['MAtk','atk',2,.6]],HIT_GAP=900,ATK_GAP=1200;
 // R965: R385 가 실제 게임에서 이름을 바꾼 중간보스(검수 목록 42·43 역십자가 → 흑마법사).
 const ALIAS={'흑마법사의 시체경호체':'corpseguard'};
 const BY_NAME=new Map([...Object.entries(BOSSES).map(([s,n])=>[n,s]),...Object.entries(ALIAS)]),slugCache=new Map();
 function slugOf(name){if(typeof name!=='string')return null;const k=name.trim();if(slugCache.has(k))return slugCache.get(k);let s=BY_NAME.get(k)||null;
  if(!s)for(const [n,v] of BY_NAME)if(k.length>=n.length&&k.includes(n)){s=v;break;}slugCache.set(k,s);return s;}
 const stats={hit:0,hitSkipped:0,die:0,atk:0,atkSkipped:0,warmed:0,errors:0};const lastHit={},lastAtk={},seenAtk=new WeakMap();let warmKey='';
 const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
 const quiet=()=>typeof started!=='undefined'&&!started||typeof modal!=='undefined'&&!!modal||typeof loading!=='undefined'&&!!loading;
 const slugFor=e=>e&&e.midboss&&!e.boss?slugOf(e.name):null;
 function apply(){if(!on||typeof soundProfiles==='undefined'||!soundProfiles)return;
  for(const s of Object.keys(BOSSES))for(const [K,f,n,g] of SETS)soundProfiles['r789'+K+'_'+s]=Array.from({length:n},(_,i)=>({key:'r789-'+f+'-'+s+'-'+(i+1),path:DIR+f+'-'+s+'-'+(i+1)+'.ogg',gain:g,r541:true}));}
 function play(kind,allow){try{if(typeof sound==='function'&&soundProfiles?.[kind]?.length){allow?sound(kind,true):sound(kind);return true;}}catch(_){stats.errors++;}return false;}
 // R968: 길 구간(R78 phase route)·R78 구간이 없는 방(ep1a08·hando·kair02/03·cult04·last301, phase null)은 room.engaged 가 false 로 남는다 → R966(#522)과 같게 R78 이 맡은 방이고 중간보스가 실제로 나와 있으면(active) 전투 중으로 본다(phase 가 비어 있는 방도 포함, done·exit 는 막음).
 const idle=e=>{if(typeof room==='undefined'||!room||room.engaged!==false)return false;try{const R=window.__STORYWORLD_WORLD_COMBAT_R78__;if(!R||typeof R.state!=='function')return true;const p=R.state()?.phase??null;return !(e.spawnState==='active'&&(p==null||p==='route'||p==='rally'||p==='door'||p==='boss'));}catch(_){return true;}};
 function attack(e){try{const s=slugFor(e);if(!s||!(e.hp>0)||quiet()||idle(e))return;const t=now();
  if(t-(lastAtk[s]??-1e9)<ATK_GAP){stats.atkSkipped++;return;}lastAtk[s]=t;if(play('r789MAtk_'+s))stats.atk++;}catch(_){stats.errors++;}}
 function warm(list){try{if(typeof audioBuffer!=='function'||typeof audioUnlocked!=='undefined'&&!audioUnlocked)return;const ss=[...new Set(list.map(slugFor).filter(Boolean))].sort(),key=ss.join();if(!key||key===warmKey)return;warmKey=key;
  for(const s of ss)for(const [K] of SETS)for(const r of soundProfiles?.['r789'+K+'_'+s]||[])try{Promise.resolve(audioBuffer(r.path)).catch(()=>{});}catch(_){}stats.warmed++;}catch(_){stats.errors++;}}
 function tick(){try{const list=typeof room!=='undefined'&&room&&Array.isArray(room.enemies)?room.enemies:null;if(!list)return;warm(list);
  // R965: 엔진 서사 패턴 공격(setAttackPose5)은 attack 에 id 가 없고 bossVolley 도 안 부른다 → storyAttackStart5 가 바뀐 순간도 공격 시작으로 본다(R964 가 보스에서 고친 것과 같음).
  for(const e of list){if(!slugFor(e))continue;const id=e.attack?.id,ps=typeof e.storyAttackStart5==='number'&&e.storyAttackStart5>0?e.storyAttackStart5:null,o=seenAtk.get(e);seenAtk.set(e,{id,ps});
   if(o&&((id!=null&&o.id!==id)||(ps!=null&&o.ps!==ps)))attack(e);}
 }catch(_){stats.errors++;}}
 if(on){
  try{apply();}catch(_){stats.errors++;}
  if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const r=base.apply(this,arguments);try{apply();}catch(_){stats.errors++;}return r;};}
  if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e){const r=base.apply(this,arguments);
   try{const s=r?slugFor(e):null;if(s&&e.hp>0){const t=now();if(t-(lastHit[s]??-1e9)>=HIT_GAP){lastHit[s]=t;if(play('r789MHit_'+s))stats.hit++;}else stats.hitSkipped++;}}catch(_){stats.errors++;}return r;};}
  if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e){const fresh=!!e&&!e.deadRecorded,r=base.apply(this,arguments);
   try{const s=fresh&&e.deadRecorded?slugFor(e):null;if(s&&play('r789MDie_'+s,true))stats.die++;}catch(_){stats.errors++;}return r;};}
  if(typeof bossVolley==='function'){const base=bossVolley;bossVolley=function(e){const r=base.apply(this,arguments);attack(e);return r;};}
  try{setInterval(tick,160);}catch(_){}
 }
 window.__STORYWORLD_SFX_R789__=Object.freeze({revision:'R789',enabled:()=>on,apply,slugOf,bosses:BOSSES,tick,inspect:()=>({on,stats:{...stats},hitGapMs:HIT_GAP,atkGapMs:ATK_GAP,
  profiles:typeof soundProfiles==='undefined'?null:Object.fromEntries(Object.keys(soundProfiles).filter(k=>/^r789/.test(k)).map(k=>[k,soundProfiles[k].length])),generated:'ElevenLabs text-to-sound v2 (2026-11-12), scripts/build-sfx-r789.py'})});
})();
