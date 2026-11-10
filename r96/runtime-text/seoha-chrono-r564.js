/* R564 윤서하 시간 가속·평행세계 분신·시간 정지 연계 (사용자 2026-11-10 03:20Z "윤서하 시간가속 시간정지 잔상-분신(멀티버스) 느낌업그레이드",
 * 03:23Z "스킬키를 늘리지말고 기존 스킬키에서 자동으로 여러스킬이 연속으로 더나가게", "자연스럽고 렉부분도 신경써서").
 * 키는 늘리지 않는다. 원래 기술 뒤에 시간 기술이 박자를 두고 저절로 이어진다.
 *  W 죽은 시간 개방(원래: 3초 공격 간격 1/1.15 + 보호막 30) → 가속 3초 동안 움직이면 0.1초마다 잔상(엔진 ghost, 동시 4개)과 발밑 시계 고리.
 *  Q 백야 관통(원래: 꿰뚫는 사격 3발) → +0.15초 평행세계의 서하 둘이 좌우 1.5칸에 나타남 → +0.3초 둘이 각자 가까운 적에게 꿰뚫는 한 발(Q 위력 0.25배)
 *     → +0.75초 사라짐.
 *  R 최초명령 해방(원래: 6칸 안 2.4배) → 같은 순간 6칸 안 '시간 정지' 1.6초: 보스·중간 보스가 아닌 몹은 그 자리에 멈추고(움직임·공격 대기 멈춤),
 *     멈춘 몹·그 몹이 쏜 탄·장판은 영웅에게 피해를 주지 못한다. 6칸 안 적 탄은 허공에 멈췄다가 정지가 풀리면 다시 날아간다(사라지는 시간만큼 수명 연장).
 *     → 정지가 풀릴 때 시계 고리가 깨지는 그림(피해 없음).
 * 상한(렉 방지): 잔상 4, 분신 2, 멈춘 몹 20, 멈춘 탄 40. 그림은 코드·엔진 ghost 로 그린 임시 연출(최종은 Dots 24프레임 시트 요청 대상).
 * 끄기: localStorage['storyworld.r564.chrono']='{"on":false}'
 */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SEOHA_CHRONO_R564__)return;
const REV='R564-chrono-4',KEY='storyworld.r564.chrono',HERO='seoha';
const TRAIL_GAP=.1,TRAIL_LIFE=.36,TRAIL_MAX=4,CLONE_AT=.15,CLONE_SHOT=.3,CLONE_END=.75,CLONE_OFF=1.5,CLONE_K=.25,CLONE_RANGE=13,
 STOP_AT=.14,STOP_R=6,STOP_T=1.6,STOP_MOB_MAX=20,STOP_SHOT_MAX=40,SHATTER_T=.45;
