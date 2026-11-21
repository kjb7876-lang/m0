// R1295 — 윤서하 전투 중 '도리도리'(사용자 2026-11-21 11:46Z "윤서하가 전투시 도리도리하는 문제 개선").
//  헤드리스 원인(qa/r1295/seoha-facing-browser.mjs A: 양옆 적 사이 5초에 화면 좌우 17번 뒤집힘):
//   영웅이 바라보는 쪽을 세 곳이 따로 '가장 가까운 적'으로 정한다.
//    ① 엔진 basicAttack — 원거리 영웅은 발마다 nearestEnemy() 로 표적을 새로 고름(직접 고른 target 이 없으면).
//    ② combat-r98 tick — 공격 모션이 끝난 사이(서하 0.51초 간격 중 약 0.27초) 3.6칸 안 가장 가까운 적을 봄(고른 표적 무시).
//    ③ play-r111 faceTick — 고른 표적 또는 4.5칸 안 가장 가까운 적을 봄.
//   무리에 밀려 양옆 적의 거리가 0.1칸씩 오가면 셋이 발마다·사이마다 다른 쪽을 골라 몸이 좌우로 계속 뒤집힌다.
//   서하는 사거리(8.1)가 길고 공격이 잦아 양옆 적이 늘 사거리 안이라 가장 잘 보였다.
//  고침(스타·워3 방식 '표적 유지'): 기본 공격을 한 적을 기억해, 살아 있고 사거리(+0.4칸) 안·시야가 열려 있으면 다음 발도 그 적을 쏘고,
//   공격 사이에도 그 적을 바라본다. 사용자가 직접 고른 표적(target)이 있으면 그것이 먼저다. 표적이 죽거나 사거리를 벗어나거나
//   1.6초 동안 기본 공격이 없으면 놓고 엔진 규칙(가장 가까운 적)으로 돌아간다. 걷는 중·돌진·스킬 모션 중엔 바라보기에 손대지 않는다.
//  피해·쿨타임·사거리는 그대로(표적만 같은 적으로). 서하 패시브 '동일 표적 세 번째 명중'과도 맞다.
//  대상: 서하(조종 영웅, 혼자 플레이). 헌터(R1102)·기억사수(R991)는 자기 조준 오버레이가 따로 몸 방향을 정해 이 규칙을 겹치면 오히려 더 뒤집혀(헌터 23번) 빼 둠.
//  끄기: localStorage storyworld.r1295.hold = {"on":false}
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_TARGET_HOLD_R1295__)return;
const REV='R1295-target-hold-1',ONLY=new Set(['seoha']),KEY='storyworld.r1295.hold',SLACK=.4,FORGET=1.6;
let prefs={on:true};const mine=p=>!!p&&ONLY.has(p.hero)&&!p.r720Ally;try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={kept:0,faced:0,released:0,errors:0};let lastError=null,hold=null;/* {id,hero,room,at} */
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const T=()=>{try{return typeof time==='number'?time:0;}catch(_){return 0;}};
const P=()=>{try{return typeof player==='object'?player:null;}catch(_){return null;}};
const solo=()=>{try{const c=window.__STORYWORLD_COOP_SIM_R62__;return !c?.mode||c.mode()==='off';}catch(_){return true;}};/* R98·R111 과 같은 기준 */
const ANG={e:0,se:Math.PI/4,s:Math.PI/2,sw:3*Math.PI/4,w:Math.PI,nw:-3*Math.PI/4,n:-Math.PI/2,ne:-Math.PI/4};
function sectorOf(dx,dy){const a=Math.atan2((dx+dy)*.5,dx-dy);let best='s',bd=Infinity;for(const k in ANG){const r=ANG[k],d=Math.abs(Math.atan2(Math.sin(a-r),Math.cos(a-r)));if(d<bd){bd=d;best=k;}}return best;}
const live=e=>!!e&&e.hp>0&&!e.deadRecorded&&(e.spawnState==null||e.spawnState==='active')&&e.visible!==false;
function heroRange(p){try{return +HEROES[p.hero]?.range||0;}catch(_){return 0;}}
function find(id){try{return (room?.enemies||[]).find(e=>e.id===id)||null;}catch(_){return null;}}
function los(p,e){try{return typeof clearLine!=='function'||clearLine(p,e);}catch(_){return true;}}
function userTarget(){try{const t=typeof target!=='undefined'?target:null;if(t==null)return null;const e=find(t);return live(e)?e:null;}catch(_){return null;}}
// 지금 유지 중인 표적(유효할 때만). 무효면 놓는다.
function held(p){if(!hold)return null;const e=find(hold.id),R=heroRange(p);
 const ok=prefs.on&&mine(p)&&hold.hero===p.hero&&hold.room===(room&&room.id)&&live(e)&&R>0&&Math.hypot(e.x-p.x,e.y-p.y)<=R+SLACK&&T()-hold.at<=FORGET&&T()>=hold.at-.001&&los(p,e);
 if(!ok){hold=null;stats.released++;return null;}return e;}
