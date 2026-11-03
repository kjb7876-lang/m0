// R241 보스 '맵을 덮는 그림 스킬' → 광역 운석 6개 — 사용자 2026-11-03 "이것처럼 맵을 완전히 덮는 이미지스킬 이상해서 없애줘 대신 광범위 운석패턴으로 바꿔줘
//  운석6개 한번에 광역으로 떨어지도록 / 떨어지는 운석들도 이펙트 가공해줘 고유색네이밍색맞게 도형느낌안나게".
// 없앤 것: R62 보스 공성(siege) — 바닥 거의 전부(최대 48칸)를 상태이상 그림(암흑 일식·과부하 도선 …)으로 덮고 작은 안전지대만 남기던 기술.
//  · R62 안쪽 순환(ownerState(e).next)과 R118 보스 순환의 'siege' 자리(window.__STORYWORLD_BOSS_FIELDS_R62__.prepare) 둘 다 막는다.
// 대신: 같은 자리에서 운석 6개가 한 번에 떨어진다(하나는 영웅 자리, 다섯은 둘레 1.8~5.6칸에 흩어짐 — 서로 1.6칸 이상 떨어짐).
//  · 예고 1.25~1.85초(운석마다 조금씩 어긋남) → 떨어진 자리 반지름 1.25칸에 한 번 피해. 피해량 = max(보스 피해×0.9, 영웅 최대 체력×6%) — R62 한 파동(4.5%)과 비슷한 무게.
//  · 그림: 원·고리·룬 같은 도형 없이 칠한 스프라이트만(연기·빛무리·불꽃·균열 — 작은 원판 orb 도 뺐다) — 땅에는 번지는 그림자와 그 보스 색 빛, 하늘에서는 불꽃 덩어리가 연기 꼬리를 끌고 비스듬히 내려오고,
//    닿는 순간 pixelfx 운석 폭발(그 보스 색으로 물듦) + 균열 + 피어오르는 연기. 색은 R114 팔레트(이름에 색이 있으면 그 색이 고유색).
//  · 보스마다 8초에 한 번(체력이 낮을수록 6초까지), 영웅이 14칸 안·시야 안일 때.
// 끄기(원래 R62 공성으로): localStorage['storyworld.r241.meteor']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_BOSS_METEOR_R241__)return;
const REV='R241-meteor-1',KEY='storyworld.r241.meteor',N=6,RAD=1.25;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={casts:0,meteors:0,blockedNative:0,drawn:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0,SPR=()=>window.__STORYWORLD_FX_SPRITES_R106__,PFX=()=>window.__STORYWORLD_PIXELFX_R163__;
const major=e=>!!e&&!e.r61Summoned&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial);
const live=e=>!!e&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active'&&e.visible!==false&&!e.disabled;
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const next=new WeakMap(),lastCast=new WeakMap(),GAP=6;let tickWrapped=false,drawWrapped=false,effWrapped=false;
// 3D 기록기에서도 보이도록 R162·R169 처럼 효과 목록에 표지 하나를 두고 drawEffect 단계에서 운석을 그린다
const SENT={type:'r241-fx',x:0,y:0,age:0,life:Infinity,r241Sentinel:true};
function armSent(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
// 그 보스 색: R114 팔레트 주색(이름색) → 그 발광색, 없으면 핏빛
function pal(e){try{const p=window.__STORYWORLD_COMBAT_R114__?.palette?.(e);if(p&&p.p)return{main:{a:p.p,b:p.gp||p.p},sub:{a:p.s||p.p,b:p.gs||p.gp||p.p}};}catch(_){}return{main:{a:[150,24,30],b:[255,150,110]},sub:{a:[70,14,20],b:[200,90,80]}};}
const dark=c=>c.map(v=>Math.round(v*.28));
function spots(){const pts=[{x:player.x+(Math.random()-.5)*.6,y:player.y+(Math.random()-.5)*.6}];let guard=0;
 while(pts.length<N&&guard++<220){const a=Math.random()*Math.PI*2,r=1.8+Math.random()*3.8,x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;
  try{if(typeof blocked==='function'&&blocked(x,y,.25,room))continue;}catch(_){continue;}if(pts.some(q=>Math.hypot(q.x-x,q.y-y)<1.6))continue;pts.push({x,y});}
 return pts;}
function cast(e){if(!on||!live(e)||typeof hazards==='undefined'||!Array.isArray(hazards))return null;const lc=lastCast.get(e);if(lc!=null&&T()-lc<GAP)return null;/* R118 순환과 자체 순환이 겹쳐도 보스마다 6초에 한 번 */lastCast.set(e,T());const P=pal(e),pts=spots(),mh=typeof maxHP==='function'?maxHP():260,dmg=Math.max((Number(e.damage)||20)*.9,mh*.06);
 const id='r241-'+(++stats.casts);
 pts.forEach((p,k)=>{const warn=1.25+k*.12+Math.random()*.1,h={id:(typeof uid==='number'?++uid:Date.now()+k),type:'meteor-r241'/* 'field' 이면 R98 바닥 고리·모이는 빛줄기, R105 보스 장판 그림이 덧그려진다(R241 스크린샷) — 피해는 엔진이 type 과 상관없이 반지름으로 준다 */,owner:e.id,x:p.x,y:p.y,radius:RAD,age:0,warning:warn,life:warn+.45,damage:dmg,lastHit:-99,r241Meteor:{cast:id,k,pal:P,seed:Math.random()*6.28,boss:e.name||''}};
  hazards.push(h);stats.meteors++;
  /* pixelfx 'meteor' 시트는 땅에 가는 타원 고리가 있고 떨어지는 운석이 겹쳐 그려져 쓰지 않는다(R241 시트 확인) */});
 armSent();try{if(typeof sound==='function')sound('boss');}catch(_){}
 return {id,count:pts.length};}
// 그림 — 도형 없이 칠한 스프라이트만
// 3D 기록기(Three)는 ctx.scope 안에서 그린 것만 옮긴다(R162·R169 와 같은 방식)
const scope=(o,fn)=>{if(typeof ctx!=='undefined'&&typeof ctx.scope==='function')ctx.scope(o,fn);else fn();};
function drawMeteor(h){scope({id:'r241:'+h.id,kind:'effect',x:h.x,y:h.y},()=>drawMeteor0(h));}
function drawMeteor0(h){const S0=SPR();if(!S0)return;/* overHero: 영웅 가림 흐리기·프레임 예산 건너뛰기에서 빼야 보인다(R169 와 같음) */const S={draw:(n,F,x,y,w,h,o={})=>S0.draw(n,F,x,y,w,h,{overHero:true,...o})};
 if(typeof project!=='function')return;const m=h.r241Meteor,q=project(h.x,h.y),H=typeof actorHeight==='function'?actorHeight():60;
 // 어두운 바닥에서도 보이게: 덧셈(빛) 그림은 그 보스 발광색 → 흰빛 쪽으로 밝힌 색, 그림자·연기는 주색을 어둡게
 const lit=c=>c.map(v=>Math.min(255,Math.round(v+(255-v)*.55))),FIRE={a:m.pal.main.b,b:lit(m.pal.main.b)},EMB={a:m.pal.sub.b,b:lit(m.pal.sub.b)},shade={a:dark(m.pal.main.a),b:dark(m.pal.main.b)},SMK={a:dark(m.pal.sub.a),b:m.pal.sub.a};
 stats.drawn++;
 if(h.age<h.warning){const u=Math.max(0,Math.min(1,h.age/h.warning)),v=u*u;
  // 땅: 번지는 그림자 + 떨어질 자리에 고이는 그 보스 색 불빛(고리·룬 없이)
  S.draw('smoke',shade,q.x,q.y,H*(1.2+1.0*u),H*(.55+.45*u),{alpha:.35+.45*u,blend:'source-over',angle:m.seed});
  S.draw('glow',FIRE,q.x,q.y-H*.05,H*(.5+.6*u),H*(.25+.3*u),{alpha:.25+.6*u});
  // 하늘: 비스듬히 내려오는 불덩이 + 연기 꼬리
  const sx=q.x+H*3.2,sy=q.y-H*7.5,mx=sx+(q.x-sx)*v,my=sy+(q.y-sy)*v,ang=Math.atan2(q.y-sy,q.x-sx);
  if(u>.08){for(let t=1;t<=4;t++){const b=Math.max(0,v-t*.06),tx=sx+(q.x-sx)*b,ty=sy+(q.y-sy)*b;S.draw('smoke',SMK,tx,ty,H*(.5+.16*t),H*(.5+.16*t),{alpha:.6-.11*t,blend:'source-over',angle:m.seed+t});}
   S.draw('flame',EMB,mx,my,H*1.1,H*2.4,{frame:Math.floor(T()*12)+m.k+2,angle:ang+Math.PI/2,alpha:.8,pivot:[.5,.2]});
   S.draw('flame',FIRE,mx,my,H*.8,H*1.8,{frame:Math.floor(T()*12)+m.k,angle:ang+Math.PI/2,alpha:1,pivot:[.5,.2]});
   S.draw('glow',FIRE,mx,my,H*1.1,H*1.1,{alpha:1});}}
 else{const v=Math.max(0,Math.min(1,(h.age-h.warning)/.45)),u=1-v;
  S.draw('crack',shade,q.x,q.y,H*2.2,H*1.1,{alpha:.95*u,angle:m.seed,blend:'source-over'});
  for(let k=0;k<6;k++){const aa=-Math.PI/2+(k-2.5)*.38+Math.sin(m.seed+k)*.12,len=H*(1.1+1.0*v)*(k===2||k===3?1.35:1);S.draw('flame',k%2?EMB:FIRE,q.x+Math.cos(aa)*H*.3*v,q.y-H*.05+Math.sin(aa)*H*.22*v,H*.8,len,{frame:Math.floor(T()*14)+k,angle:aa+Math.PI/2,alpha:u,pivot:[.5,.85]});}
  S.draw('glow',FIRE,q.x,q.y-H*.35,H*1.2,H*1.0,{alpha:u});
  S.draw('smoke',SMK,q.x,q.y-H*(.4+.8*v),H*(1.3+1.1*v),H*(1+.9*v),{alpha:.65*u,blend:'source-over',angle:m.seed});}}
// 설치: R62 공성 막기 + 같은 자리에서 운석
function install(){
 const B=window.__STORYWORLD_BOSS_FIELDS_R62__;
 if(B&&!B.__r241){window.__STORYWORLD_BOSS_FIELDS_R62__=Object.freeze({...B,__r241:true,prepare(e,...a){if(!on||!solo())return B.prepare(e,...a);return cast(e);}});}
 if(typeof tick==='function'&&!tickWrapped){tickWrapped=true;const base=tick;tick=function(dt,...a){const r=base.call(this,dt,...a);try{loop();}catch(err){fail(err);}return r;};}
 if(typeof drawHazard==='function'&&!drawWrapped){drawWrapped=true;const base=drawHazard;drawHazard=function(h,...a){if(h&&h.r241Meteor)return;/* 그림은 효과 단계에서(아래) */return base.apply(this,[h,...a]);};}
 if(typeof drawEffect==='function'&&!effWrapped){effWrapped=true;const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r241-fx'){try{for(const h of (typeof hazards!=='undefined'?hazards:[]))if(h&&h.r241Meteor)drawMeteor(h);}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}}
function loop(){if(typeof hazards!=='undefined'&&hazards.some(h=>h&&h.r241Meteor))armSent();if(!on||!solo()||typeof room!=='object'||!room?.engaged||(typeof modal!=='undefined'&&modal)||(typeof loading!=='undefined'&&loading))return;const B=window.__STORYWORLD_BOSS_FIELDS_R62__,t=T();
 for(const e of room.enemies||[]){if(!major(e)||!live(e))continue;
  try{const s=B?.ownerState?.(e);if(s&&s.next<t+30){s.next=t+1e6;stats.blockedNative++;}}catch(err){fail(err);}// R62 안쪽 공성 순환 막기
  let n=next.get(e);if(n==null){n=t+3+Math.random()*2;next.set(e,n);}if(t<n)continue;
  const d=Math.hypot(player.x-e.x,player.y-e.y);let see=d<14;try{if(see&&typeof clearLine==='function')see=clearLine(e,player);}catch(_){}
  if(!see){next.set(e,t+1);continue;}
  const rage=1-Math.max(0,Math.min(1,e.hp/Math.max(1,e.maxHp)));next.set(e,t+8-2*rage);cast(e);}}
let tries=0;(function arm(){try{install();}catch(e){fail(e);}if(++tries<60&&typeof setTimeout==='function')setTimeout(arm,250);})();
window.__STORYWORLD_BOSS_METEOR_R241__=Object.freeze({revision:REV,cast,spots,inspect:()=>({revision:REV,on,stats:{...stats},lastError}),set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
