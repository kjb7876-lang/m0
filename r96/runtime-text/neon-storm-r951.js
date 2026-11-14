/* R951 네온 확률 발동 특수 패시브 '독전 회로' (사용자 2026-11-12 13:24Z "네온 확률발동특수패시브스킬": 화면 전역 민트색 낙뢰 · 큰 두 갈래 전기창이 하늘에서 적에게 쏟아짐 · 방사능 표시 뒤 화면 전역 독안개).
 * 사용자가 든 작품은 '느낌'만 참고했다. 이름·창 모양·색 조합은 네온(전기·생화학·신성공학) 주제로 새로 지었다.
 * 키는 늘리지 않는다. 네온 본인의 타격이 적에게 들어갈 때 0.35초에 한 번 굴려 9%(주변 2칸 안 적 4마리 이상이면 12%, 사몽 발현 중 배율, 최대 30%)로 발동, 발동 뒤 6초는 다시 안 굴린다.
 * 셋 중 고르는 비율: 쌍갈래 뇌창 55 · 생화학 경보 33 · 천공 낙뢰 12(가장 드묾, 게다가 낙뢰끼리는 30초 대기 — 그 안에 뽑히면 뇌창으로 바뀜).
 *  ① 천공 낙뢰(궁극기급, 화면 전역): 0.5초 동안 하늘이 어두워지고 발밑에 금빛 회로진이 펼쳐진 뒤, 0.6초 간격 세 번 민트 낙뢰가 화면(9칸) 안 적에게 떨어진다.
 *     한 번에 최대 8명(덜 맞은 적 → 가까운 적 순), 1.1배(보스·중간 보스 0.7배). 적마다 최대 3번, 전체 최대 24번. 빈 땅에도 장식 낙뢰 4줄(피해 없음).
 *  ② 쌍갈래 뇌창: 8칸 안 적에게 0.09초 간격으로 큰 전기창 6자루가 하늘에서 비스듬히 내리꽂힌다(0.45초 낙하, 착지 원 예고). 착지 0.9칸 1.5배(보스 1.0배), 적마다 최대 2자루.
 *     남는 창은 적 둘레 빈 땅에 꽂힌다. 창 모양: 긴 민트 창대 + 금빛 회로 고리 + 끝이 두 갈래로 갈라진 창날(두 날 사이로 전기가 튐).
 *  ③ 생화학 경보: 네온 머리 위에 생화학 위험 표식이 0.6초 떠오른 뒤, 네온 둘레 9칸(화면 전역)이 4초 동안 독안개에 덮인다. 0.5초마다 0.12배(8번, 보스 포함), 한 번에 최대 24명.
 *     읽기 쉬움: 바닥 장막은 옅게(0.22 이하), 안개 덩어리는 반투명 12개까지, 네온 발밑 1.2칸은 비운다.
 * 그리기 상한(렉 방지): 낙뢰 시트 한 화면 최대 12장, 안개 덩어리 12장. 효과는 모두 ctx.scope 로 월드 자리를 붙인다(3D 기록기 깊이).
 * 상태는 영웅 몸(player 객체)마다 따로 둔다: 생존 모드 배치 영웅(R720)이 player 를 몸으로 바꿔 끼워 공격할 때도 그 몸의 공격력·자리·대기를 쓴다.
 * 그림: 낙뢰·안개는 드라이브 네온 시트(R562 neon-lightning-strike·neon-toxic-mist) 재사용, 창·표식·회로진은 코드로 그린 임시 연출(최종은 Dots 프레임 시트 요청 대상, 오면 교체).
 * Dots CX-0092NS 적용(2026-11-13): NS-04 충전 빛기둥(끝 섬광 뒤 160ms 알파 감쇠로 이어 끊김 없앰) · NS-05 큰 낙뢰(R562 낙뢰 대신, 0.96초) · NS-01 쌍갈래 뇌창 · NS-02 뇌창 착지(타원이 2.7:1 로 납작해 세로 1.15배)
 *   · NS-06 생화학 경보 표식(사용자 11-13 00:47Z 승인). 알파 16 이하 잔티는 포장 때 0 으로 정리. 시트가 아직 안 읽혔으면 예전 그림(R562 낙뢰·코드 창·코드 표식)으로 그린다.
 *   NS-03 회로진(루프 이음 HOLD)·NS-07/08 독안개(수정 요청 중)는 아직 코드 + R562 안개.
 * 소리는 기존 R546 네온 공격·고유기 소리를 다시 씀. 끄기: localStorage['storyworld.r951.neonStorm']='{"on":false}'
 */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_NEON_STORM_R951__)return;
