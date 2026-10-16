/* R61: native bosses call regional retainers and tangible self echoes.
 * The shared fields motion clock owns preparation/release/recovery. Summons
 * never own an encounter, reward, source field wave, or further summons. */
(()=>{'use strict';
 if(window.__STORYWORLD_SUMMONS_R61__)return;
 const finite=Number.isFinite,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const limits=Object.freeze({activeRegional:6,activeClones:2,activeCombat:24,lifetimePerOwner:24,cloneRatio:.06,minPlayerDistance:1.8,minWindup:1.05,cooldown:17});
 const events=[],metrics={attempts:0,prepared:0,waves:0,minions:0,clones:0,refused:0,cancelled:0,despawned:0,restored:0,telegraphs:0};
 let restoring=0,serial=0;
 const note=row=>{events.push({...row,at:time});if(events.length>192)events.shift();};
 const major=e=>!!e&&!e.r61Summoned&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial);
 const living=e=>!!e&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active';
 const enabled=e=>major(e)&&living(e)&&room?.enemies?.includes(e)&&room.engaged===true&&!room.cleared&&!room.finalizing&&player?.hp>0&&!modal&&!loading;
 const ownerId=e=>e?.r61Summoned?.owner;
 const saveKeyFor=r=>layerKey(r.id,r.layer)+(r.egoVisitId151?':EGO:'+r.egoVisitId151:'');
 function roomState(r=room){return r.r61Summons??={version:1,owners:{}};}
 function state(e,r=room){const s=roomState(r),id=e.id;if(!s.owners[id])s.owners[id]={used:0,waves:0,nextAt:time+7.5+(String(id).length%5)*.25};return s.owners[id];}
 const fields=()=>window.__STORYWORLD_FIELDS_R61__;
 function nativeBusy(e){return !!(e.attack||e.rangedWindup>0||e.storyPreparedCast150||e.personaPreparedCast150||fields()?.activeAction?.(e)||time<(e.r61BusyUntil||0)||time<(e.storyAttackUntil5||0)||time<(e.invulnerableUntil||0)||hazards.some(h=>(h.owner===e.id||h.medical20?.owner===e)&&h.age<h.life&&!h.medical20?.cancelled&&(!h.r62Field||time<h.r62Field.releaseAt+.46))||delayed.some(q=>q.owner===e.id));}
 function frameFor(e){
  if(!e)return null;const story=window.__STORYWORLD_STORY_COMBAT_R54__,set=story?.frameSet?.(e)||e.profile?.frames||{};
  const list=[set.anticipation,set.windup,set.attack,set.strike,set.attackA,set.idle,set.move];
  return list.find(f=>f?.path&&readyImage(f.path)?.image&&(story?.validFrame?.(f)??true))||(readyImage(e.path)?.image?{path:e.path}:null);
 }
 function safePoint(e,p,r=room){
  if(!p||![p.x,p.y].every(finite))return false;
  const body=Math.max(.24,e.combatProfile?.bodyBlock?.r||e.radius||.3)+.16;
  return !blocked(p.x,p.y,body,r)&&(!(r===room&&player)||distance(player,p)>=limits.minPlayerDistance)&&!r.enemies.some(o=>living(o)&&o!==e&&distance(o,p)<body+Math.max(.2,o.combatProfile?.bodyBlock?.r||.3)+.14)&&(!r.objective||distance(p,r.objective)>.8)&&findPath(r.objective||r.enemies.find(major)||p,p,r,body).length>0;
 }
 function position(e,owner,index,reserved=[],r=room){
  const target=r===room&&player?player:{x:owner.homeX??owner.x,y:owner.homeY??owner.y},start=Math.atan2(target.y-owner.y,target.x-owner.x)+Math.PI/2+index*2.399963;
  for(const radius of [2.5,3.3,4.1,1.9,4.9,5.7])for(let k=0;k<24;k++){
   const angle=start+k*Math.PI/12,p={x:owner.x+Math.cos(angle)*radius,y:owner.y+Math.sin(angle)*radius};
   if(safePoint(e,p,r)&&clearLine(owner,p,r)&&reserved.every(q=>distance(q,p)>1.15))return p;
  }return null;
 }
 function normalize(e,r,clone=false){const scale=window.__STORYWORLD_SCALE_MELEE_R61__;scale?.normalize?.(e,r,clone?{preserveHealth:true,preserveDamage:true}:{});return e;}
 function makeUnit(owner,kind,id,r=room){
  const def=regionById[r.id];if(!def)return null;
  const existing=r.enemies.filter(e=>!major(e)&&!e.r61Summoned&&!e.hospitalSummonR53&&e.profile?.id&&(!e.boss&&!e.midboss&&!e.persona&&!e.trial&&!e.cosmic));
  const choices=def.roster?.length?def.roster:existing.map(e=>e.profile);
  let profile=kind==='clone'?owner.profile:choices[(state(owner,r).used+serial)%Math.max(1,choices.length)];
  if(!profile)return null;
  // Native Persona has directional frames outside profile.frames. Snapshot its
  // reviewed own-body direction as the clone's dedicated idle/attack canvas.
  if(kind==='clone'&&owner.persona){const f=frameFor(owner);if(f)profile={...profile,frames:{idle:f,move:f,anticipation:f,attack:f,strike:f,recover:f}};}
  const e=actor3(profile,id,owner.x,owner.y,false,r.layer,def,false);
  Object.assign(e,{boss:false,midboss:false,persona:false,cosmic:false,trial:false,r61Summoned:{version:1,owner:owner.id,kind},spawnState:'active',deadRecorded:false,graceUntil:time+.8,cd:1.2,rest:0,explorationGroup:null,fieldWaveIndex6:undefined,fieldWave:undefined,sourcePlan6:false,sourcePlanId6:undefined,state:'idle',phaseStage:'active',attack:null,rangedWindup:0});
  if(kind==='clone'){
   e.r61Clone=true;e.r61PreserveHP=e.r61PreserveHealth=true;e.r61PreserveDamage=true;e.r61Summon={kind:'clone',owner:owner.id};e.r61CloneSource=owner.nativeId;
   e.name=owner.name+' · 분신';e.r61OriginZone=owner.r61OriginZone||regions.find(d=>[...(d.bosses||[]),...(d.midboss?[d.midboss]:[])].some(a=>a.id===owner.nativeId))?.id||r.id;e.nativeId=owner.nativeId;e.path=owner.path;e.profile=profile;e.combatProfile=JSON.parse(JSON.stringify(owner.combatProfile));e.defScale=owner.defScale;e.radius=owner.radius;e.speed=owner.speed;e.weapon=owner.weapon;e.ai='melee';
   e.phase=owner.phase;e.awakeUntil=owner.awakeUntil;e.maxHp=e.hp=owner.maxHp*limits.cloneRatio;e.damage=owner.damage;e.combatPressureSourceDamage=owner.combatPressureSourceDamage;e.combatPressureVersion=owner.combatPressureVersion;e.hospitalHpScaleR52=owner.hospitalHpScaleR52;
   normalize(e,r,true);
   // Clone stats are an exact contract, including after normalization hooks.
   e.maxHp=e.hp=owner.maxHp*limits.cloneRatio;e.damage=owner.damage;
  }else{e.r61OriginZone=r.id;normalize(e,r,false);}
  return frameFor(e)?e:null;
 }
 // The hospital's native R53 caster also raises two retainers after a vial
 // release. Keep that original recovery skill, but defer a pair while fewer
 // than two slots remain in the shared six-retainer budget.
 function holdLegacyPair(r=room){if(r?.id!=='ep1a08'||!r.hospitalBossSummonsR53)return;const regional=r.enemies.filter(e=>living(e)&&(e.r61Summoned||e.hospitalSummonR53)),count=regional.length,reserveClone=!regional.some(e=>e.r61Clone)&&r.enemies.some(e=>major(e)&&living(e)&&state(e,r).used<limits.lifetimePerOwner);if(count>limits.activeRegional-2||reserveClone&&count>=limits.activeRegional-2)r.hospitalBossSummonsR53.nextAt=Math.max(r.hospitalBossSummonsR53.nextAt||0,time+.08);}
 function capacity(r=room){const live=r.enemies.filter(living),regional=live.filter(e=>e.r61Summoned||e.hospitalSummonR53);return{free:Math.max(0,Math.min(limits.activeRegional-regional.length,limits.activeCombat-live.length)),cloneFree:Math.max(0,limits.activeClones-regional.filter(e=>e.r61Clone).length)};}
 function plan(e){const cap=capacity(),s=state(e),remaining=Math.min(cap.free,limits.lifetimePerOwner-s.used),out=[];
  if(remaining<=0)return out;
  const kinds=[];if(cap.cloneFree>0)kinds.push('clone');for(let i=kinds.length;i<Math.min(3,remaining);i++)kinds.push('minion');
  for(const kind of kinds){const id=room.id+':r61-summon:'+(++serial),unit=makeUnit(e,kind,id);if(!unit)continue;const p=position(unit,e,out.length,out.map(o=>o.point));if(p)out.push({kind,unit,point:p,frame:frameFor(unit)});}
  return out;
 }
 function spawnWave(e,rows,r){
  if(r!==room||!enabled(e))return false;
  const s=state(e),cap=capacity();let free=Math.min(cap.free,limits.lifetimePerOwner-s.used),cloneFree=cap.cloneFree,made=0;
  for(const row of rows){if(free<=0)break;if(row.kind==='clone'&&cloneFree<=0)continue;if(!frameFor(row.unit)){metrics.refused++;continue;}
   const unit=row.unit,p=safePoint(unit,row.point,r)?row.point:position(unit,e,made,[],r);if(!p){metrics.refused++;continue;}
   Object.assign(unit,{x:p.x,y:p.y,homeX:p.x,homeY:p.y,graceUntil:time+.72,cd:1.05,nav:[],navAt:-Infinity,stuck:0});
   if(row.kind==='clone'){unit.maxHp=unit.hp=e.maxHp*limits.cloneRatio;unit.damage=e.damage;cloneFree--;}
   r.enemies.push(unit);free--;made++;s.used++;metrics[row.kind==='clone'?'clones':'minions']++;
   fx('summonEmergeR61',p.x,p.y,{life:.72,r61Room:r,r61Unit:unit,r61Frame:row.frame,r61SummonVisual:true});
   note({kind:'spawn',owner:e.id,id:unit.id,nativeId:unit.nativeId,role:row.kind,x:p.x,y:p.y,maxHp:unit.maxHp,ownerMaxHp:e.maxHp,damage:unit.damage,ownerDamage:e.damage});
  }
  if(made){holdLegacyPair(r);s.waves++;metrics.waves++;sound('special');saveGame(false);}return made>0;
 }
 function request(e){
  metrics.attempts++;if(!enabled(e)||nativeBusy(e)||time<state(e).nextAt||typeof fields()?.beginMotion!=='function'){metrics.refused++;return null;}
  const rows=plan(e);if(!rows.length){state(e).nextAt=time+3;metrics.refused++;return null;}
  const r=room,s=state(e),cooldown=clamp(limits.cooldown-5*(1-e.hp/Math.max(1,e.maxHp)),12,limits.cooldown);
  const action=fields().beginMotion(e,'summon',{windup:limits.minWindup,recovery:.48,cooldown:2.6,onRelease:()=>spawnWave(e,rows,r)});
  if(!action){metrics.refused++;return null;}
  s.nextAt=time+cooldown;metrics.prepared++;note({kind:'prepare',owner:e.id,releaseAt:action.releaseAt,endAt:action.endAt,rows:rows.map(x=>({kind:x.kind,x:x.point.x,y:x.point.y}))});
  for(const row of rows)fx('summonGateR61',row.point.x,row.point.y,{life:limits.minWindup,r61Room:r,r61Unit:row.unit,r61Frame:row.frame,r61Owner:e,r61Action:action,r61SummonVisual:true});
  return action;
 }
 function removeUnits(r,predicate,reason){const rows=(r?.enemies||[]).filter(e=>e.r61Summoned&&predicate(e));if(!rows.length)return 0;
  for(const e of rows){e.hp=0;e.deadRecorded=true;e.spawnState='dead';e.attack=null;e.rangedWindup=0;e.r61Action=null;cleanupOwner3(e.id);if(target===e.id)target=null;if(command===e.id)command=null;metrics.despawned++;}
  r.enemies=r.enemies.filter(e=>!rows.includes(e));note({kind:'despawn',reason,room:r.id,ids:rows.map(e=>e.id)});return rows.length;
 }
 function clear(reason='clear',r=room){return removeUnits(r,()=>true,reason);}
 const tickBase=tickEnemies;tickEnemies=function(dt){
  if(room&&player?.hp>0&&!modal&&!loading&&started){for(const e of [...room.enemies])if(enabled(e)&&!nativeBusy(e)&&time>=state(e).nextAt)request(e);}
  holdLegacyPair(room);const result=tickBase.apply(this,arguments);
  if(room){removeUnits(room,e=>!room.enemies.some(o=>o.id===ownerId(e)&&living(o))||!room.engaged||room.cleared||room.finalizing,'owner-or-encounter-ended');}
  return result;
 };
 const cleanupBase=cleanupOwner3;cleanupOwner3=function(id){if(room)removeUnits(room,e=>ownerId(e)===id,'owner-cleanup');return cleanupBase.apply(this,arguments);};
 const killBase=killEnemy;killEnemy=function(e){
  if(!e?.r61Summoned)return killBase.apply(this,arguments);
  if(e.deadRecorded||e.hp>0)return;
  e.hp=0;e.deadRecorded=true;e.deadAt=time;e.spawnState='dead';e.state='death';e.attack=null;spawnBurnDeath3(e);cleanupOwner3(e.id);if(target===e.id)target=null;if(command===e.id)command=null;room.enemies=room.enemies.filter(o=>o!==e);
  note({kind:'summoned-defeated',owner:ownerId(e),id:e.id,clone:!!e.r61Clone});
 };
 const effectBase=drawEffect;drawEffect=function(f,...args){
  if(!['summonGateR61','summonEmergeR61'].includes(f?.type))return effectBase.apply(this,[f,...args]);
  const gate=f.type==='summonGateR61';if(f.r61Room!==room||!f.r61Unit||f.age>=f.life||gate&&(!living(f.r61Owner)||f.r61Owner.r61Action!==f.r61Action)||!gate&&!room.enemies.includes(f.r61Unit))return;
  const unit=f.r61Unit,frame=f.r61Frame||frameFor(unit),p=project(f.x,f.y),u=clamp(f.age/f.life,0,1),h=actorHeight()*(unit.combatProfile?.spriteRect?.height||1)*(unit.defScale||1),alpha=gate?.18+.16*u:.48*(1-u),height=gate?h*(.36+.28*u):h;
  const paint=()=>{ctx.save();try{ctx.globalCompositeOperation='source-over';const filter='grayscale(.6) saturate(.5) brightness(.72)';if(!drawAssetFrame3(frame?.path||unit.path,frame,p.x,p.y,height,{alpha,filter}))sprite(frame?.path||unit.path,p.x,p.y,height,{alpha,filter});}finally{ctx.restore();}};
  if(typeof ctx.scope==='function')ctx.scope({id:f.id||'r61-summon-'+unit.id+'-'+f.type,kind:'effect',sourcePath:frame?.path||unit.path,x:f.x,y:f.y,groundAligned:false,lightShadowApproved:true},paint);else paint();
  metrics.telegraphs++;
 };
 const saveBase=serializeSave;serializeSave=function(...args){const data=saveBase.apply(this,args),rooms={};
  for(const r of new Set([...Object.values(world||{}),room].filter(Boolean))){const s=r.r61Summons;if(!s)continue;rooms[saveKeyFor(r)]={version:1,owners:Object.fromEntries(Object.entries(s.owners).map(([id,v])=>[id,{used:clamp(v.used|0,0,limits.lifetimePerOwner),waves:Math.max(0,v.waves|0),nextIn:clamp(v.nextAt-time,0,limits.cooldown)}])),units:r.enemies.filter(e=>e.r61Summoned&&living(e)).slice(0,limits.activeRegional).map(e=>({id:e.id,owner:ownerId(e),kind:e.r61Summoned.kind,nativeId:e.nativeId,x:e.x,y:e.y,hp:e.hp,maxHp:e.maxHp,damage:e.damage,cd:clamp(e.cd||0,0,20)}))};}
  data.summonsR61={version:1,serial,rooms};return data;
 };
 const enterBase=enterRegion;enterRegion=async function(id,...args){const from=room,restoringNow=restoring>0,result=await enterBase.apply(this,[id,...args]);if(!restoringNow&&from&&room!==from){const removed=clear('region-exit',from);if(removed)saveGame(false);}return result;};
 const restoreBase=restoreSave;restoreSave=async function(raw,...args){restoring++;let result;try{result=await restoreBase.apply(this,[raw,...args]);}finally{restoring--;}
  if(result===false)return result;serial=Math.max(serial,clamp(Math.floor(raw?.summonsR61?.serial)||0,0,1000000));
  for(const r of new Set([...Object.values(world||{}),room].filter(Boolean))){const old=raw?.summonsR61?.rooms?.[saveKeyFor(r)];if(old?.version!==1||!r.engaged||r.cleared||r.finalizing)continue;
   const s=roomState(r);for(const [id,v]of Object.entries(old.owners||{}).slice(0,12))if(r.enemies.some(e=>e.id===id&&major(e)))s.owners[id]={used:clamp(Math.floor(v?.used)||0,0,limits.lifetimePerOwner),waves:clamp(Math.floor(v?.waves)||0,0,limits.lifetimePerOwner),nextAt:time+clamp(Number(v?.nextIn)||0,1,limits.cooldown)};
   for(const row of (Array.isArray(old.units)?old.units:[]).slice(0,limits.activeRegional)){if(!row||typeof row.id!=='string'||!row.id.startsWith(r.id+':r61-summon:')||!['clone','minion'].includes(row.kind)||!(row.hp>0)||!finite(row.maxHp)||row.maxHp<=0||r.enemies.some(e=>e.id===row.id))continue;
    const owner=r.enemies.find(e=>e.id===row.owner&&major(e)&&living(e));if(!owner)continue;const cap=capacity(r);if(!cap.free||row.kind==='clone'&&!cap.cloneFree)continue;
    const e=makeUnit(owner,row.kind,row.id,r);if(!e)continue;const p=safePoint(e,row,r)?row:position(e,owner,0,[],r);if(!p)continue;Object.assign(e,{x:p.x,y:p.y,homeX:p.x,homeY:p.y,hp:clamp(row.hp/row.maxHp,0,1)*e.maxHp,cd:clamp(Number(row.cd)||0,.65,20),graceUntil:time+.75});if(row.kind==='clone')e.damage=owner.damage;r.enemies.push(e);metrics.restored++;
   }
  }saveGame(false);return result;
 };
 const newBase=newGame;newGame=async function(...args){if(room)clear('new-game');serial=0;return newBase.apply(this,args);};
 const deathBase=showDeath;showDeath=function(...args){if(room)clear('player-death');return deathBase.apply(this,args);};
 window.__STORYWORLD_SUMMONS_R61__=Object.freeze({limits,major,enabled,state,frameFor,safePoint,position,capacity,request,clear,inspect:()=>({revision:'native-regional-retainers-and-self-clones-r61',limits,cloneMaxHpRatio:.06,cloneDamage:'exact caster damage',cloneRecursiveSummons:false,sourceFieldWaveOrStoryOwnership:false,sharedMotionOwner:'fields-r61',metrics:{...metrics},active:(room?.enemies||[]).filter(e=>e.r61Summoned).map(e=>({id:e.id,owner:ownerId(e),kind:e.r61Summoned.kind,hp:e.hp,maxHp:e.maxHp,damage:e.damage,x:e.x,y:e.y})),events:[...events],browser:false,GPU:false})});
})();
