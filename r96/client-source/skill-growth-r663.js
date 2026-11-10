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
//  자동 스킬레벨업(R237)은 QWER '배우기'는 사지 않고(직접 P 창에서 — 안 배운 칸 수만큼 점수를 남겨 둠) 배운 칸의 2~7단계와 기본·문양 실검무를 산다(auto-levelup-r237.js).
//  점수가 있는데 잠긴 칸이 있으면 30초에 한 번 P 창 안내 글을 띄운다.
//  새 영웅·키·저장 필드·자산 없음. 끄기: localStorage 'storyworld.r663.skillgrowth' {"on":false}.
//  알려진 한계: 미카엘라 W·E(R247)·기억사수 W·E(R561)의 반자동·길잡이 자동 시전은 각자 안쪽 함수를 바로 불러 이 잠금을 안 탄다(키·단추·A키 오토는 막힘).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SKILL_GROWTH_R663__)return;
const REV='R663-skill-growth-1',KEY='storyworld.r663.skillgrowth',MARK='r64:skillgrowth-r663';
const SLOTS=['q','w','e','r'],MAXR=7,STEP=.08,FAR=1e6;
const ID=s=>'skill'+s.toUpperCase()+'R663',ICON={q:'haste',w:'resonance',e:'ego',r:'dream'};
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={locked:0,blockedKeys:0,blockedCasts:0,scoped:0,migrated:0,fresh:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const P62=()=>window.__STORYWORLD_PROGRESSION_R62__,G=()=>typeof player==='object'&&player?player:null;
const now=()=>typeof time==='number'&&Number.isFinite(time)?time:0;
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const legacy=()=>{try{return !!(typeof KR291!=='undefined'&&KR291&&KR291.legacy);}catch(_){return false;}};
const KR=s=>{try{const k=typeof KR291!=='undefined'&&KR291;return s==='q'?'Q':(k&&k[s]||s.toUpperCase());}catch(_){return s.toUpperCase();}};
const mult=r=>{r=Math.max(0,Math.min(MAXR,Math.floor(Number(r)||0)));return r<=1?1:1+STEP*(r-1);};
const cost=r=>{r=Math.max(0,Math.floor(Number(r)||0));return (r+1)*(r+1);};

// ---- R62 패시브 칸 ------------------------------------------------------------------------------------
const heroName=(s,h)=>{try{if(s==='q')return (typeof HEROES!=='undefined'&&HEROES?.[h]?.special)||'고유기';return window.__STORYWORLD_WER__?.defs?.[h]?.[s]?.[0]||(KR(s)+' 스킬');}catch(_){return KR(s)+' 스킬';}};
const rk=(s,p=G())=>{try{return Math.max(0,Number(P62()?.ranks?.(ID(s),p))||0);}catch(_){return 0;}};
function addDefs(){const A=P62();if(!A||!Array.isArray(A.defs))return false;
 for(const s of SLOTS){const id=ID(s);if(A.defs.some(d=>d.id===id))continue;
  A.defs.push({id,icon:ICON[s],maxRank:MAXR,
   get name(){const h=G()?.hero;return KR(s)+' · '+heroName(s,h);},
   get cost(){const p=G();return cost(p?rk(s,p):0);},
   get text(){const p=G(),r=p?rk(s,p):0;return (r<1?'아직 배우지 못해 쓸 수 없습니다. 1점으로 배웁니다.':'범위 ×'+mult(r).toFixed(2)+(r<MAXR?' → ×'+mult(r+1).toFixed(2):' (최대)')+'.')+' 단계마다 사거리·범위 +'+Math.round(STEP*100)+'% · 최대 '+MAXR+'단계 · 비용 = 다음 단계².';}});}
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
function hint(s){const t=Date.now();if(t-lastHint<1800)return;lastHint=t;try{if(typeof toast==='function')toast(KR(s)+' 스킬은 아직 배우지 못했습니다 · P 창에서 패시브 포인트 1점으로 배웁니다',2.4);}catch(_){}}
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
 wrapG('special',b=>function(...a){if(locked('q')){stats.blockedCasts++;return undefined;}const m=mult(rk('q'));return m===1?b.apply(this,a):scoped(m,b,this,a);});
 for(const name of ['hitEnemy','moveActor','clearLine','blocked','findPath','killEnemy'])wrapG(name,b=>function(...a){susp++;try{return b.apply(this,a);}finally{susp--;}});
 wrapG('fx',b=>function(type,x,y,opt,...rest){
  try{if(type==='storySourceSkill'&&opt&&opt.storyWER&&opt.stage==='warning'&&opt.castId!=null){const s=String(opt.sourceSlot||'').toLowerCase();if(SLOTS.includes(s)&&(!G()||opt.sourceHero===G().hero)){casts.set(String(opt.castId),s);if(casts.size>64)casts.delete(casts.keys().next().value);}}}catch(e){fail(e);}
  if(inScope()&&opt&&typeof opt==='object'&&Number.isFinite(opt.size))opt={...opt,size:opt.size*scale};
  return b.call(this,type,x,y,opt,...rest);});
 wrapG('makeShot',b=>function(x,y,angle,speed,damage,opt={},...rest){
  if(inScope()&&opt&&opt.friendly){const o={...opt};if(Number.isFinite(o.life))o.life*=scale;o.radius=(Number.isFinite(o.radius)?o.radius:.14)*scale;opt=o;}
  return b.call(this,x,y,angle,speed,damage,opt,...rest);});
 wrapG('delay',b=>function(seconds,fn,owner=null,...rest){
  let sc=0;if(typeof fn==='function'){if(depth>0&&scale!==1)sc=scale;else if(String(owner??'').startsWith('story-wer:')){const s=casts.get(String(owner).slice(10));if(s)sc=mult(rk(s));}}
  if(!sc||sc===1)return b.call(this,seconds,fn,owner,...rest);
  return b.call(this,seconds,function(...x){return scoped(sc,fn,this,x);},owner,...rest);});
 // 저장 파일에는 잠금용 먼 재사용 대기를 남기지 않는다
 wrapG('serializeSave',b=>function(...a){const d=b.apply(this,a);try{const r=d?.storyWER?.remaining,p=G();if(r&&p)for(const s of ['w','e','r'])if(mine.has(p.hero+':'+s))delete r[p.hero+':'+s];}catch(e){fail(e);}return d;});
 wrapG('updateHUD',b=>function(...a){const r=b.apply(this,a);try{hud();}catch(e){fail(e);}return r;});
 wrapG('tick',b=>function(...a){try{gate();}catch(e){fail(e);}return b.apply(this,a);});
 ensureCast();}
// W·E·R: 먼 재사용 대기로 엔진 안쪽 cast 까지 막는다(풀 때는 우리가 건 것만 되돌림)
const mine=new Set();
function gate(){const p=G();if(!p||typeof time!=='number')return;ensureCast();nudge(p);const s=p.storyWER||(p.storyWER={ready:{},buffs:{}});if(!s.ready)s.ready={};
 for(const sl of ['w','e','r']){const k=p.hero+':'+sl;if(locked(sl,p)){if(!(s.ready[k]>time+FAR/2)){s.ready[k]=time+FAR;mine.add(k);stats.locked++;}}else if(mine.has(k)){mine.delete(k);if(s.ready[k]>time+FAR/2)s.ready[k]=0;}}}
// 점수가 있는데 잠긴 칸이 있으면 가끔 알려 준다(자동 스킬레벨업이 배우기는 안 사므로 직접 P 창에서)
let lastNudge=0;
function nudge(p){try{if(!prefs.on||!solo()||!(Number(p.points)>0))return;if((typeof modal!=='undefined'&&modal)||(typeof loading!=='undefined'&&loading)||(typeof storyScene!=='undefined'&&storyScene)||!(Number(p.hp)>0))return;
 const left=SLOTS.filter(s=>locked(s,p));if(!left.length)return;const t=Date.now();if(t-lastNudge<30000)return;lastNudge=t;
 if(typeof toast==='function')toast('스킬 포인트 '+Math.floor(p.points)+'점 · P 키를 눌러 '+left.map(KR).join('·')+' 스킬을 배우세요 (1점)',3.4);}catch(e){fail(e);}}
// __STORYWORLD_WER__.cast: 다른 겹이 위에 덮여도 늘 가장 바깥에서 거절(A키 오토·R103 확률 발동)
function ensureCast(){const W=window.__STORYWORLD_WER__;if(!W||typeof W.cast!=='function'||W.__r663)return;const base=W.cast;
 window.__STORYWORLD_WER__=Object.freeze({...W,__r663:true,cast(slot,...a){try{const s=String(slot).toLowerCase();if(SLOTS.includes(s)&&locked(s)){stats.blockedCasts++;return false;}}catch(e){fail(e);}return base.call(this,slot,...a);}});}
// HUD: 잠긴 단추는 어둡게 + 🔒
function css(){try{if(document.getElementById('r663Css'))return;const st=document.createElement('style');st.id='r663Css';st.textContent='.skill.r663locked{filter:grayscale(1) brightness(.55);opacity:.7}.skill.r663locked .cd{font-size:15px}';document.head.appendChild(st);}catch(_){}}
function hud(){const ids={q:'specialBtn',w:'story-wer-w',e:'story-wer-e',r:'story-wer-r'};css();
 for(const s of SLOTS){const b=document.getElementById(ids[s]);if(!b)continue;const on=locked(s);
  if(b.classList){b.classList.toggle('r663locked',on);}
  if(on){const cd=b.querySelector?.('.cd');if(cd&&cd.textContent!=='🔒')cd.textContent='🔒';}}}
// ---- 시작 ------------------------------------------------------------------------------------------------
function boot(){try{addDefs();install();}catch(e){fail(e);}}
if(typeof document!=='undefined'&&document.readyState==='complete')boot();else window.addEventListener('load',boot);
let tries=0;(function arm(){if(!addDefs()&&++tries<60&&typeof setTimeout==='function')setTimeout(arm,250);})();
window.__STORYWORLD_SKILL_GROWTH_R663__=Object.freeze({revision:REV,slots:SLOTS,max:MAXR,mult,cost,lockedCount:p=>SLOTS.filter(s=>locked(s,p)).length,rank:(s,p)=>rk(s,p),locked:(s,p)=>locked(s,p),
 inspect:()=>({revision:REV,on:prefs.on,stats:{...stats},ranks:Object.fromEntries(SLOTS.map(s=>[s,rk(s)])),lastError})});
})();
