// R1364 3D 헌터 활시위: 놓기 반동 → 화살 다시 걸기 → 당기기 → 조준 정지 순환 + 시위 위치에서 화살 발사
//  (사용자 2026-11-27 06:36Z "헌터영웅이 확실하게 활시위를 땡겨서 스킬과 공격을 하도록 모션개선")
//  헤드리스 실측(qa/r1364/review.md):
//   ① R1336 은 공격 가중치만큼 '다 당긴 자세' 한 장을 덧씌워서, 연사하는 동안 손이 얼굴 옆에 얼어 있었다(손-활 손잡이 거리 0.59 고정, 놓기·다시 당기기 없음).
//   ② 스킬(Q·W·E·R)은 skillAnim 만 올라 R1302 3D 공격 가중치가 0 → 3D 헌터는 스킬 내내 대기 자세였다(활 자세 0/33장).
//   ③ 기본 화살 출발점은 R1102 가 2D 공격 그림(R425 좌·우 7칸)의 시위 픽셀로 잡아, 3D 시위 기준점과 영웅 키 0.26~0.38배 어긋났다.
//  고침:
//   · 이 파일은 '놓는 순간'을 잰다: 조종 헌터의 기본 화살이 실제로 만들어진 게임 시각, 스킬·궁극기 시작 시각. 놓은 뒤 경과/주기로
//     손 자리 가중치(기준점 anchor·반동 follow·화살 걸기 nock)·활 손 반동·시위 잡음 정도를 내 준다(phase, 순수 함수).
//     주기 = 앞 발사와의 간격(0.15~0.9초), 처음엔 공격 쿨다운. 쏘는 박자·피해·판정은 그대로(그림만 박자에 맞춘다).
//   · 실제 자세는 R1336(hunter-draw-3d-r1336.js)이 이 값을 받아 그린다(손 IK, 시위 휨, 그린 뒤 되돌림).
//   · 3D 헌터가 보일 때 기본 화살은 R1336 이 잰 3D 시위 기준점(다 당긴 손 자리)의 화면 위치에서 꼬리(오늬)가 나가게 옮긴다
//     (R1102 위에서 한 번 더, 같은 표적·분산 각 유지, 수명은 늘거나 준 거리만큼). 2D 헌터·협동·사몽 변신·벽 안이면 R1102 그대로.
//  R1384b(사용자 2026-11-28 08:37Z "헌터모션 활이 장전된후 놓으면 활이 나가게 지금은 반대인듯"):
//   예전엔 기본 공격을 누르는 순간 화살이 날고 그 뒤에 걸기→당기기→정지가 나와, 쏜 다음 장전하는 꼴이었다(한 발·첫 발은 늘, 헤드리스 실측).
//   · 3D 헌터가 보일 때 기본 화살은 만든 즉시 날리지 않고 projectiles 밖에 잠깐 들고 있다가(당기기 시간 lead = 공격 간격의 절반, .1~.2초)
//     걸기→당기기→조준 정지를 마친 '놓는 순간' 시위 자리에서 날린다(그때 표적 자리로 다시 겨눔). 누른 간격 = 나는 간격이라 연사 박자·피해는 그대로, 첫 화살만 lead 만큼 늦다.
//   · 놓은 뒤에는 놓기→반동→되돌림→걸기(활 곁에서 화살을 건 채 대기)까지만 — 다음 공격이 와야 당긴다(쏜 뒤 저절로 다시 당겨 정지하지 않음). 스킬도 같다.
//   · 방이 바뀌면 들고 있던 화살은 버린다. 2D 헌터·끄기·협동·사몽 변신이면 예전처럼 바로 난다.
//  끄기: localStorage storyworld.r1364.hunterCycle = {"on":false} (R1336 은 예전처럼 다 당긴 자세 한 장, 화살은 바로 남).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HUNTER_CYCLE_R1364__)return;
const REV='R1364-hunter-cycle-2-r1384b',KEY='storyworld.r1364.hunterCycle',HERO='hunter',DRAW_LIFT=18,HALF=.25;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={releases:0,skills:0,moved:0,kept:0,blocked:0,held:0,launched:0,dropped:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,200);};
const fin=(v,d=0)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),ease=u=>{u=clamp(u,0,1);return u*u*(3-2*u);};
// 한 주기(놓은 뒤 경과 dt, 주기 P) 안의 손 자리 가중치. 합 = 1. str = 시위를 손에 쥔 정도(1 = 손을 따라 휨, 0 = 놓여서 곧음)
//  [0,.10P) 놓기: 기준점 → 뒤로 빠짐(반동)   [.10P,.18P) 반동 유지   [.18P,.36P) 활 곁으로 손 되돌림
//  [.36P,.42P) 화살 걸기(활 곁 정지)        [.42P,.78P) 당기기(활 곁 → 기준점)   [.78P,…) 조준 정지(기준점)
const CUT=Object.freeze({snap:.10,follow:.18,back:.36,nock:.42,draw:.78,recoil:.30});
function phase(dt,P){P=clamp(fin(P,.4),.15,.9);if(!(Number.isFinite(dt)&&dt>=0))return{wa:1,wf:0,wn:0,str:1,recoil:0,stage:'hold'};const u=dt/P,C=CUT,recoil=u<C.recoil?(1-u/C.recoil)**2:0;
 if(u<C.snap){const k=ease(u/C.snap);return{wa:1-k,wf:k,wn:0,str:0,recoil,stage:'release'};}
 if(u<C.follow)return{wa:0,wf:1,wn:0,str:0,recoil,stage:'follow'};
 if(u<C.back){const k=ease((u-C.follow)/(C.back-C.follow));return{wa:0,wf:1-k,wn:k,str:0,recoil,stage:'return'};}
 if(u<C.nock)return{wa:0,wf:0,wn:1,str:1,recoil,stage:'nock'};
 if(u<C.draw){const k=ease((u-C.nock)/(C.draw-C.nock));return{wa:k,wf:0,wn:1-k,str:1,recoil,stage:'draw'};}
 return{wa:1,wf:0,wn:0,str:1,recoil,stage:'hold'};}
