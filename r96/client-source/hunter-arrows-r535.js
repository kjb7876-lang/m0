/* R535 헌터 화살 스킬 덧붙임 (2026-11-10, 사용자 "화살을 폭풍처럼 연사 · 비틀린 검 같은 굵은 화살 한 발이 맞은 자리에서 대폭발 ·
 *  적중하면 여러 개로 쪼개져 연쇄 관통·방화"). 다른 작품은 느낌만 참고 — 이름·그림·소리는 StoryWorld 헌터(진홍·장미빛, 표적·추적) 고유.
 *  기존 스킬은 그대로 두고 덧붙인다(추가 70% · C 의 꽃잎 출발점만 바꿈 30%). 영웅 식별자·저장·쿨다운·키는 건드리지 않는다.
 *   Q 추적 일제사격  → '폭풍 추적': 9발 간격 ×0.7(0.065→0.046초)로 몰아치고, 각 화살이 표적을 끝까지 쫓아 선회(초당 9rad, 수명 0.85→1.3초).
 *                      표적이 죽으면 화살 둘레 9칸 안 가장 가까운 적으로 갈아탄다. 피해(공격력×0.24×9)는 그대로.
 *   Z 바운스 화살    → '불씨 가시': 튕겨 맞을 때마다 그 자리에서 가시 2개로 쪼개져 다음 적에게 날아가 1회 관통(최대 2명).
 *                      가시 피해 = 그 타격×0.15, 시전당 가시 6개 상한. 맞은 적(바운스·가시 모두)은 2.5초 불탄다(0.5초마다, 합 = 타격×0.3, 다시 맞으면 시간만 새로).
 *   C 진홍빛 꽃잎 폭풍 → '뒤틀린 가시살': 꽃잎 8장을 영웅 둘레에 바로 뿌리던 것을, 비틀린 굵은 화살 한 발(직격 공격력×0.2)이 먼저 날아가
 *                      처음 닿은 적(없으면 8칸 끝)에서 대폭발(반경 2.2칸, 공격력×0.8)하고, 꽃잎 8장(각 공격력×0.45, 원래 ×0.9)이 폭발 자리에서 바깥으로 퍼진다.
 *   연계(키는 늘리지 않음): Q 마지막 화살이 맞으면 그 자리에서 불씨 가시 분열+방화(가시 = 그 화살 타격×2×0.15) · C 꽃잎이 맞힌 적도 불탄다(불 합 = 공격력×0.5×0.3).
 *   X 피의 대시는 그대로.
 *  성능: 이 파일이 만드는 투사체(가시살·가시·꽃잎·폭풍 표지)는 동시에 24개까지, 불타는 적은 12명까지. 투사체는 엔진 makeShot 의 전체 상한도 그대로 따른다.
 *  예약 시전(capacity28) 안에서는 엔진이 정한 발 수만 쓴다: 가시·꽃잎은 그 바깥(틱 뒤)에서 만든다. 가시살은 C 가 예약한 8발 중 1발을 쓴다.
 *  그림은 코드로 그린 임시 연출(ctx.scope effect) — 최종은 Dots 프레임 시트(CX 요청서 qa/r535/dots-request.txt) 대상. ctx.filter 는 쓰지 않는다.
 *  R535-2(사용자 04:09Z 헌터 테마 "불과 화살 · 무기를 무수히 불러내 쏟아붓는 느낌", 느낌만 — 이름·문양은 StoryWorld 고유):
 *   C 를 쓰면 영웅 뒤 허공에 진홍 문양 문 5개가, Q 를 쓰면 작은 문 3개가 열리고 불화살 줄기가 표적(가시살·적)으로 쏟아진다.
 *   문·줄기는 그림만(피해·투사체 없음, 동시에 줄기 20개 상한). 가시살 촉은 드라이브 화살촉 불꽃 시트(24프레임)를 쓴다.
 *   사몽(R571) 발현 중이면 폭발 반경·가시 사거리·폭풍 재조준 거리 ×1.77(R571 range), 개수 상한은 그대로.
 *  끄기: localStorage['storyworld.r535.hunter']='{"on":false}'
 */
