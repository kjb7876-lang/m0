// R597 A키 오토공격 — 사용자 2026-11-10 "오토공격 설정 만들어서 a키만 누르면 모든스킬및 공격들 알아서 나가게-이게기본설정
//  (sd키제외) 이건 일반공격이랑 동일하게 적용해서 77프로 상향버프 받도록".
//  A(1·J 같음)를 누르고 있는 동안: 기본 공격은 엔진이 그대로 반복하고, 이 오버레이가 0.35초 박자마다 스킬 하나를 골라 쓴다.
//   순서: F EGO(공명 30 이상 + 보스나 몹 3마리 이상) → Q 고유기 → R·W·E 본편(엔진 반자동과 같은 표적·사거리 규칙) → T 실 춤.
//   · 쿨이 돌아온 것만, 적이 그 스킬 사거리 안에 있을 때만(R49 autoTarget). R(큰 스킬)은 사거리 안 2마리 이상이거나 보스·정예일 때만.
//   · E(본편 돌진)는 엔진 반자동처럼 적이 기본 사거리 0.7배 안이면 아낀다.
//   · S 블링크·D 공명방어는 절대 쓰지 않는다(사용자가 직접).
//  스킬은 새로 만들지 않고 기존 발동 함수(special·ego·__STORYWORLD_WER__.cast·R247 fire·R63 실 춤 autoCast)를 부른다 → 영웅별 연계(R561~R590 등)·사몽 배수(R571)가 그대로 탄다.
//  77%: 엔진 반자동(auto) 값을 건드리지 않으므로 R274 손플레이 보너스(반자동 끔 + 전투 중 모든 피해 +77%)를 기본 공격과 똑같이 받는다.
//  중복 없음: 반자동(Space) 켜짐이면 엔진이 이미 자동 시전 → 쉼. 길잡이 켜짐이면 엔진이 W·E·R 을 자동 → 여기선 Q·F·T 만. 협동 모드는 R62/R63 이 맡음.
//  설정 창 'A키 오토공격' 체크(기본 켜짐). 끄면 예전과 같다. localStorage 'storyworld.r597.autoA'='0' 또는 __STORYWORLD_AUTO_A_R597__.set(false).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_AUTO_A_R597__)return;
const REV='R597-auto-a-1',KEY='storyworld.r597.autoA',BEAT=.35,EGO_RANGE=8,EGO_CROWD=3,R_CROWD=2,E_NEAR=.7;
let on=true;try{if(localStorage.getItem(KEY)==='0')on=false;}catch(_){}
const stats={beats:0,q:0,w:0,e:0,r:0,f:0,t:0,idle:0,errors:0};let lastError=null,next=-1,lastCast='';
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const g=f=>{try{return f();}catch(_){return undefined;}};
const T=()=>g(()=>typeof time==='number'?time:0)||0;
const P=()=>g(()=>typeof player==='object'?player:null);
const held=()=>g(()=>typeof keys!=='undefined'&&keys&&keys.has('attack'))===true;
const semiAuto=()=>g(()=>typeof auto!=='undefined'&&auto===true)===true;
const guideOn=()=>g(()=>typeof guide!=='undefined'&&guide===true)===true;
const mobile=()=>g(()=>window.__STORYWORLD_MOBILE_R63__?.isMobile?.())===true;
const engineWER=()=>(mobile()?g(()=>settings.autoSkill===true)===true:semiAuto())||guideOn();
const solo=()=>{const m=g(()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.());return !m||m==='off';};
const R49=()=>window.__STORYWORLD_HANDO_FINAL_R49__;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const big=e=>!!(e&&(e.boss||e.elite||e.major));
function live(){const r=g(()=>room);return (r?.enemies||[]).filter(e=>e&&e.hp>0&&!e.deadRecorded&&(e.spawnState===undefined||e.spawnState==='active')&&e.visible!==false);}
function ready(){const p=P();if(!on||!p||!(p.hp>0)||!held())return false;
 if(g(()=>!started||modal||loading))return false;if(g(()=>safeRegion()))return false;if(!solo()||semiAuto())return false;return true;}
