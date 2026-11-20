// R1249 — tick·draw·drawEnemy·updateHUD·restoreSave 감싸기 계측(진단용, 켤 때만).
// 리뷰(사용자 2026-11-20 첨부 4번): "네 함수에 등록된 기능 이름·호출 횟수·소요 시간을 확인할 수 있게 하고, 저장 후 처리처럼 실행 순서가 중요한 기능부터
//  공용 등록 지점으로 옮기세요. 구조 8점의 기준은 컷신 건너뛰기→슬롯 복원→지역 재입장을 반복해도 호출 깊이가 늘지 않고, 한 번의 저장·복원에 각 기능이
//  정확히 한 번만 실행되는 것." — 옮기기 전에 지금 사슬을 눈으로 볼 수 있어야 한다.
// 켜기: 주소에 ?wrapcensus=1 또는 localStorage storyworld.r1249.wrapcensus {on:true} 뒤 새로고침. 콘솔에서
//  __STORYWORLD_WRAP_CENSUS_R1249__.enable(true) 도 같다. 꺼져 있으면 전역 함수를 하나도 바꾸지 않는다(성능 영향 0).
// 켜면:
//  · 본 인라인 스크립트 바로 뒤(첫 오버레이 앞)에서 원래 함수를 측정층 'index.html' 로 감싸고, 스크립트 요소가 하나 삽입될 때마다(MutationObserver,
//    앞 스크립트 실행이 끝나고 다음 스크립트가 돌기 전) 바뀐 함수를 '앞 스크립트 이름' 측정층으로 감싼다. 마지막 스크립트 것은 DOMContentLoaded 에서,
//    그 뒤 다른 DOMContentLoaded 처리기 것은 'before-load', load 처리기 것은 'load'. 한 함수에 같은 이름표가 또 나오면 '#2' 를 붙인다.
//  · 그 뒤(타이머 등) 바뀐 것은 감싸지 않고 lateChanges 로만 센다(R1196 '바깥 아니면 다시 감싸기' 핑퐁을 키우지 않게).
//  · 층마다 calls·inclMs(안쪽 포함)·selfMs(측정된 안쪽 호출 뺌)·maxMs·errors, 이름마다 maxDepth(같은 이름 측정층이 스택에 겹친 최대 수),
//    lastOuter(한 번의 동기 실행 = 사용자 동작 하나 동안 층별 실행 횟수 — 한 번의 복원에서 두 번 도는 층 찾기).
//  · 측정층은 this·인자·반환값·예외를 그대로 넘긴다. 다만 다른 오버레이의 '내가 가장 바깥인가' 판정은 바뀔 수 있으니 진단 때만 켠다.
//  · 측정 비용: 호출마다 performance.now 두 번(drawEnemy 처럼 자주 불리는 함수는 프레임 시간이 조금 늘어난다).
(()=>{'use strict';
if(window.__STORYWORLD_WRAP_CENSUS_R1249__)return;
const REV='R1249-wrap-census-1',KEY='storyworld.r1249.wrapcensus',NAMES=Object.freeze(['tick','draw','drawEnemy','updateHUD','restoreSave']),LATE_MS=2000;
let on=false;try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');on=!!(s&&s.on);}catch(_){}
try{if(/(?:^|[?&])wrapcensus=1(?:&|$)/.test(String(location.search||'')))on=true;}catch(_){}
function enable(v){try{localStorage.setItem(KEY,JSON.stringify({on:!!v}));}catch(_){}return v?'다시 불러오면 계측이 켜집니다':'다시 불러오면 계측이 꺼집니다';}
if(!on){window.__STORYWORLD_WRAP_CENSUS_R1249__=Object.freeze({revision:REV,enabled:false,enable,inspect:()=>({revision:REV,enabled:false})});return;}
const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
const micro=typeof queueMicrotask==='function'?f=>queueMicrotask(f):f=>Promise.resolve().then(f);
const S={},seen={},stack=[];let prev=null,inlineN=0,phase='parse',lastError=null;
const get=n=>{try{return window[n];}catch(_){return undefined;}};
function measure(name,fn,label){const st=S[name],L={label,calls:0,inclMs:0,selfMs:0,maxMs:0,errors:0};st.layers.push(L);
 const w=function(...a){L.calls++;if(st.depth===0&&!st.open){st.open=true;st.lastOuter={};micro(()=>{st.open=false;});}
  st.lastOuter[label]=(st.lastOuter[label]||0)+1;st.depth++;if(st.depth>st.maxDepth)st.maxDepth=st.depth;
  const fr={child:0};stack.push(fr);const t0=now();
  try{return fn.apply(this,a);}catch(e){L.errors++;throw e;}
  finally{const dt=now()-t0;stack.pop();st.depth--;L.inclMs+=dt;L.selfMs+=dt-fr.child;if(dt>L.maxMs)L.maxMs=dt;const p=stack[stack.length-1];if(p)p.child+=dt;}};
 try{Object.defineProperty(w,'name',{value:fn.name||name});}catch(_){}
 return w;}
function place(name,label){const f=get(name);if(typeof f!=='function'||f===seen[name])return false;const used=new Set(S[name].layers.map(l=>l.label));let lb=label,k=1;while(used.has(lb))lb=label+'#'+(++k);const w=measure(name,f,lb);try{window[name]=w;}catch(e){lastError=String(e?.message||e).slice(0,200);seen[name]=f;return false;}seen[name]=w;return true;}
function check(label){for(const n of NAMES)place(n,label);}
function late(){for(const n of NAMES){const f=get(n);if(typeof f==='function'&&f!==seen[n]){seen[n]=f;const st=S[n];st.lateChanges++;if(st.late.length<20)st.late.push(Math.round(now()));}}setTimeout(late,LATE_MS);}
function nameOf(node){try{const s=node.getAttribute?.('src')||node.src||'';if(s)return String(s).split('?')[0].split('/').pop();if(node.id)return '#'+node.id;}catch(_){}return 'inline#'+(++inlineN);}
for(const n of NAMES)S[n]={layers:[],depth:0,maxDepth:0,open:false,lastOuter:{},lateChanges:0,late:[]};
for(const n of NAMES)place(n,'index.html');
let mo=null;
try{mo=new MutationObserver(recs=>{if(phase!=='parse')return;try{check(prev||'unknown');for(const r of recs)for(const node of (r.addedNodes||[]))if(String(node.tagName||'').toUpperCase()==='SCRIPT')prev=nameOf(node);}catch(e){lastError=String(e?.message||e).slice(0,200);}});
 mo.observe(document.documentElement||document,{childList:true,subtree:true});}catch(e){lastError=String(e?.message||e).slice(0,200);}
try{document.addEventListener('DOMContentLoaded',()=>{check(prev||'unknown');});}catch(_){}
addEventListener('load',()=>{try{check('before-load');}catch(_){}phase='load';try{mo?.disconnect();}catch(_){}setTimeout(()=>{check('load');phase='late';setTimeout(late,LATE_MS);},0);});
const r3=v=>Math.round(v*1000)/1000;
function table(name){const st=S[name];if(!st)return [];return st.layers.map(l=>({label:l.label,calls:l.calls,inclMs:r3(l.inclMs),selfMs:r3(l.selfMs),maxMs:r3(l.maxMs),avgSelfUs:l.calls?Math.round(l.selfMs/l.calls*1000):0,errors:l.errors}));}
window.__STORYWORLD_WRAP_CENSUS_R1249__=Object.freeze({revision:REV,enabled:true,NAMES,enable,table,
 inspect:()=>{const names={};for(const n of NAMES){const st=S[n];names[n]={layers:st.layers.map(l=>({...l})),maxDepth:st.maxDepth,lastOuter:{...st.lastOuter},lateChanges:st.lateChanges,late:st.late.slice()};}return {revision:REV,enabled:true,phase,lastError,names};},
 reset(){for(const n of NAMES){const st=S[n];for(const l of st.layers){l.calls=0;l.inclMs=0;l.selfMs=0;l.maxMs=0;l.errors=0;}st.maxDepth=0;st.lastOuter={};}},
 top(name,k=10){return table(name).sort((a,b)=>b.selfMs-a.selfMs).slice(0,k);}});
})();
