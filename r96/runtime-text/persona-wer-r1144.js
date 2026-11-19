/* R1144 페르소나 영웅 W·E·R 덧효과 (사용자 2026-11-18 05:44Z
 *  "w 순수악의의 분기에 표식붙은적끼리 연쇄 언주색 레이져라이트닝걸리면서 데미지도 입게 e-주변적에게 기본공격을 날리고 불태워 도트뎀을 입도록
 *   r 악의 의 관통시 동시에 언주빛 구슬이 영웅주변을 회전하며돌며 닿은적에게 데미지를 입히고 불태우고도트뎀 주도록",
 *  05:45Z "이펙트 프레임애니메이션은 기존 영웅들 이펙트 잘 발췌해서 색만 언주색,흑색으로 바꿔서 사용").
 * 페르소나 형상(라우렌 몸, persona-hero-r1113 formActive)일 때만 돈다. 라우렌 본인·다른 영웅은 그대로. 키는 늘리지 않는다(본편 W·E·R 을 쓴 순간에 덧붙는다).
 * 본편 W·E·R(index.html __STORYWORLD_WER__)의 판정·대기·수치는 건드리지 않고, 쓴 것만 알아챈다(player.storyWER.ready 가 늘고 시전 자세 skillAnim 이 걸린 틱).
 *  W 순수악의의 분기: 표식(e.storyWERExposeUntil, 3초)이 붙은 적끼리 가까운 순으로 언주 번개가 이어진다. 이어진 적마다 공격력 0.6배, 1.2초 뒤 한 번 더(표식이 남은 적만).
 *     표식 적이 하나면 영웅에게서 그 적으로 한 줄. 9칸 안·마디 7칸 안·최대 8마리.
 *  E 욕망의 일식: 돌진이 끝난 자리에서 4.5칸 안 가까운 적 넷까지 언주 구슬(기본 공격 구슬)을 하나씩 날린다. 맞으면 0.6배 + 화상.
 *  R 악의의 관통: 3초 동안 언주 구슬 셋이 영웅 둘레 1.5칸을 1초에 한 바퀴 돈다. 구슬에 닿은 적은 0.35배 + 화상(적마다 0.6초에 한 번).
 *  화상: 공격력의 0.3배를 2.5초 동안 0.5초마다 다섯 번에 나눠 준다. 겹치지 않고 다시 걸리면 시간만 새로(헌터 불화살 R535 화상과 같은 균형). 한 번에 12마리까지.
 * 그림은 새로 그리지 않고 기존 영웅 이펙트 시트를 쓴다: 번개 = 네온 연쇄 번개(assets/r562/dots/neon-chain.webp), 화상 = 헌터 화상(assets/r535/dots/hunter-burn.webp),
 *  구슬 = 라우렌 은빛 거성 구(assets/r946/lauren-red.webp). 색은 페르소나 쪽 굽기(R1140·R1143)가 장면 명령을 그릴 때 언주로 바꾸고, 번개 밑그림(굵은 그림자)은 흑(brightness(0))으로 깐다. 시트가 안 읽혔으면 임시 코드 그림(선·원)으로 그린다 — 최종 그림 아님.
 * (진) 쌍성 소멸 부채꼴 레이저(사용자 06:23Z "가는곳에 저렇게 흑적색 레이져가 펴지면서 (맵끝까지) 일반몹즉사 보스몹 최대체력7프로 추가데미지 입도록"):
 *  페르소나 형상일 때 천체 공명 쌍성 소멸(R946)이 쏘아지는 순간(충전 0.5초 뒤), 소멸탄이 나간 자리에서 검붉은 레이저 일곱 줄이(사용자 06:42Z "7줄") 진행 방향으로
 *  부채꼴(±24도)로 펴지며 맵 끝까지 뻗는다. 줄에 닿은 일반 몹은 즉사, 보스·중간 보스는 최대 체력의 7% 추가 피해(발동마다 적 하나에 한 번).
 *  R946 파일은 손대지 않고 발동만 읽는다(inspect). 피해에는 r946 표식을 붙여 천체 공명을 다시 굴리지 않는다.
 *  그림: 레이저 결 = 네온 연쇄 번개 시트를 줄 따라 이어 붙임, 심 = 코드 선(임시). 주인 id 가 r946:violet:laser:* 라 페르소나 굽기가 검빨로 칠한다.
 * R1152 Dots 그림(사용자 07:53Z CX-0141~0150 '개선적용 앵간하면 홀드도 개선적용해 배경처리같은거 잘하고'): 위 임시·빌린 그림을 페르소나 전용 Dots 시트로 바꾼다.
 *  W = 표식 눈(CX-0144PW A, 표식 걸린 적 머리 위)·먹 번개(B, 이음매 손질)·적중 섬광(C) / E·R = 붉은 눈 구슬(CX-0145PR A)·짧은 꼬리(B)·화상 불씨(C)
 *  (진) 레이저 = CX-0143PL 시작 구(B, 배경 빼기)·몸통(A, 이음매 손질 뒤 겹쳐 잇기)·끝 터짐(C). 색은 그림 그대로(언주·먹·흑적) — 페르소나 굽기는 assets/r1152 를 건드리지 않는다.
 *  시트가 안 읽혔으면 예전 그림(빌린 시트·코드 선)으로 그린다. 정리 스크립트 scripts/r1152-persona-dots.py, 출처 표 assets/r1152/index.json.
 * R1198(사용자 2026-11-19 03:52Z 하이라이트 스킬 '사거리 스킬범위 이펙트 크기 자체를 키워줘 쌍성소멸도 마찬가지'): (진) 레이저 판정 굵기 .55→.85칸, 여운 .85→1.15초,
 *  그림 굵기·시작 구·끝 터짐 ×LASER_VIS(1.45). 일곱 줄·맵 끝·즉사·보스 7% 는 그대로.
 * 끄기: localStorage['storyworld.r1144.personaWer']='{"on":false}'
 */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_PERSONA_WER_R1144__)return;
