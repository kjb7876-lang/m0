// R263 캐릭터 선택창 — 사용자 2026-11-03 "캐릭터선택창바로가는UI넣고 버그없게 적용하고 캐릭터선택창캐릭터도 멋있게만들어서적용".
//  ① 바로가기: 위쪽 단추 줄(기억·지도·저장·메뉴)에 '영웅' 단추를 넣는다. 게임 중 어디서나(창·서사 장면·로딩·함께하기 아닐 때) 영웅 선택창을 바로 연다.
//     원래 이 창은 쉼터(경계의 제단)에서만 열렸고, '돌아가기'가 쉼터 창으로 갔다 → 바로가기로 연 때는 '돌아가기'가 창을 닫고 게임으로 돌아간다.
//     영웅을 바꾸는 일 자체(엔진 showHeroes 의 이 영웅으로 변경: 그림 읽기 → 영웅 교체 → 저장)는 그대로 쓴다.
//  ② 멋있게: 선택창 위에 고른 영웅을 크게 보여 주는 무대를 붙인다 — R108 초상화(assets/r108/heroes, 384×512)를 크게, 영웅 색(HEROES.color)의
//     기운·천천히 숨 쉬는 확대·위로 떠오르는 불티·빛 한 줄기, 이름·역할·근거리/원거리·패시브·Q 기술. 아래 카드는 초상화+이름만 남긴 띠로.
//     영웅을 고르면(엔진이 창을 다시 그림) 무대가 새 영웅으로 바뀌며 짧게 번진다. 움직임 줄이기 설정(prefers-reduced-motion)이면 움직임 없이.
//  끄기: localStorage['storyworld.r263.heroSelect']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_HERO_SELECT_R263__)return;
const REV='R263-hero-select-1',KEY='storyworld.r263.heroSelect';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={opened:0,blocked:0,staged:0,backToGame:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const ROLE=()=>window.__STORYWORLD_HEROES_R108__?.roles||{};
const portrait=id=>{try{return urlFor(window.__STORYWORLD_HEROES_R108__?.portraitPath?.(id)||('assets/r108/heroes/'+id+'.webp'));}catch(_){return 'assets/r108/heroes/'+id+'.webp';}};
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
/* started·loading·storyScene·modal·player 는 게임 스크립트의 최상위 let 이라 window 에 없다 — 직접 읽는다 */
const isStarted=()=>{try{return typeof started!=='undefined'&&!!started;}catch(_){return false;}};
function canOpen(){try{return on&&isStarted()&&!(typeof loading!=='undefined'&&loading)&&!(typeof storyScene!=='undefined'&&storyScene)&&solo()&&typeof showHeroes==='function'&&typeof player==='object'&&!!player&&player.hp>0;}catch(_){return false;}}
let fromField=false,pending=false;
// ---- ① 바로가기 단추 ----
function addButton(){const nav=document.querySelector('nav.topnav');if(!nav||document.getElementById('r263HeroBtn'))return;
 const b=document.createElement('button');b.id='r263HeroBtn';b.type='button';b.textContent='영웅';b.title='영웅 선택창 열기';
 b.onclick=()=>{try{if(!canOpen()){stats.blocked++;if(typeof toast==='function')toast('지금은 영웅 선택창을 열 수 없습니다(장면·로딩 중).',2);return;}
   if(typeof modal!=='undefined'&&modal&&typeof closePanel==='function')closePanel(true);pending=true;stats.opened++;showHeroes(false);}catch(e){fail(e);fromField=false;}finally{pending=false;}};
 const first=nav.querySelector('#journalBtn')||nav.firstChild;nav.insertBefore(b,first);}
function syncButton(){const b=document.getElementById('r263HeroBtn');if(!b)return addButton();const show=on&&isStarted()&&solo();b.style.display=show?'':'none';b.disabled=!canOpen();}
// 바로가기로 연 창의 '돌아가기'는 쉼터 창이 아니라 게임으로
if(typeof showSanctuary==='function'){const base=showSanctuary;showSanctuary=function(...a){if(fromField&&document.getElementById('heroBack')){fromField=false;stats.backToGame++;try{closePanel(true);}catch(e){fail(e);}return;}return base.apply(this,a);};}
if(typeof closePanel==='function'){const base=closePanel;closePanel=function(...a){fromField=false;return base.apply(this,a);};/* 창이 닫히면(영웅 변경 완료 포함) 바로가기 표시는 끝 */}
// ---- ② 무대 ----
function css(){if(document.getElementById('r263Css'))return;const s=document.createElement('style');s.id='r263Css';s.textContent=[
 '#r263HeroBtn{border-color:#a8894f}',
 '#panel.r263{width:min(980px,96vw)}',
 '#r263Stage{--c:#d2b77e;position:relative;display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr);gap:18px;align-items:end;margin:4px 0 12px;padding:14px 16px;border:1px solid #4a4238;background:radial-gradient(120% 140% at 22% 60%,color-mix(in srgb,var(--c) 28%,transparent),transparent 62%),linear-gradient(180deg,#0b0d10,#050608);overflow:hidden;border-radius:3px;min-height:240px}',
 '#r263Stage .pt{position:relative;height:clamp(220px,38vh,360px);aspect-ratio:3/4;max-width:100%;justify-self:center}',
 '#r263Stage .pt img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 12%;filter:drop-shadow(0 0 18px color-mix(in srgb,var(--c) 55%,transparent)) saturate(1.05) contrast(1.06);-webkit-mask-image:linear-gradient(180deg,#000 78%,transparent);mask-image:linear-gradient(180deg,#000 78%,transparent);animation:r263breath 7s ease-in-out infinite alternate;transform-origin:50% 30%}',
 '#r263Stage .aura{position:absolute;left:4%;bottom:-8%;width:52%;height:70%;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--c) 45%,transparent),transparent);filter:blur(8px);animation:r263pulse 3.8s ease-in-out infinite;pointer-events:none}',
 '#r263Stage .ray{position:absolute;top:-40%;left:18%;width:22%;height:180%;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--c) 22%,transparent),transparent);transform:rotate(18deg);animation:r263ray 6s ease-in-out infinite;pointer-events:none}',
 '#r263Stage .ember{position:absolute;bottom:-6px;width:3px;height:3px;border-radius:50%;background:var(--c);box-shadow:0 0 6px var(--c);opacity:0;animation:r263ember linear infinite;pointer-events:none}',
 '#r263Stage .info{position:relative;min-width:0;padding-bottom:6px}',
 '#r263Stage .role{font-size:11px;letter-spacing:.24em;color:var(--c);opacity:.9}',
 '#r263Stage .nm{margin:2px 0 8px;font:700 clamp(26px,4.4vw,40px)/1.1 "Noto Serif KR","Malgun Gothic",serif;letter-spacing:.06em;color:#f1e6d2;text-shadow:0 0 18px color-mix(in srgb,var(--c) 60%,transparent)}',
 '#r263Stage .tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}#r263Stage .tags span{font-size:11px;padding:2px 8px;border:1px solid color-mix(in srgb,var(--c) 55%,#3a3229);color:#e8dcc6;background:#0008;border-radius:2px}',
 '#r263Stage .row{font-size:13px;line-height:1.7;color:#d8ccb8;margin:2px 0}#r263Stage .row b{color:var(--c);font-weight:600;margin-right:6px}',
 '#r263Stage.swap .pt img{animation:r263in .55s ease-out,r263breath 7s ease-in-out .55s infinite alternate}',
 '#panel.r263 .cards.r108{grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}',
 '#panel.r263 .card.r108{grid-template-columns:1fr;padding:6px;gap:4px;text-align:center}',
 '#panel.r263 .card.r108 .pf{width:100%;height:auto;aspect-ratio:3/4}',
 '#panel.r263 .card.r108 small,#panel.r263 .card.r108 .role{display:none}',
 '#panel.r263 .card.r108 strong{font-size:13px;margin:0}',
 '#panel.r263 .card.r108.selected{transform:translateY(-2px)}',
 '@keyframes r263breath{from{transform:scale(1)}to{transform:scale(1.035) translateY(-4px)}}',
 '@keyframes r263pulse{0%,100%{opacity:.55}50%{opacity:.95}}',
 '@keyframes r263ray{0%,100%{opacity:.15;transform:rotate(18deg) translateX(-30%)}50%{opacity:.55;transform:rotate(18deg) translateX(40%)}}',
 '@keyframes r263ember{0%{opacity:0;transform:translateY(0)}12%{opacity:.9}100%{opacity:0;transform:translateY(-300px) translateX(var(--dx))}}',
 '@keyframes r263in{from{opacity:0;filter:blur(6px) brightness(1.6)}to{opacity:1}}',
 '@media (max-width:700px){#r263Stage{grid-template-columns:1fr;text-align:center}#r263Stage .tags{justify-content:center}#r263Stage .pt{height:clamp(220px,38vh,320px)}}',
 '@media (prefers-reduced-motion:reduce){#r263Stage *,#r263Stage{animation:none!important}}'].join('\n');document.head.appendChild(s);}
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let lastId=null;
function stage(){const panel=document.getElementById('panel'),cards=panel?.querySelector('.cards');if(!panel||!cards||!cards.querySelector('[data-hero]'))return;
 css();panel.classList.add('r263');const sel=cards.querySelector('.card.selected[data-hero]')||cards.querySelector('[data-hero]'),id=sel.dataset.hero,H=(typeof HEROES!=='undefined'&&HEROES[id])||{};
 let st=panel.querySelector('#r263Stage');if(!st){st=document.createElement('div');st.id='r263Stage';cards.parentNode.insertBefore(st,cards);}
 if(st.dataset.hero===id)return;st.dataset.hero=id;st.style.setProperty('--c',H.color||'#d2b77e');
 const ranged=!(H.melee)&&Number(H.range)>4,embers=Array.from({length:14},(_,i)=>'<i class="ember" style="left:'+(6+((i*37)%88))+'%;animation-duration:'+(3.2+((i*13)%5)*.7)+'s;animation-delay:'+(((i*7)%10)*.35)+'s;--dx:'+(((i*29)%40)-20)+'px"></i>').join('');
 st.innerHTML='<div class="aura"></div><div class="ray"></div>'+embers+'<div class="pt"><img alt="'+esc(H.name)+'" decoding="async" src="'+esc(portrait(id))+'"></div>'
  +'<div class="info"><div class="role">'+esc(ROLE()[id]||'')+'</div><div class="nm">'+esc(H.name||id)+'</div><div class="tags"><span>'+(ranged?'원거리':'근거리')+'</span>'+(H.resource?'<span>'+esc(H.resource)+'</span>':'')+'</div>'
  +'<p class="row"><b>패시브</b>'+esc(H.passive)+'</p><p class="row"><b>Q</b>'+esc(H.special)+'</p></div>';
 const img=st.querySelector('.pt img');img.onerror=()=>{img.onerror=null;try{img.src=urlFor(heroArt[id].idle.front);img.style.objectFit='contain';}catch(_){}};
 if(lastId&&lastId!==id){st.classList.remove('swap');void st.offsetWidth;st.classList.add('swap');}lastId=id;stats.staged++;
 if(fromField){const h2=panel.querySelector('h2');if(h2&&/거점에서 영웅 변경/.test(h2.textContent))h2.textContent='영웅 변경';}}
let obs=null;function watch(){const p=document.getElementById('panel');if(!p)return;if(obs)obs.disconnect();obs=new MutationObserver(()=>{if(!p.querySelector('.cards [data-hero]')){p.classList.remove('r263');obs.disconnect();obs=null;lastId=null;return;}try{stage();}catch(e){fail(e);}});obs.observe(p,{childList:true,subtree:true});}
if(typeof showHeroes==='function'){const base=showHeroes;showHeroes=function(...a){fromField=pending;/* 바로가기 단추로 연 때만 — 쉼터에서 연 창의 돌아가기는 원래대로 쉼터로 */const r=base.apply(this,a);try{if(on){lastId=null;stage();watch();}}catch(e){fail(e);}return r;};}
if(typeof openPanel==='function'){const base=openPanel;openPanel=function(...a){const r=base.apply(this,a);try{const p=document.getElementById('panel');if(p&&!p.querySelector('.cards [data-hero]'))p.classList.remove('r263');}catch(_){}return r;};}
try{addButton();}catch(e){fail(e);}if(typeof setInterval==='function')setInterval(()=>{try{syncButton();}catch(e){fail(e);}},500);
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}try{syncButton();}catch(_){}return on;}
window.__STORYWORLD_HERO_SELECT_R263__=Object.freeze({revision:REV,set,canOpen,open:()=>document.getElementById('r263HeroBtn')?.click(),inspect:()=>({revision:REV,on,fromField,stats:{...stats},lastError})});
})();