(()=>{'use strict';
if(window.__STORYWORLD_HUNTER_ARROWS_R535__)return;
const REV='R535',KEY='storyworld.r535.hunter',HERO='hunter';
const TUNE=Object.freeze({
 storm:Object.freeze({cadence:.7,turn:0,life:1.3,seek:9}),/* R765: turn 0 = 표적을 따라 휘지 않음(자동적중 없음, 활이 향한 줄로만) */
 split:Object.freeze({count:2,perCast:6,mult:.15,pierce:1,speed:15,life:.42,reach:5,burnTotal:.3,burnTime:2.5,burnEvery:.5,maxBurning:12}),
 lance:Object.freeze({direct:.2,blast:.8,radius:2.2,petal:.45,petalOld:.9,speed:15,range:8,width:.34}),
 chain:Object.freeze({qFinal:2,petalBurn:.5,petalBeat:.08}),
 gate:Object.freeze({r:5,q:3,every:.1,maxVolleys:20,volleyLife:.2,close:.3,back:1.1,spread:.75}),
 maxLive:24,maxFx:4,fullFlames:8});
const stats={stormShots:0,shards:0,ignites:0,burnTicks:0,lances:0,blasts:0,petals:0,capSkips:0,maxLive:0,maxShake:0,lanceDraws:0,headDraws:0,sheetDraws:{lance:0,blast:0,burn:0,shard:0,pop:0,storm:0,gate:0,volley:0},gates:0,volleys:0,postMs:0,posts:0,drawMs:0,errors:0,lastError:null};
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const fail=e=>{stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,200);};
const T=()=>{try{return typeof time==='number'?time:0;}catch(_){return 0;}};
const hunter=()=>{try{return on&&typeof player==='object'&&player&&player.hero===HERO;}catch(_){return false;}};
const ego=()=>{try{return !!window.__STORYWORLD_EGO151__?.inspect?.()?.state?.active;}catch(_){return false;}};
const live=()=>{try{return typeof liveEnemies==='function'?liveEnemies():[];}catch(_){return [];}};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const mine=()=>{let n=0;try{for(const p of projectiles)if(p&&p.r535&&!p.dead)n++;}catch(_){}return n;};
const SG=()=>{try{const a=window.__STORYWORLD_SAMONG_SURGE_R571__;return a&&typeof a.active==='function'&&a.active()&&typeof a.range==='function'?a:null;}catch(_){return null;}};
const rg=v=>{const a=SG();if(!a)return v;try{const r=a.range(v);return Number.isFinite(r)&&r>0?r:v;}catch(_){return v;}};
const room0=()=>{try{return typeof room!=='undefined'?room:null;}catch(_){return null;}};

// ---- 상태 -------------------------------------------------------------------------------------------
let inSpecial=0,inStorm=0,lastT=T(),lastRoom=room0(),lastBlast=null;
const petalQ=[],splitQ=[],castShards=new Map(),groups=new Map(),burns=new Map(),fxList=[],gates=[],volleys=[],pops=[];
function reset(){try{if(Array.isArray(projectiles))projectiles=projectiles.filter(p=>!p||!p.r535);}catch(_){}
 petalQ.length=0;splitQ.length=0;castShards.clear();groups.clear();burns.clear();fxList.length=0;gates.length=0;volleys.length=0;pops.length=0;}

// ---- Q 폭풍 추적: special 안에서 예약되는 화살 일만 표시한다 -------------------------------------------
// 연계(사용자 03:23Z "키를 늘리지 말고 한 번 누르면 여러 스킬이 연속으로"): 마지막(9번째) 폭풍 화살이 맞으면 불씨 가시로 쪼개지고 불을 붙인다.
let curJobs=null,qSerial=0,stormFinal=null;
if(typeof special==='function'){const base=special;special=function(...a){if(!hunter()||ego())return base.apply(this,a);const prev=curJobs;curJobs=[];inSpecial++;
 try{return base.apply(this,a);}finally{inSpecial--;if(curJobs.length){const last=curJobs.reduce((m,j)=>j.at>=m.at?j:m,curJobs[0]);last.final='q:'+ ++qSerial;try{openGate('q',null,last.at*TUNE.storm.cadence+.35);}catch(err){fail(err);}}curJobs=prev;}};}
if(typeof delay==='function'){const base=delay;delay=function(seconds,fn,owner=null){
 if(inSpecial>0&&typeof fn==='function'&&Number.isFinite(seconds)){const job=fn,meta={at:seconds,final:null};if(curJobs)curJobs.push(meta);
  return base.call(this,seconds*TUNE.storm.cadence,function(...a){inStorm++;const pf=stormFinal;stormFinal=meta.final;try{return job.apply(this,a);}finally{inStorm--;stormFinal=pf;}},owner);}
 return base.apply(this,arguments);};}

// ---- makeShot: Q 화살 표시 · C 꽃잎 붙잡아 가시살로 ------------------------------------------------------
if(typeof makeShot==='function'){const base=makeShot;makeShot=function(x,y,angle,speed,damage,opt={}){
 try{
  if(inStorm>0&&opt&&opt.friendly&&opt.owner==='hero'&&!opt.storyWER&&!opt.r535){const p=base.apply(this,arguments);
   if(p){p.r535='storm';p.r535T=opt.aimPoint27?.id??null;if(stormFinal){p.r535Final=stormFinal;stormFinal=null;}p.life=Math.max(p.life,TUNE.storm.life);stats.stormShots++;}return p;}
  if(opt&&opt.storyWER&&opt.sourceHero===HERO&&opt.sourceSlot==='r'&&!opt.r535&&hunter()&&!ego()&&Number.isFinite(damage)){
   const id=opt.attackId9??('r535:'+T());let g=groups.get(id);
   if(!g){g={id,power:damage/TUNE.lance.petalOld,angles:[],asset:opt.asset,scale:opt.scale||1.15,x,y,done:false,lance:null,born:T()};groups.set(id,g);
    const L=TUNE.lance;g.lance=base.call(this,x,y,angle,L.speed,g.power*L.direct,{friendly:true,owner:'hero',asset:(typeof VFX==='object'&&VFX.flare)||opt.asset,scale:1.6,radius:L.width,life:L.range/L.speed,pierce:0,r535:'lance',r535G:id});
    if(g.lance){stats.lances++;try{openGate('r',id,3);}catch(err){fail(err);}}else{groups.delete(id);return base.apply(this,arguments);} }
   g.angles.push(angle);return null;}
 }catch(err){fail(err);}
 return base.apply(this,arguments);};}

// ---- hitEnemy: 가시살 직격 → 폭발 · Z 타격 → 쪼개짐+불 · 가시 → 불 ------------------------------------
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,source){const r=base.apply(this,arguments);
 try{if(source&&source.r535==='lance'){const g=groups.get(source.r535G);if(g&&!g.done)detonate(g,e?e.x:source.x,e?e.y:source.y);}
  else if(r&&on&&source&&source.storyWER&&source.sourceHero===HERO&&source.sourceSlot==='w'&&Number.isFinite(value)&&e){
   splitQ.push({x:e.x,y:e.y,from:e.id,value,cast:source.attackId9??'w'});if(e.hp>0)ignite(e,value);}
  else if(r&&source&&source.r535==='storm'&&source.r535Final&&e){const v=value*TUNE.chain.qFinal;splitQ.push({x:e.x,y:e.y,from:e.id,value:v,cast:source.r535Final});if(e.hp>0)ignite(e,v);}
  else if(r&&source&&(source.r535==='shard'||source.r535==='petal')&&e&&e.hp>0)ignite(e,source.r535V);}catch(err){fail(err);}
 return r;};}

function ignite(e,value){if(!e||!(e.hp>0)||!(value>0))return false;const S=TUNE.split,t=T(),b=burns.get(e);
 if(b){b.value=Math.max(b.value,value);b.ticks=0;b.until=t+S.burnTime;return true;}
 if(burns.size>=S.maxBurning)return false;burns.set(e,{value,ticks:0,next:t+S.burnEvery,until:t+S.burnTime,seed:(stats.ignites*37)%100});stats.ignites++;return true;}

