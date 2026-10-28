/* R92 mob move/attack strips. Presentation only: processed copies of the R92
 * mob derived 4-frame strips (assets/r92/mobs). While one enemy is drawn its
 * profile is shadowed so the native state picker (move / windup / attack)
 * finds the strip frame for the current moment; timing, attack shapes, hit
 * detection, AI and saves are read, never written. Canonical source; copied
 * by apply-r92-mobs.cjs. */
(()=>{'use strict';
 const A=window.StoryPhase1;
 if(!A||window.__STORYWORLD_VISUAL_R92_MOBS__||typeof drawEnemy!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r92.mobs';
 const DEFAULTS=Object.freeze({mobMotion:true}),LABELS={mobMotion:'잡몹 이동·공격 동작'};
 const INDEX='./assets/r92/mobs/index.json',MOVE_FPS=6.5,FOLLOW=.22,FRAMES=4;
 let prefs={...DEFAULTS},index=null,state='idle',lastError=null,preloadAt=0,preloadZone=null;
 const stats={draws:0,move:0,windup:0,attack:0,follow:0,missingImage:0,preloads:0,errors:0},cache=new Map();
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof saved?.mobMotion==='boolean')prefs.mobMotion=saved.mobMotion;}catch(_){}
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e);};
 const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
 function set(patch={}){if(typeof patch.mobMotion==='boolean')prefs.mobMotion=patch.mobMotion;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 function load(){if(state!=='idle')return;state='loading';
  fetch(INDEX,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('R92 mobs index '+r.status);return r.json();}).then(j=>{index=j;state='ready';}).catch(e=>{state='failed';fail(e);});}
 // R108: the ids the R7 four-state poses own (mobs-r7-r108.js) never get R92 strips, so one mob never mixes two arts.
 const r7=e=>{try{return window.__STORYWORLD_MOBS_R7_R108__?.owns?.(e)===true;}catch(_){return false;}};
 const groupOf=e=>index&&e?.nativeId&&!r7(e)?index.groups[index.byId[e.nativeId]]||null:null;
 // Bosses, midbosses, personas and the authored hospital/R74 art keep their own frames.
 const eligible=e=>!!e&&!e.boss&&!e.midboss&&!e.persona&&!e.r74Monster&&e.hp>0&&e.spawnState!=='dead'&&!(e.hitTimer>0)&&zone!=='ep1a08'&&(typeof layer==='undefined'||layer==='STORY');
 // r3 index: one pivot per track (t.pivot) and N cells; the R92 index had a pivot per cell.
 const count=t=>t.frames||t.pivots?.length||FRAMES;
 function frame(groupId,g,kind,i,facing){const k=groupId+':'+kind+':'+i+':'+facing;let f=cache.get(k);if(f)return f;const t=g.tracks[kind],[cw,ch]=t.cell,[px,py]=t.pivot||t.pivots[i];
  f=Object.freeze({path:t.path,r92Mob:true,assetFrame:Object.freeze({sourceRect:[i*cw,0,cw,ch],pivot:[px,py],visibleHeight:t.visibleHeight||g.visibleHeight,...(facing?{bakedFacing:facing}:{})})});cache.set(k,f);return f;}
 // Mirrors the native drawEnemy state picker; returns the frames to lend.
 function patchFor(e){const g=groupOf(e);if(!g)return null;const id=index.byId[e.nativeId],F=e.profile?.frames||{},out={};
  const ready=t=>t&&typeof readyImage==='function'&&!!readyImage(t.path);
  if(e.attack&&g.tracks.attack){if(!ready(g.tracks.attack)){stats.missingImage++;return null;}
   const shape=e.attack.shape154||e.combatProfile?.attackShape||{},wind=Number(e.attack.castWindup150??shape.windup)||0,act=Number(shape.active)||0,t=Number(e.attack.elapsed)||0;
   // Spread the track over windup (first half of cells), active and follow-through.
   const n=count(g.tracks.attack),half=Math.max(1,Math.floor(n/2)),i=t<wind?Math.min(half-1,Math.floor(t/Math.max(.01,wind)*half)):t<wind+act?Math.min(n-1,half):Math.min(n-1,half+1+Math.floor((t-wind-act)/FOLLOW*(n-half-1))),f=frame(id,g,'attack',i,F.attack?.assetFrame?.bakedFacing||F.idle?.assetFrame?.bakedFacing);
   if(t<wind+act){out.attack=out.attackA=out.attackB=out.windup=f;stats[t<wind?'windup':'attack']++;}
   else if(t<wind+act+FOLLOW){out.idle=out.move=f;stats.follow++;}else return null;return out;}
  if(e.rangedWindup>0&&g.tracks.attack){if(!ready(g.tracks.attack)){stats.missingImage++;return null;}
   const f=frame(id,g,'attack',Math.floor(time*5)%2,F.attack?.assetFrame?.bakedFacing||F.idle?.assetFrame?.bakedFacing);out.attack=out.windup=f;stats.windup++;return out;}
  if(e.moving&&g.tracks.move){if(!ready(g.tracks.move)){stats.missingImage++;return null;}
   const n=count(g.tracks.move),i=Math.floor(time*MOVE_FPS*n/FRAMES+(hash(e.id)%n))%n;out.move=frame(id,g,'move',i,F.move?.assetFrame?.bakedFacing||F.idle?.assetFrame?.bakedFacing);stats.move++;return out;}
  return null;}
 // The native image cache is purged after region entry; re-request missing strips.
 function preload(){const now=performance.now();if(!index||typeof addImage!=='function'||typeof readyImage!=='function')return;if(preloadZone===zone&&now-preloadAt<2000)return;preloadAt=now;preloadZone=zone;
  const want=new Set();for(const e of room?.enemies||[]){const g=groupOf(e);if(g)for(const t of Object.values(g.tracks))want.add(t.path);}
  for(const p of want)if(!readyImage(p)){addImage(p,'R92 generated mob motion');stats.preloads++;}}
 const base=drawEnemy;
 drawEnemy=function(e,...args){let patch=null;
  try{load();if(prefs.mobMotion&&index&&eligible(e)){preload();patch=patchFor(e);}}catch(err){fail(err);patch=null;}
  if(!patch)return base.call(this,e,...args);
  const prof=e.profile,shadowed=Object.create(prof);shadowed.frames={...(prof.frames||{}),...patch};stats.draws++;
  e.profile=shadowed;try{return base.call(this,e,...args);}finally{e.profile=prof;}};
 function settingsSection(){const host=document.getElementById('retroSettingsR92')||document.getElementById('retroSettingsR91');if(!host||document.getElementById('retroSettingsR92Mobs'))return;
  const s=document.createElement('section');s.id='retroSettingsR92Mobs';s.innerHTML='<h3>잡몹 동작 (R92)</h3><p class="small muted">그림만 바뀌며 공격 시간·판정은 그대로입니다.</p><label><input type="checkbox" id="r92-mobMotion"> '+LABELS.mobMotion+'</label>';
  host.parentNode.insertBefore(s,host.nextSibling);const el=s.querySelector('#r92-mobMotion');el.checked=prefs.mobMotion;el.onchange=()=>set({mobMotion:el.checked});}
 if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...args){const result=sb.apply(this,args);try{settingsSection();}catch(e){fail(e);}return result;};}
 window.__STORYWORLD_VISUAL_R92_MOBS__=Object.freeze({prefs:()=>({...prefs}),set,storageKey:KEY,
  groupFor:e=>index?.byId?.[e?.nativeId]||null,
  coverage:()=>{const es=(room?.enemies||[]).filter(e=>!e.boss&&!e.midboss);return{zone,enemies:es.length,mapped:es.filter(e=>groupOf(e)).length,withMove:es.filter(e=>groupOf(e)?.tracks.move).length,withAttack:es.filter(e=>groupOf(e)?.tracks.attack).length};},
  inspect:()=>({revision:'R92-mobs',prefs:{...prefs},index:state,groups:index?Object.keys(index.groups).length:0,ids:index?Object.keys(index.byId).length:0,stats:{...stats},lastError,presentationOnly:true,gameplayChanged:false,saveSlotsChanged:false})});
})();
