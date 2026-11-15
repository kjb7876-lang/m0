// R1085 — 수묵화풍 UI. 사용자 2026-11-15 "그리고 ui도 간결하고 수묵화풍으로 개선".
//  · 창(첫 화면·슬롯·영웅 선택·메뉴·설정·지도·강화·서사 창)과 HUD(머리띠·아래 띠·기술 칸·쪽지·폰 단추)의 금테·그라데이션·둥근 알약 모양·바깥 그림자를 걷어내고
//    먹빛 바탕 + 한지색 글자 + 붓 한 획 밑줄 + 낙관(인주) 한 점으로 통일한다. 색은 R1055 수묵 맵의 진경산수풍(jg) 먹·중간 먹·한지 값과 같다(그 파일은 읽지도 고치지도 않는다).
//  · 간결: 창 머리의 영어 장식 줄, 머리띠의 부제·STORY 딱지 같은 '읽지 않는 글자'만 숨긴다. 단추·입력·기능은 하나도 숨기지 않는다(자리·크기·id·동작 그대로).
//  · 유지: 구슬 체력, 서사 자막 토글, 폰 화면 단추(회피·영웅 배치), 설정의 스킬창, 스킬 키(ASDF·QWER), 폰 자동 이동 기본값, 폰 성능 단계 — 건드리지 않는다.
//  · CSS 만 얹는다(<html class="r1085Ink"> 아래에서만 작동). 게임 캔버스·ctx.filter·판정·저장·서사는 건드리지 않는다. 흐림·움직임·글꼴 내려받기 없음(폰 최소 단계 부담 없음).
//  · 설정 → '수묵화풍 UI' 체크로 끄고 켠다(기본 켜짐). 저장 localStorage['storyworld.r1085.inkUi']='0' 이면 꺼짐(그 밖의 값은 켜짐).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_UI_INK_R1085__)return;
const REV='R1085-ui-ink-1',KEY='storyworld.r1085.inkUi',CLS='r1085Ink';
// 먹·중간 먹·한지 = R1055 jg(ink .07,.085,.11 · mid .35,.37,.395 · pap .80,.78,.70). ink2 는 먹 위에 한 겹 올린 칸, text 는 한지보다 조금 밝은 글자, seal 은 낙관 인주.
const TOKENS=Object.freeze({ink:'#12161c',ink2:'#1a1f27',mid:'#595e65',paper:'#ccc7b3',text:'#d8d3c0',muted:'#9a9ea3',seal:'#c24f3f',line:'#343a43'});
// :not(#r1085x) 는 아무것도 걸러내지 않고 우선순위만 올린다(앞선 오버레이들의 !important 규칙을 이기려고)
const T=TOKENS,R='html.'+CLS+':not(#r1085x)';
const stats={applied:0,sections:0,toggles:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
let on=true;try{if(localStorage.getItem(KEY)==='0')on=false;}catch(_){}
const SERIF="'Nanum Myeongjo','Noto Serif KR','Noto Serif CJK KR','AppleMyungjo','Batang',serif";
// 붓 한 획: 진하게 시작해 옅어지며 끊기는 줄(그림 없이 선형 농담만)
const stroke=(a='cc',b='40')=>`linear-gradient(90deg,${T.paper}${a},${T.paper}${b} 55%,${T.paper}00 88%)`;
// 붓으로 그은 한 획(굵게 눌러 시작해 가늘게 빠지는 모양) — 작은 SVG 를 data URI 로 넣는다(내려받기·필터 없음)
const svg=b=>`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' ${b}</svg>`)}")`;
const BRUSH=svg(`viewBox='0 0 340 8' preserveAspectRatio='none'><path d='M1 4.6C3 2.2 14 1.2 38 1.6S120 2.9 176 3.5 290 4.3 339 4.1C300 5.5 236 6.9 170 6.5S46 7.3 16 6.9 0 6.4 1 4.6Z' fill='${T.paper}' fill-opacity='.82'/><path d='M40 7.3C90 6.9 150 7.5 210 6.9' stroke='${T.paper}' stroke-opacity='.28' stroke-width='.6' fill='none'/>`);
// 먹 번짐: 창 구석의 옅은 얼룩 두 점
const wash=`radial-gradient(120% 90% at 0% 0%,${T.mid}2e,${T.mid}00 55%),radial-gradient(90% 80% at 100% 100%,${T.mid}1f,${T.mid}00 60%)`;
const rules=[
 // ---- 바탕 변수: 옛 금색 변수를 한지색으로 ----
 [`${R}`,`--ink:${T.text};--muted:${T.muted};--gold:${T.paper};--line:${T.line};--accent:${T.paper}`],
 // ---- 창 ----
 [`${R} #panel`,`background:${BRUSH} top left/min(100%,520px) 5px no-repeat,${wash},${T.ink}!important;background-color:${T.ink}!important;border:1px solid ${T.line}!important;border-radius:2px!important;box-shadow:0 0 0 1px #05070a!important;color:${T.text}!important`],
 [`${R} #panel::before,${R} #panel::after`,`border-image:none!important;box-shadow:none!important`],
 [`${R} #panel h1,${R} #panel h2`,`font-family:${SERIF}!important;font-weight:600!important;letter-spacing:.1em!important;color:${T.paper}!important;text-shadow:none!important;background:${BRUSH} left bottom 1px/min(88%,300px) 5px no-repeat,linear-gradient(${T.seal},${T.seal}) left calc(min(88%,300px) + 7px) bottom 0/6px 6px no-repeat!important;padding-bottom:12px!important;-webkit-text-fill-color:currentColor!important`],
 [`${R} #panel h3,${R} #panel h4`,`color:${T.paper}!important;font-weight:600!important;letter-spacing:.06em!important;text-shadow:none!important`],
 [`${R} #panel p,${R} #panel li,${R} #panel label,${R} #panel td,${R} #panel .storyText`,`color:${T.text}!important;text-shadow:none!important`],
 [`${R} #panel .small,${R} #panel small,${R} #panel .muted,${R} #panel .readout`,`color:${T.muted}!important`],
 [`${R} #panel .eyebrow`,`display:none!important`],
 [`${R} #panel .divider,${R} #panel hr`,`height:1px!important;border:0!important;background:${stroke('66','22')}!important`],
 // 창 안의 칸(묶음·카드·접는 줄)
 // 묶음(section)은 상자를 없애고 제목만으로 나눈다(상자 안의 상자 줄이기). 카드·접는 줄만 가는 먹선 칸.
 [`${R} #panel section`,`background:transparent!important;background-image:none!important;border:0!important;border-radius:0!important;box-shadow:none!important`],
 [`${R} #panel details,${R} #panel article,${R} #panel .card,${R} #panel fieldset,${R} #panel #r115Book`,`background:${T.ink2}!important;background-image:none!important;border:1px solid ${T.line}!important;border-radius:2px!important;box-shadow:none!important`],
 // 남은 금빛 알약·딱지(스킬창 표시·강화 점수·첫 화면 금줄)
 [`${R} #panel span.m,${R} #panel .r222pts`,`border-radius:2px!important;background:transparent!important;border:1px solid ${T.line}!important;color:${T.text}!important`],
 [`${R} #panel span.m.hand,${R} #panel .r222pts`,`border-color:${T.paper}!important;color:${T.paper}!important`],
 [`${R} #panel #r1021Skills b,${R} #panel #r115Book b,${R} #panel .lv,${R} #panel .r420-val`,`color:${T.paper}!important`],
 [`${R} #panel .r222why`,`color:${T.muted}!important`],
 [`${R} #panel .r1015TitleRule`,`background:${stroke('66','22')}!important`],
 [`${R} #panel .pf`,`border-color:${T.line}!important;box-shadow:none!important`],
 [`${R} #panel .selected .pf`,`border-color:${T.paper}!important`],
 [`${R} #panel summary`,`color:${T.text}!important;border-radius:2px!important`],
 [`${R} #panel details[open]>summary`,`color:${T.paper}!important`],
 // 단추: 납작한 먹 칸
 [`${R} #panel button,${R} header button,${R} .footRight button,${R} #mobileSettingsR63`,`background:${T.ink2}!important;background-image:none!important;border:1px solid ${T.line}!important;border-radius:2px!important;box-shadow:none!important;color:${T.text}!important;text-shadow:none!important`],
 [`${R} #panel button:hover,${R} header button:hover,${R} .footRight button:hover,${R} #panel summary:hover`,`border-color:${T.paper}!important;color:${T.paper}!important;filter:none!important`],
 [`${R} #panel button:disabled`,`opacity:.45!important;border-color:${T.line}!important;color:${T.muted}!important`],
 [`${R} #panel button:focus-visible,${R} header button:focus-visible,${R} footer button:focus-visible`,`outline:2px solid ${T.paper}!important;outline-offset:2px!important`],
 // 으뜸 단추: 한지 조각에 먹 글씨
 [`${R} #panel button.primary,${R} #panel #campaignNew54,${R} #panel #slotConfirmR73`,`background:${T.paper}!important;background-image:none!important;border-color:${T.paper}!important;color:${T.ink}!important;font-weight:700!important`],
 [`${R} #panel button.primary:hover,${R} #panel #campaignNew54:hover,${R} #panel #slotConfirmR73:hover`,`background:${T.text}!important;color:${T.ink}!important`],
 [`${R} #panel button.primary small,${R} #panel #campaignNew54 small,${R} #panel #slotConfirmR73 small`,`color:${T.ink}!important`],
 [`${R} #panel button small`,`color:${T.muted}!important`],
 // 고른 것·켜진 것: 낙관 한 점(왼쪽 인주 줄)
 [`${R} #panel button.active,${R} #panel button.on,${R} #panel button.selected,${R} #panel button[aria-pressed="true"],${R} #panel button[aria-selected="true"],${R} #panel .selected`,`border-color:${T.paper}!important;box-shadow:inset 3px 0 0 ${T.seal}!important;color:${T.paper}!important`],
 // 입력
 [`${R} #panel input[type="checkbox"],${R} #panel input[type="radio"],${R} #panel input[type="range"]`,`accent-color:${T.seal}!important`],
 [`${R} #panel select,${R} #panel input[type="text"],${R} #panel input[type="number"],${R} #panel input:not([type]),${R} #panel textarea`,`background:${T.ink2}!important;color:${T.text}!important;border:1px solid ${T.line}!important;border-radius:2px!important`],
 [`${R} #panel .badge,${R} #panel .tag`,`border:1px solid ${T.line}!important;border-radius:2px!important;background:transparent!important;color:${T.muted}!important`],
 [`${R} #panel .loader`,`background:${T.ink2}!important;border:1px solid ${T.line}!important;border-radius:0!important`],
 [`${R} #panel .loader i`,`background:${T.paper}!important`],
 [`${R} #panel .storyFoot,${R} #panel .heroPickActions`,`background:${T.ink}!important;border-color:${T.line}!important`],
 [`${R} #panel ::-webkit-scrollbar`,`width:8px;height:8px`],
 [`${R} #panel ::-webkit-scrollbar-thumb`,`background:${T.line};border-radius:0`],
 // ---- 머리띠 ----
 [`${R} header`,`background:${T.ink}eb!important;background-image:none!important;border-bottom:1px solid ${T.line}!important;box-shadow:none!important`],
 [`${R} header .brand`,`font-family:${SERIF}!important;color:${T.paper}!important;letter-spacing:.22em!important;text-shadow:none!important`],
 [`${R} header .brand small,${R} header #layerTag`,`display:none!important`],
 [`${R} header .region strong`,`color:${T.text}!important;font-family:${SERIF}!important`],
 [`${R} header .region small,${R} header #questInlineSummary`,`color:${T.muted}!important`],
 // ---- 아래 띠: 금 테두리 그림을 걷고 먹이 아래로 번지게 ----
 [`${R} footer`,`background:linear-gradient(${T.ink}00,${T.ink}d9 46%,${T.ink}f5)!important;border-top:0!important;box-shadow:none!important`],
 [`${R} footer::before,${R} #quest::before`,`border-image:none!important;border:0!important;background:none!important`],
 [`${R} #heroName`,`color:${T.paper}!important;font-family:${SERIF}!important;text-shadow:none!important`],
 [`${R} #xpText,${R} #awakeText,${R} #buildText,${R} #hpText,${R} #resText`,`color:${T.muted}!important`],
 [`${R} footer .bar`,`background:${T.ink2}!important;border-color:${T.line}!important;border-radius:0!important`],
 [`${R} footer .bar.xp i`,`background:${T.paper}!important`],
 // 기술 칸: 장식 틀 그림 대신 가는 먹선 칸
 [`${R} .skill`,`background:${T.ink2}cc!important;background-image:none!important;border:1px solid ${T.line}!important;border-radius:2px!important;box-shadow:none!important`],
 [`${R} .skill::after`,`background-image:none!important`],
 [`${R} .skill:hover,${R} .skill:focus-visible`,`border-color:${T.paper}!important;filter:none!important`],
 [`${R} .skill.r93-on`,`border-color:${T.paper}!important;box-shadow:inset 0 -2px 0 ${T.seal}!important`],
 [`${R} .skill kbd`,`color:${T.muted}!important;font-family:inherit!important`],
 [`${R} .skill .label`,`color:${T.text}!important`],
 [`${R} .skill .cd`,`background:${T.ink}d1!important;color:${T.paper}!important;font-family:${SERIF}!important`],
 // ---- 게임 화면 위 쪽지·표시 ----
 [`${R} #minipanel`,`background:${T.ink}d9!important;background-image:none!important;border:1px solid ${T.line}!important;box-shadow:none!important`],
 [`${R} #miniLabel`,`color:${T.muted}!important`],
 [`${R} #quest`,`background:${T.ink}d9!important;background-image:none!important;border-left:2px solid ${T.paper}!important;box-shadow:none!important`],
 [`${R} #hint`,`color:${T.text}!important;border-color:${T.line}!important;border-radius:2px!important`],
 [`${R} #toast`,`color:${T.paper}!important`],
 [`${R} #banner`,`font-family:${SERIF}!important;color:${T.paper}!important`],
 [`${R} #banner small`,`color:${T.muted}!important`],
 [`${R} #bossbar`,`background:${T.ink}e6!important;background-image:none!important;border:1px solid ${T.line}!important;border-radius:2px!important;box-shadow:none!important`],
 [`${R} #bossTitle`,`color:${T.paper}!important;font-family:${SERIF}!important`],
 [`${R} #bossSpell`,`color:${T.muted}!important`],
 // 길잡이 나침반 테·곡 소개 쪽지
 [`${R} #stage .ring`,`border-color:${T.paper}!important`],
 [`${R} #r331BgmNote`,`border-radius:2px!important;box-shadow:none!important`],
 // 폰 HUD 칸
 [`${R} body.mobile-live-r63 #noticeShelfR63R2`,`background:${T.ink}f2!important;background-image:none!important;border:0!important;border-top:1px solid ${T.line}!important;box-shadow:none!important`],
 [`${R} #mobileMapR74,${R} #heroCard.mobile-hud-r63`,`background:${T.ink}d9!important;border:1px solid ${T.line}!important;border-radius:2px!important;box-shadow:none!important;color:${T.text}!important`],
 // 설정 줄(꺼진 상태에서도 보여야 하므로 기본 모양은 요소에 직접 준다 — section())
 [`${R} #inkUiR1085`,`margin:12px 0!important;padding:10px 12px!important`],
];
const css=rules.map(([s,d])=>s+'{'+d+'}').join('\n');
function apply(){try{const root=document.documentElement;if(!root)return;if(on)root.classList.add(CLS);else root.classList.remove(CLS);
  if(!document.getElementById('uiInkR1085')){const st=document.createElement('style');st.id='uiInkR1085';st.textContent=css;(document.head||root).appendChild(st);}stats.applied++;}catch(e){fail(e);}}
