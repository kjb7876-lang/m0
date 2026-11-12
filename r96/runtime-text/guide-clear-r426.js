// R426 — 길잡이(자동 진행) 중 적이 보이면 확실히 처리하고 다음으로 이동(사용자 2026-11-08 "모든 길잡이 진행중에 적이보이면 적을확실하게 처리하고 다음 이동을하도록").
//  원인: 엔진 R75 길잡이(guideStep)는 지역 단계가 '집결/보스(room.engaged)'이거나 선행 조건이 남았을 때만 적을 목표로 삼고,
//   그 밖에는 눈앞에 적이 있어도 제단·포탈·문(R272·R222·R365·R261 등 덧붙인 목표)으로 걸어간다. R390 으로 적은 끝까지 쫓아오지만
//   영웅은 공격 명령(command/target)을 받지 못해 적을 끌고 다니거나 다음 지역으로 넘어갔다.
//  고침: 길잡이가 켜져 있으면 차례마다 '보이는 적'을 먼저 고른다 —
//   ① 이미 잡고 있던 적(살아 있으면 끝까지), ② 10칸 안·시야가 트인 적, ③ R390 이 '영웅을 발견했다'고 표시한 16칸 안의 적.
//   고른 적이 있으면 엔진과 같은 방식(command=target=적 id)으로 공격 명령만 주고 원래 길잡이 목표(이동)는 이번 차례 건너뛴다.
//   적이 없으면 원래 길잡이가 그대로 움직인다. 엔진 liveEnemies()(보스는 room.engaged 때만)와 숨은(hidden) 몹 규칙은 그대로 따른다.
//  막힘 방지: 같은 적을 8초 동안 다가가지도 깎지도 못하면 그 적은 15초 쉬고(벽 너머·닿을 수 없는 자리) 길잡이를 이어 간다.
//  끄기: localStorage storyworld.r426.clear = {"on":false}. 손으로 움직이면 엔진이 길잡이를 끄므로 이 오버레이도 쉰다.
(()=>{'use strict';
if(window.__STORYWORLD_GUIDE_CLEAR_R426__)return;
const REV='R426-clear-2',KEY='storyworld.r426.clear',SIGHT=10,CHASE=16,STALL=8,REST=15,EVERY=.25,CALM=2.5;
const stats={picks:0,kept:0,gaveUp:0,passes:0,yields:0,menuToggles:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')prefs={...prefs,...s};}catch(_){}
function set(p){prefs={...prefs,...(p||{})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
const visible=e=>!!e&&e.hp>0&&!e.deadRecorded&&e.spawnState!=='hidden'&&e.spawnState!=='dead'&&!e.ally&&!e.friendly;
// 순수 판단(QA 가 CPU 에서 부른다). rows=후보 적, me=영웅 위치, o={focusId,banned(Set),los(e),engaged(e),dist(a,b)}
function pick(rows,me,o={}){const dist=o.dist||((a,b)=>Math.hypot(a.x-b.x,a.y-b.y)),banned=o.banned||new Set(),max=o.max||Infinity;
 const ok=(rows||[]).filter(e=>visible(e)&&!banned.has(e.id)&&dist(me,e)<=max);
 const kept=o.focusId!=null&&ok.find(e=>e.id===o.focusId);if(kept)return{enemy:kept,why:'kept'};
 let best=null,bd=Infinity,why=null;
 for(const e of ok){const d=dist(me,e);let w=null;
  if(d<=SIGHT&&(o.los?o.los(e):true))w='sight';else if(d<=CHASE&&o.engaged&&o.engaged(e))w='engaged';
  if(w&&d<bd){best=e;bd=d;why=w;}}
 return best?{enemy:best,why}:null;}
// R801(사몽·사몽역행 헤드리스 실플레이 순회): 구역 안에서 몹이 영웅 둘레 8~14칸에 계속 생겨, 처치 수를 채운 뒤 단서만 남은 구역·탐색·미로·문이 열린 구역에서도
//  길잡이가 10칸 시야의 몹만 쫓느라 단서·문에 가지 못했다(RA-3·RB-2 처치 66/66 단서 0, P-3·P-4·S01-3 문 열린 채 30초+).
//  그런 '목표만 남은' 순간에는 붙어 싸우는 2.5칸(CALM) 안의 적만 먼저 처리하고 나머지는 길잡이 이동에 맡긴다.
//  처치 수가 남은 구역·광장(B)·코어(D)·호위(G)·물결(H)·탑(F)·버티기·이끄는 적이 산 구역·사몽 밖은 예전 그대로.
function calm(){const x=G(()=>room?.samongR103,null);if(!x||!x.zone)return false;if(x.portal)return true;
 const z=G(()=>window.__STORYWORLD_SAMONG_ZONES_R115__?.zone?.(x.zone),null);if(!z)return false;
 if(z.kind==='maze'||z.kind==='explore')return true;
 if(z.kind!=='combat'||z.mode)return false;const g=z.goal||{};if(g.hold||!g.kills)return false;if(z.lead&&(!x.leadId||x.leadAlive))return false;
 return G(()=>window.__STORYWORLD_SAMONG_R103__?.state?.()?.kills,0)>=g.kills;}
let setAt=-1e9,focus=null,focusSince=0,bestD=Infinity,bestHp=Infinity,nextAt=0,lastRoom=null;const banned=new Map();
const now=()=>G(()=>time,0);
function bannedSet(t){for(const [id,until] of banned)if(until<=t)banned.delete(id);return new Set(banned.keys());}
function choose(){const t=now();if(G(()=>room,null)!==lastRoom){lastRoom=G(()=>room,null);focus=null;banned.clear();}
 const rows=G(()=>liveEnemies(),[])||[],chase=window.__STORYWORLD_AGGRO_CHASE_R390__;
 const max=calm()?CALM:Infinity;stats.calm=max<Infinity;
 const r=pick(rows,player,{max,focusId:focus?.id,banned:bannedSet(t),dist:(a,b)=>distance(a,b),los:e=>G(()=>clearLine(player,e),false),engaged:e=>G(()=>chase?.engaged?.(e)===true,false)});
 if(!r){focus=null;return null;}
 const e=r.enemy,d=distance(player,e);
 if(focus!==e){focus=e;focusSince=t;bestD=d;bestHp=e.hp;stats.picks++;}
 else{stats.kept++;if(d<bestD-.3||e.hp<bestHp-1e-6){bestD=Math.min(bestD,d);bestHp=Math.min(bestHp,e.hp);focusSince=t;}
  else if(t-focusSince>STALL){banned.set(e.id,t+REST);stats.gaveUp++;focus=null;return choose();}}
 return e;}
try{if(typeof guideStep==='function'){const base=guideStep;guideStep=function(dt,...a){
  try{if(prefs.on&&guide&&!modal&&!loading&&player&&player.hp>0&&window.__STORYWORLD_COOP_SIM_R62__?.mode?.()!=='guest'){
   const t=now();
   // R115 반자동 비켜서기(예고 장판 피하기·원거리 물러서기)는 command 를 비우고 한 걸음 길만 둔다 — 그 걸음은 끝까지 걷게 둔다.
   if(focus&&command!==focus.id&&Array.isArray(route)&&route.length===1&&t-setAt<1.2){stats.yields++;return;}
   if(focus&&t<nextAt&&visible(focus)&&G(()=>liveEnemies().includes(focus),false)&&(!stats.calm||distance(player,focus)<=CALM)){command=focus.id;target=focus.id;setAt=t;return;}
   nextAt=t+EVERY;const e=choose();if(e){command=e.id;target=e.id;setAt=t;return;}stats.passes++;}}catch(err){fail(err);}
  return base.call(this,dt,...a);};}}catch(e){fail(e);}
// ── 기본 메뉴에 '영화 길잡이 모드' 단추(사용자 2026-11-08 "기본메뉴에 영화길잡이모드ui도 나오게") ──
//  메뉴 '진행' 묶음의 길잡이 단추 바로 뒤에 둔다(R339 묶음 메뉴가 다시 짜도 묶음 안에 있으면 그대로 둔다). 설정 창의 영화 모드 줄과 같은 스위치(R370 set).
const cine=()=>window.__STORYWORLD_CINEMA_MODE_R370__||null,cineOn=()=>G(()=>cine()?.prefs?.().on===true,false);
function menuButton(){try{const C=cine();if(!C||typeof document==='undefined')return null;const panel=document.getElementById('panel');if(!panel||!panel.querySelector('#menuClose'))return null;
 let b=document.getElementById('menuCinemaR426');
 if(!b){b=document.createElement('button');b.id='menuCinemaR426';b.type='button';b.addEventListener('click',()=>{try{const on=!cineOn();C.set({on});stats.menuToggles++;
   try{if(typeof closePanel==='function')closePanel();}catch(_){}try{if(typeof toast==='function')toast('영화 길잡이 모드 '+(on?'켬 · 길잡이가 서사를 들려주며 진행합니다':'끔'),2.2);}catch(_){}}catch(e){fail(e);}});}
 b.textContent='영화 길잡이 모드 '+(cineOn()?'끄기':'켜기');
 const g=document.getElementById('menuGuide');if(g&&g.nextElementSibling!==b)g.insertAdjacentElement('afterend',b);else if(!g&&!b.isConnected)panel.querySelector('.actions')?.appendChild(b);
 return b;}catch(e){fail(e);return null;}}
try{if(typeof showMenu==='function'){const base=showMenu;showMenu=function(...a){const r=base.apply(this,a);menuButton();try{setTimeout(menuButton,80);setTimeout(menuButton,400);}catch(_){}return r;};}}catch(e){fail(e);}
window.__STORYWORLD_GUIDE_CLEAR_R426__=Object.freeze({menuButton,revision:REV,SIGHT,CHASE,STALL,REST,CALM,calm,set,pick,visible,
 inspect:()=>({revision:REV,prefs:{...prefs},focus:focus?.id??null,banned:[...banned.keys()],stats:{...stats},lastError})});
})();