// R1384b 실제 시간 흐름(순수 함수): lead={req,rel} 이면 누른 뒤 당기기(걸기 15% → 당기기 45% → 조준 정지 40%), 아니면 마지막 놓기(at) 뒤
//  놓기 .06초 → 반동 유지 .10초 → 되돌림 .20초 → 걸기(대기). 다음 누름 전까지 다시 당기지 않는다. 쏜 적 없거나 .45초 넘게 지났으면 조준 정지(공격 자세만 켜진 경우 — 한 발이면 그 전에 공격 자세가 끝남).
//  이미 조준 정지(다 당김)인 채로 누르면 다시 걸지 않고 .06초 뒤 바로 놓는다(lead.aimed).
const LEAD=Object.freeze({min:.05,max:.2,frac:.5,nock:.15,hold:.6,aimed:.06,skill:.1,again:.12,aimAfter:.45}),POST=Object.freeze({snap:.06,follow:.10,back:.20,recoil:.12});
const leadFor=cd=>clamp(fin(cd,.39)*LEAD.frac,LEAD.min,LEAD.max);
// 놓은 뒤 동작 배율: 공격 간격에서 당기기를 뺀 시간 안에 되돌림까지 끝나게(빠른 연사에선 짧게, .25~1)
const postFor=cd=>clamp((fin(cd,.39)-leadFor(cd))/POST.back,.25,1);
function timeline(t,lead,at,ps,again){const AIM={wa:1,wf:0,wn:0,str:1,recoil:0,stage:'hold'};const k0=Number.isFinite(ps)?clamp(ps,.25,1):1,Q={snap:POST.snap*k0,follow:POST.follow*k0,back:POST.back*k0,recoil:POST.recoil*k0};const N={wa:0,wf:0,wn:1,str:1,recoil:0,stage:'nock'};if(!Number.isFinite(t))return N;
 if(lead&&Number.isFinite(lead.req)&&Number.isFinite(lead.rel)&&t>=lead.req-1e-9&&t<lead.rel){if(lead.aimed)return AIM;const k=(t-lead.req)/Math.max(1e-3,lead.rel-lead.req);
  if(k<LEAD.nock)return N;if(k<LEAD.hold){const e=ease((k-LEAD.nock)/(LEAD.hold-LEAD.nock));return{wa:e,wf:0,wn:1-e,str:1,recoil:0,stage:'draw'};}return{wa:1,wf:0,wn:0,str:1,recoil:0,stage:'hold'};}
 const dt=t-at;if(!(Number.isFinite(dt)&&dt>=0)||dt>=LEAD.aimAfter)return AIM;const recoil=dt<Q.recoil?(1-dt/Q.recoil)**2:0;
 if(dt<Q.snap){const k=ease(.5+.5*dt/Q.snap);return{wa:1-k,wf:k,wn:0,str:0,recoil,stage:'release'};}/* 놓는 그 그림부터 손이 절반 뒤로 튐(시위를 놓은 손이 기준점에 머문 그림이 남지 않게) */
 if(dt<Q.follow)return{wa:0,wf:1,wn:0,str:0,recoil,stage:'follow'};
 if(dt<Q.back){const k=ease((dt-Q.follow)/(Q.back-Q.follow));return{wa:0,wf:1-k,wn:k,str:0,recoil,stage:'return'};}
 // 여러 발 스킬(일제 사격 등)이 아직 화살을 내는 중이면 되돌린 뒤 다시 당겨 다음 화살을 기다린다(R1384c)
 if(again){const k=(dt-Q.back)/LEAD.again;if(k<LEAD.nock)return N;if(k<LEAD.hold){const e=ease((k-LEAD.nock)/(LEAD.hold-LEAD.nock));return{wa:e,wf:0,wn:1-e,str:1,recoil:0,stage:'draw'};}return AIM;}return N;}
