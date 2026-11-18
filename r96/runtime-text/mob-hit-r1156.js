/* R1156b 몹 피격 4칸 — Dots CX-0136 A4 r2(2026-11-18) HOLD 손질본 적용(사용자 11-18 08:41Z "hold 보류자산도 앵간하면 너가 코드나 스킬로 개선해서 적용해").
 * 최종문 공명기사(u203-e3-mech)·이동문 공허잔영(u203-e2-mech)·늪 뿌리 추적자(swamp-root-stalker-darkgreen-v2)가 맞은 순간 피격 4칸(70·110·100·100ms)을 보여 준다.
 * 손질(scripts/r1156-mob-hit.py): 공명기사·공허잔영 반동을 발 고정 전단으로 몸 키의 약 10%로 줄임, 공허잔영 4칸 = 게임 그림, 뿌리 추적자 색·아래 뿌리를 원래 그림에 맞춤.
 * 그림만 엔진 frameFor 사슬(__STORYWORLD_STORY_COMBAT_R54__)에서 바꾼다. 경직 시간(hitTimer)·판정·이동은 그대로. 공격 중·죽음엔 손대지 않는다.
 * 몹 그림 덧씌우기(R374·R380)가 이 파일보다 늦게 감싸므로 첫 틱 뒤에 맨 바깥에 감싼다(아래 감싸기 설명).
 * 끄기: localStorage['storyworld.r1156.mobHit']='{"on":false}'
 */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_MOB_HIT_R1156__)return;
const REV='R1156b-mob-hit-2',KEY='storyworld.r1156.mobHit',MS=[70,110,100,100],TOTAL=MS.reduce((a,b)=>a+b,0)/1000,RESTART=.25;
const SHEETS=Object.freeze({
 'u203-e3-mech':Object.freeze({path:'assets/r1156/mob-hit/u203-e3-hit4.webp',cell:[256,256],own:'assets/r374/mobs/u203-e3-mech.webp'}),
 'u203-e2-mech':Object.freeze({path:'assets/r1156/mob-hit/u203-e2-hit4.webp',cell:[256,256],own:'assets/r374/mobs/u203-e2-mech.webp'}),
 'swamp-root-stalker-darkgreen-v2':Object.freeze({path:'assets/r1156/mob-hit/swamp-root-hit4.webp',cell:[373,320],own:'assets/r380/mobs/swamp-root-stalker-darkgreen-v2-walk-d1.webp'}),
 /* R1168: cult05 '설원 아래의 기계 다리' — Dots CX-0136 A4 cult05 r2 DIAGNOSTIC_HOLD 손질(scripts/r1168-cult05-hit.py: 배경·격자 제거, 0.755배, 발 고정, 4칸 게임 그림, 색 맞춤) */
 'cult-mech-legs-walk-d1':Object.freeze({path:'assets/r1168/mob-hit/cult05-hit4.webp',cell:[320,320],own:'assets/r380/mobs/cult-mech-legs-walk-d1.webp'}),
 /* R1169: 사몽 S-06 디스토피아 일반 몹 9종 — Dots CX-0158DY r1 ROUGH(scripts/r1169-dys-sheets.py: 1~3칸 색 맞춤, 4칸 = 원본 0칸) */
 'dys-scythe-v1':Object.freeze({path:'assets/r1169/dys-scythe-hit4.webp',cell:[240,224],own:'assets/r380/mobs/dys-scythe-v1.webp'}),
 'dys-sacshell-v1':Object.freeze({path:'assets/r1169/dys-sacshell-hit4.webp',cell:[240,224],own:'assets/r380/mobs/dys-sacshell-v1.webp'}),
 'dys-membrane-v1':Object.freeze({path:'assets/r1169/dys-membrane-hit4.webp',cell:[240,224],own:'assets/r380/mobs/dys-membrane-v1.webp'}),
 'dys-bulwark-v2':Object.freeze({path:'assets/r1169/dys-bulwark-hit4.webp',cell:[256,320],own:'assets/r380/mobs/dys-bulwark-v2.webp'}),
 'dys-disc-v2':Object.freeze({path:'assets/r1169/dys-disc-hit4.webp',cell:[256,320],own:'assets/r380/mobs/dys-disc-v2.webp'}),
 'dys-engineer-v2':Object.freeze({path:'assets/r1169/dys-engineer-hit4.webp',cell:[256,320],own:'assets/r380/mobs/dys-engineer-v2.webp'}),
 'dys-pulse-raider-v2':Object.freeze({path:'assets/r1169/dys-pulse-raider-hit4.webp',cell:[256,320],own:'assets/r380/mobs/dys-pulse-raider-v2-walk-d1.webp'}),
 'dys-prism-stalker-v2':Object.freeze({path:'assets/r1169/dys-prism-stalker-hit4.webp',cell:[256,320],own:'assets/r380/mobs/dys-prism-stalker-v2-walk-d1.webp'}),
 'dys-siege-gunner-v2':Object.freeze({path:'assets/r1169/dys-siege-gunner-hit4.webp',cell:[256,320],own:'assets/r380/mobs/dys-siege-gunner-v2-walk-d1.webp'})});
