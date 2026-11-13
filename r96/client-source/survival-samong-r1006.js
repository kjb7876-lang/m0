// R1006 — 무한생존에 사몽 16장 잇기(사용자 2026-11-13 06:58Z "무한생존 사몽역행 미카엘라 엔딩까지 구현", 08:25Z "영화·스토리·무한생존 기본은 모두 공유, 플레이 방식만 상이").
//  · 스토리 56지역 뒤에 사몽 장(samong-r103.js EP: P, S-01~S-07, 사몽역행 RA~RG, 미카엘라 M)을 생존 단계로 붙인다. 마지막 장 다음은 지금처럼 처음 지역(회차 +1).
//  · 내용은 스토리 모드 사몽 것을 그대로 쓴다: 지역 그림 = EP.host, 몹 = EP.mobs 기증 배우(이름 EP.mobName), 보스 = EP.boss.donor(이름 EP.boss.name),
//    자막 = R103 CUES 원문 구간(보스 전 = 생존·미로·도착 s·m·a, 보스 = 등장 b). 새 글·새 그림 없음.
//  · 생존 흐름(물결 → 보스 → 정화)에 맞게 단순화: 사몽 666 처치·손전등 미로·상승 보스맵·R115 구역 목표(단서·풀기)·이동 잠금·보스 패턴(ground/sides/sky/rain)은 쓰지 않는다.
//    P(서문)는 스토리처럼 보스만 — 서문·문턱 자막은 보스와 함께 흐른다.
//  · M(미카엘라)은 처치하는 보스로 내지 않는다(사용자 결정: 처치하지 않음). M 몹 물결을 다 잡은 자리에서 R1010(결전·엔딩)의
//    window.__STORYWORLD_SURVIVAL_FINALE_R1010__.begin({stageId,key:'M',loop,kills,i}) 를 한 번 부르고, true 면 그쪽이 이어 간다(R600 단계 'handoff', 진행 멈춤).
//    R1010 이 없으면 미카엘라 없이 정화 → 2회차.
//  · 끄기: localStorage storyworld.r1006.samong {"on":false} → 56지역만(예전 그대로).
(()=>{'use strict';
if(window.__STORYWORLD_SURVIVAL_SAMONG_R1006__)return;
const REV='R1006-survival-samong-1',PREFIX='sm1006:',KEY='storyworld.r1006.samong';
const stats={stages:0,rosters:0,fallbacks:0,handoffs:0,handoffErrors:0,hud:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s&&s.on===false)on=false;}catch(_){}
const SM=()=>window.__STORYWORLD_SAMONG_R103__||null;
const EPS=()=>{const e=SM()?.episodes;return Array.isArray(e)?e:[];};

// ── 순수 함수(QA 가 CPU 에서 부른다) ──
function ids(eps){return Array.isArray(eps)?eps.filter(e=>e&&e.key).map(e=>PREFIX+e.key):[];}
// 원문 구간 → 자막 장면: 같은 구간의 연속 문단은 한 장면(화자 = 그 구간 첫 문단 화자). R600 narrPlay 형식 {text,narrator}.
function scenesFor(ep,cueRows){const empty={pre:[],post:[]};if(!ep||!ep.key)return empty;
 const part=p=>{try{const rows=cueRows(ep.key,p)||[];if(!rows.length)return[];return[{text:rows.map(r=>String(r.text)).join('\n\n'),narrator:String(rows[0].narrator||'')}];}catch(_){return[];}};
 const s=part('s'),m=part('m'),a=part('a'),b=part('b');
 if(ep.key==='M')return {pre:s,post:[]};/* M1 이후(대면·매듭·엔딩)는 R1010 */
 if(!(ep.mobs&&ep.mobs.length))return {pre:[],post:[...s,...m,...a,...b]};/* 보스만 있는 장(P): 서사는 보스와 함께 */
 return {pre:[...s,...m,...a],post:b};}
// 기증 배우 찾기: 스토리 층 → 사몽 층(R103 donor 와 같은 규칙).
function findDonor(makeNative,row){if(!Array.isArray(row))return null;for(const L of ['STORY','DREAM']){try{const r=makeNative(row[0],L),list=(r&&r.enemies)||[];
  const e=list.find(x=>x&&x.nativeId===row[1])||list.find(x=>x&&String(x.id||'').includes(row[1]));if(e&&e.profile)return e;}catch(_){}}return null;}
function rosterFor(ep,makeNative,baseRoster){let base=null;try{base=baseRoster(ep.host);}catch(_){}base=base||{normal:[],boss:null,mid:null,template:null};
 const out={normal:[],boss:null,mid:null,template:base.template,samongKey:ep.key,fallback:0},seen=new Set();
 const add=(e)=>{const k=String(e.nativeId||e.name);if(seen.has(k))return;seen.add(k);out.normal.push({...e,name:ep.mobName||e.name,boss:false,midboss:false});};
 if(ep.mobs&&ep.mobs.length){for(const row of ep.mobs){const e=findDonor(makeNative,row);if(e)add(e);}
  if(!out.normal.length){out.fallback++;for(const row of ep.guard||[]){const e=findDonor(makeNative,row);if(e)add(e);}}
  if(!out.normal.length){out.fallback++;for(const e of base.normal||[])add(e);}}
 let bs=findDonor(makeNative,ep.boss&&ep.boss.donor);if(!bs){out.fallback++;bs=base.boss||base.mid||null;}
 const boss=bs?{...bs,name:(ep.boss&&ep.boss.name)||bs.name,boss:true,midboss:false}:null;
 if(ep.key==='M')out.finaleBoss=boss;else out.boss=boss;/* 미카엘라는 처치 보스로 내지 않는다 — R1010 이 쓸 템플릿만 둔다 */
 return out;}

// ── 단계 정의(R600 이 부른다) ──
const cache=new Map();
function stage(id){if(typeof id!=='string'||!id.startsWith(PREFIX))return null;const key=id.slice(PREFIX.length),ep=EPS().find(e=>e&&e.key===key);if(!ep)return null;
 if(cache.has(id))return cache.get(id);const sm=SM(),cr=(k,p)=>typeof sm?.cueRows==='function'?sm.cueRows(k,p):[],sc=scenesFor(ep,cr);
 const d=Object.freeze({key,host:ep.host,title:'사몽 · '+ep.title,chapter:ep.chapter,pre:sc.pre,post:sc.post,idle:(ep.mobs&&ep.mobs.length)?undefined:0,finale:key==='M',
  roster:(makeNative,baseRoster)=>{stats.rosters++;try{const r=rosterFor(ep,makeNative,baseRoster);stats.fallbacks+=r.fallback;return r;}catch(e){fail(e);return baseRoster(ep.host);}}});
 cache.set(id,d);return d;}
function handoff(id,info){const d=stage(id);if(!d||!d.finale)return false;const F=window.__STORYWORLD_SURVIVAL_FINALE_R1010__;if(!F||typeof F.begin!=='function')return false;
 let r=false;try{r=F.begin({stageId:id,key:d.key,loop:+(info&&info.loop)||0,kills:+(info&&info.kills)||0,i:+(info&&info.i)||0});}catch(e){stats.handoffErrors++;fail(e);return false;}
 if(r===true){stats.handoffs++;return true;}return false;}

// 엔진 화면 위쪽 지역 이름은 바탕 지역 것이 뜬다 → 사몽 단계 동안은 장 제목·부 이름으로 바꿔 보인다(글자만, 판정 없음).
function hudFix(){try{const Z=window.__STORYWORLD_SURVIVAL_R600__;if(!Z||!Z.active()||!Z.here())return;const d=stage(Z.state()?.id);if(!d)return;
 const set=(id,t)=>{const el=document.getElementById(id);if(el&&el.textContent!==t){el.textContent=t;stats.hud++;}};set('regionName',d.title);set('regionSub',d.chapter);}catch(e){fail(e);}}
try{if(typeof updateHUD==='function'){const base=updateHUD;updateHUD=function(...a){const r=base.apply(this,a);hudFix();return r;};}}catch(e){fail(e);}

window.__STORYWORLD_SURVIVAL_SAMONG_R1006__=Object.freeze({revision:REV,PREFIX,ids:()=>on?ids(EPS()):[],stage,handoff,
 pure:Object.freeze({ids,scenesFor,rosterFor,findDonor}),inspect:()=>({revision:REV,on,stats:{...stats},lastError})});
})();
