/* R463 7대죄 보스 그림 한 형태·한 크기 — 사용자 2026-11-09 12:43Z "7대죄 보스들 이미지 잘린거 나오거나 배경처리 안된거나 보스크기가 달라지는문제
 *  인간형이었다가 악마형으로 변하는 문제 등 이미지 전수조사해서 일관성있도록 이미지 버그없도록 개선".
 *  전수조사(헤드리스, 3D 기록기 명령 단위, 나태 b02·질투 b03·탐식 b04·색욕 b05·분노 b07·교만 b08)에서 찾은 원인:
 *   ① 엔진 보스는 12초마다 공격 패턴 단계(e.phase 0→1→2→0)를 돌리는데, 그림도 그 단계의 원본 그림(사람 → 껍데기 → 악마)을 따라가
 *      싸우는 동안 인간형↔악마형이 몇 번이고 오갔다. 공격 순간 잡아 둔 프레임 사본은 다른 단계 그림을 들고 있어 대기와 공격이 서로 다른 인물로 섞였다.
 *   ② 대기·공격·키포즈가 바뀔 때마다 R425 크기 띠(영웅 키의 1.9~2.3배) 안에서 그림마다 다른 배율로 그려져 몸 키가 −23%~+25% 튀었다.
 *   ③ 분노 보스(R104 청소부 키포즈)가 공격 준비할 때 R114 가 옛 그림에서 손·털째 네모로 오린 빗자루 조각을 손에 겹쳐 그렸다(잘린 그림).
 *  고친 것(그림만 — 판정·체력·패턴 순환·저장은 그대로, 새 그림 없음):
 *   ① 그리는 동안만 그림 단계를 0(서사 첫 모습, 사람)으로 묶고, 다른 단계·옛 공용 동작 그림 경로를 0단계의 대기/공격 그림으로 바꿔 읽는다.
 *      R104 키포즈(분노·교만)와 R380 검수 시트(나태)는 그 위에서 그대로 쓰인다. 광폭화(R205)는 같은 모습으로 2배만 커진다.
 *   ② 보스마다 그림 무리(원본 정규화 그림·R104 키포즈·R380 시트)의 '보이는 키'를 원본에서 재 두고(sin-boss-art-r463-data.js),
 *      R425 크기 맞추기가 그 값으로 영웅 키의 2.1배(광폭화 4.2배)에 정확히 맞추게 한다 — 자세(웅크림 등)의 높낮이는 남고 그림이 바뀌어도 몸 키는 그대로.
 *   ③ 분노 보스는 R114 무기(빗자루 조각) 대신 원래 규칙대로 방 안 조형물을 던진다. 탐식(프라이팬)·색욕(핸드백)은 0단계 그림에서 오린 것이라 그대로.
 *  맘몬(b06·b06b)은 Codex 담당이라 손대지 않는다. 끄기: localStorage['storyworld.r463.sinboss']='{"form":false}' / '{"size":false}' / '{"weapon":false}'. */
