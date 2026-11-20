// R1259 — 서사 글 스크롤바 다듬기. 사용자 2026-11-20 "서사텍스트 내릴때 휠나오는 부분개선해줘 디자인".
//  · 서사 글을 내려 읽는 창(쪽지 창 #r177Doc 과 그 한 장 .pg, 서사 창 #panel .storyText, 창 #panel 자체와 그 안 목록, 옛 쪽지 #r162Note·#r169Note)에
//    브라우저 기본 굵은 회색 막대 대신 4px 먹선 막대(바탕은 비움, 화살표 없음)를 쓴다. 손가락·휠·키보드 스크롤은 그대로(overflow 를 건드리지 않음).
//  · 남은 글은 위/아래 페이드로 보인다: 글이 넘칠 때만, 위에 글이 더 있으면 위가, 아래에 더 있으면 아래가 옅어진다(맨 위·맨 아래에선 그쪽 페이드 없음).
//      - 바탕이 없는 글 칸(.pg·기본 .storyText): mask 로 글만 옅게.
//      - 종이 바탕이 있는 칸(쪽지 종이·진료기록 등): 종이를 지우지 않도록 종이색 베일(높이 0 의 붙박이 가상 요소 + border-image)로 덮는다 — 자리·줄 간격 그대로.
//  · 막대 색: 어두운 먹 바탕은 한지색 34%, 밝은 종이(쪽지·진료기록·보고서·한지 UI)는 먹색 30%. 올려 두면 조금 진해진다.
//  · 서사 글·쪽지 순서·한 장 넘기기(R182 휠 = 다음 장)·자동 넘김·창 크기는 건드리지 않는다. CSS + 속성(data-r1259fade) 한 개만 얹는다.
//  · Firefox 는 scrollbar-width:thin + scrollbar-color 로 같은 느낌.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_NARR_SCROLL_R1259__)return;
const REV='R1259-narr-scroll-1';
// 얇은 막대를 줄 곳(창 #panel 은 자기 막대 + 안쪽 모든 막대)
const BAR=['#r177Doc','#r177Doc .pg','#panel','#panel *','#r162Note','#r169Note'];
// 페이드를 줄 곳(창 #panel 자체는 제목·단추가 있어 가리지 않는다)
const FADE=['#r177Doc:not(.r182pages)','#r177Doc .pg','#panel .storyText','#r162Note','#r169Note'];
const FADE_PX=22,BAR_PX=4;
const PAPER='rgba(204,199,179,.34)',PAPER_HI='rgba(204,199,179,.6)',INK='rgba(40,30,22,.3)',INK_HI='rgba(40,30,22,.55)';
const stats={updates:0,changes:0,scans:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
// 우선순위: 앞선 수묵 UI(R1085 html.r1085Ink:not(#r1085x) #panel ::-webkit-scrollbar)·한지(R1086) 규칙보다 id 하나 더 높게
const X='html:not(#r1259a):not(#r1259b):not(#r1259c)';
const is=list=>':is('+list.join(',')+')';
// 밝은 종이 바탕(먹색 막대)
const LIGHT=['#r177Doc.note','#r177Doc.chart','#r177Doc.report','#panel.r177-note .storyText','#panel.r177-chart .storyText','#panel.r177-report .storyText','#r162Note','#r169Note'];
function css(){if(document.getElementById('r1259NarrScrollCss'))return;const s=document.createElement('style');s.id='r1259NarrScrollCss';
 const B=X+' '+is(BAR);
 s.textContent=
  // 웹킷·블링크(크롬·엣지·사파리·안드로이드)
  B+'::-webkit-scrollbar{width:'+BAR_PX+'px;height:'+BAR_PX+'px;background:transparent}'
 +B+'::-webkit-scrollbar-track{background:transparent;border:0;box-shadow:none}'
 +B+'::-webkit-scrollbar-thumb{background:var(--r1259thumb,'+PAPER+');border:0;border-radius:2px;min-height:24px}'
 +B+'::-webkit-scrollbar-thumb:hover,'+B+'::-webkit-scrollbar-thumb:active{background:var(--r1259thumbHi,'+PAPER_HI+')}'
 +B+'::-webkit-scrollbar-button{display:none;width:0;height:0}'
 +B+'::-webkit-scrollbar-corner{background:transparent}'
 +X+' '+is(LIGHT)+',html.r1086Hanji'+X.slice(4)+' #panel{--r1259thumb:'+INK+';--r1259thumbHi:'+INK_HI+'}'
 +X+' #r177Doc.shard,'+X+' #panel.r177-shard .storyText{--r1259thumb:'+PAPER+';--r1259thumbHi:'+PAPER_HI+'}'
  // 파이어폭스(웹킷 막대를 모르는 곳만 — 크롬 121+ 은 표준 속성을 주면 웹킷 막대 모양을 버리므로)
 +'@supports not selector(::-webkit-scrollbar){'+B+'{scrollbar-width:thin;scrollbar-color:var(--r1259thumb,'+PAPER+') transparent}}'
  // 페이드 — 바탕 없는 칸: mask
 +X+' [data-r1259m="mask"][data-r1259fade="bot"]{-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - '+FADE_PX+'px),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - '+FADE_PX+'px),transparent)}'
 +X+' [data-r1259m="mask"][data-r1259fade="top"]{-webkit-mask-image:linear-gradient(to bottom,transparent,#000 '+FADE_PX+'px);mask-image:linear-gradient(to bottom,transparent,#000 '+FADE_PX+'px)}'
 +X+' [data-r1259m="mask"][data-r1259fade="both"]{-webkit-mask-image:linear-gradient(to bottom,transparent,#000 '+FADE_PX+'px,#000 calc(100% - '+FADE_PX+'px),transparent);mask-image:linear-gradient(to bottom,transparent,#000 '+FADE_PX+'px,#000 calc(100% - '+FADE_PX+'px),transparent)}'
  // 페이드 — 종이 바탕 칸: 높이 0 붙박이 가상 요소에 종이색 그라데이션(border-image outset 으로 자리 차지 없이 그림)
 +X+' [data-r1259m="veil"]::before,'+X+' [data-r1259m="veil"]::after{content:"";display:block;position:sticky;left:0;height:0;margin:0;padding:0;pointer-events:none;z-index:2;opacity:0;border:0 solid transparent;border-image-slice:0 fill;border-image-width:0}'
 +X+' [data-r1259m="veil"]::before{top:calc(-1 * var(--r1259pt,0px));border-image-source:linear-gradient(to bottom,var(--r1259bg,#000),transparent);border-image-outset:0 0 '+FADE_PX+'px 0}'
 +X+' [data-r1259m="veil"]::after{bottom:calc(-1 * var(--r1259pb,0px));border-image-source:linear-gradient(to top,var(--r1259bg,#000),transparent);border-image-outset:'+FADE_PX+'px 0 0 0}'
 +X+' [data-r1259m="veil"]:is([data-r1259fade="top"],[data-r1259fade="both"])::before{opacity:1}'
 +X+' [data-r1259m="veil"]:is([data-r1259fade="bot"],[data-r1259fade="both"])::after{opacity:1}';
 (document.head||document.documentElement).appendChild(s);}
const fin=(v,d=0)=>Number.isFinite(v)?v:d;
// 바탕색: 불투명 배경색이 있으면 그것, 없으면 배경 그림(그라데이션)의 마지막 색. 둘 다 없으면 null(=바탕 없는 칸)
function paperOf(cs){const a=c=>{const m=/rgba?\(([^)]+)\)/.exec(c||'');if(!m)return null;const p=m[1].split(/[ ,/]+/).filter(Boolean).map(Number);return {s:'rgb('+p.slice(0,3).map(v=>Math.round(fin(v))).join(',')+')',a:p.length>3?fin(p[3],1):1};};
 const bg=a(cs.backgroundColor);if(bg&&bg.a>.6)return bg.s;
 const img=String(cs.backgroundImage||'none');if(img==='none')return null;
 const all=img.match(/rgba?\([^)]+\)/g);if(!all||!all.length)return null;
 for(let i=all.length-1;i>=0;i--){const c=a(all[i]);if(c&&c.a>.6)return c.s;}return null;}
