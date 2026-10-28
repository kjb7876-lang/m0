/* R108 mobs — lively monsters in a Diablo-2 spirit. Presentation only.
 *  - 몹 생동감 level (끔/약하게/기본): the strength the R101 mob pose (polish-r101.js) uses and a
 *    swarm LOD (off-screen mobs skip the pose, far mobs in a 50+ swarm get the cheap one).
 *  - spawn-in: a mob that appears while the room is already live rises out of the floor with a
 *    short fade and a dust ring (not on room entry / restore, where everything already stands).
 *  - death: ordinary mobs topple away from the hero while the native ash dissolve plays, and a
 *    CORPSE decal (the mob's own picture, lying flat and darkened) plus a blood pool stay on the
 *    floor for ~30 s. Capped (40 corpses / 16 on lowFx, 24 pools), oldest fade first, drawn right
 *    after the ground so they never cover actors, never block or interact with anything.
 *  - shadow: follows the attack lunge / hit recoil offset and shrinks a little on the stride bob.
 * hp, timers, AI, hit shapes, positions, saves and narrative are only read. Reads
 * settings.lowFx / settings.reducedMotion. Loads after polish-r101.js and play-r106.js. */
(()=>{'use strict';
if(window.__STORYWORLD_MOBS_R108__)return;
if(typeof drawEnemy!=='function'||typeof project!=='function'||typeof groundImage!=='function'||typeof killEnemy!=='function')return;
const REV='R108-mobs-1';
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r108.mobs';
const LEVELS=Object.freeze({off:0,light:.55,normal:1}),LEVEL_LABEL=Object.freeze({off:'끔',light:'약하게',normal:'기본'});
const DEFAULTS=Object.freeze({level:'normal',corpses:true});
const prefs={...DEFAULTS};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&LEVELS[saved.level]!==undefined)prefs.level=saved.level;if(typeof saved?.corpses==='boolean')prefs.corpses=saved.corpses;}catch(_){}
function set(patch={}){if(patch&&LEVELS[patch.level]!==undefined)prefs.level=patch.level;if(typeof patch?.corpses==='boolean')prefs.corpses=patch.corpses;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}syncUI();return{...prefs};}
// UI preset hook (ui-r108.js): 낮음 → 약하게, 보통/높음 → 기본.
function setQuality(level){return set({level:level==='low'?'light':'normal'});}
const strength=()=>LEVELS[prefs.level]??1;
let lastError=null;const stats={spawns:0,topples:0,corpses:0,pools:0,splats:0,corpseDraws:0,lodCheap:0,lodSkip:0,shadowFollows:0,errors:0};
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const finite=(v,d=0)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),TAU=Math.PI*2;
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx),reduced=()=>!!(typeof settings!=='undefined'&&settings?.reducedMotion);
const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room;
const hospital=()=>typeof zone!=='undefined'&&zone==='ep1a08';
const major=e=>!!(e.boss||e.midboss||e.persona);
const bodyPx=e=>actorHeight()*finite(e.combatProfile?.spriteRect?.height,1)*finite(e.defScale,1);
const scope=(owner,fn)=>typeof ctx?.scope==='function'?ctx.scope(owner,fn):fn();
const easeOut=t=>{t=clamp(t,0,1);return 1-(1-t)*(1-t);},easeIn=t=>{t=clamp(t,0,1);return t*t;};
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const CAPS=Object.freeze({corpses:40,corpsesLow:16,pools:24,splats:24,corpseLife:30,corpseLifeLow:18,poolLife:30,splatLife:9,spawnSeconds:.5,toppleAngle:1.25});

// ---- swarm LOD ----------------------------------------------------------------------------
// Called from the R101 pose for every drawn mob. 0 skip (off screen), 1 cheap (far mob while a
// swarm of 25+ is alive), 2 full. The alive count is refreshed once per frame.
let lodT=-1,swarm=false;
function lodOf(e){if(!e||!live())return 2;
 if(lodT!==time){lodT=time;let n=0;for(const m of room.enemies){if(m.hp>0&&m.spawnState==='active')n++;if(n>24)break;}swarm=n>24;}
 const q=project(e.x,e.y);if(q.x<-90||q.x>W+90||q.y<-140||q.y>H+90){stats.lodSkip++;return 0;}
 if(swarm&&!major(e)&&Math.hypot(e.x-player.x,e.y-player.y)>9){stats.lodCheap++;return 1;}
 return 2;}

