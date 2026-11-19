// R1218 — 보스·몹 '메아리 던지기'(R61 echo) 스킬이 옛 그림을 띄우던 문제(사용자 2026-11-19 "사몽에피소드 보스들도 전수조사해서 규칙에 맞는 이미지로 나오는지 검토",
//  앞서 07:15Z "사몽에피소드 보스가 스킬사용시 다른몹그림").
//  원인: 엔진 throwAction 은 메아리 그림을 R54 frameSet(스토리 전투 프로필 = rc140 아틀라스 등)에서 고른다. 몸은 R380·R248·꼭두각시 덧씌우기가 바꿨어도
//   메아리 잔상(drawEnemy 안 bitmap)과 날아가는 메아리(r61Shot)는 옛 그림이 나왔다. 실측 sz115-RC-3 재판관: 몸 R380 reverse-m089, echo 동안 rc140 mb-ep1b03-atlas 34프레임.
//  고침(행동은 엔진 __STORYWORLD_FIELDS_R61__.activeAction): 행동이 없는 프레임마다 R462 가 기억한 '실제로 그린 몸 그림'(lookOf)을 적어 두고, echo 행동이 잡히면 a.path·a.frame 을 그 그림으로 바꾼다(한 번).
//   판정·피해·속도·타이밍 그대로. 몸 그림이 원래 그 그림이면 바꾸지 않는다. 끄기: localStorage['storyworld.r1218.echoLook']='{"on":false}'.
(()=>{'use strict';
if(window.__STORYWORLD_BOSS_ECHO_LOOK_R1218__)return;
const REV='R1218-echo-look-1',KEY='storyworld.r1218.echoLook';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={remembered:0,swapped:0,kept:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const body=new Map();// 적 id → 행동 없을 때 마지막으로 그린 몸 그림
function fix(e,a){if(!a||a.kind!=='echo'||a.r1218)return;const l=body.get(e.id);if(!l||!l.path)return;if(l.path===a.path){a.r1218='kept';stats.kept++;return;}
 let ok=true;try{ok=typeof readyImage!=='function'||!!readyImage(l.path)?.image;}catch(_){ok=false;}if(!ok)return;
 a.path=l.path;a.frame={...l.frame,path:l.path};a.r1218='swapped';stats.swapped++;}
// 몸 그림 기억은 그리기가 끝난 뒤(이번 프레임에 실제로 그린 것): R248·꼭두각시는 e.r1206Look, R380 등 frameFor 사슬 덧씌우기는 그 사슬 결과, 없으면 R462 lookOf.
//  R462 는 drawAssetFrame3 로 마지막에 그린 것을 잡으므로 echo 잔상이 그려진 프레임엔 옛 그림을 잡을 수 있다 → 행동이 없는 프레임만 기억한다.
//  가장 바깥에서 감싸야 R462·R248 이 이번 프레임에 남긴 값을 읽는다 → 모든 스크립트가 실린 뒤(load) 감싼다.
function look(e){const o=e.r1206Look;if(o&&o.path&&o.frame?.assetFrame)return {path:o.path,frame:o.frame};let f=null;try{f=window.__STORYWORLD_STORY_COMBAT_R54__?.frameFor?.(e,null);}catch(_){f=null;}if(f&&f.path&&f.assetFrame)return {path:f.path,frame:f};
 const l=window.__STORYWORLD_MOB_DEATH_R462__?.lookOf?.(e.id);return l&&l.path&&l.frame?{path:l.path,frame:l.frame}:null;}
function act(e){return window.__STORYWORLD_FIELDS_R61__?.activeAction?.(e)||window.__STORYWORLD_STORY_COMBAT_R54__?.activeAction?.(e)||null;}
function install(){if(typeof drawEnemy!=='function'||drawEnemy.__r1218)return false;const base=drawEnemy;
 const w=function(e,...r){let a=null;if(prefs.on&&e){try{a=act(e);if(a)fix(e,a);}catch(err){fail(err);}}
  try{return base.apply(this,[e,...r]);}finally{if(prefs.on&&e&&!a){try{if(!act(e)){const l=look(e);if(l){if(body.size>800&&!body.has(e.id))body.clear();body.set(e.id,l);stats.remembered++;}}}catch(err){fail(err);}}}};
 w.__r1218=true;drawEnemy=w;stats.installs=(stats.installs||0)+1;return true;}
if(typeof document==='undefined'||document.readyState==='complete')install();else window.addEventListener?.('load',()=>{try{install();}catch(err){fail(err);}});
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_BOSS_ECHO_LOOK_R1218__=Object.freeze({revision:REV,set,install,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
