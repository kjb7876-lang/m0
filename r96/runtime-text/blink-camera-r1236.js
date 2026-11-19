// R1236 — 블링크 때 카메라가 늦게 따라가던 문제(사용자 2026-11-19 "미카엘라등 영웅들 블링크쓸때 카메라가 늦게 따라가는거 개선").
//  원인: 카메라는 영웅을 지수 추적만 한다. PC 이야기 지역은 R81 안정 추적(gain 1-exp(-9dt)), 모바일·그 밖은 엔진 카메라(여유 칸 + 1-exp(-8dt)).
//  걷기에는 부드럽지만 블링크처럼 한 순간에 3~4칸 옮기면 화면 차이가 0.1초 뒤에도 41~45% 남고 0.25초쯤 끌려온다.
//  고침: 가장 바깥에서 cameraTick 을 감싸, 카메라 한 번 사이에 영웅이 1.2칸 넘게 옮겨졌거나(블링크·순간이동) 30칸/초 꼴로 빠르게
//  옮겨지면(0.45칸 넘게 + 14칸/초 넘게 = 돌진) 0.22초 동안 카메라에 넘기는 시간을 6배(상한 .25초)로 준다.
//  → 한 프레임에 끊어 붙이지 않고 약 0.1초 안에 90% 넘게 따라잡는다(짧고 부드러운 휙). 걷기·달리기·저프레임은 그대로.
//  지역·영웅·플레이어 객체가 바뀐 순간, 로딩·창이 열린 동안은 켜지 않는다(엔진이 맞춤). 판정·이동·밸런스는 바꾸지 않는다.
//  R114 원거리 실검무 기준점·R1124 무한생존 고정은 안쪽에서 그대로 돈다(이 파일은 시간만 바꿔 넘긴다).
(()=>{'use strict';
if(window.__STORYWORLD_BLINK_CAMERA_R1236__)return;
const REV='R1236-blink-camera-1',JUMP=1.2,DASH_STEP=.45,DASH_SPEED=14,WINDOW=.22,K=6,CAP=.25;
const stats={ticks:0,boosts:0,boostedTicks:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
let on=true,last=null,boost=0,lastJump=0;
function read(){let p=null,rm=null,busy=false;
 try{p=typeof player!=='undefined'?player:null;}catch(_){}
 try{rm=typeof room!=='undefined'?room:null;}catch(_){}
 try{busy=!!((typeof loading!=='undefined'&&loading)||(typeof modal!=='undefined'&&modal));}catch(_){}
 return {p,rm,busy};}
function step(dt){
 const {p,rm,busy}=read();const fin=!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 if(!on||!fin||busy){last=null;boost=0;return dt;}
 const L=last,okDt=Number.isFinite(dt)&&dt>0;
 if(L&&L.player===p&&L.room===rm&&L.hero===p.hero){
  const j=Math.hypot(p.x-L.x,p.y-L.y);
  if(j>=JUMP||(okDt&&j>=DASH_STEP&&j/dt>=DASH_SPEED)){boost=WINDOW;stats.boosts++;lastJump=+j.toFixed(2);}
 }
 last={x:p.x,y:p.y,player:p,room:rm,hero:p.hero};
 if(boost>0&&okDt){boost-=dt;stats.boostedTicks++;return Math.min(CAP,dt*K);}
 if(!okDt)boost=Math.max(0,boost);return dt;}
if(typeof cameraTick==='function'){const base=cameraTick;cameraTick=function(dt,...a){let d=dt;stats.ticks++;try{d=step(dt);}catch(e){fail(e);d=dt;}return base.call(this,d,...a);};}
function set(v){on=!!v;last=null;boost=0;return on;}
window.__STORYWORLD_BLINK_CAMERA_R1236__=Object.freeze({revision:REV,set,on:()=>on,config:Object.freeze({JUMP,DASH_STEP,DASH_SPEED,WINDOW,K,CAP}),
 inspect:()=>({revision:REV,on,boosting:boost>0,lastJump,stats:{...stats},lastError})});
})();