function tryEgo(p){if(!(p.resonance>=30)||p.egoCD>0||p.ego>0||p.samong>0||typeof ego!=='function')return false;
 const near=live().filter(e=>dist(e,p)<=EGO_RANGE);if(!near.some(big)&&near.length<EGO_CROWD)return false;
 const before=p.ego;ego();return p.ego>before;}
function tryQ(p){if(p.specialCD>0)return false;const a=R49();if(!a?.autoSpecial)return false;const cd=p.specialCD;a.autoSpecial();return p.specialCD>cd;}
function crowdFor(slot,p){const a=R49(),range=g(()=>a.rangeFor(slot));if(!(range>0))return 0;return live().filter(e=>g(()=>a.eligible(e,range))).length;}
function trySlot(slot,p){const a=R49(),t=g(()=>a?.autoTarget(slot));if(!t)return false;
 if(slot==='e'){const base=g(()=>HEROES[p.hero].range)||0;if(dist(t,p)<base*E_NEAR)return false;}
 if(slot==='r'&&!big(t)&&crowdFor('r',p)<R_CROWD)return false;
 if(g(()=>window.__STORYWORLD_WER__?.cast(slot,true))===true)return true;
 const M=window.__STORYWORLD_MICHAELA_R247__;if((slot==='w'||slot==='e')&&p.hero==='michaela'&&g(()=>M?.on?.()))return g(()=>M.fire(slot,true))===true;
 return false;}
function tryThread(p){const c=window.__STORYWORLD_CAMPAIGN_R63R1__;if(!c?.autoCast)return false;
 if(!live().some(e=>dist(e,p)<=12))return false;return g(()=>c.autoCast())===true;}
function beat(){const p=P();stats.beats++;
 if(tryEgo(p)){stats.f++;lastCast='f';return;}
 if(tryQ(p)){stats.q++;lastCast='q';return;}
 if(!engineWER())for(const s of ['r','w','e'])if(trySlot(s,p)){stats[s]++;lastCast=s;return;}
 if(tryThread(p)){stats.t++;lastCast='t';return;}
 stats.idle++;}
if(typeof tick==='function'){const base=tick;tick=function(dt,...a){const before=T(),r=base.call(this,dt,...a);
 try{const now=T();if(now>before&&ready()&&now>=next){next=now+BEAT;beat();}}catch(e){fail(e);}return r;};}
function set(v){on=v!==false;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}next=-1;sync();return on;}
function sync(){try{const el=document.getElementById('autoAR597Toggle');if(el)el.checked=on;}catch(_){}}
function settingsSection(){const panel=typeof document!=='undefined'&&document.getElementById('panel');if(!panel?.querySelector('#settingsClose')||document.getElementById('autoAR597'))return;
 const s=document.createElement('section');s.id='autoAR597';
 s.innerHTML='<h3>A키 오토공격</h3><p class="small muted">A 를 누르고 있으면 기본 공격과 함께 Q·W·E·R·F(EGO)·T 가 쿨이 돌아오고 적이 사거리 안일 때 저절로 나갑니다. S(블링크)·D(공명방어)는 직접 누르세요. 반자동이 아니라서 손플레이 +77% 피해를 그대로 받습니다.</p>'+
  '<label><input type="checkbox" id="autoAR597Toggle"> A키 오토공격 켜기</label>';
 panel.appendChild(s);const el=s.querySelector('#autoAR597Toggle');el.checked=on;el.onchange=()=>set(el.checked);}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{settingsSection();}catch(e){fail(e);}return r;};}
window.__STORYWORLD_AUTO_A_R597__=Object.freeze({revision:REV,enabled:()=>on,set,
 state:()=>({on,held:held(),ready:ready(),semiAuto:semiAuto(),guide:guideOn(),engineWER:engineWER(),next,lastCast}),
 stats:()=>({...stats,lastError})});
})();
