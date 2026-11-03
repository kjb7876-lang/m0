// R274 손플레이 보상 — 사용자 2026-11-03 "자동모드끄고 실플레이시 많은이점을 얻도록".
// 반자동(SPACE, 엔진 auto)·길잡이(엔진 guide)를 끄고 직접 싸우면 아래 이점을 준다. 우리 쪽 숫자는 7/77/777.
//  1) 반자동 끔 + 전투 중 → 모든 피해 +77%
//  2) 길잡이 끔 + 전투 중 → 추가 피해 +77% (1과 더하기: 둘 다 끄면 +154% = 피해 ×2.54)
//  3) 둘 다 끔 + EGO 발동(player.ego 가 새로 켜짐)마다 → 모든 능력치 +77%, 7초, 중첩(겹마다 따로 7초, 최대 7겹)
//  4) 둘 다 끔 + 전투 중 회피 성공(블링크 무적 중 적 공격이 hurt 로 들어와 '회피' 로 막힘)마다 → 모든 능력치 +7%, 7초, 중첩(최대 7겹, 0.26초에 1번)
//  5) 둘 다 끔 + 전투 중 공명방어(hurt 결과 'parried', 'PARRY · 공명') → 7초 동안 공명 획득 +77%(새 패리마다 7초 갱신)
// '모든 능력치' 배수 S = (1+.77×EGO겹) × (1+.07×회피겹) 이 피해·쿨다운 회복·이동속도·받는 피해에 걸린다.
//  · 피해: 1·2 배수 × S (상한 없음, 겹 상한이 사실상 상한).  · 쿨다운 회복(attackCD·blinkCD·specialCD): ×S, 상한 ×2.5.
//  · 이동속도: 손으로 걸을 때(경로 따라가기 아닐 때)만 ×S, 상한 ×1.35(벽 판정 0.17 칸 쪼개기는 엔진 그대로).
//  · 받는 피해: ÷S, 최소 0.5배(감소 상한 50%).
// '전투 중' = room.engaged 이거나, 살아 있는 적이 영웅 9칸 안에 있음.
// 끄기: localStorage['storyworld.r274.manual']='0' (또는 __STORYWORLD_MANUAL_R274__.set(false)). 777 치트에서도 그대로 적용.
(()=>{'use strict';
if(window.__STORYWORLD_MANUAL_R274__)return;
const REV='R274-manual-1',KEY='storyworld.r274.manual',DMG=.77,EGO=.77,DODGE=.07,PARRY=.77,DUR=7,MAXST=7,RANGE=9,CD_CAP=2.5,MOVE_CAP=1.35,DR_FLOOR=.5;
let on=true;try{if(localStorage.getItem(KEY)==='0')on=false;}catch(_){}
const stats={hits:0,egoStacks:0,dodgeStacks:0,parries:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const G={player:()=>typeof player==='object'?player:null,auto:()=>typeof auto!=='undefined'?!!auto:true,guide:()=>typeof guide!=='undefined'?!!guide:true,
 room:()=>typeof room!=='undefined'?room:null,time:()=>typeof time==='number'?time:0,route:()=>typeof route!=='undefined'&&Array.isArray(route)?route:[]};
const g=n=>{try{return G[n]();}catch(_){return undefined;}};
const st={ego:[],dodge:[],parryUntil:-1,lastDodge:-9,prevEgo:0,prevEgoStack:0};
const now=()=>g('time')||0;
function prune(){const t=now();st.ego=st.ego.filter(u=>u>t);st.dodge=st.dodge.filter(u=>u>t);}
function inCombat(){const p=g('player'),r=g('room');if(!p||!r)return false;if(r.engaged)return true;
 for(const e of r.enemies||[])if(e&&e.hp>0&&(!e.boss||r.engaged)&&Math.hypot(e.x-p.x,e.y-p.y)<=RANGE)return true;return false;}
const autoOff=()=>g('auto')===false,guideOff=()=>g('guide')===false,manual=()=>on&&autoOff()&&guideOff();
function statMult(){if(!on)return 1;prune();return(1+EGO*st.ego.length)*(1+DODGE*st.dodge.length);}
function damageMult(){if(!on)return 1;const c=inCombat();return(1+(c&&autoOff()?DMG:0)+(c&&guideOff()?DMG:0))*statMult();}
const parryActive=()=>on&&st.parryUntil>now();
function push(list){list.push(now()+DUR);list.sort((a,b)=>b-a);if(list.length>MAXST)list.length=MAXST;}
// 피해: 모든 영웅·스킬이 지나가는 hitEnemy 바깥에서 곱한다.
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,...a){try{if(on&&Number.isFinite(value)&&value>0&&e&&e.hp>0){const k=damageMult();if(k!==1){value*=k;stats.hits++;}}}catch(err){fail(err);}return base.call(this,e,value,...a);};}
// 받는 피해 감소 + 회피·공명방어 감지.
if(typeof hurt==='function'){const base=hurt;hurt=function(damage,...a){let d=damage;try{if(on&&Number.isFinite(d)&&d>0){const s=statMult();if(s>1)d*=Math.max(DR_FLOOR,1/s);}}catch(err){fail(err);}
 const r=base.call(this,d,...a);
 try{const p=g('player');if(on&&manual()&&inCombat()&&p){const t=now();
  if(r==='invulnerable'&&String(p.invReason||'').includes('회피')&&t-st.lastDodge>=.26){st.lastDodge=t;push(st.dodge);stats.dodgeStacks++;}
  else if(r==='parried'){st.parryUntil=t+DUR;stats.parries++;}}}catch(err){fail(err);}
 return r;};}
// 공명 획득 가속.
if(typeof gainResonance==='function'){const base=gainResonance;gainResonance=function(v,...a){try{if(parryActive()&&manual()&&Number.isFinite(v)&&v>0)v*=1+PARRY;}catch(err){fail(err);}return base.call(this,v,...a);};}
// 이동속도: 손으로 걸을 때만.
if(typeof moveActor==='function'){const base=moveActor;moveActor=function(actor,dx,dy,...a){try{const p=g('player');if(on&&actor&&actor===p&&inTick&&!g('route').length){const k=Math.min(MOVE_CAP,statMult());if(k>1){dx*=k;dy*=k;}}}catch(err){fail(err);}return base.call(this,actor,dx,dy,...a);};}
// EGO 발동 감지 + 쿨다운 회복 가속.
let inTick=false;
if(typeof tick==='function'){const base=tick;tick=function(dt,...a){inTick=true;let r;try{r=base.call(this,dt,...a);}finally{inTick=false;}
 try{const p=g('player');if(p&&on){const e=Number(p.ego)||0,es=Number(p.egoStackR169)||0;
  if(manual()&&e>0&&(st.prevEgo<=0||e>st.prevEgo+.5||es>st.prevEgoStack)){push(st.ego);stats.egoStacks++;}
  st.prevEgo=e;st.prevEgoStack=es;
  const k=Math.min(CD_CAP,statMult());if(k>1&&Number.isFinite(dt)&&dt>0)for(const key of ['attackCD','blinkCD','specialCD'])if(p[key]>0)p[key]=Math.max(0,p[key]-dt*(k-1));}
  hud();}catch(err){fail(err);}return r;};}
// HUD 칩.
let el=null,lastText='';
function hud(){if(typeof document==='undefined')return;const lines=[];if(on){prune();const c=inCombat(),d=Math.round(((1+(c&&autoOff()?DMG:0)+(c&&guideOff()?DMG:0))-1)*100);
 if(d>0)lines.push('손전투 피해 +'+d+'%');if(st.ego.length)lines.push('EGO 전능 +77% ×'+st.ego.length);if(st.dodge.length)lines.push('회피 전능 +7% ×'+st.dodge.length);if(parryActive())lines.push('공명 가속 +77% '+Math.ceil(st.parryUntil-now())+'초');}
 const text=lines.join(' · ');if(text===lastText)return;lastText=text;
 if(!el){el=document.createElement('div');el.id='manualBonusR274';el.setAttribute('aria-live','polite');el.style.cssText='position:fixed;left:50%;top:58px;transform:translateX(-50%);z-index:30;pointer-events:none;padding:3px 10px;border:1px solid #b8955a;border-radius:4px;background:linear-gradient(#2b2117e6,#1a140ee6);color:#f0dbb3;font:600 12px/1.4 serif;letter-spacing:.02em;box-shadow:0 1px 4px #0008;white-space:nowrap;max-width:calc(100vw - 32px);overflow:hidden;text-overflow:ellipsis';document.body&&document.body.appendChild(el);}
 el.textContent=text;el.style.display=text?'block':'none';}
function set(v){on=!!v;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}if(!on){st.ego=[];st.dodge=[];st.parryUntil=-1;}hud();return on;}
window.__STORYWORLD_MANUAL_R274__=Object.freeze({revision:REV,set,enabled:()=>on,inCombat,damageMult,statMult,parryActive,
 state:()=>({on,manual:manual(),autoOff:autoOff(),guideOff:guideOff(),inCombat:inCombat(),ego:st.ego.length,dodge:st.dodge.length,parry:parryActive(),damageMult:damageMult(),statMult:statMult()}),
 stats:()=>({...stats,lastError}),constants:{DMG,EGO,DODGE,PARRY,DUR,MAXST,RANGE,CD_CAP,MOVE_CAP,DR_FLOOR}});
})();
