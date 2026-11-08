// R425 슬레이어 새 R '적혈 십자가' · Q '적혈 회오리' — 사용자 2026-11-08 09:40(손그림 첨부)
//  "슬레이어 쪽에 큰 적혈 십자가가 생기고 주변에 좌우 각각 2개의 작은 적혈 십자가가 생긴 다음 각 십자가 있는 범위에 십자가 크기에 비례한 큰 피 폭발이
//   일어난 뒤 슬레이어에게 초사이어인 적혈 오라 같은 게 생긴 다음에 7초간 자동으로 적을 추적하여 공격 시 적혈 폭발이 추가 연쇄적으로 일어나도록 스플래쉬,
//   기존 허리케인 R 스킬은 큰 적혈 회오리가 검기처럼 나가는 걸로 해서 적을 관통하면서 출혈 생기게 하는 효과를 일으키면서 Q 스킬로 변경".
//  09:33 "궁극 사용 시 그냥 좌우 반전으로 회전하는 거 표현, 이미지를 종이처럼 뒤집지 말고" → 회전은 몸 그림을 좌·우로만 번갈아 뒤집는다(가로 폭 줄이기 없음).
//  09:47 상시 규칙: 십자가는 위가 짧고 아래가 긴 정십자, 절대 거꾸로 되지 않게 → 십자가는 회전 없이 똑바로만 그린다.
//
//  R(엔진 73a '피의 난도질' 슬롯 r, 재사용 대기 12.5초 그대로): 엔진 시전을 그대로 받아(쿨다운·자세·기록) 그 7번의 둘레 베기 피해만 이 연출로 바꾼다.
//   0.00초 큰 십자가(영웅 키 2.6배, 영웅 몸 위) + 좌·우 각 2개 작은 십자가(키 1.3배, 화면 좌상·좌하·우상·우하 약 2.3칸)가 0.35초에 솟는다.
//   0.55초 십자가 크기에 비례한 피 폭발: 큰 것 반경 3.2칸 ×2.6, 작은 것 반경 1.7칸 ×1.1(엔진 R 위력 attackPower 기준, 옛 7회 ×1.0 과 비슷한 규모).
//   0.75초부터 7초 적혈 오라(EGO 오라와 같은 방식, 피 색): 방향키·스틱 입력이 없으면 9칸 안 가장 가까운 적을 쫓아가 기본 공격하고,
//   그동안 영웅 공격이 피해를 줄 때마다 그 적 자리에 작은 적혈 폭발(반경 1.5칸 ×0.45) → 0.12초 뒤 2.6칸 안 다른 적 하나로 한 번 더 이어진다(×0.3).
//  Q(엔진 special '종결 강타'를 슬레이어만 대신, 재사용 대기·위력 식은 엔진과 같다): 0.32초 제자리 회전(좌·우 반전) 뒤
//   R366 피의 회오리 그림이 겨눈 쪽으로 0.95초 동안 8.5칸 날아간다(관통, 적마다 한 번 ×0.9) + 출혈 4초(0.8초마다 ×0.07, 5회, 피 방울).
//  그림: 십자가 = fx-sprites-r106 'cross'(Dots 협업 프레임 시트가 아닌 물들인 단일 그림 — 시트가 오기 전 임시), 폭발 = R190 피 터짐 시트(CC0 프레임),
//   회오리 = R366 시트. 판정은 엔진 hitEnemy 로만 준다. 끄기: localStorage['storyworld.r425.slayer']='{"on":false}' (옛 R·Q 로 돌아감)
(()=>{'use strict';
if(window.__STORYWORLD_SLAYER_BLOOD_R425__)return;
const REV='R425-slayer-blood-1',KEY='storyworld.r425.slayer',HERO='slayer';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={rCasts:0,rBlocked:0,bursts:0,chains:0,auraFrames:0,chaseSteps:0,autoSwings:0,qCasts:0,qHits:0,bleedTicks:0,flips:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const AH=()=>typeof actorHeight==='function'?actorHeight():54;
const isHero=()=>typeof player==='object'&&player?.hero===HERO&&player.hp>0;
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const SP=()=>window.__STORYWORLD_FX_SPRITES_R106__;
const BLOOD={a:[120,6,14],b:[236,60,48]},DEEP={a:[70,0,8],b:[200,20,30]};
const TAU=Math.PI*2;
const live=()=>{try{return typeof liveEnemies==='function'?liveEnemies():(room?.enemies||[]).filter(e=>e.hp>0);}catch(_){return [];}};
const dmgOK=e=>{try{return typeof damageable3==='function'?damageable3(e):e.hp>0;}catch(_){return e?.hp>0;}};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const blood=(name,x,y,o)=>{try{return window.__STORYWORLD_BLOOD_R190__?.play?.(name,x,y,o);}catch(_){return null;}};
let fxSelf=false;
function deal(e,amount,tag){if(!e||!dmgOK(e)||!(amount>0))return false;const src={kind:'r425',friendly:true,owner:'hero',r425:tag,sourceHero:HERO};try{return hitEnemy(e,amount,src);}catch(err){fail(err);return false;}}
function shakeIt(v){try{if(typeof shake==='number'&&!(typeof settings==='object'&&settings?.reducedMotion))shake=Math.max(shake,v);}catch(_){}}
// ---------------------------------------------------------------- R
let R=null;// {t0,x,y,power,crosses:[{x,y,k}],burst:false,auraEnd}
const chainSeen=new Map();
function startR(x,y,castId){const p=player;R={t0:T(),x,y,castId,room:typeof room==='object'?room:null,power:typeof attackPower==='function'?attackPower():48,burst:false,auraStart:T()+.75,auraEnd:T()+.75+7,crosses:[]};
 // 화면 좌상·좌하·우상·우하 ≈ 2.3칸: 화면 가로 +1 = 월드 (+.5,-.5) 방향, 화면 세로 +1 = (+1,+1)/√2
 const scr=(sx,sy)=>({x:x+sx*.5*2.3+sy*.5*1.1,y:y-sx*.5*2.3+sy*.5*1.1});
 R.crosses=[{...scr(0,0),k:2.6,r:3.2,m:2.6,big:true},{...scr(-2,-1),k:1.3,r:1.7,m:1.1},{...scr(-2,1),k:1.3,r:1.7,m:1.1},{...scr(2,-1),k:1.3,r:1.7,m:1.1},{...scr(2,1),k:1.3,r:1.7,m:1.1}];
 stats.rCasts++;}
function rTick(){if(!R)return;const t=T(),age=t-R.t0;let rm=null;try{rm=room;}catch(_){}
 if(rm!==R.room||!isHero()){R=null;return;}
 if(!R.burst&&age>=.55){R.burst=true;const hit=new Set();
  for(const c of R.crosses){blood(c.big?'blood-death':'blood-burst',c.x,c.y,{k:c.k*1.15,z:0});for(const e of live())if(!hit.has(e)&&dist(e,c)<=c.r+(e.radius||.3)){hit.add(e);deal(e,R.power*c.m,'r-burst');}stats.bursts++;}
  shakeIt(7);}
 if(t>=R.auraStart&&t<R.auraEnd&&solo())chase();
 if(t>=R.auraEnd&&age>1)R=null;}
const auraOn=()=>!!(R&&T()>=R.auraStart&&T()<R.auraEnd&&isHero());
function manualInput(){try{const k=typeof keys==='object'&&keys?keys:null,j=typeof joystickVector==='object'?joystickVector:{x:0,y:0};return !!((k&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].some(x=>k.has(x)))||Math.hypot(j.x||0,j.y||0)>.15||(typeof route!=='undefined'&&Array.isArray(route)&&route.length&&typeof command!=='undefined'&&command));}catch(_){return false;}}
let lastChase=0;
function chase(){const p=player,t=T();const dt=Math.min(.05,Math.max(0,t-lastChase));lastChase=t;if(manualInput()||(typeof modal!=='undefined'&&modal))return;
 let best=null,bd=9;for(const e of live()){const d=dist(e,p);if(d<bd&&dmgOK(e)){bd=d;best=e;}}if(!best)return;
 const h=typeof HEROES==='object'?HEROES[p.hero]:null,range=(h?.range||3.3)*.8;
 try{if(typeof target!=='undefined')target=best.id;}catch(_){}
 if(bd>range&&dt>0&&typeof moveActor==='function'){const v={x:(best.x-p.x)/bd,y:(best.y-p.y)/bd},sp=4.4*dt;moveActor(p,v.x*sp,v.y*sp);p.moveVX150=v.x;p.moveVY150=v.y;try{if(typeof facing==='function')p.direction=facing(v.x,v.y);}catch(_){}stats.chaseSteps++;}
 else if(!(p.attackCD>0)&&typeof basicAttack==='function'){try{basicAttack(true);stats.autoSwings++;}catch(e){fail(e);}}}
function chainBurst(e,depth){const k=e.boss||e.midboss?1.6:1.3;blood('blood-burst',e.x,e.y,{k,z:0});const hit=[];for(const v of live())if(dist(v,e)<=1.5+(v.radius||.3)){hit.push(v);deal(v,R.power*(depth?.3:.45),'r-chain');}stats.chains++;
 if(depth<1){const next=live().filter(v=>v!==e&&dmgOK(v)&&dist(v,e)<=2.6).sort((a,b)=>dist(a,e)-dist(b,e))[0];if(next&&typeof delay==='function')delay(.12,()=>{if(auraOn()&&dmgOK(next))chainBurst(next,depth+1);},'hero');}}
// ---------------------------------------------------------------- Q
let Q=null;// {t0,x,y,angle,power,launched,hit:Set,fx}
const bleeds=new Map();// e -> {next,left,amt}
function qReady(){return on&&isHero()&&solo()&&typeof started!=='undefined'&&started&&!(typeof modal!=='undefined'&&modal)&&!(typeof loading!=='undefined'&&loading)&&!(player.specialCD>0);}
function castQ(){const p=player,rk=typeof rank==='function'?rank('special'):0;p.specialCD=10*(1-.05*rk);p.skillAnim=.6;
 const power=(typeof attackPower==='function'?attackPower():48)*(2.4+.36*rk),e=typeof nearestEnemy==='function'?nearestEnemy(12):null,a=e?Math.atan2(e.y-p.y,e.x-p.x):(typeof storyAim22==='function'?storyAim22():0);
 try{if(typeof facing==='function')p.direction=facing(Math.cos(a),Math.sin(a));}catch(_){}try{if(typeof sound==='function')sound('special');}catch(_){}
 Q={t0:T(),x:p.x,y:p.y,angle:a,power,launched:false,hit:new Set(),room:typeof room==='object'?room:null,fx:null};stats.qCasts++;return true;}
function qTick(dtGuess){if(!Q)return;const t=T(),age=t-Q.t0;let rm=null;try{rm=room;}catch(_){}if(rm!==Q.room||!(player?.hp>0)){Q=null;return;}
 if(!Q.launched&&age>=.32){Q.launched=true;Q.x=player.x;Q.y=player.y;Q.ft=t;
  const f={type:'r425-tornado',x:Q.x,y:Q.y,age:0,life:1.05,q:Q};try{if(Array.isArray(effects))effects.push(f);}catch(_){}Q.fx=f;}
 if(Q.launched){const u=Math.min(1,(t-Q.ft)/.95),nx=Q.x+Math.cos(Q.angle)*8.5*u,ny=Q.y+Math.sin(Q.angle)*8.5*u;
  if(typeof blocked==='function'&&blocked(nx,ny,.2)&&u>.05){Q.stopU??=u;}
  const uu=Q.stopU??u,cx=Q.x+Math.cos(Q.angle)*8.5*uu,cy=Q.y+Math.sin(Q.angle)*8.5*uu;if(Q.fx){Q.fx.x=cx;Q.fx.y=cy;}
  for(const e of live())if(!Q.hit.has(e)&&dist(e,{x:cx,y:cy})<=1.0+(e.radius||.3)){Q.hit.add(e);if(deal(e,Q.power*.9,'q-tornado')){stats.qHits++;bleeds.set(e,{next:t+.8,left:5,amt:Q.power*.07});blood('blood-splash',e.x,e.y,{k:.9,z:AH()*.5});}}
  if(u>=1||Q.stopU!=null&&t-Q.ft>.95)Q=null;}}
function bleedTick(){if(!bleeds.size)return;const t=T();for(const [e,b] of bleeds){if(!(e.hp>0)){bleeds.delete(e);continue;}if(t>=b.next){b.next=t+.8;b.left--;deal(e,b.amt,'q-bleed');blood('blood-splash',e.x,e.y,{k:.55,z:AH()*.35});stats.bleedTicks++;if(b.left<=0)bleeds.delete(e);}}}
// ---------------------------------------------------------------- 그림
function drawCrosses(){const S=SP();if(!R||!S?.draw||typeof project!=='function')return;const age=T()-R.t0;if(age>1.0)return;const H=AH();
 const grow=Math.min(1,age/.35),fade=age<.55?1:Math.max(0,1-(age-.55)/.45);
 for(const c of R.crosses){const q=project(c.x,c.y),h=H*c.k*(.6+.4*grow),w=h*256/384,y0=q.y-(c.big?H*.55:H*.15);
  S.draw('glow',BLOOD,q.x,y0,h*1.1,h*1.1,{alpha:.45*grow*fade,blend:'lighter'});
  S.draw('cross',DEEP,q.x,y0,w*1.08,h*1.08,{alpha:.75*grow*fade,blend:'source-over',angle:0,overHero:!c.big});
  S.draw('cross',BLOOD,q.x,y0,w,h,{alpha:.9*grow*fade,angle:0,overHero:!c.big});
  if(age>.4&&age<.6)S.draw('flare',BLOOD,q.x,y0,h*1.4,h*1.4,{alpha:(1-Math.abs(age-.5)/.1)*.7});}}
function auraBack(){const S=SP();if(!S?.draw)return;const q=project(player.x,player.y),h=AH(),x=q.x,y=q.y-Math.min(Math.max(+player.visualLiftPx||0,0),h*.65),t=T(),fr=Math.floor(t*14),since=t-R.auraStart,swell=1+.35*Math.max(0,1-since/.6),I=S.pal?S.pal(BLOOD.b):BLOOD;
 S.draw('glow',BLOOD,x,y,h*2.6*swell,h*1.1*swell,{alpha:.4,squash:.5});
 S.draw('flame',BLOOD,x,y+h*.06,h*1.6*swell,h*2.4*swell,{frame:fr,alpha:.6,blend:'source-over'});
 S.draw('flame',I,x,y+h*.04,h*1.0*swell,h*1.8*swell,{frame:fr+2,alpha:.4});
 for(let i=0;i<10;i++){const a=i*TAU/10+t*.8,dep=Math.sin(a);if(dep>0)continue;S.draw('spike',i%3?BLOOD:I,x+Math.cos(a)*h*.34,y+dep*h*.1-h*.04,h*.16,h*(1+.6*((i*37)%10)/10)*swell*(.7+.3*Math.sin(t*(11+i))),{angle:Math.cos(a)*.38,alpha:.85});}}
function auraFront(){const S=SP();if(!S?.draw)return;const q=project(player.x,player.y),h=AH(),x=q.x,y=q.y-Math.min(Math.max(+player.visualLiftPx||0,0),h*.65),t=T();
 for(let i=0;i<10;i++){const a=i*TAU/10+t*.8,dep=Math.sin(a);if(dep<=0)continue;S.draw('spike',BLOOD,x+Math.cos(a)*h*.36,y+dep*h*.1,h*.14,h*(.75+.4*((i*53)%10)/10)*(.7+.3*Math.sin(t*(11+i))),{angle:Math.cos(a)*.38,alpha:.42,overHero:true});}
 for(let i=0;i<8;i++){const ph=(t*(.9+.07*i)+i*.13)%1;S.draw('spark',BLOOD,x+(((i*29)%10)/10-.5)*h*.9,y-h*(.1+1.6*ph),h*.3,h*.07,{angle:-Math.PI/2,alpha:Math.sin(Math.PI*ph)*.9,overHero:true});}}
const scope=(o,fn)=>{if(typeof ctx!=='undefined'&&typeof ctx?.scope==='function')return ctx.scope(o,fn);return fn();};
// 회오리(R366 시트 재사용) — 겨눈 쪽으로 나가는 검기
function drawTornado(f){const R366=window.__STORYWORLD_SLAYER_R_TORNADO_R366__,IDX=R366?.index?.();if(!IDX||typeof project!=='function')return;const q=project(f.x,f.y),H=AH(),age=f.age||0;
 for(const kind of ['back','front']){const L=IDX.layers[kind];const row=typeof readyImage==='function'?readyImage('assets/r366/'+L.file):null;if(!row?.image){try{if(typeof ensureImages==='function')ensureImages(['assets/r366/'+L.file]);}catch(_){}continue;}
  const n=IDX.frames,[cw,ch]=IDX.cell,[ox,oy]=IDX.origin,fr=Math.floor(age/(IDX.loop_s||.5)*n*1.6)%n,s=H*1.7/(IDX.height_px||250)*Math.min(1,.5+age*4),al=Math.min(1,(f.life-age)*4);
  ctx.save();try{ctx.globalAlpha*=al;ctx.drawImage(row.image,fr*cw,0,cw,ch,q.x-ox*s,q.y-oy*s,cw*s,ch*s);}finally{ctx.restore();}}
 const S=SP();if(S?.draw&&f.q){const back=project(f.x-Math.cos(f.q.angle)*1.2,f.y-Math.sin(f.q.angle)*1.2);S.along?.('slashline',BLOOD,back.x,back.y-H*.3,q.x,q.y-H*.3,H*.5,{alpha:.55});}}
// 몸 회전: 0.32초 동안 0.08초마다 좌·우 반전(가로 폭은 그대로)
function flip(rec,st){const age=T()-Q.t0;if(age>.32)return;if(Math.floor(age/.08)%2===0)return;const q=project(player.x,player.y);
 let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c?.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const s=String(c.sourcePath||c.image?.src||'');if(/fx|effect|r366|r425/.test(s))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
 if(best){best.points=best.points.map(([x,y])=>[2*q.x-x,y]);stats.flips++;}}
// ---------------------------------------------------------------- 연결
if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){
 try{const o=opt||{};if(on&&type==='storySourceSkill'&&o.storyWER&&o.sourceHero===HERO&&o.sourceSlot==='r'&&!o.r139SamongUlt&&isHero()){
   if(o.castId!=null&&(!R||R.castId!==o.castId)&&o.stage!=='hit')startR(player.x,player.y,o.castId);return null;/* 옛 R 그림(73a 원천·R366 회오리·R209 칼자국)은 띄우지 않는다 */}}catch(e){fail(e);}
 return base.apply(this,arguments);};}
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,amount,source,...a){
 if(on&&source&&source.storyWER&&source.sourceHero===HERO&&source.sourceSlot==='r'&&!source.r425&&typeof player==='object'&&player?.hero===HERO){stats.rBlocked++;return false;}/* 옛 R 7회 둘레 베기 피해 → 십자가 폭발로 대신 */
 const old=e?.hp;const r=base.apply(this,[e,amount,source,...a]);
 try{if(auraOn()&&e&&old>e.hp&&!(source&&source.r425)&&!(source&&source.friendly===false)){const t=T(),last=chainSeen.get(e)||-9;if(t-last>.25){chainSeen.set(e,t);if(chainSeen.size>64)chainSeen.delete(chainSeen.keys().next().value);chainBurst(e,0);}}}catch(err){fail(err);}
 return r;};}
