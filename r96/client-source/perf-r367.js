// R367 렉 개선 — 길 찾기(A*) 한 번 안에서 같은 칸을 여러 번 묻는 '막힘' 판정 기억(사용자 상시 요청 "렉 개선").
//  재현(헤드리스, 777 → 사몽 sz115-S03-6 · 길잡이 켬, 600장면): 장면 평균 3.9ms 인데 19장면(0.63초)마다 40~100ms 튐.
//   튀는 장면마다 findPath 1번(samong-r103 routeTo → 엔진 protectedPath → StoryPhase1.explorationPath)이 그 장면 시간의 거의 전부였다.
//   A* 는 칸을 펼칠 때마다 이웃 8칸(+대각선 옆 2칸)의 막힘을 다시 묻는다 → 같은 칸 중심을 한 탐색에서 최대 8~10번 묻고,
//   한 번 묻는 값이 blocked 감싸기 사슬(문 isOpen·병원·동굴·R78 문·explorationBlocked·소품)을 모두 탄다.
//  고침: explorationPath 를 부를 때마다 '이번 탐색 전용' 막힘 기억을 새로 만든다. 열쇠 = 칸 중심(정수+.5 일 때만) — 반지름은 그 탐색의 반지름일 때만.
//   탐색은 한 번의 동기 호출이고 그 사이에 게임 상태(문·소품·몹·시간)가 바뀌지 않으므로 기억한 값은 다시 계산한 값과 똑같다.
//   탐색이 끝나면 기억을 버린다(다음 탐색·다음 장면으로 넘기지 않음). 칸 중심이 아닌 질의·다른 반지름은 그대로 계산.
//  판정·충돌·AI 결정·길 결과는 그대로. 끄기: localStorage['storyworld.r367.perf']='{"memo":false}'
(()=>{'use strict';
if(window.__STORYWORLD_PERF_R367__)return;
const REV='R367-perf-1',KEY='storyworld.r367.perf',SPAN=4096;
const prefs={memo:true};try{Object.assign(prefs,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(_){}
const stats={searches:0,asked:0,computed:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// 순수(QA): 칸 중심 열쇠. 정수+.5 이고 0..SPAN 안일 때만 숫자, 아니면 null(기억하지 않음).
function cellKey(x,y){const ix=x-.5,iy=y-.5;if(!(ix>=0&&iy>=0&&ix<SPAN&&iy<SPAN))return null;if(Math.floor(ix)!==ix||Math.floor(iy)!==iy)return null;return ix*SPAN+iy;}
// 순수(QA): 한 탐색 전용 막힘 기억으로 감싼 isBlocked.
function memoBlocked(isBlocked,radius,counter){const m=new Map();return function(x,y,v){
 if(arguments.length===3&&v===radius){const k=cellKey(x,y);if(k!==null){if(counter)counter.asked++;let r=m.get(k);if(r===undefined&&!m.has(k)){r=isBlocked(x,y,v);m.set(k,r);if(counter)counter.computed++;}return r;}}
 return isBlocked.apply(this,arguments);};}
function wrapPath(base){const w=function(layout,from,to,radius,isBlocked,isClear){
 if(!prefs.memo||typeof isBlocked!=='function')return base.apply(this,arguments);
 stats.searches++;return base.call(this,layout,from,to,radius,memoBlocked(isBlocked,radius,stats),isClear);};w.__r367=true;return w;}
try{const A=window.StoryPhase1;if(A&&typeof A.explorationPath==='function'&&!A.explorationPath.__r367)window.StoryPhase1=Object.freeze({...A,explorationPath:wrapPath(A.explorationPath)});}catch(e){fail(e);}
window.__STORYWORLD_PERF_R367__=Object.freeze({revision:REV,cellKey,memoBlocked,wrapPath,
 set(p){Object.assign(prefs,p||{});try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};},
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,browserVerified:false,GPUVerified:false})});
})();