const stats={hasteTrails:0,qCasts:0,cloneShots:0,stops:0,frozenMobs:0,frozenShots:0,blockedHurts:0,draws:0,errors:0,lastError:null};
let blinks=[],jobs=[],clones=[],stop=null,shatter=null,frozen=new Map(),heldShots=new Map(),lastTrail=-1e9,trails=0,lastRoom=null,prefAt=-1e9,prefOn=true,seenR=new Set();
const T=()=>{try{return typeof time==='number'?time:0;}catch(_){return 0;}};
const fail=e=>{stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,200);};
function readOn(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return !(v&&v.on===false);}catch(_){return true;}}
function on(){const t=T();if(t<prefAt||t-prefAt>=1){prefAt=t;prefOn=readOn();}return prefOn;}
function heroNow(){try{return typeof player==='object'&&player?player.hero:null;}catch(_){return null;}}
function blockedNow(){try{if(typeof storyScene!=='undefined'&&storyScene)return true;if(typeof modal!=='undefined'&&modal)return true;if(typeof loading!=='undefined'&&loading)return true;}catch(_){}return false;}
function curRoom(){try{return typeof room!=='undefined'?room:null;}catch(_){return null;}}
function major(e){try{if(typeof majorActor3==='function')return majorActor3(e);}catch(_){}return !!(e&&(e.boss||e.midboss));}
function alive(e){return !!e&&e.hp>0&&!e.dead&&e.visible!==false&&e.disabled!==true&&!['hidden','inactive','disabled','despawned'].includes(e.spawnState);}
function enemiesNow(){try{return typeof liveEnemies==='function'?liveEnemies():[];}catch(_){return [];}}
function shotsNow(){try{return typeof projectiles!=='undefined'&&Array.isArray(projectiles)?projectiles:[];}catch(_){return [];}}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function qPower(){try{const r=typeof rank==='function'?rank('special'):0;return attackPower()*(2.4+.36*r);}catch(_){return 0;}}
function art(kind,dir){try{const a=typeof heroArt!=='undefined'?heroArt[HERO]:null;return a&&a[kind]&&(a[kind][dir]||a[kind].front)||null;}catch(_){return null;}}
function face(dx,dy){try{return typeof facing==='function'?facing(dx,dy):'front';}catch(_){return 'front';}}
function ghost(x,y,kind,dir,life){const asset=art(kind,dir);if(!asset||typeof fx!=='function')return false;try{fxBase('ghost',x,y,{asset,life,size:1,r564:true});return true;}catch(err){fail(err);return false;}}
let fxBase=null;
// ---- W: 가속 잔상 ----------------------------------------------------------------------------
function hasteOn(){try{const s=player.storyWER;return !!(s&&s.buffs&&Number(s.buffs.hasteUntil)>T());}catch(_){return false;}}
function trailStep(t){if(!hasteOn()||!player.moving){return;}if(t-lastTrail<TRAIL_GAP)return;
 // 동시 잔상 수 상한: 잔상 수명/간격 = 3.6 → 4개를 넘지 않는다.
 lastTrail=t;if(ghost(player.x,player.y,'dash',player.direction||'front',TRAIL_LIFE))stats.hasteTrails++;}
// ---- Q: 평행세계 분신 ------------------------------------------------------------------------
function nearestFrom(p,r){let b=null,bd=r;for(const e of enemiesNow()){if(!alive(e))continue;const d=dist(e,p);if(d<bd){bd=d;b=e;}}return b;}
function onQ(){const t=T(),o={x:player.x,y:player.y},power=qPower(),tg=typeof nearestEnemy==='function'?nearestEnemy(12):null;
 const a=tg?Math.atan2(tg.y-o.y,tg.x-o.x):(typeof storyAim22==='function'?storyAim22():0),nx=-Math.sin(a),ny=Math.cos(a);stats.qCasts++;lastRoom=curRoom();
 const pair=[1,-1].map(s=>({x:o.x+nx*CLONE_OFF*s,y:o.y+ny*CLONE_OFF*s,a,side:s}));
 jobs.push({at:t+CLONE_AT,run:()=>{clones=pair.map(c=>({...c,t0:T()}));for(const c of clones){if(blinks.length>=BLINK_MAX)blinks.shift();blinks.push({x:c.x,y:c.y,t0:c.t0});}for(const c of clones)ghost(c.x,c.y,'attack',face(Math.cos(a),Math.sin(a)),CLONE_END-CLONE_AT);}});
 jobs.push({at:t+CLONE_SHOT,run:()=>{for(const c of clones){const e=nearestFrom(c,CLONE_RANGE),ang=e?Math.atan2(e.y-c.y,e.x-c.x):c.a;
   try{if(typeof makeShot==='function'){makeShot(c.x,c.y,ang,20,power*CLONE_K,{friendly:true,owner:'hero',asset:typeof VFX!=='undefined'?VFX.flare:undefined,pierce:8,life:.8,scale:1.3,r564Clone:true});stats.cloneShots++;}}catch(err){fail(err);}
   c.fireAt=T();c.fireA=ang;}}});
 jobs.push({at:t+CLONE_END,run:()=>{clones=[];}});}
