/* R563 미카엘라 하늘 빛기둥 연계 (사용자 2026-11-10 03:20Z "미카엘라 메이플 비숍 제네시스 느낌추가", 03:23Z "스킬키를 늘리지말고 기존 스킬키에서
 * 자동으로 여러스킬이 연속으로 더나가게", "자연스럽고 렉부분도 신경써서"). 다른 게임은 느낌 참고만 — 이름·그림은 StoryWorld 고유.
 * 키는 늘리지 않는다. 원래 기술 뒤에 하늘에서 내리는 빛이 박자를 두고 저절로 이어진다.
 *  R 세라핌 대정화(원래: 정화·회복·보호막 + 8칸 안 1.5배) → ① +0.2초 하늘 열림: 머리 위 높이 금빛 후광 고리가 열린다
 *     → ② +0.55초부터 0.1초 간격 빛기둥 8개: 8칸 안 적 위(적이 적으면 둘레 빈자리)에 하늘 끝에서 땅까지 내리꽂힘, 기둥마다 1.4칸 안 R 위력 0.3배(한 적은 한 시전에 2번까지)
 *     → ③ +1.4초 마지막 큰 '치유의 빛기둥'이 미카엘라 자리에 한 번(피해 없음, 미카엘라 최대 체력 4% 회복 — 사랑·의료 테마).
 *  Q 성흔 정화(원래: 6칸 안 폭발·보호막·회복) → +0.25초부터 0.15초 간격으로 가까운 적 3명 위에 작은 빛기둥(1.1칸, Q 위력 0.15배).
 * 십자가는 쓰지 않는다(정십자 규칙 — 회전·뒤집힘 위험을 아예 없앰). 기둥은 화면 위쪽 끝에서 땅까지 곧게 선 빛.
 * 상한(렉 방지): 기둥 동시 12개, 시전마다 정해진 수만. 그림은 코드로 그린 임시 연출(최종은 Dots 24프레임 시트 요청 대상).
 * 끄기: localStorage['storyworld.r563.genesis']='{"on":false}'
 */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_MICHAELA_GENESIS_R563__)return;
const REV='R563-genesis-4',KEY='storyworld.r563.genesis',HERO='michaela';
const SKY_AT=.2,PIL_AT=.55,PIL_GAP=.1,PIL_N=8,PIL_R=1.4,PIL_K=.3,PIL_MAXHIT=2,AREA=8,GRAND_AT=1.4,PIL_LIFE=.55,GRAND_LIFE=.8,SKY_LIFE=1.9,
 GRAND_HEAL=.04,Q_AT=.25,Q_GAP=.15,Q_N=3,Q_RANGE=7,Q_R=1.1,Q_K=.15,DRAW_MAX=12;
