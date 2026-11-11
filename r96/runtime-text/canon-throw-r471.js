/* R471 칠죄 보스 던지기를 정본에 적힌 물건으로 (2026-11-09 야간, 서사 디테일 전투 연출 R450 개선안 5번 + 7번 일부).
 * 지금까지는 R61 propFor 가 방에서 가장 가까운 조형물을 들어 던졌다(나태의 집에서는 호텔 짐수레·보물상자).
 * R471 은 보스·중간보스의 조형물 차례에 정본이 말하는 물건을 정본 순서로, 방 가구를 건드리지 않고 보스 몸(등)에서 뽑아 던진다.
 *  - 나태(ep1b02): "쓰레기 산을 등에 붙인 … 더러운 휴지뭉치, 냉장고와 소파, 썩은 침대가 날아왔다."
 *      쓰레기 더미 → 냉장고 → 소파 → 썩은 침대(그림 없음, Dots CX-0058 대기 — bed.path 만 채우면 차례에 들어감)
 *  - 질투(ep1b03): "금이 간 안경을 쓰고 칼날과 유리 조각을 쏟아 냈다." → 금 간 거울(맞으면 R114 가 조각으로 터뜨림)
 * - 판정·피해·AI 차례·쿨다운은 그대로(R61·R114 가 정한 값). 그림 경로와 높이만 고른다. R114 adoptThrow 가 이 pick 을 먼저 묻는다.
 * - 그림은 이미 그 지역에 쓰이는 승인 자산(R80 ep1b02-refuse-heap·decayed-sofa·ep1b03-fractured-mirror, R138 녹슨 냉장고)만 쓴다.
 * 끄기: localStorage['storyworld.r471.canonThrow']='{"on":false}'
 */
(()=>{'use strict';
const REV='R471',PREF='storyworld.r471.canonThrow';
const S=(key,label,path,height,pending)=>Object.freeze(pending?{key,label,path,height,pending}:{key,label,path,height});
const ZONES=Object.freeze({
 ep1b02:Object.freeze({owners:Object.freeze(['b02-boss','mb-ep1b02']),sequence:Object.freeze([
  S('heap','더러운 휴지뭉치·쓰레기','assets/world-r80/r80-025.webp',74),
  S('fridge','냉장고','assets/r138/props/fridge.webp',66),
  S('sofa','소파','assets/world-r80/r80-024.webp',69),
  S('bed','썩은 침대',null,72,'Dots CX-0058 썩은 침대 대기')])}),
 ep1b03:Object.freeze({owners:Object.freeze(['b03-boss','mb-ep1b03']),sequence:Object.freeze([
  S('mirror','유리 조각(금 간 거울)','assets/world-r80/r80-026.webp',64)])})});
const stats={picks:0,byKey:{},skippedNotReady:0,refused:0,errors:0,lastError:null};
const count=new WeakMap();
// 던지기 차례(보스마다 몇 초에 한 번)에만 읽으므로 매번 읽어도 가볍다.
function on(){try{const v=JSON.parse(localStorage.getItem(PREF)||'null');return !(v&&v.on===false);}catch(_){return true;}}
function ready(p){try{return !!(p&&typeof readyImage==='function'&&readyImage(p)?.image);}catch(_){return false;}}
function curRoom(){try{return typeof room!=='undefined'?room:window.room;}catch(_){return null;}}
function pick(e,a){try{
  if(!e||!a||a.kind!=='prop')return null;const r=curRoom(),z=r&&ZONES[r.id];if(!z)return null;
  if(!z.owners.includes(String(e.nativeId||''))||e.r61Clone||e.r61CloneSource)return null;if(!on())return null;
  const seq=z.sequence,n=count.get(e)||0;
  for(let i=0;i<seq.length;i++){const s=seq[(n+i)%seq.length];if(!s.path)continue;if(!ready(s.path)){stats.skippedNotReady++;continue;}
   count.set(e,n+i+1);stats.picks++;stats.byKey[s.key]=(stats.byKey[s.key]||0)+1;return {key:s.key,label:s.label,path:s.path,height:s.height,zone:r.id,revision:REV};}
  stats.refused++;return null;
 }catch(err){stats.errors++;stats.lastError=String(err&&err.message||err);return null;}}
window.__STORYWORLD_CANON_THROW_R471__=Object.freeze({revision:REV,pick,
 inspect:()=>({revision:REV,on:on(),zones:Object.fromEntries(Object.entries(ZONES).map(([k,z])=>[k,{owners:[...z.owners],sequence:z.sequence.map(s=>({...s}))}])),stats:{...stats,byKey:{...stats.byKey}}})});
})();
