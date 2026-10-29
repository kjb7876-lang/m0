/* R81 ward combat: current hospital routes with canonical per-region actors.
 * The exceptional castle, guardian and fallen-court encounters retain their
 * native progression owners. New champions are explicitly tagged additions. */
(()=>{'use strict';
 const A=window.StoryPhase1,placed=new WeakSet(),states=new WeakMap(),restorePositions=new WeakMap(),events=[],SPECIAL=new Set(['hando01','hando02','hando03','kair02','kair03','last301','cult04']);
 const metrics={rooms:0,ordinaryMoved:0,midbossMoved:0,bossMoved:0,unplaced:0,champions:0,rallies:0,restores:0};
 const mode=()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off',copy=x=>JSON.parse(JSON.stringify(x));
 const alive=e=>!!e&&e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead',major=e=>!!e&&(e.boss||e.midboss)&&!e.wardChampionR81;
 const coreRadius=e=>Math.max(.2,Number(e?.combatProfile?.bodyBlock?.r)||Number(e?.radius)||.3);
 const eligible=r=>mode()==='off'&&r?.layer==='STORY'&&!!r.exploration?.worldWardR81&&!r.egoVisitId151;
 // R118: 충돌 검사마다 기록 목록을 다시 훑던 부분을 지역별로 한 번만 계산한다(한 틱 1,500회 넘게 불림).
 const plainRegion=new Map(),plain=id=>{let v=plainRegion.get(id);if(v===undefined){v=!SPECIAL.has(id)&&!(regionById[id]?.records||[]).some(v=>v.firstPost&&v.awakenPre);plainRegion.set(id,v);}return v;};
 const controlled=r=>eligible(r)&&plain(r.id)&&!['trial','cosmic','persona','finalBoss'].includes(r.activeEncounter),field=e=>alive(e)&&!major(e)&&!e.persona&&!e.trial&&!e.cosmic&&!e.r61Summoned&&!e.r61Clone;
 const note=(kind,data={})=>{events.push({kind,at:typeof time==='number'?time:0,...data});if(events.length>80)events.shift();};
 const phases=['route','rally','door','doorStory','boss','exit','exitStory','done'];let pending=null,restoring=0,doorIntent=false;
 function clean(v){
  if(!v||v.version!==1||!phases.includes(v.phase)||![null,1,2].includes(v.route)||!Array.isArray(v.rallied)||v.rallied.length>64||v.rallied.some(id=>typeof id!=='string'||id.length>180)||typeof v.doorStoryDone!=='boolean'||typeof v.exitStoryDone!=='boolean')throw Error('구역 미로 진행 저장이 올바르지 않습니다.');
  const champions=v.champions||[];if(!Array.isArray(champions)||champions.length>12||new Set(champions.map(e=>e?.id)).size!==champions.length||champions.some(e=>!e||typeof e.id!=='string'||e.id.length>180||!Number.isFinite(e.hp)||!Number.isFinite(e.maxHp)||e.maxHp<=0||e.maxHp>1e12||e.hp<0||e.hp>e.maxHp||!Number.isFinite(e.x+e.y)||Math.abs(e.x)>200||Math.abs(e.y)>200))throw Error('중간보스 저장 수치가 올바르지 않습니다.');
  return{version:1,phase:v.phase,route:v.route,rallied:[...new Set(v.rallied)],doorStoryDone:v.doorStoryDone,exitStoryDone:v.exitStoryDone,champions:champions.map(e=>({id:e.id,hp:e.hp,maxHp:e.maxHp,x:e.x,y:e.y,deadRecorded:e.deadRecorded===true,spawnState:['active','hidden','dead','awakening'].includes(e.spawnState)?e.spawnState:'active'}))};
 }
 function state(r=room){return states.get(r)||null;}
 function door(id,r=room){return r?.exploration?.worldR74?.doors?.find(d=>d.id===id);}
 function phaseOpen(id,s=state(),r=room){if(!s)return true;if(id===r.exploration.bossDoorId)return['boss','exit','exitStory','done'].includes(s.phase);if(id==='door-2')return['exit','exitStory','done'].includes(s.phase);return true;}
 function safe(r,e,p,used=[]){const radius=coreRadius(e)+.12;return p&&Number.isFinite(p.x+p.y)&&!blocked(p.x,p.y,radius,r)&&used.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>radius+(q.radius||.35)+.18);}
 function choose(r,e,center,index=0,used=[]){const candidates=[center];for(let ring=1;ring<=14;ring++)for(let step=0;step<16;step++){const a=index*.73+step*Math.PI/8,d=ring*.35;candidates.push({x:center.x+Math.cos(a)*d,y:center.y+Math.sin(a)*d});}return candidates.find(p=>safe(r,e,p,used))||null;}
 function setPosition(e,p){e.x=e.homeX=p.x;e.y=e.homeY=p.y;e.nav=[];e.navAt=typeof time==='number'?time-.6:0;e.stuck=0;e.attack=null;e.rangedWindup=0;e.storyPreparedCast150=null;e.aim=null;e.state='idle';e.cd=Math.max(.8,Number(e.cd)||0);}
 function routeSpots(r){return window.__STORYWORLD_HOSPITAL_MAZE_LAYOUT__?.routeSpawns||{'1':[{x:17,y:94},{x:21,y:63.5},{x:20,y:36}],'2':[{x:70,y:94},{x:59,y:63.5},{x:51,y:36}]};}
 function championHealth(r){if(!controlled(r))return;for(const e of r.enemies||[])if(e.wardChampionR81){const donor=r.enemies.find(a=>!a.wardChampionR81&&!major(a)&&a.nativeId===e.nativeId);if(!donor||!(donor.maxHp>0))continue;const target=donor.maxHp*6,fraction=Math.max(0,Math.min(1,e.hp/Math.max(1,e.maxHp)));e.difficultyBaseHpR63=(donor.difficultyBaseHpR63||donor.maxHp)*6;e.difficultyFactorR63=donor.difficultyFactorR63||1;if(e.maxHp!==target){e.maxHp=target;e.hp=target*fraction;}}}
 function addChampions(r,ordinary,used){
  // Imported V4 rooms keep their existing encounter population; newly visited
  // maps gain champions. A V5 save always recreates their deterministic IDs.
  const old=pending?.rooms?.[layerKey(r.id,r.layer)],saved=pending?.worldMazeR81?.rooms?.[layerKey(r.id,r.layer)];
  if(old&&!saved)return;
  const donors=[...new Map(ordinary.filter(e=>e.nativeId).map(e=>[e.nativeId,e])).values()],anchors=r.exploration.worldWardR81.fieldAnchors;
  if(donors.length>12)throw Error('R81 ordinary-kind champion budget exceeded: '+r.id);
  for(let i=0;i<donors.length;i++){
   const donor=donors[i],id=r.id+':ward-champion-r81:'+donor.nativeId;if(r.enemies.some(e=>e.id===id))continue;
   const e=actor3(donor.profile,id,donor.x,donor.y,false,r.layer,regionById[r.id]);
   Object.assign(e,{nativeId:donor.nativeId,name:'중간보스 · '+donor.name.replace(/ 증원| 추격대| 후속 증원/g,''),profile:donor.profile,path:donor.path,weapon:donor.weapon,ai:donor.ai,
    sourcePlan6:donor.sourcePlan6,sourcePlanId6:donor.sourcePlanId6,sourceKind6:donor.sourceKind6,wardChampionR81:true,r61PreserveHealth:true,
    damage:donor.damage,difficultyBaseHpR63:(donor.difficultyBaseHpR63||donor.maxHp)*6,difficultyFactorR63:donor.difficultyFactorR63||1,
    maxHp:donor.maxHp*6,hp:donor.maxHp*6,defScale:donor.defScale*2,combatProfile:copy(donor.combatProfile)});
   window.__STORYWORLD_SCALE_MELEE_R61__?.normalize(e,r,{preserveHealth:true,preserveDamage:true});
   e.defScale=donor.defScale*2;e.wardChampionScaleR81=e.defScale;
   e.combatProfile.bodyBlock.r=donor.combatProfile.bodyBlock.r*2;e.combatProfile.hurtbox.r=donor.combatProfile.hurtbox.r*2;e.radius=e.combatProfile.hurtbox.r;
   const route=i%2+1,preferred=anchors[i%anchors.length],p=choose(r,e,preferred,i,used);if(!p)throw Error('R81 champion placement blocked: '+id);
   setPosition(e,p);used.push({...p,radius:coreRadius(e)});e.wardRouteR81=route;e.spawnState='active';e.explorationLeash=12;e.explorationGroup=r.id+':ward-route:'+route+':champion';delete e.fieldWaveIndex6;r.enemies.push(e);metrics.champions++;
  }
 }
 function placeRoom(r){if(!eligible(r)||placed.has(r))return r;placed.add(r);
  const spec=r.exploration.worldR78,normal=controlled(r),saved=pending?.worldMazeR81?.rooms?.[layerKey(r.id,r.layer)];
  if(normal){const old=pending?.rooms?.[layerKey(r.id,r.layer)];states.set(r,saved?clean(saved):{version:1,phase:r.cleared||completed(r.id,r.layer)?'done':old?.engaged?'boss':'route',route:null,rallied:[],doorStoryDone:!!old?.engaged,exitStoryDone:false});}
  const s=state(r);if(s?.phase==='done')return r;
  const majors=(r.enemies||[]).filter(e=>alive(e)&&major(e)),used=[],bossPoints=[{x:16,y:10},{x:24,y:13},{x:20,y:8},{x:13,y:15},{x:23,y:16}];
  majors.forEach((e,i)=>{const p=choose(r,e,bossPoints[i%bossPoints.length],i,used);if(!p){metrics.unplaced++;throw Error('R81 major placement blocked: '+r.id+':'+e.id);}setPosition(e,p);used.push({...p,radius:coreRadius(e)});if(normal&&!['boss','exit','exitStory','done'].includes(s.phase))e.spawnState='hidden';if(e.boss)metrics.bossMoved++;else metrics.midbossMoved++;});
  const ordinary=(r.enemies||[]).filter(e=>alive(e)&&!major(e)&&!e.persona&&!e.trial&&!e.cosmic&&!e.r61Summoned&&!e.r61Clone&&Number.isInteger(e.r75Pack)),spots=routeSpots(r);
  ordinary.forEach((e,i)=>{const route=i%2+1,points=spots[route],preferred=points[Math.floor(i/2)%points.length],p=choose(r,e,preferred,i,used);if(!p){metrics.unplaced++;throw Error('R81 ordinary placement blocked: '+r.id+':'+e.id);}setPosition(e,p);used.push({...p,radius:coreRadius(e)});e.wardRouteR81=route;
   if(normal){e.spawnState='active';delete e.fieldWaveIndex6;e.explorationGroup=r.id+':ward-route:'+route+':'+Math.floor(i/4);e.explorationLeash=12;}
   metrics.ordinaryMoved++;
  });
  if(normal){addChampions(r,ordinary,used);r.fieldWaveIndex6=r.fieldWaves6?.length||0;r.fieldWaveCleared6=false;}
  if(pending)restorePositions.set(r,new Map(r.enemies.map(e=>[e.id,{x:e.x,y:e.y}])));
  metrics.rooms++;r.worldCombatR78={version:2,zoneId:r.id,routeNodeIds:[...spec.routeNodeIds],routeBranches:spec.routeBranches.map(a=>[...a]),bossRoomNodeId:spec.bossRoomNodeId,ordinaryMoved:ordinary.length,midbossCount:majors.filter(e=>!e.boss).length,bossCount:majors.filter(e=>e.boss).length,exception:SPECIAL.has(r.id),championCount:r.enemies.filter(e=>e.wardChampionR81).length};return r;
 }
 const nativeDoors=window.__STORYWORLD_WORLD_R74__;
 function nativeOpen(id){const d=door(id);if(!d)return false;if(nativeDoors.isOpen(room,d))return true;doorIntent=true;try{return nativeDoors.use({id:d.id,kind:'door',point:{x:d.x,y:d.y},reach:d.reach});}finally{doorIntent=false;}}
 function rally(){const s=state();if(!controlled(room)||s?.phase!=='route')return false;const rows=room.enemies.filter(field),spots=window.__STORYWORLD_HOSPITAL_MAZE_LAYOUT__?.rally||[],used=[{x:player.x,y:player.y,radius:.5}];
  const moves=rows.map((e,i)=>{const preferred=spots[i%spots.length]||{x:12+(i%7)*3,y:31.5+Math.floor(i/7)*3},p=choose(room,e,preferred,i,used);if(!p)throw Error('R81 rally placement blocked: '+e.id);used.push({...p,radius:coreRadius(e)});return{e,p};});
  for(const{e,p}of moves){setPosition(e,p);e.spawnState='active';e.explorationLeash=28;e.explorationGroup=room.id+':ward-rally';e.graceUntil=time+1.1;}
  s.phase='rally';s.rallied=rows.map(e=>e.id);room.engaged=true;room.encounterStage='active';room.activeEncounter='midboss';room.fieldWaveCleared6=false;metrics.rallies++;
  note('rally',{zone:room.id,survivors:rows.length,oppositeSurvivors:rows.filter(e=>e.wardRouteR81!==s.route).length});toast('다른 길의 생존 적들이 중앙 전투실에 집결했습니다.',4);saveGame(false);settle();return true;
 }
 function settle(){const s=state();if(!controlled(room)||!s)return;
  if(['route','rally'].includes(s.phase)&&!room.enemies.some(field)){s.phase='door';room.engaged=false;room.finalizing=false;room.encounterStage='bossReady';room.activeEncounter='';room.fieldWaveCleared6=true;note('field-cleared',{zone:room.id});saveGame(false);}
  else if(s.phase==='boss'&&!room.enemies.some(e=>major(e)&&alive(e))){s.phase='exit';room.engaged=false;room.finalizing=false;room.encounterStage='bossReady';room.activeEncounter='';note('boss-cleared',{zone:room.id});saveGame(false);}
 }
 function showDoorStory(){const r=room,s=state();if(!s||!['door','doorStory'].includes(s.phase))return false;s.phase='doorStory';r.engaged=false;r.finalizing=false;
  const finish=()=>{if(room!==r||!controlled(r))return;s.doorStoryDone=true;s.phase='boss';r.finalizing=false;r.sceneCheckpoint=null;nativeOpen(r.exploration.bossDoorId);saveGame(false);};
  playScenes(nextScenes(regionById[zone],'pre').filter(v=>!readScenes.has(v.key)),finish);if(r.sceneCheckpoint)r.sceneCheckpoint.worldMazeR81Action='boss-door';return true;
 }
 function beginBoss(){const s=state();if(!s||s.phase!=='boss')return;const rows=room.enemies.filter(e=>major(e)&&alive(e)&&e.spawnState==='hidden');if(rows.length){room.engaged=false;summon3(rows,'boss');}settle();}
 function showExitStory(){const r=room,s=state();if(!s||!['exit','exitStory'].includes(s.phase))return false;s.phase='exitStory';r.engaged=false;r.finalizing=false;
  const finish=()=>{if(room!==r||!controlled(r))return;s.phase='done';s.exitStoryDone=true;r.finalizing=false;r.sceneCheckpoint=null;nativeOpen('door-2');completeRegion(zone);saveGame(false);};
  playScenes(nextScenes(regionById[zone],'post').filter(v=>!readScenes.has(v.key)),finish);if(r.sceneCheckpoint)r.sceneCheckpoint.worldMazeR81Action='exit-door';return true;
 }
 const makeBase=makeRoom;makeRoom=function(...a){const r=makeBase.apply(this,a),ego=window.__STORYWORLD_EGO151__?.inspect?.().state;if(ego?.active&&(!egoRoom151||egoRoom151.egoVisitId151!==ego.visitId))return r;return placeRoom(r);};
 const narrativeBase=enterNarrative;enterNarrative=function(def,...a){if(controlled(room)&&state()&&['route','rally','door','doorStory'].includes(state().phase))return;return narrativeBase.apply(this,[def,...a]);};
 const finishBase=finishEncounter;finishEncounter=function(...a){if(controlled(room)&&state()){settle();return;}return finishBase.apply(this,a);};
 const killBase=killEnemy;killEnemy=function(...a){const result=killBase.apply(this,a);if(controlled(room)&&state())settle();return result;};
 const summonBase=summon3;summon3=function(rows,...a){if(controlled(room)&&state()&&state().phase!=='boss'&&rows?.some(major))return false;return summonBase.apply(this,[rows,...a]);};
 const blockedBase=blocked;blocked=function(x,y,r=.27,where=room){const s=state(where);if(controlled(where)&&s)for(const id of [where.exploration.bossDoorId,'door-2']){const d=door(id,where);if(d&&!phaseOpen(id,s,where)&&Math.abs(x-d.x)<d.width/2+r&&Math.abs(y-d.y)<d.depth/2+r)return true;}return blockedBase.apply(this,arguments);};
 window.__STORYWORLD_WORLD_R74__=Object.freeze({...nativeDoors,
  isOpen(r,d){return controlled(r)&&state(r)&&!phaseOpen(d?.id,state(r),r)?false:nativeDoors.isOpen(r,d);},
  canUse(t,p=player,...a){if(controlled(room)&&state()&&[room.exploration.bossDoorId,'door-2'].includes(t?.id)&&!doorIntent)return !modal&&!loading&&p?.hp>0&&distance(p,door(t.id))<3.2;return nativeDoors.canUse(t,p,...a);},
  use(t,...a){if(controlled(room)&&state()&&[room.exploration.bossDoorId,'door-2'].includes(t?.id)&&!doorIntent)return interact();return nativeDoors.use(t,...a);}
 });
 const interactBase=interact;interact=function(...a){if(!controlled(room)||!state())return interactBase.apply(this,a);if(!started||modal||loading||player?.hp<=0)return false;const s=state(),bossDoor=door(room.exploration.bossDoorId),exitDoor=door('door-2');
  if(exitDoor&&distance(player,exitDoor)<3.2){if(['exit','exitStory'].includes(s.phase))return showExitStory();if(s.phase==='done'){nativeOpen('door-2');return interactBase.apply(this,a);}toast('보스 전투를 마치고 이 문에서 기억을 확인하세요.',3);return false;}
  if(bossDoor&&distance(player,bossDoor)<3.2){if(['door','doorStory'].includes(s.phase))return showDoorStory();if(!phaseOpen(bossDoor.id,s)){toast('중앙에 집결한 적과 중간보스를 먼저 제압하세요.',3);return false;}return nativeOpen(bossDoor.id);}
  return interactBase.apply(this,a);
 };
 const resumeBase=resumeScene3;resumeScene3=function(...a){if(controlled(room)&&state()?.phase==='doorStory')return showDoorStory();if(controlled(room)&&state()?.phase==='exitStory')return showExitStory();return resumeBase.apply(this,a);};
 const tickBase=tick;tick=function(dt,...a){const before=time,result=tickBase.call(this,dt,...a);if(time<=before||modal||loading||player?.hp<=0||!controlled(room))return result;placeRoom(room);const s=state(),g=room.exploration.worldWardR81;if(!s)return result;
  if(s.phase==='route'){if(s.route===null&&player.y<104)s.route=player.x<43?1:2;if(distance(player,g.gatherAnchor)<=5.5){s.route??=player.x<43?1:2;rally();}}
  else if(s.phase==='rally'){room.engaged=true;settle();}
  else if(s.phase==='boss'){const b=g.bossBounds;if(player.x>b[0]+.5&&player.x<b[2]-.5&&player.y>b[1]+.5&&player.y<b[3]-.5)beginBoss();settle();}
  return result;
 };
 const hudBase=updateHUD;updateHUD=function(...a){const result=hudBase.apply(this,a);if(started&&controlled(room)&&state()){const s=state(),count=room.enemies.filter(field).length,labels={route:'두 갈래 길 돌파 · 중앙 전투실로 이동',rally:'집결한 생존 적과 중간보스 제압 · '+count,door:'보스 구역 문 앞 E · 기억 확인',doorStory:'보스 구역의 기억 확인',boss:'보스 구역의 원래 보스·중간보스 제압',exit:'출구 문 앞 E · 다음 기억',exitStory:'구역의 기억 마무리',done:'다음 기억 · 입구에서 이전 맵 왕복'};if($('questText'))$('questText').textContent=labels[s.phase];}return result;};
 const enterBase=enterRegion;enterRegion=async function(...a){const result=await enterBase.apply(this,a);if(result!==false){placeRoom(room);championHealth(room);}return result;};
 const saveBase=serializeSave;serializeSave=function(...a){const rooms={};for(const r of new Set([...Object.values(world||{}),room]))if(controlled(r)&&state(r)){championHealth(r);rooms[layerKey(r.id,r.layer)]={...copy(state(r)),champions:r.enemies.filter(e=>e.wardChampionR81).map(e=>({id:e.id,hp:e.hp,maxHp:e.maxHp,x:e.x,y:e.y,spawnState:e.spawnState,deadRecorded:!!e.deadRecorded}))};}const raw=saveBase.apply(this,a);raw.worldMazeR81={version:1,rooms};return raw;};
 const saveGameBase=saveGame;saveGame=function(...a){return restoring?false:saveGameBase.apply(this,a);};
 const restoreBase=restoreSave;restoreSave=async function(raw,...a){const ledger=raw?.worldMazeR81;if(ledger!==undefined){if(ledger.version!==1||!ledger.rooms||Array.isArray(ledger.rooms)||Object.keys(ledger.rooms).length>55)throw Error('구역 미로 저장 형식이 올바르지 않습니다.');for(const[k,v]of Object.entries(ledger.rooms)){if(!/^STORY:[\w-]+$/.test(k)||!regionById[k.slice(6)]||SPECIAL.has(k.slice(6)))throw Error('구역 미로 저장 지역이 올바르지 않습니다.');clean(v);}}
  let input=raw;if(ledger&&raw.worldR74?.version===1){input={...raw,worldR74:{...raw.worldR74,entries:{...raw.worldR74.entries},opened:{...raw.worldR74.opened}}};for(const[k,s]of Object.entries(ledger.rooms)){const ids=new Set(input.worldR74.opened[k]||[]);for(const id of ['door-0','door-2']){const open=id==='door-0'?['boss','exit','exitStory','done'].includes(s.phase):['exit','exitStory','done'].includes(s.phase);if(open)ids.add(id);else ids.delete(id);}input.worldR74.entries[k]=1;input.worldR74.opened[k]=[...ids];}}
  const prior=pending;pending=input;restoring++;let result;
  try{result=await restoreBase.call(this,input,...a);if(result===false)return result;for(const r of new Set([...Object.values(world||{}),room]))if(eligible(r)){placeRoom(r);const saved=ledger?.rooms?.[layerKey(r.id,r.layer)];if(saved)states.set(r,clean(saved));const rows=raw.rooms?.[layerKey(r.id,r.layer)]?.enemies||[];
    for(const e of r.enemies){const old=rows.find(v=>v.id===e.id);if(ledger!==undefined&&old&&Number.isFinite(old.x+old.y)&&!blocked(old.x,old.y,coreRadius(e),r)){e.x=old.x;e.y=old.y;e.homeX=Number.isFinite(old.homeX)?old.homeX:old.x;e.homeY=Number.isFinite(old.homeY)?old.homeY:old.y;}else if(old){const seeded=restorePositions.get(r)?.get(e.id);if(seeded&&!blocked(seeded.x,seeded.y,coreRadius(e),r)){e.x=e.homeX=seeded.x;e.y=e.homeY=seeded.y;}}
     if(controlled(r)&&!major(e)&&!e.r61Summoned&&!e.r61Clone){delete e.fieldWaveIndex6;e.spawnState=alive(e)?'active':'dead';}
    }
    const s=state(r);if(s&&['route','rally','door','doorStory'].includes(s.phase))for(const e of r.enemies.filter(major))if(alive(e))e.spawnState='hidden';
    championHealth(r);
    // The native room loader deliberately caps its ordinary rows at 40.
    // Champions have a separate bounded snapshot, so no type is dropped and
    // no truncated row returns at full health after a cold restore.
    for(const row of s?.phase==='done'?[]:saved?.champions||[]){const e=r.enemies.find(e=>e.wardChampionR81&&e.id===row.id);if(!e){if(row.deadRecorded||row.hp<=0||r.defeatedActorIds?.has(row.id))continue;throw Error('저장된 중간보스 원형을 찾지 못했습니다.');}e.hp=e.maxHp===row.maxHp?row.hp:e.maxHp*Math.max(0,Math.min(1,row.hp/row.maxHp));e.deadRecorded=row.deadRecorded||e.hp<=0;e.spawnState=e.deadRecorded?'dead':row.spawnState;if(!blocked(row.x,row.y,coreRadius(e),r)){e.x=e.homeX=row.x;e.y=e.homeY=row.y;}}
    if(s?.phase==='done'){r.enemies=r.enemies.filter(e=>!alive(e));r.engaged=false;}
    metrics.restores++;
   }}finally{restoring--;pending=prior;}if(result!==false)saveGame(false);return result;
 };
 window.__STORYWORLD_WORLD_COMBAT_R78__=Object.freeze({placeRoom,rally,settle,beginBoss,clean,state:r=>state(r)?copy(state(r)):null,controlled,championHealth,inspect:()=>({version:2,metrics:{...metrics},state:state()?copy(state()):null,exceptions:[...SPECIAL],events:[...events],scope:'solo story ward maze; canonical actor data plus explicitly tagged 2x/6x champions',browser:false,GPU:false})});
})();
