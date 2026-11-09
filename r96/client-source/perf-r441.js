// R441 렉 개선 — 충돌 검사 blocked() 를 한 장면(tick 한 번) 안에서 같은 질문이면 다시 쓰기(사용자 2026-11-09 "전반적인 렉개선").
//  재현(헤드리스 480×270, 777 → 길잡이 켬, 12초): blocked 호출이 dist00 391,321번·ep1a08 175,076번·ep1a10 75,795번(초당 최대 3만~4.6만 번).
//   그중 같은 tick 안에서 '같은 x·y·반지름·방'을 또 묻는 것이 29~31%, 그 반복의 답이 처음과 다른 경우는 0번.
//   부르는 곳 = 엔진 reconcile(tick 앞·separate3 뒤·tick 뒤 세 번, 유닛마다 제자리·집 자리 다시 확인)·몹 이동·A* 길 찾기·시야선.
//   질문 하나가 1.5µs 안팎으로 싸서, 글자 열쇠(Map)로 기억하면 열쇠 만드는 값이 더 들었다(실측) → 숫자 해시 표(Float64Array)로 기억한다.
//  고침: tick 이 도는 동안만 (x, y, 반지름, 방) → 답을 기억한다. tick 이 시작할 때와 끝날 때 비우고(세대 번호만 올림),
//   문 세대(R74 generation)·지역(room 객체)이 바뀌면 바로 비운다 → 문 열림·닫힘·지역 이동은 그 즉시 반영된다.
//   그 밖의 상태 변화(병원 단계 문·보스 구역 닫힘·던져진 소품)는 늦어도 다음 tick 에 반영된다(한 장면 이하).
//   tick 밖(그리기·입력·검사)에서 부르면 기억 없이 그대로 계산한다. 판정 규칙·지도·저장은 바꾸지 않는다(같은 답을 다시 쓸 뿐).
//  끄기: localStorage['storyworld.r441.perf']='{"blockedMemo":false}'
(()=>{'use strict';
if(window.__STORYWORLD_PERF_R441__)return;
const REV='R441-perf-1',KEY='storyworld.r441.perf',SIZE=4096,MASK=SIZE-1;
let prefs={blockedMemo:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={calls:0,hits:0,misses:0,flushes:0,ticks:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// 열린 주소 해시 표: 칸마다 x·y·반지름·세대·답. 세대(stamp)가 지금 세대와 다르면 빈 칸 — 비우기는 세대 번호 하나만 올린다.
const KX=new Float64Array(SIZE),KY=new Float64Array(SIZE),KR=new Float64Array(SIZE),ST=new Uint32Array(SIZE),VAL=new Uint8Array(SIZE);
const H=new Float64Array(1),HI=new Int32Array(H.buffer);
let depth=0,stamp=1,used=0,memoRoom=null,memoGen=null;
function flush(){if(used){stats.flushes++;}used=0;stamp=(stamp+1)>>>0;if(stamp===0){ST.fill(0);stamp=1;}}
const W74=()=>window.__STORYWORLD_WORLD_R74__;
function gen(){try{return W74()?.generation?.()??0;}catch(_){return 0;}}
function slot(x,y,r){H[0]=x;let h=(HI[0]^HI[1]*31)|0;H[0]=y;h=(h*1000003^HI[0]^HI[1]*17)|0;H[0]=r;h=(h*8191^HI[0]^HI[1])|0;h^=h>>>15;return h&MASK;}
if(typeof blocked==='function'){const base=blocked;
 blocked=function(x,y,rad,where){
  if(depth<=0||!prefs.blockedMemo||arguments.length>4||typeof x!=='number'||typeof y!=='number')return base.apply(this,arguments);
  const r=where===undefined?(typeof room!=='undefined'?room:null):where,g=gen();
  if(r!==memoRoom||g!==memoGen){flush();memoRoom=r;memoGen=g;}
  const rr=rad===undefined?-1e9:+rad;if(rr!==rr)return base.apply(this,arguments);/* NaN 반지름은 기억하지 않음 */
  stats.calls++;let i=slot(x,y,rr);
  for(let probe=0;probe<8;probe++,i=(i+1)&MASK){
   if(ST[i]!==stamp){if(used>SIZE*.7)break;const out=base.apply(this,arguments);if(typeof out!=='boolean')return out;KX[i]=x;KY[i]=y;KR[i]=rr;ST[i]=stamp;VAL[i]=out?1:0;used++;stats.misses++;return out;}
   if(KX[i]===x&&KY[i]===y&&KR[i]===rr){stats.hits++;return VAL[i]===1;}}
  stats.misses++;return base.apply(this,arguments);};}
if(typeof tick==='function'){const base=tick;tick=function(){if(depth===0){flush();stats.ticks++;}depth++;try{return base.apply(this,arguments);}finally{depth--;if(depth===0)flush();}};}
function set(p){for(const k of ['blockedMemo'])if(typeof p?.[k]==='boolean')prefs[k]=p[k];flush();try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_PERF_R441__=Object.freeze({revision:REV,set,flush,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},used,inTick:depth>0,lastError})});
})();
