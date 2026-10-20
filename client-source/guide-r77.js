/* Readable narrative continuation and one-use Normal admission for the
 * existing guide-owned next-story portal dispatch. This overlay never writes
 * story progress and keeps timers/portal intent transient. */
(()=>{'use strict';
 const MIN_DELAY=6000,MAX_DELAY=45000,VOICE_POLL=350,INTENT_TTL=3000;
 const SCENE_PARTS=new Set(['pre','post','firstPost','awakenPre','prologue.pre','prologue.post','body']);
 const SAFE_BODY_SCOPE='current unread safe-region narrative only; canonical key; journal/completed replay excluded';
 let timer=0,timerKey='',timerGeneration=0,intent=null,intentSequence=0,narrationAttemptGeneration=0,voicePending=false,voiceKey='';
 const mode=()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off';
 const cheat=()=>window.__STORYWORLD_CHEAT777__?.active?.()===true;
 const api=()=>window.__STORYWORLD_ROUTES_R72__;
 const events=[];
 const note=(kind,row={})=>{events.push({kind,...row});if(events.length>120)events.shift();};
 const clearTimer=reason=>{if(timer)clearTimeout(timer);timer=0;timerKey='';timerGeneration++;if(reason)note('timer-cancel',{reason,at:typeof time==='number'?time:0});};
 function readableDelay(scene){const length=String(scene?.text||'').trim().length;return Math.max(MIN_DELAY,Math.min(MAX_DELAY,Math.round(length*72)));}
 function currentButton(){const button=$('storyNext');return button?.isConnected?button:null;}
 function safeBodyEligible(scene,key){const def=regionById?.[zone],prefix=String(layer)+':'+String(zone)+':body:';return scene?.part==='body'&&scene.id===zone&&def?.safe===true&&!completed(zone)&&storyReady(def)&&typeof key==='string'&&key.startsWith(prefix)&&!readScenes.has(key);}
 function scenePartAllowed(scene,key){const part=String(scene?.part||'');return part==='body'?safeBodyEligible(scene,key):SCENE_PARTS.has(part);}
 function sceneCanContinue(scene,key){return guide===true&&started===true&&mode()!=='guest'&&!cheat()&&!document.hidden&&modal===true&&!loading&&storyScene===scene&&scene?.key===key&&!!currentButton()&&scenePartAllowed(scene,key);}
 function narrationPlaying(scene,key){const media=typeof voiceElement!=='undefined'&&voiceElement&&!voiceElement.paused&&!voiceElement.ended;const speech=window.speechSynthesis?.speaking===true;return voicePending&&voiceKey===key||media&&storyScene===scene||speech&&typeof speech3!=='undefined'&&!!speech3;}
 function cancelIntent(){intent=null;}
 function armNextNormal(goal,from=zone,l=layer){
  cancelIntent();
  if(!goal||goal.kind!=='portal'||goal.direction==null||guide!==true||!started||mode()==='guest'||cheat()||window.__STORYWORLD_EGO151__?.inspect?.()?.isVisit===true||loading||modal||player?.hp<=0||transitionCD>0||from!==zone||l!==layer||!['STORY','DREAM'].includes(l))return false;
  const routes=api(),status=routes?.status?.(goal.direction),destination=status?.destination;
  const target=regionById?.[destination];
  if(status?.open!==true||status.role!=='next'||!destination||!target?.records?.length||target.safe===true||regionById?.[from]?.exits?.[goal.direction]!==destination||firstPending(l)?.id!==destination)return false;
  intent={id:++intentSequence,from,destination,layer:l,direction:goal.direction,expires:Date.now()+INTENT_TTL};
  note('normal-intent-armed',{from,destination,layer:l,direction:goal.direction,dispatch:goal.source==='native-proximity'?'native-proximity':'guide-goal',at:typeof time==='number'?time:0});
  return intent.id;
 }
 function cancelNextNormal(id){if(intent?.id!==id)return false;cancelIntent();return true;}
 function takeNextNormal(destination,l,from=zone){
  const token=intent;cancelIntent();
  if(!token||Date.now()>=token.expires||guide!==true||mode()==='guest'||cheat()||window.__STORYWORLD_EGO151__?.inspect?.()?.isVisit===true||from!==zone||token.from!==from||token.destination!==destination||token.layer!==l||l!==layer||!regionById?.[destination]?.records?.length||regionById[destination].safe===true||firstPending(l)?.id!==destination||regionById?.[from]?.exits?.[token.direction]!==destination)return null;
  const status=api()?.status?.(token.direction);
  if(status?.open!==true||status.role!=='next'||status.destination!==destination)return null;
  note('normal-intent-consumed',{from,destination,layer:l,direction:token.direction,at:typeof time==='number'?time:0});
  return'normal';
 }
 function continueCheck(scene,key,generation){
  if(generation!==timerGeneration||timerKey!==key)return;
  if(!sceneCanContinue(scene,key)){clearTimer('scene-not-ready');return;}
  if(narrationPlaying(scene,key)){timer=setTimeout(()=>continueCheck(scene,key,generation),VOICE_POLL);return;}
  timer=0;timerKey='';timerGeneration++;
  note('scene-auto-continue',{key,part:scene.part,at:typeof time==='number'?time:0});
  advanceScene();
 }
 function scheduleScene(scene){
  if(timer)clearTimer('advance');
  const key=scene?.key;
  if(!key||!sceneCanContinue(scene,key))return false;
  const generation=++timerGeneration;timerKey=key;
  timer=setTimeout(()=>continueCheck(scene,key,generation),readableDelay(scene));
  note('scene-timer-armed',{key,part:scene.part,delayMs:readableDelay(scene),at:typeof time==='number'?time:0});
  return true;
 }
 const advanceBase=advanceScene;
 advanceScene=function(...args){clearTimer('advance');const result=advanceBase.apply(this,args);scheduleScene(storyScene);return result;};
 const playVoiceBase=playVoice;
 playVoice=async function(...args){const result=playVoiceBase.apply(this,args),scene=args[0],key=scene?.key,generation=++narrationAttemptGeneration;voiceKey=key||'';voicePending=!!key;try{return await result;}finally{if(narrationAttemptGeneration===generation){voicePending=false;voiceKey='';}}};
 const stopVoiceBase=stopVoice;
 stopVoice=function(...args){const result=stopVoiceBase.apply(this,args);narrationAttemptGeneration++;voicePending=false;voiceKey='';return result;};
 const openPanelBase=openPanel;
 openPanel=function(...args){const result=openPanelBase.apply(this,args);if(timer)clearTimer('panel-replaced');return result;};
 const tickBase=tick;let priorGuide=guide;
 tick=function(...args){if(priorGuide&&!guide){clearTimer('guide-off');cancelIntent();}priorGuide=guide;return tickBase.apply(this,args);};
 const enterBase=enterRegion;
 enterRegion=async function(...args){const options=args[2]||{};clearTimer('map-transition');if(options?.r72Portal!=='next')cancelIntent();return enterBase.apply(this,args);};
 const restoreBase=restoreSave;
 restoreSave=async function(...args){clearTimer('restore');cancelIntent();return restoreBase.apply(this,args);};
 const newBase=newGame;
 newGame=async function(...args){clearTimer('new-game');cancelIntent();return newBase.apply(this,args);};
 const deathBase=showDeath;
 showDeath=function(...args){clearTimer('death');cancelIntent();return deathBase.apply(this,args);};
 document.addEventListener?.('visibilitychange',()=>{if(document.hidden){clearTimer('page-hidden');cancelIntent();}else if(!timer&&storyScene&&guide) scheduleScene(storyScene);});
 window.__STORYWORLD_GUIDE_R77__=Object.freeze({armNextNormal,takeNextNormal,cancelNextNormal,syncGuide:()=>{if(!guide){clearTimer('guide-off');cancelIntent();}else if(!timer&&storyScene)scheduleScene(storyScene);},cancelTimer:clearTimer,inspect:()=>({revision:'R77-GUIDE-NORMAL',scene:{key:timerKey,scheduled:!!timer,voicePending,voiceKey,narrationPlaying:narrationPlaying(storyScene,storyScene?.key)},intent:intent?{from:intent.from,destination:intent.destination,layer:intent.layer,direction:intent.direction,expires:intent.expires}:null,events:events.slice(-64)}),policy:{sceneParts:[...SCENE_PARTS],safeBodyScope:SAFE_BODY_SCOPE,minimumDelayMs:MIN_DELAY,maximumDelayMs:MAX_DELAY,waitForNarration:true}});
})();