// ---- R: 시간 정지 ----------------------------------------------------------------------------
function startStop(center){const t=T(),until=t+STOP_T;stop={x:center.x,y:center.y,t0:t,until};stats.stops++;lastRoom=curRoom();
 for(const e of enemiesNow()){if(frozen.size>=STOP_MOB_MAX)break;if(!alive(e)||major(e)||dist(e,center)>STOP_R+(e.radius||0))continue;
  if(!frozen.has(e))stats.frozenMobs++;frozen.set(e,{x:e.x,y:e.y,tell:Number.isFinite(e.tell)?e.tell:null,until});}
 for(const b of shotsNow()){if(heldShots.size>=STOP_SHOT_MAX)break;if(!b||b.friendly||b.dead||heldShots.has(b)||dist(b,center)>STOP_R)continue;
  heldShots.set(b,{vx:b.vx,vy:b.vy});b.vx=0;b.vy=0;if(Number.isFinite(b.life))b.life+=STOP_T;stats.frozenShots++;}}
function endStop(){for(const [b,v] of heldShots){try{if(!b.dead){b.vx=v.vx;b.vy=v.vy;}}catch(_){}}heldShots.clear();frozen.clear();
 if(stop){shatter={x:stop.x,y:stop.y,t0:T()};}stop=null;}
function pin(t){for(const [e,f] of frozen){if(!alive(e)){frozen.delete(e);continue;}e.x=f.x;e.y=f.y;if(Number.isFinite(e.cd))e.cd=Math.max(e.cd,f.until-t+.15);if(f.tell!=null&&Number.isFinite(e.tell))e.tell=f.tell;}
 for(const [b] of heldShots){if(b.dead){heldShots.delete(b);continue;}b.vx=0;b.vy=0;}}
function frozenSource(s){if(!stop||!s)return false;if(frozen.has(s)||heldShots.has(s))return true;const id=s.owner;if(id==null)return false;for(const [e] of frozen)if(e.id===id)return true;return false;}
function cancel(){if(stop||heldShots.size)endStop();jobs=[];clones=[];blinks=[];shatter=null;seenR.clear();}
function step(){const rm=curRoom();if(rm!==lastRoom){if(lastRoom!==null)cancel();lastRoom=rm;}
 if(!on()||heroNow()!==HERO||!player||player.hp<=0||blockedNow()){cancel();return;}const t=T();
 const due=jobs.filter(j=>t>=j.at);jobs=jobs.filter(j=>t<j.at);for(const j of due){try{j.run();}catch(err){fail(err);}}
 if(stop){if(t>=stop.until)endStop();else pin(t);}if(shatter&&t-shatter.t0>SHATTER_KEEP)shatter=null;trailStep(t);}
// ---- 감지·연결 -------------------------------------------------------------------------------
if(typeof fx==='function'){const base=fx;fxBase=(...a)=>base.apply(null,a);fx=function(type,x,y,opt){const r=base.apply(this,arguments);
 try{const o=opt||{};if(type==='storySourceSkill'&&o.storyWER&&o.stage==='warning'&&o.sourceHero===HERO&&o.sourceSlot==='r'&&on()&&heroNow()===HERO){const id=o.castId||('r:'+T());
  if(!seenR.has(id)){seenR.add(id);if(seenR.size>16)seenR.delete(seenR.values().next().value);const c={x:player.x,y:player.y};lastRoom=curRoom();jobs.push({at:T()+STOP_AT,run:()=>startStop(c)});}}}catch(err){fail(err);}return r;};}
if(typeof special==='function'){const base=special;special=function(...a){let before=null;try{if(on()&&heroNow()===HERO&&player)before=player.specialCD;}catch(err){fail(err);}
 const r=base.apply(this,a);try{if(before!=null&&heroNow()===HERO&&player.specialCD>0&&!(before>0))onQ();}catch(err){fail(err);}return r;};}
