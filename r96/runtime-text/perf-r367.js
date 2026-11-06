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
const prefs={memo:true,unstick:true};try{Object.assign(prefs,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(_){}
const stats={searches:0,asked:0,computed:0,errors:0,unstuck:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// 순수(QA): 칸 중심 열쇠. 정수+.5 이고 0..SPAN 안일 때만 숫자, 아니면 null(기억하지 않음).
function cellKey(x,y){const ix=x-.5,iy=y-.5;if(!(ix>=0&&iy>=0&&ix<SPAN&&iy<SPAN))return null;if(Math.floor(ix)!==ix||Math.floor(iy)!==iy)return null;return ix*SPAN+iy;}
// 순수(QA): 한 탐색 전용 막힘 기억으로 감싼 isBlocked.
function memoBlocked(isBlocked,radius,counter){const m=new Map();return function(x,y,v){
 if(arguments.length===3&&v===radius){const k=cellKey(x,y);if(k!==null){if(counter)counter.asked++;let r=m.get(k);if(r===undefined&&!m.has(k)){r=isBlocked(x,y,v);m.set(k,r);if(counter)counter.computed++;}return r;}}
 return isBlocked.apply(this,arguments);};}
// R371(PLAY-08 P2, Dots 2026-11-06): 걷기(moveActor)는 반지름 .27 로 벽에 붙을 수 있는데 길찾기는 .29 로 시작점부터 막혀
//  벽 옆(여유 .27~.29)에 선 채 클릭하면 길이 [] 로 거부됐다. 시작점만 .29 로 막히고 .27 로는 서 있을 수 있으면,
//  가까운 칸 중심(지금 칸·이웃 8칸) 중 .29 로 서 있을 수 있고 .27 로 곧게 갈 수 있는 곳에서 다시 찾아 그 점을 앞에 붙인다. 목표·다른 판정은 그대로.
const STAND=.27;
function unstick(base,self,layout,from,to,radius,isBlocked,isClear){if(!(radius>STAND)||typeof isClear!=='function')return null;
 try{if(!isBlocked(from.x,from.y,radius)||isBlocked(from.x,from.y,STAND)||isBlocked(to.x,to.y,radius))return null;
  const cx=Math.floor(from.x),cy=Math.floor(from.y),cand=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const c={x:cx+dx+.5,y:cy+dy+.5};cand.push([Math.hypot(c.x-from.x,c.y-from.y),c]);}
  cand.sort((a,b)=>a[0]-b[0]);
  for(const [,c] of cand){if(isBlocked(c.x,c.y,radius)||!isClear(from,c,STAND))continue;const rest=base.call(self,layout,c,to,radius,isBlocked,isClear);if(rest.length){stats.unstuck++;return [{x:c.x,y:c.y},...rest];}}
 }catch(e){fail(e);}return null;}
function wrapPath(base){const w=function(layout,from,to,radius,isBlocked,isClear){
 const blockedFn=prefs.memo&&typeof isBlocked==='function'?memoBlocked(isBlocked,radius,stats):isBlocked;if(blockedFn!==isBlocked)stats.searches++;
 const out=base.call(this,layout,from,to,radius,blockedFn,isClear);
 if(prefs.unstick&&Array.isArray(out)&&!out.length&&typeof isBlocked==='function'&&from&&to){const u=unstick(base,this,layout,from,to,radius,blockedFn,isClear);if(u)return u;}
 return out;};w.__r367=true;return w;}
try{const A=window.StoryPhase1;if(A&&typeof A.explorationPath==='function'&&!A.explorationPath.__r367)window.StoryPhase1=Object.freeze({...A,explorationPath:wrapPath(A.explorationPath)});}catch(e){fail(e);}
window.__STORYWORLD_PERF_R367__=Object.freeze({revision:REV,cellKey,memoBlocked,wrapPath,unstick,STAND,
 set(p){Object.assign(prefs,p||{});try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};},
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,browserVerified:false,GPUVerified:false})});
})();
