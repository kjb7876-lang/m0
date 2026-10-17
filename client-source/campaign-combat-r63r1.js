/* R64 candidate: R63R1 campaign ordering with tuned combat and owned 실검무 aura. */
(()=>{'use strict';
 const COOP_KEY='difficultyR63',STORE_KEY='hapil.storyworld.campaign-r63.maps.v1';
 const PRIOR_HP=Object.freeze({easy:.9,normal:1.4,hard:2.1});
 // The requested final health values halve R63's actual live multipliers
 // (.4/.5/.8), independently of the older reported .9/1.4/2.1 configuration.
 const HP_RETAINED=Object.freeze({easy:.2,normal:.25,hard:.4});
 const TIERS=Object.freeze({
  easy:{name:'이지',hp:HP_RETAINED.easy,hpRetained:HP_RETAINED.easy,legacyConfiguredHp:PRIOR_HP.easy,incoming:.4,reward:1},
  normal:{name:'노말',hp:HP_RETAINED.normal,hpRetained:HP_RETAINED.normal,legacyConfiguredHp:PRIOR_HP.normal,incoming:1,reward:3},
  hard:{name:'하드',hp:HP_RETAINED.hard,hpRetained:HP_RETAINED.hard,legacyConfiguredHp:PRIOR_HP.hard,incoming:1.2,reward:7}
 });
 const validTier=k=>Object.prototype.hasOwnProperty.call(TIERS,k)?k:'normal';
 const roomKey=(id,l)=>String(l||layer)+':'+String(id||zone);
 const prefs=new Map(),coopPrefs=new Map();let lastCoopSession='';
 function validMapKey(k){return typeof k==='string'&&/^(STORY|DREAM):[a-z0-9]+$/.test(k)&&!!regionById[k.split(':')[1]];}
 function parseChoices(raw){const m=new Map();if(!raw||raw.version!==1||!raw.maps||typeof raw.maps!=='object')return m;for(const[k,v]of Object.entries(raw.maps))if(validMapKey(k)&&typeof v==='string'&&TIERS[v])m.set(k,v);return m;}
 try{for(const[k,v]of parseChoices(JSON.parse(localStorage.getItem(STORE_KEY)||'null')))prefs.set(k,v);}catch(_){}
 function coopMode(){const c=window.__STORYWORLD_COOP_SIM_R62__;try{return c?.mode?.()||'off';}catch(_){return'off';}}
 function coopSession(){const c=window.__STORYWORLD_COOP_SIM_R62__;if(!['host','guest'].includes(coopMode())){lastCoopSession='';return'';}let room='';try{room=String(c?.inspect?.().room||'');}catch(_){}const token=coopMode()+':'+room;if(token!==lastCoopSession){lastCoopSession=token;coopPrefs.clear();}return token;}
 function inCoop(){return!!coopSession();}
 function savePrefs(){try{localStorage.setItem(STORE_KEY,JSON.stringify({version:1,maps:Object.fromEntries(prefs)}));}catch(e){warn('난이도 선택을 저장하지 못했습니다: '+e.message);}}
 function mapMode(id=zone,l=layer){const key=roomKey(id,l),shared=world?.[key]?.[COOP_KEY];if(inCoop())return validTier(shared||coopPrefs.get(key)||'normal');return validTier(prefs.get(key)||shared||'normal');}
 function setMapMode(id,l,tier){const key=roomKey(id,l),value=validTier(tier);if(inCoop()){coopPrefs.set(key,value);if(world?.[key])world[key][COOP_KEY]=value;}else{prefs.set(key,value);if(world?.[key])world[key][COOP_KEY]=value;savePrefs();}return value;}
 function reward(info){if(info?.mode==='EGO')return 1;return TIERS[mapMode(info?.regionId,info?.layer)].reward;}
 function multiplier(id=zone,l=layer){return TIERS[mapMode(id,l)].hp;}
 function nextStory(id,l){const r=regionById[id];return!!(r?.records?.length&&!r.safe&&firstPending(l)?.id===id);}
 function hasBeenVisited(id,l){return completed(id,l)||visited.has(layerKey(id,l));}
 function showBlocked(id){const r=regionById[id],next=firstPending();const text=next?'현재 진행은 '+next.title+' 순서입니다. 이전 지역은 설정 또는 쉼터의 지역 지도에서 다시 선택하세요.':'이 장의 서사를 순서대로 이어주세요.';toast(text,3);}
 let enterBase=enterRegion;
 function picker(id,from,options={}){const r=regionById[id],l=options.layer||layer;if(!r)return false;let resolved=false;openPanel('<div class="eyebrow">NEXT NARRATIVE MAP / '+escapeHTML(l)+'</div><h2>'+escapeHTML(r.title)+' · 난이도 선택</h2><p class="small">적용 범위: 모든 일반 몬스터·보스·소환 적·협동 복제 적의 기본 체력입니다. R63 실제 배율을 한 번 더 0.5배로 줄였습니다. 적의 플레이어 대상 피해는 요청한 난이도 값이며, 이동·공격 판정과 기존 보상은 유지됩니다.</p><div class="actions campaign-difficulty-r63"><button id="campaignEasyR63" class="primary">이지 · 기본 체력 20% (R63 실제값의 절반) · 받는 피해 40% · 첫 클리어 +1점</button><button id="campaignNormalR63">노말 · 기본 체력 25% (R63 실제값의 절반) · 받는 피해 유지 · 첫 클리어 +3점</button><button id="campaignHardR63">하드 · 기본 체력 40% (R63 실제값의 절반) · 받는 피해 120% · 첫 클리어 +7점</button><button id="campaignCancelR63">취소</button></div><p class="small muted">현재 공개판의 실제 체력 배율은 이지 40% / 노말 50% / 하드 80%입니다. 이 업데이트 뒤에는 기본값 기준 20% / 25% / 40%가 됩니다. 완료 보상 1/3/7 포인트 및 중복 지급 방지는 유지됩니다.</p>');
  const choose=tier=>{if(resolved)return;resolved=true;if(coopMode()==='guest'){toast('다음 지역과 난이도는 방장만 정할 수 있습니다.',2);closePanel(true);return;}setMapMode(id,l,tier);closePanel(true);return enterBase.call(this,id,from,{...options,layer:l,difficultyR63:tier});};
  button('campaignEasyR63',()=>choose('easy'));button('campaignNormalR63',()=>choose('normal'));button('campaignHardR63',()=>choose('hard'));button('campaignCancelR63',()=>closePanel(true));return false;
 }
 enterRegion=async function(id,from=null,options={}){
  const r=regionById[id],l=options.layer||layer;if(!r)return false;
  if(!options.restore&&!options.fastTravelR63&&id!==zone&&r.records?.length&&!r.safe){
   if(nextStory(id,l)){if(coopMode()==='guest'){toast('다음 지역과 난이도는 방장만 정할 수 있습니다.',2);return false;}return picker.call(this,id,from,options);}
   if(hasBeenVisited(id,l)){showBlocked(id);return false;}
   if(firstPending(l)?.id!==id){showBlocked(id);return false;}
  }
  if(options.fastTravelR63&&coopMode()==='guest'){toast('협동 지도 이동은 방장만 확정할 수 있습니다.',2);return false;}
  const chosen=options.difficultyR63||mapMode(id,l);setMapMode(id,l,chosen);
  const key=roomKey(id,l);if(world?.[key])world[key][COOP_KEY]=chosen;
  const result=await enterBase.call(this,id,from,{...options,layer:l,difficultyR63:chosen});
  if(result===true&&room){room[COOP_KEY]=chosen;applyRoom(room,chosen);}
  return result;
 };

 function resolveRoomTier(r){return validTier(r?.[COOP_KEY]||mapMode(r?.id,r?.layer));}
 function scaleEnemy(e,tier,force=false){if(!e||!Number.isFinite(e.maxHp)||e.maxHp<=0)return false;
  const factor=TIERS[validTier(tier)].hp,oldFactor=Number(e.difficultyFactorR63)||1;
  let base=Number(e.difficultyBaseHpR63);if(!Number.isFinite(base)||base<=0)base=e.maxHp/oldFactor;else if(Math.abs(e.maxHp-base*oldFactor)>.01)base=e.maxHp;
  if(!force&&Math.abs(oldFactor-factor)<1e-8&&Math.abs(e.maxHp-base*factor)<.01)return false;
  const fraction=Number.isFinite(e.hp)?Math.max(0,Math.min(1,e.hp/Math.max(.0001,e.maxHp))):1;
  e.difficultyBaseHpR63=base;e.difficultyFactorR63=factor;e.maxHp=Math.max(1,base*factor);e.hp=Math.min(e.maxHp,e.maxHp*fraction);return true;
 }
 function applyRoom(r,tier=resolveRoomTier(r)){if(!r)return 0;r[COOP_KEY]=validTier(tier);ensurePointState(r);syncPointDrops(r);let n=0;for(const e of r.enemies||[]){scaleEnemy(e,r[COOP_KEY]);n++;}return n;}
 const POINT_DROP_BOSS_CHANCE=Object.freeze({easy:.10,normal:.50,hard:.77});let pointEpochCounterR64=0;
 function pointDropChance(tier,isBoss){const boss=POINT_DROP_BOSS_CHANCE[validTier(tier)];return isBoss?boss:boss/10;}
 function rollPointDrop(tier,isBoss,rng=Math.random){const chance=pointDropChance(tier,isBoss),next=()=>{const n=Number(rng());return Number.isFinite(n)?Math.max(0,Math.min(.999999999999,n)):.999999999999;};if(next()>=chance)return{success:false,chance,amount:0};return{success:true,chance,amount:1+Math.floor(next()*7)};}
 const validPointId=v=>typeof v==='string'&&/^r64:[A-Za-z0-9._:%-]{1,900}$/.test(v);
 function ensurePointState(r){if(!r||typeof r!=='object')return null;if(!Number.isSafeInteger(r.passivePointEpochR64)||r.passivePointEpochR64<1)r.passivePointEpochR64=++pointEpochCounterR64;else pointEpochCounterR64=Math.max(pointEpochCounterR64,r.passivePointEpochR64);if(!Array.isArray(r.passivePointDropsR64))r.passivePointDropsR64=[];if(!Array.isArray(r.passivePointRollsR64))r.passivePointRollsR64=[];if(!Array.isArray(r.passivePointClaimsR64))r.passivePointClaimsR64=[];if(!Number.isSafeInteger(r.passivePointRevisionR64)||r.passivePointRevisionR64<0)r.passivePointRevisionR64=0;if(!Number.isSafeInteger(r.passivePointSpawnSeqR64)||r.passivePointSpawnSeqR64<0)r.passivePointSpawnSeqR64=0;return r;}
 function pointKillId(r,e){const id=String(e?.id||'enemy'),epoch=r.passivePointEpochR64;return'r64:'+epoch+':kill:'+encodeURIComponent(id).slice(0,720);}
 function pointRandom(id){let seed=2166136261;for(let i=0;i<id.length;i++){seed^=id.charCodeAt(i);seed=Math.imul(seed,16777619);}return()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}function rollPointForKill(tier,isBoss,killId){return rollPointDrop(tier,isBoss,pointRandom(String(killId)));}
 function recordPointDrop(e,r,rng){if(!e||!r||e.coopReplicaR62||!Number.isFinite(e.x)||!Number.isFinite(e.y))return null;ensurePointState(r);const killId=pointKillId(r,e);if(r.passivePointRollsR64.includes(killId)||r.passivePointClaimsR64.includes(killId)||r.passivePointDropsR64.some(v=>v?.source===killId))return null;const isBoss=!!(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.cosmicGuardianR63),map=String(e.difficultyMapR63||roomKey(r.id,r.layer)),parts=map.split(':'),tier=validTier(r[COOP_KEY]||mapMode(parts[1],parts[0])),roll=typeof rng==='function'?rollPointDrop(tier,isBoss,rng):rollPointForKill(tier,isBoss,killId);if(!roll.success)return{killId,...roll,isBoss,tier};r.passivePointRollsR64.push(killId);const id='r64:'+r.passivePointEpochR64+':drop:'+String(++r.passivePointSpawnSeqR64),row={id,source:killId,x:Math.max(0,Math.min(32,e.x)),y:Math.max(0,Math.min(32,e.y)),amount:roll.amount,kind:isBoss?'boss':'enemy',createdAt:Number(time)||0};if(!r.passivePointDropsR64.some(v=>v?.id===id))r.passivePointDropsR64.push(row);r.passivePointRevisionR64++;return{killId,...roll,isBoss,tier,id,amount:row.amount};}
 function cleanPointDrops(value,epoch){if(!Array.isArray(value))return[];const prefix='r64:'+epoch+':drop:';return value.slice(0,1024).filter(v=>v&&validPointId(v.id)&&v.id.startsWith(prefix)&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isSafeInteger(v.amount)&&v.amount>=1&&v.amount<=7).map(v=>({id:v.id,source:validPointId(v.source)?v.source:'',x:Math.max(0,Math.min(32,v.x)),y:Math.max(0,Math.min(32,v.y)),amount:v.amount,kind:v.kind==='boss'?'boss':'enemy',createdAt:Number.isFinite(v.createdAt)?v.createdAt:0}));}
 function pointRooms(){const rows=new Map(Object.entries(world||{}));if(room)rows.set(roomKey(room.id||zone,room.layer||layer),room);return rows;}
 function exportPointRoom(r){if(!r)return null;ensurePointState(r);return{epoch:r.passivePointEpochR64,spawnSeq:r.passivePointSpawnSeqR64,revision:r.passivePointRevisionR64,drops:r.passivePointDropsR64.map(v=>({...v})),rolls:r.passivePointRollsR64.filter(validPointId),claims:r.passivePointClaimsR64.filter(validPointId)};}
 function restorePointRoom(r,row){if(!r||!row||!Number.isSafeInteger(row.epoch)||row.epoch<1)return false;if(inCoop()&&coopMode()!=='host')return false;ensurePointState(r);r.passivePointEpochR64=row.epoch;r.passivePointSpawnSeqR64=Number.isSafeInteger(row.spawnSeq)&&row.spawnSeq>=0?row.spawnSeq:0;r.passivePointRevisionR64=Number.isSafeInteger(row.revision)&&row.revision>=0?row.revision+1:1;r.passivePointDropsR64=cleanPointDrops(row.drops,row.epoch);r.passivePointRollsR64=Array.isArray(row.rolls)?row.rolls.filter(validPointId):[];r.passivePointClaimsR64=Array.isArray(row.claims)?row.claims.filter(validPointId):[];pointEpochCounterR64=Math.max(pointEpochCounterR64,row.epoch);syncPointDrops(r);return true;}
 function exportPointState(){const rows={};for(const[key,r]of pointRooms()){ensurePointState(r);rows[key]={epoch:r.passivePointEpochR64,spawnSeq:r.passivePointSpawnSeqR64,revision:r.passivePointRevisionR64,drops:r.passivePointDropsR64.map(v=>({...v})),rolls:r.passivePointRollsR64.filter(validPointId),claims:r.passivePointClaimsR64.filter(validPointId)};}return{version:1,epochCounter:pointEpochCounterR64,rooms:rows};}
 function restorePointState(raw){const data=raw?.campaignPointDropsR64;if(data?.version!==1)return false;pointEpochCounterR64=Math.max(pointEpochCounterR64,Number.isSafeInteger(data.epochCounter)?data.epochCounter:0);for(const[key,row]of Object.entries(data.rooms||{})){const r=world?.[key]||(room&&roomKey(room.id||zone,room.layer||layer)===key?room:null);if(r)restorePointRoom(r,row);}pointEpochCounterR64=Math.max(pointEpochCounterR64,...[...pointRooms().values()].map(r=>Number(r.passivePointEpochR64)||0));return true;}
 const POINT_ART='assets/vfx/v31315/spirit-orb.webp',POINT_PICKUP_RANGE=1.35;
 function syncPointDrops(r=room){if(!r||!Array.isArray(r.props))return 0;ensurePointState(r);if(r.passivePointRenderedRevisionR64===r.passivePointRevisionR64)return 0;const existing=new Map(r.props.filter(p=>p?.passivePointDropR64).map(p=>[p.pointDropIdR64,p])),active=new Set();let changed=0;for(const d of r.passivePointDropsR64){if(!d||r.passivePointClaimsR64.includes(d.id))continue;active.add(d.id);let p=existing.get(d.id);if(!p){p={id:'point:'+d.id,x:d.x,y:d.y,path:POINT_ART,height:30,solid:false,visible:true,passivePointDropR64:true,pointDropIdR64:d.id};r.props.push(p);changed++;}else if(p.x!==d.x||p.y!==d.y||p.amountR64!==d.amount){p.x=d.x;p.y=d.y;p.amountR64=d.amount;changed++;}p.amountR64=d.amount;}if(existing.size){const next=r.props.filter(p=>!p?.passivePointDropR64||active.has(p.pointDropIdR64));if(next.length!==r.props.length){r.props=next;changed++;}}r.passivePointRenderedRevisionR64=r.passivePointRevisionR64;return changed;}
 const drawPropPointBase=drawProp;drawProp=function(a){const result=drawPropPointBase.call(this,a);if(!a?.passivePointDropR64||a.visible===false)return result;const q=project(a.x,a.y),label='+'+Math.max(1,Math.min(7,Number(a.amountR64)||1));ctx.save();try{ctx.font='bold '+Math.max(10,11*zoom)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='rgba(8,14,22,.95)';ctx.shadowBlur=Math.max(2,3*zoom);ctx.fillStyle='rgba(255,255,255,.98)';ctx.fillText(label,q.x,q.y-24*zoom);}finally{ctx.restore();}return result;};
 function collectPointDrops(){if(!room||coopMode()==='guest'||!Array.isArray(room.passivePointDropsR64)||!room.passivePointDropsR64.length)return 0;ensurePointState(room);const c=window.__STORYWORLD_COOP_SIM_R62__,actors=c?.mode?.()==='host'?c.players().filter(p=>p?.hp>0&&p.connectedR62!==false):[player].filter(p=>p?.hp>0),progression=window.__STORYWORLD_PROGRESSION_R62__;if(!actors.length||!progression?.awardPointDrop)return 0;let count=0,changed=false;for(let i=room.passivePointDropsR64.length-1;i>=0;i--){const d=room.passivePointDropsR64[i];if(!d||room.passivePointClaimsR64.includes(d.id))continue;let owner=null,best=POINT_PICKUP_RANGE;for(const p of actors){const dist=Math.hypot(p.x-d.x,p.y-d.y);if(dist<=best){owner=p;best=dist;}}if(!owner)continue;const duplicate=progression.state?.(owner)?.pointDropClaimsR64?.[d.id]===true;if(!duplicate&&!progression.awardPointDrop(d.amount,d.id,owner))continue;room.passivePointClaimsR64.push(d.id);room.passivePointDropsR64.splice(i,1);room.passivePointRevisionR64++;changed=true;if(!duplicate){count++;withActor(owner,()=>toast('패시브 포인트 '+d.amount+'점을 획득했습니다.',2));}}if(changed){syncPointDrops(room);saveGame(false);}return count;}
 const killBasePointR64=killEnemy;killEnemy=function(e,...args){const r=room,wasDead=e?.deadRecorded===true,result=killBasePointR64.apply(this,[e,...args]);if(r&&r===room&&!wasDead&&e?.deadRecorded===true&&!e.coopReplicaR62&&coopMode()!=='guest'){const rolled=recordPointDrop(e,r);if(rolled?.success){syncPointDrops(r);saveGame(false);}}return result;};
 function enemySource(source){
  const owner=source?.owner??source?.attacker??source?.enemy;
  const ownerId=typeof owner==='string'?owner:owner?.id??source?.ownerId??source?.enemyId;
  const enemies=room?.enemies||[];
  return enemies.includes(source)||typeof source?.id==='string'&&enemies.some(e=>e?.id===source.id)||!!owner&&(enemies.includes(owner)||typeof ownerId==='string'&&enemies.some(e=>e?.id===ownerId));
 }
 function incomingDamageFactor(source,tier=mapMode()){return enemySource(source)?TIERS[validTier(tier)].incoming:1;}
 const hurtBaseR63=hurt;hurt=function(value,source,...args){const factor=incomingDamageFactor(source);return hurtBaseR63.call(this,Number.isFinite(value)?value*factor:value,source,...args);};
 const actorBase=actor3;actor3=function(...args){const e=actorBase.apply(this,args);if(e){const d=args[6]?.id||zone,l=args[5]||layer;e.difficultyMapR63=roomKey(d,l);scaleEnemy(e,mapMode(d,l));}return e;};
 for(const name of ['spawnTrial3','spawnCosmic3'])if(typeof window[name]==='function'){const base=window[name];window[name]=function(...args){const roomBefore=room,old=new Set(roomBefore?.enemies||[]),result=base.apply(this,args);if(room===roomBefore)for(const e of room?.enemies||[])if(!old.has(e)&&(name==='spawnTrial3'||name==='spawnCosmic3')){e[name==='spawnTrial3'?'trial':'cosmicGuardianR63']=true;delete e.difficultyFactorR63;delete e.difficultyBaseHpR63;scaleEnemy(e,resolveRoomTier(room),true);}return result;};}

 const serializeBase=serializeSave;serializeSave=function(...args){const data=serializeBase.apply(this,args);if(!inCoop())data.campaignDifficultyR63={version:1,maps:Object.fromEntries(prefs)};const rooms={};for(const[key,r]of Object.entries(world||{})){const rows={};for(const e of r?.enemies||[])if(Number.isFinite(e.difficultyBaseHpR63)&&e.difficultyBaseHpR63>0&&Number.isFinite(e.difficultyFactorR63))rows[e.id]={base:e.difficultyBaseHpR63,factor:e.difficultyFactorR63};if(Object.keys(rows).length)rooms[key]=rows;}data.campaignHpR63={version:1,rooms};data.campaignPointDropsR64=exportPointState();return data;};
 function restoreLoadedHealth(raw){const savedRooms=raw?.campaignHpR63?.version===1?raw.campaignHpR63.rooms:{};for(const[key,r]of Object.entries(world||{})){if(!r?.id)continue;const saved=savedRooms?.[key]||{},tier=resolveRoomTier(r);for(const e of r.enemies||[]){const meta=saved[e.id],fraction=Number.isFinite(e.hp)?Math.max(0,Math.min(1,e.hp/Math.max(.0001,e.maxHp))):1;if(meta&&Number.isFinite(meta.base)&&meta.base>0){e.difficultyBaseHpR63=meta.base;e.difficultyFactorR63=Number.isFinite(meta.factor)&&meta.factor>0?meta.factor:1;e.maxHp=Math.max(1,meta.base*e.difficultyFactorR63);e.hp=Math.min(e.maxHp,e.maxHp*fraction);}else if(Number.isFinite(e.maxHp)&&e.maxHp>0){e.difficultyBaseHpR63=e.maxHp;e.difficultyFactorR63=1;}scaleEnemy(e,tier,true);}applyRoom(r,tier);}restorePointState(raw);syncPointDrops(room);return true;}
 const restoreBase=restoreSave;restoreSave=async function(raw,...args){if(!inCoop()&&raw?.campaignDifficultyR63?.version===1){const restored=parseChoices(raw.campaignDifficultyR63);prefs.clear();for(const[k,v]of restored)prefs.set(k,v);savePrefs();}const result=await restoreBase.apply(this,[raw,...args]);if(result!==false)restoreLoadedHealth(raw);return result;};

 function appendMapButton(container){if(!container||$('campaignMapButtonR63'))return;const b=document.createElement('button');b.id='campaignMapButtonR63';b.type='button';b.textContent='지역 지도 · 이전 기억 이동';container.appendChild(b);b.onclick=()=>showWorld();}
 let fatalDetailR63R2='';
 function installNoticeShelf(){
  const footer=document.querySelector('footer');if(!footer)return null;
  const hint=$('hint'),toastNode=$('toast'),fatal=$('fatal'),statusNode=$('phase1-status');
  const shelf=document.createElement('div');shelf.id='noticeShelfR63R2';shelf.setAttribute('aria-label','게임 안내와 알림');shelf.setAttribute('aria-live','polite');
  for(const node of [hint,toastNode,fatal,statusNode])if(node)shelf.appendChild(node);
  document.body.appendChild(shelf);
  if(fatal){fatal.setAttribute('role','alert');fatal.setAttribute('aria-live','assertive');fatal.tabIndex=0;}
  const summary='시스템 오류 · 설정의 상태 및 진단에서 상세 내용을 확인하세요.';
  const sync=()=>{
   const error=!!fatal&&fatal.style.display!=='none'&&!!fatal.textContent.trim();
   const toastActive=!!toastNode?.textContent.trim(),statusActive=!!statusNode?.textContent.trim();
   shelf.dataset.fatal=error?'1':'0';shelf.dataset.toast=toastActive?'1':'0';shelf.dataset.status=statusActive?'1':'0';
   if(error&&fatal.textContent.trim()!==summary){fatalDetailR63R2=fatal.textContent.trim();fatal.textContent=summary;}
   if(fatal&&!fatal.textContent.trim()&&fatal.style.display!=='none')fatal.style.display='none';
  };
  if(typeof MutationObserver==='function'){
   const observer=new MutationObserver(sync);
   for(const node of [hint,toastNode,fatal,statusNode])if(node)observer.observe(node,{childList:true,characterData:true,subtree:true,attributes:node===fatal});
   shelf.noticeObserverR63R2=observer;
  }
  fatal?.addEventListener('click',()=>showSettings());
  sync();return shelf;
 }
 installNoticeShelf();
 function appendDiagnostics(root){
  if(!root||root.querySelector('#statusDiagnosticsR63R2'))return;
  const section=document.createElement('section');section.id='statusDiagnosticsR63R2';section.className='status-diagnostics-r63r2';
  const heading=document.createElement('h3');heading.textContent='상태 및 진단';section.appendChild(heading);
  const campaign=window.__STORYWORLD_CAMPAIGN_R63R1__?.inspect?.();
  const coop=window.__STORYWORLD_COOP_SIM_R62__?.inspect?.();
  const rank=window.__STORYWORLD_PROGRESSION_R62__?.ranks?.('threadDanceR63',actorNow?.()||player)||0;
  const mode=campaign?.tier||mapMode();
  const summary=document.createElement('p');summary.className='small';summary.textContent='현재 안내: '+($('phase1-status')?.textContent.trim()||$('hint')?.textContent.trim()||'없음');section.appendChild(summary);
  const readout=document.createElement('pre');readout.className='readout';
  readout.textContent=[
   '프레임/표시: '+($('status')?.textContent||'진단 대기'),
   '지역: '+(campaign?.region||zone)+' · '+(campaign?.layer||layer),
   '난이도: '+TIERS[validTier(mode)].name+' · 기본 적 체력 '+Math.round(TIERS[validTier(mode)].hp*100)+'% · 받는 피해 '+Math.round(TIERS[validTier(mode)].incoming*100)+'%',
   '실검무: '+Number(rank||0)+'단계 · 오라는 소유 플레이어에게만 표시',
   '협동: '+(coop?.mode||'off')+' · 공유 빌드 '+(coop?.build||'R62'),
   fatalDetailR63R2?'최근 시스템 오류:\n'+fatalDetailR63R2:'최근 시스템 오류 없음'
  ].join('\n');section.appendChild(readout);root.appendChild(section);
 }
 const settingsBase=showSettings;showSettings=function(...args){const result=settingsBase.apply(this,args),root=$('panel');if(!root)return result;
  if(!window.__STORYWORLD_MOBILE_R63__?.isMobile()&&!$('campaignAutoSkillR63')){const box=root.querySelector('.settings');if(box){const label=document.createElement('label');label.innerHTML='<input id="campaignAutoSkillR63" type="checkbox"> 반자동 전투에서 Q · EGO · 실검무 자동 사용 (실검무 수동 키: T)';box.appendChild(label);const input=$('campaignAutoSkillR63');input.checked=settings.autoSkill===true;input.onchange=()=>{settings.autoSkill=input.checked;saveGame(false);};}}
  let actions=root.querySelector('.campaign-settings-r63');if(!actions){actions=document.createElement('div');actions.className='actions campaign-settings-r63';root.querySelector('.settings')?.insertAdjacentElement('afterend',actions);if(!root.querySelector('.settings'))root.appendChild(actions);}
  if(actions&&!$('campaignMapButtonR63'))appendMapButton(actions);const info=root.querySelector('.campaign-difficulty-note-r63')||document.createElement('p');info.className='small campaign-difficulty-note-r63';info.textContent='현재 지도 난이도 · '+TIERS[mapMode()].name+' / 기본 적 체력 '+Math.round(TIERS[mapMode()].hp*100)+'% / 플레이어가 받는 피해 '+Math.round(TIERS[mapMode()].incoming*100)+'%';if(!info.isConnected)actions?.insertAdjacentElement('afterend',info);appendDiagnostics(root);return result;};
 const shelterBase=showSanctuary;showSanctuary=function(...args){const result=shelterBase.apply(this,args),actions=$('panel')?.querySelector('.actions');appendMapButton(actions);return result;};
 const regionInfoBase=showRegionInfo;showRegionInfo=function(id,...args){const result=regionInfoBase.call(this,id,...args),r=regionById[id],actions=$('panel')?.querySelector('.actions');if(!r||!actions||id===zone)return result;const l=layer,open=chapterOpen(r,l),accessible=open&&hasBeenVisited(id,l);if(accessible&&coopMode()!=='guest'){const b=document.createElement('button');b.id='campaignFastTravelR63';b.type='button';b.className='primary';b.textContent='이 지역으로 이동';actions.appendChild(b);b.onclick=()=>enterRegion(id,null,{fastTravelR63:true,layer:l});}return result;};

 if(typeof settings.autoSkill!=='boolean')settings.autoSkill=true;
 if(room)applyRoom(room,mapMode(room.id,room.layer));
 const baseUrlForR63R2=urlFor,urlCacheR63R2=new Map();urlFor=function(path){const mode=portable?.offline&&portable?.externalAssets===true?'offline':'pages',key=mode+'\0'+String(path);if(urlCacheR63R2.has(key))return urlCacheR63R2.get(key);const url=baseUrlForR63R2(path);urlCacheR63R2.set(key,url);return url;};
 const DANCE_CD=20,targetCooldowns=new Map();let lastCastR63=null;const maxRank=()=>Math.max(0,Number(window.__STORYWORLD_PROGRESSION_R62__?.ranks?.('threadDanceR63',window.__STORYWORLD_COOP_SIM_R62__?.currentPlayer?.()||player))||0),hitLimit=()=>Math.min(12,2+maxRank()),targetLimit=()=>Math.min(8,1+maxRank());
 function actorNow(){const c=window.__STORYWORLD_COOP_SIM_R62__;return c?.currentPlayer?.()||player;}
 function actorKey(p){return String(p?.coopIdR62||p?.id||'local');}
 function validTargets(range=11){return liveEnemies().filter(e=>e&&e.hp>0&&!e.deadRecorded&&distance(actorNow(),e)<=range).sort((a,b)=>distance(actorNow(),a)-distance(actorNow(),b));}
 function available(p=actorNow()){return!!(p&&p.hp>0&&!modal&&!loading&&!safeRegion()&&coopMode()!=='guest'&&time>=(targetCooldowns.get(actorKey(p))||0));}
 const threadMotifsR64=['cross','flower','fractal','claw','tsubamegaeshi','decisive'];
 const motifIdsR64=['threadCrossR64','threadFlowerR64','threadFractalR64','threadClawR64','threadTsubameR64','threadIchidanR64'];function ownedMotifs(p){const progression=window.__STORYWORLD_PROGRESSION_R62__;return motifIdsR64.filter(id=>Number(progression?.ranks?.(id,p))>0).map((id,index)=>threadMotifsR64[motifIdsR64.indexOf(id)]||threadMotifsR64[index]);}function motifForHit(p,hitIndex,targetIndex,owned){const motifs=owned?.length?owned:ownedMotifs(p);return motifs.length?motifs[(hitIndex+targetIndex)%motifs.length]:'cross';}
 function makeEffect(e,p,angle,seq,hitIndex,rank,motif,triangle=false){fx('threadSlashR63',e.x,e.y,{life:.42,size:1.25,threadR63:{from:{x:p.x,y:p.y},to:{x:e.x,y:e.y},angle,seed:seq,hitIndex,motif:motif||'cross',triangle,playerId:p.coopIdR62||null}});}
 function nearestFree(e,from,seed){const radii=[1.0,1.25,1.5],steps=8,start=((seed%8)+8)%8;for(const radius of radii)for(let i=0;i<steps;i++){const a=(start+i)*Math.PI/4,x=e.x+Math.cos(a)*radius,y=e.y+Math.sin(a)*radius;if(!blocked(x,y,.27)&&distance({x,y},e)<2)return{x,y};}return distance(from,e)<=2&&!blocked(from.x,from.y,.27)?{x:from.x,y:from.y}:null;}
 function withActor(p,fn){const c=window.__STORYWORLD_COOP_SIM_R62__;return c?.withPlayer?c.withPlayer(p,fn):fn();}
 function strike(p,roomAt,target,origin,seq,hitIndex,skillRank,castState,targetIndex,owned){return withActor(p,()=>{if(room!==roomAt||p.hp<=0||target.hp<=0||target.deadRecorded||!room.enemies.includes(target))return false;const spot=nearestFree(target,origin,seq+hitIndex);if(!spot)return false;
  const from={x:p.x,y:p.y};p.x=spot.x;p.y=spot.y;p.moving=false;p.direction=facing(target.x-p.x,target.y-p.y);p.attackAngle=Math.atan2(target.y-p.y,target.x-p.x);p.skillAngle=p.attackAngle;p.attackAnim=Math.max(p.attackAnim||0,.21);p.skillAnim=Math.max(p.skillAnim||0,.28);const motif=motifForHit(p,hitIndex,targetIndex,owned),triangle=!!castState?.tsubame;makeEffect(target,{x:from.x,y:from.y,coopIdR62:p.coopIdR62},p.attackAngle,seq,hitIndex,skillRank,motif,triangle);
  const dist=distance(p,target);if(dist<=2.1){const base=attackPower()*(.22+Math.min(.08,skillRank*.006)),perHit=base*(castState?.ichidan&&hitIndex===castState.hitCount-1?1.35:1),source={kind:'hero-thread-dance-r63',ability:'threadDanceR63',hero:p.hero,playerId:p.coopIdR62||null,eventId:'thread-'+actorKey(p)+'-'+seq+'-'+hitIndex,angle:p.attackAngle};if(castState?.tsubame){for(let strikeIndex=0;strikeIndex<3;strikeIndex++){const damageEvent={...source,eventId:source.eventId+'-'+strikeIndex,subHit:strikeIndex};delay(strikeIndex*.035,()=>withActor(p,()=>{if(room===roomAt&&p.hp>0&&target.hp>0&&!target.deadRecorded&&room.enemies.includes(target)&&distance(p,target)<=2.3)hitEnemy(target,perHit/3,damageEvent);}),p.coopIdR62||'threadDanceR63');}}else hitEnemy(target,perHit,source);
   if(castState?.fractal&&!castState.fractalUsed){const secondary=liveEnemies().filter(e=>e!==target&&e.hp>0&&!e.deadRecorded&&room.enemies.includes(e)).sort((a,b)=>distance(target,a)-distance(target,b))[0];if(secondary){castState.fractalUsed=true;const linkSeq=seq+97;makeEffect(secondary,{x:target.x,y:target.y,coopIdR62:p.coopIdR62},Math.atan2(secondary.y-target.y,secondary.x-target.x),linkSeq,hitIndex,skillRank,'fractal');const linked={...source,eventId:source.eventId+'-fractal',motif:'fractal'};delay(.04,()=>withActor(p,()=>{if(room===roomAt&&p.hp>0&&secondary.hp>0&&!secondary.deadRecorded&&room.enemies.includes(secondary))hitEnemy(secondary,base*.35,linked);}),p.coopIdR62||'threadDanceR63');}}}return true;});}
 function cast(manual=false){const p=actorNow(),c=window.__STORYWORLD_COOP_SIM_R62__;
  if(c?.mode?.()==='guest'){if(!manual||modal||loading){lastCastR63={ok:false,stage:'guest-input-gate',manual,modal,loading};return false;}const local=c.localPlayer?.();if(!local){lastCastR63={ok:false,stage:'guest-player-missing'};return false;}local.pendingInputR62??={};local.pendingInputR62.threadDance=true;lastCastR63={ok:true,stage:'guest-input-queued',manual:true};return true;}
  const gate={mode:coopMode(),hp:Number(p?.hp)||0,modal:!!modal,loading:!!loading,safe:safeRegion(),cooldownReady:time>=(targetCooldowns.get(actorKey(p))||0)};if(!available(p)){lastCastR63={ok:false,stage:'host-gate',...gate};return false;}const enemies=validTargets(11),rank=maxRank();if(!enemies.length){lastCastR63={ok:false,stage:'no-target',...gate,nearby:(room?.enemies||[]).filter(e=>e.hp>0).slice(0,4).map(e=>({id:e.id,distance:distance(p,e),spawnState:e.spawnState}))};return false;}
  const hitCount=hitLimit(),targets=enemies.slice(0,targetLimit()),initial={x:p.x,y:p.y},roomAt=room,seq=Math.floor((time+performance.now()/1000)*1000),motifs=ownedMotifs(p),castState={hitCount,fractal:motifs.includes('fractal'),tsubame:motifs.includes('tsubamegaeshi'),ichidan:motifs.includes('decisive'),fractalUsed:false};targetCooldowns.set(actorKey(p),time+DANCE_CD);p.threadDanceAtR63=time;p.threadDanceRankR63=rank;lastCastR63={ok:true,stage:'host-cast',actor:actorKey(p),rank,targets:targets.length,hits:hitCount,motifs:[...motifs]};
  let last=0;targets.forEach((enemy,ti)=>{for(let h=0;h<hitCount;h++){const at=ti*.22+h*.075;last=Math.max(last,at);delay(at,()=>strike(p,roomAt,enemy,initial,seq+ti*32,h,rank,castState,ti,motifs),p.coopIdR62||'threadDanceR63');}});
  delay(last+.22,()=>withActor(p,()=>{if(room===roomAt&&p.hp>0&&Math.hypot(p.x-initial.x,p.y-initial.y)<5){p.x=initial.x;p.y=initial.y;p.moving=false;}}),p.coopIdR62||'threadDanceR63');
  sound('special');return true;}
 function autoCast(){const p=actorNow();if(!available(p)||!validTargets(11).length)return false;return cast(false);}

 function drawThreadAura(p=actorNow()){
  const progression=window.__STORYWORLD_PROGRESSION_R62__,rank=Number(progression?.ranks?.('threadDanceR63',p))||0;
  if(rank<=0||!p||p.hp<=0||progression?.state?.(p)?.visuals===false||!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;
  const point=project(p.x,p.y),height=actorHeight(),phase=time*.24+(Number(p.coopIdR62?.charCodeAt?.(0))||0)*.003,pulse=1+.025*Math.sin(time*2.7+phase),rx=Math.max(17,height*.43)*pulse,ry=Math.max(4.5,height*.105),orbitX=Math.max(11,height*.27)*pulse,orbitY=Math.max(18,height*.48);
  const paint=()=>{ctx.save();try{ctx.save();try{ctx.translate(point.x,point.y-height*.47);ctx.rotate(phase*.35);ctx.globalAlpha*=.56;ctx.globalCompositeOperation='source-over';ctx.lineCap='round';ctx.strokeStyle='rgba(225,233,244,.76)';ctx.shadowColor='rgba(224,236,251,.7)';ctx.shadowBlur=Math.max(2,4*zoom);ctx.lineWidth=Math.max(1,1.5*zoom);ctx.beginPath();ctx.ellipse(0,height*.46,orbitX,orbitY,.12,Math.PI*.14,Math.PI*1.86);ctx.stroke();ctx.rotate(.48+phase*.22);ctx.globalAlpha*=.84;ctx.strokeStyle='rgba(255,255,255,.82)';ctx.shadowBlur=Math.max(1,2.5*zoom);ctx.lineWidth=Math.max(.9,1.2*zoom);ctx.beginPath();ctx.ellipse(0,height*.46,orbitX*.76,orbitY*.91,-.16,Math.PI*1.04,Math.PI*2.78);ctx.stroke();}finally{ctx.restore();}ctx.save();try{ctx.translate(point.x,point.y-height*.08);ctx.rotate(phase);ctx.globalAlpha*=.72;ctx.globalCompositeOperation='source-over';ctx.lineCap='round';ctx.strokeStyle='rgba(225,233,244,.68)';ctx.shadowColor='rgba(224,236,251,.68)';ctx.shadowBlur=Math.max(2,4*zoom);ctx.lineWidth=Math.max(1.2,1.8*zoom);ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.stroke();ctx.rotate(-phase*1.9);ctx.globalAlpha*=.72;ctx.strokeStyle='rgba(255,255,255,.82)';ctx.shadowBlur=Math.max(1,2.4*zoom);ctx.lineWidth=Math.max(.9,1.15*zoom);ctx.beginPath();ctx.ellipse(0,0,rx*.83,ry*.56,0,Math.PI*.12,Math.PI*1.84);ctx.stroke();const spark=time*1.9+phase;ctx.globalAlpha*=.92;ctx.fillStyle='rgba(255,255,255,.92)';for(let i=0;i<2;i++){const a=spark+i*Math.PI;ctx.beginPath();ctx.arc(Math.cos(a)*rx*.9,Math.sin(a)*ry*.72,Math.max(1.2,1.7*zoom),0,Math.PI*2);ctx.fill();}}finally{ctx.restore();}}finally{ctx.restore();}};
  if(typeof ctx.scope==='function')ctx.scope({id:'thread-dance-aura-r63r2:'+String(p.coopIdR62||p.id||'hero'),kind:'effect',x:p.x,y:p.y,alive:true,groundAligned:false,lightShadowApproved:true},paint);else paint();
  return true;
 }
 const visualCullsR63R2={effects:0,projectiles:0};
 function outsideSightR63R2(item){const sight=window.__STORYWORLD_SIGHT24__;return!!(sight?.enabled&&Number.isFinite(item?.x)&&Number.isFinite(item?.y)&&!sight.pointVisible(item.x,item.y));}
 const projectileBaseR63R2=drawProjectile;drawProjectile=function(item,...args){if(outsideSightR63R2(item)){visualCullsR63R2.projectiles++;return;}return projectileBaseR63R2.call(this,item,...args);};
 const drawBase=drawEffect;drawEffect=function(e,...args){if(outsideSightR63R2(e)){visualCullsR63R2.effects++;return;}if(e?.type!=='threadSlashR63'||!e.threadR63)return drawBase.call(this,e,...args);
  const paint=()=>{const s=project(e.threadR63.from.x,e.threadR63.from.y),t=project(e.threadR63.to.x,e.threadR63.to.y),progress=Math.max(0,Math.min(1,e.age/Math.max(.001,e.life))),fade=Math.sin(Math.PI*progress),dx=t.x-s.x,dy=t.y-s.y,dist=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),midX=(s.x+t.x)*.5,midY=(s.y+t.y)*.5,size=Math.max(34,actorHeight()*.76),length=Math.max(40,Math.min(128,dist+size*.38));
   ctx.save();ctx.globalAlpha*=fade;ctx.translate(midX,midY);ctx.rotate(angle);ctx.lineCap='round';ctx.lineJoin='round';
   // A visible origin-to-target filament makes the teleport direction legible.
   ctx.strokeStyle='rgba(196,210,226,.46)';ctx.lineWidth=size*.14;ctx.shadowColor='rgba(224,236,251,.68)';ctx.shadowBlur=6;
   ctx.beginPath();ctx.moveTo(-length*.52,size*.10);ctx.quadraticCurveTo(0,-size*.54,length*.50,-size*.04);ctx.stroke();
   ctx.shadowBlur=2;ctx.strokeStyle='rgba(255,255,255,.96)';ctx.lineWidth=Math.max(2,size*.047);
   ctx.beginPath();ctx.moveTo(-length*.51,size*.08);ctx.quadraticCurveTo(-size*.02,-size*.48,length*.48,-size*.035);ctx.stroke();
   // Two restrained blade arcs read as a fast silver draw, without a ground decal.
   ctx.strokeStyle='rgba(227,236,248,.63)';ctx.lineWidth=size*.085;ctx.shadowBlur=4;
   ctx.beginPath();ctx.moveTo(-size*.65,size*.45);ctx.bezierCurveTo(-size*.43,-size*.78,size*.48,-size*.95,size*.73,size*.34);ctx.stroke();
   ctx.strokeStyle='rgba(255,255,255,.90)';ctx.lineWidth=Math.max(1.6,size*.032);ctx.shadowBlur=3;
   ctx.beginPath();ctx.moveTo(-size*.55,size*.53);ctx.quadraticCurveTo(-size*.03,-size*.30,size*.66,size*.22);ctx.stroke();
   // Rank-unlocked motifs are original silver-thread silhouettes. They change
   // only this skill's presentation, never its existing damage or target rules.
   const motif=e.threadR63.motif||'cross',hitIndex=Math.max(0,Number(e.threadR63.hitIndex)||0),r=size*.28;
   ctx.strokeStyle='rgba(245,249,255,.92)';ctx.shadowColor='rgba(224,236,251,.76)';ctx.shadowBlur=3;ctx.lineWidth=Math.max(1.4,size*.035);ctx.beginPath();
   if(motif==='cross'){ctx.moveTo(-r,-r*.65);ctx.lineTo(r,r*.65);ctx.moveTo(r,-r*.65);ctx.lineTo(-r,r*.65);ctx.moveTo(-r*.95,0);ctx.lineTo(r*.95,0);}
   else if(motif==='flower'){for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.ellipse(0,-r*.48,r*.23,r*.52,0,0,Math.PI*2);ctx.restore();}}
   else if(motif==='fractal'){ctx.moveTo(-r,0);ctx.lineTo(-r*.35,-r*.48);ctx.lineTo(0,0);ctx.lineTo(r*.35,-r*.48);ctx.lineTo(r,0);ctx.moveTo(-r*.35,-r*.48);ctx.lineTo(-r*.55,-r*.78);ctx.moveTo(r*.35,-r*.48);ctx.lineTo(r*.55,-r*.78);}
   else if(motif==='claw'){for(let i=-1;i<=1;i++){const y=i*r*.34;ctx.moveTo(-r*.9,y+r*.3);ctx.quadraticCurveTo(-r*.05,y-r*.38,r*.82,y-r*.12);}}
   else if(motif==='tsubamegaeshi'){const a=[[-r*.66,r*.34],[0,-r*.62],[r*.66,r*.34]];ctx.moveTo(a[0][0],a[0][1]);ctx.lineTo(a[1][0],a[1][1]);ctx.lineTo(a[2][0],a[2][1]);ctx.closePath();const i=hitIndex%3;ctx.moveTo(a[i][0],a[i][1]);ctx.arc(a[i][0],a[i][1],Math.max(1.5,size*.035),0,Math.PI*2);}
   else{ctx.lineWidth=Math.max(2.4,size*.075);ctx.moveTo(-r*1.35,r*.72);ctx.quadraticCurveTo(-r*.1,-r*1.15,r*1.4,-r*.72);ctx.moveTo(-r*.95,r*.48);ctx.quadraticCurveTo(0,-r*.78,r*1.08,-r*.34);}
   ctx.stroke();if(e.threadR63.triangle&&motif!=='tsubamegaeshi'){const a=[[-r*.66,r*.34],[0,-r*.62],[r*.66,r*.34]];ctx.save();ctx.globalAlpha*=.82;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=Math.max(1.3,size*.028);ctx.beginPath();ctx.moveTo(a[0][0],a[0][1]);ctx.lineTo(a[1][0],a[1][1]);ctx.lineTo(a[2][0],a[2][1]);ctx.closePath();ctx.stroke();ctx.restore();}
   const spark=progress*length*.78;ctx.fillStyle='rgba(255,255,255,.96)';for(let i=0;i<3;i++){const x=-length*.28+((spark+i*size*.37)%(length*.58)),y=-size*.18+Math.sin(progress*7+i*1.7)*size*.12;ctx.beginPath();ctx.arc(x,y,Math.max(1.4,size*.032),0,Math.PI*2);ctx.fill();}ctx.restore();};
  const c=window.__STORYWORLD_COOP_SIM_R62__,id=e.threadR63.playerId,p=c?.players?.().find(p=>p.coopIdR62===id);return p&&c?.withPlayer?c.withPlayer(p,paint):paint();};

 const tickBase=tick;tick=function(dt,...args){const before=time,result=tickBase.call(this,dt,...args);if(time>before)collectPointDrops();if(time>before&&!modal&&!loading&&player?.hp>0&&coopMode()==='off'&&settings.autoSkill===true&&(window.__STORYWORLD_MOBILE_R63__?.isMobile()||auto===true)&&!safeRegion()){
   if(validTargets(12).length){if(player.resonance>=30&&player.egoCD<=0&&player.ego<=0&&player.samong<=0)ego();if(player.specialCD<=0)window.__STORYWORLD_HANDO_FINAL_R49__?.autoSpecial();autoCast();}}
  return result;};
 document.addEventListener('keydown',e=>{if(e.code!=='KeyT'||e.repeat||e.target?.matches?.('input,textarea,select,[contenteditable="true"]'))return;e.preventDefault();e.stopImmediatePropagation();cast(true);},true);

  window.__STORYWORLD_CAMPAIGN_R63R1__=Object.freeze({revision:'R64-candidate',tiers:TIERS,reward,mode:mapMode,multiplier,choose:setMapMode,reapplyRoom:()=>applyRoom(room,resolveRoomTier(room)),restoreLoadedHealth,incomingDamageFactor,incomingDamageScale:tier=>TIERS[validTier(tier)].incoming,scaleIncomingDamage:(value,source,tier)=>Number.isFinite(value)?value*incomingDamageFactor(source,tier):value,drawThreadAura,threadMotifs:threadMotifsR64,ownedMotifs,pointDropChance,rollPointDrop,rollPointForKill,collectPointDrops,syncPointDrops,exportPointRoom,restorePointRoom,restorePointState,cast,autoCast,inspect:()=>({revision:'R64-candidate',region:zone,layer,tier:mapMode(),hpMultiplier:multiplier(),hpRetained:TIERS[mapMode()].hpRetained,incomingDamageMultiplier:TIERS[mapMode()].incoming,reward:reward({regionId:zone,layer}),nextNarrative:firstPending()?.id||null,skillRank:maxRank(),skillHitLimit:hitLimit(),skillTargetLimit:targetLimit(),threadMotifs:ownedMotifs(actorNow()),coopMode:coopMode(),pointDrops:{active:(room?.passivePointDropsR64||[]).length,rolled:(room?.passivePointRollsR64||[]).length,claimed:(room?.passivePointClaimsR64||[]).length,epoch:room?.passivePointEpochR64||0},trackedMaps:(inCoop()?coopPrefs: prefs).size,activeSkillCooldown:Math.max(0,(targetCooldowns.get(actorKey(actorNow()))||0)-time),lastCast:lastCastR63,visualCulls:{...visualCullsR63R2},enemyScales:(room?.enemies||[]).filter(e=>Number.isFinite(e.difficultyFactorR63)).map(e=>({id:e.id,boss:!!(e.boss||e.midboss||e.trial||e.cosmic||e.persona||e.r61Summoned||e.coopReplicaR62),base:e.difficultyBaseHpR63,maxHp:e.maxHp,factor:e.difficultyFactorR63}))})});
})();
