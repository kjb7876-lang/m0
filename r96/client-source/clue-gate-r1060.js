// R1060 불면귀 지역 단서 모아야 진행 — 사용자 2026-11-15 14:14Z "그맵 단서를 다모아야 게임지 진행되게".
//  last302(잠들지 못하는 마을)·last303(불면귀 결투)의 단서는 R840 곁일 단서 한 장씩(어부의 '실 끊긴 붉은 부적', 약방 아낙의 '안개 묻은 등롱 조각').
//  지금까지는 곁일이라 R78 진행을 막지 않았다 → 이 두 지역만 보스 문의 기억(R78 doorStory → 보스)이 단서를 주운 뒤에 열린다.
//  · 막는 곳: 문 단계(R78 phase 'door')에서 보스 문 3.2칸 안에서 누른 E(interact). R790 귀비탕 관문이 아직 열려 있으면 R790 이 먼저(귀비탕 받기), 그 뒤 문 E 가 여기서 걸린다.
//  · 알림: 남은 단서와 다음 할 일(인물에게 말 걸기 → 곁일 목표 → 떨어진 단서 줍기)을 짧게, 1.5초에 한 번. 목표 줄에 '단서 0/1' 을 붙인다(들머리부터 보이게).
//  · 서사 글은 그대로(알림·목표 줄만 새 글). 단서 문장·창은 R840 그대로.
//  · 소프트락 막기: 곁일이 안 보이는 경우(무한 생존·협동·이미 끝낸 지역·R840 꺼짐·사몽 층), 다음 대상(인물·조형물·떨어진 단서)을 못 세웠으면 막지 않는다.
//    길잡이·영화 모드는 R840 이 문 단계에서도 곁일을 먼저 하고(정체 6초면 대신 마침), 단서를 주우면 이 관문도 풀린다.
//  끄기: localStorage['storyworld.r1060.clueGate']='{"on":false}'. 점검: window.__STORYWORLD_CLUE_GATE_R1060__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_CLUE_GATE_R1060__)return;
const REV='R1060-clue-gate-1',KEY='storyworld.r1060.clueGate',ZONES=new Set(['last302','last303']),DOOR_REACH=3.2,TOAST_GAP=1.5;
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={blocked:0,passed:0,toasts:0,unreachable:0,hud:0,errors:0};let lastError=null,lastToast=-1e9;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;
const here=()=>{try{return typeof room!=='undefined'?room:null;}catch(_){return null;}};
const Q=()=>window.__STORYWORLD_QUEST_R840__;
// 순수: 남은 단서 수(0 또는 1). q = R840 inspect(), d = R840 지역 정의. 다음 대상을 못 세웠으면 0(막지 않음).
function need(q,d){if(!q||!d||!d.clue||!q.visible||!ZONES.has(q.zone)||q.state==='done')return 0;
 if(q.state==='new')return q.npc?1:0;if(q.state==='on')return Array.isArray(q.props)&&q.props.length?1:0;if(q.state==='drop')return q.orb?1:0;return 0;}
function nextStep(q,d){if(q.state==='new')return (d.npc?.name||'인물')+'에게 말 걸기';if(q.state==='on')return d.quest?.hud||'곁일 마치기';return '떨어진 단서 줍기';}
function info(r=here()){try{if(!prefs.on||!r||r.layer!=='STORY'||!ZONES.has(r.id))return null;const q=Q()?.inspect?.(),d=Q()?.def?.(r.id);if(!q||q.zone!==r.id)return null;
 const left=need(q,d);if(!left){if(q.visible&&q.state!=='done'&&d?.clue)stats.unreachable++;return {left:0,total:1,q,d};}return {left,total:1,q,d};}catch(e){fail(e);return null;}}
function phaseOf(r){try{return window.__STORYWORLD_WORLD_COMBAT_R78__?.state?.(r)?.phase||null;}catch(e){fail(e);return null;}}
function bossDoor(r){const id=r?.exploration?.bossDoorId;return r?.exploration?.worldR74?.doors?.find(x=>x&&x.id===id)||null;}
const label=g=>'단서 '+(g.total-g.left)+'/'+g.total;
// 문에서 누른 E 를 막아야 하나
function blocks(){const r=here();if(!r||phaseOf(r)!=='door')return null;const door=bossDoor(r);let pl=null;try{pl=player;}catch(_){}
 if(!door||!pl||!(Math.hypot(pl.x-door.x,pl.y-door.y)<DOOR_REACH))return null;
 try{const n=window.__STORYWORLD_NPC_R790__?.inspect?.();if(n&&n.zone===r.id&&n.gate)return null;}catch(e){fail(e);}
 const g=info(r);return g&&g.left>0?g:null;}
let installed=false;function install(){if(installed)return;installed=true;
 if(typeof interact==='function'){const base=interact;interact=function(...a){try{if(started&&!modal&&!loading){const g=blocks();if(g){stats.blocked++;const t=T();
     if(t-lastToast>=TOAST_GAP){lastToast=t;stats.toasts++;try{toast('이 지역의 단서를 모두 모아야 기억이 이어집니다 · '+label(g)+' — 다음: '+nextStep(g.q,g.d),3.2);}catch(e){fail(e);}}return true;}}}catch(e){fail(e);}
   stats.passed++;return base.apply(this,a);};}
 // 길잡이·영화 모드: R840 은 들머리를 지나면 안 받은 곁일로 되돌아가지 않는다 → 문 단계에서 단서가 남았으면 R840 곁일 걸음을 먼저(그 뒤 단서를 주우면 문이 열려 원래 길잡이가 이어감).
 if(typeof guideStep==='function'){const base=guideStep;guideStep=function(...a){try{let on=false;try{on=typeof guide!=='undefined'&&!!guide;}catch(_){}const r=here();
    if(on&&r&&phaseOf(r)==='door'){const g=info(r);if(g&&g.left>0&&Q()?.guideStep?.(true)){stats.guided=(stats.guided||0)+1;return;}}}catch(e){fail(e);}return base.apply(this,a);};}
 if(typeof updateHUD==='function'){const base=updateHUD;updateHUD=function(...a){const r0=base.apply(this,a);try{const r=here();if(started!==false&&r&&['route','rally','door'].includes(phaseOf(r))){const g=info(r);
     if(g&&g.left>0){const el=typeof $==='function'?$('questText'):null,add=' · '+label(g)+'(모아야 보스 문이 열림)';if(el&&!String(el.textContent).includes(label(g))){el.textContent=String(el.textContent)+add;stats.hud++;}}}}catch(e){fail(e);}return r0;};}}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r0=base.apply(this,a);try{install();}catch(e){fail(e);}return r0;};}
window.__STORYWORLD_CLUE_GATE_R1060__=Object.freeze({rev:REV,pure:Object.freeze({need}),install,
 inspect:()=>{const r=here(),g=info(r);return {rev:REV,prefs:{...prefs},zone:r?.id||null,phase:phaseOf(r),left:g?g.left:null,total:g?g.total:null,installed,stats:{...stats},lastError,browserVerified:false};},
 set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}});
})();
