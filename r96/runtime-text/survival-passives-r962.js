// R962 — 배치·소환 영웅(R720 몸, R952 분대 몸)이 쏜 투사체의 명중을 쏜 몸의 것으로 돌린다(사용자 2026-11-12 14:35Z "생존모드도 특수패시브스킬 적용해야해").
//  문제: 엔진은 투사체를 나중 틱에 움직여 맞힌다. 그 순간 player 는 조종 영웅이라, 타격으로 굴리는 확률 패시브(라우렌 R946·미카엘라 R948·네온 R951)가
//   ① 배치 영웅이 쏜 탄이 맞아도 그 영웅 패시브는 굴러가지 않고 ② 조종 영웅이 같은 갈래 패시브를 가졌으면 남의 탄으로 조종 영웅 패시브가 굴러갔다.
//  고침: 몸 차례(player.r720Ally)에 만든 투사체에 쏜 몸과 영웅(sourceHero, 비어 있을 때만)을 적어 두고, 그 투사체가 맞히는 hitEnemy 한 번 동안만
//   그 몸을 player 자리에 끼운다(몸이 아직 판에 있을 때만 — 교대·해산된 몸은 끼우지 않고 sourceHero 표식만 남는다).
//   R720-4 의 asHero(heroId,fn) 이 있으면 그것으로 끼운다(몸 끼우기·겨눔 명령 분리를 R720 이 맡음). 피해 값·판정·투사체 움직임은 바꾸지 않는다.
//  감싸기는 페이지 load 때(모든 스크립트가 감싼 뒤) 건다 → 맨 끝의 R118 영웅 광역까지 안쪽에 들어와, 배치 영웅 타격이 부른 광역이 조종 영웅 패시브를 굴리지 않는다.
//  패시브가 자기 틱에서 몸 대신 낸 타격(출처 sourceHero 가 판에 있는 다른 영웅)도 같은 길로 그 몸 차례에 돈다. 그림은 그리지 않는다(시각 변화 없음).
//  끄기: localStorage['storyworld.r962.survivalPassives']='{"on":false}'
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SURVIVAL_PASSIVES_R962__)return;
const REV='R962-survival-passives-1',KEY='storyworld.r962.survivalPassives';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={stamped:0,routed:0,routedAsHero:0,stale:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,240);};
const shotBody=new WeakMap();
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
// 몸이 아직 판에 있는가(R720 배치 몸 또는 R952 분대 몸)
function present(b){if(!b||b.hp<=0)return false;
 const R7=window.__STORYWORLD_HERO_DEFENSE_R720__,H=window.__STORYWORLD_HUNTER_SQUAD_R952__;
 if(G(()=>R7.bodies(),[]).includes(b))return true;if(G(()=>H.bodies(),[]).includes(b))return true;return false;}
// 쏜 몸 찾기: ① 몸 차례에 만든 투사체 ② 출처의 sourceHero 가 조종 영웅이 아닌, 판에 있는 몸의 영웅(패시브가 자기 틱에서 몸 대신 낸 타격 — 예: 배치 환도의 수묵 초승달)
function bodyFor(source){if(!source||typeof source!=='object')return null;const s=shotBody.get(source);if(s)return s;
 const h=source.sourceHero;if(typeof h!=='string'||!h||h===G(()=>player.hero,null))return null;
 const R7=window.__STORYWORLD_HERO_DEFENSE_R720__,H=window.__STORYWORLD_HUNTER_SQUAD_R952__;
 return G(()=>R7.bodies(),[]).find(b=>b&&b.hero===h&&b.hp>0)||G(()=>H.bodies(),[]).find(b=>b&&b.hero===h&&b.hp>0)||null;}
let installed=false;
// 모든 스크립트(맨 끝의 R118 영웅 광역 포함)가 hitEnemy 를 감싼 뒤 가장 바깥에 선다 → 명중이 부른 광역·연쇄도 쏜 몸 차례에 돈다.
function install(){if(installed)return;installed=true;
 if(typeof makeShot==='function'){const base=makeShot;makeShot=function(...a){const r=base.apply(this,a);
  try{if(on&&r&&typeof r==='object'&&typeof player!=='undefined'&&player&&player.r720Ally===true){shotBody.set(r,player);if(!r.sourceHero)r.sourceHero=player.hero;r.r962Ally=true;stats.stamped++;}}catch(e){fail(e);}return r;};}
 if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,source,...a){
  let b=null;try{if(on)b=bodyFor(source);}catch(err){fail(err);}
  if(!b||b===player)return base.call(this,e,value,source,...a);
  if(!present(b)){stats.stale++;return base.call(this,e,value,source,...a);}
  const R7=window.__STORYWORLD_HERO_DEFENSE_R720__;
  if(R7&&typeof R7.asHero==='function'&&G(()=>R7.bodies(),[]).includes(b)){stats.routedAsHero++;return R7.asHero(b.hero,()=>base.call(this,e,value,source,...a));}
  // 직접 끼우기: 이 hitEnemy 한 번 동안만. 엔진 전역 겨눔 명령(target·command·route)은 그대로 되돌린다.
  const prev=player;let sT,sC,sR;try{sT=target;sC=command;sR=route;}catch(_){}
  stats.routed++;player=b;
  try{return base.call(this,e,value,source,...a);}
  finally{player=prev;try{target=sT;command=sC;route=sR;}catch(_){}}};}}
try{if(typeof document==='undefined'||document.readyState==='complete')install();else window.addEventListener('load',install,{once:true});}catch(e){fail(e);install();}
window.__STORYWORLD_SURVIVAL_PASSIVES_R962__=Object.freeze({revision:REV,on:()=>on,set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,on,installed,stats:{...stats},lastError}),bodyOf:s=>G(()=>shotBody.get(s)||null,null)});
})();
