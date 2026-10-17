/* R63R2 candidate: R63R1 campaign ordering with tuned combat and owned 실검무 aura. */
(()=>{'use strict';
 const COOP_KEY='difficultyR63',STORE_KEY='hapil.storyworld.campaign-r63.maps.v1';
 const PRIOR_HP=Object.freeze({easy:.9,normal:1.4,hard:2.1});
 const HP_RETAINED=Object.freeze({easy:.4,normal:.5,hard:.8});
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
 function picker(id,from,options={}){const r=regionById[id],l=options.layer||layer;if(!r)return false;let resolved=false;openPanel('<div class="eyebrow">NEXT NARRATIVE MAP / '+escapeHTML(l)+'</div><h2>'+escapeHTML(r.title)+' · 난이도 선택</h2><p class="small">적용 범위: 일반 몬스터와 보스 체력, 적이 플레이어에게 주는 피해입니다. 이동·공격 판정과 기존 보상 규칙은 유지됩니다.</p><div class="actions campaign-difficulty-r63"><button id="campaignEasyR63" class="primary">이지 · 체력 현재 대비 −60% · 받는 피해 −60% · 첫 클리어 +1점</button><button id="campaignNormalR63">노말 · 체력 현재 대비 −50% · 받는 피해 유지 · 첫 클리어 +3점</button><button id="campaignHardR63">하드 · 체력 현재 대비 −20% · 받는 피해 +20% · 첫 클리어 +7점</button><button id="campaignCancelR63">취소</button></div><p class="small muted">체력 조정은 보스와 일반 몬스터 모두에 적용하며 남은 체력 비율을 보존합니다. 이지/노말/하드 완료 보상 1/3/7 포인트와 중복 지급 방지는 유지됩니다.</p>');
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
 function applyRoom(r,tier=resolveRoomTier(r)){if(!r)return 0;r[COOP_KEY]=validTier(tier);let n=0;for(const e of r.enemies||[]){if(e.trial||e.cosmicGuardianR63||e.personaBossR63)scaleEnemy(e,r[COOP_KEY]);else if(!e.r61Summoned&&!e.coopReplicaR62)scaleEnemy(e,r[COOP_KEY]);n++;}return n;}
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

 const serializeBase=serializeSave;serializeSave=function(...args){const data=serializeBase.apply(this,args);if(!inCoop())data.campaignDifficultyR63={version:1,maps:Object.fromEntries(prefs)};const rooms={};for(const[key,r]of Object.entries(world||{})){const rows={};for(const e of r?.enemies||[])if(Number.isFinite(e.difficultyBaseHpR63)&&e.difficultyBaseHpR63>0&&Number.isFinite(e.difficultyFactorR63))rows[e.id]={base:e.difficultyBaseHpR63,factor:e.difficultyFactorR63};if(Object.keys(rows).length)rooms[key]=rows;}data.campaignHpR63={version:1,rooms};return data;};
 const restoreBase=restoreSave;restoreSave=async function(raw,...args){if(!inCoop()&&raw?.campaignDifficultyR63?.version===1){const restored=parseChoices(raw.campaignDifficultyR63);prefs.clear();for(const[k,v]of restored)prefs.set(k,v);savePrefs();}const result=await restoreBase.apply(this,[raw,...args]);if(result!==false){const savedRooms=raw?.campaignHpR63?.version===1?raw.campaignHpR63.rooms:{};for(const[key,r]of Object.entries(world||{})){if(!r?.id)continue;const saved=savedRooms?.[key]||{},tier=resolveRoomTier(r);for(const e of r.enemies||[]){const meta=saved[e.id],fraction=Number.isFinite(e.hp)?Math.max(0,Math.min(1,e.hp/Math.max(.0001,e.maxHp))):1;if(meta&&Number.isFinite(meta.base)&&meta.base>0){e.difficultyBaseHpR63=meta.base;e.difficultyFactorR63=Number.isFinite(meta.factor)&&meta.factor>0?meta.factor:1;e.maxHp=Math.max(1,meta.base*e.difficultyFactorR63);e.hp=Math.min(e.maxHp,e.maxHp*fraction);}else if(Number.isFinite(e.maxHp)&&e.maxHp>0){e.difficultyBaseHpR63=e.maxHp;e.difficultyFactorR63=1;}scaleEnemy(e,tier,true);}applyRoom(r,tier);}}return result;};

 function appendMapButton(container){if(!container||$('campaignMapButtonR63'))return;const b=document.createElement('button');b.id='campaignMapButtonR63';b.type='button';b.textContent='지역 지도 · 이전 기억 이동';container.appendChild(b);b.onclick=()=>showWorld();}
 let fatalDetailR63R2='';
 function installNoticeShelf(){
  const footer=document.querySelector('footer');if(!footer)return null;
  const hint=$('hint'),toastNode=$('toast'),fatal=$('fatal');
  const shelf=document.createElement('div');shelf.id='noticeShelfR63R2';shelf.setAttribute('aria-label','게임 안내와 알림');shelf.setAttribute('aria-live','polite');
  for(const node of [hint,toastNode,fatal])if(node)shelf.appendChild(node);
  document.body.appendChild(shelf);
  if(fatal){fatal.setAttribute('role','alert');fatal.setAttribute('aria-live','assertive');fatal.tabIndex=0;}
  const summary='시스템 오류 · 설정의 상태 및 진단에서 상세 내용을 확인하세요.';
  const sync=()=>{
   const error=!!fatal&&fatal.style.display!=='none'&&!!fatal.textContent.trim();
   const toastActive=!!toastNode?.textContent.trim();
   shelf.dataset.fatal=error?'1':'0';shelf.dataset.toast=toastActive?'1':'0';
   if(error&&fatal.textContent.trim()!==summary){fatalDetailR63R2=fatal.textContent.trim();fatal.textContent=summary;}
   if(fatal&&!fatal.textContent.trim()&&fatal.style.display!=='none')fatal.style.display='none';
  };
  if(typeof MutationObserver==='function'){
   const observer=new MutationObserver(sync);
   for(const node of [hint,toastNode,fatal])if(node)observer.observe(node,{childList:true,characterData:true,subtree:true,attributes:node===fatal});
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
  const summary=document.createElement('p');summary.className='small';summary.textContent='현재 안내: '+($('hint')?.textContent.trim()||'없음');section.appendChild(summary);
  const readout=document.createElement('pre');readout.className='readout';
  readout.textContent=[
   '프레임/표시: '+($('status')?.textContent||'진단 대기'),
   '지역: '+(campaign?.region||zone)+' · '+(campaign?.layer||layer),
   '난이도: '+TIERS[validTier(mode)].name+' · 적 체력 기준 '+Math.round(TIERS[validTier(mode)].hp*100)+'% · 받는 피해 '+Math.round(TIERS[validTier(mode)].incoming*100)+'%',
   '실검무: '+Number(rank||0)+'단계 · 오라는 소유 플레이어에게만 표시',
   '협동: '+(coop?.mode||'off')+' · 공유 빌드 '+(coop?.build||'R62'),
   fatalDetailR63R2?'최근 시스템 오류:\n'+fatalDetailR63R2:'최근 시스템 오류 없음'
  ].join('\n');section.appendChild(readout);root.appendChild(section);
 }
 const settingsBase=showSettings;showSettings=function(...args){const result=settingsBase.apply(this,args),root=$('panel');if(!root)return result;
  if(!window.__STORYWORLD_MOBILE_R63__?.isMobile()&&!$('campaignAutoSkillR63')){const box=root.querySelector('.settings');if(box){const label=document.createElement('label');label.innerHTML='<input id="campaignAutoSkillR63" type="checkbox"> 반자동 전투에서 Q · EGO · 실검무 자동 사용 (실검무 수동 키: T)';box.appendChild(label);const input=$('campaignAutoSkillR63');input.checked=settings.autoSkill===true;input.onchange=()=>{settings.autoSkill=input.checked;saveGame(false);};}}
  let actions=root.querySelector('.campaign-settings-r63');if(!actions){actions=document.createElement('div');actions.className='actions campaign-settings-r63';root.querySelector('.settings')?.insertAdjacentElement('afterend',actions);if(!root.querySelector('.settings'))root.appendChild(actions);}
  if(actions&&!$('campaignMapButtonR63'))appendMapButton(actions);const info=root.querySelector('.campaign-difficulty-note-r63')||document.createElement('p');info.className='small campaign-difficulty-note-r63';info.textContent='현재 지도 난이도 · '+TIERS[mapMode()].name+' / 적 체력 기준 '+Math.round(TIERS[mapMode()].hp*100)+'% / 플레이어가 받는 피해 '+Math.round(TIERS[mapMode()].incoming*100)+'%';if(!info.isConnected)actions?.insertAdjacentElement('afterend',info);appendDiagnostics(root);return result;};
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

 function drawThreadAura(p=actorNow()){
  const progression=window.__STORYWORLD_PROGRESSION_R62__,rank=Number(progression?.ranks?.('threadDanceR63',p))||0;
  if(rank<=0||!p||p.hp<=0||progression?.state?.(p)?.visuals===false||!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;
  const point=project(p.x,p.y),height=actorHeight(),phase=time*.24+(Number(p.coopIdR62?.charCodeAt?.(0))||0)*.003,pulse=1+.025*Math.sin(time*2.7+phase),rx=Math.max(17,height*.43)*pulse,ry=Math.max(4.5,height*.105);
  const paint=()=>{ctx.save();try{ctx.translate(point.x,point.y-height*.08);ctx.rotate(phase);ctx.globalAlpha*=.72;ctx.globalCompositeOperation='source-over';ctx.lineCap='round';ctx.strokeStyle='rgba(225,233,244,.68)';ctx.shadowColor='rgba(224,236,251,.68)';ctx.shadowBlur=Math.max(2,4*zoom);ctx.lineWidth=Math.max(1.2,1.8*zoom);ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.stroke();ctx.rotate(-phase*1.9);ctx.globalAlpha*=.72;ctx.strokeStyle='rgba(255,255,255,.82)';ctx.shadowBlur=Math.max(1,2.4*zoom);ctx.lineWidth=Math.max(.9,1.15*zoom);ctx.beginPath();ctx.ellipse(0,0,rx*.83,ry*.56,0,Math.PI*.12,Math.PI*1.84);ctx.stroke();const spark=time*1.9+phase;ctx.globalAlpha*=.92;ctx.fillStyle='rgba(255,255,255,.92)';for(let i=0;i<2;i++){const a=spark+i*Math.PI;ctx.beginPath();ctx.arc(Math.cos(a)*rx*.9,Math.sin(a)*ry*.72,Math.max(1.2,1.7*zoom),0,Math.PI*2);ctx.fill();}}finally{ctx.restore();}};
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
   const spark=progress*length*.78;ctx.fillStyle='rgba(255,255,255,.96)';for(let i=0;i<3;i++){const x=-length*.28+((spark+i*size*.37)%(length*.58)),y=-size*.18+Math.sin(progress*7+i*1.7)*size*.12;ctx.beginPath();ctx.arc(x,y,Math.max(1.4,size*.032),0,Math.PI*2);ctx.fill();}ctx.restore();};
  const c=window.__STORYWORLD_COOP_SIM_R62__,id=e.threadR63.playerId,p=c?.players?.().find(p=>p.coopIdR62===id);return p&&c?.withPlayer?c.withPlayer(p,paint):paint();};

 const tickBase=tick;tick=function(dt,...args){const before=time,result=tickBase.call(this,dt,...args);if(time>before&&!modal&&!loading&&player?.hp>0&&coopMode()==='off'&&settings.autoSkill===true&&(window.__STORYWORLD_MOBILE_R63__?.isMobile()||auto===true)&&!safeRegion()){
   if(validTargets(12).length){if(player.resonance>=30&&player.egoCD<=0&&player.ego<=0&&player.samong<=0)ego();if(player.specialCD<=0)window.__STORYWORLD_HANDO_FINAL_R49__?.autoSpecial();autoCast();}}
  return result;};
 document.addEventListener('keydown',e=>{if(e.code!=='KeyT'||e.repeat||e.target?.matches?.('input,textarea,select,[contenteditable="true"]'))return;e.preventDefault();e.stopImmediatePropagation();cast(true);},true);

  window.__STORYWORLD_CAMPAIGN_R63R1__=Object.freeze({revision:'R63R2-candidate',tiers:TIERS,reward,mode:mapMode,multiplier,choose:setMapMode,reapplyRoom:()=>applyRoom(room,resolveRoomTier(room)),incomingDamageFactor,incomingDamageScale:tier=>TIERS[validTier(tier)].incoming,scaleIncomingDamage:(value,source,tier)=>Number.isFinite(value)?value*incomingDamageFactor(source,tier):value,drawThreadAura,cast,autoCast,inspect:()=>({revision:'R63R2-candidate',region:zone,layer,tier:mapMode(),hpMultiplier:multiplier(),hpRetained:TIERS[mapMode()].hpRetained,incomingDamageMultiplier:TIERS[mapMode()].incoming,reward:reward({regionId:zone,layer}),nextNarrative:firstPending()?.id||null,skillRank:maxRank(),skillHitLimit:hitLimit(),skillTargetLimit:targetLimit(),coopMode:coopMode(),trackedMaps:(inCoop()?coopPrefs: prefs).size,activeSkillCooldown:Math.max(0,(targetCooldowns.get(actorKey(actorNow()))||0)-time),lastCast:lastCastR63,visualCulls:{...visualCullsR63R2},enemyScales:(room?.enemies||[]).filter(e=>Number.isFinite(e.difficultyFactorR63)).map(e=>({id:e.id,base:e.difficultyBaseHpR63,maxHp:e.maxHp,factor:e.difficultyFactorR63}))})});
})();