if(typeof hurt==='function'){const base=hurt;hurt=function(damage,source,...a){try{if(stop&&frozenSource(source)){stats.blockedHurts++;return 'ignored';}}catch(err){fail(err);}return base.apply(this,[damage,source,...a]);};}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);
 try{if(typeof started!=='undefined'&&started)step();}catch(err){fail(err);try{cancel();}catch(_){}}sentinel(!!(stop||shatter||clones.length||blinks.length||hasteVisible()));return r;};}
function hasteVisible(){try{return on()&&heroNow()===HERO&&hasteOn();}catch(_){return false;}}
// ---- 그리기 -------------------------------------------------------------------------------
const BLINK='assets/r564/seoha-time-blink.webp',BCELL=192,BCOLS=6,BFPS=30,BLINK_T=24/BFPS,BLINK_MAX=4,basked={at:-1e9};
// Dots CX-0059S SE-01 시간 정지 시계 판(20장 루프, 판 중심 y136·너비 224/256, 칸 256). 불투명한 판이라 절반 밝기로 깐다.
const CLOCK='assets/r564/dots/seoha-clock.webp',CK={py:136,span:224/256},cask={at:-1e9};
function clockImg(){try{const g=typeof readyImage==='function'?readyImage(CLOCK):null;if(g&&g.image)return g.image;const n=Date.now();if(n-cask.at>1500){cask.at=n;if(typeof ensureImages==='function')Promise.resolve(ensureImages([CLOCK])).catch(()=>{});}}catch(err){fail(err);}return null;}
// Dots r3(11-10 09:4xZ 손질본, 칸 256): SE02 r2 결정 껍질 뒤·앞(피벗 223, 영웅 키 ≈150px) · SE03 깨짐(맞는 3, 판 중심 y157·너비 222/256) · SE04 시공 틈 뒤·앞(피벗 214) · SE05 가속 시계(중심 y182·너비 224/256)
const D3P='assets/r564/dots/',D3={shellB:{f:'seoha-crystal-shell-back',py:223},shellF:{f:'seoha-crystal-shell-front',py:223},shatter:{f:'seoha-timestop-shatter',py:157},riftB:{f:'seoha-rift-back',py:214},riftF:{f:'seoha-rift-front',py:214},haste:{f:'seoha-haste-dial',py:182}},d3ask={};
function d3(k){const f=D3P+D3[k].f+'.webp';try{const g=typeof readyImage==='function'?readyImage(f):null;if(g&&g.image)return g.image;const n=Date.now();if(n-(d3ask[f]||-1e9)>1500){d3ask[f]=n;if(typeof ensureImages==='function')Promise.resolve(ensureImages([f])).catch(()=>{});}}catch(err){fail(err);}return null;}
function d3cell(im,k,fr,cx,cy,W,comp,a){ctx.save();try{ctx.globalCompositeOperation=comp||'source-over';ctx.globalAlpha*=a==null?1:a;ctx.drawImage(im,(fr%6)*256,Math.floor(fr/6)*256,256,256,cx-W/2,cy-D3[k].py*W/256,W,W);stats.sheetDraws=(stats.sheetDraws||0)+1;}finally{ctx.restore();}}
const SHATTER_KEEP=.9;
function blinkImg(){try{const g=typeof readyImage==='function'?readyImage(BLINK):null;if(g&&g.image)return g.image;const n=Date.now();if(n-basked.at>1500){basked.at=n;if(typeof ensureImages==='function')Promise.resolve(ensureImages([BLINK])).catch(()=>{});}}catch(err){fail(err);}return null;}
const ICE='180,235,250',PALE='230,248,255',BLUE='90,160,220',GOLD='240,220,170';
function sc(o,f){if(typeof ctx!=='undefined'&&ctx&&typeof ctx.scope==='function')ctx.scope(o,f);else f();}
function scale(){const z=typeof zoom==='number'&&zoom>0?zoom:1,TL=typeof TILE==='number'?TILE:34;return {z,T1:TL*z*Math.SQRT2,AH:typeof actorHeight==='function'?actorHeight():66*z};}
function dial(cx,cy,R,t,alpha,z,hands){ctx.globalAlpha*=alpha;ctx.lineWidth=Math.max(1.5,2*z);ctx.strokeStyle=`rgba(${ICE},.85)`;ctx.beginPath();ctx.ellipse(cx,cy,R,R*.5,0,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle=`rgba(${PALE},.75)`;ctx.lineWidth=Math.max(1,1.4*z);for(let i=0;i<12;i++){const a=i*Math.PI/6,k=i%3===0?.8:.88;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*R*k,cy+Math.sin(a)*R*.5*k);ctx.lineTo(cx+Math.cos(a)*R*.97,cy+Math.sin(a)*R*.5*.97);ctx.stroke();}
 if(hands){ctx.strokeStyle=`rgba(${GOLD},.9)`;ctx.lineWidth=Math.max(1.5,2.4*z);for(const [sp,L] of hands){const a=t*sp;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*R*L,cy+Math.sin(a)*R*.5*L);ctx.stroke();}}}
