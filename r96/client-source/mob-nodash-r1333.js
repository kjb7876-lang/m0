// R1333 일반 근접 몹의 첫 돌진 없애기 — 사용자 2026-11-26 08:47Z "그리고 근접몹 처음에 돌진하는거 없애봐쫌".
//  원인: R1221 이 일반 몹 돌진(엔진 R52 근접 돌진·R286 attack-only 돌진)을 45초에 한 번으로 줄였지만, '처음 본 시각'은 방에 들어온 때라
//   방을 22~45초 돌아다닌 뒤 새로 발견한 근접 몹은 발견하자마자 돌진했다. 45초 간격이라 일반 몹이 하는 돌진은 사실상 모두 이 '첫 돌진'이다.
//  바꾼 것: 일반 몹(보스·중간보스·이름에 '중간보스'·페르소나·코스믹·시련·사몽 보스가 아닌 몹)은 R52·R286 돌진을 시작하지 않는다(첫 번째·이후 모두).
//   걸어서 다가와 제자리 근접 공격은 그대로. 보스 쪽 돌진·고유 패턴(signature deck·환영·분신)·보스 2칸 안 휘두르기는 손대지 않는다.
//   실제로 막는 곳은 mob-dash-r1221.js(R52 시작 문·R286 차례) — 여기서는 '막을지'만 답한다(스크립트 순서와 무관하게 늦게 묻는다).
//  끄기: localStorage['storyworld.r1333.nodash']='{"on":false}' (R1221 의 드문 돌진으로 돌아감). 점검: window.__STORYWORLD_MOB_NODASH_R1333__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_MOB_NODASH_R1333__)return;
const REV='R1333-mob-nodash-1',KEY='storyworld.r1333.nodash';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={asked:0,blocked:0,errors:0};let lastError=null;
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.samongBoss||e.combatProfile?.major||/중간보스/.test(String(e.name||''))));
function blocks(e){try{stats.asked++;if(!prefs.on||!e||major(e))return false;stats.blocked++;return true;}catch(err){stats.errors++;lastError=String(err?.message||err).slice(0,160);return false;}}
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_MOB_NODASH_R1333__=Object.freeze({revision:REV,blocks,set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
