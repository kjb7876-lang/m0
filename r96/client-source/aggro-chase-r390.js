// R390 — 한 번 영웅을 발견한 적은 쓰러질 때까지 쫓아온다(사용자 2026-11-07 "적이 영웅을 한번 발견하여 공격모드로 들어가면 소멸되기 전까지 영웅을 쫓아공격하도록").
//  엔진 AI 는 적이 공격 거리(combatProfile.aggro) 밖이거나, 무리(explorationGroup) 적이 7.15칸 넘게 떨어지거나 영웅이 무리 자리에서 목줄(explorationLeash)
//  밖으로 나가면 제자리로 돌아가 서성인다. 예외는 R74/R75 의 pursuing(e)(경보 12초·제자리 32~36칸 안)뿐이다.
//  → 같은 pursuing(e) 자리에 덧붙여, '발견'한 적은 살아 있는 동안 늘 true 를 돌려준다(시간·거리 한도 없음).
//  발견 = 엔진이 그 적을 실제로 싸움에 넣는 조건(공격 거리 안 + 무리 한도 안)을 처음 만족했을 때, 원래 pursuing 이 true 였을 때,
//         영웅에게 맞았을 때(hitEnemy), 그 적이 영웅을 때렸을 때(hurt 의 source). 숨은 적·다른 방의 적은 아니다.
//  지역을 떠나면(다른 room) 표시는 그 적 객체에 남지만 그 방에서만 뜻이 있다. 끄기: localStorage storyworld.r390.chase {"on":false}.
(()=>{'use strict';
if(window.__STORYWORLD_AGGRO_CHASE_R390__)return;
const REV='R390-chase-1',KEY='storyworld.r390.chase',TICK=250,GROUP_D=7.15;
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={spotted:0,hitSpotted:0,hurtSpotted:0,wrapped:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const live=e=>!!e&&e.hp>0&&!e.deadRecorded&&!['hidden','inactive','disabled','despawned','dead'].includes(e.spawnState);
const inRoom=e=>{const r=G(()=>room,null);return !!r&&(r.enemies||[]).includes(e);};
const engaged=e=>prefs.on&&live(e)&&e.r390Engaged===G(()=>room,null)&&inRoom(e);
function mark(e,why){if(!prefs.on||!live(e)||!inRoom(e))return;const r=G(()=>room,null);if(e.r390Engaged===r)return;e.r390Engaged=r;stats[why]++;}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
// 엔진 AI 가 싸움에 넣는 조건과 같은 판정
// 엔진은 d>aggro 일 때만 싸움에서 뺀다 → aggro 가 숫자가 아니면(비교가 거짓) 늘 싸움 쪽.
function wouldFight(e,p){const d=dist(e,p),ag=Number(e.combatProfile?.aggro);if(Number.isFinite(ag)&&d>ag)return false;
 if(e.explorationGroup){if(d>GROUP_D)return false;const L=Number(e.explorationLeash);if(Number.isFinite(L)&&Number.isFinite(e.homeX)&&Math.hypot(p.x-e.homeX,p.y-e.homeY)>L)return false;}return true;}
// R74 pursuing 감싸기(R75 등이 객체를 바꿔 끼우면 다시 감싼다)
let base=null;
function wrap(){const W=window.__STORYWORLD_WORLD_R74__;if(!W||W.__r390||typeof W.pursuing!=='function')return;const orig=W.pursuing;base=orig;
 try{window.__STORYWORLD_WORLD_R74__=Object.freeze({...W,__r390:true,pursuing(e){let v=false;try{v=orig.call(W,e);}catch(err){fail(err);}
   try{if(v){mark(e,'spotted');return true;}if(engaged(e))return true;}catch(err){fail(err);}return v;}});stats.wrapped++;}catch(err){fail(err);}}
wrap();
setInterval(()=>{try{wrap();if(!prefs.on)return;if(!G(()=>started,false)||G(()=>loading,false))return;const r=G(()=>room,null),p=G(()=>player,null);if(!r||!p||!(p.hp>0))return;
 for(const e of r.enemies||[]){if(!live(e)||e.r390Engaged===r)continue;if(wouldFight(e,p))mark(e,'spotted');}}catch(e){fail(e);}},TICK);
try{if(typeof hitEnemy==='function'){const b=hitEnemy;hitEnemy=function(e,...a){try{mark(e,'hitSpotted');}catch(err){fail(err);}return b.call(this,e,...a);};}}catch(e){fail(e);}
try{if(typeof hurt==='function'){const b=hurt;hurt=function(v,source,...a){try{const r=G(()=>room,null);if(source&&r){const own=source.owner??source.attacker??source.enemy,id=typeof own==='string'?own:own?.id??source.ownerId??source.enemyId;
   const e=(r.enemies||[]).includes(source)?source:(r.enemies||[]).find(x=>x&&(x===own||typeof id==='string'&&x.id===id));if(e)mark(e,'hurtSpotted');}}catch(err){fail(err);}return b.call(this,v,source,...a);};}}catch(e){fail(e);}
function set(p={}){if(typeof p.on==='boolean'){prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}return{...prefs};}
window.__STORYWORLD_AGGRO_CHASE_R390__=Object.freeze({revision:REV,set,engaged,wouldFight,
 inspect:()=>{const r=G(()=>room,null);return{revision:REV,prefs:{...prefs},wrapped:!!window.__STORYWORLD_WORLD_R74__?.__r390,engaged:(r?.enemies||[]).filter(engaged).length,stats:{...stats},lastError};}});
})();
