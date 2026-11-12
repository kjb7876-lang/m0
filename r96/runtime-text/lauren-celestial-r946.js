/* R946 라우렌 확률 발동 특수 패시브 '천체 공명' (사용자 2026-11-12 11:54Z "라우렌 확률 발동 특수 패시브스킬", 11:55Z "주변 조형물을 끌어와 적에게 빠르게 날아가게 해서 중력폭발, 보스스킬처럼").
 * 사용자가 든 작품의 기술은 '동작 원리'만 참고했다. 이름·모양·색 조합은 라우렌(중력·행성 제어)의 천체 주제로 새로 지었다.
 * 키는 늘리지 않는다. 라우렌 본인의 타격이 적에게 들어갈 때 0.35초에 한 번 굴려 10%(주변 2칸 안 적 4마리 이상이면 14%, 사몽 발현 중 배율, 최대 35%)로 발동, 발동 뒤 5초는 다시 안 굴린다.
 *  ① 항성 반발(척력 폭발): 라우렌 둘레 2.8칸의 적을 한꺼번에 2칸 밀쳐 냄 + 공격력 1.2배 + 0.45초 경직.
 *  ② 은빛 거성(밀어내는 연보라·실버 구, 처음 이름 적색 거성): 맞힌 적 쪽으로 은빛 구가 8칸 날아가며 닿는 적마다 0.9배 + 진행 방향으로 1.8칸 밀어냄. 벽에서 멈춤.
 *  ③ 심연 왜성(끌어당기는 짙은 보라 구, 처음 이름 청색 왜성): 맞힌 적 자리에 심연 구가 1.4초 머물며 3.4칸 안 적을 끌어당기고 핵 1.6칸 안에 0.35초마다 0.25배(4번).
 *  ④ 쌍성 소멸(보라 관통탄): 은빛 구와 심연 구가 12초 안에 모두 나갔다면 다음 발동은 반드시 이것. 두 구가 라우렌 앞에서 합쳐진 뒤(0.5초)
 *     보라 소멸탄이 11칸을 꿰뚫어 줄 위 모든 적에게 3.0배(보스·중간 보스 1.8배). 벽에서 멈춤.
 *  ⑤ 유성 궤도(조형물 투척): 6칸 안 장식 조형물(단단하지 않고 그림이 있는 작은 것, NPC·문·제단·상자 제외)을 최대 3개 끌어와 라우렌 둘레를 돌게 하고(1초),
 *     가까운 적에게 빠르게 내리꽂아 중력 폭발(2.2칸, 1.4배, 잠깐 끌어당김). 모자라면 돌 파편으로 채운다.
 *     조형물의 자리·충돌은 바꾸지 않는다: 날아가는 동안 원본만 숨기고(visible) 폭발 0.5초 뒤 원래 값으로 되돌린다(지역 이동·장면·끄기 때도 즉시 되돌림).
 * 보스·중간 보스는 밀리거나 끌리지 않는다(맞기만 함). 밀기·끌기는 엔진 moveActor 로 해서 벽을 넘지 않는다.
 * 상태는 영웅 몸(player 객체)마다 따로 둔다: 생존 모드 배치 영웅(R720)이 player 를 몸으로 바꿔 끼워 공격할 때도 그 몸의 공격력·자리·대기를 쓴다.
 * 그림은 코드로 그린 임시 연출(최종은 Dots 프레임 시트 CX-0087LC 요청 대상, 오면 교체). 소리는 기존 R546 라우렌 공격·고유기 소리를 다시 씀.
 * 끄기: localStorage['storyworld.r946.celestial']='{"on":false}'
 */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_LAUREN_CELESTIAL_R946__)return;
const REV='R946-celestial-1',KEY='storyworld.r946.celestial',HERO='lauren';
const CHANCE=.10,CROWD_BONUS=.04,CROWD_N=4,CROWD_R=2,CHANCE_MAX=.35,ROLL_GAP=.35,ICD=5,COMBO_WINDOW=12;
const REP_R=2.8,REP_K=1.2,REP_PUSH=2.0,REP_PUSH_T=.25,REP_STUN=.45,REP_LIFE=.7;
const RED_V=7,RED_RANGE=8,RED_R=.85,RED_K=.9,RED_PUSH=1.8,RED_PUSH_T=.3;
const BLUE_FLY=.3,BLUE_T=1.4,BLUE_R=3.4,BLUE_CORE=.5,BLUE_V=2.6,BLUE_TICK=.35,BLUE_TICKS=4,BLUE_HIT_R=1.6,BLUE_K=.25;
const VIO_CHARGE=.5,VIO_V=14,VIO_RANGE=11,VIO_R=.7,VIO_K=3.0,VIO_BOSS_K=1.8,VIO_TRAIL=.8;
const MET_N=3,MET_PICK_R=6,MET_RISE=.4,MET_ORBIT=.6,MET_STAGGER=.08,MET_V=16,MET_R=2.2,MET_K=1.4,MET_PULL_T=.35,MET_PULL_V=3,MET_RESTORE=.5,MET_MIN_H=14,MET_MAX_H=170,MET_ORBIT_R=1.3,MET_AIM_R=9;
const WEIGHTS=[['repulse',.28],['red',.24],['blue',.24],['meteor',.24]];
const NO_PROP=/npc|door|gate|altar|chest|portal|exit|quest|note|memory|fragment|crate|objective|shrine|seal|stairs|lever|switch|sign/i,
 FLAT_PROP=/root|decal|crack|stain|puddle|blood_pool|carpet|rug|floor|grass|moss_patch|shadow|rune|circle|hexagram|mark/i; // 바닥에 붙은 납작한 그림은 던지지 않는다