// ---- spawn-in --------------------------------------------------------------------------------
const seen=new WeakMap();let roomRef=null,roomAt=0;
function trackSpawns(){if(roomRef!==room){roomRef=room;roomAt=time;}
 for(const e of room.enemies){if(!e||e.spawnState!=='active'||!(e.hp>0)||seen.has(e))continue;
  const play=time-roomAt>1.5&&!hospital()&&strength()>0;seen.set(e,{at:time,play,seed:hash(e.id)%628/100});if(play)stats.spawns++;}}
function spawnK(e){const s=seen.get(e);if(!s||!s.play)return 1;const k=(time-s.at)/CAPS.spawnSeconds;return k>=1?1:Math.max(0,k);}
function drawSpawnDust(e,k,h){const q=project(e.x,e.y),n=lowFx()?3:5,s=seen.get(e)?.seed||0,fade=(1-k)*(1-k);
 ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(120,104,84,'+(.34*fade).toFixed(3)+')';
  for(let i=0;i<n;i++){const a=s+i*TAU/n,d=h*(.12+.42*easeOut(k)),r=h*(.06+.05*k);ctx.beginPath();ctx.ellipse(q.x+Math.cos(a)*d,q.y+Math.sin(a)*d*.45-k*h*.05,r,r*.55,0,0,TAU);ctx.fill();}
  ctx.fillStyle='rgba(20,10,8,'+(.28*fade).toFixed(3)+')';ctx.beginPath();ctx.ellipse(q.x,q.y,h*.28*(.6+.4*k),h*.12*(.6+.4*k),0,0,TAU);ctx.fill();}finally{ctx.restore();}}

// ---- shadow follows the pose ---------------------------------------------------------------
let scoped=null;
const pose=()=>{try{return window.__STORYWORLD_POLISH_R101__?.poseNow?.()||null;}catch(_){return null;}};
if(typeof shadow==='function'){const sb=shadow;shadow=function(x,y,radius,opt={}){const e=scoped;if(!e||strength()<=0)return sb.apply(this,arguments);
 const P=pose();if(!P)return sb.apply(this,arguments);const h=bodyPx(e)||1,up=clamp(P.bob/h,0,.08);stats.shadowFollows++;
 return sb.call(this,x+P.dx*.8,y+P.dy*.8,finite(radius,18)*(1-up*1.8),opt);};}

// ---- drawEnemy: spawn rise/fade, scope for the shadow -------------------------------------
const enemyBase=drawEnemy;
drawEnemy=function(e,...a){if(!e||!live()||!(e.hp>0)||e.spawnState!=='active'||strength()<=0)return enemyBase.call(this,e,...a);
 const prev=scoped;scoped=e;let k=1;try{k=spawnK(e);}catch(err){fail(err);}
 if(k>=1){try{return enemyBase.call(this,e,...a);}finally{scoped=prev;}}
 const h=bodyPx(e),q=project(e.x,e.y),lod=lodOf(e);
 ctx.save();
 try{ctx.globalAlpha*=clamp(.15+k*1.1,0,1);if(!reduced()){ctx.beginPath();ctx.rect(q.x-h*2.5,q.y-h*4.5,h*5,h*4.5+1);ctx.clip();ctx.translate(0,(1-easeOut(k))*h*.42);}
  return enemyBase.call(this,e,...a);}
 finally{ctx.restore();scoped=prev;try{if(lod===2&&!lowFx())drawSpawnDust(e,k,h);}catch(err){fail(err);}}};