const LASER_VIS=1.45;/* R1198 */
const REV='R1144-persona-wer-3-hl-r1198',KEY='storyworld.r1144.personaWer',HERO='lauren',SLOTS=['w','e','r'];
const TUNE=Object.freeze({
 chain:Object.freeze({delay:.2,again:1.2,pulses:2,k:.6,reach:9,link:7,max:8,stagger:.06,life:.55}),
 volley:Object.freeze({delay:.2,k:.6,reach:4.5,max:4,speed:14}),
 orbit:Object.freeze({delay:.14,time:3,n:3,radius:1.5,period:1,hitR:.55,k:.35,gap:.6}),
 burn:Object.freeze({total:.3,time:2.5,every:.5,max:12}),
 laser:Object.freeze({charge:.5,rays:[-.42,-.28,-.14,0,.14,.28,.42],spread:.3,hitAt:.22,life:1.15,width:.85,bossK:.07,maxLen:90})});
const SHEETS=Object.freeze({
 chain:Object.freeze({path:'assets/r562/dots/neon-chain.webp',cell:256,cols:6,n:24,x0:18,x1:240,y:125,fallback:'hue-rotate(200deg) saturate(1.6) brightness(.85)'}),
 burn:Object.freeze({path:'assets/r535/dots/hunter-burn.webp',cell:256,cols:6,n:20,piv:[128,208],fps:14,fallback:'hue-rotate(345deg) saturate(1.3) brightness(.9)'}),
 orb:Object.freeze({path:'assets/r946/lauren-red.webp',cell:192,cols:6,n:24,piv:[141,137],body:145,fps:12.5,fallback:null}),
 // R1152 Dots(페르소나 전용, 색 그대로)
 dmark:Object.freeze({path:'assets/r1152/w-mark.webp',cell:256,cols:8,n:8,piv:[128,128],fps:10,dots:true}),
 dchain:Object.freeze({path:'assets/r1152/w-chain.webp',cell:256,ch:128,cols:8,n:8,y:66,edge:24,fps:15,dots:true}),
 dhit:Object.freeze({path:'assets/r1152/w-hit.webp',cell:256,cols:6,n:6,piv:[128,128],fps:14,dots:true}),
 dorb:Object.freeze({path:'assets/r1152/r-orb.webp',cell:256,cols:6,n:24,piv:[136,124],body:120,fps:12.5,dots:true}),
 dtail:Object.freeze({path:'assets/r1152/r-tail.webp',cell:256,cols:8,n:8,head:[210,140],len:170,fps:12.5,dots:true}),
 dember:Object.freeze({path:'assets/r1152/e-ember.webp',cell:256,cols:6,n:6,piv:[132,214],fps:12.5,dots:true}),
 lbody:Object.freeze({path:'assets/r1152/laser-body.webp',cell:256,ch:128,cols:8,n:8,y:66,edge:24,fps:14,dots:true}),
 lstart:Object.freeze({path:'assets/r1152/laser-start.webp',cell:256,cols:8,n:8,piv:[66,128],fps:12,dots:true}),
 lend:Object.freeze({path:'assets/r1152/laser-end.webp',cell:256,cols:8,n:8,piv:[134,129],fps:12,dots:true})});
