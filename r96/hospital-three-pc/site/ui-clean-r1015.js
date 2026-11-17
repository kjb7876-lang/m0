// R1015 — 사용자 2026-11-13 "ui 최신 유행하는 걸로 깔끔하게, 딱 볼 때 간편하고 깔끔, 지저분한 건 세부항목으로".
//  세 모드(스토리·무한생존·영화)가 함께 쓰는 화면만 손댄다. 버튼 id·동작·저장 키는 그대로 두고 자리와 겉모습만 바꾼다.
//  · 첫 화면: [처음부터 시작][이어하기] 큰 단추 → [무한 생존][영화 모드] 모드 카드 → 작은 글 단추 줄(불러오기·저장 슬롯·설정·조작 안내).
//    온라인 협동 줄(멀티 보류 중)과 긴 안내 글은 '더 보기 · 함께 하기·안내'로 접는다. 폰 가로(844×390)에서 스크롤 없이 다 보이게.
//  · 메뉴: R339 묶음(진행·저장·전투와 성장·사몽·설정·처음으로)을 접는 묶음(details)으로 바꾸고, 맨 위에 자주 쓰는 빠른 줄
//    (영웅·기억·지도·진행 저장·설정·길잡이)을 둔다. 빠른 줄은 원래 단추를 대신 누른다(같은 동작).
//  · 설정(PC): 폰(R142)처럼 간이설정은 품질·렉 줄이기·밝기·글자 크기·음량만 바로 보이고 나머지는 '더 보기'로 접는다.
//  · 머리띠 곡 이름은 금색 막대 대신 옅은 글, 아래 오른쪽 공격 간격·재사용 수치와 레벨 안내 글은 마우스를 올릴 때만.
//  · 폰: '모바일 +77%' 꼬리표는 숨기고(효과는 그대로), 곡 소개 쪽지는 한 줄로.
//  · 끄기: localStorage['storyworld.r1015.ui']='0'.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_UI_CLEAN_R1015__)return;
const REV='R1015-ui-1',KEY='storyworld.r1015.ui';
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={title:0,menu:0,folds:0,quick:0,settings:0,moved:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const $=id=>document.getElementById(id);
const mobile=()=>{try{return !!window.__STORYWORLD_MOBILE_R63__?.isMobile?.();}catch(_){return false;}};
// 메뉴 빠른 줄: [보일 이름, 누를 원래 단추 id, 글자를 원래 단추에서 가져올지]
const QUICK=[['영웅','r263HeroBtn'],['기억','journalBtn'],['지도','mapBtn'],['진행 저장','menuSave'],['설정','menuSettings'],['길잡이','menuGuide',true]];
// 첫 화면 단추 차례(CSS order). 큰 단추 → 모드 카드 → 작은 글 단추.
const TITLE_MAIN=['campaignNew54','campaignContinue54'];
const TITLE_MODE={survivalStartR600:'정화 코어를 지키며 버티기',cinemaStartR461:'자동 플레이 · 서사 자막과 음성'};
const TITLE_LINK=['campaignImport54','slotsOpenTitleR73','titleSettingsR84','campaignHelp54'];
// 설정(PC) 간이설정에서 바로 보일 것
const SETTINGS_KEEP=['perfRowR150','accessR420','moreSettingsR142'];
const GOLD='#d9b46a';
const CSS=`
body.r1015On{--r1015-bg:rgba(17,15,19,.94);--r1015-line:rgba(217,180,106,.22);--r1015-line2:rgba(217,180,106,.5);--r1015-ink:#ece2cc;--r1015-mute:rgba(236,226,204,.58);--r1015-gold:${GOLD}}
/* 창: 두 겹 금테 → 얇은 한 줄 + 둥근 모서리 */
body.r1015On #panel{border-radius:16px!important;border:1px solid var(--r1015-line)!important;outline:none!important;box-shadow:0 18px 60px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.04)!important}
body.r1015On #panel:not(.r1015TitlePanel){background:var(--r1015-bg)!important}
body.r1015On #panel.r1015TitlePanel{background:linear-gradient(160deg,rgba(24,20,24,.82),rgba(12,11,14,.76))!important}
body.r1015On #panel::before,body.r1015On #panel::after{display:none!important}
body.r1015On #panel button{border-radius:10px;transition:background .15s,border-color .15s,transform .1s}
body.r1015On #panel button:not(:disabled):hover{border-color:var(--r1015-line2)}
body.r1015On #panel button:not(:disabled):active{transform:translateY(1px)}
body.r1015On #panel details>summary{list-style:none;cursor:pointer;user-select:none}
/* 쓸 수 없는 '앞으로 ▶'(R176)는 숨긴다(R222 와 같은 뜻) */
body.r1015On #panel button[data-r176="fwd"]:disabled{display:none}
body.r1015On #panel details>summary::-webkit-details-marker{display:none}
/* 첫 화면 */
body.r1015On #panel.r1015TitlePanel{max-width:min(640px,calc(100vw - 24px))!important;width:min(640px,calc(100vw - 24px))!important;padding:28px 32px 20px!important;overflow:auto}
body.r1015On .r1015TitlePanel .hospitalStart50{max-width:none;margin:0;padding:0}
body.r1015On .r1015TitlePanel .hospitalStart50 h1{margin:4px 0 6px;font-size:40px;letter-spacing:.12em}
body.r1015On .r1015TitlePanel .hospitalLead50{margin:0 0 4px;color:var(--r1015-mute)}
body.r1015On .r1015TitlePanel .hospitalStart50>p.small{margin:0 0 16px;color:var(--r1015-mute);font-size:12px}
body.r1015On .r1015TitlePanel .r1015TitleNote{display:none}
body.r1015On .r1015TitlePanel .hospitalStartButtons50{display:flex!important;flex-wrap:wrap;gap:10px;margin:0}
body.r1015On .r1015TitlePanel .hospitalStartButtons50>button{margin:0;min-height:44px;flex:1 1 30%;order:30;font-size:13px;background:transparent;border:1px solid transparent;color:var(--r1015-mute);min-width:0;padding:6px 8px}
body.r1015On .r1015TitlePanel .hospitalStartButtons50>button:not(:disabled):hover{color:var(--r1015-ink);background:rgba(255,255,255,.04)}
body.r1015On .r1015TitlePanel .hospitalStartButtons50>button.r1015Main{order:10;flex:1 1 calc(50% - 10px);min-height:56px;font-size:17px;font-weight:600;color:var(--r1015-ink);background:rgba(255,255,255,.05);border:1px solid var(--r1015-line)}
body.r1015On .r1015TitlePanel .hospitalStartButtons50>button.r1015Main.primary,body.r1015On .r1015TitlePanel .hospitalStartButtons50>button.r1015Main.r1015Lead{background:linear-gradient(180deg,rgba(217,180,106,.32),rgba(150,112,52,.28));border-color:var(--r1015-line2);color:#fff6e2}
body.r1015On .r1015TitlePanel .hospitalStartButtons50>button.r1015Main:disabled{opacity:.38}
body.r1015On .r1015TitlePanel .hospitalStartButtons50>button.r1015Mode{order:20;flex:1 1 calc(50% - 10px);min-height:62px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px;padding:8px 16px;text-align:left;font-size:15px;color:var(--r1015-ink);background:rgba(255,255,255,.03);border:1px solid var(--r1015-line)}
body.r1015On .r1015TitlePanel .hospitalStartButtons50>button.r1015Mode::after{content:attr(data-r1015-sub);font-size:11.5px;font-weight:400;color:var(--r1015-mute)}
body.r1015On .r1015TitlePanel .hospitalStartButtons50>button.r1015Link{order:30;flex:1 1 auto;min-height:38px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.r1015On .r1015TitlePanel .r1015TitleRule{order:25;flex:1 1 100%;height:1px;margin:2px 0;background:var(--r1015-line)}
body.r1015On .r1015TitlePanel details.r1015TitleMore{margin-top:12px;border-top:1px solid var(--r1015-line);padding-top:8px}
body.r1015On .r1015TitlePanel details.r1015TitleMore>summary{font-size:12px;color:var(--r1015-mute);padding:4px 0}
body.r1015On .r1015TitlePanel details.r1015TitleMore>summary::before{content:'＋ '}
body.r1015On .r1015TitlePanel details.r1015TitleMore[open]>summary::before{content:'－ '}
body.r1015On .r1015TitlePanel details.r1015TitleMore .r1015TitleNote{display:block;margin:6px 0;font-size:12px;color:var(--r1015-mute)}
body.r1015On .r1015TitlePanel details.r1015TitleMore .actions{margin:8px 0 2px}
@media (max-height:520px){
 body.r1015On #panel.r1015TitlePanel{padding:12px 18px 10px!important;max-height:calc(100vh - 16px)!important;top:8px}
 body.r1015On .r1015TitlePanel .hospitalStart50>.eyebrow{display:none}
 body.r1015On .r1015TitlePanel .hospitalStart50 h1{font-size:26px;margin:0 0 2px}
 body.r1015On .r1015TitlePanel .hospitalLead50,body.r1015On .r1015TitlePanel .hospitalStart50>p.small{display:none}
 body.r1015On .r1015TitlePanel .hospitalStartButtons50{gap:6px}
 body.r1015On .r1015TitlePanel .hospitalStartButtons50>button.r1015Main{min-height:46px;font-size:15px}
 body.r1015On .r1015TitlePanel .hospitalStartButtons50>button.r1015Mode{min-height:50px;padding:5px 12px;font-size:14px}
 body.r1015On .r1015TitlePanel .hospitalStartButtons50>button.r1015Link{min-height:34px;font-size:12px}
 body.r1015On .r1015TitlePanel details.r1015TitleMore{margin-top:6px;padding-top:4px}
}
/* 메뉴: 빠른 줄 + 접는 묶음 */
body.r1015On #panel .r1015Quick{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin:2px 0 6px}
body.r1015On #panel .r1015Quick button{margin:0;min-height:48px;font-size:14px;font-weight:600;background:rgba(255,255,255,.05);border:1px solid var(--r1015-line);color:var(--r1015-ink)}
body.r1015On #panel .r339Menu{gap:6px!important}
body.r1015On #panel details.r1015Fold{border:1px solid var(--r1015-line);border-radius:12px;background:rgba(255,255,255,.02)}
body.r1015On #panel details.r1015Fold>summary{display:flex;align-items:center;justify-content:space-between;min-height:40px;padding:0 14px;font-size:13px;color:var(--r1015-ink)}
body.r1015On #panel details.r1015Fold>summary::after{content:'›';margin-left:10px;font-size:18px;color:var(--r1015-mute);transition:transform .15s}
body.r1015On #panel details.r1015Fold[open]>summary::after{transform:rotate(90deg)}
body.r1015On #panel details.r1015Fold>summary small{margin-left:8px;color:var(--r1015-mute);font-size:11px;font-weight:400}
body.r1015On #panel details.r1015Fold>summary span{flex:1}
body.r1015On #panel details.r1015Fold>.r339Group{padding:0 10px 10px}
body.r1015On #panel details.r1015Fold>.r339Group>h4{display:none}
body.r1015On #panel details.r1015Fold[hidden]{display:none}
body.r1015On #panel details.r1015Single>summary{display:none}
body.r1015On #panel details.r1015Single>.r339Group{padding:0}
body.r1015On #panel details.r1015Single .r339Grid{display:block}
body.r1015On #panel details.r1015Single .r339Grid>button{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:40px;margin:0;padding:0 14px;border:0;background:none;text-align:left;font-size:13px;color:var(--r1015-ink)}
body.r1015On #panel details.r1015Single .r339Grid>button::after{content:'›';font-size:18px;color:var(--r1015-mute)}
body.r1015On #panel details.r1015Fold>details.r339Rare{margin:0 10px 10px}
body.r1015On #panel details.r339Rare>summary{padding:6px 2px}
/* 설정: 더 보기(PC 도) */
body.r1015On #panel #moreSettingsR142{margin-top:10px;border:1px solid var(--r1015-line);border-radius:12px;padding:0 12px}
body.r1015On #panel #moreSettingsR142>summary,body.r1015On #panel #detailSettingsR114>summary{min-height:40px;line-height:40px;font-size:14px;color:var(--r1015-ink)}
body.r1015On #panel #moreSettingsR142>summary::before,body.r1015On #panel #detailSettingsR114>summary::before{content:'＋ ';color:var(--r1015-gold)}
body.r1015On #panel #moreSettingsR142[open]>summary::before,body.r1015On #panel #detailSettingsR114[open]>summary::before{content:'－ '}
body.r1015On #panel input[type=range]{accent-color:var(--r1015-gold)}
body.r1015On #panel input[type=checkbox]{accent-color:var(--r1015-gold)}
/* 머리띠 곡 이름: 금색 막대 → 옅은 글 */
body.r1015On #r313Bgm{background:none!important;color:var(--r1015-mute)!important;border-radius:0!important;padding:0 2px!important;max-width:16rem!important;font-size:11.5px!important}
body.r1015On #layerTag{border-radius:999px;padding:0 8px;border-color:var(--r1015-line)!important;color:var(--r1015-mute)}
/* 아래 HUD: 세부 수치는 마우스를 올릴 때만 */
body.r1015On footer #buildText,body.r1015On footer #xpText{opacity:0!important;transition:none!important}
body.r1015On footer:hover #buildText,body.r1015On footer:hover #xpText{opacity:1!important}
body.r1015On footer #upgradeBtn{border-radius:10px}
/* 곡 소개 쪽지: 한 줄 */
body.r1015On #r331BgmNote{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:min(70vw,30rem)!important;padding:3px 14px!important;font-size:11.5px!important;line-height:1.6!important;border-radius:999px!important}
/* 폰 */
body.r1015On #mobileBonusR286{display:none!important}
body.r1015On.r1015Mobile #goldHudOpen,body.r1015On.r1015Mobile #goldHudCast{border-radius:10px}
`;
function style(){try{if($('r1015Style'))return;const s=document.createElement('style');s.id='r1015Style';s.textContent=CSS;document.head.appendChild(s);}catch(e){fail(e);}}
function bodyFlag(){try{if(!document.body)return;document.body.classList.toggle('r1015On',on);document.body.classList.toggle('r1015Mobile',on&&mobile());}catch(e){fail(e);}}
// 첫 화면 -------------------------------------------------------------------------------------------
function title(){try{const panel=$('panel');if(!panel)return false;const start=panel.querySelector('.hospitalStart50');
 panel.classList.toggle('r1015TitlePanel',!!(on&&start));if(!on||!start)return false;
 const box=start.querySelector('.hospitalStartButtons50');if(!box)return false;
 for(const id of TITLE_MAIN){const b=$(id);if(b){b.classList.add('r1015Main');if(b.parentNode!==box){box.appendChild(b);stats.moved++;}}}
 // 이어하기가 되면 이어하기가 앞(강조), 아니면 처음부터 시작이 강조
 const cont=$('campaignContinue54'),neu=$('campaignNew54');if(cont&&neu){const lead=!cont.disabled;cont.classList.toggle('r1015Lead',lead);neu.classList.toggle('r1015Lead',!lead);cont.style.order=lead?'9':'';}
 for(const[id,sub]of Object.entries(TITLE_MODE)){const b=$(id);if(b){b.classList.add('r1015Mode');b.dataset.r1015Sub=sub;if(b.parentNode!==box){box.appendChild(b);stats.moved++;}}}
 for(const id of TITLE_LINK){const b=$(id);if(b){b.classList.add('r1015Link');if(b.parentNode!==box){box.appendChild(b);stats.moved++;}}}
 for(const b of box.querySelectorAll(':scope>button'))if(!b.classList.contains('r1015Main')&&!b.classList.contains('r1015Mode'))b.classList.add('r1015Link');
 if(!box.querySelector('.r1015TitleRule')){const r=document.createElement('i');r.className='r1015TitleRule';r.setAttribute('aria-hidden','true');box.appendChild(r);}
 // 더 보기: 협동 줄(멀티 보류)·긴 안내 글
 let more=panel.querySelector('details.r1015TitleMore');
 if(!more){more=document.createElement('details');more.className='r1015TitleMore';const s=document.createElement('summary');s.textContent='더 보기 · 함께 하기·안내';more.appendChild(s);panel.appendChild(more);}
 const notes=[...start.querySelectorAll(':scope>p.small')].filter(p=>p.compareDocumentPosition(box)&Node.DOCUMENT_POSITION_PRECEDING);
 for(const p of notes){p.classList.add('r1015TitleNote');more.appendChild(p);stats.moved++;}
 for(const el of [...panel.children])if(el!==start&&el!==more&&(el.id==='coopTitleActions62'||el.matches('p.small'))){if(el.matches('p.small'))el.classList.add('r1015TitleNote');more.appendChild(el);stats.moved++;}
 if(panel.lastElementChild!==more)panel.appendChild(more);
 stats.title++;return true;}catch(e){fail(e);return false;}}
// 메뉴 -------------------------------------------------------------------------------------------
function menu(){try{if(!on)return false;const panel=$('panel');const box=panel?.querySelector('.r339Menu');if(!box||!panel.querySelector('#menuClose'))return false;
 let q=box.querySelector(':scope>.r1015Quick');
 if(!q){q=document.createElement('div');q.className='r1015Quick';q.setAttribute('role','group');q.setAttribute('aria-label','자주 쓰는 메뉴');
  for(const[label,id,live]of QUICK){const src=$(id);if(!src)continue;const b=document.createElement('button');b.type='button';b.dataset.r1015Quick=id;
   b.textContent=live?(src.textContent.trim()||label):label;b.onclick=()=>{try{stats.quick++;$(id)?.click();}catch(e){fail(e);}};q.appendChild(b);}
  box.prepend(q);}
 for(const g of [...box.querySelectorAll('section.r339Group')]){let d=g.parentNode;
  if(!(d&&d.matches&&d.matches('details.r1015Fold'))){d=document.createElement('details');d.className='r1015Fold';const s=document.createElement('summary');d.appendChild(s);g.parentNode.insertBefore(d,g);d.appendChild(g);stats.folds++;}
  const n=g.querySelectorAll('.r339Grid>button').length;const t=g.dataset.r339||'';const s=d.querySelector(':scope>summary');const txt=t+'|'+n;
  if(s.dataset.r1015!==txt){s.dataset.r1015=txt;s.innerHTML='<span></span><small></small>';s.firstChild.textContent=t;s.lastChild.textContent=n+'개';}
  d.hidden=!!g.hidden||!n;
  // 단추가 하나뿐인 묶음은 접지 않고 그 단추만 보인다(한 번 더 누를 필요 없음)
  const single=n===1;if(d.classList.contains('r1015Single')!==single){d.classList.toggle('r1015Single',single);d.open=single;}}
 // R339 '추가 도구'(오프라인본 저장·검무 선택)는 '설정' 묶음 맨 끝으로(R339 는 하위에서 다시 찾음)
 const rare=box.querySelector('details.r339Rare'),setFold=box.querySelector('[data-r339="설정"]')?.parentNode;
 if(rare&&setFold&&setFold.matches('details.r1015Fold')&&(rare.parentNode!==setFold||setFold.lastElementChild!==rare)){setFold.appendChild(rare);stats.moved++;}
 stats.menu++;return true;}catch(e){fail(e);return false;}}
// 설정(PC) ----------------------------------------------------------------------------------------
function settings(){try{if(!on||mobile())return false;const quick=$('quickSettingsR114');if(!quick)return false;
 let more=$('moreSettingsR142');
 if(!more){more=document.createElement('details');more.id='moreSettingsR142';const sm=document.createElement('summary');sm.textContent='더 보기 (분위기·소리 켜기·조명·전투·길잡이)';more.appendChild(sm);}
 const rows=[...quick.querySelectorAll(':scope>.r114-row')];
 const keep=new Set([quick.querySelector(':scope>h3'),rows[0],quick.querySelector(':scope>.r114-volumes'),...SETTINGS_KEEP.map($)].filter(Boolean));
 for(const c of [...quick.children])if(!keep.has(c)&&c!==more){more.appendChild(c);stats.moved++;}
 if(more.parentNode!==quick||quick.lastElementChild!==more)quick.appendChild(more);
 const det=$('detailSettingsR114');if(det&&!det.dataset.r1015){det.dataset.r1015='1';det.open=false;}
 stats.settings++;return true;}catch(e){fail(e);return false;}}
const later=(f,ms)=>{try{setTimeout(()=>{try{f();}catch(e){fail(e);}},ms);}catch(e){fail(e);}};
const after=fn=>function(base){return function(...a){const r=base.apply(this,a);try{bodyFlag();fn();later(fn,0);later(fn,90);later(fn,420);}catch(e){fail(e);}return r;};};
if(typeof document!=='undefined'&&document.head){style();bodyFlag();
 // 전역 함수는 다른 덧씌움과 같은 방식(이름에 바로 대입)으로 감싼다
 if(typeof showTitle==='function')showTitle=after(title)(showTitle);
 if(typeof showMenu==='function')showMenu=after(menu)(showMenu);
 if(typeof showSettings==='function')showSettings=after(settings)(showSettings);
 // 모드 단추(R600·R461)는 첫 화면이 열린 뒤 따로 붙으므로 가끔 다시 정리한다(이미 정리됐으면 하는 일 없음)
 try{setInterval(()=>{bodyFlag();const p=$('panel');if(p&&(p.querySelector('.hospitalStart50')||p.classList.contains('r1015TitlePanel')))title();},700);}catch(e){fail(e);}
 later(title,0);}
window.__STORYWORLD_UI_CLEAN_R1015__=Object.freeze({revision:REV,QUICK,TITLE_MAIN,TITLE_MODE,TITLE_LINK,SETTINGS_KEEP,CSS,title,menu,settings,
 set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}bodyFlag();return on;},
 inspect:()=>({revision:REV,on,mobile:mobile(),stats:{...stats},lastError,browser:true,GPU:false})});
})();
