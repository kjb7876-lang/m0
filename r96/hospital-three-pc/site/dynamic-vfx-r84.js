/* R84 adapts the supplied deterministic timelines to native event anchors.
 * Native simulation owns clocks, collision, damage and travel. The unchanged
 * runtime/catalog and SVG alternatives are retained under assets/dynamic-vfx-r84.
 * No preview loop, image loader, frame sheet, screen flash or camera impulse. */
(()=>{'use strict';
 if(window.__STORYWORLD_DYNAMIC_VFX_R84__)return;
 const runtime=window.StoryVFX,catalog=window.STORY_VFX_CATALOG;
 if(!runtime?.sample||!Array.isArray(catalog))return;
 const byId=new Map(catalog.map(e=>[e.id,e])),byHash=new Map(catalog.filter(e=>e.sourceSha256).map(e=>[e.sourceSha256,e]));
 const events=[],keys=new Set(),metrics={frames:0,draws64:0,proceduralDraws:0,primitives:0,dropped:0,clears:0,peakPrimitives:0,peakAmbient:0};
 let activeRoom=null,activePlayer=null,generation=0,used=0,ambientUsed=0;
 const limit=()=>settings.lowFx?48:160,ambientLimit=()=>settings.lowFx?16:48;
 const clamp01=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
 const scoped=()=>!!(started&&room&&player?.hp>0&&layer==='STORY'&&!window.__STORYWORLD_EGO151__?.inspect().state.active&&(window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off')==='off'&&!window.matchMedia?.('(pointer: coarse)').matches);
 const note=e=>{events.push({...e,at:time,generation});if(events.length>192)events.shift();};
 function clear(reason='scene'){activeRoom=null;activePlayer=null;generation++;keys.clear();used=ambientUsed=0;metrics.clears++;note({kind:'clear',reason});}
 function sync(){if(room!==activeRoom||player!==activePlayer){clear('scene');activeRoom=room;activePlayer=player;}}
 function beginFrame(){sync();keys.clear();used=ambientUsed=0;metrics.frames++;}
 function admit(key,count,ambient=false){
  if(!scoped()||keys.has(key)||!Number.isInteger(count)||count<=0)return false;
  if(used+count>limit()||ambient&&ambientUsed+count>ambientLimit()){metrics.dropped++;return false;}
  keys.add(key);used+=count;if(ambient)ambientUsed+=count;metrics.primitives+=count;metrics.peakPrimitives=Math.max(metrics.peakPrimitives,used);metrics.peakAmbient=Math.max(metrics.peakAmbient,ambientUsed);return true;
 }
 const recipeFor=spec=>byHash.get(spec?.sha256)||null;
 const allows64=(spec,anchor='')=>recipeFor(spec)?.id!=='10_knight_parry_counter'||anchor==='actual native player parry';
 function sampleLocal(recipe,progress,seed){
  const p=clamp01(progress),frame=runtime.sample(recipe,p*recipe.duration,seed);
  if(recipe.role!=='projectile'||recipe.motion==='panel-rise-hold')return frame;
  // The preview supplies a complete flight. A native shot already moved; remove
  // that preview translation from every endpoint, retaining only local motion.
  const t=clamp01((p-.08)/.65),travel=t*t*(3-2*t),dx=-.92+1.64*travel,dy=-.15*Math.sin(travel*Math.PI);
  return{...frame,primitives:frame.primitives.map(q=>({...q,x:q.x-dx,y:q.y-dy,...(Number.isFinite(q.x2)?{x2:q.x2-dx}:{}),...(Number.isFinite(q.y2)?{y2:q.y2-dy}:{})}))};
 }
 function sample64(spec,progress,seed=spec?.key){const recipe=recipeFor(spec);return recipe?sampleLocal(recipe,progress,seed):null;}
 function primitive(q,size,image,spec){
  ctx.save();try{
   ctx.globalAlpha*=clamp01(q.alpha);ctx.fillStyle=q.color;ctx.strokeStyle=q.color;ctx.lineWidth=Math.max(.35,(q.width||.02)*size);ctx.lineCap='round';ctx.lineJoin='round';
   ctx.translate(q.x*size,q.y*size);const r=Math.max(0,Math.min(4,q.radius||.03))*size;
   if(q.type==='sprite'){
    if(!image||!spec)return;const [iw,ih]=spec.dimensions,b=spec.alpha64BBox,cx=(b[0]+b[2])*.5,cy=(b[1]+b[3])*.5,nominal=recipeFor(spec)?.role==='warning'?1.27:1.12,k=size*2/Math.max(iw,ih)*(q.size/nominal)*(spec.presentationScaleR85||1);
    ctx.rotate(q.rotation||0);ctx.drawImage(image,0,0,iw,ih,-cx*k,-cy*k,iw*k,ih*k);
   }else if(q.type==='line'){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo((q.x2-q.x)*size,(q.y2-q.y)*size);ctx.stroke();
   }else if(q.type==='ring'||q.type==='arc'){ctx.rotate(q.rotation||0);ctx.beginPath();ctx.arc(0,0,r,q.type==='ring'?0:q.start,q.type==='ring'?Math.PI*2:q.end);ctx.stroke();
   }else if(q.type==='particle'){
    ctx.rotate(q.rotation||0);ctx.beginPath();
    if(q.shape==='diamond'){ctx.moveTo(0,-r*1.3);ctx.lineTo(r,0);ctx.lineTo(0,r*1.3);ctx.lineTo(-r,0);ctx.closePath();}
    else if(q.shape==='spark'){for(let s=0;s<8;s++){const rr=s%2?r*.25:r*1.4,a=s*Math.PI/4;if(s)ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);else ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();}
    else if(q.shape==='droplet'){ctx.moveTo(0,-r*1.7);ctx.bezierCurveTo(r*.28,-r*.65,r*1.25,r*.3,r*.55,r*.8);ctx.bezierCurveTo(0,r*1.2,-r*1.15,r*.65,-r*.6,-r*.05);ctx.closePath();}
    else ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
   }
  }finally{ctx.restore();}
 }
 function paint64(spec,image,opt){
  if(!scoped())return false;const recipe=recipeFor(spec);if(!recipe)return false;
  const frame=sampleLocal(recipe,opt.progress,opt.seed),vectors=frame.primitives.filter(q=>q.type!=='sprite'),sprites=frame.primitives.filter(q=>q.type==='sprite');
  // The unchanged raster supplies the detailed silhouette; at most seven
  // timeline accents supplement it. Only this adapter draws the original PNG.
  const accents=vectors.slice(0,4).concat(vectors.slice(4).filter((_,i)=>i%4===0).slice(0,3)),keep=new Set([...sprites,...accents]),selected=frame.primitives.filter(q=>keep.has(q));
  const key='64:'+opt.eventOwner;if(!frame.active||!selected.length)return true;
  if(!admit(key,selected.length))return false;
  const accentOwner={id:opt.eventOwner+':timeline',kind:'effect',x:opt.x,y:opt.y,groundAligned:false,r84Id:recipe.id,r84Role:'64-accent',nativeOwner:opt.nativeOwner,eventOwner:opt.eventOwner,r84Progress:frame.progress};
  for(const q of selected){const paint=()=>primitive(q,opt.maximum*.5,image,spec);if(q.type!=='sprite'&&typeof ctx.scope==='function')ctx.scope(accentOwner,paint);else paint();}
  metrics.draws64++;note({kind:'draw64',id:recipe.id,role:opt.role,eventOwner:opt.eventOwner,nativeOwner:opt.nativeOwner,path:spec.path,progress:frame.progress,primitives:selected.length,x:opt.x,y:opt.y});return true;
 }
 function draw(motif,x,y,{age=0,life=1,phase=null,angle=0,size=.28,alpha=.5,lift=0,owner=null,eventOwner='',ambient=false}={}){
  sync();if(!scoped()||![x,y,age,life,angle,size,alpha,lift].every(Number.isFinite)||life<=0||age<0||age>=life)return false;
  const recipe=byId.get('procedural-'+motif);if(!recipe)return false;
  const progress=phase===null?age/life:clamp01(phase),frame=sampleLocal(recipe,progress,eventOwner||owner||motif),count=frame.primitives.length;
  if(!frame.active||!admit('16:'+motif+':'+eventOwner,count,ambient))return false;
  const q=project(x,y),scale=Math.min(Math.min(W,H)*.075,actorHeight()*size),scope={id:'vfx-r84:'+motif+':'+eventOwner,kind:'effect',x,y,groundAligned:false,r84Id:recipe.id,r84Role:ambient?'status-or-portal':'native-event',nativeOwner:owner,eventOwner,r84Progress:progress};
  const paint=()=>{ctx.save();try{ctx.translate(q.x,q.y-actorHeight()*lift);ctx.rotate(angle);ctx.globalAlpha*=Math.min(settings.reducedMotion?.28:.52,alpha);ctx.globalCompositeOperation='source-over';for(const p of frame.primitives)primitive(p,scale*.5);}finally{ctx.restore();}};
  if(typeof ctx.scope==='function')ctx.scope(scope,paint);else paint();metrics.proceduralDraws++;note({kind:'draw16',id:recipe.id,role:scope.r84Role,eventOwner,nativeOwner:owner,progress,primitives:count,x,y});return true;
 }
 const aliases={pollution:'poison',poison:'poison',bleed:'bleed',shock:'shock',frost:'freeze',chill:'freeze',fire:'burn',burn:'burn',charm:'charm',weakness:'weakness',corruption:'corruption',bind:'binding',harvest:'harvest',disease:'disease'};
 function activeStatuses(){
  const rows=[];for(const r of window.__STORYWORLD_FIELDS_R61__?.statusRows?.()||[])if(r.until>time&&aliases[r.key])rows.push({motif:aliases[r.key],owner:r.owner,start:r.start,until:r.until,key:r.key,authority:'fields-r61'});
  for(const r of window.__STORYWORLD_HOSPITAL_WOUNDS_R53__?.statusRows?.()||[]){const key=r.key?.replace('hospital-wound-r53-','');if(r.remaining>0&&aliases[key])rows.push({motif:aliases[key],owner:r.ownerId,start:null,until:time+r.remaining,key:r.key,authority:'wounds-r53'});}
  for(const r of window.__STORYWORLD_HEALTH_R71__?.statusRows?.()||[])if(r.remaining>0)rows.push({motif:'bleed',owner:r.ownerId,start:player.healthBleedR71?.started,until:time+r.remaining,key:r.key,authority:'health-r71'});
  return rows.filter((r,i)=>rows.findIndex(v=>v.motif===r.motif)===i);
 }
 const effectBase=drawEffect;drawEffect=function(e,...args){
  const result=effectBase.apply(this,[e,...args]);if(!scoped()||!e||e.age<0||e.age>=e.life)return result;
  if(e.type==='threadSlashR63'&&e.threadR63){const m=e.threadR63,a=m.from,b=m.to;if(a&&b)draw('silver-thread',(a.x+b.x)*.5,(a.y+b.y)*.5,{age:e.age,life:e.life,angle:Math.atan2((b.x-a.x+b.y-a.y)*.5,b.x-a.x-b.y+a.y),size:.4,alpha:.34,lift:.28,owner:m.playerId||player.id||'player',eventOwner:'silver:'+m.seed+':'+m.hitIndex});}
  else if(e.type==='goldenThreadR72'&&e.goldenR72){const m=e.goldenR72,a=m.a,b=m.b;if(a&&b)draw('gold-thread',(a.x+b.x)*.5,(a.y+b.y)*.5,{age:e.age,life:e.life,angle:Math.atan2((b.x-a.x+b.y-a.y)*.5,b.x-a.x-b.y+a.y),size:.4,alpha:.34,lift:.28,owner:m.actor||player.id||'player',eventOwner:'gold:'+m.cast+':'+m.slot+':'+m.stroke});}
  return result;
 };
 const projectileBase=drawProjectile;drawProjectile=function(p,...args){
  const result=projectileBase.apply(this,[p,...args]),m=p?.medical20;
  if(scoped()&&m?.kind==='tool'&&m.room===room&&m.epoch===window.__STORYWORLD_MEDICAL20__?.inspect().epoch&&!m.cancelled&&!p.dead&&room.enemies.includes(m.owner)&&m.owner?.hp>0&&!m.owner.deadRecorded&&visible3(m.owner)&&readyImage('assets/visual-test/hospital-medical-tools-r20.png')?.image&&readyImage('assets/vfx/bosses/v393/ep1a08-restraint-wave.webp')?.image&&Number.isFinite(p.vx)&&Number.isFinite(p.vy)&&['scalpel','syringe'].includes(m.frame))draw(m.frame==='scalpel'?'scalpel':'poison-syringe',p.x,p.y,{age:p.age,life:p.life,angle:Math.atan2((p.vx+p.vy)*.5,p.vx-p.vy)+Math.PI/4,size:.36,alpha:.34,lift:.25,owner:m.owner.id,eventOwner:'tool:'+m.castId+':'+p.id});
  return result;
 };
 const heroBase=drawHero;drawHero=function(...args){
  const result=heroBase.apply(this,args);if(!scoped()||player.visible===false||player.disabled)return result;
  const status=activeStatuses()[0];if(status){const start=Number.isFinite(status.start)?status.start:0,age=Math.max(0,time-start),phase=settings.reducedMotion?.35:.12+(age%1.8)/1.8*.65;draw(status.motif,player.x,player.y,{age:0,life:1,phase,size:.3,alpha:.48,lift:1.02,owner:status.owner,eventOwner:'status:'+status.authority+':'+status.key,ambient:true});}
  return result;
 };
 const exitsBase=drawExits;drawExits=function(...args){
  const result=exitsBase.apply(this,args);if(!scoped())return result;
  // Only already-open, visible native markers. This is decoration, never a
  // travel trigger; the R83 interaction admission remains authoritative.
  const routes=window.__STORYWORLD_ROUTES_R72__;
  for(const d of routes?.visibleDirections?.()||[]){const r=routes.status(d),p=r?.point;if(!r.open||!p||distance(player,p)>8||activeStatuses().length)continue;const q=project(p.x,p.y);if(q.x<0||q.y<0||q.x>W||q.y>H)continue;draw('portal',p.x,p.y,{age:0,life:1,phase:settings.reducedMotion?.35:.12+(time%2.4)/2.4*.65,size:.5,alpha:.36,lift:.45,eventOwner:'portal:'+zone+':'+d,ambient:true});}
  return result;
 };
 const tickBase=tick;tick=function(...args){sync();const result=tickBase.apply(this,args);sync();return result;};
 const enterBase=enterRegion;enterRegion=async function(...args){clear('travel');try{return await enterBase.apply(this,args);}finally{sync();}};
 const restoreBase=restoreSave;restoreSave=async function(...args){clear('restore');try{return await restoreBase.apply(this,args);}finally{sync();}};
 const newBase=newGame;newGame=async function(...args){clear('new-game');try{return await newBase.apply(this,args);}finally{sync();}};
 const deathBase=showDeath;showDeath=function(...args){clear('death');return deathBase.apply(this,args);};
 window.__STORYWORLD_DYNAMIC_VFX_R84__=Object.freeze({beginFrame,clear,sample64,paint64,allows64,activeStatuses,
  inspect:()=>({revision:'r84-supplied-dynamic-64-and-procedural-16',sourceTimelines:64,proceduralMotifs:16,alternateSVGs:16,newFrameSheets:false,ownedImages:0,usesNativeSimulationClock:true,maxPrimitivesPerFrame:limit(),maxAmbientPrimitivesPerFrame:ambientLimit(),usedPrimitives:used,ambientPrimitives:ambientUsed,maxSingleEffect:runtime.maxPrimitives,fullEffectAdmission:true,sourcePNGBytesPreserved:true,nativeDamageChanged:false,nativeTravelChanged:false,globalCameraEffects:false,browserVerified:false,GPUVerified:false,metrics:{...metrics},events:[...events],aliases:{...aliases},statusRows:activeStatuses()})});
})();
