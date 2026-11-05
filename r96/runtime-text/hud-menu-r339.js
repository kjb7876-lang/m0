// R339 — 사용자 2026-11-05 "황금실 제작·777 사용 중 이런 거 모두 메뉴 안으로 넣고 메뉴 UI 단순화 및 깔끔화".
//  · 맨 위 줄(header)에는 '메뉴' 하나만 남긴다. 777·황금실 제작/연속·영웅·기억·지도·저장 버튼은 DOM 에 그대로 두고(단축키·다른 코드가 쓰므로) 숨긴 뒤,
//    메뉴 안 묶음에 같은 동작을 하는 버튼(원래 버튼을 대신 누름)으로 넣는다.
//  · 메뉴 창: 개발용 문구(LOCAL DOWNLOAD·고정 커밋 안내)를 숨기고, 버튼을 '진행 · 저장 · 전투와 성장 · 사몽 · 설정' 묶음으로 나눠 같은 크기 격자로.
//    오프라인본 저장·검무 선택 같은 드문 도구는 '추가 도구'로 접는다. 모르는 새 버튼은 '기타'로 자동으로 모은다.
//  · 끄기: localStorage['storyworld.r339.menu']='0'.
(()=>{'use strict';
if(window.__STORYWORLD_HUD_MENU_R339__)return;
const REV='R339-menu-1',KEY='storyworld.r339.menu';
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={menus:0,proxied:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const HIDE=['story-code-button','goldHudOpen','goldHudCast','goldHudSecond','goldHudThird','r263HeroBtn','journalBtn','mapBtn','saveBtn'];
// 묶음: [제목, [[버튼 id | 'proxy:<header id>', 보일 이름(없으면 원래 글자)]...]]
const GROUPS=[
 ['진행',[['proxy:r263HeroBtn','영웅'],['proxy:journalBtn','기억'],['proxy:mapBtn','지도'],['menuGuide'],['menuHome']]],
 ['저장',[['menuSave'],['slotsOpenR73','저장 슬롯 · 불러오기'],['menuExport','저장 파일 내보내기'],['menuLoad','저장 파일 불러오기']]],
 ['전투와 성장',[['goldOpen','황금실 제작·관리'],['proxy:goldHudCast','황금실 연속'],['r103Grow'],['r169BookBtn']]],
 ['사몽',[['r103Menu'],['r62DreamMenu']]],
 ['설정',[['menuSettings'],['menuHelp'],['menuDiag'],['proxy:story-code-button','777']]],
 ['처음으로',[['menuTitle'],['campaignTitle54'],['campaignNewMenu54']]]];
const RARE=['packImages','packAudio'];
const CSS=`
header .topnav #${HIDE.join(',header .topnav #')},header .r93-dock{display:none!important}
#panel .r339Menu{display:flex;flex-direction:column;gap:12px;margin-top:6px}
#panel .r339Group h4{margin:0 0 6px;font:600 11px/1.4 'Malgun Gothic',serif;letter-spacing:.14em;color:#c8a86a;text-transform:none}
#panel .r339Grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}
#panel .r339Grid button{width:100%;min-height:34px;margin:0;font-size:13px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#panel details.r339Rare{margin-top:4px;border-top:1px solid #3c3428;padding-top:8px}#panel details.r339Rare summary{cursor:pointer;color:#a99876;font-size:12px}
#panel .r339Hide{display:none!important}
@media(max-width:640px){#panel .r339Grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
function style(){if(document.getElementById('r339Style'))return;const s=document.createElement('style');s.id='r339Style';s.textContent=CSS;document.head.appendChild(s);}
function proxy(id,label){const src=document.getElementById(id);if(!src)return null;const b=document.createElement('button');b.type='button';b.dataset.r339Proxy=id;b.textContent=label||src.textContent.trim();
 if(id==='story-code-button')b.textContent='777 · '+src.textContent.trim().replace(/^777\s*/,'');
 b.onclick=()=>{stats.proxied++;try{src.click();}catch(e){fail(e);}};return b;}
function build(){try{if(!on)return;const panel=document.getElementById('panel');const actions=panel?.querySelector('.actions');if(!actions||!panel.querySelector('#menuClose'))return;stats.menus++;
 let box=panel.querySelector('.r339Menu');if(!box){box=document.createElement('div');box.className='r339Menu';actions.parentNode.insertBefore(box,actions);}
 // 개발용 문구 숨김
 for(const el of panel.querySelectorAll('.eyebrow,p.small'))if(/LOCAL DOWNLOAD|고정 커밋|원래 main/.test(el.textContent))el.classList.add('r339Hide');
 const used=new Set();
 for(const[title,items]of GROUPS){let g=box.querySelector('[data-r339="'+title+'"]');if(!g){g=document.createElement('section');g.className='r339Group';g.dataset.r339=title;g.innerHTML='<h4></h4><div class="r339Grid"></div>';g.querySelector('h4').textContent=title;box.appendChild(g);}
  const grid=g.querySelector('.r339Grid');
  for(const[id,label]of items){let b;if(id.startsWith('proxy:')){const hid=id.slice(6);b=grid.querySelector('[data-r339-proxy="'+hid+'"]')||proxy(hid,label);}else{b=document.getElementById(id);if(b&&label&&!b.dataset.r339Label){b.dataset.r339Label='1';b.textContent=label;}}
   if(b&&b.parentNode!==grid)grid.appendChild(b);if(b)used.add(b);}
  g.hidden=!grid.children.length;}
 // 남은 버튼 중 모르는 것은 '기타' 묶음으로(드문 도구 RARE 는 아래 접기로)
 const leftovers=[...panel.querySelectorAll('button')].filter(b=>!used.has(b)&&!box.contains(b)&&b.id!=='menuClose'&&!RARE.includes(b.id)&&b.closest('.actions'));
 for(const b of leftovers){let g=box.querySelector('[data-r339="기타"]');if(!g){g=document.createElement('section');g.className='r339Group';g.dataset.r339='기타';g.innerHTML='<h4>기타</h4><div class="r339Grid"></div>';box.appendChild(g);}g.querySelector('.r339Grid').appendChild(b);}
 // box 뒤의 나머지(빈 버튼 줄·오프라인본 안내와 버튼·검무 선택 등)는 모두 '추가 도구'로 접는다
 let rare=box.querySelector('details.r339Rare');const after=[];let seen=false;for(const el of [...box.parentNode.children]){if(el===box){seen=true;continue;}if(seen)after.push(el);}
 const rest=after.filter(el=>!(el.classList.contains('actions')&&!el.querySelector('button')&&!el.textContent.trim()));
 if(rest.length){if(!rare){rare=document.createElement('details');rare.className='r339Rare';rare.innerHTML='<summary>추가 도구 · 오프라인본 저장·검무 선택</summary>';box.appendChild(rare);}for(const el of rest)rare.appendChild(el);}
 for(const a of box.parentNode.querySelectorAll(':scope > .actions'))if(!a.querySelector('button'))a.classList.add('r339Hide');
}catch(e){fail(e);}}
function headerHide(){try{if(!on)return;style();}catch(e){fail(e);}}
headerHide();
if(typeof showMenu==='function'){const base=showMenu;showMenu=function(...a){const r=base.apply(this,a);build();setTimeout(build,60);setTimeout(build,350);return r;};}
window.__STORYWORLD_HUD_MENU_R339__=Object.freeze({revision:REV,build,GROUPS,HIDE,
 inspect:()=>({revision:REV,on,stats:{...stats},lastError}),
 set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}if(!on)document.getElementById('r339Style')?.remove();else headerHide();return on;}});
})();