// 화면 오프셋(px) → 땅 좌표(엔진 project 의 역, R1102 와 같은 식)
function screenToGround(o,rx,ry,TILE,zoom){const T=fin(TILE,64)*Math.max(.05,fin(zoom,1)),a=fin(rx)/T,b=fin(ry)/(T*.5);return{x:fin(o&&o.x)+(a+b)/2,y:fin(o&&o.y)+(b-a)/2};}
// 3D 시위 기준점 화면 오프셋 off={dx,dy}(영웅 발 기준 px) 에서 꼬리가 나가게: 탄 자리 = 기준점 + 겨눈 쪽으로 화살 반 길이(half px), 그리기 높이(18·zoom) 보정
function launch3d(foot,off,geo,s,target){
 if(![foot&&foot.x,foot&&foot.y,off&&off.dx,off&&off.dy,s&&s.x,s&&s.y,s&&s.vx,s&&s.vy,target&&target.x,target&&target.y].every(Number.isFinite))return null;
 const sp=Math.hypot(s.vx,s.vy);if(!(sp>0))return null;const z=Math.max(.05,fin(geo&&geo.zoom,1)),T0=fin(geo&&geo.TILE,64)*z,ddx=target.x-foot.x,ddy=target.y-foot.y,sx=(ddx-ddy)*T0,sy=(ddx+ddy)*T0*.5,sl=Math.hypot(sx,sy),half=Math.max(0,fin(geo&&geo.half));
 const hx=sl>1e-9?sx/sl*half:0,hy=sl>1e-9?sy/sl*half:0,g=screenToGround(foot,off.dx+hx,off.dy+hy+DRAW_LIFT*z,geo&&geo.TILE,z);
 const old=Math.atan2(s.vy,s.vx),aimOld=Math.atan2(target.y-s.y,target.x-s.x),spread=Math.atan2(Math.sin(old-aimOld),Math.cos(old-aimOld)),na=Math.atan2(target.y-g.y,target.x-g.x)+spread,
  dOld=Math.hypot(target.x-s.x,target.y-s.y),dNew=Math.hypot(target.x-g.x,target.y-g.y);if(![g.x,g.y,na].every(Number.isFinite))return null;
 return{x:g.x,y:g.y,vx:Math.cos(na)*sp,vy:Math.sin(na)*sp,life:Number.isFinite(s.life)?Math.max(.001,s.life+(dNew-dOld)/sp):s.life};}
