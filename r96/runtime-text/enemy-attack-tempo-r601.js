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
const REV='R601-R778-attack-tempo-2',KEY='storyworld.r601.attackTempo',EPS=1e-3;
let prefs={on:true,rate:2,flurry:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const fin=Number.isFinite,stats={draws:0,remapped:0,telegraphReal:0,errors:0};let lastError=null;
const rate=()=>{const r=+prefs.rate;return fin(r)?Math.max(1,Math.min(4,r)):2;};
function visual(t,W,A,R,k=rate()){
 if(!(t>0))return t;
 if(t<W)return Math.min(k*t,W*(1-EPS));
 const v=W+k*(t-W),A0=fin(A)?Math.max(0,A):0,end=fin(R)?W+A0+Math.max(0,R):Infinity;
 return end>W?Math.min(v,Math.max(W,end-EPS*Math.max(1,end))):v;}
// R778 보스 연타(사용자 2026-11-12 07:59Z "보스들은 공격모션 빠르게 여러번해서 생동감있게 자연스럽고"):
//  보스·중간보스·페르소나는 한 번의 공격 동안 타격 자세를 2~3번 빠르게 되풀이한다(그림만, 판정·피해 한 번 그대로).
//  준비는 R601 과 같이 2배로 당긴 뒤 판정 순간(t=W)까지 붙들고, 첫 타격 칸이 실제 판정 순간에 시작한다.
//  t≥W 구간(타격+회수)을 n 마디로 나눠, 둘째 마디부터는 앞 30% 동안 회수 자세(뒤로 당김)를 거쳐 다시 타격 → 이어짐.
//  마지막 마디는 회수까지 가서 끝난다. 보이는 시간은 늘 'v≥W ⇔ t≥W', 끝(W+A+R) 미만이라 경계에 묶인 판단은 그대로.
//  마디 수: 타격+회수 길이 / 0.3초를 반올림해 2~3(빠르게).
function flurry(t,W,A,R,k=rate()){
 if(!(t>0)||!fin(W)||W<=0||!fin(A)||!fin(R))return visual(t,W,A,R,k);
 if(t<W)return visual(t,W,A,R,k);
 const A0=Math.max(0,A),R0=Math.max(0,R),tail=A0+R0,end=W+tail,cap=end-EPS*Math.max(1,end);if(!(tail>0))return visual(t,W,A,R,k);
 const n=Math.max(2,Math.min(3,Math.round(tail/.3))),u=(t-W)/tail;if(u>=1)return cap;
 const seg=Math.min(n-1,Math.floor(u*n)),f=u*n-seg,last=seg===n-1,reach=last?tail:A0+R0*.4;
 let v;if(seg===0)v=W+f/1*(A0+R0*.4);
 else if(f<.3)v=W+A0+R0*(.62+.3*(f/.3));/* 회수 자세로 당김 */
 else v=W+((f-.3)/.7)*reach;
 return Math.max(W,Math.min(v,cap));}
const majorE=e=>!!(e&&(e.boss||e.midboss||e.persona||e.miniBoss||e.r104Boss));
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
 try{const a=prefs.on?e?.attack:null;if(a&&fin(a.elapsed)&&e.hp>0){const s=shapeOf(e,a);if(s){const fl=prefs.flurry!==false&&majorE(e);const v=fl?flurry(a.elapsed,s.W,s.A,s.R):visual(a.elapsed,s.W,s.A,s.R);if(fl)stats.flurry=(stats.flurry||0)+1;
  if(v!==a.elapsed){c={a,real:a.elapsed,vis:v};a.elapsed=v;stats.remapped++;}}}}catch(err){stats.errors++;lastError=String(err?.message||err).slice(0,160);c=null;}
 if(!c)return base.call(this,e,...rest);
 const prev=cur;cur=c;try{return base.call(this,e,...rest);}finally{cur=prev;if(c.a.elapsed===c.vis)c.a.elapsed=c.real;}};}
function set(k,v){prefs[k]=k==='rate'?+v:!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_ATTACK_TEMPO_R601__=Object.freeze({revision:REV,visual,flurry,set,rate,
 inspect:()=>({revision:REV,prefs:{...prefs},rate:rate(),stats:{...stats},telegraphRealTime:[...tele],lastError,browser:false,GPU:false})});
})();