function draw(){if(typeof project!=='function'||typeof ctx==='undefined'||!ctx)return;const t=T(),{z,T1,AH}=scale();
 if(stop){const q=project(stop.x,stop.y),u=(t-stop.t0)/STOP_T,open=Math.min(1,(t-stop.t0)/.2),R=STOP_R*T1*.5*open;
  sc({id:'r564:stop:'+stop.t0.toFixed(2),kind:'effect',pxfSide:'hero',x:stop.x,y:stop.y,groundAligned:true},()=>{ctx.save();try{
   const ck=clockImg();if(ck){const W=R*2/CK.span,fr=Math.floor((t-stop.t0)*12.5)%20;ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=.85*Math.min(1,(1-u)/.12);
    ctx.drawImage(ck,(fr%6)*256,Math.floor(fr/6)*256,256,256,q.x-W/2,q.y-CK.py*W/256,W,W);stats.sheetDraws=(stats.sheetDraws||0)+1;return;}
   ctx.fillStyle=`rgba(${BLUE},.16)`;ctx.beginPath();ctx.ellipse(q.x,q.y,R,R*.5,0,0,Math.PI*2);ctx.fill();
   // 정지 중엔 바늘이 멈춰 있다(정지 순간 각도에 고정) — 끝나기 0.3초 전부터 떨림
   const tremble=u>.8?Math.sin(t*60)*.05:0;dial(q.x,q.y,R,stop.t0+tremble,.9,z,[[1,.55],[.08,.8]]);
   ctx.globalAlpha=1;ctx.strokeStyle=`rgba(${PALE},.35)`;ctx.lineWidth=Math.max(1,1*z);ctx.beginPath();ctx.ellipse(q.x,q.y,R*.62,R*.31,0,0,Math.PI*2);ctx.stroke();
  }finally{ctx.restore();}});
  let n=0;const sb=d3('shellB'),sf=d3('shellF'),Ws=256*AH/150,sfr=Math.floor((t-stop.t0)*12.5)%24;
  if(sb&&sf){for(const [e] of frozen){if(++n>STOP_MOB_MAX)break;const p=project(e.x,e.y);
   sc({id:'r564:ice:b:'+(e.id||n),kind:'effect',pxfSide:'hero',x:e.x,y:e.y-.02},()=>d3cell(sb,'shellB',sfr,p.x,p.y,Ws,'source-over',.9));
   sc({id:'r564:ice:f:'+(e.id||n),kind:'effect',pxfSide:'hero',x:e.x,y:e.y+.02},()=>d3cell(sf,'shellF',sfr,p.x,p.y,Ws,'source-over',.9));}n=STOP_MOB_MAX+1;}
  for(const [e] of frozen){if(++n>STOP_MOB_MAX)break;const p=project(e.x,e.y);
   sc({id:'r564:ice:'+(e.id||n),kind:'effect',pxfSide:'hero',x:e.x,y:e.y},()=>{ctx.save();try{ctx.globalAlpha*=.75;const w=AH*.42,h=AH*.95;
    ctx.fillStyle=`rgba(${ICE},.14)`;ctx.strokeStyle=`rgba(${PALE},.75)`;ctx.lineWidth=Math.max(1,1.3*z);ctx.beginPath();ctx.moveTo(p.x,p.y-h);ctx.lineTo(p.x+w*.5,p.y-h*.62);ctx.lineTo(p.x+w*.5,p.y-h*.1);ctx.lineTo(p.x,p.y+2*z);ctx.lineTo(p.x-w*.5,p.y-h*.1);ctx.lineTo(p.x-w*.5,p.y-h*.62);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.globalAlpha=.9;dial(p.x,p.y-h*1.08,AH*.13,0,1,z,null);}finally{ctx.restore();}});}}
 const shi=shatter?d3('shatter'):null;if(shatter&&shi){const q=project(shatter.x,shatter.y),fr=Math.min(23,Math.floor((t-shatter.t0)*24/SHATTER_KEEP)),W=STOP_R*T1/(222/256);
  sc({id:'r564:shatter:'+shatter.t0.toFixed(2),kind:'effect',pxfSide:'hero',x:shatter.x,y:shatter.y,groundAligned:true},()=>d3cell(shi,'shatter',fr,q.x,q.y,W,'source-over',.9));}
 else if(shatter&&t-shatter.t0<SHATTER_T){const q=project(shatter.x,shatter.y),v=(t-shatter.t0)/SHATTER_T,R=STOP_R*T1*.5*(1+.35*v);
  sc({id:'r564:shatter:'+shatter.t0.toFixed(2),kind:'effect',pxfSide:'hero',x:shatter.x,y:shatter.y,groundAligned:true},()=>{ctx.save();try{ctx.globalAlpha*=Math.max(0,1-v);ctx.strokeStyle=`rgba(${PALE},.9)`;ctx.lineWidth=Math.max(1.5,3*z);
   for(let i=0;i<12;i++){const a0=i*Math.PI/6+.1,a1=a0+.38;ctx.beginPath();ctx.ellipse(q.x,q.y,R*(1+.06*(i%3)),R*.5*(1+.06*(i%3)),0,a0,a1);ctx.stroke();}}finally{ctx.restore();}});}
 blinks=blinks.filter(b=>t-b.t0<BLINK_T&&t>=b.t0-.05);const rb=blinks.length?d3('riftB'):null,rf=rb?d3('riftF'):null,bim=blinks.length&&!(rb&&rf)?blinkImg():null;
 if(rb&&rf)for(const b of blinks){const fr=Math.max(0,Math.min(23,Math.floor((t-b.t0)*BFPS))),q=project(b.x,b.y),W=256*AH/150;
  sc({id:'r564:rift:b:'+b.t0.toFixed(2)+':'+b.x.toFixed(1),kind:'effect',pxfSide:'hero',x:b.x,y:b.y-.02},()=>d3cell(rb,'riftB',fr,q.x,q.y,W,'lighter',1));
  sc({id:'r564:rift:f:'+b.t0.toFixed(2)+':'+b.x.toFixed(1),kind:'effect',pxfSide:'hero',x:b.x,y:b.y+.02},()=>d3cell(rf,'riftF',fr,q.x,q.y,W,'lighter',1));}
 if(bim)for(const b of blinks){const fr=Math.max(0,Math.min(23,Math.floor((t-b.t0)*BFPS))),q=project(b.x,b.y),H=AH*1.7;
  sc({id:'r564:blink:'+b.t0.toFixed(2)+':'+b.x.toFixed(1),kind:'effect',pxfSide:'hero',x:b.x,y:b.y},()=>{ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=.9;
   ctx.drawImage(bim,(fr%BCOLS)*BCELL,Math.floor(fr/BCOLS)*BCELL,BCELL,BCELL,q.x-H*.5,q.y-H*.82,H,H);stats.sheetDraws=(stats.sheetDraws||0)+1;}finally{ctx.restore();}});}
 for(const c of clones){const q=project(c.x,c.y),u=Math.min(1,(t-c.t0)/.12);
  sc({id:'r564:clone:'+c.side+':'+c.t0.toFixed(2),kind:'effect',pxfSide:'hero',x:c.x,y:c.y,groundAligned:true},()=>{ctx.save();try{dial(q.x,q.y,AH*.42*u,t*2,.8,z,[[3,.6],[.5,.85]]);}finally{ctx.restore();}});
  if(c.fireAt!=null&&t-c.fireAt<.18){const v=(t-c.fireAt)/.18;sc({id:'r564:muzzle:'+c.side+':'+c.t0.toFixed(2),kind:'effect',pxfSide:'hero',x:c.x,y:c.y},()=>{ctx.save();try{ctx.globalAlpha*=1-v;ctx.globalCompositeOperation='lighter';
   const sx=Math.cos(c.fireA)-Math.sin(c.fireA),sy=(Math.cos(c.fireA)+Math.sin(c.fireA))*.5,L=Math.hypot(sx,sy)||1,ex=q.x+sx/L*AH*1.4,ey=q.y-AH*.5+sy/L*AH*1.4;
   ctx.strokeStyle=`rgba(${PALE},.95)`;ctx.lineWidth=Math.max(2,3*z);ctx.beginPath();ctx.moveTo(q.x,q.y-AH*.5);ctx.lineTo(ex,ey);ctx.stroke();}finally{ctx.restore();}});}}
 if(!stop&&hasteVisible()){const q=project(player.x,player.y);const hd=d3('haste');if(hd)sc({id:'r564:haste',kind:'effect',pxfSide:'hero',x:player.x,y:player.y,groundAligned:true},()=>d3cell(hd,'haste',Math.floor(t*12.5)%24,q.x,q.y,AH*1.1/(224/256),'source-over',.85));
  else sc({id:'r564:haste',kind:'effect',pxfSide:'hero',x:player.x,y:player.y,groundAligned:true},()=>{ctx.save();try{dial(q.x,q.y,AH*.5,t,.65,z,[[6,.6],[1.2,.85]]);}finally{ctx.restore();}});}
 stats.draws++;}
