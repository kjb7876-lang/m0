// R431 보스방 가운데 전투 · 검은 불꽃 던지기 — 사용자 2026-11-08
//  14:00Z "보스는 보스방 중앙에 나오게 해주고 주로 중앙에서 전투가 일어나게"
//  14:06Z "보스가 조형물들 능력으로 끌어당긴 다음 던질 때 검은불꽃(프레임애니메이션이펙트) 같은 거 휘감고 던지도록 연출, 폭발도 검은불꽃 일어나도록"
//  ① 가운데: 보스 자리는 world-combat-r78 이 보스를 먼저 보스방 가운데 자리에 놓도록 고쳤다(전에는 중간보스가 가운데를 가져가 보스가 옆으로 밀림).
//     여기서는 싸움 동안 보스가 보스방 가운데(bossAnchor)에서 ARENA 칸 밖으로 나가지 않게 이동 목표만 원 안으로 당긴다(목줄).
//     영웅이 문간에 서 있으면 보스는 원 가장자리까지만 오고, 밀려 나가면 걸어서 돌아온다. 공격 판정·체력·저장은 건드리지 않는다.
//     보스방 틀(worldWardR81.bossBounds)이 있는 이야기 지도에서만. 맘몬의 금고(ep1b06)는 다른 작업 몫이라 뺀다.
//  ② 검은 불꽃: R114 의 보스급 조형물 던지기에 Dots core24 불꽃 시트를 검게 손질한 프레임 시트(assets/r431, scripts/r431-black-flame.py)를 입힌다.
//     끌어당기는 동안 불길이 붙어 커지고, 날아가는 동안 꼬리 불길+휘감는 불길, 터지면 검은 폭발+솟는 검은 불꽃.
//     솟는 불꽃(약 1.4초)에 닿으면 흑염 화상(작은 도트 — R430/R431 상태이상과 같은 규칙).
//  · 끄기: localStorage['storyworld.r431.arena']='{"leash":false,"black":false}'
(()=>{'use strict';
if(window.__STORYWORLD_BOSS_ARENA_R431__)return;
const REV='R431-boss-arena-1',KEY='storyworld.r431.arena',D='assets/r431/',ARENA=5;
const prefs={leash:true,black:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'){if(s.leash===false)prefs.leash=false;if(s.black===false)prefs.black=false;}}catch(_){}
const stats={leashed:0,wreaths:0,trails:0,blasts:0,blastDraws:0,touches:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0,fin=Number.isFinite,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
// ---- ① 가운데 목줄 -------------------------------------------------------------------------------
function arena(e){if(!prefs.leash||!e||!e.boss||!(e.hp>0))return null;try{if(typeof room==='undefined'||!room||room.id==='ep1b06'||typeof layer!=='undefined'&&layer!=='STORY'||!room.enemies?.includes(e))return null;
 const W=room.exploration?.worldWardR81,bb=W?.bossBounds;if(!Array.isArray(bb)||bb.length!==4)return null;const c=W.bossAnchor&&fin(W.bossAnchor.x+W.bossAnchor.y)?W.bossAnchor:{x:(bb[0]+bb[2])/2,y:(bb[1]+bb[3])/2};
 // 보스가 보스방 틀 안에서 시작했을 때만(다른 자리에서 나오는 특수 전투는 그대로)
 if(e.r431Arena===undefined)e.r431Arena=e.x>=bb[0]-1&&e.x<=bb[2]+1&&e.y>=bb[1]-1&&e.y<=bb[3]+1;if(!e.r431Arena)return null;return c;}catch(err){fail(err);return null;}}
function clampGoal(e,goal){const c=arena(e);if(!c||!goal||!fin(goal.x+goal.y))return goal;const dx=goal.x-c.x,dy=goal.y-c.y,d=Math.hypot(dx,dy);if(d<=ARENA)return goal;
 stats.leashed++;let g={x:c.x+dx/d*ARENA,y:c.y+dy/d*ARENA};try{if(typeof blocked==='function'&&blocked(g.x,g.y,.3,room))g={x:c.x+dx/d*ARENA*.6,y:c.y+dy/d*ARENA*.6};}catch(_){}return g;}
// ---- ② 검은 불꽃 -------------------------------------------------------------------------------
const SH={trail:{f:'black-trail',cell:192,cols:6,n:24,fps:12.5,piv:[130.5,96]},wreath:{f:'black-wreath',cell:192,cols:6,n:10,fps:10,piv:[96,131]},
 burst:{f:'black-burst',cell:192,cols:6,n:24,fps:12.5,piv:[96,151.5]},flare:{f:'black-flare',cell:192,cols:6,n:24,fps:12.5,piv:[96,151.5]}};
const asked=new Map();
function img(k){const p=D+SH[k].f+'.webp';try{const g=typeof readyImage==='function'?readyImage(p):null;if(g?.image)return g.image;const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
function cell(k,fr,x,y,size,o={}){const S=SH[k],im=img(k);if(!im)return false;const c=fr%S.n,sx=(c%S.cols)*S.cell,sy=Math.floor(c/S.cols)*S.cell,sc=size/S.cell;
 ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=clamp(o.alpha??1);ctx.translate(x,y);if(o.angle)ctx.rotate(o.angle);ctx.scale(o.flip?-sc:sc,sc);ctx.drawImage(im,sx,sy,S.cell,S.cell,-S.piv[0],-S.piv[1],S.cell,S.cell);}finally{ctx.restore();}return true;}
const scope=(id,x,y,fn)=>{if(typeof ctx.scope==='function')ctx.scope({id,kind:'effect',x,y,r431:true},fn);else fn();};
const R114=()=>window.__STORYWORLD_COMBAT_R114__;
function windup(e){const a=e?.r61Action;if(!prefs.black||!a||a.cancelled||a.r114?.throw!=='prop'||!(T()<a.releaseAt))return;const info=R114()?.throwInfo?.(a.token);if(!info||info.kind!=='prop')return;
 const t=T(),u=clamp((t-a.start)/Math.max(.2,a.releaseAt-a.start)),z=typeof zoom==='number'?zoom:1,h=info.height*z,P=a.prop||a.origin;if(!P||!fin(P.x+P.y))return;
 const v=clamp(u/.7),x=P.x+(e.x-P.x)*v,y=P.y+(e.y-P.y)*v,p=project(x,y),cy=p.y-h*.5-info.body*z*.55*v,fr=Math.floor(t*SH.wreath.fps);
 scope('r431:wreath:'+e.id,x,y,()=>cell('wreath',fr,p.x,cy+h*.5,h*(.9+.7*u),{alpha:.25+.65*u}));stats.wreaths++;}
function thrown(b,front){const info=b.r114Throw;if(!prefs.black||!info||info.kind!=='prop'||b.dead)return;const m=b.r61Shot||{},z=typeof zoom==='number'?zoom:1,q=project(b.x,b.y),fl=Math.max(.12,m.flight||.6),u=clamp(b.age/fl),
 lift=Math.sin(Math.PI*u)*info.height*z*.35+info.height*z*.25,h=info.height*z,t=T();
 if(!front){const a2=project(b.x+(b.vx||0)*.1,b.y+(b.vy||0)*.1),ang=Math.atan2(a2.y-q.y,a2.x-q.x);scope('r431:trail:'+b.id,b.x,b.y,()=>cell('trail',Math.floor(t*SH.trail.fps),q.x,q.y-lift,h*1.9,{angle:fin(ang)?ang:0,alpha:.95}));stats.trails++;}
 else scope('r431:wrap:'+b.id,b.x,b.y,()=>cell('wreath',Math.floor(t*SH.wreath.fps)+3,q.x,q.y-lift+h*.55,h*1.5,{alpha:.7}));}
let blasts=[];
function blast(x,y,info){const t=T(),h=fin(info?.height)?info.height:60;blasts.push({x,y,t0:t,size:clamp(h/60,.9,2.2),owner:info?.owner||null,room});if(blasts.length>12)blasts.shift();stats.blasts++;arm();}
function adopt(){if(typeof projectiles==='undefined'||!prefs.black)return;for(const b of projectiles){const info=b?.r114Throw;if(!info||info.kind!=='prop'||b.r431Wrapped||typeof b.r114OnPop!=='function')continue;b.r431Wrapped=true;const base=b.r114OnPop;b.r114OnPop=(x,y)=>{try{base(x,y);}finally{try{blast(x,y,info);}catch(e){fail(e);}}};}}
function drawBlasts(){const t=T(),z=typeof zoom==='number'?zoom:1,unit=(typeof TILE==='number'?TILE:34)*z;
 for(const B of blasts){if(B.room!==room)continue;const el=t-B.t0,q=project(B.x,B.y),w=unit*3.2*B.size;
  scope('r431:blast:'+B.t0,B.x,B.y,()=>{const fb=Math.floor(el*SH.burst.fps);if(fb<SH.burst.n)cell('burst',fb,q.x,q.y,w,{alpha:1});const ff=Math.floor((el-.15)*SH.flare.fps);if(el>.15&&ff<SH.flare.n)cell('flare',ff,q.x+w*.08,q.y,w*.85,{alpha:.95});});stats.blastDraws++;}}
const SENT={type:'r431-black-flame',x:0,y:0,age:0,life:Infinity};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function disarm(){try{const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}catch(_){}}
function tickBlasts(){const t=T();blasts=blasts.filter(B=>B.room===room&&t-B.t0<2.2);if(blasts.length)arm();else disarm();
 const fx=window.__STORYWORLD_THEME_FX_R430__;if(!fx?.afflict)return;let hs=[];try{const c=window.__STORYWORLD_COOP_SIM_R62__,m=c?.mode?.();if(m==='guest')return;hs=(m==='host'?c.livingPlayers?.():null)||[player];}catch(_){hs=[player];}
 for(const B of blasts){const el=t-B.t0;if(el<.2||el>1.6)continue;for(const a of hs)if(a&&a.hp>0&&Math.hypot(a.x-B.x,a.y-B.y)<.9*B.size+.3){fx.afflict(a,'hellfire',B.owner&&B.owner.hp>0?B.owner:null);stats.touches++;}}}
// ---- 설치 -----------------------------------------------------------------------------------------
try{
 if(typeof moveAI3==='function'){const base=moveAI3;moveAI3=function(e,goal,dt,...r){let g=goal;try{g=clampGoal(e,goal);}catch(err){fail(err);}return base.call(this,e,g,dt,...r);};}
 if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){const r=base.apply(this,[e,...a]);try{windup(e);}catch(err){fail(err);}return r;};}
 if(typeof drawProjectile==='function'){const base=drawProjectile;drawProjectile=function(b,...a){try{thrown(b,false);}catch(err){fail(err);}const r=base.apply(this,[b,...a]);try{thrown(b,true);}catch(err){fail(err);}return r;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r431-black-flame'){try{drawBlasts();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{adopt();tickBlasts();}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=function(...a){blasts=[];return base.apply(this,a);};}
}catch(e){fail(e);}
function set(o){if(o&&typeof o.leash==='boolean')prefs.leash=o.leash;if(o&&typeof o.black==='boolean')prefs.black=o.black;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_BOSS_ARENA_R431__=Object.freeze({revision:REV,ARENA,set,prefs:()=>({...prefs}),arena:e=>arena(e),clampGoal,blast:(x,y,h)=>blast(x,y,{height:h||60}),
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},blasts:blasts.length,lastError,browserVerified:false,GPUVerified:false})});
})();
