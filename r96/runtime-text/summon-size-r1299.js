// R1299 소환물 크기 맞추기 — 사용자 2026-11-21 12:39Z "영웅및 보스가소환하는 모든 소환몹 관련 전수조사해서 버그없게 특히 시각적연출과 이미지 출력".
//  전수조사(qa/r1299, 헤드리스 그리기 호출 실측)에서 크기가 틀린 소환물 두 가지를 바로잡는다. 그림·자세·모션·판정은 건드리지 않는다.
//  ① 보스의 '분신'(R61 자기 분신 r61Clone): 분신은 보스·중간보스 표식이 없어 R205 최소 보스 크기·중간보스 축소(R137·R205)를 못 받는다.
//     → 세이렌 모르 분신이 본체보다 약 23% 작게(117px 대 152px) 그려졌다. 중간보스 분신이면 반대로 본체보다 훨씬 크게 그려진다.
//     그리는 동안만 분신에 주인(본체)의 boss·midboss 표식을 빌려 주어, 본체와 같은 크기 사슬을 타게 한다.
//  ② 기억사수 '귀환 전우'(R953 r953Ally)로 온 본래 '보스'(컨트롤러 · 기억의 문 u203-boss): 아군은 보스 막대를 피하려 midboss 로 표시되어
//     R137(×.7)·R205(×.5) 중간보스 축소를 두 번 받아 제 지역 크기(약 137px)의 1/3(약 43px, 영웅보다 작음)로 그려지고 자세마다 키가 튀었다.
//     → 그리는 동안만 midboss 표식을 내려 제 지역과 같은 크기로 그린다(원래 중간보스인 아군은 그대로).
//  끄기: localStorage['storyworld.r1299.summonSize']='0'.  점검: window.__STORYWORLD_SUMMON_SIZE_R1299__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_SUMMON_SIZE_R1299__)return;
const REV='R1299-summon-size-1',KEY='storyworld.r1299.summonSize';
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={cloneDraws:0,allyDraws:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
function ownerOf(e){const id=e&&e.r61Summoned&&e.r61Summoned.owner;if(!id)return null;try{if(typeof room==='undefined'||!room||!Array.isArray(room.enemies))return null;
 for(const o of room.enemies)if(o&&o!==e&&o.id===id&&!o.r61Summoned)return o;}catch(_){}return null;}
// R953 아군의 본래 지역 정의에서 '보스' 였는지(중간보스가 아니라)
function homeBoss(e){if(typeof e.r1299HomeBoss==='boolean')return e.r1299HomeBoss;let v=false;
 try{const nid=e.nativeId;if(nid&&typeof regionById==='object'&&regionById)for(const k in regionById){const d=regionById[k];if(d&&Array.isArray(d.bosses)&&d.bosses.some(b=>b&&b.id===nid)){v=true;break;}}}catch(_){}
 e.r1299HomeBoss=v;return v;}
function lend(e){if(!on||!e||typeof e!=='object')return null;
 if(e.r61Clone){const o=ownerOf(e);if(!o||!(o.boss||o.midboss))return null;const keep={boss:e.boss,midboss:e.midboss};e.boss=!!o.boss;e.midboss=!o.boss&&!!o.midboss;stats.cloneDraws++;return keep;}
 if(e.r953Ally===true&&e.midboss===true&&!e.boss&&homeBoss(e)){const keep={boss:e.boss,midboss:e.midboss};e.midboss=false;stats.allyDraws++;return keep;}
 return null;}
// 빌린 boss 표식 때문에 엔진이 이름을 한 번 더 쓰면(분신 이름표 + 보스 이름) 같은 글이 겹쳐 뭉개진다 → 이 한 번의 그리기 안에서 같은 글은 한 번만.
function dedupeText(c,fn){if(!c||typeof c.fillText!=='function')return fn();const seen=new Set(),f0=c.fillText,s0=c.strokeText;
 const once=(base,kind)=>function(t,...r){const k=kind+'|'+String(t);if(seen.has(k)){stats.textSkipped=(stats.textSkipped||0)+1;return;}seen.add(k);return base.call(this,t,...r);};
 c.fillText=once(f0,'f');if(typeof s0==='function')c.strokeText=once(s0,'s');try{return fn();}finally{c.fillText=f0;if(typeof s0==='function')c.strokeText=s0;}}
// 크기 사슬(R137 중간보스 ×.7, R205 중간보스 ×.5·최소 보스 크기)이 표식을 읽기 전에 빌려 줘야 하므로 그들보다 바깥에서 감싼다.
//  스크립트 차례에 기대지 않게, 모든 태그가 실행된 뒤(load) 한 번 감싼다(이미 load 뒤면 바로).
let wrapped=false;
function wrap(){if(wrapped||typeof drawEnemy!=='function')return wrapped;const base=drawEnemy;
 drawEnemy=function(e,...a){let keep=null;try{keep=lend(e);}catch(x){fail(x);keep=null;}
  if(!keep)return base.call(this,e,...a);
  try{const c=typeof ctx!=='undefined'?ctx:null;return dedupeText(c,()=>base.call(this,e,...a));}finally{e.boss=keep.boss;e.midboss=keep.midboss;}};
 wrapped=true;return true;}
try{if(typeof document!=='undefined'&&document.readyState!=='complete'&&typeof window.addEventListener==='function')window.addEventListener('load',()=>{try{wrap();}catch(x){fail(x);}},{once:true});else wrap();}catch(x){fail(x);}
function set(v){on=v!==false;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return on;}
window.__STORYWORLD_SUMMON_SIZE_R1299__=Object.freeze({revision:REV,on:()=>on,set,ownerOf,homeBoss,wrap,inspect:()=>({revision:REV,on,wrapped,stats:{...stats},lastError})});
})();
