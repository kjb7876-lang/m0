/* R948 미카엘라 확률 발동 특수 패시브 '사랑의 처방' (사용자 2026-11-12 13:17Z "미카엘라 영웅 확률발동 특수패시브 스킬").
 * 사용자가 든 작품의 기술은 '느낌'만 참고했다. 이름·모양·색은 미카엘라(사랑·의료·정신·신성의학)의 주제로 새로 지었다.
 * 키는 늘리지 않는다. 미카엘라 본인의 타격이 적에게 들어갈 때 0.35초에 한 번 굴려 11%(주변 2칸 안 적 4마리 이상이면 15%, 사몽 발현 중 배율, 최대 35%)로 발동,
 * 발동 뒤 5초는 다시 안 굴린다. 셋 중 하나를 고른다(하트 세례 55% · 쉼터 오르골탑 30% · 연심 대개화 15%).
 *  ① 연심 대개화(가장 드묾): 맞힌 적 자리(7칸 밖이면 미카엘라 앞 3칸)에 큰 분홍 하트가 피어 2초 동안 뛰다가 대폭발.
 *     3칸 안 모든 적 3.2배(보스·중간 보스 2.0배) + 일반 몹 0.5초 경직. 그 자리에 하트 모양 구름이 4초 남아 2.2칸 안 적에게 0.5초마다 0.3배(8번).
 *  ② 하트 세례(가장 흔함): 미카엘라 둘레 16방향으로 하트를 난사(6칸). 하트마다 처음 닿는 적 하나에 0.55배.
 *     맞은 일반 몹은 0.5초 동안 홀려 미카엘라 쪽으로 1칸 걸어오고(0.8칸 앞에서 멈춤) 그동안 공격하지 못한다. 보스는 맞기만 한다. 벽에서 멈춤.
 *  ③ 쉼터 오르골탑: 쉼터의 발레리나 오르골(R378 그림, Dots CX-0015)을 미카엘라 곁에 7초 탑으로 세운다(미카엘라 한 명에 하나).
 *     0.3초부터 0.9초마다 6.5칸 안 적 셋(아직 노리지 않은 적 먼저)에게 하트·음표가 번갈아 섞인 둥실 투사체를 띄운다.
 *     투사체는 적에게 달라붙어 0.7초 뒤 하트 폭발(1.3칸, 0.4배). 노린 적이 쓰러지면 가까운 적으로 옮기거나 그 자리에서 터진다.
 * 밀기·끌기는 엔진 moveActor 로 해서 벽을 넘지 않는다. 피해는 hitEnemy 로만 넣는다(영웅 체력·세이브는 건드리지 않는다).
 * 상태는 영웅 몸(player 객체)마다 따로 둔다: 생존 모드 배치 영웅(R720)이 player 를 몸으로 바꿔 끼워 공격할 때도 그 몸의 공격력·자리·대기를 쓴다.
 * 그림: 오르골탑만 기존 칠한 그림(R378), 하트·음표·구름은 코드로 그린 임시 연출(최종은 Dots 프레임 시트 요청 대상, 오면 교체).
 * 투사체 그림은 영웅 키의 절반 이상(R911 기준). 소리는 기존 R546 미카엘라 공격·고유기 소리를 다시 쓴다.
 * 끄기: localStorage['storyworld.r948.heart']='{"on":false}'
 */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_MICHAELA_HEART_R948__)return;
const REV='R948-heart-6',KEY='storyworld.r948.heart',HERO='michaela';
const CHANCE=.11,CROWD_BONUS=.04,CROWD_N=4,CROWD_R=2,CHANCE_MAX=.35,ROLL_GAP=.35,ICD=5;
const G971=(h,a)=>{try{const g=window.__STORYWORLD_PASSIVE_GROWTH_R971__,v=g&&g.chances(h,a);return Array.isArray(v)&&v.length===a.length&&v.every(x=>Number.isFinite(x)&&x>=0)?v:a;}catch(_){return a;}},D971=(h,s)=>{try{const g=window.__STORYWORLD_PASSIVE_GROWTH_R971__,v=g&&g.cooldown(h,s);return Number.isFinite(v)&&v>0?v:s;}catch(_){return s;}};/* R971 특수 패시브 강화(0단계=원래 값) */
const U1025=(h,a,k)=>{try{const u=window.__STORYWORLD_PASSIVE_UNLOCK_R1025__,v=u&&u.mask(h,a,k);return Array.isArray(v)&&v.length===a.length&&v.every(x=>Number.isFinite(x)&&x>=0)?v:a;}catch(_){return a;}},S1025=h=>{try{const v=window.__STORYWORLD_PASSIVE_UNLOCK_R1025__?.share(h);return Number.isFinite(v)?Math.max(0,Math.min(1,v)):1;}catch(_){return 1;}},W1025=(h,w)=>{try{const v=window.__STORYWORLD_PASSIVE_UNLOCK_R1025__?.weights(h,w);return v||w;}catch(_){return w;}},A1025=(h,k)=>{try{const u=window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;return u?u.unlocked(h,k)!==false:true;}catch(_){return true;}},O1025=id=>{try{const u=window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;return u?u.summonOpen(id)!==false:true;}catch(_){return true;}};/* R1025 특수 패시브 레벨별 해금·소환 영웅 서사 확인(파일 없으면 원래 값) */
const C1033=(h,k,o,x)=>{try{window.__STORYWORLD_PASSIVE_CUTIN_R1033__?.fire(h,k,o,x);}catch(_){}};/* R1033 세 번째 특수 패시브 컷인(1·2단·몸·끔은 그쪽에서 거름) */
const WEIGHTS=[['volley',.55],['tower',.30],['bloom',.15]];
const VOLLEY_N=16,VOLLEY_V=9,VOLLEY_RANGE=6,VOLLEY_R=.5,VOLLEY_K=.55,CHARM_T=.5,CHARM_DIST=1.0,CHARM_STOP=.8,CHARM_CD=.6;
const BLOOM_FAR=7,BLOOM_AHEAD=3,BLOOM_CHARGE=2.0,BLOOM_R=3.0,BLOOM_K=3.2,BLOOM_BOSS_K=2.0,BLOOM_STUN=.5,BLOOM_FLASH=.6;
const CLOUD_T=4,CLOUD_R=2.2,CLOUD_TICK=.5,CLOUD_K=.3;
const TOWER_LIFE=7,TOWER_OFF=1.4,TOWER_FIRST=.3,TOWER_GAP=.9,TOWER_TARGETS=3,TOWER_RANGE=6.5,FLOAT_V=4.5,FLOAT_LIFE=3,STICK_T=.7,BURST_R=1.3,BURST_K=.4,FLOAT_CAP=14,RETARGET_R=4;
const stats={rolls:0,procTotal:0,procs:{volley:0,tower:0,bloom:0},hits:0,charmed:0,stuck:0,bursts:0,draws:0,errors:0,lastError:null,minProjPx:Infinity,maxFloaters:0,burstCells:0,burstMaxPx:0,auraBack:0,auraFront:0,auraLast:null};
const owners=new WeakMap();let ownerCount=0;
let acts=[],floaters=[],charms=[],booms=[],lastRoom=null,lastT=null,prefAt=-1e9,prefOn=true,inner=0,forced=null,rng=null,shapeN=0,lastBurstSound=-1e9,preloaded=false;
const ORGEL=[0,1,2,3,4,5,6,7].map(i=>'assets/r378/orgel-'+i+'.webp');
// Dots CX-0084PJ PJ-03 칠한 장미 하트 시트(드라이브 후보, assets/r948/index.json): 비행 8칸 12fps 루프(오른쪽을 향함) · 적중 6칸 14fps 한 번.
const FLY='assets/r948/heart-fly8.webp',HIT='assets/r948/heart-hit6.webp',BURST='assets/r948/heart-burst16.webp',BURST_N=16,BURST_COLS=6,BURST_FPS=12.5,BURST_LIFE=BURST_N/BURST_FPS,
 // MH-09 칸마다 그림 중심이 위로 옮겨 감(보석 핵 y≈137 → 테 하트 y≈110): 피벗을 따라 옮겨 한 자리에서 터지게
 BURST_PIV_Y=[137,137,137,134,124,118,114,112,112,111,111,111,111,111,111,111],CELL=256,FLY_PIV={x:150,y:128},FLY_BODY=.53;
