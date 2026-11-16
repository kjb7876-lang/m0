/* R1096 히든 페르소나 '거울 천체'(사용자 2026-11-16 02:13Z "라우렌 스킬중 아카아오 허식 무라사키 오마쥬한 스킬… 히든영웅이랑 페르소나보스가
 *  그들 방식대로 개선적용해서 확률론적사용하도록"). 이 파일은 페르소나 보스 몫이다(EGO 몫은 EGO 스레드가 따로 한다).
 * 라우렌 R946 '천체 공명'의 밀어내는 구·끌어당기는 구·융합 관통탄을 '동작 원리'만 가져와, 페르소나(순수악의 · 거울에 비친 안쪽의 악)에 맞게 뒤집었다:
 *  라우렌은 적을 향해 쓰지만 페르소나는 영웅을 겨누고, 연보라·실버 대신 붉은 시간의 핏빛·흑색으로 칠한다. 이름·모양은 새로 지었다.
 *  ① 붉은 거울별(밀어냄): 0.75초 동안 영웅 쪽 길에 붉은 띠 예고 → 붉은 구가 9칸 날아가며 닿으면 페르소나 탄 1.2배 + 진행 방향으로 1.6칸 밀어냄. 벽에서 멈춤.
 *  ② 검은 우물별(끌어당김): 시전 순간 영웅 자리에 0.8초 동안 검붉은 원반 예고 → 1.4초 동안 2.6칸 안 영웅을 핵 쪽으로 끌고, 핵 1칸 안에 0.35초마다 0.3배(최대 4번).
 *     회피(구르기) 무적 중엔 끌지 않는다.
 *  ③ 자아 월식(융합 관통탄): 붉은 거울별·검은 우물별을 40초 안에 다 썼을 때만(페르소나는 6초 쉬고 굴리므로 라우렌의 12초보다 길게) 후보가 되고, 그때 굴림이 성공하면 60% 로 나간다(라우렌은 반드시 → 페르소나는 확률).
 *     0.9초 동안 페르소나 앞에서 두 별이 합쳐지며 겨눈 줄(고정)을 예고 → 11칸 관통탄 2.4배, 한 번만 맞힘. 벽에서 멈춤.
 * 굴림: 페르소나 결전(room.activeEncounter==='persona') 중 페르소나가 보이고(spawnState active) 영웅이 14칸 안·시야 안일 때 게임 시간 3.2~4.5초마다 한 번,
 *  보통 22%, 깨어남(awakeUntil) 중 32%. 성공하면 6초 동안 굴리지 않는다. 붉은 시간 시전(redTimeCastUntil9) 중·장면·창·읽기 중엔 굴리지 않는다.
 * 그림: Dots CX-0087LC 라우렌 시트(assets/r946)를 허용된 필터(hue-rotate·brightness·saturate·contrast)로 핏빛·흑색으로 바꿔 임시로 쓴다.
 *  최종 그림은 Dots 에 페르소나판(핏빛·흑색) 시트를 요청한다 — 이 임시 색입힘을 최종 아트라고 보고하지 않는다. 시트가 아직 안 읽혔으면 코드 그림으로 그린다.
 *  예고는 흰 원·빨간 고리가 아니라 검붉은 채움(차오르는 진행)으로 그린다.
 * 끄기: localStorage['storyworld.r1096.personaGravity']='{"on":false}'
 */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_PERSONA_GRAVITY_R1096__)return;
