// R1238 — 막혀서 제자리인 이동을 서기 그림으로(사용자 2026-11-19 12:01Z "네온 우측이동및 대기모션이 잘 출력이 안되는 이미지 깜빡거리는 버그",
//  12:02Z "천사가면과의목사후보생맵 … 보스방 문 앞쪽구역").
//  원인(헤드리스 기록 qa/r1238): 보스 문(door-0)이 닫혀 있는 앞에서 오른쪽으로 밀면 '이동 중'(player.moving) 표시는 켜진 채 위치가 그대로다.
//   R119 걷기 덧그림은 R134 규칙(실제로 움직였을 때만 걷기)으로 손을 떼고, R93 서기 덧그림은 '이동 중'이라 손을 떼어,
//   엔진의 옛 달리기 정지 그림(actions-v3126 <영웅>-move-<4방향>)이 그대로 나왔다. 엔진 4방향은 화면 오른쪽(+x·-y 칸) 밀기를 'left' 로 골라
//   오른쪽을 보고 미는데 왼쪽을 보는 그림이 나오고, 벽에 살짝 미끄러질 때마다 오른쪽 걷기 그림과 번갈아 좌우로 깜빡였다(기록: 3초 밀기 중 60장).
//  고침: 조종 영웅이 '이동 중'인데 0.15초(R119·R134 와 같은 창) 넘게 실제로 움직이지 않았고 공격·스킬·피격·대시·막기가 아니면,
//   그리는 동안만 '이동 중'을 끄고 그린다 → 서기 덧그림(R93·R130 서기 시트, 보는 쪽 그대로·없는 쪽은 반대쪽 좌우 반전)이 그린다. 그린 뒤 원래 값으로 되돌린다.
//  판정·이동·충돌·피해·세이브는 바꾸지 않는다(그리는 순간의 표시만). 끄기: localStorage storyworld.r1238.blocked = {"on":false}
(()=>{'use strict';
if(window.__STORYWORLD_HERO_BLOCKED_R1238__)return;
const REV='R1238-hero-blocked-1',KEY='storyworld.r1238.blocked',STILL=.15,EPS=.004;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={draws:0,blocked:0,errors:0};let lastError=null;
const st={x:null,y:null,movedAt:-9,hero:null};
const now=()=>typeof time==='number'&&Number.isFinite(time)?time:0;
const busy=P=>P.attackAnim>0||P.skillAnim>0||P.ultimateAnim>0||P.hurtAnim>0||P.dashAnim>0||!!P.guard;
// 그리는 이번 순간에 '막혀서 제자리'인지(위치 변화는 그릴 때마다 잰다 — R119 와 같은 방식)
function blockedNow(P){const t=now();
 if(st.hero!==P.hero||st.x==null||!Number.isFinite(P.x)||!Number.isFinite(P.y)){st.hero=P.hero;st.x=P.x;st.y=P.y;st.movedAt=t;return false;}
 const d=Math.hypot(P.x-st.x,P.y-st.y);if(d>EPS&&d<1.2)st.movedAt=t;else if(d>=1.2)st.movedAt=t;/* 순간이동·지역 이동도 새로 시작 */
 st.x=P.x;st.y=P.y;if(t<st.movedAt)st.movedAt=t;/* 시간이 되감긴 경우(새 판) */
 return !!P.moving&&t-st.movedAt>=STILL&&!busy(P);}
let wrapped=false;
function install(){if(wrapped||typeof drawHero!=='function')return;const base=drawHero;
 drawHero=function(...a){const P=typeof player==='object'?player:null;let flip=false;
  try{if(prefs.on&&P&&!P.r720Ally){stats.draws++;if(blockedNow(P)){flip=true;stats.blocked++;}}}catch(e){stats.errors++;lastError=String(e?.message||e).slice(0,160);}
  if(!flip)return base.apply(this,a);
  const was=P.moving;P.moving=false;try{return base.apply(this,a);}finally{P.moving=was;}};
 wrapped=true;}
// 다른 오버레이(R119·R1108 등)가 load 때 drawHero 를 감싸므로 그 뒤 맨 바깥에서 감싼다.
if(typeof document==='object'&&document&&document.readyState==='complete')setTimeout(install,0);else if(typeof window.addEventListener==='function')window.addEventListener('load',()=>setTimeout(install,0));
window.__STORYWORLD_HERO_BLOCKED_R1238__=Object.freeze({revision:REV,still:STILL,
 setPrefs:v=>{prefs={...prefs,...(v||{})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};},
 test:Object.freeze({blockedNow,busy,reset:()=>{st.x=st.y=st.hero=null;st.movedAt=-9;}}),
 inspect:()=>({revision:REV,prefs:{...prefs},wrapped,...stats,lastError,presentationOnly:true,gameplayChanged:false})});
})();
