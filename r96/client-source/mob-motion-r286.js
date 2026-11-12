// R286 그림 동작이 모자란 몹의 전투 연출 채우기 — 사용자 2026-11-04 "공격모션만있는 몹은 공격모션하면서 돌진이동(기모은다음)혹은 블링크해서 간접공격및
//  간접원거리로 부족한모션 채워주고 이동모션만있는 적은 원거리형태로 만들거나 공격모션대신 좌우 및 앞으로 이동하는모션으로 근접부족한거 채워주는형태로".
//  몹마다 실제로 쓰이는 그림 묶음을 엔진 사슬과 같은 순서로 본다: 보스·중간보스·페르소나 = 손대지 않음, R193 인형·탑 = 한 장,
//   R200 잔영·R208/R223 드라이브 스트립·R248 고유 시트 = 이동+공격(완전), 그 밖은 R109 표(R92 이동·공격 + R109 이동 + R116 맞음·대기 + R198 빈칸)의 move/attack 유무.
//   분류: full(둘 다) · attack-only(공격 칸만) · move-only(이동 칸만) · idle-only(대기 칸만) · static(한 장). 전수표는 r96/qa/r286/r286-cpu-check.cjs.
//  ① attack-only 몹(걸을 때 한 장이 미끄러지던 몹): 영웅을 쫓는 중(공격 거리+0.6 ~ 7칸, 시야 열림)이면 2.2초마다
//     0.45초 '기 모으기'(제자리, 공격 칸 준비 동작 + 핏빛 빛이 몸으로 모임) → 0.24초 돌진(공격 칸 휘두르는 동작, 지나간 자리에 연기, 끝에 땅 갈라짐).
//     돌진 길이 최대 3.2칸, 영웅 앞 공격 거리×0.8 에서 멈춘다. 길이 막혔으면 같은 자리로 블링크(R230/R268 과 같은 어둠 수축), 그 자리도 막혔으면 하지 않는다.
//     기를 다 모은 순간 6.6초에 한 번 간접 원거리 한 발(엔진 enemyShot, 피해 = 그 몹 근접 피해 e.damage × 0.66).
//  ② move-only 몹(공격 때 한 장/대기 칸으로 멈춰 있던 몹):
//     · 근접 공격(엔진 e.attack) 동안 그릴 때만 이동 칸으로 '옆걸음 → 앞으로 찌르듯 내딛기 → 제자리'(좌우 번갈아, 최대 0.3칸 옆·0.42칸 앞).
//       판정·피해·시간은 엔진 그대로(공격 시작 때 찍힌 origin154·footprint154 로 맞힌다) — 그림 자리만 옮긴다.
//     · 원거리형: 영웅이 3~6.5칸이면 6.6초에 한 번 0.5초 겨누기(옆으로 흔들리는 이동 칸 + 빛) 뒤 한 발(e.damage × 0.66). 원래 원거리·혼합형(e.ai ranged/hybrid)은 제 사격만.
//  공통: 병원(ep1a08, 전용 자세 R51~R53)·혼자 플레이가 아닐 때·보스류·고정형은 하지 않는다. 동시에 3마리까지. 엔진이 공격을 시작하면 즉시 그만둔다.
//  R268(시선 맞추기)은 이 동작 중인 몹을 건드리지 않게 r230At 를 찍는다. R280(갇힌 적)·R275(화면 밖 건너뛰기)와 겹치지 않는다(자리만, 공격 중에는 안 함).
//  끄기: localStorage['storyworld.r286.motion']='{"on":false}' (전부) · '{"charge":false}'(①) · '{"lunge":false}'(② 근접) · '{"shots":false}'(간접 사격)
(()=>{'use strict';
if(window.__STORYWORLD_MOB_MOTION_R286__)return;
const REV='R286-motion-2',KEY='storyworld.r286.motion';
const CHARGE=.45,DASH=.24,DASH_GAP=2.2,MAXDASH=3.2,BLINK_MAX=4.6,AIM=.5,SHOT_K=.66,SHOT_GAP=6.6,SHOT_SPEED=4.6,MAXLIVE=3,RAD=.3,SIDE=.3,REACH=.42;
const ART_MOVE=Object.freeze(['assets/r105/drive/mob-paper-figure.webp']);// R109 index 의 art 이동 줄(R110) — QA 가 index 와 맞는지 본다
let prefs={on:true,charge:true,lunge:true,shots:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={charges:0,dashes:0,blinks:0,blocked:0,shots:0,shotFails:0,aims:0,lunges:0,cancels:0,classified:{},errors:0};let lastError=null,last=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const G=n=>{try{return Function('return typeof '+n+"!=='undefined'?"+n+':undefined')();}catch(_){return undefined;}};
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.samongBoss||e.combatProfile?.major||/중간보스/.test(String(e.name||''))));
const fixed=e=>!!(e.stationary||e.r170Tower||e.turret||e.rooted||e.immobile||e.r251Circle);
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const hospital=()=>{try{return G('zone')==='ep1a08';}catch(_){return false;}};
// ---- 분류(순수: QA 가 같은 함수를 쓴다) ----
function classifyTrack(t){if(!t)return 'static';const m=!!t.move,a=!!t.attack;return m&&a?'full':a?'attack-only':m?'move-only':t.idle?'idle-only':'static';}
function r248Sheet(e){try{const U=window.__STORYWORLD_MOB_UNIQUE_R248__;if(!U?.sheetFor||U.inspect?.().prefs?.on===false||!solo())return null;return U.sheetFor(e)||null;}catch(_){return null;}}
function kindNow(e){if(!e)return null;if(major(e))return 'major';if(e.r193Doll||fixed(e))return 'static';if(e.r200Shade||e.r208Mob)return 'full';
 try{const S=window.__STORYWORLD_STORY_MOBS_R208__;if(S?.assign&&S.assign(e))return 'full';}catch(_){}
 if(r248Sheet(e))return 'full';
 let art=null;try{art=window.__STORYWORLD_DRIVE_ART_R105__?.artFor?.(e)||null;}catch(_){}
 if(art)return ART_MOVE.includes(String(art).replace(/^\.\//,''))?'move-only':'static';
 const M=window.__STORYWORLD_MOBS_R109__;if(!M?.trackFor)return null;let t=null;try{t=M.trackFor(e);}catch(_){return null;}
 if(!t){try{if(M.inspect?.().state!=='ready')return null;}catch(_){return null;}}
 return classifyTrack(t);}
const kinds=new WeakMap();
function kindOf(e){const c=kinds.get(e),now=T();if(c&&c.name===e.name&&now-c.at<3&&now>=c.at)return c.k;const k=kindNow(e);if(k){kinds.set(e,{k,name:e.name,at:now});}return k;}
// ---- 자리·연출 도우미 ----
function free(x,y){try{if(typeof blocked==='function'&&blocked(x,y,RAD,room))return false;return true;}catch(_){return false;}}
function sees(x,y){try{return typeof clearLine!=='function'||!!clearLine({x,y},player);}catch(_){return false;}}
function pathFree(fx,fy,tx,ty){const n=Math.max(2,Math.ceil(Math.hypot(tx-fx,ty-fy)/.2));for(let i=1;i<=n;i++){const u=i/n;if(!free(fx+(tx-fx)*u,fy+(ty-fy)*u))return false;}return true;}
const BLOOD={a:[70,6,10],b:[220,70,52]};
function pfx(name,x,y,o){try{const P=window.__STORYWORLD_PIXELFX_R163__;if(P?.has?.(name))P.play(name,x,y,o);}catch(_){}}
const puff=(x,y,d)=>pfx('pvfx-void-implosion',x,y,{k:.55,delay:d||0,tint:{a:[40,10,30],b:[150,90,170]}});
const smoke=(x,y)=>pfx('pvfx-void-implosion',x,y,{k:.3,tint:{a:[30,12,22],b:[110,60,80]}});
const crack=(x,y)=>pfx('pvfx-earth-rupture',x,y,{k:.45,tint:BLOOD});
function face(e){try{if(typeof facing==='function'){const d=facing(player.x-e.x,player.y-e.y);e.direction=d==='front'||d==='back'?((player.x-player.y)<(e.x-e.y)?'left':'right'):d;}}catch(_){}}
const shapeOf=e=>e.combatProfile?.attackShape||{};
const rangeOf=e=>Number(shapeOf(e).range)||Number(e.range)||1.2;
const aimAt=e=>Math.atan2(player.y-.15-e.y,player.x-e.x);
// 간접 원거리 한 발: 엔진 enemyShot(그림·충돌·hurt 는 엔진). 막히면(R54 canPrepare 등) 엔진 makeShot 으로 같은 탄을 낸다.
function fire(e){if(!prefs.shots)return false;const dmg=(Number(e.damage)||0)*SHOT_K;if(!(dmg>0))return false;const a=aimAt(e);let s=null;
 try{if(typeof enemyShot==='function')s=enemyShot(e,a,SHOT_SPEED,dmg,{scale:.62,r286Indirect:true});}catch(err){fail(err);}
 if(!s){try{if(typeof makeShot==='function')s=makeShot(e.x,e.y,a,SHOT_SPEED,dmg,{owner:e.id,scale:.62*1.4,radius:.14*1.25,r286Indirect:true});}catch(err){fail(err);}}
 if(s){stats.shots++;e.r286Shots=(e.r286Shots||0)+1;}else stats.shotFails++;return !!s;}
// ---- 상태 기계 ----
const S=e=>e.r286||(e.r286={mode:null,t0:0,nextDash:T()+hash(e.id)*DASH_GAP,nextShot:T()+1.5+hash(e.id+'s')*SHOT_GAP,side:hash(e.id)<.5?1:-1});
function live(){let n=0;for(const e of room?.enemies||[])if(e?.r286?.mode)n++;return n;}
function stop(e,s,why){s.mode=null;s.fake=null;if(why)stats.cancels++;}
function startCharge(e,s,now){s.mode='charge';s.t0=now;s.hx=e.x;s.hy=e.y;s.shoot=prefs.shots&&now>=s.nextShot;face(e);e.r230At=now;stats.charges++;}
function planDash(e,s,now){const d=Math.hypot(player.x-e.x,player.y-e.y);if(!(d>.01)){stop(e,s);return;}
 const want=Math.max(.9,rangeOf(e)*.8),travel=Math.min(MAXDASH,d-want);if(!(travel>.25)){stop(e,s);return;}
 const ux=(player.x-e.x)/d,uy=(player.y-e.y)/d,tx=e.x+ux*travel,ty=e.y+uy*travel,from=[+e.x.toFixed(2),+e.y.toFixed(2)];
 if(pathFree(e.x,e.y,tx,ty)){s.mode='dash';s.t0=now;s.fx=e.x;s.fy=e.y;s.tx=tx;s.ty=ty;s.trail=0;stats.dashes++;last={id:e.nativeId||e.id,kind:'dash',from,to:[+tx.toFixed(2),+ty.toFixed(2)]};return;}
 if(travel<=BLINK_MAX&&free(tx,ty)&&sees(tx,ty)){puff(e.x,e.y);e.x=tx;e.y=ty;e.nav=[];puff(tx,ty,.06);face(e);crack(tx,ty);stats.blinks++;last={id:e.nativeId||e.id,kind:'blink',from,to:[+tx.toFixed(2),+ty.toFixed(2)]};}
 else stats.blocked++;
 s.nextDash=now+DASH_GAP+hash(e.id+now)*.6;stop(e,s);}
function advance(e,s,now){
 if(!(e.hp>0)||e.attack||e.rangedWindup>0||e.r268Dash||e.spawnState!=='active'){if(s.mode==='charge'||s.mode==='aim'){s.nextDash=now+DASH_GAP;}stop(e,s,true);return;}
 const age=now-s.t0;if(age<0){stop(e,s,true);return;}
 if(s.mode==='charge'||s.mode==='aim'){e.x=s.hx;e.y=s.hy;e.moving=false;e.nav=[];e.r230At=now;face(e);
  if(s.mode==='charge'&&age>=CHARGE){if(s.shoot&&fire(e))s.nextShot=now+SHOT_GAP+hash(e.id+now)*.6;planDash(e,s,now);}
  else if(s.mode==='aim'&&age>=AIM){fire(e);s.nextShot=now+SHOT_GAP+hash(e.id+now)*.6;stop(e,s);}
  return;}
 if(s.mode==='dash'){const u=Math.min(1,age/DASH),k=1-(1-u)*(1-u),px=e.x,py=e.y;e.x=s.fx+(s.tx-s.fx)*k;e.y=s.fy+(s.ty-s.fy)*k;e.moving=false;e.nav=[];e.r230At=now;
  s.trail+=Math.hypot(e.x-px,e.y-py);if(s.trail>.5){s.trail=0;smoke(px,py);}
  if(u>=1){e.x=s.tx;e.y=s.ty;face(e);crack(e.x,e.y);s.nextDash=now+DASH_GAP+hash(e.id+now)*.6;stop(e,s);}}}
function eligible(e){return !!(e&&e.hp>0&&e.spawnState==='active'&&e.visible!==false&&!e.disabled&&!major(e)&&!fixed(e)&&!e.r193Doll);}
let lastT=-1;
function paused(){return !G('started')||G('loading')||G('modal')||G('storyScene')||typeof player!=='object'||!player||!(player.hp>0)||typeof room!=='object'||!room;}
function step(){if(!prefs.on||paused()||!solo()||hospital())return;const now=T();if(!(now>lastT)){lastT=now;return;}lastT=now;
 let n=live();
 for(const e of room.enemies||[]){if(!e)continue;const s=e.r286;if(s?.mode){try{advance(e,s,now);}catch(err){stop(e,s);fail(err);}continue;}
  if(!eligible(e)||e.attack||e.rangedWindup>0||e.r268Dash||e.rest>0||n>=MAXLIVE)continue;
  const k=kindOf(e);if(k!=='attack-only'&&k!=='move-only')continue;warmUp();
  const d=Math.hypot(player.x-e.x,player.y-e.y),aggro=Number(e.combatProfile?.aggro)||7;if(d>Math.min(7,aggro+.5))continue;const st=S(e);
  if(k==='attack-only'){if(!prefs.charge||!e.moving||d<=rangeOf(e)+.6||now<st.nextDash||!sees(e.x,e.y))continue;startCharge(e,st,now);n++;}
  else{if(!prefs.shots||e.ai==='ranged'||e.ai==='hybrid'||d<3||d>6.5||now<st.nextShot||!sees(e.x,e.y))continue;st.mode='aim';st.t0=now;st.hx=e.x;st.hy=e.y;face(e);e.r230At=now;stats.aims++;n++;}}}
// ---- 그리기: 몸 그림만(판정·좌표는 그리기가 끝나면 되돌린다) ----
const ease=u=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);};
// R776 걷기 들썩임: 초당 걸음 수, 들썩 높이(칸), 좌우 흔들림(칸). 몹마다 위상을 달리한다.
const STEP_HZ=2.2,HOP=.07,SWAY=.025;const stillPhase=e=>{let h=0;for(const c of String(e.id||e.name||''))h=(h*31+c.charCodeAt(0))>>>0;return (h%1000)/1000;};
// 순수(QA): 이동 칸으로 하는 근접 동작의 그림 자리 — 공격 시작부터 t초, 앞 방향 a, 옆 부호 side → 월드 옮김 [dx,dy]
function lungeOffset(t,sh,a,side){const w=Math.max(.05,Number(sh.windup)||.3),act=Math.max(.05,Number(sh.active)||.15),rec=Math.max(.1,Number(sh.recovery)||.35);
 let f=0,p=0;if(t<w){const u=t/w;p=SIDE*side*Math.sin(Math.PI*u);f=-.12*ease(u);}else if(t<w+act){f=-.12+(REACH+.12)*ease((t-w)/act);}else f=REACH*(1-ease((t-w-act)/rec));
 const cx=Math.cos(a),cy=Math.sin(a);return [cx*f-cy*p,cy*f+cx*p];}
// R106 물들인 그림은 프레임마다 만들 수 있는 수가 적어(붐비면 미룸) 미리 줄 세워 둔다(warm).
let warmAt=-9;function warmUp(){const F=window.__STORYWORLD_FX_SPRITES_R106__;if(!F?.warm||T()-warmAt<2&&T()>=warmAt)return;warmAt=T();try{if(!F.ready('glow',BLOOD)||!F.ready('ring',BLOOD))F.warm(BLOOD,['glow','ring']);}catch(err){fail(err);}}
function glow(e,u,small){try{const F=window.__STORYWORLD_FX_SPRITES_R106__;if(!F?.on?.()||typeof project!=='function'||typeof actorHeight!=='function')return;
 const q=project(e.x,e.y),h=actorHeight()*(e.combatProfile?.spriteRect?.height||1)*(e.defScale||1)*(small?.8:1),g=ease(u);
 /* overHero: 공격 예고라 그리기 예산·영웅 가림 옅게에 걸리지 않게(R248 공격 이펙트와 같음). 기록기에서 덧셈(lighter)은 거의 안 보여(헤드리스 실측) 보통 덮기로 옅게 */
 const o={overHero:true,blend:'source-over'};let k=0;
 k+=F.draw('glow',BLOOD,q.x,q.y-h*.5,h*(.55+.65*g),h*(.55+.65*g),{...o,alpha:.18+.42*g})===true;
 k+=F.draw('ring',BLOOD,q.x,q.y-h*.06,h*(1.5-.9*g),h*(.75-.45*g),{...o,alpha:.25+.45*g})===true;stats.glows=(stats.glows||0)+(k?1:0);stats.glowMiss=(stats.glowMiss||0)+(k?0:1);}catch(err){fail(err);}}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){
 let saved=null;
 try{if(prefs.on&&e&&e.hp>0&&!hospital()&&e.spawnState!=='dead'){const s=e.r286,now=T();
   if(s?.mode==='charge'||s?.mode==='dash'){const sh=shapeOf(e),w=Math.max(.05,Number(sh.windup)||.3),act=Math.max(.05,Number(sh.active)||.15),age=Math.max(0,now-s.t0);
    const el=s.mode==='charge'?Math.min(.98,age/CHARGE)*w:w+Math.min(.98,age/DASH)*act;
    saved={attack:e.attack,moving:e.moving};e.attack={elapsed:el,angle:aimAt(e),committed:true,struckQuality:true,id:-286,shape154:sh,origin154:{x:e.x,y:e.y},r286Fake:true};e.moving=false;
}
   else if(s?.mode==='aim'){const age=Math.max(0,now-s.t0),p=SIDE*.6*s.side*Math.sin(age/AIM*Math.PI*2),A=aimAt(e);
    saved={moving:e.moving,x:e.x,y:e.y};e.moving=true;e.x-=Math.sin(A)*p;e.y+=Math.cos(A)*p;}
   else if(e.attack&&!e.attack.r286Fake&&prefs.lunge&&Number.isFinite(e.attack.elapsed)&&kindOf(e)==='move-only'){const A=e.attack,sh=A.shape154||shapeOf(e),side=((Number(A.id)||0)%2)?1:-1,o=lungeOffset(A.elapsed,sh,Number.isFinite(A.angle)?A.angle:aimAt(e),side);
    saved={attack:A,moving:e.moving,x:e.x,y:e.y};e.attack=null;e.moving=true;e.x+=o[0];e.y+=o[1];if(A.r286Seen!==true){A.r286Seen=true;stats.lunges++;}}
   // R776(사용자 2026-11-12 07:11Z '모션이 없는 몹은 일단 너가 코드로 구현'): 그림 한 장·대기만 몹(Dots CX-0079MM 시트가 오기 전 임시)
   //  · 공격: 그 한 장(엔진 공격 그림 그대로)을 move-only 와 같은 젖힘→옆걸음→내딛기 자리 옮김으로. · 걷기: 발걸음마다 들썩(화면 위로 최대 .07칸)·좌우 흔들림.
   else if(prefs.still!==false&&!e.r286Fake){const k=kindOf(e);if(k==='static'||k==='idle-only'){const A=e.attack;
    if(A&&!A.r286Fake&&Number.isFinite(A.elapsed)){const sh=A.shape154||shapeOf(e),side=((Number(A.id)||0)%2)?1:-1,o=lungeOffset(A.elapsed,sh,Number.isFinite(A.angle)?A.angle:aimAt(e),side);
     saved={moving:e.moving,x:e.x,y:e.y};e.x+=o[0];e.y+=o[1];if(A.r286Still!==true){A.r286Still=true;stats.staticLunges=(stats.staticLunges||0)+1;}}
    else if(e.moving){const ph=stillPhase(e),u=now*STEP_HZ+ph,hop=Math.abs(Math.sin(Math.PI*u))*HOP,sw=Math.sin(Math.PI*u*.5)*SWAY;
     saved={moving:e.moving,x:e.x,y:e.y};e.x+=-hop/2+sw;e.y+=-hop/2-sw;stats.staticMoves=(stats.staticMoves||0)+1;}}}}}
 catch(err){fail(err);saved=null;}
 try{return base.apply(this,[e,...a]);}
 finally{if(saved){if('attack' in saved)e.attack=saved.attack;e.moving=saved.moving;if('x' in saved){e.x=saved.x;e.y=saved.y;}}}};}