const REV='R951-neon-storm-2',KEY='storyworld.r951.neonStorm',HERO='neon';
const CHANCE=.09,CROWD_BONUS=.03,CROWD_N=4,CROWD_R=2,CHANCE_MAX=.30,ROLL_GAP=.35,ICD=6,STORM_CD=30,ACT_MAX=3,SCREEN_R=9;
const G971=(h,a)=>{try{const g=window.__STORYWORLD_PASSIVE_GROWTH_R971__,v=g&&g.chances(h,a);return Array.isArray(v)&&v.length===a.length&&v.every(x=>Number.isFinite(x)&&x>=0)?v:a;}catch(_){return a;}},D971=(h,s)=>{try{const g=window.__STORYWORLD_PASSIVE_GROWTH_R971__,v=g&&g.cooldown(h,s);return Number.isFinite(v)&&v>0?v:s;}catch(_){return s;}};/* R971 특수 패시브 강화(0단계=원래 값) */
const U1025=(h,a,k)=>{try{const u=window.__STORYWORLD_PASSIVE_UNLOCK_R1025__,v=u&&u.mask(h,a,k);return Array.isArray(v)&&v.length===a.length&&v.every(x=>Number.isFinite(x)&&x>=0)?v:a;}catch(_){return a;}},S1025=h=>{try{const v=window.__STORYWORLD_PASSIVE_UNLOCK_R1025__?.share(h);return Number.isFinite(v)?Math.max(0,Math.min(1,v)):1;}catch(_){return 1;}},W1025=(h,w)=>{try{const v=window.__STORYWORLD_PASSIVE_UNLOCK_R1025__?.weights(h,w);return v||w;}catch(_){return w;}},A1025=(h,k)=>{try{const u=window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;return u?u.unlocked(h,k)!==false:true;}catch(_){return true;}},O1025=id=>{try{const u=window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;return u?u.summonOpen(id)!==false:true;}catch(_){return true;}};/* R1025 특수 패시브 레벨별 해금·소환 영웅 서사 확인(파일 없으면 원래 값) */
const WEIGHTS={lance:.55,fog:.33,storm:.12};
const ST_CHARGE=.5,ST_GAP=.6,ST_WAVES=3,ST_PER=8,ST_MAXHIT=3,ST_K=1.1,ST_BOSS_K=.7,ST_DECOR=4,ST_LIFE=2.6,STRIKE_LIFE=.55,STRIKE_DRAW_MAX=12;
const LA_N=6,LA_RANGE=8,LA_GAP=.09,LA_FALL=.45,LA_R=.9,LA_K=1.5,LA_BOSS_K=1.0,LA_MAXHIT=2,LA_STAY=.6;
const FOG_SIGN=.6,FOG_T=4,FOG_TICK=.5,FOG_TICKS=8,FOG_K=.12,FOG_MAX=24,FOG_PUFFS=12,FOG_VEIL=.22,FOG_PUFF_A=.5,FOG_CLEAR=1.2,FOG_FADE=.4;
const stats={rolls:0,procTotal:0,procs:{lance:0,fog:0,storm:0},hits:0,lances:0,stormWaves:0,fogTicks:0,sheetDraws:0,draws:0,errors:0,lastError:null};
const owners=new WeakMap();let ownerCount=0;
let acts=[],lastRoom=null,lastT=null,prefAt=-1e9,prefOn=true,inner=0,forced=null,rng=null;
const T=()=>{try{return typeof time==='number'?time:0;}catch(_){return 0;}};
const fail=e=>{stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,200);};
const rnd=()=>{try{return rng?rng():Math.random();}catch(_){return Math.random();}};
const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
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
function ap(){try{return typeof attackPower==='function'?Number(attackPower())||0:0;}catch(_){return 0;}}
function surge(kind,v){try{const g=window.__STORYWORLD_SAMONG_SURGE_R571__;if(g&&typeof g[kind]==='function'&&(!g.active||g.active())){const r=Number(g[kind](v));if(Number.isFinite(r)&&r>0)return r;}}catch(_){}return v;}
function play(k){try{if(typeof sound==='function')sound(k);}catch(_){}}
function shakeBy(v){try{if(typeof shake==='number')shake=Math.max(shake,v);}catch(_){}}
function deal(e,v,kind){if(!e||hiddenActor(e)||!canHit(e)||!(v>0))return false;inner++;try{const r=hitEnemy(e,v,{kind:'r951-'+kind,friendly:true,owner:'hero',sourceHero:HERO,r951:true});if(r!==false)stats.hits++;return r;}catch(err){fail(err);return false;}finally{inner--;}}
function stateOf(o){let s=owners.get(o);if(!s){s={lastRoll:-1e9,readyAt:-1e9,stormAt:-1e9};owners.set(o,s);ownerCount++;}return s;}
function ownerOk(o){return o&&!(o.hp<=0);}
function centre(x){return ownerOk(x.owner)?{x:x.owner.x,y:x.owner.y}:{x:x.x,y:x.y};}
function inScreen(c,r){return enemiesNow().filter(e=>!hiddenActor(e)&&dist(e,c)<=r+(e.radius||0)).sort((a,b)=>dist(a,c)-dist(b,c));}
// ---- 세 가지 발동 -----------------------------------------------------------------------------------
function fire(kind,o,tg){const t=T(),power=ap(),k=Math.min(2,Math.max(1,surge('range',1))),base={kind,owner:o,t0:t,power,k,x:o.x,y:o.y,seed:stats.procTotal*37+1};
 stats.procTotal++;stats.procs[kind]++;
 if(kind==='lance'){const foes=inScreen(o,LA_RANGE*k),slots=[];for(let pass=0;pass<LA_MAXHIT&&slots.length<LA_N;pass++)for(const e of foes){if(slots.length>=LA_N)break;slots.push(e);}
  const anchor=tg||foes[0]||{x:o.x+1.5,y:o.y};const lances=[];
  for(let i=0;i<LA_N;i++){const e=slots[i]||null,a=(base.seed+i)*2.399,d=1.7+hash(base.seed+i)*1.2,p=e?{x:e.x,y:e.y}:{x:anchor.x+Math.cos(a)*d,y:anchor.y+Math.sin(a)*d};
   lances.push({target:e,x:p.x,y:p.y,start:t+i*LA_GAP,side:i%2?1:-1,state:'wait'});}
  stats.lances+=LA_N;acts.push({...base,lances,hitN:new Map()});play('r546Sp_neon');return;}
 if(kind==='fog'){acts.push({...base,phase:'sign',ticks:0});play('r546Sp_neon');return;}
 if(kind==='storm'){acts.push({...base,waves:0,hitN:new Map(),strikes:[],flashes:[]});play('r546Sp_neon');shakeBy(2);return;}}
