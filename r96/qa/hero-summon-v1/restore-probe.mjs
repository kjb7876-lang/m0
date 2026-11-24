// A disposable isolated checkpoint fixture; no native actor/storage method replacement.
export function installRestoreProbe(){
 const O=window.__sw0027Probe;
 let entry;
 function quiet(){
  const s=window.__STORYWORLD_SAVE_SLOTS_R73__.inspect();
  const c=window.__STORYWORLD_CHEAT777__.inspect();
  return !loading&&s.transitionDepth===0&&!s.busy&&
   !window.__STORYWORLD_SAVE_TRANSITION_R320__.inspect().pending&&!c.switching;
 }
 O.restoreProbe={
  begin(){
   if(entry)throw Error('Duplicate scene transition');
   entry={done:false};
   Promise.resolve(enterRegion('dist06',null,{layer:'STORY',restore:true})).then(
    v=>Object.assign(entry,{done:true,v}),e=>Object.assign(entry,{done:true,error:String(e)}));
  },
  entered(){
   if(!entry?.done)return false;
   if(entry.error||entry.v!==true)throw Error(entry.error||'Native region transition did not return true');
   return quiet()&&zone==='dist06'&&room?.id==='dist06';
  },
  async restore(){
   if(!this.entered())throw Error('Native region transition still pending');
   const checkpoint=O.savedCheckpoint,C=window.__STORYWORLD_CHEAT777__;
   if(!checkpoint?.text||C.active()!==true||C.inspect().saveSlot!==checkpoint.slot)
    throw Error('Native isolated checkpoint not available in the same slot');
   const store=window.__STORYWORLD_TEST_STORAGE_B1__.store;
   const current=store.getItem(checkpoint.slot),autosavedZone=current?JSON.parse(current).zone:null;
   if(current!==checkpoint.text){
    if(autosavedZone!=='dist06'||zone!=='dist06')throw Error('Unexpected checkpoint overwrite: '+autosavedZone);
    store.setItem(checkpoint.slot,checkpoint.text);
   }
   if(store.getItem(checkpoint.slot)!==checkpoint.text)throw Error('Checkpoint byte replay failed');
   // No await between replay and the real native reader.
   if(await loadLocal()===false)throw Error('Native loadLocal explicitly refused restoration');
   return {autosavedZone,restoredEarlierCheckpoint:current!==checkpoint.text};
  }
 };
}
