// R899 — 보스맵 서사 창(R255)·기억 조각 종이(R177)를 화면 왼쪽 위로, 왼쪽 위 길잡이 한 줄은 짧게 한 번만.
//  사용자 2026-11-12 "보스맵서사텍스트랑 기억조각텍스트 왼쪽위쪽에 나오게 이동 / 왼쪽위에 악마화나무정원으로 이거 모든맵에서 뜨는거 개선".
//  · 글 내용은 그대로, 위치만. 둘 다 왼쪽 위 길잡이 패널(#quest) 바로 아래에서 시작해 서로 겹치지 않는다(패널 높이를 재서 --r899-top 에 둔다).
//  · 길잡이 한 줄: '다음 기억은 X입니다. 열린 길로 이동하세요. → X' 는 내지 않는다(맵 이름만). 다른 목표 글은 그대로, 줄바꿈 허용.
//  · 폰(700px 이하)은 R255 의 아래쪽 배치를 그대로 둔다. 기존 파일(R177·R255·R420)은 건드리지 않고 덧씌운다.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_TOPLEFT_R899__)return;
const REV='R899-topleft-2';
const NEXT=/^다음 기억은 (.+?)입니다\.\s*열린 길로 이동하세요\.?$/;
const SHORT=/^다음 기억\s*→\s*\S/;
// R899-2(사용자 2026-11-12 11:14Z "다음기억은 악마화나무 정원입니다. 이게 나오는게 오류 … 그냥 맵이름만 나오면"): 이 안내는 아예 내지 않는다(맵 이름만 남는다).
function nextNotice(text){const t=String(text==null?'':text).trim();if(!t)return false;if(NEXT.test(t)||SHORT.test(t))return true;
 const m=/^(.*\S)\s+(?:→|·)\s+([^→·]+?)\s*$/.exec(t);return !!(m&&NEXT.test(m[1].trim()));}
function summarize(text){const t=String(text==null?'':text).trim();return nextNotice(t)?'':t;}
function place(){try{const q=document.getElementById('quest');let top=12;
  if(q&&typeof q.getBoundingClientRect==='function'){const b=q.getBoundingClientRect().bottom;if(b>0)top=Math.round(b)+8;}
  try{const h=document.querySelector&&document.querySelector('header');if(h){const r=h.getBoundingClientRect(),hb=r.bottom;if(r.top<=4&&hb>0&&hb<160&&Math.round(hb)+8>top)top=Math.round(hb)+8;}}catch(_){}/* 길잡이 줄이 비어도 위쪽 머리 띠를 덮지 않게 */
  const cap=Math.round((window.innerHeight||720)*.4);if(top>cap)top=cap;
  document.documentElement.style.setProperty('--r899-top',top+'px');}catch(_){}}
function css(){if(typeof document==='undefined'||document.getElementById('r899Css'))return;const s=document.createElement('style');s.id='r899Css';
 s.textContent='#quest #questInlineSummary{white-space:normal;text-overflow:clip;overflow-wrap:anywhere}'
 +'html body #quest #questInlineSummary:empty,html body #quest #questText:empty{display:none!important}'
 +'@media (min-width:701px){'
 +'html body #r177Doc{left:max(14px,env(safe-area-inset-left,0px))!important;right:auto!important;top:var(--r899-top,96px)!important;max-height:min(52vh,calc(100vh - var(--r899-top,96px) - 130px))}'
 +'html body #r177Doc.r182pages{max-height:calc(100vh - var(--r899-top,96px) - 130px)}'
 +'html body #r177Doc.r182pages .pg{max-height:calc(100vh - var(--r899-top,96px) - 196px)}'
 +'html body #modal.r255{justify-content:flex-start;align-items:flex-start;background:radial-gradient(110% 90% at 18% 22%,rgba(0,0,0,.05),rgba(0,0,0,.55))}'
 +'html body #panel.r255-doc{margin:var(--r899-top,96px) 0 0 max(14px,env(safe-area-inset-left,0px));max-height:calc(100vh - var(--r899-top,96px) - 24px)}'
 +'html body #panel.r255-doc .storyText{max-height:calc(100vh - var(--r899-top,96px) - 150px)}'
 +'}';
 document.head.appendChild(s);}
css();place();
try{if(typeof updateHUD==='function'){const base=updateHUD;updateHUD=function(...a){const r=base.apply(this,a);try{for(const id of ['questInlineSummary','questText']){const el=document.getElementById(id);if(el&&nextNotice(el.textContent))el.textContent='';}}catch(_){}return r;};}}catch(_){}
try{setInterval(place,400);}catch(_){}
window.__STORYWORLD_TOPLEFT_R899__={rev:REV,summarize,nextNotice,place,css};
})();