const REV='R1096-persona-gravity-1',KEY='storyworld.r1096.personaGravity';
const CHANCE=.22,AWAKE_CHANCE=.32,ROLL_MIN=3.2,ROLL_SPREAD=1.3,ICD=6,COMBO_WINDOW=40,ECL_CHANCE=.6,RANGE=14,HERO_R=.27;
const CR_WARN=.75,CR_V=6.5,CR_RANGE=9,CR_R=.55,CR_K=1.2,CR_PUSH=1.6,CR_PUSH_T=.2;
const AB_WARN=.8,AB_LIFE=1.4,AB_R=2.6,AB_CORE=1,AB_V=2.3,AB_TICK=.35,AB_TICKS=4,AB_K=.3;
const EC_WARN=.9,EC_V=16,EC_RANGE=11,EC_R=.5,EC_K=2.4;
const finite=(v,d=0)=>Number.isFinite(v)?v:d;
const T=()=>{try{return typeof time==='number'&&Number.isFinite(time)?time:0;}catch(_){return 0;}};
function P(){try{return typeof player==='object'&&player?player:null;}catch(_){return null;}}
function curRoom(){try{return typeof room!=='undefined'?room:null;}catch(_){return null;}}
function blockedNow(){try{if(typeof storyScene!=='undefined'&&storyScene)return true;if(typeof modal!=='undefined'&&modal)return true;if(typeof loading!=='undefined'&&loading)return true;if(typeof started!=='undefined'&&!started)return true;}catch(_){}return false;}
function enemiesNow(){try{return typeof liveEnemies==='function'?liveEnemies():[];}catch(_){return [];}}
function lineOk(a,b){try{return typeof clearLine==='function'?!!clearLine(a,b):true;}catch(_){return true;}}
function wallAt(x,y){try{return typeof blocked==='function'?!!blocked(x,y,.2):false;}catch(_){return false;}}
function play(k){try{if(typeof sound==='function')sound(k);}catch(_){}}
function hit(d,src){try{if(typeof hurt==='function'&&Number.isFinite(d)&&d>0)return hurt(d,src);}catch(e){fail(e);}return 'ignored';}
function nudge(o,dx,dy){if(!Number.isFinite(dx)||!Number.isFinite(dy))return;try{if(typeof moveActor==='function')moveActor(o,dx,dy,HERO_R);else{o.x+=dx;o.y+=dy;}}catch(e){fail(e);}}
const okPos=o=>!!o&&Number.isFinite(o.x)&&Number.isFinite(o.y);
let rng=null;const R=()=>{const v=rng?rng():Math.random();return Number.isFinite(v)?Math.max(0,Math.min(.999999,v)):.5;};
const stats={rolls:0,procs:0,casts:0,cast:{crimson:0,abyss:0,eclipse:0},hits:{crimson:0,abyss:0,eclipse:0},order:[],errors:0,draws:0,sheetDraws:0,lastError:''};
function fail(e){stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,160);}
let prefOn=true,prefAt=-1e9;
function on(){const t=Date.now();if(t-prefAt>2000){prefAt=t;try{const v=JSON.parse(localStorage.getItem(KEY)||'null');prefOn=!(v&&v.on===false);}catch(_){prefOn=true;}}return prefOn;}
// 상태: 페르소나 몸마다(되살아남·다시 소환에도 그 몸 기준)
const states=new WeakMap();
function stateOf(e){let s=states.get(e);if(!s){s={nextRoll:T()+ROLL_MIN+R()*ROLL_SPREAD,readyAt:-1e9,lastCr:-1e9,lastAb:-1e9};states.set(e,s);}return s;}
function persona(){const rm=curRoom();if(!rm||rm.activeEncounter!=='persona')return null;for(const e of enemiesNow())if(e&&e.persona&&e.hp>0&&e.spawnState==='active'&&okPos(e))return e;return null;}
function comboOf(s,t){return t-s.lastCr<=COMBO_WINDOW&&t-s.lastAb<=COMBO_WINDOW;}
let acts=[],forcedCombo=false;
function unit(a,b){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);return d>1e-6?{ux:dx/d,uy:dy/d,d}:{ux:1,uy:0,d:0};}
function src(e,kind){return {kind:'persona-gravity-r1096',r1096:kind,owner:e.id,name:e.name,persona:true};}
function cast(e,kind){const p=P(),t=T(),s=stateOf(e);if(!okPos(p)||!okPos(e))return null;const u=unit(e,p);let x;
 if(kind==='crimson'){x={kind,phase:'warn',warn:CR_WARN,t0:t,owner:e,sx:e.x,sy:e.y,x:e.x,y:e.y,ux:u.ux,uy:u.uy,left:CR_RANGE,radius:CR_R,dmg:finite(e.damage,10)*CR_K,hit:false,push:0,trail:[]};s.lastCr=t;}
 else if(kind==='abyss'){x={kind,phase:'warn',warn:AB_WARN,t0:t,owner:e,x:p.x,y:p.y,radius:AB_R,dmg:finite(e.damage,10)*AB_K,ticks:0,nextTick:0};s.lastAb=t;}
 else if(kind==='eclipse'){x={kind,phase:'warn',warn:EC_WARN,t0:t,owner:e,sx:e.x,sy:e.y,x:e.x,y:e.y,ux:u.ux,uy:u.uy,left:EC_RANGE,radius:EC_R,dmg:finite(e.damage,10)*EC_K,hit:false};s.lastCr=s.lastAb=-1e9;}
 else return null;
 acts.push(x);s.readyAt=t+ICD;stats.casts++;stats.cast[kind]++;if(stats.order.length<400)stats.order.push({kind,t});play('boss');sentinel(true);return kind;}
