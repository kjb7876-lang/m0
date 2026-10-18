/* R71 health model. This fragment is inserted at the end of the campaign
 * closure so it can wrap the final R70 combat functions while keeping the
 * original save, difficulty, field and cooperative authorities. */
(()=>{'use strict';
 if(window.__STORYWORLD_HEALTH_R71__)return;
 const R71_MAX_HP=777,R71_BLEED_SECONDS=3,R71_BLOOD_ASSET='assets/vfx/hospital-r49/medical-impacts-r49.png';
 const healthR71Metrics={normalizations:0,legacyFormulaMismatches:0,legacyHeals:0,admittedEnemyHits:0,rejectedHits:0,bloodEffects:0,bossesAdjusted:0,bossesReapplied:0,savesMigrated:0,bleedsCleared:0};
 const healthR71Events=[];
 const healthR71Note=(kind,data={})=>{healthR71Events.push({kind,at:Number.isFinite(time)?time:0,...data});if(healthR71Events.length>128)healthR71Events.shift();};
 const healthR71Clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(Number(v))?Number(v):a));
 const healthR71Number=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
 const healthR71Owner=(source,roomNow=room)=>{
  if(!source||!roomNow||!Array.isArray(roomNow.enemies))return null;
  const direct=source.medical20?.owner;
  if(direct&&roomNow.enemies.includes(direct))return direct;
  const candidates=[source,source.owner,source.attacker,source.enemy,source.r62Owner,source.medical20?.owner];
  for(const candidate of candidates){
   if(candidate&&typeof candidate==='object'&&roomNow.enemies.includes(candidate))return candidate;
   const id=typeof candidate==='string'?candidate:candidate?.id;
   if(typeof id==='string'){
    const found=roomNow.enemies.find(e=>e&&(e.id===id||e.nativeId===id));
    if(found)return found;
   }
  }
  for(const key of ['ownerId','enemyId','sourceId','r62TargetId']){
   const id=source[key];if(typeof id==='string'){const found=roomNow.enemies.find(e=>e&&(e.id===id||e.nativeId===id));if(found)return found;}
  }
  return null;
 };
 const healthR71Coop=()=>window.__STORYWORLD_COOP_SIM_R62__||null;
 const healthR71Authority=()=>{
  const mode=healthR71Coop()?.mode?.()||'off';
  return{mode,canApply:mode!=='guest'};
 };
 const healthR71Rank=(id,p)=>{
  const progression=window.__STORYWORLD_PROGRESSION_R62__;
  if(typeof progression?.ranks==='function'){
   const value=progression.ranks(id,p);if(Number.isFinite(value))return Math.max(0,value);
  }
  const value=p?.progressionR62?.ranks?.[id];return Math.max(0,healthR71Number(value,0));
 };
 const healthR71LegacyFormula=p=>{
  const vitalDef=(typeof UPGRADES!=='undefined'?UPGRADES.find(u=>u.id==='vital'):null),vitalKey=vitalDef?(vitalDef.hero?String(p?.hero||'hwando')+':vital':'vital'):'vital';
  const nativeVital=Math.max(0,healthR71Number(p?.upgrades?.[vitalKey],0));
  const level=Math.max(1,healthR71Number(p?.level,1));
  const repeatedVital=healthR71Rank('endlessVital',p);
  return Math.max(1,260+35*nativeVital+5*(level-1)+18*repeatedVital);
 };
 const healthR71LegacyMaxBase=maxHP;
 maxHP=function(){return R71_MAX_HP;};
 function legacyMaxHP(p=player){
  if(!p)return 260;
  let original=NaN;
  const coop=healthR71Coop(),coopMode=coop?.mode?.()||'off';
  try{
   if(p===player&&typeof healthR71LegacyMaxBase==='function')original=healthR71LegacyMaxBase();
   else if(coopMode!=='off'&&coop?.withPlayer&&typeof healthR71LegacyMaxBase==='function')original=coop.withPlayer(p,()=>healthR71LegacyMaxBase());
  }catch(_){original=NaN;}
  const formula=healthR71LegacyFormula(p);
  if(Number.isFinite(original)&&original>0){
   if(Math.abs(original-formula)>.01){healthR71Metrics.legacyFormulaMismatches++;healthR71Note('legacy-max-formula-mismatch',{original,formula,actor:String(p?.coopIdR62||p?.id||'local')});}
   return Math.max(1,original);
  }
  return formula;
 }
 function normalization(p=player){return R71_MAX_HP/legacyMaxHP(p);}
 function healthR71BleedValid(p,now=Number(time)||0){
  const state=p?.healthBleedR71;
  return !!(state&&state.version===1&&state.until>now&&p?.hp>0&&(!state.roomKey||state.roomKey===String(room?.id||zone)+':'+String(room?.layer||layer)));
 }
 function ensureActor(p=player,options={}){
  if(!p||typeof p!=='object')return p;
  if(p.healthR71Applied===true){p.hp=healthR71Clamp(p.hp,0,R71_MAX_HP);}
  else{
   const legacy=legacyMaxHP(p),raw=healthR71Clamp(p.hp,0,legacy),fresh=options.fresh===true;
   p.hp=fresh?R71_MAX_HP:healthR71Clamp(raw/legacy*R71_MAX_HP,0,R71_MAX_HP);
   p.healthR71Applied=true;healthR71Metrics.normalizations++;
   healthR71Note('player-health-normalized',{source:String(options.source||'actor'),oldHp:raw,oldMaxHp:legacy,newHp:p.hp,newMaxHp:R71_MAX_HP,normalization:R71_MAX_HP/legacy});
  }
  const bleed=p.healthBleedR71;
  if(bleed&&!(bleed.version===1&&Number.isFinite(bleed.started)&&Number.isFinite(bleed.until)&&typeof bleed.ownerId==='string'&&bleed.ownerId.length<=128))p.healthBleedR71=null;
  return p;
 }
 function restoreSavedHp(raw,p){
  const current=raw?.healthR71?.version===1?raw.healthR71.hp:undefined;
  const marked=raw?.healthR71?.version===1||raw?.player?.healthR71Applied===true;
  const sidecar=raw?.progressionR62?.version===1?raw.progressionR62.hp:undefined;
  const saved=Number.isFinite(Number(current))?Number(current):Number.isFinite(Number(sidecar))?Number(sidecar):healthR71Number(raw?.player?.hp,0);
  if(marked)return healthR71Clamp(saved,0,R71_MAX_HP);
  const oldMax=legacyMaxHP(p||raw?.player||{});
  const oldHp=healthR71Clamp(saved,0,oldMax);
  healthR71Metrics.savesMigrated++;
  healthR71Note('legacy-save-health-migrated',{oldHp,oldMaxHp:oldMax,newHp:oldHp/oldMax*R71_MAX_HP,newMaxHp:R71_MAX_HP});
  return healthR71Clamp(oldHp/oldMax*R71_MAX_HP,0,R71_MAX_HP);
 }
 function scaleLegacyHeal(amount,p=player){
  const raw=Number(amount);if(!Number.isFinite(raw)||raw<=0)return 0;
  ensureActor(p,{source:'fixed-heal'});healthR71Metrics.legacyHeals++;
  return raw*normalization(p);
 }
 function mapClearHeal(p=player,legacyCap=35,legacyFraction=.12){
  const legacy=legacyMaxHP(p),raw=Math.min(Math.max(0,legacyCap),legacy*Math.max(0,legacyFraction));
  return scaleLegacyHeal(raw,p);
 }
 function nextVitalDamageReduction(p=player,amount=35){
  const old=legacyMaxHP(p),gain=Math.max(0,Number(amount)||0);return gain>0?gain/(old+gain):0;
 }
 function applyVitalityUpgrade(p=player,amount=35){
  if(!p||p.hp<=0)return 0;
  const healed=scaleLegacyHeal(amount,p);p.hp=Math.min(R71_MAX_HP,healthR71Number(p.hp,0)+healed);return healed;
 }
 const healthR71Boss=e=>!!(e&&(e.boss===true||e.midboss===true||e.persona===true||e.cosmic===true||e.trial===true||e.cosmicGuardianR63===true));
 function healthR71BossSuffix(canonical){
  if(!Number.isFinite(Number(canonical))||Number(canonical)<=0)return 666;
  const n=Math.max(0,Math.round((Number(canonical)-666)/1000));return n*1000+666;
 }
 function normalizeBoss(e,reason='normalize'){
  if(!healthR71Boss(e)||!Number.isFinite(Number(e.maxHp))||Number(e.maxHp)<=0)return false;
  let wasAdjusted=e.healthR71Adjusted===true;const oldVisible=Number(e.healthR71VisibleMaxHp),oldCanonical=Number(e.healthR71CanonicalMaxHp);
  if(wasAdjusted&&Number(e.maxHp)!==oldVisible){wasAdjusted=false;e.healthR71Adjusted=false;delete e.healthR71CanonicalBaseHp;delete e.healthR71CanonicalMaxHp;delete e.healthR71VisibleMaxHp;}
  const difficultyBase=Number(e.difficultyBaseHpR63),factor=Number(e.difficultyFactorR63);
  const scale=Number.isFinite(factor)&&factor>0?factor:1;
  const visibleBefore=wasAdjusted&&Number.isFinite(oldVisible)&&oldVisible>0?oldVisible:Number(e.maxHp);
  const fraction=Number.isFinite(Number(e.hp))?healthR71Clamp(Number(e.hp)/visibleBefore,0,1):1;
  const hasDifficultyBase=Number.isFinite(difficultyBase)&&difficultyBase>0;
  const nativeOverride=!wasAdjusted&&hasDifficultyBase&&Math.abs(Number(e.maxHp)-difficultyBase*scale)>.01;
  const base=nativeOverride?Number(e.maxHp)/scale:hasDifficultyBase?difficultyBase:wasAdjusted&&Number.isFinite(Number(e.healthR71CanonicalBaseHp))?Number(e.healthR71CanonicalBaseHp):Number(e.maxHp)/scale;
  const canonical=nativeOverride?Number(e.maxHp):hasDifficultyBase?difficultyBase*scale:wasAdjusted&&Number.isFinite(oldCanonical)&&oldCanonical>0?oldCanonical:Number(e.maxHp);
  const target=healthR71BossSuffix(canonical);
  if(nativeOverride){e.difficultyBaseHpR63=base;e.difficultyFactorR63=scale;}
  e.healthR71CanonicalBaseHp=base;e.healthR71CanonicalMaxHp=canonical;e.healthR71DifficultyFactor=scale;e.healthR71VisibleMaxHp=target;e.healthR71Adjusted=true;
  if(e.maxHp!==target||!wasAdjusted){e.maxHp=target;e.hp=target*fraction;healthR71Metrics.bossesAdjusted++;healthR71Note('boss-health-suffixed',{id:String(e.id||''),reason,baseMaxHp:base,canonicalMaxHp:canonical,visibleMaxHp:target,hp:e.hp,hpFraction:fraction});}
  return e.maxHp===target&&e.healthR71Adjusted===true;
 }
 function healthR71UnapplyBoss(e){
  if(!e||e.healthR71Adjusted!==true)return false;
  const canonical=Number(e.healthR71CanonicalMaxHp),visible=Number(e.healthR71VisibleMaxHp);
  if(!Number.isFinite(canonical)||canonical<=0||!Number.isFinite(visible)||visible<=0)return false;
  const fraction=healthR71Clamp(Number(e.hp)/visible,0,1);e.maxHp=canonical;e.hp=canonical*fraction;e.healthR71Adjusted=false;healthR71Metrics.bossesReapplied++;
  return true;
 }
 function healthR71NormalizeRoom(r,reason='room'){
  let count=0;for(const e of r?.enemies||[])if(normalizeBoss(e,reason))count++;return count;
 }
 const healthR71BlockedSource=source=>{
  if(!source||source.friendly===true||source.r52BleedTick===true||source.r53WoundTick===true||source.healthBleedR71Tick===true||source.r71BleedVisualR71===true||source.selfCost===true||source.dot===true||source.damageOverTime===true||source.periodic===true)return true;
  const kind=String(source.kind||source.type||'').toLowerCase();
  if(/(?:^|[-_:])(self|self-cost|dot|periodic|bleed-tick)(?:$|[-_:])/.test(kind))return true;
  const owner=source.owner??source.attacker??source.enemy??source.side;
  if(typeof owner==='string'&&/^(hero|player|self|local|coop-player)(?::|$)/i.test(owner))return true;
  return false;
 };
 function normalizeIncoming(value,p=player,source){
  const raw=Number(value);if(!Number.isFinite(raw)||raw<=0)return value;
  const auth=healthR71Authority();if(!auth.canApply)return value;
  ensureActor(p,{source:'incoming-damage'});
  if(source?.r62FieldContact===true||source?.kind==='awakening-shock'||healthR71BlockedSource(source))return raw;
  const factor=normalization(p);return raw*factor;
 }
 function healthR71EnemyOwner(source,p=player){
  const actor=healthR71Owner(source,room);if(!actor||healthR71BlockedSource(source))return null;
  if(source?.coopOwnerR62&&actor?.coopIdR62&&source.coopOwnerR62===actor.coopIdR62)return null;
  if(source?.side==='hero'||source?.sourceSide==='hero'||source?.friendly===true)return null;
  return actor;
 }
 function healthR71Angle(source,owner,p){
  if(Number.isFinite(source?.vx)&&Number.isFinite(source?.vy)&&Math.hypot(source.vx,source.vy)>.001)return Math.atan2(source.vy,source.vx);
  if(Number.isFinite(source?.attack?.angle))return source.attack.angle;
  return owner?Math.atan2(p.y-owner.y,p.x-owner.x):0;
 }
 function healthR71ActorId(p){return String(p?.coopIdR62||p?.id||'local').slice(0,128);}
 function healthR71BleedVisual(p,source,owner,allowDead=false){
  if(!p||p.hp<=0&&!allowDead||!Array.isArray(effects)||typeof fx!=='function')return false;
  const id=healthR71ActorId(p),active=effects.filter(e=>e?.r71BleedVisualR71===true&&e.r71ActorId===id&&e.age<e.life);
  if(active.length>=3){active.sort((a,b)=>a.age-b.age);active[0].age=active[0].life;}
  const all=effects.filter(e=>e?.r71BleedVisualR71===true&&e.age<e.life);if(all.length>=24){all.sort((a,b)=>a.age-b.age);all[0].age=all[0].life;}
  const angle=healthR71Angle(source,owner,p),imageActor=player?.__coopFacadeR62?player:p,impact={x:p.x,y:p.y-.15};
  fx('bloodR52',impact.x,impact.y,{life:.48,r52Blood:true,r52Player:imageActor,r52Room:room,r52At:time,r52Angle:angle,r52Size:.58,r52Alpha:.92,r52Reason:'enemy-hit-r71',r52Origin:{x:p.x,y:p.y},r71BleedVisualR71:true,r71ActorId:id,r71OwnerId:String(owner?.id||'enemy'),r71OwnerActorR71:p,r71ImpactWorldR71:impact});
  healthR71Metrics.bloodEffects++;return true;
 }
 function clearBleeding(p=player,reason='clear'){
  if(!p)return false;const had=!!p.healthBleedR71;p.healthBleedR71=null;
  const id=healthR71ActorId(p);for(const e of effects||[])if(e?.r71BleedVisualR71&&e.r71ActorId===id){e.age=e.life;e.r52Cancelled=true;}
  if(had){healthR71Metrics.bleedsCleared++;healthR71Note('bleeding-cleared',{actor:id,reason});}return had;
 }
 function onAdmittedHit(p,source,before,after,result='hit'){
  const amount=Number.isFinite(Number(before))&&Number.isFinite(Number(after))?Math.max(0,Number(before)-Number(after)):0;
  const accepted=(result==='hit'&&amount>0)||(result==='revived'&&Number(before)>0);
  const owner=healthR71EnemyOwner(source,p),auth=healthR71Authority();
  if(!auth.canApply||!accepted||!owner){healthR71Metrics.rejectedHits++;healthR71Note('bleeding-hit-rejected',{actor:healthR71ActorId(p),result,amount,owner:owner?.id||null,authority:auth.mode,sourceKind:String(source?.kind||'')});return false;}
  if(p?.hp<=0){const visual=healthR71BleedVisual(p,source,owner,true);healthR71Metrics.admittedEnemyHits++;healthR71Note('enemy-hit-bled',{actor:healthR71ActorId(p),owner:String(owner.id||owner.nativeId||'enemy'),before:Number(before),after:Number(after),damage:amount,result,normalization:normalization(p),visual,statusActive:false});return visual;}
  ensureActor(p,{source:'admitted-hit'});const now=Number.isFinite(time)?time:0,id=healthR71ActorId(p),roomKey=String(room?.id||zone)+':'+String(room?.layer||layer);
  p.healthBleedR71={version:1,started:now,lastHit:now,until:now+R71_BLEED_SECONDS,ownerId:String(owner.id||owner.nativeId||'enemy').slice(0,128),roomKey};
  const visual=healthR71BleedVisual(p,source,owner);
  healthR71Metrics.admittedEnemyHits++;healthR71Note('enemy-hit-bled',{actor:id,owner:p.healthBleedR71.ownerId,before:Number(before),after:Number(after),damage:amount,result,normalization:normalization(p),visual});
  return true;
 }
 function statusRows(p=player){
  if(!healthR71BleedValid(p))return[];const state=p.healthBleedR71;
  return[{key:'health-r71-bleed',icon:'☠',label:'출혈',remaining:Math.max(0,state.until-(Number(time)||0)),kind:'debuff',ownerId:state.ownerId}];
 }
 function healthR71Inspect(p=player){
  ensureActor(p,{source:'inspect'});
  const bleed=p?.healthBleedR71,mode=healthR71Authority();
  const actualRoom=(room?.enemies||[]).filter(healthR71Boss).map(e=>({id:e.id,baseMaxHp:e.healthR71CanonicalBaseHp??e.difficultyBaseHpR63??e.maxHp,canonicalMaxHp:e.healthR71CanonicalMaxHp??e.maxHp,visibleMaxHp:e.maxHp,hp:e.hp,adjusted:e.healthR71Adjusted===true,factor:e.difficultyFactorR63||1}));
  const id=healthR71ActorId(p),activeVisuals=(effects||[]).filter(e=>e?.r71BleedVisualR71&&e.r71ActorId===id&&e.age<e.life).length,visuals=(effects||[]).filter(e=>e?.r71BleedVisualR71&&e.age<e.life).slice(-24).map(e=>({actorId:e.r71ActorId,ownerId:e.r71OwnerId,world:e.r71DrawWorldR71||e.r71ImpactWorldR71||{x:e.x,y:e.y},screen:e.r71DrawScreenR71||null,drawActorId:e.r71DrawActorIdR71||null,drawCount:e.r71DrawCountR71||0,hiddenReason:e.r71DrawHiddenReasonR71||null})),legacy=legacyMaxHP(p),norm=normalization(p);
  return{revision:'R71-HEALTH-BLEED',player:{hp:Number(p?.hp)||0,maxHp:R71_MAX_HP,legacyMaxHp:legacy,normalization:norm,effectiveLegacyHp:(Number(p?.hp)||0)/Math.max(.00001,norm),effectiveLegacyMaxHp:legacy,effectiveFraction:healthR71Clamp(Number(p?.hp)/R71_MAX_HP,0,1),healthR71Applied:p?.healthR71Applied===true},bleeding:healthR71BleedValid(p)?{active:true,started:bleed.started,until:bleed.until,remaining:Math.max(0,bleed.until-(Number(time)||0)),ownerId:bleed.ownerId,lastHit:bleed.lastHit,roomKey:bleed.roomKey,activeVisuals}: {active:false,started:null,until:null,remaining:0,ownerId:null,lastHit:null,roomKey:null,activeVisuals},bleedVisuals:visuals,bosses:actualRoom,authority:mode,metrics:{...healthR71Metrics},events:healthR71Events.map(e=>({...e})),asset:{path:R71_BLOOD_ASSET,registered:true,cached:!!readyImage(R71_BLOOD_ASSET)?.image},dotAdded:false,browser:false,GPU:false};
 }
 function serializeBleeding(p=player){
  if(!healthR71BleedValid(p))return null;const b=p.healthBleedR71;
  return{version:1,started:b.started,lastHit:b.lastHit,until:b.until,ownerId:b.ownerId,roomKey:b.roomKey};
 }
 function restoreBleeding(row,p=player,now=Number(time)||0){
  if(!row||row.version!==1||!Number.isFinite(row.started)||!Number.isFinite(row.until)||row.until<=now||typeof row.ownerId!=='string'||row.ownerId.length>128||p?.hp<=0){if(p)p.healthBleedR71=null;return false;}
  const key=String(room?.id||zone)+':'+String(room?.layer||layer);
  if(row.roomKey&&row.roomKey!==key){p.healthBleedR71=null;return false;}
  p.healthBleedR71={version:1,started:Math.min(row.started,now),lastHit:Number.isFinite(row.lastHit)?Math.min(row.lastHit,now):now,until:Math.min(row.until,now+R71_BLEED_SECONDS),ownerId:row.ownerId,roomKey:key};return healthR71BleedValid(p,now);
 }
 const api={revision:'R71-HEALTH-BLEED',maxHP:R71_MAX_HP,legacyMaxHP,normalization,scaleLegacyHeal,mapClearHeal,nextVitalDamageReduction,applyVitalityUpgrade,ensureActor,normalizeIncoming,restoreSavedHp,normalizeBoss,normalizeRoom:healthR71NormalizeRoom,unapplyBoss:healthR71UnapplyBoss,onAdmittedHit,isBleeding:healthR71BleedValid,statusRows,clearBleeding,restoreBleeding,serializeBleeding,inspect:healthR71Inspect};
 window.__STORYWORLD_HEALTH_R71__=Object.freeze(api);

 // R70's R62 formula is retained for migration and exact old-build checking.
 if(typeof UPGRADES!=='undefined'){
  const vital=UPGRADES.find(u=>u.id==='vital');if(vital)vital.text='최대 체력 777 유지. 강화할수록 받는 피해가 감소하고 체력을 회복합니다.';
 }
 const repeatedVital=window.__STORYWORLD_PROGRESSION_R62__?.defs?.find(d=>d.id==='endlessVital');
 if(repeatedVital)repeatedVital.text='최대 체력 777 유지. 단계가 오를수록 받는 피해가 감소하고 체력을 회복합니다.';
 const healthR71Atlas=()=>{
  try{register(R71_BLOOD_ASSET,'image','R71 admitted-hit blood atlas');Promise.resolve(ensureImages([R71_BLOOD_ASSET])).catch(error=>warn('R71 출혈 그림: '+String(error?.message||error)));}catch(error){warn('R71 출혈 자산 등록: '+String(error?.message||error));}
 };
 healthR71Atlas();

 // R52's blood renderer offsets an effect from its stored origin using the
 // currently scoped player. Keep R71 splashes at their recorded impact point
 // and scope that renderer to the actual actor, even when `player` is a coop
 // facade. The base R52 atlas paint and its render-capture scope stay intact.
 const healthR71DrawBase=typeof drawEffect==='function'?drawEffect:null;
 if(healthR71DrawBase)drawEffect=function(e){
  const receiver=this,callArgs=arguments;
  if(e?.r71BleedVisualR71!==true)return healthR71DrawBase.apply(receiver,callArgs);
  const coop=healthR71Coop(),mode=healthR71Authority().mode,impact=e.r71ImpactWorldR71;
  let actor=null;
  if(mode==='off'){
   const retained=e.r71OwnerActorR71;if(retained&&retained.__coopFacadeR62!==true)actor=retained;
  }else if(typeof e.r71ActorId==='string'&&e.r71ActorId.length>0&&typeof coop?.players==='function'){
   try{for(const candidate of coop.players()||[])if(candidate&&candidate.__coopFacadeR62!==true&&candidate.coopIdR62===e.r71ActorId){actor=candidate;break;}}catch(_){actor=null;}
  }
  if(!actor){e.r71DrawHiddenReasonR71='owner-unresolved';return;}
  if(!impact||!Number.isFinite(impact.x)||!Number.isFinite(impact.y)||e.r52Cancelled||e.r52Room!==room||Number(time)-Number(e.r52At)<0||Number(time)-Number(e.r52At)>=Number(e.life))return;
  delete e.r71DrawHiddenReasonR71;
  const scope=()=>{
   const oldX=e.x,oldY=e.y,oldOrigin=e.r52Origin,oldPlayer=e.r52Player,oldCoopPlayer=e.coopPlayerR62,world={x:impact.x,y:impact.y};
   try{
    e.x=world.x;e.y=world.y;e.r52Origin={x:Number(actor.x),y:Number(actor.y)};e.r52Player=player;
    if(actor.coopIdR62!=null)e.coopPlayerR62=String(actor.coopIdR62);
    const q=project(world.x,world.y);e.r71DrawWorldR71=world;e.r71DrawScreenR71={x:q.x,y:q.y-actorHeight()*.40};e.r71DrawActorIdR71=healthR71ActorId(actor);e.r71DrawCountR71=(Number(e.r71DrawCountR71)||0)+1;
    return healthR71DrawBase.apply(receiver,callArgs);
   }finally{e.x=oldX;e.y=oldY;e.r52Origin=oldOrigin;e.r52Player=oldPlayer;if(oldCoopPlayer===undefined)delete e.coopPlayerR62;else e.coopPlayerR62=oldCoopPlayer;}
  };
  return mode!=='off'&&coop?.withPlayer?coop.withPlayer(actor,scope):scope();
 };

 const healthR71ScaleBase=typeof scaleEnemy==='function'?scaleEnemy:null;
 if(healthR71ScaleBase)scaleEnemy=function(e,...args){if(e?.healthR71Adjusted===true){if(Number(e.maxHp)===Number(e.healthR71VisibleMaxHp))healthR71UnapplyBoss(e);else{e.healthR71Adjusted=false;delete e.healthR71CanonicalBaseHp;delete e.healthR71CanonicalMaxHp;delete e.healthR71VisibleMaxHp;}}const result=healthR71ScaleBase.call(this,e,...args);normalizeBoss(e,'difficulty-scale');return result;};
 const healthR71ActorBase=typeof actor3==='function'?actor3:null;
 if(healthR71ActorBase)actor3=function(...args){const e=healthR71ActorBase.apply(this,args);if(e)normalizeBoss(e,'actor-spawn');return e;};
 const healthR71RoomBase=typeof makeRoom==='function'?makeRoom:null;
 if(healthR71RoomBase)makeRoom=function(...args){const r=healthR71RoomBase.apply(this,args);healthR71NormalizeRoom(r,'room-create');return r;};
 const healthR71SummonBase=typeof summon3==='function'?summon3:null;
 if(healthR71SummonBase)summon3=function(...args){const result=healthR71SummonBase.apply(this,args);healthR71NormalizeRoom(room,'summon');return result;};
 for(const name of ['spawnTrial3','spawnCosmic3','preparePersona3'])if(typeof window[name]==='function'){
  const original=window[name];window[name]=function(...args){const before=new Set(room?.enemies||[]),result=original.apply(this,args);for(const e of room?.enemies||[])if(!before.has(e)||healthR71Boss(e)){
    if(e?.healthR71Adjusted===true&&Number(e.maxHp)!==Number(e.healthR71VisibleMaxHp)){e.healthR71Adjusted=false;delete e.healthR71CanonicalBaseHp;delete e.healthR71CanonicalMaxHp;delete e.healthR71VisibleMaxHp;}
    normalizeBoss(e,'special-spawn:'+name);
   }return result;};
 }

 const healthR71HurtBase=typeof hurt==='function'?hurt:null;
 if(healthR71HurtBase)hurt=function(value,source,...args){
  const coop=healthR71Coop(),mode=coop?.mode?.()||'off';if(mode!=='off')return healthR71HurtBase.call(this,value,source,...args);
  const p=player;ensureActor(p,{source:'native-hurt'});const before=Number(p?.hp)||0,adjusted=normalizeIncoming(value,p,source),result=healthR71HurtBase.call(this,adjusted,source,...args),after=Number(p?.hp)||0;
  onAdmittedHit(p,source,before,after,result);return result;
 };

 const healthR71SerializeBase=typeof serializeSave==='function'?serializeSave:null;
 if(healthR71SerializeBase)serializeSave=function(...args){
  const data=healthR71SerializeBase.apply(this,args);if(!data||typeof data!=='object')return data;const p=healthR71Coop()?.currentPlayer?.()||player;ensureActor(p,{source:'serialize'});
  data.player??={};data.player.hp=healthR71Clamp(p?.hp,0,R71_MAX_HP);data.player.healthR71Applied=true;
  data.healthR71={version:1,maxHP:R71_MAX_HP,hp:data.player.hp,bleed:serializeBleeding(p)};return data;
 };
 const healthR71ValidateBase=typeof validateSave==='function'?validateSave:null;
 if(healthR71ValidateBase)validateSave=function(raw,...args){const valid=healthR71ValidateBase.call(this,raw,...args);if(valid?.player){valid.player.hp=restoreSavedHp(raw,valid.player);valid.player.healthR71Applied=true;restoreBleeding(raw?.healthR71?.bleed,valid.player,healthR71Number(raw?.time,time||0));}return valid;};
 const healthR71NormalizeSaveBase=typeof normalizeSave3==='function'?normalizeSave3:null;
 if(healthR71NormalizeSaveBase)normalizeSave3=function(raw,...args){const result=healthR71NormalizeSaveBase.call(this,raw,...args);if(result?.valid?.player){const p=result.valid.player;p.hp=restoreSavedHp(raw,p);p.healthR71Applied=true;restoreBleeding(raw?.healthR71?.bleed,p,healthR71Number(raw?.time,time||0));}return result;};
 const healthR71RestoreBase=typeof restoreSave==='function'?restoreSave:null;
 if(healthR71RestoreBase)restoreSave=async function(raw,...args){
  const result=await healthR71RestoreBase.call(this,raw,...args);if(result===false)return result;
  const coop=healthR71Coop(),mode=coop?.mode?.()||'off',p=mode==='off'?player:coop?.currentPlayer?.()||player;
  if(p){p.hp=restoreSavedHp(raw,p);p.healthR71Applied=true;restoreBleeding(raw?.healthR71?.bleed,p,healthR71Number(raw?.time,time||0));healthR71NormalizeRoom(room,'save-restore');}
  if(mode==='off'||mode==='host')saveGame(false);return result;
 };
 const healthR71NewGameBase=typeof newGame==='function'?newGame:null;
 if(healthR71NewGameBase)newGame=async function(...args){clearBleeding(player,'new-game');const result=await healthR71NewGameBase.apply(this,args);if(result!==false&&player){player.hp=R71_MAX_HP;player.healthR71Applied=true;player.healthBleedR71=null;healthR71NormalizeRoom(room,'new-game');}return result;};
 const healthR71FreshPlayerBase=typeof freshPlayer==='function'?freshPlayer:null;
 if(healthR71FreshPlayerBase)freshPlayer=function(...args){const p=healthR71FreshPlayerBase.apply(this,args);if(p){p.hp=R71_MAX_HP;p.healthR71Applied=true;p.healthBleedR71=null;}return p;};
 const healthR71EnterBase=typeof enterRegion==='function'?enterRegion:null;
 if(healthR71EnterBase)enterRegion=async function(...args){const old=String(room?.id||zone)+':'+String(room?.layer||layer),result=await healthR71EnterBase.apply(this,args);if(result!==false){const next=String(room?.id||zone)+':'+String(room?.layer||layer);if(old!==next){const coop=healthR71Coop(),actors=(coop?.mode?.()||'off')!=='off'?(coop?.players?.()||[]):[player];for(const actor of actors)clearBleeding(actor,'map-transition');}const p=healthR71Coop()?.currentPlayer?.()||player;ensureActor(p,{source:'map-entry'});healthR71NormalizeRoom(room,'map-entry');}return result;};
 const healthR71DeathBase=typeof showDeath==='function'?showDeath:null;
 if(healthR71DeathBase)showDeath=function(...args){const result=healthR71DeathBase.apply(this,args);clearBleeding(healthR71Coop()?.currentPlayer?.()||player,'death');return result;};
 const healthR71HudBase=typeof updateHUD==='function'?updateHUD:null;
 if(healthR71HudBase)updateHUD=function(...args){const p=healthR71Coop()?.currentPlayer?.()||player;ensureActor(p,{source:'hud'});return healthR71HudBase.apply(this,args);};
 const healthR71ShowUpgradeBase=typeof showUpgrades==='function'?showUpgrades:null;
 if(healthR71ShowUpgradeBase)showUpgrades=function(...args){
  const p=healthR71Coop()?.currentPlayer?.()||player,vital=UPGRADES?.find(u=>u.id==='vital'),endless=window.__STORYWORLD_PROGRESSION_R62__?.defs?.find(d=>d.id==='endlessVital');
  const reduction=nextVitalDamageReduction(p,35)*100,repeat=nextVitalDamageReduction(p,18)*100,heal=35*normalization(p),repeatHeal=18*normalization(p);
  if(vital)vital.text='최대 체력 777 유지. 다음 강화: 받는 피해 약 '+reduction.toFixed(1)+'% 감소, 체력 '+heal.toFixed(1)+' 회복.';
  if(endless)endless.text='최대 체력 777 유지. 다음 단계: 받는 피해 약 '+repeat.toFixed(1)+'% 감소, 체력 '+repeatHeal.toFixed(1)+' 회복.';
  return healthR71ShowUpgradeBase.apply(this,args);
 };
})();