const stats={rolls:0,procTotal:0,procs:{repulse:0,red:0,blue:0,violet:0,meteor:0},hits:0,hiddenProps:0,restoredProps:0,debris:0,draws:0,errors:0,lastError:null,repulseCentres:[]};
const owners=new WeakMap();let ownerCount=0;
let acts=[],pushers=[],pullers=[],booms=[],lastRoom=null,lastT=null,prefAt=-1e9,prefOn=true,inner=0,forced=null,rng=null;
const T=()=>{try{return typeof time==='number'?time:0;}catch(_){return 0;}};
const fail=e=>{stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,200);};
const rnd=()=>{try{return rng?rng():Math.random();}catch(_){return Math.random();}};
function readOn(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return !(v&&v.on===false);}catch(_){return true;}}
function on(){const t=T();if(t<prefAt||t-prefAt>=1){prefAt=t;prefOn=readOn();}return prefOn;}
function P(){try{return typeof player==='object'&&player?player:null;}catch(_){return null;}}
function curRoom(){try{return typeof room!=='undefined'?room:null;}catch(_){return null;}}
function blockedNow(){try{if(typeof storyScene!=='undefined'&&storyScene)return true;if(typeof modal!=='undefined'&&modal)return true;if(typeof loading!=='undefined'&&loading)return true;}catch(_){}return false;}
function major(e){try{if(typeof majorActor3==='function')return !!majorActor3(e);}catch(_){}return !!(e&&(e.boss||e.midboss));}
function hiddenActor(e){return !e||e.hp<=0||e.dead||e.visible===false||e.disabled===true||['hidden','inactive','disabled','despawned'].includes(e.spawnState);}
function enemiesNow(){try{return typeof liveEnemies==='function'?liveEnemies():[];}catch(_){return [];}}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function canHit(e){try{return typeof damageable3==='function'?damageable3(e):true;}catch(_){return true;}}
function lineOk(a,b){try{return typeof clearLine==='function'?clearLine(a,b):true;}catch(_){return true;}}
function wallAt(x,y){try{return typeof blocked==='function'?!!blocked(x,y,.2):false;}catch(_){return false;}}
function ap(){try{return typeof attackPower==='function'?Number(attackPower())||0:0;}catch(_){return 0;}}
function aim(){try{return typeof storyAim22==='function'?storyAim22():0;}catch(_){return 0;}}
function bodyR(e){return e.combatProfile?.bodyBlock?.r||e.radius||.27;}
function surge(kind,v){try{const g=window.__STORYWORLD_SAMONG_SURGE_R571__;if(g&&typeof g[kind]==='function'&&(!g.active||g.active())){const r=Number(g[kind](v));if(Number.isFinite(r)&&r>0)return r;}}catch(_){}return v;}
function play(k){try{if(typeof sound==='function')sound(k);}catch(_){}}
function shakeBy(v){try{if(typeof shake==='number')shake=Math.max(shake,v);}catch(_){}}
function deal(e,v,kind){if(!e||hiddenActor(e)||!canHit(e)||!(v>0))return false;inner++;try{const r=hitEnemy(e,v,{kind:'r946-'+kind,friendly:true,owner:'hero',sourceHero:HERO,r946:true});if(r!==false)stats.hits++;return r;}catch(err){fail(err);return false;}finally{inner--;}}
function stateOf(o){let s=owners.get(o);if(!s){s={lastRoll:-1e9,readyAt:-1e9,redAt:-1e9,blueAt:-1e9};owners.set(o,s);ownerCount++;}return s;}
const comboOf=(s,t)=>s.redAt>-1e8&&s.blueAt>-1e8&&t-Math.min(s.redAt,s.blueAt)<=COMBO_WINDOW;
// ---- 밀기·끌기(엔진 moveActor, 벽 존중) ------------------------------------------------------------
function push(e,ux,uy,len,dur){if(major(e))return;pushers.push({e,ux,uy,left:len,v:len/Math.max(.05,dur)});}
function pull(c,radius,speed,core,dt){for(const e of enemiesNow()){if(hiddenActor(e)||major(e))continue;const d=dist(e,c);if(d>radius||d<=core)continue;
 const k=.6+.4*(1-d/radius),s=Math.min(speed*k*dt,d-core);try{if(typeof moveActor==='function')moveActor(e,(c.x-e.x)/d*s,(c.y-e.y)/d*s,bodyR(e));else{e.x+=(c.x-e.x)/d*s;e.y+=(c.y-e.y)/d*s;}}catch(err){fail(err);}}}
function runPushers(dt){pushers=pushers.filter(p=>{const e=p.e;if(hiddenActor(e))return false;const s=Math.min(p.left,p.v*dt);if(!(s>0))return true;
 try{if(typeof moveActor==='function')moveActor(e,p.ux*s,p.uy*s,bodyR(e));else{e.x+=p.ux*s;e.y+=p.uy*s;}}catch(err){fail(err);return false;}p.left-=s;return p.left>1e-6;});}
// ---- 조형물 고르기·숨기기·되돌리기 ---------------------------------------------------------------------
// 엔진 drawProp 이 최근(0.5초) 실제로 그린 조형물만 던진다: 자리에 그림이 안 나오는 조형물(병원·카이로 일부)이 허공에서 나타나지 않게.
const seenAt=new WeakMap();let propHook=false;
if(typeof drawProp==='function'){const base=drawProp;propHook=true;drawProp=function(a,...r){try{if(a&&typeof a==='object'&&a.visible!==false)seenAt.set(a,T());}catch(_){}return base.apply(this,[a,...r]);};}
function eligible(a){if(propHook&&!(T()-(seenAt.get(a)??-1e9)<=.5))return false;if(!a||typeof a.path!=='string'||!a.path||a.visible===false||a.solid||a.r946Hidden||a.enabled===false||a.disabled===true||a.destroyed===true)return false;
 if(a.r75NPC||a.r75NarrativeNPC||a.r74Door||a.doorId||a.hospitalDoorFrameB3||a.terrainWall||a.altar||a.interact||a.pickup||a.npc||a.objective)return false;
 if(NO_PROP.test(String(a.id||''))||NO_PROP.test(a.path)||FLAT_PROP.test(String(a.id||''))||FLAT_PROP.test(a.path)||a.groundAligned||a.flat)return false;const h=Number(a.height);return Number.isFinite(h)&&h>=MET_MIN_H&&h<=MET_MAX_H&&Number.isFinite(a.x)&&Number.isFinite(a.y);}
