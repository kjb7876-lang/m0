/* R89: restrained presentation of the FINAL42 painted effects. Same atlases,
 * same native admission and clocks; only per-draw scale, alpha, colour matrix,
 * layer and source crop change. Damage, range, warnings and durations are native. */
(()=>{'use strict';
 const A=window.StoryPhase1,D=A?.DrawCommands?.prototype,api=window.__STORYWORLD_FINAL42_R88__;
 if(!D||typeof D.scope!=='function'||!api||window.__STORYWORLD_VFX_RETRO_R89__)return;
 const STORE_KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.r89:')+'r89.vfx';
 let enabledFx=(()=>{try{return localStorage.getItem(STORE_KEY)!=='off';}catch(_){return true;}})();
 const stats={silver:0,golden:0,thornRear:0,thornFront:0,poisonGround:0,poisonMist:0,deduped:0,threads:0,portalBridge:0,errors:0};
 const reduced=()=>typeof settings!=='undefined'&&settings.reducedMotion===true;
 const CONTACT=new Set([90,91,92,93,94,95,96,97,98,100,101]),AURA=new Set([243,244,247,248,249,250]);
 // Same effect on the same body is drawn at most twice per draw pass (auras once).
 // Keyed by draw pass, not game time: paused screens redraw at a frozen time.
 let pass=0,frameKey=-1;const seen=new Map();
 const controller=window.__STORYWORLD_PHASE1__?.controller,drawPass=controller?.draw;
 if(drawPass)controller.draw=function(...args){pass++;return drawPass.apply(this,args);};
 function admitDraw(owner){const id=owner.r88SourceIndex;if(!CONTACT.has(id)&&!AURA.has(id))return true;
  if(pass!==frameKey){frameKey=pass;seen.clear();}
  const bucket=id+'|'+(owner.nativeOwner||Math.round(owner.x*2)+':'+Math.round(owner.y*2)),n=(seen.get(bucket)||0)+1;seen.set(bucket,n);
  if(n>(AURA.has(id)?1:2)){stats.deduped++;return false;}return true;}
 function anchor(owner){if(typeof project!=='function'||!Number.isFinite(owner.x+owner.y))return null;const p=project(owner.x,owner.y);return Number.isFinite(p?.x+p?.y)?p:null;}
 // Runs fn with an extra transform/alpha/filter applied around the effect anchor.
 function styled(ctx,owner,fn,{scale=1,scaleY=1,alpha=1,filter=null}={}){const p=anchor(owner);ctx.save();try{
   if(p&&(scale!==1||scaleY!==1)){ctx.translate(p.x,p.y);ctx.scale(scale,scale*scaleY);ctx.translate(-p.x,-p.y);}
   ctx.globalAlpha*=alpha;if(filter)ctx.filter=filter;return fn();}finally{ctx.restore();}}
 function cropped(ctx,fraction,fn){const had=Object.prototype.hasOwnProperty.call(ctx,'drawImage'),prev=ctx.drawImage;
  ctx.drawImage=function(image,sx,sy,sw,sh,dx,dy,dw,dh){if(arguments.length===9){const cut=sh*fraction;return prev.call(this,image,sx,sy+cut,sw,sh-cut,dx,dy+dh*fraction,dw,dh*(1-fraction));}return prev.apply(this,arguments);};
  try{return fn();}finally{if(had)ctx.drawImage=prev;else delete ctx.drawImage;}}
 const scopeBase=D.scope;
 D.scope=function(owner,fn){
  if(!enabledFx||!owner?.r88Final42)return scopeBase.call(this,owner,fn);
  try{
   const id=owner.r88SourceIndex,frame=Number(owner.r88Frame)||0;
   if(!admitDraw(owner))return undefined;
   if(id===246){// Silver thread: a short, desaturated draw flash; the thread itself is the native filament.
    const alpha=(frame<6?.86:frame<10?.5:.26)*(reduced()?.75:1);stats.silver++;
    return scopeBase.call(this,owner,()=>styled(this,owner,fn,{scale:.95,alpha,filter:'saturate(.22) brightness(1.06)'}));}
   if(id===245){// Golden dance: still gold, but no longer a full-strength glow on every strike.
    const alpha=(frame<8?.82:.55)*(reduced()?.8:1);stats.golden++;
    return scopeBase.call(this,owner,()=>styled(this,owner,fn,{scale:.86,alpha,filter:'saturate(.82) brightness(.96)'}));}
   if(id===99){// Approximate volume: full cage behind the body, lower root band in front.
    // This is an engine-side split of the supplied single overlay, not authored layers.
    const rear={...owner,id:owner.id+':r89-rear',r88Layer:'beforeActor'},front={...owner,id:owner.id+':r89-front',r88Layer:'afterActor'};
    scopeBase.call(this,rear,fn);stats.thornRear++;
    const result=scopeBase.call(this,front,()=>cropped(this,.66,()=>styled(this,owner,fn,{alpha:.94})));stats.thornFront++;return result;}
   if(id===213){// Poison: the splash lies on the floor under bodies, the mist stays low and murky.
    if(frame<8){stats.poisonGround++;return scopeBase.call(this,{...owner,r88Layer:'beforeActor'},()=>styled(this,owner,fn,{scaleY:.58,filter:'saturate(.78) brightness(.86)'}));}
    stats.poisonMist++;return scopeBase.call(this,owner,()=>styled(this,owner,fn,{alpha:.72,scaleY:.8,filter:'saturate(.7) brightness(.82)'}));}
  }catch(error){stats.errors++;}
  return scopeBase.call(this,owner,fn);
 };
 // F099's atlas keeps red RGB in 32k nearly transparent texels (alpha 1-23);
 // straight-alpha linear filtering bleeds them into a faint red rim. Discard
 // those texels at draw time only; the source PNG stays byte-identical.
 const CS=A.CommandScene?.prototype,policyBase=CS?.applySpatialPolicy;
 if(policyBase)CS.applySpatialPolicy=function(row,command,...args){const result=policyBase.call(this,row,command,...args);
  const m=row?.mesh?.material;if(m&&command?.owner?.r88SourceIndex===99){const want=enabledFx?.1:0;if(m.alphaTest!==want){m.alphaTest=want;m.needsUpdate=true;stats.thornAlphaTest=(stats.thornAlphaTest||0)+1;}}return result;};
 // The native R63 silver filament (origin -> target) is the thread trail. R88
 // suppresses that native draw once F246 is ready, so its thin core lines are
 // restored here with the native geometry and colours; the wide halo is dropped.
 const threadReady=()=>{try{return api.isReady(246);}catch(_){return false;}};
 function filament(e){const t=e.threadR63;if(!t?.from||!t?.to||typeof project!=='function')return;
  if(typeof outsideSightR63R2==='function'&&outsideSightR63R2(e))return;
  const s=project(t.from.x,t.from.y),q=project(t.to.x,t.to.y),progress=Math.max(0,Math.min(1,e.age/Math.max(.001,e.life))),fade=Math.sin(Math.PI*progress);if(fade<=.01)return;
  const dx=q.x-s.x,dy=q.y-s.y,dist=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),size=Math.max(34,(typeof actorHeight==='function'?actorHeight():66)*.76),length=Math.max(40,Math.min(128,dist+size*.38));
  const paint=()=>{ctx.save();try{ctx.globalAlpha*=fade;ctx.translate((s.x+q.x)/2,(s.y+q.y)/2);ctx.rotate(angle);ctx.lineCap='round';ctx.lineJoin='round';
   ctx.strokeStyle='rgba(206,218,232,.34)';ctx.lineWidth=Math.max(1.5,size*.05);ctx.beginPath();ctx.moveTo(-length*.52,size*.10);ctx.quadraticCurveTo(0,-size*.54,length*.50,-size*.04);ctx.stroke();
   ctx.strokeStyle='rgba(255,255,255,.92)';ctx.lineWidth=Math.max(1.4,size*.03);ctx.beginPath();ctx.moveTo(-length*.51,size*.08);ctx.quadraticCurveTo(-size*.02,-size*.48,length*.48,-size*.035);ctx.stroke();
   stats.threads++;}finally{ctx.restore();}};
  if(typeof ctx.scope==='function')scopeBase.call(ctx,{id:'r89-thread:'+(t.seed??'')+':'+(t.hitIndex??''),kind:'effect',x:e.x,y:e.y,presentationOnly:true},paint);else paint();
 }
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...args){if(enabledFx&&e?.type==='threadSlashR63'&&e.threadR63){try{if(threadReady())filament(e);}catch(_){stats.errors++;}}return base.apply(this,[e,...args]);};}
 // R88 plays F254 when travel() resolves in a new room. A first visit opens the
 // native difficulty picker instead, and its confirm button later calls
 // enterRegion(..., {r72Portal}) outside travel(), so that arrival had no effect.
 // Bridge only that path; arrivals inside travel() stay with the R88 hook.
 let inTravel=0;
 if(typeof travel==='function'){const base=travel;travel=async function(...args){inTravel++;try{return await base.apply(this,args);}finally{inTravel--;}};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(id,from,options,...rest){const before=typeof room==='undefined'?null:room,result=await base.call(this,id,from,options,...rest);
  try{if(enabledFx&&!inTravel&&options?.r72Portal&&result!==false&&room&&room!==before&&player?.hp>0){const arrived=room,x=player.x,y=player.y,key='r89-portal:'+id+':'+(typeof time==='number'?time.toFixed(3):'');
   api.ensure(254).then(ok=>{if(ok&&room===arrived&&player?.hp>0&&api.play(254,{x,y,scale:1.1,height:typeof actorHeight==='function'?actorHeight():66,anchor:'feet',layer:'overlay',sourceKey:key}))stats.portalBridge++;});}}catch(_){stats.errors++;}
  return result;};}
 function settingsRow(){const host=document.getElementById('retroSettingsR89');if(!host||document.getElementById('r89Fx'))return;
  const label=document.createElement('label');label.innerHTML='<input type="checkbox" id="r89Fx"> 이펙트 절제(실검무 은실·가시 앞뒤·독 바닥)';host.insertBefore(label,host.lastElementChild);
  const el=label.querySelector('input');el.checked=enabledFx;el.onchange=()=>{enabledFx=el.checked;try{localStorage.setItem(STORE_KEY,enabledFx?'on':'off');}catch(_){}};}
 if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...args){const result=base.apply(this,args);try{settingsRow();}catch(_){stats.errors++;}return result;};}
 window.__STORYWORLD_VFX_RETRO_R89__=Object.freeze({enabled:()=>enabledFx,set(v){enabledFx=!!v;try{localStorage.setItem(STORE_KEY,enabledFx?'on':'off');}catch(_){}return enabledFx;},
  inspect:()=>({revision:'R89-vfx-retro',enabled:enabledFx,stats:{...stats},thornSplit:'approximate engine split (rear full cage + front lower 34% crop); not authored front/back art',damageChanged:false,rangeChanged:false,clocksChanged:false,newImages:false})});
})();