function pick(e,s,t){if((comboOf(s,t)||forcedCombo)&&R()<ECL_CHANCE){forcedCombo=false;return 'eclipse';}
 const needCr=t-s.lastCr>COMBO_WINDOW,needAb=t-s.lastAb>COMBO_WINDOW;let pCr=.5;if(needCr&&!needAb)pCr=.65;else if(needAb&&!needCr)pCr=.35;return R()<pCr?'crimson':'abyss';}
function roll(e,t){const s=stateOf(e),p=P();if(t<s.nextRoll)return;s.nextRoll=t+ROLL_MIN+R()*ROLL_SPREAD;
 if(t<s.readyAt||acts.some(x=>x.owner===e)||finite(e.redTimeCastUntil9)>t||!okPos(p)||!(p.hp>0))return;
 if(Math.hypot(p.x-e.x,p.y-e.y)>RANGE||!lineOk(e,p))return;
 stats.rolls++;const awake=finite(e.awakeUntil)>t;if(R()>=(awake?AWAKE_CHANCE:CHANCE))return;stats.procs++;cast(e,pick(e,s,t));}
// 날아가는 구·관통탄: 한 프레임에 0.12칸씩 나눠 벽·영웅을 본다
function fly(x,dt,v,onHit){const p=P();let step=Math.min(x.left,v*dt);while(step>1e-6){const s=Math.min(.12,step);const nx=x.x+x.ux*s,ny=x.y+x.uy*s;if(wallAt(nx,ny)){x.left=0;return false;}
 x.x=nx;x.y=ny;x.left-=s;step-=s;if(!x.hit&&okPos(p)&&Math.hypot(p.x-x.x,p.y-x.y)<=x.radius+HERO_R){x.hit=true;onHit(p);}}return x.left>1e-6;}
