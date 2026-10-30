// R142 — 모바일 설정 창 간결화 + '시작 메뉴로' 단추.
//  · 모바일(R63 isMobile)에서 설정 창 맨 위에 [시작 메뉴로] [진행 저장] 단추를 둔다. 시작 메뉴로는 확인 뒤 저장하고 첫 화면으로 간다(본편 returnToTitle 그대로).
//    서사 장면·지역 전환 중이면 가지 않고 안내만 띄운다. 게임을 시작하기 전(첫 화면에서 연 설정)에는 단추를 숨긴다.
//  · 간이설정에는 그래픽 품질·음량만 바로 보이고, 분위기·효과음 켜기·조명·전투·길잡이 같은 나머지는 '더 보기' 안에 접어 둔다. 세부설정은 접힌 채 연다.
//  · 설정 값·저장 키·각 항목의 동작은 그대로다(자리만 옮긴다). PC 화면은 바꾸지 않는다. storyworld.r142.mobileSettings {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_MOBILE_SETTINGS_R142__)return;
const REV='R142-mobile-settings-1',KEY='storyworld.r142.mobileSettings';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={opened:0,condensed:0,moved:0,title:0,titleBlocked:0,saves:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const mobile=()=>{try{return !!window.__STORYWORLD_MOBILE_R63__?.isMobile?.();}catch(_){return false;}};
const say=(t,s=2.6)=>{try{if(typeof toast==='function')toast(t,s);}catch(_){}};
const live=()=>typeof started!=='undefined'&&started;
function css(){if(document.getElementById('mobileSettingsR142Css'))return;const s=document.createElement('style');s.id='mobileSettingsR142Css';
 s.textContent='#panel.r142-mobile{width:min(100vw - 16px,560px)!important;max-width:calc(100vw - 16px)!important;padding:12px 12px 16px!important}'
 +'#panel.r142-mobile>.eyebrow{display:none}#panel.r142-mobile>h2{margin:2px 0 8px;font-size:20px}'
 +'#mobileActionsR142{display:flex;gap:8px;margin:0 0 10px}#mobileActionsR142 button{flex:1;min-height:44px;font-size:15px}'
 +'#mobileActionsR142 .r142-title{background:#5a2a24;border-color:#a8574a;color:#f4e6dc}'
 +'#panel.r142-mobile .r114-row{margin:6px 0}#panel.r142-mobile #moreSettingsR142{margin-top:8px}'
 +'#panel.r142-mobile #moreSettingsR142>summary,#panel.r142-mobile #detailSettingsR114>summary{min-height:40px;line-height:40px;font-size:15px;cursor:pointer}';
 document.head.appendChild(s);}
function toTitle(){try{
 if(!live()){say('게임을 시작한 뒤에 쓸 수 있습니다.');return false;}
 if(typeof storyScene!=='undefined'&&storyScene||typeof loading!=='undefined'&&loading||room?.finalizing){stats.titleBlocked++;say('장면 전환이 끝난 뒤 다시 눌러 주세요.');return false;}
 if(typeof confirm==='function'&&!confirm('진행을 저장하고 시작 메뉴로 갈까요?'))return false;
 const go=window.__STORYWORLD5__?.returnToTitle;if(typeof go!=='function'){say('시작 메뉴로 갈 수 없습니다.');return false;}
 const ok=go();if(ok)stats.title++;else stats.titleBlocked++;return ok;}catch(e){fail(e);return false;}}
function save(){try{if(typeof saveGame==='function'&&saveGame(true))stats.saves++;}catch(e){fail(e);}}
function condense(){const panel=document.getElementById('panel'),quick=document.getElementById('quickSettingsR114');if(!panel||!quick)return;
 panel.classList.add('r142-mobile');css();
 if(!document.getElementById('mobileActionsR142')){const bar=document.createElement('div');bar.id='mobileActionsR142';
  if(live()){const t=document.createElement('button');t.type='button';t.id='mobileTitleR142';t.className='r142-title';t.textContent='시작 메뉴로';t.onclick=toTitle;
   const s=document.createElement('button');s.type='button';s.id='mobileSaveR142';s.textContent='진행 저장';s.onclick=save;bar.append(t,s);}
  if(bar.children.length){const h=panel.querySelector(':scope>h2');if(h)h.after(bar);else panel.prepend(bar);}}
 // (뒤에 읽히는 오버레이(전투·길잡이 R118)가 상자를 나중에 붙이므로 한 번 더 정리한다 — 같은 일을 두 번 해도 결과는 같다.)
 // 설정 창 밖(#modal 바로 아래)에 붙은 상자는 창 안으로 들인다.
 const modal=document.getElementById('modal');if(modal)for(const c of [...modal.children])if(c!==panel&&c.tagName!=='STYLE'&&c.tagName!=='SCRIPT'){quick.appendChild(c);stats.moved++;}
 let more=document.getElementById('moreSettingsR142');
 if(!more){more=document.createElement('details');more.id='moreSettingsR142';const sm=document.createElement('summary');sm.textContent='더 보기 (분위기·소리 켜기·조명·전투·길잡이)';more.appendChild(sm);}
 const vol=quick.querySelector(':scope>.r114-volumes'),rows=[...quick.querySelectorAll(':scope>.r114-row')],keep=new Set([quick.querySelector(':scope>h3'),rows[0],vol,more].filter(Boolean));
 for(const c of [...quick.children])if(!keep.has(c)){more.appendChild(c);stats.moved++;}
 quick.appendChild(more);
 const det=document.getElementById('detailSettingsR114');if(det)det.open=false;
 stats.condensed++;}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{stats.opened++;if(prefs.on&&mobile()){condense();setTimeout(()=>{try{if(document.getElementById('moreSettingsR142'))condense();}catch(e){fail(e);}},0);}}catch(e){fail(e);}return r;};}
function set(k,v){prefs[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_MOBILE_SETTINGS_R142__=Object.freeze({revision:REV,set,toTitle,condense,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},mobile:mobile(),lastError,browser:false,GPU:false})});
})();
