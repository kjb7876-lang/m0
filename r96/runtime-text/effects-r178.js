// R178 — 무료(CC0 1.0) PVFX Foundry 프레임 애니메이션으로 영웅 기본기 연출을 덧그린다(사용자 2026-10-31 "게임 이펙트 무료로 쓸 만한 것 찾아서 적용").
//  게임 화풍(어두운 핏빛·금빛)에 맞는 것만 골라 그 색으로 물들였다(사용자 "게임 화풍에 맞게 적용될 만한 것만, 아니면 색을 바꾸던지").
//  · EGO 진입: 공명이 깨지며 터지는 초승달 조각(pvfx-resonant-break, 영웅 고유색·보조색)
//  · 세뇌당한 기억의 조각(피의 육망성 조형물)이 깨질 때: 안으로 무너짐(pvfx-void-implosion, 핏빛)
//  · 잡몹을 부를 때 균열 문(pvfx-rift-portal, combat-r170)·기억 조각 수집물을 주울 때 흩어지는 나방(pvfx-choir-moths, story-collect-r177)
//  블링크 접힘·공명 방어 문양은 기존 연출에 묻히고 깔끔한 기하 무늬가 화풍과 맞지 않아 쓰지 않는다.
//  시트는 scripts/r178-pvfx-import.py 가 assets/r163/pixelfx/pvfx-*.webp + index.json(출처·라이선스·원본 sha256)으로 만든다.
//  판정·쿨다운·피해는 건드리지 않는다. 시트가 아직 없으면 아무것도 하지 않는다. storyworld.r178.effects {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_EFFECTS_R178__)return;
const REV='R178-effects-1',KEY='storyworld.r178.effects';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={ego:0,towers:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const X=()=>window.__STORYWORLD_PIXELFX_R163__;
const pal=()=>{try{const P=window.__STORYWORLD_HERO_FX_R102__?.PALETTE;const c=P?.[player?.hero]||P?.hwando;return c?{a:c.a,b:c.b}:null;}catch(_){return null;}};
function play(name,x,y,o){if(!prefs.on)return false;const P=X();if(!P?.has?.(name))return false;P.play(name,x,y,{tint:pal()||undefined,...o});return true;}
try{
 if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e,...a){const tw=!!(e&&e.r170Tower&&!e.r178Broke);const r=base.apply(this,[e,...a]);
  try{if(tw&&e.hp<=0){e.r178Broke=true;const P=X();if(prefs.on&&P?.has?.('pvfx-void-implosion')){P.play('pvfx-void-implosion',e.x,e.y,{k:1.1,tint:{a:[100,6,16],b:[255,90,90]},z:(typeof actorHeight==='function'?actorHeight():60)*.4});stats.towers++;}}}catch(err){fail(err);}return r;};}
 if(typeof ego==='function'){const base=ego;ego=function(...a){const e0=player?.ego||0;const r=base.apply(this,a);
  try{if(player&&(player.ego||0)>e0){play('pvfx-resonant-break',player.x,player.y,{k:1.15,z:(typeof actorHeight==='function'?actorHeight():60)*.3});stats.ego++;}}catch(e){fail(e);}return r;};}
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_EFFECTS_R178__=Object.freeze({revision:REV,set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
