/* Keep active EGO encounter durability stable through the first native frame
 * after save restoration. The EGO room is restored outside `world`, so R61's
 * normal room-save pass cannot rebuild its WeakMap preservation contract. */
(()=>{'use strict';
 const key='ego-active-room-health-r79';if(window[key])return;
 const restoreBase=restoreSave;
 restoreSave=async function(raw,...args){
  const result=await restoreBase.apply(this,[raw,...args]);
  if(result===false)return result;
  const active=window.__STORYWORLD_EGO151__?.inspect?.().state?.active===true;
  const scale=window.__STORYWORLD_SCALE_MELEE_R61__;
  if(active&&room&&Array.isArray(room.enemies)&&scale?.normalize){
   for(const e of room.enemies){
    if(!e||!Number.isFinite(e.hp)||!Number.isFinite(e.maxHp)||e.maxHp<=0)continue;
    e.r61PreserveHealth=true;
    scale.normalize(e,room,{preserveHealth:true});
   }
  }
  window[key]=true;
  return result;
 };
 window.__STORYWORLD_EGO_RESTORE_R79__=Object.freeze({revision:'R79',preservesActiveRoomHealth:true,inspect:()=>({installed:true,active:window.__STORYWORLD_EGO151__?.inspect?.().state?.active===true,marked:(room?.enemies||[]).filter(e=>e?.r61PreserveHealth===true).length})});
})();
