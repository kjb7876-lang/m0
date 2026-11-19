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
//    ④ R81 지역 수호자('중간보스 · ' 앞말이 붙은 일반몹 — R380 이름 정규식이 앞말 때문에 못 맞춤): 앞말 뺀 이름으로 R380 에 다시 물어 같은 채택 그림(cult05 'ID 배양 점액체').
//  · 보스·중간보스(e.boss·e.midboss, R1224·R1218 몫)·안정화 집행체(R1226 몫)·탑·소환진은 건드리지 않는다. 사몽 에피소드 -M-·-P- 판 Dots 그림(R1187 DU-10·11)도 그대로.
//  · 끄기: localStorage['storyworld.r1233.restore']='{"on":false}'. API window.__STORYWORLD_MOB_ART_RESTORE_R1233__.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_ART_RESTORE_R1233__)return;
const REV='R1233-restore-6',KEY='storyworld.r1233.restore',INDEX='assets/r380/mobs/index.json';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={shade:0,rows:0,ward:0,frames:0,installs:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
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
// ④ R81 지역 수호자(일반몹 그림을 키운 것, 이름 앞에 '중간보스 · ' — e.midboss 아님): R380 줄 이름 정규식('^ID 배양 점액체' 등)이 앞말 때문에 못 맞춰
//    R248 임시 후보 시트(cult05 수호자 → R410 상자머리 m056)로 떨어졌다. 앞말 뺀 이름의 사본으로 R380 본래 assign 에 물어 그 줄(층·지역·slot 조건 그대로)을 쓴다.
//    사본만 묻고 몹 자신의 이름·상태는 건드리지 않는다. 3초마다·이름·층·방이 바뀌면 다시 묻는다(R200 이 늦게 읽혀도 따라감).
let r380Base=null;
const ward=e=>prefs.on&&!!e&&e.wardChampionR81===true&&!e.boss&&!e.midboss&&!e.hero&&!e.r170Tower&&!e.r251Circle&&/^(중간보스|준보스)\s*·/.test(String(e.name||''));
function wardRow(e){if(!ward(e)||!r380Base)return null;let k='';try{k=String(e.name)+'|'+(dream()?'D':'S')+'|'+String(room?.id||'')+'|'+String(player?.hero||'')+'|'+Math.floor(Date.now()/3000);}catch(_){k=String(e.name);}
 if(e.r1233WardK===k)return e.r1233WardRow||null;let r=null;
 try{const c={...e,name:baseName(e.name)};for(const f of ['r380Checked','r380Mob','r380Renamed','r389Renamed','r389From'])delete c[f];r=r380Base.fn.call(r380Base.self,c)||null;}catch(err){fail(err);}
 e.r1233WardK=k;e.r1233WardRow=r;return r;}
function pick(e){const s=shadeOf(e);if(s)return {kind:'shade',row:s};const r=rowOf(e);if(r)return {kind:'r380',row:r};const w=wardRow(e);return w?{kind:'ward',row:w}:null;}
function installAssign(){const A=window.__STORYWORLD_APPROVED_MOBS_R380__;if(!A||A.__r1233)return !!A;
 const base=A.assign;r380Base={fn:base,self:A};window.__STORYWORLD_APPROVED_MOBS_R380__=Object.freeze({...A,__r1233:true,assign(e){const own=base.call(this,e);if(own)return own;try{const p=pick(e);if(p){stats[p.kind==='shade'?'shade':p.kind==='ward'?'ward':'rows']++;return p.row;}}catch(err){fail(err);}return own;}});stats.installs++;return true;}
function installFrame(){const S=window.__STORYWORLD_STORY_COMBAT_R54__,A=window.__STORYWORLD_APPROVED_MOBS_R380__;if(!S||typeof S.frameFor!=='function'||!A?.frameOf)return false;if(S.__r1233)return true;
 const base=S.frameFor;window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r1233:true,frameFor(e,f){try{if(!shadeOf(e)){const r=rowOf(e)||wardRow(e);if(r){let own=null;try{const A2=window.__STORYWORLD_APPROVED_MOBS_R380__;own=A2.assign.call(A2,e);}catch(_){}
  if(own===r){const im=typeof readyImage==='function'?readyImage(r.path):null;if(im?.image||im===true){stats.frames++;return A.frameOf(e,r,r.id);}if(!im&&typeof ensureImages==='function')Promise.resolve(ensureImages([r.path])).catch(()=>{});}}}}catch(err){fail(err);}return base.call(this,e,f);}});stats.installs++;return true;}
