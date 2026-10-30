// R141 — 렉 줄이기(측정 근거: 헤드리스 dist00 전투 15초, 게임 JS 한 장면 80ms 중 충돌 검사 blocked() 가 장면마다 1,678번,
//  그 77%가 시야 검사 clearLine(0.24칸마다 blocked) — 여러 기능(적 AI·자동 조준·길잡이·그리기)이 같은 적↔영웅 선을 한 장면에 몇 번씩 다시 잰다).
//  · 가장 큰 원인: 원본 R52 돌진 판단이 적마다 거리 확인보다 먼저 영웅까지 시야선을 잰다(30칸 밖 적도 매 장면 125번 벽 검사).
//  · 판정 규칙은 그대로이고, 같은 두 물체 사이 시야선 결과를 잠깐 다시 쓴다(아래).
// 설정 storyworld.r141.perf {lineCache:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_PERF_R141__)return;
const KEY='storyworld.r141.perf';let prefs={lineCache:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={lineCalls:0,lineHits:0,flushes:0};
// 같은 두 물체(적·영웅) 사이 선은 두 끝이 조금만(가까우면 0.15칸, 멀면 최대 0.5칸) 움직였고 잠깐(0.15~0.25초 게임 시간) 안이면 앞 결과를 다시 쓴다 — 시야가 열리고 닫히는 판단이
// 최대 0.15초(먼 적은 0.25초) 늦을 수 있지만, 멀리 있는 적까지 장면마다 수십~백여 번씩 벽을 재던 비용이 사라진다(문을 열고 닫으면 바로 비움).
let pairs=new WeakMap(),epoch=0,lastRoom=null;
// 가까운 선(3칸 안)은 0.15칸·0.15초, 먼 선은 길이에 비례해 최대 0.5칸·0.25초까지 — 멀리 있는 적의 시야는 그만큼 정밀하지 않아도 된다.
const tolOf=d=>Math.min(.5,.15+Math.max(0,d-3)*.05),ttlOf=d=>d>8?.25:.15;
function flush(){epoch++;stats.flushes++;}
if(typeof clearLine==='function'){const base=clearLine;clearLine=function(a,b,r=room,...rest){
 if(!prefs.lineCache||!a||!b||typeof a!=='object'||typeof b!=='object'||rest.length)return base.call(this,a,b,r,...rest);
 if(r!==lastRoom){lastRoom=r;epoch++;}
 stats.lineCalls++;const t=typeof time==='number'?time:0;let m=pairs.get(a);if(!m){m=new WeakMap();pairs.set(a,m);}const c=m.get(b);
 if(c&&c.epoch===epoch&&c.r===r){const d=Math.hypot(a.x-b.x,a.y-b.y),T=tolOf(d);if(t-c.t>=0&&t-c.t<ttlOf(d)&&Math.abs(a.x-c.ax)<T&&Math.abs(a.y-c.ay)<T&&Math.abs(b.x-c.bx)<T&&Math.abs(b.y-c.by)<T){stats.lineHits++;return c.v;}}
 const v=base.call(this,a,b,r);m.set(b,{v,t,r,epoch,ax:a.x,ay:a.y,bx:b.x,by:b.y});return v;};}
// 문이 열리고 닫히면 같은 장면 안이라도 결과가 달라질 수 있다.
try{const W=window.__STORYWORLD_WORLD_R74__;if(W&&typeof W.use==='function'&&!Object.isFrozen(W)){const u=W.use;W.use=function(...a){flush();return u.apply(this,a);};}}catch(_){}
if(typeof interact==='function'){const b=interact;interact=function(...a){try{return b.apply(this,a);}finally{flush();}};}
function set(k,v){prefs[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_PERF_R141__=Object.freeze({set,flush,inspect:()=>({revision:'R141-perf-1',prefs:{...prefs},stats:{...stats,hitRate:stats.lineCalls?+(stats.lineHits/stats.lineCalls).toFixed(3):0}})});
})();
