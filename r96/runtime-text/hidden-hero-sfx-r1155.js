/* R1155 히든 영웅 EGO·페르소나 전용 효과음(사용자 2026-11-18 "EGO·페르소나 전용 효과음도 음원-생성적용").
 *  예전: EGO(환도 몸, R1046 형상)는 환도 소리, 페르소나(라우렌 몸, R1113 형상)는 라우렌 소리를 그대로 냈다(천체 공명은 라우렌 r546 소리).
 *  지금: 형상이 켜져 있을 때만 sound(kind) 한 번의 종류를 전용 소리로 바꾼다. 소리는 scripts/build-sfx-r1155.py 가 numpy 로 직접 합성(유료 생성 없음).
 *   EGO = 먹 붓질 바람 + 흰 종·유리 결 + 별빛(먹+흰, 천체) / 페르소나 = 어긋난 낮은 화음·거꾸로 부풂·으르렁·속삭임(언주, 악의).
 *  가려내는 법(엔진·다른 오버레이 파일은 고치지 않는다):
 *   기본 공격 = 'attack'(EGO 는 R546 이 바꾼 r546Atk_hwando 도) · Q = 방금 player.specialCD 가 걸린 special · W/E/R = 방금 storyWER.ready['<영웅>:<칸>'] 이
 *   0.4~60초 뒤로 걸린 special(잠긴 칸은 time+1e6 이라 제외) · 묵월·칠묵영·삼협묵희(R945) = 같은 작업 안에서 그 이름 글자(floatText) 바로 뒤에 나는 소리 ·
 *   삼협묵희 일격 = 삼협묵희 뒤 strikeAt 초 언저리의 special · 천체 공명(R946) = r546Atk_lauren/r546Sp_lauren 이 날 때 R946 의 마지막 act 종류 ·
 *   연타 틱 = r972_slash·r975Ilseom1~7(EGO), r972_gravity(페르소나) · 적중음 = R785 가 고른 r785Hit(Big)_hwando/lauren(R785 가 안쪽이면 그 한 번 동안 프로필을 바꿔 끼움). 그 밖의 special(소환·적 탄 등)은 그대로.
 *  환도·라우렌 본인, 형상이 아닐 때, 소리 파일(프로필)이 없을 때는 예전 그대로. 끄기: localStorage storyworld.r1155.sfx = '0'.
 *  종류 이름은 R993 믹스 범주 규칙(r546Atk_ = 타격, r546Sp_ = 스킬, r972_ = 스킬 틱)에 들도록 붙였다 — 음량·변주·더킹을 다른 영웅과 같게 받는다. */
