// R352 남겨진 필드 웨이브 몹 깨우기 — 사용자 2026-11-05 "무너진성의 왼쪽끝쪽에 있는 이런 악마천사도 아까내가말한 해골병사랑 비슷해
//  그냥움직임모션만있고 공격대상이 안됨 마치 장식처럼".
//  원인: 필드 웨이브(fieldWaves6)는 '지금 웨이브 몹이 다 죽으면 다음 번호 몹을 깨운다'. 그런데 불러오기·이어하기 때 엔진이
//   지금 웨이브 번호를 '살아 있는 활성 몹의 번호'로 추정한다(index.html 불러오기 — 살아 있는 웨이브 몹이 없으면 마지막+1 = 끝난 것으로).
//   R75 무리·R74 순찰 몹은 웨이브 번호가 없어서, 추정이 늘 '끝남(2/2)'이 되고 2차 웨이브(번호 1) 몹은 hidden 인 채로 영영 깨어나지 않았다.
//   (dist00 근위의 기억 2, dist03 추격대 6, ep1a09b 6 — 헤드리스로 확인). R248 이 이 몹들을 그려서 장식처럼 보였다(R346 에서 그리기는 막음).
//  → 지금 웨이브 번호보다 앞 번호인데 아직 hidden 인 일반 몹(보스·중간보스·번호 없는 몹 제외)은 '남겨진 몹'이다.
//    영웅이 11칸 안으로 다가오면 엔진이 다음 웨이브를 깨울 때와 똑같이 깨운다(spawnState active, 0.5초 유예, 첫 공격 대기 0.8초).
//  판정·체력·피해는 엔진 그대로. 협동 손님은 하지 않는다(호스트가 깨우면 스냅숏으로 따라옴). 끄기: localStorage['storyworld.r352.waveOrphans']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_WAVE_ORPHANS_R352__)return;
const REV='R352-wave-orphans-1',KEY='storyworld.r352.waveOrphans',NEAR=11;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={woken:0,checks:0,errors:0};let lastError=null,next=0;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const guest=()=>{try{return window.__STORYWORLD_COOP_SIM_R62__?.mode?.()==='guest';}catch(_){return false;}};
const heroes=()=>{try{const c=window.__STORYWORLD_COOP_SIM_R62__,m=c?.mode?.();if(m==='host'){const l=c.livingPlayers?.();if(Array.isArray(l)&&l.length)return l;}}catch(_){}return typeof player==='object'&&player?[player]:[];};
function orphan(e,r){if(!e||!(e.hp>0)||e.spawnState!=='hidden'||e.boss||e.midboss||e.deadRecorded)return false;const i=e.fieldWaveIndex6;
 if(!Number.isInteger(i)||!Array.isArray(r.fieldWaves6))return false;const cur=Number.isInteger(r.fieldWaveIndex6)?r.fieldWaveIndex6:0;return i<cur||r.fieldWaveCleared6===true;}
function sweep(){if(!on||guest()||typeof started==='undefined'||!started||typeof room!=='object'||!room||!Array.isArray(room.enemies))return;const t=T();if(t<next&&next-t<=.5)return;/* 지역에 들어가면 time 이 0 으로 돌아간다 — 되돌아간 시간이면 바로 다시 본다 */next=t+.5;stats.checks++;
 const hs=heroes().filter(a=>a&&a.hp>0);if(!hs.length)return;
 for(const e of room.enemies){if(!orphan(e,room))continue;if(!hs.some(a=>Math.hypot(a.x-e.x,a.y-e.y)<=NEAR))continue;
  e.spawnState='active';e.graceUntil=t+.5;e.cd=.8;e.state='idle';e.r352Woken=true;stats.woken++;}}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{sweep();}catch(err){fail(err);}return r;};}
window.__STORYWORLD_WAVE_ORPHANS_R352__=Object.freeze({revision:REV,orphan:(e,r)=>orphan(e,r||room),sweep,on:()=>on,inspect:()=>({revision:REV,on,stats:{...stats},lastError}),
 set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