// R988 Dots CX-0094MH 시트(드라이브 alpha16 정리판 → 512 칸은 256 칸으로 줄임, 12.5fps). 칸 안 기준점은 그림 실측값.
const M03='assets/r948/mh03-heart24.webp',M04='assets/r948/mh04-blast24-r3.webp',M07='assets/r948/mh07-note24.webp',M10='assets/r948/mh10-aura24.webp',M10A='assets/r948/mh10a-enter8.webp',M10B='assets/r948/mh10b-exit8.webp',M05='assets/r948/mh05-cloud24.webp',M05_PIV={x:128,y:114},M05_W=224,SFPS=12.5,
 M03_PIV={x:128,y:134},M03_W=182,      // 큰 장미 하트: 중심·폭
 M04_PIV={x:130,y:135},M04_FROM=3,M04_LIFE=(24-M04_FROM)/SFPS, // 대폭발: 섬광 칸(4번째)부터 꽃잎 소멸까지 1.68초
 M07_PIV={x:130,y:140},                // 둥실 음표
 AURA={[M10]:{cols:6,n:24,py:188,w:218},[M10A]:{cols:4,n:8,py:219,w:160},[M10B]:{cols:4,n:8,py:225,w:177}},AURA_IN=8/SFPS; // 고리 중심 y·고리 폭(세 시트가 크기·피벗이 달라 고리 기준으로 맞춤 — Dots 지적 'y 75px 차')
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
function deal(e,v,kind){if(!e||hiddenActor(e)||!canHit(e)||!(v>0))return false;inner++;try{const r=hitEnemy(e,v,{kind:'r948-'+kind,friendly:true,owner:'hero',sourceHero:HERO,r948:true});if(r!==false)stats.hits++;return r;}catch(err){fail(err);return false;}finally{inner--;}}
function stateOf(o){let s=owners.get(o);if(!s){s={lastRoll:-1e9,readyAt:-1e9};owners.set(o,s);ownerCount++;}return s;}
function preload(){if(preloaded)return;preloaded=true;try{if(typeof addImage==='function'&&typeof readyImage==='function')for(const p of [...ORGEL,FLY,HIT,BURST,M03,M04,M07,M10,M10A,M10B,M05])if(!readyImage(p))addImage(p);}catch(err){fail(err);}}
// ---- 홀림(엔진 moveActor, 벽 존중) ----------------------------------------------------------------
function charm(e,o){if(major(e)||hiddenActor(e))return;if(charms.some(c=>c.e===e))return;stats.charmed++;e.cd=Math.max(Number(e.cd)||0,CHARM_CD);
 charms.push({e,o:{x:o.x,y:o.y},left:CHARM_DIST,v:CHARM_DIST/CHARM_T,until:T()+CHARM_T+.05});}
function runCharms(dt,t){charms=charms.filter(c=>{const e=c.e;if(hiddenActor(e)||t>c.until)return false;const d=dist(e,c.o),room=d-CHARM_STOP;if(!(room>1e-6))return false;
 const s=Math.min(c.left,c.v*dt,room);if(!(s>0))return true;try{if(typeof moveActor==='function')moveActor(e,(c.o.x-e.x)/d*s,(c.o.y-e.y)/d*s,bodyR(e));else{e.x+=(c.o.x-e.x)/d*s;e.y+=(c.o.y-e.y)/d*s;}}catch(err){fail(err);return false;}
 c.left-=s;e.cd=Math.max(Number(e.cd)||0,.2);return c.left>1e-6;});}
// ---- 세 가지 발동 ---------------------------------------------------------------------------------
function dirTo(o,tg){let ux,uy;if(tg){ux=tg.x-o.x;uy=tg.y-o.y;}const L=Math.hypot(ux||0,uy||0);if(!(L>1e-6)){const a=aim();return {ux:Math.cos(a),uy:Math.sin(a)};}return {ux:ux/L,uy:uy/L};}
function towerOf(o){return acts.find(x=>x.kind==='tower'&&x.owner===o);}
function fire(kind,o,tg){const t=T(),power=ap(),k=Math.min(2,Math.max(1,surge('range',1))),{ux,uy}=dirTo(o,tg),base={kind,owner:o,t0:t,power,k,ux,uy,seed:(stats.procTotal*7919)%360};
 stats.procTotal++;stats.procs[kind]++;C1033(HERO,kind,o);
 if(kind==='volley'){const a0=Math.atan2(uy,ux),hearts=[];for(let i=0;i<VOLLEY_N;i++){const a=a0+i*Math.PI*2/VOLLEY_N;hearts.push({x:o.x,y:o.y,ux:Math.cos(a),uy:Math.sin(a),trav:0,done:false,endAt:null});}
  acts.push({...base,x:o.x,y:o.y,ox:o.x,oy:o.y,hearts});play('r546Atk_'+HERO);shakeBy(2);return;}
 if(kind==='bloom'){let p=tg&&Math.hypot(tg.x-o.x,tg.y-o.y)<=BLOOM_FAR?{x:tg.x,y:tg.y}:{x:o.x+ux*BLOOM_AHEAD,y:o.y+uy*BLOOM_AHEAD};if(wallAt(p.x,p.y)||!lineOk(o,p))p={x:o.x,y:o.y};
  acts.push({...base,x:p.x,y:p.y,exploded:false});play('r546Sp_'+HERO);return;}
 if(kind==='tower'){const px=-uy,py=ux;let p=null;for(const s of [1,-1]){const c={x:o.x+px*TOWER_OFF*s,y:o.y+py*TOWER_OFF*s};if(!wallAt(c.x,c.y)&&lineOk(o,c)){p=c;break;}}if(!p)p={x:o.x,y:o.y};
  acts.push({...base,x:p.x,y:p.y,shots:0});play('r546Sp_'+HERO);shakeBy(2);return;}}
