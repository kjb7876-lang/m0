// R442 — 적(보스·몹)이 기술을 쓸 때 몸이 공격 동작을 한다(사용자 2026-11-09 "모든 적들도 스킬 사용 시 공격 모션 하도록").
//  · 확인: 엔진 근접(e.attack)·원거리 시전(R54 cast/prepared)·R61 던지기(메아리·조형물·장판)는 이미 R54 clock 으로 준비→타격→회수 칸을 그린다.
//    R430/R431 보스 테마 기술(번지는 불길·독안개·냉기 돌풍 등 6초 장판)만 몸 동작 없이 서 있는 채 시전됐다.
//  · 고친 방법: 기술 쪽이 mark(e, 각도, 길이)를 부르면, 그 시간 동안 R54 frameFor 사슬(승인 몹 그림·R188 죽음 등 덧씌우기 모두)을
//    부르는 그 순간에만 가짜 근접 시계(e.attack, 판정 없음)를 보여 공격 칸을 고르게 하고, 곧바로 원래 값으로 되돌린다.
//    AI·피해·충돌은 e.attack 을 이 짧은 동기 호출 밖에서 절대 보지 못한다. 이미 공격·R61 동작 중이면 건드리지 않는다.
//  · 끄기: localStorage storyworld.r442.enemySkillPose = {"on":false}
(()=>{'use strict';
if(window.__STORYWORLD_ENEMY_SKILL_POSE_R442__)return;
const REV='R442-enemy-skill-pose-1',KEY='storyworld.r442.enemySkillPose';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={marks:0,frames:0,skippedBusy:0,errors:0};let lastError=null;
const T=()=>typeof time==='number'?time:0,fin=Number.isFinite;
const marks=new WeakMap();
function mark(e,angle,dur=.9){if(!prefs.on||!e||!(e.hp>0))return false;const d=Math.max(.5,Math.min(1.6,+dur||.9));
 marks.set(e,{t0:T(),dur:d,angle:fin(angle)?angle:(typeof player==='object'&&player?Math.atan2(player.y-.15-e.y,player.x-e.x):0),windup:d*.5,active:Math.min(.16,d*.17)});stats.marks++;return true;}
function token(e){const m=marks.get(e);if(!m)return null;const el=T()-m.t0;if(el<0||el>=m.dur){marks.delete(e);return null;}
 if(e.attack||e.r61Action&&!e.r61Action.cancelled&&T()<(e.r61Action.endAt||0)){stats.skippedBusy++;return null;}
 return{elapsed:el,angle:m.angle,committed:false,r442:true,shape154:{windup:m.windup,active:m.active,recovery:Math.max(.1,m.dur-m.windup-m.active)}};}
function install(){const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(!S||S.__r442||typeof S.frameFor!=='function')return false;const base=S.frameFor;
 window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r442:true,frameFor(e,f){let tk=null;try{tk=prefs.on&&e&&e.hp>0?token(e):null;}catch(err){stats.errors++;lastError=String(err?.message||err).slice(0,160);}
  if(!tk)return base.call(this,e,f);const had=Object.prototype.hasOwnProperty.call(e,'attack'),prev=e.attack;e.attack=tk;
  try{const r=base.call(this,e,f);stats.frames++;return r;}finally{if(had)e.attack=prev;else delete e.attack;}}});return true;}
install();
function set(k,v){prefs[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_ENEMY_SKILL_POSE_R442__=Object.freeze({revision:REV,mark,set,active:e=>!!marks.get(e),angle:e=>{const m=marks.get(e);if(!m)return null;const el=T()-m.t0;return el>=0&&el<m.dur?m.angle:null;}/* R444: 기술 동작 동안 몸 좌우를 기술 방향에 맞춘다 */,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},installed:!!window.__STORYWORLD_STORY_COMBAT_R54__?.__r442,lastError,browser:false,GPU:false})});
})();