(function(){'use strict';
if(window.__STORYWORLD_HIDDEN_HERO_SFX_R1155__)return;
const REV='R1155-hidden-hero-sfx-1',KEY='storyworld.r1155.sfx',DIR='assets/r1155/sfx/';
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const R=(...l)=>Object.freeze(l.map(([n,g])=>Object.freeze({path:DIR+n+'.ogg',gain:g})));
// scripts/build-sfx-r1155.py SPEC 와 같은 표(파일·gain). 바꾸면 둘 다.
const TABLE=Object.freeze({
 r546Atk_ego:R(['ego-atk-1',0.7],['ego-atk-2',0.7]),
 r546Sp_ego_q:R(['ego-q-1',0.72]),
 r546Sp_ego_w:R(['ego-w-1',0.72]),
 r546Sp_ego_e:R(['ego-e-1',0.72]),
 r546Sp_ego_r:R(['ego-r-1',0.75]),
 r546Sp_ego_moon:R(['ego-moon-1',0.72]),
 r546Sp_ego_violet:R(['ego-violet-1',0.75]),
 r546Sp_ego_clones:R(['ego-clones-1',0.72]),
 r546Sp_ego_trio:R(['ego-trio-1',0.75]),
 r546Sp_ego_trioHit:R(['ego-triohit-1',0.75]),
 r546Sp_ego_star:R(['ego-star-1',0.72]),
 r546Sp_ego_abyss:R(['ego-abyss-1',0.72]),
 r546Sp_ego_repulse:R(['ego-repulse-1',0.72]),
 r972_egoSlash:R(['ego-slash-1',0.42],['ego-slash-2',0.42]),
 r972_egoSlashEnd:R(['ego-slashend-1',0.55]),
 r546Atk_persona:R(['per-atk-1',0.7],['per-atk-2',0.7]),
 r546Sp_persona_q:R(['per-q-1',0.72]),
 r546Sp_persona_w:R(['per-w-1',0.72]),
 r546Sp_persona_e:R(['per-e-1',0.72]),
 r546Sp_persona_r:R(['per-r-1',0.72]),
 r546Sp_persona_repulse:R(['per-repulse-1',0.72]),
 r546Sp_persona_star:R(['per-star-1',0.72]),
 r546Sp_persona_abyss:R(['per-abyss-1',0.72]),
 r546Sp_persona_violetCharge:R(['per-violet-charge-1',0.72]),
 r546Sp_persona_violetFire:R(['per-violet-fire-1',0.78]),
 r546Sp_persona_meteor:R(['per-meteor-1',0.72]),
 r972_perGravity:R(['per-gravity-1',0.42],['per-gravity-2',0.42]),
 r785Hit_ego:R(['ego-hit-1',0.85],['ego-hit-2',0.85],['ego-hit-3',0.85],['ego-hit-4',0.85]),
 r785HitBig_ego:R(['ego-hitbig-1',1.0],['ego-hitbig-2',1.0]),
 r785Hit_persona:R(['per-hit-1',0.85],['per-hit-2',0.85],['per-hit-3',0.85],['per-hit-4',0.85]),
 r785HitBig_persona:R(['per-hitbig-1',1.0],['per-hitbig-2',1.0])});
const role=k=>/^r546Atk_/.test(k)?'attack':/^r785/.test(k)?'enemyHit':'special';
const stats={mapped:0,attack:0,hits:0,hitSwaps:0,warmed:0,q:0,wer:0,passive:0,celestial:0,ticks:0,fallback:0,applied:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.stack||e).slice(0,300);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const P=()=>G(()=>player,null),NOW=()=>{const t=G(()=>time,0);return Number.isFinite(t)?t:0;};
const later=f=>{try{if(typeof queueMicrotask==='function')queueMicrotask(f);else Promise.resolve().then(f);}catch(_){}};
function form(){if(!P())return null;
 if(G(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive()===true,false))return 'ego';
 if(G(()=>window.__STORYWORLD_PERSONA_HERO_R1113__.formActive()===true,false))return 'persona';return null;}
const has=k=>G(()=>!!(soundProfiles&&soundProfiles[k]&&soundProfiles[k].length),false);
// ── 프로필 등록: 엔진 sound() 가 soundProfiles[kind] 를 읽고, 쾌적 계층은 별칭으로 역할(공격·스킬)을 정한다 ──
function apply(){if(!on)return;try{if(typeof soundProfiles==='undefined'||!soundProfiles)return;const al=G(()=>window.__STORYWORLD_SFX_COMFORT__.aliases,null);
 for(const[k,list]of Object.entries(TABLE)){soundProfiles[k]=list.map((r,i)=>({key:'r1155-'+k+'-'+i,path:r.path,gain:r.gain,r541:true}));if(al&&typeof al==='object')al[k]=role(k);}stats.applied++;}catch(e){fail(e);}}
// ── 시전 판별 기준값(마지막 tick 뒤) ──
const snap={cd:0,ready:{}};let hooked=false;
let warmedFor=null;
function warm(f){try{if(!f||warmedFor===f||typeof audioBuffer!=='function'||!G(()=>audioUnlocked,false))return;warmedFor=f;const tag=f==='ego'?/(_ego|ego[A-Z])/:/(_persona|per[A-Z])/;
 for(const[k,list]of Object.entries(TABLE))if(tag.test(k))for(const r of list)try{Promise.resolve(audioBuffer(r.path)).catch(()=>{});}catch(_){}stats.warmed++;}catch(e){fail(e);}}
function take(){try{const p=P();if(!p)return;if(on)warm(form());snap.cd=Number(p.specialCD)||0;const rd=p.storyWER&&p.storyWER.ready;snap.ready={};if(rd&&typeof rd==='object')for(const k in rd)snap.ready[k]=Number(rd[k]);}catch(e){fail(e);}}
function slotOf(p){const t=NOW(),cd=Number(p.specialCD)||0;if(cd-snap.cd>.3){snap.cd=cd;return 'q';}
 const rd=p.storyWER&&p.storyWER.ready;if(rd&&typeof rd==='object')for(const s of ['w','e','r']){const k=p.hero+':'+s,v=Number(rd[k]);if(Number.isFinite(v)&&v!==snap.ready[k]&&v-t>=.4&&v-t<=60){snap.ready[k]=v;return s;}}
 return null;}
// ── 이름 글자(R945 묵월·칠묵영·삼협묵희): 같은 작업(마이크로태스크 전) 안에서만 소리와 묶는다 ──
let said=null,trioAt=-1e9;
function wrapFloat(){if(typeof floatText!=='function'||floatText.__r1155)return;const base=floatText;
 const w=function(t){try{if(on){said=String(t==null?'':t);later(()=>{said=null;});}}catch(_){}return base.apply(this,arguments);};w.__r1155=true;floatText=w;}
const strikeAt=()=>{const v=Number(G(()=>window.__STORYWORLD_HWANDO_INK_R945__.config.trio.strikeAt,1.2));return Number.isFinite(v)?v:1.2;};
// ── 천체 공명(R946): 방금 생긴 act ──
function lastAct(){const a=G(()=>window.__STORYWORLD_LAUREN_CELESTIAL_R946__.inspect().acts,null);return Array.isArray(a)&&a.length?a:null;}
const CEL_EGO=Object.freeze({red:'r546Sp_ego_star',blue:'r546Sp_ego_abyss',repulse:'r546Sp_ego_repulse'}),
 CEL_PER=Object.freeze({red:'r546Sp_persona_star',blue:'r546Sp_persona_abyss',repulse:'r546Sp_persona_repulse'});
// ── 이번 sound(kind) 의 새 종류. null = 그대로 ──
function pick(kind,f){const p=P();if(!p||typeof kind!=='string')return null;
 if(f==='ego'){
  if(kind==='attack'||kind==='r546Atk_hwando'){stats.attack++;return 'r546Atk_ego';}
  if(said){if(kind==='special'&&/묵월/.test(said)){stats.passive++;return 'r546Sp_ego_moon';}
   if(kind==='blink'&&/칠묵영/.test(said)){stats.passive++;return 'r546Sp_ego_clones';}
   if(kind==='ego'&&/삼협묵희/.test(said)){stats.passive++;trioAt=NOW();return 'r546Sp_ego_trio';}}
  if(kind==='special'||kind==='r546Sp_hwando'){const s=slotOf(p);if(s){stats[s==='q'?'q':'wer']++;return 'r546Sp_ego_'+s;}
   const dt=NOW()-trioAt,sa=strikeAt();if(dt>=sa-.25&&dt<=sa+.6){trioAt=-1e9;stats.passive++;return 'r546Sp_ego_trioHit';}return null;}
  if(kind==='r546Atk_lauren'){stats.celestial++;const a=lastAct(),k=a&&a[a.length-1].kind;return CEL_EGO[k]||'r546Sp_ego_star';}
  if(kind==='r546Sp_lauren'){stats.celestial++;return 'r546Sp_ego_violet';}
  if(kind==='r972_slash'||/^r975Ilseom[1-6]$/.test(kind)){stats.ticks++;return 'r972_egoSlash';}
  if(kind==='r975Ilseom7'){stats.ticks++;return 'r972_egoSlashEnd';}
  if(kind==='r785Hit_hwando'||kind==='r785HitBig_hwando'){stats.hits++;return kind.replace('hwando','ego');}
  return null;}
 if(f==='persona'){
  if(kind==='attack'){stats.attack++;return 'r546Atk_persona';}
  if(kind==='special'){const s=slotOf(p);if(s){stats[s==='q'?'q':'wer']++;return 'r546Sp_persona_'+s;}return null;}
  if(kind==='r546Atk_lauren'){stats.celestial++;const a=lastAct(),k=a&&a[a.length-1].kind;return CEL_PER[k]||'r546Sp_persona_star';}
  if(kind==='r546Sp_lauren'){stats.celestial++;const a=lastAct(),x=a&&a[a.length-1],t=NOW();
   if(x&&x.kind==='meteor'&&t-(Number(x.t0)||0)<.1)return 'r546Sp_persona_meteor';
   if(x&&x.kind==='violet'&&t-(Number(x.t0)||0)<.05)return 'r546Sp_persona_violetCharge';return 'r546Sp_persona_violetFire';}
  if(kind==='r972_gravity'){stats.ticks++;return 'r972_perGravity';}
  if(kind==='r785Hit_lauren'||kind==='r785HitBig_lauren'){stats.hits++;return kind.replace('lauren','persona');}
  return null;}
 return null;}
function wrapSound(){if(typeof sound!=='function'||sound.__r1155)return;const base=sound;
 // 두 겹(스크립트 자리 + load 뒤 바깥)이어도 괜찮다: 바뀐 종류(r546Atk_ego 등)는 pick 입력과 겹치지 않아 다시 바뀌지 않고, 바깥 오버레이(R785 등)가 바꾼 종류는 안쪽이 본다.
 const w=function(kind,...rest){if(!on)return base.call(this,kind,...rest);let k=kind;
  let f=null;try{f=form();if(f){const m=pick(kind,f);if(m){if(has(m)){k=m;stats.mapped++;}else stats.fallback++;}}if(!hooked)take();}catch(e){fail(e);k=kind;}
  // R785 가 안쪽이면 여기엔 'enemyHit' 만 온다 → 그 한 번 동안 R785 가 고를 r785Hit(Big)_<몸 영웅> 줄을 전용 줄로 바꿔 끼웠다가 되돌린다(R544 swapFor 와 같은 방식).
  if(f&&kind==='enemyHit'&&k===kind){let keep=null;try{const h=f==='ego'?'hwando':'lauren',sw=[['r785Hit_'+h,'r785Hit_'+f],['r785HitBig_'+h,'r785HitBig_'+f]].filter(([a,b])=>has(a)&&has(b));
    if(sw.length){keep=sw.map(([a,b])=>[a,soundProfiles[a]]);for(const[a,b]of sw)soundProfiles[a]=soundProfiles[b];stats.hitSwaps++;}}catch(e){fail(e);keep=null;}
   if(keep){try{return base.call(this,k,...rest);}finally{try{for(const[a,v]of keep)soundProfiles[a]=v;}catch(e){fail(e);}}}}
  return base.call(this,k,...rest);};
 w.__r1155=true;w.__r1155base=base;sound=w;}
function install(){if(!on)return;try{wrapSound();wrapFloat();}catch(e){fail(e);}}
// 늦게 감싸는 오버레이(R993·R1026 등)보다 바깥이어야 원래 종류('attack'·'special')를 본다 → 지금 한 번, 모든 스크립트가 끝난 뒤(load) 한 번 더 바깥에.
function outermost(){try{if(typeof sound==='function'&&!sound.__r1155)wrapSound();wrapFloat();}catch(e){fail(e);}}
if(on){apply();install();
 if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const r=base.apply(this,arguments);apply();return r;};}
 try{const H=window.__STORYWORLD_POST_HOOKS__;if(H&&typeof H.register==='function'){H.register('r1155-hidden-hero-sfx',{tick:take},fail);hooked=true;}}catch(e){fail(e);}
 try{if(typeof document!=='undefined'&&document.readyState!=='complete'&&typeof window.addEventListener==='function')window.addEventListener('load',()=>setTimeout(outermost,0));}catch(_){}}
window.__STORYWORLD_HIDDEN_HERO_SFX_R1155__=Object.freeze({revision:REV,table:TABLE,on:()=>on,form,apply,
 inspect:()=>({revision:REV,on,form:form(),hooked,stats:{...stats},lastError,outermost:G(()=>!!sound.__r1155,false),
  profiles:Object.fromEntries(Object.keys(TABLE).map(k=>[k,G(()=>(soundProfiles[k]||[]).map(r=>r.path),[])])),synth:'numpy (scripts/build-sfx-r1155.py)',directListeningVerified:false})});
})();