const SENT={type:'r564-chrono',x:0,y:0,age:0,life:Infinity,r564Sentinel:true};
function sentinel(want){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);if(want&&i<0)effects.push(SENT);else if(!want&&i>=0)effects.splice(i,1);SENT.age=0;
 const f=stop||shatter||clones[0]||blinks[0]||(typeof player==='object'?player:null);if(f){SENT.x=f.x;SENT.y=f.y;}}catch(_){}}
let wrapped=false;function wrapEffect(){if(wrapped||typeof drawEffect!=='function')return wrapped;const base=drawEffect;
 drawEffect=function(e,...a){if(e&&e.r564Sentinel){try{draw();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};wrapped=true;return true;}
if(!wrapEffect()&&typeof setTimeout==='function'){let n=0;(function arm(){if(wrapEffect()||++n>40)return;setTimeout(arm,250);})();}
function set(v){try{localStorage.setItem(KEY,JSON.stringify({on:v!==false}));}catch(_){}prefAt=-1e9;return on();}
window.__STORYWORLD_SEOHA_CHRONO_R564__=Object.freeze({revision:REV,set,on:()=>on(),
 inspect:()=>({revision:REV,on:prefOn,jobs:jobs.length,stop:stop?{...stop}:null,frozen:[...frozen.keys()].map(e=>e.id),heldShots:heldShots.size,clones:clones.map(c=>({x:c.x,y:c.y,side:c.side})),
  tuning:{TRAIL_GAP,TRAIL_LIFE,TRAIL_MAX,CLONE_AT,CLONE_SHOT,CLONE_END,CLONE_OFF,CLONE_K,STOP_AT,STOP_R,STOP_T,STOP_MOB_MAX,STOP_SHOT_MAX},stats:{...stats}})});
})();
