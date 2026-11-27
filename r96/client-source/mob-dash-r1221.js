// R1221 몹 공격 돌진 빈도 낮추기 — 사용자 2026-11-19 10:04Z "이제 이동모션 대부분 몹에 있는데 공격하면서 돌진하는거 없애던가 빈도수 낮춰줘".
//  돌진은 두 곳에서 나온다(모든 모드 공통).
//   ① 엔진 R52 근접 돌진(R54 가 스토리 지역 근접 몹·보스로 넓힘): 일반 몹 8.8초·보스 7.7초마다, 영웅 2.75~7.1칸이면 기 모은 뒤 최대 3.7/4.6칸 돌진 + 휘두르기.
//   ② R286 attack-only 몹 돌진(걷기 그림이 없던 시절 임시 연출): 2.2초마다 0.45초 기 모으기 → 최대 3.2칸 돌진.
//  바꾼 것(판정·피해·돌진 모양은 그대로, '언제 시작하나'만):
//   · 일반 몹 R52 돌진 = 몹마다 45초에 한 번까지(첫 돌진은 처음 본 뒤 22~45초) → 1/5 이하. 걸어서 다가와 제자리 근접 공격.
//   · 보스·중간보스·페르소나 R52 돌진 = 15.4초에 한 번까지(절반). 보스 고유 패턴(signature deck 의 돌진·환영 돌진·분신 돌진)은 손대지 않는다.
//   · R286 돌진 = 몹마다 45초에 한 번까지(첫 돌진은 처음 본 뒤 22~45초). 원래 2.2초 간격(실측 6마리 45초에 10번).
//   · 원거리 역할 몹(R1214b __STORYWORLD_DYS_RANGED_R1210__.roleFor(name)==='ranged')은 돌진하지 않는다(거리 유지 AI 를 깨지 않게).
//   · 보스 2칸 안 휘두르기(돌진 아님)는 막지 않는다.
//  방법: R52 는 얼린 객체를 한 번 더 감싼 사본으로 바꾼다(엔진 10480줄과 같은 방식) — 막을 차례면 그 한 번 동안만 e.rest 를 아주 작게 걸어
//   R52 의 시작 문을 닫고(엔진 근접 AI 는 그대로 걷고 때린다) 바로 원래 값으로 되돌린다. R286 은 e.r286.nextDash 를 뒤로 민다.
//  끄기: localStorage['storyworld.r1221.dash']='{"on":false}' (원래 빈도) · '{"ordinary":"off"}' (일반 몹 돌진 완전히 없애기)
//  점검: window.__STORYWORLD_MOB_DASH_R1221__.inspect()
// R1333(사용자 2026-11-26 "근접몹 처음에 돌진하는거 없애봐" → "모든몹돌진없애줘"): mob-nodash-r1333.js 가 막으라고 하면(기본, 보스 포함 모든 몹) R52·R286 돌진을 시작하지 않는다.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_DASH_R1221__)return;
const REV='R1221-mob-dash-4',KEY='storyworld.r1221.dash',ORD_GAP=45,BOSS_GAP=15.4,R286_GAP=45,NEAR=2.6,TINY=1e-6,MARK='__r1221';
let prefs={on:true,ordinary:'rare'};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')prefs={...prefs,...s};}catch(_){}
const stats={r52Seen:0,r52Blocked:0,r52Allowed:0,r286Pushed:0,r286Started:0,rangedSkipped:0,rewraps:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const now=()=>{try{const t=typeof time==='number'?time:0;return Number.isFinite(t)?t:0;}catch(_){return 0;}};
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.samongBoss||e.combatProfile?.major||/중간보스/.test(String(e.name||''))));
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
// 원거리 역할(이름) 또는 R1231 지금 단계 역할(effRole: 근접 몹이 물러나 쏘는 단계)이 ranged 면 돌진하지 않는다
function ranged(e){try{const R=window.__STORYWORLD_DYS_RANGED_R1210__;if(typeof R?.effRole==='function'&&R.effRole(e)==='ranged')return true;const f=R?.roleFor;return typeof f==='function'&&f(String(e?.name||''))==='ranged';}catch(_){return false;}}
// R1333: 몹 돌진 없애기 오버레이가 막는가
function noDash(e){try{const N=window.__STORYWORLD_MOB_NODASH_R1333__;return typeof N?.blocks==='function'&&N.blocks(e)===true;}catch(_){return false;}}
const S=new WeakMap();
function rec(e){let r=S.get(e);if(!r){const t=now();S.set(e,r={seen:t,last:null,first:t+ORD_GAP*(.5+.5*hash(e.id??e.name)),last286:t-R286_GAP*.5*hash((e.id??e.name)+'d')});}return r;}
// 지금 R52 돌진을 시작해도 되나
function allowR52(e){if(noDash(e))return false;if(!prefs.on)return true;if(ranged(e)){stats.rangedSkipped++;return false;}const r=rec(e),t=now();
 if(major(e))return r.last==null||t>=r.last+BOSS_GAP;
 if(prefs.ordinary==='off')return false;return r.last==null?t>=r.first:t>=r.last+ORD_GAP;}
