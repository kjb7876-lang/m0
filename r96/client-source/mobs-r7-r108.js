/* R108 R7: the artist's four-state key poses (walk / idle / hit / attack) for story-mode mobs. Presentation only.
 *
 * Data: mobs-r7-data-r108.js (73 sets, 110 native mob ids, assets/r108/r7/*.webp). A set is ONE drawing per state, not an
 * animation, so this overlay only decides which drawing is on screen; every other motion (stride bob, lean, thrust,
 * hit recoil, spawn-in, toppling death) still comes from the existing pose chain (R56 / R101 / R108 mobs).
 *
 * How the drawings reach the screen (same trick R92 and R105 use): while ONE enemy is drawn,
 *   - e.profile is replaced by a shallow copy whose frames idle / move / hit / death / windup / attack(A,B) / recover are the R7
 *     frames ({path, assetFrame:{sourceRect, pivot, visibleHeight, bakedFacing}}), and
 *   - portable.enemyNativePresentation150[nativeId] (the table the R54 story clock reads its anticipation / contact / recovery
 *     frames from) is swapped for the same frames,
 * then both are put back in a finally block. Timers, hit shapes, AI, saves and the native clocks are only read.
 *
 * State -> drawing:
 *   idle                    idle pose
 *   move                    walk pose while the mob walks (held 0.2 s so a mob that stutters at a wall does not flicker), else idle
 *   hit (hitTimer > 0)      hit pose
 *   windup / anticipation   idle pose (the R56 / R101 pose chain leans and crouches it; there is no separate wind-up drawing)
 *   contact (active)        attack pose
 *   recovery                attack pose for the first 0.14 s after contact (0.27 s after a ranged release), then idle
 *   death                   hit pose (R7 has no death drawing; the native fade / ash / corpse code keeps running on it, so the
 *                           creature never swaps to its old art while it dies)
 * Facing: every set carries the way its art looks (d = R / L). Frames carry bakedFacing and r7Face; play-r106.js mirrors them so
 * the creature looks at the hero. Bosses, mid-bosses, personas, R74 patrol clones (their own authored art) and 사몽 stage mobs are
 * left alone. visual-r92-mobs.js skips the ids this overlay owns, so one mob never mixes R92 strips with R7 drawings.
 * Settings: window.__STORYWORLD_MOBS_R7_R108__.set({enabled:false}) restores the previous art (stored in localStorage). */
(()=>{'use strict';
if(window.__STORYWORLD_MOBS_R7_R108__)return;
const D=window.__STORYWORLD_MOBS_R7_DATA_R108__;
if(!D||!D.groups||!D.byId||typeof drawEnemy!=='function'||typeof readyImage!=='function'||typeof addImage!=='function')return;
const REV='R108-mobs-r7-1';
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r108.mobsR7';
const prefs={enabled:true};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof saved?.enabled==='boolean')prefs.enabled=saved.enabled;}catch(_){}
let lastError=null;const stats={draws:0,notReady:0,preloads:0,regionPaths:0,swaps:0,walk:0,idle:0,hit:0,attack:0,death:0,errors:0};
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const HOLD=.14,HOLD_RANGED=.27,WALK_HOLD=.2;
const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room;

// ---- frames (built lazily, immutable, shared by every enemy of a set) --------------------------------------------
const sets=new Map();
function setOf(key){let s=sets.get(key);if(s)return s;const g=D.groups[key];if(!g)return null;
 const path=D.dir+g.f,baked=g.d==='L'?'left':'right';
 const mk=st=>{const t=g.t[st];return Object.freeze({path,r7:key+':'+st,r7Face:g.d,
  assetFrame:Object.freeze({sourceRect:Object.freeze([t[0],t[1],t[2],t[3]]),pivot:Object.freeze([t[4],t[5]]),visibleHeight:t[6],bakedFacing:baked})});};
 s={key,g,path,walk:mk('walk'),idle:mk('idle'),hit:mk('hit'),attack:mk('attack'),maps:new Map(),natives:new Map()};sets.set(key,s);return s;}