function hide(a){a.r946Hidden={prev:a.visible};a.visible=false;stats.hiddenProps++;}
function restore(a){if(!a||!a.r946Hidden)return;const prev=a.r946Hidden.prev;delete a.r946Hidden;a.visible=prev;stats.restoredProps++;}
function restoreAct(x){if(x.kind!=='meteor'||x.restored)return;x.restored=true;for(const r of x.rocks)if(r.prop)restore(r.prop);}
function cancel(){for(const x of acts)restoreAct(x);acts=[];pushers=[];pullers=[];booms=[];}
// ---- 다섯 가지 발동 ---------------------------------------------------------------------------------
function dirTo(o,tg){let ux,uy;if(tg){ux=tg.x-o.x;uy=tg.y-o.y;}const L=Math.hypot(ux||0,uy||0);if(!(L>1e-6)){const a=aim();return {ux:Math.cos(a),uy:Math.sin(a)};}return {ux:ux/L,uy:uy/L};}
function fire(kind,o,tg){const t=T(),power=ap(),k=Math.min(2,Math.max(1,surge('range',1))),{ux,uy}=dirTo(o,tg),base={kind,owner:o,t0:t,power,k,ux,uy,seed:(stats.procTotal*7919)%360};
 stats.procTotal++;stats.procs[kind]++;
 if(kind==='repulse'){const c={x:o.x,y:o.y};stats.repulseCentres.push(c.x+','+c.y);if(stats.repulseCentres.length>20)stats.repulseCentres.shift();
  for(const e of enemiesNow()){if(hiddenActor(e))continue;const d=dist(e,c);if(d>REP_R*k||!lineOk(c,e))continue;deal(e,power*REP_K,'repulse');
   if(!major(e)&&e.hp>0){const L=d>1e-6?d:1,vx=d>1e-6?(e.x-c.x)/L:ux,vy=d>1e-6?(e.y-c.y)/L:uy;push(e,vx,vy,REP_PUSH,REP_PUSH_T);e.cd=Math.max(Number(e.cd)||0,REP_STUN);}}
  acts.push({...base,x:c.x,y:c.y});play('r546Atk_lauren');shakeBy(3);return;}
 if(kind==='red'){acts.push({...base,x:o.x+ux*.5,y:o.y+uy*.5,sx:o.x+ux*.5,sy:o.y+uy*.5,hit:new Set(),trail:[]});play('r546Atk_lauren');return;}
 if(kind==='blue'){const p=tg?{x:tg.x,y:tg.y}:{x:o.x+ux*3.4,y:o.y+uy*3.4};acts.push({...base,x:o.x,y:o.y,sx:o.x,sy:o.y,tx:p.x,ty:p.y,ticks:0});play('r546Atk_lauren');return;}
 if(kind==='violet'){acts.push({...base,x:o.x+ux*.9,y:o.y+uy*.9,sx:o.x+ux*.9,sy:o.y+uy*.9,hit:new Set(),launched:false});play('r546Sp_lauren');return;}
 if(kind==='meteor'){const rm=curRoom(),props=(rm&&Array.isArray(rm.props)?rm.props:[]).filter(eligible).map(a=>({a,d:dist(a,o)})).filter(v=>v.d<=MET_PICK_R&&lineOk(o,v.a)).sort((p,q)=>p.d-q.d).slice(0,MET_N);
  const rocks=props.map(({a})=>{hide(a);return {prop:a,propId:a.id,path:a.path,h:Math.min(Number(a.height),96),ox:a.x,oy:a.y};});
  while(rocks.length<MET_N){const i=rocks.length,an=i*2.4+base.seed;rocks.push({prop:null,propId:null,path:null,h:34,ox:o.x+Math.cos(an)*1.6,oy:o.y+Math.sin(an)*1.6,shape:i});stats.debris++;}
  const foes=enemiesNow().filter(e=>!hiddenActor(e)&&dist(e,o)<=MET_AIM_R).sort((p,q)=>dist(p,o)-dist(q,o));
  rocks.forEach((r,i)=>{r.x=r.ox;r.y=r.oy;r.lift=0;r.state='rise';r.target=foes.length?foes[i%foes.length]:tg||null;});
  acts.push({...base,x:o.x,y:o.y,rocks});play('r546Sp_lauren');return;}}
function pick(s,t){if(forced){const f=forced;forced=null;return f;}if(comboOf(s,t))return 'violet';let r=rnd()*WEIGHTS.reduce((n,w)=>n+w[1],0);for(const [k,w] of WEIGHTS){if(r<w)return k;r-=w;}return 'meteor';}
function chanceFor(o){let n=0;for(const e of enemiesNow())if(!hiddenActor(e)&&dist(e,o)<=CROWD_R)n++;const c=CHANCE+(n>=CROWD_N?CROWD_BONUS:0);return Math.min(CHANCE_MAX,surge('chance',c));}
function roll(e){const o=P();if(!o||o.hero!==HERO||o.hp<=0||blockedNow())return;const s=stateOf(o),t=T();if(t<s.readyAt||t-s.lastRoll<ROLL_GAP)return;s.lastRoll=t;stats.rolls++;
 if(!forced&&!(rnd()<chanceFor(o)))return;const kind=pick(s,t);s.readyAt=t+ICD;
 if(kind==='red')s.redAt=t;else if(kind==='blue')s.blueAt=t;else if(kind==='violet'){s.redAt=-1e9;s.blueAt=-1e9;}
 lastRoom=curRoom();fire(kind,o,e&&Number.isFinite(e.x)?{x:e.x,y:e.y}:null);}
