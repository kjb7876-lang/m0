/* R541 빈 자리 효과음 (사용자 2026-11-10 "직접 녹음 말고 너가 여러 효과음 참조해서 적절하게 생성" → "소리 거슬리지 않게 개선해서 적용").
 * 기억 조각·쪽지 줍기 sound('pickup') 은 soundProfiles.pickup 이 없어 무음이었고, 몹 소멸·문 열림은 전용 소리가 없었다.
 * scripts/build-sfx-r541.py 로 합성한 부드러운 음원(느린 어택·5kHz 위 억제·낮은 피크) 5개를 게임의 sound()·SFX 조절기에
 * 프로필로만 얹는다. 자체 재생기는 만들지 않으며 기존 프로필(공격·피격·보스 등)·밸런스·저장은 건드리지 않는다.
 * 끄기: localStorage storyworld.r541.sfx = '0'. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SFX_R541__)return;
 let on=true;try{on=localStorage.getItem('storyworld.r541.sfx')!=='0';}catch(_){}
 const DIR='assets/r541/sfx/',ROWS={pickup:[['pickup-1',.55],['pickup-2',.55]],r541Death:[['death-1',.5],['death-2',.5]],r541Door:[['door-1',.6]]};
 const DEATH_GAP=600,DOOR_GAP=1500,stats={applied:0,death:0,door:0,skipped:0,errors:0};let lastDeath=-1e9,lastDoor=-1e9,seenRoom=null,seenOpen=new Map();
 const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
 const quiet=()=>typeof started!=='undefined'&&!started||typeof modal!=='undefined'&&!!modal||typeof loading!=='undefined'&&!!loading;
 function apply(){if(!on||typeof soundProfiles==='undefined'||!soundProfiles)return;
  for(const[kind,list]of Object.entries(ROWS)){if(kind==='pickup'&&soundProfiles.pickup?.length&&!soundProfiles.pickup.every(r=>r.r541))continue;
   soundProfiles[kind]=list.map(([name,gain])=>({key:'r541-'+name,path:DIR+name+'.ogg',gain,r541:true}));}
  stats.applied++;}
 function play(kind){try{if(typeof sound==='function')sound(kind);return true;}catch(_){stats.errors++;return false;}}
 if(on){
  try{apply();}catch(_){stats.errors++;}
  if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const result=base.apply(this,arguments);try{apply();}catch(_){stats.errors++;}return result;};}
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
 window.__STORYWORLD_SFX_R541__=Object.freeze({revision:'R541',enabled:()=>on,tick,apply,inspect:()=>({on,stats:{...stats},profiles:typeof soundProfiles!=='undefined'?Object.fromEntries(Object.keys(ROWS).map(k=>[k,(soundProfiles[k]||[]).map(r=>r.path)])):null,
  synthesized:true,recorded:false,directListeningVerified:false,existingProfilesChanged:false})});
})();