function pick(s,t){let k;if(forced){k=forced;forced=null;}else{const WS=W1025(HERO,WEIGHTS),tot=(WS.lance||0)+(WS.fog||0)+(WS.storm||0);let r=rnd()*tot;k=WS.storm?'storm':WS.fog?'fog':'lance';for(const n of ['lance','fog','storm']){if(!WS[n])continue;if(r<WS[n]){k=n;break;}r-=WS[n];}}
 if(k==='storm'&&t-s.stormAt<STORM_CD)k='lance';return k;}
function chanceFor(o){let n=0;for(const e of enemiesNow())if(!hiddenActor(e)&&dist(e,o)<=CROWD_R)n++;const c=CHANCE+(n>=CROWD_N?CROWD_BONUS:0);return Math.min(CHANCE_MAX,surge('chance',G971(HERO,[c])[0]))*S1025(HERO);}
function roll(e){const o=P();if(!o||o.hero!==HERO||o.hp<=0||blockedNow())return;const s=stateOf(o),t=T();if(t<s.readyAt||t-s.lastRoll<ROLL_GAP)return;s.lastRoll=t;stats.rolls++;
 if(acts.length>=ACT_MAX)return;if(!forced&&!(rnd()<chanceFor(o)))return;const kind=pick(s,t);s.readyAt=t+D971(HERO,ICD);if(kind==='storm')s.stormAt=t;
 lastRoom=curRoom();fire(kind,o,e&&Number.isFinite(e.x)?{x:e.x,y:e.y}:null);}
// 네온 본인 타격만(다른 영웅·협동 동료·적·이 패시브 자신의 피해 제외).
function mine(src){const o=P();if(!o||o.hero!==HERO)return false;if(src&&typeof src==='object'){if(src.r951||src.sourceHero&&src.sourceHero!==HERO)return false;if(src.coopIdR62||src.ally||src.owner==='ally'||src.owner==='enemy'||src.hostile)return false;}return true;}
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,source,...a){const r=base.call(this,e,value,source,...a);
 try{if(!inner&&r!==false&&e&&on()&&mine(source))roll(e);}catch(err){fail(err);}return r;};}
// ---- 매 틱 ------------------------------------------------------------------------------------------
function bump(m,e){m.set(e,(m.get(e)||0)+1);}
function stepLance(x,t){let live=0;for(const l of x.lances){if(l.state==='done')continue;live++;
  if(l.state==='wait'&&t>=l.start)l.state='fall';
  if(l.state==='fall'){if(l.target&&!hiddenActor(l.target)){l.x=l.target.x;l.y=l.target.y;}
   if(t>=l.start+LA_FALL){l.state='stuck';l.hitAt=t;shakeBy(2.5);const c={x:l.x,y:l.y};
    for(const e of enemiesNow()){if(hiddenActor(e))continue;if(dist(e,c)>LA_R*x.k+(e.radius||0))continue;if((x.hitN.get(e)||0)>=LA_MAXHIT)continue;bump(x.hitN,e);deal(e,x.power*(major(e)?LA_BOSS_K:LA_K),'lance');}
    if(!x.sounded||t-x.sounded>.18){x.sounded=t;play('r546Atk_neon');}}}
  if(l.state==='stuck'&&t-l.hitAt>=LA_STAY){l.state='done';live--;}}
 return live>0;}
function stepFog(x,t){const u=t-x.t0;if(x.phase==='sign'){if(u<FOG_SIGN)return true;x.phase='fog';}
 const c=centre(x);x.cx=c.x;x.cy=c.y;
 while(x.ticks<FOG_TICKS&&u>=FOG_SIGN+(x.ticks+1)*FOG_TICK-1e-9){x.ticks++;stats.fogTicks++;for(const e of inScreen(c,SCREEN_R*x.k).slice(0,FOG_MAX))deal(e,x.power*FOG_K,'fog');}
 return u<FOG_SIGN+FOG_T+FOG_FADE;}
function stepStorm(x,t){const u=t-x.t0,c=centre(x);x.cx=c.x;x.cy=c.y;
 while(x.waves<ST_WAVES&&u>=ST_CHARGE+x.waves*ST_GAP-1e-9){const w=x.waves++;stats.stormWaves++;
  const pool=inScreen(c,SCREEN_R*x.k).filter(e=>(x.hitN.get(e)||0)<ST_MAXHIT).map((e,i)=>({e,i,n:x.hitN.get(e)||0})).sort((a,b)=>a.n-b.n||a.i-b.i).slice(0,ST_PER);
  for(const {e} of pool){bump(x.hitN,e);deal(e,x.power*(major(e)?ST_BOSS_K:ST_K),'storm');x.strikes.push({x:e.x,y:e.y,t0:t,big:true});}
  for(let i=0;i<ST_DECOR;i++){const a=hash(x.seed*13+w*7+i)*Math.PI*2,d=2+hash(x.seed*29+w*5+i)*(SCREEN_R-2.5);x.strikes.push({x:c.x+Math.cos(a)*d,y:c.y+Math.sin(a)*d*.8,t0:t,big:false});}
  x.flashes.push(t);if(x.flashes.length>3)x.flashes.shift();shakeBy(5);play('r546Sp_neon');}
 const life=sheetImg('bigStrike')?BIG_LIFE:STRIKE_LIFE;x.strikes=x.strikes.filter(s=>t-s.t0<life);return u<ST_LIFE;}