function stepAct(x,t,dt){const e=x.owner,u=t-x.t0;if(!e||!(e.hp>0)||e.spawnState!=='active')return false;
 if(x.phase==='warn'){if(u<x.warn)return true;x.phase='live';x.tl=t;play('special');if(x.kind==='crimson'||x.kind==='eclipse'){x.x=x.sx;x.y=x.sy;}}
 const v=t-x.tl;
 if(x.kind==='crimson'){if(x.push>0){const p=P(),s=Math.min(x.push,CR_PUSH/CR_PUSH_T*dt);if(okPos(p))nudge(p,x.ux*s,x.uy*s);x.push-=s;}
  if(x.end==null){x.trail.push({x:x.x,y:x.y});if(x.trail.length>6)x.trail.shift();if(!fly(x,dt,CR_V,p=>{const r=hit(x.dmg,src(e,'crimson'));if(r==='hit'||r==='blocked'){stats.hits.crimson++;x.push=CR_PUSH;}}))x.end=t;}
  return x.end==null||t-x.end<.3||x.push>0;}
 if(x.kind==='abyss'){if(v>AB_LIFE)return t-x.tl<AB_LIFE+.3;const p=P();if(!okPos(p)||!(p.hp>0))return true;const dx=x.x-p.x,dy=x.y-p.y,d=Math.hypot(dx,dy);
  const dodging=p.invincible>0&&/회피|dodge|roll/i.test(String(p.invReason||''));
  if(d<=x.radius&&d>.15&&!dodging){const k=.6+.4*(1-d/x.radius),s=Math.min(AB_V*k*dt,d-.1);nudge(p,dx/d*s,dy/d*s);}
  if(d<=AB_CORE+HERO_R&&v>=x.nextTick&&x.ticks<AB_TICKS){x.ticks++;x.nextTick=v+AB_TICK;const r=hit(x.dmg,src(e,'abyss'));if(r==='hit'||r==='blocked')stats.hits.abyss++;}
  return true;}
 if(x.kind==='eclipse'){if(x.end==null&&!fly(x,dt,EC_V,p=>{const r=hit(x.dmg,src(e,'eclipse'));if(r==='hit'||r==='blocked')stats.hits.eclipse++;}))x.end=t;return x.end==null||t-x.end<.35;}
 return false;}
let lastT=null;
function step(){const t=T(),dt=lastT==null?0:Math.max(0,Math.min(.1,t-lastT));lastT=t;
 if(!on()||blockedNow()){if(!on())acts=[];return;}
 const e=persona();if(e){try{roll(e,t);}catch(err){fail(err);}}
 if(dt>0)acts=acts.filter(x=>{try{return stepAct(x,t,dt);}catch(err){fail(err);return false;}});
 else acts=acts.filter(x=>x.owner&&x.owner.hp>0&&x.owner.spawnState==='active');}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{step();}catch(err){fail(err);acts=[];}sentinel(acts.length>0);return r;};}
// ---- 그리기 ---------------------------------------------------------------------------------------------
// 색: 핏빛(붉은 시간) · 흑색 · 뼈빛 테. 예고는 검붉은 채움이 차오르는 꼴(흰 원+빨간 고리 금지).
const BLOOD='176,18,32',BLOOD_HOT='255,92,86',BONE='238,222,210',INK='14,4,8',EMBER='120,8,20';
const SDIR='assets/r946/',SCELL=192,SCOLS=6;
const SHEETS={red:{n:'lauren-red',frames:24,fps:12.5,loop:true,piv:[141,137],body:145},blue:{n:'lauren-blue',frames:24,fps:12.5,loop:true,piv:[128,126],body:127},
 disk:{n:'lauren-blue-disk',frames:24,fps:12.5,loop:true,piv:[127,134],body:192},fuse:{n:'lauren-fuse',frames:12,fps:24,loop:false,piv:[128,128],body:107,crop:[60,60,196,200]},
 violet:{n:'lauren-violet',frames:24,fps:12.5,loop:true,piv:[144,128],body:150}};
// 라우렌 시트(연보라 약 265°)를 핏빛·흑색으로: 허용 필터만 쓴다(Three.js 기록기)
const TINT={red:'hue-rotate(100deg) saturate(3) brightness(.8) contrast(1.35)',blue:'hue-rotate(100deg) saturate(1.6) brightness(.55) contrast(1.35)',disk:'hue-rotate(100deg) saturate(1.5) brightness(.5) contrast(1.4)',
 fuse:'hue-rotate(100deg) saturate(1.8) contrast(1.2)',violet:'hue-rotate(100deg) saturate(1.9) brightness(.8) contrast(1.3)'};