const stats={hits:0,frames:0,waiting:0,rewraps:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
let on=true;try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.on===false)on=false;}catch(_){}
const T=()=>{try{return typeof time==='number'?time:0;}catch(_){return 0;}};
const ST=new WeakMap();
function ready(p){try{const r=typeof readyImage==='function'?readyImage(p):null;return !!(r&&r.image&&(r.image.naturalWidth||r.image.width));}catch(_){return false;}}
function want(p){try{if(typeof ensureImages==='function'){const r=ensureImages([p]);if(r&&typeof r.catch==='function')r.catch(()=>{});}}catch(_){}}
const attacking=e=>!!(e.attack&&Number.isFinite(e.attack.elapsed));
function frameIdx(el){let ms=el*1000;for(let i=0;i<MS.length;i++){if(ms<MS[i]-1e-6)return i;ms-=MS[i];}return -1;}
function hitFrame(e,base){if(!on||!e||!base||typeof base!=='object'||base.r1156Hit!=null)return base;const id=base.r208Mob||base.r374Mob,S=id&&SHEETS[id];if(!S)return base;
 const t=T(),h=Number(e.hitTimer)||0;let s=ST.get(e);if(!s){s={prev:0,t0:-1e9};ST.set(e,s);}
 if(h>0&&(h>s.prev+1e-4||s.prev<=0)&&t-s.t0>=RESTART){s.t0=t;stats.hits++;}s.prev=h;
 if(!(e.hp>0)||attacking(e))return base;const k=frameIdx(t-s.t0);if(k<0)return base;
 if(!ready(S.path)){want(S.path);stats.waiting++;return base;}
 const af=base.assetFrame||{},[cw,ch]=S.cell,flip=base.path===S.own?!!base.flip:!base.flip;/* 왼쪽 보는 쌍둥이 시트면 뒤집기 뜻이 반대 */stats.frames++;
 return {...base,path:S.path,assetFrame:{...af,sourceRect:[k*cw,0,cw,ch]},sourceAlphaCore:[k*cw,0,cw,ch],flip,r1156Hit:k};}
// 감싸기: 모든 스크립트가 frameFor 를 감싼 뒤(첫 틱 뒤) 한 번 맨 바깥에 감싼다. 나중에 다른 덧씌우기(R1065 처럼 안쪽을 부르는 것)가 감싸면
// 그 안에 남아 있어도 되므로 다시 감싸지 않는다(서로 번갈아 감싸 사슬이 길어지는 핑퐁 방지). 안쪽을 안 부르는 덧씌우기에 밀려났을 때만 다시 감싼다(최대 20번).
let mine=null,pass=0;const PROBE=Object.freeze({__r1156probe:true,id:'r1156-probe',hp:0});
// 자기 몹만 안쪽을 안 부르고 자기 그림을 내는 덧씌우기(R208·R374·R375·R380, 한 번만 감쌈)가 내 뒤에 감쌌으면 시험 호출로는 못 알아본다 → 표식 순서로 본다.
const OWNERS=['__r208','__r374','__r375','__r380'];
function ownerOutside(S){const k=Object.keys(S),i=k.indexOf('__r1156');return i<0||OWNERS.some(o=>k.indexOf(o)>i);}
function inChain(S){if(ownerOutside(S))return false;const b=pass;try{S.frameFor(PROBE,null);}catch(_){}return pass>b;}
function wrap(){try{const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(!S||typeof S.frameFor!=='function'||S===mine)return false;if(mine&&inChain(S))return false;if(stats.rewraps>=20)return false;
  const inner=S.frameFor,{__r1156:_old,...rest}=S;mine=Object.freeze({...rest,__r1156:true,frameFor(e,f){pass++;const b=inner.call(this,e,f);if(e===PROBE)return b;try{return hitFrame(e,b);}catch(err){fail(err);return b;}}});
  window.__STORYWORLD_STORY_COMBAT_R54__=mine;stats.rewraps++;return true;}catch(err){fail(err);return false;}}
try{setTimeout(wrap,0);setInterval(wrap,1000);}catch(_){wrap();}
window.__STORYWORLD_MOB_HIT_R1156__=Object.freeze({revision:REV,sheets:SHEETS,ms:MS,set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,on,stats:{...stats},lastError})});
})();
