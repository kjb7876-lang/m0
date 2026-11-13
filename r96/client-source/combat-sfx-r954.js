/* R954 불면귀 구역 적별 고유 피격·사망·공격 효과음 (사용자 2026-11-12 "모든 몹+보스들마다 고유 피격·사망·공격 효과음을 일레븐랩스로 생성해서 적용 — 영웅, 보스, 불면귀몹, 일반몹 순서").
 * 잠들지 못하는 마을(last302)·한약과 불면귀(last303)의 6종: 불면귀(보스), 검은 안개 심장 · 불면의 기억(중간보스), 잠식된 약방 아낙·어부·소복 처녀, 불면귀의 안개 잔영.
 * 소리는 ElevenLabs 로 새로 만들어 scripts/build-sfx-r954.py 로 다듬었다(종류마다 피격·사망·공격 3개씩). 이름(앞뒤 '1'·'우두머리'·'증원'·'중간보스 · ' 등은 무시)으로 알아본다.
 * 불면귀 스레드가 이미 넣은 소리와 겹치지 않게 한다(bulmyeongwi-r760.js 는 고치지 않음):
 *  - 불면귀 보스 공격은 R762(실타래 감기·응시·실비·드러남)가 이미 고유 소리를 내므로 R954 는 보스 피격·사망만 얹는다.
 *  - 주민(R763)은 피격 때 엔진 적중음을 1.5초에 한 번 '신음'으로, 사망 때 처치음을 '잠듦'으로 바꾼다.
 *    → 이번 타격에 R763 신음이 났으면(R763 통계 groans 가 늘었으면) R954 피격음은 내지 않고, 그 사이 타격에만 종류별 피격음을 낸다.
 *    → 사망은 R763 잠듦 위에 종류별 소리(사발 구르는 소리·물 튀김·바람 등)를 조금 작게 얹는다.
 *  - 피격: 종류마다(보스·중간보스는 그 개체마다) 보스급 0.9초·몹 0.45초에 한 번. 사망: 몹 종류마다 0.3초에 한 번(한꺼번에 쓰러져도 겹겹이 쌓이지 않게).
 *  - 공격 시작: bossVolley 와 근접 공격 시작(e.attack.id 가 바뀐 순간). 중간보스 1.2초·몹 종류마다 0.9초에 한 번, 전투 중·창 없을 때만.
 * 판정·체력·패턴·그림은 손대지 않는다. 끄기: localStorage storyworld.r954.sfx = '0'. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SFX_R954__)return;
 let on=true;try{on=localStorage.getItem('storyworld.r954.sfx')!=='0';}catch(_){}
 // 긴 이름부터 맞춘다('불면귀의 안개 잔영' 이 '불면귀' 로 잡히지 않게).
 const BOSSES={bulmyeongwi:'불면귀',mistheart:'검은 안개 심장 · 불면의 기억',herbwoman:'잠식된 약방 아낙',fisherman:'잠식된 어부',maiden:'잠식된 소복 처녀',mistremnant:'불면귀의 안개 잔영'};
 const BIG=new Set(['bulmyeongwi','mistheart']),NO_ATK=new Set(['bulmyeongwi']),NO_HIT_IF_GROAN=new Set(['herbwoman','fisherman','maiden']);
 const DIR='assets/r954/sfx/',SETS=[['Hit','hit',3],['Die','die',3],['Atk','atk',3]],GAIN={hit:[.55,.42],die:[.8,.45],atk:[.6,.45]};
 const GAP={hit:[900,450],die:[0,300],atk:[1200,900]};
 const ORDER=Object.entries(BOSSES).sort((a,b)=>b[1].length-a[1].length),slugCache=new Map();
 function slugOf(name){if(typeof name!=='string')return null;const k=name.trim();if(slugCache.has(k))return slugCache.get(k);let s=null;
  for(const [v,n] of ORDER){if(k===n){s=v;break;}}
  if(!s)for(const [v,n] of ORDER){if(v==='bulmyeongwi')continue;if(k.includes(n)){s=v;break;}}
  slugCache.set(k,s);return s;}
 const stats={hit:0,hitSkipped:0,hitYield:0,die:0,dieSkipped:0,atk:0,atkSkipped:0,warmed:0,errors:0};const last={},seenAtk=new WeakMap();let warmKey='';
 const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
 const quiet=()=>typeof started!=='undefined'&&!started||typeof modal!=='undefined'&&!!modal||typeof loading!=='undefined'&&!!loading;
 const slugFor=e=>{if(!e||e.hero)return null;const s=slugOf(e.name);if(!s)return null;if(s==='bulmyeongwi'&&!e.boss)return null;return s;};
 const big=s=>BIG.has(s)?0:1;
 const keyOf=(slot,s,e)=>slot+':'+s+(BIG.has(s)&&e&&e.id!=null?':'+e.id:'');
 function gate(slot,s,e){const g=GAP[slot][big(s)];if(!g)return true;const k=keyOf(slot,s,e),t=now();if(t-(last[k]??-1e9)<g)return false;last[k]=t;return true;}
 function apply(){if(!on||typeof soundProfiles==='undefined'||!soundProfiles)return;
  for(const s of Object.keys(BOSSES))for(const [K,f,n] of SETS){if(K==='Atk'&&NO_ATK.has(s))continue;
   soundProfiles['r954'+K+'_'+s]=Array.from({length:n},(_,i)=>({key:'r954-'+f+'-'+s+'-'+(i+1),path:DIR+f+'-'+s+'-'+(i+1)+'.ogg',gain:GAIN[f][big(s)],r541:true}));}}
 function play(kind,allow){try{if(typeof sound==='function'&&soundProfiles?.[kind]?.length){allow?sound(kind,true):sound(kind);return true;}}catch(_){stats.errors++;}return false;}
 const groans=()=>{try{return window.__STORYWORLD_VILLAGERS_R763__?.inspect?.().stats?.groans|0;}catch(_){return 0;}};
 // R966: 길을 따라 싸우는 구간(R78 phase route)은 room.engaged 가 내내 false 다(집결·보스 구간만 true) → 그 방을 R78 이 맡고 있고 몹이 실제로 나와 있으면(active) 전투 중으로 본다.
 const idle=e=>{if(typeof room==='undefined'||!room||room.engaged!==false)return false;try{const p=window.__STORYWORLD_WORLD_COMBAT_R78__?.state?.()?.phase;return !(e.spawnState==='active'&&(p==='route'||p==='rally'||p==='door'||p==='boss'));}catch(_){return true;}};
 function attack(e){try{const s=slugFor(e);if(!s||NO_ATK.has(s)||!(e.hp>0)||quiet()||idle(e))return;
  if(!gate('atk',s,e)){stats.atkSkipped++;return;}if(play('r954Atk_'+s))stats.atk++;}catch(_){stats.errors++;}}
 function warm(list){try{if(typeof audioBuffer!=='function'||typeof audioUnlocked!=='undefined'&&!audioUnlocked)return;const ss=[...new Set(list.map(slugFor).filter(Boolean))].sort(),key=ss.join();if(!key||key===warmKey)return;warmKey=key;
  for(const s of ss)for(const [K] of SETS)for(const r of soundProfiles?.['r954'+K+'_'+s]||[])try{Promise.resolve(audioBuffer(r.path)).catch(()=>{});}catch(_){}stats.warmed++;}catch(_){stats.errors++;}}
 function tick(){try{const list=typeof room!=='undefined'&&room&&Array.isArray(room.enemies)?room.enemies:null;if(!list)return;warm(list);
  // R964 와 같게: 서사 패턴 공격(setAttackPose5)은 attack.id 가 없고 bossVolley 도 안 부르므로 패턴 시작 시각(storyAttackStart5)이 바뀐 순간도 공격 시작으로 본다.
  for(const e of list){if(!slugFor(e))continue;const id=e.attack?.id,ps=typeof e.storyAttackStart5==='number'&&e.storyAttackStart5>0?e.storyAttackStart5:null,o=seenAtk.get(e);seenAtk.set(e,{id,ps});
   if(o&&((id!=null&&o.id!==id)||(ps!=null&&o.ps!==ps)))attack(e);}
 }catch(_){stats.errors++;}}
 if(on){
  try{apply();}catch(_){stats.errors++;}
  if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const r=base.apply(this,arguments);try{apply();}catch(_){stats.errors++;}return r;};}
  if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e){const g0=groans(),r=base.apply(this,arguments);
   try{const s=r?slugFor(e):null;if(s&&e.hp>0){if(NO_HIT_IF_GROAN.has(s)&&groans()>g0)stats.hitYield++;else if(gate('hit',s,e)){if(play('r954Hit_'+s))stats.hit++;}else stats.hitSkipped++;}}catch(_){stats.errors++;}return r;};}
  if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e){const fresh=!!e&&!e.deadRecorded,r=base.apply(this,arguments);
   try{const s=fresh&&e.deadRecorded?slugFor(e):null;if(s){if(gate('die',s,e)){if(play('r954Die_'+s,true))stats.die++;}else stats.dieSkipped++;}}catch(_){stats.errors++;}return r;};}
  if(typeof bossVolley==='function'){const base=bossVolley;bossVolley=function(e){const r=base.apply(this,arguments);attack(e);return r;};}
  try{setInterval(tick,160);}catch(_){}
 }
 window.__STORYWORLD_SFX_R954__=Object.freeze({revision:'R954',enabled:()=>on,apply,slugOf,slugFor,bosses:BOSSES,tick,inspect:()=>({on,stats:{...stats},gaps:GAP,
  profiles:typeof soundProfiles==='undefined'?null:Object.fromEntries(Object.keys(soundProfiles).filter(k=>/^r954/.test(k)).map(k=>[k,soundProfiles[k].length])),generated:'ElevenLabs text-to-sound v2 (2026-11-12), scripts/build-sfx-r954.py'})});
})();
