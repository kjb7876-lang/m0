// R165 — 부족한 이펙트 보강(사용자 2026-10-31 "부족한 이펙트 총개선, 이미 괜찮은 건 놔두고"). R163 pixelfx 시트 재생기로 그린다.
//  본편에서 공용 그림 한 장(회복 문양·터짐·십자 문양)만 잠깐 뜨던 순간만 고른다. 영웅 스킬·궁극기·막기·블링크·사몽 파동·보스 패턴처럼
//  이미 전용 연출이 있는 것은 건드리지 않는다.
//  · 레벨이 오를 때: 금빛 기둥과 별빛(level-up, 영어 글씨는 뺌) + 발밑 회복 고리
//  · 체력 회복 문양(VFX.heal)이 뜰 때(레벨업·5연타 보호막 회복): 발밑 초록 회복 고리(heal-aoe)
//  · 일반 몹이 쓰러질 때: 잿빛·핏빛 연기(poof-ash) — 몰려드는 전투에서 화면이 덮이지 않게 동시에 6개까지만
//  · 보스가 쓰러질 때: 핏빛 어둠 폭발(dark-explosion-blood, 크게)
//  · 사몽 구역의 열린 끝의 문: 청록 소용돌이 문(portal-teal, 반복) — 본편은 문이 열릴 때 십자 문양이 한 번 뜨고 끝났다
//  판정·피해·저장은 그대로. storyworld.r165.effects {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_EFFECTS_R165__)return;
const REV='R165-effects-1',KEY='storyworld.r165.effects',DEATH_MAX=6;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={levelUps:0,heals:0,deaths:0,deathSkipped:0,bossDeaths:0,portals:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const X=()=>{const x=window.__STORYWORLD_PIXELFX_R163__;return prefs.on&&x&&x.ready()?x:null;};
const T=()=>typeof time==='number'?time:0;
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
let lastLevel=null,deaths=[];
try{
 if(typeof fx==='function'){const base=fx;fx=function(type,x,y,o,...a){const r=base.call(this,type,x,y,o,...a);try{const P=X();if(P&&type==='sigil'&&o&&typeof VFX!=='undefined'&&o.asset===VFX.heal&&Number.isFinite(x+y)){P.play('heal-aoe',x,y,{k:(o.size||1)>=1.6?1.15:.8});stats.heals++;}}catch(e){fail(e);}return r;};}
 if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e,...a){const first=!!e&&!e.deadRecorded;const r=base.apply(this,[e,...a]);try{const P=X();if(P&&first&&e&&Number.isFinite(e.x+e.y)&&!e.samongR103Silent){
   if(e.boss){P.play('dark-explosion-blood',e.x,e.y,{k:1.6,rate:1.2});stats.bossDeaths++;}
   else{const t=T();deaths=deaths.filter(d=>t-d<1.4);if(deaths.length<DEATH_MAX){deaths.push(t);P.play('poof-ash',e.x,e.y,{k:.55,rate:1.3});stats.deaths++;}else stats.deathSkipped++;}}}catch(err){fail(err);}return r;};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{if(typeof player==='object'&&player){const P=X();
   if(lastLevel!=null&&player.level>lastLevel&&P&&solo()){P.play('level-up',player.x,player.y,{k:1.1});stats.levelUps++;}lastLevel=player.level;
   const x=typeof room==='object'?room?.samongR103:null;if(P&&x?.portal&&Number.isFinite(x.portal.x+x.portal.y)){const pp=P.play('portal-teal',x.portal.x,x.portal.y,{loop:true,key:'r165-portal',k:.95,until:T()+.6});if(pp&&!pp.r165Counted){pp.r165Counted=true;stats.portals++;}}}}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const r=await base.apply(this,a);deaths=[];try{lastLevel=typeof player==='object'?player?.level??null:null;}catch(_){}return r;};}
 setTimeout(()=>{try{window.__STORYWORLD_PIXELFX_R163__?.warm?.(['poof-ash','heal-aoe','level-up','portal-teal']);}catch(_){}},4000);
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_EFFECTS_R165__=Object.freeze({revision:REV,set,DEATH_MAX,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
