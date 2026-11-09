// R375 — Dots 2026-11-06 몹 그림 적용(사용자 2026-11-06 "구글드라이브 오늘자자산확인해서 몹들 제대로 배치적용해줘 검토 개선한다음").
//  · kair02 시간수문장 44·45·48, kair03 시간핵 명령잔류: 4방향(오른쪽·왼쪽·앞·뒤)을 따로 그린 그림. 좌우 뒤집기 대신 영웅(공격 중엔 공격 방향) 쪽 방향 줄을 고른다.
//    대기1·이동4·공격3·피격2·사망(엔진이 죽는 순간 액터를 빼고 불꽃 속에 한 장을 녹이므로, 그 한 장을 쓰러진 마지막 사망 그림으로 넘김).
//  · 사몽 S-06 변이된 사냥개 괴수(R200 plague-hound): 디스토피아 v1 8칸(이동 4 순환, 공격 4)으로 바꾼다. 다른 S-06 종·본편 u201-e2 는 그대로.
//  · 이름·판정·체력·공격·보상·저장은 그대로. 그림만 엔진 frameFor 사슬에 내준다. storyworld.r375.dots {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_DOTS_R375__)return;
const REV='R375-dots-1',KEY='storyworld.r375.dots',INDEX='assets/r375/mobs/index.json';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={assigned:0,frames:0,waiting:0,reinstalls:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
let idx=null;if(typeof fetch==='function')fetch(INDEX).then(r=>r.ok?r.json():null).then(j=>{if(j?.mobs)idx=j;}).catch(fail);
const curLayer=()=>{try{return typeof layer==='string'?layer:'STORY';}catch(_){return 'STORY';}};
const zoneOf=()=>{try{return String(typeof room==='object'&&room?(room.id||''):'');}catch(_){return '';}};
const T=()=>typeof time==='number'?time:performance.now()/1000;
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
const attacking=e=>!!(e?.attack&&Number.isFinite(e.attack.elapsed));
function match(e){if(!idx||!e||e.hero||e.boss||e.r170Tower||e.r251Circle)return null;try{if(typeof player!=='undefined'&&e===player)return null;}catch(_){}
 const L=curLayer(),n=String(e.r200OrigName&&!e.r200Shade?e.r200OrigName:e.name||''),pid=String(e.profile?.id||e.nativeId||'');
 return idx.mobs.find(m=>{const a=m.actor;if(a.layer!==L)return false;if(a.r200Shade)return e.r200Shade===a.r200Shade;
  if(a.profileId&&pid!==a.profileId)return false;if(a.zone&&zoneOf()!==a.zone)return false;return new RegExp(a.name).test(n);})||null;}
function assign(e){if(!prefs.on||!idx||!e)return null;if(e.r375Mob)return idx.mobs.find(m=>m.id===e.r375Mob)||null;const k=curLayer()+'|'+(e.r200Shade||'');if(e.r375Checked===k)return null;
 e.r375Checked=k;const m=match(e);if(!m)return null;e.r375Mob=m.id;stats.assigned++;return m;}
function progress(e){const sh=e.attack.shape154||e.combatProfile?.attackShape||{},tot=Math.max(.2,(e.attack.castWindup150??sh.windup??.45)+(sh.active??.15)+(sh.recovery??.35));return Math.min(.999,Math.max(0,e.attack.elapsed/tot));}
// 화면 방향: 공격 중엔 공격 각, 아니면 영웅 쪽. 등각 화면에서 sx=dx-dy(좌우), sy=dx+dy(아래가 +).
function dirOf(e){const r443=window.__STORYWORLD_ENEMY_FACE_R443__?.d4?.(e);if(r443)return r443;/* R443 */let dx=0,dy=0;if(attacking(e)&&Number.isFinite(e.attack.angle)){dx=Math.cos(e.attack.angle);dy=Math.sin(e.attack.angle);}
 else{try{if(typeof player!=='undefined'&&player){dx=player.x-e.x;dy=player.y-e.y;}}catch(_){}}
 const sx=dx-dy,sy=dx+dy;if(Math.abs(sx)>=Math.abs(sy)*.75||!(Math.abs(sy)>1e-6))return sx<0?'west':'east';return sy>0?'south':'north';}
function cellFor(e,m){
 if(m.kind==='dirs4'){const s=m.states;
  if(!(e.hp>0)){const t0=Number.isFinite(e.deadAt)?e.deadAt:(e.r375DeadAt??=T());return T()-t0<.28?s.death[0]:s.death[s.death.length-1];}
  if(attacking(e))return s.attack[Math.floor(progress(e)*s.attack.length)];
  if(e.rangedWindup>0)return s.attack[0];
  if(e.hitTimer>0)return s.hit[Math.floor(T()*8)%s.hit.length];
  if(e.moving)return s.move[Math.floor(T()*7+hash(e.id)*8)%s.move.length];
  return s.idle[0];}
 if(attacking(e))return m.attack[Math.floor(progress(e)*m.attack.length)];
 if(e.rangedWindup>0)return m.attack[0];
 if(!(e.hp>0)||e.hitTimer>0)return m.move[0];
 if(e.moving)return m.move[Math.floor(T()*8+hash(e.id)*8)%m.move.length];/* 4키 순차 순환(왕복 아님) */
 return m.move[Math.floor(T()*1.6+hash(e.id)*2)%2];}
function frameOf(e,m){const [cw,ch]=m.cell,[px,py]=m.pivot,vh=m.visibleHeight||150,k=cellFor(e,m);let row=0,flip=false;
 if(m.kind==='dirs4')row=m.rows[dirOf(e)]??0;
 else{let left=false;const r443=window.__STORYWORLD_ENEMY_FACE_R443__?.left?.(e);if(typeof r443==='boolean')left=r443;else if(attacking(e)&&Number.isFinite(e.attack.angle)){const sd=Math.cos(e.attack.angle)-Math.sin(e.attack.angle);left=Math.abs(sd)>.05?sd<0:false;}else try{left=!!(player&&(player.x-player.y)<(e.x-e.y));}catch(_){}flip=left!==(m.facing==='left');}
 return {path:m.path,assetFrame:{sourceRect:[k*cw,row*ch,cw,ch],pivot:[px,py],visibleHeight:vh},sourceAlphaCore:[k*cw,row*ch,cw,ch],metricThreshold:16,sourcePixelsEdited:false,
  normalizedFullRectangleExtents:[-px/vh,-py/vh,(cw-px)/vh,(ch-py)/vh],r375Mob:m.id,r208Mob:m.id,flip};}
function install(){const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(!S||typeof S.frameFor!=='function')return false;if(S.__r375)return true;
 window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r375:true,frameFor(e,f){try{const m=prefs.on?assign(e):null;if(m){
   if(typeof readyImage!=='function'||!(readyImage(m.path)?.image?.naturalWidth>0)){if(typeof ensureImages==='function')Promise.resolve(ensureImages([m.path])).catch(()=>{});stats.waiting++;return S.frameFor(e,f);}
   stats.frames++;return frameOf(e,m);}}catch(err){fail(err);}return S.frameFor(e,f);}});stats.reinstalls++;return true;}