// 한 칸의 페이드 상태
function stateOf(el){const over=fin(el.scrollHeight-el.clientHeight);if(over<=2)return '';const t=fin(el.scrollTop),top=t>2,bot=t<over-2;return top&&bot?'both':top?'top':bot?'bot':'';}
function update(el){try{stats.updates++;const f=stateOf(el);
  if(f){if(!el.hasAttribute('data-r1259m')||el.__r1259Paper===undefined){const cs=getComputedStyle(el),paper=paperOf(cs);el.__r1259Paper=paper;
    if(paper){el.setAttribute('data-r1259m','veil');el.style.setProperty('--r1259bg',paper);el.style.setProperty('--r1259pt',cs.paddingTop);el.style.setProperty('--r1259pb',cs.paddingBottom);}
    else el.setAttribute('data-r1259m','mask');}}
  if((el.getAttribute('data-r1259fade')||'')!==f){stats.changes++;if(f)el.setAttribute('data-r1259fade',f);else el.removeAttribute('data-r1259fade');}
 }catch(e){fail(e);}}
const SEL=FADE.join(',');
function scan(){try{stats.scans++;css();for(const el of document.querySelectorAll(SEL)){if(el.isConnected&&el.getClientRects().length)update(el);/* offsetParent 는 position:fixed 쪽지 창에서 늘 null */else if(el.hasAttribute('data-r1259fade'))el.removeAttribute('data-r1259fade');}}catch(e){fail(e);}}
// 글이 바뀌면(쪽지 다음 장·창 새로 열림) 종이색을 다시 잰다
function resetPaper(){try{for(const el of document.querySelectorAll('[data-r1259m]')){el.__r1259Paper=undefined;el.removeAttribute('data-r1259m');}}catch(e){fail(e);}}
document.addEventListener('scroll',ev=>{const t=ev.target;if(t&&t.nodeType===1&&t.matches?.(SEL))update(t);},{capture:true,passive:true});
let lastSig='';
setInterval(()=>{try{const d=document.getElementById('r177Doc'),p=document.getElementById('panel');const sig=(d?d.className+'|'+(d.firstChild?.textContent||'').slice(0,40):'')+'#'+(p?p.className+'|'+(p.firstElementChild?.textContent||'').slice(0,40):'');if(sig!==lastSig){lastSig=sig;resetPaper();}}catch(e){fail(e);}scan();},300);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',css,{once:true});else css();
window.__STORYWORLD_NARR_SCROLL_R1259__=Object.freeze({revision:REV,BAR,FADE,FADE_PX,BAR_PX,paperOf,stateOf,update,scan,
 inspect:()=>({revision:REV,stats:{...stats},lastError})});
})();
