/* R1102 헌터 기본 화살을 활 손잡이에서 (사용자 2026-11-16 06:12Z "헌터 기본화살이 너무크고 활에서 안나가는 문제 개선 및 헌터 공격및 스킬시전시 항상 공격모션나가도록")
 * 헤드리스 측정(qa/r1102/review.md, 생존 판 반자동):
 *  ① 엔진은 기본 화살을 영웅 발밑 땅 좌표에서 내보내고 R912 가 그 탄 자리 18px 위에 그린다 → 화면에서는 허리 아래에서 나가
 *     R425 공격 그림(활을 어깨높이로 당겼다 놓는 좌·우 7칸)의 활 손잡이와 영웅 키 0.40배(중앙값) 떨어져 있었다.
 *  ② 고침: 쏘는 순간 R425 가 그릴 쪽(좌·우)의 놓기 칸 활 손잡이 픽셀(오른쪽 145·79, 왼쪽 46·79, 발 기준점 72·235 / 120·235, 몸 201px)을
 *     영웅 화면 키에 맞춰 화면 오프셋으로 옮기고, 탄 그리기 높이(18·zoom)를 더해 땅 좌표로 되돌려 탄을 거기서 내보낸다.
 *     같은 표적을 향하게 각도만 다시 맞추고(분산 사격 ±0.14 차이 유지) 수명은 늘거나 준 거리만큼만 보정한다.
 *  ③ 쏘는 쪽(좌·우)은 실제로 겨눈 표적의 화면 가로 차이로 정하고 R425 가 같은 값을 쓰게 한다(그림과 화살이 같은 쪽).
 *  판정 반경·피해·탄속 크기·관통·연사 간격은 그대로. 벽 안이면 엔진 출발점 유지. 사몽 변신·협동·R425 헌터 그림 끔이면 그대로.
 *  생존 배치·사냥 분대 헌터 몸(r720Ally)도 몸마다 따로 같은 규칙. 화살 크기(0.80→0.50배)는 projectile-sheets-r912.js 표에서 바꾼다.
 *  다른 덧그림보다 바깥에서 감싸야 해서(R160 이 basicAttack·makeShot 을 먼저 감쌈) 페이지가 다 올라온 뒤 감싼다.
 *  설정 storyworld.r1102.hunterAim {"on":false} 로 끄면 예전 그대로. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_HUNTER_AIM_R1102__)return;
const REV='R1102-hunter-aim-1',KEY='storyworld.r1102.hunterAim',HERO='hunter';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={swings:0,shots:0,moved:0,blocked:0,skipped:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const fin=(v,d=0)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
// R425 assets/r425/hunter/attack-{r,l}.webp 놓기(5번째) 칸에서 잰 활 손잡이(화살이 떠나는 곳)·발 기준점(index.json anchor)·몸 키(index.json body)
const GRIP=Object.freeze({r:Object.freeze({x:145,y:79,ax:72,ay:235}),l:Object.freeze({x:46,y:79,ax:120,ay:235})}),BODY=201,DRAW_LIFT=18;
function grip(side,k){const g=GRIP[side==='l'?'l':'r'];if(!(Number.isFinite(k)&&k>0))return{dx:0,dy:0};return{dx:(g.x-g.ax)*k,dy:(g.y-g.ay)*k};}
// R425 huntSide 와 같은 규칙: 화면 가로 차가 2px 넘으면 그쪽, 아니면 보는 방향(좌·우), 그것도 아니면 지난 쪽(없으면 오른쪽)
function sideOf(dx,dir,last){if(Number.isFinite(dx)&&Math.abs(dx)>2)return dx<0?'l':'r';return dir==='left'?'l':dir==='right'?'r':last==='l'?'l':'r';}
// 화면 오프셋(rx,ry px) → 땅 좌표: 엔진 project(x,y)=((x−y)·TILE·zoom, (x+y)·TILE·.5·zoom) 의 역
function screenToGround(o,rx,ry,TILE,zoom){const T=fin(TILE,64)*Math.max(.05,fin(zoom,1)),a=fin(rx)/T,b=fin(ry)/(T*.5);return{x:fin(o&&o.x)+(a+b)/2,y:fin(o&&o.y)+(b-a)/2};}
// 발사점·속도·수명(순수): foot = 영웅 땅 좌표, geo = {side,k,lift,zoom,TILE}, s = 엔진이 만든 탄 {x,y,vx,vy,life}, target = 겨눈 땅 좌표
function launch(foot,geo,s,target){
 if(![foot&&foot.x,foot&&foot.y,s&&s.x,s&&s.y,s&&s.vx,s&&s.vy,target&&target.x,target&&target.y].every(Number.isFinite))return null;
 const sp=Math.hypot(s.vx,s.vy);if(!(sp>0))return null;const z=Math.max(.05,fin(geo.zoom,1)),o=grip(geo.side,geo.k);
 const g=screenToGround(foot,o.dx,o.dy-Math.max(0,fin(geo.lift))+DRAW_LIFT*z,geo.TILE,z);
 const old=Math.atan2(s.vy,s.vx),aimOld=Math.atan2(target.y-s.y,target.x-s.x),spread=Math.atan2(Math.sin(old-aimOld),Math.cos(old-aimOld)),
  na=Math.atan2(target.y-g.y,target.x-g.x)+spread,dOld=Math.hypot(target.x-s.x,target.y-s.y),dNew=Math.hypot(target.x-g.x,target.y-g.y);
 if(![g.x,g.y,na].every(Number.isFinite))return null;
 const life=Number.isFinite(s.life)?Math.max(.001,s.life+(dNew-dOld)/sp):s.life;
 return{x:g.x,y:g.y,vx:Math.cos(na)*sp,vy:Math.sin(na)*sp,life};}
const T=()=>typeof time==='number'?time:0;
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
let r425At=-9,r425On=true;const r425=()=>{const t=Date.now();if(t-r425At>1000){r425At=t;try{r425On=window.__STORYWORLD_COMBAT_FLOW_R425__?.inspect?.()?.prefs?.hunter!==false;}catch(_){r425On=true;}}return r425On;};
const live=()=>{try{return prefs.on&&typeof player==='object'&&!!player&&player.hero===HERO&&solo()&&r425()&&!(+player.samong>0);}catch(_){return false;}};
const standRatio=()=>{try{return fin(window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.standRatio,.98)||.98;}catch(_){return .98;}};
// 몸마다(조종 헌터·배치/분대 헌터) 마지막으로 쏜 쪽
const bodies=new WeakMap();let pending=null;
function aimNow(){const h=typeof HEROES!=='undefined'&&HEROES?.[HERO];const e=typeof nearestEnemy==='function'?nearestEnemy(fin(h&&h.range,8.3)):null;if(!e||typeof project!=='function')return null;
 const q=project(player.x,player.y),b=project(e.x,e.y),last=bodies.get(player)?.side;return{target:{x:e.x,y:e.y},side:sideOf(b.x-q.x,player.direction,last)};}
function wrapAttack(){if(typeof basicAttack!=='function'||basicAttack.r1102)return;const base=basicAttack;const w=function(...args){
  if(!live())return base.apply(this,args);const body=player,before=body.combo;try{const a=aimNow();pending=a?{...a,body}:null;}catch(e){fail(e);pending=null;}
  try{return base.apply(this,args);}finally{try{if(pending&&body.combo>before){bodies.set(body,{side:pending.side,at:T()});stats.swings++;}}catch(e){fail(e);}pending=null;}};
 w.r1102=true;basicAttack=w;}
function wrapShot(){if(typeof makeShot!=='function'||makeShot.r1102)return;const base=makeShot;const w=function(...args){const s=base.apply(this,args);
  try{if(pending&&s&&s.friendly&&s.owner==='hero'&&s.r160Basic&&player===pending.body&&live()&&typeof project==='function'){stats.shots++;
    const want=(typeof actorHeight==='function'?fin(actorHeight(),0):0)*standRatio(),k=want/BODY,z=typeof zoom==='number'?zoom:1,lift=clamp(fin(player.visualLiftPx),0,want*.65);
    const L=k>0?launch(player,{side:pending.side,k,lift,zoom:z,TILE:typeof TILE==='number'?TILE:64},s,pending.target):null;
    if(!L)stats.skipped++;else if(typeof blocked==='function'&&blocked(L.x,L.y,s.radius||.14))stats.blocked++;
    else{s.x=s.px=L.x;s.y=s.py=L.y;s.vx=L.vx;s.vy=L.vy;if(Number.isFinite(L.life))s.life=L.life;s.r1102Bow=pending.side;stats.moved++;}}}catch(e){fail(e);}return s;};
 w.r1102=true;makeShot=w;}
// R425 가 휘두르기를 시작할 때 묻는다: 이 몸이 방금(0.6초 안) 쏜 쪽
function side(){try{const b=bodies.get(player);return b&&T()-b.at>=-1e-6&&T()-b.at<.6?b.side:null;}catch(_){return null;}}
function install(){try{wrapAttack();wrapShot();}catch(e){fail(e);}}
try{if(typeof document!=='undefined'&&document.readyState==='complete')install();else if(typeof window.addEventListener==='function')window.addEventListener('load',install);}catch(e){fail(e);}
function set(k,v){prefs[k]=v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_HUNTER_AIM_R1102__=Object.freeze({revision:REV,GRIP,grip,sideOf,screenToGround,launch,side,set,install,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,browser:false,GPU:false})});
})();
