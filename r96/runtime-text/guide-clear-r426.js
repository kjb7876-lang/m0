// R426 — 길잡이(자동 진행) 중 적이 보이면 확실히 처리하고 다음으로 이동(사용자 2026-11-08 "모든 길잡이 진행중에 적이보이면 적을확실하게 처리하고 다음 이동을하도록").
//  원인: 엔진 R75 길잡이(guideStep)는 지역 단계가 '집결/보스(room.engaged)'이거나 선행 조건이 남았을 때만 적을 목표로 삼고,
//   그 밖에는 눈앞에 적이 있어도 제단·포탈·문(R272·R222·R365·R261 등 덧붙인 목표)으로 걸어간다. R390 으로 적은 끝까지 쫓아오지만
//   영웅은 공격 명령(command/target)을 받지 못해 적을 끌고 다니거나 다음 지역으로 넘어갔다.
//  고침: 길잡이가 켜져 있으면 차례마다 '보이는 적'을 먼저 고른다 —
//   ① 이미 잡고 있던 적(살아 있으면 끝까지), ② 10칸 안·시야가 트인 적, ③ R390 이 '영웅을 발견했다'고 표시한 16칸 안의 적.
//   고른 적이 있으면 엔진과 같은 방식(command=target=적 id)으로 공격 명령만 주고 원래 길잡이 목표(이동)는 이번 차례 건너뛴다.
//   적이 없으면 원래 길잡이가 그대로 움직인다. 엔진 liveEnemies()(보스는 room.engaged 때만)와 숨은(hidden) 몹 규칙은 그대로 따른다.
//  막힘 방지: 같은 적을 8초 동안 다가가지도 깎지도 못하면 그 적은 15초 쉬고(벽 너머·닿을 수 없는 자리) 길잡이를 이어 간다.
//  R441(사용자 2026-11-09 "모든 몹을 제거하고 올라가는 게 아니라 가는 길에 몹이 있으면 그 몹들을 다 잡고 이동 … 굳이 구석에 있는 몹까지 다잡지 말고"):
//   원인: R75 길잡이는 선행 조건(prerequisites3 = 필드 적 전멸)이 남아 있으면 '가장 가까운 적'을 지역 어디든 찾아가 목표로 삼았다.
//   그런데 R78/R81 두 갈래 길 맵과 병원(ep1a08)은 '경로(route)' 단계에서 중앙 집결실에 들어서면 살아 있는 필드 적을 모두 집결실로 불러 모은다 —
//   구석 몹을 미리 잡으러 갈 까닭이 없다. 고침: 그 단계에서는 길잡이 목적지를 중앙 집결실로 두고,
//   ② '보이는 적'도 목적지까지 가는 길(findPath) 둘레 LANE 칸 안이거나 영웅 NEAR 칸 안일 때만 고른다. 영웅을 발견해 쫓아오는 적(③)·이미 잡던 적(①)은 그대로 잡는다.
//   적이 없으면 집결실로 걸어간다(R272 wardRoute 와 같은 길). 집결 뒤·보스전·물결(wave) 맵처럼 전멸이 진짜 조건인 곳은 예전 그대로 다 잡는다.
//   끄기(이 부분만): localStorage storyworld.r426.clear = {"path":false}.
//  끄기: localStorage storyworld.r426.clear = {"on":false}. 손으로 움직이면 엔진이 길잡이를 끄므로 이 오버레이도 쉰다.
(()=>{'use strict';
if(window.__STORYWORLD_GUIDE_CLEAR_R426__)return;
const REV='R426-clear-2-R441',KEY='storyworld.r426.clear',NEAR=4.5,LANE=3.2,AHEAD=36,SIGHT=10,CHASE=16,STALL=8,REST=15,EVERY=.25;
const stats={picks:0,kept:0,gaveUp:0,passes:0,yields:0,menuToggles:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
let prefs={on:true,path:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')prefs={...prefs,...s};}catch(_){}
function set(p){prefs={...prefs,...(p||{})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
const visible=e=>!!e&&e.hp>0&&!e.deadRecorded&&e.spawnState!=='hidden'&&e.spawnState!=='dead'&&!e.ally&&!e.friendly;
// 순수 판단(QA 가 CPU 에서 부른다). rows=후보 적, me=영웅 위치, o={focusId,banned(Set),los(e),engaged(e),dist(a,b)}
function pick(rows,me,o={}){const dist=o.dist||((a,b)=>Math.hypot(a.x-b.x,a.y-b.y)),banned=o.banned||new Set();
 const ok=(rows||[]).filter(e=>visible(e)&&!banned.has(e.id));
 const kept=o.focusId!=null&&ok.find(e=>e.id===o.focusId);if(kept)return{enemy:kept,why:'kept'};
 let best=null,bd=Infinity,why=null;
 for(const e of ok){const d=dist(me,e);let w=null;
  if(d<=SIGHT&&(o.los?o.los(e):true)&&(o.near?o.near(e,d):true))w='sight';else if(d<=CHASE&&o.engaged&&o.engaged(e))w='engaged';
  if(w&&d<bd){best=e;bd=d;why=w;}}
 return best?{enemy:best,why}:null;}
// ── R441: 가는 길 판단 ──
// 순수(QA 가 CPU 에서 부른다): 점 p 에서 꺾은선 pts(앞쪽 ahead 칸까지)까지 거리.
function laneDist(p,pts,ahead=AHEAD){if(!Array.isArray(pts)||!pts.length)return Infinity;let best=Math.hypot(p.x-pts[0].x,p.y-pts[0].y),run=0;
 for(let i=1;i<pts.length&&run<=ahead;i++){const a=pts[i-1],b=pts[i],dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy;let t=L2>0?((p.x-a.x)*dx+(p.y-a.y)*dy)/L2:0;t=Math.max(0,Math.min(1,t));
  best=Math.min(best,Math.hypot(p.x-(a.x+dx*t),p.y-(a.y+dy*t)));run+=Math.sqrt(L2);}return best;}
// 순수: 이 적이 '가는 길'에 있는가. me=영웅, d=영웅과 거리, pts=영웅→목적지 길(없으면 목적지까지 직선).
function onPath(e,me,d,pts,dest){if(d<=NEAR)return true;const line=Array.isArray(pts)&&pts.length?[me,...pts]:dest?[me,dest]:null;if(!line)return true;return laneDist(e,line)<=LANE;}
// 지금 '중앙 집결실로 가는 길' 단계인가 → 목적지(없으면 null = 예전처럼 보이는 적 모두).
function rallyDest(){try{if(!prefs.path||typeof room==='undefined'||!room||room.egoVisitId151||room.samongR103||room.engaged)return null;
  if(room.id==='ep1a08'){const ph=window.__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__?.inspect?.()?.state?.phase,m=window.__STORYWORLD_HOSPITAL_MAZE_LAYOUT__?.merge;
   return ph==='route'&&m&&Number.isFinite(m.x+m.y)?{x:m.x,y:m.y,r:Math.max(1.5,(m.radius||3)*.6),kind:'hospital'}:null;}
  const C=window.__STORYWORLD_WORLD_COMBAT_R78__,g=room.exploration?.worldWardR81?.gatherAnchor;if(!C?.controlled?.(room)||!g||!Number.isFinite(g.x+g.y))return null;
  return C.state?.(room)?.phase==='route'?{x:g.x,y:g.y,r:4.5,kind:'ward'}:null;}catch(e){fail(e);return null;}}
let pInfo={at:-1e9,room:null,dest:null,pts:null},routeAt=null;
function pathInfo(t){const dest=rallyDest();if(!dest){pInfo={at:t,room:null,dest:null,pts:null};return pInfo;}
 if(pInfo.room===room&&pInfo.dest&&pInfo.dest.x===dest.x&&pInfo.dest.y===dest.y&&t-pInfo.at<1)return pInfo;
 let pts=null;try{pts=findPath(player,dest,room,.31);}catch(_){pts=null;}stats.paths=(stats.paths||0)+1;
 pInfo={at:t,room,dest,pts:Array.isArray(pts)&&pts.length?pts.map(q=>({x:q.x,y:q.y})):null};return pInfo;}
let setAt=-1e9,focus=null,focusSince=0,bestD=Infinity,bestHp=Infinity,nextAt=0,lastRoom=null;const banned=new Map();
const now=()=>G(()=>time,0);
function bannedSet(t){for(const [id,until] of banned)if(until<=t)banned.delete(id);return new Set(banned.keys());}
function choose(){const t=now();if(G(()=>room,null)!==lastRoom){lastRoom=G(()=>room,null);focus=null;banned.clear();}
 const rows=G(()=>liveEnemies(),[])||[],chase=window.__STORYWORLD_AGGRO_CHASE_R390__;
 const P=pathInfo(t),near=P.dest?(e,d)=>{const y=onPath(e,player,d,P.pts,P.dest);if(!y)stats.skippedOffPath=(stats.skippedOffPath||0)+1;return y;}:null;
 const r=pick(rows,player,{focusId:focus?.id,banned:bannedSet(t),dist:(a,b)=>distance(a,b),los:e=>G(()=>clearLine(player,e),false),engaged:e=>G(()=>chase?.engaged?.(e)===true,false),near});
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
   if(focus&&t<nextAt&&visible(focus)&&G(()=>liveEnemies().includes(focus),false)){command=focus.id;target=focus.id;setAt=t;return;}
   nextAt=t+EVERY;const e=choose();if(e){command=e.id;target=e.id;setAt=t;return;}stats.passes++;
   // R441: 길 위에 적이 없으면 구석 몹을 찾아가지 않고 중앙 집결실로 간다(들어서면 남은 필드 적이 모두 모인다).
   const P=pInfo.dest?pInfo:pathInfo(t);if(P.dest&&P.pts&&Math.hypot(player.x-P.dest.x,player.y-P.dest.y)>P.dest.r){command=null;if(P.at!==routeAt||!Array.isArray(route)||!route.length){routeAt=P.at;route=P.pts.map(q=>({x:q.x,y:q.y}));stats.toRally=(stats.toRally||0)+1;}return;}}}catch(err){fail(err);}
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
window.__STORYWORLD_GUIDE_CLEAR_R426__=Object.freeze({menuButton,revision:REV,NEAR,LANE,AHEAD,laneDist,onPath,rallyDest,SIGHT,CHASE,STALL,REST,set,pick,visible,
 inspect:()=>({revision:REV,prefs:{...prefs},focus:focus?.id??null,banned:[...banned.keys()],stats:{...stats},lastError})});
})();
