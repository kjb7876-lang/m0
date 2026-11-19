/* R1232 미카엘라 기본탄을 몸 가운데 살짝 위에서 (사용자 2026-11-19 11:30Z "미카엘라의 기본공격탄환이 너무 머리쪽에서나가 적당히 중간살짝위에서 나오게해줘 그리고 탄환크기 조금 줄여줘")
 * 헤드리스 측정(qa/r1232, 960×540, 영웅 화면 키 53.7px):
 *  ① 엔진 muzzle(공격 칸의 지팡이 끝)이 기본탄을 발 기준 화면 위 41px(옆 사격)·76px(위 사격)로 옮기고, R912 가 그 탄 자리 18px×zoom 위에 그린다
 *     → 그려지는 탄 중심이 영웅 키 1.04배(옆)·1.7배(위) 높이 = 머리 위에서 나감.
 *  ② 고침: 기본공격 안에서 만든 미카엘라 기본탄(michaela-a, R160 기본 표시)의 출발점을, 그려지는 중심이 발 위 영웅 키 0.58배(가운데 살짝 위)가
 *     되도록 화면 세로로만 옮긴다(가로 = 지팡이 쪽 그대로). 같은 표적을 겨누도록 각도만 다시 맞추고 수명은 늘거나 준 거리만큼 보정(사거리 유지).
 *     판정 반경·피해·탄속·관통은 그대로. 벽 안이면 엔진 출발점 유지. 사몽 변신·다른 영웅·스킬 탄·하트 세례 탄은 그대로.
 *  ③ 크기는 projectile-sheets-r912.js pj03/pj03x .60 → .46, R911 최소 크기(영웅 키 절반)는 이 표시(r1232Michaela) 탄을 건너뛴다.
 *  설정 storyworld.r1232.michaelaShot {"on":false} 로 끄면 예전 그대로. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_MICHAELA_SHOT_R1232__)return;
const REV='R1232-michaela-shot-1',KEY='storyworld.r1232.michaelaShot',HERO='michaela',RATIO=.58,DRAW_LIFT=18,ASSET=/(?:^|\/)michaela-a\.webp(?:[?#]|$)/;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={swings:0,shots:0,moved:0,blocked:0,skipped:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const fin=(v,d=0)=>Number.isFinite(v)?v:d;
// 화면 오프셋(rx,ry px) → 땅 좌표: 엔진 project(x,y)=((x−y)·TILE·zoom, (x+y)·TILE·.5·zoom) 의 역
function screenToGround(o,rx,ry,TILE,zoom){const T=fin(TILE,64)*Math.max(.05,fin(zoom,1)),a=fin(rx)/T,b=fin(ry)/(T*.5);return{x:fin(o&&o.x)+(a+b)/2,y:fin(o&&o.y)+(b-a)/2};}
const live=()=>{try{return prefs.on!==false&&typeof player==='object'&&!!player&&player.hero===HERO&&!(+player.samong>0);}catch(_){return false;}};
let depth=0,pending=null;
function aimNow(){try{const h=typeof HEROES!=='undefined'&&HEROES?.[HERO];const e=typeof nearestEnemy==='function'?nearestEnemy(fin(h&&h.range,7)):null;return e&&Number.isFinite(e.x)&&Number.isFinite(e.y)?{x:e.x,y:e.y}:null;}catch(_){return null;}}
// 순수: 발(foot)·탄(s)·표적(target 또는 null) → 새 출발점·속도·수명
function launch(foot,s,target,geo){
 if(![foot&&foot.x,foot&&foot.y,s&&s.x,s&&s.y,s&&s.vx,s&&s.vy].every(Number.isFinite))return null;
 const sp=Math.hypot(s.vx,s.vy),H=fin(geo.H),z=Math.max(.05,fin(geo.zoom,1)),T=fin(geo.TILE,64);if(!(sp>0)||!(H>0))return null;
 const pr=(x,y)=>({x:(x-y)*T*z,y:(x+y)*T*.5*z}),q=pr(foot.x,foot.y),o=pr(s.x,s.y);
 const rx=o.x-q.x,ry=-(RATIO*H)+DRAW_LIFT*z;/* 그려지는 중심 = 탄 자리 − 18·zoom → 탄 자리 = 발 − .58H + 18·zoom */
 const g=screenToGround(foot,rx,ry,T,z);if(![g.x,g.y].every(Number.isFinite))return null;
 let vx=s.vx,vy=s.vy,life=s.life;
 if(target&&Number.isFinite(target.x)&&Number.isFinite(target.y)){
  const old=Math.atan2(s.vy,s.vx),aimOld=Math.atan2(target.y-s.y,target.x-s.x),spread=Math.atan2(Math.sin(old-aimOld),Math.cos(old-aimOld)),
   na=Math.atan2(target.y-g.y,target.x-g.x)+spread;
  if(Number.isFinite(na)){vx=Math.cos(na)*sp;vy=Math.sin(na)*sp;if(Number.isFinite(s.life))life=Math.max(.001,s.life+(Math.hypot(target.x-g.x,target.y-g.y)-Math.hypot(target.x-s.x,target.y-s.y))/sp);}}
 return{x:g.x,y:g.y,vx,vy,life};}
function wrapAttack(){if(typeof basicAttack!=='function'||basicAttack.r1232)return;const base=basicAttack;const w=function(...args){
  if(!live())return base.apply(this,args);const outer=depth===0;if(outer){try{pending={body:player,target:aimNow()};}catch(e){fail(e);pending=null;}}depth++;
  try{return base.apply(this,args);}finally{depth--;if(outer){pending=null;stats.swings++;}}};
 w.r1232=true;basicAttack=w;}
function wrapShot(){if(typeof makeShot!=='function'||makeShot.r1232)return;const base=makeShot;const w=function(...args){const s=base.apply(this,args);
  try{if(pending&&depth>0&&s&&s.friendly&&s.owner==='hero'&&s.r160Basic&&(!s.attackKind9||s.attackKind9==='basic')&&ASSET.test(String(s.asset||''))&&player===pending.body&&live()&&typeof project==='function'){stats.shots++;
    const L=launch(player,s,pending.target,{H:typeof actorHeight==='function'?fin(actorHeight(),0):0,zoom:typeof zoom==='number'?zoom:1,TILE:typeof TILE==='number'?TILE:64});
    if(!L)stats.skipped++;else if(typeof blocked==='function'&&blocked(L.x,L.y,s.radius||.14))stats.blocked++;
    else{s.x=s.px=L.x;s.y=s.py=L.y;s.vx=L.vx;s.vy=L.vy;if(Number.isFinite(L.life))s.life=L.life;s.r1232Michaela=true;stats.moved++;}}}catch(e){fail(e);}return s;};
 w.r1232=true;makeShot=w;}
function install(){try{wrapAttack();wrapShot();}catch(e){fail(e);}}
try{if(typeof document!=='undefined'&&document.readyState==='complete')install();else if(typeof window.addEventListener==='function')window.addEventListener('load',install);}catch(e){fail(e);}
function set(k,v){prefs[k]=v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_MICHAELA_SHOT_R1232__=Object.freeze({revision:REV,RATIO,launch,screenToGround,set,install,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,browser:false,GPU:false})});
})();
