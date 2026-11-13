/* R562 네온 청록 전기·생화학(독) 연계 (사용자 2026-11-10 03:20Z "네온은 청록전기-생화학(독)스킬로 이펙트및 스킬구조업그레이드",
 * 03:23Z "스킬키를 늘리지말고 기존 스킬키에서 자동으로 여러스킬이 연속으로 더나가게", "자연스럽고 렉부분도 신경써서").
 * 키는 늘리지 않는다. 기존 키를 누르면 원래 기술 뒤에 전기·독 기술이 박자를 두고 저절로 이어진다.
 *  Q 회로 폭주(원래: 10칸 안 최대 7명 연쇄 타격)
 *    → ① +0.30초 2차 감전: 맞은 적마다 3.5칸 안의 안 맞은 적 하나로 청록 번개가 튄다(최대 4줄, Q 위력 0.25배)
 *    → ② 독 주입: 맞은 적 모두 2초 동안 0.5초마다 Q 위력 0.05배(4번, 다시 맞으면 새로 걸림 — 겹쳐 쌓이지 않음)
 *    → ③ +0.55초 독 장판: 맞은 적들이 모인 곳에 반지름 1.7칸 장판 3초, 0.5초마다 Q 위력 0.03배
 *  R 보스 낙인(원래: 표적 0.65초 뒤 2.2칸 폭발) → 폭발 자리에 큰 독 장판(2.2칸, 3초, 같은 피해)이 이어서 깔린다.
 * 상한(렉 방지): 장판 동시 3개, 독 걸린 적 24명, 번개 그림 6줄. 장판 판정은 0.5초마다 한 번만 돈다.
 * 그림은 코드로 그린 임시 연출이다(최종은 Dots 24프레임 시트 요청 대상). 끄기: localStorage['storyworld.r562.toxic']='{"on":false}'
 */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_NEON_TOXIC_R562__)return;
const REV='R562-toxic-4',KEY='storyworld.r562.toxic',HERO='neon';
const ARC_AT=.3,ARC_R=3.5,ARC_K=.25,ARC_MAX=4,POISON_T=2,POISON_GAP=.5,POISON_K=.05,POOL_AT=.55,POOL_R=1.7,POOL_T=3,POOL_GAP=.5,POOL_K=.03,
 RPOOL_AT=.7,RPOOL_R=2.2,POOL_MAX=3,POISON_MAX=24,ARC_DRAW_MAX=6,ARC_LIFE=.32,ARC_VIS=.6;
const stats={qCasts:0,arcs:0,arcHits:0,poisoned:0,poisonTicks:0,pools:0,poolTicks:0,rPools:0,draws:0,errors:0,lastError:null};
let jobs=[],pools=[],arcs=[],poison=new Map(),lastRoom=null,prefAt=-1e9,prefOn=true,capture=null,seenR=new Set();
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
function qPower(){try{const r=typeof rank==='function'?rank('special'):0;return attackPower()*(2.4+.36*r);}catch(_){return 0;}}
function src(kind){return {kind,friendly:true,owner:'hero',sourceHero:HERO,r562:true};}
function deal(e,v,kind){if(!alive(e)||!canHit(e)||!(v>0))return false;try{return !!hitEnemy(e,v,src(kind));}catch(err){fail(err);return false;}}
function addArc(a,b){strikes.push({x:b.x,y:b.y,t0:T()});if(strikes.length>4)strikes.shift();arcs.push({x0:a.x,y0:a.y,x1:b.x,y1:b.y,t0:T(),seed:(stats.arcs*131)%997});if(arcs.length>ARC_DRAW_MAX)arcs.shift();stats.arcs++;}
function addPoison(e,power){if(!alive(e))return;if(!poison.has(e)&&poison.size>=POISON_MAX)return;if(!poison.has(e))stats.poisoned++;const t=T();poison.set(e,{until:t+POISON_T+1e-6,next:t+POISON_GAP,power});}
// 사몽 발현(R571) 중 반경 배율(최대 2배): 장판은 생길 때 한 번 정해 끝까지 같은 크기.
function rk(){try{const g=window.__STORYWORLD_SAMONG_SURGE_R571__;const r=g?.range?Number(g.range(1)):1;return Number.isFinite(r)&&r>0?Math.min(2,Math.max(1,r)):1;}catch(_){return 1;}}
function addPool(x,y,r,power,big){r*=rk();if(pools.length>=POOL_MAX)pools.shift();const t=T();pools.push({x,y,r,power,t0:t,next:t+POOL_GAP,big:!!big});stats.pools++;if(big)stats.rPools++;}
// Q 이어지기: 원래 기술이 실제로 맞힌 적(동기 hitEnemy)만 모은다.
function onQ(targets){const power=qPower(),t=T();stats.qCasts++;lastRoom=curRoom();
 for(const e of targets)addPoison(e,power);
 jobs.push({at:t+ARC_AT,run:()=>{const hit=new Set(targets);let n=0;for(const a of targets){if(n>=ARC_MAX)break;if(!alive(a))continue;let best=null,bd=ARC_R*rk();
   for(const e of enemiesNow()){if(hit.has(e)||!alive(e))continue;const d=dist(a,e);if(d<bd&&lineOk(a,e)){bd=d;best=e;}}
   if(best){hit.add(best);n++;addArc(a,best);if(deal(best,power*ARC_K,'r562-arc'))stats.arcHits++;addPoison(best,power);}}}});
 const live=targets.filter(alive);if(live.length){const cx=live.reduce((s,e)=>s+e.x,0)/live.length,cy=live.reduce((s,e)=>s+e.y,0)/live.length;
  jobs.push({at:t+POOL_AT,run:()=>addPool(cx,cy,POOL_R,power,false)});}}
