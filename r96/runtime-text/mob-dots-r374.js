// R374 — Dots 승인 몹 그림 적용(사용자 2026-11-06 승인: u203-02·03·05, u205 새 4종).
//  · STORY 층의 정해진 액터(nativeId + 정본 이름)만 바꾼다. 같은 그림을 쓰던 다른 지역(m041 등 공유 매핑)은 그대로.
//  · 이름·판정·체력·공격·보상·저장·단계 진행은 그대로. 그림만 엔진 그림 선택 사슬(__STORYWORLD_STORY_COMBAT_R54__.frameFor)에 내준다(R208 방식).
//  · 컨트롤러 · 기억의 문(u203-boss): idle/이동/일반공격 칸만 바꾸고 경직·전환·비·죽음 같은 특수상태는 원래 그림을 쓴다.
//  · 최종문 공명기사(u203-e3) 보행은 4자세라 HOLD(자연 보행 미검증) — 이동 칸을 느리게 돌린다.
//  · storyworld.r374.dots {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_DOTS_R374__)return;
const REV='R374-dots-1',KEY='storyworld.r374.dots',INDEX='assets/r374/mobs/index.json';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={assigned:0,frames:0,bossKept:0,waiting:0,reinstalls:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
let idx=null;
if(typeof fetch==='function')fetch(INDEX).then(r=>r.ok?r.json():null).then(j=>{if(j?.mobs)idx=j;}).catch(fail);
const BOSS_IDLE=/c5859bd35492_controller_idle/,BOSS_ATTACK=/c4c64ee058cc_controller_attack/;
const normalize=n=>String(n||'').replace(/^(중간보스|준보스)\s*·\s*/,'').replace(/\s*·\s*짙은 형상$/,'').replace(/\s*(후속 증원|증원|추격대|우두머리)$/,'').replace(/\s+\d+$/,'').trim();
const curLayer=()=>{try{return typeof layer==='string'?layer:'STORY';}catch(_){return 'STORY';}};
function match(e){if(!idx||!e||e.hero||e.r170Tower||e.r251Circle)return null;try{if(typeof player!=='undefined'&&e===player)return null;}catch(_){}
 const L=curLayer(),id=String(e.nativeId||''),n=normalize(e.r200OrigName||e.name);
 return idx.mobs.find(m=>m.actor.layer===L&&m.actor.nativeId===id&&n===m.actor.name)||null;}
function assign(e){if(!prefs.on||!idx||!e)return null;if(e.r374Mob)return idx.mobs.find(m=>m.id===e.r374Mob)||null;if(e.r374Checked===curLayer())return null;
 e.r374Checked=curLayer();const m=match(e);if(!m)return null;e.r374Mob=m.id;stats.assigned++;return m;}
const T=()=>typeof time==='number'?time:performance.now()/1000;
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
const attacking=e=>!!(e.attack&&Number.isFinite(e.attack.elapsed));
function cellFor(e,m){
 if(attacking(e)){const sh=e.attack.shape154||e.combatProfile?.attackShape||{},tot=Math.max(.2,(e.attack.castWindup150??sh.windup??.45)+(sh.active??.15)+(sh.recovery??.35));const u=Math.min(.999,Math.max(0,e.attack.elapsed/tot));return m.attack[Math.floor(u*m.attack.length)];}
 if(e.rangedWindup>0)return m.attack[Math.floor(T()*6)%Math.min(2,m.attack.length)];
 if(!(e.hp>0)||e.hitTimer>0)return m.move[0];
 const fps=m.id==='u203-e3-mech'?5:8;/* 공명기사 보행 HOLD: 4자세라 느리게 */
 if(e.moving)return m.move[Math.floor(T()*fps+hash(e.id)*8)%m.move.length];
 return m.move[Math.floor(T()*1.6+hash(e.id)*2)%2];}
function frameOf(e,m){const [cw,ch]=m.cell,[px,py]=m.pivot,vh=m.visibleHeight||150,k=cellFor(e,m);
 return {path:m.path,assetFrame:{sourceRect:[k*cw,0,cw,ch],pivot:[px,py],visibleHeight:vh},sourceAlphaCore:[k*cw,0,cw,ch],metricThreshold:16,sourcePixelsEdited:false,
  normalizedFullRectangleExtents:[-px/vh,-py/vh,(cw-px)/vh,(ch-py)/vh],r374Mob:m.id,r208Mob:m.id,flip:faceLeft(e)!==(m.facing==='left')};}
// 공격 중에는 정해진 공격 방향(e.attack.angle)을 본다 — 영웅이 옆으로 피해도 휘두르는 쪽과 그림이 어긋나지 않게(R248 과 같은 식).
function faceLeft(e){const r444=window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(e);if(typeof r444==='boolean')return r444;/* R444 */if(attacking(e)&&Number.isFinite(e.attack.angle)){const sd=Math.cos(e.attack.angle)-Math.sin(e.attack.angle);if(Math.abs(sd)>.05)return sd<0;}
 return !!(typeof player!=='undefined'&&player&&(player.x-player.y)<(e.x-e.y));}
// 보스: 원래 고른 그림이 idle 이나 일반공격일 때만 바꾼다(경직·전환·비·죽음은 원래 그림).
function bossOk(e,f){const p=String(f?.path||'');if(!(e.hp>0)||e.hitTimer>0)return false;
 if(BOSS_IDLE.test(p))return !attacking(e);if(BOSS_ATTACK.test(p))return attacking(e);return false;}
function install(){const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(!S||typeof S.frameFor!=='function')return false;if(S.__r374)return true;
 window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r374:true,frameFor(e,f){try{const m=prefs.on?assign(e):null;if(m){
   if(m.actor.bossStates){const base=S.frameFor(e,f);if(!bossOk(e,base||f)){stats.bossKept++;return base;}}
   if(typeof readyImage!=='function'||!(readyImage(m.path)?.image?.naturalWidth>0)){if(typeof ensureImages==='function')Promise.resolve(ensureImages([m.path])).catch(()=>{});stats.waiting++;return S.frameFor(e,f);}
   stats.frames++;return frameOf(e,m);}}catch(err){fail(err);}return S.frameFor(e,f);}});stats.reinstalls++;return true;}
let tries=0;(function arm(){try{install();}catch(e){fail(e);}if(++tries<80&&typeof setTimeout==='function')setTimeout(arm,250);})();
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_MOB_DOTS_R374__=Object.freeze({revision:REV,set,assign,match,normalize,bossOk,cellFor,
 faceLeft,inspect:()=>({revision:REV,prefs:{...prefs},loaded:!!idx,mobs:idx?.mobs?.map(m=>m.id)||[],stats:{...stats},lastError})});
})();
