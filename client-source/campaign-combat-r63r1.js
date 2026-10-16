/* R63R1 campaign ordering, region difficulty and the player-owned 실검무 skill. */
(()=>{'use strict';
 const COOP_KEY='difficultyR63',STORE_KEY='hapil.storyworld.campaign-r63.maps.v1';
 const TIERS=Object.freeze({easy:{name:'이지',hp:.9,reward:1},normal:{name:'노말',hp:1.4,reward:3},hard:{name:'하드',hp:2.1,reward:7}});
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
 function picker(id,from,options={}){const r=regionById[id],l=options.layer||layer;if(!r)return false;let resolved=false;openPanel('<div class="eyebrow">NEXT NARRATIVE MAP / '+escapeHTML(l)+'</div><h2>'+escapeHTML(r.title)+' · 난이도 선택</h2><p class="small">적용 범위: 이 지역의 일반 몬스터와 보스 체력. 이동·공격 판정과 피해량은 그대로 유지합니다.</p><div class="actions campaign-difficulty-r63"><button id="campaignEasyR63" class="primary">이지 · 체력 90% · 첫 클리어 +1점</button><button id="campaignNormalR63">노말 · 체력 140% · 첫 클리어 +3점</button><button id="campaignHardR63">하드 · 체력 210% · 첫 클리어 +7점</button><button id="campaignCancelR63">취소</button></div><p class="small muted">난이도 체력은 현재 기준 대비 -10% / +40% / +110%입니다. 이전 지도는 설정 또는 쉼터의 지역 지도에서 다시 방문할 수 있습니다.</p>');
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
  let base=Number(e.difficultyBaseHpR63);if(!Number.isFinite(base)||base<=0||Math.abs(e.maxHp-base*oldFactor)>.01)base=e.maxHp/oldFactor;
  if(!force&&Math.abs(oldFactor-factor)<1e-8&&Math.abs(e.maxHp-base*factor)<.01)return false;
  const fraction=Number.isFinite(e.hp)?Math.max(0,Math.min(1,e.hp/Math.max(.0001,e.maxHp))):1;
  e.difficultyBaseHpR63=base;e.difficultyFactorR63=factor;e.maxHp=Math.max(1,base*factor);e.hp=Math.min(e.maxHp,e.maxHp*fraction);return true;
 }
 function applyRoom(r,tier=resolveRoomTier(r)){if(!r)return 0;r[COOP_KEY]=validTier(tier);let n=0;for(const e of r.enemies||[]){if(e.trial||e.cosmicGuardianR63||e.personaBossR63){if(e.difficultyFactorR63!==TIERS[r[COOP_KEY]].hp)scaleEnemy(e,r[COOP_KEY],true);}else if(!e.r61Summoned&&!e.coopReplicaR62)scaleEnemy(e,r[COOP_KEY]);n++;}return n;}
 const actorBase=actor3;actor3=function(...args){const e=actorBase.apply(this,args);if(e){const d=args[6]?.id||zone,l=args[5]||layer;e.difficultyMapR63=roomKey(d,l);scaleEnemy(e,mapMode(d,l));}return e;};
 for(const name of ['spawnTrial3','spawnCosmic3'])if(typeof window[name]==='function'){const base=window[name];window[name]=function(...args){const roomBefore=room,old=new Set(roomBefore?.enemies||[]),result=base.apply(this,args);if(room===roomBefore)for(const e of room?.enemies||[])if(!old.has(e)&&(name==='spawnTrial3'||name==='spawnCosmic3')){e[name==='spawnTrial3'?'trial':'cosmicGuardianR63']=true;delete e.difficultyFactorR63;delete e.difficultyBaseHpR63;scaleEnemy(e,resolveRoomTier(room),true);}return result;};}

 const serializeBase=serializeSave;serializeSave=function(...args){const data=serializeBase.apply(this,args);if(!inCoop())data.campaignDifficultyR63={version:1,maps:Object.fromEntries(prefs)};return data;};
 const restoreBase=restoreSave;restoreSave=async function(raw,...args){if(!inCoop()&&raw?.campaignDifficultyR63?.version===1){const restored=parseChoices(raw.campaignDifficultyR63);prefs.clear();for(const[k,v]of restored)prefs.set(k,v);savePrefs();}const result=await restoreBase.apply(this,[raw,...args]);if(result!==false&&!inCoop())for(const r of Object.values(world||{}))if(r?.id)applyRoom(r,resolveRoomTier(r));return result;};

 function appendMapButton(container){if(!container||$('campaignMapButtonR63'))return;const b=document.createElement('button');b.id='campaignMapButtonR63';b.type='button';b.textContent='지역 지도 · 이전 기억 이동';container.appendChild(b);b.onclick=()=>showWorld();}
 const settingsBase=showSettings;showSettings=function(...args){const result=settingsBase.apply(this,args),root=$('panel');if(!root)return result;
  if(!window.__STORYWORLD_MOBILE_R63__?.isMobile()&&!$('campaignAutoSkillR63')){const box=root.querySelector('.settings');if(box){const label=document.createElement('label');label.innerHTML='<input id="campaignAutoSkillR63" type="checkbox"> 반자동 전투에서 Q · EGO · 실검무 자동 사용 (실검무 수동 키: T)';box.appendChild(label);const input=$('campaignAutoSkillR63');input.checked=settings.autoSkill===true;input.onchange=()=>{settings.autoSkill=input.checked;saveGame(false);};}}
  let actions=root.querySelector('.campaign-settings-r63');if(!actions){actions=document.createElement('div');actions.className='actions campaign-settings-r63';root.querySelector('.settings')?.insertAdjacentElement('afterend',actions);if(!root.querySelector('.settings'))root.appendChild(actions);}
  if(actions&&!$('campaignMapButtonR63'))appendMapButton(actions);const info=root.querySelector('.campaign-difficulty-note-r63')||document.createElement('p');info.className='small campaign-difficulty-note-r63';info.textContent='현재 지도 난이도 · '+TIERS[mapMode()].name+' / 몬스터 체력 '+Math.round(TIERS[mapMode()].hp*100)+'%';if(!info.isConnected)actions?.insertAdjacentElement('afterend',info);return result;};
 const shelterBase=showSanctuary;showSanctuary=function(...args){const result=shelterBase.apply(this,args),actions=$('panel')?.querySelector('.actions');appendMapButton(actions);return result;};
 const regionInfoBase=showRegionInfo;showRegionInfo=function(id,...args){const result=regionInfoBase.call(this,id,...args),r=regionById[id],actions=$('panel')?.querySelector('.actions');if(!r||!actions||id===zone)return result;const l=layer,open=chapterOpen(r,l),accessible=open&&hasBeenVisited(id,l);if(accessible&&coopMode()!=='guest'){const b=document.createElement('button');b.id='campaignFastTravelR63';b.type='button';b.className='primary';b.textContent='이 지역으로 이동';actions.appendChild(b);b.onclick=()=>enterRegion(id,null,{fastTravelR63:true,layer:l});}return result;};

 if(typeof settings.autoSkill!=='boolean')settings.autoSkill=true;
 if(room)applyRoom(room,mapMode(room.id,room.layer));
 const DANCE_CD=20,targetCooldowns=new Map();let lastCastR63=null;const maxRank=()=>Math.max(0,Number(window.__STORYWORLD_PROGRESSION_R62__?.ranks?.('threadDanceR63',window.__STORYWORLD_COOP_SIM_R62__?.currentPlayer?.()||player))||0),hitLimit=()=>Math.min(12,2+maxRank()),targetLimit=()=>Math.min(8,1+maxRank());
 function actorNow(){const c=window.__STORYWORLD_COOP_SIM_R62__;return c?.currentPlayer?.()||player;}
 function actorKey(p){return String(p?.coopIdR62||p?.id||'local');}
 function validTargets(range=11){return liveEnemies().filter(e=>e&&e.hp>0&&!e.deadRecorded&&distance(actorNow(),e)<=range).sort((a,b)=>distance(actorNow(),a)-distance(actorNow(),b));}
 function available(p=actorNow()){return!!(p&&p.hp>0&&!modal&&!loading&&!safeRegion()&&coopMode()!=='guest'&&time>=(targetCooldowns.get(actorKey(p))||0));}
 function makeEffect(e,p,angle,seq){fx('threadSlashR63',e.x,e.y,{life:.42,size:1.25,threadR63:{from:{x:p.x,y:p.y},to:{x:e.x,y:e.y},angle,seed:seq,playerId:p.coopIdR62||null}});}
 function nearestFree(e,from,seed){const radii=[1.0,1.25,1.5],steps=8,start=((seed%8)+8)%8;for(const radius of radii)for(let i=0;i<steps;i++){const a=(start+i)*Math.PI/4,x=e.x+Math.cos(a)*radius,y=e.y+Math.sin(a)*radius;if(!blocked(x,y,.27)&&distance({x,y},e)<2)return{x,y};}return distance(from,e)<=2&&!blocked(from.x,from.y,.27)?{x:from.x,y:from.y}:null;}
 function withActor(p,fn){const c=window.__STORYWORLD_COOP_SIM_R62__;return c?.withPlayer?c.withPlayer(p,fn):fn();}
 function strike(p,roomAt,target,origin,seq,rank){return withActor(p,()=>{if(room!==roomAt||p.hp<=0||target.hp<=0||target.deadRecorded||!room.enemies.includes(target))return false;const spot=nearestFree(target,origin,seq+rank);if(!spot)return false;
  const from={x:p.x,y:p.y};p.x=spot.x;p.y=spot.y;p.moving=false;p.direction=facing(target.x-p.x,target.y-p.y);p.attackAngle=Math.atan2(target.y-p.y,target.x-p.x);p.skillAngle=p.attackAngle;p.attackAnim=Math.max(p.attackAnim||0,.21);p.skillAnim=Math.max(p.skillAnim||0,.28);makeEffect(target,{x:from.x,y:from.y,coopIdR62:p.coopIdR62},p.attackAngle,seq);
  const dist=distance(p,target);if(dist<=2.1){const perHit=attackPower()*(.22+Math.min(.08,rank*.006));const source={kind:'hero-thread-dance-r63',ability:'threadDanceR63',hero:p.hero,playerId:p.coopIdR62||null,eventId:'thread-'+actorKey(p)+'-'+seq+'-'+rank,angle:p.attackAngle};hitEnemy(target,perHit,source);}return true;});}
 function cast(manual=false){const p=actorNow(),c=window.__STORYWORLD_COOP_SIM_R62__;
  if(c?.mode?.()==='guest'){if(!manual||modal||loading){lastCastR63={ok:false,stage:'guest-input-gate',manual,modal,loading};return false;}const local=c.localPlayer?.();if(!local){lastCastR63={ok:false,stage:'guest-player-missing'};return false;}local.pendingInputR62??={};local.pendingInputR62.threadDance=true;lastCastR63={ok:true,stage:'guest-input-queued',manual:true};return true;}
  const gate={mode:coopMode(),hp:Number(p?.hp)||0,modal:!!modal,loading:!!loading,safe:safeRegion(),cooldownReady:time>=(targetCooldowns.get(actorKey(p))||0)};if(!available(p)){lastCastR63={ok:false,stage:'host-gate',...gate};return false;}const enemies=validTargets(11),rank=maxRank();if(!enemies.length){lastCastR63={ok:false,stage:'no-target',...gate,nearby:(room?.enemies||[]).filter(e=>e.hp>0).slice(0,4).map(e=>({id:e.id,distance:distance(p,e),spawnState:e.spawnState}))};return false;}
  const hitCount=hitLimit(),targets=enemies.slice(0,targetLimit()),initial={x:p.x,y:p.y},roomAt=room,seq=Math.floor((time+performance.now()/1000)*1000);targetCooldowns.set(actorKey(p),time+DANCE_CD);p.threadDanceAtR63=time;p.threadDanceRankR63=rank;lastCastR63={ok:true,stage:'host-cast',actor:actorKey(p),rank,targets:targets.length,hits:hitCount};
  let last=0;targets.forEach((enemy,ti)=>{for(let h=0;h<hitCount;h++){const at=ti*.22+h*.075;last=Math.max(last,at);delay(at,()=>strike(p,roomAt,enemy,initial,seq+ti*32,h),p.coopIdR62||'threadDanceR63');}});
  delay(last+.22,()=>withActor(p,()=>{if(room===roomAt&&p.hp>0&&Math.hypot(p.x-initial.x,p.y-initial.y)<5){p.x=initial.x;p.y=initial.y;p.moving=false;}}),p.coopIdR62||'threadDanceR63');
  sound('special');return true;}
 function autoCast(){const p=actorNow();if(!available(p)||!validTargets(11).length)return false;return cast(false);}

 const drawBase=drawEffect;drawEffect=function(e,...args){if(e?.type!=='threadSlashR63'||!e.threadR63)return drawBase.call(this,e,...args);
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
   const spark=progress*length*.78;ctx.fillStyle='rgba(255,255,255,.96)';for(let i=0;i<3;i++){const x=-length*.28+((spark+i*size*.37)%(length*.58)),y=-size*.18+Math.sin(progress*7+i*1.7)*size*.12;ctx.beginPath();ctx.arc(x,y,Math.max(1.4,size*.032),0,Math.PI*2);ctx.fill();}ctx.restore();};
  const c=window.__STORYWORLD_COOP_SIM_R62__,id=e.threadR63.playerId,p=c?.players?.().find(p=>p.coopIdR62===id);return p&&c?.withPlayer?c.withPlayer(p,paint):paint();};

 const tickBase=tick;tick=function(dt,...args){const before=time,result=tickBase.call(this,dt,...args);if(time>before&&!modal&&!loading&&player?.hp>0&&coopMode()==='off'&&settings.autoSkill===true&&(window.__STORYWORLD_MOBILE_R63__?.isMobile()||auto===true)&&!safeRegion()){
   if(validTargets(12).length){if(player.resonance>=30&&player.egoCD<=0&&player.ego<=0&&player.samong<=0)ego();if(player.specialCD<=0)window.__STORYWORLD_HANDO_FINAL_R49__?.autoSpecial();autoCast();}}
  return result;};
 document.addEventListener('keydown',e=>{if(e.code!=='KeyT'||e.repeat||e.target?.matches?.('input,textarea,select,[contenteditable="true"]'))return;e.preventDefault();e.stopImmediatePropagation();cast(true);},true);

 window.__STORYWORLD_CAMPAIGN_R63R1__=Object.freeze({revision:'R63R1',tiers:TIERS,reward,mode:mapMode,multiplier,choose:setMapMode,cast,autoCast,inspect:()=>({revision:'R63R1',region:zone,layer,tier:mapMode(),hpMultiplier:multiplier(),reward:reward({regionId:zone,layer}),nextNarrative:firstPending()?.id||null,skillRank:maxRank(),skillHitLimit:hitLimit(),skillTargetLimit:targetLimit(),coopMode:coopMode(),trackedMaps:(inCoop()?coopPrefs:prefs).size,activeSkillCooldown:Math.max(0,(targetCooldowns.get(actorKey(actorNow()))||0)-time),lastCast:lastCastR63,enemyScales:(room?.enemies||[]).filter(e=>Number.isFinite(e.difficultyFactorR63)).map(e=>({id:e.id,base:e.difficultyBaseHpR63,maxHp:e.maxHp,factor:e.difficultyFactorR63}))})});
})();
