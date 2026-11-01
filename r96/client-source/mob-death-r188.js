// R188 — 몹이 죽을 때 다른 몹 그림이 나오던 문제(사용자 2026-11-01 "죽을 때 다른 몹이 나오는 문제").
//  원인: 살아 있는 동안은 R92·R109·R116 등이 몹 그림(e.profile.frames)을 드라이브·r109 시트로 잠깐 바꿔 그리는데, 모두 hp>0 일 때만 바꾼다.
//  죽는 순간부터는 엔진 원래 프로필의 쓰러짐 그림(goat_head_demon_mob_bloodied·cult_mage·rc137 몹 공격 묶음 등 — 원래 종류의 다른 몹)이 나왔다.
//  · 엔진이 그림을 고르는 frameFor 사슬 맨 바깥에서 살아 있을 때의 그림을 기억했다가, 죽은 뒤 다른 그림이 오면 그 그림으로 쓰러짐 처리(사라짐)를 한다.
//    판정·보상·사라지는 시간은 그대로.
//  · 덧씌우기가 없던 몹(원래 그림 그대로)은 건드리지 않는다. storyworld.r188.mobDeath {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_DEATH_R188__)return;
const REV='R188-mobdeath-1',KEY='storyworld.r188.mobDeath';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={remembered:0,deathDraws:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const looks=new WeakMap();
const major=e=>!!(e&&(e.boss||e.miniBoss||e.r104Boss||e.elite==='boss'));
const pathOf=f=>f&&(f.path||f.image?.src||f.src||'');
/* 엔진 drawEnemy 는 그릴 그림을 __STORYWORLD_STORY_COMBAT_R54__.frameFor(e, fallback) 로 고른다(덧씌우기들이 모두 이 사슬에 걸림).
   맨 바깥에서 살아 있을 때 고른 그림을 기억하고, 죽은 뒤 다른 그림(원래 종류의 쓰러짐 그림)이 오면 기억한 그림으로 바꾼다. */
function install(){const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(!S||typeof S.frameFor!=='function'||S.__r188)return false;
 window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r188:true,frameFor(e,f){const r=S.frameFor(e,f);if(!prefs.on||!e||typeof e!=='object'||major(e)||e.persona)return r;
  try{const alive=e.hp>0&&e.spawnState!=='dead';if(alive){if(r&&pathOf(r)){if(!looks.has(e))stats.remembered++;looks.set(e,r);}return r;}
   const look=looks.get(e);if(look&&r!==look&&pathOf(r)!==pathOf(look)){stats.deathDraws++;return look;}}catch(err){fail(err);}return r;}});return true;}
let ok=false;try{ok=install();}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_MOB_DEATH_R188__=Object.freeze({revision:REV,set,inspect:()=>({revision:REV,installed:ok,prefs:{...prefs},stats:{...stats},lastError})});
})();