// 엔진이 이번 발에 고를 적(기록용): 직접 고른 표적 → 사거리 안 가장 가까운 적(근접은 시야까지)
function engineChoice(p){const R=heroRange(p);const u=userTarget();if(u&&Math.hypot(u.x-p.x,u.y-p.y)<=R)return u;let best=null,d=R;for(const e of (room?.enemies||[])){if(!live(e))continue;const q=Math.hypot(e.x-p.x,e.y-p.y);if(q<=d){d=q;best=e;}}return best;}
let wrappedA=false,wrappedT=false,wrappedD=false;
function wrapAttack(){if(wrappedA||typeof basicAttack!=='function')return;const base=basicAttack;
 basicAttack=function(...args){const p=P();if(!prefs.on||!mine(p)||!solo())return base.apply(this,args);
  let swapped=false,prev=null,keep=null;
  try{if(!userTarget()){keep=held(p);if(keep){prev=target;target=keep.id;swapped=true;}}}catch(e){fail(e);}
  const cd=+p.attackCD||0;let chosen=null;try{chosen=swapped?keep:engineChoice(p);}catch(e){fail(e);}
  let r;try{r=base.apply(this,args);}finally{if(swapped){try{if(target===keep.id)target=prev;}catch(e){fail(e);}}}
  try{if((+p.attackCD||0)>cd+.01&&chosen&&live(chosen)){hold={id:chosen.id,hero:p.hero,room:room&&room.id,at:T()};if(swapped)stats.kept++;}}catch(e){fail(e);}
  return r;};
 wrappedA=true;}
function wrapTick(){if(wrappedT||typeof tick!=='function')return;const base=tick;
 tick=function(...args){const r=base.apply(this,args);try{after();}catch(e){fail(e);}return r;};wrappedT=true;}
function after(){const p=P();if(!prefs.on||!mine(p)||!hold||!solo()||p.hp<=0)return;try{if((typeof modal!=='undefined'&&modal)||(typeof loading!=='undefined'&&loading))return;}catch(_){}
 if(p.moving||p.dashAnim>0||p.skillAnim>0)return;
 const u=userTarget();const e=u||held(p);if(!e)return;if(u&&hold&&u.id!==hold.id)return;/* 고른 표적이 따로 있으면 엔진·R111 에 맡김 */
 const dx=e.x-p.x,dy=e.y-p.y;if(Math.hypot(dx,dy)<.05||typeof facing!=='function')return;
 const d=facing(dx,dy);if(p.direction!==d)stats.faced++;p.direction=d;p.currentVisualSector=sectorOf(dx,dy);}
// ④ play-r113 drawHero 는 그리는 순간 '고른 표적(target) 또는 9칸 안 가장 가까운 적'으로 몸을 돌린다 → 그리는 동안만 유지 표적을 target 으로 보여 준다(읽기만 하는 구간).
function wrapDraw(){if(wrappedD||typeof drawHero!=='function')return;const base=drawHero;
 drawHero=function(...args){const p=P();let swapped=false,prev=null,keep=null;
  try{if(prefs.on&&mine(p)&&solo()&&(args[0]==null||args[0]===p)&&!p.moving&&!userTarget()){keep=held(p);if(keep){prev=target;target=keep.id;swapped=true;}}}catch(e){fail(e);}
  try{return base.apply(this,args);}finally{if(swapped){try{if(target===keep.id)target=prev;}catch(e){fail(e);}}}};
 wrappedD=true;}
function install(){try{wrapAttack();wrapTick();}catch(e){fail(e);}}
function installDraw(){try{wrapDraw();}catch(e){fail(e);}}
install();if(typeof document==='object'&&document&&document.readyState==='complete')installDraw();else if(typeof window.addEventListener==='function')window.addEventListener('load',installDraw);
if(!(wrappedA&&wrappedT)&&typeof window.addEventListener==='function')window.addEventListener('load',install);
window.__STORYWORLD_TARGET_HOLD_R1295__=Object.freeze({revision:REV,slack:SLACK,forget:FORGET,
 setPrefs:v=>{prefs={...prefs,...(v||{})};if(!prefs.on)hold=null;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};},
 /* R143 dirNow(공격 시트 방향)·다른 오버레이가 묻는 '지금 쏘는 적': 직접 고른 표적 → 유지 표적. 배치 영웅(R720) 몸이면 null */
 foe:()=>{try{const p=P();if(!prefs.on||!mine(p)||!solo())return null;const u=userTarget();if(u&&Math.hypot(u.x-p.x,u.y-p.y)<=heroRange(p)+SLACK)return u;return held(p);}catch(e){fail(e);return null;}},
 test:Object.freeze({sectorOf,held:()=>{const p=P();return p?held(p):null;},reset:()=>{hold=null;}}),
 heroes:[...ONLY],inspect:()=>({revision:REV,prefs:{...prefs},wrappedA,wrappedT,wrappedD,hold:hold?{...hold}:null,...stats,lastError,damageChanged:false})});
})();