function dist(e){try{return Math.hypot(player.x-e.x,player.y-e.y);}catch(_){return NaN;}}
function wrapR52(){const o=window.__STORYWORLD_HOSPITAL_CHARGE_R52__;if(!o||typeof o.tickEnemy!=='function'||o[MARK])return;const base=o.tickEnemy;
 const tickEnemy=function(e,dt){if(!e||e.attack||(!prefs.on&&!noDash(e)))return base.call(this,e,dt);
  let gate=false,had=false,old;try{const d=dist(e);if(!(d<NEAR)){stats.r52Seen++;if(!allowR52(e)){gate=true;had=Object.prototype.hasOwnProperty.call(e,'rest');old=e.rest;if(!(old>0))e.rest=TINY;}}}catch(err){fail(err);gate=false;}
  let res;try{res=base.call(this,e,dt);}finally{if(gate&&e.rest===TINY){if(had)e.rest=old;else delete e.rest;}}
  try{const a=e.attack;if(a&&a.r52Charge===true&&a.r1221!==true){a.r1221=true;rec(e).last=now();if(gate)stats.r52Blocked--;stats.r52Allowed++;}else if(gate)stats.r52Blocked++;}catch(err){fail(err);}
  return res;};
 const copy={...o,tickEnemy};Object.defineProperty(copy,MARK,{value:true});
 try{window.__STORYWORLD_HOSPITAL_CHARGE_R52__=Object.freeze(copy);stats.rewraps++;}catch(err){fail(err);}}
// R286: 돌진 시작을 보고 다음 차례를 뒤로 민다
// 끄면(검수 11-19): R1221 이 마지막으로 직접 쓴 값이 그대로 남은 몹만 원래 R286 차례(처음 본 값 또는 R286 기본 간격)로 되돌린다. 다른 쪽이 바꾼 값은 두지 않는다.
const SET=(e,s,r,v,base)=>{if(r.set286==null||s.nextDash!==r.set286)r.base286=base;s.nextDash=v;r.set286=v;};
function restore286(list,t){for(const e of list){const s=e?.r286,r=e&&S.get(e);if(!s||!r||r.set286==null)continue;if(s.nextDash===r.set286)s.nextDash=Math.min(r.set286,Math.max(t,r.base286??t));r.set286=null;r.base286=null;}}
function r286(){let list;try{list=room?.enemies;}catch(_){return;}if(!Array.isArray(list))return;const t=now();
 // R1333(Codex 검토): R1221 을 꺼도 R1333 이 막는 몹은 아래 길로 계속 막는다 — 막지 않는 몹만 원래 차례로 되돌린다
 if(!prefs.on)restore286(list.filter(e=>!noDash(e)),t);
 for(const e of list){if(!e||!(e.hp>0)||major(e))continue;if(!prefs.on&&!noDash(e))continue;const s=e.r286;
  if(!s){try{if(window.__STORYWORLD_MOB_MOTION_R286__?.kindOf?.(e)!=='attack-only')continue;}catch(_){continue;}
   const r=rec(e),rg0=ranged(e)||noDash(e);r.hold286=rg0;e.r286={mode:null,t0:0,nextDash:0,nextShot:t+1.5+hash((e.id??'')+'s')*6.6,side:hash(e.id)<.5?1:-1};
   SET(e,e.r286,r,rg0?t+1e6:t+R286_GAP*(.5+.5*hash(e.id??e.name)),t+hash(e.id)*2.2);r.p286=true;continue;}
  const r=rec(e);
  if(s.mode==='charge'||s.mode==='dash'){if(r.t0286!==s.t0){r.t0286=s.t0;r.last286=t;stats.r286Started++;}continue;}
  if(s.mode)continue;
  const rg=ranged(e)||noDash(e),want=rg?t+1e6:r.last286+R286_GAP;
  // 원거리 단계가 끝나면 걸어 둔 아주 먼 차례를 보통 간격으로 되돌린다
  if(!rg&&r.hold286){r.hold286=false;SET(e,s,r,Math.max(want,t),t);continue;}if(rg)r.hold286=true;
  if(!(s.nextDash>=want)){SET(e,s,r,want,s.nextDash);stats.r286Pushed++;}}}
function tickWrap(){if(typeof tick!=='function'||tick[MARK])return;const base=tick;
 const w=function(...a){try{wrapR52();r286();}catch(err){fail(err);}const res=base.apply(this,a);try{r286();}catch(err){fail(err);}return res;};
 Object.defineProperty(w,MARK,{value:true});try{tick=w;}catch(_){}try{window.tick=w;}catch(_){}}
wrapR52();tickWrap();
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_MOB_DASH_R1221__=Object.freeze({revision:REV,set,allowR52:e=>allowR52(e),
 constants:Object.freeze({ORD_GAP,BOSS_GAP,R286_GAP,NEAR}),inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
