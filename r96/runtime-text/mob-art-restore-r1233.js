// R1233 임시로 얹은 몹 그림 걷어내기 — 사용자 2026-11-19 "임시로 얹은- 이거 모든맵 스토리모드 및 스토리사몽 사몽에피소드 점검해서 제대로 나오게 디버깅 적용".
//  원인(헤드리스 전수 r96/qa/r1233/census.mjs — 지역마다 R248 이름 시트를 켰을 때/껐을 때 drawEnemy 가 실제 그린 몸 그림):
//   R248 은 그림이 겹치는 이름에 임시 도트 시트를 붙였고 R290·R410 이 그 줄에 드라이브 '후보'(망토 인형·상자머리 인형 등)를 얹었다.
//   R248 은 R374·R375·R380(사용자 채택) 그림이 그 몹을 맡을 때만 물러나는데,
//    ① 사몽 잔영(R200, 구역 서사에 맞춘 그림)이 정해진 몹은 물러나지 않았고(S-05 '호외 신문의 밀고자 잔영' → 파란 망토 후보),
//    ② 채택 그림이 일부 몹(R380 slot)·한 층(STORY)에만 걸려 같은 이름 나머지는 후보로 남았다
//       (S-05 '찢긴 호외의 잔향' 1/3, S-01 '꿰맨 아기 인형' 도트 인형, 스토리 사몽 ep1a11 '거짓천국 근위천사' 상자머리 천사, ep1a10 '부정의 잔영' 망토).
//    (사몽 잔영 그림이 그 몹 이름의 것일 때만 ① — 이름이 바뀐 몹은 이웃 잔영 그림과 겹치므로 ② 의 이름 그림으로.)
//  · 고침(R1193 과 같은 길): R380 assign 을 감싼 객체로 바꿔 끼워 대상 몹이면 그 그림 줄을 돌려준다 → R248 이 물러난다.
//    ① 은 R200 frameFor 가 원래대로 잔영 그림을 그리고, ② 는 R54 frameFor 사슬 바깥에서 R380 frameOf 로 같은 이름의 채택 그림 줄을 그린다.
//    같은 이름 = 같은 몹이라 같은 그림(R248 규칙 "같은 몹의 변형은 같은 그림"). 판정·체력·피해·보상·이름·저장은 그대로(그림만).
//    ③ 같은 지역에 테마 그림이 이미 있는데 R410 이 엉뚱한 후보(상자머리 인형)를 얹은 몹: 마지막 길 '피리 고블린' → 같은 숲 고블린 그림을 피부색만 바꿔 시트로.
//  · 보스·중간보스(R1224·R1218 몫)·안정화 집행체(R1226 몫)·탑·소환진은 건드리지 않는다. 사몽 에피소드 -M-·-P- 판 Dots 그림(R1187 DU-10·11)도 그대로.
//  · 끄기: localStorage['storyworld.r1233.restore']='{"on":false}'. API window.__STORYWORLD_MOB_ART_RESTORE_R1233__.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_ART_RESTORE_R1233__)return;
const REV='R1233-restore-1',KEY='storyworld.r1233.restore',INDEX='assets/r380/mobs/index.json';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={shade:0,rows:0,frames:0,installs:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// ② [기본 이름, 어디서(samong: 사몽 에피소드 구역 키 정규식 / dream: 스토리 사몽 꿈 층), R380 표 줄 id]
const MAP=Object.freeze([
 ['찢긴 호외의 잔향',{samong:/(^|[^0-9])S-?05([^0-9]|$)/},'samong-s05-wraith-officer-v2'],
 ['꿰맨 아기 인형',{samong:/(^|[^0-9])S-?01([^0-9]|$)/},'r200-stitched-golem-v2'],
 ['거짓천국 근위천사',{dream:true},'false-heaven-guard-v1'],
 ['부정의 잔영',{dream:true},'samong-m066-v3'],
]);
const rows={};
if(typeof fetch==='function')fetch(INDEX).then(r=>r.ok?r.json():null).then(j=>{for(const m of j?.mobs||[])if(MAP.some(x=>x[2]===m.id))rows[m.id]=m;}).catch(fail);
const baseName=n=>String(n||'').replace(/^(중간보스|준보스)\s*·\s*/,'').replace(/\s*·\s*짙은 형상$/,'').replace(/\s*(후속 증원|증원|추격대|우두머리)$/,'').replace(/\s+\d+$/,'').trim();
const dream=()=>{try{return typeof layer==='string'&&layer==='DREAM';}catch(_){return false;}};
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
function zoneKey(){try{const x=room?.samongR103;return x?String(x.zone||'')+' '+String(room?.id||''):'';}catch(_){return '';}}
const skip=e=>!prefs.on||!e||e.boss||e.midboss||e.r170Tower||e.r251Circle||e.hero||/^중간보스|^준보스/.test(String(e.name||''));
// ① 사몽 잔영이 정해진 몹: R200 이 주는 잔영 줄
function shadeOf(e){if(skip(e)||!e.r200Shade)return null;try{const m=window.__STORYWORLD_SAMONG_SHADES_R200__?.assign?.(e);return m&&m.path&&baseName(m.name)===baseName(e.name)?m:null;}catch(err){fail(err);return null;}}/* 잔영 그림이 그 이름의 것일 때만(다른 덧씌우기가 이름을 바꾼 몹 — 예: '식탁의 마네킹 잔영' 그림인데 '꿰맨 아기 인형' — 은 이웃 그림 겹침이라 ② 로) */
// ② 같은 이름 채택 그림 줄
function rowOf(e){if(skip(e))return null;const b=baseName(e.r200OrigName&&!e.r200Shade?e.r200OrigName:e.name);const x=MAP.find(r=>r[0]===b);if(!x)return null;
 const w=x[1];if(w.samong){if(!e.samongR103||!w.samong.test(zoneKey()))return null;}else if(w.dream){if(!dream()||e.samongR103)return null;}
 return rows[x[2]]||null;}
function pick(e){const s=shadeOf(e);if(s)return {kind:'shade',row:s};const r=rowOf(e);return r?{kind:'r380',row:r}:null;}
function installAssign(){const A=window.__STORYWORLD_APPROVED_MOBS_R380__;if(!A||A.__r1233)return !!A;
 const base=A.assign;window.__STORYWORLD_APPROVED_MOBS_R380__=Object.freeze({...A,__r1233:true,assign(e){const own=base.call(this,e);if(own)return own;try{const p=pick(e);if(p){stats[p.kind==='shade'?'shade':'rows']++;return p.row;}}catch(err){fail(err);}return own;}});stats.installs++;return true;}
function installFrame(){const S=window.__STORYWORLD_STORY_COMBAT_R54__,A=window.__STORYWORLD_APPROVED_MOBS_R380__;if(!S||typeof S.frameFor!=='function'||!A?.frameOf)return false;if(S.__r1233)return true;
 const base=S.frameFor;window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r1233:true,frameFor(e,f){try{if(!shadeOf(e)){const r=rowOf(e);if(r){let own=null;try{const A2=window.__STORYWORLD_APPROVED_MOBS_R380__;own=A2.assign.call(A2,e);}catch(_){}
  if(own===r){const im=typeof readyImage==='function'?readyImage(r.path):null;if(im?.image||im===true){stats.frames++;return A.frameOf(e,r,r.id);}if(!im&&typeof ensureImages==='function')Promise.resolve(ensureImages([r.path])).catch(()=>{});}}}}catch(err){fail(err);}return base.call(this,e,f);}});stats.installs++;return true;}