// 기 모으기·겨누기 빛: 몸 그림 사슬(drawEnemy)은 기록기가 몸 칸만 받으므로 R248 처럼 효과 목록에 표지 하나를 두고 drawEffect 차례에 그린다.
const SENT={type:'r286-fx',x:0,y:0,age:0,life:Infinity};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function drawFx(){const now=T();for(const e of (typeof room==='object'&&room?.enemies)||[]){const s=e?.r286;if(!s||!(e.hp>0))continue;const age=now-s.t0;
 if(s.mode==='charge')glow(e,age/CHARGE,false);else if(s.mode==='aim')glow(e,age/AIM,true);}}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(fx,...a){if(fx&&fx.type==='r286-fx'){try{if(prefs.on)drawFx();}catch(err){fail(err);}return;}return base.apply(this,[fx,...a]);};}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{step();if(prefs.on&&typeof room==='object'&&room?.enemies?.some(e=>e?.r286?.mode))arm();}catch(err){fail(err);}return r;};}
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on)for(const e of (typeof room==='object'&&room?.enemies)||[])if(e?.r286)stop(e,e.r286);return {...prefs};}
function census(){const out={};for(const e of (typeof room==='object'&&room?.enemies)||[]){if(!e||!(e.hp>0))continue;const k=kindOf(e)||'unknown';out[k]=(out[k]||0)+1;}stats.classified=out;return out;}
window.__STORYWORLD_MOB_MOTION_R286__=Object.freeze({revision:REV,set,classifyTrack,kindOf:e=>kindOf(e),lungeOffset,census,
 constants:{CHARGE,DASH,DASH_GAP,MAXDASH,BLINK_MAX,AIM,SHOT_K,SHOT_GAP,SHOT_SPEED,MAXLIVE,SIDE,REACH,ART_MOVE},
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},last,lastError})});
})();