const EONJU='204,52,40',EONJU_HOT='255,176,140',INK='10,4,4';
const stats={casts:{w:0,e:0,r:0},pulses:0,links:0,shots:0,orbHits:0,ignites:0,burnTicks:0,hits:0,cancels:0,draws:0,sheetDraws:0,tempDraws:0,errors:0,lastError:null};
let hits=[],marks=0,lasers=[],violetSeen=-1,jobs=[],arcs=[],shots=[],orbit=null,burns=new Map(),prev=null,prevOwner=null,lastRoom=null,prefAt=-1e9,prefOn=true,askAt=-1e9,inner=0,serial=0;
const fail=e=>{stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,200);};
const T=()=>{try{return typeof time==='number'?time:0;}catch(_){return 0;}};
function P(){try{return typeof player==='object'&&player?player:null;}catch(_){return null;}}
function curRoom(){try{return typeof room!=='undefined'?room:null;}catch(_){return null;}}
function readOn(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return !(v&&v.on===false);}catch(_){return true;}}
function on(){const t=T();if(t<prefAt||t-prefAt>=1){prefAt=t;prefOn=readOn();}return prefOn;}
function form(){try{const A=window.__STORYWORLD_PERSONA_HERO_R1113__;return !!(A&&typeof A.formActive==='function'&&A.formActive()===true);}catch(_){return false;}}
function blockedNow(){try{if(typeof storyScene!=='undefined'&&storyScene)return true;if(typeof modal!=='undefined'&&modal)return true;if(typeof loading!=='undefined'&&loading)return true;}catch(_){}return false;}
function active(){const p=P();return !!(p&&p.hero===HERO&&p.hp>0&&on()&&form());}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function alive(e){return !!e&&e.hp>0&&!e.dead&&e.visible!==false&&!['hidden','inactive','disabled','despawned'].includes(e.spawnState);}
function canHit(e){try{return typeof damageable3==='function'?!!damageable3(e):true;}catch(_){return true;}}
function foes(){try{return (typeof liveEnemies==='function'?liveEnemies():[]).filter(e=>alive(e)&&canHit(e));}catch(_){return [];}}
function lineOk(a,b){try{return typeof clearLine==='function'?!!clearLine(a,b):true;}catch(_){return true;}}
function ap(){try{return typeof attackPower==='function'?Number(attackPower())||0:0;}catch(_){return 0;}}
function deal(e,v,kind){if(!alive(e)||!canHit(e)||!(v>0))return false;inner++;try{const r=hitEnemy(e,v,{kind:'r1144-'+kind,friendly:true,owner:'hero',sourceHero:HERO,r1144:kind});if(r!==false)stats.hits++;return r;}catch(err){fail(err);return false;}finally{inner--;}}
function later(dt,fn){jobs.push({at:T()+dt,fn});}
function major(e){try{if(typeof majorActor3==='function')return !!majorActor3(e);}catch(_){}return !!(e&&(e.boss||e.midboss));}
// ---- (진) 쌍성 소멸 부채꼴 레이저 ----
function mapN(){try{return typeof N==='number'&&N>2?N:64;}catch(_){return 64;}}
// 맵 끝: 넓힌 탐험 맵은 room.exploration.bounds([x0,y0,x1,y1]), 아니면 엔진 격자 1..N-1
function mapBox(){try{const r=curRoom(),b=r&&r.exploration&&r.exploration.expanded&&r.exploration.bounds;if(Array.isArray(b)&&b.length>=4&&b.every(Number.isFinite)&&b[2]>b[0]&&b[3]>b[1])return b;}catch(_){}const n=mapN();return [1,1,n-1,n-1];}
function rayLen(x,y,ux,uy){const [x0,y0,x1,y1]=mapBox(),L=TUNE.laser.maxLen;let t=L;if(ux>1e-9)t=Math.min(t,(x1-x)/ux);else if(ux<-1e-9)t=Math.min(t,(x0-x)/ux);if(uy>1e-9)t=Math.min(t,(y1-y)/uy);else if(uy<-1e-9)t=Math.min(t,(y0-y)/uy);return Math.max(0,t);}
function watchViolet(t){let A=null;try{A=window.__STORYWORLD_LAUREN_CELESTIAL_R946__;}catch(_){}if(!A||typeof A.inspect!=='function')return;let v;try{v=A.inspect();}catch(err){fail(err);return;}
 const n=Number(v&&v.stats&&v.stats.procs&&v.stats.procs.violet)||0;if(violetSeen<0||n<violetSeen){violetSeen=n;return;}if(n===violetSeen)return;violetSeen=n;
 const o=P();const a=(v.acts||[]).filter(x=>x.kind==='violet').sort((p,q)=>q.t0-p.t0)[0];if(!o||!a)return;let ux=a.x-o.x,uy=a.y-o.y;const L=Math.hypot(ux,uy);if(!(L>1e-6))return;ux/=L;uy/=L;
 const wait=Math.max(0,TUNE.laser.charge-(t-a.t0));later(wait,()=>{if(!active()||P()!==o)return;const sx=o.x+ux*.9,sy=o.y+uy*.9,base=Math.atan2(uy,ux);
  lasers.push({sx,sy,t0:T(),rays:TUNE.laser.rays.map(d=>{const an=base+d,cx=Math.cos(an),cy=Math.sin(an);return {d,ux:cx,uy:cy,len:rayLen(sx,sy,cx,cy)};}),base,hit:false,seed:++serial,power:ap()});stats.lasers=(stats.lasers||0)+1;});}
function laserHits(z){const W=TUNE.laser.width,done=new Set();for(const e of foes()){for(const r of z.rays){const px=e.x-z.sx,py=e.y-z.sy,along=px*r.ux+py*r.uy;if(along<0||along>r.len)continue;if(Math.abs(px*r.uy-py*r.ux)>W+(e.radius||0))continue;done.add(e);break;}}
 for(const e of done){const big=major(e),v=big?(Number(e.maxHp)||Number(e.hp)||0)*TUNE.laser.bossK:(Number(e.hp)||0)+1;if(!(v>0))continue;inner++;try{if(hitEnemy(e,v,{kind:'r1144-laser',friendly:true,owner:'hero',sourceHero:HERO,r1144:'laser',r946:true,forcedStory:true})!==false){stats.hits++;stats.laserHits=(stats.laserHits||0)+1;if(big)stats.laserBoss=(stats.laserBoss||0)+1;else stats.laserKills=(stats.laserKills||0)+1;}}catch(err){fail(err);}finally{inner--;}}}
function stepLasers(t){lasers=lasers.filter(z=>{const age=t-z.t0;if(!z.hit&&age>=TUNE.laser.hitAt){z.hit=true;laserHits(z);}return age<TUNE.laser.life;});}
// ---- 화상 ----
function ignite(e,power){if(!alive(e)||!(power>0))return false;const B=TUNE.burn,t=T(),b=burns.get(e);
 if(b){b.power=Math.max(b.power,power);b.ticks=0;b.next=t+B.every;b.until=t+B.time;return true;}
 if(burns.size>=B.max)return false;burns.set(e,{power,ticks:0,next:t+B.every,until:t+B.time,t0:t,seed:(stats.ignites*37)%100});stats.ignites++;return true;}
function tickBurns(t){const B=TUNE.burn,n=Math.round(B.time/B.every);for(const [e,b] of burns){if(!alive(e)){burns.delete(e);continue;}
 while(b.next<=t+1e-9&&b.ticks<n&&e.hp>0){b.ticks++;b.next+=B.every;stats.burnTicks++;deal(e,b.power*B.total/n,'burn');}
 if(b.ticks>=n||!alive(e))burns.delete(e);}}
// ---- W: 표식 연쇄 번개 ----
function marked(o){const C=TUNE.chain,t=T();const pool=foes().filter(e=>Number(e.storyWERExposeUntil)>t&&dist(e,o)<=C.reach);const out=[];let at=o;
 while(pool.length&&out.length<C.max){let bi=-1,bd=Infinity;for(let i=0;i<pool.length;i++){const d=dist(pool[i],at);if(d<bd){bd=d;bi=i;}}
  if(bi<0||(out.length&&bd>C.link))break;at=pool.splice(bi,1)[0];out.push(at);}return out;}
