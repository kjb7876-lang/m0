// R1236 — 블링크 때 카메라가 늦게 따라가던 문제(사용자 2026-11-19 "미카엘라등 영웅들 블링크쓸때 카메라가 늦게 따라가는거 개선").
//  원인: 카메라는 영웅을 지수 추적만 한다. PC 이야기 지역은 R81 안정 추적(gain 1-exp(-9dt)), 모바일·그 밖은 엔진 카메라(여유 칸 + 1-exp(-8dt)).
//  걷기에는 부드럽지만 블링크처럼 한 순간에 3~4칸 옮기면 화면 차이가 0.1초 뒤에도 41~45% 남고 0.25초쯤 끌려온다.
//  고침: 가장 바깥에서 cameraTick 을 감싸, 카메라 한 번 사이에 영웅이 1.2칸 넘게 옮겨졌거나(블링크·순간이동) 30칸/초 꼴로 빠르게
//  옮겨지면(0.45칸 넘게 + 14칸/초 넘게 = 돌진) 0.22초 동안 카메라에 넘기는 시간을 6배(상한 .25초)로 준다.
//  → 한 프레임에 끊어 붙이지 않고 약 0.1초 안에 90% 넘게 따라잡는다(짧고 부드러운 휙). 걷기·달리기·저프레임은 그대로.
//  지역·영웅·플레이어 객체가 바뀐 순간, 로딩·창이 열린 동안은 켜지 않는다(엔진이 맞춤). 판정·이동·밸런스는 바꾸지 않는다.
//  R114 원거리 실검무 기준점·R1124 무한생존 고정은 안쪽에서 그대로 돈다(이 파일은 시간만 바꿔 넘긴다).
// R1266 — 사용자 2026-11-20 "모든영웅 s블링크 하면 카메라 뒤늦게 따라오는거 짜증난데 개선해줘": 위 6배 방식도 카메라들(R81·R1245·R63)이
//  한 번에 dt .1 까지만 받아 블링크 뒤 첫 화면에 차이 41%가 남았다(헤드리스 1280×720 41px→25→18→15, 3~4프레임).
//  이제 순간이동·돌진을 본 그 카메라 갱신 안에서 안쪽 카메라 사슬을 dt .1 로 몇 번 더 돌려(최대 24번, 카메라가 멈추면 끝) 바로 맞춘다 → 지연 0.
//  카메라마다 자기 방식(R81 가운데·R63 가운데·R114 실검무 기준점·R1124 무한생존 고정)을 그대로 따르므로 기준점·고정은 깨지지 않는다.
(()=>{'use strict';
if(window.__STORYWORLD_BLINK_CAMERA_R1236__)return;
const REV='R1236-R1266-blink-camera-2',JUMP=1.2,DASH_STEP=.45,DASH_SPEED=14,SETTLE_DT=.1,SETTLE_MAX=24,EPS=1e-4;
const stats={ticks:0,boosts:0,snaps:0,settleCalls:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
let on=true,last=null,lastJump=0;
function read(){let p=null,rm=null,busy=false;
 try{p=typeof player!=='undefined'?player:null;}catch(_){}
 try{rm=typeof room!=='undefined'?room:null;}catch(_){}
 try{busy=!!((typeof loading!=='undefined'&&loading)||(typeof modal!=='undefined'&&modal));}catch(_){}
 return {p,rm,busy};}
// 이번 카메라 갱신에서 바로 맞춰야 하는가(순간이동 1.2칸 넘음, 또는 0.45칸 넘게 + 14칸/초 넘는 돌진)
function jumped(dt){
 const {p,rm,busy}=read();const fin=!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 if(!on||!fin||busy){last=null;return false;}
 const L=last,okDt=Number.isFinite(dt)&&dt>0;let hit=false;
 if(L&&L.player===p&&L.room===rm&&L.hero===p.hero){const j=Math.hypot(p.x-L.x,p.y-L.y);
  if(j>=JUMP||(okDt&&j>=DASH_STEP&&j/dt>=DASH_SPEED)){hit=true;stats.boosts++;lastJump=+j.toFixed(2);}}
 last={x:p.x,y:p.y,player:p,room:rm,hero:p.hero};return hit;}
const camXY=()=>{try{return (typeof cam!=='undefined'&&cam&&Number.isFinite(cam.x)&&Number.isFinite(cam.y))?{x:cam.x,y:cam.y}:null;}catch(_){return null;}};
if(typeof cameraTick==='function'){const base=cameraTick;cameraTick=function(dt,...a){stats.ticks++;let snap=false;try{snap=jumped(dt);}catch(e){fail(e);}
 const r=base.call(this,dt,...a);
 if(snap){try{let prev=camXY();for(let i=0;i<SETTLE_MAX;i++){base.call(this,SETTLE_DT,...a);stats.settleCalls++;const c=camXY();if(!c||!prev||Math.abs(c.x-prev.x)+Math.abs(c.y-prev.y)<EPS)break;prev=c;}stats.snaps++;}catch(e){fail(e);}}
 return r;};}
function set(v){on=!!v;last=null;return on;}
window.__STORYWORLD_BLINK_CAMERA_R1236__=Object.freeze({revision:REV,set,on:()=>on,config:Object.freeze({JUMP,DASH_STEP,DASH_SPEED,SETTLE_DT,SETTLE_MAX,EPS}),
 inspect:()=>({revision:REV,on,boosting:false,lastJump,stats:{...stats},lastError})});
})();
