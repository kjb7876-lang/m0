/* R561 라우렌 중력·블랙홀 연계 (사용자 2026-11-10 03:20Z "라우렌은 중력,블랙홀 계열 스킬을 사용하는 이펙트 및 범위 스킬구조 추가업그레이드",
 * 03:23Z "스킬키를 늘리지말고 기존 스킬키에서 자동으로 여러스킬이 연속으로 더나가게하는 느낌으로").
 * 키는 늘리지 않는다. 기존 키를 한 번 누르면 원래 기술 뒤에 중력 기술이 저절로 이어진다.
 *  Q 잔향 결계(원래: 한 점에 마력 폭발 4번) → ① 중력 특이점: 같은 점에 검은 핵이 열려 4.6칸 안 몹을 1.1초 동안 중심으로 끌어당김
 *                                         → ② 붕괴: 1.25초에 핵이 무너지며 2.4칸 폭발(Q 위력의 0.35배, 한 번).
 *    끌려온 몹은 원래 4번 폭발(3.4칸)에 더 많이 들어간다 = 범위 기술이 '모아서 터뜨리는' 구조가 된다.
 *  R 진명 심판(원래: 체력 낮은 적 3명 처형 타격) → 맞은 자리마다 작은 압축 소용돌이(0.55초, 2.6칸 안 몹을 끌어당김, 피해 없음, 동시에 3개까지).
 * 보스·중간 보스는 끌려오지 않는다(맞기만 함). 끌기는 엔진 moveActor 로 해서 벽·막힌 칸을 넘지 않는다.
 * 그림은 코드로 그린 임시 연출이다(최종은 Dots 24프레임 시트 요청 대상). 끄기: localStorage['storyworld.r561.gravity']='{"on":false}'
 */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_LAUREN_GRAVITY_R561__)return;
const REV='R561-gravity-1',KEY='storyworld.r561.gravity',HERO='lauren';
const PULL_R=4.6,PULL_T=1.1,PULL_V=2.4,CORE=.55,COLLAPSE_AT=1.25,COLLAPSE_R=2.4,COLLAPSE_K=.35,END=1.75;
const CRUSH_R=2.6,CRUSH_T=.55,CRUSH_V=2.0,CRUSH_MAX=3,AIM_REACH=3.4;
const stats={wells:0,pulledSteps:0,collapses:0,collapseHits:0,crushes:0,draws:0,errors:0,lastError:null};
let well=null,crushes=[],lastRoom=null,lastT=null,prefAt=-1e9,prefOn=true;
const T=()=>{try{return typeof time==='number'?time:0;}catch(_){return 0;}};
const fail=e=>{stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,200);};
function readOn(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return !(v&&v.on===false);}catch(_){return true;}}
function on(){const t=T();if(t<prefAt||t-prefAt>=1){prefAt=t;prefOn=readOn();}return prefOn;}
function heroNow(){try{return typeof player==='object'&&player?player.hero:null;}catch(_){return null;}}
function blockedNow(){try{if(typeof storyScene!=='undefined'&&storyScene)return true;if(typeof modal!=='undefined'&&modal)return true;if(typeof loading!=='undefined'&&loading)return true;}catch(_){}return false;}
function major(e){try{if(typeof majorActor3==='function')return majorActor3(e);}catch(_){}return !!(e&&(e.boss||e.midboss));}
function hiddenActor(e){return !e||e.hp<=0||e.dead||e.visible===false||e.disabled===true||['hidden','inactive','disabled','despawned'].includes(e.spawnState);}
function enemiesNow(){try{return typeof liveEnemies==='function'?liveEnemies():[];}catch(_){return [];}}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function canHit(e){try{return typeof damageable3==='function'?damageable3(e):true;}catch(_){return true;}}
function lineOk(a,b){try{return typeof clearLine==='function'?clearLine(a,b):true;}catch(_){return true;}}
function qPower(){try{const r=typeof rank==='function'?rank('special'):0;return attackPower()*(2.4+.36*r);}catch(_){return 0;}}
function aim(){try{return typeof storyAim22==='function'?storyAim22():0;}catch(_){return 0;}}
// 끌어당기기: 보스가 아닌 보이는 몹을 중심 쪽으로(중심 CORE 칸 안으로는 안 들어옴). moveActor 가 벽을 막는다.
function pull(center,radius,speed,dt){let n=0;for(const e of enemiesNow()){if(hiddenActor(e)||major(e))continue;const d=dist(e,center);if(d>radius||d<=CORE)continue;
 const k=.6+.4*(1-d/radius),step=Math.min(speed*k*dt,d-CORE),ux=(center.x-e.x)/d,uy=(center.y-e.y)/d,r=e.combatProfile?.bodyBlock?.r||e.radius||.27;
 try{if(typeof moveActor==='function')moveActor(e,ux*step,uy*step,r);else{e.x+=ux*step;e.y+=uy*step;}n++;}catch(err){fail(err);}}stats.pulledSteps+=n;return n;}
