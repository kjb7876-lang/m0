/* R83 supplied static boss components. Native footprints, projectiles, hit
 * admission, skills and hospital medical effects remain authoritative. */
(()=>{'use strict';
 const data=window.__STORYWORLD_SELECTED_VFX_DATA_R83__;if(!data)return;
 const MAX_RESIDENT=4,MAX_LOADING=2,MAX_TRANSIENTS=8,rows=new Map(),transients=new Set(),events=[];
 const metrics={loads:0,loaded:0,cancelled:0,failed:0,lateLoads:0,evicted:0,draws:0,decorationsDropped:0,confirmedHits:0,recoveries:0,revivals:0,peakResident:0,peakLoading:0,peakDecodedBytes:0};
 let generation=0,current=null,currentRoom=null,loadingCount=0,serial=0,frameDraws=0;let revivalRoom=null;const queue=[],frameKeys=new Set(),roleDraws={warning:0,projectile:0,impact:0,recovery:0};
 const beginFrame=()=>{frameDraws=0;frameKeys.clear();for(const role of Object.keys(roleDraws))roleDraws[role]=0;window.__STORYWORLD_DYNAMIC_VFX_R84__?.beginFrame();};
 const note=r=>{events.push({...r,at:time});if(events.length>192)events.shift();};
 const mode=()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off';
 const coarseMQ=window.matchMedia?.('(pointer:coarse)');// R152: 장면마다 matchMedia 를 새로 만들지 않고 값만 읽는다
 const scoped=()=>layer==='STORY'&&!window.__STORYWORLD_EGO151__?.inspect().state.active&&mode()==='off'&&!coarseMQ?.matches;
 const eligible=()=>!!(started&&player?.hp>0&&room&&current===zone&&currentRoom===room&&scoped()&&data.regions[zone]);
 const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial)&&e.hp>0&&!e.deadRecorded);
 const actor=id=>typeof id==='object'?id:room?.enemies?.find(e=>e.id===id||e.nativeId===id);
 function cancelRow(row){
  if(row.settled)return;row.settled=true;clearTimeout(row.timer);if(row.state==='loading')loadingCount--;
  if(row.image){row.image.onload=null;row.image.onerror=null;try{row.image.src='';}catch(_){}}
  row.image=null;row.state='cancelled';row.resolve?.(null);metrics.cancelled++;
 }
 function clear(reason='region'){
  generation++;queue.length=0;revivalRoom=null;
  for(const row of rows.values()){if(row.state==='loading'||row.state==='queued')cancelRow(row);else{if(row.image){row.image.onload=null;row.image.onerror=null;try{row.image.src='';}catch(_){}}row.image=null;metrics.evicted++;}}
  rows.clear();loadingCount=0;current=null;currentRoom=null;
  if(transients.size){effects=effects.filter(e=>!transients.has(e));transients.clear();}
  note({kind:'clear',reason,generation});
 }
 function decoded(){let n=0;for(const r of rows.values())if(r.image)n+=r.spec.decodedBytes;return n;}
 function pump(){
  while(loadingCount<MAX_LOADING&&queue.length){
   const row=queue.shift();if(row.generation!==generation||row.settled||!rows.has(row.spec.path))continue;
   row.state='loading';loadingCount++;metrics.loads++;metrics.peakLoading=Math.max(metrics.peakLoading,loadingCount);
   const image=new Image();row.image=image;image.decoding='async';if(location.protocol!=='file:')image.crossOrigin='anonymous';
   const finish=ok=>{
    if(row.settled){metrics.lateLoads++;return;}row.settled=true;clearTimeout(row.timer);loadingCount--;
    image.onload=image.onerror=null;
    if(row.generation!==generation||rows.get(row.spec.path)!==row){row.image=null;row.state='cancelled';row.resolve(null);metrics.lateLoads++;pump();return;}
    row.state=ok&&image.naturalWidth>0&&image.naturalHeight>0?'ready':'failed';
    if(row.state==='ready')metrics.loaded++;else{metrics.failed++;row.image=null;note({kind:'asset-unavailable',path:row.spec.path});}
    row.resolve(row.state==='ready'?row:null);pump();
   };
   image.onload=()=>{const promise=image.decode?image.decode():Promise.resolve();Promise.resolve(promise).then(()=>finish(true),()=>finish(false));};
   image.onerror=()=>finish(false);row.timer=setTimeout(()=>finish(false),15000);image.src=urlFor(row.spec.path);
   metrics.peakDecodedBytes=Math.max(metrics.peakDecodedBytes,decoded());
  }
 }
 function sync(){
  const desired=scoped()&&room&&data.regions[zone]?zone:null;
  if(desired===current&&room===currentRoom)return;
  clear('scene');if(!desired)return;
  current=desired;currentRoom=room;
  for(const spec of Object.values(data.regions[desired])){
   const row={spec,state:'queued',generation,settled:false,image:null,promise:null,resolve:null};row.promise=new Promise(r=>row.resolve=r);rows.set(spec.path,row);queue.push(row);
  }
  metrics.peakResident=Math.max(metrics.peakResident,rows.size);pump();
 }
 const specFor=role=>data.regions[current]?.[role];
 function ready(role){const spec=specFor(role),row=spec&&rows.get(spec.path);return row?.state==='ready'?row:null;}
 function render(role,x,y,{angle=0,alpha=.7,lift=0,ownerId=null,key='',scale=1,progress=.25,anchor=''}={}){
  if(!eligible()||![x,y,angle,alpha,lift,scale].every(Number.isFinite))return false;
  const row=ready(role);if(!row||!row.image||window.__STORYWORLD_DYNAMIC_VFX_R84__?.allows64(row.spec,anchor)===false)return false;
  const stamp=role+':'+((role==='warning'||row.spec.casterEmblemOnly)?ownerId:key||ownerId),cap={warning:2,projectile:4,impact:3,recovery:2}[role];
  if(frameKeys.has(stamp))return false;
  if(frameDraws>=(settings.lowFx?4:10)||roleDraws[role]>=cap){metrics.decorationsDropped++;return false;}frameDraws++;roleDraws[role]++;frameKeys.add(stamp);
  const p=project(x,y),a=row.spec,box=a.alpha64BBox,[iw,ih]=a.dimensions,maximum=Math.min(Math.min(W,H)*.15,actorHeight()*scale),k=maximum/Math.max(iw,ih)*(a.presentationScaleR85||1),cx=(box[0]+box[2])*.5,cy=(box[1]+box[3])*.5;
  const screenAngle=a.casterEmblemOnly||role!=='projectile'?0:Math.atan2((Math.cos(angle)+Math.sin(angle))*.5,Math.cos(angle)-Math.sin(angle))-(a.bakedHeadingRadians||0);
  const paint=()=>{ctx.save();try{ctx.translate(p.x,p.y-lift*actorHeight());ctx.rotate(screenAngle);ctx.globalAlpha*=Math.max(0,Math.min(settings.reducedMotion?.45:.72,alpha));ctx.globalCompositeOperation='source-over';ctx.imageSmoothingEnabled=true;const r84=window.__STORYWORLD_DYNAMIC_VFX_R84__,handled=r84?.paint64(a,row.image,{maximum,progress,seed:key||ownerId||a.key,eventOwner:'vfx-r83:'+role+':'+(key||ownerId),nativeOwner:ownerId,role,x,y});if(!handled)ctx.drawImage(row.image,0,0,iw,ih,-cx*k,-cy*k,iw*k,ih*k);}finally{ctx.restore();}};
  const owner={id:'vfx-r83:'+role+':'+(key||ownerId||++serial),kind:'effect',x,y,groundAligned:false,sourcePath:a.path,r83Role:role,nativeOwner:ownerId};
  if(typeof ctx.scope==='function')ctx.scope(owner,paint);else paint();metrics.draws++;note({kind:'draw',region:current,role,path:a.path,ownerId,key,size:maximum,alpha:Math.min(settings.reducedMotion?.45:.72,alpha),screenAngle,ground:false});return true;
 }
 function emit(role,x,y,opt={}){
  if(!eligible()||!ready(role)||transients.size>=MAX_TRANSIENTS||effects.length>=(settings.lowFx?80:160)){metrics.decorationsDropped++;return false;}
  const e={type:'selectedStaticVfxR83',x,y,angle:opt.angle||0,age:0,life:opt.life||.32,r83Generation:generation,r83Room:room,r83Role:role,r83Owner:opt.owner?.id||null,r83Anchor:opt.anchor||'confirmed native event',r83Lift:opt.lift||0,r83Serial:++serial};transients.add(e);effects.push(e);note({kind:'emit',role,ownerId:e.r83Owner,anchor:e.r83Anchor});return true;
 }
 const groundBase=groundImage;groundImage=function(...args){sync();beginFrame();return groundBase.apply(this,args);};
 const projectileBase=drawProjectile;drawProjectile=function(p,...args){
  const result=projectileBase.apply(this,[p,...args]);if(!eligible()||p?.friendly!==false||p.medical20||p.dead||!Number.isFinite(p.vx)||!Number.isFinite(p.vy))return result;
  const e=actor(p.owner||p.ownerId),a=specFor('projectile');if(!major(e)||a?.casterEmblemOnly)return result;
  render('projectile',p.x,p.y,{angle:Math.atan2(p.vy,p.vx),alpha:.62,lift:.28,scale:.72,ownerId:e.id,key:p.id||String(p.age),progress:clamp(p.age/Math.max(.001,p.life),0,.999999)});return result;
 };
 const hazardBase=drawHazard;drawHazard=function(h,...args){
  const result=hazardBase.apply(this,[h,...args]);if(!eligible()||h?.medical20)return result;
  const e=actor(h?.owner||h?.cast150?.actor),r=h?.row150;if(!major(e)||!r||['cancelled','ended'].includes(r.lifecycle154))return result;
  if(time<r.releaseAt){render('warning',e.x,e.y,{alpha:.45,lift:.96,scale:.68,ownerId:e.id,key:h.id,progress:Number.isFinite(r.warningAt)?clamp((time-r.warningAt)/Math.max(.001,r.releaseAt-r.warningAt),0,.999999):.25});}
  else if(time<r.impactAt){const t=clamp((time-r.releaseAt)/Math.max(.001,r.impactAt-r.releaseAt),0,1),a=specFor('projectile'),x=a?.casterEmblemOnly?e.x:r.originX+(r.targetX-r.originX)*t,y=a?.casterEmblemOnly?e.y:r.originY+(r.targetY-r.originY)*t;render('projectile',x,y,{angle:Math.atan2(r.targetY-r.originY,r.targetX-r.originX),alpha:.55,lift:a?.casterEmblemOnly?.72:.28,scale:.76,ownerId:e.id,key:h.id,progress:t});}
  else if(time<r.impactAt+.32&&!specFor('recovery')?.revivalOnly){render('recovery',r.targetX,r.targetY,{alpha:.44*(1-(time-r.impactAt)/.32),lift:.05,scale:.8,ownerId:e.id,key:h.id,progress:(time-r.impactAt)/.32});}
  return result;
 };
 const effectBase=drawEffect;drawEffect=function(e,...args){
  if(e?.type!=='selectedStaticVfxR83')return effectBase.apply(this,[e,...args]);
  if(e.r83Generation!==generation||e.r83Room!==room||e.age>=e.life||!eligible())return;
  if(e.r83Role!=='impact'&&e.r83Owner&&!major(actor(e.r83Owner)))return;
  const t=clamp(e.age/e.life,0,1);render(e.r83Role,e.x,e.y,{angle:e.angle,alpha:.68*Math.sin(Math.PI*t),lift:e.r83Lift,scale:e.r83Role==='impact'?.85:.8,ownerId:e.r83Owner,key:e.r83Serial,progress:t,anchor:e.r83Anchor});
 };
 const hurtBase=hurt;hurt=function(value,source){
  const hp=player?.hp,shield=player?.shield,result=hurtBase.apply(this,arguments);
  if(eligible()&&result==='parried'&&specFor('projectile')?.key==='10_knight_parry_counter'){const e=actor(source?.owner||source?.ownerId);if(major(e))emit('projectile',player.x,player.y-.15,{owner:e,life:.3,lift:.3,anchor:'actual native player parry'});}
  if(eligible()&&hp>player.hp&&result==='hit'&&!source?.medical20){const e=actor(source?.owner||source?.ownerId);if(major(e)){const q=source?.impactPoint152;emit('impact',q?.x??player.x,q?.y??player.y-.15,{owner:e,angle:Math.atan2(source?.vy||0,source?.vx||1),lift:.3,anchor:'actual admitted player HP loss'});metrics.confirmedHits++;}}
  return result;
 };
 // The cult leader returns only after acknowledged story and six cosmic
 // encounters. A lethal hit must never fabricate an immediate revival image.
 const killBase=killEnemy;killEnemy=function(e,...args){const first=eligible()&&specFor('recovery')?.revivalOnly&&e?.nativeId==='c104-boss'&&!e.deadRecorded&&room.finalStage===0,sourceRoom=room,result=killBase.apply(this,[e,...args]);if(first&&room===sourceRoom)revivalRoom=sourceRoom;return result;};
 function observeRevival(){
  if(!revivalRoom||revivalRoom!==room||!eligible()||storyScene||modal)return;
  const e=room.enemies.find(e=>e.nativeId==='c104-boss'&&e.phase>=2&&e.hp>0&&e.spawnState==='active'&&!e.deadRecorded);
  if(e&&room.finalStage>=2){emit('recovery',e.x,e.y,{owner:e,life:.5,lift:.5,anchor:'native cult leader return after acknowledged story and cosmic sequence'});metrics.revivals++;revivalRoom=null;}
 }
 const prepareBase=window.__STORYWORLD_CAST5__;
 if(prepareBase)window.__STORYWORLD_CAST5__=Object.freeze({...prepareBase,prepare(e,kind){const c=prepareBase.prepare(e,kind);if(eligible()&&major(e)&&c){emit('warning',e.x,e.y,{owner:e,life:Math.min(.7,Math.max(.2,c.warning||.4)),lift:.96,anchor:'native admitted boss cast windup'});if(specFor('projectile')?.casterEmblemOnly)emit('projectile',e.x,e.y,{owner:e,life:.3,lift:.65,anchor:'native admitted caster charge emblem'});}return c;}});
 const tickBase=tick;tick=function(...args){sync();const result=tickBase.apply(this,args);sync();observeRevival();for(const e of transients)if(e.r83Generation!==generation||e.age>=e.life||!effects.includes(e))transients.delete(e);return result;};
 const enterBase=enterRegion;enterRegion=async function(...args){clear('travel');try{return await enterBase.apply(this,args);}finally{sync();}};
 const restoreBase=restoreSave;restoreSave=async function(...args){clear('restore');try{return await restoreBase.apply(this,args);}finally{sync();}};
 const newBase=newGame;newGame=async function(...args){clear('new-game');try{return await newBase.apply(this,args);}finally{sync();}};
 const deathBase=showDeath;showDeath=function(...args){clear('death');return deathBase.apply(this,args);};
 window.__STORYWORLD_SELECTED_VFX_R83__=Object.freeze({sync,clear,ready:async()=>{sync();await Promise.all([...rows.values()].map(r=>r.promise));},beginFrame,inspect:()=>({revision:'r83-supplied-static-64',selectedCount:64,upgraded:48,retainedOriginal:16,current,generation,resident:rows.size,loading:loadingCount,decodedBytes:decoded(),maxResidentImages:MAX_RESIDENT,maxConcurrentLoads:MAX_LOADING,maxTransientEffects:MAX_TRANSIENTS,residents:[...rows.values()].map(r=>({path:r.spec.path,role:r.spec.role,state:r.state,decodedBytes:r.spec.decodedBytes})),metrics:{...metrics},events:[...events],sourceBytesUnchanged:true,staticSingleComponents:true,staticSingleComponentsMeaning:'each supplied PNG is one unchanged static source component',staticSourcePNGsPreserved:true,dynamic64Driven:!!window.__STORYWORLD_DYNAMIC_VFX_R84__,nativeFootprintsPreserved:true,nativeDamageChanged:false,hospitalExcluded:true,globalImageCacheUsed:false,GPUVerified:false})});
})();