// ---- death: topple, corpse, blood -----------------------------------------------------------
const corpses=[],pools=[],splats=[];const toppleOf=new Map();
function sideOf(e){const du=(e.x-e.y)-(player.x-player.y);return du<0?-1:1;} // -1: mob left of hero on screen
function bodyOf(e){const frame=e.rc146BodyFrame||e.profile?.frames?.death||e.profile?.frames?.idle||null,path=String(e.rc146BodySprite||frame?.path||e.path||'').replace(/^\.\//,'');
 return{path,frame,h:Math.max(24,finite(e.rc146BodyHeight,bodyPx(e))),flip:e.rc146BodyOptions?.flip===true};}
function onDeath(e){if(!live()||hospital()||!(strength()>0)||!prefs.corpses||major(e)||!Number.isFinite(e.x+e.y))return;
 const b=bodyOf(e);if(!b.path)return;const dir=sideOf(e),life=lowFx()?CAPS.corpseLifeLow:CAPS.corpseLife,cap=lowFx()?CAPS.corpsesLow:CAPS.corpses;
 toppleOf.set(String(e.id),{dir,at:time});if(toppleOf.size>64)toppleOf.delete(toppleOf.keys().next().value);stats.topples++;
 corpses.push({id:'r108c'+(++stats.corpses),x:e.x,y:e.y,at:time,life,dir,seed:hash(e.id)%1000/1000,...b});while(corpses.length>cap)corpses.shift();
 pools.push({x:e.x+(hash(e.id)%7-3)*.02,y:e.y,at:time,life:CAPS.poolLife,r:b.h*(.3+.14*(hash(e.id+'p')%100)/100),seed:hash(e.id+'s')%1000/1000});while(pools.length>CAPS.pools)pools.shift();stats.pools++;}
const killBase=killEnemy;killEnemy=function(e,...a){const first=!!e&&!e.deadRecorded;const r=killBase.apply(this,[e,...a]);try{if(first&&e?.deadRecorded)onDeath(e);}catch(err){fail(err);}return r;};
// small splat on a hit that takes 6%+ of the mob's health
if(typeof hitEnemy==='function'){const hb=hitEnemy;hitEnemy=function(e,value,...rest){const before=e?.hp;const r=hb.apply(this,[e,value,...rest]);
 try{if(live()&&!hospital()&&prefs.corpses&&strength()>0&&e&&Number.isFinite(before)&&e.hp<before&&e.hp>0&&!major(e)&&(before-e.hp)/Math.max(1,e.maxHp)>=.06){
  const h=bodyPx(e),s=hash(e.id+':'+time)%1000/1000,v=sideOf(e);splats.push({x:e.x+v*.12*(.5+s),y:e.y+(s-.5)*.2,at:time,life:CAPS.splatLife,r:h*(.07+.06*s),seed:s});while(splats.length>CAPS.splats)splats.shift();stats.splats++;}}catch(err){fail(err);}return r;};}
// Topple: the native ash dissolve (drawBurnDeath3) is rotated about the feet, away from the hero.
if(typeof drawBurnDeath3==='function'){const db=drawBurnDeath3;drawBurnDeath3=function(row,...a){const t=row&&!row.boss&&!row.midboss&&!hospital()&&strength()>0?toppleOf.get(String(row.sourceId||row.sourceActorIdRC145||'')):null;
 if(!t||reduced())return db.apply(this,[row,...a]);const p=clamp(row.age/Math.max(.01,row.life),0,1),ang=t.dir*CAPS.toppleAngle*easeIn(Math.min(1,p/.6))*strength(),q=project(row.x,row.y);
 ctx.save();try{ctx.translate(q.x,q.y);ctx.rotate(ang);ctx.translate(-q.x,-q.y);return db.apply(this,[row,...a]);}finally{ctx.restore();}};}
function drawBody(c,b,x,y,h,flip){const row=typeof readyImage==='function'?readyImage(b.path):null,im=row?.image;if(!im||!(im.naturalWidth>0))return false;const af=b.frame?.assetFrame;
 c.save();try{c.translate(x,y);if(flip)c.scale(-1,1);
  if(af&&Array.isArray(af.sourceRect)&&Array.isArray(af.pivot)){const[sx,sy,sw,sh]=af.sourceRect,[px,py]=af.pivot,vh=Number(af.visibleHeight||sh);if(!(sw>0&&sh>0&&vh>0)||sx+sw>im.naturalWidth||sy+sh>im.naturalHeight)return false;const sc=h/vh;c.drawImage(im,sx,sy,sw,sh,-px*sc,-py*sc,sw*sc,sh*sc);}
  else{const cr=row.crop||{x:0,y:0,w:im.naturalWidth,h:im.naturalHeight};if(!(cr.w>0&&cr.h>0))return false;const w=h*cr.w/cr.h;c.drawImage(im,cr.x,cr.y,Math.min(cr.w,im.naturalWidth-cr.x),Math.min(cr.h,im.naturalHeight-cr.y),-w/2,-h,w,h);}
 }finally{c.restore();}return true;}
function prune(list){for(let i=list.length-1;i>=0;i--)if(time-list[i].at>list[i].life||time<list[i].at-1)list.splice(i,1);}
function drawGroundLayer(){if(!live()||hospital()||!prefs.corpses||strength()<=0||typeof ctx==='undefined'||!ctx)return;
 prune(corpses);prune(pools);prune(splats);if(!corpses.length&&!pools.length&&!splats.length)return;
 scope({id:'r108:corpses',kind:'ground',groundAligned:true,alive:false},()=>{ctx.save();try{ctx.globalCompositeOperation='source-over';
  const vis=q=>q.x>-160&&q.x<W+160&&q.y>-160&&q.y<H+160,fade=o=>{const left=o.life-(time-o.at);return left<6?Math.max(0,left/6):1;};
  for(const o of pools){const q=project(o.x,o.y);if(!vis(q))continue;const g=easeOut((time-o.at)/.7),a=.5*fade(o);
   ctx.fillStyle='rgba(54,6,9,'+a.toFixed(3)+')';ctx.beginPath();ctx.ellipse(q.x+o.seed*4,q.y,o.r*g,o.r*.46*g,0,0,TAU);ctx.fill();
   ctx.fillStyle='rgba(96,12,16,'+(a*.55).toFixed(3)+')';ctx.beginPath();ctx.ellipse(q.x-o.r*.12*g,q.y-o.r*.05,o.r*.55*g,o.r*.24*g,0,0,TAU);ctx.fill();}
  for(const o of splats){const q=project(o.x,o.y);if(!vis(q))continue;const a=.42*fade(o);ctx.fillStyle='rgba(74,8,12,'+a.toFixed(3)+')';ctx.beginPath();ctx.ellipse(q.x,q.y,o.r,o.r*.42,o.seed*2,0,TAU);ctx.fill();}
  for(const o of corpses){const q=project(o.x,o.y);if(!vis(q))continue;const age=time-o.at,k=age<.45?0:easeOut((age-.45)/.5),a=.88*k*fade(o);if(a<=.01)continue;
   ctx.save();try{ctx.globalAlpha*=a;ctx.filter='brightness(.5) saturate(.55)';ctx.translate(q.x,q.y);ctx.scale(1,.55);ctx.rotate(o.dir*(1.35+.1*o.seed));if(!drawBody(ctx,o,0,0,o.h*.95,o.flip))stats.corpseMisses=(stats.corpseMisses||0)+1;else stats.corpseDraws++;}finally{ctx.restore();}}
 }finally{ctx.restore();}});}
const groundBase=groundImage;groundImage=function(...a){const r=groundBase.apply(this,a);try{drawGroundLayer();}catch(err){fail(err);}return r;};

// ---- per-tick bookkeeping; corpses vanish with the room --------------------------------------
if(typeof tick==='function'){const tb=tick;tick=function(dt){const r=tb.call(this,dt);try{if(live())trackSpawns();}catch(err){fail(err);}return r;};}
function clear(){corpses.length=0;pools.length=0;splats.length=0;toppleOf.clear();}
if(typeof enterRegion==='function'){const eb=enterRegion;enterRegion=async function(...a){const r=await eb.apply(this,a);clear();roomRef=null;return r;};}
if(typeof restoreSave==='function'){const rb=restoreSave;restoreSave=async function(...a){const r=await rb.apply(this,a);clear();roomRef=null;return r;};}

// ---- settings -----------------------------------------------------------------------------
function syncUI(){const s=document.getElementById('retroSettingsR108Mobs');if(!s)return;for(const el of s.querySelectorAll('input[name=r108mobs-level]'))el.checked=el.value===prefs.level;const c=s.querySelector('#r108mobs-corpses');if(c)c.checked=prefs.corpses;}
function settingsSection(){const host=document.getElementById('retroSettingsR102Props')||document.getElementById('retroSettingsR101')||document.getElementById('retroSettingsR92Mobs')||document.getElementById('retroSettingsR93');if(!host||document.getElementById('retroSettingsR108Mobs'))return;
 const s=document.createElement('section');s.id='retroSettingsR108Mobs';
 s.innerHTML='<h3>몹 생동감 (R108)</h3><p class="small muted">걷기·공격 예비동작·피격 반동·등장·시체는 그림만 바뀌며 피해·판정·저장은 그대로입니다.</p>'+Object.keys(LEVELS).map(k=>'<label><input type="radio" name="r108mobs-level" value="'+k+'"> '+LEVEL_LABEL[k]+'</label> ').join('')+'<label><input type="checkbox" id="r108mobs-corpses"> 시체·핏자국 남기기</label>';
 host.parentNode.insertBefore(s,host.nextSibling);for(const el of s.querySelectorAll('input[name=r108mobs-level]'))el.onchange=()=>{if(el.checked)set({level:el.value});};s.querySelector('#r108mobs-corpses').onchange=ev=>set({corpses:ev.target.checked});syncUI();}
if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...a){const r=sb.apply(this,a);try{settingsSection();}catch(e){fail(e);}return r;};}

window.__STORYWORLD_MOBS_R108__=Object.freeze({revision:REV,prefs:()=>({...prefs}),set,setQuality,strength,lodOf,levels:Object.keys(LEVELS),caps:CAPS,
 corpses:()=>corpses.map(c=>({x:c.x,y:c.y,age:time-c.at,path:c.path})),pools:()=>pools.length,splats:()=>splats.length,
 test:{spawnSeen:e=>seen.get(e)||null,death:onDeath,clear},
 inspect:()=>({revision:REV,prefs:{...prefs},strength:strength(),swarm,counts:{corpses:corpses.length,pools:pools.length,splats:splats.length},stats:{...stats},lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();