const SPATH=k=>SDIR+SHEETS[k].n+'.webp';let sheetsOn=true,askAt=-1e9;
function simg(k){try{const r=typeof readyImage==='function'?readyImage(SPATH(k)):null,im=r&&r.image;if(!im)return null;const w=im.naturalWidth||im.width||0,h=im.naturalHeight||im.height||0,rows=Math.ceil(SHEETS[k].frames/SCOLS);return w===SCOLS*SCELL&&h===rows*SCELL?im:null;}catch(_){return null;}}
function askSheets(){if(!sheetsOn)return;const t=T();if(t-askAt<2&&t>=askAt)return;const miss=Object.keys(SHEETS).filter(k=>!simg(k));if(!miss.length)return;askAt=t;try{if(typeof ensureImages==='function'){const r=ensureImages(miss.map(SPATH));if(r&&typeof r.catch==='function')r.catch(()=>{});}}catch(e){fail(e);}}
function sframe(k,age){const m=SHEETS[k];let f=Math.floor(Math.max(0,age)*m.fps+1e-6);if(m.loop)f%=m.frames;else if(f>=m.frames)f=m.frames-1;return f;}
function sheet(k,age,x,y,d,o={}){if(!sheetsOn||!Number.isFinite(x)||!Number.isFinite(y)||!(d>0)||!Number.isFinite(d))return false;const im=simg(k);if(!im)return false;const m=SHEETS[k],f=sframe(k,age),sx=(f%SCOLS)*SCELL,sy=Math.floor(f/SCOLS)*SCELL,w=d*256/m.body,h=w*(o.squash||1),c=m.crop||[0,0,256,256],K=SCELL/256;
 ctx.save();try{ctx.globalAlpha*=Math.max(0,Math.min(1,o.alpha??1));if('filter' in ctx)ctx.filter=TINT[k]||'none';ctx.translate(x,y);if(o.flip)ctx.scale(-1,1);if(o.angle)ctx.rotate(o.angle);ctx.drawImage(im,sx+c[0]*K,sy+c[1]*K,(c[2]-c[0])*K,(c[3]-c[1])*K,(c[0]-m.piv[0])/256*w,(c[1]-m.piv[1])/256*h,(c[2]-c[0])/256*w,(c[3]-c[1])/256*h);stats.sheetDraws++;}finally{ctx.restore();}return true;}
