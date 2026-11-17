/* R787 영웅별 스킬 사용 효과음 (사용자 2026-11-12 "영웅들마다 고유 피격·스킬사용·공격 효과음을 일레븐랩스로 생성해서 적용").
 * 전에는 W/E/R 스킬이 모두 엔진 sound('special') 하나(R546 영웅별 소리)였다. 영웅 8명 × 스킬 W/E/R 24종마다 ElevenLabs 로 새로 만든 고유 소리
 * (scripts/build-sfx-r787.py, 슬롯마다 변주 3개)를 얹고, 활 시위가 따로 없던 헌터의 평타도 고유 소리로 바꾼다. 영웅 피격(R544)·평타(R546)·Q 고유기(R546)는 이미 영웅별 소리라 그대로 둔다.
 *  - window.__STORYWORLD_WER__.cast 를 감싸 cast 하는 동안(동기)만 '지금 영웅·슬롯'을 기억하고, 그 안에서 나는 sound('special') 의 종류만 r787Sk_<영웅>_<w|e|r> 로 바꾼다.
 *    cast 가 거절되거나 끝난 뒤에 나는 special(적 신호·소환 등)은 건드리지 않는다. 스킬 판정·재사용 대기·저장은 손대지 않는다.
 *  - 새 종류는 쾌적 계층(__STORYWORLD_SFX_COMFORT__)에 special/attack 별칭으로 올려 역할 배율·종류별 쿨다운·동시 음수 제한을 그대로 따른다.
 *  - 처음 쓰는 파일이 내려받는 동안 첫 소리가 빠지지 않게 지금 영웅의 파일을 미리 해독해 둔다(영웅이 바뀔 때마다 한 번).
 * 끄기: localStorage storyworld.r787.sfx = '0'. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SFX_R787__)return;
 let on=true;try{on=localStorage.getItem('storyworld.r787.sfx')!=='0';}catch(_){}
 const DIR='assets/r787/sfx/',HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'],SLOTS=['w','e','r'],GAIN=.8,ATK_GAIN=.7,N=3;
 const stats={mapped:0,late:0,direct:0,atk:0,passed:0,wrapped:0,warmed:0,errors:0};let curSlot=null,pending=null,depth=0;const LATE_MS=600,WAIT_MS=140;
 const nowMs=()=>{try{return performance.now();}catch(_){return Date.now();}};
 const rows=(prefix,gain)=>Array.from({length:N},(_,i)=>({key:'r787-'+prefix+'-'+(i+1),path:DIR+prefix+'-'+(i+1)+'.ogg',gain,r541:true}));
 function apply(){if(!on||typeof soundProfiles==='undefined'||!soundProfiles)return;
  const C=window.__STORYWORLD_SFX_COMFORT__,al=C&&C.aliases;
  for(const h of HEROES)for(const s of SLOTS){const k='r787Sk_'+h+'_'+s;soundProfiles[k]=rows('sk-'+h+'-'+s,GAIN);if(al)al[k]='special';}
  soundProfiles.r787Atk_hunter=rows('atk-hunter',ATK_GAIN);if(al)al.r787Atk_hunter='attack';}
 const hero=()=>{try{return typeof player!=='undefined'&&player?player.hero:null;}catch(_){return null;}};
 let warmedFor=null;function warm(){try{if(!on||typeof audioBuffer!=='function'||typeof soundProfiles==='undefined'||!audioUnlocked)return;const h=hero();if(!h||!HEROES.includes(h)||warmedFor===h)return;warmedFor=h;
  const ks=SLOTS.map(s=>'r787Sk_'+h+'_'+s);if(h==='hunter')ks.push('r787Atk_hunter');
  for(const k of ks)for(const r of soundProfiles[k]||[])try{Promise.resolve(audioBuffer(r.path)).catch(()=>{});}catch(_){}stats.warmed++;}catch(_){stats.errors++;}}
 // WER.cast 감싸기: 뒤에 오는 오버레이가 WER 를 다시 펼쳐 만들어도 cast 사슬에 남도록, 새로 바뀐 객체마다 한 번씩 확인한다.
 function wrapWER(){try{const W=window.__STORYWORLD_WER__;if(!W||typeof W.cast!=='function'||W.cast.__r787)return;const base=W.cast;
  const cast=function(slot,...a){if(depth>0)return base.call(this,slot,...a); // 사슬에 내 감싸기가 겹쳐 있어도 가장 바깥 하나만 일한다
   const h=hero(),s=String(slot).toLowerCase(),prev=curSlot,cs=h&&HEROES.includes(h)&&SLOTS.includes(s)?{hero:h,slot:s,used:false}:null;curSlot=cs;depth++;let res;try{res=base.call(this,slot,...a);}finally{depth--;curSlot=prev;}
   // 기억사수(R561)처럼 cast 안에서는 special 을 내지 않는 스킬: 곧 이어 나는 special 을 한 번 받아 주고, 끝내 없으면 짧게 기다린 뒤 직접 한 번 낸다.
   if(cs&&res&&!cs.used){const tok={hero:cs.hero,slot:cs.slot,until:nowMs()+LATE_MS};pending=tok;try{setTimeout(()=>{if(pending===tok){pending=null;stats.direct++;try{sound('r787Sk_'+tok.hero+'_'+tok.slot);}catch(_){stats.errors++;}}},WAIT_MS);}catch(_){}}
   return res;};
  cast.__r787=true;window.__STORYWORLD_WER__=Object.freeze({...W,cast});stats.wrapped++;}catch(_){stats.errors++;}}
 if(on){
  try{apply();}catch(_){stats.errors++;}
  wrapWER();try{setInterval(()=>{wrapWER();warm();},1000);}catch(_){}
  if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const r=base.apply(this,arguments);try{apply();}catch(_){stats.errors++;}return r;};}
  if(typeof sound==='function'){const base=sound;sound=function(kind,...a){let k=kind;
   try{if(kind==='special'&&curSlot){const m='r787Sk_'+curSlot.hero+'_'+curSlot.slot;if(soundProfiles[m]?.length){k=m;curSlot.used=true;stats.mapped++;}}
    else if(kind==='special'&&pending){const t=pending;pending=null;const m='r787Sk_'+t.hero+'_'+t.slot;if(nowMs()<=t.until&&soundProfiles[m]?.length){k=m;stats.late++;}}
    else if(kind==='attack'&&hero()==='hunter'&&soundProfiles.r787Atk_hunter?.length){k='r787Atk_hunter';stats.atk++;}}catch(_){stats.errors++;k=kind;}
   if(k!==kind)stats.passed++;return base.call(this,k,...a);};}
 }
 window.__STORYWORLD_SFX_R787__=Object.freeze({revision:'R787',enabled:()=>on,apply,heroes:HEROES,slots:SLOTS,wrap:wrapWER,inspect:()=>({on,stats:{...stats},current:curSlot,profiles:typeof soundProfiles==='undefined'?null:Object.fromEntries(Object.keys(soundProfiles).filter(k=>/^r787/.test(k)).map(k=>[k,soundProfiles[k].length])),generated:'ElevenLabs text-to-sound v2 (2026-11-12), scripts/build-sfx-r787.py'})});
})();