function install(){try{if(!solo())return;installAssign();installFrame();}catch(e){fail(e);}}
try{if(typeof document!=='undefined'&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();}catch(e){fail(e);}
try{setInterval(install,1000);}catch(e){fail(e);}
// ③ 같은 지역 테마 그림 시트(scripts/r1233-mob-sheets.py, assets/r1233/mobs/index.json) — R248 시트 표의 그 줄에 path·body 만 얹는다(R290·R410 과 같은 방식, 이름이 같을 때만).
//    피리 고블린(last305): R410 상자머리 인형 후보 → 같은 숲의 고블린 그림을 잿빛 청록 피부로(숲 고블린과 구분). 표 R974/R1018 의 상자머리 위·아래 걷기 시트는
//    '그린 몸이 표의 대기 그림일 때만' 바꾸므로 path 가 바뀌면 저절로 안 쓰인다.
const SHEETS=Object.freeze({m044:Object.freeze({path:'assets/r1233/mobs/m044.webp',body:196,name:'피리 고블린'})});
const sheetOrig={},sheetApplied=[];
function applySheets(on){const D=window.__STORYWORLD_MOB_UNIQUE_R248_DATA__;if(!D||!D.sheets)return false;sheetApplied.length=0;
 for(const [id,a] of Object.entries(SHEETS)){const s=D.sheets[id];if(!s||s.name!==a.name)continue;try{if(!sheetOrig[id])sheetOrig[id]={path:s.path,body:s.body};
  if(on){s.path=a.path;s.body=a.body;sheetApplied.push(id);}else{if(sheetOrig[id].path===undefined)delete s.path;else s.path=sheetOrig[id].path;s.body=sheetOrig[id].body;}}catch(e){fail(e);}}return true;}
{const go=()=>{try{applySheets(prefs.on!==false);}catch(e){fail(e);}};/* R410(긴 줄 안)보다 뒤에 얹어야 하므로 모든 스크립트가 돈 뒤 */
 try{if(typeof document!=='undefined'&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',go,{once:true});else setTimeout(go,0);}catch(e){fail(e);}}
function set(p){prefs={...prefs,...(typeof p==='object'?p:{on:p!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}applySheets(prefs.on!==false);return {...prefs};}
window.__STORYWORLD_MOB_ART_RESTORE_R1233__=Object.freeze({revision:REV,map:MAP,pick,set,install,sheets:SHEETS,inspect:()=>({revision:REV,prefs:{...prefs},rows:Object.keys(rows),sheetApplied:[...sheetApplied],stats:{...stats},lastError})});
})();
