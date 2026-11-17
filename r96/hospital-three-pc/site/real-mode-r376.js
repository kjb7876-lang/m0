// R376 — 난이도 '실화'(사용자 2026-11-06 "난이도 실화모드 신설해서 실화모드는 영화모드길잡이가 고르는건데 하드모드대비 체력2배 적공격력50프로감소
//  해서 서사오디오나 자막이 확실하게 전투중에 나오도록 시간밸런스있게 생성해서 적용해줘 버그없도록").
//  · 영화 모드(R370)가 켜져 있으면 길잡이가 다음 이야기 지역을 열 때 '실화'를 고른다(설정 '영화 모드 난이도: 실화', 기본 켬).
//    실화 = 하드(R63 tier 'hard': 보상·포인트 드롭·저장 구조 그대로) 위에 덧씌운다:
//      적 체력 = 하드의 2배(일반 몹·보스·시련·소환 적 모두, R63 이 계산한 difficultyFactorR63 를 2배로),
//      적이 주는 피해 = 하드의 50%(R63 하드 1.2배 × 0.5 = 0.6배).
//  · 실화 지역 목록은 저장 파일(realModeR376)에 남고, 새 게임에서 비운다. 길잡이가 아닌 난이도 창에서 직접 고르면 그 지역은 실화에서 빠진다.
//  · 체력 2배는 표식(realR376F)으로 한 번만 건다: R63 이 다시 계산해 배율이 바뀌면(지역 재입장·불러오기) 다시 2배로, R373 분대 복제는 표식을 함께 복사해 두 번 곱하지 않는다.
//  · 길어진 전투 시간은 R370 영화 모드가 지역 시간 예측에 쓴다(timeMul, 처음엔 1.8배, 실제로 머문 시간을 'real:' 열쇠로 따로 배움).
//  · 협동 모드에서는 쓰지 않는다. 끄기: 설정 줄 또는 localStorage storyworld.r376.real {"on":false}.
(()=>{'use strict';
if(window.__STORYWORLD_REAL_MODE_R376__)return;
const REV='R376-real-1',KEY='storyworld.r376.real',HP_MUL=2,DMG_MUL=.5,TIME_MUL=1.8,NAME='실화';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={picked:0,boosted:0,softened:0,cleared:0,restored:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const maps=new Set();// 'STORY:dist00' 꼴(R63 roomKey 와 같은 모양)
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const solo=()=>{const c=window.__STORYWORLD_COOP_SIM_R62__;try{return !c?.mode||c.mode()==='off';}catch(_){return true;}};
const cinemaOn=()=>{try{return window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.().on===true;}catch(_){return false;}};
const keyOf=(id,l)=>String(l||G(()=>layer,'STORY'))+':'+String(id||'');
const roomKeyOf=r=>r?keyOf(r.id,r.layer||G(()=>layer,'STORY')):'';
// 지역 난이도: room.difficultyR63(R63 이 진입 결과가 true 일 때만 둔다 — 겹친 진입 래퍼가 true 아닌 값을 돌려주면 비어 있다)
//  → 없으면 R63 이 진입 전에 저장하는 지역별 선택(hapil.storyworld.campaign-r63.maps.v1)을 읽는다.
const R63_STORE='hapil.storyworld.campaign-r63.maps.v1';let tierRaw=null,tierMap={};
function storedTier(k){try{const st=window.__STORYWORLD_TEST_STORAGE_B1__?.store||localStorage;const raw=st.getItem(R63_STORE);if(raw!==tierRaw){tierRaw=raw;tierMap={};try{const j=JSON.parse(raw||'null');if(j?.maps&&typeof j.maps==='object')tierMap=j.maps;}catch(_){}}return tierMap[k]||null;}catch(_){return null;}}
function tierOf(r){if(!r)return null;const t=r.difficultyR63;if(t==='easy'||t==='normal'||t==='hard')return t;return storedTier(roomKeyOf(r));}
function realRoom(r=G(()=>room,null)){return !!r&&solo()&&maps.has(roomKeyOf(r))&&tierOf(r)==='hard';}
// ── 체력 2배 ──
function boost(e){if(!e||!(e.hp>0)||e.deadRecorded)return false;const f=Number(e.difficultyFactorR63);if(!Number.isFinite(f)||f<=0)return false;
 if(e.realR376F===f)return false;
 const mx=Number(e.maxHp);if(!Number.isFinite(mx)||mx<=0)return false;const frac=Math.max(0,Math.min(1,e.hp/mx));
 const nf=f*HP_MUL;e.difficultyFactorR63=nf;e.maxHp=Math.max(1,mx*HP_MUL);e.hp=Math.max(.0001,e.maxHp*frac);e.realR376F=nf;stats.boosted++;return true;}
function ensure(r=G(()=>room,null)){if(!realRoom(r))return 0;let n=0;for(const e of r.enemies||[])if(boost(e))n++;return n;}
// ── 적 피해 절반 ──
function enemySource(source){const r=G(()=>room,null),enemies=r?.enemies||[];if(!source)return false;
 const owner=source.owner??source.attacker??source.enemy,ownerId=typeof owner==='string'?owner:owner?.id??source.ownerId??source.enemyId;
 return enemies.includes(source)||typeof source.id==='string'&&enemies.some(e=>e?.id===source.id)||!!owner&&(enemies.includes(owner)||typeof ownerId==='string'&&enemies.some(e=>e?.id===ownerId));}
try{if(typeof hurt==='function'){const base=hurt;hurt=function(value,source,...a){try{if(Number.isFinite(value)&&value>0&&realRoom()&&enemySource(source)){stats.softened++;value=value*DMG_MUL;}}catch(e){fail(e);}return base.call(this,value,source,...a);};}}catch(e){fail(e);}
// ── 길잡이가 고르기 ──
function wrapGuide(){const R=window.__STORYWORLD_GUIDE_R77__;if(!R||typeof R.takeNextNormal!=='function')return false;if(R.__r376)return true;
 // R189 가 먼저 감싸야 한다(R189 는 R77 원본을 감싼 새 객체로 바꿔 끼운다). R189 가 아직이면 기다린다.
 if(!R.__r189&&tries<40)return false;
 const baseFn=R.takeNextNormal;try{window.__STORYWORLD_GUIDE_R77__=Object.freeze({...R,__r376:true,takeNextNormal(destination,l,from){const t=baseFn.call(R,destination,l,from);
   try{const k=keyOf(destination,l);if(!t){return t;}
    if(prefs.on&&cinemaOn()&&solo()){maps.add(k);stats.picked++;return 'hard';}
    maps.delete(k);}catch(e){fail(e);}return t;}});return true;}catch(e){fail(e);return false;}}
let tries=0;(function arm(){if(wrapGuide()||++tries>80)return;setTimeout(arm,250);})();
// 난이도 창(R63 picker)에서 직접 고르면 그 지역은 실화가 아니다.
let explicit=false;try{addEventListener('click',e=>{const id=e.target?.closest?.('button')?.id||'';if(/^campaign(Easy|Normal|Hard)R63$/.test(id))explicit=true;},true);}catch(_){}
try{if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(id,from,opt,...a){const pick=explicit;explicit=false;const l=opt?.layer||G(()=>layer,'STORY');
  const r=await base.call(this,id,from,opt,...a);
  try{if(r!==false){const cur=G(()=>room,null);if(pick&&cur&&cur.id===id)maps.delete(roomKeyOf(cur));
    if(realRoom(cur)){ensure(cur);if(!opt?.restore&&typeof toast==='function')toast('난이도 '+NAME+' · 하드 기준 적 체력 2배 · 적 공격력 절반',2.6);}}}catch(e){fail(e);}
  return r;};}}catch(e){fail(e);}
// ── 저장·불러오기·새 게임 ──
try{if(typeof serializeSave==='function'){const base=serializeSave;serializeSave=function(...a){const d=base.apply(this,a);try{if(d&&typeof d==='object'&&solo())d.realModeR376={version:1,maps:[...maps]};}catch(e){fail(e);}return d;};}}catch(e){fail(e);}
try{if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=function(raw,...a){
  if(solo()){maps.clear();try{const m=raw?.realModeR376;if(m?.version===1&&Array.isArray(m.maps))for(const k of m.maps.slice(0,200))if(typeof k==='string'&&/^(STORY|DREAM):[A-Za-z0-9_]+$/.test(k))maps.add(k);stats.restored++;}catch(e){fail(e);}}
  const out=base.call(this,raw,...a);const go=v=>{try{if(v!==false)afterRestore(raw);}catch(e){fail(e);}return v;};return out&&typeof out.then==='function'?out.then(go):go(out);};}}catch(e){fail(e);}
// 엔진 복원은 저장된 체력을 2배 전 최대 체력으로 자른다 → 실화 지역은 2배를 건 뒤 저장된 체력을 다시 넣는다(최대 체력 안에서).
function afterRestore(raw){const W=G(()=>world,null)||{};for(const[k,r]of Object.entries(W)){if(!r||!realRoom(r))continue;ensure(r);
  const saved=new Map((raw?.rooms?.[k]?.enemies||[]).filter(x=>x&&typeof x.id==='string').map(x=>[x.id,Number(x.hp)]));
  for(const e of r.enemies||[]){const h=saved.get(e.id);if(e.hp>0&&Number.isFinite(h)&&h>0&&raw?.enemyHpScaleE159===2)e.hp=Math.min(e.maxHp,h);}}
 ensure();}
try{if(typeof newGame==='function'){const base=newGame;newGame=async function(...a){maps.clear();stats.cleared++;return base.apply(this,a);};}}catch(e){fail(e);}
// 새로 나오는 적(증원·소환·시련)과 R63 재계산을 따라가며 2배를 유지한다.
setInterval(()=>{try{ensure();}catch(e){fail(e);}},250);
// ── 설정 ──
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
function set(p={}){if(typeof p.on==='boolean'){prefs.on=p.on;save();}return{...prefs};}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{if(!document.getElementById('r376Real')){
  const l=document.createElement('label');l.id='r376RealRow';const c=document.createElement('input');c.type='checkbox';c.id='r376Real';c.checked=prefs.on;
  l.title='영화 모드 길잡이가 다음 지역을 열 때 실화 난이도를 고릅니다: 하드 기준 적 체력 2배, 적 공격력 절반. 전투가 길어진 만큼 서사 자막·음성이 전투 중에 이어집니다';
  c.onchange=()=>set({on:c.checked});l.appendChild(c);l.appendChild(document.createTextNode(' 영화 모드 난이도: '+NAME+'(하드 기준 적 체력 2배 · 적 공격력 절반, 다음 지역부터)'));
  const after=document.getElementById('r370VoiceRow');if(after&&after.parentNode){after.parentNode.insertBefore(l,after.nextSibling);}
  else{const grid=document.querySelector('#panel .settings');if(grid)grid.appendChild(l);}}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
window.__STORYWORLD_REAL_MODE_R376__=Object.freeze({revision:REV,NAME,HP_MUL,DMG_MUL,TIME_MUL,set,prefs:()=>({...prefs}),
 active:()=>realRoom(),timeMul:()=>realRoom()?TIME_MUL:1,maps:()=>[...maps],ensure:()=>ensure(),boost,
 inspect:()=>{const r=G(()=>room,null);return{revision:REV,prefs:{...prefs},cinema:cinemaOn(),active:realRoom(r),room:roomKeyOf(r),tier:tierOf(r),maps:[...maps],
  wrapped:!!window.__STORYWORLD_GUIDE_R77__?.__r376,stats:{...stats},lastError};}});
})();
