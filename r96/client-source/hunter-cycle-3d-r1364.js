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
//  끄기: localStorage storyworld.r1364.hunterCycle = {"on":false} (R1336 은 예전처럼 다 당긴 자세 한 장).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HUNTER_CYCLE_R1364__)return;
const REV='R1364-hunter-cycle-1',KEY='storyworld.r1364.hunterCycle',HERO='hunter',DRAW_LIFT=18,HALF=.25;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={releases:0,skills:0,moved:0,kept:0,blocked:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,200);};
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
const me=()=>{try{return typeof player==='object'&&!!player&&player.hero===HERO&&player.r720Ally!==true&&!(+player.samong>0)&&!player.personaHeroR1113&&!player.egoSovereignR1046&&solo();}catch(_){return false;}};
const shown3d=()=>{try{const i=window.__STORYWORLD_HWANDO3D_R1302__?.inspect?.();return !!(i&&i.hero===HERO&&i.shown);}catch(_){return false;}};
// 놓기 기록
const cyc={at:-9,P:.4,skillAt:-9,skillUntil:-9,prevSk:0,prevUl:0};
function release(t,P,skill){if(t-cyc.at<.03&&!skill)return;const gap=t-cyc.at;cyc.P=clamp(gap>=.15&&gap<=.9?gap:fin(P,.4),.15,.9);if(skill)cyc.P=clamp(fin(P,.5),.15,.9);cyc.at=t;stats.releases++;}
function pollSkill(){try{if(!me())return;const sk=+player.skillAnim||0,ul=+player.ultimateAnim||0,t=now();
 if(sk>cyc.prevSk+1e-6||ul>cyc.prevUl+1e-6){if(t-cyc.skillAt>.25){cyc.skillAt=t;stats.skills++;release(t,.5,true);}cyc.skillUntil=t+Math.max(.5,Math.max(sk,ul)+.1);}
 if(sk>0||ul>0)cyc.skillUntil=Math.max(cyc.skillUntil,t+.1);cyc.prevSk=sk;cyc.prevUl=ul;}catch(e){fail(e);}}
// R1336 이 그리기 직전에 묻는다: {on, skillW(스킬 중 활 자세 가중치), ...phase}
// 검사·심사용: pin(u) 로 주기 위치(0~1, 주기 .5초)를 고정해 그 단계 자세를 계속 그림, pin(null) 로 풀기
let pinned=null;
function state(){pollSkill();const t=now();if(!prefs.on)return{on:false,skillW:0,...phase(NaN,.4)};if(pinned!==null)return{on:true,skillW:1,at:t-pinned*.5,P:.5,...phase(pinned*.5,.5)};
 const skillW=t<cyc.skillUntil?clamp((t-cyc.skillAt)/.05,0,1):clamp(1-(t-cyc.skillUntil)/.12,0,1);
 return{on:true,skillW,at:cyc.at,P:cyc.P,...phase(t-cyc.at,cyc.P)};}
// 기본 화살: 표적·발사 기록·3D 출발점
let pending=null;
function aimNow(){const h=typeof HEROES!=='undefined'&&HEROES?.[HERO];const e=typeof nearestEnemy==='function'?nearestEnemy(fin(h&&h.range,8.3)):null;return e?{x:e.x,y:e.y}:null;}
function wrapAttack(){if(typeof basicAttack!=='function'||basicAttack.r1364)return;const base=basicAttack;const w=function(...a){if(!me())return base.apply(this,a);const prev=pending;try{pending={body:player,target:aimNow(),cd:null};}catch(e){fail(e);pending=null;}
  try{return base.apply(this,a);}finally{pending=prev;}};w.r1364=true;basicAttack=w;}
function place(s){const api=window.__STORYWORLD_HUNTER_DRAW_R1336__,a=api?.anchor?.();if(!a||!pending.target)return false;
 const T=a.T,cam=window.__STORYWORLD_PHASE1__?.controller?.state?.three?.camera;if(!T||!cam||typeof W!=='number'||typeof H!=='number')return false;
 const px=v=>{const q=new T.Vector3().fromArray(v).project(cam);return[(q.x+1)/2*W,(1-q.y)/2*H];},A=px(a.anchor),O=px(a.origin);if(![...A,...O].every(Number.isFinite))return false;
 const want=(typeof actorHeight==='function'?fin(actorHeight(),0):0)*fin(window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.standRatio,.98);
 const L=launch3d(player,{dx:A[0]-O[0],dy:A[1]-O[1]},{zoom:typeof zoom==='number'?zoom:1,TILE:typeof TILE==='number'?TILE:64,half:want*HALF},s,pending.target);if(!L)return false;
 if(typeof blocked==='function'&&blocked(L.x,L.y,s.radius||.14)){stats.blocked++;return false;}
 s.x=s.px=L.x;s.y=s.py=L.y;s.vx=L.vx;s.vy=L.vy;if(Number.isFinite(L.life))s.life=L.life;s.r1364Nock=true;stats.moved++;return true;}
function wrapShot(){if(typeof makeShot!=='function'||makeShot.r1364)return;const base=makeShot;const w=function(...a){const s=base.apply(this,a);
  try{if(pending&&s&&s.friendly&&s.owner==='hero'&&s.r160Basic&&player===pending.body&&me()){release(now(),Math.max(.15,fin(+player.attackCD,.4)),false);if(prefs.on&&shown3d()){if(!place(s))stats.kept++;}}}catch(e){fail(e);}return s;};
 w.r1364=true;makeShot=w;}
function install(){try{wrapAttack();wrapShot();}catch(e){fail(e);}}
try{if(document.readyState==='complete')install();else window.addEventListener('load',install);}catch(e){fail(e);}
function set(on){prefs.on=!!on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return prefs.on;}
window.__STORYWORLD_HUNTER_CYCLE_R1364__=Object.freeze({revision:REV,CUT,phase,launch3d,screenToGround,state,release,set,pin:u=>{pinned=Number.isFinite(u)?Math.max(0,u):null;return pinned;},on:()=>prefs.on,install,
 inspect:()=>({revision:REV,prefs:{...prefs},cycle:{...cyc},stats:{...stats},lastError,browser:false,GPU:false})});
})();
