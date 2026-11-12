// R706 실검무 중에도 본체는 직접 조종 — 사용자 2026-11-12 "분신이 있는자리에서 분신이 작동하네 … 분신 모습만 잠깐 나왔다가 사라지는거, 본체는 항상 본체쪽에서 작동 모든영웅",
//  "기본모드 실입력해도 가끔 위치고정되고 안움직이던데", "뭔가 벽이있는 느낌이야 앞으로갔다 되돌아오는", "d공명누르면 풀리는 경우가 있음".
//  원인(헤드리스 재현, last302 슬레이어 A 누른 채 걷기): 엔진 실검무(R63/R74, R597 A키 오토·반자동·길잡이가 자동 시전)가 타격마다 영웅을 적 곁 빈칸으로 옮기고
//   끝나면 시작 자리로 되돌린다 → 그동안 걸어도 0.3초에 7~9칸 끌려갔다 돌아온다(원거리는 R113 고정점이 시작 자리에 묶어 둠). 공명방어는 춤을 끊어서 풀린 것처럼 보였다.
//  고침: 춤이 도는 동안(__STORYWORLD_DANCES_R74__.moving) 본체 자리를 따로 기억한다.
//   · 걷기(moveActor)는 기억한 본체 자리에서 계산해 본체 자리에 쌓는다(벽 판정·속도 배수는 엔진 그대로).
//   · 춤의 타격은 엔진이 하던 대로 적 곁 자리에서 일어난다(피해 자리·피해량·쿨타임 그대로). tick 이 끝나면 영웅을 본체 자리로 되돌리고, 타격 자리에는 영웅 분신(엔진 ghost)을 잠깐 남긴다.
//   · 춤이 끝날 때 엔진이 시작 자리로 되돌리는 것도 본체 자리로 덮는다. 블링크는 옮긴 자리를 본체 자리로 삼는다. 지역이 바뀌면 기억을 버린다.
//  엔진 춤 코드·저장·피해 규칙은 건드리지 않는다. 협동 모드는 손대지 않는다(권한이 호스트에 있음).
//  끄기: localStorage 'storyworld.r706.danceFree'='0' 또는 __STORYWORLD_DANCE_FREE_R706__.set(false).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_DANCE_FREE_R706__)return;
const REV='R706-dance-free-1',KEY='storyworld.r706.danceFree',GHOST_GAP=.12,GHOST_LIFE=.28,MIN_SHIFT=.35;
let on=true;try{if(localStorage.getItem(KEY)==='0')on=false;}catch(_){}
const stats={ticks:0,restores:0,ghosts:0,blinks:0,resets:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const g=f=>{try{return f();}catch(_){return undefined;}};
const P=()=>g(()=>typeof player==='object'?player:null);
const T=()=>g(()=>typeof time==='number'?time:0)||0;
const solo=()=>{const m=g(()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.());return !m||m==='off';};
const dancing=p=>g(()=>window.__STORYWORLD_DANCES_R74__?.moving?.(p))===true;
const curRoom=()=>g(()=>typeof room!=='undefined'?room:null);
let body=null,bodyRoom=null,start=null,inTick=0,lastGhost=-1e9,fxBase=null;
const active=()=>on&&solo();
function reset(){if(body)stats.resets++;body=null;bodyRoom=null;}
function ghost(x,y){const t=T();if(t-lastGhost<GHOST_GAP)return;const p=P();if(!p||!fxBase)return;
 const art=g(()=>heroArt[p.hero]),dir=p.direction||'front',asset=art&&((art.attack&&(art.attack[dir]||art.attack.front))||(art.idle&&(art.idle[dir]||art.idle.front)));if(!asset)return;
 try{fxBase('ghost',x,y,{asset,life:GHOST_LIFE,size:1,r706:true});lastGhost=t;stats.ghosts++;}catch(e){fail(e);}}
if(typeof fx==='function'){const base=fx;fxBase=(...a)=>base.apply(null,a);}
// 걷기: 춤 중에는 본체 자리에서 계산한다.
if(typeof moveActor==='function'){const base=moveActor;moveActor=function(actor,dx,dy,...a){const p=P();
 if(!inTick||!active()||!p||actor!==p||!(body||dancing(p)))return base.call(this,actor,dx,dy,...a);
 if(!body){body=start?{x:start.x,y:start.y}:{x:p.x,y:p.y};bodyRoom=curRoom();}
 const cx=p.x,cy=p.y;p.x=body.x;p.y=body.y;let r;try{r=base.call(this,actor,dx,dy,...a);}finally{body.x=p.x;body.y=p.y;p.x=cx;p.y=cy;}return r;};}
// 블링크: 옮긴 자리가 새 본체 자리.
if(typeof blink==='function'){const base=blink;blink=function(...a){const p=P(),bx=p?.x,by=p?.y,r=base.apply(this,a);
 try{if(body&&p&&(p.x!==bx||p.y!==by)){body.x=p.x;body.y=p.y;stats.blinks++;}}catch(e){fail(e);}return r;};}
if(typeof tick==='function'){const base=tick;tick=function(dt,...a){const p=P();
 if(!active()||!p){if(body)reset();return base.call(this,dt,...a);}
 if(body&&bodyRoom!==curRoom())reset();
 start=inTick?start:{x:p.x,y:p.y};inTick++;let r;try{r=base.call(this,dt,...a);}finally{inTick--;}
 if(inTick)return r;
 try{const q=P();if(q!==p||bodyRoom&&bodyRoom!==curRoom()){reset();return r;}
  const d=dancing(p);if(!d&&!body)return r;stats.ticks++;
  if(!body){body={x:start.x,y:start.y};bodyRoom=curRoom();}
  if(!(p.hp>0)){reset();return r;}
  const shift=Math.hypot(p.x-body.x,p.y-body.y);
  if(shift>1e-9){if(d&&shift>=MIN_SHIFT)ghost(p.x,p.y);p.x=body.x;p.y=body.y;stats.restores++;}
  if(!d){body=null;bodyRoom=null;}}catch(e){fail(e);}return r;};}
if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=function(...a){reset();return base.apply(this,a);};}
function set(v){on=v!==false;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}if(!on)reset();return on;}
window.__STORYWORLD_DANCE_FREE_R706__=Object.freeze({revision:REV,on:()=>on&&solo(),enabled:()=>on,set,
 state:()=>({on,body:body?{...body}:null,dancing:!!(P()&&dancing(P()))}),stats:()=>({...stats,lastError})});
})();