function collapse(w){stats.collapses++;const src={kind:'r561-collapse',friendly:true,owner:'hero',sourceHero:HERO,r561:true};
 for(const e of enemiesNow()){if(hiddenActor(e)||!canHit(e))continue;if(dist(e,w)>COLLAPSE_R+(e.radius||0)||!lineOk(w,e))continue;
  try{if(hitEnemy(e,w.power*COLLAPSE_K,src))stats.collapseHits++;}catch(err){fail(err);}}}
function curRoom(){try{return typeof room!=='undefined'?room:null;}catch(_){return null;}}
function startWell(point,power){lastRoom=curRoom();well={x:point.x,y:point.y,t0:T(),power,collapsed:false,seed:(stats.wells*7919)%360};stats.wells++;}
function startCrush(x,y){lastRoom=curRoom();if(crushes.length>=CRUSH_MAX)crushes.shift();crushes.push({x,y,t0:T()});stats.crushes++;}
function cancel(){well=null;crushes=[];}
function step(){const t=T();const rm=typeof room!=='undefined'?room:null;if(rm!==lastRoom){if(lastRoom!==null)cancel();lastRoom=rm;}
 const dt=lastT==null||t<lastT?0:Math.min(.1,t-lastT);lastT=t;
 if(!on()||heroNow()!==HERO||!player||player.hp<=0||blockedNow()){cancel();return;}
 if(well){const u=t-well.t0;if(u<PULL_T)pull(well,PULL_R,PULL_V,dt);if(!well.collapsed&&u>=COLLAPSE_AT){well.collapsed=true;collapse(well);}if(u>=END)well=null;}
 crushes=crushes.filter(c=>{const u=t-c.t0;if(u<CRUSH_T)pull(c,CRUSH_R,CRUSH_V,dt);return u<CRUSH_T+.25;});}
// ---- 시전 감지 ------------------------------------------------------------------------------
if(typeof special==='function'){const base=special;special=function(...a){let before=0,point=null;
 try{if(on()&&heroNow()===HERO&&player){before=player.specialCD;const e=typeof nearestEnemy==='function'?nearestEnemy(12):null,ang=e?Math.atan2(e.y-player.y,e.x-player.x):aim();
  point=e?{x:e.x,y:e.y}:{x:player.x+Math.cos(ang)*AIM_REACH,y:player.y+Math.sin(ang)*AIM_REACH};}}catch(err){fail(err);}
 const r=base.apply(this,a);
 try{if(point&&heroNow()===HERO&&player.specialCD>0&&!(before>0))startWell(point,qPower());}catch(err){fail(err);}return r;};}
if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){const r=base.apply(this,arguments);
 try{const o=opt||{};if(type==='storySourceSkill'&&o.storyWER&&o.stage==='release'&&o.sourceHero===HERO&&o.sourceSlot==='r'&&o.tx==null&&on()&&heroNow()===HERO)startCrush(x,y);}catch(err){fail(err);}return r;};}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);
 try{if(typeof started!=='undefined'&&started)step();}catch(err){fail(err);cancel();}sentinel(!!(well||crushes.length));return r;};}
