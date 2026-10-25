/* R88 FINAL42 painted atlas player. No RAF, procedural motif, damage or range
 * logic. Hooks own native event admission; metadata owns frames and pivots. */
(()=>{'use strict';
 const DATA=window.__STORYWORLD_FINAL42_DATA_R88__;
 if(!DATA?.effects||window.__STORYWORLD_FINAL42_R88__)return;
 const LIMIT=64*1024*1024,MAX_ATLASES=8,MAX_INSTANCES=16,IDLE=5,OFFSCREEN=1.5,EPSILON=1e-9;
 const pool=new Map(),slots=new Map(),keys=new Map(),compiled=new Map(),aliases=new Map(),directKeys=new Set();
 const metrics={loads:0,decoded:0,releases:0,failed:0,lateLoads:0,draws:0,played:0,attached:0,dropped:0,budgetDrops:0,offscreenDrops:0,invalidCallbacks:0,completed:0,sceneClears:0,highWaterBytes:0,highWaterInstances:0};
 let fallbackTime=0,generation=0,serial=0,scene=undefined,victim=undefined,directTime=NaN;
 const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 const now=()=>typeof time==='number'&&Number.isFinite(time)?time:fallbackTime;
 const low=()=>typeof settings!=='undefined'&&settings.lowFx===true;
 const nativeRoom=()=>typeof room==='undefined'?null:room;
 const nativePlayer=()=>typeof player==='undefined'?null:player;
 const enabled=()=>!(typeof mobile==='function'&&mobile())&&!window.matchMedia?.('(pointer:coarse)').matches&&
  (typeof started==='undefined'||started)&&(typeof layer==='undefined'||layer==='STORY')&&
  (!nativePlayer()||nativePlayer().hp>0)&&
  (!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off');
 for(const [key,spec]of Object.entries(DATA.effects)){
  aliases.set(key,key);aliases.set(String(spec.sourceIndex),key);aliases.set(String(spec.id||key),key);
  if(spec.effectId)aliases.set(spec.effectId,key);
  const number=Number(String(key).replace(/^F/i,''));if(Number.isInteger(number)){aliases.set(String(number),key);aliases.set('F'+String(number).padStart(3,'0'),key);}
 }
 function register(spec){
  if(!spec?.id||!Array.isArray(spec.atlases)||!Array.isArray(spec.frames)||DATA.effects[spec.id])return false;
  extra.set(spec.id,spec);extra.set(String(spec.sourceIndex),spec);aliases.set(spec.id,spec.id);aliases.set(String(spec.sourceIndex),spec.id);return true;
 }
 const extra=new Map();
 const resolve=id=>extra.get(String(id))||DATA.effects[aliases.get(String(id))];
 const effectKey=spec=>aliases.get(String(spec.id))||aliases.get(String(spec.sourceIndex))||Object.keys(DATA.effects).find(key=>DATA.effects[key]===spec);
 const bytes=()=>[...pool.values()].reduce((sum,row)=>sum+(row.state==='ready'||row.state==='loading'?row.bytes:0),0);
 const activePaths=()=>new Set([...slots.values()].flatMap(slot=>slot.spec.atlases.map(atlas=>atlas.path)));
 function releaseRow(row){
  if(pool.get(row.path)!==row)return;pool.delete(row.path);clearTimeout(row.timer);
  row.state='released';row.image.onload=row.image.onerror=null;row.resolve?.(false);row.resolve=null;
  // Remove the native command rows which hold texture references before clearing
  // this Image. CommandScene.remove owns its normal refcount/disposal behavior.
  const commands=window.__STORYWORLD_PHASE1__?.controller?.state?.three?.commands;
  if(commands?.rows&&typeof commands.remove==='function')for(const [key,value]of [...commands.rows])if(value.image===row.image)commands.remove(key);
  row.image.src='';metrics.releases++;
 }
 function clear(reason='explicit'){
  generation++;slots.clear();keys.clear();directKeys.clear();directTime=NaN;
  for(const row of [...pool.values()])releaseRow(row);
  scene=nativeRoom();victim=nativePlayer();if(reason==='scene'||reason==='death')metrics.sceneClears++;
 }
 function sync(){
  const nextScene=nativeRoom(),nextVictim=nativePlayer();
  if(scene===undefined){scene=nextScene;victim=nextVictim;}
  else if(scene!==nextScene||victim!==nextVictim)clear('scene');
  if(nextVictim&&nextVictim.hp<=0&&(slots.size||pool.size))clear('death');
  if(!enabled()&&(slots.size||pool.size))clear('scope');
 }
 function makeRoomFor(cost){
  const busy=activePaths(),at=now();
  const removable=[...pool.values()].filter(row=>row.state==='ready'&&!busy.has(row.path)&&at-row.lastDraw>.15).sort((a,b)=>a.used-b.used);
  while((bytes()+cost>LIMIT||[...pool.values()].filter(row=>row.state!=='failed').length>=MAX_ATLASES)&&removable.length)releaseRow(removable.shift());
  return bytes()+cost<=LIMIT&&[...pool.values()].filter(row=>row.state!=='failed').length<MAX_ATLASES;
 }
 function ensureAtlas(atlas){
  let row=pool.get(atlas.path);if(row){row.used=now();return row.promise;}
  const cost=atlas.width*atlas.height*4;
  if(!Number.isSafeInteger(cost)||cost<=0||cost>LIMIT||!makeRoomFor(cost)){metrics.budgetDrops++;return Promise.resolve(false);}
  const image=new Image(),epoch=generation;
  row={path:atlas.path,image,bytes:cost,state:'loading',used:now(),lastDraw:-Infinity,resolve:null,promise:null,timer:null};
  row.promise=new Promise(resolve=>row.resolve=resolve);pool.set(row.path,row);image.decoding='async';
  function finish(ok){
   if(row.state!=='loading')return;clearTimeout(row.timer);image.onload=image.onerror=null;
   if(epoch!==generation||pool.get(row.path)!==row){metrics.lateLoads++;row.state='released';row.resolve?.(false);row.resolve=null;return;}
   const same=image.naturalWidth===atlas.width&&image.naturalHeight===atlas.height;
   row.state=ok&&same?'ready':'failed';row.used=now();if(row.state==='ready')metrics.decoded++;else{metrics.failed++;image.src='';}
   row.resolve?.(row.state==='ready');row.resolve=null;
  }
  image.onload=()=>Promise.resolve(image.decode?.()).then(()=>finish(true),()=>finish(false));
  image.onerror=()=>finish(false);row.timer=setTimeout(()=>finish(false),15000);
  image.src=typeof urlFor==='function'?urlFor(atlas.path):new URL(atlas.path,document.baseURI).href;
  metrics.loads++;metrics.highWaterBytes=Math.max(metrics.highWaterBytes,bytes());return row.promise;
 }
 function ensure(id){sync();const spec=resolve(id);if(!spec||!enabled())return Promise.resolve(false);return Promise.all(spec.atlases.map(ensureAtlas)).then(rows=>rows.every(Boolean));}
 function isReady(id){sync();const spec=resolve(id);return !!spec&&enabled()&&spec.atlases.every(atlas=>pool.get(atlas.path)?.state==='ready');}
 function timeline(spec,name){
  const key=effectKey(spec)+':'+name;if(compiled.has(key))return compiled.get(key);
  const clip=spec.clips?.[name];if(!clip)return null;
  const indices=clip.frameIndices||clip.frames||spec.sequence||spec.frames.map(frame=>frame.index);
  if(!Array.isArray(indices)||!indices.length)return null;
  let duration=0;const steps=[];
  for(const index of indices){const frame=spec.frames.find(frame=>frame.index===index);if(!frame)return null;const seconds=finite(clip.stepSeconds,finite(spec.stepDuration,frame.seconds));if(!(seconds>0))return null;steps.push({frame,index,start:duration,seconds});duration=Math.round((duration+seconds)*1e9)/1e9;}
  if(!Number.isFinite(duration)||duration<=0)return null;
  const value={name,clip,steps,duration,loop:clip.loop===true};compiled.set(key,value);return value;
 }
 const blend=value=>/normal|source-over|NOT additive/i.test(String(value))?'source-over':/additive|lighter/i.test(String(value))?'lighter':'source-over';
 function sample(id,age,options={}){
  const spec=resolve(id);if(!spec||!Number.isFinite(age)||age<0)return null;
  let name=options.clip||(spec.clips?.emerge?'emerge':spec.clips?.main?'main':Object.keys(spec.clips||{})[0]);
  let remaining=age,track;
  for(let guard=0;guard<16;guard++){
   track=timeline(spec,name);if(!track)return null;
   if(track.loop){remaining%=track.duration;if(track.duration-remaining<EPSILON)remaining=0;break;}
   if(remaining+EPSILON<track.duration)break;
   if(track.clip.next){remaining=Math.max(0,remaining-track.duration);name=track.clip.next;continue;}
   if((track.clip.holdLastUntilSignal||spec.holdLastUntilSignal||options.holdLast)&&options.signal!==true){remaining=Math.max(0,track.duration-1e-9);break;}
   return null;
  }
  if(!track||remaining>=track.duration)return null;
  const step=track.steps.find(step=>remaining+EPSILON<step.start+step.seconds)||track.steps.at(-1);
  const frame=step.frame,atlas=spec.atlases[frame.atlas||0];if(!atlas)return null;
  let alpha=1;const progress=clamp((remaining-step.start)/step.seconds,0,1),position=track.steps.indexOf(step);
  const first=spec.endpointOpacity?.firstFrame||(name==='emerge'?spec.opacityEnvelope?.emergeFirstFrame:null);
  const last=spec.endpointOpacity?.lastFrame||(name==='release'?spec.opacityEnvelope?.releaseLastFrame:null);
  if(!track.loop&&position===0&&Array.isArray(first))alpha*=first[0]+(first[1]-first[0])*progress;
  if(!track.loop&&position===track.steps.length-1&&Array.isArray(last))alpha*=last[0]+(last[1]-last[0])*progress;
  return{id:effectKey(spec),effectId:spec.effectId||spec.id,sourceIndex:spec.sourceIndex,index:frame.index,step:position,clip:name,
   age,clipAge:remaining,duration:track.duration,loop:track.loop,rect:frame.rect.slice(),path:atlas.path,
   pivot:(frame.pivot||spec.pivot||[.5,.5]).slice(),alpha:clamp(alpha,0,1),parts:frame.parts,layer:frame.layer||spec.layer||'overlay',blend:blend(frame.blend||spec.blend)};
 }
 const viewport=()=>({width:typeof W==='number'?W:1280,height:typeof H==='number'?H:800});
 function projected(x,y){if(![x,y].every(Number.isFinite)||typeof project!=='function')return null;const point=project(x,y);return point&&[point.x,point.y].every(Number.isFinite)?point:null;}
 function visible(x,y,margin=200){const point=projected(x,y),view=viewport();return !!point&&point.x>=-margin&&point.x<=view.width+margin&&point.y>=-margin&&point.y<=view.height+margin;}
 function geometryBounds(g){
  if(!g||!['circle','donut','safe','cross','line','capsule','cone','arc'].includes(g.shape))return null;
  const {width,height}=viewport();
  if(![g.x,g.y,g.radius].every(Number.isFinite)||g.radius<0||g.radius>2048)return null;
  if(g.shape==='donut'&&(!Number.isFinite(g.innerRadius)||g.innerRadius<0||g.innerRadius>g.radius))return null;
  if(g.shape==='safe')return{left:0,top:0,width,height};
  if(['line','capsule','cone','arc'].includes(g.shape)&&![g.angle,g.width].every(Number.isFinite))return null;
  if(g.shape==='cross'&&!Number.isFinite(g.width))return null;
  const ox=finite(g.originX,g.x),oy=finite(g.originY,g.y),extent=g.radius+Math.abs(finite(g.width));
  if(!Number.isFinite(extent)||extent>4096)return null;
  const points=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,y])=>projected(ox+x*extent,oy+y*extent));
  if(points.some(point=>!point))return null;
  const left=Math.min(...points.map(point=>point.x)),top=Math.min(...points.map(point=>point.y));
  const right=Math.max(...points.map(point=>point.x)),bottom=Math.max(...points.map(point=>point.y));
  return{left,top,width:Math.max(1,right-left),height:Math.max(1,bottom-top)};
 }
 function render(id,options={}){
  sync();const spec=resolve(id);if(!spec||!enabled())return false;
  if(options.scene&&options.scene!==nativeRoom())return false;
  const entity=options.entity;if(entity&&!options.allowDead&&(entity.hp<=0||entity.deadRecorded||entity.removed))return false;
  const x=finite(options.x,entity?.x),y=finite(options.y,entity?.y),point=projected(x,y);if(!point)return false;
  const t=now();if(t!==directTime){directTime=t;directKeys.clear();}
  const key=String(options.sourceId||options.sourceKey||options.key||options.handle||entity?.id||x.toFixed(3)+':'+y.toFixed(3))+':'+effectKey(spec);
  if(!directKeys.has(key)&&directKeys.size>=(low()?12:24)){metrics.dropped++;return false;}
  const main=timeline(spec,options.clip||(spec.clips?.emerge?'emerge':spec.clips?.main?'main':Object.keys(spec.clips||{})[0]));
  let age=finite(options.age,0);
  if(Number.isFinite(options.warningProgress)&&main)age=clamp(options.warningProgress,0,1)*Math.max(0,main.duration-1e-6);
  const frame=options.frozenFrame||sample(effectKey(spec),age,options);if(!frame)return false;
  if(frame.parts&&!options.part){let painted=false;for(const part of frame.parts)painted=render(id,{...options,part:part.side})||painted;return painted;}
  const part=frame.parts?.find(p=>p.side===options.part);if(part){frame.path=spec.atlases[part.atlas].path;}
  const row=pool.get(frame.path);if(row?.state!=='ready'){ensure(id);return false;}
  const target=options.ctx||(typeof ctx==='undefined'?null:ctx);if(!target)return false;
  const alpha=frame.alpha*clamp(finite(options.alpha,1),0,1);if(alpha<=0)return false;
  const bounds=options.geometry?geometryBounds(options.geometry):null;
  if(options.geometry&&(!bounds||typeof traceFootprint154!=='function'||typeof ctx!=='undefined'&&target!==ctx))return false;
  const view=viewport(),base=typeof actorHeight==='function'?actorHeight():64;
  const height=clamp(finite(options.height,base*1.8)*clamp(finite(options.scale,1),.05,8),1,Math.min(view.width,view.height)*.36);
  const width=height*frame.rect[2]/frame.rect[3];
  if(bounds?(bounds.left+bounds.width<0||bounds.top+bounds.height<0||bounds.left>view.width||bounds.top>view.height):!visible(x,y,Math.max(width,height))){metrics.offscreenDrops++;return false;}
  const draw=()=>{target.save();try{
   target.globalCompositeOperation=frame.blend;target.globalAlpha*=alpha;target.imageSmoothingEnabled=true;
   if(bounds){
    // The caller's unchanged native footprint supplies the path and fill rule.
    // No image radius or warning duration is ever used as collision geometry.
    traceFootprint154(options.geometry);target.clip(['donut','safe'].includes(options.geometry.shape)?'evenodd':'nonzero');
    target.drawImage(row.image,...frame.rect,bounds.left,bounds.top,bounds.width,bounds.height);
   }else{
    target.translate(point.x+finite(options.offsetX),point.y+finite(options.offsetY)+(options.anchor==='body'?-base*.4:0));target.rotate(finite(options.angle));
    if(part){const k=height/512;target.drawImage(row.image,...part.rect,(part.offset[0]-256)*k,(part.offset[1]-440)*k,part.rect[2]*k,part.rect[3]*k);}
    else target.drawImage(row.image,...frame.rect,-width*frame.pivot[0],-height*frame.pivot[1],width,height);
   }
  }finally{target.restore();}};
  const paintLayer=options.layer||frame.layer;
  const owner={id:'final42-r88:'+key,kind:options.geometry?'hazard':'effect',x,y,groundAligned:!!options.geometry||paintLayer==='ground',
   r88Final42:true,r88EffectID:frame.id,r88EffectSource:spec.effectId||spec.id,r88SourceIndex:spec.sourceIndex,r88Frame:frame.index,
   r88Clip:frame.clip,r88Layer:paintLayer,r88Pivot:frame.pivot.slice(),nativeOwner:entity?.id||options.owner||null,r88AtlasPath:frame.path};
  if(target.scope)target.scope(owner,draw);else draw();
  directKeys.add(key);row.used=row.lastDraw=t;metrics.draws++;return true;
 }
 function remove(handle,options={}){
  const slot=slots.get(typeof handle==='object'?handle?.handle:handle);if(!slot)return false;
  if(options.release&&slot.spec.clips?.release&&slot.clip!=='release'){
   const entity=slot.entity;if(entity){slot.x=entity.x;slot.y=entity.y;}
   if(slot.key&&keys.get(slot.key)===slot.handle)keys.delete(slot.key);slot.key=null;
   slot.entity=null;slot.clip='release';slot.start=now();slot.layer='overlay';slot.valid=null;slot.release=true;return true;
  }
  slots.delete(slot.handle);if(slot.key&&keys.get(slot.key)===slot.handle)keys.delete(slot.key);return true;
 }
 function admit(id,options,attached){
  sync();const spec=resolve(id);if(!spec||!enabled())return null;
  if(options.scene&&options.scene!==nativeRoom())return null;
  const entity=options.entity,x=finite(options.x,entity?.x),y=finite(options.y,entity?.y);
  if(!projected(x,y)||entity&&!options.allowDead&&(entity.hp<=0||entity.deadRecorded||entity.removed))return null;
  const admissionKey=options.key||options.sourceKey;
  if(admissionKey&&keys.has(String(admissionKey)))return keys.get(String(admissionKey));
  if(slots.size>=(low()?8:MAX_INSTANCES)||!visible(x,y,200)){metrics.dropped++;return null;}
  if(!isReady(id)){ensure(id);return null;}
  const handle='final42-r88-slot-'+(++serial),slot={...options,spec,handle,key:admissionKey?String(admissionKey):null,entity,x,y,
   start:now()-Math.max(0,finite(options.age)),clip:options.clip||null,layer:options.layer||spec.layer||'overlay',offscreenSince:null,attached,scene:nativeRoom()};
  slots.set(handle,slot);if(slot.key)keys.set(slot.key,handle);metrics[attached?'attached':'played']++;
  metrics.highWaterInstances=Math.max(metrics.highWaterInstances,slots.size);return handle;
 }
 const play=(id,options={})=>admit(id,options,false),attach=(id,options={})=>admit(id,options,true);
 function tick(dt,options={}){
  if(Number.isFinite(options.now))fallbackTime=options.now;else if(Number.isFinite(dt)&&dt>0)fallbackTime+=dt;
  sync();const at=now();
  for(const slot of [...slots.values()]){
   if(!enabled()||slot.scene!==nativeRoom()||slot.entity&&!slot.allowDead&&(slot.entity.hp<=0||slot.entity.deadRecorded||slot.entity.removed)){remove(slot.handle);continue;}
   if(Number.isFinite(slot.until)&&at>=slot.until&&!slot.release){remove(slot.handle,{release:slot.releaseOnRemove!==false});continue;}
   if(typeof slot.valid==='function'){let valid;try{valid=slot.valid();}catch(_){valid=false;metrics.invalidCallbacks++;}if(!valid){remove(slot.handle,{release:slot.releaseOnRemove!==false});continue;}}
   if(!sample(effectKey(slot.spec),at-slot.start,{clip:slot.clip,signal:slot.signal})){remove(slot.handle);metrics.completed++;continue;}
   const x=slot.entity?.x??slot.x,y=slot.entity?.y??slot.y;
   if(!visible(x,y,200)){slot.offscreenSince??=at;if(at-slot.offscreenSince>=OFFSCREEN){remove(slot.handle);metrics.offscreenDrops++;}}else slot.offscreenSince=null;
  }
  const busy=activePaths();for(const row of [...pool.values()])if(row.state==='ready'&&!busy.has(row.path)&&at-row.used>=IDLE)releaseRow(row);
 }
 function draw(options={}){
  sync();let count=0;for(const slot of slots.values()){
   if(options.layer&&options.layer!==slot.layer)continue;
   if(Object.prototype.hasOwnProperty.call(options,'entity')&&options.entity!==slot.entity)continue;
   const age=now()-slot.start;
   if(render(effectKey(slot.spec),{...slot,age,x:slot.entity?.x??slot.x,y:slot.entity?.y??slot.y,key:slot.handle,layer:slot.layer}))count++;
  }return count;
 }
 function update(handle,patch={}){const slot=slots.get(handle);if(!slot)return false;for(const key of ['x','y','angle','alpha','scale','height','valid','signal','until','entity'])if(Object.prototype.hasOwnProperty.call(patch,key))slot[key]=patch[key];return true;}
 const C=window.StoryPhase1?.CommandScene?.prototype,baseTexture=C?.texture;
 if(baseTexture)C.texture=function(image,...args){const texture=baseTexture.call(this,image,...args);if(String(image?.src||'').includes('/final42-r88/')){texture.generateMipmaps=false;texture.minFilter=texture.magFilter=this.T.LinearFilter;texture.wrapS=texture.wrapT=this.T.ClampToEdgeWrapping;texture.premultiplyAlpha=false;}return texture;};
 const basePolicy=C?.applySpatialPolicy;
 if(basePolicy)C.applySpatialPolicy=function(row,command,...args){
  basePolicy.call(this,row,command,...args);if(!this.spatial||!command.owner?.r88Final42)return;
  const layer=command.owner.r88Layer,mesh=row.mesh;
  if(layer==='beforeActor'){
   // One supplied rear overlay, behind the native transparent actor pass. It
   // still respects physical world depth; this does not invent a front split.
   mesh.layers.set(2);mesh.renderOrder=-1;mesh.material.depthTest=true;mesh.material.depthWrite=false;mesh.material.polygonOffset=false;
  }else if(layer==='afterActor'||layer==='overlay'){
   // World depth still occludes the single foreground overlay. A one-unit
   // depth bias makes the actor's coplanar painted image deterministic without
   // disabling walls or constructing an invented front/back sprite split.
   mesh.layers.set(3);mesh.renderOrder=command.order;mesh.material.depthTest=true;mesh.material.depthWrite=false;
   mesh.material.polygonOffset=true;mesh.material.polygonOffsetFactor=0;mesh.material.polygonOffsetUnits=-1;
  }
 };
 window.__STORYWORLD_FINAL42_R88__=Object.freeze({register,sample,ensure,isReady,play,attach,render,draw,tick,remove,update,clear,
  inspect:()=>({schema:'storyworld.final42-runtime/v1',effectCount:Object.keys(DATA.effects).length,clock:now(),generation,
   budgetBytes:LIMIT,residentBytes:bytes(),maxAtlases:MAX_ATLASES,maxInstances:MAX_INSTANCES,maxDirectInstances:24,
   resident:[...pool.values()].map(row=>({path:row.path,state:row.state,bytes:row.bytes,used:row.used,lastDraw:row.lastDraw})),
   active:[...slots.values()].map(slot=>({handle:slot.handle,id:effectKey(slot.spec),sourceIndex:slot.spec.sourceIndex,key:slot.key,entityId:slot.entity?.id||null,x:slot.entity?.x??slot.x,y:slot.entity?.y??slot.y,age:now()-slot.start,clip:slot.clip,layer:slot.layer})),
   metrics:{...metrics},noIndependentAnimationLoop:true,procedural80Loaded:!!window.StoryVFX||!!window.__STORYWORLD_DYNAMIC_VFX_R84__,
   browserVerified:false,GPUVerified:false,naturalPlayVerified:false})});
})();