// 라우렌 본인 타격만(다른 영웅·협동 동료·적·이 패시브 자신의 피해 제외).
function mine(src){const o=P();if(!o||o.hero!==HERO)return false;if(src&&typeof src==='object'){if(src.r946||src.sourceHero&&src.sourceHero!==HERO)return false;if(src.coopIdR62||src.ally||src.owner==='ally'||src.owner==='enemy'||src.hostile)return false;}return true;}
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,source,...a){const r=base.call(this,e,value,source,...a);
 try{if(!inner&&r!==false&&e&&on()&&mine(source))roll(e);}catch(err){fail(err);}return r;};}
// ---- 매 틱 ------------------------------------------------------------------------------------------
function ownerOk(o){return o&&!(o.hp<=0);}
function boom(x,y,power,k){booms.push({x,y,t0:T(),k});if(booms.length>8)booms.shift();const c={x,y};
 for(const e of enemiesNow()){if(hiddenActor(e))continue;if(dist(e,c)>MET_R*k+(e.radius||0)||!lineOk(c,e))continue;deal(e,power*MET_K,'meteor');}
 pullers.push({c,until:T()+MET_PULL_T,r:MET_R*k*1.3});shakeBy(3);}
function stepAct(x,t,dt){const u=t-x.t0;
 if(x.kind==='repulse')return u<REP_LIFE;
 if(x.kind==='red'){const s=RED_V*dt,nx=x.x+x.ux*s,ny=x.y+x.uy*s;if(wallAt(nx,ny)){x.end=x.end??t;}else{x.trail.push({x:x.x,y:x.y});if(x.trail.length>7)x.trail.shift();x.x=nx;x.y=ny;}
  if(x.end==null){for(const e of enemiesNow()){if(hiddenActor(e)||x.hit.has(e))continue;if(dist(e,x)>RED_R*x.k+(e.radius||0))continue;x.hit.add(e);deal(e,x.power*RED_K,'red');if(e.hp>0)push(e,x.ux,x.uy,RED_PUSH,RED_PUSH_T);}
   if(Math.hypot(x.x-x.sx,x.y-x.sy)>=RED_RANGE)x.end=t;}return x.end==null||t-x.end<.3;}
 if(x.kind==='blue'){if(u<BLUE_FLY){const f=u/BLUE_FLY;x.x=x.sx+(x.tx-x.sx)*f;x.y=x.sy+(x.ty-x.sy)*f;return true;}x.x=x.tx;x.y=x.ty;const v=u-BLUE_FLY;
  if(v<BLUE_T)pull(x,BLUE_R*x.k,BLUE_V,BLUE_CORE,dt);
  while(x.ticks<BLUE_TICKS&&v>=(x.ticks+1)*BLUE_TICK-1e-9){x.ticks++;for(const e of enemiesNow()){if(hiddenActor(e)||dist(e,x)>BLUE_HIT_R*x.k+(e.radius||0))continue;deal(e,x.power*BLUE_K,'blue');}}
  return v<BLUE_T+.3;}
 if(x.kind==='violet'){if(u<VIO_CHARGE){if(ownerOk(x.owner)){x.sx=x.owner.x+x.ux*.9;x.sy=x.owner.y+x.uy*.9;x.x=x.sx;x.y=x.sy;}return true;}
  if(!x.launched){x.launched=true;play('r546Sp_lauren');shakeBy(4);}
  if(x.end==null){let s=VIO_V*dt;const left=VIO_RANGE-Math.hypot(x.x-x.sx,x.y-x.sy);if(s>=left){s=Math.max(0,left);x.end=t;}const nx=x.x+x.ux*s,ny=x.y+x.uy*s;
   if(wallAt(nx,ny)){x.end=t;}else{x.x=nx;x.y=ny;}
   for(const e of enemiesNow()){if(hiddenActor(e)||x.hit.has(e))continue;const px=e.x-x.sx,py=e.y-x.sy,along=px*x.ux+py*x.uy,trav=Math.hypot(x.x-x.sx,x.y-x.sy);if(along<-VIO_R||along>trav+VIO_R*.5)continue;
    const off=Math.abs(px*x.uy-py*x.ux);if(off>VIO_R*x.k+(e.radius||0))continue;x.hit.add(e);deal(e,x.power*(major(e)?VIO_BOSS_K:VIO_K),'violet');}}
  return x.end==null||t-x.end<VIO_TRAIL;}
 if(x.kind==='meteor'){const o=x.owner,live=ownerOk(o);let done=0;
  x.rocks.forEach((r,i)=>{if(r.state==='done'){done++;return;}const ang=x.seed*.0174+i*Math.PI*2/x.rocks.length+t*3.2;
   if(r.state==='rise'||r.state==='orbit'){const cx=live?o.x:x.x,cy=live?o.y:x.y,sx=cx+Math.cos(ang)*MET_ORBIT_R,sy=cy+Math.sin(ang)*MET_ORBIT_R*.8;
    if(u<MET_RISE){const f=u/MET_RISE,e=f*f*(3-2*f);r.x=r.ox+(sx-r.ox)*e;r.y=r.oy+(sy-r.oy)*e;r.lift=e;r.state='rise';}
    else{r.x=sx;r.y=sy;r.lift=1;r.state='orbit';if(u>=MET_RISE+MET_ORBIT+i*MET_STAGGER){const tg=r.target&&!hiddenActor(r.target)?r.target:null,p=tg?{x:tg.x,y:tg.y}:r.target?{x:r.target.x,y:r.target.y}:{x:cx+x.ux*5,y:cy+x.uy*5};
     r.state='fly';r.fx=r.x;r.fy=r.y;r.tx=p.x;r.ty=p.y;r.flyD=Math.max(.01,Math.hypot(p.x-r.x,p.y-r.y));}}}
   if(r.state==='fly'){const s=MET_V*dt,L=Math.hypot(r.tx-r.x,r.ty-r.y);if(L<=s){r.x=r.tx;r.y=r.ty;}else{const nx=r.x+(r.tx-r.x)/L*s,ny=r.y+(r.ty-r.y)/L*s;if(wallAt(nx,ny)){r.tx=r.x;r.ty=r.y;}else{r.x=nx;r.y=ny;}}
    r.lift=Math.max(0,Math.hypot(r.tx-r.x,r.ty-r.y)/r.flyD);if(Math.hypot(r.tx-r.x,r.ty-r.y)<1e-6){r.state='done';done++;boom(r.x,r.y,x.power,x.k);}}});
  for(const r of x.rocks)if(r.prop&&r.prop.r946Hidden&&r.prop.visible!==false)r.prop.visible=false;
  if(done===x.rocks.length){if(x.doneAt==null)x.doneAt=t;if(t-x.doneAt>=MET_RESTORE){restoreAct(x);return false;}}return true;}
 return false;}