function pick(o,t){let k;if(forced){k=forced;forced=null;}else{const WS=W1025(HERO,WEIGHTS);let r=rnd()*WS.reduce((n,w)=>n+w[1],0);k=WS.length?WS[WS.length-1][0]:'volley';for(const [n,w] of WS){if(r<w){k=n;break;}r-=w;}}
 if(k==='tower'&&towerOf(o))k='volley';return k;}
function chanceFor(o){let n=0;for(const e of enemiesNow())if(!hiddenActor(e)&&dist(e,o)<=CROWD_R)n++;const c=CHANCE+(n>=CROWD_N?CROWD_BONUS:0);return Math.min(CHANCE_MAX,surge('chance',G971(HERO,[c])[0]))*S1025(HERO);}
function roll(e){const o=P();if(!o||o.hero!==HERO||o.hp<=0||blockedNow())return;preload();const s=stateOf(o),t=T();if(t<s.readyAt||t-s.lastRoll<ROLL_GAP)return;s.lastRoll=t;stats.rolls++;
 if(!forced&&!(rnd()<chanceFor(o)))return;const kind=pick(o,t);s.readyAt=t+D971(HERO,ICD);lastRoom=curRoom();fire(kind,o,e&&Number.isFinite(e.x)?{x:e.x,y:e.y}:null);}
// 미카엘라 본인 타격만(다른 영웅·협동 동료·적·이 패시브 자신의 피해 제외).
function mine(src){const o=P();if(!o||o.hero!==HERO)return false;if(src&&typeof src==='object'){if(src.r948||src.sourceHero&&src.sourceHero!==HERO)return false;if(src.coopIdR62||src.ally||src.owner==='ally'||src.owner==='enemy'||src.hostile)return false;}return true;}
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,source,...a){const r=base.call(this,e,value,source,...a);
 try{if(!inner&&r!==false&&e&&on()&&mine(source))roll(e);}catch(err){fail(err);}return r;};}
// ---- 매 틱 ------------------------------------------------------------------------------------------
function boom(x,y,kind,big){booms.push({x,y,t0:T(),kind,big:!!big});if(booms.length>16)booms.shift();}
function burst(f,t){f.state='done';stats.bursts++;const c={x:f.x,y:f.y};
 for(const e of enemiesNow()){if(hiddenActor(e))continue;if(dist(e,c)>BURST_R*f.k+(e.radius||0)||!lineOk(c,e))continue;deal(e,f.power*BURST_K,'tower');}
 boom(c.x,c.y,'burst',false);if(t-lastBurstSound>=.25){lastBurstSound=t;play('r546Atk_'+HERO);}}
function launchWave(x,t){const busy=new Set(floaters.filter(f=>f.state!=='done').map(f=>f.target));
 const foes=enemiesNow().filter(e=>!hiddenActor(e)&&dist(e,x)<=TOWER_RANGE*x.k&&lineOk(x,e)).sort((a,b)=>(busy.has(a)-busy.has(b))||dist(a,x)-dist(b,x)).slice(0,TOWER_TARGETS);
 for(const e of foes){if(floaters.length>=FLOAT_CAP)break;const shape=(shapeN++%2)?'note':'heart';
  floaters.push({x:x.x,y:x.y,lift:1.15,target:e,shape,state:'fly',t0:t,power:x.power,k:x.k,seed:shapeN*1.7,stickAt:null});}
 stats.maxFloaters=Math.max(stats.maxFloaters,floaters.length);}
function stepFloaters(t,dt){floaters=floaters.filter(f=>{if(f.state==='done')return false;
 if(f.state==='fly'){if(hiddenActor(f.target)){const near=enemiesNow().filter(e=>!hiddenActor(e)&&dist(e,f)<=RETARGET_R).sort((a,b)=>dist(a,f)-dist(b,f))[0];if(near)f.target=near;else{burst(f,t);return false;}}
  const e=f.target,d=dist(e,f),s=FLOAT_V*dt;f.lift=Math.max(.6,f.lift-dt*.6);
  if(d<=.45+(e.radius||0)+s){f.x=e.x;f.y=e.y;f.state='stuck';f.stickAt=t;stats.stuck++;}else{f.x+=(e.x-f.x)/d*s;f.y+=(e.y-f.y)/d*s;}
  if(f.state==='fly'&&t-f.t0>=FLOAT_LIFE){burst(f,t);return false;}return true;}
 if(f.state==='stuck'){if(!hiddenActor(f.target)){f.x=f.target.x;f.y=f.target.y;}if(t-f.stickAt>=STICK_T){burst(f,t);return false;}return true;}
 return false;});}
function stepAct(x,t,dt){const u=t-x.t0;
 if(x.kind==='volley'){let live=0;for(const h of x.hearts){if(h.done){if(t-h.endAt<.25)live++;continue;}live++;
   const s=VOLLEY_V*dt,nx=h.x+h.ux*s,ny=h.y+h.uy*s;if(wallAt(nx,ny)){h.done=true;h.endAt=t;continue;}h.x=nx;h.y=ny;h.trav+=s;
   for(const e of enemiesNow()){if(hiddenActor(e))continue;if(dist(e,h)>VOLLEY_R*x.k+(e.radius||0)||!lineOk(x,e))continue;deal(e,x.power*VOLLEY_K,'volley');if(e.hp>0)charm(e,x.owner&&!(x.owner.hp<=0)?x.owner:{x:x.ox,y:x.oy});h.done=true;h.endAt=t;h.hit=true;boom(h.x,h.y,'pop',false);break;}
   if(!h.done&&h.trav>=VOLLEY_RANGE){h.done=true;h.endAt=t;}}
  return live>0;}
 if(x.kind==='bloom'){if(!x.exploded&&u>=BLOOM_CHARGE-1e-9){x.exploded=true;const c={x:x.x,y:x.y};
   for(const e of enemiesNow()){if(hiddenActor(e))continue;if(dist(e,c)>BLOOM_R*x.k+(e.radius||0)||!lineOk(c,e))continue;deal(e,x.power*(major(e)?BLOOM_BOSS_K:BLOOM_K),'bloom');if(!major(e)&&e.hp>0)e.cd=Math.max(Number(e.cd)||0,BLOOM_STUN);}
   acts.push({kind:'cloud',owner:x.owner,t0:t,power:x.power,k:x.k,x:x.x,y:x.y,ticks:0,seed:x.seed});boom(x.x,x.y,'bloom',true);play('r546Sp_'+HERO);shakeBy(6);}
  return u<BLOOM_CHARGE+BLOOM_FLASH;}
 if(x.kind==='cloud'){while(x.ticks<CLOUD_T/CLOUD_TICK&&u>=(x.ticks+1)*CLOUD_TICK-1e-9){x.ticks++;for(const e of enemiesNow()){if(hiddenActor(e)||dist(e,x)>CLOUD_R*x.k+(e.radius||0))continue;deal(e,x.power*CLOUD_K,'cloud');}}
  return u<CLOUD_T+.3;}
 if(x.kind==='tower'){if(u>=TOWER_LIFE)return false;while(u>=TOWER_FIRST+x.shots*TOWER_GAP-1e-9&&TOWER_FIRST+x.shots*TOWER_GAP<TOWER_LIFE){x.shots++;launchWave(x,t);}return true;}
 return false;}
