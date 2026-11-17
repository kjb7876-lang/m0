/* R112 몹 구성 (사용자 요청 2026-10-28 02:52 "몹구성도 구글드라이브 최신자료검토후 개선")
 * 제7부(파란불 아래의 사람들) murder01·murder02·murder03은 잡몹이 모두 murder04-e2 한 종(옥상 잔향 그림)이었다.
 * 교정본 본문에 나오는 단서에 맞춰, 이미 게임에 있는 제7부 잡몹 두 종(murder04-e1 공실 표기 잔재 그림,
 * murder04-e3 은폐기록 연결체 그림)을 섞는다.
 *  - murder01 윤하람: 젖은 도로·물에 번진 교정지 + 끊어지기 직전의 낮은 전자음 → 셋 중 하나를 비상벨 잔향(e1)으로.
 *  - murder02 장민재·새빛호텔: CCTV·지워진 7층 출입기록 → 셋 중 하나는 e1(지워진 출입기록), 다섯 중 하나는 e3(은폐기록).
 *  - murder03 옥상의 순환: 네 사람의 기억이 한 고리로 겹침 → e2·e1·e3를 차례로 돌린다.
 * R74 세계 괴물(유리 망령·뿌리 추적자, r74/monsters.png로 그려짐)은 그림 체계가 달라 건드리지 않는다.
 * 방 데이터(아이디·그림 경로·체력·공격력·전투 방식·수·웨이브·저장)는 전혀 바꾸지 않는다. 그리는 순간에만
 * 그림·동작 스트립·이름을 빌려 오고 바로 되돌린다(R81 원본 보존 검사·구역 수호 규칙 유지, 밸런스 그대로).
 * 어느 몹이 어떤 그림을 빌릴지는 몹 아이디 해시로 정해 저장·불러오기 뒤에도 같다.
 * 보스·중간보스·구역 수호(ward champion)는 건드리지 않는다. 새 그림이나 지어낸 지역·보스 설정은 없다.
 * Drive 2026-10-28 몹 자료(M001 v4/v5, M004 단일 포즈, M036 v7, M136 attack4, 중보스 배경위생본)는
 * 모두 HOLD·NOT GAME·후보 표기라 적용하지 않았다(docs/r112-mob-composition.md). */
(()=>{'use strict';
if(window.__STORYWORLD_MOBS_R112__||typeof makeRoom!=='function'||typeof actor3!=='function')return;
const REV='R112-mobs-2';
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r112.mobs';
let prefs={mix:true},lastError=null,failures=0;
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.mix==='boolean')prefs.mix=s.mix;}catch(_){}
const stats={rooms:0,draws:0};
const DONOR_REGION='murder04';
// cycle: 몹 아이디 해시 h에 대해 cycle[h%len]이 null이면 원래 그림, 아니면 [빌려 올 nativeId, 이름]
const PLAN=Object.freeze({
 murder01:{cycle:[null,null,['murder04-e1','끊어지기 직전의 비상벨 잔향']]},
 murder02:{cycle:[null,['murder04-e1','지워진 7층 출입기록'],null,null,['murder04-e3','은폐기록 연결체'],['murder04-e1','지워진 7층 출입기록']]},
 murder03:{cycle:[null,['murder04-e1','공실 표기 잔재'],['murder04-e3','은폐기록 연결체']]}
});
const SWAP=['nativeId','path','profile','name'];
const donors=new Map(),picks=new Map();
const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,300);};
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const ordinary=e=>!!e&&!e.boss&&!e.midboss&&!e.persona&&!String(e.id||'').includes(':ward-champion')&&(typeof ordinaryActor3!=='function'||ordinaryActor3(e));
const zoneOf=e=>String(e?.id||'').split(':')[0];
function donor(nativeId){if(!donors.has(nativeId)){const e=makeBase(DONOR_REGION,'STORY').enemies.find(e=>e.nativeId===nativeId&&ordinary(e));if(!e)throw Error('R112 원본 몹 누락: '+nativeId);donors.set(nativeId,{nativeId:e.nativeId,path:e.path,profile:e.profile});}return donors.get(nativeId);}
function prepare(id){const plan=PLAN[id],def=regionById?.[id];if(!plan||!def)return;const paths=new Set(def.paths||[]);
 for(const row of plan.cycle){if(!row)continue;const d=donor(row[0]);if(d.path)paths.add(d.path);for(const f of Object.values(d.profile?.frames||{}))if(f?.path)paths.add(f.path);}
 for(const p of paths)if(!(def.paths||[]).includes(p)&&typeof register==='function')register(p,'image','StoryWorld R112 몹 구성 · '+id);def.paths=[...paths];}
// 그릴 몹이면 빌려 올 [원본 nativeId, 이름]을, 아니면 null을 돌려준다.
function pick(e){if(!prefs.mix||!e||e.nativeId!=='murder04-e2')return null;const plan=PLAN[zoneOf(e)];if(!plan)return null;
 if(!ordinary(e)||/:r74-|:r40-/.test(String(e.id))||e.name==='뿌리 추적자')return null;
 if(!picks.has(e.id))picks.set(e.id,plan.cycle[hash(e.id)%plan.cycle.length]);return picks.get(e.id);}
function view(e){const row=pick(e);if(!row)return null;const d=donor(row[0]),n=String(e.name||'').match(/\s(\d+)$/);
 return{nativeId:d.nativeId,path:d.path,profile:d.profile,name:row[1]+(n?' '+n[1]:'')};}
const makeBase=makeRoom;
makeRoom=function(id,l){try{if(PLAN[id])prepare(id);}catch(e){fail(e);}const r=makeBase(id,l);if(PLAN[id])stats.rooms++;return r;};
const compileBase=compileWorld;
compileWorld=function(...a){donors.clear();picks.clear();const out=compileBase.apply(this,a);try{for(const id of Object.keys(PLAN))prepare(id);}catch(e){fail(e);}return out;};
const enterBase=enterRegion;
enterRegion=function(id,...a){try{if(PLAN[id])prepare(id);}catch(e){fail(e);}return enterBase.call(this,id,...a);};
if(typeof drawEnemy==='function'){const drawBase=drawEnemy;
 drawEnemy=function(e,...a){let v=null;try{v=view(e);}catch(x){fail(x);}if(!v)return drawBase.call(this,e,...a);
  const keep={};for(const k of SWAP)keep[k]=e[k];Object.assign(e,v);stats.draws++;
  try{return drawBase.call(this,e,...a);}finally{for(const k of SWAP)e[k]=keep[k];}};}
function set(patch={}){if(typeof patch.mix==='boolean')prefs.mix=patch.mix;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_MOBS_R112__=Object.freeze({revision:REV,plan:PLAN,set,view,prefs:()=>({...prefs}),stats:()=>({...stats,failures,lastError})});
})();