const stats={rCasts:0,qCasts:0,pillars:0,pillarHits:0,grand:0,draws:0,errors:0,lastError:null};
let jobs=[],pillars=[],skies=[],lastRoom=null,prefAt=-1e9,prefOn=true,seenR=new Set();
const T=()=>{try{return typeof time==='number'?time:0;}catch(_){return 0;}};
const fail=e=>{stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,200);};
function readOn(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return !(v&&v.on===false);}catch(_){return true;}}
function on(){const t=T();if(t<prefAt||t-prefAt>=1){prefAt=t;prefOn=readOn();}return prefOn;}
function heroNow(){try{return typeof player==='object'&&player?player.hero:null;}catch(_){return null;}}
function blockedNow(){try{if(typeof storyScene!=='undefined'&&storyScene)return true;if(typeof modal!=='undefined'&&modal)return true;if(typeof loading!=='undefined'&&loading)return true;}catch(_){}return false;}
function curRoom(){try{return typeof room!=='undefined'?room:null;}catch(_){return null;}}
function alive(e){return !!e&&e.hp>0&&!e.dead&&e.visible!==false&&e.disabled!==true&&!['hidden','inactive','disabled','despawned'].includes(e.spawnState);}
function enemiesNow(){try{return typeof liveEnemies==='function'?liveEnemies():[];}catch(_){return [];}}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function canHit(e){try{return typeof damageable3==='function'?damageable3(e):true;}catch(_){return true;}}
function lineOk(a,b){try{return typeof clearLine==='function'?clearLine(a,b):true;}catch(_){return true;}}
function basePower(){try{return attackPower();}catch(_){return 0;}}
function qPower(){try{const r=typeof rank==='function'?rank('special'):0;return attackPower()*(2.4+.36*r);}catch(_){return 0;}}
function rnd(n){const x=Math.sin(n*12.9898)*43758.5453;return x-Math.floor(x);}
// 사몽 발현(R571) 중 반경 배율(최대 2배): 생길 때 한 번 정해 끝까지 같은 크기.
function rk(){try{const g=window.__STORYWORLD_SAMONG_SURGE_R571__;const r=g?.range?Number(g.range(1)):1;return Number.isFinite(r)&&r>0?Math.min(2,Math.max(1,r)):1;}catch(_){return 1;}}
function addPillar(x,y,r,dmg,kind,life,grand,counts){r*=rk();if(pillars.length>=DRAW_MAX)pillars.shift();pillars.push({x,y,r,t0:T(),life,grand:!!grand});stats.pillars++;
 if(!(dmg>0))return;const src={kind,friendly:true,owner:'hero',sourceHero:HERO,r563:true};
 for(const e of enemiesNow()){if(!alive(e)||!canHit(e)||dist(e,{x,y})>r+(e.radius||0)||!lineOk({x,y},e))continue;if(counts){const n=counts.get(e)||0;if(n>=PIL_MAXHIT)continue;counts.set(e,n+1);}
  try{if(hitEnemy(e,dmg,src))stats.pillarHits++;}catch(err){fail(err);}}}
// 기둥 자리: 8칸 안 적 위(가까운 순), 모자라면 둘레 빈자리(정해진 무늬 — 매번 같은 박자)
function spots(origin,n){const list=enemiesNow().filter(e=>alive(e)&&dist(e,origin)<=AREA*rk()).sort((a,b)=>dist(a,origin)-dist(b,origin)).slice(0,n).map(e=>({x:e.x,y:e.y,e}));
 for(let i=list.length;i<n;i++){const a=i*2.399+.4,r=2.6+(i%3)*1.4;list.push({x:origin.x+Math.cos(a)*r,y:origin.y+Math.sin(a)*r});}return list;}
// 사용자 04:09Z 미카엘라 테마 '사랑·의료·정신·신성의학': 마지막 큰 기둥은 치유의 빛 — 미카엘라 최대 체력 4% 회복(최대치까지만).
function heal(k){try{const m=typeof maxHP==='function'?maxHP():0;if(!(m>0)||!player||player.hp<=0)return;const before=player.hp;player.hp=Math.min(m,player.hp+m*k);stats.healed=(stats.healed||0)+(player.hp-before);
 if(player.hp>before&&typeof floatText==='function')floatText('+'+Math.round(player.hp-before),player.x,player.y,'#ffd68c');}catch(err){fail(err);}}
function onR(){const t=T(),o={x:player.x,y:player.y},power=basePower(),counts=new Map();stats.rCasts++;lastRoom=curRoom();
 jobs.push({at:t+SKY_AT,run:()=>{skies.push({x:o.x,y:o.y,t0:T()});if(skies.length>2)skies.shift();}});
 const pts=spots(o,PIL_N);pts.forEach((s,i)=>jobs.push({at:t+PIL_AT+i*PIL_GAP,run:()=>{const p=s.e&&alive(s.e)?{x:s.e.x,y:s.e.y}:s;addPillar(p.x,p.y,PIL_R,power*PIL_K,'r563-pillar',PIL_LIFE,false,counts);}}));
 jobs.push({at:t+GRAND_AT,run:()=>{stats.grand++;addPillar(player.x,player.y,1.8,0,'r563-grand',GRAND_LIFE,true,null);heal(GRAND_HEAL);}});}