function cancel(){acts=[];}
function step(){const t=T(),rm=curRoom();if(rm!==lastRoom){if(lastRoom!==null)cancel();lastRoom=rm;}lastT=t;
 if(!on()||blockedNow()){cancel();return;}
 acts=acts.filter(x=>{try{if(x.kind==='lance')return stepLance(x,t);if(x.kind==='fog')return stepFog(x,t);if(x.kind==='storm')return stepStorm(x,t);return false;}catch(err){fail(err);return false;}});}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);
 try{if(typeof started==='undefined'||started)step();}catch(err){fail(err);cancel();}sentinel(acts.length>0);return r;};}
// ---- 그리기 -----------------------------------------------------------------------------------------
const MINT='94,234,212',TEAL='24,168,154',WHITE='228,255,248',HOLY='255,214,120',TOX='186,255,72',TOX_D='70,150,40',DARK='6,22,20',HAZ_D='18,26,10';
function sc(o,f){if(typeof ctx!=='undefined'&&ctx&&typeof ctx.scope==='function')ctx.scope(o,f);else f();}
function scale(){const z=typeof zoom==='number'&&zoom>0?zoom:1,TL=typeof TILE==='number'?TILE:34;return {z,T1:TL*z*Math.SQRT2,AH:typeof actorHeight==='function'?actorHeight():66*z};}
const NS={skybeam:{p:'assets/r951/neon-skybeam.webp',cw:256,ch:1024,cols:6},bigStrike:{p:'assets/r951/neon-big-strike.webp',cw:256,ch:768,cols:6},
 lance:{p:'assets/r951/neon-lance.webp',cw:256,ch:768,cols:6},impact:{p:'assets/r951/neon-lance-impact.webp',cw:256,ch:256,cols:6},sign:{p:'assets/r951/neon-hazard-sign.webp',cw:256,ch:256,cols:6}};
