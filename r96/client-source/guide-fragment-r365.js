// R365 — 사용자 2026-11-06 "기억조각창을 길잡이에서도 키고 끌수있도록 설정에추가".
//  길잡이(반자동)로 가는 동안 주운 쪽지·기억 조각 창(R177 오른쪽 종이, R169 기억 쪽지·R162 단서조각도 같은 창)이 화면 오른쪽을 오래 덮었다.
//  · 설정 창에 '길잡이 중 기억 조각 창 표시' 켜기/끄기를 더한다(기본 켜짐 = 예전 그대로). localStorage storyworld.r365.guideFragment {show:bool}.
//  · 끄고 길잡이가 켜져 있으면: 창을 펼치지 않는다. 조각은 R177 이 펼치기 전에 이미 쪽지 모음에 넣으므로(keep → show) 그대로 기록되고,
//    짧은 알림만 띄운다 — 나중에 메뉴 → 쪽지 모음에서 읽는다. 손으로 할 때·켜 두었을 때는 예전 그대로.
//  · 진행이 걸린 서사 창(R255: 보스 문·출구·최종장, '계속'을 눌러야 넘어감)과 E 로 직접 연 기록(force)은 건드리지 않는다.
(()=>{'use strict';
if(window.__STORYWORLD_GUIDE_FRAGMENT_R365__)return;
const REV='R365-guide-fragment-1',KEY='storyworld.r365.guideFragment';
let prefs={show:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={held:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const guiding=()=>{try{return typeof guide!=='undefined'&&!!guide;}catch(_){return false;}};
const FORMS={chart:'진료기록',shard:'기억 조각',report:'누군가의 보고서',note:'쪽지'};
function set(p){prefs={...prefs,...p,show:p&&'show' in p?p.show!==false:prefs.show};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
// R177 show() 가 묻는다: true 면 창을 펼치지 않는다(조각은 이미 쪽지 모음에 있음).
function hold(doc){if(prefs.show!==false||!guiding())return false;stats.held++;
 try{if(typeof toast==='function')toast((FORMS[doc?.form]||'쪽지')+'을(를) 쪽지 모음에 넣었습니다 · 길잡이 중 창 끔(설정)',1.8);}catch(_){}return true;}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{const grid=document.querySelector('#panel .settings');if(grid&&!document.getElementById('r365GuideFrag')){
 const l=document.createElement('label'),c=document.createElement('input');l.id='r365GuideFragRow';c.type='checkbox';c.id='r365GuideFrag';c.checked=prefs.show!==false;
 l.title='끄면 길잡이로 가는 동안 주운 쪽지·기억 조각을 창으로 펼치지 않고 쪽지 모음에만 넣습니다(손으로 할 때는 그대로)';
 c.onchange=()=>set({show:c.checked});l.appendChild(c);l.appendChild(document.createTextNode(' 길잡이 중 기억 조각 창 표시(끄면 쪽지 모음에만)'));
 const after=document.getElementById('r253SecsRow');if(after&&after.parentNode===grid&&after.nextSibling)grid.insertBefore(l,after.nextSibling);else grid.appendChild(l);}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
window.__STORYWORLD_GUIDE_FRAGMENT_R365__=Object.freeze({revision:REV,set,hold,prefs:()=>({...prefs}),inspect:()=>({revision:REV,prefs:{...prefs},guiding:guiding(),stats:{...stats},lastError})});
})();
