// R1042 색욕 보스 '키스 입술' 공격 — 사용자 2026-11-15 "색욕보스 키스 입술공격도 추가 적중시 체력66프로 비례데미지".
//  · 붉은 하이힐의 서윤(b05-boss)이 깨어 있고 13칸 안이면 처음 4초 뒤, 그다음 11초마다 영웅이 서 있는 자리에 입맞춤을 날린다.
//    보스 입가에 자홍 '모임' 시트(입맞춤을 불어 보냄) → 분홍 소용돌이가 날아와 내려앉고, 노린 자리에 분홍 고리 시트(맞는 범위 1.1칸)가 1.3초 예고로 돈다.
//  · 예고가 끝나는 순간 그 범위 안에 있으면 현재 체력의 66% 피해(맞은 뒤 34% 남음 — 비례라 이것만으로는 쓰러지지 않음), 분홍 터짐 시트.
//    비켜서면 안 맞는다. 피해는 엔진 hurt 사슬을 그대로 거쳐(회피·블링크 무적, 패링, 성흔 보호 → 안 맞음) 맞았을 때만 결과를 정확히 66%로 맞춘다
//    (방어·난이도 배율이 66%를 줄이거나 키우지 않게). 피해 숫자도 66% 값으로 바꿔 보인다.
//  · 세 모드(스토리·무한생존·영화) 공유: 방 이름이 아니라 보스 nativeId 로 고른다. 서사 장면·창·협동 중엔 없고, 예고 중 장면이 열리면 걷는다.
//  · 그림은 모두 기존 칠한 프레임 시트(R100 적 고유색 시트, 분홍·자홍). 코드로 그린 선·원 없음. 입술 모양 전용 시트는 Dots 요청 대상(오면 바꿔 끼움).
//  끄기: localStorage['storyworld.r1042.kiss']='{"on":false}' · 점검: window.__STORYWORLD_KISS_LIPS_R1042__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_KISS_LIPS_R1042__)return;
const REV='R1042-kiss-1',KEY='storyworld.r1042.kiss',BOSS='b05-boss';
const FIRST=4,GAP=11,WARN=1.3,REACH=1.1,RANGE=13,RATIO=.66,BURST=.9;
const SH=Object.freeze({aura:{path:'assets/r100/sig-aura-pink.webp',cell:160,n:12,fps:12},hit:{path:'assets/r100/sig-hit-pink.webp',cell:160,n:12,fps:14},
 gather:{path:'assets/r100/sig-gather-magenta.webp',cell:192,n:12,fps:12/WARN*.9},
 fly:{path:'assets/r100/sig-gather-pink.webp',cell:192,n:12,fps:12}});
const stats={casts:0,hits:0,dodged:0,blocked:0,cancelled:0,draws:0,errors:0,lastCastAt:null,lastError:null,last:null};
let active=null,burst=null,nextAt=null,lastRoom=null,boss=null,prefAt=-1e9,prefOn=true;
const fin=(v,d=0)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const T=()=>{try{return typeof time==='number'&&Number.isFinite(time)?time:0;}catch(_){return 0;}};
function on(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return !(v&&v.on===false);}catch(_){return true;}}
function fail(e){stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,200);}
function blockedNow(){try{if(typeof storyScene!=='undefined'&&storyScene)return true;if(typeof modal!=='undefined'&&modal)return true;
 const co=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();if(co&&co!=='off')return true;}catch(_){}return false;}
function liveBoss(){const list=(typeof room!=='undefined'&&room&&Array.isArray(room.enemies))?room.enemies:[];
 return list.find(e=>e&&e.nativeId===BOSS&&!e.r61Clone&&e.hp>0&&!e.dead&&e.spawnState==='active'&&Number.isFinite(e.x)&&Number.isFinite(e.y))||null;}
