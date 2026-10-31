// R179 — 초반 보스 전투 시간 맞추기(사용자 2026-10-31 "초반부 보스들 특히 뿌리 문지기 보스 너무 오랜 전투시간 — 체력 변경 가능하게 할 테니까 밸런스 맞춰줘").
//  측정(헤드리스, 새 게임 1레벨 환도): 뿌리의 문지기 체력 11,066 · 방어 배율 1.18, 기본 공격 초당 약 150 → 쉬지 않고 때려도 약 87초, 피하며 싸우면 2~3분.
//  지역이 오를 때 체력도 한 지역에 약 4.6%씩 오르고 영웅도 지역마다 한 레벨씩 오르므로, 초반 구간만 '실제로 깎아야 하는 체력'을 줄여 40초 안팎이 되게 한다.
//  · 체력 값(최대 체력)은 저장·불러오기·체력 정규화(R61/R63/R71)가 다시 계산하므로 직접 바꾸지 않고(바꾸면 배율이 겹친다),
//    그 보스·중간보스가 받는 피해를 1/배율 만큼 키운다 — 체력 ×배율 과 같은 전투 시간. 체력 막대는 비율대로 줄어든다.
//  · 본편(STORY)만. 사몽 구역·DREAM·함께하기는 그대로. 표 SCALE 를 고치면 바로 바뀐다. storyworld.r179.balance {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_BALANCE_R179__)return;
const REV='R179-balance-2',KEY='storyworld.r179.balance';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
// 지역 → 보스·중간보스 체력 배율(받는 피해 = 원래 피해 ÷ 배율)
const SCALE=Object.freeze({dist00:.45,dist01:.6,dist02:.6,dist03:.6,dist04:.6,dist05:.6,dist06:.6,ep1a08:.8,ep1a09:.8,ep1a09b:.8,ep1a10:.8,ep1a11:.8});
const stats={boosted:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const major=e=>!!(e&&(e.boss||e.midboss||e.combatProfile?.major));
function factor(r){try{if(!prefs.on||typeof layer==='undefined'||layer!=='STORY'||r?.samongR103)return 1;const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();if(m&&m!=='off')return 1;return SCALE[r?.id]||1;}catch(_){return 1;}}
try{
 if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,...a){try{if(major(e)&&Number.isFinite(value)&&value>0){const k=factor(typeof room!=='undefined'?room:null);if(k<1){value=value/k;stats.boosted++;}}}catch(err){fail(err);}return base.apply(this,[e,value,...a]);};}
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_BALANCE_R179__=Object.freeze({revision:REV,SCALE,set,factor:id=>factor({id}),inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
