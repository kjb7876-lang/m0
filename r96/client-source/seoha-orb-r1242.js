/* R1242 윤서하 기본탄을 구슬에서 (사용자 2026-11-19 12:13Z "윤서하 투사체 구슬이아니라 머리쪽에서 나가는 버그 수정")
 * 헤드리스 측정(qa/r1242/origin-probe.mjs, 960×540, 영웅 화면 키 53.7px): 엔진 출발점 + R912 의 18px×zoom 들림으로
 *  그려지는 탄 중심이 발 위 영웅 키 1.10배(옆)·0.78배(아래)·1.44배(위) = 머리 위에서 나감. 공격 그림(R143 attack-*.webp)의 구슬은 0.65배쯤(가슴 앞 손).
 * 고침: 기본공격 안에서 만든 서하 기본탄(seoha-a, 기본 표시)의 출발점을 그 순간 R143 이 그릴 공격 칸(표적 화면 방향 8쪽, w·sw·nw 는 e·se·ne 반전)의
 *  구슬 픽셀(타격 칸에서 잼)로 옮겨, 그려지는 탄 중심이 구슬에 오게 한다(18px×zoom 들림을 빼서 땅 좌표로). 같은 표적을 겨누게 각도만 다시 맞추고
 *  수명은 거리 변화만큼 보정(사거리 유지). 판정 반경·피해·탄속·관통은 그대로. 벽 안이면 엔진 출발점 유지. 사몽 변신·스킬 탄·분신탄은 그대로.
 * 설정 storyworld.r1242.seohaOrb {"on":false} 로 끄면 예전 그대로. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_SEOHA_ORB_R1242__)return;
const REV='R1242-seoha-orb-1',KEY='storyworld.r1242.seohaOrb',HERO='seoha',DRAW_LIFT=18,ASSET=/(?:^|\/)seoha-a\.webp(?:[?#]|$)/;
// R143 assets/r143/attack/seoha/attack-{d}.webp(192×256 칸, 발 x 96) 타격 칸에서 잰 구슬 중심 x·y 와 발 y(index.json foot), 몸 키(발 − 머리 꼭대기, 칸 6장 중앙값 179)
const ORB=Object.freeze({e:[117,110,226],se:[124,109,225],s:[129,108,226],ne:[117,108,224],n:[63,108,225]}),BODY=179,FX=96;
const DIR8=['e','se','s','sw','w','nw','n','ne'],SHEET={s:['s',0],se:['se',0],e:['e',0],ne:['ne',0],n:['n',0],sw:['se',1],w:['e',1],nw:['ne',1]},FOUR={right:'e',left:'w',front:'s',back:'n'}/* R143 FOUR 와 같게 */;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={swings:0,shots:0,moved:0,blocked:0,skipped:0,errors:0,dirs:{}};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const fin=(v,d=0)=>Number.isFinite(v)?v:d;
function screenToGround(o,rx,ry,TILE,zoom){const T=fin(TILE,64)*Math.max(.05,fin(zoom,1)),a=fin(rx)/T,b=fin(ry)/(T*.5);return{x:fin(o&&o.x)+(a+b)/2,y:fin(o&&o.y)+(b-a)/2};}
const live=()=>{try{return prefs.on!==false&&typeof player==='object'&&!!player&&player.hero===HERO&&!(+player.samong>0);}catch(_){return false;}};
const standRatio=()=>{try{return fin(window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.standRatio,.98)||.98;}catch(_){return .98;}};
let depth=0,pending=null;
function aimNow(){try{const h=typeof HEROES!=='undefined'&&HEROES?.[HERO];const e=typeof nearestEnemy==='function'?nearestEnemy(fin(h&&h.range,7)):null;return e&&Number.isFinite(e.x)&&Number.isFinite(e.y)?{x:e.x,y:e.y}:null;}catch(_){return null;}}
// 순수: 발·표적 → R143 칸 이름(8쪽)
function dirOf(foot,target,direction,TILE,zoom){if(target){const T=fin(TILE,64)*fin(zoom,1),dx=target.x-foot.x,dy=target.y-foot.y,sx=(dx-dy)*T,sy=(dx+dy)*T*.5;if(Math.hypot(sx,sy)>1e-9)return DIR8[((Math.round(Math.atan2(sy,sx)/(Math.PI/4))%8)+8)%8];}return FOUR[direction]||'s';}
// 순수: 구슬 화면 오프셋(발 기준 px)
function orbScreen(dir8,H,lift){const [sh,mir]=SHEET[dir8]||SHEET.s,o=ORB[sh],k=fin(H)/BODY;return{sheet:sh,mirror:!!mir,x:(o[0]-FX)*k*(mir?-1:1),y:(o[1]-o[2])*k-Math.max(0,fin(lift))};}
function launch(foot,s,target,geo){
 if(![foot&&foot.x,foot&&foot.y,s&&s.x,s&&s.y,s&&s.vx,s&&s.vy].every(Number.isFinite))return null;
 const sp=Math.hypot(s.vx,s.vy),H=fin(geo.H),z=Math.max(.05,fin(geo.zoom,1)),T=fin(geo.TILE,64);if(!(sp>0)||!(H>0))return null;
 const d=dirOf(foot,target,geo.direction,T,z),o=orbScreen(d,H,clampLift(geo.lift,H));
 const g=screenToGround(foot,o.x,o.y+DRAW_LIFT*z,T,z);if(![g.x,g.y].every(Number.isFinite))return null;
 let vx=s.vx,vy=s.vy,life=s.life;
 if(target&&Number.isFinite(target.x)&&Number.isFinite(target.y)){
  const old=Math.atan2(s.vy,s.vx),aimOld=Math.atan2(target.y-s.y,target.x-s.x),spread=Math.atan2(Math.sin(old-aimOld),Math.cos(old-aimOld)),na=Math.atan2(target.y-g.y,target.x-g.x)+spread;
  if(Number.isFinite(na)){vx=Math.cos(na)*sp;vy=Math.sin(na)*sp;if(Number.isFinite(s.life))life=Math.max(.001,s.life+(Math.hypot(target.x-g.x,target.y-g.y)-Math.hypot(target.x-s.x,target.y-s.y))/sp);}}
 return{x:g.x,y:g.y,vx,vy,life,dir:d};}
