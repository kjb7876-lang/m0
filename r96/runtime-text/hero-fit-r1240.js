/* R1240 영웅 변경창 맞춤(사용자 2026-11-19 "영웅변경할때 한영웅이미지만 크게나오면서 영웅변경이 안되는문제 전수조사 개선").
 *  · 원인(공개판 헤드리스 재현): R263 큰 무대(고른 영웅 1명 초상)가 영웅 줄 위에 있고, 777 해금 뒤 줄이 EGO 2D·3D·페르소나 칸까지 11칸(두 줄)이 되면서
 *    보통 노트북 브라우저(1366×640: 칸 전부, 1280×720: 칸 아래쪽 반·페르소나 칸 전부, 1920×900: 페르소나 칸)가 창 아래로 밀렸다.
 *    R1106 은 높이 620px 이하·폭 700px 이하만 줄을 무대 위 띠로 올려서 그 사이 크기가 빠졌다. 그래서 큰 영웅 그림 하나만 보이고 다른 영웅을 누를 수 없었다.
 *  · 고침(크기 무관, 영웅 창이 열려 있을 때만): 영웅 칸 전부와 확정 단추가 창 안에 들어오는지 실제 자리로 잰다.
 *    ① 넘치면 무대 초상 높이를 넘친 만큼 줄인다(최저 110px). ② 그래도 넘치면 영웅 줄을 한 줄 가로 띠(R1106 과 같은 모양)로 바꾼다.
 *    ③ 그래도 넘치면(아주 작은 창) 창을 줄 쪽으로 스크롤한다. 창이 커지면 원래 크기로 되돌린다. 영웅 칸·무대는 숨기거나 지우지 않는다.
 *  · 영웅을 바꾸는 일(엔진 showHeroes·R1046 EGO·R1176 2D/3D·R1113 페르소나 선택)은 그대로 쓴다 — 자리·크기만 손댄다.
 *  끄기: localStorage['storyworld.r1240.heroFit']='off'
 */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HERO_FIT_R1240__)return;
