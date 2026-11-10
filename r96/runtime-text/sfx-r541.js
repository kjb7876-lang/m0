/* R541 빈 자리 효과음 (사용자 2026-11-10 "직접 녹음 말고 너가 여러 효과음 참조해서 적절하게 생성" → "소리 거슬리지 않게 개선해서 적용").
 * 기억 조각·쪽지 줍기 sound('pickup') 은 soundProfiles.pickup 이 없어 무음이었고, 몹 소멸·문 열림은 전용 소리가 없었다.
 * scripts/build-sfx-r541.py 로 합성한 부드러운 음원(느린 어택·5kHz 위 억제·낮은 피크) 5개를 게임의 sound()·SFX 조절기에
 * 프로필로만 얹는다. 자체 재생기는 만들지 않으며 기존 프로필(공격·피격·보스 등)·밸런스·저장은 건드리지 않는다.
 * R542 (사용자 2026-11-10 "검토후 개선하여 쓸만한것들 적절히 사용"): 사용자가 준 효과음에서 고른 4개(scripts/build-sfx-r542.py 로 자르고 다듬음) —
 *   헌터 평타 → 활시위(r542Bow), 회복 swHeal → 치유음(전에는 강화음 돌려쓰기), 상자 부수기 → r542Crush(crates-r108 이 부름), 보스 포효 → 변주 1개 추가.
 *   영웅 파일은 건드리지 않고 sound() 를 한 겹 감싸 헌터의 'attack' 만 바꾼다.
 * 끄기: localStorage storyworld.r541.sfx = '0'. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SFX_R541__)return;
 let on=true;try{on=localStorage.getItem('storyworld.r541.sfx')!=='0';}catch(_){}
 const DIR='assets/r541/sfx/',ROWS={pickup:[['pickup-1',.55],['pickup-2',.55]],r541Death:[['death-1',.5],['death-2',.5]],r541Door:[['door-1',.6]]};
 const DIR2='assets/r542/sfx/',row2=(name,gain)=>({key:'r542-'+name,path:DIR2+name+'.ogg',gain,r541:true});
 const DEATH_GAP=600,DOOR_GAP=1500,stats={applied:0,death:0,door:0,bow:0,skipped:0,errors:0};let lastDeath=-1e9,lastDoor=-1e9,seenRoom=null,seenOpen=new Map();
 const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
 const quiet=()=>typeof started!=='undefined'&&!started||typeof modal!=='undefined'&&!!modal||typeof loading!=='undefined'&&!!loading;
 function apply(){if(!on||typeof soundProfiles==='undefined'||!soundProfiles)return;
  for(const[kind,list]of Object.entries(ROWS)){if(kind==='pickup'&&soundProfiles.pickup?.length&&!soundProfiles.pickup.every(r=>r.r541))continue;
   soundProfiles[kind]=list.map(([name,gain])=>({key:'r541-'+name,path:DIR+name+'.ogg',gain,r541:true}));}
  soundProfiles.r542Bow=[row2('bow-1',.6)];soundProfiles.r542Crush=[row2('crush-1',.5)];soundProfiles.swHeal=[row2('heal-1',.55)];
  const boss=Array.isArray(soundProfiles.boss)?soundProfiles.boss:[];if(!boss.some(r=>r.path===DIR2+'roar-1.ogg'))soundProfiles.boss=[...boss,row2('roar-1',.6)];
  stats.applied++;}
 function play(kind){try{if(typeof sound==='function')sound(kind);return true;}catch(_){stats.errors++;return false;}}
 if(on){
  try{apply();}catch(_){stats.errors++;}
  if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const result=base.apply(this,arguments);try{apply();}catch(_){stats.errors++;}return result;};}
  if(typeof sound==='function'){const base=sound;sound=function(kind,...a){let k=kind;try{if(kind==='attack'&&typeof player!=='undefined'&&player?.hero==='hunter'&&typeof soundProfiles!=='undefined'&&soundProfiles.r542Bow?.length){k='r542Bow';stats.bow++;}}catch(_){k=kind;}return base.call(this,k,...a);};}
  if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e){const fresh=!!e&&!e.deadRecorded,result=base.apply(this,arguments);
   try{if(fresh&&e.deadRecorded&&!e.boss){const t=now();if(t-lastDeath>=DEATH_GAP){lastDeath=t;stats.death++;play('r541Death');}else stats.skipped++;}}catch(_){stats.errors++;}return result;};}
 }
 // 문: R74 문이 닫힘→열림으로 바뀐 순간 한 번. 방에 처음 들어온 때의 상태는 기억만 한다.
 function tick(){if(!on)return;try{const r=typeof room!=='undefined'?room:null,W=window.__STORYWORLD_WORLD_R74__,doors=r?.exploration?.worldR74?.doors;
   if(!r||!W?.isOpen||!Array.isArray(doors)){seenRoom=null;return;}
   const first=seenRoom!==r.id,next=new Map();let opened=false;for(const d of doors){const o=!!W.isOpen(r,d);next.set(d.id,o);if(!first&&o&&seenOpen.get(d.id)===false)opened=true;}
   seenRoom=r.id;seenOpen=next;if(!opened||quiet())return;const t=now();if(t-lastDoor<DOOR_GAP){stats.skipped++;return;}lastDoor=t;stats.door++;play('r541Door');
  }catch(_){stats.errors++;}}
 if(on)try{setInterval(tick,160);}catch(_){}
 window.__STORYWORLD_SFX_R541__=Object.freeze({revision:'R542',enabled:()=>on,tick,apply,inspect:()=>({on,stats:{...stats},profiles:typeof soundProfiles!=='undefined'?Object.fromEntries(Object.keys(ROWS).map(k=>[k,(soundProfiles[k]||[]).map(r=>r.path)])):null,
  synthesized:true,recorded:false,directListeningVerified:false,existingProfilesChanged:false})});
})();
