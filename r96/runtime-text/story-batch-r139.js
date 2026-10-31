// R139 — 스토리 서사를 맵당 한 번, 한 자리에서 몰아 보기(전투 흐름을 끊지 않게).
//  · 전투가 있는 맵(본편 안전지대 밖, 사몽 구역)에서 저절로 뜨는 서사(들어설 때 pre/구역 cue, 보스 문 앞, 보스 등장 등)는
//    바로 띄우지 않고 맵 대기열에 모은다. 그 서사가 끝나야 이어지던 진행(보스 문 열기·보스 시작·배너)은 곧바로 이어 준다.
//  · 맵을 정리한 순간(본편 post·사몽 구역 after 서사가 뜰 때) 모아 둔 서사를 그 서사 앞에 붙여 한 번에, 한 자리에서 보여 준다.
//  · 정리 서사 없이 포탈로 떠나면 떠나기 전에 모아 둔 서사를 먼저 보여 준다.
//  · 플레이어가 직접 여는 단서·진술·출석부·기억 기록은 그대로 바로 보인다. 안전지대(허브·쉼터)와 협동 모드도 그대로.
// 서사 원문·순서는 바꾸지 않는다. 모은 서사는 바로 '읽음'으로 기록해 같은 서사가 다시 뜨지 않게 한다.
//  E 로 연 서사, 뒤에 진행이 걸린 서사(보스 문·출구·성 방어·최종장)는 예전처럼 그 자리에서 바로 보인다.
(()=>{'use strict';
if(window.__STORYWORLD_STORY_BATCH_R139__)return;
const REV='R139-story-batch-1',KEY='storyworld.r139.story';
let prefs={batch:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={deferred:0,flushed:0,flushes:0,travelFlush:0,immediate:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
let queue=[],mapKey='',flushing=false,interacting=0;
const keyOfMap=()=>{try{return String(typeof layer!=='undefined'?layer:'')+':'+String(typeof zone!=='undefined'?zone:'')+':'+String(room?.samongR115?.zone||room?.exploration?.samongR115?.zone||'');}catch(_){return'';}};
const safe=()=>{try{return typeof safeRegion==='function'&&safeRegion();}catch(_){return false;}};
// 맵을 정리했을 때 뜨는 서사: 본편 post, 사몽 구역·장의 after(z), 엔딩.
const closing=s=>/:(post|after|z|ending|epilogue)(:|$)/.test(String(s?.key||''))||s?.part==='post';
// 플레이어가 직접 여는 기록(단서·진술·출석부·자르기·기록 패널): 바로 보인다.
const manual=s=>/:(clue|stmt|statement|book|cut|record|journal|all)(:|$)|:sm105:/i.test(String(s?.key||''))||!!s?.r105Record;
function active(){return prefs.batch&&solo()&&typeof started!=='undefined'&&started&&!safe();}
function sync(){const k=keyOfMap();if(k!==mapKey){mapKey=k;queue=[];}}
function later(fn){if(typeof fn!=='function')return;Promise.resolve().then(()=>{try{fn();}catch(e){fail(e);}});}
if(typeof playScenes==='function'){const base=playScenes;playScenes=function(scenes,done,...a){
 try{sync();const rows=Array.isArray(scenes)?scenes.filter(s=>s&&typeof s.text==='string'&&s.text.trim()):[];
  if(flushing||!active()||!rows.length){if(rows.length)stats.immediate++;return base.call(this,scenes,done,...a);}
  if(rows.some(manual)||interacting>0)return base.call(this,scenes,done,...a);
  // 진행이 서사 뒤에 걸린 것(보스 문·출구 문·성 방어·최종장 단계)은 그 자리에서 바로 보인다 — 읽음 기록으로 다음 단계를 여는 코드가 있다.
  //  사몽 구역 입장 cue·보스 등장(배너만 뒤따름)과, 뒤따르는 진행이 없는 본편 입장 서사만 모은다.
  if(typeof done==='function'&&!rows.every(s=>/^DREAM:(sz115:[^:]+:(cue|boss)|sm103:[^:]+:(s|m|a|b)):/.test(String(s.key||''))))return base.call(this,scenes,done,...a);
  if(rows.some(closing)){const all=dedupe([...queue,...rows]);queue=[];stats.flushes++;stats.flushed+=all.length;flushing=true;try{return base.call(this,all,done,...a);}finally{flushing=false;}}
  const seen=new Set(queue.map(s=>s.key));for(const s of rows)if(!s.key||!seen.has(s.key)){queue.push(s);if(s.key)seen.add(s.key);stats.deferred++;}
  try{if(typeof readScenes!=='undefined'&&readScenes?.add)for(const s of rows)if(s.key)readScenes.add(s.key);}catch(e){fail(e);}// 읽음으로 두어 같은 서사가 다시 뜨지 않고, 읽음을 보는 진행 코드도 그대로 간다
  later(done);return;}catch(e){fail(e);return base.call(this,scenes,done,...a);}};}
function dedupe(list){const seen=new Set(),out=[];for(const s of list){if(s.key&&seen.has(s.key))continue;if(s.key)seen.add(s.key);out.push(s);}return out;}
// 플레이어가 E 로 연 서사는 그 자리에서 바로 보인다.
if(typeof interact==='function'){const base=interact;interact=function(...a){interacting++;try{return base.apply(this,a);}finally{interacting--;}};}
// 정리 서사 없이 떠나면(포탈) 떠나기 전에 모아 둔 서사를 먼저 보여 준다.
if(typeof travel==='function'){const base=travel;travel=async function(...a){try{sync();if(queue.length&&active()&&typeof playScenes==='function'){const all=queue;queue=[];stats.travelFlush++;stats.flushed+=all.length;await new Promise(res=>{flushing=true;try{playScenes(all,res);}finally{flushing=false;}});}}catch(e){fail(e);}return base.apply(this,a);};}
function set(k,v){prefs[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
// R169: 모아 둔 서사를 전투 중 '기억 쪽지'로 떨어뜨려 줍게 한다(play-r169). 주운 쪽지는 대기열에서 빠져 정리 때 다시 뜨지 않는다.
function take(key){const i=queue.findIndex(s=>s.key===key);return i<0?null:queue.splice(i,1)[0];}
window.__STORYWORLD_STORY_BATCH_R139__=Object.freeze({revision:REV,set,queued:()=>queue.map(s=>s.key),pending:()=>{sync();return active()?queue.slice():[];},take,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},queued:queue.length,map:mapKey,lastError})});
})();