function chainPulse(c,n){const o=c.owner,C=TUNE.chain;if(!active()||P()!==o)return;const row=marked(o);if(!row.length)return;stats.pulses++;
 row.forEach((e,i)=>{const from=i?row[i-1]:(row.length===1?o:null);if(from){arcs.push({x0:from.x,y0:from.y,x1:e.x,y1:e.y,t0:T()+i*C.stagger,seed:++serial});stats.links++;}
  later(i*C.stagger,()=>{if(deal(e,c.power*C.k,'chain')!==false&&hits.length<24)hits.push({e,x:e.x,y:e.y,t0:T(),seed:++serial});});});
 if(n+1<C.pulses)later(C.again,()=>chainPulse(c,n+1));}
// ---- E: 주변 적에게 언주 구슬 + 화상 ----
function volley(c){const o=c.owner,V=TUNE.volley;if(!active()||P()!==o)return;
 const row=foes().filter(e=>dist(e,o)<=V.reach+(e.radius||0)&&lineOk(o,e)).sort((a,b)=>dist(a,o)-dist(b,o)).slice(0,V.max);
 for(const e of row){const d=Math.max(.2,dist(e,o));shots.push({sx:o.x,sy:o.y,e,tx:e.x,ty:e.y,t0:T(),dur:d/V.speed,power:c.power,seed:++serial});stats.shots++;}}
function stepShots(t){shots=shots.filter(s=>{if(alive(s.e)){s.tx=s.e.x;s.ty=s.e.y;}if(t-s.t0<s.dur)return true;if(alive(s.e)){if(deal(s.e,s.power*TUNE.volley.k,'orb')!==false)ignite(s.e,s.power);}return false;});}
// ---- R: 영웅 둘레를 도는 언주 구슬 ----
function orbPos(i,t){const O=TUNE.orbit,o=orbit.owner,a=(t-orbit.t0)/O.period*Math.PI*2+i*Math.PI*2/O.n;return {x:o.x+Math.cos(a)*O.radius,y:o.y+Math.sin(a)*O.radius};}
function stepOrbit(t){if(!orbit)return;const O=TUNE.orbit;if(t>=orbit.until||P()!==orbit.owner||!active()){orbit=null;return;}const row=foes();
 for(let i=0;i<O.n;i++){const q=orbPos(i,t);for(const e of row){if(dist(e,q)>O.hitR+(e.radius||0))continue;if(t-(orbit.last.get(e)??-1e9)<O.gap)continue;orbit.last.set(e,t);
  if(deal(e,orbit.power*O.k,'orbit')!==false){stats.orbHits++;ignite(e,orbit.power);}}}}
// ---- 시전 알아채기 ----
function onCast(slot){const o=P();if(!o)return false;const c={slot,owner:o,power:ap(),t0:T()};stats.casts[slot]++;lastRoom=curRoom();
 if(slot==='w')later(TUNE.chain.delay,()=>chainPulse(c,0));
 else if(slot==='e')later(TUNE.volley.delay,()=>volley(c));
 else if(slot==='r')later(TUNE.orbit.delay,()=>{if(active()&&P()===o)orbit={owner:o,power:c.power,t0:T(),until:T()+TUNE.orbit.time,last:new Map()};});
 return true;}
function watch(t){const p=P(),rd=p&&p.storyWER&&p.storyWER.ready;if(!p||!rd||!active()||blockedNow()){prev=null;prevOwner=null;return;}
 const cur={};for(const s of SLOTS){const v=Number(rd[HERO+':'+s]);cur[s]=Number.isFinite(v)?v:-1e9;}
 // 불러오기·저장 복원은 대기만 다시 채우고 시전 자세를 걸지 않는다 → 덧효과 없음
 if(prev&&prevOwner===p&&Number(p.skillAnim)>.3)for(const s of SLOTS)if(cur[s]>t&&cur[s]>prev[s]+.5)onCast(s);
 prev=cur;prevOwner=p;}
function cancel(){hits=[];marks=0;if(lasers.length||jobs.length||arcs.length||shots.length||orbit||burns.size)stats.cancels++;jobs=[];arcs=[];shots=[];orbit=null;burns=new Map();lasers=[];}
function step(){const t=T(),rm=curRoom();if(rm!==lastRoom){if(lastRoom!==null)cancel();lastRoom=rm;}
 if(!active()){cancel();prev=null;prevOwner=null;return;}
 watch(t);askSheets(t);
 if(jobs.length){const due=jobs.filter(j=>j.at<=t+1e-9);if(due.length){jobs=jobs.filter(j=>j.at>t+1e-9);for(const j of due){try{j.fn();}catch(err){fail(err);}}}}
 watchViolet(t);stepLasers(t);stepShots(t);stepOrbit(t);tickBurns(t);arcs=arcs.filter(a=>t-a.t0<TUNE.chain.life);hits=hits.filter(h=>t-h.t0<SHEETS.dhit.n/SHEETS.dhit.fps);marks=markedNow(t).length;}
