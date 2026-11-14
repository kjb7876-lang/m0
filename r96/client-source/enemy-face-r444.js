// R444 적 방향 한 곳에서 정하기 — 사용자 2026-11-09 "적이 이동하거나 공격할 때 실제 행동과 다른 방향의 이미지가 출력되는 문제" + "몬스터그림자는 없애".
//  헤드리스 전수(그리는 순간 쓰인 방향 vs 실제 이동 vs 공격 각도)로 찾은 원인:
//   · 상태 간 덮어쓰기: 엔진 tickEnemies 는 목표 쪽 벡터(충돌 처리 전)로, R98 은 영웅 쪽으로, R268/R286 은 블링크 뒤 영웅 쪽으로, R425 는 지그재그 다리 쪽으로
//     e.direction 을 쓰고, 그릴 때 R113·R137 이 다시 '영웅 쪽'으로 바꾼다. 그림 공급자(R106·R109·R193·R200·R208·R375)도 저마다 영웅 위치로 좌우를 정한다.
//   · 공격 판정과의 불일치: 근접 판정(meleeFootprint154)과 원거리 조준(rangedAim)은 준비 시작 순간 각도로 고정되는데, 그림은 영웅을 계속 따라가
//     영웅이 준비 중 몹 옆·뒤로 돌면 그림과 판정이 반대 방향이 됐다(dist01 13/29, ep1b03 13/26 공격 프레임).
//   · 걷는 중 영웅 쪽 고정: 벽을 돌아가거나 떠날 때도 영웅 쪽을 봐 뒷걸음처럼 보였다(ep1b03 걷는 프레임 48/263).
//   · 좌표 변환: 세계(x,y) → 화면 가로 sx=x−y, 세로 sy=(x+y)/2 (엔진 facing 과 같음). 대부분 몹 그림은 옆모습 한 장이라
//     엔진 facing 이 front/back 을 고르면 뒤집기 없이 원래 그림 쪽을 봤다 → 좌우만 정하고 세로가 뚜렷할 땐 마지막 좌우를 유지한다.
//  고친 것(판정·피해·이동·저장은 그대로, 그리는 방향만):
//   · 몹마다 '최종 좌우(side)'를 이 파일 하나가 정하고, 그릴 때 e.direction 과 그림 공급자들이 이 값을 쓴다.
//     공격 준비~후딜: 판정과 같은 각도(e.attack.angle·rangedAim·R61 동작 각) — 준비 시작에 고정, 추적형(R61·보스 돌진)은 그 각도를 그대로 따른다.
//     걷기: 충돌 처리 뒤 실제로 움직인 양(0.07초 평활) — 세로가 뚜렷하면 마지막 좌우 유지, 바뀌려면 0.05초 지속.
//     영웅 곁(공격 거리+1.2칸)에서 옆걸음·뒷걸음(영웅 쪽 성분 < 0.35)이거나 멈춰 있으면 영웅 쪽(무감대 0.4칸·0.22초).
//     피격·넉백·순간이동·스폰·재사용: 위치 튐(속도×3+0.15칸 초과)은 걸음으로 보지 않는다. 블링크한 쪽이 정한 방향은 받아들인다. 죽으면 그대로 굳힌다.
//   · 몹 그림자: 모든 몹·보스의 접촉 그림자를 그리지 않는다(R206 'all', R306 픽셀판 그림자 포함). 끄기 {"shadows":true}.
//   · 디버그: localStorage storyworld.r444.face {"debug":true} 또는 설정 hitboxes → 몹 위에 상태·좌우·이동(초록)·조준(빨강) 화살표·판정 원뿔.
//  맡지 않는 것: 페르소나·움직이지 않는 구조물 적(R170 탑·R446 기둥 등)·맘몬 구역.
//  끄기: localStorage storyworld.r444.face {"on":false}.
(()=>{'use strict';
if(window.__STORYWORLD_ENEMY_FACE_R444__)return;
const REV='R444-face-8+R702+R1028',KEY='storyworld.r444.face';
let prefs={on:true,debug:false,shadows:false};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={updates:0,spawns:0,jumps:0,turns:0,attackLocks:0,draws:0,owner:{},errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const P=()=>{try{return typeof player==='object'&&player?player:null;}catch(_){return null;}};
const num=(v,d)=>Number.isFinite(Number(v))?Number(v):d;
const S=new WeakMap();
// 판정과 같은 각도: 근접 = e.attack.angle(meleeFootprint154 가 쓰는 값), 원거리 = rangedAim(투사체 방향), R61 동작 = a.angle(추적형은 R61 이 갱신).
// R1028(사용자 2026-11-14 "보스들 이미지 좌우바뀌면서 갈팡질팡하는거 보라검천사같이 하는거 개선"): 엔진 drawEnemy 는 이야기 공격 자세 창(storyAttackUntil5)에서
//  그리는 동안만 e.attack={angle:0, storyWorldPose5:true} 가짜를 꽂는다(자세 칸 고르기용, 판정 아님). 이 각 0(화면 오른쪽)을 판정 각으로 믿으면
//  그리기 안에서만 좌우가 오른쪽으로 잠겼다가 다음 프레임 조준 각으로 되돌아가 0.05~0.15초 깜빡였다(보라검천사 30초 6번) → 가짜는 각으로 쓰지 않는다.
const fakeAtk=a=>!!(a&&a.storyWorldPose5);
function atkAngle(e){const a=e.attack;if(a&&!fakeAtk(a)&&Number.isFinite(a.angle))return{g:a.angle,k:'melee'};if(e.rangedWindup>0&&Number.isFinite(e.rangedAim))return{g:e.rangedAim,k:'ranged'};
 const r=e.r61Action;if(r&&Number.isFinite(r.angle)&&T()<num(r.endAt,-1))return{g:r.angle,k:'r61'};
 // R442 보스 테마 기술 동작(0.9초): 기술이 떨어지는 쪽(theme-fx-r430 castSkill 의 대상 영웅)으로 — 몸 동작·장판 예고와 같은 방향
 let k=null;try{k=window.__STORYWORLD_ENEMY_SKILL_POSE_R442__?.angle?.(e);}catch(_){}if(Number.isFinite(k))return{g:k,k:'skill'};return null;}
const sideX=(dx,dy)=>dx-dy;// 화면 가로 성분(엔진 facing 과 같은 변환)
function heroSide(e,p){const du=(p.x-p.y)-(e.x-e.y);return du<0?'left':'right';}
// 맡지 않는 것: 페르소나(엔진 8방향 그림), 움직이지 않는 구조물 적(R170 탑·R446 기둥·R75 탑·R251 원·R193 탑 — 조형물 그림을 그대로 그림),
//  맘몬 구역(사용자 2026-11-07: 맘몬 맵은 다른 곳에서 작업 — R425·R438 과 같이 뺀다).
// 엔진 R75 무리의 10번째 몹(r75Tower: 제자리 원거리, 보통 몹 그림)은 맡는다 — 원거리 준비 동안 몸이 조준 쪽을 봐야 한다. R170 탑·R251 시전 원은 자기 깃발로 뺀다.
function structure(e){return !!(e.r170Tower||e.r446Pillar||e.r251Circle||e.towerR193||e.r193Tower||e.prop||e.object);}
function mammon(e){try{const id=String(typeof room==='object'&&room?room.id||'':'');return /mammon/i.test(id)||id==='ep1b06'||!!e.mammon||!!e.mammonR||/mammon/i.test(String(e.nativeId||''));}catch(_){return false;}}
function managed(e){return !!(prefs.on&&e&&!e.persona&&!structure(e)&&!mammon(e));}
function fresh(e,s){return !s||(s.hp<=0&&e.hp>0)||(s.ss!=='active'&&e.spawnState==='active'&&s.ss!==undefined);}
function init(e){const p=P(),d=e.direction;const side=d==='left'||d==='right'?d:p?heroSide(e,p):'right';return{x:e.x,y:e.y,t:T(),vx:0,vy:0,side,d4:side==='left'?'west':'east',owner:'spawn',pend:null,since:T(),hp:e.hp,ss:e.spawnState,aim:null,mvx:0,mvy:0};}
// 공격 판정 각도로 좌우를 묶는다(준비~후딜). 화면 세로에 가까운 각(|가로| ≤ .12)은 마지막 좌우를 둔다.
function lockAttack(s,A){const X=sideX(Math.cos(A.g),Math.sin(A.g));if(s.aim===null)stats.attackLocks++;s.aim=A.g;s.owner='attack:'+A.k;s.pend=null;if(Math.abs(X)>.12)s.side=X>0?'right':'left';dir4(s,Math.cos(A.g),Math.sin(A.g),true);return s;}
const live=e=>e.hp>0&&e.spawnState!=='dead';
function update(e){let s=S.get(e);const t=T();
 if(fresh(e,s)){s=init(e);S.set(e,s);stats.spawns++;const A=live(e)?atkAngle(e):null;return A?lockAttack(s,A):s;}// 공격 중에 처음 보이면 바로 판정 쪽
 // 같은 순간(게임 시간 그대로)에 공격 각이 새로 정해지거나 바뀌면 바로 따른다 — 그림과 판정이 한 프레임도 갈리지 않게(엔진 enemy-facing 검사는 한 순간에 8방향을 찔러 본다)
 if(s.t===t){const A=live(e)?atkAngle(e):null;if(A&&A.g!==s.aim)lockAttack(s,A);return s;}
 stats.updates++;
 const dt=Math.max(1e-3,t-s.t),dx=e.x-s.x,dy=e.y-s.y,dist=Math.hypot(dx,dy);s.x=e.x;s.y=e.y;s.t=t;s.hp=e.hp;s.ss=e.spawnState;
 if(!(e.hp>0)||e.spawnState==='dead'){s.owner='dead';s.pend=null;return s;}
 const sp=Math.max(.8,num(e.speed,2));
 if(dist>Math.max(.6,sp*dt*3+.15)){// 순간이동·넉백·스폰 자리 잡기: 걸음으로 보지 않는다. 블링크한 쪽(R230·R268·R286)이 정한 좌우는 받아들인다.
  s.vx=s.vy=0;s.tele=t;s.pend=null;s.owner='warp';s.trail=null;stats.jumps++;const A0=atkAngle(e);if(A0)return lockAttack(s,A0);const d=e.direction;if(d==='left'||d==='right')s.side=d;return s;}
 const k=1-Math.exp(-dt/.07);s.vx+=(dx/dt-s.vx)*k;s.vy+=(dy/dt-s.vy)*k;s.mvx=dx/dt;s.mvy=dy/dt;trailAdd(s,e.x,e.y,dist);
 const A=atkAngle(e);
 if(A)return lockAttack(s,A);
 s.aim=null;
 if(e.hitTimer>0||t-num(s.tele,-9)<.15){s.owner='hold';s.pend=null;return s;}
 const p=P(),tx=p?p.x-e.x:0,ty=p?p.y-.15-e.y:0,td=Math.hypot(tx,ty);
 const engaged=!!(p&&p.hp>0&&td<Math.max(6,num(e.combatProfile?.aggro,7)));
 const v=Math.hypot(s.vx,s.vy),moving=v>Math.max(.22,sp*.12);
 let vec=null,owner='hold',hold=.2;
 if(moving){const range=num(e.combatProfile?.attackShape?.range,1.2),dot=engaged?(s.vx*tx+s.vy*ty)/(v*(td||1)):1;
  if(engaged&&td<range+1.2&&dot<.35){vec=[tx,ty];owner='face';hold=.22;}else{vec=[s.vx,s.vy];owner='move';hold=.05;}}
 else if(engaged&&td<6){vec=[tx,ty];owner='face';hold=.22;}
 s.owner=owner;
 if(vec){const X=sideX(vec[0],vec[1]),Y=(vec[0]+vec[1])/2,m=Math.hypot(X,Y)||1;
  const ok=owner==='face'?Math.abs((p.x-p.y)-(e.x-e.y))>.4:Math.abs(X)/m>.3;// 세로가 뚜렷하면 마지막 좌우 유지(옆모습 한 장 그림)
  if(ok){const want=X>0?'right':'left';if(want!==s.side){if(s.pend!==want){s.pend=want;s.since=t;}if(t-s.since>=hold&&(owner!=='move'||t-s.since>=STAIR_MAX||trailAgrees(s,want))){s.side=want;s.pend=null;stats.turns++;}else if(owner==='move'&&t-s.since>=hold)stats.stairHolds=(stats.stairHolds||0)+1;}else s.pend=null;}
  dir4(s,vec[0],vec[1],false);}
 return s;}
// R702(사용자 2026-11-11 "영화모드에서 보스가 도리도리하면서 방향을 못잡는 버그"): 격자 길을 대각선 계단(+x 한 칸 → +y 한 칸 …)으로 걸으면
//  화면 가로(x−y)로는 칸마다 오른쪽·왼쪽이 번갈아 나와 0.35초마다 좌우가 뒤집혔다(영화 모드 길잡이가 멀리 가면 보스가 오래 쫓아 걸어 눈에 띔).
//  → 걷기로 좌우를 바꿀 때 지난 걸음 묶음(길이 TRAIL칸)의 실제 진행 방향도 같은 쪽이어야 바꾼다. 계단은 묶음으로 보면 화면 세로라 마지막 좌우를 둔다.
//  진짜로 돌아서면 묶음도 곧 그쪽을 가리키고(약 0.3초), 그래도 STAIR_MAX(0.65)초 넘게 같은 쪽을 원하면 바꾼다. 막 걷기 시작해 묶음이 짧을 땐 묻지 않는다.
const TRAIL=1.2,TRAIL_MIN=.5,STAIR_MAX=.65;
function trailAdd(s,x,y,d){if(!(d>1e-5))return;const T=s.trail||(s.trail={p:[[x-0,y-0]],len:0});const L=T.p[T.p.length-1];T.p.push([x,y]);T.len+=Math.hypot(x-L[0],y-L[1]);
 while(T.p.length>2){const a=T.p[0],b=T.p[1],seg=Math.hypot(b[0]-a[0],b[1]-a[1]);if(T.len-seg<TRAIL)break;T.p.shift();T.len-=seg;}if(T.p.length>240){T.p.splice(0,T.p.length-240);}}
function trailAgrees(s,want){const T=s.trail;if(!T||T.len<TRAIL_MIN)return true;const a=T.p[0],b=T.p[T.p.length-1],dx=b[0]-a[0],dy=b[1]-a[1],X=sideX(dx,dy),Y=(dx+dy)/2,m=Math.hypot(X,Y);
 if(!(m>1e-4))return false;return Math.abs(X)/m>.5&&(X>0?'right':'left')===want;}
// 4방향 시트(R375 dirs4 등): 가로가 뚜렷하면 지금 좌우, 세로가 뚜렷하면 앞/뒤, 그 사이면 이전 값(경계 떨림 방지).
function dir4(s,dx,dy,now){const X=Math.abs(sideX(dx,dy)),Y=Math.abs((dx+dy)/2);if(X>=Y*.9||!(Y>1e-6))s.d4=s.side==='left'?'west':'east';else if(X<Y*.6||now)s.d4=(dx+dy)>0?'south':'north';
 if((s.d4==='west'&&s.side==='right')||(s.d4==='east'&&s.side==='left'))s.d4=s.side==='left'?'west':'east';}
function state(e){if(!managed(e))return null;try{const s=update(e);stats.owner[s.owner]=(stats.owner[s.owner]||0)+1;return s;}catch(err){fail(err);return null;}}
// 공급자용: 화면 왼쪽을 보는가(null = 이 파일이 정하지 않음 → 원래 규칙)
function left(e){const s=state(e);return s?s.side==='left':null;}
function side(e){const s=state(e);return s?s.side:null;}
function d4(e){const s=state(e);return s?s.d4:null;}
// ---- 그릴 때: e.direction 을 최종 좌우로 맞춘다(엔진 bakedFacing 뒤집기·R51 사슬이 이 값을 본다). R113·R137 은 이 파일이 맡은 몹을 건드리지 않는다. ----
let cur=null;
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){if(!managed(e))return base.call(this,e,...a);
 const s=state(e);if(s&&(e.hp>0||s.owner==='dead'))e.direction=s.side;stats.draws++;const prev=cur;cur=e;
 try{return base.call(this,e,...a);}finally{cur=prev;if(s&&e.hp>0)e.direction=s.side;try{if(debugOn())debugDraw(e,s);}catch(err){fail(err);}}};}
// ---- 자세 프레임: R54 이야기 전투 자세·R53 병원 자세는 프레임 안에 스스로 flip 을 넣는다(공격 중엔 판정 각, 아닐 땐 영웅·주시 각).
//  공격이 아닐 때 걷는 쪽과 어긋나므로, 같은 그림 규칙(R54: bakedFacing left 면 오른쪽일 때 뒤집기·eight-way 는 그대로 / R53: 왼쪽일 때 뒤집기)에
//  최종 좌우만 넣는다. 그림 고르기(준비·타격 칸, 앞·뒤 줄)는 그대로. 이 뒤의 덧씌우기(R93·R100·R106)도 같은 좌우를 쓴다. ----
function poseFlip(e,r){if(!r||typeof r!=='object'||!(r.r54StoryPose||r.r53HospitalPose)||!managed(e)||!(e.hp>0))return r;const s=state(e);if(!s)return r;
 let flip;if(r.r53HospitalPose)flip=s.side==='left';else{const b=r.assetFrame?.bakedFacing;if(b==='eight-way')return r;flip=b==='left'?s.side==='right':s.side==='left';}
 if(flip===r.flip)return r;stats.poseFlips=(stats.poseFlips||0)+1;return{...r,flip};}
function wrapPoses(){const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(!S||typeof S.frameFor!=='function')return false;if(S.__r444)return true;const base=S.frameFor;
 window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r444:true,frameFor(e,f){const r=base.call(this,e,f);try{return poseFlip(e,r);}catch(err){fail(err);return r;}}});return true;}