function detonate(g,x,y){if(g.done)return;g.done=true;const L=TUNE.lance,t=T();lastBlast={x,y,at:t};stats.blasts++;closeGate(g.id);
 const inside=[];for(const e of live())if(Math.hypot(e.x-x,e.y-y)<=rg(L.radius)+(e.radius||.4)){inside.push(e.id);try{hitEnemy(e,g.power*L.blast,{kind:'r535-blast',friendly:true,owner:'hero',r535:'blast',x,y});}catch(err){fail(err);}}
 // 박자: 섬광이 가장 밝은 뒤(0.08초) 꽃잎이 퍼진다 — 폭발과 꽃잎이 한 프레임에 겹쳐 하얗게 뭉치지 않게
 petalQ.push({at:t+TUNE.chain.petalBeat,x,y,g,inside});
 if(fxList.length>=TUNE.maxFx)fxList.shift();fxList.push({kind:'blast',x,y,t0:t,life:sheetImg('blast')?.96:.7});
 try{if(!(typeof settings==='object'&&settings&&settings.reducedMotion)){shake=Math.max(typeof shake==='number'?shake:0,2.6);stats.maxShake=Math.max(stats.maxShake,shake);}}catch(_){}
 try{if(typeof sound==='function')sound('special');}catch(_){}
 groups.delete(g.id);}

function flushPetals(t){for(let i=0;i<petalQ.length;){const q=petalQ[i];if(q.at>t){i++;continue;}petalQ.splice(i,1);const L=TUNE.lance,g=q.g;
 for(const a of g.angles){if(mine()>=TUNE.maxLive){stats.capSkips++;continue;}
  const p=makeShot(q.x,q.y,a,16,g.power*L.petal,{friendly:true,owner:'hero',asset:g.asset,scale:g.scale,life:.65,r535:'petal',r535V:g.power*TUNE.chain.petalBurn});
  if(p){for(const id of q.inside)p.hit.add(id);stats.petals++;}}}}
function flushSplits(){const S=TUNE.split;while(splitQ.length){const s=splitQ.shift();let used=castShards.get(s.cast)||0;if(used>=S.perCast)continue;
 const others=live().filter(e=>e.id!==s.from&&Math.hypot(e.x-s.x,e.y-s.y)<=rg(S.reach)).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y));
 let away=0;try{away=Math.atan2(s.y-player.y,s.x-player.x);}catch(_){}
 for(let i=0;i<S.count&&used<S.perCast;i++){if(mine()>=TUNE.maxLive){stats.capSkips++;break;}const o=others[i];
  const a=o?Math.atan2(o.y-s.y,o.x-s.x):away+(i?-.55:.55);
  const p=makeShot(s.x,s.y,a,S.speed,s.value*S.mult,{friendly:true,owner:'hero',asset:(typeof VFX==='object'&&VFX.bolt)||'',scale:.7,life:rg(S.life),pierce:S.pierce,r535:'shard',r535V:s.value});
  if(p){p.hit.add(s.from);used++;stats.shards++;if(i===0){if(pops.length>=6)pops.shift();pops.push({x:s.x,y:s.y,t0:T(),ang:a});}}}
 castShards.set(s.cast,used);if(castShards.size>32)castShards.delete(castShards.keys().next().value);}}

function steer(dt){const S=TUNE.storm;if(!(S.turn>0))return;const L=live();if(!L.length||!(dt>0))return;for(const p of projectiles){if(!p||p.dead||p.r535!=='storm')continue;
 let tg=p.r535T!=null?L.find(e=>e.id===p.r535T):null;
 if(!tg){let best=null,d=rg(S.seek);for(const e of L){const q=Math.hypot(e.x-p.x,e.y-p.y);if(q<d&&!(p.hit&&p.hit.has(e.id))){d=q;best=e;}}tg=best;p.r535T=tg?tg.id:null;}
 if(!tg)continue;const sp=Math.hypot(p.vx,p.vy),cur=Math.atan2(p.vy,p.vx),want=Math.atan2(tg.y-p.y,tg.x-p.x),d=Math.atan2(Math.sin(want-cur),Math.cos(want-cur)),m=S.turn*dt,na=cur+Math.max(-m,Math.min(m,d));
 p.vx=Math.cos(na)*sp;p.vy=Math.sin(na)*sp;}}

function tickBurns(){const S=TUNE.split,t=T(),n=Math.round(S.burnTime/S.burnEvery);for(const [e,b] of burns){if(!(e.hp>0)||e.dead){burns.delete(e);continue;}
 while(b.next<=t&&b.ticks<n&&e.hp>0){b.ticks++;b.next+=S.burnEvery;stats.burnTicks++;try{hitEnemy(e,b.value*S.burnTotal/n,{kind:'r535-burn',friendly:true,owner:'hero',r535:'burn'});}catch(err){fail(err);}}
 if(b.ticks>=n||!(e.hp>0))burns.delete(e);}}

// ---- 무기 문(헌터 테마): 영웅 뒤 허공에 열린 진홍 문양에서 불화살 줄기가 표적으로 쏟아진다 — 그림만 ------------------
function aimAng(){try{const L=live();let b=null,d=12;for(const e of L){const q=Math.hypot(e.x-player.x,e.y-player.y);if(q<d){d=q;b=e;}}return b?Math.atan2(b.y-player.y,b.x-player.x):(player.facing??0);}catch(_){return 0;}}
function openGate(kind,gid,dur){if(!hunter())return;const t=T(),G=TUNE.gate;
 const a=(()=>{const g=gid!=null?groups.get(gid):null;if(g&&g.lance)return Math.atan2(g.lance.vy,g.lance.vx);return aimAng();})();
 for(let i=gates.length-1;i>=0;i--)if(gates[i].kind===kind&&gates[i].gid==null&&kind==='q')gates.splice(i,1);
 if(gates.length>=6)gates.shift();gates.push({kind,n:G[kind],gid,t0:t,until:t+dur,closing:false,next:t,ang:a,seq:0});stats.gates++;}
