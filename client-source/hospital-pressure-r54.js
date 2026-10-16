/* R54 incoming combat pressure. Damage is multiplied once at native admission,
 * rather than mutating actor definitions or saved stats. Independent committed
 * attacks may overlap; the automatic post-hit grace never suppresses another
 * attack. Explicit evasion, awakening, guard, parry and shield remain native. */
(()=>{'use strict';
 const scopes=[],seen=new Map(),objects=new WeakMap(),audit=[];
 let victim=null,currentRoom=null,serial=0;
 const metrics={attempts:0,admitted:0,duplicates:0,automaticGraceBypassed:0,multiplied:0,inputBudget:0,scaledBudget:0,clears:0};
 const finite=Number.isFinite;
 const log=row=>{audit.push({...row,at:time});if(audit.length>160)audit.shift();};
 function sourceOwner(source){
  if(!source||source.friendly||source.r53WoundTick||source.r52BleedTick)return null;
  const direct=source.medical20?.owner;
  if(direct&&room?.enemies?.includes(direct)&&(!source.medical20.room||source.medical20.room===room))return direct;
  return room?.enemies?.find(e=>e===source||e===source.owner||e.id===source.owner||e.id===source.ownerId||e.id===source.id)||null;
 }
 function applies(source){
  const owner=sourceOwner(source);if(!owner)return false;
  if(zone==='ep1a08'&&!owner.trial&&!owner.cosmic&&!owner.persona)return true;
  return scopes.some(predicate=>{try{return predicate(room,owner,source)===true;}catch(_){return false;}});
 }
 function incomingMultiplier(source){
  if(!applies(source))return 1;metrics.multiplied++;return 2;
 }
 function identity(source,owner){
  // Native melee owns a unique attack object/id. A medical pulse has its own
  // id even when several pulses belong to one cast; a shot owns its projectile
  // id even when an entire volley has a shared attackId9.
  if(source.attack){const a=source.attack;if(a.id!=null)return 'attack:'+owner.id+':'+String(a.id);if(!objects.has(a))objects.set(a,++serial);return 'attack-object:'+objects.get(a);}
  if(source!==owner&&source.id!=null)return 'contact:'+owner.id+':'+String(source.id)+(finite(source.lastHit)?':pulse:'+source.lastHit.toFixed(8):'');
  if(source===owner&&owner.attack){const a=owner.attack;if(a.id!=null)return 'attack:'+owner.id+':'+String(a.id);if(!objects.has(a))objects.set(a,++serial);return 'attack-object:'+objects.get(a);}
  if(source!==owner){if(!objects.has(source))objects.set(source,++serial);return 'source-object:'+objects.get(source);}
  // This last lane is for legacy direct contacts with no attack clock. It
  // prevents a repeated callback on one simulation instant while allowing a
  // later native contact, without treating all of an owner's attacks as one.
  return 'legacy:'+owner.id+':'+time.toFixed(8);
 }
 function clear(reason='clear'){
  seen.clear();victim=null;currentRoom=null;metrics.clears++;log({kind:'clear',reason});
 }
 function reconcile(){
  if(victim!==player||currentRoom!==room){seen.clear();victim=player;currentRoom=room;}
  // Native attacks/hazards last less than 30 simulation seconds. Keep a finite
  // defensive history for malformed legacy callbacks without an unbounded set.
  for(const [key,at]of seen)if(time-at>30)seen.delete(key);
  while(seen.size>2048)seen.delete(seen.keys().next().value);
 }
 const hurtBase=hurt;hurt=function(value,source){
  if(!finite(value)||value<=0||!applies(source)||!player||player.hp<=0||modal||loading)return hurtBase.apply(this,arguments);
  reconcile();const owner=sourceOwner(source),key=identity(source,owner)+(window.__STORYWORLD_COOP_SIM_R62__?.mode()!=='off'&&window.__STORYWORLD_COOP_SIM_R62__?':victim:'+window.__STORYWORLD_COOP_SIM_R62__.actorId(player):'');metrics.attempts++;
  if(seen.has(key)){metrics.duplicates++;log({kind:'duplicate-contact-ignored',owner:owner.id,key});return 'ignored';}
  seen.set(key,time);
  const target=player,priorInv=player.invincible,priorReason=player.invReason,hp=player.hp,shield=player.shield;
  const bypass=priorInv>0&&priorReason==='피격 보호';
  // Clear only native automatic grace around the entire admission chain. This
  // lets existing probabilistic EGO defence evaluate each independent attack,
  // rather than accidentally skipping it behind a post-hit timer.
  if(bypass){player.invincible=0;player.invReason='';metrics.automaticGraceBypassed++;}
  let result;try{result=hurtBase.apply(this,arguments);}finally{
   if(bypass&&player===target&&player.hp>0&&(!player.invReason||player.invReason==='피격 보호')){player.invincible=Math.max(priorInv,player.invincible||0);player.invReason=priorReason;}
  }
  const loss=target===player?Math.max(0,hp-player.hp):0,absorbed=target===player?Math.max(0,shield-player.shield):0;
  if(loss>0||absorbed>0)metrics.admitted++;
  metrics.inputBudget+=value;metrics.scaledBudget+=value*2;
  log({kind:'contact-attempt',owner:owner.id,key,input:value,multiplier:2,result,hpLoss:loss,shieldLoss:absorbed,automaticGraceBypassed:bypass});return result;
 };
 for(const name of ['enterRegion','restoreSave','newGame']){
  const base=name==='enterRegion'?enterRegion:name==='restoreSave'?restoreSave:newGame;
  const wrapped=async function(...args){clear(name);return base.apply(this,args);};
  if(name==='enterRegion')enterRegion=wrapped;else if(name==='restoreSave')restoreSave=wrapped;else newGame=wrapped;
 }
 const deathBase=showDeath;showDeath=function(...args){clear('death');return deathBase.apply(this,args);};
 const saveBase=serializeSave;serializeSave=function(...args){const data=saveBase.apply(this,args);data.hospitalPressureR54={version:1,damageMultiplier:2,appliedAt:'native hurt admission; actor damage stats unchanged'};return data;};
 window.__STORYWORLD_HOSPITAL_PRESSURE_R54__=Object.freeze({sourceOwner,applies,incomingMultiplier,clear,registerScope(predicate){if(typeof predicate!=='function')throw TypeError('Combat scope must be a function');scopes.push(predicate);},inspect:()=>({revision:'hospital-overlapping-committed-attacks-r54',damageVsR53:2,actorStatsMutated:false,saveLoadMultiplierIdempotent:true,automaticPostHitGraceBypassedOnly:true,explicitEvasionAwakeningGuardParryShieldPreserved:true,distinctSameOwnerAttacksMayOverlap:true,sameAttackDeduplicated:true,dotBudgetMultipliedAgain:false,historySize:seen.size,metrics:{...metrics},audit:[...audit],browser:false,GPU:false})});
})();
