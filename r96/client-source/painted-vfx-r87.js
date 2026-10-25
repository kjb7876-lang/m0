/* R87: three supplied painted frame atlases. The deferred procedural80
 * package remains unloaded. Native medical collisions still own damage. */
(()=>{'use strict';
 const DATA=window.__STORYWORLD_PAINTED_VFX_DATA_R87__;
 if(!DATA||window.__STORYWORLD_PAINTED_VFX_R87__)return;
 const bridge=()=>window.__STORYWORLD_FINAL42_HOOKS_R88__?.r87;
 const ROOT='dist00-boss',MAX=8,slots=[],pool=new Map(),seenPoison=new WeakSet();
 const metrics={loads:0,releases:0,lateLoads:0,draws:0,poison:0,scalpel:0,bind:0,binds:0,dotAttempts:0,dotBudget:0,drops:0};
 let identity=null,victim=null,generation=0,serial=0,binding=null,escaping=false;
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 const pc=()=>!(typeof mobile==='function'&&mobile())&&!window.matchMedia?.('(pointer:coarse)').matches;
 const admitted=()=>pc()&&started&&player?.hp>0&&solo()&&layer==='STORY'?(zone==='dist00'?['bind']:['ep1a08','ep1a09'].includes(zone)?['poison','scalpel']:[]):[];
 const wanted=()=>bridge()?[]:admitted();
 const alive=e=>!!e&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active';
 function discard(){bridge()?.clear?.();generation++;for(const r of pool.values()){clearTimeout(r.timer);r.image.onload=r.image.onerror=null;r.image.src='';r.resolve?.(null);metrics.releases++;}pool.clear();slots.length=0;binding=null;identity=room;victim=player;}
 function sync(){if(identity!==room||victim!==player||pool.size&&!wanted().some(kind=>pool.has(kind)))discard();for(const kind of wanted())if(!pool.has(kind)){
  const g=generation,spec=DATA[kind],image=new Image(),r={kind,image,state:'loading',resolve:null,promise:null,timer:null};
  r.promise=new Promise(resolve=>r.resolve=resolve);pool.set(kind,r);image.decoding='async';
  const finish=ok=>{if(r.state!=='loading')return;clearTimeout(r.timer);image.onload=image.onerror=null;if(g!==generation||pool.get(kind)!==r){metrics.lateLoads++;r.state='cancelled';r.resolve(null);return;}r.state=ok&&image.naturalWidth>0?'ready':'failed';r.resolve(r.state==='ready'?r:null);};
  image.onload=()=>Promise.resolve(image.decode?.()).then(()=>finish(true),()=>finish(false));image.onerror=()=>finish(false);r.timer=setTimeout(()=>finish(false),15000);image.src=urlFor(spec.path);metrics.loads++;
 }}
 function spawn(kind,x,y,opt={}){sync();if(!admitted().includes(kind)||slots.length>=(settings.lowFx?4:MAX)||![x,y].every(Number.isFinite)){metrics.drops++;return null;}
  const slot={id:'painted-r87:'+kind+':'+(++serial),kind,x,y,start:time,angle:opt.angle||0,scale:opt.scale||1,owner:opt.owner||null,room,player};slots.push(slot);slot.final42Handle=bridge()?.spawn(kind,slot,opt);metrics[kind]++;return slot;
 }
 function frameFor(kind,age,releaseAge=null){const spec=DATA[kind];if(!spec||!Number.isFinite(age)||age<0)return null;
  let at=age,indices=spec.frames.map((_,i)=>i),alpha=1;
  if(kind==='bind'){
   if(releaseAge!==null){if(!Number.isFinite(releaseAge)||releaseAge<0||releaseAge>=.64)return null;at=releaseAge;indices=[16,17,18,19,20,21,22,23];if(at>=.56)alpha=Math.max(0,(.64-at)/.08);}
   else if(age>=.96){at=(age-.96)%.48;indices=[12,13,14,15];}
   else{indices=[0,1,2,3,4,5,6,7,8,9,10,11];alpha=Math.min(1,age/.08);}
  }else if(age>=spec.duration)return null;
  for(const i of indices){const f=spec.frames[i];if(at<f.seconds)return{index:i,rect:f.rect,alpha};at-=f.seconds;}
  return null;
 }
 function release(reason){if(!binding)return;const b=binding;binding=null;b.slot.releaseAt=time;bridge()?.release?.(b.slot);b.slot.releaseReason=reason;b.slot.x=player?.x??b.slot.x;b.slot.y=player?.y??b.slot.y;}
 function valid(){return pc()&&solo()&&layer==='STORY'&&zone==='dist00'&&binding&&binding.room===room&&binding.player===player&&alive(binding.owner)&&player.hp>0&&time<binding.until;}
 function bind(owner){sync();if(!bridge()&&pool.get('bind')?.state!=='ready')return;
  if(!alive(owner)||!owner.boss||owner.r61Clone||owner.r61Summoned||owner.trial||owner.cosmic||owner.nativeId!==ROOT||room?.id!=='dist00'||layer!=='STORY'||!solo()||valid())return;
  const slot=spawn('bind',player.x,player.y,{owner:owner.id});if(!slot)return;
  slot.boundUntil=time+2.2;binding={owner,slot,room,player,start:time,until:time+2.2,next:time+.5,pulses:0,remaining:owner.damage*.6};metrics.binds++;
 }
 const hurtBase=hurt;hurt=function(value,source){const before=player?.hp,result=hurtBase.apply(this,arguments);
  if(result!=='hit'||!player||player.hp<=0||!(player.hp<before)||source?.r87ThornDot)return result;
  const med=source?.medical20,e=source?.nativeId&&room?.enemies.includes(source)?source:room?.enemies.find(e=>e.id===(source?.owner||source?.ownerId))||med?.owner;
  if(e?.nativeId===ROOT)bind(e);
  if(['ep1a08','ep1a09'].includes(zone)&&med?.kind==='tool'&&med.frame==='scalpel'){
   const vx=Number(source.vx)||1,vy=Number(source.vy)||0;spawn('scalpel',player.x,player.y-.15,{angle:Math.atan2((vx+vy)*.5,vx-vy),owner:e?.id});
  }return result;
 };
 const hazardBase=tickHazards;tickHazards=function(...args){sync();const previous=hazards.slice(),result=hazardBase.apply(this,args);
  if(['ep1a08','ep1a09'].includes(zone))for(const h of previous){const m=h.medical20;if(m?.kind==='poison'&&m.released&&!m.cancelled&&!seenPoison.has(h)&&m.room===room&&alive(m.owner)&&time>=m.impactAt&&time<m.impactAt+.25){seenPoison.add(h);spawn('poison',m.target.x,m.target.y,{owner:m.owner.id});}}
  return result;
 };
 const tickBase=tick;tick=function(dt){sync();const before=time,result=tickBase.apply(this,arguments);if(binding&&!valid())release('lifecycle');if(!(time>before)||modal||loading||document.hidden)return result;
  if(binding){if(!valid())release('expired-or-owner');else{binding.slot.x=player.x;binding.slot.y=player.y;while(binding&&binding.pulses<4&&time+1e-8>=binding.next){const b=binding,amount=b.remaining/(4-b.pulses);b.remaining-=amount;b.pulses++;b.next+=.5;metrics.dotAttempts++;metrics.dotBudget+=amount;hurt(amount,{owner:b.owner.id,kind:'thorn-bind-dot',r87ThornDot:true});}}}
  for(let i=slots.length-1;i>=0;i--){const s=slots[i];if(s.room!==room||s.player!==player||player.hp<=0||(s.kind==='bind'?s.releaseAt!==undefined&&time-s.releaseAt>=.64:time-s.start>=DATA[s.kind].duration))slots.splice(i,1);}
  return result;
 };
 const deathBase=showDeath;showDeath=function(...args){discard();return deathBase.apply(this,args);};
 const moveBase=moveActor;moveActor=function(e,dx,dy,...args){if(e===player&&valid()&&!escaping)return false;return moveBase.call(this,e,dx,dy,...args);};
 const blinkBase=blink;blink=function(...args){const x=player?.x,y=player?.y;escaping=true;let result;try{result=blinkBase.apply(this,args);}finally{escaping=false;}if(player&&(player.x!==x||player.y!==y))release('blink-escape');return result;};
 const statusAPI=window.__STORYWORLD9__,statusBase=statusAPI.statuses;window.__STORYWORLD9__=Object.freeze({...statusAPI,statuses(...args){const rows=statusBase.apply(statusAPI,args);if(valid())rows.push({key:'root-bind-r87',icon:'⌁',label:'가시 속박 · S로 탈출',remaining:binding.until-time,kind:'debuff'});return rows;}});
 function paint(s){if(!wanted().includes(s.kind))return;const row=pool.get(s.kind),spec=DATA[s.kind],releaseAt=s.releaseAt??(s.kind==='bind'&&time>=s.boundUntil?s.boundUntil:undefined),f=frameFor(s.kind,time-s.start,releaseAt===undefined?null:time-releaseAt);if(!row||row.state!=='ready'||!f)return;
  const p=project(s.x,s.y),maximum=Math.min(Math.min(W,H)*.22,actorHeight()*(s.kind==='bind'?2:s.kind==='poison'?1.9:1.4)),k=maximum/Math.max(...spec.cell),w=spec.cell[0]*k,h=spec.cell[1]*k;
  const draw=()=>{ctx.save();try{ctx.translate(p.x,p.y-(s.kind==='scalpel'?actorHeight()*.42:0));ctx.rotate(s.angle);ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=f.alpha;ctx.imageSmoothingEnabled=true;ctx.drawImage(row.image,...f.rect,-w*spec.pivot[0],-h*spec.pivot[1],w,h);metrics.draws++;}finally{ctx.restore();}};
  const owner={id:s.id,kind:'effect',x:s.x,y:s.y,groundAligned:false,r87Painted:s.kind,r87Frame:f.index,nativeOwner:s.owner,bodyPath:spec.path};if(ctx.scope)ctx.scope(owner,draw);else draw();
 }
 const heroBase=drawHero;drawHero=function(...args){const result=heroBase.apply(this,args);sync();for(const s of slots)paint(s);return result;};
 const C=window.StoryPhase1?.CommandScene?.prototype,textureBase=C?.texture;
 if(textureBase)C.texture=function(image,...args){const texture=textureBase.call(this,image,...args);if(String(image?.src||'').includes('/painted-vfx-r87/')){texture.generateMipmaps=false;texture.minFilter=texture.magFilter=this.T.LinearFilter;texture.wrapS=texture.wrapT=this.T.ClampToEdgeWrapping;texture.premultiplyAlpha=false;}return texture;};
 for(const name of ['enterRegion','restoreSave','newGame']){const base=name==='enterRegion'?enterRegion:name==='restoreSave'?restoreSave:newGame,wrapper=async function(...args){discard();const result=await base.apply(this,args);sync();await Promise.all([...pool.values()].map(r=>r.promise));return result;};if(name==='enterRegion')enterRegion=wrapper;else if(name==='restoreSave')restoreSave=wrapper;else newGame=wrapper;}
 window.__STORYWORLD_PAINTED_VFX_R87__=Object.freeze({frameFor,ready:()=>{sync();return bridge()?.ready?.()||Promise.all([...pool.values()].map(r=>r.promise));},inspect:()=>({metrics:{...metrics},generation,active:slots.map(s=>({kind:s.kind,id:s.id,x:s.x,y:s.y,start:s.start,releaseAt:s.releaseAt})),binding:binding?{owner:binding.owner.id,start:binding.start,until:binding.until,pulses:binding.pulses,remaining:binding.remaining}:null,final42Replacement:!!bridge(),resident:[...pool.values()].map(r=>({kind:r.kind,state:r.state,bytes:DATA[r.kind].size[0]*DATA[r.kind].size[1]*4})),maxInstances:MAX,newProcedural80Enabled:false,rootBoss:ROOT,rootDuration:2.2,rootDotBudgetFactor:.6,rootEscape:'native S blink',singleThornOverlay:true,seamlessHoldVerified:false,browserVerified:false,GPUVerified:false})});
})();