function closeGate(gid){const t=T();for(const g of gates)if(g.gid===gid&&!g.closing){g.closing=true;g.until=t+TUNE.gate.close;}}
// 문 자리(월드 좌표): 영웅 뒤로 back 칸, 겨눈 방향의 수직으로 펼침
function gateSlots(g){let px=0,py=0;try{px=player.x;py=player.y;}catch(_){}const G=TUNE.gate,c=Math.cos(g.ang),s=Math.sin(g.ang),out=[];
 for(let i=0;i<g.n;i++){const k=g.n===1?0:(i/(g.n-1)-.5)*2,sp=G.spread*(g.kind==='r'?1.6:1),bk=G.back*(1-Math.abs(k)*.25);out.push({x:px-c*bk-s*k*sp,y:py-s*bk+c*k*sp,k,i});}return out;}
function gateTarget(g){if(g.gid!=null){const G=groups.get(g.gid);if(G&&G.lance&&!G.lance.dead)return{x:G.lance.x,y:G.lance.y};if(lastBlast&&T()-lastBlast.at<.4)return lastBlast;}
 try{const L=live();let b=null,d=13;for(const e of L){const q=Math.hypot(e.x-player.x,e.y-player.y);if(q<d){d=q;b=e;}}if(b)return{x:b.x,y:b.y};return{x:player.x+Math.cos(g.ang)*6,y:player.y+Math.sin(g.ang)*6};}catch(_){return null;}}
function pourGates(t){const G=TUNE.gate,lite=typeof settings==='object'&&settings&&settings.lowFx;
 for(let i=gates.length-1;i>=0;i--){const g=gates[i];if(t>g.until||t<g.t0){gates.splice(i,1);continue;}
  if(g.closing||t<g.next)continue;g.next=t+G.every*(lite?2:1);const to=gateTarget(g);if(!to)continue;const sl=gateSlots(g);
  const k=lite?1:(g.kind==='r'?2:1);for(let j=0;j<k;j++){if(volleys.length>=G.maxVolleys)volleys.shift();const s=sl[(g.seq++*(sl.length%3===0?2:3))%sl.length];
   volleys.push({x0:s.x,y0:s.y,x1:to.x+(((g.seq*7)%5)-2)*.12,y1:to.y+(((g.seq*11)%5)-2)*.12,t0:t,life:G.volleyLife,blade:g.seq%3===0});stats.volleys++;}}
 for(let i=pops.length-1;i>=0;i--)if(t-pops[i].t0>.6||t<pops[i].t0)pops.splice(i,1);
 for(let i=volleys.length-1;i>=0;i--){const v=volleys[i];if(t-v.t0>v.life||t<v.t0)volleys.splice(i,1);}}

function post(){const c0=performance.now();try{post0();}finally{stats.postMs+=performance.now()-c0;stats.posts++;}}
function post0(){const t=T(),dt=Math.max(0,Math.min(.1,t-lastT));lastT=t;const r=room0();if(r!==lastRoom){lastRoom=r;reset();return;}
 for(const g of [...groups.values()]){const l=g.lance;if(!l){groups.delete(g.id);continue;}if(l.dead||!projectiles.includes(l))detonate(g,l.x,l.y);else if(t-g.born>3){groups.delete(g.id);closeGate(g.id);}}
 flushPetals(t);flushSplits();steer(dt);tickBurns();pourGates(t);
 for(let i=fxList.length-1;i>=0;i--)if(t-fxList[i].t0>fxList[i].life||t<fxList[i].t0)fxList.splice(i,1);
 stats.maxLive=Math.max(stats.maxLive,mine());}

if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{post();}catch(err){fail(err);}sentinel(fxList.length>0||burns.size>0||gates.length>0||volleys.length>0||pops.length>0);return r;};}

// ---- 그리기 (임시 코드 연출 — Dots 시트 대기) ------------------------------------------------------------
const CRIM='rgb(160,20,40)',ROSE='rgb(250,150,150)',GOLD='rgb(255,214,140)',EMBER='rgb(255,122,58)';
const sc=(o,f)=>{if(typeof ctx!=='undefined'&&ctx&&typeof ctx.scope==='function')ctx.scope(o,f);else f();};
const Z=()=>typeof zoom==='number'&&zoom>0?zoom:1,TL=()=>typeof TILE==='number'?TILE:34;
function lift(){return 18*Z();}
// 드라이브 화살촉 불꽃 시트(hunter-fire-arrowhead: 6×4칸 192px, 24프레임, 불덩이는 오른쪽을 봄·머리 중심 x .78 y .52)
const ARROW='assets/r535/hunter-fire-arrowhead.webp',CELL=192,COLS=6,FRAMES=24;const asked=new Map();
function img(path){try{const got=typeof readyImage==='function'?readyImage(path):null;if(got&&got.image)return got.image;
 const t=T(),at=asked.get(path);if(at==null||t-at>1.5||t<at){asked.set(path,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([path])).catch(()=>{});}}catch(err){fail(err);}return null;}
function arrowImg(){return img(ARROW);}
// R535-3 Dots r1 헌터 시트(CX-0060H HU-01~06, 손질본 dots-r1-20261110): 6열, 칸·재생 장수·기준점은 sheets/index.json 그대로.
// 시트가 아직 안 읽혔으면 아래 옛 코드 그림을 그대로 그린다.
const SHEETS=Object.freeze({
 lance:{path:'assets/r535/dots/hunter-c-lance.webp',cell:256,n:20,loop:true,piv:[251,122]},
 blast:{path:'assets/r535/dots/hunter-c-blast.webp',cell:224,n:24,loop:false,piv:[112,219]},
 burn:{path:'assets/r535/dots/hunter-burn.webp',cell:256,n:20,loop:true,piv:[128,208]},
 shard:{path:'assets/r535/dots/hunter-z-ember-thorn.webp',cell:256,n:20,loop:true,piv:[195,128]},
 pop:{path:'assets/r535/dots/hunter-z-split-pop.webp',cell:256,n:15,loop:false,piv:[118,139]},
 storm:{path:'assets/r535/dots/hunter-q-storm-trail.webp',cell:256,n:20,loop:true,piv:[244,140]},
 // Dots r2(dots-r2-20261110): 문 24칸(0-4 열림 · 5-19 반복 · 20-23 닫힘, 타원 지름 약 90px), 불줄기 20칸 반복(왼→오, 기준점은 머리 쪽으로 옮김)
 gate:{path:'assets/r535/dots/hunter-gate.webp',cell:256,n:24,loop:false,piv:[128,145]},
 volley:{path:'assets/r535/dots/hunter-volley.webp',cell:256,n:20,loop:true,piv:[236,126]}});