// ---- 그리기(효과 단계 표지 하나, 3D 기록기에는 ctx.scope 로 자리 주인을 붙인다) -------------------------
const VIOLET='200,160,223',DEEP='74,26,120',HOT='240,216,255';
function sc(o,f){if(typeof ctx!=='undefined'&&ctx&&typeof ctx.scope==='function')ctx.scope(o,f);else f();}
function scale(){const z=typeof zoom==='number'&&zoom>0?zoom:1,TL=typeof TILE==='number'?TILE:34;return {z,T1:TL*z*Math.SQRT2,AH:typeof actorHeight==='function'?actorHeight():66*z};}
function hole(id,c,u,life,radius,big){const q=project(c.x,c.y),{z,T1,AH}=scale(),t=T(),grow=Math.min(1,u/.25),fade=u>life?Math.max(0,1-(u-life)/.4):1;if(fade<=0)return;
 const rx=radius*T1*.5*grow,ry=rx*.5,spin=t*(big?5.5:7)+(c.seed||0);
 // ① 바닥: 짙은 보라 소용돌이 원반(끌려오는 범위가 읽히게)
 sc({id:id+':disk',kind:'effect',pxfSide:'hero',x:c.x,y:c.y,groundAligned:true},()=>{ctx.save();try{ctx.globalAlpha*=.82*fade;
  const g=ctx.createRadialGradient?ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,rx):null;if(g){g.addColorStop(0,'rgba(8,2,16,.95)');g.addColorStop(.45,`rgba(${DEEP},.55)`);g.addColorStop(1,`rgba(${DEEP},0)`);ctx.fillStyle=g;}else ctx.fillStyle=`rgba(${DEEP},.4)`;
  ctx.beginPath();ctx.ellipse(q.x,q.y,rx,ry,0,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=Math.max(1.5,2.4*z);ctx.strokeStyle=`rgba(${VIOLET},.75)`;ctx.beginPath();ctx.ellipse(q.x,q.y,rx,ry,0,0,Math.PI*2);ctx.stroke();
  ctx.lineWidth=Math.max(1,1.6*z);for(let i=0;i<(big?5:3);i++){const a0=spin+i*Math.PI*2/(big?5:3);ctx.strokeStyle=`rgba(${VIOLET},${.55-.06*i})`;ctx.beginPath();ctx.ellipse(q.x,q.y,rx*(.35+.12*i),ry*(.35+.12*i),0,a0,a0+Math.PI*1.1);ctx.stroke();}
 }finally{ctx.restore();}});
 // ② 핵과 강착 고리: 몸 높이 중간에 뜬 검은 구 + 기울어진 밝은 고리 + 안으로 빨려드는 빛줄기
 const cy=q.y-AH*(big?.95:.6),cr=AH*(big?.3:.16)*grow*(u>COLLAPSE_AT&&big?Math.max(.15,1-(u-COLLAPSE_AT)/.2):1);
 sc({id:id+':core',kind:'effect',pxfSide:'hero',x:c.x,y:c.y},()=>{ctx.save();try{ctx.globalAlpha*=fade;
  const prev=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';
  for(let i=0;i<(big?20:8);i++){const ph=((t*1.6+i*.137+(c.seed||0)*.01)%1),a=i*2.399+spin*.4,d=(1-ph)*rx*1.05;const x=q.x+Math.cos(a+ph*2.2)*d,y=cy+Math.sin(a+ph*2.2)*d*.5;
   ctx.strokeStyle=`rgba(${HOT},${.15+.45*ph})`;ctx.lineWidth=Math.max(1.2,(1.4+ph*2)*z);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(q.x-x)*.18,y+(cy-y)*.18);ctx.stroke();}
  ctx.lineWidth=Math.max(2,(big?5:3)*z);ctx.strokeStyle=`rgba(${VIOLET},.9)`;ctx.beginPath();ctx.ellipse(q.x,cy,cr*2.4,cr*.7,-.22,0,Math.PI*2);ctx.stroke();
  ctx.lineWidth=Math.max(1,2*z);ctx.strokeStyle=`rgba(${DEEP},.9)`;ctx.beginPath();ctx.ellipse(q.x,cy,cr*1.7,cr*.5,-.22,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle=`rgba(${HOT},.9)`;ctx.lineWidth=Math.max(1.5,2.4*z);ctx.beginPath();ctx.ellipse(q.x,cy,cr*2.4,cr*.7,-.22,spin%(Math.PI*2),spin%(Math.PI*2)+1.6);ctx.stroke();
  ctx.globalCompositeOperation=prev;
  ctx.fillStyle='rgba(4,0,10,.96)';ctx.beginPath();ctx.ellipse(q.x,cy,cr,cr,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=`rgba(${VIOLET},.9)`;ctx.lineWidth=Math.max(1,1.4*z);ctx.beginPath();ctx.ellipse(q.x,cy,cr*1.08,cr*1.08,0,0,Math.PI*2);ctx.stroke();
 }finally{ctx.restore();}});
 // ③ 붕괴 섬광(큰 핵만): 바닥에 퍼지는 고리 두 겹
 if(big&&u>=COLLAPSE_AT){const v=Math.min(1,(u-COLLAPSE_AT)/(END-COLLAPSE_AT)),R=COLLAPSE_R*T1*.5*(.3+.9*v);
  sc({id:id+':burst',kind:'effect',pxfSide:'hero',x:c.x,y:c.y,groundAligned:true},()=>{ctx.save();try{ctx.globalAlpha*=(1-v);const prev=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';
   ctx.fillStyle=`rgba(${VIOLET},.25)`;ctx.beginPath();ctx.ellipse(q.x,q.y,R,R*.5,0,0,Math.PI*2);ctx.fill();
   ctx.lineWidth=Math.max(2,7*z*(1-v));ctx.strokeStyle=`rgba(${HOT},.9)`;ctx.beginPath();ctx.ellipse(q.x,q.y,R,R*.5,0,0,Math.PI*2);ctx.stroke();
   ctx.lineWidth=Math.max(1,2.5*z);ctx.strokeStyle=`rgba(${VIOLET},.8)`;ctx.beginPath();ctx.ellipse(q.x,q.y,R*.7,R*.35,0,0,Math.PI*2);ctx.stroke();ctx.globalCompositeOperation=prev;}finally{ctx.restore();}});}
 stats.draws++;}
function draw(){if(typeof project!=='function'||typeof ctx==='undefined'||!ctx)return;const t=T();
 if(well)hole('r561:well:'+well.t0.toFixed(2),well,t-well.t0,COLLAPSE_AT,PULL_R,true);
 for(const c of crushes)hole('r561:crush:'+c.t0.toFixed(2)+':'+c.x.toFixed(1),c,t-c.t0,CRUSH_T,CRUSH_R*.8,false);}
const SENT={type:'r561-gravity',x:0,y:0,age:0,life:Infinity,r561Sentinel:true};
function sentinel(want){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);if(want&&i<0)effects.push(SENT);else if(!want&&i>=0)effects.splice(i,1);SENT.age=0;
 if(want&&well){SENT.x=well.x;SENT.y=well.y;}}catch(_){}}
let wrapped=false;function wrapEffect(){if(wrapped||typeof drawEffect!=='function')return wrapped;const base=drawEffect;
 drawEffect=function(e,...a){if(e&&e.r561Sentinel){try{draw();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};wrapped=true;return true;}
if(!wrapEffect()&&typeof setTimeout==='function'){let n=0;(function arm(){if(wrapEffect()||++n>40)return;setTimeout(arm,250);})();}
function set(v){try{localStorage.setItem(KEY,JSON.stringify({on:v!==false}));}catch(_){}prefAt=-1e9;return on();}
window.__STORYWORLD_LAUREN_GRAVITY_R561__=Object.freeze({revision:REV,set,on:()=>on(),
 inspect:()=>({revision:REV,on:prefOn,well:well?{...well}:null,crushes:crushes.map(c=>({...c})),tuning:{PULL_R,PULL_T,PULL_V,CORE,COLLAPSE_AT,COLLAPSE_R,COLLAPSE_K,END,CRUSH_R,CRUSH_T,CRUSH_V,CRUSH_MAX},stats:{...stats}})});
})();
