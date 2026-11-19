// R1193 — 스토리 사몽(꿈 층)에 남은 R248 임시 도트 몹을 스토리 층과 같은 칠한 그림으로(사용자 2026-11-19 전수조사 후 "응" — 코드로 처리할 꿈 층 몹 12종).
//  원인(전수조사 289곳, pixel-census-20261119): 스토리 층 칠한 그림 표(R374 nativeId 표·R380 승인 표)는 actor.layer==='STORY' 만 보고,
//  R248 은 R374·R375·R380 이 그 몹을 맡았을 때만 물러난다 → 꿈 층에서는 같은 이름 몹이 R248 임시 도트 시트로 그려졌다.
//  · 꿈 층(layer DREAM, 사몽 에피소드 몹 제외)에서 아래 이름 몹만, 스토리 층과 같은 그림 표 줄(같은 index.json 줄)을 R380 frameOf 로 그린다.
//    같은 이름 = 같은 몹이라 같은 그림이 R248 규칙("같은 몹의 변형은 같은 그림")에 맞다. 판정·체력·피해·보상·수·이름은 그대로.
//  · 얼굴 없는 남자의 박수는 R208(curtain-mannequin)이 꿈 층에서도 이미 그림을 고르므로 R248 만 물러나게 한다.
//  · R248 이 물러나게: window.__STORYWORLD_APPROVED_MOBS_R380__.assign 을 감싼 새 객체로 바꿔 끼운다(R248 은 매번 window 속성으로 묻는다).
//  · Dots 몫 8종(보라검 부활자 등, CX-0161DR)은 여기 없다 — 그림이 오면 R248 시트 줄을 바꾼다.
//  끄기 localStorage['storyworld.r1193.dreamMobs']='{"on":false}'. API window.__STORYWORLD_DREAM_MOB_ART_R1193__.
(()=>{'use strict';
if(window.__STORYWORLD_DREAM_MOB_ART_R1193__)return;
const REV='R1193-dream-mobs-1',KEY='storyworld.r1193.dreamMobs';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={assigned:0,frames:0,yields:0,installs:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// [꿈 층 이름(기본 이름), 그림 표, 표 줄 id] — 표 줄은 스토리 층에서 같은 몹이 쓰는 줄
const MAP=Object.freeze([
 ['재 나방','r380','ash-moth-v2'],['되살아난 방패동료','r380','reborn-shieldmate-v4'],['치료거부의 가면','r380','treatment-refusal-mask-v1'],
 ['육망성의 흑마술 실험체','r380','hexagram-experiment-m031-v1'],['기억이주 연결자','r380','u206-mech-01-v1'],
 ['이동문 공허잔영','r374','u203-e2-mech'],['최종문 공명기사','r374','u203-e3-mech'],
 ['학대기록 공허체','r374','u205-e1-new'],['관리자 추적견','r374','u205-e2-new'],['역전기록 수집가','r374','u205-e3-new'],
 ['얼굴 없는 남자의 박수','r208',null]]);
const INDEX={r380:'assets/r380/mobs/index.json',r374:'assets/r374/mobs/index.json'};
const rows={};// id → 표 줄
if(typeof fetch==='function')for(const [k,url] of Object.entries(INDEX))fetch(url).then(r=>r.ok?r.json():null).then(j=>{for(const m of j?.mobs||[])if(MAP.some(x=>x[1]===k&&x[2]===m.id))rows[m.id]=m;}).catch(fail);
const baseName=n=>String(n||'').replace(/^(중간보스|준보스)\s*·\s*/,'').replace(/\s*·\s*짙은 형상$/,'').replace(/\s*(후속 증원|증원|추격대|우두머리)$/,'').replace(/\s+\d+$/,'').trim();
const dream=()=>{try{return typeof layer==='string'&&layer==='DREAM';}catch(_){return false;}};
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
// 그 몹이 맡을 줄: {kind,row} 또는 null. 사몽 에피소드 몹·보스·탑·소환진은 건드리지 않는다.
function pick(e){if(!prefs.on||!e||!dream()||e.samongR103||e.boss||e.r170Tower||e.r251Circle||e.hero)return null;
 const b=baseName(e.r200OrigName||e.name),x=MAP.find(r=>r[0]===b);if(!x)return null;
 if(x[1]==='r208'){const m=window.__STORYWORLD_STORY_MOBS_R208__?.assign?.(e);return m?{kind:'r208',row:m}:null;}
 const row=rows[x[2]];return row?{kind:x[1],row}:null;}
// ① R248 이 물러나게 — R380 assign 을 감싼 객체로 바꿔 끼운다(꿈 층 대상 몹에만 줄을 돌려줌)
function installAssign(){const A=window.__STORYWORLD_APPROVED_MOBS_R380__;if(!A||A.__r1193)return !!A;
 const base=A.assign;window.__STORYWORLD_APPROVED_MOBS_R380__=Object.freeze({...A,__r1193:true,assign(e){try{const p=pick(e);if(p){stats.yields++;return p.row;}}catch(err){fail(err);}return base.call(this,e);}});stats.installs++;return true;}
// ② 그림: R54 frameFor 사슬 맨 바깥에서 대상 몹이면 R380 frameOf(칸 고르기·좌우 R444·공격 칸)로 그린 칸을 돌려준다. R208 은 그 사슬이 이미 그린다.
function installFrame(){const S=window.__STORYWORLD_STORY_COMBAT_R54__,A=window.__STORYWORLD_APPROVED_MOBS_R380__;if(!S||typeof S.frameFor!=='function'||!A?.frameOf)return false;if(S.__r1193)return true;
 const base=S.frameFor;window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r1193:true,frameFor(e,f){try{const p=pick(e);if(p&&p.kind!=='r208'){const im=typeof readyImage==='function'?readyImage(p.row.path):null;
  if(im?.image||im===true){stats.frames++;return A.frameOf(e,p.row,p.row.id);}if(!im&&typeof ensureImages==='function')Promise.resolve(ensureImages([p.row.path])).catch(()=>{});}}catch(err){fail(err);}return base.call(this,e,f);}});stats.installs++;return true;}
function install(){try{installAssign();installFrame();}catch(e){fail(e);}}
// 다른 덧씌우기가 사슬을 다시 감싸면(reinstall) 다시 맨 바깥에 선다
try{if(typeof document!=='undefined'&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();}catch(e){fail(e);}
try{setInterval(()=>{if(solo())install();},1000);}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_DREAM_MOB_ART_R1193__=Object.freeze({revision:REV,map:MAP,pick,set,install,inspect:()=>({revision:REV,prefs:{...prefs},rows:Object.keys(rows),stats:{...stats},lastError})});
})();
