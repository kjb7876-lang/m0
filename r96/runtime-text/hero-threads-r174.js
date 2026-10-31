// R174 — 원거리 영웅(서하·미카엘라·헌터·거너)의 황금실·은색실(사용자 2026-10-31).
//  · 황금실 "적 하나를 가운데 두고 일정 거리를 두고 그 적을 황금실 패턴으로 돌면서 공격이 나가는 것":
//    G 로 쓰는 황금실(R72/R74 필살검무)을 원거리 영웅일 때 바꾼다 — 장착한 황금실 무늬(직접 그린 선)를 과녁 둘레 원(반지름 3.5~6칸)에 감아
//    영웅이 그 무늬를 따라 과녁 둘레를 돌며, 도는 동안 8번 황금실을 과녁에 쏜다. 피해 총량·재사용·무늬·장착·과녁 규칙(보스 전용 정책 포함)은 R74 그대로.
//    근접 영웅(환도·로렌·네온·슬레이어)은 예전 그대로 무늬를 따라 베며 지나간다.
//  · 은색실 "기본 공격이 적중하면 적에게 은색실 이펙트가 그려지는 것": 원거리 영웅의 기본 공격(R160 이 표시한 화살)이 맞으면, 실검무를 배운 경우
//    그 적에게 본편 은색실 베기 그림(threadSlashR63, R111 칠한 그림)을 그린다. 그림만 — 피해·판정은 그대로. 적 하나에 0.3초마다.
//  · 그림은 게임 칠한 스프라이트(R106 line·glow·spark)를 금빛으로 물들여 그린다.
//  storyworld.r174.threads {orbit:false} 로 황금실 돌기를, {silverMark:false} 로 은색실 표시를 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_THREADS_R174__)return;
const REV='R174-threads-1',KEY='storyworld.r174.threads',RANGED=new Set(['seoha','michaela','hunter','gunner']),SHOTS=8;
let prefs={orbit:true,silverMark:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={orbits:0,shots:0,marks:0,fallback:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'?time:0;
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const SPR=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s&&s.on&&s.on()?s:null;};
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
const ranged=p=>!!p&&RANGED.has(p.hero);
const GOLD={a:[120,80,18],b:[255,236,170]},GOLD2={a:[200,150,40],b:[255,250,220]};
const SENT={type:'r174-fx',x:0,y:0,age:0,life:Infinity};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function disarm(){try{if(typeof effects!=='undefined'){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(_){}}

// ---- 황금실: 과녁 둘레 돌기 -------------------------------------------------------------------
let orbit=null,serial=0;const beams=[],trail=[];
function unitPoints(strokes){const pts=[];for(const s of strokes||[])for(const q of s||[])if(Number.isFinite(q?.x+q?.y))pts.push({x:q.x,y:q.y});if(pts.length<2)return null;
 const cx=pts.reduce((a,q)=>a+q.x,0)/pts.length,cy=pts.reduce((a,q)=>a+q.y,0)/pts.length;let m=0;for(const q of pts)m=Math.max(m,Math.hypot(q.x-cx,q.y-cy));m=m||1;
 const out=pts.map(q=>({x:(q.x-cx)/m,y:(q.y-cy)/m}));// 너무 촘촘하면 64점으로 줄인다
 if(out.length>64){const k=out.length/64;return Array.from({length:64},(_,i)=>out[Math.floor(i*k)]);}return out;}
function allowed(e,p){try{return window.__STORYWORLD_DANCE_POLICY_R75__?.target?.('gold',e,p)??true;}catch(_){return true;}}
function nearest(p,from){let best=null,bd=12;for(const e of (typeof liveEnemies==='function'?liveEnemies():[])){if(!e||e.hp<=0||!allowed(e,p))continue;const d=Math.hypot(e.x-from.x,e.y-from.y);if(d<=bd){bd=d;best=e;}}return best;}
function orbitCast(index,aim,manual){const D=window.__STORYWORLD_DANCES_R74__,p=typeof player==='object'?player:null;
 if(!prefs.orbit||!solo()||!ranged(p)||!D?.state||orbit)return null;if(typeof started!=='undefined'&&(!started||loading||modal))return null;
 try{if(!(window.__STORYWORLD_DANCE_POLICY_R75__?.can?.('gold',p)??true))return null;}catch(_){}
 const s=D.state('gold',p),t=D.stats('gold',p);if(!s?.learned||!t)return null;const eq=(s.equipped||[]).slice(0,t.equip||1);if(!eq.length)return null;
 const cds=p.goldenCooldownsR74||{},start=Math.max(0,Math.min(eq.length-1,Number.isInteger(index)?index:0)),order=[...eq.slice(start),...eq.slice(0,start)],id=order.find(d=>(cds[d]||0)<=T());if(!id)return null;// 재사용 대기면 R74 가 안내
 const d=s.designs.find(x=>x.id===id),pts=unitPoints(d?.strokes);if(!pts)return null;
 const target=(aim&&aim.hp>0&&aim)||nearest(p,p);if(!target)return null;
 let rank=0;try{rank=window.__STORYWORLD_PROGRESSION_R62__.ranks('threadDanceR63',p)||0;}catch(_){}
 const base=attackPower()*2*(.22+Math.min(.08,rank*.006))*Math.min(12,2+rank),budget=base*(Number(t.damage)||1);if(!Number.isFinite(budget)||budget<=0)return null;
 let cdf=1;try{cdf=window.__STORYWORLD_PROGRESSION_R62__.factors(p).cooldown||1;}catch(_){}const cooldown=Math.max(3,(Number(t.cooldown)||12)*cdf);
 p.goldenCooldownsR74=p.goldenCooldownsR74||{};p.goldenCooldownsR74[id]=T()+cooldown;p.goldenReadyAtR72=T()+cooldown;
 const R=Math.max(3.5,Math.min(6,3.5+(Number(t.size)||3)*.4)),phase=Math.atan2(p.y-target.y,p.x-target.x),speed=Number(t.speed)||1;
 orbit={id:++serial,p,target,center:{x:target.x,y:target.y},pts,R,phase,start:T(),duration:Math.max(1.2,Math.min(3,pts.length*.05))/speed,shots:0,budget,design:id};trail.length=0;stats.orbits++;
 try{sound('special');}catch(_){}arm();return true;}
function ring(o,q){const a=Math.atan2(q.y,q.x)+o.phase,r=o.R*(.75+.25*Math.min(1,Math.hypot(q.x,q.y)));return{x:o.center.x+Math.cos(a)*r,y:o.center.y+Math.sin(a)*r};}
function spot(o,u){const n=o.pts.length-1,f=Math.max(0,Math.min(n,u*n)),k=Math.min(n-1,Math.floor(f)),w=f-k,A=ring(o,o.pts[k]),B=ring(o,o.pts[k+1]);return{x:A.x+(B.x-A.x)*w,y:A.y+(B.y-A.y)*w};}// 무늬 점 사이를 이어 미끄러지듯
function orbitTick(){const o=orbit;if(!o)return;const p=o.p;if(p!==player||p.hp<=0||(typeof modal!=='undefined'&&modal)){orbit=null;return;}
 if(o.target&&o.target.hp>0){o.center.x=o.target.x;o.center.y=o.target.y;}
 const u=Math.min(1,(T()-o.start)/o.duration),at=spot(o,u);
 // 지난 자리에서 새 자리까지 0.25칸마다 벽을 본다 — 얇은 벽을 건너뛰어 미로 반대편에 갇히지 않게. 한 번 막히면 그 자리에서 남은 발사만 한다.
 if(!o.stuck)try{let ok=true;if(typeof blocked==='function'){const n=Math.max(1,Math.ceil(Math.hypot(at.x-p.x,at.y-p.y)/.25));for(let i=1;i<=n&&ok;i++)if(blocked(p.x+(at.x-p.x)*i/n,p.y+(at.y-p.y)*i/n,.3))ok=false;}if(ok){p.x=at.x;p.y=at.y;}else{o.stuck=true;stats.stuck=(stats.stuck||0)+1;}}catch(_){}
 trail.push({x:p.x,y:p.y,t:T()});if(trail.length>40)trail.shift();
 const tg=o.target;if(tg){const a=Math.atan2(tg.y-p.y,tg.x-p.x);p.attackAngle=a;p.skillAngle=a;try{p.direction=facing(tg.x-p.x,tg.y-p.y);}catch(_){}p.moving=true;p.skillAnim=Math.max(p.skillAnim||0,.12);}
 while(o.shots<SHOTS&&u>=(o.shots+1)/(SHOTS+1)){o.shots++;if(!o.target||o.target.hp<=0)o.target=nearest(p,p);const e=o.target;if(!e)continue;
  let ok=true;try{ok=typeof clearLine!=='function'||clearLine(p,e);}catch(_){}if(!ok)continue;const a=Math.atan2(e.y-p.y,e.x-p.x);
  try{hitEnemy(e,o.budget/SHOTS,{kind:'hero-golden-r72',ability:'goldenThreadR72',hero:p.hero,eventId:'r174:'+o.id+':'+o.shots,angle:a,r174Orbit:true});}catch(err){fail(err);}
  beams.push({ax:p.x,ay:p.y,e,bx:e.x,by:e.y,t0:T()});if(beams.length>12)beams.shift();stats.shots++;}
 if(u>=1){orbit=null;p.moving=false;}}
function drawOrbit(){const S=SPR();if(!S||typeof project!=='function')return;const t=T(),h=H();
 for(let i=1;i<trail.length;i++){const a=trail[i-1],b=trail[i],age=t-b.t;if(age>.6)continue;const qa=project(a.x,a.y),qb=project(b.x,b.y);S.along('line',GOLD,qa.x,qa.y-h*.3,qb.x,qb.y-h*.3,h*.07,{alpha:.75*(1-age/.6),overHero:true});}
 for(const m of beams){const v=(t-m.t0)/.35;if(v<0||v>1)continue;const qa=project(m.ax,m.ay),qb=project(m.e?.hp>0?m.e.x:m.bx,m.e?.hp>0?m.e.y:m.by);
  S.along('line',GOLD,qa.x,qa.y-h*.55,qb.x,qb.y-h*.5,h*.14*(1-v*.5),{alpha:1-v,overHero:true});S.along('line',GOLD2,qa.x,qa.y-h*.55,qb.x,qb.y-h*.5,h*.06,{alpha:.9*(1-v),overHero:true});
  S.draw('glow',GOLD,qb.x,qb.y-h*.5,h*.9,h*.9,{alpha:.7*(1-v),overHero:true});for(let k=0;k<3;k++){const a=k*2.1+m.t0;S.draw('spark',GOLD2,qb.x+Math.cos(a)*h*.25*v,qb.y-h*.5+Math.sin(a)*h*.15*v,h*.22,h*.06,{angle:a,alpha:1-v,overHero:true});}}}

// ---- 은색실: 원거리 기본 공격 적중 표시 ------------------------------------------------------------
const marked=new WeakMap();
function silverLearned(p){try{if((window.__STORYWORLD_PROGRESSION_R62__?.ranks?.('threadDanceR63',p)||0)>0)return true;}catch(_){}try{return !!window.__STORYWORLD_DANCES_R74__?.state?.('silver',p)?.learned;}catch(_){return false;}}
function motifOf(p){const M=[['threadCrossR64','cross'],['threadFlowerR64','flower'],['threadFractalR64','fractal'],['threadClawR64','claw'],['threadTsubameR64','tsubamegaeshi'],['threadIchidanR64','decisive']];
 try{const P=window.__STORYWORLD_PROGRESSION_R62__;const got=M.filter(([id])=>P.ranks(id,p)>0).map(m=>m[1]);return got.length?got[(serial++)%got.length]:null;}catch(_){return null;}}
function silverMark(e){const p=player;if(!prefs.silverMark||!ranged(p)||!e||!silverLearned(p))return;const t=T();if(t<(marked.get(e)||0))return;marked.set(e,t+.3);
 const a=Math.atan2(e.y-p.y,e.x-p.x),pa=a+Math.PI/2,L=.55;try{fx('threadSlashR63',e.x,e.y,{life:.42,size:1,threadR63:{from:{x:e.x-Math.cos(pa)*L,y:e.y-Math.sin(pa)*L},to:{x:e.x+Math.cos(pa)*L,y:e.y+Math.sin(pa)*L},angle:pa,seed:Math.random()*6.283,hitIndex:0,motif:motifOf(p),playerId:null,r174Mark:true}});stats.marks++;}catch(err){fail(err);}}

// ---- 설치 -------------------------------------------------------------------------------------
try{
 const D0=window.__STORYWORLD_DANCES_R74__;
 if(D0&&typeof D0.cast==='function'){const baseCast=D0.cast;window.__STORYWORLD_DANCES_R74__=Object.freeze({...D0,cast(k,index=0,aim=null,manual=true){if(k==='gold'){try{const r=orbitCast(index,aim,manual);if(r!==null)return r;}catch(e){fail(e);}stats.fallback++;}return baseCast(k,index,aim,manual);},r174:true});}
 if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,source,...r){const ok=base.call(this,e,value,source,...r);try{if(ok!==false&&source&&source.r160Basic===true)silverMark(e);}catch(err){fail(err);}return ok;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(ef,...a){if(ef&&ef.type==='r174-fx'){try{const f=()=>drawOrbit();if(typeof ctx.scope==='function')ctx.scope({id:'r174:orbit',kind:'effect',x:player.x,y:player.y},f);else f();}catch(err){fail(err);}return;}return base.apply(this,[ef,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{orbitTick();const t=T();for(let i=beams.length-1;i>=0;i--)if(t-beams[i].t0>.4)beams.splice(i,1);if(orbit||beams.length||trail.length&&t-trail[trail.length-1].t<.6)arm();else{trail.length=0;disarm();}}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){orbit=null;beams.length=0;trail.length=0;return base.apply(this,a);};}
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_THREADS_R174__=Object.freeze({revision:REV,set,RANGED:[...RANGED],orbitCast,silverMark,active:()=>orbit?{target:orbit.target?.id,shots:orbit.shots,R:orbit.R}:null,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},orbiting:!!orbit,lastError})});
})();