(()=>{'use strict';
if(window.__STORYWORLD_SIN_BOSS_ART_R463__)return;
const REV='R463-1',KEY='storyworld.r463.sinboss',DATA=window.__STORYWORLD_SIN_BOSS_ART_R463_DATA__||{};
const DEF={form:true,size:true,weapon:true},BOSS_K=2.1;
let prefs={...DEF};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEF))if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={draws:0,pinned:0,remapped:0,waiting:0,locks:0,unknown:0,weaponOff:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const norm=p=>{const s=String(p||'').split('#')[0];const i=s.lastIndexOf('assets/');return i>=0?s.slice(i):s.replace(/^\.\//,'');};
const roomId=()=>{try{return typeof room==='object'&&room?String(room.id||''):'';}catch(_){return '';}};
// 이 지역의 그 보스일 때만(같은 id 를 빌려 쓰는 다른 지역·사몽 복제는 건드리지 않는다).
function dataOf(e){const d=e&&DATA[e.nativeId];return d&&d.zone===roomId()?d:null;}
let cur=null,curD=null,curKP=null;
// R104 키포즈를 쓰는 보스(분노·교만): 맞을 때 번쩍임 등 경로로 그리는 sprite() 가 옛 정규화 그림 경로를 받으면(번쩍임 색 입힘 캐시도 그 경로로 잡힘)
// 같은 자세의 키포즈 경로로 바꿔 넘긴다 — 공격 계열은 타격(p2), 나머지는 서기(p4).
function keyPoses(e){try{const K=window.__STORYWORLD_BOSS_KEYPOSES_R104__;if(!K?.enabled||!(K.phases?.[e.nativeId]||[]).includes(0))return null;const f=K.framesFor(e.nativeId);
 if(!f||f.length<4||typeof readyImage!=='function')return null;for(const x of f)if(!readyImage(x.path))return null;return f;}catch(err){fail(err);return null;}}
function spritePath(p){if(!curKP||typeof p!=='string')return p;const n=norm(p);if(!/actors-normalized|actors\/v3/.test(n)||!(n in curD.vis))return p;stats.keyPose=(stats.keyPose||0)+1;return curKP[/attack|strike|cast/i.test(n)?1:3].path;}
if(typeof sprite==='function'){const base=sprite;sprite=function(p,...a){return base.call(this,prefs.form?spritePath(p):p,...a);};}
function want(p){if(!cur||!curD||typeof p!=='string')return null;const k=curD.remap[norm(p)];return k?curD[k]:null;}
if(typeof readyImage==='function'){const base=readyImage;readyImage=function(p,...a){const to=prefs.form?want(p):null;
  if(to){const r=base.call(this,to,...a);if(r){stats.remapped++;return r;}stats.waiting++;try{if(typeof addImage==='function')addImage(to);}catch(err){fail(err);}}
  return base.call(this,p,...a);};}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){const d=prefs.form?dataOf(e):null;if(!d)return base.call(this,e,...a);
  stats.draws++;const prev=cur,prevD=curD,ph=e.phase,path=e.path,pin=Number.isFinite(ph)&&ph!==0,swap=path!==d.idle&&!!d.remap[norm(path)];
  const prevKP=curKP;cur=e;curD=d;curKP=keyPoses(e);if(pin){e.phase=0;stats.pinned++;}if(swap)e.path=d.idle;
  try{return base.call(this,e,...a);}finally{cur=prev;curD=prevD;curKP=prevKP;if(pin&&e.phase===0)e.phase=ph;if(swap&&e.path===d.idle)e.path=path;}};}
// R425 가 몸 그림 명령 b 를 재기 직전에 묻는다: 그 그림 무리의 보이는 키 비율과 한 점짜리 띠.
function sizeLock(e,b,K){if(!prefs.size)return null;const d=dataOf(e);if(!d||!b||!Array.isArray(b.sourceRect))return null;
 const v=d.vis[norm(b.sourcePath||b.image?.__path||b.image?.src)],h=+b.sourceRect[3];if(!(v>0&&h>0)){stats.unknown++;stats.lastUnknown=String(b.sourcePath||'').slice(-90);return null;}
 stats.locks++;const t=BOSS_K*(K||1);return {frac:Math.min(1,v/h),band:[t,t]};}
// 분노 보스: 옛 그림에서 오린 빗자루 조각 대신 조형물 던지기.
function weaponOff(e){if(!prefs.weapon||!e||e.nativeId!=='b07-boss'||!dataOf(e))return false;stats.weaponOff++;return true;}
function set(p={}){for(const k of Object.keys(DEF))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_SIN_BOSS_ART_R463__=Object.freeze({revision:REV,ids:Object.keys(DATA),BOSS_K,set,sizeLock,weaponOff,artFor:(id,k)=>DATA[id]?.[k]||null,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
