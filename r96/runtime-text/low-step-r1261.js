// R1261 — 초저(성능 1단계)에서도 남던 렉(사용자 2026-11-20 02:52Z "지금 최저모드로 하는데도 렉이 있는이유 개선").
//  헤드리스 측정(qa/r1261/low-prof.mjs, 휴대폰 흉내 844×390·DPR 2, 꿈 층 dist01, 0.3초마다 타격 + 사몽 각성, 6게임초 CDP 표본):
//   1단계에서 단계와 상관없이 그대로 돌던 JS 는 엔진(phase1) 다음으로 R409 전투 읽기 테두리 굽기(morph·edt·distanceField·getImageData, 380ms)와
//   R302 영웅 2색(386ms)이었다. R409 는 몹·영웅 몸 그림 칸마다 테두리를 캔버스에 구워(거리장 계산) 새 텍스처로 올려, GPU 업로드(R287 붙잡기 경로)도 늘렸다.
//   R302 는 영웅 이펙트 색 규칙(사용자 상시 규칙 "고유색 + 보조색")이라 건드리지 않는다.
//  고친 방법: 성능 1단계(초저)일 때만 R409 테두리(outline)를 끈다(몹 위 가림 옅게·뒤로 그리기는 그대로). 1단계를 떠나면 사람이 정해 둔 값으로 되돌린다
//   (R1043 이 1단계에서 빛·날씨를 끄고 되돌리는 것과 같은 방식). 끈 동안 원래 값은 'storyworld.r1261.saved409' 에 둔다.
//  측정: 1단계 테두리 끔 → R409 380ms → 0, 텍스처 업로드 299 → 204ms(같은 6게임초). 판정·피해·세이브는 그대로. 끄기: localStorage 'storyworld.r1261.lowStep' = '0'.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_LOW_STEP_R1261__)return;
const REV='R1261-low-step-1',KEY='storyworld.r1261.lowStep',SAVED='storyworld.r1261.saved409',GAP=1000;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const stats={applied:0,restored:0,checks:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const on=()=>G(()=>localStorage.getItem(KEY),null)!=='0';
const step=()=>G(()=>{const n=Number(window.__STORYWORLD_PERF7_R1043__?.step?.());return Number.isFinite(n)?n:null;},null);
const R409=()=>G(()=>window.__STORYWORLD_COMBAT_READ_R409__,null);
function cur409(){let p={outline:true};try{p={...p,...JSON.parse(localStorage.getItem('storyworld.r409.combatRead')||'{}')};}catch(_){}return p;}
function check(){stats.checks++;try{const R=R409();if(!R||typeof R.set!=='function')return;const saved=G(()=>localStorage.getItem(SAVED),null);
  if(on()&&step()===1){if(saved===null){const p=cur409();if(p.outline===false)return;/* 사람이 이미 끈 것은 그대로 */
    localStorage.setItem(SAVED,JSON.stringify({outline:p.outline!==false}));R.set({outline:false});stats.applied++;}return;}
  if(saved!==null){let o={outline:true};try{o=JSON.parse(saved)||o;}catch(_){}R.set({outline:o.outline!==false});localStorage.removeItem(SAVED);stats.restored++;}}catch(e){fail(e);}}
check();G(()=>setInterval(check,GAP));
window.__STORYWORLD_LOW_STEP_R1261__=Object.freeze({revision:REV,check,on,
 set:v=>{G(()=>localStorage.setItem(KEY,v?'1':'0'));check();return on();},
 inspect:()=>({revision:REV,on:on(),step:step(),saved:G(()=>localStorage.getItem(SAVED),null),...stats,lastError,gameplayChanged:false,presentationOnly:true})});
})();