const now=()=>typeof time==='number'?time:performance.now()/1000;
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
let mainBody=null;// 그릴 때의 player = 조종 영웅 몸(R952 사냥 분대 분신은 update 중에만 player 로 끼워짐)
const me=()=>{try{return typeof player==='object'&&!!player&&(!mainBody||player===mainBody)&&player.hero===HERO&&player.r720Ally!==true&&!(+player.samong>0)&&!player.personaHeroR1113&&!player.egoSovereignR1046&&solo();}catch(_){return false;}};
const shown3d=()=>{try{const i=window.__STORYWORLD_HWANDO3D_R1302__?.inspect?.();return !!(i&&i.hero===HERO&&i.shown);}catch(_){return false;}};
// 놓기 기록
const cyc={at:-9,P:.4,ps:1,skillAt:-9,skillUntil:-9,skillShot:-9,prevSk:0,prevUl:0};
function release(t,P,skill){if(t-cyc.at<.03&&!skill)return;const gap=t-cyc.at;cyc.P=clamp(gap>=.15&&gap<=.9?gap:fin(P,.4),.15,.9);if(skill)cyc.P=clamp(fin(P,.5),.15,.9);cyc.at=t;cyc.ps=1;stats.releases++;}
function pollSkill(){try{if(!me())return;const sk=+player.skillAnim||0,ul=+player.ultimateAnim||0,t=now();
 if(sk>cyc.prevSk+1e-6||ul>cyc.prevUl+1e-6){if(t-cyc.skillAt>.25){cyc.skillAt=t;stats.skills++;
   // R1384b 스킬: 시전 순간 다 당긴 조준 정지 → 첫 스킬 화살이 생기는 그 순간 놓기(화살이 없으면 .1초 뒤). 스킬 화살은 여러 오버레이가
   //  만든 뒤 projectiles 에서 찾아 쓰므로(R535 창·폭풍) 들고 있지 않고, 대신 놓기를 화살에 맞춘다(R1384c, 7분야 9.04 감점 '첫 화살 .1초 앞섬').
   if(lead)flush(true);if(prefs.on&&shown3d())lead={req:t,rel:t+LEAD.skill,aimed:true,skill:true,ps:1,room:curRoom(),shots:[]};else release(t,.5,true);}
  cyc.skillUntil=t+Math.max(.5,Math.max(sk,ul)+.1);}
 if(sk>0||ul>0)cyc.skillUntil=Math.max(cyc.skillUntil,t+.1);cyc.prevSk=sk;cyc.prevUl=ul;}catch(e){fail(e);}}
// R1336 이 그리기 직전에 묻는다: {on, skillW(스킬 중 활 자세 가중치), ...phase}
// 검사·심사용: pin(u) 로 주기 위치(0~1, 주기 .5초)를 고정해 그 단계 자세를 계속 그림, pin(null) 로 풀기
let pinned=null;
function state(){try{if(typeof player==='object'&&player)mainBody=player;}catch(_){}pollSkill();flush(false);const t=now();if(!prefs.on)return{on:false,skillW:0,...phase(NaN,.4)};if(pinned!==null)return{on:true,skillW:1,at:t-pinned*.5,P:.5,...phase(pinned*.5,.5)};
 const skillW=t<cyc.skillUntil?clamp((t-cyc.skillAt)/.05,0,1):clamp(1-(t-cyc.skillUntil)/.12,0,1);
 return{on:true,skillW,at:cyc.at,P:cyc.P,lead:lead?{req:lead.req,rel:lead.rel}:null,...timeline(t,lead,cyc.at,cyc.ps,volley(t))};}
