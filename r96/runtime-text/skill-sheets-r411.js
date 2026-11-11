// R411 드라이브 core24 스킬·적중 이펙트 시트 — 사용자 2026-11-08 "구글드라이브 업로드된 이펙트 스킬 및적중 검토개선해서 보스와 영웅들에 차별점있게 적용".
//  Dots 가 그린 24장(256×256, 6×4, 12.5fps) 시트 14종을 보스 쪽 9종과 영웅 쪽 5종으로 나눠, 서로 겹치지 않게 쓴다(같은 그림이 적·아군 양쪽에 나오지 않음).
//  · 보스: 보스·중간보스가 깐 장판(hazards type 'field', R61·R62·R118 순환이 만드는 것)이 터지는 순간(age ≥ warning − lead) 그 자리에 한 번 재생.
//    보스마다 다른 그림: R105 보스 색표의 계열(fire·corruption·frost·shock)에서 보스 nativeId 해시로 주·보조 두 가지를 고른다(주,주,보조 순서).
//    불: 운석·화염벽·시체 폭발 / 타락: 촉수 속박·중력 우물·감염 표식·뼈 가시 / 서리: 뼈 가시·땅 갈라짐 / 전기: 낙뢰·땅 갈라짐.
//  · 영웅: 영웅이 몹을 맞힐 때(hitEnemy 가 피해를 넣은 때) 맞은 자리에 영웅별 적중 시트를 2배속(0.96초)·작게 재생.
//    건너(코발트) 폭발 적중 · 슬레이어(크림슨) 화염 적중 · 서하(아이스 블루) 얼음 가시 · 네온(민트) 연쇄 번개 · 라우렌(바이올렛) 순간이동 섬광.
//    미카엘라(R269·R247)·환도(SW-0003)는 손대지 않는다.
//  · 판정·피해·시간·쿨다운은 바꾸지 않는다(그림만). 시트는 scripts/r411-fx-sheets.py(칸 경계·잔티 정리 → WebP), 원본 해시는 assets/r411/fx/index.json.
//  · 그리기는 R292 처럼 effects 표지 항목으로 draw 안에서(Three 기록기에 잡힘), ctx.filter 는 쓰지 않는다. 동시 보스 10·영웅 6, 저사양은 절반.
//    보스 그림 scope 는 enemy:true(R409 가 적 쪽으로 봄), 영웅 적중 파일 이름엔 hit 가 들어가 R409 가림(veil)에서 빠진다.
//  · 끄기: localStorage['storyworld.r411.fx']='{"on":false}' 뒤 새로고침. 따로: {"boss":false} / {"hero":false}.
(()=>{'use strict';
if(window.__STORYWORLD_SKILL_SHEETS_R411__)return;
const REV='R411-skill-sheets-1',KEY='storyworld.r411.fx',DIR='assets/r411/fx/',CELL=256,COLS=6,FRAMES=24,FPS=12.5,DUR=FRAMES/FPS;
let prefs={on:true,boss:true,hero:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={boss:{},hero:{},drawn:0,skipped:0,errors:0,throttled:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0,fin=v=>typeof v==='number'&&Number.isFinite(v);
const low=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
// 이름 → [파일, pivot, 화면 크기 배율, 시작 앞당김(초), 재생 속도]
const SHEET={
 'boss-meteor':['boss-meteor.webp',[128,192],1.35,.75,1],'boss-fire-wall':['boss-fire-wall.webp',[128,175],1.25,.15,1.15],'boss-corpse-explosion':['boss-corpse-explosion.webp',[128,192],1.3,.35,1.1],
 'boss-tentacle-bind':['boss-tentacle-bind.webp',[128,208],1.2,.25,1],'boss-gravity-well':['boss-gravity-well.webp',[128,150],1.3,.3,1],'boss-bone-spikes':['boss-bone-spikes.webp',[128,192],1.2,.3,1.1],
 'boss-infection-mark':['boss-infection-mark.webp',[128,128],1.25,.2,1.1],'boss-lightning-strike':['boss-lightning-strike.webp',[128,208],1.3,.3,1.1],'boss-ground-fissure':['boss-ground-fissure.webp',[128,160],1.35,.2,1.1],
 'hit-explosion':['hit-explosion.webp',[128,202],.85,0,2],'hit-fire':['hit-fire.webp',[128,202],.85,0,2],'hit-ice-spikes':['hit-ice-spikes.webp',[128,208],.8,0,2.2],
 'hit-chain-lightning':['hit-chain-lightning.webp',[128,160],.9,0,2],'hit-teleport':['hit-teleport.webp',[128,192],.85,0,2],
};
const FAM={fire:['boss-meteor','boss-fire-wall','boss-corpse-explosion'],corruption:['boss-tentacle-bind','boss-gravity-well','boss-infection-mark','boss-bone-spikes'],
 frost:['boss-bone-spikes','boss-ground-fissure'],shock:['boss-lightning-strike','boss-ground-fissure']};
const HERO={gunner:'hit-explosion',slayer:'hit-fire',seoha:'hit-ice-spikes',neon:'hit-chain-lightning',lauren:'hit-teleport'};
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
function bossSet(e){if(e.r411Set)return e.r411Set;let elem='corruption';try{const P=window.__STORYWORLD_BOSS_FX_R105__?.palOf?.(e);if(P?.elem&&FAM[P.elem])elem=P.elem;}catch(_){}
 const L=FAM[elem],h=hash(e.nativeId||e.id||e.name),a=L[h%L.length],b=L[(h+1)%L.length];e.r411Set={elem,a,b,n:0};return e.r411Set;}
const asked=new Map();
function image(name){const p=DIR+SHEET[name][0];try{const got=typeof readyImage==='function'?readyImage(p):null;if(got?.image)return got.image;
 const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
const list=[],SENT={type:'r411-sheet-fx',x:0,y:0,age:0,life:Infinity,r411Sentinel:true};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function play(name,x,y,o={}){if(!prefs.on||!SHEET[name]||!fin(x)||!fin(y))return null;const side=name.startsWith('boss-')?'boss':'hero';
 const cap=(side==='boss'?10:6)/(low()?2:1),mine=list.filter(e=>e.side===side);if(mine.length>=cap){stats.throttled++;list.splice(list.indexOf(mine[0]),1);}
 image(name);const S=SHEET[name],e={name,side,x,y,size:fin(o.size)?o.size:1,flip:!!o.flip,t0:T()-(o.lead||0),speed:S[4],owner:o.owner||''};list.push(e);
 stats[side][name]=(stats[side][name]||0)+1;arm();return e;}
function drawOne(e){const S=SHEET[e.name],age=(T()-e.t0)*e.speed;if(age<0||age>=DUR)return;const im=image(e.name);if(!im){stats.skipped++;return;}
 const fr=Math.min(FRAMES-1,Math.floor(age*FPS)),unit=(typeof TILE==='number'?TILE:32)*(typeof zoom==='number'?zoom:1),q=project(e.x,e.y);
 const s=S[2]*e.size*unit/224*2,fade=age>DUR-.25?Math.max(0,(DUR-age)/.25):1;
 ctx.save();try{const run=()=>{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=fade;ctx.translate(q.x,q.y);ctx.scale(e.flip?-s:s,s);
   ctx.drawImage(im,(fr%COLS)*CELL,Math.floor(fr/COLS)*CELL,CELL,CELL,-S[1][0],-S[1][1],CELL,CELL);};
  const meta=e.side==='boss'?{id:'r411:boss:'+e.name+':'+e.t0.toFixed(3),kind:'effect',x:e.x,y:e.y,enemy:true,r411:true}:{id:'r411:hero-hit:'+e.name+':'+e.t0.toFixed(3),kind:'effect',x:e.x,y:e.y,r411:true};
  if(typeof ctx.scope==='function')ctx.scope(meta,run);else run();stats.drawn++;e.frame=fr;}catch(err){fail(err);}finally{ctx.restore();}}
function drawAll(){if(typeof ctx==='undefined'||!ctx||typeof project!=='function')return;for(const e of list)drawOne(e);}
// ---- 보스 장판 착탄 ------------------------------------------------------------------------------------
const owners=new Map(),perBoss=new Map();
function ownerOf(id){if(!id||typeof room==='undefined'||!room?.enemies)return null;let e=owners.get(id);if(e&&room.enemies.includes(e))return e;e=room.enemies.find(v=>v&&v.id===id)||null;if(e)owners.set(id,e);return e;}
function scanHazards(){if(!prefs.boss||typeof hazards==='undefined'||!Array.isArray(hazards))return;const t=T();
 for(const h of hazards){if(!h||h.type!=='field'||h.r411||!h.owner||!fin(h.age))continue;const e=ownerOf(h.owner);if(!e||!(e.boss||e.midboss)){h.r411='skip';continue;}
  const set=bossSet(e),name=(set.n%3===2)?set.b:set.a,lead=SHEET[name][3],warn=fin(h.warning)?h.warning:0;if(h.age<warn-lead)continue;
  h.r411=name;const k=e.id,w=perBoss.get(k)||{t:-9,n:0};if(t-w.t>.4){w.t=t;w.n=0;}if(w.n>=(low()?2:4)){stats.throttled++;continue;}w.n++;perBoss.set(k,w);set.n++;
  const rad=fin(h.radius)?h.radius:1.6;play(name,h.x,h.y,{size:Math.max(.7,Math.min(2.2,rad/1.6)),lead:Math.max(0,h.age-(warn-lead)),flip:(hash(h.id)&1)===1,owner:k});}}
// ---- 영웅 적중 ----------------------------------------------------------------------------------------
let lastHit=-9;const enemyHit=new WeakMap();
function heroHit(e){if(!prefs.hero||typeof player!=='object'||!player)return;if(window.__STORYWORLD_NEON_LAUREN_R437__?.ownsHit?.(player.hero))return;/* R437: 네온 삼각 연쇄 시트 대신 민트 체인 */const name=HERO[player.hero];if(!name)return;const t=T();
 if(t-lastHit<.22||t-(enemyHit.get(e)||-9)<.6){stats.throttled++;return;}lastHit=t;enemyHit.set(e,t);
 play(name,e.x+(Math.random()-.5)*.25,e.y+(Math.random()-.5)*.2,{size:e.boss||e.midboss?1.25:.85,flip:player.x>e.x});}
try{
 if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,...a){const alive=!!(e&&e.hp>0);const r=base.call(this,e,value,...a);try{if(r&&alive&&prefs.on)heroHit(e);}catch(err){fail(err);}return r;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r411-sheet-fx'){try{drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{if(prefs.on){scanHazards();const t=T();
   for(let i=list.length-1;i>=0;i--){const e=list[i];if((t-e.t0)*e.speed>=DUR||t<e.t0-2)list.splice(i,1);}}
   if(list.length)arm();else if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const r=await base.apply(this,a);list.length=0;owners.clear();perBoss.clear();return r;};}
}catch(e){fail(e);}
function set(v){prefs={...prefs,...(typeof v==='object'?v:{on:v!==false})};if(!prefs.on)list.length=0;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_SKILL_SHEETS_R411__=Object.freeze({revision:REV,dir:DIR,sheets:SHEET,families:FAM,heroes:HERO,bossSet,play,set,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:JSON.parse(JSON.stringify(stats)),active:list.map(e=>({name:e.name,side:e.side,frame:e.frame??null,x:+e.x.toFixed(2),y:+e.y.toFixed(2)})),lastError})});
})();
