// R1217 ③④ — 사몽 각성 연출 나눠 켜기·성능 낮은 단계 줄이기(사용자 2026-11-19 "1-4 개선적용").
//  엔진 showAwakening 은 컷인(그림·이름)·번쩍임·소리와 함께 큰 문양 이펙트 둘(왕관 크기 5, 시계 3.4)을 각성 첫 장면에 한꺼번에 띄운다.
//  같은 장면에 흑백 전환·사몽 오라·사몽 이펙트 그림 올리기가 몰려 첫 장면이 길다 → 컷인·번쩍임·소리는 그 장면 그대로 두고,
//  showAwakening 안에서 부른 fx 만 모아 0.1초 간격(0.1·0.2초)으로 띄운다(모두 0.3초 안). 각성 판정·무적·지속 시간은 건드리지 않는다.
//  ④ 성능 7단계 1~4: 각성 문양은 첫 것(왕관)만, 1~2 는 문양 없음(컷인·번쩍임은 그대로). 5~7 은 문양 둘 다.
//  끄기: localStorage 'storyworld.r1217.stagger' {"on":false}.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SAMONG_STAGGER_R1217__)return;
const REV='R1217-samong-stagger-1',KEY='storyworld.r1217.stagger',GAP=.1;
const prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={shows:0,queued:0,fired:0,dropped:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,200);};
const now=()=>{try{return typeof time==='number'?time:0;}catch(_){return 0;}};
const perfStep=()=>{try{const n=Number(window.__STORYWORLD_PERF7_R1043__?.step?.());return Number.isFinite(n)?n:5;}catch(_){return 5;}};
const keepN=()=>{const s=perfStep();return s<=2?0:s<=4?1:Infinity;};
const queue=[];/* {at,args} */
function flush(){if(!queue.length)return;const t=now();let base;try{base=fx;}catch(_){return;}
 while(queue.length&&(queue[0].at<=t||queue[0].at-t>5)){const q=queue.shift();try{base.apply(window,q.args);stats.fired++;}catch(e){fail(e);}}}
function wrap(){try{if(typeof showAwakening!=='function'||showAwakening.__r1217)return;const inner=showAwakening;
 const w=function(...a){if(!prefs.on||typeof fx!=='function')return inner.apply(this,a);stats.shows++;const orig=fx,got=[];
  const collect=function(...f){got.push(f);};fx=collect;let r;try{r=inner.apply(this,a);}finally{if(fx===collect)fx=orig;}
  const t=now(),keep=keepN();let k=0;for(const f of got){if(k>=keep){stats.dropped++;continue;}k++;queue.push({at:t+GAP*k,args:f});stats.queued++;}
  return r;};w.__r1217=true;showAwakening=w;}catch(e){fail(e);}}
wrap();setInterval(()=>{wrap();flush();},16);
function set(patch){if(typeof patch?.on==='boolean')prefs.on=patch.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_SAMONG_STAGGER_R1217__=Object.freeze({revision:REV,set,flush,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},pending:queue.length,lastError})});
})();