function cancel(){acts=[];floaters=[];charms=[];booms=[];}
function step(){const t=T(),rm=curRoom();if(rm!==lastRoom){if(lastRoom!==null)cancel();lastRoom=rm;}
 const dt=lastT==null||t<lastT?0:Math.min(.1,t-lastT);lastT=t;
 if(!on()||blockedNow()){cancel();return;}
 const cur=acts.slice();acts=[];const keep=[];for(const x of cur){try{if(stepAct(x,t,dt))keep.push(x);}catch(err){fail(err);}}acts=keep.concat(acts);
 try{stepFloaters(t,dt);}catch(err){fail(err);floaters=[];}
 runCharms(dt,t);booms=booms.filter(b=>t-b.t0<(b.big?(b.kind==='bloom'?Math.max(1.0,M04_LIFE):1.0):b.kind==='burst'?BURST_LIFE:.5));}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);
 try{if(typeof started==='undefined'||started)step();}catch(err){fail(err);cancel();}sentinel(acts.length>0||floaters.length>0||booms.length>0);return r;};}
// ---- 그리기(효과 표지 하나, 3D 기록기에는 ctx.scope 로 자리 주인을 붙인다) -----------------------------------------
// 색: 미카엘라 고유색 핏빛 장미 #B21A3E 의 명암(짙은 장미 → 분홍 → 연분홍) + 보조색 실버 #E2E8F2 (R302 두 색 규칙).
const ROSE='178,26,62',ROSE_DK='92,10,34',PINK='236,96,136',PINK_HOT='255,206,222',SILVER='226,232,242';
function sc(o,f){if(typeof ctx!=='undefined'&&ctx&&typeof ctx.scope==='function')ctx.scope(o,f);else f();}
function scale(){const z=typeof zoom==='number'&&zoom>0?zoom:1,TL=typeof TILE==='number'?TILE:34;return {z,T1:TL*z*Math.SQRT2,AH:typeof actorHeight==='function'?actorHeight():66*z};}
function heartPath(x,y,s,flat){const v=flat||1;ctx.beginPath();ctx.moveTo(x,y+.5*s*v);
 ctx.bezierCurveTo(x-.12*s,y+.36*s*v,x-.52*s,y+.14*s*v,x-.5*s,y-.16*s*v);ctx.bezierCurveTo(x-.48*s,y-.46*s*v,x-.1*s,y-.52*s*v,x,y-.24*s*v);
 ctx.bezierCurveTo(x+.1*s,y-.52*s*v,x+.48*s,y-.46*s*v,x+.5*s,y-.16*s*v);ctx.bezierCurveTo(x+.52*s,y+.14*s*v,x+.12*s,y+.36*s*v,x,y+.5*s*v);ctx.closePath();}
// 중심이 같은 원형 그라데이션만 쓴다(3D 기록기가 두 원 중심이 다른 그라데이션을 만나면 게임이 멈춤 — R946 실측).
function glow(x,y,r,col,a){ctx.save();try{ctx.globalAlpha*=a;ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient?ctx.createRadialGradient(x,y,0,x,y,r):null;
 if(g){g.addColorStop(0,`rgba(${col},.55)`);g.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=g;}else ctx.fillStyle=`rgba(${col},.2)`;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}finally{ctx.restore();}}
// 칠한 하트: 짙은 장미 테 → 장미 몸 → 분홍 속 → 왼쪽 위 밝은 점(광원 왼쪽 위) + 실버 가는 테
function paintHeart(x,y,s,a,proj){if(proj)stats.minProjPx=Math.min(stats.minProjPx,s);glow(x,y,s*.95,PINK,a*.8);ctx.save();try{ctx.globalAlpha*=a;
 heartPath(x,y,s);ctx.fillStyle=`rgba(${ROSE_DK},.97)`;ctx.fill();heartPath(x,y-s*.02,s*.86);ctx.fillStyle=`rgba(${ROSE},.98)`;ctx.fill();
 heartPath(x-s*.04,y-s*.06,s*.58);ctx.fillStyle=`rgba(${PINK},.9)`;ctx.fill();
 ctx.fillStyle=`rgba(${PINK_HOT},.95)`;ctx.beginPath();ctx.ellipse(x-s*.22,y-s*.2,s*.11,s*.07,-.6,0,Math.PI*2);ctx.fill();
 heartPath(x,y,s);ctx.strokeStyle=`rgba(${SILVER},.85)`;ctx.lineWidth=Math.max(1,s*.045);ctx.stroke();}finally{ctx.restore();}}