function markedNow(t){const p=P();if(!p)return [];return foes().filter(e=>Number(e.storyWERExposeUntil)>t&&dist(e,p)<=16);}
function busy(){return marks>0||hits.length>0||lasers.length>0||arcs.length>0||shots.length>0||!!orbit||burns.size>0;}
// ---- 그리기 ----
let sheetsOn=true;
function simg(k){if(!sheetsOn)return null;try{const S=SHEETS[k],r=typeof readyImage==='function'?readyImage(S.path):null,im=r&&r.image;if(!im)return null;const w=im.naturalWidth||im.width||0,h=im.naturalHeight||im.height||0;return w===S.cols*S.cell&&h>=Math.ceil(S.n/S.cols)*(S.ch||S.cell)?im:null;}catch(_){return null;}}
function askSheets(t){if(!sheetsOn||(t-askAt<2&&t>=askAt))return;const miss=Object.keys(SHEETS).filter(k=>!simg(k));if(!miss.length)return;askAt=t;try{if(typeof ensureImages==='function'){const r=ensureImages(miss.map(k=>SHEETS[k].path));if(r&&typeof r.catch==='function')r.catch(()=>{});}}catch(err){fail(err);}}
function sc(o,f){if(typeof ctx!=='undefined'&&ctx&&typeof ctx.scope==='function')ctx.scope(o,f);else f();}
function scale(){const z=typeof zoom==='number'&&zoom>0?zoom:1;return {z,AH:typeof actorHeight==='function'?actorHeight():66*z};}
function cell(k,f){const S=SHEETS[k],ch=S.ch||S.cell;return [(f%S.cols)*S.cell,Math.floor(f/S.cols)*ch,S.cell,ch];}
const own=(id,x,y,extra)=>({id,kind:'effect',pxfSide:'hero',x,y,...extra});
function drawArc(a,t){const age=t-a.t0;if(age<0)return;if(simg('dchain'))return drawArcDots(a,t,age);const C=TUNE.chain,S=SHEETS.chain,{z,AH}=scale(),p0=project(a.x0,a.y0),p1=project(a.x1,a.y1),h=AH*.5,L=Math.hypot(p1.x-p0.x,p1.y-p0.y)||1,ang=Math.atan2(p1.y-p0.y,p1.x-p0.x);
 const im=simg('chain'),mx=(a.x0+a.x1)/2,my=(a.y0+a.y1)/2,id='r1144:chain:'+a.seed;
 if(im){const fr=Math.min(S.n-1,Math.floor(age/C.life*S.n)),k=L/(S.x1-S.x0),ky=Math.max(.95,Math.min(1.5,k*1.3)),/* 짧은 마디도 굵게 읽히게 */[sx,sy,sw,sh]=cell('chain',fr);
  // 밑그림(흑): 밝은 바닥에서도 번개가 읽히게 굵은 그림자를 먼저 깐다. 굽지 않고 brightness(0) 으로 검게(영웅 쪽 표식을 안 달아 페르소나 굽기가 건드리지 않음)
  sc({id:id+':shade',kind:'effect',x:mx,y:my},()=>{ctx.save();try{ctx.filter='brightness(0)';ctx.globalAlpha*=.6;ctx.translate(p0.x,p0.y-h);ctx.rotate(ang);ctx.scale(k,ky*1.7);ctx.drawImage(im,sx,sy,sw,sh,-S.x0,-S.y,S.cell,S.cell);}finally{ctx.restore();}});
  sc(own(id,mx,my+.01,{personaFallback:S.fallback}),()=>{ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.translate(p0.x,p0.y-h);ctx.rotate(ang);ctx.scale(k,ky);ctx.drawImage(im,sx,sy,sw,sh,-S.x0,-S.y,S.cell,S.cell);ctx.globalAlpha*=.6;ctx.drawImage(im,sx,sy,sw,sh,-S.x0,-S.y,S.cell,S.cell);}finally{ctx.restore();}});stats.sheetDraws++;return;}
 // 임시 코드 그림(시트가 읽히기 전): 꺾은선
 sc(own(id,mx,my),()=>{ctx.save();try{const f=1-age/C.life;ctx.translate(p0.x,p0.y-h);ctx.rotate(ang);for(const [col,w,al] of [[INK,6*z,.6],[EONJU,3*z,.9],[EONJU_HOT,1.2*z,.9]]){ctx.globalAlpha=f*al;ctx.strokeStyle='rgba('+col+',1)';ctx.lineWidth=Math.max(1,w);ctx.beginPath();ctx.moveTo(0,0);
   for(let i=1;i<=6;i++)ctx.lineTo(L*i/6,i===6?0:Math.sin(a.seed*12.9+i*4.1)*7*z);ctx.stroke();}}finally{ctx.restore();}});stats.tempDraws++;}