// 죽음: 엔진 killEnemy 는 액터를 바로 빼고 spawnBurnDeath3 가 e.profile.frames.death 를 한 번 찍어 불꽃 속에 녹인다(frameFor 를 다시 부르지 않음).
// 그래서 그 순간에만 R375 사망 첫 장 → 녹는 동안 마지막 장이 되도록 death 프레임을 이 몹 것으로 바꿔 넘긴다.
function deathFrame(e,m,last){return frameOf({...e,hp:0,deadAt:last?-1:T(),r375DeadAt:undefined},m);}
function installDeath(){if(typeof spawnBurnDeath3!=='function'||spawnBurnDeath3.__r375)return typeof spawnBurnDeath3==='function';const base=spawnBurnDeath3;
 const w=function(e){let m=null,saved;try{m=prefs.on&&e?assign(e):null;if(m&&typeof readyImage==='function'&&readyImage(m.path)?.image?.naturalWidth>0){saved=e.profile;const p=e.profile||{};
   e.profile={...p,frames:{...(p.frames||{}),death:deathFrame(e,m,true)}};stats.deaths=(stats.deaths||0)+1;}else m=null;}catch(err){fail(err);m=null;}
  try{return base.apply(this,arguments);}finally{if(m)e.profile=saved;}};w.__r375=true;try{spawnBurnDeath3=w;}catch(_){}try{window.spawnBurnDeath3=w;}catch(_){}return true;}
let tries=0;(function arm(){try{install();installDeath();}catch(e){fail(e);}if(++tries<80&&typeof setTimeout==='function')setTimeout(arm,250);})();
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_MOB_DOTS_R375__=Object.freeze({revision:REV,set,assign,match,dirOf,cellFor,frameOf,installDeath,
 inspect:()=>({revision:REV,prefs:{...prefs},loaded:!!idx,mobs:idx?.mobs?.map(m=>m.id)||[],stats:{...stats},lastError})});
})();
