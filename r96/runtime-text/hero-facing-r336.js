// R336 — 사용자 2026-11-05 "대각선 움직임이 없는 영웅은 좌우 모션을 많이 사용하고 위아래 모션은 확실할 때만, 즉 360도라면 240도는 좌우 모션으로".
//  엔진 facing(x,y)(공격·대기·피격 때 영웅 방향 4가지를 고름)은 화면 각도로 좌우가 약 146°, 위·아래가 214° 였다(|가로| > |세로|×1.35 일 때만 좌우).
//  → 좌우 240°(수평에서 ±60° 안), 위·아래 120°(수직에서 ±30° 안)로: |가로| > |세로|×tan30°(0.577) 이면 좌우.
//  · 걷기(R119 8방향, 대각선 그림이 있는 영웅은 대각선 그대로)는 따로 고르므로 건드리지 않는다. 끄기: localStorage['storyworld.r336.facing']='0'.
(()=>{'use strict';
if(window.__STORYWORLD_HERO_FACING_R336__)return;
const REV='R336-facing-1',KEY='storyworld.r336.facing',K=Math.tan(Math.PI/6);
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={calls:0,side:0,vertical:0};
let installed=false;
if(typeof facing==='function'){const base=facing;facing=function(x,y){if(!on)return base.apply(this,arguments);stats.calls++;const sx=x-y,sy=(x+y)*.5;
  if(Math.abs(sx)>Math.abs(sy)*K){stats.side++;return sx>0?'right':'left';}stats.vertical++;return sy>0?'front':'back';};installed=true;}
window.__STORYWORLD_HERO_FACING_R336__=Object.freeze({revision:REV,installed,K,
 inspect:()=>({revision:REV,on,installed,stats:{...stats}}),
 set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return on;}});
})();
