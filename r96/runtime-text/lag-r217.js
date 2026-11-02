// R217 — 렉 개선(사용자 2026-11-02 "전체적인 렉개선", "실제플레이해보면서 … 렉 및 디버깅 개선").
//  실측(헤드리스 길잡이 자동 진행, JS 자체 시간): 충돌 질의 사슬(blocked 겹겹 감싸기 + 문 isOpen + explorationBlocked + clearPath3)이 JS 시간의 약 1/3.
//  그중 길찾기(A*)가 칸 중심 사이 같은 간선을 매번 다시 묻는다 — dist00 10초에 clearPath3 48,476회·729ms, 칸 중심 간선 47,612회 중 35,580회가 반복.
//  ① 칸 중심(x.5, y.5) 사이 clearPath3 결과를 지금 방·반지름별로 짧게(1초) 기억한다. 칸 중심이 아닌 질의(실제 위치에서 시작하는 선)는 그대로 계산.
//     문이 열리고 닫히는 변화는 1초 안에 반영되고, 실제 이동은 늘 blocked 로 다시 막으므로 벽을 뚫지 않는다.
//  storyworld.r217.lag {memo:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_LAG_R217__)return;
const REV='R217-lag-1',KEY='storyworld.r217.lag',TTL=1000,CAP=40000;
let prefs={memo:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={hits:0,misses:0,flushes:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const now=()=>typeof performance!=='undefined'?performance.now():Date.now();
const center=v=>{const f=v-Math.floor(v);return f>.4999&&f<.5001;};
let memo=new Map(),memoRoom=null,memoAt=-1e9;
if(typeof clearPath3==='function'){const base=clearPath3;clearPath3=function(a,b,radius=.29,r=(typeof room!=='undefined'?room:null)){
 if(!prefs.memo||!a||!b||!r||!center(a.x)||!center(a.y)||!center(b.x)||!center(b.y))return base.apply(this,arguments);
 try{const t=now();if(r!==memoRoom||t-memoAt>TTL||memo.size>CAP){memo.clear();memoRoom=r;memoAt=t;stats.flushes++;}
  const k=a.x+','+a.y+','+b.x+','+b.y+','+radius;const v=memo.get(k);if(v!==undefined){stats.hits++;return v;}
  const out=base.call(this,a,b,radius,r);memo.set(k,out);stats.misses++;return out;}catch(e){fail(e);return base.apply(this,arguments);}};}
function set(p){prefs={...prefs,...p};memo.clear();try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_LAG_R217__=Object.freeze({revision:REV,set,TTL,inspect:()=>({revision:REV,prefs:{...prefs},size:memo.size,stats:{...stats},lastError})});
})();
