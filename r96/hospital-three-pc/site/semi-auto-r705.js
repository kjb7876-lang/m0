// R705 반자동은 공격만 — 사용자 2026-11-11 "반자동모드 적이 사거리안에있으면 공격만 자동으로 나가게 이동은 하지말고 이동은 플레이어가 직접하도록".
//  반자동(Space, 엔진 auto 켜짐) + 길잡이 꺼짐일 때: 사거리 안 적에게 기본 공격·W·E·R 은 저절로 나가지만 영웅은 스스로 걷지 않는다.
//  R115 ③ 의 장판 피하기·원거리 물러서기·근접 옆걸음(스스로 걷는 보조)은 길잡이(guide)가 켜져 있을 때만 남는다.
//  엔진의 auto·guide 값은 건드리지 않고, R115 가 holdStill() 을 물어 이동 보조만 건너뛴다. 피해·쿨타임·저장 형식은 그대로.
//  끄기: 설정 창 '반자동은 공격만' 체크 해제, localStorage 'storyworld.r705.semiHold'='0' 또는 __STORYWORLD_SEMI_AUTO_R705__.set(false).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SEMI_AUTO_R705__)return;
const REV='R705-semi-hold-1',KEY='storyworld.r705.semiHold';
let on=true;try{if(localStorage.getItem(KEY)==='0')on=false;}catch(_){}
const stats={errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const g=f=>{try{return f();}catch(_){return undefined;}};
const autoOn=()=>g(()=>typeof auto!=='undefined'&&auto===true)===true;
const guideOn=()=>g(()=>typeof guide!=='undefined'&&guide===true)===true;
const holdStill=()=>on&&autoOn()&&!guideOn();
function sync(){try{const el=document.getElementById('semiHoldR705Toggle');if(el)el.checked=on;}catch(_){}}
function set(v){on=v!==false;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}sync();return on;}
function settingsSection(){const panel=typeof document!=='undefined'&&document.getElementById('panel');if(!panel?.querySelector('#settingsClose')||document.getElementById('semiHoldR705'))return;
 const s=document.createElement('section');s.id='semiHoldR705';
 s.innerHTML='<h3>반자동은 공격만</h3><p class="small muted">반자동(Space)을 켜면 사거리 안의 적에게 공격과 기술만 저절로 나가고, 영웅은 스스로 걷지 않습니다. 이동은 직접 하세요. 끄면 예전처럼 장판을 피해 걷고 원거리는 물러섭니다(길잡이는 그대로 걸어 다닙니다).</p>'+
  '<label><input type="checkbox" id="semiHoldR705Toggle"> 반자동에서 스스로 걷지 않기</label>';
 panel.appendChild(s);const el=s.querySelector('#semiHoldR705Toggle');el.checked=on;el.onchange=()=>set(el.checked);}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{settingsSection();}catch(e){fail(e);}return r;};}
// Q(고유기): 엔진 반자동은 W·E·R 만 자동으로 쓰고 Q 는 안 쓴다 → 반자동(길잡이 아님)에서 0.35초 박자로 R49 autoSpecial 을 부른다(사거리·표적 규칙은 R49 가 판단, 쿨 중엔 안 나감).
//  길잡이는 엔진이 이미 Q 를 쓰고, A키 오토공격(R597)은 반자동 켜짐이면 쉬므로 겹치지 않는다. 협동 모드는 R62/R63 이 맡는다.
const BEAT=.35;let next=-1;stats.q=0;
const solo=()=>{const m=g(()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.());return !m||m==='off';};
function qBeat(){const p=g(()=>player);if(!p||!(p.hp>0)||!autoOn()||guideOn()||!solo())return;
 if(g(()=>!started||modal||loading||(typeof storyScene!=='undefined'&&storyScene)))return;if(g(()=>safeRegion()))return;
 if(!(p.specialCD<=0))return;const a=g(()=>window.__STORYWORLD_HANDO_FINAL_R49__);if(!a?.autoSpecial)return;
 const cd=p.specialCD;a.autoSpecial();if(p.specialCD>cd)stats.q++;}
if(typeof tick==='function'){const base=tick;tick=function(dt,...a){const before=g(()=>time),r=base.call(this,dt,...a);
 try{const now=g(()=>time);if(now>before&&now>=next){next=now+BEAT;qBeat();}}catch(e){fail(e);}return r;};}
window.__STORYWORLD_SEMI_AUTO_R705__=Object.freeze({revision:REV,enabled:()=>on,set,holdStill,
 state:()=>({on,auto:autoOn(),guide:guideOn(),holdStill:holdStill()}),stats:()=>({...stats,lastError})});
})();
