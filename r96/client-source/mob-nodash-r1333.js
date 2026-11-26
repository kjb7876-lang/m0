// R1333 몹 돌진 없애기 — 사용자 2026-11-26 08:47Z "근접몹 처음에 돌진하는거 없애봐쫌" → 09:17Z "모든몹돌진없애줘".
//  원인(첫 요청): R1221 이 일반 몹 돌진(엔진 R52 근접 돌진·R286 attack-only 돌진)을 45초에 한 번으로 줄였지만, '처음 본 시각'은 방에 들어온 때라
//   방을 22~45초 돌아다닌 뒤 새로 발견한 근접 몹은 발견하자마자 돌진했다.
//  바꾼 것: 모든 몹(잡몹·수호 챔피언·중간보스·보스·페르소나)이 몸으로 하는 돌진을 시작하지 않는다. 막는 곳(각 파일 시작 문이 여기에 묻는다):
//   · mob-dash-r1221.js  R52 근접 돌진(잡몹·보스)·R286 attack-only 돌진
//   · mob-gaze-r268.js   보스·중간보스·페르소나가 영웅 옆자리로 0.22초 빠른 돌진 → 잡몹과 같은 짧은 블링크로
//   · combat-r114.js     환영이 풀릴 때 몹이 환영 쪽으로 2.4칸 돌진
//   · boss-r205.js       보스가 환영 쪽으로 0.5초에 최대 7칸 이동
//   · mobs-tune-r116.js  수호 챔피언(R81) 기 모은 뒤 10.5칸/초 돌진
//  그대로: 걸어서 다가와 근접 공격, 보스 2칸 안 휘두르기, 장판·투사체·소환(분신·짐승 현현 등 몸이 아닌 패턴), 판정·피해·체력.
//  끄기: localStorage['storyworld.r1333.nodash']='{"on":false}' (원래 돌진, 잡몹은 R1221 의 드문 돌진). 점검: window.__STORYWORLD_MOB_NODASH_R1333__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_MOB_NODASH_R1333__)return;
const REV='R1333-mob-nodash-2',KEY='storyworld.r1333.nodash';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={asked:0,blocked:0,errors:0};let lastError=null;
function blocks(e){try{stats.asked++;if(!prefs.on||!e||typeof e!=='object')return false;stats.blocked++;return true;}catch(err){stats.errors++;lastError=String(err?.message||err).slice(0,160);return false;}}
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_MOB_NODASH_R1333__=Object.freeze({revision:REV,blocks,set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
