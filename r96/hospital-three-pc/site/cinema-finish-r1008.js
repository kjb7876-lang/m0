// R1008 — 영화 모드 끝까지 가기(2026-11-13 '스토리·영화 모드 끝까지 점검'에서 찾은 것).
//  ① 쓰러짐: 영화 모드는 서사 길이에 맞춰 전투를 늘린다(R384). 그 사이 영웅이 쓰러지면 원래 길잡이 규칙(R101)대로 쉼터로 돌아가
//     같은 지역을 처음부터 다시 걷고, 같은 서사가 다시 쌓였다(헤드리스 실제 속도 0.93배에서 환도 장 → 살인 장 3번 중 2번, murder01 중간보스 구간).
//     → 영화 기록에서는 '기억은 남아 있습니다' 창을 띄우지 않고 그 자리에서 다시 일어선다(체력 50%, 3초 보호). 일반 기록·무한생존은 그대로.
//  ② 엔딩 창(사용자 2026-11-13 결정 카드 '자동으로 넘김(추천)'): 영화 기록에서 최종장 엔딩 창('몽세에 남기')과 사몽 마지막 '윤서하의 진료기록' 창은
//     자막·음성이 모두 끝나고 20초 뒤 스스로 그 창의 첫 단추를 누른다(마을로 / 에필로그·거점으로). 보는 사람이 키·화면을 만지면 20초를 다시 센다.
//  순서: nav-r176 줄 앞(R176 순서 검사). 쓰러짐 연출(R151)이 바깥에서 1.5초 쓰러지는 그림을 보여 준 뒤 이 파일로 들어오므로, 영웅은 쓰러졌다가 일어선다.
//  공유 원칙: 두 경우 모두 원래 함수(showDeath·엔딩 창 단추)를 그대로 쓰고, 영화 기록일 때만 앞에서 가른다. 끄기 localStorage storyworld.r1008.cinema {"on":false}.
(()=>{'use strict';
if(window.__STORYWORLD_CINEMA_FINISH_R1008__)return;
const REV='R1008-cinema-finish-1',KEY='storyworld.r1008.cinema',WAIT=20,POLL=500,HP=.5,GUARD=3;
const ENDINGS=['endingExplore','r103End'];
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={standUps:0,standFail:0,endings:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const now=()=>performance.now()/1000;
const cinema=()=>prefs.on&&G(()=>window.__STORYWORLD_CINEMA_RUN_R461__.active()===true,false)&&G(()=>window.__STORYWORLD_CINEMA_MODE_R370__.prefs().on===true,false);
// ① 쓰러짐
if(typeof showDeath==='function'){const base=showDeath;showDeath=function(...a){
 try{if(cinema()){const m=+G(()=>maxHP(),NaN),p=G(()=>player,null);if(p&&Number.isFinite(m)&&m>0){p.hp=Math.max(1,Math.round(m*HP));p.invincible=Math.max(+p.invincible||0,GUARD);p.invReason='영화 모드 · 다시 일어섬';stats.standUps++;
   try{if(typeof toast==='function')toast('영화 모드 · 영웅이 다시 일어섭니다',2.4);}catch(_){}return 'stood';}stats.standFail++;}}catch(e){fail(e);}
 return base.apply(this,a);};}
// ② 엔딩 창
let quietSince=null,lastInput=-1e9,doneFor=null;
function ending(){for(const id of ENDINGS){const b=G(()=>document.getElementById(id),null);if(b)return b;}return null;}
function quiet(){const C=window.__STORYWORLD_CINEMA_MODE_R370__;const i=G(()=>C.inspect(),{});return !(+i.queue>0)&&!i.current&&!(+G(()=>C.remainingSecs(),0)>.5);}
function step(){try{if(!cinema()||!G(()=>modal,false)||G(()=>storyScene,null)){quietSince=null;return;}const b=ending();if(!b){quietSince=null;doneFor=null;return;}
 if(doneFor===b)return;if(!quiet()){quietSince=null;return;}const t=now();if(quietSince==null)quietSince=t;
 if(t-Math.max(quietSince,lastInput)>=WAIT){doneFor=b;quietSince=null;stats.endings++;b.click();}}catch(e){fail(e);}}
const userInput=()=>{lastInput=now();};
for(const ev of['keydown','pointerdown','touchstart'])try{addEventListener(ev,userInput,{passive:true,capture:true});}catch(_){}
setInterval(step,POLL);
window.__STORYWORLD_CINEMA_FINISH_R1008__=Object.freeze({revision:REV,prefs:()=>({...prefs}),active:cinema,userInput,inspect:()=>({revision:REV,prefs:{...prefs},cinema:cinema(),stats:{...stats},lastError})});
})();
