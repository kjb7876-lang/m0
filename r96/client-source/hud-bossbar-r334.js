// R334 — 사용자 2026-11-05 "적 보스 체력창을 맨 위 맵 정보 구역에 나오게 해서 전투 화면은 최대한 전투에 집중할 수 있게".
//  엔진의 #bossbar(보스 이름·체력·주문 줄)를 전투 화면 위에 띄우던 상자에서 맨 위 header(지역 이름 줄과 메뉴 버튼 사이)로 옮긴다.
//  · 같은 DOM 노드를 옮기기만 한다 → 엔진이 #bossTitle·#bossHP·#bossSpell·hidden 클래스를 바꾸는 코드는 그대로 동작.
//  · 넓은 화면: 지역 정보 오른쪽에 한 줄짜리 체력 띠(이름 · 막대 · 주문은 마우스 올리면). 좁은 화면(≤1000px): header 바로 아래 얇은 띠(높이 약 22px).
//  · 모바일 실플레이(header 숨김)에서는 원래 자리. 끄기(예전 자리로): localStorage['storyworld.r334.bossbarTop']='0'.
(()=>{'use strict';
if(window.__STORYWORLD_HUD_BOSSBAR_R334__)return;
const REV='R334-bossbar-header-2',KEY='storyworld.r334.bossbarTop';
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={mounted:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const CSS=`
header #bossbar{position:relative;left:auto;top:auto;transform:none;flex:0 1 clamp(180px,22vw,330px);min-width:0;width:auto;margin:0 4px;padding:4px 10px 5px;
 background:linear-gradient(90deg,#1a0d10e8,#120a0de8);border:1px solid #6b3a44;border-radius:2px;pointer-events:auto;align-self:center}
header #bossbar #bossTitle{font-size:11px;line-height:1.25;margin:0 0 3px;color:#ebd4dd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
header #bossbar .bar{height:6px;border-color:#5a2f37;background:#0c0a0c}
header #bossbar #bossSpell{display:none}
header #bossbar:hover #bossSpell{display:block;position:absolute;left:0;right:0;top:100%;margin-top:2px;padding:4px 8px;font-size:10px;background:#120a0df0;border:1px solid #6b3a44}
@media(max-width:1000px){header #bossbar{position:absolute;left:8px;right:8px;top:100%;margin:2px 0 0;flex:none;padding:2px 8px 3px;z-index:7}
 header #bossbar #bossTitle{font-size:9px;margin-bottom:2px}header #bossbar .bar{height:4px}}
`;
// 모바일 실플레이(R63 body.mobile-live-r63)는 header 를 통째로 숨긴다 → 그때는 원래 자리(전투 화면 위)로 되돌린다(Codex 리뷰).
let home=null;
function headerHidden(head){try{if(document.body?.classList?.contains('mobile-live-r63'))return true;return getComputedStyle(head).display==='none';}catch(_){return false;}}
function mount(){try{const bar=document.getElementById('bossbar'),head=document.querySelector('header');if(!bar||!head)return false;
 if(!home&&bar.parentNode&&bar.parentNode!==head)home={parent:bar.parentNode,next:bar.nextSibling};
 if(!on||headerHidden(head)){if(home&&bar.parentNode!==home.parent){home.parent.insertBefore(bar,home.next&&home.next.parentNode===home.parent?home.next:null);stats.restored=(stats.restored||0)+1;}return false;}
 if(!document.getElementById('r334Style')){const st=document.createElement('style');st.id='r334Style';st.textContent=CSS;document.head.appendChild(st);}
 if(bar.parentNode!==head){const nav=head.querySelector('.topnav');head.insertBefore(bar,nav||null);stats.mounted++;}return true;}catch(e){fail(e);return false;}}
if(!mount()){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else setTimeout(mount,0);}
// 다른 오버레이가 header 를 다시 짜거나, 모바일 실플레이가 켜지고 꺼질 때 자리를 맞춘다
setInterval(mount,500);
try{new MutationObserver(()=>mount()).observe(document.body,{attributes:true,attributeFilter:['class']});}catch(_){}
window.__STORYWORLD_HUD_BOSSBAR_R334__=Object.freeze({revision:REV,mount,
 inspect:()=>({revision:REV,on,inHeader:document.getElementById('bossbar')?.parentNode===document.querySelector('header'),stats:{...stats},lastError}),
 set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}mount();return on;}});
})();
