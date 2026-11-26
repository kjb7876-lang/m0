// R1314 3D 영웅이 바라보는 방향 — 사용자 2026-11-25 "모든 3D 영웅이 미카엘라 쪽에 그려진 영웅의 잔흔 혹은 분신 쪽을 바라보면서 움직이는 버그"
//  (스토리 사몽 구역, 혼자, 미카엘라 NPC = growth-r103 이 세우는 조형물).
//  원인(헤드리스 실측 qa/r1314): hwando-3d-r1302.js 의 몸 방향은
//   ① 공격 자세가 남은 채(atk 0.5초 창 안·A 오토·반자동처럼 공격 판정이 이어질 때) 움직이면 이동 방향이 아니라 player.direction
//      (R111 faceTick·R98 이 가장 가까운 적·대상 쪽으로 돌려 둔 4방향)으로 굳는다 → 적 반대쪽으로 걸을 때 몸이 176~180° 뒤를 보고 뒷걸음.
//      사몽처럼 몹이 붙어 있는 곳에서 걸으면 늘 같은 쪽(가까운 적 쪽)을 보며 움직인다.
//   ② 맨 걷기도 화면 각(x-y,(x+y)/2)에 카메라 45° 를 더해 월드 방향으로 써서 축 방향 이동에서 13° 어긋난다.
//  미카엘라 NPC 자체는 방향을 끌어당기지 않는다(조형물이라 대상·적 목록에 없음, 실측 ④). 화면에서 몸이 그쪽을 보는 것은 ① 의 '가까운 적 쪽' 이
//  NPC 쪽과 겹친 것으로 본다(추정).
//  고침(hwando-3d-r1302.js 는 #1004 대기·해시 고정 검사가 있어 건드리지 않는다): 장면 onBeforeRender(행렬 갱신 뒤)에서 지금 보이는
//   'r1305-<영웅>-3d-shared' 묶음의 rotation.y 를 다시 정하고 행렬을 갱신한다(R1309 대검 IK 보다 먼저 돈다).
//   · 실제로 움직이는 중 = 이동 방향(이동 벡터, 0 이면 이번 프레임 실제 변위). 공격 자세여도 같다.
//   · 서서 공격 = 공격 대상(target 적) 쪽, 없으면 엔진 4방향(player.direction).
//   · 그 밖 = 엔진 4방향이 (멈춘 뒤) 바뀔 때만 따라감 — 걷다 멈추면 마지막 이동 방향 그대로. 돌기는 R1302 와 같은 속도(초당 9 배)로 부드럽게.
//   월드 방향: 모델 앞 +Z, 월드 X = 게임 x, 월드 Z = 게임 y → rotation.y = atan2(dx, dy).
//  끄기: localStorage['storyworld.r1314.face3d']='off'. 점검: window.__STORYWORLD_FACE3D_R1314__.inspect()
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_FACE3D_R1314__)return;
const REV='R1314-face3d-1',KEY='storyworld.r1314.face3d',RATE=9,ATK_HOLD=.5,NAME=/^r1305-[a-z]+-3d-shared$/;
const DIR={front:0,down:0,right:Math.PI/2,back:Math.PI,up:Math.PI,left:-Math.PI/2},CAM=Math.PI/4;
let on=true;try{on=localStorage.getItem(KEY)!=='off';}catch(_){}
const stats={frames:0,move:0,hit:0,target:0,dir:0,hold:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.stack||e).slice(0,240);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const fin=Number.isFinite;
const host=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;return r?.scene&&r?.T?r:null;};
const api3d=()=>window.__STORYWORLD_HWANDO3D_R1302__;
const states=new WeakMap();
const wrap=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
let last=null;
function groupOf(scene){let g=null;for(const o of scene.children)if(o.visible&&NAME.test(o.name||'')){g=o;break;}return g;}
// R1328 — 사용자 2026-11-26 "영웅 공격모션 대각선은 왜 안됨?": 엔진 basicAttack 이 고르는 적과 같은 규칙.
//  근접(melee·blade·heavy) = 사거리 안·길이 트인 적, 원거리 = 사거리 안 적. 그 가운데 찍어 둔 대상이 있으면 대상, 없으면 가장 가까운 적.
// 살아 있는 적 기록(id·자리). 그리기 훅마다 남겨 두고, 다음 공격이 시작된 프레임에 '직전 프레임에 살아 있던 적' 으로 쓴다:
//  엔진 basicAttack 은 피해를 그 자리에서 넣으므로 죽이는 한 방은 훅이 돌 때 맞은 적이 이미 죽었거나 목록에서 빠져 있다(Codex P2).
function snap(){const list=G(()=>room.enemies,null),out=[];if(!list)return out;
 for(const e of list)if(e&&e.hp>0&&fin(e.x+e.y))out.push({id:e.id,x:e.x,y:e.y,boss:!!e.boss});return out;}