function orbAt(id,wx,wy,d,age,alpha,lift){const q=project(wx,wy);if(simg('dorb')){const S=SHEETS.dorb,fr=Math.floor(Math.max(0,age)*S.fps)%S.n,[sx,sy,sw,sh]=cell('dorb',fr),w=d*256/S.body;
  sc(own(id,wx,wy),()=>{ctx.save();try{ctx.globalAlpha*=alpha;ctx.drawImage(simg('dorb'),sx,sy,sw,sh,q.x-S.piv[0]/256*w,q.y-lift-S.piv[1]/256*w,w,w);}finally{ctx.restore();}});stats.sheetDraws++;return;}
 const S=SHEETS.orb,im=simg('orb');
 sc(own(id,wx,wy),()=>{ctx.save();try{ctx.globalAlpha*=alpha;if(im){const fr=Math.floor(Math.max(0,age)*S.fps)%S.n,[sx,sy,sw,sh]=cell('orb',fr),w=d*256/S.body;ctx.drawImage(im,sx,sy,sw,sh,q.x-S.piv[0]/256*w,q.y-lift-S.piv[1]/256*w,w,w);stats.sheetDraws++;}
   else{ctx.fillStyle='rgba('+EONJU+',.95)';ctx.beginPath();ctx.arc(q.x,q.y-lift,d/2,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba('+EONJU_HOT+',.9)';ctx.beginPath();ctx.arc(q.x-d*.12,q.y-lift-d*.12,d*.22,0,Math.PI*2);ctx.fill();stats.tempDraws++;}}finally{ctx.restore();}});}
function drawShot(s,t){const f=Math.max(0,Math.min(1,(t-s.t0)/Math.max(1e-6,s.dur))),{AH}=scale();if(simg('dtail')){const g=Math.max(0,f-.08);drawTail('r1144:orbtail:'+s.seed,s.sx+(s.tx-s.sx)*f,s.sy+(s.ty-s.sy)*f,s.sx+(s.tx-s.sx)*g,s.sy+(s.ty-s.sy)*g,t-s.t0,.9,AH*.55,AH*.3);}orbAt('r1144:orb:'+s.seed,s.sx+(s.tx-s.sx)*f,s.sy+(s.ty-s.sy)*f,AH*.3,t-s.t0,1,AH*.55);}
function drawOrbit(t){const O=TUNE.orbit,{AH}=scale(),left=orbit.until-t,fade=Math.min(1,(t-orbit.t0)/.2,left/.3);
 if(simg('dorb')&&simg('dtail')){for(let i=0;i<O.n;i++){const q=orbPos(i,t),pq=orbPos(i,t-.06),a=Math.max(0,fade);drawTail('r1144:orbittail:'+i,q.x,q.y,pq.x,pq.y,t-orbit.t0+i*.2,a*.95,AH*.5,AH*.36);orbAt('r1144:orbit:'+i,q.x,q.y,AH*.36,t-orbit.t0+i*.6,a,AH*.5);}return;}
 for(let i=0;i<O.n;i++){for(const [lag,al,sz] of [[.1,.3,.26],[.05,.5,.3],[0,1,.36]]){const q=orbPos(i,t-lag);orbAt('r1144:orbit:'+i+':'+lag,q.x,q.y,AH*sz,t-orbit.t0+i*.3,al*Math.max(0,fade),AH*.5);}}}
function drawBurn(e,b,t){if(simg('dember')){const S=SHEETS.dember,{AH}=scale(),q=project(e.x,e.y),left=b.until-t,al=Math.max(0,Math.min(1,(t-b.t0)/.15,left/.3)),fr=Math.floor((t-b.t0)*S.fps+b.seed)%S.n,[sx,sy,sw,sh]=cell('dember',fr),w=AH*1.05;
  sc(own('r1144:burn:'+b.seed,e.x,e.y+.02),()=>{ctx.save();try{ctx.globalAlpha*=al;ctx.drawImage(simg('dember'),sx,sy,sw,sh,q.x-S.piv[0]/256*w,q.y-S.piv[1]/256*w,w,w);}finally{ctx.restore();}});stats.sheetDraws++;return;}
 const S=SHEETS.burn,{z,AH}=scale(),q=project(e.x,e.y),im=simg('burn'),left=b.until-t,al=Math.max(0,Math.min(1,(t-b.t0)/.15,left/.3));
 sc(own('r1144:burn:'+b.seed,e.x,e.y+.02,{personaFallback:S.fallback}),()=>{ctx.save();try{ctx.globalAlpha*=al*.9;if(im){const fr=Math.floor((t-b.t0)*S.fps+b.seed)%S.n,[sx,sy,sw,sh]=cell('burn',fr),w=AH*1.15;ctx.drawImage(im,sx,sy,sw,sh,q.x-S.piv[0]/256*w,q.y-S.piv[1]/256*w,w,w);stats.sheetDraws++;}
   else{for(let i=0;i<3;i++){const ph=((t*1.6+i*.33+b.seed*.01)%1);ctx.fillStyle='rgba('+(i%2?EONJU_HOT:EONJU)+','+(.7*(1-ph))+')';ctx.beginPath();ctx.arc(q.x+(i-1)*6*z,q.y-AH*(.15+.45*ph),Math.max(1.5,(5-3*ph)*z),0,Math.PI*2);ctx.fill();}stats.tempDraws++;}}finally{ctx.restore();}});}
function drawLaser(z,t){const L=TUNE.laser,S=SHEETS.chain,age=t-z.t0,{z:zm,AH}=scale(),h=AH*.55,im=simg('chain'),grow=Math.min(1,age/L.spread),e=grow*(2-grow),fade=age<L.life-.3?1:Math.max(0,(L.life-age)/.3);
 for(let i=0;i<z.rays.length;i++){const r=z.rays[i],an=z.base+r.d*e,cx=Math.cos(an),cy=Math.sin(an),len=r.len*Math.min(1,age/(L.spread*.8)),ex=z.sx+cx*len,ey=z.sy+cy*len,p0=project(z.sx,z.sy),p1=project(ex,ey),PL=Math.hypot(p1.x-p0.x,p1.y-p0.y);if(!(PL>1))continue;
  const ang=Math.atan2(p1.y-p0.y,p1.x-p0.x),id='r946:violet:laser:'+z.seed+':'+i;
  // 심(임시 코드 선): 굵은 먹 → 언주 → 밝은 심. 페르소나 굽기가 검빨로 맞춘다
  sc(own(id+':core',z.sx+cx*len/2,z.sy+cy*len/2,{groundAligned:false}),()=>{ctx.save();try{for(const [col,w,al] of [[INK,9*zm*LASER_VIS,.55],[EONJU,4.5*zm*LASER_VIS,.9],[EONJU_HOT,1.6*zm*LASER_VIS,.85]]){ctx.globalAlpha=fade*al;ctx.strokeStyle='rgba('+col+',1)';ctx.lineWidth=Math.max(1,w*(1-.4*(1-grow)));ctx.beginPath();ctx.moveTo(p0.x,p0.y-h);ctx.lineTo(p1.x,p1.y-h);ctx.stroke();}}finally{ctx.restore();}});stats.tempDraws++;
  // 결(기존 네온 번개 시트): 줄 따라 이어 붙임
  if(im){const seg=(S.x1-S.x0),n=Math.min(24,Math.ceil(PL/seg)),fr=Math.floor(age*30+i*5)%S.n,[sx,sy,sw,sh]=cell('chain',fr);
   sc(own(id,z.sx+cx*len/2,z.sy+cy*len/2+.01),()=>{ctx.save();try{ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=fade;ctx.translate(p0.x,p0.y-h);ctx.rotate(ang);for(let k=0;k<n;k++){ctx.save();try{ctx.translate(k*seg,0);ctx.scale(1,1.25);ctx.drawImage(im,sx,sy,sw,sh,-S.x0,-S.y,S.cell,S.cell);}finally{ctx.restore();}}}finally{ctx.restore();}});stats.sheetDraws++;}}}
// ---- R1152 Dots 그림 ----
const lerpFade=(age,life,fin,fout)=>Math.max(0,Math.min(1,age/fin,(life-age)/fout));
// 늘린 한 칸 띠(양 끝 edge 화소가 투명으로 줄어드는 시트): 길이 L 을 덮도록 한 칸을 늘리거나, 길면 edge 만큼 겹쳐 잇는다
function band(k,fr,L,s){const S=SHEETS[k],im=simg(k),ch=S.ch||S.cell,seg=(S.cell-S.edge)*s,[sx,sy,sw,sh]=cell(k,fr);
 if(L<=seg*1.6){const kx=(L+S.edge*s)/S.cell;ctx.drawImage(im,sx,sy,sw,sh,-S.edge*s/2,-S.y*s,S.cell*kx,ch*s);return 1;}
 const n=Math.min(40,Math.ceil(L/seg)),kx=L/(n*seg);let d=0;for(let i=0;i<n;i++){ctx.drawImage(im,sx,sy,sw,sh,i*seg*kx-S.edge*s/2,-S.y*s,S.cell*s*kx,ch*s);d++;}return d;}
function drawArcDots(a,t,age){const C=TUNE.chain,S=SHEETS.dchain,{AH}=scale(),p0=project(a.x0,a.y0),p1=project(a.x1,a.y1),h=AH*.5,L=Math.hypot(p1.x-p0.x,p1.y-p0.y)||1,ang=Math.atan2(p1.y-p0.y,p1.x-p0.x);
 const fr=Math.floor(age*S.fps+a.seed)%S.n,al=lerpFade(age,C.life,.05,.2),s=Math.max(.38,Math.min(1.1,AH/150));
 sc(own('r1144:chain:'+a.seed,(a.x0+a.x1)/2,(a.y0+a.y1)/2+.01),()=>{ctx.save();try{ctx.globalAlpha*=al;ctx.translate(p0.x,p0.y-h);ctx.rotate(ang);band('dchain',fr,L,s);ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=.35;band('dchain',fr,L,s);}finally{ctx.restore();}});stats.sheetDraws++;}
function drawMark(e,t){const S=SHEETS.dmark,{AH}=scale(),q=project(e.x,e.y),left=Number(e.storyWERExposeUntil)-t,al=Math.max(0,Math.min(1,left/.3)),fr=Math.floor(t*S.fps+(e.id?String(e.id).length:0))%S.n,
  sz=Number(e.size)||Number(e.scale)||1,w=AH*1.05*Math.max(.8,Math.min(1.8,sz)),lift=AH*Math.max(1,Math.min(2.2,sz))*1.12,[sx,sy,sw,sh]=cell('dmark',fr);
 sc(own('r1144:mark:'+(e.id||''),e.x,e.y+.03),()=>{ctx.save();try{ctx.globalAlpha*=al*.95;ctx.drawImage(simg('dmark'),sx,sy,sw,sh,q.x-S.piv[0]/256*w,q.y-lift-S.piv[1]/256*w,w,w);}finally{ctx.restore();}});stats.sheetDraws++;}
function drawHit(hh,t){const S=SHEETS.dhit,{AH}=scale(),e=hh.e,x=alive(e)?e.x:hh.x,y=alive(e)?e.y:hh.y,q=project(x,y),age=t-hh.t0,fr=Math.min(S.n-1,Math.floor(age*S.fps)),w=AH*1.15,[sx,sy,sw,sh]=cell('dhit',fr);
 sc(own('r1144:hit:'+hh.seed,x,y+.02),()=>{ctx.save();try{ctx.drawImage(simg('dhit'),sx,sy,sw,sh,q.x-S.piv[0]/256*w,q.y-AH*.5-S.piv[1]/256*w,w,w);}finally{ctx.restore();}});stats.sheetDraws++;}
function drawTail(id,wx,wy,px,py,age,alpha,lift,d){const S=SHEETS.dtail,q=project(wx,wy),pq=project(px,py),ang=Math.atan2(q.y-pq.y,q.x-pq.x),s=d*1.5/S.len,fr=Math.floor(age*S.fps)%S.n,[sx,sy,sw,sh]=cell('dtail',fr);
 sc(own(id,wx,wy-.01),()=>{ctx.save();try{ctx.globalAlpha*=alpha;ctx.translate(q.x,q.y-lift);ctx.rotate(ang);ctx.scale(s,s);ctx.drawImage(simg('dtail'),sx,sy,sw,sh,-S.head[0],-S.head[1],S.cell,S.cell);}finally{ctx.restore();}});stats.sheetDraws++;}
function drawLaserDots(z,t){const L=TUNE.laser,age=t-z.t0,{AH}=scale(),h=AH*.55,grow=Math.min(1,age/L.spread),e=grow*(2-grow),fade=age<L.life-.3?1:Math.max(0,(L.life-age)/.3),s=Math.max(.32,Math.min(.9,AH/170))*LASER_VIS,p0=project(z.sx,z.sy);
 const fb=Math.floor(age*SHEETS.lbody.fps),fe=Math.min(SHEETS.lend.n-1,Math.floor(age*SHEETS.lend.n/L.life));
 for(let i=0;i<z.rays.length;i++){const r=z.rays[i],an=z.base+r.d*e,cx=Math.cos(an),cy=Math.sin(an),len=r.len*Math.min(1,age/(L.spread*.8)),ex=z.sx+cx*len,ey=z.sy+cy*len,p1=project(ex,ey),PL=Math.hypot(p1.x-p0.x,p1.y-p0.y);if(!(PL>1))continue;
  const ang=Math.atan2(p1.y-p0.y,p1.x-p0.x),id='r946:violet:laser:'+z.seed+':'+i;
  sc(own(id,z.sx+cx*len/2,z.sy+cy*len/2+.01),()=>{ctx.save();try{ctx.globalAlpha*=fade;ctx.translate(p0.x,p0.y-h);ctx.rotate(ang);band('lbody',(fb+i*3)%SHEETS.lbody.n,PL,s*(.75+.25*grow));}finally{ctx.restore();}});
  if(len>=r.len*.98){const S=SHEETS.lend,[sx,sy,sw,sh]=cell('lend',(fe+i)%S.n),w=S.cell*s*1.25;
   sc(own(id+':end',ex,ey+.02),()=>{ctx.save();try{ctx.globalAlpha*=fade;ctx.translate(p1.x,p1.y-h);ctx.rotate(ang);ctx.drawImage(simg('lend'),sx,sy,sw,sh,-S.piv[0]/256*w,-S.piv[1]/256*w,w,w);}finally{ctx.restore();}});}stats.sheetDraws++;}
 const S=SHEETS.lstart,[sx,sy,sw,sh]=cell('lstart',Math.floor(age*S.fps)%S.n),w=S.cell*s*1.3,ang0=Math.atan2(project(z.sx+Math.cos(z.base),z.sy+Math.sin(z.base)).y-p0.y,project(z.sx+Math.cos(z.base),z.sy+Math.sin(z.base)).x-p0.x);
 sc(own('r946:violet:laser:'+z.seed+':start',z.sx,z.sy+.03),()=>{ctx.save();try{ctx.globalAlpha*=fade;ctx.translate(p0.x,p0.y-h);ctx.rotate(ang0);ctx.drawImage(simg('lstart'),sx,sy,sw,sh,-S.piv[0]/256*w,-S.piv[1]/256*w,w,w);}finally{ctx.restore();}});}
const dotsLaser=()=>!!(simg('lbody')&&simg('lend')&&simg('lstart'));
function draw(){if(typeof project!=='function'||typeof ctx==='undefined'||!ctx)return;const t=T();
 for(const z of lasers){try{if(dotsLaser())drawLaserDots(z,t);else drawLaser(z,t);}catch(err){fail(err);}}
 if(marks&&simg('dmark')){for(const e of markedNow(t)){try{drawMark(e,t);}catch(err){fail(err);}}}
 if(simg('dhit'))for(const hh of hits){try{drawHit(hh,t);}catch(err){fail(err);}}
 for(const [e,b] of burns){try{if(alive(e))drawBurn(e,b,t);}catch(err){fail(err);}}
 for(const a of arcs){try{drawArc(a,t);}catch(err){fail(err);}}
 for(const s of shots){try{drawShot(s,t);}catch(err){fail(err);}}
 if(orbit){try{drawOrbit(t);}catch(err){fail(err);}}stats.draws++;}
const SENT={type:'r1144-persona-wer',x:0,y:0,age:0,life:Infinity,r1144Sentinel:true};
function sentinel(want){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);if(want&&i<0)effects.push(SENT);else if(!want&&i>=0)effects.splice(i,1);SENT.age=0;const p=P();if(want&&p){SENT.x=p.x;SENT.y=p.y;}}catch(_){}}
let wrapped=false;function wrapEffect(){if(wrapped||typeof drawEffect!=='function')return wrapped;const base=drawEffect;
 drawEffect=function(e,...a){if(e&&e.r1144Sentinel){try{ctx.save();try{ctx.globalCompositeOperation='source-over';draw();}finally{ctx.restore();}}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};wrapped=true;return true;}
if(!wrapEffect()&&typeof setTimeout==='function'){let n=0;(function arm(){if(wrapEffect()||++n>40)return;setTimeout(arm,250);})();}
function post(){try{if(typeof started==='undefined'||started)step();}catch(err){fail(err);cancel();}sentinel(busy());}
{const H=window.__STORYWORLD_POST_HOOKS__;if(H&&typeof H.register==='function')H.register('__r1144',{tick(){post();}},fail);
 else if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);post();return r;};}}
function set(v){try{localStorage.setItem(KEY,JSON.stringify({on:v!==false}));}catch(_){}prefAt=-1e9;return on();}
window.__STORYWORLD_PERSONA_WER_R1144__=Object.freeze({revision:REV,tune:TUNE,sheets:SHEETS,set,on:()=>on(),active:()=>active(),
 qaCast:s=>SLOTS.includes(s)&&active()?onCast(s):false,qaSheets:v=>{sheetsOn=v!==false;return sheetsOn;},
 inspect:()=>({revision:REV,on:prefOn,marks,hits:hits.length,dots:Object.fromEntries(Object.keys(SHEETS).filter(k=>SHEETS[k].dots).map(k=>[k,!!simg(k)])),active:active(),jobs:jobs.length,arcs:arcs.length,shots:shots.length,orbit:!!orbit,burning:burns.size,lasers:lasers.map(z=>({sx:+z.sx.toFixed(2),sy:+z.sy.toFixed(2),age:+(T()-z.t0).toFixed(2),hit:z.hit,rays:z.rays.map(r=>[+r.ux.toFixed(2),+r.uy.toFixed(2),+r.len.toFixed(1)])})),
  sheets:Object.fromEntries(Object.keys(SHEETS).map(k=>[k,{path:SHEETS[k].path,ready:!!simg(k)}])),stats:{...stats,casts:{...stats.casts}}})});
})();
