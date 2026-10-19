/* R75 source ownership. The old art lineage remains independent of narrative
 * source identity. No legacy completion or reward is invented by migration. */
(()=>{'use strict';
 const data=window.__STORYWORLD_STORY_DATA_R75__,voice=window.__STORYWORLD_VOICE_CONTRACT_R75__,sha=data.source.sha256;
 const records=new Map(data.records.map(r=>[r.zoneId,r])),voices=new Map(voice.scenes.map(r=>[r.key,r]));
 const mode=()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off',cheat=()=>window.__STORYWORLD_CHEAT777__?.active()===true;
 let legacy={STORY:false,DREAM:false};const events=[];
 const note=(kind,detail={})=>{events.push({kind,at:time,...detail});if(events.length>80)events.shift();};
 function legacyEligible(id,l,p=progress){return id==='ep1a09b'&&legacy[l]===true&&p?.[l]?.ep1a09===true;}
 function migration(raw){
  const saved=raw?.narrativeR75;if(saved!==undefined&&(!saved||saved.version!==1||saved.sourceSha256!==sha||typeof saved.legacyForward?.STORY!=='boolean'||typeof saved.legacyForward?.DREAM!=='boolean'))throw Error('새 서사 저장의 버전·원문 정보를 확인해 주세요.');
  const out={STORY:false,DREAM:false},before=data.portalOrder.slice(1,data.portalOrder.indexOf('ep1a09b'));
  for(const l of ['STORY','DREAM']){
   const p=raw?.progress?.[l]||{},advanced=before.every(id=>p[id]===true)&&data.portalOrder.slice(11,-1).some(id=>p[id]===true);
   out[l]=advanced&&(saved?saved.legacyForward[l]:true);
  }return out;
 }
 const pendingBase=firstPending;firstPending=function(l=layer){return regions.find(r=>r.records.length&&!completed(r.id,l)&&!legacyEligible(r.id,l))||null;};
 const readyBase=storyReady;storyReady=function(def,l=layer){if(mode()==='guest')return readyBase.apply(this,arguments);if(cheat()&&def?.records?.length&&!completed(def.id,l))return true;if(def?.id==='ep1a09b'&&legacyEligible(def.id,l))return true;return readyBase.apply(this,arguments);};
 const prerequisitesBase=prerequisites3;prerequisites3=function(){return mode()!=='guest'&&cheat()?true:prerequisitesBase.apply(this,arguments);};
 const compileBase=compileWorld;compileWorld=function(...args){const result=compileBase.apply(this,args);
  for(const id of ['ep1a09','ep1a09b']){const r=regionById[id];if(!r)throw Error('분리된 09 기억이 없습니다.');r.bosses=[];r.midboss=null;}
  const memory=regionById.ep1a09b,donor=regionById.dist03;memory.roster=(donor.roster||[]).map(e=>({...e}));memory.minions=[...(donor.minions||[])];memory.theme=donor.theme;memory.map=donor.map;memory.paths=[...new Set([memory.map,...memory.paths,...donor.paths])];
  for(const r of regions){const row=records.get(r.id);if(row){r.sceneIdR75=row.sceneId;r.objectiveR75=row.objective;}}
  SW3.narrativeR75={sourceSha256:sha,sceneCount:62,regionCount:64};note('compiled',{scenes:canonicalRecords.length,regions:regions.length});return result;
 };
 function special(trigger,id=zone){const text=data.specialTexts[trigger];if(!text||!regionById[id])return null;return{id,sceneId:trigger,part:trigger,text,title:trigger==='finale.core-preserved'?'최종장 — 남겨진 몽세':trigger.startsWith('prologue')?'프롤로그 — 남아 있는 기억':'합일몽세',narrator:'기억의 기록',chapter:regionById[id].chapter,key:layer+':r75:'+trigger,sourceSha256:sha};}
 const scenesBase=nextScenes;nextScenes=function(def,part){const row=records.get(def.id);if(!row)return scenesBase.apply(this,arguments);const record=def.records[0],text=part==='body'?row.body:row.parts[part]||'';
  const list=text?[{id:def.id,sceneId:row.sceneId,record,part,text,title:row.title,narrator:row.narratorLabel,chapter:row.chapter,key:layer+':'+def.id+':'+part+':r75',sourceSha256:sha}]:[];
  if(def.id==='dist00'&&part==='pre'&&!readScenes.has(layer+':r75:prologue.pre'))list.unshift(special('prologue.pre',def.id));
  if(def.id==='dist00'&&part==='post'&&!readScenes.has(layer+':r75:prologue.post'))list.push(special('prologue.post',def.id));
  if(def.id==='cult04'&&part==='post'&&layer==='STORY'&&room?.finalStage>=2)list.push(special('finale.core-preserved',def.id));
  return list.filter(Boolean);
 };
 // Validate even shared co-op cards. A filename or absent hash can never make
 // a legacy recording eligible for a newly selected sentence.
 const voiceBase=playVoice;playVoice=async function(scene,manual=false){
  stopVoice();const token=voiceGeneration,id=scene.sceneId||records.get(scene.id)?.sceneId,entry=voices.get(id+':'+scene.part)||voices.get((scene.part==='innerReveal'?'hidden.persona':scene.part)+':special');
  const status=text=>{if(token===voiceGeneration&&$('voiceStatus'))$('voiceStatus').textContent=text;};
  if(!entry||voiceManifest?.sourceSha256!==sha){status('새 원문에 대응하는 음성을 준비 중입니다. 텍스트로 계속할 수 있습니다.');return;}
  const row=voiceManifest.scenes?.[entry.key];
  if(!row||row.textSha256!==entry.textSha256||row.sourceSha256&&row.sourceSha256!==sha||await digest(scene.text)!==entry.displayTextSha256){status('원문과 음성의 해시가 달라 텍스트로 제공합니다.');return;}
  if(token!==voiceGeneration||!narrationSceneCurrentR63(scene))return;
  voiceManifest.scenes[scene.id+':'+scene.part]=row;
  scene.record={...scene.record,voiceSource:{...scene.record?.voiceSource,[scene.part]:entry.text}};
  return voiceBase.call(this,scene,manual);
 };
 const serializeBase=serializeSave;serializeSave=function(...args){const raw=serializeBase.apply(this,args);raw.narrativeR75={version:1,sourceSha256:sha,legacyForward:{...legacy},sceneId:records.get(raw.zone)?.sceneId||null};return raw;};
 const restoreBase=restoreSave;restoreSave=async function(raw,...args){const previous=legacy,next=migration(raw);legacy=next;try{const result=await restoreBase.call(this,raw,...args);if(result===false){legacy=previous;return result;}note('restored',{zone,legacy:{...legacy}});return result;}catch(error){legacy=previous;throw error;}};
 const newBase=newGame;newGame=async function(...args){const prior=legacy,before=player;legacy={STORY:false,DREAM:false};try{const result=await newBase.apply(this,args);if(result===false||player===before)legacy=prior;return result;}catch(e){legacy=prior;throw e;}};
 const journalBase=showJournal;showJournal=function(id=null,...args){if(id==='cult04'&&ending?.[layer]===true){const def=regionById[id],record=def.records[0];return playScenes([{id,record,part:'body',text:records.get(id).body,title:record.title,narrator:record.narrator,chapter:record.chapter,key:'journal:'+id+':r75'},special('finale.core-preserved',id)],()=>showJournal());}return journalBase.call(this,id,...args);};
 const endingBase=showEnding;showEnding=function(...args){const result=endingBase.apply(this,args);const b=$('endingJournal');if(b)b.onclick=()=>showJournal('cult04');return result;};
 window.__STORYWORLD_NARRATIVE_R75__=Object.freeze({legacyEligible,migration,special,record:id=>records.get(id)||null,voiceEntry:key=>voices.get(key)||null,inspect:()=>({sourceSha256:sha,sceneCount:records.size,regionCount:regions.length,legacyForward:{...legacy},audioSource:voiceManifest?.sourceSha256||null,audioScenes:Object.keys(voiceManifest?.scenes||{}).length,events:[...events]})});
})();
