/* R104 boss key poses. The Drive HAPIL batches deliver four authored attack key
 * poses per boss (anticipation, strike toward the screen bottom, follow-through,
 * recovery). The boss's existing frame objects (major pose table and its own
 * profile frames, including the copies an attack action keeps) answer with the
 * new art only while that boss is being drawn, so combat logic, clocks and hit
 * geometry keep reading the original frames. Main bosses that change form use
 * the new body only in the phase the art depicts. */
(()=>{'use strict';
 if(window.__STORYWORLD_BOSS_KEYPOSES_R104__)return;
 const DATA=window.__STORYWORLD_BOSS_KEYPOSES_R104_DATA__||{},REV='boss-keyposes-r104';
 // Phase indices (phaseSprites5 / phasePresentation order) each form depicts.
 const PHASES={'b02-boss':[0,1],'b04-boss':[2],'b06-boss':[0,1],'b06b-boss':[0],'b07-boss':[0],'b08-boss':[0,1],'b09-boss':[1,2],'a11-boss':[0]};
 // Native frame keys -> key pose (0 anticipation, 1 strike, 2 follow-through, 3 recovery).
 const POSE={anticipation:0,windup:0,prepare:0,charge:0,attack:1,attackA:1,strike:1,contact:1,attackB:2,hit:2,recover:2,follow:2,idle:3,move:3,recovery:3,death:3};
 const KEY='storyworld.r104.keyposes',stats={draws:0,swapped:0,patchedFrames:0,skippedPhase:0,loading:0,failures:0};let lastError=null,cur=null,on=true;
 try{on=localStorage.getItem(KEY)!=='off';}catch{}
 const fail=e=>{stats.failures++;lastError=String(e?.message||e).slice(0,160);};
 const NEW={};for(const [id,d] of Object.entries(DATA))NEW[id]=d.frames.map(f=>Object.freeze({path:f.path,assetFrame:Object.freeze({sourceRect:Object.freeze([0,0,f.w,f.h]),pivot:Object.freeze([...d.pivot]),visibleHeight:d.visibleHeight})}));
 const defs=new Map();
 function defOf(id){if(!defs.has(id)){let hit=null;try{for(const reg of Object.values(regionById||{})){for(const d of [...(reg.bosses||[]),...(reg.midboss?[reg.midboss]:[])])if(d?.id===id){hit=d;break;}if(hit)break;}}catch{}defs.set(id,hit);}return defs.get(id);}
 function phaseOf(e){if(Number.isFinite(e.phase))return e.phase;const ps=e.profile?.phaseSprites5||defOf(e.nativeId)?.phaseSprites5;if(Array.isArray(ps)){const i=ps.indexOf(e.path);if(i>=0)return i;}return 0;}
 const requested=new Set();
 function ready(id){let ok=true;for(const f of NEW[id]){if(readyImage(f.path))continue;ok=false;if(!requested.has(f.path)){requested.add(f.path);try{addImage(f.path);}catch(e){fail(e);}}}if(!ok)stats.loading++;return ok;}
 // Decided once per draw call; the getters below only read it.
 let curOk=false;
 function allowed(e){if(!on||!e||!NEW[e.nativeId])return false;const want=PHASES[e.nativeId];if(want&&!want.includes(phaseOf(e))){stats.skippedPhase++;return false;}return ready(e.nativeId);}
 const patched=new WeakSet();
 function patchFrame(f,id,i){
  if(!f||typeof f!=='object'||patched.has(f)||Object.isFrozen(f))return;
  const own={path:f.path,assetFrame:f.assetFrame,extraLayers150:f.extraLayers150,bodyNormalization5:f.bodyNormalization5},pick=()=>curOk&&cur?.nativeId===id?NEW[id][i]:null;
  try{
   for(const k of ['path','assetFrame'])Object.defineProperty(f,k,{configurable:true,enumerable:true,get(){const n=pick();if(n){stats.swapped++;return n[k];}return own[k];},set(v){own[k]=v;}});
   for(const k of ['extraLayers150','bodyNormalization5'])Object.defineProperty(f,k,{configurable:true,enumerable:own[k]!==undefined,get(){return pick()?undefined:own[k];},set(v){own[k]=v;}});
   patched.add(f);stats.patchedFrames++;
  }catch(e){fail(e);}
 }
 function patchSet(set,id){if(!set||typeof set!=='object'||patched.has(set))return;patched.add(set);for(const [k,f] of Object.entries(set))patchFrame(f,id,POSE[k]??3);}
 function install(){
  const M=typeof portable==='object'&&portable?.majorNativePresentation150||{};
  for(const id of Object.keys(NEW)){patchSet(M[id]?.poses,id);patchSet(defOf(id)?.frames,id);}
  // Main bosses also draw plain sprites by path (their phase body and some action
  // stills). While such a boss is drawn in its depicted phase, those actor images
  // resolve to the key poses: attack stills to the strike, the rest to recovery.
  const imageBase=readyImage;readyImage=function(p,...a){
   if(curOk&&cur&&PHASES[cur.nativeId]&&typeof p==='string'&&!p.startsWith('assets/r104/')&&(p===cur.path||/actors-normalized|actors\/v3/.test(p))){const n=NEW[cur.nativeId][/attack|strike|cast/i.test(p)?1:3];const row=imageBase.call(this,n.path,...a);if(row){stats.swapped++;return row;}}
   return imageBase.call(this,p,...a);};
  const base=drawEnemy;drawEnemy=function(e,...a){const prev=cur,prevOk=curOk;cur=e;stats.draws++;try{curOk=allowed(e);if(curOk&&e.profile)patchSet(e.profile.frames,e.nativeId);}catch(err){curOk=false;fail(err);}
   try{return base.call(this,e,...a);}finally{cur=prev;curOk=prevOk;}};
  return true;
 }
 let installed=false;try{installed=install();}catch(e){fail(e);}
 function setEnabled(v){on=!!v;try{localStorage.setItem(KEY,on?'on':'off');}catch{}return on;}
 window.__STORYWORLD_BOSS_KEYPOSES_R104__=Object.freeze({revision:REV,ids:Object.keys(NEW),phases:PHASES,setEnabled,get enabled(){return on;},framesFor:id=>NEW[id]||null,inspect:()=>({revision:REV,installed,enabled:on,sets:Object.keys(NEW).length,stats:{...stats},lastError})});
})();