// 진홍 시트는 어두운 지역에서 묻히므로 보통 합성 한 번 + 더하기 합성 한 번(빛). 두 번째는 수에 안 셈.
function glow(k,f,x,y,sc,al=1,g=.5){const op=ctx.globalCompositeOperation;ctx.globalCompositeOperation='source-over';const ok=sheet(k,f,x,y,sc,al);if(ok){ctx.globalCompositeOperation='lighter';sheet(k,f,x,y,sc,al*g);stats.sheetDraws[k]--;}ctx.globalCompositeOperation=op;return ok;}
function sheetImg(k){return img(SHEETS[k].path);}
// 지금 변환 기준 (x,y) 에 기준점을 맞춰 칸 하나를 그린다. f 는 0..n-1(루프면 감음), sc 는 화면 배율.
function sheet(k,f,x,y,sc,al=1){const S=SHEETS[k],im=img(S.path);if(!im)return false;let i=Math.floor(f);i=S.loop?((i%S.n)+S.n)%S.n:Math.max(0,Math.min(S.n-1,i));
 ctx.globalAlpha=al;ctx.drawImage(im,(i%6)*S.cell,Math.floor(i/6)*S.cell,S.cell,S.cell,x-S.piv[0]*sc,y-S.piv[1]*sc,S.cell*sc,S.cell*sc);ctx.globalAlpha=1;stats.sheetDraws[k]++;return true;}
function drawHead(len,t){const img=arrowImg();if(!img)return false;const f=Math.floor(t*12.5)%FRAMES,S=len*1.15;
 ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.95;ctx.drawImage(img,(f%COLS)*CELL,Math.floor(f/COLS)*CELL,CELL,CELL,len*.62-S*.78,-S*.52,S,S);
 ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;stats.headDraws++;return true;}
// 가시살: 비틀린 두 가닥(진홍·장미)이 꼬인 굵은 화살대 + 금빛 촉. 빛은 왼쪽 위에서 — 위쪽 가닥 가장자리에 밝은 띠.
function drawLance(b){const q=project(b.x,b.y),pr=project(b.x-b.vx*.05,b.y-b.vy*.05),a=Math.atan2(q.y-pr.y,q.x-pr.x),z=Z(),len=TL()*z*2.1,w=TL()*z*.28,t=T();
 sc({id:'r535:lance:'+b.id,kind:'effect',x:b.x,y:b.y},()=>{ctx.save();try{ctx.translate(q.x,q.y-lift());ctx.rotate(a);
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.22;ctx.beginPath();ctx.ellipse(-len*.2,0,len*.75,w*1.5,0,0,Math.PI*2);ctx.fillStyle=CRIM;ctx.fill();
  // Dots 가시살 시트(HU-03): 촉이 기준점 — 화살촉 불꽃(드라이브)을 뒤에 깔고 그 위에 시트
  if(sheetImg('lance')){ctx.globalCompositeOperation='source-over';drawHead(len,t);ctx.globalCompositeOperation='source-over';sheet('lance',t*12.5,len*.62,0,len*1.3/256);return;}
  // 뒤로 끌리는 나선 바람 고리 3개
  ctx.globalCompositeOperation='lighter';for(let k=1;k<=3;k++){const x=-len*(.45+k*.28),r=w*(1.1+k*.35),ph=(t*14+k)%1;ctx.globalAlpha=.32*(1-k/4)*(1-ph*.5);ctx.strokeStyle=ROSE;ctx.lineWidth=Math.max(1,1.4*z);ctx.beginPath();ctx.ellipse(x,0,r*.35,r,0,0,Math.PI*2);ctx.stroke();}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  // 꼬인 두 가닥
  for(const [col,ph] of [[CRIM,0],[ROSE,Math.PI]]){ctx.beginPath();for(let i=0;i<=14;i++){const u=i/14,x=-len*.55+u*len,y=Math.sin(u*Math.PI*3+t*22+ph)*w*.55*(1-u*.5);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.strokeStyle=col;ctx.lineWidth=Math.max(1.5,w*.55);ctx.lineCap='round';ctx.stroke();}
  ctx.beginPath();ctx.moveTo(-len*.55,-w*.18);ctx.lineTo(len*.4,-w*.12);ctx.strokeStyle='rgba(255,236,220,.7)';ctx.lineWidth=Math.max(1,w*.14);ctx.stroke();
  // 촉: 드라이브 불꽃 시트가 있으면 불덩이 촉 위에 작은 금빛 세 갈래, 없으면 금빛 세 갈래만(임시)
  const head=drawHead(len,t);if(head){ctx.save();ctx.translate(len*.2,0);ctx.scale(.6,.6);}
  ctx.beginPath();ctx.moveTo(len*.62,0);ctx.lineTo(len*.38,-w*.75);ctx.lineTo(len*.44,0);ctx.lineTo(len*.38,w*.75);ctx.closePath();ctx.fillStyle=GOLD;ctx.fill();ctx.strokeStyle=CRIM;ctx.lineWidth=Math.max(1,z);ctx.stroke();if(head)ctx.restore();
 }finally{ctx.restore();}});stats.lanceDraws++;}
// 가시: 붉은 바늘 + 불씨 꼬리
function drawShard(b){const q=project(b.x,b.y),pr=project(b.x-b.vx*.04,b.y-b.vy*.04),z=Z();
 if(sheetImg('shard')){sc({id:'r535:shard:'+b.id,kind:'effect',x:b.x,y:b.y},()=>{ctx.save();try{ctx.translate(q.x,q.y-lift());ctx.rotate(Math.atan2(q.y-pr.y,q.x-pr.x));glow('shard',T()*12.5+b.id,0,0,.5*z);}finally{ctx.restore();}});return;}
 sc({id:'r535:shard:'+b.id,kind:'effect',x:b.x,y:b.y},()=>{ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(pr.x,pr.y-lift());ctx.lineTo(q.x,q.y-lift());ctx.strokeStyle=EMBER;ctx.globalAlpha=.55;ctx.lineWidth=Math.max(2,4*z);ctx.stroke();
  ctx.beginPath();ctx.moveTo((pr.x+q.x)/2,(pr.y+q.y)/2-lift());ctx.lineTo(q.x,q.y-lift());ctx.strokeStyle=GOLD;ctx.globalAlpha=.95;ctx.lineWidth=Math.max(1,1.6*z);ctx.stroke();
 }finally{ctx.restore();}});}