const volley=t=>t<cyc.skillUntil&&t-cyc.skillShot<.25;
// 기본 화살: 표적·발사 기록·3D 출발점
let pending=null;
function aimNow(){const h=typeof HEROES!=='undefined'&&HEROES?.[HERO];const e=typeof nearestEnemy==='function'?nearestEnemy(fin(h&&h.range,8.3)):null;return e?{x:e.x,y:e.y,e}:null;}
function wrapAttack(){if(typeof basicAttack!=='function'||basicAttack.r1364)return;const base=basicAttack;const w=function(...a){if(!me())return base.apply(this,a);const prev=pending;try{pending={body:player,target:aimNow(),cd:null};}catch(e){fail(e);pending=null;}
  try{return base.apply(this,a);}finally{pending=prev;}};w.r1364=true;basicAttack=w;}
function place(s,target){const api=window.__STORYWORLD_HUNTER_DRAW_R1336__,a=api?.anchor?.();if(!a||!target)return false;
 const T=a.T,cam=window.__STORYWORLD_PHASE1__?.controller?.state?.three?.camera;if(!T||!cam||typeof W!=='number'||typeof H!=='number')return false;
 const px=v=>{const q=new T.Vector3().fromArray(v).project(cam);return[(q.x+1)/2*W,(1-q.y)/2*H];},A=px(a.anchor),O=px(a.origin);if(![...A,...O].every(Number.isFinite))return false;
 const want=(typeof actorHeight==='function'?fin(actorHeight(),0):0)*fin(window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.standRatio,.98);
 const L=launch3d(player,{dx:A[0]-O[0],dy:A[1]-O[1]},{zoom:typeof zoom==='number'?zoom:1,TILE:typeof TILE==='number'?TILE:64,half:want*HALF},s,target);if(!L)return false;
 if(typeof blocked==='function'&&blocked(L.x,L.y,s.radius||.14)){stats.blocked++;return false;}
 s.x=s.px=L.x;s.y=s.py=L.y;s.vx=L.vx;s.vy=L.vy;if(Number.isFinite(L.life))s.life=L.life;s.r1364Nock=true;stats.moved++;return true;}
function wrapShot(){if(typeof makeShot!=='function'||makeShot.r1364)return;const base=makeShot;const w=function(...a){const s=base.apply(this,a);
  try{if(pending&&s&&s.friendly&&s.owner==='hero'&&s.r160Basic&&player===pending.body&&me()){const t=now(),on3d=prefs.on&&shown3d();if(on3d){if(!place(s,pending.target))stats.kept++;}
   if(on3d&&hold(s,t))return s;release(t,Math.max(.15,fin(+player.attackCD,.4)),false);emit(s);}
  else if(s&&s.friendly&&s.owner==='hero'&&!s.r160Basic&&me()&&prefs.on){pollSkill();skillShot(now());}}catch(e){fail(e);}return s;};
 w.r1364=true;makeShot=w;}
// R1384c 스킬 화살이 생기는 순간: 스킬 첫 조준 정지면 바로 놓고, 일제 사격 중 다시 당겨 둔 상태면 또 놓는다(화살이 놓기보다 앞서지 않게)
function skillShot(t){if(!(t<cyc.skillUntil))return;cyc.skillShot=t;if(lead&&lead.skill){flush(true);return;}
 if(lead)return;const st=timeline(t,null,cyc.at,cyc.ps,true).stage;if(t-cyc.at>=.12&&(st==='hold'||st==='draw'||st==='nock'))release(t,.5,true);}
