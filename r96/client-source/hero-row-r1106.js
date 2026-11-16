/* R1106 폰 화면 영웅 선택창(사용자 2026-11-16 "영웅고르는창에서 영웅하나만 나오는 버그").
 *  · 원인: R263 큰 무대(고른 영웅 1명 초상·설명)가 영웅 줄 위에 있어, 폰 가로(높이 ~345px)·세로 화면에서는 영웅 줄이 화면 밖으로 밀려
 *    스크롤하지 않으면 영웅이 하나(무대)만 보였다. PC(1280×720 이상)는 원래대로 다 보였다.
 *  · 고침(작은 화면만 — 높이 620px 이하 또는 폭 700px 이하): 영웅 줄을 무대 위로 올리고, 한 줄 가로 띠(넘치면 줄 안 가로 스크롤)로 작게,
 *    무대는 낮게. 영웅 칸은 지우거나 숨기지 않는다(R1057 777 숨김·R1046 EGO 칸은 그대로 동작). 화면이 커지면 무대를 원래 자리(줄 위)로 되돌린다.
 *  · 처음부터 시작(#heroRowR101)·거점 영웅 변경(.cards) 둘 다. 무한 생존(R600) 영웅 고르기는 다른 창이라 손대지 않음.
 */
(()=>{'use strict';
if(window.__STORYWORLD_HERO_ROW_R1106__)return;
const REV='R1106-hero-row-1',MQ='(max-height:620px),(max-width:700px)';
const stats={moved:0,restored:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const small=()=>{try{return !!window.matchMedia&&window.matchMedia(MQ).matches;}catch(_){return false;}};
function css(){if(document.getElementById('r1106Css'))return;const s=document.createElement('style');s.id='r1106Css';s.textContent=[
 '@media '+MQ+'{',
 '#panel.r263 .cards,#panel.r263start .heroRowR101{display:flex!important;flex-wrap:nowrap!important;justify-content:flex-start!important;overflow-x:auto;overflow-y:hidden;gap:6px!important;margin:4px 0 8px!important;padding:4px 2px 6px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}',
 '#panel.r263 .cards>*,#panel.r263start .heroRowR101>*{flex:0 0 72px!important;width:72px!important;min-width:0;padding:4px!important;scroll-snap-align:start}',
 '#panel.r263 .cards>* img,#panel.r263 .cards>* .pf,#panel.r263start .heroRowR101>* img{width:100%!important;height:72px!important;max-height:72px!important;aspect-ratio:auto!important;object-fit:cover;object-position:50% 12%;margin:0 0 2px!important}',
 '#panel.r263 .cards>* strong,#panel.r263start .heroRowR101>* span{font-size:11px!important;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}',
 '#panel.r263 .cards>* small{display:none}',
 '#panel.r263 #r263Stage{min-height:0;padding:8px 12px;margin:2px 0 8px;gap:10px;grid-template-columns:minmax(90px,140px) minmax(0,1fr);text-align:left;align-items:center}',
 '#panel.r263 #r263Stage .pt{height:clamp(110px,28vh,170px)!important}',
 '#panel.r263 #r263Stage .ray,#panel.r263 #r263Stage .ember{display:none}',
 '#panel.r263 #r263Stage .nm{font-size:24px;margin:0 0 4px}#panel.r263 #r263Stage .row{font-size:12px;line-height:1.5}#panel.r263 #r263Stage .row b{white-space:nowrap}#panel.r263 #r263Stage .tags{justify-content:flex-start;margin-bottom:4px}',
 '}',
 '@media (max-width:420px){#panel.r263 .cards>*,#panel.r263start .heroRowR101>*{flex-basis:56px!important;width:56px!important;padding:3px!important}#panel.r263 .cards>* img,#panel.r263 .cards>* .pf,#panel.r263start .heroRowR101>* img{height:60px!important;max-height:60px!important}#panel.r263 .cards,#panel.r263start .heroRowR101{gap:4px!important}}'].join('\n');document.head.appendChild(s);}
function rowOf(p){const start=p.querySelector('#heroRowR101');if(start&&start.querySelector('[data-hero]'))return start;const c=p.querySelector('.cards');return c&&c.querySelector('[data-hero]')?c:null;}
function keep(row){try{const strip=row.querySelector('.heroRowR101')||row,sel=strip.querySelector('.selected');strip.scrollLeft=0;if(sel){const a=strip.getBoundingClientRect(),b=sel.getBoundingClientRect();if(b.right>a.right)strip.scrollLeft+=b.right-a.right+8;}}catch(e){fail(e);}}
function apply(){try{const p=document.getElementById('panel');if(!p)return;const st=p.querySelector('#r263Stage'),row=rowOf(p);if(row&&!st){/* R263 무대는 showHeroes 감싸기가 openPanel 뒤에 만든다(이 파일이 R263 보다 먼저 실림) → 같은 턴 끝에 한 번 더 */setTimeout(apply,0);return;}if(!st||!row||st.parentNode!==row.parentNode)return;css();
 const rowFirst=!!(st.compareDocumentPosition(row)&Node.DOCUMENT_POSITION_PRECEDING);
 if(small()){if(!rowFirst){row.after(st);stats.moved++;keep(row);}}
 else if(rowFirst){row.before(st);stats.restored++;}}catch(e){fail(e);}}
if(typeof openPanel==='function'){const base=openPanel;openPanel=function(...a){const r=base.apply(this,a);apply();return r;};}
try{setInterval(apply,150);window.addEventListener('resize',apply);}catch(e){fail(e);}
window.__STORYWORLD_HERO_ROW_R1106__=Object.freeze({revision:REV,mq:MQ,small,apply,inspect:()=>({revision:REV,small:small(),stats:{...stats},lastError})});
})();
