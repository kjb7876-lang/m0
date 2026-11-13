/* R967 보스·중간보스 소리 빈칸 메우기 (사용자 2026-11-12 "모든 몹+보스들마다 고유 피격·사망·공격 효과음을 일레븐랩스로 생성해서 적용").
 * 64개 지역 실제 이름 전수(qa/r955/r955-name-sweep.mjs)에서 R788(보스)·R789(중간보스) 소리가 하나도 나지 않던 셋:
 *  - '병원 심부의 집도의'(ep1a08 보스): 새로 만든 소리(scripts/build-sfx-r967.py, 피격 3·사망 2·공격 2).
 *  - '중독을 부르는 주사기 환영체'(중간보스): 새로 만든 소리(같은 방법).
 *  - '불을 지른 청소부 · 분노의 귀'(ep1b07 보스): R788 이 이 보스용으로 만든 '사탄' 소리(불붙은 청소부 프롬프트)가 이름이 달라 안 났다 → 그 소리(r788*_satan)를 그대로 쓴다.
 * 방식은 R788 과 같다: hitEnemy 가 받아들인 타격 뒤 살아 있으면 피격음(그 개체마다 0.9초), killEnemy 로 처음 죽으면 사망음(창이 떠도),
 * 공격 시작(e.attack.id·storyAttackStart5 가 바뀐 순간·bossVolley)에 공격음(1.2초). 공격음은 창 없을 때, 전투 중일 때만 — 길 구간(R78 phase route 등)은
 * room.engaged 가 false 여도 보스·중간보스가 모습을 드러냈으면(spawnState active) 전투 중으로 본다(ep1a08 처럼 R78 구간이 없는 방 포함). R788·R789 파일은 고치지 않는다. 맘몬은 다루지 않는다.
 * 판정·체력·패턴·그림은 손대지 않는다. 끄기: localStorage storyworld.r967.sfx = '0'. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SFX_R967__)return;
 let on=true;try{on=localStorage.getItem('storyworld.r967.sfx')!=='0';}catch(_){}
 // 이름 → [슬러그, 소리 종류 앞말, 보스여야 하나(true)/중간보스여야 하나(false)]
 const TARGETS=[['병원 심부의 집도의','surgeon','r967',true],['중독을 부르는 주사기 환영체','syringe','r967',false],['분노의 귀','satan','r788B',true]];
 const DIR='assets/r967/sfx/',SETS=[['Hit','hit',3,.55],['Die','die',2,.8],['Atk','atk',2,.6]],HIT_GAP=900,ATK_GAP=1200;
 const slugCache=new Map();
 function match(name){if(typeof name!=='string')return null;const k=name.trim();if(slugCache.has(k))return slugCache.get(k);let t=null;for(const row of TARGETS)if(k.includes(row[0])){t=row;break;}slugCache.set(k,t);return t;}
 const targetFor=e=>{if(!e||e.hero||e.summon||e.ally)return null;const t=match(e.name);if(!t)return null;if(t[3]?!e.boss:!(e.midboss||/^중간보스\s*·/.test(e.name||'')))return null;return t;};
 const kindOf=(t,K)=>t[2]==='r788B'?'r788B'+K+'_'+t[1]:'r967'+K+'_'+t[1];
 const stats={hit:0,hitSkipped:0,die:0,atk:0,atkSkipped:0,warmed:0,errors:0};const lastHit=new WeakMap(),lastAtk=new WeakMap(),seenAtk=new WeakMap();let warmKey='';
 const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
 const quiet=()=>typeof started!=='undefined'&&!started||typeof modal!=='undefined'&&!!modal||typeof loading!=='undefined'&&!!loading;
 // 보스·중간보스는 모습을 드러내(spawnState active) 공격을 시작했으면 전투 중이다 — ep1a08 처럼 R78 구간이 없는 방은 engaged 가 false 로 남는다(숨은 보스는 hidden 이라 막힌다).
 const idle=e=>typeof room!=='undefined'&&!!room&&room.engaged===false&&e.spawnState!=='active';
 function apply(){if(!on||typeof soundProfiles==='undefined'||!soundProfiles)return;
  for(const s of ['surgeon','syringe'])for(const [K,f,n,g] of SETS)soundProfiles['r967'+K+'_'+s]=Array.from({length:n},(_,i)=>({key:'r967-'+f+'-'+s+'-'+(i+1),path:DIR+f+'-'+s+'-'+(i+1)+'.ogg',gain:g,r541:true}));}
 function play(kind,allow){try{if(typeof sound==='function'&&soundProfiles?.[kind]?.length){allow?sound(kind,true):sound(kind);return true;}}catch(_){stats.errors++;}return false;}
 function attack(e){try{const t=targetFor(e);if(!t||!(e.hp>0)||quiet()||idle(e))return;const n=now();
  if(n-(lastAtk.get(e)??-1e9)<ATK_GAP){stats.atkSkipped++;return;}lastAtk.set(e,n);if(play(kindOf(t,'Atk')))stats.atk++;}catch(_){stats.errors++;}}
 function warm(list){try{if(typeof audioBuffer!=='function'||typeof audioUnlocked!=='undefined'&&!audioUnlocked)return;const ts=[...new Set(list.map(targetFor).filter(Boolean))],key=ts.map(t=>t[1]).sort().join();if(!key||key===warmKey)return;warmKey=key;
  for(const t of ts)for(const [K] of SETS)for(const r of soundProfiles?.[kindOf(t,K)]||[])try{Promise.resolve(audioBuffer(r.path)).catch(()=>{});}catch(_){}stats.warmed++;}catch(_){stats.errors++;}}
 function tick(){try{const list=typeof room!=='undefined'&&room&&Array.isArray(room.enemies)?room.enemies:null;if(!list)return;warm(list);
  for(const e of list){if(!targetFor(e))continue;const id=e.attack?.id,ps=typeof e.storyAttackStart5==='number'&&e.storyAttackStart5>0?e.storyAttackStart5:null,o=seenAtk.get(e);seenAtk.set(e,{id,ps});
   if(o&&((id!=null&&o.id!==id)||(ps!=null&&o.ps!==ps)))attack(e);}
 }catch(_){stats.errors++;}}
 if(on){
  try{apply();}catch(_){stats.errors++;}
  if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const r=base.apply(this,arguments);try{apply();}catch(_){stats.errors++;}return r;};}
  if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e){const r=base.apply(this,arguments);
   try{const t=r?targetFor(e):null;if(t&&e.hp>0){const n=now();if(n-(lastHit.get(e)??-1e9)>=HIT_GAP){lastHit.set(e,n);if(play(kindOf(t,'Hit')))stats.hit++;}else stats.hitSkipped++;}}catch(_){stats.errors++;}return r;};}
  if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e){const fresh=!!e&&!e.deadRecorded,r=base.apply(this,arguments);
   try{const t=fresh&&e.deadRecorded?targetFor(e):null;if(t&&play(kindOf(t,'Die'),true))stats.die++;}catch(_){stats.errors++;}return r;};}
  if(typeof bossVolley==='function'){const base=bossVolley;bossVolley=function(e){const r=base.apply(this,arguments);attack(e);return r;};}
  try{setInterval(tick,160);}catch(_){}
 }
 window.__STORYWORLD_SFX_R967__=Object.freeze({revision:'R967',enabled:()=>on,apply,targetFor,kindOf,targets:TARGETS.map(t=>t.slice()),tick,inspect:()=>({on,stats:{...stats},hitGapMs:HIT_GAP,atkGapMs:ATK_GAP,
  profiles:typeof soundProfiles==='undefined'?null:Object.fromEntries(Object.keys(soundProfiles).filter(k=>/^r967|_satan$/.test(k)).map(k=>[k,soundProfiles[k].length])),generated:'ElevenLabs text-to-sound v2 (2026-11-13), scripts/build-sfx-r967.py'})});
})();
