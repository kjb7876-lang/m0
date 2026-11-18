// R1145 EGO 각성 영웅(0번째 히든) — R 환수검·묵월에 천체 공명을 이어 붙인다(사용자 2026-11-18 05:55Z
//  "r 사용시 은빛거성 동시 사용하도록 심연왜성(백+빨강 색섞어서), 히든영웅 에고 묵월발동시 항성 반발도 백적색으로 색바꿔서 발생하도록").
//   ② R(EGO 환수검)을 쓰면 협주 기술(끝없는 갈망·되비친 집착)과 같은 때(0.5초 뒤)에 은빛 거성과 심연 왜성이 함께 나간다. 색은 흰색이 섞인 붉은빛.
//      판정·피해 배율은 라우렌 천체 공명 값 그대로(은빛 0.9배·밀어냄, 심연 0.25배×4·끌어당김). R 재사용 대기(13초)가 그대로 간격이 된다.
//      확률 패시브(10%·5초)의 굴림·대기·쌍성 소멸 조건은 건드리지 않는다.
//   ③ 묵월(환도 수묵 패시브, 18%·1.2초)이 발동하면 항성 반발도 같이 터진다. 색은 백적색. 묵월이 잦으므로 피해는 라우렌 값의 절반(공격력 0.6배), 밀쳐 냄·경직은 그대로.
//   ① E(백은 유영보) 뒤 악의 시선은 실측에서 정상이었다(E 를 배우면 0.35초 뒤 눈 셋). 코드 변경 없음 — 검사에 회귀만 넣음.
//  쏘는 일은 lauren-celestial-r946.js 의 egoCast 가 한다(EGO 형상일 때만 받음). 이 파일은 '언제'만 본다: 협주 기술의 R 횟수(R1094 stats.r), 묵월 횟수(R945 stats.moons)가 오르는 순간.
//  EGO 형상에만. 환도·라우렌 본인은 그대로. 새 키·저장 필드 없음. 끄기: localStorage storyworld.r1145.egoCelestial = {"on":false}. tick 은 __STORYWORLD_POST_HOOKS__.register 로.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_EGO_CELESTIAL_R1145__)return;
const REV='R1145-ego-celestial-1',KEY='storyworld.r1145.egoCelestial',R_DELAY=.5,REPULSE_SCALE=.5,AIM_R=12;
const fin=Number.isFinite;
let on=true;try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.on===false)on=false;}catch(_){}
const stats={rCasts:0,moonCasts:0,refused:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const G=(f,d)=>{try{return f();}catch(_){return d;}};
const kit=()=>window.__STORYWORLD_EGO_KIT_R1094__,cel=()=>window.__STORYWORLD_LAUREN_CELESTIAL_R946__,ink=()=>window.__STORYWORLD_HWANDO_INK_R945__;
function active(){return on&&!!G(()=>kit()?.active?.(),false)&&typeof cel()?.egoCast==='function';}
// 순수 계산: 세던 숫자가 올랐는가(처음 본 값·같은 값·줄어든 값은 아님)
function rose(prev,cur){return fin(prev)&&fin(cur)&&cur>prev;}
const target=()=>G(()=>{const e=typeof nearestEnemy==='function'?nearestEnemy(AIM_R):null;return e&&fin(e.x)&&fin(e.y)?{x:e.x,y:e.y}:null;},null);
function castR(){try{if(!active())return;const C=cel(),tg=target();const a=C.egoCast('red',tg),b=C.egoCast('blue',tg);if(a||b)stats.rCasts++;else stats.refused++;}catch(e){fail(e);}}
function castMoon(){try{if(!active())return;if(cel().egoCast('repulse',null,{scale:REPULSE_SCALE}))stats.moonCasts++;else stats.refused++;}catch(e){fail(e);}}
let seenR=NaN,seenMoon=NaN;
function tick(){try{
  const r=+G(()=>kit()?.inspect?.().stats?.r,NaN),m=+G(()=>ink()?.inspect?.().stats?.moons,NaN),act=active();
  if(act&&rose(seenR,r)){if(typeof delay==='function')delay(R_DELAY,castR,'hero');else castR();}
  if(act&&rose(seenMoon,m))castMoon();
  if(fin(r))seenR=r;if(fin(m))seenMoon=m;
 }catch(e){fail(e);}}
try{window.__STORYWORLD_POST_HOOKS__.register('__r1145',{tick},fail);}catch(e){fail(e);}
window.__STORYWORLD_EGO_CELESTIAL_R1145__=Object.freeze({revision:REV,R_DELAY,REPULSE_SCALE,rose,active,
 set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,on,active:active(),seen:{r:seenR,moons:seenMoon},stats:{...stats},lastError})});
})();