// 기본 화살이 실제로 날기 시작한 순간 알림(검사·심사용: 쏘는 순간 = 날기 시작)
const listeners=new Set();function emit(s){for(const f of listeners){try{f(s);}catch(e){fail(e);}}}
// R1384b 당기는 동안 화살을 projectiles 밖에 들고 있다가 놓는 순간 날린다
let lead=null;
const curRoom=()=>{try{return typeof room==='object'?room:null;}catch(_){return null;}};
const shots=()=>{try{return typeof projectiles!=='undefined'&&Array.isArray(projectiles)?projectiles:null;}catch(_){return null;}};
function aiming(t){try{const w=+window.__STORYWORLD_HWANDO3D_R1302__?.inspect?.()?.weights?.attack;return w>.5&&!lead&&timeline(t,null,cyc.at,cyc.ps).stage==='hold';}catch(_){return false;}}
function hold(s,t){const P=shots();if(!P)return false;const i=P.lastIndexOf(s);if(i<0)return false;
 if(lead&&(lead.skill||!(Math.abs(lead.req-t)<1e-9)))flush(true);
 if(!lead){const cd=+player.attackCD,aimed=aiming(t);lead={req:t,rel:t+(aimed?LEAD.aimed:leadFor(cd)),aimed,ps:postFor(cd),room:curRoom(),shots:[]};}
 P.splice(i,1);const tg=pending&&pending.target;lead.shots.push({s,target:tg?{x:tg.x,y:tg.y}:null,enemy:tg&&tg.e||null});stats.held++;return true;}
function flush(force){if(!lead)return;const t=now(),live=prefs.on&&shown3d()&&me();if(!force&&live&&t<lead.rel&&curRoom()===lead.room)return;const L=lead;lead=null;
 const P=shots();if(!P||curRoom()!==L.room){stats.dropped+=L.shots.length;return;}
 for(const it of L.shots){try{const e=it.enemy,tg=e&&e.hp>0&&Number.isFinite(e.x)&&Number.isFinite(e.y)?{x:e.x,y:e.y}:it.target;if(live&&tg)place(it.s,tg);P.push(it.s);stats.launched++;emit(it.s);}catch(err){fail(err);}}
 if(L.skill){release(t,.5,true);return;}release(t,Math.max(.15,fin(+player.attackCD,.4)+(t-L.req)),false);cyc.ps=L.ps;}
// R1384c 놓기는 게임 틱 안에서: 그리기(draw) 전에 화살을 넣어야 놓는 그림에 화살이 시위에서 보인다(그리기 도중 넣으면 한 그림 늦게 활 아래에서 나타남)
function wrapTick(){try{if(typeof tick!=='function'||tick.r1364)return;const base=tick;const w=function(...a){const r=base.apply(this,a);try{flush(false);}catch(e){fail(e);}return r;};try{for(const k of Object.keys(base))w[k]=base[k];}catch(_){}w.r1364=true;tick=w;}catch(e){fail(e);}}
function install(){try{wrapAttack();wrapShot();wrapTick();}catch(e){fail(e);}}
try{setInterval(()=>{try{flush(false);}catch(e){fail(e);}},8);}catch(_){}
try{if(document.readyState==='complete')install();else window.addEventListener('load',install);}catch(e){fail(e);}
function set(on){prefs.on=!!on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return prefs.on;}
window.__STORYWORLD_HUNTER_CYCLE_R1364__=Object.freeze({revision:REV,CUT,LEAD,POST,leadFor,postFor,timeline,flush:()=>flush(true),onLaunch:f=>{if(typeof f==='function')listeners.add(f);return()=>listeners.delete(f);},phase,launch3d,screenToGround,state,release,set,pin:u=>{pinned=Number.isFinite(u)?Math.max(0,u):null;return pinned;},on:()=>prefs.on,install,
 inspect:()=>({revision:REV,prefs:{...prefs},cycle:{...cyc},lead:lead?{req:lead.req,rel:lead.rel,shots:lead.shots.length}:null,stats:{...stats},lastError,browser:false,GPU:false})});
})();