// bit 1: walk pose for "move"; bit 2: keep the attack pose through the first part of the recovery.
function lend(s,bits){let m=s.maps.get(bits);if(m)return m;
 m=Object.freeze({idle:s.idle,move:bits&1?s.walk:s.idle,hit:s.hit,death:s.hit,windup:s.idle,attack:s.attack,attackA:s.attack,attackB:s.attack,recover:bits&2?s.attack:s.idle});
 s.maps.set(bits,m);return m;}

// ---- which enemies are ours ----------------------------------------------------------------------------------------
const major=e=>!!(e.boss||e.midboss||e.persona);
// Intent only (no image check) so visual-r92-mobs.js does not step in with its own strips while our atlas is still loading.
function owns(e){if(!prefs.enabled||!e||!e.nativeId)return false;if(!D.byId[e.nativeId])return false;
 if(major(e)||e.r74Monster||e.samongR103)return false;
 if(typeof zone!=='undefined'&&zone==='ep1a08')return false;
 return true;}

// ---- per-enemy bookkeeping (no per-frame allocation) -----------------------------------------------------------------
const mem=new WeakMap();
function memOf(e){let m=mem.get(e);if(!m){m={walkUntil:-9,rw:false,relAt:-9};mem.set(e,m);}return m;}
function bitsOf(e){const m=memOf(e),t=typeof time==='number'?time:0;let bits=0;
 if(e.moving)m.walkUntil=t+WALK_HOLD;if(t<m.walkUntil)bits|=1;
 const rw=e.rangedWindup>0;if(m.rw&&!rw)m.relAt=t;m.rw=rw;
 const a=e.attack;
 if(a){const shape=a.shape154||e.combatProfile?.attackShape||{},wind=Number(a.castWindup150??shape.windup)||0,act=Number(shape.active)||0;if((Number(a.elapsed)||0)<wind+act+HOLD)bits|=2;}
 else if(t-m.relAt<HOLD_RANGED)bits|=2;
 return bits;}

// ---- shadow profiles / native tables (cached: nothing is allocated per frame after warm-up) ---------------------------
const shadows=new WeakMap();
function shadowOf(prof,s,bits){let by=shadows.get(prof);if(!by){by=new Map();shadows.set(prof,by);}
 const k=s.key+':'+bits;let sh=by.get(k);if(sh)return sh;
 sh={...prof,frames:{...(prof.frames||{}),...lend(s,bits)}};by.set(k,sh);return sh;}
function nativeOf(s,bits,orig){let by=s.natives.get(bits);if(!by){by=new WeakMap();s.natives.set(bits,by);}
 let n=by.get(orig);if(n)return n;n={...orig,...lend(s,bits)};by.set(orig,n);return n;}

// ---- images: loaded with the region, re-requested if the engine's cache purge dropped them --------------------------
let preAt=0,preRoom=null;
function ready(s){const row=readyImage(s.path);const im=row?.image;return !!im&&im.naturalWidth===s.g.w&&im.naturalHeight===s.g.h;}
function preload(){if(typeof room==='undefined'||!room)return;const now=performance.now();if(preRoom===room&&now-preAt<2000)return;preAt=now;preRoom=room;
 const want=new Set();for(const e of room.enemies||[]){if(owns(e))want.add(D.byId[e.nativeId]);}
 for(const k of want){const p=D.dir+D.groups[k].f;if(!readyImage(p)){addImage(p,'R108 R7 mob poses');stats.preloads++;}}}
// Region roster -> atlas paths, so the engine's own loader (loading bar) fetches them and releaseImageMemory() keeps them.
function regionPaths(def){const out=new Set();if(!def)return[];
 for(const list of [def.roster,def.bosses,def.optional,def.midboss?[def.midboss]:null]){if(!Array.isArray(list))continue;
  for(const d of list){const id=d?.id||d?.nativeId,k=id&&D.byId[id];if(k&&!d?.boss&&!d?.midboss&&D.groups[k])out.add(D.dir+D.groups[k].f);}}
 return[...out];}