function onQ(){const t=T(),o={x:player.x,y:player.y},power=qPower();const list=enemiesNow().filter(e=>alive(e)&&dist(e,o)<=Q_RANGE*rk()).sort((a,b)=>dist(a,o)-dist(b,o)).slice(0,Q_N);if(!list.length)return;
 stats.qCasts++;lastRoom=curRoom();list.forEach((e,i)=>jobs.push({at:t+Q_AT+i*Q_GAP,run:()=>{if(alive(e))addPillar(e.x,e.y,Q_R,power*Q_K,'r563-q-pillar',.45,false,null);}}));}
function cancel(){jobs=[];pillars=[];skies=[];seenR.clear();}
function step(){const rm=curRoom();if(rm!==lastRoom){if(lastRoom!==null)cancel();lastRoom=rm;}
 if(!on()||heroNow()!==HERO||!player||player.hp<=0||blockedNow()){cancel();return;}const t=T();
 const due=jobs.filter(j=>t>=j.at);jobs=jobs.filter(j=>t<j.at);for(const j of due){try{j.run();}catch(err){fail(err);}}
 pillars=pillars.filter(p=>t-p.t0<p.life+.2);skies=skies.filter(s=>t-s.t0<SKY_LIFE);}
// ---- 시전 감지 ------------------------------------------------------------------------------
if(typeof special==='function'){const base=special;special=function(...a){let before=null;try{if(on()&&heroNow()===HERO&&player)before=player.specialCD;}catch(err){fail(err);}
 const r=base.apply(this,a);try{if(before!=null&&heroNow()===HERO&&player.specialCD>0&&!(before>0))onQ();}catch(err){fail(err);}return r;};}
if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){const r=base.apply(this,arguments);
 try{const o=opt||{};if(type==='storySourceSkill'&&o.storyWER&&o.stage==='warning'&&o.sourceHero===HERO&&o.sourceSlot==='r'&&on()&&heroNow()===HERO){const id=o.castId||('r:'+T());
  if(!seenR.has(id)){seenR.add(id);if(seenR.size>16)seenR.delete(seenR.values().next().value);onR();}}}catch(err){fail(err);}return r;};}
// ---- 사몽 발현 중 몸 둘레 문양(R572 코드 그림) → Dots CX-0064T 문양 시트(dots-r3, 칸 192·6×4, 피벗=발 [96,144]) ----
// R572 가 이 파일보다 늦게 실리므로 tick 에서 처음 한 번 그 영웅 문양의 draw 만 감싼다(R572 파일 안 고침). 시트가 없거나 끄면 원래 코드 그림.
// 뒤층은 몸보다 먼저 그려지므로 R350 가림 옅게에서 뺀다(r350). 앞층 CROP 밖(몸 자리)은 비운다.
const SIG={back:'assets/r563/dots/michaela-sigil-back.webp',front:'assets/r563/dots/michaela-sigil-front.webp'},SIGC=192,SIGP=[96,144],SIGCROP=[[0,192]];let sigPatched=false,sigAsk=-1e9;
function sigImg(L){try{const g=typeof readyImage==='function'?readyImage(SIG[L]):null;if(g&&g.image)return g.image;const n=Date.now();if(n-sigAsk>1500){sigAsk=n;if(typeof ensureImages==='function')Promise.resolve(ensureImages([SIG.back,SIG.front])).catch(()=>{});}}catch(err){fail(err);}return null;}
function patchSigil(){if(sigPatched)return;try{const TH=window.__STORYWORLD_SAMONG_THEME_R572__?.theme?.(HERO);if(!TH||typeof TH.draw!=='function'||Object.isFrozen(TH))return;const base=TH.draw;
 TH.draw=function(L,x,fy,h,F,t,a,lo){const im=(L==='back'||L==='front')&&on()&&Number.isFinite(x)&&Number.isFinite(fy)?sigImg(L):null;if(!im)return base.apply(this,arguments);
  const sc=Math.max(40,Number(h)||0)/105,fr=Math.floor((Number.isFinite(t)?t:T())*12.5)%24,u=(fr%6)*SIGC,v=Math.floor(fr/6)*SIGC,al=Math.max(0,Math.min(1,Number.isFinite(a)?a:1))*(L==='front'?.8:.95);
  const go=()=>{ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=al;for(const[c0,c1]of(L==='front'?SIGCROP:[[0,SIGC]]))ctx.drawImage(im,u+c0,v,c1-c0,SIGC,x+(c0-SIGP[0])*sc,fy-SIGP[1]*sc,(c1-c0)*sc,SIGC*sc);}finally{ctx.restore();}};
  const own={id:'r563:sigil-'+L,kind:'effect',x:player?.x||0,y:player?.y||0,groundAligned:false,r572:true};if(L==='back')own.r350=true;
  if(typeof ctx.scope==='function')ctx.scope(own,go);else go();stats.sigils=(stats.sigils||0)+1;};sigPatched=true;}catch(err){fail(err);}}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);
 try{if(!sigPatched)patchSigil();}catch(err){fail(err);}
 try{if(typeof started!=='undefined'&&started)step();}catch(err){fail(err);cancel();}sentinel(!!(pillars.length||skies.length));return r;};}
