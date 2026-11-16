// R1093 퀘스트가 있는 모든 맵: 그 퀘스트를 마쳐야 보스방 입장·다음 맵 이동 — 사용자 2026-11-16 00:19Z
//  "모든맵에 쿼스트가 있으면 그 퀘스트를 클리어해야 보스방입장이나 다음맵으로 넘어가게 해줘".
//  R1060(불면귀 두 지역의 단서 관문)을 R840 곁일이 있는 모든 지역으로 넓힌다. 퀘스트 = R840 곁일(인물에게 받기 → 조형물 부수기·몹 처치·이야기 듣기 → 단서 줍기).
//  · 막는 곳(E, interact):
//    R78 지역 — 문 단계의 보스 문 3.2칸 안(보스방 입장), 출구 단계의 출구 문(door-2) 3.2칸 안(다음 맵).
//    ep1a08(새빛병원 지하) — 병원 미로 진행의 같은 단계·문(hospitalDoorsB3 door-0·door-2). 단계가 없는 R78 밖 본편 맵이면 기억 표식 2.7칸 안.
//    사몽 구역 — 열린 문(포탈) 2.6칸 안(다음 기억).
//  · 먼저 맡기는 곳: last302·last303 보스 문은 R1060 이(꺼져 있으면 여기서), R790 관문(귀비탕 등)이 걸려 있으면 R790 이 먼저.
//  · 알림: 다음 할 일(인물에게 말 걸기 → 곁일 목표·처치 수 → 떨어진 단서 줍기)을 1.5초에 한 번. 목표 줄에 '퀘스트 0/1' 을 붙인다. 서사 글은 그대로.
//  · 소프트락 막기: 곁일이 안 보이면(무한 생존·협동·EGO·이미 끝낸 지역·R840 꺼짐) 안 막는다. 다음 대상(인물·조형물·떨어진 단서·남은 처치 대상)을 못 세웠으면 안 막는다.
//    길잡이·영화 모드는 막힐 지점에서 R840 곁일 걸음(late)을 먼저 하고, 곁일 걸음도 못 한 채 같은 관문에 30초(게임 시간) 넘게 막히면 풀어 준다(stats.released).
//  끄기: localStorage['storyworld.r1093.questGate']='{"on":false}'. 점검: window.__STORYWORLD_QUEST_GATE_R1093__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_QUEST_GATE_R1093__)return;
const REV='R1093-quest-gate-1',KEY='storyworld.r1093.questGate',DOOR_REACH=3.2,PORTAL_REACH=2.6,OBJ_REACH=2.7,TOAST_GAP=1.5,RELEASE=30,R1060_ZONES=new Set(['last302','last303']);
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={blocked:0,passed:0,toasts:0,hud:0,guided:0,released:0,errors:0};let lastError=null,lastToast=-1e9,stuck=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;
const here=()=>{try{return typeof room!=='undefined'?room:null;}catch(_){return null;}};
const Q=()=>window.__STORYWORLD_QUEST_R840__;
const autoRun=()=>{try{return typeof guide!=='undefined'&&!!guide;}catch(_){return false;}};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const zid=r=>r?.layer==='DREAM'?(typeof r.samongR103?.zone==='string'?r.samongR103.zone:''):(typeof r?.id==='string'?r.id:'');
// ep1a08(새빛병원 지하)은 R78 대신 병원 미로 진행(hospital-maze-progression)이 같은 단계·문(hospitalDoorsB3)을 쓴다.
const hosp=r=>!!r&&r.id==='ep1a08'&&r.layer==='STORY'&&!r.survivalR600&&!!r.exploration?.hospitalDoorsB3;
function phaseOf(r){try{if(hosp(r)){const s=window.__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__?.inspect?.()?.state;if(s?.phase)return s.phase;}return window.__STORYWORLD_WORLD_COMBAT_R78__?.state?.(r)?.phase||null;}catch(e){fail(e);return null;}}
const doorOf=(r,id)=>(hosp(r)?r.exploration.hospitalDoorsB3:r?.exploration?.worldR74?.doors)?.find?.(x=>x&&x.id===id)||null;
// 순수: 남은 퀘스트(0/1). q = R840 inspect(), d = 지역 정의. 다음 대상을 못 세웠으면 0(막지 않음).
function need(q,d){if(!q||!d||!d.clue||!q.visible||q.state==='done')return 0;
 if(q.state==='new')return q.npc?1:0;
 if(q.state==='on'){if(d.quest?.type==='kill')return (q.need|0)>(q.kills|0)?1:0;return Array.isArray(q.props)&&q.props.length?1:0;}
 if(q.state==='drop')return q.orb?1:0;return 0;}
function nextStep(q,d){if(q.state==='new')return (d.npc?.name||'인물')+'에게 말 걸기';if(q.state==='on')return (d.quest?.hud||'곁일 마치기')+(d.quest?.type==='kill'?' '+(q.kills|0)+'/'+(q.need|0):'');return '떨어진 단서 줍기';}
// 이 지역의 퀘스트 상태(남은 게 없거나 해당 없으면 null)
function info(r=here()){try{if(!prefs.on||!r||(r.layer!=='STORY'&&r.layer!=='DREAM'))return null;const z=zid(r),A=Q();if(!z||!A?.def)return null;const d=A.def(z);if(!d||(d.layer==='DREAM'?'DREAM':'STORY')!==r.layer)return null;
 const q=A.inspect?.();if(!q)return null;const left=need(q,d);return left?{z,d,q,left,total:1}:null;}catch(e){fail(e);return null;}}