if(typeof enterRegion==='function'){const eb=enterRegion;enterRegion=async function(id,...a){
 try{if(prefs.enabled){const def=typeof regionById!=='undefined'?regionById[id]:null;if(def&&Array.isArray(def.paths)){for(const p of regionPaths(def))if(!def.paths.includes(p)){def.paths.push(p);stats.regionPaths++;}}}}catch(e){fail(e);}
 return eb.apply(this,[id,...a]);};}

// ---- the draw hook ---------------------------------------------------------------------------------------------------
const base=drawEnemy;
drawEnemy=function(e,...args){let sel=null;
 try{if(owns(e)&&live()){const s=setOf(D.byId[e.nativeId]);
   if(s){const dead=e.spawnState==='dead'||e.hp<=0;
    if(dead&&(typeof time==='number'?time:0)-(Number.isFinite(e.deadAt)?e.deadAt:0)>1.2){}
    else if(!ready(s)){stats.notReady++;preload();}
    else{const prof=e.profile;if(prof&&prof.frames){const bits=bitsOf(e);sel={prof:shadowOf(prof,s,bits),s,bits};}}}}}
 catch(err){fail(err);sel=null;}
 if(!sel)return base.call(this,e,...args);
 const prof=e.profile,id=e.nativeId,tbl=typeof portable==='object'&&portable?portable.enemyNativePresentation150:null,had=!!tbl&&Object.prototype.hasOwnProperty.call(tbl,id),prev=had?tbl[id]:undefined;
 e.profile=sel.prof;if(had){tbl[id]=nativeOf(sel.s,sel.bits,prev);stats.swaps++;}
 stats.draws++;
 try{return base.call(this,e,...args);}
 finally{e.profile=prof;if(had)tbl[id]=prev;}};

// ---- facing for play-r106.js (it mirrors frames that carry r7Face so the mob looks at the hero) ---------------------------
const faceOf=(e,f)=>{const r=f?.r7Face;return r==='R'||r==='L'?r:null;};

function set(patch={}){if(typeof patch.enabled==='boolean')prefs.enabled=patch.enabled;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
function decodedBytes(){let n=0,files=0;try{for(const[p,row]of imageCache){if(p.startsWith(D.dir)&&row.ready&&row.image){n+=row.image.naturalWidth*row.image.naturalHeight*4;files++;}}}catch(_){}return{files,bytes:n};}
function coverage(){const es=(typeof room!=='undefined'&&room?.enemies)||[];const mine=es.filter(e=>D.byId[e.nativeId]);
 return{zone:typeof zone!=='undefined'?zone:null,enemies:es.length,inR7Ids:mine.length,owned:mine.filter(owns).length,
  skipped:mine.filter(e=>!owns(e)).map(e=>e.id+(e.r74Monster?' (r74)':major(e)?' (major)':'')),ready:[...new Set(mine.filter(owns).map(e=>D.byId[e.nativeId]))].filter(k=>ready(setOf(k))).length};}
window.__STORYWORLD_MOBS_R7_R108__=Object.freeze({revision:REV,prefs:()=>({...prefs}),set,storageKey:KEY,owns,faceOf,
 groupOf:id=>D.byId[id]||null,framesOf:id=>{const k=D.byId[id],s=k&&setOf(k);return s?{walk:s.walk,idle:s.idle,hit:s.hit,attack:s.attack}:null;},
 coverage,decoded:decodedBytes,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},sets:Object.keys(D.groups).length,ids:Object.keys(D.byId).length,decoded:decodedBytes(),lastError,presentationOnly:true,gameplayChanged:false,saveSlotsChanged:false})});
})();
