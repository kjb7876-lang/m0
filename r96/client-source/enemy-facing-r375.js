// R375: resolve the displayed side from the same committed ray as the attack.
// R53/R54/Persona native directional frames retain their existing ownership.
// No attack targets, origins, projectiles, timers or persistent save fields change.
(()=>{'use strict';
 if(window.__STORYWORLD_ENEMY_FACING_R375__)return;
 const REV='R375-facing-1',sides=new WeakMap(),finite=Number.isFinite;
 const stats={resolved:0,held:0,flips:0,unique:0};let enabled=true;
 const living=e=>!!e&&e.hp>0&&e.spawnState!=='dead';
 function angleFor(e){
  if(!e?.attack?.storyWorldPose5&&finite(e?.attack?.angle)&&finite(e.attack.elapsed))return e.attack.angle;
  const c=window.__STORYWORLD_STORY_COMBAT_R54__?.clock?.(e);
  if(finite(c?.angle))return c.angle;
  if(e?.rangedWindup>0&&finite(e.rangedAim))return e.rangedAim;
  if(typeof player==='object'&&player&&[e?.x,e?.y,player.x,player.y].every(finite))return Math.atan2(player.y-e.y,player.x-e.x);
  return null;
 }
 function side(e,fallback=1){
  const a=angleFor(e),prior=sides.get(e)??(fallback<0?-1:1);sides.set(e,prior);
  if(!finite(a))return prior;
  // Isometric screen X is world X - world Y. Keep the last side in the narrow
  // vertical sector rather than flickering when the target crosses its centre.
  const x=Math.cos(a)-Math.sin(a);
  if(Math.abs(x)<=.05){stats.held++;return prior;}
  const next=x<0?-1:1;sides.set(e,next);stats.resolved++;return next;
 }
 function uniqueFace(e,fallback=1,sheet={}){
  if(!enabled||!living(e)||e.r170Tower||e.r251Circle)return fallback;
  const authored=sheet.facing==='left'?-1:1;stats.unique++;
  return side(e,fallback*authored)*authored;
 }
 function flipFor(e,f,fallback){
  if(!enabled||!living(e)||!f)return fallback;
  const strip=window.__STORYWORLD_MOBS_R109__?.authoredFacing?.(f);
  if(!(f.r208Mob||f.r200Shade||strip))return fallback;
  if(!f.r208Mob&&!f.r200Shade&&(e.boss||e.midboss||e.persona||f.r53HospitalPose||f.assetFrame?.bakedFacing==='eight-way'))return fallback;
  // The R208 index explicitly includes left-authored R223 sheets; R200 is right.
  const authored=(f.r208Mob?window.__STORYWORLD_STORY_MOBS_R208__?.assign?.(e)?.facing:strip)==='left'?-1:1;
  const prior=(fallback?-1:1)*authored;stats.flips++;
  return side(e,prior)*authored<0;
 }
 function install(){
  const M=window.__STORYWORLD_ENEMY_MOTION_R51__;
  if(!M||typeof M.flip!=='function')return false;
  if(M.flip.r375Facing)return true;
  const base=M.flip;
  function flip(e,f,fallback){return flipFor(e,f,base.call(this,e,f,fallback));}
  flip.r375Facing=true;
  // Preserve __r208 and other installer markers as well as every native method.
  window.__STORYWORLD_ENEMY_MOTION_R51__=Object.freeze({...M,flip});return true;
 }
 window.__STORYWORLD_ENEMY_FACING_R375__=Object.freeze({revision:REV,angleFor,uniqueFace,flipFor,install,
  set:on=>(enabled=on!==false),inspect:()=>({revision:REV,enabled,stats:{...stats},installed:!!window.__STORYWORLD_ENEMY_MOTION_R51__?.flip?.r375Facing})});
 install();
 if(typeof document!=='undefined')document.addEventListener?.('DOMContentLoaded',install,{once:true});
})();
