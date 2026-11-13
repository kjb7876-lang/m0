/* R788 보스별 고유 피격·사망·공격 효과음 (사용자 2026-11-12 "모든 몹+보스들마다 고유 피격·사망·공격 효과음을 일레븐랩스로 생성해서 적용 — 영웅, 보스, 불면귀몹, 일반몹 순서").
 * 전에는 보스도 일반 몹과 같은 적중음(R785 무기 재질음)만 났고, 죽을 때는 엔진 'clear' 하나, 공격을 시작할 때는 따로 소리가 없었다.
 * 보스 26종(맘몬은 Codex 작업이라, 불면귀는 다음 묶음이라 뺌)마다 ElevenLabs 로 새로 만든 소리(scripts/build-sfx-r788.py)를 엔진 소리 위에 한 겹 얹는다.
 *  - 피격: hitEnemy 가 받아들인 타격 뒤, 보스가 아직 살아 있으면 r788BHit_<보스>. 보스마다 0.9초에 한 번(연타가 소리를 덮지 않게). 무기 재질 적중음(R785)은 그대로.
 *  - 사망: killEnemy 로 처음 죽은 보스에 r788BDie_<보스>(보상 창이 곧 떠도 울리게 allowModal). 엔진 'clear' 는 그대로.
 *  - 공격 시작: bossVolley(패턴 사격)와 근접 공격 시작(e.attack.id 가 바뀐 순간)에 r788BAtk_<보스>. 보스마다 1.2초에 한 번, 전투 중(room.engaged)·창 없을 때만.
 *  - 새 종류는 별칭 없이 쾌적 계층(__STORYWORLD_SFX_COMFORT__)의 '종류마다 자체 쿨다운'을 따른다 → 엔진 적중음·처치음·영웅 소리를 막지 않는다.
 *  - 방에 보스가 있으면 그 보스 파일을 미리 해독해 첫 소리가 빠지지 않게 한다.
 * 보스는 이름(regionById 의 보스 이름)으로 알아본다. 판정·체력·패턴은 손대지 않는다. 끄기: localStorage storyworld.r788.sfx = '0'. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SFX_R788__)return;
 let on=true;try{on=localStorage.getItem('storyworld.r788.sfx')!=='0';}catch(_){}
 const BOSSES={root:'뿌리의 문지기',balrog:'발록',lucifer:'루시퍼',sloth:'나태에 잠식된 남자',leviathan:'레비아탄',beelzebub:'베엘제붑',seoyun:'붉은 하이힐의 서윤',satan:'사탄',
  chairman:'백색 정장의 호텔 그룹 회장',bootloader:'생체 부트로더',controller:'컨트롤러 · 기억의 문',goblin:'고블린 추장',knight:'타락천사 기사',gate01:'대수문장 01',gate02:'대수문장 02',
  gate04:'대수문장 04',gravekeeper:'망각 묘지기',gate06:'대수문장 06',arbelia:'아르벨리아를 묶은 변조 명령',siren:'세이렌 모르',nightmare:'EGO 강탈 악몽왕',bluelight:'파란불',
  choir:'네트워크 합창체',hanrian:'이단의목사 한리안',baekion:'이단의목사 백이온',cultleader:'교만의 사이보그 교주'};
 const DIR='assets/r788/sfx/',SETS=[['BHit','hit',3,.55],['BDie','die',2,.8],['BAtk','atk',2,.6]],HIT_GAP=900,ATK_GAP=1200;
 const BY_NAME=new Map(Object.entries(BOSSES).map(([s,n])=>[n,s])),slugCache=new Map();
 function slugOf(name){if(typeof name!=='string')return null;const k=name.trim();if(slugCache.has(k))return slugCache.get(k);let s=BY_NAME.get(k)||null;
  if(!s)for(const [n,v] of BY_NAME)if(k.length>=n.length&&k.includes(n)){s=v;break;}slugCache.set(k,s);return s;}
 const stats={hit:0,hitSkipped:0,die:0,atk:0,atkSkipped:0,warmed:0,errors:0};const lastHit={},lastAtk={},seenAtk=new WeakMap();let warmKey='';
 const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
 const quiet=()=>typeof started!=='undefined'&&!started||typeof modal!=='undefined'&&!!modal||typeof loading!=='undefined'&&!!loading;
 const slugFor=e=>e&&e.boss?slugOf(e.name):null;
 function apply(){if(!on||typeof soundProfiles==='undefined'||!soundProfiles)return;
  for(const s of Object.keys(BOSSES))for(const [K,f,n,g] of SETS)soundProfiles['r788'+K+'_'+s]=Array.from({length:n},(_,i)=>({key:'r788-'+f+'-'+s+'-'+(i+1),path:DIR+f+'-'+s+'-'+(i+1)+'.ogg',gain:g,r541:true}));}
 function play(kind,allow){try{if(typeof sound==='function'&&soundProfiles?.[kind]?.length){allow?sound(kind,true):sound(kind);return true;}}catch(_){stats.errors++;}return false;}
 function attack(e){try{const s=slugFor(e);if(!s||!(e.hp>0)||quiet()||typeof room!=='undefined'&&room&&room.engaged===false)return;const t=now();
  if(t-(lastAtk[s]??-1e9)<ATK_GAP){stats.atkSkipped++;return;}lastAtk[s]=t;if(play('r788BAtk_'+s))stats.atk++;}catch(_){stats.errors++;}}
 function warm(list){try{if(typeof audioBuffer!=='function'||typeof audioUnlocked!=='undefined'&&!audioUnlocked)return;const ss=[...new Set(list.map(slugFor).filter(Boolean))].sort(),key=ss.join();if(!key||key===warmKey)return;warmKey=key;
  for(const s of ss)for(const [K] of SETS)for(const r of soundProfiles?.['r788'+K+'_'+s]||[])try{Promise.resolve(audioBuffer(r.path)).catch(()=>{});}catch(_){}stats.warmed++;}catch(_){stats.errors++;}}
 function tick(){try{const list=typeof room!=='undefined'&&room&&Array.isArray(room.enemies)?room.enemies:null;if(!list)return;warm(list);
  // R964: 엔진 서사 패턴 공격(setAttackPose5)은 attack 에 id 가 없고 bossVolley 도 안 부른다(타락천사 기사 등) → 패턴 시작 시각(storyAttackStart5)이 새 값으로 바뀐 순간도 공격 시작으로 본다.
  for(const e of list){if(!slugFor(e))continue;const id=e.attack?.id,ps=typeof e.storyAttackStart5==='number'&&e.storyAttackStart5>0?e.storyAttackStart5:null,o=seenAtk.get(e);seenAtk.set(e,{id,ps});
   if(o&&((id!=null&&o.id!==id)||(ps!=null&&o.ps!==ps)))attack(e);}
 }catch(_){stats.errors++;}}
 if(on){
  try{apply();}catch(_){stats.errors++;}
  if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const r=base.apply(this,arguments);try{apply();}catch(_){stats.errors++;}return r;};}
  if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e){const r=base.apply(this,arguments);
   try{const s=r?slugFor(e):null;if(s&&e.hp>0){const t=now();if(t-(lastHit[s]??-1e9)>=HIT_GAP){lastHit[s]=t;if(play('r788BHit_'+s))stats.hit++;}else stats.hitSkipped++;}}catch(_){stats.errors++;}return r;};}
  if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e){const fresh=!!e&&!e.deadRecorded,r=base.apply(this,arguments);
   try{const s=fresh&&e.deadRecorded?slugFor(e):null;if(s&&play('r788BDie_'+s,true))stats.die++;}catch(_){stats.errors++;}return r;};}
  if(typeof bossVolley==='function'){const base=bossVolley;bossVolley=function(e){const r=base.apply(this,arguments);attack(e);return r;};}
  try{setInterval(tick,160);}catch(_){}
 }
 window.__STORYWORLD_SFX_R788__=Object.freeze({revision:'R788',enabled:()=>on,apply,slugOf,bosses:BOSSES,tick,inspect:()=>({on,stats:{...stats},hitGapMs:HIT_GAP,atkGapMs:ATK_GAP,
  profiles:typeof soundProfiles==='undefined'?null:Object.fromEntries(Object.keys(soundProfiles).filter(k=>/^r788/.test(k)).map(k=>[k,soundProfiles[k].length])),generated:'ElevenLabs text-to-sound v2 (2026-11-12), scripts/build-sfx-r788.py'})});
})();