const SKY_T=.54,SKY_FADE=.16,BIG_LIFE=.96,LANCE_TIP=714,LANCE_LEN=658,IMPACT_SQ=1.15;
const SH={strike:'assets/r562/neon-lightning-strike.webp',mist:'assets/r562/neon-toxic-mist.webp'},CELL=192,COLS=6,asked={};
function sheetImg(k){const p=SH[k]||NS[k].p;try{const g=typeof readyImage==='function'?readyImage(p):null;if(g&&g.image)return g.image;const n=Date.now();if(n-(asked[p]||-1e9)>1500){asked[p]=n;if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(err){fail(err);}return null;}
function cellDraw(im,fr,x,y,w,h,ax,ay){ctx.drawImage(im,(fr%COLS)*CELL,Math.floor(fr/COLS)*CELL,CELL,CELL,x-w*ax,y-h*ay,w,h);stats.sheetDraws++;}
function nsDraw(k,im,fr,x,y,w,h,ax,ay){const g=NS[k];fr=Math.max(0,Math.floor(fr));ctx.drawImage(im,(fr%g.cols)*g.cw,Math.floor(fr/g.cols)*g.ch,g.cw,g.ch,x-w*ax,y-h*ay,w,h);stats.sheetDraws++;}
function line(pts){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();}
function bolt(x0,y0,x1,y1,seed,amp,n=7){const pts=[[x0,y0]],dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;for(let i=1;i<n;i++){const u=i/n,o=(hash(seed+i)-.5)*2*amp*Math.sin(Math.PI*u);pts.push([x0+dx*u+nx*o,y0+dy*u+ny*o]);}pts.push([x1,y1]);return pts;}
function groundEll(q,rx,col,a,mode){ctx.save();try{ctx.globalAlpha=a;ctx.globalCompositeOperation=mode||'source-over';ctx.fillStyle=`rgba(${col},1)`;ctx.beginPath();ctx.ellipse(q.x,q.y,rx,rx*.5,0,0,Math.PI*2);ctx.fill();}finally{ctx.restore();}}
// 금빛 회로진(신성공학): 육각 고리 + 마디 + 안쪽으로 뻗는 회로선
function circuit(q,R,z,t,a){ctx.save();try{ctx.globalAlpha=a;ctx.globalCompositeOperation='lighter';ctx.lineWidth=Math.max(1,1.6*z);ctx.strokeStyle=`rgba(${HOLY},.85)`;ctx.beginPath();
 for(let i=0;i<=6;i++){const an=t*.6+i*Math.PI/3,X=q.x+Math.cos(an)*R,Y=q.y+Math.sin(an)*R*.5;if(i)ctx.lineTo(X,Y);else ctx.moveTo(X,Y);}ctx.stroke();
 ctx.strokeStyle=`rgba(${MINT},.8)`;ctx.beginPath();ctx.ellipse(q.x,q.y,R*.62,R*.31,0,0,Math.PI*2);ctx.stroke();
 for(let i=0;i<6;i++){const an=t*.6+i*Math.PI/3,X=q.x+Math.cos(an)*R,Y=q.y+Math.sin(an)*R*.5,ix=q.x+Math.cos(an)*R*.62,iy=q.y+Math.sin(an)*R*.31;ctx.strokeStyle=`rgba(${MINT},.6)`;ctx.beginPath();ctx.moveTo(X,Y);ctx.lineTo(ix,iy);ctx.stroke();
  const d=3.4*z;ctx.fillStyle=`rgba(${HOLY},1)`;ctx.beginPath();ctx.moveTo(X,Y-d);ctx.lineTo(X+d,Y);ctx.lineTo(X,Y+d);ctx.lineTo(X-d,Y);ctx.closePath();ctx.fill();}}finally{ctx.restore();}}
// ① 천공 낙뢰
function drawStorm(x,t){const {z,T1,AH}=scale(),u=t-x.t0,c={x:x.cx??x.x,y:x.cy??x.y},q=project(c.x,c.y),id='r951:storm:'+x.t0.toFixed(2),
  dark=u<ST_CHARGE?u/ST_CHARGE:u>ST_LIFE-.4?Math.max(0,(ST_LIFE-u)/.4):1,R=SCREEN_R*x.k*T1*.5;
 sc({id:id+':veil',kind:'effect',pxfSide:'hero',x:c.x,y:c.y,groundAligned:true},()=>{groundEll(q,R,DARK,.3*dark);
  for(const f of x.flashes){const v=(t-f)/.14;if(v>=0&&v<1)groundEll(q,R,MINT,.16*(1-v),'lighter');}
  circuit(q,T1*2.2*Math.min(1,u/.3),z,t,.95*dark);circuit(q,T1*1.2*Math.min(1,u/.3),z,-t*1.4,.7*dark);});
 const sky=sheetImg('skybeam');
 if(sky&&u<SKY_T+SKY_FADE)sc({id:id+':beam',kind:'effect',pxfSide:'hero',x:c.x,y:c.y+.01},()=>{ctx.save();try{ctx.globalAlpha=u<SKY_T?1:Math.max(0,1-(u-SKY_T)/SKY_FADE);ctx.globalCompositeOperation='lighter';
  const h=AH*6.4;nsDraw('skybeam',sky,Math.min(11,u/SKY_T*12),q.x,q.y-AH*.8,h/4,h,.5,980/1024);}finally{ctx.restore();}});
 else if(!sky&&u<ST_CHARGE+.2)sc({id:id+':beam',kind:'effect',pxfSide:'hero',x:c.x,y:c.y+.01},()=>{ctx.save();try{const a=Math.min(1,u/.2)*(u>ST_CHARGE?Math.max(0,1-(u-ST_CHARGE)/.2):1);ctx.globalAlpha=a;ctx.globalCompositeOperation='lighter';
  const top=q.y-AH*6,pts=bolt(q.x,q.y-AH*.8,q.x,top,Math.floor(t*24),10*z,9);ctx.strokeStyle=`rgba(${TEAL},.6)`;ctx.lineWidth=Math.max(6,18*z);line(pts);ctx.strokeStyle=`rgba(${MINT},.95)`;ctx.lineWidth=Math.max(2.5,6*z);line(pts);ctx.strokeStyle=`rgba(${WHITE},.9)`;ctx.lineWidth=Math.max(1,2*z);line(pts);}finally{ctx.restore();}});
 const big=sheetImg('bigStrike'),im=big?null:sheetImg('strike');let n=0;
 // 새 파도부터 그린다(상한 12장에서 오래된 잔광이 새 낙뢰를 밀어내지 않게)
 for(let si=x.strikes.length-1;si>=0;si--){const s=x.strikes[si];if(++n>STRIKE_DRAW_MAX)break;const age=t-s.t0,p=project(s.x,s.y),H=AH*(s.big?3.1:2.4),fr=Math.min(23,Math.floor(age/STRIKE_LIFE*24));
  sc({id:id+':strike:'+s.t0.toFixed(2)+':'+s.x.toFixed(1)+':'+s.y.toFixed(1),kind:'effect',pxfSide:'hero',x:s.x,y:s.y},()=>{ctx.save();try{
   if(age<.12){ctx.globalAlpha=1-age/.12;ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(${WHITE},.8)`;ctx.beginPath();ctx.ellipse(p.x,p.y,T1*.55,T1*.27,0,0,Math.PI*2);ctx.fill();}
   ctx.globalAlpha=s.big?1:.75;ctx.globalCompositeOperation='lighter';
   if(big){const h=AH*(s.big?4.4:3.3);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=s.big?1:.8;nsDraw('bigStrike',big,Math.min(23,age/BIG_LIFE*24),p.x,p.y,h/3,h,.5,704/768);}
   else if(im)cellDraw(im,fr,p.x,p.y,H,H,.5,.86);
   else{const v=age/STRIKE_LIFE,pts=bolt(p.x,p.y-AH*4,p.x,p.y,Math.floor(s.t0*97+s.x*13),14*z);ctx.globalAlpha=1-v;ctx.strokeStyle=`rgba(${MINT},.95)`;ctx.lineWidth=Math.max(2,4*z);line(pts);ctx.strokeStyle=`rgba(${WHITE},.9)`;ctx.lineWidth=Math.max(1,1.4*z);line(pts);}
  }finally{ctx.restore();}});}}
// ② 쌍갈래 뇌창: 축(ux,uy)을 따라 꼬리 → 창끝. 창끝이 (tx,ty).
function spear(tx,ty,ux,uy,L,z,t,a,seed){const px=-uy,py=ux,bx=tx-ux*L,by=ty-uy*L,fork=L*.26,fx=tx-ux*fork,fy=ty-uy*fork,sp=L*.075;
 ctx.save();try{ctx.globalAlpha=a;ctx.lineCap='round';
  // 빛 번짐(두꺼운 청록) → 어두운 심 → 민트 창대
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${TEAL},.55)`;ctx.lineWidth=Math.max(8,24*z);ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(fx,fy);ctx.stroke();
  ctx.globalCompositeOperation='source-over';ctx.strokeStyle=`rgba(${DARK},.95)`;ctx.lineWidth=Math.max(4,10*z);ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(fx,fy);ctx.stroke();
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${MINT},1)`;ctx.lineWidth=Math.max(2.4,5*z);ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(fx,fy);ctx.stroke();
  // 창대 위 회로 마디(흐르는 빛)
  for(let i=0;i<4;i++){const f=((t*2.2+i*.25)%1)*.7+.05,X=bx+(fx-bx)*f,Y=by+(fy-by)*f;ctx.fillStyle=`rgba(${WHITE},.9)`;ctx.beginPath();ctx.arc(X,Y,Math.max(1.6,3*z),0,Math.PI*2);ctx.fill();}
  // 꼬리 지느러미 셋
  for(const s of [-1,0,1]){ctx.strokeStyle=`rgba(${MINT},.8)`;ctx.lineWidth=Math.max(1,1.8*z);ctx.beginPath();ctx.moveTo(bx+ux*L*.08,by+uy*L*.08);ctx.lineTo(bx-ux*L*.03+px*sp*1.1*s,by-uy*L*.03+py*sp*1.1*s);ctx.stroke();}
  // 두 갈래 창날: 갈림목에서 벌어졌다가 끝에서 살짝 모인다
  const prong=s=>{const m1x=fx+ux*fork*.35+px*sp*1.5*s,m1y=fy+uy*fork*.35+py*sp*1.5*s,ex=tx+px*sp*.75*s,ey=ty+py*sp*.75*s;return [[fx,fy],[m1x,m1y],[ex,ey]];};
  for(const s of [-1,1]){const pr=prong(s);ctx.globalCompositeOperation='source-over';ctx.strokeStyle=`rgba(${DARK},.95)`;ctx.lineWidth=Math.max(4,9*z);line(pr);
   ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${MINT},1)`;ctx.lineWidth=Math.max(2.4,4.6*z);line(pr);ctx.strokeStyle=`rgba(${WHITE},.95)`;ctx.lineWidth=Math.max(1,1.6*z);line(pr);ctx.strokeStyle=`rgba(${TEAL},.45)`;ctx.lineWidth=Math.max(6,16*z);line(pr);}
  // 두 날 사이로 튀는 전기
  const a1=prong(-1),a2=prong(1);ctx.strokeStyle=`rgba(${WHITE},.9)`;ctx.lineWidth=Math.max(1,1.2*z);line(bolt(a1[1][0],a1[1][1],a2[2][0],a2[2][1],seed+Math.floor(t*30),5*z,5));
  // 금빛 회로 고리(갈림목)
  ctx.globalCompositeOperation='source-over';ctx.strokeStyle=`rgba(${HOLY},1)`;ctx.lineWidth=Math.max(2.5,5*z);ctx.beginPath();ctx.moveTo(fx+px*sp*1.2,fy+py*sp*1.2);ctx.lineTo(fx-px*sp*1.2,fy-py*sp*1.2);ctx.stroke();
  const gx=fx-ux*L*.05,gy=fy-uy*L*.05;ctx.beginPath();ctx.moveTo(gx+px*sp*.9,gy+py*sp*.9);ctx.lineTo(gx-px*sp*.9,gy-py*sp*.9);ctx.stroke();
 }finally{ctx.restore();}}
function spearSheet(im,tx,ty,ux,uy,L,t,a,seed){const s=L/LANCE_LEN;ctx.save();try{ctx.globalAlpha=a;ctx.globalCompositeOperation='source-over';ctx.translate(tx,ty);ctx.rotate(Math.atan2(uy,ux)-Math.PI/2);
  nsDraw('lance',im,(Math.floor(t*12.5)+seed)%24,0,0,256*s,768*s,.5,LANCE_TIP/768);}finally{ctx.restore();}}
function drawLance(x,t){const {z,T1,AH}=scale(),L=AH*3.1,lim=sheetImg('lance'),imp=sheetImg('impact');
 const sp=(tx,ty,ux,uy,a,i)=>lim?spearSheet(lim,tx,ty,ux,uy,L,t,a,i*5):spear(tx,ty,ux,uy,L,z,t,a,i*17);
 x.lances.forEach((l,i)=>{if(l.state==='done'||l.state==='wait')return;const q=project(l.x,l.y),id='r951:lance:'+x.t0.toFixed(2)+':'+i;
  // 하늘에서 비스듬히(좌우 번갈아): 축 방향(ux,uy) = 아래쪽으로 기운 단위벡터
  const ang=Math.PI/2+l.side*.32,ux=Math.cos(ang),uy=Math.sin(ang);
  if(l.state==='fall'){const f=Math.min(1,(t-l.start)/LA_FALL),e=f*f,drop=(1-e)*AH*7,tx=q.x-ux*drop,ty=q.y-uy*drop;
   sc({id:id+':mark',kind:'effect',pxfSide:'hero',x:l.x,y:l.y,groundAligned:true},()=>{ctx.save();try{ctx.globalAlpha=.4+.5*f;ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${MINT},.9)`;ctx.lineWidth=Math.max(1.2,2*z);const r=LA_R*x.k*T1*.5*(1.4-.4*f);
    ctx.beginPath();ctx.ellipse(q.x,q.y,r,r*.5,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=`rgba(${HOLY},.8)`;ctx.beginPath();ctx.ellipse(q.x,q.y,r*.45,r*.22,0,0,Math.PI*2);ctx.stroke();}finally{ctx.restore();}});
   sc({id:id+':spear',kind:'effect',pxfSide:'hero',x:l.x,y:l.y+.02},()=>sp(tx,ty,ux,uy,Math.min(1,f*3),i));return;}
  const v=(t-l.hitAt)/LA_STAY,a=v<.6?1:Math.max(0,(1-v)/.4),dip=L*.12;
  if(imp)sc({id:id+':hit',kind:'effect',pxfSide:'hero',x:l.x,y:l.y,groundAligned:true},()=>{ctx.save();try{ctx.globalAlpha=1;ctx.globalCompositeOperation='lighter';const W=LA_R*x.k*T1*1.9;nsDraw('impact',imp,Math.min(17,v*18),q.x,q.y,W,W*IMPACT_SQ,.5,.5);}finally{ctx.restore();}});
  else sc({id:id+':hit',kind:'effect',pxfSide:'hero',x:l.x,y:l.y,groundAligned:true},()=>{const r=LA_R*x.k*T1*.5*(.6+.9*Math.sqrt(Math.min(1,v*2)));ctx.save();try{ctx.globalAlpha=(1-v);ctx.globalCompositeOperation='lighter';
   ctx.strokeStyle=`rgba(${MINT},.9)`;ctx.lineWidth=Math.max(1.5,4*z*(1-v));ctx.beginPath();ctx.ellipse(q.x,q.y,r,r*.5,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle=`rgba(${DARK},.5)`;ctx.beginPath();ctx.ellipse(q.x,q.y,r*.35,r*.17,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle=`rgba(${WHITE},.85)`;ctx.lineWidth=Math.max(1,1.3*z);for(let k=0;k<3;k++){const an=hash(i*7+k+Math.floor(t*20))*Math.PI*2;line(bolt(q.x,q.y,q.x+Math.cos(an)*r*1.1,q.y+Math.sin(an)*r*.55,i*31+k+Math.floor(t*20),4*z,4));}}finally{ctx.restore();}});
  sc({id:id+':spear',kind:'effect',pxfSide:'hero',x:l.x,y:l.y+.02},()=>sp(q.x+ux*dip,q.y+uy*dip,ux,uy,a,i));});}
// ③ 생화학 경보: 위험 표식(세 날개 + 가운데 원, 우리 색) → 독안개
function hazard(cx,cy,r,a,spin){ctx.save();try{ctx.globalAlpha=a;ctx.fillStyle=`rgba(${HAZ_D},.92)`;ctx.beginPath();ctx.arc(cx,cy,r*1.12,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=`rgba(${TOX},1)`;ctx.lineWidth=Math.max(1.5,r*.08);ctx.beginPath();ctx.arc(cx,cy,r*1.12,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle=`rgba(${TOX},1)`;for(let i=0;i<3;i++){const m=spin+Math.PI/2+i*Math.PI*2/3,a0=m-Math.PI/6,a1=m+Math.PI/6;ctx.beginPath();ctx.arc(cx,cy,r*.95,a0,a1);ctx.arc(cx,cy,r*.3,a1,a0,true);ctx.closePath();ctx.fill();}
 ctx.beginPath();ctx.arc(cx,cy,r*.18,0,Math.PI*2);ctx.fill();
 ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${MINT},.7)`;ctx.lineWidth=Math.max(1,r*.05);ctx.beginPath();ctx.arc(cx,cy,r*1.32,spin*2,spin*2+Math.PI*1.3);ctx.stroke();}finally{ctx.restore();}}
function drawFog(x,t){const {z,T1,AH}=scale(),u=t-x.t0,id='r951:fog:'+x.t0.toFixed(2),o=ownerOk(x.owner)?x.owner:x;
 const sg=sheetImg('sign');
 if(sg&&u<FOG_SIGN+.5){const q=project(o.x,o.y),fr=u<.18?u/.18*6:u<FOG_SIGN?Math.min(17,6+(u-.18)/(FOG_SIGN-.18)*12):18+Math.min(5,(u-FOG_SIGN)/.5*6),W=AH*1.6;
  sc({id:id+':sign',kind:'effect',pxfSide:'hero',x:o.x,y:o.y+.03},()=>{ctx.save();try{ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';nsDraw('sign',sg,fr,q.x,q.y-AH*1.55,W,W,.5,.5);}finally{ctx.restore();}});}
 else if(u<FOG_SIGN+.5){const q=project(o.x,o.y),f=Math.min(1,u/.18),out=u>FOG_SIGN?Math.max(0,1-(u-FOG_SIGN)/.5):1,pulse=1+.08*Math.sin(u*28),r=AH*.42*f*pulse;
  sc({id:id+':sign',kind:'effect',pxfSide:'hero',x:o.x,y:o.y+.03},()=>{ctx.save();try{ctx.globalAlpha=.55*f*out;ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(${TOX_D},1)`;ctx.beginPath();ctx.arc(q.x,q.y-AH*1.55,r*1.7,0,Math.PI*2);ctx.fill();}finally{ctx.restore();}
   hazard(q.x,q.y-AH*1.55-(1-f)*AH*.3,r,out,u*1.5);});}
 if(x.phase!=='fog')return;const v=u-FOG_SIGN,grow=Math.min(1,v/.6),fade=v>FOG_T?Math.max(0,1-(v-FOG_T)/FOG_FADE):1,c={x:x.cx??o.x,y:x.cy??o.y},q=project(c.x,c.y),R=SCREEN_R*x.k*T1*.5*grow;
 sc({id:id+':veil',kind:'effect',pxfSide:'hero',x:c.x,y:c.y,groundAligned:true},()=>{groundEll(q,R,TOX_D,FOG_VEIL*fade);
  ctx.save();try{ctx.globalAlpha=.5*fade;ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${TOX},.8)`;ctx.lineWidth=Math.max(1.5,2.5*z);ctx.setLineDash&&ctx.setLineDash([10*z,8*z]);ctx.lineDashOffset=-t*30;ctx.beginPath();ctx.ellipse(q.x,q.y,R,R*.5,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash&&ctx.setLineDash([]);}finally{ctx.restore();}
  hazard(q.x,q.y,T1*.7,.18*fade,t*.4);});
 const im=sheetImg('mist');if(!im)return;let n=0;
 for(let i=0;i<FOG_PUFFS&&n<FOG_PUFFS;i++){const a=i*2.399+x.seed,d=(FOG_CLEAR+.9+(SCREEN_R*x.k-FOG_CLEAR-1.6)*Math.sqrt((i+.5)/FOG_PUFFS))*grow,drift=Math.sin(t*.7+i)*.35,
   wx=c.x+Math.cos(a+t*.05)*d+drift,wy=c.y+Math.sin(a+t*.05)*d*.85;if(Math.hypot(wx-o.x,wy-o.y)<FOG_CLEAR)continue;n++;const p=project(wx,wy),W=T1*(3.6+hash(i+x.seed)*1.2),fr=(Math.floor(t*10)+i*5)%24;
  sc({id:id+':puff'+i,kind:'effect',pxfSide:'hero',x:wx,y:wy},()=>{ctx.save();try{ctx.globalAlpha=FOG_PUFF_A*fade*grow;ctx.globalCompositeOperation='source-over';cellDraw(im,fr,p.x,p.y,W,W,.5,.62);}finally{ctx.restore();}});}}
function draw(){if(typeof project!=='function'||typeof ctx==='undefined'||!ctx)return;const t=T();
 for(const x of acts){try{if(x.kind==='storm')drawStorm(x,t);else if(x.kind==='lance')drawLance(x,t);else if(x.kind==='fog')drawFog(x,t);}catch(err){fail(err);}}stats.draws++;}
const SENT={type:'r951-neon-storm',x:0,y:0,age:0,life:Infinity,r951Sentinel:true};
function sentinel(want){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);if(want&&i<0)effects.push(SENT);else if(!want&&i>=0)effects.splice(i,1);SENT.age=0;
 const a=acts[0];if(want&&a){SENT.x=a.x;SENT.y=a.y;}}catch(_){}}
let wrapped=false;function wrapEffect(){if(wrapped||typeof drawEffect!=='function')return wrapped;const base=drawEffect;
 drawEffect=function(e,...a){if(e&&e.r951Sentinel){try{ctx.save();try{ctx.globalCompositeOperation='source-over';draw();}finally{ctx.restore();}}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};wrapped=true;return true;}
if(!wrapEffect()&&typeof setTimeout==='function'){let n=0;(function arm(){if(wrapEffect()||++n>40)return;setTimeout(arm,250);})();}
function set(v){try{localStorage.setItem(KEY,JSON.stringify({on:v!==false}));}catch(_){}prefAt=-1e9;return on();}
const KINDS=['lance','fog','storm'];
window.__STORYWORLD_NEON_STORM_R951__=Object.freeze({revision:REV,set,on:()=>on(),
 names:Object.freeze({passive:'독전 회로',storm:'천공 낙뢰',lance:'쌍갈래 뇌창',fog:'생화학 경보'}),
 qaForce:k=>{forced=KINDS.includes(k)?k:null;return forced;},qaRandom:f=>{rng=typeof f==='function'?f:null;return !!rng;},
 qaReset:()=>{const o=P();if(o){const s=stateOf(o);s.readyAt=-1e9;s.lastRoll=-1e9;}return true;},
 inspect:()=>({revision:REV,on:prefOn,owners:ownerCount,
  acts:acts.map(x=>({kind:x.kind,x:x.x,y:x.y,t0:x.t0,phase:x.phase,waves:x.waves,lances:x.lances?x.lances.map(l=>({x:l.x,y:l.y,state:l.state})):undefined})),
  tuning:{CHANCE,CROWD_BONUS,CROWD_N,CHANCE_MAX,ROLL_GAP,ICD,STORM_CD,SCREEN_R,WEIGHTS:{...WEIGHTS},ST_WAVES,ST_PER,ST_MAXHIT,ST_K,ST_BOSS_K,LA_N,LA_RANGE,LA_R,LA_K,LA_BOSS_K,LA_MAXHIT,FOG_T,FOG_TICKS,FOG_K,FOG_MAX,FOG_VEIL,FOG_PUFFS,STRIKE_DRAW_MAX},
  stats:{...stats,procs:{...stats.procs}}})});
})();