function step(){const t=T(),rm=curRoom();if(rm!==lastRoom){if(lastRoom!==null)cancel();lastRoom=rm;}
 const dt=lastT==null||t<lastT?0:Math.min(.1,t-lastT);lastT=t;
 if(!on()||blockedNow()){cancel();return;}
 acts=acts.filter(x=>{try{if(x.kind!=='meteor'&&x.kind!=='repulse'&&!ownerOk(x.owner)&&x.kind!=='red'){return false;}const keep=stepAct(x,t,dt);if(!keep)restoreAct(x);return keep;}catch(err){fail(err);restoreAct(x);return false;}});
 runPushers(dt);pullers=pullers.filter(p=>{if(t>p.until)return false;pull(p.c,p.r,MET_PULL_V,.4,dt);return true;});booms=booms.filter(b=>t-b.t0<.75);}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);
 try{if(typeof started==='undefined'||started)step();}catch(err){fail(err);cancel();}sentinel(acts.length>0||booms.length>0);return r;};}
// ---- 그리기(효과 표지 하나, 3D 기록기에는 ctx.scope 로 자리 주인을 붙인다) -----------------------------------------
// 색(사용자 2026-11-12 13:40Z "보라 채도 연한 것·짙은 것 + 실버로 차별화"): 밀어내는 구 = 연보라+실버, 끌어당기는 구 = 짙은 보라, 융합탄 = 보라+실버 테.
const PALE='176,160,206',SILVER='224,224,230',DEEP='86,30,150',DEEP_HOT='190,150,240',VIO='150,84,220',VIO_HOT='232,226,244',VOID='12,2,22';
const RED=PALE,RED_HOT=SILVER,BLUE=DEEP,BLUE_HOT=DEEP_HOT;
function sc(o,f){if(typeof ctx!=='undefined'&&ctx&&typeof ctx.scope==='function')ctx.scope(o,f);else f();}
function scale(){const z=typeof zoom==='number'&&zoom>0?zoom:1,TL=typeof TILE==='number'?TILE:34;return {z,T1:TL*z*Math.SQRT2,AH:typeof actorHeight==='function'?actorHeight():66*z};}
function glowOrb(x,y,r,core,mid,alpha){ctx.save();try{ctx.globalAlpha*=alpha;const prev=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';
 // 중심이 같은 원형 그라데이션만 쓴다(3D 기록기가 두 원 중심이 다른 그라데이션을 만나면 게임이 멈춤 — R946 실측).
 const g=ctx.createRadialGradient?ctx.createRadialGradient(x,y,r*.6,x,y,r*2.1):null;if(g){g.addColorStop(0,`rgba(${mid},.6)`);g.addColorStop(1,`rgba(${mid},0)`);ctx.fillStyle=g;}else ctx.fillStyle=`rgba(${mid},.3)`;
 ctx.beginPath();ctx.arc(x,y,r*2.1,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation=prev;
 // 몸통: 짙은 테두리 → 주색 → 밝은 속(광원 왼쪽 위, 밝은 점은 왼쪽 위)
 ctx.fillStyle=`rgba(${mid},.96)`;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
 const h=ctx.createRadialGradient?ctx.createRadialGradient(x,y,0,x,y,r*.82):null;if(h){h.addColorStop(0,`rgba(${core},1)`);h.addColorStop(.55,`rgba(${core},.75)`);h.addColorStop(1,`rgba(${mid},0)`);ctx.fillStyle=h;}else ctx.fillStyle=`rgba(${core},.8)`;
 ctx.beginPath();ctx.arc(x,y,r*.82,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.ellipse(x-r*.34,y-r*.38,r*.22,r*.15,-.6,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=`rgba(${core},.9)`;ctx.lineWidth=Math.max(1.2,r*.08);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();}finally{ctx.restore();}}
function swirl(x,y,r,col,spin,n,alpha){ctx.save();try{ctx.globalAlpha*=alpha;ctx.lineWidth=Math.max(1.2,r*.09);for(let i=0;i<n;i++){const a0=spin+i*Math.PI*2/n;ctx.strokeStyle=`rgba(${col},${.75-.1*i})`;ctx.beginPath();ctx.ellipse(x,y,r*(1.15+.12*i),r*(.55+.06*i),-.3,a0,a0+Math.PI*.9);ctx.stroke();}}finally{ctx.restore();}}
function ring(q,R,col,w,alpha,fillA){ctx.save();try{ctx.globalAlpha*=alpha;const prev=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';if(fillA){ctx.fillStyle=`rgba(${col},${fillA})`;ctx.beginPath();ctx.ellipse(q.x,q.y,R,R*.5,0,0,Math.PI*2);ctx.fill();}
 ctx.lineWidth=w;ctx.strokeStyle=`rgba(${col},.9)`;ctx.beginPath();ctx.ellipse(q.x,q.y,R,R*.5,0,0,Math.PI*2);ctx.stroke();ctx.globalCompositeOperation=prev;}finally{ctx.restore();}}
function drawRepulse(x,t){const u=t-x.t0,v=Math.min(1,u/REP_LIFE),q=project(x.x,x.y),{z,T1,AH}=scale(),R=REP_R*x.k*T1*.5*(.25+.85*Math.sqrt(v)),a=1-v,id='r946:repulse:'+x.t0.toFixed(2);
 sc({id:id+':ring',kind:'effect',pxfSide:'hero',x:x.x,y:x.y,groundAligned:true},()=>{ring(q,R,VIO_HOT,Math.max(2,9*z*a),a,.12*a);ring(q,R*.72,VIO,Math.max(1,3*z),a*.8,0);});
 sc({id:id+':dome',kind:'effect',pxfSide:'hero',x:x.x,y:x.y+.01},()=>{ctx.save();try{ctx.globalAlpha*=a*.85;const prev=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';const cy=q.y-AH*.5;
  ctx.strokeStyle=`rgba(${VIO_HOT},.8)`;ctx.lineWidth=Math.max(1.5,4*z*a);ctx.beginPath();ctx.ellipse(q.x,cy,R*.9,AH*(.55+.5*v),0,Math.PI,Math.PI*2);ctx.stroke();
  ctx.lineWidth=Math.max(1,2*z);for(let i=0;i<14;i++){const an=i*Math.PI*2/14+(x.seed||0),r0=R*.35,r1=R*(.6+.4*v);ctx.strokeStyle=`rgba(${VIO_HOT},${.55*a})`;ctx.beginPath();ctx.moveTo(q.x+Math.cos(an)*r0,q.y+Math.sin(an)*r0*.5-AH*.15);ctx.lineTo(q.x+Math.cos(an)*r1,q.y+Math.sin(an)*r1*.5-AH*.15);ctx.stroke();}
  ctx.globalCompositeOperation=prev;}finally{ctx.restore();}});}
function drawRed(x,t){const {z,AH}=scale(),q=project(x.x,x.y),lift=AH*.55,r=AH*.28,fade=x.end==null?1:Math.max(0,1-(t-x.end)/.3),id='r946:red:'+x.t0.toFixed(2);
 sc({id:id+':orb',kind:'effect',pxfSide:'hero',x:x.x,y:x.y},()=>{for(let i=0;i<x.trail.length;i++){const p=project(x.trail[i].x,x.trail[i].y),k=(i+1)/(x.trail.length+1);glowOrb(p.x,p.y-lift,r*(.35+.45*k),RED_HOT,RED,.22*k*fade);}
  glowOrb(q.x,q.y-lift,r,RED_HOT,RED,fade);swirl(q.x,q.y-lift,r,RED_HOT,t*9+(x.seed||0),3,fade*.9);});}
function drawBlue(x,t){const {z,T1,AH}=scale(),q=project(x.x,x.y),u=t-x.t0,v=Math.max(0,u-BLUE_FLY),lift=AH*.6,r=AH*.26,fade=v>BLUE_T?Math.max(0,1-(v-BLUE_T)/.3):1,id='r946:blue:'+x.t0.toFixed(2);
 if(u>=BLUE_FLY)sc({id:id+':disk',kind:'effect',pxfSide:'hero',x:x.x,y:x.y,groundAligned:true},()=>{const R=BLUE_R*x.k*T1*.5*Math.min(1,v/.2);ring(q,R,BLUE,Math.max(1.5,2.5*z),fade*.75,.1);
  ctx.save();try{ctx.globalAlpha*=fade*.7;ctx.lineWidth=Math.max(1,1.6*z);for(let i=0;i<4;i++){const a0=-t*5+i*Math.PI/2;ctx.strokeStyle=`rgba(${BLUE_HOT},.55)`;ctx.beginPath();ctx.ellipse(q.x,q.y,R*(.3+.15*i),R*(.15+.075*i),0,a0,a0+1.4);ctx.stroke();}}finally{ctx.restore();}});
 sc({id:id+':orb',kind:'effect',pxfSide:'hero',x:x.x,y:x.y},()=>{const cy=q.y-lift;if(u>=BLUE_FLY){ctx.save();try{ctx.globalAlpha*=fade;const prev=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';
   for(let i=0;i<12;i++){const ph=((t*1.8+i*.173)%1),a=i*2.399,d=(1-ph)*r*4;const sx=q.x+Math.cos(a)*d,sy=cy+Math.sin(a)*d*.6;ctx.strokeStyle=`rgba(${BLUE_HOT},${.1+.5*ph})`;ctx.lineWidth=Math.max(1,(1+ph*2)*z);ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+(q.x-sx)*.25,sy+(cy-sy)*.25);ctx.stroke();}
   ctx.globalCompositeOperation=prev;}finally{ctx.restore();}}
  glowOrb(q.x,cy,r,BLUE_HOT,BLUE,fade);swirl(q.x,cy,r,BLUE_HOT,-t*8+(x.seed||0),3,fade*.9);});}
function drawViolet(x,t){const {z,AH}=scale(),u=t-x.t0,lift=AH*.55,id='r946:violet:'+x.t0.toFixed(2);
 if(u<VIO_CHARGE){const f=u/VIO_CHARGE,e=f*f,px=-x.uy,py=x.ux,o=x.owner&&ownerOk(x.owner)?x.owner:x,cx=o.x+x.ux*.9,cy=o.y+x.uy*.9,sep=1.3*(1-e),r=AH*.2;
  const a=project(cx+px*sep,cy+py*sep),b=project(cx-px*sep,cy-py*sep),m=project(cx,cy);
  sc({id:id+':charge',kind:'effect',pxfSide:'hero',x:cx,y:cy},()=>{glowOrb(a.x,a.y-lift,r,RED_HOT,RED,1);glowOrb(b.x,b.y-lift,r,BLUE_HOT,BLUE,1);if(f>.6)glowOrb(m.x,m.y-lift,AH*.32*(f-.6)/.4,VIO_HOT,VIO,(f-.6)/.4);
   ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${VIO_HOT},${.3+.5*f})`;ctx.lineWidth=Math.max(1,2*z);ctx.beginPath();ctx.moveTo(a.x,a.y-lift);ctx.lineTo(b.x,b.y-lift);ctx.stroke();}finally{ctx.restore();}});return;}
 const s=project(x.sx,x.sy),q=project(x.x,x.y),r=AH*.32,fade=x.end==null?1:Math.max(0,1-(t-x.end)/VIO_TRAIL);
 sc({id:id+':scar',kind:'effect',pxfSide:'hero',x:(x.sx+x.x)/2,y:(x.sy+x.y)/2,groundAligned:true},()=>{ctx.save();try{ctx.globalAlpha*=fade*.8;ctx.strokeStyle=`rgba(${VOID},.7)`;ctx.lineWidth=Math.max(2,r*.35);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(q.x,q.y);ctx.stroke();
  const prev=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${VIO},.7)`;ctx.lineWidth=Math.max(1,1.6*z);for(const sgn of [-1,1]){ctx.beginPath();ctx.moveTo(s.x,s.y+sgn*r*.22);ctx.lineTo(q.x,q.y+sgn*r*.22);ctx.stroke();}ctx.globalCompositeOperation=prev;}finally{ctx.restore();}});
 // 혜성 꼬리: 지나온 길을 따라 작아지고 옅어지는 보라 구 열두 개(직사각형 띠 대신)
 sc({id:id+':trail',kind:'effect',pxfSide:'hero',x:(x.sx+x.x)/2,y:(x.sy+x.y)/2},()=>{const L=Math.hypot(q.x-s.x,q.y-s.y),n=12;for(let i=n;i>=1;i--){const f=i/n,d=Math.min(L,r*7)*f,px=q.x+(s.x-q.x)/(L||1)*d,py=q.y+(s.y-q.y)/(L||1)*d;
   ctx.save();try{ctx.globalAlpha*=fade*(1-f)*.75;const prev=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(${i%2?VIO:VIO_HOT},.8)`;ctx.beginPath();ctx.arc(px,py-lift,r*(1-.75*f),0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation=prev;}finally{ctx.restore();}}});
 if(x.end==null||t-x.end<.15)sc({id:id+':orb',kind:'effect',pxfSide:'hero',x:x.x,y:x.y},()=>{glowOrb(q.x,q.y-lift,r,VIO_HOT,VIO,1);ctx.save();try{ctx.fillStyle=`rgba(${VOID},.9)`;ctx.beginPath();ctx.arc(q.x,q.y-lift,r*.42,0,Math.PI*2);ctx.fill();}finally{ctx.restore();}swirl(q.x,q.y-lift,r,VIO_HOT,t*11,4,1);});}
function rockShape(cx,cy,s,shape){const pts=[[-.5,.1],[-.35,-.38],[.05,-.5],[.42,-.3],[.5,.12],[.2,.42],[-.28,.4]];ctx.beginPath();pts.forEach(([px,py],i)=>{const j=1+((shape*7+i*3)%5-2)*.06,X=cx+px*s*j,Y=cy+py*s*.8*j;if(i)ctx.lineTo(X,Y);else ctx.moveTo(X,Y);});ctx.closePath();}
// 돌 파편: 윗면 밝게·왼면 중간·오른면 어둡게(광원 왼쪽 위, CX-0056) + 보라 균열
function rockFaces(cx,cy,s,shape,z){rockShape(cx,cy,s,shape);ctx.fillStyle='rgba(58,52,70,.98)';ctx.fill();
 ctx.fillStyle='rgba(122,112,138,.95)';ctx.beginPath();ctx.moveTo(cx-s*.35,cy-s*.3);ctx.lineTo(cx+s*.05,cy-s*.4);ctx.lineTo(cx+s*.38,cy-s*.24);ctx.lineTo(cx-s*.02,cy-s*.08);ctx.closePath();ctx.fill();
 ctx.fillStyle='rgba(30,26,40,.9)';ctx.beginPath();ctx.moveTo(cx+s*.38,cy-s*.24);ctx.lineTo(cx+s*.5,cy+s*.1);ctx.lineTo(cx+s*.2,cy+s*.34);ctx.lineTo(cx-s*.02,cy-s*.08);ctx.closePath();ctx.fill();
 rockShape(cx,cy,s,shape);ctx.strokeStyle='rgba(20,14,30,.9)';ctx.lineWidth=Math.max(1,1.4*z);ctx.stroke();
 const prev=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${VIO_HOT},.9)`;ctx.lineWidth=Math.max(1,1.5*z);ctx.beginPath();ctx.moveTo(cx-s*.2,cy-s*.22);ctx.lineTo(cx+s*.02,cy-s*.04);ctx.lineTo(cx-s*.08,cy+s*.2);ctx.moveTo(cx+s*.02,cy-s*.04);ctx.lineTo(cx+s*.25,cy+s*.05);ctx.stroke();ctx.globalCompositeOperation=prev;}
function drawMeteor(x,t){const {z,AH}=scale(),o=x.owner&&ownerOk(x.owner)?x.owner:x,oq=project(o.x,o.y),u=t-x.t0,id='r946:meteor:'+x.t0.toFixed(2);
 x.rocks.forEach((r,i)=>{if(r.state==='done')return;const q=project(r.x,r.y),lift=AH*1.0*r.lift,h=r.h*z,cy=q.y-lift;
  sc({id:'r946:meteor:rock'+i+':'+x.t0.toFixed(2),kind:'effect',pxfSide:'hero',x:r.x,y:r.y},()=>{ctx.save();try{
   if(r.state!=='fly'){const prev=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${VIO},.45)`;ctx.lineWidth=Math.max(1,1.5*z);ctx.beginPath();ctx.moveTo(oq.x,oq.y-AH*.6);ctx.quadraticCurveTo((oq.x+q.x)/2,cy-AH*.4,q.x,cy-h*.5);ctx.stroke();
    if(r.state==='orbit'&&u>MET_RISE+MET_ORBIT-.18&&r.target){const tq=project(r.target.x,r.target.y);ctx.setLineDash&&ctx.setLineDash([6*z,5*z]);ctx.strokeStyle=`rgba(${VIO_HOT},.6)`;ctx.beginPath();ctx.moveTo(q.x,cy-h*.5);ctx.lineTo(tq.x,tq.y-AH*.3);ctx.stroke();ctx.setLineDash&&ctx.setLineDash([]);}
    ctx.globalCompositeOperation=prev;}
   glowOrb(q.x,cy-h*.5,Math.max(AH*.26,h*.42),VIO_HOT,VIO,r.state==='fly'?.55:.35);
   const wob=r.state==='fly'?0:Math.sin(t*22+i)*1.5*z;
   if(r.path&&typeof readyImage==='function'){const row=readyImage(r.path);if(row&&row.image){const b=row.crop||{w:row.image.naturalWidth||1,h:row.image.naturalHeight||1};
     if(typeof sprite==='function')sprite(r.path,q.x+wob,cy,h,{alpha:1});else{const w=h*b.w/b.h;if(b.x!=null)ctx.drawImage(row.image,b.x,b.y,b.w,b.h,q.x-w/2+wob,cy-h,w,h);else ctx.drawImage(row.image,q.x-w/2+wob,cy-h,w,h);}stats.draws++;return;}}
   const s=Math.max(AH*.62,h);rockFaces(q.x+wob,cy-s*.4,s,r.shape||i,z);stats.draws++;
  }finally{ctx.restore();}});});}
function drawBoom(b,t){const {z,T1,AH}=scale(),v=Math.min(1,(t-b.t0)/.75),q=project(b.x,b.y),R=MET_R*b.k*T1*.5*(.3+.8*Math.sqrt(v)),a=1-v,id='r946:meteor:boom:'+b.t0.toFixed(2)+':'+b.x.toFixed(1);
 sc({id:id,kind:'effect',pxfSide:'hero',x:b.x,y:b.y,groundAligned:true},()=>{ring(q,R,VIO_HOT,Math.max(2,8*z*a),a,.18*a);ring(q,R*.6,VIO,Math.max(1,3*z),a,0);
  ctx.save();try{ctx.globalAlpha*=a;ctx.fillStyle=`rgba(${VOID},.55)`;ctx.beginPath();ctx.ellipse(q.x,q.y,R*.35,R*.17,0,0,Math.PI*2);ctx.fill();}finally{ctx.restore();}});
 if(v<.35)sc({id:id+':flash',kind:'effect',pxfSide:'hero',x:b.x,y:b.y+.01},()=>glowOrb(q.x,q.y-AH*.3,AH*.45*(1-v/.35)+AH*.1,VIO_HOT,VIO,1-v/.35));}
function draw(){if(typeof project!=='function'||typeof ctx==='undefined'||!ctx)return;const t=T();
 for(const x of acts){try{if(x.kind==='repulse')drawRepulse(x,t);else if(x.kind==='red')drawRed(x,t);else if(x.kind==='blue')drawBlue(x,t);else if(x.kind==='violet')drawViolet(x,t);else if(x.kind==='meteor')drawMeteor(x,t);}catch(err){fail(err);}}
 for(const b of booms){try{drawBoom(b,t);}catch(err){fail(err);}}stats.draws++;}
const SENT={type:'r946-celestial',x:0,y:0,age:0,life:Infinity,r946Sentinel:true};
function sentinel(want){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);if(want&&i<0)effects.push(SENT);else if(!want&&i>=0)effects.splice(i,1);SENT.age=0;
 const a=acts[0];if(want&&a){SENT.x=a.x;SENT.y=a.y;}}catch(_){}}
let wrapped=false;function wrapEffect(){if(wrapped||typeof drawEffect!=='function')return wrapped;const base=drawEffect;
 drawEffect=function(e,...a){if(e&&e.r946Sentinel){try{ctx.save();try{ctx.globalCompositeOperation='source-over';draw();}finally{ctx.restore();}}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};wrapped=true;return true;}
if(!wrapEffect()&&typeof setTimeout==='function'){let n=0;(function arm(){if(wrapEffect()||++n>40)return;setTimeout(arm,250);})();}
function set(v){try{localStorage.setItem(KEY,JSON.stringify({on:v!==false}));}catch(_){}prefAt=-1e9;return on();}
const KINDS=['repulse','red','blue','violet','meteor'];
window.__STORYWORLD_LAUREN_CELESTIAL_R946__=Object.freeze({revision:REV,set,on:()=>on(),
 names:Object.freeze({passive:'천체 공명',repulse:'항성 반발',red:'은빛 거성',blue:'심연 왜성',violet:'쌍성 소멸',meteor:'유성 궤도'}),
 qaForce:k=>{forced=KINDS.includes(k)?k:null;return forced;},qaRandom:f=>{rng=typeof f==='function'?f:null;return !!rng;},
 qaProps:()=>{const rm=curRoom();return (rm&&Array.isArray(rm.props)?rm.props:[]).filter(eligible).map(a=>({id:a.id,x:a.x,y:a.y,height:a.height,path:a.path}));},
 qaReset:()=>{const o=P();if(o){const s=stateOf(o);s.readyAt=-1e9;s.lastRoll=-1e9;}return true;},
 inspect:()=>{const o=P(),s=o?owners.get(o):null;return {revision:REV,on:prefOn,owners:ownerCount,comboReady:!!(s&&comboOf(s,T())),
  acts:acts.map(x=>({kind:x.kind,x:x.x,y:x.y,t0:x.t0,rocks:x.rocks?x.rocks.map(r=>({propId:r.propId,state:r.state})):undefined})),
  tuning:{CHANCE,CROWD_BONUS,CROWD_N,CHANCE_MAX,ROLL_GAP,ICD,COMBO_WINDOW,REP_R,REP_K,REP_PUSH,RED_V,RED_RANGE,RED_K,RED_PUSH,BLUE_T,BLUE_R,BLUE_K,BLUE_TICKS,VIO_RANGE,VIO_K,VIO_BOSS_K,MET_N,MET_PICK_R,MET_R,MET_K},
  stats:{...stats,procs:{...stats.procs},repulseCentres:stats.repulseCentres.slice()}};}});
})();