// 폭풍 추적 화살: 지나온 자리에 가는 바람 결 두 줄(장미·은)
function drawStormTrail(b){const q=project(b.x,b.y),pr=project(b.x-b.vx*.07,b.y-b.vy*.07),z=Z(),nx=-(q.y-pr.y),ny=q.x-pr.x,nl=Math.hypot(nx,ny)||1,o=3*z;
 if(sheetImg('storm')){sc({id:'r535:storm:'+b.id,kind:'effect',x:b.x,y:b.y},()=>{ctx.save();try{ctx.translate(q.x,q.y-lift());ctx.rotate(Math.atan2(q.y-pr.y,q.x-pr.x));ctx.globalCompositeOperation='lighter';sheet('storm',T()*12.5+b.id,0,0,.34*z,.85);}finally{ctx.restore();}});return;}
 sc({id:'r535:storm:'+b.id,kind:'effect',x:b.x,y:b.y},()=>{ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.lineWidth=Math.max(1,1.3*z);
  for(const [s,col,al] of [[1,ROSE,.5],[-1,'rgb(220,226,236)',.35]]){ctx.beginPath();ctx.moveTo(pr.x+nx/nl*o*s,pr.y+ny/nl*o*s-lift());ctx.quadraticCurveTo((pr.x+q.x)/2,(pr.y+q.y)/2-lift(),q.x,q.y-lift());ctx.strokeStyle=col;ctx.globalAlpha=al;ctx.stroke();}
 }finally{ctx.restore();}});}