if(typeof special==='function'){const base=special;special=function(...a){if(on&&typeof player==='object'&&player?.hero===HERO&&solo()){if(qReady())castQ();return;}return base.apply(this,a);};}
if(typeof tick==='function'){const base=tick;tick=function(dt,...a){const r=base.apply(this,[dt,...a]);try{if(on){rTick();qTick(dt);bleedTick();}}catch(e){fail(e);}return r;};}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(f,...a){if(f&&f.type==='r425-tornado'){try{scope({id:'r425:tornado',kind:'effect',x:f.x,y:f.y,groundAligned:false},()=>drawTornado(f));}catch(e){fail(e);}return;}return base.apply(this,[f,...a]);};}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const aura=on&&auraOn();
 if(aura)try{scope({id:'r425:aura-back',kind:'effect',x:player.x,y:player.y,groundAligned:false},()=>{ctx.save();try{auraBack();}finally{ctx.restore();}});stats.auraFrames++;}catch(e){fail(e);}
 const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
 try{if(on&&Q&&!Q.launched&&st>=0&&isHero())flip(rec,st);}catch(e){fail(e);}
 if(aura)try{scope({id:'r425:aura-front',kind:'effect',x:player.x,y:player.y,groundAligned:false},()=>{ctx.save();try{auraFront();}finally{ctx.restore();}});}catch(e){fail(e);}
 if(on&&R)try{scope({id:'r425:crosses',kind:'effect',x:R.x,y:R.y,groundAligned:false},()=>{ctx.save();try{drawCrosses();}finally{ctx.restore();}});}catch(e){fail(e);}
 return r;};}
window.__STORYWORLD_SLAYER_BLOOD_R425__=Object.freeze({revision:REV,on:()=>on,auraOn:()=>auraOn(),
 state:()=>({R:R&&{age:+(T()-R.t0).toFixed(2),burst:R.burst,aura:auraOn(),auraLeft:+(R.auraEnd-T()).toFixed(2)},Q:Q&&{age:+(T()-Q.t0).toFixed(2),launched:Q.launched,hits:Q.hit.size},bleeding:bleeds.size}),
 inspect:()=>({revision:REV,on,stats:{...stats},lastError,browser:false,GPU:false}),
 set:v=>{on=v!==false;if(!on){R=null;Q=null;bleeds.clear();}try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
