/* R88 FINAL42 presentation adapters. All attacks, status admission, collision,
 * progression and save authorities remain the native game controllers. */
(()=>{'use strict';
 if(window.__STORYWORLD_FINAL42_HOOKS_R88__||!window.__STORYWORLD_FINAL42_R88__)return;
 const api=window.__STORYWORLD_FINAL42_R88__,data=window.__STORYWORLD_FINAL42_DATA_R88__;
 const CONTACT={dark:90,corruption:91,harvest:92,pollution:93,fire:94,burn:94,frost:95,chill:95,shock:96,charm:97,weakness:98,bind:99,disease:100,bleed:101,curse:90,poison:93};
 const AURA={shock:243,frost:244,chill:244,bleed:247,charm:248,disease:249,weakness:250};
 const STORIES={81:{part:'pre'},110:{part:'post'},112:{part:'pre'},113:{part:'pre'},114:{part:'post'},115:{part:'pre'},116:{part:'pre'},117:{part:'post'},130:{part:'post'},131:{part:'post'},132:{part:'any'}};
 const events=[],metrics={story:0,contacts:0,auras:0,medical:0,projectiles:0,warnings:0,swampImpacts:0,deaths:0,portals:0,dances:0,nativeImagesSuppressed:0};
 let generation=0,sceneRoom=null,scenePlayer=null,seenEffects=new WeakMap(),seenHazards=new WeakSet(),seenScenes=new Set(),warningPainted=new WeakSet(),actorScope=null,hazardScope=null;
 const statusHandles=new Map(),medicalHandles=new Set();
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 const scoped=()=>started&&player?.hp>0&&room&&layer==='STORY'&&solo()&&!(typeof mobile==='function'&&mobile())&&!window.matchMedia?.('(pointer:coarse)').matches;
 const note=(kind,id,extra={})=>{events.push({kind,id:Number(id),zone,at:time,...extra});if(events.length>160)events.shift();};
 const spec=id=>data.effects[data.bySourceIndex[String(id)]];
 const owner=s=>window.__STORYWORLD_ENEMY_PRESENTATION_R86__?.owner(s)||room?.enemies?.find(e=>e.id===(s?.owner||s?.ownerId||s?.cast150?.actor));
 const swamp=e=>zone==='dist02'&&e?.nativeId==='mb-dist02';
 function prime(ids){return Promise.all([...new Set(ids)].map(id=>api.ensure(id)));}
 function regionAssets(){const ids=[251,101];if(zone==='dist00')ids.push(99);if(['ep1a08','ep1a09'].includes(zone))ids.push(213,214,215);if(zone==='dist02')ids.push(111,259,260,261,262);for(const id of Object.keys(STORIES))if(spec(id)?.canonicalMapping?.some(m=>m.zone===zone))ids.push(Number(id));return ids;}
 function reset(reason='scene'){
  generation++;
  for(const handle of medicalHandles)cancel(handle);medicalHandles.clear();for(const row of statusHandles.values())cancel(row.handle);statusHandles.clear();
  api.clear(reason);sceneRoom=room;scenePlayer=player;seenEffects=new WeakMap();seenHazards=new WeakSet();seenScenes=new Set();warningPainted=new WeakSet();note('clear',0,{reason});
 }
 function sync(){if(sceneRoom!==room||scenePlayer!==player){reset('identity');if(scoped())void prime(regionAssets());}}
 function cancel(handle,release=false){if(!handle)return;handle.cancelled=true;api.remove(handle,{release});}
 function admit(id,opt,attached=false){
  const token={id,handle:null,cancelled:false,room,player,generation,at:time,opt},create=()=>{if(token.cancelled||token.generation!==generation||token.room!==room||token.player!==player||!scoped()||Number.isFinite(opt.until)&&time>=opt.until||Number.isFinite(opt.admissionUntil)&&time>=opt.admissionUntil)return;const age=(opt.age||0)+Math.max(0,time-token.at);if(!api.sample(id,age,{holdLast:opt.holdLast}))return;token.handle=(attached?api.attach:api.play)(id,{height:actorHeight(),...opt,age});};
  token.create=create;if(api.isReady(id))create();else void api.ensure(id).then(ok=>{if(ok)create();});return token;
 }
 function one(id,x,y,opt={}){sync();if(!scoped()||![x,y].every(Number.isFinite))return null;const h=admit(id,{x,y,layer:'overlay',...opt});note(opt.event||opt.anchor||'native-event',id,{owner:opt.owner||null,sceneKey:opt.sceneKey||null});return h;}
 function nativeStatusRows(){
  const rows=[...(window.__STORYWORLD_FIELDS_R61__?.statusRows()||[]),...(window.__STORYWORLD_REGIONAL_COMBAT_R58__?.statusRows()||[])];
  for(const row of window.__STORYWORLD_HOSPITAL_WOUNDS_R53__?.statusRows()||[]){const key=({'출혈':'bleed','감전':'shock','냉상':'chill','허약':'weakness','질병':'disease','속박':'bind','매혹':'charm'})[row.label];if(key&&row.remaining>0)rows.push({key,until:time+row.remaining});}
  for(const row of window.__STORYWORLD_HEALTH_R71__?.statusRows(player)||[])if(row.remaining>0&&row.label==='출혈')rows.push({key:'bleed',until:time+row.remaining});
  return rows.filter(row=>row.until>time);
 }
 function statusSync(){
  if(!scoped())return;
  const root=window.__STORYWORLD_PAINTED_VFX_R87__?.inspect().binding,rows=nativeStatusRows(),active=new Map();
  for(const row of rows){const id=AURA[row.key]||(row.key==='bind'&&!root?99:0);if(id&&!active.has(id))active.set(id,row);}
  for(const [id,row]of statusHandles)if(!active.has(id)){cancel(row.handle,id===99);statusHandles.delete(id);}
  for(const[id,row]of active)if(!statusHandles.has(id)){const handle=admit(id,{entity:player,layer:id===99?'afterActor':'beforeActor',scale:id===99?2:1.12,anchor:id===99?'feet':'body',sourceKey:'native-status:'+id,until:row.until},true);statusHandles.set(id,{handle,key:row.key});metrics.auras++;note('native-status-active',id,{key:row.key});}
  for(const[id,row]of active){const token=statusHandles.get(id)?.handle;if(!token)continue;token.opt.until=row.until;if(token.handle&&!api.update(token.handle,{until:row.until}))token.handle=null;if(!token.handle&&api.isReady(id))token.create();}
 }
 function hideNativeStatusImages(fn){
  const images=new Set();for(const[id,row]of statusHandles)if(row.handle?.handle&&api.isReady(id)){
   const p=window.__STORYWORLD_FIELDS_R61__?.pathFor(row.key),image=p&&readyImage(p)?.image;if(image)images.add(image);
   const d=window.__STORYWORLD_REGIONAL_COMBAT_R58__?.defs?.[row.key],a=d&&typeof STORY_PXF_DATA!=='undefined'&&STORY_PXF_DATA.find(a=>a.key===d.art),other=a&&readyImage(a.path)?.image;if(other)images.add(other);
  }
  const draw=ctx.drawImage;ctx.drawImage=function(image,...args){if(images.has(image)){metrics.nativeImagesSuppressed++;return;}return draw.call(this,image,...args);};try{return fn();}finally{ctx.drawImage=draw;}
 }
 const r87={
  spawn(kind,slot,opt){sync();if(!scoped())return null;const id={bind:99,poison:213,scalpel:215}[kind];if(!id)return null;
   const handle=kind==='bind'?admit(id,{entity:player,layer:'afterActor',scale:2,anchor:'feet',until:slot.start+2.2},true):one(id,slot.x,slot.y,{angle:opt.angle||0,scale:kind==='poison'?1.9:1.4,anchor:kind==='scalpel'?'body':'feet',event:'R87 confirmed medical '+kind,owner:opt.owner});if(handle)medicalHandles.add(handle);metrics.medical++;note('r87-native-bridge',id,{medicalKind:kind});return handle;
  },
  release(slot){if(slot.final42Handle){cancel(slot.final42Handle,true);medicalHandles.delete(slot.final42Handle);}},
  clear(){for(const handle of medicalHandles)cancel(handle);medicalHandles.clear();},
  ready:()=>prime(regionAssets())
 };
 const groundBase=groundImage;groundImage=function(...args){sync();warningPainted=new WeakSet();const result=groundBase.apply(this,args);api.draw({layer:'ground'});return result;};
 const heroBase=drawHero;drawHero=function(...args){sync();statusSync();if(!scoped())return heroBase.apply(this,args);api.draw({layer:'beforeActor',entity:player});const result=hideNativeStatusImages(()=>heroBase.apply(this,args));api.draw({layer:'afterActor',entity:player});api.draw({layer:'overlay'});return result;};
 const enemyBase=drawEnemy;drawEnemy=function(e,...args){const old=actorScope;actorScope=e;try{return enemyBase.apply(this,[e,...args]);}finally{actorScope=old;}};
 const strokeBase=strokeFootprint154;strokeFootprint154=function(g,stage,color){const result=strokeBase.apply(this,arguments);if(scoped()&&g&&stage==='warning'){
   const row=hazardScope?.row150,m=hazardScope?.medical20,a=actorScope?.attack,progress=row?(time-row.warningAt)/Math.max(.001,row.releaseAt-row.warningAt):m?(time-m.start)/Math.max(.001,m.releaseAt-m.start):hazardScope?hazardScope.age/Math.max(.001,hazardScope.warning):a?a.elapsed/Math.max(.001,a.castWindup150??a.shape154?.windup??1):0;
   if(api.render(251,{x:g.x??g.originX,y:g.y??g.originY,geometry:g,warningProgress:clamp(progress,0,.999999),age:0,alpha:.36,layer:'ground',anchor:'exact native footprint and warning clock'})){warningPainted.add(g);metrics.warnings++;}
  }return result;};
 const nativeGroundBase=drawNativeGroundArt154;drawNativeGroundArt154=function(path,rect,g,alpha,stage,id){if(scoped()&&stage==='warning'&&g&&warningPainted.has(g)&&api.isReady(251))return true;return nativeGroundBase.apply(this,arguments);};
 const hazardBase=drawHazard;drawHazard=function(h,...args){const prior=hazardScope,actor=actorScope;hazardScope=h;actorScope=owner(h);try{
   const result=hazardBase.apply(this,[h,...args]);if(!scoped()||!swamp(actorScope)||h?.medical20)return result;
   const r=h.row150,warning=r?time<r.releaseAt:h.age<h.warning;if(warning)api.render(260,{x:actorScope.x,y:actorScope.y,age:r?Math.max(0,time-r.warningAt):h.age,warningProgress:r?clamp((time-r.warningAt)/Math.max(.001,r.releaseAt-r.warningAt),0,.999999):clamp(h.age/Math.max(.001,h.warning),0,.999999),height:actorHeight(),scale:.75,anchor:'body',layer:'afterActor',event:'existing horn-caster windup; no new charge movement'});
   return result;
  }finally{hazardScope=prior;actorScope=actor;}};
 const shotBase=drawProjectile;drawProjectile=function(p,...args){
  if(scoped()&&p&&!p.dead&&p.friendly===false){let id=0;if(p.medical20?.kind==='tool'&&p.medical20.frame==='syringe'&&p.medical20.room===room&&p.medical20.epoch===window.__STORYWORLD_MEDICAL20__?.inspect().epoch)id=214;else if(!p.medical20&&swamp(owner(p)))id=262;
   if(id){const from=project(p.x,p.y),to=project(p.x+p.vx,p.y+p.vy),age=Math.min(Math.max(0,p.age),.799999);if(api.render(id,{x:p.x,y:p.y,age,holdLast:true,height:actorHeight(),angle:Math.atan2(to.y-from.y,to.x-from.x)-(id===214?-Math.PI/4:0),scale:id===214?.76:.72,layer:'afterActor',anchor:'native projectile position, heading and lifetime'})){metrics.projectiles++;return;}}
  }return shotBase.apply(this,[p,...args]);};
 function effectID(e){if(e?.type==='contactR61')return CONTACT[e.r61Key];if(e?.type==='regionalContactR58')return CONTACT[e.r58Tag];if(e?.type==='bloodR52'&&e.r52Blood)return 101;if(e?.type==='goldenThreadR72'&&e.goldenR72)return 245;if(e?.type==='threadSlashR63'&&e.threadR63)return 246;return 0;}
 function scalpelReplacement(e){if(!(e.playerHitR43?.hpLoss>0))return false;const active=new Set(api.inspect().active.filter(r=>r.sourceIndex===215).map(r=>r.handle)),birth=time-(e.age||0),source=e.sourceId||e.playerHitR43.owner?.id;return[...medicalHandles].some(token=>token.id===215&&token.handle&&active.has(token.handle)&&Math.abs(token.at-birth)<.06&&(!source||token.opt.owner===source));}
 const effectBase=drawEffect;drawEffect=function(e,...args){
  if(scoped()&&e){if(e.final42DeathReplaced?.handle&&api.isReady(217))return;if(e.type==='playerHitR43'&&e.playerHitR43?.kind==='tool'&&e.playerHitR43.frame==='scalpel'&&scalpelReplacement(e)&&api.isReady(215))return;
   const id=effectID(e);if(id&&(!e.r61Room||e.r61Room===room)&&(!e.r58Room||e.r58Room===room)&&(!e.r52Room||e.r52Room===room)){
    if(id===99){statusSync();if(api.isReady(99)&&api.inspect().active.some(row=>row.sourceIndex===99))return;return effectBase.apply(this,[e,...args]);}
    const old=seenEffects.get(e),stamp=(e.goldenR72?.cast??'')+':'+(e.goldenR72?.slot??'')+':'+(e.threadR63?.seed??'')+':'+(e.threadR63?.hitIndex??'')+':'+Math.round((time-e.age)*1e5);
    if(!old||old.stamp!==stamp){const line=e.goldenR72||e.threadR63,a=line?.a||line?.from,b=line?.b||line?.to,x=a&&b?(a.x+b.x)/2:e.x,y=a&&b?(a.y+b.y)/2:e.y,p=a&&b?project(a.x,a.y):null,q=a&&b?project(b.x,b.y):null;
     const handle=one(id,x,y,{angle:p?Math.atan2(q.y-p.y,q.x-p.x):e.angle||0,scale:id===99?2:id===245||id===246?1.2:.85,anchor:id>=90&&id<=101?'body':'feet',event:'native '+e.type,admissionUntil:time-e.age+e.life});seenEffects.set(e,{stamp,handle});if(id===245||id===246)metrics.dances++;else metrics.contacts++;
    }if(seenEffects.get(e)?.handle?.handle&&api.isReady(id))return;
   }
  }return effectBase.apply(this,[e,...args]);};
 const tickHazardsBase=tickHazards;tickHazards=function(...args){const previous=hazards.slice(),result=tickHazardsBase.apply(this,args);if(scoped()&&zone==='dist02')for(const h of previous){if(seenHazards.has(h)||!swamp(owner(h)))continue;const r=h.row150,impact=r?r.impactAt:(h.warning||0)+(time-h.age);if((r&&['cancelled','ended'].includes(r.lifecycle154))||time<impact||time-impact>.25)continue;seenHazards.add(h);const x=r?.targetX??h.x,y=r?.targetY??h.y;one(261,x,y,{scale:1.15,anchor:'actual native swamp hazard impact'});one(111,x,y,{scale:.85,anchor:'actual native swamp grasp arrival'});one(259,x,y,{scale:1,layer:'ground',anchor:'actual native swamp impact ground remnant'});metrics.swampImpacts++;}return result;};
 function storyAdmission(){sync();const s=storyScene;if(!scoped()||!s||s.id!==zone||!s.text?.trim()||seenScenes.has(s.key))return;seenScenes.add(s.key);for(const[id,policy]of Object.entries(STORIES))if(spec(id)?.canonicalMapping?.some(m=>m.zone===zone)){
   const post=['post','prologue.post','firstPost'].includes(s.part),pre=['pre','body','prologue.pre','awakenPre'].includes(s.part);if(policy.part!=='any'&&!(policy.part==='post'?post:pre))continue;
   one(Number(id),room.objective?.x??player.x,room.objective?.y??player.y,{scale:id==='114'?1.6:1.2,anchor:'actual canonical narrative scene admission',sceneKey:s.key});metrics.story++;
  }}
 const advanceBase=advanceScene;advanceScene=function(...args){const result=advanceBase.apply(this,args);storyAdmission();return result;};
 const killBase=killEnemy;killEnemy=function(e,...args){const first=scoped()&&e&&e.hp<=0&&!e.deadRecorded,old=new Set(effects),x=e?.x,y=e?.y,result=killBase.apply(this,[e,...args]);if(first&&e.deadRecorded){const handle=one(217,x,y,{scale:e.boss||e.midboss?1.4:.8,anchor:'actual native enemy death'});for(const v of effects)if(!old.has(v)&&v.type==='burst'&&v.x===x&&v.y===y&&(v.asset===VFX.burst||v.asset===VFX.crown))v.final42DeathReplaced=handle;metrics.deaths++;}return result;};
 const priorEffect=drawEffect;drawEffect=function(e,...args){if(scoped()&&e?.final42DeathReplaced?.handle&&api.isReady(217))return;return priorEffect.apply(this,[e,...args]);};
 const travelBase=travel;travel=async function(...args){const before=room,result=await travelBase.apply(this,args);if(room!==before&&scoped()){one(254,player.x,player.y,{scale:1.1,anchor:'successful native portal transition'});metrics.portals++;}return result;};
 const tickBase=tick;tick=function(dt,...args){sync();const before=time,result=tickBase.call(this,dt,...args);sync();api.tick(Math.max(0,time-before),{now:time,scene:room});const activeHandles=new Set(api.inspect().active.map(row=>row.handle));for(const token of medicalHandles)if(token.cancelled||token.handle&&!activeHandles.has(token.handle)||!token.handle&&!api.sample(token.id,Math.max(0,time-token.at))){cancel(token);medicalHandles.delete(token);}statusSync();storyAdmission();return result;};
 for(const name of ['enterRegion','restoreSave','newGame']){const base=name==='enterRegion'?enterRegion:name==='restoreSave'?restoreSave:newGame,wrapped=async function(...args){reset(name);const result=await base.apply(this,args);sync();if(scoped())await prime(regionAssets());return result;};if(name==='enterRegion')enterRegion=wrapped;else if(name==='restoreSave')restoreSave=wrapped;else newGame=wrapped;}
 const deathBase=showDeath;showDeath=function(...args){reset('player-death');return deathBase.apply(this,args);};
 window.__STORYWORLD_FINAL42_HOOKS_R88__=Object.freeze({r87,ready:()=>{sync();return prime(regionAssets());},inspect:()=>({revision:'R88-FINAL42-native-events',metrics:{...metrics},events:[...events],scope:'PC single-player STORY; native combat and progression unchanged',nativeDamageChanged:false,nativeWarningGeometryChanged:false,newChargeMovement:false,newPillarObjectiveController:false,oldR87AtlasesReplaced:[99,213,215],statusKeys:{...CONTACT},auraKeys:{...AURA},storyPolicies:{...STORIES},browserVerified:false,GPUVerified:false})});
})();