function hit(P,id,list){
 const h=G(()=>HEROES[P.hero],null),R=+(h&&h.range);if(!(R>0)||!list||!list.length)return null;
 const melee=!!(h.melee||h.type==='blade'||h.type==='heavy'),engaged=G(()=>!!room.engaged,false);
 let best=null,bd=Infinity,chosen=null;
 for(const e of list){if(e.boss&&!engaged)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(!(d<=R))continue;
  if(melee&&!G(()=>clearLine(P,e),true))continue;if(id!=null&&e.id===id)chosen=e;if(d<bd){bd=d;best=e;}}
 return chosen||best;}
function want(s,g,P,now){const w=want0(s,g,P,now);s.anim=+P.attackAnim||0;if(s.mode!=='hit'){s.aim=null;s.aimP=null;}s.snap=snap();return w;}
function want0(s,g,P,now){
 const gx=g.position.x,gz=g.position.z,prev=s.pos;s.pos={x:gx,y:gz};
 let mx=+P.moveVX150||0,my=+P.moveVY150||0;
 if(!(Math.hypot(mx,my)>1e-3)&&prev){mx=gx-prev.x;my=gz-prev.y;const d=Math.hypot(mx,my);if(!(d>1e-4)||d>2){mx=0;my=0;}}
 if(P.attackAnim>0)s.atkAt=now;
 if(P.moving&&Math.hypot(mx,my)>1e-4){stats.move++;s.mode='move';s.dir=String(P.direction||'').toLowerCase();/* 멈출 때 엔진 4방향으로 45° 꺾이지 않게: 걷는 동안 바뀐 4방향은 이미 본 것으로 */return Math.atan2(mx,my);}
 const attacking=now-(s.atkAt??-1e9)<ATK_HOLD;
 if(attacking){const id=G(()=>target,null);
  // R1328: 기본 공격이 실제로 때리는 적 쪽(대상을 안 찍었거나 대상이 사거리 밖일 때 4방향으로 굳지 않게). 공격 한 번 동안은 고른 적을 유지한다.
  const rise=(+P.attackAnim||0)>(s.anim||0)+1e-6,cur=snap();
  if(rise||!s.aimP){let list=cur;
   if(rise&&s.snap){list=s.snap.map(r=>cur.find(q=>q.id===r.id)||r);for(const c of cur)if(!s.snap.some(r=>r.id===c.id))list.push(c);}
   const h=hit(P,id,list);s.aimP=h?{id:h.id,x:h.x,y:h.y}:null;}
  else{const c=cur.find(q=>q.id===s.aimP.id);if(c){s.aimP.x=c.x;s.aimP.y=c.y;}/* 휘두르는 동안 죽으면 마지막 자리 */}
  s.aim=s.aimP?s.aimP.id:null;
  if(s.aimP){const dx=s.aimP.x-P.x,dy=s.aimP.y-P.y;if(Math.hypot(dx,dy)>.05){stats.hit++;s.mode='hit';s.dir=String(P.direction||'').toLowerCase();/* 공격 뒤에도 엔진 4방향으로 꺾이지 않고 그 적 쪽 유지 */return Math.atan2(dx,dy);}}
  const e=id!=null?G(()=>room.enemies.find(q=>q&&q.id===id),null):null;
  if(e&&e.hp>0&&fin(e.x+e.y)){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d>.05&&d<12){stats.target++;s.mode='target';return Math.atan2(dx,dy);}}}
 const k=String(P.direction||'').toLowerCase();
 if(DIR[k]!==undefined&&(attacking||k!==s.dir||s.mode==='target')){s.dir=k;stats.dir++;s.mode='dir';return DIR[k]+CAM;}
 s.dir=k;stats.hold++;s.mode='hold';return null;}
function step(scene){
 if(!on)return;const a=api3d();if(!a||!a.on?.())return;const g=groupOf(scene);if(!g)return;const P=G(()=>player,null);if(!P||!fin(P.x+P.y))return;
 const now=G(()=>time,performance.now()/1000);let s=states.get(g);
 if(!s){s={yaw:g.rotation.y,t:now,pos:null,dir:null,atkAt:null,target:g.rotation.y,mode:'init'};states.set(g,s);}
 if(now!==s.t||s.first!==true){const dt=Math.max(0,Math.min(.1,now-s.t));s.t=now;s.first=true;stats.frames++;
  const w=want(s,g,P,now);if(w!==null)s.target=w;
  const df=wrap(s.target-s.yaw);s.yaw=wrap(s.yaw+df*Math.min(1,dt*RATE));}
 if(g.rotation.y!==s.yaw){g.rotation.y=s.yaw;g.updateMatrixWorld(true);}
 last={hero:g.name,yaw:+s.yaw.toFixed(3),target:+s.target.toFixed(3),mode:s.mode,aim:s.aim??null};}
let hooked=null;
(function tick(){try{const r=host();if(r&&r.scene!==hooked){const scene=r.scene,prev=scene.onBeforeRender;
  scene.onBeforeRender=function(...args){try{step(scene);}catch(e){fail(e);}return prev?.apply(this,args);};hooked=scene;}}catch(e){fail(e);}requestAnimationFrame(tick);})();
function set(v){on=!!v;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}return on;}
window.__STORYWORLD_FACE3D_R1314__=Object.freeze({revision:REV,on:()=>on,set,inspect:()=>({revision:REV,on,hooked:!!hooked,last,...stats,lastError})});
})();