// ---- 그리기 -------------------------------------------------------------------------------
const GOLD='255,214,140',WHITE='255,250,236',ROSE='236,150,140',DEEP='180,110,40';
// Dots CX-0059S MI-01(하늘 후광, 24장 한 번, 고리 중심 y111·너비 230/256)·MI-02 r2(빛기둥 폭 60~66px, 맞는 칸 4, 바닥 빛살 y218·149/256)·MI-03(큰 기둥, y212·157/256) — 칸 256, 6×4.
const DM={halo:{f:'assets/r563/dots/michaela-halo.webp',py:111,span:230/256},pillar:{f:'assets/r563/dots/michaela-pillar.webp',py:218,span:149/256},grand:{f:'assets/r563/dots/michaela-grand-pillar.webp',py:212,span:157/256}},DC=256,asked={};
function dimg(k){const f=DM[k].f;try{const g=typeof readyImage==='function'?readyImage(f):null;if(g&&g.image)return g.image;const n=Date.now();if(n-(asked[f]||-1e9)>1500){asked[f]=n;if(typeof ensureImages==='function')Promise.resolve(ensureImages([f])).catch(()=>{});}}catch(err){fail(err);}return null;}
function dcell(im,k,fr,cx,cy,W){const S=DM[k];ctx.drawImage(im,(fr%6)*DC,Math.floor(fr/6)*DC,DC,DC,cx-W/2,cy-S.py*W/DC,W,W);stats.sheetDraws=(stats.sheetDraws||0)+1;}
function sc(o,f){if(typeof ctx!=='undefined'&&ctx&&typeof ctx.scope==='function')ctx.scope(o,f);else f();}
function scale(){const z=typeof zoom==='number'&&zoom>0?zoom:1,TL=typeof TILE==='number'?TILE:34;return {z,T1:TL*z*Math.SQRT2,AH:typeof actorHeight==='function'?actorHeight():66*z};}
function drawPillar(p,t){const u=(t-p.t0)/p.life;if(u<0||u>=1.35)return;const q=project(p.x,p.y),{z,T1,AH}=scale(),id='r563:pillar:'+p.t0.toFixed(3)+':'+p.x.toFixed(1);
 // Dots 빛기둥: 바닥 빛살·기둥 아래쪽을 시트로(맞는 칸 4 = 땅에 닿는 순간 = 코드 기둥 drop 끝). 하늘까지 이어지는 위쪽은 코드 기둥을 옅게 남긴다.
 const pk=p.grand?'grand':'pillar',dp=dimg(pk);let soft=1;if(dp){soft=.45;const age=t-p.t0,fr=Math.floor(age*(4/(p.life*.18)));if(fr<24){const W=p.r*T1/DM[pk].span*1.25;
  sc({id:id+':sheet',kind:'effect',pxfSide:'hero',x:p.x,y:p.y},()=>{ctx.save();try{ctx.globalCompositeOperation='lighter';dcell(dp,pk,fr,q.x,q.y,W);}finally{ctx.restore();}});}}
 const drop=Math.min(1,u/.18),fade=u<.7?1:Math.max(0,1-(u-.7)/.65),w=(p.grand?AH*.9:AH*.42)*(u<.18?.55+.45*drop:1+.25*Math.max(0,u-.18)),top=Math.min(-40,q.y-AH*9),bot=q.y,yEnd=top+(bot-top)*drop;
 // ① 바닥 빛 웅덩이와 퍼지는 고리(땅에 닿은 뒤)
 if(drop>=1&&!dp)sc({id:id+':ground',kind:'effect',pxfSide:'hero',x:p.x,y:p.y,groundAligned:true},()=>{ctx.save();try{ctx.globalAlpha*=fade;ctx.globalCompositeOperation='lighter';
  const R=p.r*T1*.5,v=Math.min(1,(u-.18)/.5);ctx.fillStyle=`rgba(${GOLD},.28)`;ctx.beginPath();ctx.ellipse(q.x,q.y,R,R*.5,0,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=Math.max(1.5,3*z*(1-v*.6));ctx.strokeStyle=`rgba(${WHITE},${.9*(1-v)})`;ctx.beginPath();ctx.ellipse(q.x,q.y,R*(.4+.8*v),R*(.2+.4*v),0,0,Math.PI*2);ctx.stroke();
  // 바닥 빛살(방사선, 십자 모양 아님: 12갈래 고르게)
  ctx.strokeStyle=`rgba(${GOLD},${.55*(1-v)})`;ctx.lineWidth=Math.max(1,1.4*z);for(let i=0;i<12;i++){const a=i*Math.PI/6+.13;ctx.beginPath();ctx.moveTo(q.x+Math.cos(a)*R*.35,q.y+Math.sin(a)*R*.17);ctx.lineTo(q.x+Math.cos(a)*R*(.9+.4*v),q.y+Math.sin(a)*R*(.45+.2*v));ctx.stroke();}
 }finally{ctx.restore();}});
 // ② 하늘에서 내려오는 기둥: 바깥 금빛 → 안쪽 흰 심. 위로 갈수록 옅게(세로 그라데이션).
 sc({id:id+':beam',kind:'effect',pxfSide:'hero',x:p.x,y:p.y},()=>{ctx.save();try{ctx.globalAlpha*=fade*soft;ctx.globalCompositeOperation='lighter';
  const lay=(ww,col,a)=>{const g=ctx.createLinearGradient?ctx.createLinearGradient(0,top,0,yEnd):null;if(g){g.addColorStop(0,`rgba(${col},0)`);g.addColorStop(.55,`rgba(${col},${a*.55})`);g.addColorStop(1,`rgba(${col},${a})`);ctx.fillStyle=g;}else ctx.fillStyle=`rgba(${col},${a*.6})`;
   ctx.beginPath();ctx.moveTo(q.x-ww*.5,top);ctx.lineTo(q.x+ww*.5,top);ctx.lineTo(q.x+ww*.5,yEnd);ctx.ellipse(q.x,yEnd,ww*.5,ww*.18,0,0,Math.PI);ctx.closePath();ctx.fill();};
  lay(w,DEEP,.35);lay(w*.62,GOLD,.6);lay(w*.26,WHITE,.95);
  // 기둥 안을 내려오는 빛 알갱이(개수 고정)
  ctx.fillStyle=`rgba(${WHITE},.85)`;for(let i=0;i<5;i++){const ph=(t*2.2+rnd(i+p.t0))%1,yy=top+(yEnd-top)*ph,xx=q.x+(rnd(i*5+p.x)-.5)*w*.7;ctx.beginPath();ctx.ellipse(xx,yy,1.6*z,4.5*z,0,0,Math.PI*2);ctx.fill();}
 }finally{ctx.restore();}});}
function drawSky(s,t){const u=(t-s.t0)/SKY_LIFE;if(u>=1)return;const q=project(s.x,s.y),{z,AH}=scale(),open=Math.min(1,u/.25),fade=u<.75?1:Math.max(0,1-(u-.75)/.25),cy=Math.max(24*z,q.y-AH*3.4),R=AH*2.6*open;
 const dh=dimg('halo');if(dh){const fr=Math.min(23,Math.floor(u*24)),W=AH*5.2/DM.halo.span;
  sc({id:'r563:sky:'+s.t0.toFixed(2),kind:'effect',pxfSide:'hero',x:s.x,y:s.y},()=>{ctx.save();try{ctx.globalCompositeOperation='lighter';dcell(dh,'halo',fr,q.x,cy,W);}finally{ctx.restore();}});return;}
 sc({id:'r563:sky:'+s.t0.toFixed(2),kind:'effect',pxfSide:'hero',x:s.x,y:s.y},()=>{ctx.save();try{ctx.globalAlpha*=fade;ctx.globalCompositeOperation='lighter';
  const g=ctx.createRadialGradient?ctx.createRadialGradient(q.x,cy,0,q.x,cy,R):null;if(g){g.addColorStop(0,`rgba(${WHITE},.55)`);g.addColorStop(.35,`rgba(${GOLD},.3)`);g.addColorStop(1,`rgba(${GOLD},0)`);ctx.fillStyle=g;}else ctx.fillStyle=`rgba(${GOLD},.2)`;
  ctx.beginPath();ctx.ellipse(q.x,cy,R,R*.38,0,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=Math.max(1.5,2.6*z);for(let k=0;k<3;k++){const rr=R*(.45+.22*k),a0=t*(k%2?-.6:.5)+k;ctx.strokeStyle=`rgba(${k===1?ROSE:GOLD},${.75-.18*k})`;ctx.beginPath();ctx.ellipse(q.x,cy,rr,rr*.38,0,a0,a0+Math.PI*1.7);ctx.stroke();}
  // 후광에서 아래로 늘어진 가는 빛살(16갈래, 아래쪽 반원만)
  ctx.strokeStyle=`rgba(${GOLD},.35)`;ctx.lineWidth=Math.max(1,1.2*z);for(let i=0;i<16;i++){const a=Math.PI*(.08+.84*i/15);ctx.beginPath();ctx.moveTo(q.x+Math.cos(a)*R*.5,cy+Math.sin(a)*R*.19);ctx.lineTo(q.x+Math.cos(a)*R*1.1,cy+Math.sin(a)*R*.42+AH*.6);ctx.stroke();}
 }finally{ctx.restore();}});}
function draw(){if(typeof project!=='function'||typeof ctx==='undefined'||!ctx)return;const t=T();for(const s of skies)drawSky(s,t);for(const p of pillars)drawPillar(p,t);stats.draws++;}
const SENT={type:'r563-genesis',x:0,y:0,age:0,life:Infinity,r563Sentinel:true};
function sentinel(want){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);if(want&&i<0)effects.push(SENT);else if(!want&&i>=0)effects.splice(i,1);SENT.age=0;
 const f=pillars[pillars.length-1]||skies[0];if(f){SENT.x=f.x;SENT.y=f.y;}}catch(_){}}
let wrapped=false;function wrapEffect(){if(wrapped||typeof drawEffect!=='function')return wrapped;const base=drawEffect;
 drawEffect=function(e,...a){if(e&&e.r563Sentinel){try{draw();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};wrapped=true;return true;}
if(!wrapEffect()&&typeof setTimeout==='function'){let n=0;(function arm(){if(wrapEffect()||++n>40)return;setTimeout(arm,250);})();}
function set(v){try{localStorage.setItem(KEY,JSON.stringify({on:v!==false}));}catch(_){}prefAt=-1e9;return on();}
window.__STORYWORLD_MICHAELA_GENESIS_R563__=Object.freeze({revision:REV,set,on:()=>on(),
 inspect:()=>({revision:REV,on:prefOn,jobs:jobs.length,pillars:pillars.map(p=>({x:p.x,y:p.y,r:p.r,grand:p.grand,t0:p.t0})),skies:skies.length,
  tuning:{SKY_AT,PIL_AT,PIL_GAP,PIL_N,PIL_R,PIL_K,PIL_MAXHIT,AREA,GRAND_AT,Q_AT,Q_GAP,Q_N,Q_RANGE,Q_R,Q_K,DRAW_MAX},stats:{...stats}})});
})();
