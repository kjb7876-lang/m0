// Disposable QA context only. Does not replace any game function or storage API.
export function installRestoreProbe(){
 const O=window.__sw0027Probe;
 const D=O.restoreDiagnostics={transition:{status:'not-started'},samples:[],saved:null,setup:null,load:null};
 const result=v=>({type:typeof v,value:v===undefined?null:v});
 const readState=()=>{
  const slots=window.__STORYWORLD_SAVE_SLOTS_R73__.inspect();
  const cheat=window.__STORYWORLD_CHEAT777__.inspect();
  return {t:time,zone,roomId:room?.id,layer,loading:!!loading,modal:!!modal,story:!!storyScene,
   hero:player.hero,x:player.x,y:player.y,slots,
   transition:window.__STORYWORLD_SAVE_TRANSITION_R320__.inspect(),
   cheat:{enabled:cheat.enabled,switching:cheat.switching,saveSlot:cheat.saveSlot,audit:cheat.audit}};
 };
 const sample=phase=>{const s={phase,...readState()};D.samples.push(s);return s;};
 const quiet=s=>!s.loading&&s.slots.transitionDepth===0&&!s.slots.busy&&
  !s.transition.pending&&!s.cheat.switching;
 const bytes=text=>{
  const raw=text?JSON.parse(text):null;
  return {utf8Bytes:text==null?0:new TextEncoder().encode(text).length,
   actual:raw?{zone:raw.zone,layer:raw.layer,hero:raw.hero,time:raw.time,isolated:raw.cheat777?.active===true}:null};
 };
 const hash=async text=>text==null?null:Array.from(new Uint8Array(await crypto.subtle.digest(
  'SHA-256',new TextEncoder().encode(text))),v=>v.toString(16).padStart(2,'0')).join('');
 O.restoreProbe={sample,
  begin(){
   if(D.transition.status!=='not-started')throw Error('Duplicate scene transition');
   sample('before-enterRegion');D.transition.status='pending';
   // The very same native invocation still starts while the live echo exists.
   Promise.resolve(enterRegion('dist06',null,{layer:'STORY',restore:true})).then(v=>{
    D.transition={status:'fulfilled',result:result(v)};sample('enterRegion-fulfilled');
   },e=>{D.transition={status:'rejected',error:String(e)};sample('enterRegion-rejected');});
  },
  entered(){
   if(D.transition.status==='rejected')throw Error(D.transition.error);
   if(D.transition.status!=='fulfilled')return false;
   if(D.transition.result.value!==true)throw Error('Native region transition did not return true');
   const s=readState();return quiet(s)&&s.zone==='dist06'&&s.roomId==='dist06';
  },
  async restore(){
   const pre=sample('before-checkpoint-replay');
   if(!quiet(pre)||!this.entered())throw Error('Native region transition still pending');
   const checkpoint=O.savedCheckpoint,C=window.__STORYWORLD_CHEAT777__;
   if(!checkpoint?.text||C.active()!==true||C.inspect().saveSlot!==checkpoint.slot)
    throw Error('Native isolated checkpoint not available in the same slot');
   const store=window.__STORYWORLD_TEST_STORAGE_B1__.store;
   const current=store.getItem(checkpoint.slot),autosavedZone=current?JSON.parse(current).zone:null;
   D.setup={autosavedZone,restoredEarlierCheckpoint:current!==checkpoint.text,beforeReplay:bytes(current)};
   if(current!==checkpoint.text){
    if(autosavedZone!=='dist06'||zone!=='dist06')throw Error('Unexpected checkpoint overwrite: '+autosavedZone);
    store.setItem(checkpoint.slot,checkpoint.text);
   }
   const loaded=store.getItem(checkpoint.slot);
   D.load={slot:checkpoint.slot,beforeLoad:bytes(loaded),exactCheckpointBytes:loaded===checkpoint.text};
   if(loaded!==checkpoint.text)throw Error('Checkpoint byte replay failed');
   sample('before-loadLocal');
   // No await/protocol turn between byte comparison and the real native load.
   // This records bytes immediately before the call, not an intercepted read.
   let pending;
   try{pending=loadLocal();const v=await pending;D.load.result=result(v);sample('loadLocal-fulfilled');
    if(v===false)throw Error('Native loadLocal explicitly refused restoration');
   }catch(e){D.load.error=String(e);sample('loadLocal-error');throw e;}
   finally{
    const after=store.getItem(checkpoint.slot);
    D.load.afterLoad=bytes(after);
    [D.load.checkpointSHA256,D.load.beforeLoadSHA256,D.load.afterLoadSHA256]=
     await Promise.all([hash(checkpoint.text),hash(loaded),hash(after)]);
   }
   return D.setup;
  }
 };
}
