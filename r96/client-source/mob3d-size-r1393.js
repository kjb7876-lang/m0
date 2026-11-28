// R1393 3D 몹 크기 출렁임 고침(사용자 2026-11-28 "3몹크기랑 모션 조절잘해주고").
//  공개판 헤드리스 전수(14개 지역·3D 17종): 2D 보이는 키 대비 3D 화면 키 중앙값은 1.00~1.08 로 맞지만, 걷는 중 순간 키가 .6~1.3배로 출렁였다.
//  원인: R1316~R1382 3D 모듈 9개가 12장면마다 '지금 자세'의 화면 키 m 으로 보정 corr = c·√(target/m) 를 다시 셈 →
//   걷기·대기 동작이 몸을 웅크리거나 뻗을 때마다 크기가 그 반대로 따라가 동작을 지우고(모션이 밋밋·부자연), 몸이 숨 쉬듯 커졌다 작아졌다.
//  고침: 처음 3번은 예전처럼 한 번에 맞추고, 그 뒤는 최근 31표본(각 표본 = 그 순간 맞춰야 할 배율 target·c/m)의 중앙값을 향해 한 번에 ±1% 만 움직인다.
//   → 평균 크기는 2D 와 같고, 동작 위상에 따른 크기 변화는 동작 그대로 남는다. 판정·반지름·AI 는 안 바뀜(그림 배율만).
//  끄기: localStorage storyworld.r1393.mob3dSize='off' / ?size93=0 → 각 모듈 예전 식.
(()=>{'use strict';
if(window.__STORYWORLD_MOB3D_SIZE_R1393__)return;
const REV='R1393-mob3d-size-1',KEY='storyworld.r1393.mob3dSize',N=31,STEP=.01,FIRST=3;
let on=true;try{if(localStorage.getItem(KEY)==='off')on=false;}catch(_){}
try{const q=new URLSearchParams(location.search||'').get('size93');if(q==='0')on=false;else if(q==='1')on=true;}catch(_){}
const clamp=v=>Math.max(.6,Math.min(1.8,v));const stats={calls:0,first:0,steps:0,capped:0};
function corr(i,c,target,m){if(!on)return undefined;stats.calls++;
 if(!(Number.isFinite(c)&&c>0))c=1;if(!(Number.isFinite(target)&&target>0&&Number.isFinite(m)&&m>0))return c;
 const want=c*target/m;const s=i.r1393s||(i.r1393s=[]);s.push(want);if(s.length>N)s.shift();
 if(s.length<=FIRST&&!(i.corrN>=FIRST)){stats.first++;return clamp(want);}
 const med=[...s].sort((a,b)=>a-b)[s.length>>1];const d=Math.max(-STEP*c,Math.min(STEP*c,med-c));if(Math.abs(med-c)>STEP*c)stats.capped++;stats.steps++;return clamp(c+d);}
window.__STORYWORLD_MOB3D_SIZE_R1393__=Object.freeze({revision:REV,corr,on:()=>on,set:v=>{on=v==='on'||v===true;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}return on;},
 inspect:()=>({revision:REV,on,stats:{...stats},presentationOnly:true,gameplayChanged:false})});
})();
