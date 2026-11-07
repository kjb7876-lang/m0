// R380 — 사용자 직접 검수 목록(v18) 채택 몹 적용(사용자 2026-11-07 "어제오늘 내가 신규생성한것들 구글드라이브에 있는데 게임에 왜 적용안함 뺄꺼 빼고 넣을꺼 넣고 교체할거 교체").
//  · 재 나방(dist01): 몸통 다듬은 v2(비행4·공격4).
//  · 보랏빛 알집지기(dist01): 실사풍 v1(이동4·공격4) — "저걸로 채택 기존거 폐기".
//  · 거미줄에 묶인 수호병(dist01): 검은 안개 v4(이동6·공격5). 픽셀 그림 모드(R306)에서는 픽셀판.
//  · 망각의 거미: "로봇느낌나서 통제자쪽 서사 맵으로 옮겨줘 이름도 기계화망각거미로" → dist01 에서 빼고, 통제자 u202(잔인한 구원)에
//    '기계화 망각거미'로 넣는다(새 관절형 그림). 그 지역 일반 몹(가짜 자비 수집가)의 수치를 그대로 빌려 난이도를 바꾸지 않는다.
//  · 그림만 엔진 frameFor 사슬에 내준다. 판정·보상·저장은 그대로. storyworld.r380.mobs {on:false} 로 끈다(이동·개명은 새로 만드는 지역부터).
(()=>{'use strict';
if(window.__STORYWORLD_APPROVED_MOBS_R380__)return;
const REV='R380-approved-1',KEY='storyworld.r380.mobs',INDEX='assets/r380/mobs/index.json';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={assigned:0,frames:0,waiting:0,removed:0,added:0,reinstalls:0,errors:0,deaths:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
let idx=null;if(typeof fetch==='function')fetch(INDEX).then(r=>r.ok?r.json():null).then(j=>{if(j?.mobs)idx=j;}).catch(fail);
const curLayer=()=>{try{return typeof layer==='string'?layer:'STORY';}catch(_){return 'STORY';}};
const zoneOf=()=>{try{return String(typeof room==='object'&&room?(room.id||''):'');}catch(_){return '';}};
const artMode=()=>{try{return window.__STORYWORLD_MOB_ART_VARIANTS_R306__?.inspect?.().mode==='pixel'?'pixel':'painted';}catch(_){return 'painted';}};
const T=()=>typeof time==='number'?time:performance.now()/1000;
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
const attacking=e=>!!(e?.attack&&Number.isFinite(e.attack.elapsed));
const SPIDER=/망각의 거미/,MECH='기계화 망각거미';
// ── 이동·개명: 지역을 만들 때 한 번(결정적) ──
function relocate(r,id,l){if(!prefs.on||!r||!Array.isArray(r.enemies)||l==='DREAM')return r;
 if(id==='dist01'){const n=r.enemies.length;r.enemies=r.enemies.filter(e=>!(e&&!e.boss&&String(e.nativeId||'').startsWith('dist01-sp1')&&SPIDER.test(e.name||'')));stats.removed+=n-r.enemies.length;}
 else if(id==='u202'&&!r.enemies.some(e=>e?.r380Mech)){const src=r.enemies.filter(e=>e&&!e.boss&&!e.midboss&&e.nativeId==='u202-e1'&&/^가짜 자비 수집가( \d+)?$/.test(e.name||'')&&e.spawnState==='active');
  const take=src.slice(0,4);take.forEach((e,i)=>{const c={...e,id:e.id+':r380mech',name:MECH+' '+(i+1),r380Mech:true,squadR373:undefined,r373Slot:undefined,r373Anchor:undefined,r373From:undefined,
   x:e.x+.9,y:e.y-.6,homeX:e.homeX+.9,homeY:e.homeY-.6,attack:null,nav:null,aim:null,profile:e.profile?{...e.profile}:e.profile};r.enemies.push(c);stats.added++;});}
 return r;}
function installRoom(){if(typeof makeRoom!=='function'||makeRoom.__r380)return typeof makeRoom==='function';const base=makeRoom;
 const w=function(id,l,...a){const r=base.call(this,id,l,...a);try{return relocate(r,id,l);}catch(err){fail(err);return r;}};w.__r380=true;try{makeRoom=w;}catch(_){}try{window.makeRoom=w;}catch(_){}return true;}
// ── 그림 ──
function match(e){if(!idx||!e||e.hero||e.boss||e.r170Tower||e.r251Circle)return null;try{if(typeof player!=='undefined'&&e===player)return null;}catch(_){}
 const L=curLayer(),n=String(e.name||''),mode=artMode();
 return idx.mobs.find(m=>{const a=m.actor;if(a.layer!==L)return false;if(a.zone&&zoneOf()!==a.zone)return false;if(a.artMode&&a.artMode!==mode)return false;return new RegExp(a.name).test(n);})||null;}
function assign(e){if(!prefs.on||!idx||!e)return null;const k=curLayer()+'|'+zoneOf()+'|'+artMode();if(e.r380Checked===k)return e.r380Mob?idx.mobs.find(m=>m.id===e.r380Mob)||null:null;
 e.r380Checked=k;const m=match(e);e.r380Mob=m?.id||null;if(m)stats.assigned++;return m;}
function progress(e){const sh=e.attack.shape154||e.combatProfile?.attackShape||{},tot=Math.max(.2,(e.attack.castWindup150??sh.windup??.45)+(sh.active??.15)+(sh.recovery??.35));return Math.min(.999,Math.max(0,e.attack.elapsed/tot));}
function cellFor(e,m){if(attacking(e))return m.attack[Math.floor(progress(e)*m.attack.length)];
 if(e.rangedWindup>0)return m.attack[0];
 if(!(e.hp>0)||e.hitTimer>0)return m.move[0];
 if(e.moving)return m.move[Math.floor(T()*8+hash(e.id)*8)%m.move.length];
 return m.idle?.length&&m.idle[0]!==m.move[0]?m.idle[0]:m.move[Math.floor(T()*1.6+hash(e.id)*2)%2];}
function faceLeft(e){if(attacking(e)&&Number.isFinite(e.attack.angle)){const sd=Math.cos(e.attack.angle)-Math.sin(e.attack.angle);if(Math.abs(sd)>.05)return sd<0;}
 try{return !!(player&&(player.x-player.y)<(e.x-e.y));}catch(_){return false;}}
function frameOf(e,m){const [cw,ch]=m.cell,[px,py]=m.pivot,vh=m.visibleHeight||150,k=cellFor(e,m),cols=m.cols||k+1,sx=(k%cols)*cw,sy=Math.floor(k/cols)*ch;
 const flip=faceLeft(e)!==(m.facing==='left');
 return {path:m.path,assetFrame:{sourceRect:[sx,sy,cw,ch],pivot:[px,py],visibleHeight:vh},sourceAlphaCore:[sx,sy,cw,ch],metricThreshold:16,sourcePixelsEdited:false,
  normalizedFullRectangleExtents:[-px/vh,-py/vh,(cw-px)/vh,(ch-py)/vh],r380Mob:m.id,r208Mob:m.id,flip};}
const ready=p=>typeof readyImage==='function'&&readyImage(p)?.image?.naturalWidth>0;
function install(){const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(!S||typeof S.frameFor!=='function')return false;if(S.__r380)return true;
 window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r380:true,frameFor(e,f){try{const m=prefs.on?assign(e):null;if(m){
   if(!ready(m.path)){if(typeof ensureImages==='function')Promise.resolve(ensureImages([m.path])).catch(()=>{});stats.waiting++;return S.frameFor(e,f);}
   stats.frames++;return frameOf(e,m);}}catch(err){fail(err);}return S.frameFor(e,f);}});stats.reinstalls++;return true;}
// 죽음 불꽃은 e.profile.frames.death 한 장을 찍는다 → 그 순간 새 그림 장을 넘긴다(R375 와 같은 방식).
function installDeath(){if(typeof spawnBurnDeath3!=='function'||spawnBurnDeath3.__r380)return typeof spawnBurnDeath3==='function';const base=spawnBurnDeath3;
 const w=function(e){let m=null,saved;try{m=prefs.on&&e?assign(e):null;if(m&&ready(m.path)){saved=e.profile;const p=e.profile||{};
   e.profile={...p,frames:{...(p.frames||{}),death:frameOf({...e,hp:0,attack:null},m)}};stats.deaths++;}else m=null;}catch(err){fail(err);m=null;}
  try{return base.apply(this,arguments);}finally{if(m)e.profile=saved;}};w.__r380=true;try{spawnBurnDeath3=w;}catch(_){}try{window.spawnBurnDeath3=w;}catch(_){}return true;}
try{installRoom();}catch(e){fail(e);}
let tries=0;(function arm(){try{installRoom();install();installDeath();}catch(e){fail(e);}if(++tries<80&&typeof setTimeout==='function')setTimeout(arm,250);})();
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_APPROVED_MOBS_R380__=Object.freeze({revision:REV,set,assign,match,cellFor,frameOf,relocate,installDeath,installRoom,faceLeft,
 inspect:()=>({revision:REV,prefs:{...prefs},loaded:!!idx,mode:artMode(),mobs:idx?.mobs?.map(m=>m.id)||[],stats:{...stats},lastError})});
})();
