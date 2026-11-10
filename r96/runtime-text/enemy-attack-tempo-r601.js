// R601 — 적 공격 모션을 2배 빠르게 그린다(사용자 2026-11-10 "적공격모션 지금의 2배는 빠르게 재생되어서 모션어색한거 티안나게").
//  · 몹 몸 그림(R54 자세·R92/R109 띠·R208/R200/R374/R375/R380 칸 띠·R306 변형)과 몸 동작(R101 기울기·R286/R161 찌르기 등)은
//    모두 drawEnemy 안에서 e.attack.elapsed(공격 경과 시간)로 칸·자세를 고른다. 그래서 그리는 그 한 번 동안만 elapsed 를
//    '보이는 시간'으로 바꿨다가 곧바로 실제 값으로 되돌린다(R442 와 같은 방식). AI·피해·판정·쿨다운은 이 짧은 호출 밖에서 실제 시간만 본다.
//  · 보이는 시간(배율 k=2, 준비 W·타격 A·회복 R):
//      준비: v=min(k·t, W 바로 앞) → 준비 동작이 2배로 흐른 뒤 '다 당긴 자세'로 판정 순간까지 버틴다(예고는 더 일찍 보임, 반응 시간 줄지 않음).
//      t≥W: v=W+k·(t−W), 공격 끝 바로 앞에서 멈춤 → 타격 칸이 피해 프레임과 같은 순간에 시작하고 회복도 2배로 끝난다.
//    v≥W ⇔ t≥W 라 '준비/타격' 경계에 묶인 모든 판단(한 번만 나는 이펙트·접촉 판정 등)은 그대로다.
//  · 예고 도형(근접 예고·발판 테두리·바닥 예고 그림·예고 안내선)은 그 함수가 도는 동안 실제 시간으로 돌려 놓아 진행 막대가 바뀌지 않는다.
//  · 다루지 않음: 원거리 조준(rangedWindup)·R54 시전 시계·R442 기술 자세는 게임 시간(time)으로 칸을 골라 여기서 바꾸지 않는다.
//  · 끄기: localStorage storyworld.r601.attackTempo = {"on":false}, 배율 {"rate":2}(1~4).
(()=>{'use strict';
if(window.__STORYWORLD_ATTACK_TEMPO_R601__)return;
const REV='R601-attack-tempo-1',KEY='storyworld.r601.attackTempo',EPS=1e-3;
let prefs={on:true,rate:2};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const fin=Number.isFinite,stats={draws:0,remapped:0,telegraphReal:0,errors:0};let lastError=null;
const rate=()=>{const r=+prefs.rate;return fin(r)?Math.max(1,Math.min(4,r)):2;};
function visual(t,W,A,R,k=rate()){
 if(!(t>0))return t;
 if(t<W)return Math.min(k*t,W*(1-EPS));
 const v=W+k*(t-W),A0=fin(A)?Math.max(0,A):0,end=fin(R)?W+A0+Math.max(0,R):Infinity;
 return end>W?Math.min(v,Math.max(W,end-EPS*Math.max(1,end))):v;}
function shapeOf(e,a){const s=a.shape154||e.combatProfile?.attackShape||null;const W=fin(a.castWindup150)?a.castWindup150:s?.windup;
 if(!fin(W)||W<=0)return null;return{W,A:s?.active,R:s?.recovery};}
let cur=null;
function realDuring(fn){return function(...args){const c=cur;if(!c||c.a.elapsed!==c.vis)return fn.apply(this,args);
 c.a.elapsed=c.real;stats.telegraphReal++;try{return fn.apply(this,args);}finally{if(c.a.elapsed===c.real)c.a.elapsed=c.vis;}};}
const tele=[];const wrapT=(name,f)=>{tele.push(name);return realDuring(f);};
try{if(typeof drawMeleeWarning154==='function')drawMeleeWarning154=wrapT('drawMeleeWarning154',drawMeleeWarning154);
 if(typeof strokeFootprint154==='function')strokeFootprint154=wrapT('strokeFootprint154',strokeFootprint154);
 if(typeof drawNativeGroundArt154==='function')drawNativeGroundArt154=wrapT('drawNativeGroundArt154',drawNativeGroundArt154);
 if(typeof drawTelegraphGuide39==='function')drawTelegraphGuide39=wrapT('drawTelegraphGuide39',drawTelegraphGuide39);}catch(err){stats.errors++;lastError=String(err?.message||err).slice(0,160);}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...rest){
 stats.draws++;let c=null;
 try{const a=prefs.on?e?.attack:null;if(a&&fin(a.elapsed)&&e.hp>0){const s=shapeOf(e,a);if(s){const v=visual(a.elapsed,s.W,s.A,s.R);
  if(v!==a.elapsed){c={a,real:a.elapsed,vis:v};a.elapsed=v;stats.remapped++;}}}}catch(err){stats.errors++;lastError=String(err?.message||err).slice(0,160);c=null;}
 if(!c)return base.call(this,e,...rest);
 const prev=cur;cur=c;try{return base.call(this,e,...rest);}finally{cur=prev;if(c.a.elapsed===c.vis)c.a.elapsed=c.real;}};}
function set(k,v){prefs[k]=k==='rate'?+v:!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_ATTACK_TEMPO_R601__=Object.freeze({revision:REV,visual,set,rate,
 inspect:()=>({revision:REV,prefs:{...prefs},rate:rate(),stats:{...stats},telegraphRealTime:[...tele],lastError,browser:false,GPU:false})});
})();