function install(){try{if(!solo())return;installAssign();installFrame();}catch(e){fail(e);}}
try{if(typeof document!=='undefined'&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();}catch(e){fail(e);}
try{setInterval(install,1000);}catch(e){fail(e);}
// ③ 같은 지역 테마 그림 시트(scripts/r1233-mob-sheets.py, assets/r1233/mobs/index.json) — R248 시트 표의 그 줄에 path·body 만 얹는다(R290·R410 과 같은 방식, 이름이 같을 때만).
//    피리 고블린(last305): R410 상자머리 인형 후보 → (처음) 숲 고블린 그림 잿빛 청록 임시본 → (지금) Dots RC42 빨간 두건·뼈 피리 고블린(숲 고블린 뿔 투구·갑옷과 구분). 표 R974/R1018 의 상자머리 위·아래 걷기 시트는
//    '그린 몸이 표의 대기 그림일 때만' 바꾸므로 path 가 바뀌면 저절로 안 쓰인다.
//    갈망의 도시짐승(ep1a10): R248 작은 도트 개 → Dots DR-02 v1(두건 쓴 도시 굶주린 짐승, 결과 루트 05_m019_v1.png sha 1b2f9979…) 을 scripts/r1233-dots-clean.py 로 손질(저알파 16 이하 지움·떨어진 발톱 33픽셀 지움).
const SHEETS=Object.freeze({m044:Object.freeze({path:'assets/r1233/mobs/m044.webp',body:194,name:'피리 고블린'}),m019:Object.freeze({path:'assets/r1233/mobs/m019.webp',body:180,name:'갈망의 도시짐승'}),
 // Dots CX-0177RC r1 ROUGH 1차(사용자 2026-11-19 "나머지후보그림 재생성닷츠와상호작용으로") — scripts/r1233-dots-clean.py 손질. body = 걷기 칸 몸 높이 중앙값.
 //  보류: m027·m029(Dots 메모 '사용자 채택 후보' 확인 전), m053(R1183/R1187 DU07 이 원래 경로로 고름 — 전역 교체 금지), m061(판 잘림·높이 121~255 수선 대기).
 m087:Object.freeze({path:'assets/r1233/mobs/m087.webp',body:187,name:'관람석의 시선'}),
 m072:Object.freeze({path:'assets/r1233/mobs/m072.webp',body:200,name:'규칙을 어기지 않는 마네킹'}),
 m025:Object.freeze({path:'assets/r1233/mobs/m025.webp',body:174,name:'끓어오르는 검은 소화액'}),
 m026:Object.freeze({path:'assets/r1233/mobs/m026.webp',body:203,name:'모든 면이 뒷면인 동전'}),
 m057:Object.freeze({path:'assets/r1233/mobs/m057.webp',body:186,name:'본능 추출 결정'}),
 m091:Object.freeze({path:'assets/r1233/mobs/m091.webp',body:194,name:'서로의 결말을 먹는 도시'}),
 m043:Object.freeze({path:'assets/r1233/mobs/m043.webp',body:148,name:'장미이슬 슬라임'}),
 m058:Object.freeze({path:'assets/r1233/mobs/m058.webp',body:192,name:'죄책감 압축결정'}),
 // 2차: 다시 일으켜 세워진 도전자(사몽 S-03, 석고 관절 인형)(사냥개 RC41 은 S-06-5 에서 헤드리스로 세 번 다 안 나와 확인 못 해 보류).
 m069:Object.freeze({path:'assets/r1233/mobs/m069.webp',body:204,name:'다시 일으켜 세워진 도전자'})});
const sheetOrig={},sheetApplied=[];
function applySheets(on){const D=window.__STORYWORLD_MOB_UNIQUE_R248_DATA__;if(!D||!D.sheets)return false;sheetApplied.length=0;
 for(const [id,a] of Object.entries(SHEETS)){const s=D.sheets[id];if(!s||s.name!==a.name)continue;try{if(!sheetOrig[id])sheetOrig[id]={path:s.path,body:s.body};
  if(on){s.path=a.path;s.body=a.body;sheetApplied.push(id);}else{if(sheetOrig[id].path===undefined)delete s.path;else s.path=sheetOrig[id].path;s.body=sheetOrig[id].body;}}catch(e){fail(e);}}return true;}
{const go=()=>{try{applySheets(prefs.on!==false);}catch(e){fail(e);}};/* R410(긴 줄 안)보다 뒤에 얹어야 하므로 모든 스크립트가 돈 뒤 */
 try{if(typeof document!=='undefined'&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',go,{once:true});else setTimeout(go,0);}catch(e){fail(e);}}
function set(p){prefs={...prefs,...(typeof p==='object'?p:{on:p!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}applySheets(prefs.on!==false);return {...prefs};}
window.__STORYWORLD_MOB_ART_RESTORE_R1233__=Object.freeze({revision:REV,map:MAP,pick,set,install,sheets:SHEETS,inspect:()=>({revision:REV,prefs:{...prefs},rows:Object.keys(rows),sheetApplied:[...sheetApplied],stats:{...stats},lastError})});
})();
