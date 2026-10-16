/* R61: a consistent hospital-scale enemy silhouette, campaign-ordered durability,
 * close melee admission, and rare safe repositioning for fixed-facing artwork.
 * No map geometry or collision radius is enlarged with the visual body. */
(()=>{'use strict';
 const finite=Number.isFinite,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),meta=new WeakMap(),actions=new WeakSet(),events=[];
 const config=Object.freeze({revision:'scale-contact-durability-r61-v1',ordinaryMin:1.3,ordinaryMax:1.6,bossHeight:1.947,ordinaryHpBase:1100,ordinaryHpLinear:2400,ordinaryHpQuadratic:1200,bossHpBase:24500,bossHpProgress:3,damageProgress:.75,meleeExtraReach:.39,bossExtraReach:.58,warpCooldown:3.4,warpMaximum:2.4});
 const metrics={normalized:0,healthUpdates:0,restored:0,closeAdmissionDenied:0,closeApproaches:0,meleeStarts:0,unsafeWarpsDenied:0,repositions:0};let restoring=0;
 const major=e=>!!e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.r61Clone),alive=e=>!!e&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active';
 const note=e=>{events.push({...e,at:time});if(events.length>120)events.shift();};
 function progression(r=room){const order=window.__STORYWORLD_STORY_PROFILE_R54__?.campaignOrder||regions.map(d=>d.id),id=typeof r==='string'?r:r?.id,index=Math.max(0,order.indexOf(id));return clamp(index/Math.max(1,order.length-1),0,1);}
 function pressure(r=room){const p=progression(r);return{progress:p,ordinaryHp:Math.ceil(config.ordinaryHpBase+config.ordinaryHpLinear*p+config.ordinaryHpQuadratic*p*p),bossHp:Math.ceil(config.bossHpBase*(1+config.bossHpProgress*p)),damageMultiplier:1+config.damageProgress*p};}
 const hash=e=>[...String(e.nativeId||e.id||'actor')].reduce((s,c)=>Math.imul(s^c.charCodeAt(0),16777619)>>>0,2166136261);
 function expectedHeight(e){return major(e)?config.bossHeight:config.ordinaryMin+(hash(e)%301)/1000;}
 function contract(e,options={}){return options.preserveHealth===true||e?.r61PreserveHealth===true||e?.r61Clone===true||e?.r61Clone?.owner||e?.r61Summon?.kind==='clone'||e?.r61Summon?.clone===true;}
 function normalize(e,r=room,options={}){
  if(!e||e===player||!e.combatProfile||!finite(e.maxHp)||!finite(e.hp))return e;
  const p=pressure(r),isMajor=major(e),ratio=clamp(e.hp/Math.max(1,e.maxHp),0,1);let m=meta.get(e);
  if(!m){m={baseDamage:finite(e.damage)?e.damage:0,baseMax:e.maxHp,room:r,height:expectedHeight(e),preserveHealth:contract(e,options),preserveDamage:options.preserveDamage===true||contract(e,options),nextWarp:time+1.1};meta.set(e,m);metrics.normalized++;}
  if(options.preserveHealth===true)m.preserveHealth=true;if(options.preserveDamage===true)m.preserveDamage=true;
  // spriteRect stays in the native frame calibration. defScale adjusts only the
  // final visible body and every renderer/hand-release/death consumer agrees.
  const nativeHeight=finite(e.combatProfile.spriteRect?.height)&&e.combatProfile.spriteRect.height>0?e.combatProfile.spriteRect.height:1;
  m.height=expectedHeight(e);e.defScale=m.height/nativeHeight;
  if(!restoring&&!options.deferHealth&&!m.preserveHealth&&!contract(e,options)){
   const rawTarget=(isMajor?p.bossHp:p.ordinaryHp)*(r?.layer==='DREAM'?1.22:1),egoScale=finite(e.egoScale151)?Math.max(1,e.egoScale151):1,target=Math.min(Number.MAX_SAFE_INTEGER,Math.ceil(rawTarget*Math.min(egoScale,Number.MAX_SAFE_INTEGER/rawTarget)));
   if(!m.healthApplied){e.maxHp=target;e.hp=e.hp<=0?0:Math.max(1,target*ratio);m.healthApplied=true;metrics.healthUpdates++;}
  }
  if(!m.preserveDamage&&!contract(e,options)){if(!m.damageApplied){e.damage=m.baseDamage*p.damageMultiplier;m.damageApplied=true;}}
  return e;
 }
 function normalizeRoom(r=room){for(const e of r?.enemies||[])normalize(e,r);return r;}
 const actorBase=actor3;actor3=function(...args){const e=actorBase.apply(this,args);normalize(e,{id:args[6]?.id,layer:args[5]},{deferHealth:true});return e;};
 const roomBase=makeRoom;makeRoom=function(...args){const r=roomBase.apply(this,args);return normalizeRoom(r);};
 const summonBase=summon3;summon3=function(list,...args){for(const e of list||[]){const m=meta.get(e);if(m)m.healthApplied=false;normalize(e,room);}return summonBase.call(this,list,...args);};
 function closeRange(e){const body=clamp(Number(e?.combatProfile?.bodyBlock?.r)||.28,.12,.65);return clamp(body+.23+(major(e)?config.bossExtraReach:config.meleeExtraReach),major(e)?1.10:.78,major(e)?1.58:1.14);}
 function canClose(e){return !!e&&!!player&&Math.hypot(player.x-e.x,player.y-.15-e.y)<=closeRange(e)&&clearLine(e,{x:player.x,y:player.y-.15});}
 const motion=window.__STORYWORLD_HOSPITAL_MOTION_R53__;if(motion)window.__STORYWORLD_HOSPITAL_MOTION_R53__=Object.freeze({...motion,canPrepare(e,kind){if(kind==='melee'&&!e?.attack&&!canClose(e)){metrics.closeAdmissionDenied++;return false;}return motion.canPrepare(e,kind);}});
 // Charges already terminate on the committed collision-clipped endpoint. Close
 // stationary baton swings share the same tightened starting distance.
 const charge=window.__STORYWORLD_HOSPITAL_CHARGE_R52__;if(charge)window.__STORYWORLD_HOSPITAL_CHARGE_R52__=Object.freeze({...charge,tickEnemy(e,dt){if(e&&!e.attack&&player&&distance(e,player)<2.75&&!canClose(e))return false;return charge.tickEnemy(e,dt);}});
 function clearPath(e,to){const r=(e.combatProfile?.bodyBlock?.r||e.radius||.3)+.14;if(!finite(to.x)||!finite(to.y)||blocked(to.x,to.y,r,room)||!clearLine(e,to))return false;const n=Math.max(1,Math.ceil(distance(e,to)/.09));for(let i=1;i<=n;i++)if(blocked(e.x+(to.x-e.x)*i/n,e.y+(to.y-e.y)*i/n,r,room))return false;return !room.enemies.some(o=>o!==e&&alive(o)&&distance(o,to)<r+(o.combatProfile?.bodyBlock?.r||.3)+.08)&&distance(player,to)>.68;}
 function reposition(e){
  const m=meta.get(e);if(!m||time<m.nextWarp||e.attack||e.rangedWindup>0||!alive(e)||!player||player.hp<=0||!(e.stuck>.85)||distance(e,player)>2.3)return false;
  const frames=window.__STORYWORLD_STORY_COMBAT_R54__?.frameSet(e)||e.profile?.frames||{},frame=frames.attackA||frames.strike||frames.attack||frames.idle,baked=frame?.assetFrame?.bakedFacing;
  if(!['front','back'].includes(baked))return false;const d=clamp(closeRange(e)*.91,.76,1.35),sign=baked==='front'?-1:1,to={x:player.x+sign*d/Math.SQRT2,y:player.y-.15+sign*d/Math.SQRT2};
  const projected=project(player.x,player.y-.15),origin=project(e.x,e.y),wrong=baked==='front'?projected.y<origin.y-6:projected.y>origin.y+6;if(!wrong)return false;
  m.nextWarp=time+config.warpCooldown;
  if(distance(e,to)>config.warpMaximum||!clearPath(e,to)){metrics.unsafeWarpsDenied++;return false;}
  const old={x:e.x,y:e.y};e.x=to.x;e.y=to.y;e.nav=[];e.stuck=0;e.navAt=-Infinity;e.direction=facing(player.x-e.x,player.y-.15-e.y);e.cd=Math.max(.34,e.cd);e.r61WarpAt=time;
  fx('actorWarpR61',old.x,old.y,{life:.28,r61Actor:e,r61Path:e.rc146BodySprite||frame?.path||e.path,r61Frame:e.rc146BodyFrame||frame,height:actorHeight()*expectedHeight(e),r61At:time,r61Room:room});metrics.repositions++;note({kind:'safe-fixed-facing-reposition',owner:e.id,from:old,to:{...to},baked});return true;
 }
 const tickBase=tickEnemies;tickEnemies=function(dt){normalizeRoom();const result=tickBase.apply(this,arguments);if(!player||player.hp<=0||modal||loading)return result;for(const e of room?.enemies||[]){if(!alive(e))continue;normalize(e,room);if(e.attack&&!actions.has(e.attack)){actions.add(e.attack);metrics.meleeStarts++;note({kind:'melee-start',owner:e.id,distance:Math.hypot(player.x-e.x,player.y-.15-e.y),allowed:closeRange(e),charge:!!e.attack.r52Charge,angle:e.attack.angle});}if(e.attack||e.rangedWindup>0||e.rest>0)continue;if(reposition(e))continue;const d=Math.hypot(player.x-e.x,player.y-.15-e.y);if(e.ai==='melee'&&e.cd<=0&&d>closeRange(e)&&d<Math.min(7,e.combatProfile?.aggro||7)&&clearLine(e,player)){const before={x:e.x,y:e.y};moveAI3(e,{x:player.x,y:player.y-.15},Math.max(0,Math.min(.06,dt)));if(distance(before,e)>.001)metrics.closeApproaches++;}}return result;};
 const effectBase=drawEffect;drawEffect=function(e,...args){if(e?.type!=='actorWarpR61')return effectBase.apply(this,[e,...args]);if(e.r61Room!==room||!e.r61Actor||e.age>=e.life)return;const paint=()=>{const q=project(e.x,e.y),alpha=.30*Math.max(0,1-e.age/e.life);if(!drawAssetFrame3(e.r61Path,e.r61Frame,q.x,q.y,e.height,{alpha,filter:'grayscale(.7) brightness(.75)'}))sprite(e.r61Path,q.x,q.y,e.height,{alpha,filter:'grayscale(.7) brightness(.75)'});};if(typeof ctx.scope!=='function')return paint();return ctx.scope({id:'r61:actor-warp:'+String(e.r61Actor.id||e.id||'actor')+':'+String(e.r61At??0),kind:'effect',x:e.x,y:e.y,sourcePath:e.r61Path,groundAligned:false,alive:false,lightShadowApproved:true},paint);};
 const saveBase=serializeSave;serializeSave=function(...args){if(!restoring)for(const r of Object.values(world||{}))normalizeRoom(r);const data=saveBase.apply(this,args);data.scaleMeleeR61={version:1,revision:config.revision};for(const [key,r]of Object.entries(world||{})){const rows=data.rooms?.[key]?.enemies||[];for(const row of rows){const e=r.enemies.find(e=>e.id===row.id),m=e&&meta.get(e);if(m)row.r61Scale={version:1,maxHp:e.maxHp,hp:e.hp,baseDamage:m.baseDamage,damage:e.damage,preserveHealth:m.preserveHealth,preserveDamage:m.preserveDamage};}}return data;};
 const restoreBase=restoreSave;restoreSave=async function(input,...args){restoring++;let result;try{result=await restoreBase.call(this,input,...args);}finally{restoring--;}
  if(result===false)return result;for(const [key,r]of Object.entries(world||{}))for(const e of r.enemies||[]){const old=input?.rooms?.[key]?.enemies?.find(v=>v?.id===e.id),saved=old?.r61Scale,m=meta.get(e);if(m){m.healthApplied=false;m.damageApplied=false;}
   if(saved?.version===1&&finite(saved.maxHp)&&saved.maxHp>0&&finite(saved.hp)&&saved.hp>=0){e.maxHp=clamp(saved.maxHp,1,Number.MAX_SAFE_INTEGER);e.hp=clamp(saved.hp,0,e.maxHp);if(m){m.healthApplied=true;m.baseDamage=finite(saved.baseDamage)?saved.baseDamage:m.baseDamage;m.preserveHealth=saved.preserveHealth===true;m.preserveDamage=saved.preserveDamage===true;m.damageApplied=true;}if(finite(saved.damage)&&saved.damage>=0)e.damage=saved.damage;metrics.restored++;}
   normalize(e,r);
  }saveGame(false);return result;
 };
 window.__STORYWORLD_SCALE_MELEE_R61__=Object.freeze({config,major,progression,pressure,expectedHeight,normalize,normalizeRoom,closeRange,canClose,reposition,clearPath,inspect:()=>({revision:config.revision,visualOnlyScale:true,collisionRadiiUnchanged:true,healthCurveUsesCanonicalCampaignOrder:true,saveLoadIdempotent:true,cloneContract:'normalize(actor,room,{preserveHealth:true,preserveDamage:true})',noAttackRetargeting:true,rareWarpRequiresFixedFacingStuckSafeClearPath:true,metrics:{...metrics},events:[...events],browser:false,GPU:false})});
})();