function clampLift(l,H){return Math.min(Math.max(fin(l),0),fin(H)*.65);}
function wrapAttack(){if(typeof basicAttack!=='function'||basicAttack.r1242)return;const base=basicAttack;const w=function(...args){
  if(!live())return base.apply(this,args);const outer=depth===0;if(outer){try{pending={body:player,target:aimNow()};}catch(e){fail(e);pending=null;}}depth++;
  try{return base.apply(this,args);}finally{depth--;if(outer){pending=null;stats.swings++;}}};
 w.r1242=true;basicAttack=w;}
function wrapShot(){if(typeof makeShot!=='function'||makeShot.r1242)return;const base=makeShot;const w=function(...args){const s=base.apply(this,args);
  try{if(pending&&depth>0&&s&&s.friendly&&s.owner==='hero'&&(s.r160Basic===true||s.attackKind9==='basic')&&(!s.attackKind9||s.attackKind9==='basic')&&!s.r564Clone&&ASSET.test(String(s.asset||''))&&player===pending.body&&live()&&typeof project==='function'){stats.shots++;
    const H=(typeof actorHeight==='function'?fin(actorHeight(),0):0)*standRatio();
    const L=launch(player,s,pending.target,{H,lift:player.visualLiftPx,direction:player.direction,zoom:typeof zoom==='number'?zoom:1,TILE:typeof TILE==='number'?TILE:64});
    if(!L)stats.skipped++;else if(typeof blocked==='function'&&blocked(L.x,L.y,s.radius||.14))stats.blocked++;
    else{s.x=s.px=L.x;s.y=s.py=L.y;s.vx=L.vx;s.vy=L.vy;if(Number.isFinite(L.life))s.life=L.life;s.r1242Orb=true;stats.moved++;stats.dirs[L.dir]=(stats.dirs[L.dir]||0)+1;}}}catch(e){fail(e);}return s;};
 w.r1242=true;makeShot=w;}
function install(){try{wrapAttack();wrapShot();}catch(e){fail(e);}}
try{if(typeof document!=='undefined'&&document.readyState==='complete')install();else if(typeof window.addEventListener==='function')window.addEventListener('load',install);}catch(e){fail(e);}
function set(k,v){prefs[k]=v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_SEOHA_ORB_R1242__=Object.freeze({revision:REV,ORB,BODY,dirOf,orbScreen,launch,set,install,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats,dirs:{...stats.dirs}},lastError,browser:false,GPU:false})});
})();
