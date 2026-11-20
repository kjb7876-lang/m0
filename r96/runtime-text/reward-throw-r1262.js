/* R1262 보스·몹이 보물상자·미카엘라를 던지지 않게 — 사용자 2026-11-20 "7대죄 보스 모두 이미지 전수조사 검수 검토 디버깅개선".
 *  전수(헤드리스 qa/r1262/sin-census.mjs·throwprobe.mjs)에서 찾은 결함: R61 조형물 던지기(propFor)는 방 꾸밈 조형물(R59 scenery59) 그림이
 *  아직 안 실렸거나 없으면 room.props 에서 가장 가까운 것 넷 가운데 하나를 든다. 그 안에 R103 보물상자(R712 픽셀 상자 그림)·미카엘라 NPC 가 있어
 *  색욕(ep1b05)·교만(ep1b08) 보스가 보물상자를 집어 던졌다. 보스면 R114 adoptThrow 가 던진 조형물을 숨겨(visible=false)
 *  보물상자가 그 지역을 나갈 때까지 사라졌다(throw-reward.mjs ep1b05:b05-boss 재현).
 *  고친 것(그림 경로만 — 판정·피해·차례·쿨다운은 그대로):
 *   · 보스: R114 adoptThrow 가 먼저 묻는 R471 pick 을 감싼다. 정본 물건(R471)이 없고 든 것이 보상·NPC 조형물이면 같은 방의 다른 보통 조형물
 *     (가장 가까운 것, 문·벽·보상 빼고) → 지역 꾸밈 그림(R59 assetFor) → 그 몹의 던지기 자세 그림(R61 echo 그림) 순서로 바꿔 돌려준다.
 *     pick 결과가 있으면 R114 는 a.prop=null 로 두어 아무것도 숨기지 않는다.
 *   · 몹(R114 가 맡지 않음): tickEnemies 뒤 아직 날아가지 않은 조형물 던지기의 그림을 같은 순서로 바꾼다.
 *  끄기: localStorage['storyworld.r1262.rewardThrow']='{"on":false}'. 점검: window.__STORYWORLD_REWARD_THROW_R1262__.inspect() */
(()=>{'use strict';
if(window.__STORYWORLD_REWARD_THROW_R1262__)return;
const REV='R1262-1',KEY='storyworld.r1262.rewardThrow';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={bossSwaps:0,mobSwaps:0,byPath:{},none:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const REWARD=/assets\/r712\/chest|assets\/r103\/chest|hero_direction337\/michaela\//;
const NOGO=/door|wall|gate|stair|문|벽|계단/i;
function isReward(p){if(!p||typeof p!=='object')return false;return !!(p.growthR103||p.samongR103||REWARD.test(String(p.path||'')));}
const ready=p=>{try{return !!(p&&typeof readyImage==='function'&&readyImage(p)?.image);}catch(_){return false;}};
const R=()=>{try{return typeof room==='object'&&room?room:null;}catch(_){return null;}};
// 지금 든 조형물이 보상·NPC 인가(경로 또는 같은 방 조형물 id·자리로)
function heldReward(a){if(!a||a.kind!=='prop')return false;if(REWARD.test(String(a.path||''))||REWARD.test(String(a.prop?.path||'')))return true;
 const r=R(),P=a.prop;if(!r||!P)return false;for(const p of r.props||[]){if(!p||p.path!==P.path)continue;if(P.id!=null?p.id===P.id:Math.hypot(p.x-P.x,p.y-P.y)<.05)return isReward(p);}return false;}
function replacement(e,a){const r=R();if(!r)return null;const pools=[r.exploration?.scenery59?.props||[],r.props||[]];let best=null,bd=Infinity;
 for(const list of pools)for(const p of list){if(!p||isReward(p)||p===e||!p.path||p.visible===false||p.destroyed||p.disabled||p.terrainWall||p.r80PresentationOnly||p.r114Hidden)continue;
  if(NOGO.test(String(p.visualHospitalFrame||p.kind||p.name||'')))continue;if(!ready(p.path))continue;const d=Math.hypot((p.x||0)-(e?.x||0),(p.y||0)-(e?.y||0));if(d<bd){bd=d;best=p;}}
 if(best)return {path:best.path,height:Number(best.height)||null,prop:best,from:'room'};
 let s=null;try{s=window.__STORYWORLD_SCENERY_R59__?.assetFor?.(r.id,0)||null;}catch(_){s=null;}if(s&&!REWARD.test(s)&&ready(s))return {path:s,height:null,prop:null,from:'scenery'};
 const echo=a?.frames?.[2]?.path||null;if(echo&&ready(echo))return {path:echo,height:null,prop:null,from:'echo'};
 return null;}
// 보스: R471 pick 감싸기(R114 adoptThrow 가 먼저 묻는다)
function wrapPick(){const C=window.__STORYWORLD_CANON_THROW_R471__;if(!C||typeof C.pick!=='function'||C.__r1262)return !!C?.__r1262;const base=C.pick;
 window.__STORYWORLD_CANON_THROW_R471__=Object.freeze({...C,__r1262:true,pick(e,a){const out=base.call(this,e,a);if(out||!prefs.on)return out;
  try{if(!heldReward(a))return null;const x=replacement(e,a);if(!x){stats.none++;return null;}stats.bossSwaps++;stats.byPath[x.path]=(stats.byPath[x.path]||0)+1;
   return {key:'r1262-'+x.from,label:'보상 조형물 대신',path:x.path,height:x.height||(Number(x.prop?.height)||64),revision:REV};}catch(err){fail(err);return null;}}});return true;}
wrapPick();
// 몹: 준비 중인 조형물 던지기 그림 바꾸기(보스는 R114 가 이미 바꿈 — pick 결과가 a.path 에 들어가 heldReward 가 false)
function fixMobs(){const r=R();if(!r||!prefs.on)return;for(const e of r.enemies||[]){const a=e?.r61Action;if(!a||a.kind!=='prop'||a.released||a.r1262||a.cancelled)continue;
 if(!heldReward(a))continue;const x=replacement(e,a);a.r1262=true;if(!x){stats.none++;continue;}a.path=x.path;a.prop=x.prop?{path:x.prop.path,x:x.prop.x,y:x.prop.y,id:x.prop.id??null,frame:null}:null;a.frame=null;
 stats.mobSwaps++;stats.byPath[x.path]=(stats.byPath[x.path]||0)+1;}}
if(typeof tickEnemies==='function'){const base=tickEnemies;tickEnemies=function(...args){const out=base.apply(this,args);try{fixMobs();}catch(err){fail(err);}return out;};}
function set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_REWARD_THROW_R1262__=Object.freeze({revision:REV,isReward,replacement,set,inspect:()=>({revision:REV,prefs:{...prefs},pickWrapped:!!window.__STORYWORLD_CANON_THROW_R471__?.__r1262,stats:{...stats,byPath:{...stats.byPath}},lastError})});
})();