// 대폭발: 붉은 섬광 원판 → 금빛 충격 고리(바닥 눕힘) → 꽃잎 조각
function drawBlast(f){const t=T(),u=Math.min(1,(t-f.t0)/f.life),q=project(f.x,f.y),z=Z(),R=TUNE.lance.radius*TL()*z*Math.SQRT2,e=1-Math.pow(1-u,3);
 sc({id:'r535:blast:'+f.t0.toFixed(3),kind:'effect',x:f.x,y:f.y},()=>{ctx.save();try{
  const dots=sheetImg('blast');ctx.globalCompositeOperation='lighter';
  if(u<.3&&!dots){ctx.globalAlpha=.42*(1-u/.3);ctx.beginPath();ctx.ellipse(q.x,q.y-lift()*.6,R*.4*(.4+u*1.6),R*.24*(.4+u*1.6),0,0,Math.PI*2);ctx.fillStyle=GOLD;ctx.fill();}
  ctx.globalCompositeOperation='source-over';if(u<.5){ctx.globalAlpha=.35*(1-u/.5);ctx.beginPath();ctx.ellipse(q.x,q.y,R*e*.8,R*e*.4,0,0,Math.PI*2);ctx.fillStyle='rgba(60,6,14,1)';ctx.fill();}ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=.85*(1-u);ctx.lineWidth=Math.max(2,6*z*(1-u));ctx.strokeStyle=ROSE;ctx.beginPath();ctx.ellipse(q.x,q.y,R*e,R*e*.5,0,0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=.6*(1-u);ctx.lineWidth=Math.max(1,2.5*z*(1-u));ctx.strokeStyle=CRIM;ctx.beginPath();ctx.ellipse(q.x,q.y,R*e*.72,R*e*.36,0,0,Math.PI*2);ctx.stroke();
  // 불기둥 고리: 충격 고리를 따라 불꽃 혀 8개가 솟았다 꺼진다(R106 공용 flame 띠, 진홍→금)
  if(!dots&&u<.7){const n=8,hh=R*.5*Math.sin(Math.PI*Math.min(1,u/.7)),fa=.75*(1-u/.7);for(let i=0;i<n;i++){const a=i*Math.PI*2/n+.3,x=q.x+Math.cos(a)*R*e*.85,y=q.y+Math.sin(a)*R*e*.42;
   tongue(x,y,hh*(.8+.2*Math.sin(t*15+i)),hh*.22,fa,i%2?CRIM:EMBER,t*9+i);}}
  ctx.globalCompositeOperation='source-over';
  if(!dots)for(let i=0;i<10;i++){const a=i*Math.PI*2/10+f.t0,d=R*(.2+e*.9),x=q.x+Math.cos(a)*d,y=q.y-lift()*(1-u)+Math.sin(a)*d*.5-Math.sin(Math.PI*u)*R*.25;
   ctx.globalAlpha=.9*(1-u);ctx.save();ctx.translate(x,y);ctx.rotate(a+u*6);ctx.beginPath();ctx.ellipse(0,0,4.5*z,2.2*z,0,0,Math.PI*2);ctx.fillStyle=i%2?CRIM:ROSE;ctx.fill();ctx.restore();}
 }finally{ctx.restore();}});
 // Dots 대폭발 시트(HU-04): 몹 무리 한가운데서 터지므로 몹보다 앞에 그린다(정렬 기준을 화면 앞쪽 1칸으로)
 if(sheetImg('blast'))sc({id:'r535:blastS:'+f.t0.toFixed(3),kind:'effect',x:f.x+1,y:f.y+1},()=>{ctx.save();try{ctx.globalCompositeOperation='source-over';sheet('blast',u*24,q.x,q.y+R*.08,R*2.5/224,.95);
  // 어두운 지역에서 진홍이 묻히지 않게 같은 칸을 더하기 합성으로 한 번 더(빛나는 불)
  ctx.globalCompositeOperation='lighter';sheet('blast',u*24,q.x,q.y+R*.08,R*2.5/224,.55*(1-u*.6));stats.sheetDraws.blast--;}finally{ctx.restore();}});}
function tongue(x,y,hh,ww,al,col,ph){ctx.globalAlpha=al;ctx.beginPath();ctx.moveTo(x-ww,y);ctx.quadraticCurveTo(x-ww*.6,y-hh*.6,x+Math.sin(ph)*ww*.5,y-hh);ctx.quadraticCurveTo(x+ww*.6,y-hh*.55,x+ww,y);ctx.closePath();ctx.fillStyle=col;ctx.fill();
 ctx.beginPath();ctx.moveTo(x-ww*.4,y);ctx.quadraticCurveTo(x,y-hh*.55,x+ww*.4,y);ctx.closePath();ctx.fillStyle=GOLD;ctx.fill();}
// 불: 적 발치에서 일렁이는 불꽃 혀 세 개
function drawBurn(e,b){const t=T(),q=project(e.x,e.y),z=Z(),h=(typeof actorHeight==='function'?actorHeight():60)*.42,left=Math.max(0,b.until-t),fade=Math.min(1,left/.4);
 if(sheetImg('burn')){sc({id:'r535:burn:'+e.id,kind:'effect',x:e.x+.06,y:e.y+.06},()=>{ctx.save();try{glow('burn',t*12.5+b.seed,q.x,q.y,(burns.size>TUNE.fullFlames?.3:.4)*z,fade,burns.size>TUNE.fullFlames?0:.5);}finally{ctx.restore();}});return;}
 sc({id:'r535:burn:'+e.id,kind:'effect',x:e.x,y:e.y},()=>{ctx.save();try{ctx.globalCompositeOperation='lighter';
  const n=burns.size>TUNE.fullFlames?1:3;for(let i=0;i<n;i++){const fl=.75+.25*Math.sin(t*17+i*2.1+b.seed),x=q.x+(n===1?0:(i-1)*h*.28),hh=h*fl*(i===1?1:.7),ww=h*.16;
   ctx.globalAlpha=.75*fade;ctx.beginPath();ctx.moveTo(x-ww,q.y);ctx.quadraticCurveTo(x-ww*.6,q.y-hh*.6,x+Math.sin(t*9+i)*ww*.5,q.y-hh);ctx.quadraticCurveTo(x+ww*.6,q.y-hh*.55,x+ww,q.y);ctx.closePath();ctx.fillStyle=(n===1||i===1)?EMBER:CRIM;ctx.fill();
   ctx.globalAlpha=.8*fade;ctx.beginPath();ctx.moveTo(x-ww*.4,q.y);ctx.quadraticCurveTo(x,q.y-hh*.55,x+ww*.4,q.y);ctx.closePath();ctx.fillStyle=GOLD;ctx.fill();}
 }finally{ctx.restore();}});}

// 쪼개짐 순간(HU-06): 15칸을 0.6초에(2배속), 가시가 날아간 쪽으로 돌려서. 시트가 없으면 그리지 않는다(옛 연출엔 없던 것)
function drawPops(){if(!pops.length||!sheetImg('pop'))return;const t=T(),z=Z();for(const o of pops){const q=project(o.x,o.y),pr=project(o.x+Math.cos(o.ang),o.y+Math.sin(o.ang));
 sc({id:'r535:pop:'+o.t0.toFixed(3)+':'+o.x.toFixed(2),kind:'effect',x:o.x,y:o.y},()=>{ctx.save();try{ctx.translate(q.x,q.y-lift());ctx.rotate(Math.atan2(pr.y-q.y,pr.x-q.x));ctx.globalCompositeOperation='lighter';sheet('pop',(t-o.t0)*25,0,0,.42*z);}finally{ctx.restore();}});}}
// 무기 문: 허공(영웅 키 1.6배 높이)에 눕힌 진홍 문양 원 — 바깥 금빛 테(왼쪽 위가 밝음), 안쪽 어두운 구멍, 바늘 문양 6개가 돈다
function drawGates(){const t=T(),z=Z(),h=(typeof actorHeight==='function'?actorHeight():60);
 for(const g of gates){const open=Math.min(1,(t-g.t0)/.12),shut=g.closing?Math.max(0,(g.until-t)/TUNE.gate.close):1,a=open*shut;if(a<=0)continue;
  for(const s of gateSlots(g)){const q=project(s.x,s.y),cx=q.x,cy=q.y-h*(g.kind==='r'?1.5:1.25)+Math.abs(s.k)*h*.18,r=(g.kind==='r'?18:12)*z*(0.6+.4*open),rot=t*2.2*(s.i%2?-1:1);
   if(sheetImg('gate')){const el=t-g.t0,f=g.closing?20+Math.min(3.99,(1-shut)*4):el<.2?el*25:5+((el-.2)*12.5)%15;
    sc({id:'r535:gate:'+g.t0.toFixed(3)+':'+s.i,kind:'effect',x:s.x,y:s.y},()=>{ctx.save();try{glow('gate',f,cx,cy,r*2/90,1,.45);}finally{ctx.restore();}});continue;}
   sc({id:'r535:gate:'+g.t0.toFixed(3)+':'+s.i,kind:'effect',x:s.x,y:s.y},()=>{ctx.save();try{
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.7*a;ctx.beginPath();ctx.ellipse(cx,cy,r*.82,r*.82*.62,0,0,Math.PI*2);ctx.fillStyle='rgba(30,2,8,1)';ctx.fill();
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.85*a;ctx.lineWidth=Math.max(1.5,2.4*z);ctx.strokeStyle=CRIM;ctx.beginPath();ctx.ellipse(cx,cy,r,r*.62,0,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=.9*a;ctx.lineWidth=Math.max(1,1.4*z);ctx.strokeStyle=GOLD;ctx.beginPath();ctx.ellipse(cx,cy,r,r*.62,0,Math.PI*.95,Math.PI*1.6);ctx.stroke();
    ctx.globalAlpha=.75*a;ctx.strokeStyle=ROSE;ctx.lineWidth=Math.max(1,1.1*z);for(let k=0;k<6;k++){const u=rot+k*Math.PI/3,x1=cx+Math.cos(u)*r*.5,y1=cy+Math.sin(u)*r*.31,x2=cx+Math.cos(u)*r*.86,y2=cy+Math.sin(u)*r*.53;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
    ctx.globalAlpha=.55*a;ctx.beginPath();ctx.ellipse(cx,cy,r*.32,r*.2,0,0,Math.PI*2);ctx.fillStyle=EMBER;ctx.fill();
   }finally{ctx.restore();}});}}}
// 불화살 줄기: 문에서 표적으로 0.2초 동안 내리꽂히는 불줄기(칼날 모양은 끝이 넓은 금빛 쐐기)
function drawVolleys(){const t=T(),z=Z(),h=(typeof actorHeight==='function'?actorHeight():60);
 for(const v of volleys){const u=Math.min(1,(t-v.t0)/v.life),a=project(v.x0,v.y0),b=project(v.x1,v.y1),ay=a.y-h*1.4,by=b.y-lift(),hx=a.x+(b.x-a.x)*u,hy=ay+(by-ay)*u,tx=a.x+(b.x-a.x)*Math.max(0,u-.35),ty=ay+(by-ay)*Math.max(0,u-.35);
  if(sheetImg('volley')){sc({id:'r535:volley:'+v.t0.toFixed(3)+':'+v.x0.toFixed(2),kind:'effect',x:v.x1,y:v.y1},()=>{ctx.save();try{ctx.translate(hx,hy);ctx.rotate(Math.atan2(by-ay,b.x-a.x));ctx.globalCompositeOperation='lighter';sheet('volley',(t-v.t0)*12.5+v.x0*7,0,0,.3*z,1-u*.45);}finally{ctx.restore();}});continue;}
  sc({id:'r535:volley:'+v.t0.toFixed(3)+':'+v.x0.toFixed(2),kind:'effect',x:v.x1,y:v.y1},()=>{ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
   ctx.globalAlpha=.6*(1-u*.5);ctx.strokeStyle=EMBER;ctx.lineWidth=Math.max(1.5,3*z);ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(hx,hy);ctx.stroke();
   ctx.globalAlpha=.9*(1-u*.4);ctx.strokeStyle=GOLD;ctx.lineWidth=Math.max(1,1.2*z);ctx.beginPath();ctx.moveTo((tx+hx)/2,(ty+hy)/2);ctx.lineTo(hx,hy);ctx.stroke();
   if(v.blade){const an=Math.atan2(hy-ty,hx-tx),L=7*z;ctx.translate(hx,hy);ctx.rotate(an);ctx.globalAlpha=.85*(1-u*.4);ctx.beginPath();ctx.moveTo(L,0);ctx.lineTo(-L*.4,-L*.35);ctx.lineTo(-L*.2,0);ctx.lineTo(-L*.4,L*.35);ctx.closePath();ctx.fillStyle=GOLD;ctx.fill();}
  }finally{ctx.restore();}});}}

if(typeof drawProjectile==='function'){const base=drawProjectile;drawProjectile=function(b,...a){
 if(b&&b.r535&&typeof project==='function'&&typeof ctx!=='undefined'&&ctx){const c0=performance.now();try{
  if(b.r535==='lance'){drawLance(b);return;}if(b.r535==='shard'){drawShard(b);return;}
  if(b.r535==='storm'&&!(typeof settings==='object'&&settings&&settings.lowFx))drawStormTrail(b);}catch(err){fail(err);}finally{stats.drawMs+=performance.now()-c0;}}
 return base.apply(this,[b,...a]);};}

const SENT={type:'r535-hunter',x:0,y:0,age:0,life:Infinity,r535Sentinel:true};
function sentinel(want){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);
 if(want&&i<0)effects.push(SENT);else if(!want&&i>=0)effects.splice(i,1);SENT.age=0;}catch(_){}}
