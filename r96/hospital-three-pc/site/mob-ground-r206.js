/* R206 땅에 붙은 몹 — 사용자 2026-11-01 "떠다니는 몬스터 아니면 그림자 없애, 땅에 붙어 있는 느낌이 확실하게".
 *  몹을 그릴 때(drawEnemy) 엔진 접촉 그림자(shadow)를 부르면, 그 몹이 떠 있지 않으면 그리지 않는다.
 *  떠 있음 = R109 가 띄운 높이(visualLiftPx>0)·그림자 인자 lift>0·R100 그림 정보의 fly·이름이 날짐승·유령류.
 *  영웅·소품·투사체 그림자는 그대로. 판정·위치·저장은 그대로. storyworld.r206.ground {on:false} 로 원래대로.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_MOB_GROUND_R206__)return;
const REV='R206-ground-1',KEY='storyworld.r206.ground';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={skipped:0,kept:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const FLY_NAME=/유령|망령|혼령|원혼|잔영|박쥐|나방|날개|비행|부유|떠도는|wisp|ghost|bat|moth|wing|fly|hover|float/i;
function floating(e,opt){try{if(e?.r208Mob)return false;/* R208 땅 몹 그림 */if(Number(e?.visualLiftPx)>0.5||Number(opt?.lift)>0.02)return true;if(window.__STORYWORLD_POLISH_R100__?.artOf?.(e)?.fly)return true;
 return FLY_NAME.test(String(e?.name||'')+' '+String(e?.nativeId||'')+' '+String(e?.r200Shade||''));}catch(err){fail(err);return false;}}
let cur=null;
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){const prev=cur;cur=e||null;try{return base.call(this,e,...a);}finally{cur=prev;}};}
if(typeof shadow==='function'){const base=shadow;shadow=function(x,y,radius,opt,...a){if(prefs.on&&cur&&!floating(cur,opt)){stats.skipped++;return;}if(cur)stats.kept++;return base.call(this,x,y,radius,opt,...a);};}
function set(p){if(typeof p?.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_MOB_GROUND_R206__=Object.freeze({revision:REV,set,floating,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