function cancel(){if(active)stats.cancelled++;active=null;}
// 피해: hurt 사슬(무적·패링·보호·다른 오버레이 감싸기)을 그대로 거친 뒤, 실제로 체력이 깎였으면 결과를 정확히 현재 체력의 34%로 맞춘다.
// 사슬 안에서 뜨는 피해 숫자는 잠깐 받아 두었다가 66% 값으로 고쳐 내보낸다.
function strike(e){const before=player.hp;if(!(Number.isFinite(before)&&before>0))return'ignored';const want=before*RATIO;
 const held=[];let base=null;if(typeof floatText==='function'){base=floatText;floatText=function(...a){held.push(a);};}
 let r;try{r=hurt(want*.5,{kind:'r1042-kiss',name:'색욕의 입맞춤',owner:e.id,boss:true,r1042Kiss:true,x:e.x,y:e.y});}
 finally{if(base)floatText=base;}
 const after=player.hp,hit=Number.isFinite(after)&&after>0&&after<before;
 if(hit)player.hp=before-want;else if(!Number.isFinite(after))player.hp=before;
 stats.last={before,after:player.hp,result:hit?'hit':String(r||'blocked')};
 for(const a of held){try{if(hit&&/^-\d+$/.test(String(a[0])))a[0]='-'+Math.ceil(want);base&&base.apply(null,a);}catch(_){}}
 return hit?'hit':(r||'blocked');}
function step(){
 if(typeof room!=='undefined'&&room!==lastRoom){lastRoom=room;active=null;burst=null;nextAt=null;boss=null;}
 const t=T();if(t<prefAt||t-prefAt>=1){prefAt=t;prefOn=on();}
 if(burst&&t-burst.t0>BURST)burst=null;
 if(!prefOn||typeof player==='undefined'||!player||!(player.hp>0)||!Number.isFinite(player.x)||!Number.isFinite(player.y)||blockedNow()){cancel();return;}
 const e=liveBoss();if(e!==boss){boss=e;nextAt=e?t+FIRST:null;}
 if(!e||Math.hypot(player.x-e.x,player.y-e.y)>RANGE){cancel();if(e&&nextAt!=null&&nextAt<t+FIRST)nextAt=t+FIRST;return;}
 if(active){if(t-active.t0>=WARN){const a=active;active=null;burst={x:a.x,y:a.y,t0:t};
   if(Math.hypot(player.x-a.x,player.y-a.y)<=REACH){const r=strike(e);if(r==='hit')stats.hits++;else stats.blocked++;}else stats.dodged++;}
  return;}
 if(nextAt!=null&&t>=nextAt){active={x:player.x,y:player.y,t0:t,bx:e.x,by:e.y};nextAt=t+GAP;stats.casts++;stats.lastCastAt=t;}
}
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r&&r.ready!==false&&r.image)return r.image;}catch(_){}try{if(typeof addImage==='function')addImage(p,'R1042 키스 입술 시트');}catch(_){}return null;}
// 바닥 한 칸의 화면 가로 반폭(쿼터뷰 x 축 한 칸의 가로 성분). 바닥 원 반지름 R칸 → 화면 가로 반지름 ≈ R×이 값×√2.
function tileHalfW(x,y){try{const a=project(x,y),b=project(x+1,y),d=Math.abs(b.x-a.x);if(d>1e-3&&Number.isFinite(d))return d;}catch(_){}return 34;}
const AH=()=>{try{const v=typeof actorHeight==='function'?actorHeight():66;return Number.isFinite(v)&&v>0?v:66;}catch(_){return 66;}};
// 한 장 그리기: sheet 의 k 번째 칸을 칸 자리 (x,y)에서 화면으로 dy 만큼 위에, 높이 hPx 로. 좌표·크기·알파가 하나라도 수가 아니면 그리지 않는다.
function put(id,sh,i,x,y,hPx,alpha,ground,dy=0){const q=project(x,y);if(!Number.isFinite(q?.x)||!Number.isFinite(q?.y))return;
 const h=clamp(fin(hPx),8,900),a=clamp(fin(alpha),0,1),k=clamp(Math.floor(fin(i)),0,sh.n-1),oy=fin(dy);if(!(a>.01)||!img(sh.path))return;
 const fr={path:sh.path,assetFrame:{sourceRect:[k*sh.cell,0,sh.cell,sh.cell],pivot:[sh.cell/2,sh.cell/2],visibleHeight:sh.cell}};
 const paint=()=>{ctx.save();try{drawAssetFrame3(sh.path,fr,q.x,q.y-oy,h,{alpha:a});}finally{ctx.restore();}};
 if(typeof ctx.scope==='function')ctx.scope({id:'r1042:'+id,kind:'effect',sourcePath:sh.path,pxfSide:'enemy',x,y,groundAligned:!!ground,lightShadowApproved:true},paint);else paint();stats.draws++;}