const REV='R1240-hero-fit-1',KEY='storyworld.r1240.heroFit',MIN=110,PAD=6,SLACK=24;
let on=true;try{if(localStorage.getItem(KEY)==='off')on=false;}catch(_){}
const stats={fits:0,shrink:0,grow:0,strip:0,unstrip:0,scroll:0,resets:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
function css(){if(document.getElementById('r1240Css'))return;const s=document.createElement('style');s.id='r1240Css';s.textContent=[
 '#panel.r1240strip.r263 .cards,#panel.r1240strip.r263start .heroRowR101{display:flex!important;flex-wrap:nowrap!important;justify-content:flex-start!important;overflow-x:auto;overflow-y:hidden;gap:6px!important;margin:4px 0 8px!important;padding:4px 2px 6px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}',
 '#panel.r1240strip.r263 .cards>*,#panel.r1240strip.r263start .heroRowR101>*{flex:0 0 72px!important;width:72px!important;min-width:0;padding:4px!important;scroll-snap-align:start}',
 '#panel.r1240strip.r263 .cards>* img,#panel.r1240strip.r263 .cards>* .pf,#panel.r1240strip.r263start .heroRowR101>* img{width:100%!important;height:72px!important;max-height:72px!important;aspect-ratio:auto!important;object-fit:cover;object-position:50% 12%;margin:0 0 2px!important}',
 '#panel.r1240strip.r263 .cards>* strong,#panel.r1240strip.r263start .heroRowR101>* span{font-size:11px!important;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}',
 '#panel.r1240strip.r263 .cards>* small{display:none}',
 '#panel.r1240fit #r263Stage{min-height:0!important}',
 /* 무대 글(EGO 기록 줄 등)이 초상보다 길면 무대가 글 높이로 커져 줄여도 소용없다 → 맞춤 중에는 글 칸을 초상 높이로 묶고 그 안에서 스크롤 */
 '#panel.r1240fit #r263Stage .info{max-height:var(--r1240h,none);overflow-y:auto;scrollbar-width:thin}',
 '#panel.r1240fit #r263Stage .info.r1240more{-webkit-mask-image:linear-gradient(180deg,#000 calc(100% - 18px),transparent);mask-image:linear-gradient(180deg,#000 calc(100% - 18px),transparent)}'].join('\n');document.head.appendChild(s);}
const visible=el=>{try{return !!el&&el.getClientRects().length>0;}catch(_){return false;}};
function heroPanel(){const P=document.getElementById('panel');if(!P||!visible(P))return null;const M=document.getElementById('modal');if(M&&M.classList.contains('hidden'))return null;
 const row=P.querySelector('#heroRowR101 .heroRowR101')||P.querySelector('.cards');if(!row||!row.querySelector('[data-hero]'))return null;
 const st=P.querySelector('#r263Stage'),pt=st&&st.querySelector('.pt');return {P,row,st,pt};}
// 순수: 넘친 양 → 다음 무대 높이(줄이기·키우기). nat=원래 높이, cur=지금 높이, over=넘친 px(음수면 남는 자리)
function nextHeight(nat,cur,over){if(!(nat>0)||!(cur>0)||!Number.isFinite(over))return null;
 if(over>0){const h=Math.max(MIN,Math.floor(cur-over-PAD));return h<cur?h:null;}
 if(over<-SLACK&&cur<nat){const h=Math.min(nat,Math.floor(cur-over-SLACK/2));return h>cur?h:null;}return null;}
// 창 안에서 넘친 양: 영웅 칸·확정·돌아가기 단추의 가장 아랫자리 - 창의 보이는 아랫자리
function overflow(P,row){const pr=P.getBoundingClientRect(),cs=getComputedStyle(P),bottom=Math.min(pr.top+P.clientHeight+(parseFloat(cs.borderTopWidth)||0),window.innerHeight||1e9)-(parseFloat(cs.paddingBottom)||0);
 let low=-1e9;for(const el of [...row.children,P.querySelector('#chooseHero'),P.querySelector('#slotConfirmR73'),P.querySelector('#heroBack')]){if(!el||!visible(el))continue;const r=el.getBoundingClientRect();if(r.bottom>low)low=r.bottom;}
 return low>-1e9?low-bottom:0;}
const natOf=new WeakMap();let lastW=0,lastH=0;
function reset(P,pt){if(pt){pt.style.removeProperty('height');pt.parentElement?.style.removeProperty('--r1240h');}if(P){P.classList.remove('r1240strip','r1240fit');}}
// 한 번 맞추기: 바꾼 것이 있으면 true(같은 틱 안에서 몇 번 되풀이해 깜빡임 없이 자리를 잡는다 — 레이아웃은 동기로 다시 잰다)
function step(P,row,pt){let over=overflow(P,row);if(!pt)return false;
 if(!natOf.has(pt)&&!pt.style.height)natOf.set(pt,pt.getBoundingClientRect().height);const nat=natOf.get(pt)||0,cur=pt.getBoundingClientRect().height;
 const next=nextHeight(nat,cur,over);
 if(next!=null){P.classList.add('r1240fit');pt.style.setProperty('height',next+'px','important');pt.parentElement?.style.setProperty('--r1240h',next+'px');if(next<cur)stats.shrink++;else stats.grow++;return true;}
 // 무대가 최저인데도 넘치면 줄을 한 줄 띠로, 띠인데 자리가 넉넉하면 되돌린다
 if(over>1&&cur<=MIN+1&&!P.classList.contains('r1240strip')&&!window.__STORYWORLD_HERO_ROW_R1106__?.small?.()){P.classList.add('r1240strip');stats.strip++;return true;}
 if(P.classList.contains('r1240strip')&&over<-180){P.classList.remove('r1240strip');stats.unstrip++;return true;}
 if(cur>=nat-1&&!P.classList.contains('r1240strip')&&over<=0&&P.classList.contains('r1240fit')){P.classList.remove('r1240fit');pt.style.removeProperty('height');pt.parentElement?.style.removeProperty('--r1240h');return true;}
 return false;}
// 창 높이 고정: 맞춤 중 무대가 줄었다 늘었다 하면 가운데 정렬된 창의 윗자리가 움직여 '이 영웅으로 변경'이 오르내린다 → 맞춤 중에는 창을 최대 높이로 고정
function lock(P,v){if(v){const mh=getComputedStyle(P).maxHeight;if(mh&&/px$/.test(mh)&&P.style.minHeight!==mh){P.style.minHeight=mh;P.dataset.r1240lock='1';}}
 else if(P.dataset.r1240lock){P.style.removeProperty('min-height');delete P.dataset.r1240lock;}}
function clean(){const P=typeof document!=='undefined'&&document.getElementById('panel');if(P&&(P.dataset.r1240lock||P.classList.contains('r1240fit')||P.classList.contains('r1240strip'))){lock(P,false);P.classList.remove('r1240fit','r1240strip');}}
function fit(){if(!on||typeof document==='undefined')return;const h=heroPanel();if(!h){clean();return;}css();const {P,row,pt}=h;
 const W=window.innerWidth,H=window.innerHeight;if(W!==lastW||H!==lastH){lastW=W;lastH=H;if(pt){reset(P,pt);natOf.delete(pt);stats.resets++;}}
 stats.fits++;for(let i=0;i<8&&step(P,row,pt);i++);lock(P,P.classList.contains('r1240fit')||P.classList.contains('r1240strip'));
 {const info=P.querySelector('#r263Stage .info');if(info){const more=P.classList.contains('r1240fit')&&info.scrollHeight>info.clientHeight+2&&info.scrollTop+info.clientHeight<info.scrollHeight-2;if(info.classList.contains('r1240more')!==more)info.classList.toggle('r1240more',more);}}
 // 마지막: 그래도 넘치면(아주 작은 창) 창을 스크롤 — 확정 단추·마지막 칸까지 보이게 내리되 영웅 줄·확정 단추 윗자리는 창 안에 남긴다
 const over=overflow(P,row);if(over>1){const pr=P.getBoundingClientRect(),top=pr.top+(parseFloat(getComputedStyle(P).paddingTop)||0),go=P.querySelector('#chooseHero,#slotConfirmR73'),rt=Math.min(row.getBoundingClientRect().top,go&&visible(go)?go.getBoundingClientRect().top:1e9);
  const d=Math.max(0,Math.min(over+PAD,rt-top));if(d>=1){P.scrollTop+=d;stats.scroll++;}}}
function tick(){try{fit();}catch(e){fail(e);}}
if(typeof openPanel==='function'){const base=openPanel;openPanel=function(...a){const r=base.apply(this,a);try{(window.requestAnimationFrame||setTimeout)(tick);setTimeout(tick,60);}catch(e){fail(e);}return r;};}
try{setInterval(tick,200);window.addEventListener('resize',()=>setTimeout(tick,30));}catch(e){fail(e);}
function set(v){on=v!==false&&v!=='off';try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}if(!on){const h=heroPanel();if(h)reset(h.P,h.pt);clean();}else tick();return on;}
window.__STORYWORLD_HERO_FIT_R1240__=Object.freeze({revision:REV,MIN,nextHeight,fit:tick,set,inspect:()=>({revision:REV,on,stats:{...stats},lastError})});
})();