// 칠한 음표(8분음표): 장미 머리 + 실버 기둥·꼬리
function paintNote(x,y,s,a,proj){if(proj)stats.minProjPx=Math.min(stats.minProjPx,s);glow(x,y,s*.9,PINK,a*.8);ctx.save();try{ctx.globalAlpha*=a;const hx=x-s*.14,hy=y+s*.3;
 ctx.strokeStyle=`rgba(${SILVER},.95)`;ctx.lineWidth=Math.max(1.5,s*.08);ctx.beginPath();ctx.moveTo(hx+s*.2,hy-s*.02);ctx.lineTo(hx+s*.2,y-s*.5);ctx.quadraticCurveTo(hx+s*.5,y-s*.3,hx+s*.42,y-s*.02);ctx.stroke();
 ctx.fillStyle=`rgba(${ROSE_DK},.97)`;ctx.beginPath();ctx.ellipse(hx,hy,s*.24,s*.17,-.45,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=`rgba(${ROSE},.98)`;ctx.beginPath();ctx.ellipse(hx,hy-s*.01,s*.2,s*.13,-.45,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=`rgba(${PINK_HOT},.9)`;ctx.beginPath();ctx.ellipse(hx-s*.07,hy-s*.06,s*.06,s*.035,-.6,0,Math.PI*2);ctx.fill();}finally{ctx.restore();}}
// 시트 한 칸 그리기(없으면 false → 코드 그림으로 대신). ang 은 화면 각도(그림은 오른쪽을 향함).
function sheet(path,n,i,x,y,size,ang,a,piv){let row=null;try{row=typeof readyImage==='function'?readyImage(path):null;if(!row&&typeof addImage==='function')addImage(path);}catch(_){}
 if(!row||!row.image)return false;const k=size/CELL,f=((i%n)+n)%n;ctx.save();try{ctx.globalAlpha*=a;ctx.globalCompositeOperation='source-over';ctx.translate(x,y);if(ang)ctx.rotate(ang);
 ctx.drawImage(row.image,f*CELL,0,CELL,CELL,-(piv?piv.x:CELL/2)*k,-(piv?piv.y:CELL/2)*k,CELL*k,CELL*k);}finally{ctx.restore();}return true;}
function gridCell(path,cols,f,x,y,size,a,px,py,glowPass=0){const row=typeof readyImage==='function'?readyImage(path):null;if(!row||!row.image){if(typeof addImage==='function')addImage(path);return false;}
 if(a<=0)return true;const k=size/CELL,cx=(f%cols)*CELL,cy=Math.floor(f/cols)*CELL;ctx.save();try{ctx.globalAlpha*=Math.min(1,a);ctx.globalCompositeOperation='source-over';ctx.drawImage(row.image,cx,cy,CELL,CELL,x-px*k,y-py*k,CELL*k,CELL*k);
  // 어두운 맵·검붉은 몹 위에서 가는 테가 묻혀서(헤드리스 실측) 같은 칸을 'lighter' 로 한 번 더 옅게 — 오르골탑과 같은 방식
  if(glowPass>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=glowPass;ctx.drawImage(row.image,cx,cy,CELL,CELL,x-px*k,y-py*k,CELL*k,CELL*k);}stats.burstCells++;stats.burstMaxPx=Math.max(stats.burstMaxPx,CELL*k);}finally{ctx.restore();}return true;}
// 칸의 일부 행만(r0..r1) 그린다 — 받침 빛 고리를 오르골 뒤(윗줄)와 앞(아랫줄)으로 나눠 그리기 위함.
function cellPart(path,cols,f,x,y,k,px,py,r0,r1,a,glowPass=0){const row=typeof readyImage==='function'?readyImage(path):null;if(!row||!row.image){if(typeof addImage==='function')addImage(path);return false;}
 const h=Math.max(0,Math.min(CELL,r1)-Math.max(0,r0));if(a<=0||h<=0||!(k>0))return true;const cx=(f%cols)*CELL,cy=Math.floor(f/cols)*CELL+Math.max(0,r0);ctx.save();try{ctx.globalAlpha*=Math.min(1,a);ctx.globalCompositeOperation='source-over';
 ctx.drawImage(row.image,cx,cy,CELL,h,x-px*k,y+(Math.max(0,r0)-py)*k,CELL*k,h*k);
 if(glowPass>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=glowPass;ctx.drawImage(row.image,cx,cy,CELL,h,x-px*k,y+(Math.max(0,r0)-py)*k,CELL*k,h*k);}}finally{ctx.restore();}return true;}
const sheetReady=p=>{try{const r=typeof readyImage==='function'?readyImage(p):null;if(!r&&typeof addImage==='function')addImage(p);return !!(r&&r.image);}catch(_){return false;}};
const fIdx=(u,n)=>Math.min(n-1,Math.max(0,Math.floor((Number.isFinite(u)?u:0)*SFPS)));
const pingPong=(i,n)=>{const m=2*(n-1),k=((i%m)+m)%m;return k<n?k:m-k;};
// Dots MH-09 r2: 12.5fps 16장 한 번. 3장(보석 하트)→4장(테 하트)이 한 번에 바뀌어 튀므로 3장 구간 동안 4장을 교차 페이드로 겹친다(검토 지시).
function burstSheet(b,t,x,y,size){const u=Math.max(0,t-b.t0)*BURST_FPS,f=Math.min(BURST_N-1,Math.floor(u)),w=Math.min(1,Math.max(0,u-f)),piv=i=>BURST_PIV_Y[i]??111;
 if(f===2){if(!gridCell(BURST,BURST_COLS,2,x,y,size,1-w,126,piv(2)))return false;gridCell(BURST,BURST_COLS,3,x,y,size,w,126,piv(3),.45);glow(x,y-size*.02,size*.3,PINK_HOT,.5*w);return true;}
 return gridCell(BURST,BURST_COLS,f,x,y,size,1,126,piv(f),f>=3?.45:0);}
// 시트(칠한 장미 꽃잎 소용돌이)를 몸으로 깔고, 하트 실루엣이 멀리서도 읽히게 칠한 하트를 가운데에 겹친다(7분야 심사: UX·연출).
function flyHeart(x,y,s,a,ang,t,seed){glow(x,y,s*.9,PINK,a*.6);if(sheet(FLY,8,Math.floor(t*12+seed),x,y,s*1.15/FLY_BODY,ang,a,FLY_PIV)){stats.minProjPx=Math.min(stats.minProjPx,s);paintHeart(x,y,s*.78,a,false);return;}paintHeart(x,y,s,a,true);}
function screenAng(ux,uy){if(typeof project!=='function')return 0;const a=project(0,0),b=project(ux,uy);return Math.atan2(b.y-a.y,b.x-a.x);}
function groundHeart(q,R,col,w,a,fillA){ctx.save();try{ctx.globalAlpha*=a;ctx.globalCompositeOperation='lighter';heartPath(q.x,q.y,R,.5);if(fillA){ctx.fillStyle=`rgba(${col},${fillA})`;ctx.fill();}ctx.lineWidth=w;ctx.strokeStyle=`rgba(${col},.9)`;ctx.stroke();}finally{ctx.restore();}}
function ring(q,R,col,w,a){ctx.save();try{ctx.globalAlpha*=a;ctx.globalCompositeOperation='lighter';ctx.lineWidth=w;ctx.strokeStyle=`rgba(${col},.9)`;ctx.beginPath();ctx.ellipse(q.x,q.y,R,R*.5,0,0,Math.PI*2);ctx.stroke();}finally{ctx.restore();}}
function drawVolley(x,t){const {z,AH}=scale(),s=AH*.55,lift=AH*.5,id='r948:volley:'+x.t0.toFixed(2);
 x.hearts.forEach((h,i)=>{const fade=h.done?Math.max(0,1-(t-h.endAt)/.25):1;if(!(fade>0))return;const q=project(h.x,h.y),wob=Math.sin(t*14+i)*2*z;
  sc({id:id+':h'+i,kind:'effect',pxfSide:'hero',x:h.x,y:h.y},()=>{for(let k=1;k<=3;k++){const p=project(h.x-h.ux*.28*k,h.y-h.uy*.28*k);glow(p.x,p.y-lift,s*(.5-.1*k),PINK,fade*(.5-.12*k));}
   if(h.done&&h.hit)return; // 맞은 하트는 팝(적중 시트)이 대신 그림
   flyHeart(q.x+wob,q.y-lift,s*(h.done?1+.4*(1-fade):1),fade,screenAng(h.ux,h.uy),t,i);});});}
function drawBloom(x,t){const {z,T1,AH}=scale(),u=Math.max(0,t-x.t0),q=project(x.x,x.y),id='r948:bloom:'+x.t0.toFixed(2);
 if(!x.exploded){const f=Math.min(1,u/BLOOM_CHARGE),grow=Math.min(1,u/.35),beat=1+.08*Math.sin(u*(7+9*f))+(f>.85?.12*(f-.85)/.15:0),s=AH*(.6+1.1*grow)*beat,cy=q.y-AH*.95;
  sc({id:id+':mark',kind:'effect',pxfSide:'hero',x:x.x,y:x.y,groundAligned:true},()=>{groundHeart(q,BLOOM_R*x.k*T1*.5*Math.sqrt(grow),ROSE,Math.max(1.5,2.5*z),.35+.45*f,.06+.08*f);});
  sc({id:id+':heart',kind:'effect',pxfSide:'hero',x:x.x,y:x.y+.06},()=>{glow(q.x,cy,s*(1.1+.5*f),PINK,.6+.4*f);
   // R988 MH-03: 24장이 2초 고동과 같은 길이(1.92초) — 한 번 재생이라 24→1 이음매가 보이지 않는다. 금이 갈수록 폭발이 다가옴.
   if(gridCell(M03,6,fIdx(u,24),q.x,cy,s*1.05*CELL/M03_W,grow,M03_PIV.x,M03_PIV.y,.5+(f>.7?.3*(f-.7)/.3:0)))return; // 짙은 루비가 어두운 맵·몹 위에서 탁해져(헤드리스 실측) 'lighter' 겹으로 빛나게, 몹 앞 층
   paintHeart(q.x,cy,s,grow,false);
   if(f>.6){ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${PINK_HOT},${(f-.6)/.4})`;ctx.lineWidth=Math.max(1,2*z);for(let i=0;i<5;i++){const a=x.seed*.017+i*1.256;ctx.beginPath();ctx.moveTo(q.x,cy);ctx.lineTo(q.x+Math.cos(a)*s*.42,cy+Math.sin(a)*s*.36);ctx.stroke();}}finally{ctx.restore();}}});return;}
 const v=Math.min(1,Math.max(0,(u-BLOOM_CHARGE)/BLOOM_FLASH)),a=1-v, // 폭발 판정은 u≥2-1e-9 라 v 가 아주 작은 음수일 수 있다 → sqrt(NaN) 이면 3D 기록기가 화면 실패로 게임을 세운다
 R=BLOOM_R*x.k*T1*.5*(.35+.8*Math.sqrt(v));
 sc({id:id+':blast',kind:'effect',pxfSide:'hero',x:x.x,y:x.y,groundAligned:true},()=>{groundHeart(q,R*1.15,PINK_HOT,Math.max(2,9*z*a),a,.14*a);ring(q,R*.8,ROSE,Math.max(1,3*z),a);});
 sc({id:id+':flash',kind:'effect',pxfSide:'hero',x:x.x,y:x.y+.01},()=>{const cy=q.y-AH*.95;glow(q.x,cy,AH*(1.4+1.4*v),PINK_HOT,a);
  if(sheetReady(M04))return; // R988: 선 하트 충격파는 MH-04 시트가 drawBoom 에서 그림(바닥 충격파·빛은 그대로)
  // 위로 선 큰 하트 충격파 두 겹(속은 채우고 바깥은 굵은 테)
  ctx.save();try{ctx.globalCompositeOperation='lighter';const S=AH*(1.7+2.6*Math.sqrt(v));ctx.globalAlpha*=a;heartPath(q.x,cy,S);ctx.fillStyle=`rgba(${PINK},${.22*a})`;ctx.fill();ctx.lineWidth=Math.max(2,10*z*a);ctx.strokeStyle=`rgba(${PINK_HOT},.95)`;ctx.stroke();
   heartPath(q.x,cy,S*.72);ctx.lineWidth=Math.max(1,4*z*a);ctx.strokeStyle=`rgba(${ROSE},.9)`;ctx.stroke();}finally{ctx.restore();}
  for(let i=0;i<12;i++){const an=i*Math.PI/6+x.seed*.017,d=AH*.5+R*(.2+1.0*v);paintHeart(q.x+Math.cos(an)*d,q.y-AH*.6+Math.sin(an)*d*.55-AH*.4*v,AH*.32*(1-.5*v),a,false);}});}
function drawCloud(x,t){const {z,T1,AH}=scale(),u=t-x.t0,q=project(x.x,x.y),a=Math.min(1,u/.3)*(u>CLOUD_T?Math.max(0,1-(u-CLOUD_T)/.3):1),R=CLOUD_R*x.k*T1*.5,id='r948:bloom:cloud:'+x.t0.toFixed(2);
 sc({id:id+':ground',kind:'effect',pxfSide:'hero',x:x.x,y:x.y,groundAligned:true},()=>{groundHeart(q,R*2,ROSE,Math.max(1,2*z),a*.6,.12);});
 // 공중에 선 하트 모양 구름: 하트 테두리를 따라 뭉게 덩이(가운데가 같은 그라데이션 원) + 옅게 채운 하트 — 천천히 숨쉬듯 부풂
 sc({id:id+':puffs',kind:'effect',pxfSide:'hero',x:x.x,y:x.y+.01},()=>{const S=Math.max(AH*1.9,R*1.9),cy=q.y-AH*.9-Math.sin(t*1.3)*2*z,n=18;
  // R998: Dots MH-05 하트 구름 24장(알파 60% 상한 정리판)을 구름 수명(4.3초)에 걸쳐 한 번 — 작게 피어 부풀었다 줄며 사라짐. 가장 큰 장 폭 224px 를 코드 구름 폭에 맞춤
  const f5=Math.min(23,Math.max(0,Math.floor((Number.isFinite(u)?u:0)/(CLOUD_T+.3)*24)));
  if(gridCell(M05,6,f5,q.x,cy,S*.95*CELL/M05_W,a,M05_PIV.x,M05_PIV.y,.35)){glow(q.x,cy,S*.4,ROSE,a*.3);return;}
  ctx.save();try{ctx.globalAlpha*=a;heartPath(q.x,cy,S*.92);ctx.fillStyle=`rgba(${PINK},.26)`;ctx.fill();}finally{ctx.restore();}
  for(let i=0;i<n;i++){const th=i/n*Math.PI*2,hx=Math.pow(Math.sin(th),3),hy=-(13*Math.cos(th)-5*Math.cos(2*th)-2*Math.cos(3*th)-Math.cos(4*th))/17;
   const br=1+.07*Math.sin(t*2.2+i),px=q.x+hx*S*.5*br,py=cy+hy*S*.5*br+S*.04,r=AH*(.26+.06*Math.sin(t*1.7+i*1.3));
   ctx.save();try{ctx.globalAlpha*=a*.55;ctx.fillStyle=`rgba(${i%3?PINK:PINK_HOT},.6)`;ctx.beginPath();ctx.arc(px,py,r,0,Math.PI*2);ctx.fill();}finally{ctx.restore();}glow(px,py,r*1.7,i%3?PINK:PINK_HOT,a*.7);}
  glow(q.x,cy,S*.45,ROSE,a*.5);});}
function orgelFrame(t,x){return ORGEL[Math.floor((t-x.t0)/.12)%8];}
function drawTower(x,t){const {z,T1,AH}=scale(),u=t-x.t0,q=project(x.x,x.y),pop=u<.35?1+.18*Math.sin(u/.35*Math.PI):1,grow=Math.min(1,u/.2),a=u>TOWER_LIFE-.5?Math.max(0,(TOWER_LIFE-u)/.5):1,h=AH*1.6*pop*grow,id='r948:tower:'+x.t0.toFixed(2);
 // R988 MH-10a 등장(0.64초) → MH-10 받침 빛 반복 → MH-10b 퇴장(마지막 0.64초). 고리 윗줄은 오르골 뒤, 아랫줄(앞 테·보석)은 오르골 앞.
 const ap=u<AURA_IN?{p:M10A,f:fIdx(u,8),a:1}:u>TOWER_LIFE-AURA_IN?{p:M10B,f:fIdx(u-(TOWER_LIFE-AURA_IN),8),a:1}:{p:M10,f:Math.floor(Math.max(0,u-AURA_IN)*SFPS)%24,a},A0=AURA[ap.p],ak=AH*1.9/A0.w;
 if(sheetReady(ap.p)){sc({id:id+':aura-back',kind:'effect',pxfSide:'hero',x:x.x,y:x.y+.01},()=>{if(cellPart(ap.p,A0.cols,ap.f,q.x,q.y,ak,128,A0.py,0,A0.py,ap.a,.35)){stats.auraBack++;stats.auraLast={p:ap.p.slice(-16),f:ap.f,k:+ak.toFixed(3),a:+(+ap.a).toFixed(2),x:Math.round(q.x),y:Math.round(q.y)};}});
  sc({id:id+':aura-front',kind:'effect',pxfSide:'hero',x:x.x,y:x.y+.04},()=>{if(cellPart(ap.p,A0.cols,ap.f,q.x,q.y,ak,128,A0.py,A0.py,CELL,ap.a,.35))stats.auraFront++;});}
 else sc({id:id+':ring',kind:'effect',pxfSide:'hero',x:x.x,y:x.y,groundAligned:true},()=>{ring(q,AH*.85,ROSE,Math.max(1.5,3*z),a*.8);ring(q,AH*.62,SILVER,Math.max(1,1.5*z),a*.6);
  for(let i=0;i<4;i++){const an=t*.9+i*Math.PI/2;paintNote(q.x+Math.cos(an)*AH*.74,q.y+Math.sin(an)*AH*.37,AH*.22,a*.7,false);}});
 sc({id:id+':box',kind:'effect',pxfSide:'hero',x:x.x,y:x.y+.02},()=>{glow(q.x,q.y-h*.55,h*.75,PINK,a*.55);ctx.save();try{ctx.globalAlpha*=a;ctx.globalCompositeOperation='source-over';
  const p=orgelFrame(t,x);let done=false;try{const row=typeof readyImage==='function'?readyImage(p):null;
   // 엔진 sprite 는 화면 설정(픽셀 형태·톤)을 거쳐 작고 흐리게 나와서, 오르골 그림은 원본을 바로 그린다(발 = 상자 바닥 중앙).
   if(row&&row.image){const b=row.crop||{w:row.image.naturalWidth||262,h:row.image.naturalHeight||360},w=h*b.w/b.h;if(b.x!=null)ctx.drawImage(row.image,b.x,b.y,b.w,b.h,q.x-w/2,q.y-h,w,h);else ctx.drawImage(row.image,q.x-w/2,q.y-h,w,h);
    // 어두운 맵에서 묻히지 않게 같은 그림을 'lighter' 로 옅게 한 번 더(따뜻한 쉼터 빛 = 안전 신호)
    const pv=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=.14;if(b.x!=null)ctx.drawImage(row.image,b.x,b.y,b.w,b.h,q.x-w/2,q.y-h,w,h);else ctx.drawImage(row.image,q.x-w/2,q.y-h,w,h);ctx.globalCompositeOperation=pv;done=true;}
   else if(typeof addImage==='function')addImage(p);}catch(err){fail(err);}
  if(!done){const w=h*.73,bh=h*.42;ctx.fillStyle=`rgba(${ROSE_DK},.97)`;ctx.fillRect(q.x-w/2,q.y-bh,w,bh);ctx.fillStyle=`rgba(${ROSE},.95)`;ctx.fillRect(q.x-w/2+2*z,q.y-bh+2*z,w-4*z,bh*.45);
   ctx.strokeStyle=`rgba(${SILVER},.9)`;ctx.lineWidth=Math.max(1,1.5*z);ctx.beginPath();ctx.moveTo(q.x-w/2,q.y-bh);ctx.lineTo(q.x-w/2+w*.08,q.y-h);ctx.lineTo(q.x+w/2-w*.08,q.y-h);ctx.lineTo(q.x+w/2,q.y-bh);ctx.stroke();
   paintHeart(q.x,q.y-bh*.45,bh*.5,1,false);}}finally{ctx.restore();}
  // 상자에서 피어오르는 작은 음표·하트
  for(let i=0;i<3;i++){const ph=((t*.6+i/3)%1),px=q.x+Math.sin(t*2+i*2)*h*.25,py=q.y-h*(.85+.6*ph);(i%2?paintNote:paintHeart)(px,py,AH*.2,a*(1-ph),false);}});}
function drawFloater(f,t,i){const {z,AH}=scale(),s=AH*.52,q=project(f.x,f.y),bob=Math.sin(t*5+f.seed)*AH*.08,lift=AH*f.lift+(f.state==='fly'?bob:0),id='r948:tower:float:'+f.t0.toFixed(2)+':'+i;
 sc({id,kind:'effect',pxfSide:'hero',x:f.x,y:f.y},()=>{if(f.state==='stuck'){const v=Math.min(1,(t-f.stickAt)/STICK_T),pulse=1+.12*(.5+.5*Math.sin(v*Math.PI*6))+.15*v;glow(q.x,q.y-lift,s*(.8+.6*v),PINK_HOT,.5+.5*v);
   if(f.shape==='note')noteSheet(f,t,q.x,q.y-lift,s*pulse);else flyHeart(q.x,q.y-lift,s*pulse,1,0,t*2,f.seed);return;}
  for(let k=1;k<=3;k++)glow(q.x-Math.sin(t*5+f.seed-k*.6)*3*z,q.y-lift+k*s*.18,s*(.35-.07*k),PINK,.35);
  if(f.shape==='note')noteSheet(f,t,q.x,q.y-lift,s);else{const e=f.target,ang=e?screenAng(e.x-f.x,e.y-f.y):0;flyHeart(q.x,q.y-lift,s,1,ang,t,f.seed);}});}
// R988 MH-07: 24장 왕복 재생(1→24→1)으로 24→1 이음매를 없앰. 시트가 없으면 코드 음표.
function noteSheet(f,t,x,y,s){const fr=pingPong(Math.floor((t+(f.seed||0)%7)*SFPS),24);if(gridCell(M07,6,fr,x,y,s*1.9,1,M07_PIV.x,M07_PIV.y)){stats.minProjPx=Math.min(stats.minProjPx,s);return;}paintNote(x,y,s,1,true);}
function R0burst(T1){return BURST_R*T1*.5;}
function drawBoom(b,t){const {z,T1,AH}=scale(),life=b.big?1.0:.5,v=Math.min(1,(t-b.t0)/life),a=1-v,q=project(b.x,b.y),id='r948:'+(b.kind==='bloom'?'bloom':b.kind==='pop'?'volley':'tower')+':boom:'+b.t0.toFixed(2)+':'+b.x.toFixed(1)+':'+b.y.toFixed(1);
 if(b.kind==='bloom'){ // R988 MH-04 r2: 섬광 칸부터 꽃잎 소멸까지(1.68초). 시트가 없으면 drawBloom 의 코드 충격파가 그림.
  const u=Math.max(0,t-b.t0),fr=Math.min(23,M04_FROM+Math.floor(u*SFPS));if(u>=M04_LIFE)return;
  sc({id:id+':sheet',kind:'effect',pxfSide:'hero',x:b.x,y:b.y+.02},()=>{gridCell(M04,6,fr,q.x,q.y-AH*.95,AH*4.2,1,M04_PIV.x,M04_PIV.y,fr<8?.3:0);});return;}
 const R=(b.kind==='burst'?BURST_R*T1*.5:AH*.4)*(.4+.8*Math.sqrt(v));
 // 바닥 하트 표식만 바닥 층(groundAligned), 폭발 그림은 선 층으로 몹 앞에(같은 층에 넣으면 몹 몸에 가려 안 보였음 — 헤드리스 실측)
 if(b.kind==='burst')sc({id:id+':ground',kind:'effect',pxfSide:'hero',x:b.x,y:b.y,groundAligned:true},()=>{groundHeart(q,R*1.6,PINK_HOT,Math.max(1.5,5*z*a),a,.12*a);});
 sc({id,kind:'effect',pxfSide:'hero',x:b.x,y:b.y+.05},()=>{
  const cy=q.y-AH*.6;if(b.kind==='burst'){glow(q.x,cy,AH*.45*(1+v),PINK_HOT,a*.7);
   // 시트의 테 하트 반폭(≈75/256 칸)이 피해 반지름(1.3칸)과 맞게
   if(burstSheet(b,t,q.x,cy,Math.max(AH*2.1,R0burst(T1)*3.4)))return;}
  else glow(q.x,cy,AH*.5*(1+v),PINK_HOT,a);
  if(sheet(HIT,6,Math.min(5,Math.floor((t-b.t0)*14)),q.x,cy,AH*(b.kind==='burst'?1.5:1.1),0,Math.min(1,a*1.6),null))return;
  const n=b.kind==='burst'?6:4;for(let i=0;i<n;i++){const an=i*Math.PI*2/n+b.t0,d=AH*.55*v;paintHeart(q.x+Math.cos(an)*d,cy+Math.sin(an)*d*.6-AH*.2*v,AH*.2*(1-.4*v),a,false);}});}
function draw(){if(typeof project!=='function'||typeof ctx==='undefined'||!ctx)return;const t=T();
 for(const x of acts){try{if(x.kind==='volley')drawVolley(x,t);else if(x.kind==='bloom')drawBloom(x,t);else if(x.kind==='cloud')drawCloud(x,t);else if(x.kind==='tower')drawTower(x,t);}catch(err){fail(err);}}
 floaters.forEach((f,i)=>{try{drawFloater(f,t,i);}catch(err){fail(err);}});
 for(const b of booms){try{drawBoom(b,t);}catch(err){fail(err);}}stats.draws++;}
const SENT={type:'r948-heart',x:0,y:0,age:0,life:Infinity,r948Sentinel:true};
function sentinel(want){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);if(want&&i<0)effects.push(SENT);else if(!want&&i>=0)effects.splice(i,1);SENT.age=0;
 const a=acts[0]||floaters[0];if(want&&a){SENT.x=a.x;SENT.y=a.y;}}catch(_){}}
let wrapped=false;function wrapEffect(){if(wrapped||typeof drawEffect!=='function')return wrapped;const base=drawEffect;
 drawEffect=function(e,...a){if(e&&e.r948Sentinel){try{ctx.save();try{ctx.globalCompositeOperation='source-over';draw();}finally{ctx.restore();}}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};wrapped=true;return true;}
if(!wrapEffect()&&typeof setTimeout==='function'){let n=0;(function arm(){if(wrapEffect()||++n>40)return;setTimeout(arm,250);})();}
function set(v){try{localStorage.setItem(KEY,JSON.stringify({on:v!==false}));}catch(_){}prefAt=-1e9;return on();}
const KINDS=['volley','tower','bloom'];
window.__STORYWORLD_MICHAELA_HEART_R948__=Object.freeze({revision:REV,set,on:()=>on(),
 names:Object.freeze({passive:'사랑의 처방',volley:'하트 세례',tower:'쉼터 오르골탑',bloom:'연심 대개화',cloud:'하트 구름'}),
 qaForce:k=>{forced=KINDS.includes(k)?k:null;return forced;},qaRandom:f=>{rng=typeof f==='function'?f:null;return !!rng;},
 qaReset:()=>{const o=P();if(o){const s=stateOf(o);s.readyAt=-1e9;s.lastRoll=-1e9;}return true;},
 inspect:()=>({revision:REV,on:prefOn,owners:ownerCount,
  acts:acts.map(x=>({kind:x.kind,x:x.x,y:x.y,t0:x.t0,hearts:x.hearts?x.hearts.length:undefined,shots:x.shots})),
  floaters:floaters.map(f=>({shape:f.shape,state:f.state,target:f.target&&f.target.id,x:f.x,y:f.y})),
  tuning:{CHANCE,CROWD_BONUS,CROWD_N,CHANCE_MAX,ROLL_GAP,ICD,WEIGHTS:WEIGHTS.map(w=>w.slice()),VOLLEY_N,VOLLEY_RANGE,VOLLEY_K,CHARM_T,CHARM_DIST,BLOOM_CHARGE,BLOOM_R,BLOOM_K,BLOOM_BOSS_K,CLOUD_T,CLOUD_R,CLOUD_K,TOWER_LIFE,TOWER_GAP,TOWER_TARGETS,TOWER_RANGE,STICK_T,BURST_R,BURST_K,FLOAT_CAP},
  stats:{...stats,procs:{...stats.procs}}})});
})();