function draw(){if(typeof project!=='function'||typeof drawAssetFrame3!=='function'||typeof ctx==='undefined'||!ctx)return;const t=T(),ah=AH();
 if(active){const el=t-active.t0,u=clamp(el/WARN,0,1),tag=active.t0.toFixed(2),ring=2*REACH*tileHalfW(active.x,active.y)*Math.SQRT2/.62;
  // 노린 자리: 분홍 불꽃 고리 루프. 고리 지름(시트 칸의 약 62%)이 맞는 범위(반지름 REACH)와 같게. 끝으로 갈수록 진해진다.
  put('aura:'+tag,SH.aura,Math.floor(el*SH.aura.fps)%SH.aura.n,active.x,active.y,ring,.7+.3*u,true,ring*.12);
  const hasBoss=boss&&Number.isFinite(boss.x)&&Number.isFinite(boss.y);
  // 보스 입가(칠죄 보스 키 = 영웅 키의 2.1배(R463) → 입가는 영웅 키의 약 1.7배 높이): 자홍 소용돌이가 모였다가(입맞춤을 불어 보냄) 앞 45% 동안
  if(hasBoss&&u<.5)put('gather:'+tag,SH.gather,Math.floor(el*SH.gather.fps*1.8),boss.x,boss.y,ah*1.2,.95,false,ah*1.7);
  // 뒤 55%: 같은 소용돌이가 보스 입가에서 노린 자리로 날아가며 내려앉는다(입맞춤이 날아옴)
  if(hasBoss&&u>=.45){const v=clamp((u-.45)/.55,0,1),x=boss.x+(active.x-boss.x)*v,y=boss.y+(active.y-boss.y)*v,lift=ah*(1.7*(1-v)+.4*Math.sin(Math.PI*v)+.35*v);
   put('fly:'+tag,SH.fly,4+Math.floor(el*SH.fly.fps)%3,x,y,ah*1.45,1,false,lift);}}
 if(burst){const i=Math.floor((t-burst.t0)*SH.hit.fps);if(i<SH.hit.n)put('hit:'+burst.t0.toFixed(2),SH.hit,i,burst.x,burst.y,ah*1.7,1-.4*i/SH.hit.n,false,ah*.45);}}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);
 try{if(typeof started!=='undefined'&&started&&!(typeof loading!=='undefined'&&loading))step();else cancel();}catch(err){fail(err);active=null;}sentinel(!!(active||burst));return r;};}
// 효과 단계에서 표지 효과 한 개로 그린다(R474 와 같은 길: 바닥 층에 그리면 지형·영웅 층에 덮임). pxfSide 'enemy' = 적 예고라 R350 영웅 가림에서 빠짐.
const SENT={type:'r1042-kiss',x:0,y:0,age:0,life:Infinity,r1042Sentinel:true};
function sentinel(want){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;const i=effects.indexOf(SENT);
 if(want&&i<0)effects.push(SENT);else if(!want&&i>=0)effects.splice(i,1);SENT.age=0;}catch(_){}}
let wrapped=false;function wrapEffect(){if(wrapped||typeof drawEffect!=='function')return wrapped;const base=drawEffect;
 drawEffect=function(e,...a){if(e&&e.r1042Sentinel){try{draw();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};wrapped=true;return true;}
if(!wrapEffect()&&typeof setTimeout==='function'){let n=0;(function arm(){if(wrapEffect()||++n>40)return;setTimeout(arm,250);})();}
window.__STORYWORLD_KISS_LIPS_R1042__=Object.freeze({revision:REV,
 inspect:()=>({revision:REV,on:prefOn,active:active?{...active}:null,burst:burst?{...burst}:null,nextAt,timing:{FIRST,GAP,WARN,REACH,RANGE,RATIO},stats:{...stats,last:stats.last?{...stats.last}:null}})});
})();