function sc(o,f){if(typeof ctx!=='undefined'&&ctx&&typeof ctx.scope==='function')ctx.scope(o,f);else f();}
function scale(){const z=typeof zoom==='number'&&zoom>0?zoom:1,TL=typeof TILE==='number'?TILE:34;return {z,T1:TL*z*Math.SQRT2,AH:typeof actorHeight==='function'?finite(actorHeight(),66*z):66*z};}
function heading(x){const a=project(x.sx??x.x,x.sy??x.y),b=project((x.sx??x.x)+x.ux,(x.sy??x.y)+x.uy),dx=b.x-a.x,dy=b.y-a.y;return {flip:dx<0,angle:Math.max(-.6,Math.min(.6,Math.atan2(dy,Math.abs(dx)||1e-6)))};}
function orb(x,y,r,core,mid,alpha){if(!(r>0)||!Number.isFinite(x)||!Number.isFinite(y))return;ctx.save();try{ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));
 ctx.fillStyle=`rgba(${INK},.85)`;ctx.beginPath();ctx.arc(x,y,r*1.15,0,Math.PI*2);ctx.fill();
 const prev=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(${mid},.9)`;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=`rgba(${core},.8)`;ctx.beginPath();ctx.arc(x-r*.18,y-r*.2,r*.45,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation=prev;}finally{ctx.restore();}}
// 길 예고: 영웅 쪽 띠가 페르소나에서부터 검붉게 차오른다(f=진행 0..1). 띠 너비 = 맞는 폭
function lane(x,len,width,f,id){const a=project(x.sx,x.sy),b=project(x.sx+x.ux*len,x.sy+x.uy*len),n=project(x.sx+x.uy*width,x.sy-x.ux*width);const nx=n.x-a.x,ny=n.y-a.y;
 if(![a.x,a.y,b.x,b.y,nx,ny].every(Number.isFinite))return;
 sc({id,kind:'effect',pxfSide:'enemy',x:x.sx+x.ux*len/2,y:x.sy+x.uy*len/2,groundAligned:true},()=>{ctx.save();try{
  ctx.fillStyle=`rgba(${INK},${.32+.2*f})`;ctx.beginPath();ctx.moveTo(a.x+nx,a.y+ny);ctx.lineTo(b.x+nx,b.y+ny);ctx.lineTo(b.x-nx,b.y-ny);ctx.lineTo(a.x-nx,a.y-ny);ctx.closePath();ctx.fill();
  const mx=a.x+(b.x-a.x)*f,my=a.y+(b.y-a.y)*f;ctx.fillStyle=`rgba(${BLOOD},${.35+.3*f})`;ctx.beginPath();ctx.moveTo(a.x+nx,a.y+ny);ctx.lineTo(mx+nx,my+ny);ctx.lineTo(mx-nx,my-ny);ctx.lineTo(a.x-nx,a.y-ny);ctx.closePath();ctx.fill();
  ctx.strokeStyle=`rgba(${EMBER},.85)`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x+nx,a.y+ny);ctx.lineTo(b.x+nx,b.y+ny);ctx.moveTo(a.x-nx,a.y-ny);ctx.lineTo(b.x-nx,b.y-ny);ctx.stroke();
  // 진행 방향 갈매기 표지(3개, 차오름을 따라 붉어짐)
  for(let i=1;i<=3;i++){const k=i/4,cx=a.x+(b.x-a.x)*k,cy=a.y+(b.y-a.y)*k,ux=(b.x-a.x)/len*.35,uy=(b.y-a.y)/len*.35;ctx.strokeStyle=k<=f?`rgba(${BLOOD_HOT},.9)`:`rgba(${EMBER},.6)`;ctx.lineWidth=2.5;
   ctx.beginPath();ctx.moveTo(cx-ux+nx*.6,cy-uy+ny*.6);ctx.lineTo(cx+ux,cy+uy);ctx.lineTo(cx-ux-nx*.6,cy-uy-ny*.6);ctx.stroke();}
 }finally{ctx.restore();}});}
// 반경 R 칸의 바닥 원 = 화면 타원 가로 반지름 R·T1, 세로 R·T1/2 (project 가 (x−y)·TILE, (x+y)·TILE/2 이므로) — 예고 크기 = 실제 끌림 범위
function disk(q,Rx,f,alpha){if(!(Rx>0)||!Number.isFinite(q.x)||!Number.isFinite(q.y))return;ctx.save();try{ctx.globalAlpha*=alpha;ctx.fillStyle=`rgba(${INK},.5)`;ctx.beginPath();ctx.ellipse(q.x,q.y,Rx,Rx*.5,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=`rgba(${BLOOD},.5)`;ctx.beginPath();ctx.ellipse(q.x,q.y,Rx*f,Rx*.5*f,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=`rgba(${INK},.9)`;ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(q.x,q.y,Rx,Rx*.5,0,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle=`rgba(${BLOOD_HOT},.85)`;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(q.x,q.y,Rx,Rx*.5,0,0,Math.PI*2);ctx.stroke();}finally{ctx.restore();}}
function drawCrimson(x,t){const {AH,T1}=scale(),lift=AH*.55,r=AH*.26,id='r1096:crimson:'+x.t0.toFixed(2);
 if(x.phase==='warn'){const f=Math.min(1,(t-x.t0)/x.warn);lane(x,CR_RANGE,x.radius+HERO_R,f,id+':warn');const q=project(x.sx+x.ux*.8,x.sy+x.uy*.8);
  sc({id:id+':grow',kind:'effect',pxfSide:'enemy',x:x.sx,y:x.sy},()=>{if(!sheet('red',t-x.t0,q.x,q.y-lift,r*2*(.4+.6*f),{alpha:.6+.4*f,flip:!heading(x).flip}))orb(q.x,q.y-lift,r*(.4+.6*f),BONE,BLOOD,.6+.4*f);});return;}
 const fade=x.end==null?1:Math.max(0,1-(t-x.end)/.3),q=project(x.x,x.y);
 sc({id:id+':orb',kind:'effect',pxfSide:'enemy',x:x.x,y:x.y},()=>{for(let i=0;i<x.trail.length;i++){const p=project(x.trail[i].x,x.trail[i].y),k=(i+1)/(x.trail.length+1);orb(p.x,p.y-lift,r*(.3+.4*k),BLOOD_HOT,BLOOD,.25*k*fade);}
  orb(q.x,q.y-lift,r*1.05,BLOOD_HOT,BLOOD,fade*.75);sheet('red',t-x.t0,q.x,q.y-lift,r*2,{alpha:fade,flip:!heading(x).flip});});}
function drawAbyss(x,t){const {T1,AH}=scale(),q=project(x.x,x.y),u=t-x.t0,Rx=x.radius*T1,id='r1096:abyss:'+x.t0.toFixed(2);
 if(x.phase==='warn'){const f=Math.min(1,u/x.warn);sc({id:id+':warn',kind:'effect',pxfSide:'enemy',x:x.x,y:x.y,groundAligned:true},()=>disk(q,Rx,f,.85));return;}
 const v=t-x.tl,fade=v>AB_LIFE?Math.max(0,1-(v-AB_LIFE)/.3):1;
 sc({id:id+':disk',kind:'effect',pxfSide:'enemy',x:x.x,y:x.y,groundAligned:true},()=>{disk(q,Rx,1,fade*.55);sheet('disk',v,q.x,q.y,Rx*2,{alpha:fade*.9});
  const cr=AB_CORE*T1;ctx.save();try{ctx.globalAlpha*=fade;ctx.strokeStyle=`rgba(${BLOOD_HOT},.8)`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(q.x,q.y,cr,cr*.5,0,0,Math.PI*2);ctx.stroke();}finally{ctx.restore();}});
 sc({id:id+':orb',kind:'effect',pxfSide:'enemy',x:x.x,y:x.y},()=>{const r=AH*.24,cy=q.y-AH*.6;if(!sheet('blue',v,q.x,cy,r*2,{alpha:fade}))orb(q.x,cy,r,BLOOD_HOT,INK,fade);});}
function drawEclipse(x,t){const {AH}=scale(),lift=AH*.55,id='r1096:eclipse:'+x.t0.toFixed(2);
 if(x.phase==='warn'){const f=Math.min(1,(t-x.t0)/x.warn);lane(x,EC_RANGE,x.radius*.6,f,id+':warn');const m=project(x.sx+x.ux*.7,x.sy+x.uy*.7);
  sc({id:id+':charge',kind:'effect',pxfSide:'enemy',x:x.sx,y:x.sy},()=>{if(sheet('fuse',(t-x.t0)*(.5/x.warn),m.x,m.y-lift,AH*.8))return;const px=-x.uy,py=x.ux,sep=1.2*(1-f*f),a=project(x.sx+x.ux*.7+px*sep,x.sy+x.uy*.7+py*sep),b=project(x.sx+x.ux*.7-px*sep,x.sy+x.uy*.7-py*sep);
   orb(a.x,a.y-lift,AH*.18,BONE,BLOOD,1);orb(b.x,b.y-lift,AH*.18,BLOOD_HOT,INK,1);});return;}
 const fade=x.end==null?1:Math.max(0,1-(t-x.end)/.35),q=project(x.x,x.y),s=project(x.sx,x.sy);
 sc({id:id+':scar',kind:'effect',pxfSide:'enemy',x:(x.sx+x.x)/2,y:(x.sy+x.y)/2,groundAligned:true},()=>{if(![s.x,s.y,q.x,q.y].every(Number.isFinite))return;ctx.save();try{ctx.globalAlpha*=fade*.85;ctx.strokeStyle=`rgba(${INK},.85)`;ctx.lineWidth=Math.max(3,AH*.12);ctx.beginPath();ctx.moveTo(s.x,s.y-lift);ctx.lineTo(q.x,q.y-lift);ctx.stroke();
  ctx.strokeStyle=`rgba(${BLOOD_HOT},.85)`;ctx.lineWidth=Math.max(1.5,AH*.03);ctx.beginPath();ctx.moveTo(s.x,s.y-lift);ctx.lineTo(q.x,q.y-lift);ctx.stroke();}finally{ctx.restore();}});
 if(x.end==null||t-x.end<.15)sc({id:id+':orb',kind:'effect',pxfSide:'enemy',x:x.x,y:x.y},()=>{const h=heading(x);if(!sheet('violet',t-x.tl,q.x,q.y-lift,AH*.5,{flip:!h.flip,angle:-h.angle}))orb(q.x,q.y-lift,AH*.25,BONE,BLOOD,1);});}
function draw(){if(typeof project!=='function'||typeof ctx==='undefined'||!ctx)return;const t=T();askSheets();
 for(const x of acts){try{if(x.kind==='crimson')drawCrimson(x,t);else if(x.kind==='abyss')drawAbyss(x,t);else if(x.kind==='eclipse')drawEclipse(x,t);}catch(err){fail(err);}}stats.draws++;}
const SENT={type:'r1096-persona-gravity',x:0,y:0,age:0,life:Infinity,r1096Sentinel:true};
function sentinel(want){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);if(want&&i<0)effects.push(SENT);else if(!want&&i>=0)effects.splice(i,1);SENT.age=0;
 const a=acts[0];if(want&&a&&okPos(a)){SENT.x=a.x;SENT.y=a.y;}}catch(_){}}
let wrapped=false;function wrapEffect(){if(wrapped||typeof drawEffect!=='function')return wrapped;const base=drawEffect;
 drawEffect=function(e,...a){if(e&&e.r1096Sentinel){try{ctx.save();try{ctx.globalCompositeOperation='source-over';draw();}finally{ctx.restore();}}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};wrapped=true;return true;}
if(!wrapEffect()&&typeof setTimeout==='function'){let n=0;(function arm(){if(wrapEffect()||++n>40)return;setTimeout(arm,250);})();}
function set(v){try{localStorage.setItem(KEY,JSON.stringify({on:v!==false}));}catch(_){}prefAt=-1e9;const r=on();if(!r){acts=[];sentinel(false);}return r;}
const KINDS=['crimson','abyss','eclipse'];
window.__STORYWORLD_PERSONA_GRAVITY_R1096__=Object.freeze({revision:REV,set,on:()=>on(),
 names:Object.freeze({set:'거울 천체',crimson:'붉은 거울별',abyss:'검은 우물별',eclipse:'자아 월식'}),
 qaForce:k=>{const e=persona();if(!e||!KINDS.includes(k))return null;const t=T(),s=stateOf(e);if(k==='eclipse'&&!(comboOf(s,t)||forcedCombo))return null;forcedCombo=false;if(lastT==null)lastT=t;return cast(e,k);},
 qaCombo:v=>{forcedCombo=!!v;return forcedCombo;},qaRandom:f=>{rng=typeof f==='function'?f:null;return !!rng;},qaSheets:v=>{sheetsOn=v!==false;return sheetsOn;},
 sheets:()=>Object.fromEntries(Object.keys(SHEETS).map(k=>[k,{path:SPATH(k),ready:!!simg(k),tint:TINT[k]}])),
 inspect:()=>{const e=persona(),s=e?states.get(e):null,t=T();return {revision:REV,on:prefOn,persona:!!e,comboReady:!!(s&&comboOf(s,t)),
  acts:acts.map(x=>({kind:x.kind,phase:x.phase,warn:x.warn,t0:x.t0,x:x.x,y:x.y,radius:x.radius,dmg:x.dmg})),
  tuning:{CHANCE,AWAKE_CHANCE,ROLL_MIN,ROLL_SPREAD,ICD,COMBO_WINDOW,ECL_CHANCE,RANGE,CR_WARN,CR_V,CR_RANGE,CR_K,CR_PUSH,AB_WARN,AB_LIFE,AB_R,AB_CORE,AB_V,AB_K,AB_TICKS,EC_WARN,EC_V,EC_RANGE,EC_K},
  stats:{...stats,cast:{...stats.cast},hits:{...stats.hits},order:stats.order.slice()}};}});
})();