function cancel(){jobs=[];pools=[];arcs=[];strikes=[];poison.clear();seenR.clear();}
function step(){const rm=curRoom();if(rm!==lastRoom){if(lastRoom!==null)cancel();lastRoom=rm;}
 if(!on()||heroNow()!==HERO||!player||player.hp<=0||blockedNow()){cancel();return;}const t=T();
 const due=jobs.filter(j=>t>=j.at);jobs=jobs.filter(j=>t<j.at);for(const j of due){try{j.run();}catch(err){fail(err);}}
 for(const [e,p] of poison){if(!alive(e)||t>p.until){poison.delete(e);continue;}while(t>=p.next&&p.next<=p.until){p.next+=POISON_GAP;if(deal(e,p.power*POISON_K,'r562-poison'))stats.poisonTicks++;}}
 pools=pools.filter(p=>{if(t-p.t0>POOL_T)return false;while(t>=p.next&&p.next<=p.t0+POOL_T+1e-6){p.next+=POOL_GAP;for(const e of enemiesNow()){if(!alive(e))continue;if(dist(e,p)<=p.r+(e.radius||0)&&deal(e,p.power*POOL_K,'r562-pool'))stats.poolTicks++;}}return true;});
 arcs=arcs.filter(a=>t-a.t0<ARC_VIS);}
// ---- 시전 감지 ------------------------------------------------------------------------------
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,...a){const r=base.apply(this,[e,...a]);try{if(capture&&r&&e&&!capture.includes(e))capture.push(e);}catch(_){}return r;};}
if(typeof special==='function'){const base=special;special=function(...a){let before=null;try{if(on()&&heroNow()===HERO&&player){before=player.specialCD;capture=[];}}catch(err){fail(err);}
 let r;try{r=base.apply(this,a);}finally{const got=capture;capture=null;try{if(got&&heroNow()===HERO&&player.specialCD>0&&!(before>0)&&got.length)onQ(got);}catch(err){fail(err);}}return r;};}
if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){const r=base.apply(this,arguments);
 try{const o=opt||{};if(type==='storySourceSkill'&&o.storyWER&&o.stage==='release'&&o.sourceHero===HERO&&o.sourceSlot==='r'&&on()&&heroNow()===HERO){const id=o.castId||('r:'+T());
  if(!seenR.has(id)){seenR.add(id);if(seenR.size>16)seenR.delete(seenR.values().next().value);lastRoom=curRoom();const power=qPower();jobs.push({at:T()+RPOOL_AT,run:()=>addPool(x,y,RPOOL_R,power,true)});}}}catch(err){fail(err);}return r;};}
