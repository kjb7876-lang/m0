// R663 — 스킬 성장·QWER 잠금(사용자 2026-11-10 "맨처음시작은 asdf만 기본이고 qwer은 스킬찍어야 사용가능하게 성장재미를 더 느끼도록
//  스킬성장하면 스킬범위도 늘어나야함", "기본실검무 및 문양실검무도 자동으로 스킬레벨업하게").
//  모든 영웅 공통. 새 키는 만들지 않는다(Q·W·E·R 그대로, 예전 배치면 Q·Z·X·C).
//  ① 잠금: 새 게임에서는 A·S·D·F 만 쓰고 Q(고유기)·W·E·R(본편 스킬)은 패시브 포인트로 배워야 쓴다. 배우기 = 1점(1단계).
//     이후 2~7단계 비용 = 다음 단계². 강화 칸은 R62 패시브(skillQR663 …)로 넣어 저장·P 창·구매 규칙을 그대로 쓴다.
//     이미 진행한 저장(레벨 2 이상 또는 지역 완료 기록)은 QWER 1단계로 이어받는다. 처음 본 새 게임인지는 R62 저장의 점 드롭 표식
//     ('r64:skillgrowth-r663')에 남겨 다음 불러오기에도 안 바뀐다. 혼자 플레이에서만 적용(함께하기는 건드리지 않음).
//  ② 막는 길: 키(capture, 다른 처리기보다 먼저 받아 막음) · 단추(pointerdown) · special() · __STORYWORLD_WER__.cast(A키 오토·확률 발동 포함) ·
//     W·E·R 칸은 먼 재사용 대기(R209 와 같은 방식)로 엔진 안쪽 cast 도 못 쓰게 한다. HUD 단추는 어둡게 + 🔒.
//  ③ 범위: 단계마다 +8%(1단계 ×1 → 7단계 ×1.48). R571(사몽 +77%)과 같은 방식 — 스킬 코드가 도는 동안만 Math.hypot 를 1/배수로 읽게 해
//     반경·사거리 비교가 배수만큼 커진다. 피해·이동·벽 판정(hitEnemy·moveActor·clearLine·blocked·findPath·killEnemy 안)은 실제 거리.
//     같은 맥락의 아군 투사체는 수명·반지름, 이펙트는 size 가 배수. W·E·R 의 지연 효과는 시전 신호(fx storySourceSkill warning)로 칸을 기억해 같은 시전의 지연 작업에 그 칸 배수를 건다.
//     사몽(R571)과 겹치면 두 배수가 곱해진다.
//  ④ 사용자 2026-11-11 "스킬포인트 얻으면 자연스럽게 배워지게 · 배워지면 스킬 아이콘이 추가되게 · QWER 순서대로 포인트가 더 들고 대신 더 강하고 범위가 넓고 쿨타임이 길게":
//     배우기 비용 Q 1 · W 2 · E 3 · R 4점(2~7단계는 (다음 단계)²점). 슬롯 기본 배수 — 범위 Q×1 W×1.1 E×1.2 R×1.3 · 피해 Q×1 W×1.15 E×1.3 R×1.5 · 재사용 Q×1 W×1.15 E×1.3 R×1.5
//     (피해·재사용은 본편 W·E·R(storyWER) 기준. 미카엘라·기억사수 전용 W·E 는 범위·피해·재사용 배수를 안 탐).
//     자동 스킬레벨업(R237)이 Q→W→E→R 순서로 다음 칸 비용만큼 점수가 모이면 저절로 배운다(그 전엔 다른 구매를 하지 않고 모음).
//     안 배운 칸은 아이콘(단추)을 숨기고, 배우는 순간 아이콘이 튀어나오는 짧은 연출 + 알림.
//     점수가 있는데 잠긴 칸이 있고 자동 레벨업을 꺼 둔 경우에만 30초에 한 번 P 창 안내 글.
//  새 영웅·키·저장 필드·자산 없음. 끄기: localStorage 'storyworld.r663.skillgrowth' {"on":false}.
//  미카엘라 W·E(R247)·기억사수 W·E(R561)는 자기 안쪽 fire 에서 scale() 을 물어 잠금·범위·피해·재사용 배수를 직접 적용한다(R663c).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SKILL_GROWTH_R663__)return;
const REV='R663-skill-growth-1',KEY='storyworld.r663.skillgrowth',MARK='r64:skillgrowth-r663';
const SLOTS=['q','w','e','r'],MAXR=7,STEP=.08,FAR=1e6;
const LEARN={q:1,w:2,e:3,r:4},RANGE={q:1,w:1.1,e:1.2,r:1.3},POWER={q:1,w:1.15,e:1.3,r:1.5},COOL={q:1,w:1.15,e:1.3,r:1.5};
const ID=s=>'skill'+s.toUpperCase()+'R663',ICON={q:'haste',w:'resonance',e:'ego',r:'dream'};
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={powered:0,stretched:0,learned:0,locked:0,blockedKeys:0,blockedCasts:0,scoped:0,migrated:0,fresh:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const P62=()=>window.__STORYWORLD_PROGRESSION_R62__,G=()=>typeof player==='object'&&player?player:null;
const now=()=>typeof time==='number'&&Number.isFinite(time)?time:0;
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const legacy=()=>{try{return !!(typeof KR291!=='undefined'&&KR291&&KR291.legacy);}catch(_){return false;}};
const KR=s=>{try{const k=typeof KR291!=='undefined'&&KR291;return s==='q'?'Q':(k&&k[s]||s.toUpperCase());}catch(_){return s.toUpperCase();}};
const lvl=r=>Math.max(0,Math.min(MAXR,Math.floor(Number(r)||0)));
const mult=(s,r)=>(RANGE[s]||1)*(lvl(r)<=1?1:1+STEP*(lvl(r)-1));
const cost=(s,r)=>{r=Math.max(0,Math.floor(Number(r)||0));return r<1?(LEARN[s]||1):(r+1)*(r+1);};

// ---- R62 패시브 칸 ------------------------------------------------------------------------------------
const heroName=(s,h)=>{try{if(s==='q')return (typeof HEROES!=='undefined'&&HEROES?.[h]?.special)||'고유기';return window.__STORYWORLD_WER__?.defs?.[h]?.[s]?.[0]||(KR(s)+' 스킬');}catch(_){return KR(s)+' 스킬';}};
const rk=(s,p=G())=>{try{return Math.max(0,Number(P62()?.ranks?.(ID(s),p))||0);}catch(_){return 0;}};
function addDefs(){const A=P62();if(!A||!Array.isArray(A.defs))return false;
 for(const s of SLOTS){const id=ID(s);if(A.defs.some(d=>d.id===id))continue;
  A.defs.push({id,icon:ICON[s],maxRank:MAXR,
   get name(){const h=G()?.hero;return KR(s)+' · '+heroName(s,h);},
   get cost(){const p=G();return cost(s,p?rk(s,p):0);},
   get text(){const p=G(),r=p?rk(s,p):0,tr=s==='q'?'':' · 피해 ×'+POWER[s]+' · 재사용 ×'+COOL[s];return (r<1?'아직 배우지 못해 쓸 수 없습니다. '+LEARN[s]+'점으로 배웁니다(자동 스킬레벨업이 Q→W→E→R 순서로 저절로 배움).':'범위 ×'+mult(s,r).toFixed(2)+(r<MAXR?' → ×'+mult(s,r+1).toFixed(2):' (최대)')+'.')+tr+' · 단계마다 사거리·범위 +'+Math.round(STEP*100)+'% · 최대 '+MAXR+'단계 · 2~7단계 비용 = 다음 단계².';}});}
 return true;}
// ---- 새 게임 / 이어받은 저장 -----------------------------------------------------------------------------
function settle(p){const A=P62();if(!A?.state||!p)return;const st=A.state(p);if(!st||!st.pointDropClaimsR64||!st.ranks)return;if(st.pointDropClaimsR64[MARK]===true)return;
 st.pointDropClaimsR64[MARK]=true;
 const old=(Number(p.level)||1)>1||Object.keys(st.clears||{}).length>0;
 if(old){for(const s of SLOTS)if(!(Number(st.ranks[ID(s)])>0))st.ranks[ID(s)]=1;stats.migrated++;}else stats.fresh++;}
function locked(s,p=G()){try{if(!prefs.on||!p||!solo()||!P62())return false;if(typeof started!=='undefined'&&started===false)return false;settle(p);return rk(s,p)<1;}catch(e){fail(e);return false;}}
const slotOf=(ev)=>{const k=String(ev.key??'');let c=null;if(k.length===1&&/[A-Za-z0-9]/.test(k))c=k.toLowerCase();else{const m=/^Key([A-Z])$/.exec(String(ev.code||''))||/^Digit([0-9])$/.exec(String(ev.code||''));if(m)c=m[1].toLowerCase();}
 if(!c)return null;const t=legacy()?{q:'q','4':'q',z:'w','6':'w',x:'e','7':'e',c:'r','8':'r'}:{q:'q','4':'q',w:'w','6':'w',e:'e','7':'e',r:'r','8':'r'};return t[c]||null;};
// ---- 안내(너무 자주 뜨지 않게) ---------------------------------------------------------------------------
let lastHint=-9;
function hint(s){const t=Date.now();if(t-lastHint<1800)return;lastHint=t;try{if(typeof toast==='function')toast(KR(s)+' 스킬은 아직 배우지 못했습니다 · P 창에서 패시브 포인트 '+LEARN[s]+'점으로 배웁니다',2.4);}catch(_){}}
// ---- 키·단추: 다른 처리기보다 먼저(capture) 받아 막는다 -----------------------------------------------------------
const editing=t=>{try{return !!t&&(['INPUT','TEXTAREA','SELECT'].includes(t.tagName)||t.isContentEditable===true||!!t.closest?.('[contenteditable]:not([contenteditable="false"])'));}catch(_){return false;}};
function onKey(ev){try{if(ev.ctrlKey||ev.metaKey||ev.altKey||editing(ev.target))return;const s=slotOf(ev);if(!s||!locked(s))return;
 ev.preventDefault();ev.stopImmediatePropagation();stats.blockedKeys++;if(!ev.repeat)hint(s);}catch(e){fail(e);}}
const BTN={specialBtn:'q','story-wer-w':'w','story-wer-e':'e','story-wer-r':'r'};
function onBtn(ev){try{const b=ev.target?.closest?.('#specialBtn,#story-wer-w,#story-wer-e,#story-wer-r');if(!b)return;const s=BTN[b.id];if(!s||!locked(s))return;
 ev.preventDefault();ev.stopImmediatePropagation();stats.blockedKeys++;hint(s);}catch(e){fail(e);}}
if(typeof window.addEventListener==='function'){window.addEventListener('keydown',onKey,true);for(const t of ['pointerdown','mousedown','touchstart','click'])window.addEventListener(t,onBtn,true);}

// ---- 범위 맥락(R571 과 같은 방식) -------------------------------------------------------------------------
let depth=0,susp=0,scale=1;
const inScope=()=>depth>0&&susp===0&&scale!==1;
function scoped(sc,fn,self,args){const prev=scale;scale=sc;depth++;stats.scoped++;try{return fn.apply(self,args||[]);}finally{depth--;scale=prev;if(depth===0)scale=1;}}
const H=Math.hypot;
try{Object.defineProperty(Math,'hypot',{configurable:true,writable:true,enumerable:false,value:function hypot(a,b){const v=arguments.length===2?H(a,b):H.apply(Math,arguments);return depth>0&&susp===0&&scale!==1?v/scale:v;}});}catch(e){fail(e);}
const wrapG=(name,make)=>{try{const b=globalThis[name];if(typeof b!=='function'||b.__r663)return false;const f=make(b);f.__r663=true;globalThis[name]=f;return true;}catch(e){fail(e);return false;}};
const casts=new Map();// 시전 번호 → 칸(W·E·R 지연 작업용)
function install(){
 wrapG('special',b=>function(...a){if(locked('q')){stats.blockedCasts++;return undefined;}const m=mult('q',rk('q'));return m===1?b.apply(this,a):scoped(m,b,this,a);});
 for(const name of ['moveActor','clearLine','blocked','findPath','killEnemy'])wrapG(name,b=>function(...a){susp++;try{return b.apply(this,a);}finally{susp--;}});
 // 피해: 본편 W·E·R 의 슬롯 배수(뒤 칸일수록 강함). 시전 신호는 source.storyWER·sourceSlot·sourceHero 로 안다
 wrapG('hitEnemy',b=>function(e,value,source,...r){susp++;try{try{if(source&&source.storyWER&&Number.isFinite(value)&&prefs.on&&solo()){const f=POWER[String(source.sourceSlot||'').toLowerCase()];if(f&&f!==1&&(!G()||source.sourceHero===G().hero)){value*=f;stats.powered++;}}}catch(x){fail(x);}return b.call(this,e,value,source,...r);}finally{susp--;}});
 wrapG('fx',b=>function(type,x,y,opt,...rest){
  try{if(type==='storySourceSkill'&&opt&&opt.storyWER&&opt.stage==='warning'&&opt.castId!=null){const s=String(opt.sourceSlot||'').toLowerCase();if(SLOTS.includes(s)&&(!G()||opt.sourceHero===G().hero)){casts.set(String(opt.castId),s);if(casts.size>64)casts.delete(casts.keys().next().value);}}}catch(e){fail(e);}
  if(inScope()&&opt&&typeof opt==='object'&&Number.isFinite(opt.size))opt={...opt,size:opt.size*scale};
  return b.call(this,type,x,y,opt,...rest);});
 wrapG('makeShot',b=>function(x,y,angle,speed,damage,opt={},...rest){
  if(inScope()&&opt&&opt.friendly){const o={...opt};if(Number.isFinite(o.life))o.life*=scale;o.radius=(Number.isFinite(o.radius)?o.radius:.14)*scale;opt=o;}
  return b.call(this,x,y,angle,speed,damage,opt,...rest);});
 wrapG('delay',b=>function(seconds,fn,owner=null,...rest){
  let sc=0;if(typeof fn==='function'){if(depth>0&&scale!==1)sc=scale;else if(String(owner??'').startsWith('story-wer:')){const s=casts.get(String(owner).slice(10));if(s)sc=mult(s,rk(s));}}
  if(!sc||sc===1)return b.call(this,seconds,fn,owner,...rest);
  return b.call(this,seconds,function(...x){return scoped(sc,fn,this,x);},owner,...rest);});
 // 저장 파일에는 잠금용 먼 재사용 대기를 남기지 않는다
 wrapG('serializeSave',b=>function(...a){const d=b.apply(this,a);try{const r=d?.storyWER?.remaining,p=G();if(r&&p)for(const s of ['w','e','r'])if(mine.has(p.hero+':'+s))delete r[p.hero+':'+s];}catch(e){fail(e);}return d;});
 wrapG('updateHUD',b=>function(...a){const r=b.apply(this,a);try{hud();}catch(e){fail(e);}return r;});
 wrapG('tick',b=>function(...a){try{gate();}catch(e){fail(e);}return b.apply(this,a);});
 ensureCast();}
// W·E·R: 먼 재사용 대기로 엔진 안쪽 cast 까지 막는다(풀 때는 우리가 건 것만 되돌림)
const mine=new Set();
const dl={};// 본편 W·E·R 재사용 마감: 새로 걸린 몫만 슬롯 배수로 늘린다(R571 과 같은 방식)
function gate(){const p=G();if(!p||typeof time!=='number')return;ensureCast();nudge(p);const s=p.storyWER||(p.storyWER={ready:{},buffs:{}});if(!s.ready)s.ready={};
 for(const sl of ['w','e','r']){const k=p.hero+':'+sl,v=Number(s.ready[k]),f=COOL[sl];
  if(prefs.on&&solo()&&Number.isFinite(v)&&v>time&&v-time<FAR/2){const prev=Number.isFinite(dl[k])?dl[k]:time,base=Math.max(time,prev);if(f!==1&&v>base+1e-6&&!locked(sl,p)){s.ready[k]=base+(v-base)*f;stats.stretched++;}dl[k]=s.ready[k];}else dl[k]=Number.isFinite(v)?v:0;
  if(locked(sl,p)){if(!(s.ready[k]>time+FAR/2)){s.ready[k]=time+FAR;mine.add(k);stats.locked++;}}else if(mine.has(k)){mine.delete(k);if(s.ready[k]>time+FAR/2)s.ready[k]=0;dl[k]=0;}}}
// 자동 스킬레벨업을 꺼 둔 채 점수가 있는데 잠긴 칸이 있으면 가끔 알려 준다
let lastNudge=0;
function nudge(p){try{if(!prefs.on||!solo()||!(Number(p.points)>0))return;if(window.__STORYWORLD_AUTOLEVEL_R237__?.inspect?.().on!==false)return;/* 자동 스킬레벨업이 켜져 있으면 저절로 배움 */if((typeof modal!=='undefined'&&modal)||(typeof loading!=='undefined'&&loading)||(typeof storyScene!=='undefined'&&storyScene)||!(Number(p.hp)>0))return;
 const left=SLOTS.filter(s=>locked(s,p));if(!left.length)return;const t=Date.now();if(t-lastNudge<30000)return;lastNudge=t;
 if(typeof toast==='function')toast('스킬 포인트 '+Math.floor(p.points)+'점 · P 키를 눌러 '+left.map(KR).join('·')+' 스킬을 배우세요 ('+left.map(x=>LEARN[x]).join('·')+'점)',3.4);}catch(e){fail(e);}}
// __STORYWORLD_WER__.cast: 다른 겹이 위에 덮여도 늘 가장 바깥에서 거절(A키 오토·R103 확률 발동)
function ensureCast(){const W=window.__STORYWORLD_WER__;if(!W||typeof W.cast!=='function'||W.__r663)return;const base=W.cast;
 window.__STORYWORLD_WER__=Object.freeze({...W,__r663:true,cast(slot,...a){try{const s=String(slot).toLowerCase();if(SLOTS.includes(s)&&locked(s)){stats.blockedCasts++;return false;}}catch(e){fail(e);}return base.call(this,slot,...a);}});}
// HUD: 안 배운 칸의 단추(아이콘)는 숨기고, 배우는 순간 튀어나오는 연출 + 알림
function css(){try{if(document.getElementById('r663Css'))return;const st=document.createElement('style');st.id='r663Css';st.textContent='.skill.r663hide{display:none!important}@keyframes r663pop{0%{transform:scale(.15);opacity:0;box-shadow:0 0 0 rgba(255,214,130,0)}55%{transform:scale(1.32);opacity:1;box-shadow:0 0 24px 9px rgba(255,214,130,.85)}100%{transform:scale(1);opacity:1;box-shadow:0 0 0 rgba(255,214,130,0)}}.skill.r663pop{animation:r663pop .9s ease-out 1}';document.head.appendChild(st);}catch(_){}}
const seen={};
function hud(){const ids={q:'specialBtn',w:'story-wer-w',e:'story-wer-e',r:'story-wer-r'};css();
 for(const s of SLOTS){const b=document.getElementById(ids[s]);const on=locked(s),was=seen[s];seen[s]=on;if(!b)continue;
  if(b.classList)b.classList.toggle('r663hide',on);
  if(was===true&&!on){stats.learned++;try{if(b.classList){b.classList.remove('r663pop');void b.offsetWidth;b.classList.add('r663pop');if(typeof setTimeout==='function')setTimeout(()=>b.classList.remove('r663pop'),1200);}}catch(_){}
   try{if(typeof toast==='function')toast(KR(s)+' 스킬 습득 · '+heroName(s,G()?.hero)+(s==='q'?'':' (피해 ×'+POWER[s]+' · 범위 ×'+RANGE[s]+' · 재사용 ×'+COOL[s]+')'),3);}catch(_){}}}}
// ---- 시작 ------------------------------------------------------------------------------------------------
function boot(){try{addDefs();install();}catch(e){fail(e);}}
if(typeof document!=='undefined'&&document.readyState==='complete')boot();else window.addEventListener('load',boot);
let tries=0;(function arm(){if(!addDefs()&&++tries<60&&typeof setTimeout==='function')setTimeout(arm,250);})();
window.__STORYWORLD_SKILL_GROWTH_R663__=Object.freeze({revision:REV,slots:SLOTS,max:MAXR,mult,cost,learn:{...LEARN},power:{...POWER},cool:{...COOL},range:{...RANGE},lockedCount:p=>SLOTS.filter(s=>locked(s,p)).length,rank:(s,p)=>rk(s,p),locked:(s,p)=>locked(s,p),
 scale:(s,p=G())=>{s=String(s||'').toLowerCase();const o={locked:false,range:1,power:1,cool:1};try{if(!SLOTS.includes(s)||!prefs.on||!p||!solo()||!P62())return o;o.locked=locked(s,p);if(o.locked)return o;const r=rk(s,p);o.range=mult(s,r);o.power=POWER[s]||1;o.cool=COOL[s]||1;}catch(e){fail(e);}return o;},
 inspect:()=>({revision:REV,on:prefs.on,stats:{...stats},ranks:Object.fromEntries(SLOTS.map(s=>[s,rk(s)])),lastError})});
})();
