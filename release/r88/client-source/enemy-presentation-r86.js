/* R86: native enemy ownership, matching warning/impact colors, and explicit
 * field-champion attack power. No new attack clock, hit area or projectile. */
(()=>{'use strict';
 const FACTOR=6,metrics={champions:0,damageCorrections:0,projectiles:0,groundImages:0,footprints:0,paletteMisses:0},donorCaches=new WeakMap(),paletteOwners=new WeakMap();
 let actorScope=null,medicalScope=false,ownerRoom=null,ownerArray=null,ownerCount=-1,owners=new Map();
 const champion=e=>!!e&&(e.mazeEliteR2===true||e.wardChampionR81===true),solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 function index(force=false){if(force||ownerRoom!==room||ownerArray!==room?.enemies||ownerCount!==(room?.enemies?.length||0)){ownerRoom=room;ownerArray=room?.enemies;ownerCount=room?.enemies?.length||0;owners=new Map((room?.enemies||[]).map(e=>[e.id,e]));}return owners;}
 function owner(source){if(!source)return null;if(source.nativeId&&source.combatProfile)return source;const m=source.medical20?.owner;if(m?.nativeId)return m;const id=source.ownerId||source.owner;if(!id)return null;return index().get(id)||index(true).get(id)||null;}
 function normalize(r=room){
  if(!solo()||!r?.enemies)return r;
  let cache=donorCaches.get(r);if(!cache||cache.rows!==r.enemies||cache.length!==r.enemies.length){const donors=new Map();for(const e of r.enemies)if(!champion(e)&&!e.boss&&!e.midboss&&!e.r61Summoned&&!e.r61Clone&&e.nativeId&&!donors.has(e.nativeId))donors.set(e.nativeId,e);cache={rows:r.enemies,length:r.enemies.length,donors};donorCaches.set(r,cache);}const donors=cache.donors;
  for(const e of r.enemies)if(champion(e)){
   const prior=e.championAttackR86;
   // Restoring a clear field can remove every ordinary donor after makeRoom.
   // Its freshly created champion marker still owns the canonical base damage.
   const donor=donors.get(e.nativeId),base=donor?.damage??(prior?.version===1?prior.baseDamage:NaN),donorId=donor?.id||prior?.donor;
   if(!Number.isFinite(base)||base<0)continue;const target=base*FACTOR;if(!Number.isFinite(target))continue;
   if(prior?.version===1&&prior.donor===donorId&&prior.baseDamage===base&&prior.factor===FACTOR&&e.damage===target)continue;
   if(!prior)metrics.champions++;
   if(e.damage!==target){e.damage=target;metrics.damageCorrections++;}
   e.championAttackR86={version:1,factor:FACTOR,donor:donorId,baseDamage:base};
   // The existing health/scale owner must not reapply its campaign multiplier.
   window.__STORYWORLD_SCALE_MELEE_R61__?.normalize(e,r,{preserveHealth:true,preserveDamage:true});
  }
  return r;
 }
 const roomBase=makeRoom;makeRoom=function(...a){return normalize(roomBase.apply(this,a));};
 const enterBase=enterRegion;enterRegion=async function(...a){const result=await enterBase.apply(this,a);normalize();ownerRoom=null;return result;};
 const restoreBase=restoreSave;restoreSave=async function(...a){const result=await restoreBase.apply(this,a);if(result!==false){for(const r of new Set([...Object.values(world||{}),room]))normalize(r);}ownerRoom=null;return result;};
 const tickBase=tickEnemies;tickEnemies=function(...a){normalize();return tickBase.apply(this,a);};
 const saveBase=serializeSave;serializeSave=function(...a){for(const r of new Set([...Object.values(world||{}),room]))normalize(r);return saveBase.apply(this,a);};
 function palette(e,path=''){
  if(!e)return null;
  // Source palette samples already carry the original image hash. Reuse them;
  // tint cache is shared by native kind instead of one canvas per spawned mob.
  const p=window.__STORYWORLD_PXF_PALETTE__?.select({asset:path,pxfSide:'enemy',pxfPaletteOwner:e});
  if(!p){metrics.paletteMisses++;return null;}return p;
 }
 function color(e){const p=palette(e);if(!p)return null;const l=.2126*p.rgb[0]+.7152*p.rgb[1]+.0722*p.rgb[2],mix=l<190?(190-l)/(255-l):0;return 'rgb('+p.rgb.map(v=>Math.round(v+(255-v)*mix)).join(',')+')';}
 function tint(e,path,image){
  const p=palette(e,path);if(!p||!image)return image;
  let stable=paletteOwners.get(e);if(!stable){stable=Object.create(e);stable.id='r86-kind:'+e.nativeId;paletteOwners.set(e,stable);}
  if(e.persona||e.nativeId==='c104-boss')stable=e;
  return window.__STORYWORLD_PXF_PALETTE__?.imageFor({asset:path,pxfSide:'enemy',pxfPaletteOwner:stable},image,portable.runtimeAssetHashes?.[path]||path)||image;
 }
 function withImage(e,path,fn){
  const source=readyImage(path)?.image;if(!source||!e)return fn();
  const saved=ctx.drawImage;let painted=false;
  ctx.drawImage=function(image,...a){if(image===source){image=tint(e,path,image);painted=true;}return saved.call(this,image,...a);};
  try{return fn();}finally{ctx.drawImage=saved;if(painted)metrics.projectiles++;}
 }
 const projectileBase=drawProjectile;drawProjectile=function(p,...a){
  if(!solo()||!p||p.friendly||p.medical20)return projectileBase.apply(this,[p,...a]);
  const e=owner(p),path=p.sourceProjectile5?.path||p.asset;
  if(!e||typeof path!=='string')return projectileBase.apply(this,[p,...a]);
  return withImage(e,path,()=>projectileBase.apply(this,[p,...a]));
 };
 const enemyBase=drawEnemy;drawEnemy=function(e,...a){const prior=actorScope;actorScope=e;try{return enemyBase.apply(this,[e,...a]);}finally{actorScope=prior;}};
 const hazardBase=drawHazard;drawHazard=function(h,...a){const prior=actorScope,med=medicalScope;actorScope=owner(h);medicalScope=!!h?.medical20;try{return hazardBase.apply(this,[h,...a]);}finally{actorScope=prior;medicalScope=med;}};
 const footprintBase=strokeFootprint154;strokeFootprint154=function(g,stage,original){
  // All stages retain the exact authoritative geometry, including donut holes,
  // clipped lines and committed cone angles. Medical green/white stays native.
  const rgb=solo()&&!medicalScope&&actorScope&&room?.id!=='ep1a08'?color(actorScope):null;
  if(rgb)metrics.footprints++;return footprintBase(g,stage,rgb||original);
 };
 const groundBase=drawNativeGroundArt154;drawNativeGroundArt154=function(path,rect,g,alpha,stage,castId){
  if(!solo()||medicalScope||room?.id==='ep1a08'||!actorScope)return groundBase.apply(this,arguments);
  const e=actorScope,args=arguments;metrics.groundImages++;
  return withImage(e,path,()=>groundBase.apply(this,args));
 };
 window.__STORYWORLD_ENEMY_PRESENTATION_R86__=Object.freeze({normalize,champion,owner,color,palette,inspect:()=>({revision:'r86',championDamageFactor:FACTOR,championVisibleSizeFactor:2,championHealthFactor:6,damageAppliedAt:'actor damage only; native projectile, contact and wound budgets inherit once',medicalArtPreserved:true,telegraphGeometryChanged:false,projectilePhysicsChanged:false,paletteSource:'existing original-body SHA256 samples; white core and danger edge preserved',paletteCache:'existing shared 32MiB/48-entry bounded cache',metrics:{...metrics},browserVerified:false,GPUVerified:false})});
})();