wrapPoses();
// R74 괴물 아틀라스(ep1a08 등): 프레임이 늘 영웅 쪽으로 뒤집혀 나왔다(공격 중에도). 그림은 오른쪽을 보는 옆모습이라 왼쪽일 때 뒤집는다.
function wrapFlip(){const M=window.__STORYWORLD_ENEMY_MOTION_R51__;if(!M||typeof M.flip!=='function')return false;if(M.__r444)return true;const base=M.flip;
 window.__STORYWORLD_ENEMY_MOTION_R51__=Object.freeze({...M,__r444:true,flip(e,f,fallback){const out=base.call(this,e,f,fallback);if(!f||!f.r74Monster||!managed(e)||!(e.hp>0))return out;
  try{const s=state(e);if(!s)return out;stats.atlasFlips=(stats.atlasFlips||0)+1;return s.side==='left';}catch(err){fail(err);return out;}}});return true;}
wrapFlip();
// ---- 몬스터 그림자 없애기(사용자 2026-11-09 "/몬스터그림자는 없애") ----
function noShadows(){return prefs.on&&!prefs.shadows;}
if(typeof shadow==='function'){const base=shadow;shadow=function(...a){if(cur&&noShadows()){stats.shadowsSkipped=(stats.shadowsSkipped||0)+1;return;}return base.apply(this,a);};}
// ---- 디버그 표시 ----
function debugOn(){try{return !!(prefs.debug||(typeof settings==='object'&&settings?.hitboxes));}catch(_){return !!prefs.debug;}}
function debugDraw(e,s){if(!(e.hp>0)||typeof project!=='function'||typeof ctx!=='object'||!ctx)return;const q=project(e.x,e.y),arrow=(dx,dy,len,col)=>{const m=Math.hypot(dx,dy);if(m<1e-4)return;const b=project(e.x+dx/m*len,e.y+dy/m*len);ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(b.x,b.y);ctx.stroke();};
 ctx.save();try{arrow(s.mvx,s.mvy,.9,'#5cff8a');if(s.aim!=null){arrow(Math.cos(s.aim),Math.sin(s.aim),1.4,'#ff4d4d');const f=e.attack?.footprint154;if(f&&f.shape==='arc'){const r=num(f.radius,1),w=num(f.width,.8);for(const sg of[-1,1])arrow(Math.cos(f.angle+sg*w/2),Math.sin(f.angle+sg*w/2),r,'#ff9a3d');}}
  ctx.font='10px monospace';ctx.textAlign='center';ctx.fillStyle='#fff';const st=e.attack?(e.meleeStageQuality||'atk'):e.rangedWindup>0?'aim':e.hitTimer>0?'hit':e.moving?'move':'idle';
  ctx.fillText(st+' · '+s.owner+' · '+(s.side==='left'?'◀':'▶')+(s.d4?' '+s.d4[0]:''),q.x,q.y+14);}finally{ctx.restore();}}
function set(p={}){for(const k of['on','debug','shadows'])if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_ENEMY_FACE_R444__=Object.freeze({revision:REV,left,side,d4,state:e=>{const s=state(e);return s?{side:s.side,d4:s.d4,owner:s.owner,aim:s.aim,vx:s.vx,vy:s.vy}:null;},
 owns:managed,noShadows,set,poseFlip,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats,owner:{...stats.owner}},lastError})});
})();
