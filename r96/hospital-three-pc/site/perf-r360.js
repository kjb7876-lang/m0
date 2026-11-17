// R360 병원(ep1a08) 길잡이 '못 가는 제단' 길 찾기 렉(사용자 2026-11-03 상시 요청 "실플레이 디버깅·렉 개선").
//  재현(헤드리스, 777 → ep1a08 이지 · 길잡이 켬, 'route' 단계, 몹 28마리 살아 있음):
//   20초 동안 findPath 16번이 모두 room.objective(보스방 피 제단 15,13)로 가는 '길 없음'이었고 합계 2,409ms(한 번 약 150ms).
//   부르는 곳 = R101 objectiveBlocked/guideDoorStep(가까운 몹이 8칸 밖이면 매 장면)·R75 길잡이. R272 가 '못 찾음'을 1.5초만 기억하므로
//   1.5초마다 한 번씩 미로 전체(문 가장자리마다 clearPath3)를 다시 뒤져 그 장면이 150ms 멈췄다(CPU 표본: guideStep 아래 1,145ms/6초).
//  ep1a08 에서 제단까지 길이 열리는 건 병원 단계(hospital-maze-progression phase)나 R74 문 세대가 바뀔 때뿐이다(둘 다 R272 열쇠에 있음).
//  고침: ep1a08 에서만, 출발점·도착점이 막힌 칸이 아니었는데(= 미로를 다 뒤진 진짜 '길 없음') 길이 없으면 같은 열쇠
//   (방 객체 · 도착 칸 0.5 · 반지름 · R74 세대 · 병원 단계)로 20초 기억한다. 단계·문 세대가 바뀌면 열쇠가 달라져 곧바로 다시 찾는다.
//   길이 있는 결과는 기억하지 않는다. 영웅 자리에서 떠나는 길 찾기만 대상이다 — 몹 AI 길 찾기·다른 지역·출발점이 막힌 칸은 그대로.
//  판정·충돌·진행·난이도·그림은 그대로. 끄기: localStorage['storyworld.r360.perf']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_PERF_R360__)return;
const REV='R360-perf-1',KEY='storyworld.r360.perf',TTL=20000,ZONES=new Set(['ep1a08']);
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={calls:0,held:0,stored:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const memo=new WeakMap();
// 순수(QA): 열쇠
function key(to,radius,gen,phase){return [Math.round(to.x*2),Math.round(to.y*2),Number(radius??.29).toFixed(2),gen,phase].join(':');}
function ctx(){let gen=0,phase='';try{gen=window.__STORYWORLD_WORLD_R74__?.generation?.()||0;}catch(_){}try{phase=window.__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__?.inspect?.()?.state?.phase||'';}catch(_){}return{gen,phase};}
const now=()=>performance.now();
// 영웅 자리에서 떠나는 길 찾기(R101 objectiveBlocked/guideDoorStep·R75 길잡이)만 기억한다. 몹 AI 길 찾기는 R74 가 0.25초당 2번으로 나눠 주고
// 넘치면 탐색 없이 빈 길(pathActor.nav||[])을 돌려주므로, 그것을 '길 없음'으로 기억하면 그 몹(과 같은 목적지의 다른 몹)이 20초 동안 길을 못 얻는다(Codex 4485372023).
function heroFrom(from){try{const p=typeof player!=='undefined'?player:null;return !!p&&(from===p||Math.hypot(from.x-p.x,from.y-p.y)<.05);}catch(_){return false;}}
try{const base=findPath;findPath=function(from,to,r,radius){
 let rr=null,k=null,m=null;
 try{rr=r||(typeof room!=='undefined'?room:null);if(on&&rr&&ZONES.has(rr.id)&&from&&to&&Number.isFinite(from.x+from.y+to.x+to.y)&&heroFrom(from)){stats.calls++;const c=ctx();k=key(to,radius,c.gen,c.phase);m=memo.get(rr);const t=m&&m.get(k);if(t!==undefined&&now()-t<TTL){stats.held++;return[];}}else k=null;}catch(e){fail(e);k=null;}
 const out=base.apply(this,arguments);
 try{if(k&&Array.isArray(out)&&!out.length&&typeof blocked==='function'){const rad=radius??.29;
   // 출발점·도착점이 막힌 칸이면 엔진이 곧바로 빈 길을 돌려준 것(싸게 끝남, 자리만 옮기면 풀림) — 기억하지 않는다.
   if(!blocked(from.x,from.y,rad,rr)&&!blocked(to.x,to.y,rad,rr)){if(!m){m=new Map();memo.set(rr,m);}if(m.size>128)m.clear();m.set(k,now());stats.stored++;}}}catch(e){fail(e);}
 return out;};}catch(e){fail(e);}
window.__STORYWORLD_PERF_R360__=Object.freeze({revision:REV,key,ttl:TTL,zones:[...ZONES],on:()=>on,
 set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,on,stats:{...stats},lastError,browserVerified:false,GPUVerified:false})});
})();
