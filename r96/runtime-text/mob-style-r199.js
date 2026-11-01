// R199 — 화풍 일관성(사용자 2026-11-01 "전체적인 화풍 일관성 개선").
//  몹 72종 몸 그림(이펙트가 없는 이동·맞음·대기 그림)의 CIELAB 채도를 재 보니 중앙값 13.5인데, 형광 초록 만화풍 슬라임 세 종
//  (M130 c101-e3·c105-e1, M131 c102-e3·c103-e3, M045 l302-e3·l304-e1·l304-e3)만 67~73으로 동떨어졌다(밝기도 69 대 20~30).
//  어두운 고딕 화풍에서 튀므로, 그 몹을 그리는 동안만 몸 그림에 채도·밝기를 낮추는 필터를 건다(초록 독액 느낌은 남김).
//  · three 기록기가 받는 필터만 쓴다(saturate·brightness·contrast·hue-rotate — blur/drop-shadow 금지, CLAUDE.md 메모).
//  · 엔진 drawImage 가 opt.filter 로 ctx.filter 를 덮으므로, 그리는 동안 drawImage 를 감싸 원래 필터 뒤에 이어 붙인다.
//  · 판정·체력·공격·이펙트(공격 섬광·투사체)는 그대로. 몸 그림만. storyworld.r199.style {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_STYLE_R199__)return;
const REV='R199-style-1',KEY='storyworld.r199.style';
const FILTER='saturate(.42) brightness(.72) contrast(1.1) hue-rotate(-12deg)';
const IDS=new Set(['c101-e3','c105-e1','c102-e3','c103-e3','l302-e3','l304-e1','l304-e3']);
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={enemyDraws:0,images:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
let painting=null;
const want=e=>prefs.on&&!!e&&IDS.has(String(e.nativeId||''))&&!(e.boss||e.midboss||e.persona);
const compose=f=>f&&f!=='none'?f+' '+FILTER:FILTER;
try{if(typeof drawImage==='function'){const base=drawImage;drawImage=function(path,x,y,w,h,opt={},...rest){
  if(painting){try{stats.images++;return base.call(this,path,x,y,w,h,{...(opt||{}),filter:compose(opt&&opt.filter)},...rest);}catch(e){fail(e);}}
  return base.call(this,path,x,y,w,h,opt,...rest);};}}catch(e){fail(e);}
try{if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){if(!want(e))return base.apply(this,[e,...a]);
  const prior=painting;painting=e;stats.enemyDraws++;let saved=false;
  try{if(typeof ctx!=='undefined'&&ctx){ctx.save();saved=true;ctx.filter=compose(ctx.filter);}return base.apply(this,[e,...a]);}
  finally{painting=prior;if(saved)try{ctx.restore();}catch(_){}}};}}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_MOB_STYLE_R199__=Object.freeze({revision:REV,FILTER,ids:[...IDS],set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
