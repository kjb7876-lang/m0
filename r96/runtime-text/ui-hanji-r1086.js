// R1086 — 한지 창. 사용자 2026-11-15 "ui조금더 동양화수묵화풍으로 개선", "세로 탄막겜참조 지금만들고있는".
//  · 세로 탄막 게임(합일 세로 리부트)의 수묵 UI 처럼, 창(첫 화면·슬롯·영웅 선택·메뉴·설정·지도·강화·기록·서사 창)을 한지 바탕 + 먹 글씨 + 먹 으뜸 단추 + 붓으로 그은 듯한 단추 테 + 낙관(合)으로 바꾼다.
//  · R1085(먹빛 UI) 위에 얹는다. R1085 파일은 고치지 않는다. 모든 규칙은 <html class="r1085Ink r1086Hanji"> 아래에서만 작동한다 → '수묵화풍 UI' 를 끄면 한지도 같이 꺼진다.
//  · 전투 중 HUD(머리띠·아래 띠·기술 칸·구슬 체력·미니맵·보스 막대·쪽지)는 먹빛 그대로 둔다(맵이 어두운 먹이라 밝은 띠는 눈이 부시다).
//  · 한지는 탄막 게임의 #f2e9d6 보다 한 단계 어둡게(눈부심 누름), 순백은 쓰지 않는다. 먹은 같은 따뜻한 먹 #1e1a18.
//  · 창 안에는 어두운 바탕을 전제로 한 밝은 글씨(영웅별 강조색·사진 위 글씨)가 섞여 있다 → 창 내용이 바뀔 때마다 글씨와 그 뒤 바탕의 대비를 재서,
//    한지 위에서 안 읽히는 글씨만 먹색으로, 어두운 칸(사진·먹 칸) 위에서 안 읽히는 글씨만 한지색으로 표시(data-r1086fix)한다. 읽히는 색(붉은 경고 등)은 그대로 둔다.
//  · 아무것도 숨기지 않는다(단추·입력·자리·크기·id·동작 그대로). 게임 캔버스·판정·저장·서사는 건드리지 않는다. 흐림·움직임·글꼴 내려받기 없음.
//  · 설정 → 화면 꾸밈 → '한지 창' 체크로 끄고 켠다(기본 켜짐). 저장 localStorage['storyworld.r1086.hanji']='0' 이면 꺼짐(그 밖의 값은 켜짐).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_UI_HANJI_R1086__)return;
const REV='R1086-ui-hanji-2',KEY='storyworld.r1086.hanji',CLS='r1086Hanji',BASE='r1085Ink',ATTR='data-r1086fix';
// paper 한지 · paper2 한지 위 칸(단추·카드) · paper3 눌린 칸 · ink 먹 · muted 옅은 먹 · seal 낙관 인주 · line 마른 붓 선
const TOKENS=Object.freeze({paper:'#e4dac2',paper2:'#dacdb0',paper3:'#cbbc9c',ink:'#1e1a18',muted:'#5a5048',seal:'#a83224',line:'#8a7c68'});
const T=TOKENS,LIGHT='#efe6d0',KICK='#8c2f26',INK2='#3a322c';
// :not(#r1086x) 는 아무것도 걸러내지 않고 우선순위만 올린다(R1085 규칙을 이기려고)
const H='html.'+BASE+'.'+CLS+':not(#r1086x)',P=H+' #panel';
const stats={applied:0,rows:0,toggles:0,scans:0,fixed:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,200);};
let on=true;try{if(localStorage.getItem(KEY)==='0')on=false;}catch(_){}
const svg=b=>`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' ${b}</svg>`)}")`;
// 먹으로 그은 한 획(굵게 눌러 시작해 가늘게 빠짐)
const BRUSH=svg(`viewBox='0 0 340 8' preserveAspectRatio='none'><path d='M1 4.6C3 2.2 14 1.2 38 1.6S120 2.9 176 3.5 290 4.3 339 4.1C300 5.5 236 6.9 170 6.5S46 7.3 16 6.9 0 6.4 1 4.6Z' fill='${T.ink}' fill-opacity='.86'/><path d='M40 7.3C90 6.9 150 7.5 210 6.9' stroke='${T.ink}' stroke-opacity='.3' stroke-width='.6' fill='none'/>`);
// 한지 결: 짧고 가는 닥 섬유 몇 가닥(이어 붙는 무늬)
const FIBER=svg(`width='260' height='220' viewBox='0 0 260 220'><g fill='none' stroke='${T.line}' stroke-opacity='.2' stroke-width='.7' stroke-linecap='round'><path d='M12 30c14-5 26 2 38-3'/><path d='M96 12c9 6 20 3 27 10'/><path d='M180 44c12-7 22-1 34-6'/><path d='M40 96c8 7 22 2 30 9'/><path d='M132 84c13-3 20 5 33 1'/><path d='M214 118c8-6 18-2 26-8'/><path d='M20 168c11-6 24 1 35-4'/><path d='M104 150c8 8 19 3 28 10'/><path d='M176 190c12-4 21 3 33-2'/><path d='M70 206c9-5 17 0 26-5'/></g></svg>`);
// 먹 번짐: 창 구석에 옅게 스민 먹 두 점(탄막 게임 첫 화면의 번짐)
const wash=`radial-gradient(120% 90% at 0% 0%,${T.ink}1c,${T.ink}00 52%),radial-gradient(95% 85% at 100% 100%,${T.ink}17,${T.ink}00 58%)`;
const stroke=(a='88',b='33')=>`linear-gradient(90deg,${T.ink}${a},${T.ink}${b} 55%,${T.ink}00 88%)`;
// 붓으로 그은 듯 조금씩 다른 모서리
const HAND='11px 8px 10px 7px/8px 10px 7px 11px',HAND2='6px 4px 7px 3px/4px 7px 3px 6px';
const rules=[
 // ---- 창: 한지 ----
 [`${P}`,`--ink:${T.ink};--muted:${T.muted};--gold:${T.ink};--line:${T.line};--accent:${T.seal};--r1015-ink:${T.ink};--r1015-mute:${T.muted};--r1015-gold:${KICK};--r1015-line:${T.line}73;--r1015-line2:${T.line};background:${BRUSH} top left/min(100%,520px) 5px no-repeat,${wash},${FIBER},${T.paper}!important;background-color:${T.paper}!important;border:1.5px solid ${INK2}!important;border-radius:3px!important;box-shadow:0 0 0 1px #05070a!important;color:${T.ink}!important`],
 [`${P} *`,`text-shadow:none!important`],
 [`${P} h1,${P} h2`,`color:${T.ink}!important;background:${BRUSH} left bottom 1px/min(88%,300px) 5px no-repeat!important;-webkit-text-fill-color:currentColor!important`],
 // 낙관: 제목 옆 인주 도장 '合'
 [`${P} h1::after,${P} h2::after`,`content:'合';display:inline-block;margin-left:.5em;padding:.14em .2em .1em;font-size:.44em;line-height:1;letter-spacing:0;font-weight:700;vertical-align:.5em;color:${LIGHT};-webkit-text-fill-color:${LIGHT};background:${T.seal};border-radius:2px 3px 2px 4px`],
 [`${P} h3,${P} h4`,`color:${T.ink}!important`],
 [`${P} p,${P} li,${P} label,${P} td,${P} th,${P} dd,${P} dt,${P} .storyText`,`color:${T.ink}!important`],
 [`${P} .small,${P} small,${P} .muted,${P} .readout`,`color:${T.muted}!important`],
 [`${P} a`,`color:${KICK}!important`],
 [`${P} .divider,${P} hr`,`background:${stroke()}!important`],
 [`${P} .r1015TitleRule`,`background:${stroke()}!important`],
 // 칸(카드·접는 줄)
 [`${P} details,${P} article,${P} .card,${P} fieldset,${P} #r115Book`,`background:${T.paper2}!important;background-image:none!important;border:1px solid ${T.line}!important;border-radius:${HAND2}!important;box-shadow:none!important`],
 [`${P} span.m,${P} .r222pts`,`border-color:${T.line}!important;color:${T.ink}!important`],
 [`${P} span.m.hand,${P} .r222pts`,`border-color:${T.ink}!important;color:${T.ink}!important`],
 [`${P} #r1021Skills b,${P} #r115Book b,${P} .lv,${P} .r420-val`,`color:${KICK}!important`],
 [`${P} .r222why`,`color:${T.muted}!important`],
 // 지도 칸: 지역 그림을 한지에 스민 먹 그림처럼(곱하기), 설명 글씨는 먹
 [`${P} .worldnode img`,`mix-blend-mode:multiply!important`],
 [`${P} .worldnode small`,`color:${T.ink}!important`],
 [`${P} .pf`,`border-color:${T.line}!important`],
 [`${P} .selected .pf`,`border-color:${T.ink}!important`],
 [`${P} summary`,`color:${T.ink}!important;border-radius:${HAND2}!important`],
 [`${P} details[open]>summary`,`color:${T.ink}!important`],
 // 단추: 한지 조각 + 마른 붓 테
 [`${P} button`,`background:${T.paper2}!important;background-image:none!important;border:1.5px solid ${T.line}!important;border-radius:${HAND}!important;box-shadow:none!important;color:${T.ink}!important`],
 [`${P} button:hover,${P} summary:hover`,`background-color:${T.paper3}!important;border-color:${T.ink}!important;color:${T.ink}!important`],
 [`${P} button:disabled`,`opacity:.5!important;border-color:${T.line}!important;color:${T.muted}!important`],
 [`${P} button:focus-visible`,`outline:2px solid ${T.ink}!important;outline-offset:2px!important`],
 [`${P} button small`,`color:${T.muted}!important`],
 // 으뜸 단추: 먹 바탕에 한지 글씨
 [`${P} button.primary,${P} #campaignNew54,${P} #slotConfirmR73`,`background:${T.ink}!important;background-image:none!important;border-color:${T.ink}!important;color:${LIGHT}!important;font-weight:700!important`],
 [`${P} button.primary:hover,${P} #campaignNew54:hover,${P} #slotConfirmR73:hover`,`background:${INK2}!important;color:${LIGHT}!important`],
 [`${P} button.primary small,${P} #campaignNew54 small,${P} #slotConfirmR73 small`,`color:${LIGHT}!important`],
 // 고른 것·켜진 것: 눌린 한지 + 먹 테 + 인주 줄
 [`${P} button.active,${P} button.on,${P} button.selected,${P} button[aria-pressed="true"],${P} button[aria-selected="true"],${P} .selected`,`background-color:${T.paper3}!important;border-color:${T.ink}!important;box-shadow:inset 3px 0 0 ${T.seal}!important;color:${T.ink}!important`],
 // 입력
 [`${P} input[type="checkbox"],${P} input[type="radio"],${P} input[type="range"]`,`accent-color:${T.seal}!important`],
 [`${P} select,${P} input[type="text"],${P} input[type="number"],${P} input:not([type]),${P} textarea`,`background:${LIGHT}!important;color:${T.ink}!important;border:1px solid ${T.line}!important;border-radius:${HAND2}!important`],
 [`${P} .badge,${P} .tag`,`border-color:${T.line}!important;color:${T.muted}!important`],
 [`${P} .loader`,`background:${T.paper2}!important;border-color:${T.line}!important`],
 [`${P} .loader i`,`background:${T.ink}!important`],
 [`${P} .storyFoot,${P} .heroPickActions`,`background:${T.paper}!important;border-color:${T.line}!important`],
 [`${P} ::-webkit-scrollbar-thumb`,`background:${T.line}`],
 // R1118: 영웅 선택 무대(#r263Stage)는 한지 창 안의 어두운 칸 → 이름·패시브·Q 줄은 대비 검사(scan)를 기다리지 않고 처음부터 밝은 글씨(외부 리뷰 '어두운 카드 위 검은 글씨')
 [`${P} #r263Stage .nm,${P} #r263Stage .row,${P} #r263Stage p`,`color:${LIGHT}!important`],
 // R1118: 설정 맨 위 '지금 적용 중인 기술'(R1021)의 민트 이름표도 한지 위에서는 처음부터 먹 글씨
 [`${P} #r1021Skills .k,${P} #r1021Skills .v,${P} #r1021Skills .who span,${P} #r1021Skills .up`,`color:${T.ink}!important`],
 // 대비 바로잡기(scan 이 붙인 표시) — 맨 뒤·가장 높은 우선순위
 [`${P} [${ATTR}="ink"]:not(#r1086y)`,`color:${T.ink}!important;-webkit-text-fill-color:${T.ink}!important`],
 [`${P} [${ATTR}="paper"]:not(#r1086y)`,`color:${LIGHT}!important;-webkit-text-fill-color:${LIGHT}!important`],
];
const css=rules.map(([s,d])=>s+'{'+d+'}').join('\n');
// ---- 색 읽기 ----
const num=v=>typeof v==='number'&&Number.isFinite(v);
function rgb(s){try{const m=/rgba?\(([^)]+)\)/.exec(String(s||''));if(!m)return null;const v=m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  const c={r:v[0],g:v[1],b:v[2],a:v[3]===undefined?1:v[3]};return num(c.r)&&num(c.g)&&num(c.b)&&num(c.a)?c:null;}catch(_){return null;}}
const lin=v=>{v=Math.min(255,Math.max(0,v))/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};
const lum=c=>.2126*lin(c.r)+.7152*lin(c.g)+.0722*lin(c.b);
const ratio=(a,b)=>(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
const DARK=.18,PAPER_L=lum(rgb('rgb(228,218,194)'));
// 어두운 칸인가: 반 넘게 불투명한 색이면 그 밝기로, 색이 없고 그림(사진)이면 어둡다고 본다. 그라데이션만 있으면 모른다(false).
// 붓 획·한지 결 같은 작은 SVG 무늬(data URI)는 사진이 아니다
const photo=img=>/url\(/.test(String(img||'').replace(/url\(\s*["']?data:image\/svg\+xml[^)]*\)/g,''));
function isDark(bg,img){try{const c=rgb(bg);if(c&&c.a>=.5)return lum(c)<DARK;return photo(img);}catch(_){return false;}}
// 이 요소 뒤의 실제 바탕 밝기(0~1). 조상을 타고 올라가며 첫 불투명 색·사진·그라데이션을 찾는다.
function backLum(el,panel,memo){const chain=[];let e=el,out=PAPER_L;
  while(e&&e.nodeType===1){if(memo.has(e)){out=memo.get(e);break;}chain.push(e);let v=null;
    try{const cs=getComputedStyle(e),c=rgb(cs.backgroundColor),img=String(cs.backgroundImage||'');
      if(c&&c.a>=.5)v=lum(c);else if(photo(img))v=0;
      else if(/gradient\(/.test(img)){const ls=[];const re=/rgba?\([^)]+\)/g;let m;while((m=re.exec(img))){const g=rgb(m[0]);if(g&&g.a>=.5)ls.push(lum(g));}if(ls.length)v=ls.reduce((a,b)=>a+b,0)/ls.length;}}catch(_){}
    if(v!==null){out=v;break;}if(e===panel)break;e=e.parentElement;}
  for(const x of chain)memo.set(x,out);return out;}
const hasText=el=>{const ns=el.childNodes||[];for(let i=0;i<ns.length;i++){const n=ns[i];if(n.nodeType===3&&/\S/.test(n.nodeValue||''))return true;}return false;};
let lastScan=0,pending=false;
function scan(){pending=false;try{const root=document.documentElement;if(!root||!root.classList.contains(CLS))return;const panel=document.getElementById('panel');if(!panel||!panel.querySelectorAll)return;
  if(panel.getClientRects&&!panel.getClientRects().length)return;
  const all=panel.querySelectorAll('*'),memo=new Map(),n=Math.min(all.length,3000);stats.scans++;lastScan=Date.now();
  for(let i=0;i<n;i++){const el=all[i];if(!el||!el.getAttribute)continue;const tag=el.tagName;if(tag==='IMG'||tag==='CANVAS'||tag==='SVG'||tag==='svg'||tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA'||tag==='OPTION')continue;
    const had=el.getAttribute(ATTR);if(!had&&!hasText(el))continue;
    const back=backLum(el,panel,memo),want=back<.3?'paper':'ink';
    if(had){if(had!==want){const fg=rgb(getComputedStyle(el).color);if(fg&&ratio(lum(fg),back)<4.5)el.setAttribute(ATTR,want);}continue;}
    const fg=rgb(getComputedStyle(el).color);if(!fg)continue;
    if(ratio(lum(fg),back)<4.5){el.setAttribute(ATTR,want);stats.fixed++;}}}catch(e){fail(e);}}
// 창 내용이 바뀌면 그리기 전에 바로 한 번, 잇달아 바뀌면 0.15초에 한 번만
function request(){try{if(Date.now()-lastScan>150){scan();return;}if(pending)return;pending=true;setTimeout(scan,160);}catch(e){fail(e);}}
function apply(){try{const root=document.documentElement;if(!root)return;const want=on&&root.classList.contains(BASE);
  if(want){if(!root.classList.contains(CLS)){root.classList.add(CLS);setTimeout(scan,0);}}else if(root.classList.contains(CLS))root.classList.remove(CLS);
  if(!document.getElementById('uiHanjiR1086')){const st=document.createElement('style');st.id='uiHanjiR1086';st.textContent=css;(document.head||root).appendChild(st);}stats.applied++;}catch(e){fail(e);}}
function set(v){if(typeof v!=='boolean')return on;on=v;try{if(on)localStorage.removeItem(KEY);else localStorage.setItem(KEY,'0');}catch(_){}apply();sync();return on;}
function sync(){try{const b=document.getElementById('hanjiToggleR1086');if(b)b.checked=on;}catch(e){fail(e);}}
// 설정 '화면 꾸밈' 묶음(R1085 가 만든 #inkUiR1085) 안에 '한지 창' 줄을 넣는다
function row(){try{const sec=document.getElementById('inkUiR1085');if(!sec)return;if(document.getElementById('hanjiToggleR1086')){sync();return;}
  const lab=document.createElement('label');lab.id='hanjiRowR1086';lab.style.display='flex';lab.style.alignItems='center';lab.style.gap='8px';lab.style.cursor='pointer';lab.style.marginTop='6px';
  const box=document.createElement('input');box.type='checkbox';box.id='hanjiToggleR1086';box.checked=on;
  box.addEventListener('change',()=>{stats.toggles++;set(!!box.checked);});
  const tx=document.createElement('span');tx.textContent='한지 창';
  const note=document.createElement('small');note.textContent='밝은 한지 바탕·먹 글씨·낙관. 끄면 먹빛 창으로 돌아갑니다.';note.style.marginLeft='6px';
  lab.appendChild(box);lab.appendChild(tx);lab.appendChild(note);sec.appendChild(lab);stats.rows++;}catch(e){fail(e);}}
function hook(){try{if(typeof showSettings!=='function'||showSettings.__r1086)return;const base=showSettings;
  const wrapped=function(...a){const r=base.apply(this,a);try{row();for(const ms of [0,140,480])setTimeout(row,ms);}catch(e){fail(e);}return r;};wrapped.__r1086=true;if(base.__r1085)wrapped.__r1085=true;showSettings=wrapped;}catch(e){fail(e);}}
// R1085 를 끄고 켜면 따라간다 + 창 내용이 바뀌면 대비를 다시 잰다
let watching=false;
function watch(){try{if(watching)return;const root=document.documentElement;
  if(typeof MutationObserver==='function'){watching=true;
    new MutationObserver(()=>apply()).observe(root,{attributes:true,attributeFilter:['class']});
    const arm=()=>{try{const panel=document.getElementById('panel');if(!panel)return false;
      new MutationObserver(()=>{if(root.classList.contains(CLS))request();}).observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});return true;}catch(e){fail(e);return true;}};
    if(!arm())document.addEventListener('DOMContentLoaded',arm);}
  else{watching=true;const poll=()=>{apply();setTimeout(poll,500);};setTimeout(poll,500);}}catch(e){fail(e);}}
apply();hook();watch();
try{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{apply();hook();scan();});}catch(_){}
window.__STORYWORLD_UI_HANJI_R1086__=Object.freeze({revision:REV,TOKENS,css,enabled:()=>on,set,isDark,scan,
 inspect:()=>({revision:REV,on,applied:stats.applied,rows:stats.rows,toggles:stats.toggles,scans:stats.scans,fixed:stats.fixed,errors:stats.errors,lastError,rules:rules.length})});
})();