let wrapped=false;function wrapEffect(){if(wrapped||typeof drawEffect!=='function')return wrapped;const base=drawEffect;
 drawEffect=function(e,...a){if(e&&e.r535Sentinel){const c0=performance.now();try{if(typeof project==='function'&&typeof ctx!=='undefined'&&ctx){drawGates();drawVolleys();drawPops();for(const f of fxList)drawBlast(f);for(const [en,b] of burns)drawBurn(en,b);}}catch(err){fail(err);}stats.drawMs+=performance.now()-c0;return;}return base.apply(this,[e,...a]);};wrapped=true;return true;}
if(!wrapEffect()&&typeof setTimeout==='function'){let n=0;(function arm(){if(wrapEffect()||++n>40)return;setTimeout(arm,250);})();}

function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}if(!on)reset();return on;}
window.__STORYWORLD_HUNTER_ARROWS_R535__=Object.freeze({revision:REV,set,on:()=>on,ignite,tuning:TUNE,
 names:Object.freeze({q:'폭풍 추적',w:'불씨 가시',r:'뒤틀린 가시살'}),
 inspect:()=>({revision:REV,on,tuning:TUNE,burning:burns.size,groups:groups.size,pendingSplits:splitQ.length,live:mine(),fx:fxList.length,lastBlast:lastBlast&&{...lastBlast},gates:gates.map(g=>({kind:g.kind,n:g.n,closing:g.closing})),volleys:volleys.length,volleyOrigins:[...new Set(volleys.map(v=>v.x0.toFixed(2)+','+v.y0.toFixed(2)))],pops:pops.length,stats:{...stats,sheetDraws:{...stats.sheetDraws}}})});
})();