// ---- 사몽 발현 중 몸 둘레 문양(R572 코드 그림) → Dots CX-0064T 문양 시트(dots-r3, 칸 192·6×4, 피벗=발 [96,144]) ----
// R572 가 이 파일보다 늦게 실리므로 tick 에서 처음 한 번 그 영웅 문양의 draw 만 감싼다(R572 파일 안 고침). 시트가 없거나 끄면 원래 코드 그림.
// 뒤층은 몸보다 먼저 그려지므로 R350 가림 옅게에서 뺀다(r350). 앞층 CROP 밖(몸 자리)은 비운다.
const SIG={back:'assets/r562/dots/neon-sigil-back.webp',front:'assets/r562/dots/neon-sigil-front.webp'},SIGC=192,SIGP=[96,144],SIGCROP=[[0,82],[110,192]];let sigPatched=false,sigAsk=-1e9;
function sigImg(L){try{const g=typeof readyImage==='function'?readyImage(SIG[L]):null;if(g&&g.image)return g.image;const n=Date.now();if(n-sigAsk>1500){sigAsk=n;if(typeof ensureImages==='function')Promise.resolve(ensureImages([SIG.back,SIG.front])).catch(()=>{});}}catch(err){fail(err);}return null;}
function patchSigil(){if(sigPatched)return;try{const TH=window.__STORYWORLD_SAMONG_THEME_R572__?.theme?.(HERO);if(!TH||typeof TH.draw!=='function'||Object.isFrozen(TH))return;const base=TH.draw;
 TH.draw=function(L,x,fy,h,F,t,a,lo){const im=(L==='back'||L==='front')&&on()&&Number.isFinite(x)&&Number.isFinite(fy)?sigImg(L):null;if(!im)return base.apply(this,arguments);
  const sc=Math.max(40,Number(h)||0)/105,fr=Math.floor((Number.isFinite(t)?t:T())*12.5)%24,u=(fr%6)*SIGC,v=Math.floor(fr/6)*SIGC,al=Math.max(0,Math.min(1,Number.isFinite(a)?a:1))*(L==='front'?.8:.95);
  const go=()=>{ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=al;for(const[c0,c1]of(L==='front'?SIGCROP:[[0,SIGC]]))ctx.drawImage(im,u+c0,v,c1-c0,SIGC,x+(c0-SIGP[0])*sc,fy-SIGP[1]*sc,(c1-c0)*sc,SIGC*sc);}finally{ctx.restore();}};
  const own={id:'r562:sigil-'+L,kind:'effect',x:player?.x||0,y:player?.y||0,groundAligned:false,r572:true};if(L==='back')own.r350=true;
  if(typeof ctx.scope==='function')ctx.scope(own,go);else go();stats.sigils=(stats.sigils||0)+1;};sigPatched=true;}catch(err){fail(err);}}
const asHeroR720=(id,fn)=>{const D=window.__STORYWORLD_HERO_DEFENSE_R720__;return D&&typeof D.asHero==='function'?D.asHero(id,fn):fn();};/* R720-4: 다음 틱에 이어지는 기술을 그 영웅 몸(생존 배치 영웅이면 그 몸)으로 돌린다 */
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);
 try{if(!sigPatched)patchSigil();}catch(err){fail(err);}
 try{if(typeof started!=='undefined'&&started)asHeroR720(HERO,step);}catch(err){fail(err);cancel();}sentinel(!!(pools.length||arcs.length||poison.size||strikes.length));return r;};}
// ---- 그리기 -------------------------------------------------------------------------------
const HOLY='255,226,150',MINT='94,234,212',TEAL='24,168,154',TOX='120,220,90',DARK='10,40,30',WHITE='228,255,248';
function sc(o,f){if(typeof ctx!=='undefined'&&ctx&&typeof ctx.scope==='function')ctx.scope(o,f);else f();}
function scale(){const z=typeof zoom==='number'&&zoom>0?zoom:1,TL=typeof TILE==='number'?TILE:34;return {z,T1:TL*z*Math.SQRT2,AH:typeof actorHeight==='function'?actorHeight():66*z};}
function rnd(n){const x=Math.sin(n*12.9898)*43758.5453;return x-Math.floor(x);}
function bolt(x0,y0,x1,y1,seed,amp){const pts=[[x0,y0]],n=7,dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
 for(let i=1;i<n;i++){const u=i/n,o=(rnd(seed+i)-.5)*2*amp*Math.sin(Math.PI*u);pts.push([x0+dx*u+nx*o,y0+dy*u+ny*o]);}pts.push([x1,y1]);return pts;}