function set(v){if(typeof v!=='boolean')return on;on=v;try{if(on)localStorage.removeItem(KEY);else localStorage.setItem(KEY,'0');}catch(_){}apply();sync();return on;}
function sync(){try{const b=document.getElementById('inkUiToggleR1085');if(b)b.checked=on;}catch(e){fail(e);}}
// 설정 창의 '수묵화풍 UI' 줄 — 꺼진 상태에서도 다시 켤 수 있게 항상 넣는다
function section(){try{const panel=document.getElementById('panel');if(!panel)return;let sec=document.getElementById('inkUiR1085');
  if(sec){sync();return;}
  sec=document.createElement('section');sec.id='inkUiR1085';sec.style.margin='12px 0';sec.style.padding='10px 12px';
  const h=document.createElement('h3');h.textContent='화면 꾸밈';h.style.margin='0 0 6px';h.style.fontSize='13px';
  const lab=document.createElement('label');lab.style.display='flex';lab.style.alignItems='center';lab.style.gap='8px';lab.style.cursor='pointer';
  const box=document.createElement('input');box.type='checkbox';box.id='inkUiToggleR1085';box.checked=on;
  box.addEventListener('change',()=>{stats.toggles++;set(!!box.checked);});
  const tx=document.createElement('span');tx.textContent='수묵화풍 UI';
  const note=document.createElement('small');note.textContent='먹빛 창·한지 단추·붓 밑줄. 끄면 예전 금테 UI 로 돌아갑니다.';note.style.marginLeft='6px';
  lab.appendChild(box);lab.appendChild(tx);lab.appendChild(note);sec.appendChild(h);sec.appendChild(lab);
  const anchor=document.getElementById('combatScreenR1021');
  if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(sec,anchor.nextSibling||null);else panel.appendChild(sec);
  stats.sections++;}catch(e){fail(e);}}
function hook(){try{if(typeof showSettings!=='function'||showSettings.__r1085)return;const base=showSettings;
  const wrapped=function(...a){const r=base.apply(this,a);try{section();for(const ms of [0,120,450])setTimeout(section,ms);}catch(e){fail(e);}return r;};wrapped.__r1085=true;showSettings=wrapped;}catch(e){fail(e);}}
apply();hook();
try{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{apply();hook();});}catch(_){}
window.__STORYWORLD_UI_INK_R1085__=Object.freeze({revision:REV,TOKENS,css,enabled:()=>on,set,
 inspect:()=>({revision:REV,on,applied:stats.applied,sections:stats.sections,toggles:stats.toggles,errors:stats.errors,lastError,rules:rules.length})});
})();
