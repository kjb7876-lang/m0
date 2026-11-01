// R189 — 길잡이로 다음 지역에 갈 때 난이도(사용자 2026-11-01 "길잡이로 진행 시에 난이도 설정에서 다음 맵부터 설정 적용 가능하도록, 관련 버그도 모두 개선").
//  버그: R77 길잡이가 다음 이야기 지역으로 넘어갈 때 takeNextNormal 이 언제나 'normal' 을 돌려줘서, 고른 난이도(이지·하드)가 지역마다 노말로 되돌아갔다.
//  · 환경 설정에 '길잡이 다음 지역 난이도'(지금 지역과 같게 / 이지 / 노말 / 하드)를 둔다. 바꾸면 지금 지역은 그대로, 길잡이가 여는 다음 지역부터 적용된다.
//  · 기본값 '지금 지역과 같게': 지금 지역에 고른 난이도를 다음 지역에도 이어 쓴다(예전처럼 노말로 되돌아가지 않음).
//  · 길잡이가 아닌 이동(지도 선택·포탈 직접)은 원래대로 난이도 창을 연다. 협동 손님·777 코드 이동은 원래 규칙 그대로.
//  storyworld.r189.guideTier 에 저장.
(()=>{'use strict';
if(window.__STORYWORLD_GUIDE_TIER_R189__)return;
const REV='R189-guidetier-1',KEY='storyworld.r189.guideTier',TIERS=['follow','easy','normal','hard'],NAME={follow:'지금 지역과 같게',easy:'이지',normal:'노말',hard:'하드'};
let tier='follow';try{const s=localStorage.getItem(KEY);if(TIERS.includes(s))tier=s;}catch(_){}
const stats={applied:0,wrapped:0,errors:0};let lastError=null,last=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
function current(){try{const t=typeof room!=='undefined'?room?.difficultyR63:null;/* applyRoom 이 지금 지역 난이도를 room.difficultyR63 에 둔다 */if(['easy','normal','hard'].includes(t))return t;}catch(_){}return'normal';}
function pick(){return tier==='follow'?current():tier;}
function wrap(){const G=window.__STORYWORLD_GUIDE_R77__;if(!G||typeof G.takeNextNormal!=='function'||G.__r189)return !!G?.__r189;
 const base=G.takeNextNormal;try{window.__STORYWORLD_GUIDE_R77__=Object.freeze({...G,__r189:true,takeNextNormal(destination,l,from){const r=base.call(G,destination,l,from);if(r!=='normal')return r;/* 길잡이 이동이 맞을 때만(원래 검사 통과) 고른 난이도로 */
   try{const t=pick();stats.applied++;last={destination,tier:t,at:Date.now()};return t;}catch(e){fail(e);return r;}}});stats.wrapped++;return true;}catch(e){fail(e);return false;}}
let tries=0;(function arm(){if(wrap()||++tries>60)return;setTimeout(arm,250);})();
function set(t){if(!TIERS.includes(t))return tier;tier=t;try{localStorage.setItem(KEY,t);}catch(_){}try{if(typeof toast==='function')toast('길잡이 다음 지역 난이도: '+NAME[t]+' — 다음 지역부터 적용',2.2);}catch(_){}return tier;}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{const grid=document.querySelector('#panel .settings')||document.querySelector('.settings');if(grid&&!document.getElementById('r189GuideTier')){const l=document.createElement('label');l.textContent='길잡이 다음 지역 난이도 ';const s=document.createElement('select');s.id='r189GuideTier';
   for(const t of TIERS){const o=document.createElement('option');o.value=t;o.textContent=NAME[t];if(t===tier)o.selected=true;s.appendChild(o);}s.onchange=()=>set(s.value);l.appendChild(s);const h=document.createElement('span');h.className='small muted';h.textContent=' (다음 지역부터)';l.appendChild(h);grid.appendChild(l);}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
window.__STORYWORLD_GUIDE_TIER_R189__=Object.freeze({revision:REV,TIERS,set,pick,inspect:()=>({revision:REV,tier,current:current(),wrapped:!!window.__STORYWORLD_GUIDE_R77__?.__r189,stats:{...stats},last,lastError})});
})();
