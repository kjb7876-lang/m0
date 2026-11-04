// R286 모바일 기본 전능 +77% — 사용자 2026-11-04 "모바일에서는 기본적으로 플레이어 모든스펙77프로 상향".
//  모바일 = 엔진 R63 isMobile()(matchMedia '(pointer:coarse)')과 같은 판정. PC(마우스)에서는 아무것도 바뀌지 않는다.
//  R274 손플레이 보상과 같은 걸이(hitEnemy·hurt·gainResonance·moveActor·tick)를 바깥에서 한 겹 더 감싸 곱으로 쌓는다. 상한은 R274 와 같이 '둘을 합친 값'에 건다.
//   · 주는 피해 ×1.77 (R274 배수와 곱).
//   · 쿨다운 회복(attackCD·blinkCD·specialCD) ×1.77 = 공격·스킬 속도. R274 와 합쳐 ×2.5 를 넘지 않는다.
//   · 이동속도 ×1.77 이지만 R274 와 합쳐 ×1.35 상한(벽 판정 0.17 칸 쪼개기는 엔진 그대로).
//   · 받는 피해 ÷1.77(= ×0.565). R274 감소와 합쳐 최소 0.5배(감소 상한 50%).
//   · 공명 획득 +77%.
//   · 체력: 최대 체력 777 규칙(R71)은 그대로 둔다. 대신 받는 회복량 +77%(한 틱에 체력이 오른 만큼의 77%를 더, 최대 체력까지). 부활(0 → 회복)은 늘리지 않는다.
//  HUD: R288 손전투 표시처럼 전투를 가리지 않게 아래 HUD 막대 맨 윗줄 오른쪽 빈칸에 테두리 없는 10px 반투명 글씨 '모바일 +77%'(footer 가 안 보이는 모바일에서는 오른쪽 위 단추 줄 아래).
//  끄기: localStorage['storyworld.r286.mobile']='0' (또는 __STORYWORLD_MOBILE_BONUS_R286__.set(false)). 'force' 로 두면 PC 에서도 켠다(시험용).
(()=>{'use strict';
if(window.__STORYWORLD_MOBILE_BONUS_R286__)return;
const REV='R286-mobile-1',KEY='storyworld.r286.mobile',K=1.77,CD_CAP=2.5,MOVE_CAP=1.35,DR_FLOOR=.5,HEAL=.77;
let pref='1';try{const s=localStorage.getItem(KEY);if(s==='0'||s==='force')pref=s;}catch(_){}
const stats={hits:0,hurts:0,heals:0,healAdded:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
function mobile(){try{const M=window.__STORYWORLD_MOBILE_R63__;if(M&&typeof M.isMobile==='function')return !!M.isMobile();}catch(_){}
 try{return typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;}catch(_){return false;}}
const on=()=>pref==='force'||(pref!=='0'&&mobile());
const P=()=>typeof player==='object'&&player?player:null;
// R274 쪽 배수(그 상한까지 적용된 값) — 합친 상한을 맞추려고 읽는다.
const R=()=>window.__STORYWORLD_MANUAL_R274__;
const r274Stat=()=>{try{const m=R();return m&&m.enabled()?Math.max(1,Number(m.statMult())||1):1;}catch(_){return 1;}};
// 순수 계산(QA 에서도 쓴다)
const cdMult=(r=1)=>{r=Math.max(1,Math.min(CD_CAP,r));return 1+Math.max(0,Math.min(r*K,CD_CAP)-r);}; // R274 는 회복을 dt×(r-1) 더하는 식 → 합친 회복이 min(r×1.77, 2.5) 가 되도록 이번 겹이 더할 몫
const moveMult=(r=1)=>Math.max(1,Math.min(K,MOVE_CAP/Math.min(MOVE_CAP,r)));    // 이번 겹이 더하는 이동 배수
const hurtMult=(r=1)=>{const prev=r>1?Math.max(DR_FLOOR,1/r):1;return Math.min(1,Math.max(DR_FLOOR/prev,1/K));};
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,...a){try{if(on()&&Number.isFinite(value)&&value>0&&e&&e.hp>0){value*=K;stats.hits++;}}catch(err){fail(err);}return base.call(this,e,value,...a);};}
if(typeof hurt==='function'){const base=hurt;hurt=function(damage,...a){let d=damage;try{if(on()&&Number.isFinite(d)&&d>0){d*=hurtMult(r274Stat());stats.hurts++;}}catch(err){fail(err);}return base.call(this,d,...a);};}
if(typeof gainResonance==='function'){const base=gainResonance;gainResonance=function(v,...a){try{if(on()&&Number.isFinite(v)&&v>0)v*=K;}catch(err){fail(err);}return base.call(this,v,...a);};}
let inTick=false;
if(typeof moveActor==='function'){const base=moveActor;moveActor=function(actor,dx,dy,...a){try{const p=P();if(inTick&&p&&actor===p&&on()){const k=moveMult(Math.min(MOVE_CAP,r274Stat()));if(k>1){dx*=k;dy*=k;}}}catch(err){fail(err);}return base.call(this,actor,dx,dy,...a);};}
const maxHp=()=>{try{return typeof maxHP==='function'?Number(maxHP()):NaN;}catch(_){return NaN;}};
if(typeof tick==='function'){const base=tick;tick=function(dt,...a){const p0=P(),hp0=p0?Number(p0.hp):NaN;inTick=true;let r;try{r=base.call(this,dt,...a);}finally{inTick=false;}
 try{const p=P();if(p&&on()){
  // 받는 회복 +77%(최대 체력까지). 부활·지역 이동 같은 0 → 회복은 늘리지 않는다.
  const hp=Number(p.hp),mx=maxHp();if(p===p0&&Number.isFinite(hp0)&&hp0>0&&Number.isFinite(hp)&&hp>hp0&&Number.isFinite(mx)&&hp<mx){const add=Math.min(mx-hp,(hp-hp0)*HEAL);if(add>0){p.hp=hp+add;stats.heals++;stats.healAdded+=add;}}
  const k=cdMult(Math.min(CD_CAP,r274Stat()));if(k>1&&Number.isFinite(dt)&&dt>0)for(const key of ['attackCD','blinkCD','specialCD'])if(p[key]>0)p[key]=Math.max(0,p[key]-dt*(k-1));}
  hud();}catch(err){fail(err);}return r;};}
let el=null,lastText=null,placedAt=-1e9;
const shown=n=>{try{return !!(n&&n.getClientRects().length&&n.getBoundingClientRect().height>0);}catch(_){return false;}};
// R288 손전투 표시처럼 아래 HUD 막대(footer) 오른쪽 빈칸에 아주 작게. 모바일처럼 footer 가 안 보이면 오른쪽 위 단추 줄 아래 빈칸(1초마다 다시 본다).
function place(){const f=document.querySelector('footer'),useF=shown(f),want=useF?f:document.body;if(el.parentElement===want)return;
 if(useF){try{if(getComputedStyle(f).position==='static')f.style.position='relative';}catch(_){}el.style.position='absolute';el.style.top='2px';el.style.right='8px';el.style.zIndex='3';}
 else{el.style.position='fixed';el.style.top='92px';el.style.right='12px';el.style.zIndex='30';}want.appendChild(el);}
function hud(){if(typeof document==='undefined'||!document.body)return;let live=false;try{live=typeof started!=='undefined'&&!!started;}catch(_){}
 const text=on()&&live?'모바일 +77%':'',t=performance.now();
 if(!el){el=document.createElement('div');el.id='mobileBonusR286';el.setAttribute('aria-live','polite');el.title='모바일 전능 +77%';
  el.style.cssText='pointer-events:none;padding:0 4px;background:none;border:0;color:#e9d3a6;opacity:.62;font:500 10px/1.25 serif;letter-spacing:.02em;text-shadow:0 1px 2px #000;white-space:nowrap';}
 if(text&&(t-placedAt>1000||!el.isConnected)){placedAt=t;place();}
 if(text===lastText)return;lastText=text;el.textContent=text;el.style.display=text?'block':'none';}
function set(v){pref=v==='force'?'force':v?'1':'0';try{localStorage.setItem(KEY,pref);}catch(_){}lastText=null;try{hud();}catch(_){}return on();}
window.__STORYWORLD_MOBILE_BONUS_R286__=Object.freeze({revision:REV,set,enabled:on,mobile,cdMult,moveMult,hurtMult,
 state:()=>({on:on(),mobile:mobile(),pref,r274Stat:r274Stat(),damage:on()?K:1,cooldown:on()?cdMult(Math.min(CD_CAP,r274Stat())):1,move:on()?moveMult(Math.min(MOVE_CAP,r274Stat())):1,hurt:on()?hurtMult(r274Stat()):1}),
 stats:()=>({...stats,lastError}),constants:{K,CD_CAP,MOVE_CAP,DR_FLOOR,HEAL}});
})();
