/* Test-only hospital route progression. Original combat, canonical story text,
 * normal save format, and the three native door IDs remain authoritative. */
(()=>{'use strict';
 const VERSION=2,FINAL_ID='ep1a08:maze-chief-r1',PHASES=['route','rally','door','doorStory','boss','exit','exitStory','done'];
 const states=new WeakMap(),events=[];
 let restoring=0,pending=null,doorIntent=false;
 const geometry=()=>window.__STORYWORLD_HOSPITAL_MAZE_LAYOUT__;
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__||(window.__STORYWORLD_COOP_SIM_R62__.mode?.()||'off')==='off';
 const rendererReady=()=>{const c=window.__STORYWORLD_PHASE1__?.controller;return !!(c?.state.three&&!c.state.failed);};
 const hospital=r=>solo()&&r?.id==='ep1a08'&&r.layer==='STORY'&&!r.egoVisitId151;
 const living=e=>e&&e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead';
 const bossRoomActor=e=>!!e&&(e.boss||e.midboss)&&!e.mazeEliteR2;
 const ordinary=e=>living(e)&&ordinaryActor3(e)&&!e.r61Summoned&&!e.r61Clone;
 const note=(kind,data={})=>{events.push({kind,at:time,...data});if(events.length>80)events.shift();};
 const copy=v=>JSON.parse(JSON.stringify(v));
 function clean(v){
  if(v===undefined)return null;
  if(!v||![1,VERSION].includes(v.version)||!PHASES.includes(v.phase)||![null,1,2].includes(v.route)||!Array.isArray(v.rallied)||v.rallied.length>32||v.rallied.some(id=>typeof id!=='string'||id.length>160)||typeof v.doorStoryDone!=='boolean'||typeof v.exitStoryDone!=='boolean')throw Error('병원 미로 진행 저장을 확인해 주세요.');
  return{version:VERSION,phase:v.phase,route:v.route,rallied:[...new Set(v.rallied)],doorStoryDone:v.doorStoryDone,exitStoryDone:v.exitStoryDone};
 }
 function fresh(r){return{version:VERSION,phase:r.cleared||completed(r.id,r.layer)?'done':'route',route:null,rallied:[],doorStoryDone:false,exitStoryDone:false};}
 function state(r=room){return states.get(r)||null;}
 function door(id,r=room){return r?.exploration?.hospitalDoorsB3?.find(d=>d.id===id);}
 function doorPhaseOpen(id,s=state()){
  if(!s)return true;
  if(id==='door-0')return ['boss','exit','exitStory','done'].includes(s.phase);
  if(id==='door-2')return ['exit','exitStory','done'].includes(s.phase);
  return true;
 }
 function setPoint(e,p){e.x=e.homeX=p.x;e.y=e.homeY=p.y;e.nav=[];e.navAt=time-.6;e.stuck=0;e.attack=null;e.rangedWindup=0;e.storyPreparedCast150=null;e.aim=null;e.state='idle';e.cd=Math.max(.8,Number(e.cd)||0);}
 function safePoint(preferred,r,e,used=[]){
  const radius=Math.max(.2,e?.combatProfile?.bodyBlock?.r||e?.radius||.3)+.12;
  const candidates=[preferred];for(let ring=1;ring<=12;ring++)for(let i=0;i<12;i++){const a=i*Math.PI/6;candidates.push({x:preferred.x+Math.cos(a)*ring*.3,y:preferred.y+Math.sin(a)*ring*.3});}
  return candidates.find(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&!blocked(p.x,p.y,radius,r)&&used.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>radius+(q.radius||.4)+.15))||null;
 }
 function seed(r){
  if(!hospital(r)||states.has(r))return r;
  const g=geometry();if(!g)throw Error('병원 미로 좌표가 준비되지 않았습니다.');
  const saved=pending?.hospitalMazeR1?.rooms?.[layerKey(r.id,r.layer)];
  const s=clean(saved)||fresh(r);states.set(r,s);
  r.hospitalEntranceGuardR50={version:1,id:'maze-routes-r1',startId:'lower-centre',relocated:false};
  if(s.phase==='done')return r;
  const base=r.enemies.filter(e=>ordinary(e)),donors=base.slice();
  for(let i=0;i<12&&donors.length;i++){
   const donor=donors[i%donors.length],id='ep1a08:maze-patrol-r1:'+i;
   if(r.enemies.some(e=>e.id===id))continue;
   const e=actor3(donor.profile,id,donor.x,donor.y,false,r.layer,regionById[r.id]);
   Object.assign(e,{nativeId:donor.nativeId,sourcePlanId6:donor.sourcePlanId6,sourceKind6:donor.sourceKind6,sourcePlan6:donor.sourcePlan6,profile:donor.profile,path:donor.path,weapon:donor.weapon,ai:donor.ai,mazeAddedR1:true});
   r.enemies.push(e);base.push(e);
  }
  const used=[];
  base.forEach((e,i)=>{
   const route=i%2+1,spots=g.routeSpawns[route],preferred=spots[Math.floor(i/2)%spots.length];
   const p=safePoint(preferred,r,e,used);if(!p)throw Error('병원 경로 적의 안전한 위치를 찾지 못했습니다: '+e.id);
   setPoint(e,p);used.push({...p,radius:e.combatProfile?.bodyBlock?.r||.3});
   e.mazeRouteR1=route;e.spawnState='active';delete e.fieldWaveIndex6;
   e.explorationGroup='ep1a08:maze-route:'+route+':'+Math.floor(i/4);e.explorationLeash=9;
  });
  r.explorationGroups=[];for(const e of base){let group=r.explorationGroups.find(g=>g.id===e.explorationGroup);if(!group){group={id:e.explorationGroup,node:'maze-route-'+e.mazeRouteR1,x:e.homeX,y:e.homeY,enemyIds:[]};r.explorationGroups.push(group);}group.enemyIds.push(e.id);}
  // One field champion per native ordinary kind; same attack data and damage,
  // twice the visible body, six times the ordinary canonical durability.
  const kinds=[...new Map(donors.map(e=>[e.nativeId,e])).values()];
  for(let i=0;i<kinds.length;i++){
   const donor=kinds[i],id='ep1a08:maze-elite-r2:'+donor.nativeId;if(r.enemies.some(e=>e.id===id))continue;
   const e=actor3(donor.profile,id,donor.x,donor.y,false,r.layer,regionById[r.id]);
   const factor=1,canonical=window.__STORYWORLD_SCALE_MELEE_R61__.pressure(r).ordinaryHp;
   Object.assign(e,{nativeId:donor.nativeId,name:'중간보스 · '+donor.name.replace(/ 증원| 추격대| 후속 증원/g,''),profile:donor.profile,path:donor.path,weapon:donor.weapon,ai:donor.ai,sourcePlan6:donor.sourcePlan6,sourcePlanId6:donor.sourcePlanId6,sourceKind6:donor.sourceKind6,mazeEliteR2:true,r61PreserveHealth:true,damage:donor.damage,difficultyBaseHpR63:canonical*6,difficultyFactorR63:factor,maxHp:canonical*factor*6,hp:canonical*factor*6,defScale:donor.defScale*2,combatProfile:copy(donor.combatProfile)});
   window.__STORYWORLD_SCALE_MELEE_R61__.normalize(e,r,{preserveHealth:true,preserveDamage:true});
   e.combatProfile.bodyBlock.r*=2;e.combatProfile.hurtbox.r*=2;e.radius=e.combatProfile.hurtbox.r;
   const target=g.eliteSpawns[i%g.eliteSpawns.length],point=safePoint(target,r,e,used);if(!point)throw Error('강화 중간보스 위치가 막혔습니다.');
   setPoint(e,point);used.push({...point,radius:e.combatProfile.bodyBlock.r});e.mazeRouteR1=target.route;e.explorationGroup='ep1a08:maze-route:'+target.route+':elite';e.explorationLeash=12;e.spawnState='active';delete e.fieldWaveIndex6;r.enemies.push(e);
   r.explorationGroups.push({id:e.explorationGroup,node:'elite-bay',x:e.x,y:e.y,enemyIds:[e.id]});
  }
  const mid=r.enemies.find(e=>e.midboss&&e.id!==FINAL_ID);
  if(mid&&!r.enemies.some(e=>e.id===FINAL_ID)){
   const chief=actor3(mid.profile,FINAL_ID,g.boss.x,g.boss.y,true,r.layer,regionById[r.id],true);
   Object.assign(chief,{nativeId:mid.nativeId,name:'병원 심부의 집도의',profile:mid.profile,path:mid.path,weapon:mid.weapon,ai:mid.ai,mazeChiefR1:true,sourcePlan6:true,sourcePlanId6:mid.sourcePlanId6,sourceKind6:mid.sourceKind6});
   window.__STORYWORLD_SOURCE_PHASE5__?.initialize(chief);r.enemies.push(chief);
  }
  const bossUsed=[];r.enemies.filter(bossRoomActor).forEach((e,i)=>{const point=safePoint(g.bossSpawns[i%g.bossSpawns.length],r,e,bossUsed);if(!point)throw Error('보스방 생성 위치가 막혔습니다.');setPoint(e,point);bossUsed.push({...point,radius:e.combatProfile.bodyBlock.r});e.spawnState='hidden';});
  r.fieldWaveIndex6=r.fieldWaves6?.length||0;r.fieldWaveCleared6=false;
  note('seed',{count:base.length,original:donors.length,extra:base.length-donors.length,major:r.enemies.filter(e=>e.boss||e.midboss).length});
  return r;
 }
 function normalizeChampionHealth(r){
  if(!hospital(r))return;
  const campaign=window.__STORYWORLD_CAMPAIGN_R63R1__,tier=campaign.mode(r.id,r.layer),factor=campaign.tiers[tier].hp*1.66,base=window.__STORYWORLD_SCALE_MELEE_R61__.pressure(r).ordinaryHp*6,target=base*factor;
  for(const e of r.enemies)if(e.mazeEliteR2){const fraction=Math.max(0,Math.min(1,e.hp/Math.max(1,e.maxHp)));e.difficultyBaseHpR63=base;e.difficultyFactorR63=factor;e.maxHp=target;e.hp=target*fraction;}
 }
 const enterMazeBase=enterRegion;enterRegion=async function(...a){const result=await enterMazeBase.apply(this,a);if(result!==false)normalizeChampionHealth(room);return result;};
 function nativeOpen(id){
  const d=door(id);if(!d)return false;
  if(nativeDoors.isOpen(room,d))return true;
  if(typeof nativeDoors.setHospitalDoorR1==='function')return nativeDoors.setHospitalDoorR1(id,true);
  doorIntent=true;try{return nativeDoors.use({id:d.id,kind:'door',point:{x:d.x,y:d.y},reach:d.reach});}finally{doorIntent=false;}
 }
 function rally(){
  const s=state(),g=geometry();if(!s||s.phase!=='route')return false;
  const rows=room.enemies.filter(ordinary),used=[{x:player.x,y:player.y,radius:.45}];
  // Move the existing survivors; do not respawn, clone, heal or reset kills.
  const destinations=rows.map((e,i)=>{const p=safePoint(g.rally[i%g.rally.length],room,e,used);if(!p)throw Error('집결지에서 적의 안전한 자리를 찾지 못했습니다.');used.push({...p,radius:e.combatProfile.bodyBlock.r});return{e,p};});
  for(const{e,p}of destinations){setPoint(e,p);e.spawnState='active';e.explorationLeash=22;e.explorationGroup='ep1a08:maze-rally-r1';e.graceUntil=time+1.1;}
  room.explorationGroups=[{id:'ep1a08:maze-rally-r1',node:'preparation',x:g.merge.x,y:g.merge.y,enemyIds:rows.map(e=>e.id)}];
  s.phase='rally';s.rallied=rows.map(e=>e.id);room.fieldWaveCleared6=false;room.engaged=false;
  room.engaged=true;room.encounterStage='active';room.activeEncounter='midboss';
  note('rally',{selectedRoute:s.route,survivors:rows.length,oppositeSurvivors:rows.filter(e=>e.mazeRouteR1!==s.route).length,ids:s.rallied});
  toast('두 복도의 생존 적들이 집결했습니다. 중간보스와 함께 모두 제압하세요.',4);saveGame(false);return true;
 }
 function settle(){
  const s=state();if(!s||!hospital(room))return;
  if(s.phase==='rally'){
   if(room.enemies.some(e=>living(e)&&!bossRoomActor(e)))return;
   s.phase='door';room.engaged=false;room.finalizing=false;room.encounterStage='bossReady';room.activeEncounter='';room.fieldWaveCleared6=true;
   toast('집결지 섬멸 · 전투실 문 앞에서 E를 눌러 기억을 확인하세요.',4);note('rally-cleared');saveGame(false);
  }else if(s.phase==='boss'&&!room.enemies.some(e=>bossRoomActor(e)&&living(e))){
   s.phase='exit';room.engaged=false;room.finalizing=false;room.encounterStage='bossReady';room.activeEncounter='';
   nativeOpen('door-2');
   toast('병원 보스 격파 · 주사실 문이 해제됐습니다. 문 앞에서 E.',4);note('boss-cleared');saveGame(false);
  }
 }
 function beginBoss(){
  const s=state();if(!s||s.phase!=='boss')return false;
  const bosses=room.enemies.filter(e=>bossRoomActor(e)&&living(e)&&e.spawnState==='hidden');if(!bosses.length)return false;
  room.engaged=false;return summon3(bosses,'boss');
 }
 function finishDoorStory(r){
  if(room!==r||!hospital(room))return;
  const s=state();if(s.phase!=='doorStory'&&s.phase!=='door')return;
  s.doorStoryDone=true;s.phase='boss';room.finalizing=false;room.sceneCheckpoint=null;
  nativeOpen('door-0');note('boss-door-open');saveGame(false);
 }
 function showDoorStory(){
  const r=room,s=state();if(!s||!['door','doorStory'].includes(s.phase))return false;
  s.phase='doorStory';room.engaged=false;room.finalizing=false;
  playScenes(nextScenes(regionById[zone],'pre'),()=>finishDoorStory(r));
  if(room.sceneCheckpoint)room.sceneCheckpoint.hospitalMazeActionR1='boss-door';return true;
 }
 async function finishExitStory(r,shouldTravel=true){
  if(room!==r||!hospital(room))return false;
  const s=state();if(!['exit','exitStory','done'].includes(s?.phase))return false;
  s.phase='done';s.exitStoryDone=true;room.finalizing=false;room.sceneCheckpoint=null;
  completeRegion(zone);note('hospital-complete');saveGame(false);
  if(shouldTravel){const d=Object.keys(regionById[zone].exits).find(d=>regionById[zone].exits[d]==='ep1a09');if(d)return travel(d);}
  return true;
 }
 function showExitStory(){
  const r=room,s=state();if(!s||!['exit','exitStory'].includes(s.phase))return false;
  s.phase='exitStory';room.engaged=false;room.finalizing=false;
  nativeOpen('door-2');playScenes(nextScenes(regionById[zone],'post'),()=>finishExitStory(r));
  if(room.sceneCheckpoint)room.sceneCheckpoint.hospitalMazeActionR1='hospital-exit';return true;
 }
 const coreBase=window.__STORYWORLD_HOSPITAL_CORE_B2__;
 window.__STORYWORLD_HOSPITAL_CORE_B2__=Object.freeze({...coreBase,plan(r,rows,nav){
  const s=state(r);if(!hospital(r)||!s)return coreBase.plan(r,rows,nav);
  const saved=pending?.rooms?.[layerKey(r.id,r.layer)]?.enemies||[],used=[];
  return rows.map(e=>{const old=saved.find(v=>v.id===e.id),preferred=old&&Number.isFinite(old.x+old.y)?old:{x:e.x,y:e.y},p=safePoint(preferred,r,e,used);if(!p)throw Error('복원된 미로 적의 위치를 확인해 주세요.');used.push({...p,radius:nav.radius(e)});const group=s.phase==='rally'?'ep1a08:maze-rally-r1':e.explorationGroup||'ep1a08:maze-route:'+e.mazeRouteR1;return{e,p,bay:{id:group,x:p.x,y:p.y},group};});
 }});
 const makeBase=makeRoom;makeRoom=function(...a){
  const r=makeBase.apply(this,a),ego=window.__STORYWORLD_EGO151__?.inspect?.().state;
  // buildRoom assigns egoVisitId only after makeRoom returns. Do not seed that
  // transient EGO room; ordinary saved world rooms still retain their ledger.
  if(ego?.active&&(!egoRoom151||egoRoom151.egoVisitId151!==ego.visitId))return r;
  return seed(r);
 };
 const finishBase=finishEncounter;finishEncounter=function(...a){if(hospital(room)&&state()){settle();return;}return finishBase.apply(this,a);};
 const killBase=killEnemy;killEnemy=function(...a){const result=killBase.apply(this,a);if(hospital(room)&&state())settle();return result;};
 const blockedBase=blocked;blocked=function(x,y,r=.27,where=room){
  const s=state(where);if(hospital(where)&&s){for(const id of ['door-0','door-2']){const d=door(id,where);if(d&&!doorPhaseOpen(id,s)&&Math.abs(x-d.x)<d.width/2+r&&Math.abs(y-d.y)<d.depth/2+r)return true;}}
  return blockedBase.apply(this,arguments);
 };
 const nativeDoors=window.__STORYWORLD_WORLD_R74__;
 window.__STORYWORLD_WORLD_R74__=Object.freeze({...nativeDoors,
  isOpen(r,d){return hospital(r)&&state(r)&&!doorPhaseOpen(d.id,state(r))?false:nativeDoors.isOpen(r,d);},
  canUse(t,p=player){if(hospital(room)&&state()&&['door-0','door-2'].includes(t?.id)&&!doorIntent)return !modal&&!loading&&p?.hp>0&&distance(p,door(t.id))<3.2;return nativeDoors.canUse(t,p);},
  use(t){if(hospital(room)&&state()&&['door-0','door-2'].includes(t?.id)&&!doorIntent)return interact();return nativeDoors.use(t);}
 });
 const interactBase=interact;interact=function(...a){
  if(!hospital(room)||!state())return interactBase.apply(this,a);
  if(!started||modal||loading||player?.hp<=0||!rendererReady())return false;
  const s=state(),g=geometry(),bossDoor=door('door-0'),exitDoor=door('door-2');
  if(exitDoor&&distance(player,exitDoor)<3.2){
   if(['exit','exitStory'].includes(s.phase))return showExitStory();
   if(s.phase==='done'){nativeOpen('door-2');const d=Object.keys(regionById[zone].exits).find(d=>regionById[zone].exits[d]==='ep1a09');return d?travel(d):false;}
   toast('병원 안쪽의 보스를 먼저 제압하세요.',2);return false;
  }
  if(bossDoor&&distance(player,bossDoor)<3.2){
   if(['door','doorStory'].includes(s.phase))return showDoorStory();
   if(!doorPhaseOpen('door-0',s)){toast('중간보스와 집결한 생존 적을 모두 제압하세요.',3);return false;}
   if(!nativeDoors.isOpen(room,bossDoor))return nativeOpen('door-0');
   toast('열린 문으로 들어가세요.',2);return true;
  }
  if(s.phase==='done'&&distance(player,g.exit)<2.7){const d=Object.keys(regionById[zone].exits).find(d=>regionById[zone].exits[d]==='ep1a09');return d?travel(d):false;}
  // Preserve the entry return portal and the remaining ordinary ward door.
  const previous=Object.keys(regionById[zone].exits).find(d=>regionById[zone].exits[d]==='dist06');
  if(previous&&distance(player,exitPoint(previous))<2.6)return travel(previous);
  const ward=door('door-1');if(ward&&distance(player,ward)<ward.reach)return nativeDoors.use({id:ward.id});
  toast(s.phase==='route'?'1번 또는 2번 미로를 돌파해 중앙 준비실로 향하세요.':s.phase==='rally'?'집결한 적과 중간보스를 모두 제압하세요.':s.phase==='boss'?'보스방의 감독과 집도의를 모두 제압하세요.':'문 앞에서 E를 눌러 기억을 확인하세요.',3);return false;
 };
 const travelBase=travel;travel=async function(d,...a){
  if(!hospital(room)||!state()||regionById[zone]?.exits[d]!=='ep1a09')return travelBase.call(this,d,...a);
  if(!started||modal||loading||player?.hp<=0||!rendererReady()||transitionCD>0||window.__STORYWORLD_SAVE_SLOTS_R73__?.transitioning())return false;
  if(state().phase!=='done'){toast('주사실 문에서 병원의 기억을 마무리하세요.',3);return false;}
  const g=geometry(),near=distance(player,g.exit)<3||distance(player,door('door-2'))<3.2;
  if(!near||!canTravel()||!completed(zone))return false;
  return enterRegion('ep1a09',opposite[d],{r72Portal:'next',layer});
 };
 const resumeBase=resumeScene3;resumeScene3=function(...a){const s=state();if(hospital(room)&&s?.phase==='doorStory')return showDoorStory();if(hospital(room)&&s?.phase==='exitStory')return showExitStory();return resumeBase.apply(this,a);};
 const tickBase=tick;tick=function(dt,...a){
  const before=time,result=tickBase.call(this,dt,...a);
  if(time<=before||modal||loading||player?.hp<=0||!hospital(room))return result;
  seed(room);const s=state(),g=geometry();
  if(s.phase==='route'){
   if(s.route===null&&player.y<104){const chosen=g.routeFor(player.x,player.y);if(chosen===1||chosen===2){s.route=chosen;note('route-selected',{route:chosen});saveGame(false);}}
   if(distance(player,g.merge)<=g.merge.radius){if(s.route===null)s.route=g.routeFor(player.x,player.y)||1;rally();}
  }else if(s.phase==='rally'){room.engaged=true;settle();}
  else if(s.phase==='boss'){const b=g.bossBounds;if(player.x>b[0]+.5&&player.x<b[2]-.5&&player.y>b[1]+.5&&player.y<b[3]-.5)beginBoss();settle();}
  return result;
 };
 const hudBase=updateHUD;updateHUD=function(...a){const result=hudBase.apply(this,a);if(!started||!hospital(room)||!state())return result;const s=state(),remaining=room.enemies.filter(e=>living(e)&&!bossRoomActor(e)).length;
  const labels={route:'1·2번 미로 돌파 · 중앙 준비실로 이동',rally:'중간보스와 집결한 적 섬멸 · 남은 적 '+remaining,door:'전투실 문 앞 E · 기억 확인',doorStory:'전투실의 기억 확인',boss:'보스방의 감독과 집도의 모두 처치',exit:'주사실 문 앞 E · 다음 기억으로',exitStory:'병원의 기억 마무리',done:'주사실 ↔ 병원 · 입구에서 E로 왕복'};
  if($('questText'))$('questText').textContent=labels[s.phase];return result;};
 const saveBase=serializeSave;serializeSave=function(...a){for(const r of new Set([...Object.values(world||{}),room]))normalizeChampionHealth(r);const raw=saveBase.apply(this,a),rooms={};for(const r of new Set([...Object.values(world||{}),room]))if(hospital(r)&&state(r))rooms[layerKey(r.id,r.layer)]=copy(state(r));raw.hospitalMazeR1={version:VERSION,rooms};return raw;};
 const saveGameBase=saveGame;saveGame=function(...a){return restoring?false:saveGameBase.apply(this,a);};
 const restoreBase=restoreSave;restoreSave=async function(raw,...a){
  if(raw?.hospitalMazeR1!==undefined){if(![1,VERSION].includes(raw.hospitalMazeR1?.version)||!raw.hospitalMazeR1.rooms||Object.keys(raw.hospitalMazeR1.rooms).some(k=>k!=='STORY:ep1a08'))throw Error('병원 미로 저장 형식이 올바르지 않습니다.');for(const v of Object.values(raw.hospitalMazeR1.rooms))clean(v);}
  // The progression ledger owns these two locked doors. Reconcile a copy so
  // loaded actor collision, projectile walls and rendered doors agree.
  const savedState=raw?.hospitalMazeR1?.rooms?.['STORY:ep1a08'];let input=raw;
  if(savedState&&raw.worldR74?.version===1){const ids=new Set(raw.worldR74.opened?.['STORY:ep1a08']||[]);for(const id of ['door-0','door-2']){if(doorPhaseOpen(id,savedState))ids.add(id);else ids.delete(id);}input={...raw,worldR74:{...raw.worldR74,entries:{...raw.worldR74.entries,'STORY:ep1a08':1},opened:{...raw.worldR74.opened,'STORY:ep1a08':[...ids]}}};}
  const prior=pending;pending=input;restoring++;let result;
  try{result=await restoreBase.call(this,input,...a);if(result===false)return result;
   for(const r of new Set([...Object.values(world||{}),room]))if(hospital(r)){
    seed(r);const saved=raw.hospitalMazeR1?.rooms?.[layerKey(r.id,r.layer)];if(saved)states.set(r,clean(saved));
    // The native loader owns HP/difficulty migration. Restore spatial group
    // ownership only, since route guards no longer belong to sequential waves.
    const old=raw.rooms?.[layerKey(r.id,r.layer)],rows=old?.enemies||[];
    for(const e of r.enemies){const row=rows.find(v=>v.id===e.id);if(row&&Number.isFinite(row.x+row.y)&&!blocked(row.x,row.y,e.combatProfile?.bodyBlock?.r||.3,r)){e.x=e.homeX=row.x;e.y=e.homeY=row.y;}if(ordinaryActor3(e)){delete e.fieldWaveIndex6;e.spawnState=living(e)?'active':'dead';}}
    if(state(r).phase==='done'){r.enemies=r.enemies.filter(e=>!living(e));r.engaged=false;}
    if(saved?.version===1&&['boss','exit','exitStory','done'].includes(state(r).phase)){
     // Imported v1 runs have already cleared the field. Newly introduced
     // champions must not appear behind the player after that checkpoint.
     const introduced=e=>e.mazeEliteR2&&!rows.some(v=>v.id===e.id);r.defeatedActorIds??=new Set();for(const e of r.enemies)if(introduced(e))r.defeatedActorIds.add(e.id);
     r.enemies=r.enemies.filter(e=>!introduced(e));
    }
    if(['route','rally','door','doorStory'].includes(state(r).phase)){
     r.enemies.filter(bossRoomActor).forEach((e,i)=>{if(!living(e))return;setPoint(e,geometry().bossSpawns[i%geometry().bossSpawns.length]);e.spawnState='hidden';});
    }
    if(saved?.version===1&&state(r).phase==='rally'&&r===room){state(r).phase='route';rally();}
    normalizeChampionHealth(r);
   }
  }finally{restoring--;pending=prior;}
  if(result!==false)saveGame(false);return result;
 };
 window.__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__=Object.freeze({revision:'hospital-maze-progression-r2',seed,clean,settle,inspect:()=>({state:state()?copy(state()):null,ordinary:room?.enemies?.filter(ordinary).map(e=>({id:e.id,elite:e.mazeEliteR2===true,route:e.mazeRouteR1,x:e.x,y:e.y,hp:e.hp,maxHp:e.maxHp}))||[],bosses:room?.enemies?.filter(e=>e.boss||e.midboss).map(e=>({id:e.id,hp:e.hp,maxHp:e.maxHp,spawnState:e.spawnState}))||[],events:[...events],browserVerified:false,GPUVerified:false,finalBossId:FINAL_ID})});
})();
