// R440 — 스킬(Q·W·E·R)·궁극기를 쓸 때 영웅이 공격 모션을 한 번 휘두른다(사용자 2026-11-09 "모든 영웅 스킬 사용할 때 공격 모션 나가도록").
//  · 원인: 스킬 중(skillAnim·ultimateAnim>0)에는 공격 그림 덧씌우기(R143·R242/R271 환도·R351 슬레이어·R425 헌터)가 모두 '바쁨'으로 물러나,
//    엔진이 고른 정지 그림 한 장(R130 g-s 남쪽 자세, 기억사수 R128 g-s)이나 환도·슬레이어 공격 한 칸만 0.6~1초 떠 있었다.
//  · 고친 방법: 몸 그림을 고르는 덧씌우기들이 돌기 직전(R143 안쪽 고리)에만 스킬 상태를 '공격 중'으로 잠깐 바꿔 보이고,
//    drawHero 가 끝나면(이 파일의 바깥 감싸기) 원래 값으로 되돌린다. 판정·피해·쿨다운·세이브는 건드리지 않는다.
//    각 영웅의 기존 공격 시트·프레임 수·방향 규칙(환도·라우렌 좌우만, 기억사수 좌우 ±60°, 슬레이어 우측 반전 등)을 그대로 탄다.
//  · 휘두르기는 스킬 시작에 한 번(SWING 초), 궁극기는 조금 느리게(ULT 초) — 남은 시간은 마지막(회수) 칸에 머문다.
//  · 그대로 두는 것: 대시(E 돌진류·dashAnim)·막기·EGO/사몽 변신·협동 모드, 그리고 R201 전용 스킬/궁극기 시트가 있는 방향(미카엘라·라우렌 s/e).
//    엔진·R101 의 스킬 빛(heat)·날개 등 안쪽 그림은 실제 스킬 값으로 그대로 그린다.
//  · 끄기: localStorage storyworld.r440.skillAttack = {"on":false}
(()=>{'use strict';
if(window.__STORYWORLD_SKILL_ATTACK_R440__)return;
const REV='R440-skill-attack-1',KEY='storyworld.r440.skillAttack',SWING=.3,ULT=.42,HOLD=1e-3;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={swaps:0,casts:0,skipped:{dash:0,guard:0,form:0,sheet:0,coop:0,move:0},errors:0,lastHero:null,lastAct:null};let lastError=null;
const now=()=>typeof time==='number'?time:performance.now()/1000;
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
let saved=null;// 바꿔 둔 값(바깥 감싸기가 되돌린다)
const cast={prevSk:0,prevUl:0,t0:-9,ult:false};
function track(p){const sk=+p.skillAnim||0,ul=+p.ultimateAnim||0;
 if(sk>cast.prevSk+1e-6||ul>cast.prevUl+1e-6){/* R720 규칙 3: 0.25초 안에 다시 오른 값은 같은 시전(휘두르기 되감기 금지) */const m=window.__STORYWORLD_HERO_MOTION_R720__,t0=m?m.castStart():now();if(t0!==cast.t0){cast.t0=t0;cast.ult=ul>cast.prevUl+1e-6;stats.casts++;}}
 cast.prevSk=sk;cast.prevUl=ul;return sk>0||ul>0;}
// R143 안쪽 고리가 부른다: 엔진·안쪽 덧씌우기가 몸을 그린 직후, 공격 그림 덧씌우기들이 상태를 읽기 직전.
function swap(){if(saved||!prefs.on)return;const p=typeof player==='object'?player:null;if(!p||!(p.hp>0))return;
 if(!track(p))return;
 if(!solo()){stats.skipped.coop++;return;}
 if(p.dashAnim>0){stats.skipped.dash++;return;}
 if(p.guard){stats.skipped.guard++;return;}
 if(p.ego>0||p.samong>0){stats.skipped.form++;return;}
 try{if(window.__STORYWORLD_HERO_MOTION_R720__?.moveCancel?.('skill')){stats.skipped.move++;return;}}catch(_){}/* R720 규칙 2: 커밋 창(0.18초) 뒤 이동 입력이면 걷기로 캔슬 */
 try{if(window.__STORYWORLD_ATTACK_ANIM_R143__?.actSheet?.()){stats.skipped.sheet++;return;}}catch(_){}
 const D=cast.ult?ULT:SWING,el=Math.max(0,now()-cast.t0),real=+p.attackAnim||0;
 saved={p,skillAnim:p.skillAnim,ultimateAnim:p.ultimateAnim,attackAnim:p.attackAnim,attackCD:p.attackCD};
 p.skillAnim=0;p.ultimateAnim=0;p.attackAnim=real>0?real:Math.max(HOLD,D-el);p.attackCD=D;
 stats.swaps++;stats.lastHero=p.hero;stats.lastAct=cast.ult?'ultimate':'skill';}
function restore(){const s=saved;saved=null;if(!s)return;const p=s.p;p.skillAnim=s.skillAnim;p.ultimateAnim=s.ultimateAnim;p.attackAnim=s.attackAnim;p.attackCD=s.attackCD;}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){try{return base.apply(this,a);}catch(e){stats.errors++;lastError=String(e?.message||e).slice(0,160);throw e;}finally{restore();}};}
function set(k,v){prefs[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_SKILL_ATTACK_R440__=Object.freeze({revision:REV,swap,restore,set,SWING,ULT,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats,skipped:{...stats.skipped}},cast:{...cast},lastError,browser:false,GPU:false})});
})();