function line(pts){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();}
// 시트(드라이브 core24 를 네온 색으로 바꾼 것, 2026-11-10 이펙트 조사 스레드 준비물): 낙뢰는 2차 감전 맞은 자리, 독 안개는 장판. 없으면 코드 그림만.
const SH={strike:'assets/r562/neon-lightning-strike.webp',mist:'assets/r562/neon-toxic-mist.webp',chain:'assets/r562/dots/neon-chain.webp',pool:'assets/r562/dots/neon-toxic-pool.webp',ringB:'assets/r562/dots/neon-bubble-ring-back.webp',ringF:'assets/r562/dots/neon-bubble-ring-front.webp'},CELL=192,COLS=6,asked={};let strikes=[];
// Dots CX-0059S NE-01(번개 한 줄, 칸 왼쪽 18 → 오른쪽 240, y 125)·NE-02(독 웅덩이 루프 20장, 가장 넓은 줄 y 148·너비 226) — 칸 256.
const DC=256,CHAIN={x0:18,x1:240,y:125},POOLS={py:148,span:226/256};
function dcell(im,fr,dx,dy,dw,dh){ctx.drawImage(im,(fr%COLS)*DC,Math.floor(fr/COLS)*DC,DC,DC,dx,dy,dw,dh);stats.sheetDraws=(stats.sheetDraws||0)+1;}
function sheetImg(k){const p=SH[k];try{const g=typeof readyImage==='function'?readyImage(p):null;if(g&&g.image)return g.image;const n=Date.now();if(n-(asked[p]||-1e9)>1500){asked[p]=n;if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(err){fail(err);}return null;}
function cellDraw(im,fr,x,y,w,h,ax,ay){const sx=(fr%COLS)*CELL,sy=Math.floor(fr/COLS)*CELL;ctx.drawImage(im,sx,sy,CELL,CELL,x-w*ax,y-h*ay,w,h);stats.sheetDraws=(stats.sheetDraws||0)+1;}
function holyRing(q,rx,ry,z,t){const n=6,rot=t*.35;ctx.lineWidth=Math.max(1,1.3*z);for(let i=0;i<n;i++){const a0=rot+i*Math.PI*2/n,a1=a0+Math.PI*2/n*.62,x0=q.x+Math.cos(a0)*rx*.92,y0=q.y+Math.sin(a0)*ry*.92;
   ctx.strokeStyle=`rgba(${MINT},.65)`;ctx.beginPath();ctx.ellipse(q.x,q.y,rx*.92,ry*.92,0,a0+.08,a1);ctx.stroke();
   const d=3.2*z;ctx.fillStyle=`rgba(${HOLY},.9)`;ctx.beginPath();ctx.moveTo(x0,y0-d);ctx.lineTo(x0+d,y0);ctx.lineTo(x0,y0+d);ctx.lineTo(x0-d,y0);ctx.closePath();ctx.fill();}}
function drawPool(p,t){const q=project(p.x,p.y),{z,T1}=scale(),u=(t-p.t0)/POOL_T,grow=Math.min(1,(t-p.t0)/.25),fade=u>.8?Math.max(0,(1-u)/.2):1;if(fade<=0)return;
 const rx=p.r*T1*.5*grow,ry=rx*.5,id='r562:pool:'+p.t0.toFixed(2);
 const dp=sheetImg('pool');if(dp){const W=rx*2/POOLS.span,fr=Math.floor((t-p.t0)*12.5)%20;
  sc({id:id+':ground',kind:'effect',pxfSide:'hero',x:p.x,y:p.y,groundAligned:true},()=>{ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=.8*fade;dcell(dp,fr,q.x-W/2,q.y-POOLS.py*W/DC,W,W);
   holyRing(q,rx,ry,z,t);}finally{ctx.restore();}});return;}
 sc({id:id+':ground',kind:'effect',pxfSide:'hero',x:p.x,y:p.y,groundAligned:true},()=>{ctx.save();try{ctx.globalAlpha*=.8*fade;
  const g=ctx.createRadialGradient?ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,rx):null;if(g){g.addColorStop(0,`rgba(${TOX},.55)`);g.addColorStop(.7,`rgba(${TEAL},.38)`);g.addColorStop(1,`rgba(${DARK},0)`);ctx.fillStyle=g;}else ctx.fillStyle=`rgba(${TEAL},.35)`;
  ctx.beginPath();ctx.ellipse(q.x,q.y,rx,ry,0,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=Math.max(1.5,2.2*z);ctx.strokeStyle=`rgba(${MINT},${.55+.25*Math.sin(t*6)})`;ctx.beginPath();ctx.ellipse(q.x,q.y,rx,ry,0,0,Math.PI*2);ctx.stroke();
  // 거품: 장판 안에서 솟았다 터지는 작은 고리(개수 고정)
  const nb=p.big?9:6;for(let i=0;i<nb;i++){const ph=(t*.9+rnd(i+p.t0)*1)%1,a=rnd(i*3+1)*Math.PI*2,r=Math.sqrt(rnd(i*7+2))*.8;
   const bx=q.x+Math.cos(a)*rx*r,by=q.y+Math.sin(a)*ry*r,br=(1.5+3*ph)*z;ctx.strokeStyle=`rgba(${TOX},${.8*(1-ph)})`;ctx.lineWidth=Math.max(1,1.2*z);ctx.beginPath();ctx.ellipse(bx,by-ph*6*z,br,br*.7,0,0,Math.PI*2);ctx.stroke();}
  // 신성공학 회로 고리(사용자 04:09Z 네온 테마 '전기·생화학·신성공학'): 테두리 위 금빛 마디 6개가 천천히 돌고 마디 사이를 민트 회로선이 잇는다
  holyRing(q,rx,ry,z,t);
  // 장판 위를 기는 청록 전기 두 줄
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${MINT},.7)`;ctx.lineWidth=Math.max(1,1.4*z);const k=Math.floor(t*14);
  for(let i=0;i<2;i++){const a=rnd(k+i*17)*Math.PI*2,b=a+1.6+rnd(k+i*5);line(bolt(q.x+Math.cos(a)*rx*.8,q.y+Math.sin(a)*ry*.8,q.x+Math.cos(b)*rx*.8,q.y+Math.sin(b)*ry*.8,k+i*31,6*z));}
 }finally{ctx.restore();}});
 const im=sheetImg('mist');if(im){const age=t-p.t0,fr=age<.4?Math.floor(age/.4*6):age<POOL_T-.48?6+Math.floor((age-.4)*12.5)%12:Math.min(23,18+Math.floor((age-(POOL_T-.48))*12.5)),W=rx*2.5;
  sc({id:id+':mist',kind:'effect',pxfSide:'hero',x:p.x,y:p.y},()=>{ctx.save();try{ctx.globalAlpha*=.9*fade;cellDraw(im,fr,q.x,q.y,W,W,.5,.62);}finally{ctx.restore();}});}}
function drawArc(a,t){const age=t-a.t0,{z,AH}=scale(),p0=project(a.x0,a.y0),p1=project(a.x1,a.y1),h=AH*.5;
 const dc=sheetImg('chain');if(dc){const fr=Math.min(23,Math.floor(age*40)),L=Math.hypot(p1.x-p0.x,p1.y-p0.y)||1,ang=Math.atan2(p1.y-p0.y,p1.x-p0.x),k=L/(CHAIN.x1-CHAIN.x0),ky=Math.max(.55,Math.min(1.2,k));
  sc({id:'r562:arc:'+a.t0.toFixed(2)+':'+a.seed,kind:'effect',pxfSide:'hero',x:(a.x0+a.x1)/2,y:(a.y0+a.y1)/2},()=>{ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.translate(p0.x,p0.y-h);ctx.rotate(ang);ctx.scale(k,ky);
   dcell(dc,fr,-CHAIN.x0,-CHAIN.y,DC,DC);}finally{ctx.restore();}});return;}
 const u=age/ARC_LIFE;if(u>=1)return;const k=Math.floor(t*20);
 sc({id:'r562:arc:'+a.t0.toFixed(2)+':'+a.seed,kind:'effect',pxfSide:'hero',x:(a.x0+a.x1)/2,y:(a.y0+a.y1)/2},()=>{ctx.save();try{ctx.globalAlpha*=1-u;ctx.globalCompositeOperation='lighter';
  const pts=bolt(p0.x,p0.y-h,p1.x,p1.y-h,a.seed+k,14*z);ctx.strokeStyle=`rgba(${TEAL},.55)`;ctx.lineWidth=Math.max(3,6*z);line(pts);
  ctx.strokeStyle=`rgba(${MINT},.95)`;ctx.lineWidth=Math.max(1.5,2.6*z);line(pts);ctx.strokeStyle=`rgba(${WHITE},.9)`;ctx.lineWidth=Math.max(1,1*z);line(pts);
  const br=bolt(pts[3][0],pts[3][1],pts[3][0]+(rnd(a.seed+k)-.5)*30*z,pts[3][1]+18*z,a.seed+k+7,5*z);ctx.strokeStyle=`rgba(${MINT},.7)`;ctx.lineWidth=Math.max(1,1.3*z);line(br);
 }finally{ctx.restore();}});}
// Dots r3 NE-03 독 기포 고리 뒤·앞(20장 루프, 피벗 y215, 영웅 키 ≈150px 기준) — 몸을 사이에 두고 뒤층·앞층.
function drawPoisoned(e,p,t){const q=project(e.x,e.y),{z,AH}=scale();
 const rb=sheetImg('ringB'),rf=rb?sheetImg('ringF'):null;if(rb&&rf){const W=256*AH/150*.9,fr=Math.floor(t*12.5+(e.id?String(e.id).length*3:0))%20,o=W/DC;
  for(const [im,k,dy] of [[rb,'b',-.02],[rf,'f',.02]])sc({id:'r562:tox:'+k+':'+(e.id||''),kind:'effect',pxfSide:'hero',x:e.x,y:e.y+dy},()=>{ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=.9;dcell(im,fr,q.x-W/2,q.y-215*o,W,W);}finally{ctx.restore();}});return;}
 sc({id:'r562:tox:'+(e.id||''),kind:'effect',pxfSide:'hero',x:e.x,y:e.y},()=>{ctx.save();try{ctx.globalAlpha*=.85;
  for(let i=0;i<3;i++){const ph=(t*1.3+i/3)%1,bx=q.x+(rnd(i+(e.id?String(e.id).length:0))-.5)*AH*.5,by=q.y-AH*(.35+.6*ph),br=(1.6+1.6*(1-ph))*z;
   ctx.fillStyle=`rgba(${TOX},${.75*(1-ph)})`;ctx.beginPath();ctx.ellipse(bx,by,br,br,0,0,Math.PI*2);ctx.fill();}
  ctx.lineWidth=Math.max(1,1.6*z);ctx.strokeStyle=`rgba(${TOX},.6)`;ctx.beginPath();ctx.ellipse(q.x,q.y,AH*.32,AH*.11,0,0,Math.PI*2);ctx.stroke();
 }finally{ctx.restore();}});}
function drawStrikes(t){strikes=strikes.filter(k=>t-k.t0<.8);const im=strikes.length?sheetImg('strike'):null;if(!im)return;const {AH}=scale();
 for(const k of strikes){const fr=Math.min(23,Math.floor((t-k.t0)*30)),q=project(k.x,k.y),H=AH*2.2;
  sc({id:'r562:strike:'+k.t0.toFixed(3)+':'+k.x.toFixed(1),kind:'effect',pxfSide:'hero',x:k.x,y:k.y},()=>{ctx.save();try{cellDraw(im,fr,q.x,q.y,H,H,.5,.9);}finally{ctx.restore();}});}}
function draw(){if(typeof project!=='function'||typeof ctx==='undefined'||!ctx)return;const t=T();
 for(const p of pools)drawPool(p,t);let n=0;for(const [e,p] of poison){if(++n>12)break;if(alive(e))drawPoisoned(e,p,t);}for(const a of arcs)drawArc(a,t);drawStrikes(t);stats.draws++;}
const SENT={type:'r562-toxic',x:0,y:0,age:0,life:Infinity,r562Sentinel:true};
function sentinel(want){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);if(want&&i<0)effects.push(SENT);else if(!want&&i>=0)effects.splice(i,1);SENT.age=0;
 const f=pools[0]||arcs[0];if(f){SENT.x=f.x??f.x0;SENT.y=f.y??f.y0;}}catch(_){}}
let wrapped=false;function wrapEffect(){if(wrapped||typeof drawEffect!=='function')return wrapped;const base=drawEffect;
 drawEffect=function(e,...a){if(e&&e.r562Sentinel){try{draw();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};wrapped=true;return true;}
if(!wrapEffect()&&typeof setTimeout==='function'){let n=0;(function arm(){if(wrapEffect()||++n>40)return;setTimeout(arm,250);})();}
function set(v){try{localStorage.setItem(KEY,JSON.stringify({on:v!==false}));}catch(_){}prefAt=-1e9;return on();}
window.__STORYWORLD_NEON_TOXIC_R562__=Object.freeze({revision:REV,set,on:()=>on(),
 inspect:()=>({revision:REV,on:prefOn,jobs:jobs.length,pools:pools.map(p=>({x:p.x,y:p.y,r:p.r,big:p.big,t0:p.t0})),arcs:arcs.length,poisoned:[...poison.keys()].map(e=>e.id),
  tuning:{ARC_AT,ARC_R,ARC_K,ARC_MAX,POISON_T,POISON_GAP,POISON_K,POOL_AT,POOL_R,POOL_T,POOL_GAP,POOL_K,RPOOL_AT,RPOOL_R,POOL_MAX,POISON_MAX},stats:{...stats}})});
})();
