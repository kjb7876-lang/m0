// R1246 — 공격·스킬 중에 맞아도 공격 모션을 끝까지 보인다(사용자 2026-11-15 10:09Z "스킬이나 공격할때 항상 공격모션 사용",
//  2026-11-19 22:58Z "전반적인 모션검수 특히 영웅").
//  헤드리스 무한생존 전수 수집(qa/r1246/collect.mjs, 영웅마다 20게임초): 기본공격 중 맞은 장면에서 서하·네온·미카엘라·라우렌·사수는 100%,
//  EGO 96% 가 피격 그림으로 바뀌었다(환도·슬레이어 0%, 헌터 0%). 휘두르던 6칸 시트가 맞을 때마다 피격 2칸으로 끊겨 공격이 튀어 보였다.
//  원인은 그림을 고르는 곳마다 '맞음'을 공격보다 먼저 본 것(R143 applyHit·엔진 heroPose·R1048 EGO 상태 고르기·R750 타격 칸 맞춤).
//  고친 방법: drawHero 를 맨 바깥에서 감싸, 공격·스킬·궁극기 중(대시·막기·쓰러짐 아님, 혼자 플레이)이면 그리는 동안만 hurtAnim 을 0 으로 보이고
//  끝나면(예외여도) 실제 값으로 되돌린다. 피해·무적·넉백·피격 깜빡임(invincible)·소리·쿨다운·세이브는 건드리지 않는다.
//  맞기만 할 때의 피격 그림, 대시·막기 그림은 그대로. 끄기: localStorage 'storyworld.r1246.atkOverHurt' = '0'.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_ATTACK_OVER_HURT_R1246__)return;
const REV='R1246-attack-over-hurt-1',KEY='storyworld.r1246.atkOverHurt';
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const stats={masked:0,wraps:0,skipped:{coop:0},errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
let on=G(()=>window.localStorage.getItem(KEY),null)!=='0';
const num=v=>{v=+v;return Number.isFinite(v)?v:0;};
const solo=()=>{const m=G(()=>window.__STORYWORLD_COOP_SIM_R62__.mode(),null);return !m||m==='off';};
function want(p){if(!on||!p||typeof p!=='object'||!(num(p.hp)>0)||!(num(p.hurtAnim)>0))return false;
 if(num(p.dashAnim)>0||p.guard)return false;
 if(!(num(p.attackAnim)>0||num(p.skillAnim)>0||num(p.ultimateAnim)>0))return false;
 if(!solo()){stats.skipped.coop++;return false;}return true;}
function install(){try{if(typeof drawHero!=='function'||drawHero.__r1246)return false;const base=drawHero;
  const w=function(...a){const p=G(()=>player,null);let saved=null;if(want(p)){saved=p.hurtAnim;p.hurtAnim=0;stats.masked++;}
   try{return base.apply(this,a);}finally{if(saved!==null&&p.hurtAnim===0)p.hurtAnim=saved;}};
  /* 다른 감싸기의 표식(__r1244 처럼 /^_*r\d+/)을 옮겨 단다 — 표식을 보고 다시 감싸는 모듈이 끝없이 겹치지 않게 */
  for(const k of Object.keys(base))if(/^_*r\d+/i.test(k))G(()=>{w[k]=base[k];});
  w.__r1246=true;drawHero=w;stats.wraps++;return true;}catch(e){fail(e);return false;}}
// 모든 스크립트가 drawHero 를 감싼 뒤(load) 맨 바깥에 선다. 그 뒤 표식 없이 새로 감싼 모듈이 있으면 다시 바깥으로(최대 20번).
if(G(()=>document.readyState==='complete',false))install();else G(()=>window.addEventListener('load',install));
G(()=>setInterval(()=>{if(stats.wraps<20)install();},1000));
window.__STORYWORLD_ATTACK_OVER_HURT_R1246__=Object.freeze({revision:REV,install,
 set:v=>{on=!!v;G(()=>window.localStorage.setItem(KEY,on?'1':'0'));return on;},
 inspect:()=>({revision:REV,on,masked:stats.masked,wraps:stats.wraps,skipped:{...stats.skipped},errors:stats.errors,lastError,gameplayChanged:false,presentationOnly:true})});
})();