// 이 지역의 진행 지점 종류: 'boss'(보스 문) · 'exit'(출구 문) · 'obj'(본편 맵 기억 표식) · 'portal'(사몽 문). 지금 그 단계가 아니면 null.
function stage(r){if(!r)return null;if(r.layer==='DREAM')return r.samongR103?.portal?'portal':null;const ph=phaseOf(r);if(ph==='door')return 'boss';if(ph==='exit')return 'exit';
 if(ph)return null;let done=false;try{done=typeof completed==='function'&&completed(r.id,'STORY')===true;}catch(_){}return !done&&!r.engaged&&Q()?.def?.(zid(r))?.free?'obj':null;}
function pointOf(r,k){if(k==='boss')return doorOf(r,hosp(r)?'door-0':r.exploration?.bossDoorId);if(k==='exit')return doorOf(r,'door-2');if(k==='portal')return r.samongR103?.portal||null;if(k==='obj')return r.objective||null;return null;}
const REACH={boss:DOOR_REACH,exit:DOOR_REACH,obj:OBJ_REACH,portal:PORTAL_REACH};
function deferred(r,k){if(k==='boss'&&r.layer==='STORY'&&R1060_ZONES.has(zid(r))){try{if(window.__STORYWORLD_CLUE_GATE_R1060__?.inspect?.()?.prefs?.on!==false)return true;}catch(e){fail(e);}}
 try{const n=window.__STORYWORLD_NPC_R790__?.inspect?.();if(n&&n.zone===r.id&&n.gate)return true;}catch(e){fail(e);}return false;}
// 지금 막아야 하는 관문(영웅이 그 지점 곁에 있을 때)
function blocks(){const r=here();const k=stage(r);if(!k)return null;const at=pointOf(r,k);let pl=null;try{pl=player;}catch(_){}
 if(!at||!pl||!Number.isFinite(at.x+at.y)||!(dist(pl,at)<REACH[k]))return null;if(deferred(r,k))return null;const g=info(r);return g?{...g,k}:null;}
const WHERE={boss:'보스 구역으로 넘어갈 수 있습니다',exit:'다음 지역으로 넘어갈 수 있습니다',obj:'기억 표식을 이을 수 있습니다',portal:'다음 기억으로 넘어갈 수 있습니다'};
const label=g=>'퀘스트 '+(g.total-g.left)+'/'+g.total;
let installed=false;function install(){if(installed)return;installed=true;
 if(typeof interact==='function'){const base=interact;interact=function(...a){try{if(started&&!modal&&!loading){const g=blocks();if(g){const t=T(),key=g.z+':'+g.k;
     if(autoRun()){if(!stuck||stuck.key!==key)stuck={key,since:t};if(t-stuck.since>RELEASE){stats.released++;stuck=null;stats.passed++;return base.apply(this,a);}}
     stats.blocked++;if(t-lastToast>=TOAST_GAP){lastToast=t;stats.toasts++;try{toast('이 지역의 퀘스트를 마쳐야 '+WHERE[g.k]+' · '+label(g)+' — 다음: '+nextStep(g.q,g.d),3.2);}catch(e){fail(e);}}return true;}}}catch(e){fail(e);}
   stats.passed++;return base.apply(this,a);};}
 // 길잡이·영화 모드: 진행 지점 단계에서 퀘스트가 남았으면 R840 곁일 걸음을 먼저(late — 들머리를 지났어도 되돌아감)
 if(typeof guideStep==='function'){const base=guideStep;guideStep=function(...a){try{if(autoRun()){const r=here(),k=stage(r);
    if(k&&!deferred(r,k)&&info(r)&&Q()?.guideStep?.(true)){stats.guided++;stuck=null;/* 곁일 걸음이 나아가는 동안은 안전판 시계를 다시 잰다 */return;}}}catch(e){fail(e);}return base.apply(this,a);};}
 if(typeof updateHUD==='function'){const base=updateHUD;updateHUD=function(...a){const r0=base.apply(this,a);try{hud();}catch(e){fail(e);}return r0;};}}
// 목표 줄: 진행 지점 전·그 단계 동안 '퀘스트 0/1' (R1060 지역의 보스 문 전은 R1060 의 '단서 0/1' 에 맡김)
function hud(){if(typeof started!=='undefined'&&started===false)return;const r=here();if(!r)return;let pre=false;
 if(r.layer==='DREAM')pre=!!r.samongR103;else{const ph=phaseOf(r);pre=ph?['route','rally','door','exit'].includes(ph):stage(r)==='obj';
  if(ph&&ph!=='exit'&&R1060_ZONES.has(zid(r))&&deferred(r,'boss'))return;}
 if(!pre)return;const g=info(r);if(!g)return;const el=typeof $==='function'?$('questText'):null;if(!el||String(el.textContent).includes(label(g)))return;
 el.textContent=String(el.textContent)+' · '+label(g)+'(마쳐야 '+(r.layer==='DREAM'?'다음 기억으로':'보스·다음 지역으로')+')';stats.hud++;}
let hudAt=-1e9;
if(typeof tick==='function'){const base=tick;tick=function(...a){const r0=base.apply(this,a);try{install();const t=T();if(t-hudAt>=.25){hudAt=t;hud();}}catch(e){fail(e);}return r0;};}
window.__STORYWORLD_QUEST_GATE_R1093__=Object.freeze({rev:REV,pure:Object.freeze({need,nextStep}),install,
 inspect:()=>{const r=here(),g=info(r);return {rev:REV,prefs:{...prefs},zone:r?zid(r):null,layer:r?.layer||null,stage:stage(r),left:g?g.left:0,state:g?g.q.state:null,installed,stats:{...stats},lastError,browserVerified:false};},
 set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}});
})();
