/* Goal-driven guidance owns only the route/command it issued. Manual input
 * and OFF never discard a replacement path issued by the player. */
(()=>{'use strict';
 let ownedRoute=null,ownedCommand=null,wasOn=false,lastRoom=null,nextPlan=0,lastDoor=-1,stuckAt=0,lastPosition=null,goalKey='';
 const events=[],metrics={plans:0,blocked:0,interactions:0,doorReplans:0};
 const mode=()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off',egoVisit=()=>window.__STORYWORLD_EGO151__?.inspect?.()?.isVisit===true;
 const note=(kind,detail={})=>{events.push({kind,at:time,...detail});if(events.length>64)events.shift();};
 function clear(reason){if(route===ownedRoute)route=[];if(command===ownedCommand)command=null;if(target===ownedCommand)target=null;ownedRoute=null;ownedCommand=null;goalKey='';nextPlan=0;lastPosition=null;window.__STORYWORLD_MOBILE_R74__?.cancel('guide-'+reason);note('clear',{reason});}
 function currentGoal(){if(!started||!room||!player||player.hp<=0||mode()==='guest')return null;const def=regionById[zone],r75=window.__STORYWORLD_NARRATIVE_R75__?.record(zone),label=r75?.objective||'기억 표식';
  if(!completed(zone)&&storyReady(def)){
   const scripted=window.__STORYWORLD_OBJECTIVES_R75__?.goal();if(scripted)return scripted;
   const needField=!def.safe&&!prerequisites3(),active=(room.enemies||[]).filter(e=>e.hp>0&&!e.deadRecorded&&e.spawnState==='active'&&(!e.boss&&!e.midboss||room.engaged));
   if(room.engaged||needField){const rows=active.filter(e=>!needField||!e.boss&&!e.midboss).sort((a,b)=>distance(player,a)-distance(player,b));if(rows.length)return{kind:'enemy',id:rows[0].id,point:rows[0],label:needField?'침식된 명령의 봉인 해제':label};if(room.engaged)return{kind:'wait',id:'summoning',label:'소환의 실체화 기다리기'};}
   return{kind:'objective',id:'objective',point:room.objective,reach:2.45,label};
  }
  const api=window.__STORYWORLD_ROUTES_R72__,order=window.__STORYWORLD_STORY_PROFILE_R54__.campaignOrder,pending=firstPending(),role=pending&&order.indexOf(pending.id)<order.indexOf(zone)?'previous':'next';
  const direction=api?.visibleDirections().find(d=>api.status(d).role===role),status=direction&&api.status(direction);return status?.open?{kind:'portal',id:'portal:'+direction,direction,point:status.point,reach:.75,label:role==='next'?'다음 서사 맵으로':'앞선 서사 맵으로'}:null;
 }
 function navigate(goal){if(!goal?.point)return false;const currentDoor=window.__STORYWORLD_WORLD_R74__?.generation?.()||0,key=goal.kind+':'+goal.id;
  if(lastRoom!==room||lastDoor!==currentDoor||goalKey!==key){if(lastDoor!==currentDoor)metrics.doorReplans++;if(route===ownedRoute)route=[];lastRoom=room;lastDoor=currentDoor;goalKey=key;}
  const moved=lastPosition?distance(player,lastPosition):Infinity;if(moved>.15){lastPosition={x:player.x,y:player.y};stuckAt=time;}
  if(route===ownedRoute&&route.length&&time-stuckAt<1.2)return true;
  const path=findPath(player,goal.point,room,.31);metrics.plans++;
  if(path.length){route=ownedRoute=path;command=null;ownedCommand=null;return true;}
  // A closed optional door is approached from a safe side, then the same
  // canonical collision/use predicate as touch and keyboard opens it.
  const world=window.__STORYWORLD_WORLD_R74__,doors=(world?.interactions()||[]).filter(t=>t.kind==='door'&&t.label==='문 열기').sort((a,b)=>distance(player,a.point)-distance(player,b.point)).slice(0,3);
  let doorQueries=0;for(const t of doors){if(world.canUse(t)){world.use(t);metrics.interactions++;note('door',{id:t.id});return true;}const plan=StoryInteractionCoreR74.approach(player,t,q=>blocked(q.x,q.y,.31,room),(p,q)=>++doorQueries<=3?findPath(p,q,room,.31):[],(p,v)=>v.kind==='door'?world.canUse(v,p):clearPath3(p,v.point,.31,room));if(plan?.path?.length){route=ownedRoute=plan.path;command=null;return true;}}
  metrics.blocked++;return false;
 }
 const guideBase=guideStep;guideStep=function(dt){if(egoVisit())return guideBase.apply(this,arguments);if(!guide||modal||loading||!player||player.hp<=0||mode()==='guest')return;if(window.__STORYWORLD_DANCES_R74__?.moving(player))return;if(time<nextPlan)return;nextPlan=time+.6;const goal=currentGoal();if(!goal)return;
  if(goal.kind==='wait')return;
  if(goal.kind==='enemy'){if(distance(player,goal.point)<8&&clearLine(player,goal.point)){command=ownedCommand=goal.id;target=goal.id;return;}navigate(goal);return;}
  if(distance(player,goal.point)<=goal.reach&&clearPath3(player,goal.point,.2,room)){if(goal.kind==='portal')travel(goal.direction);else interact();metrics.interactions++;note('use',{kind:goal.kind,id:goal.id});return;}
  navigate(goal);
 };
 const tickBase=tick;tick=function(dt,...a){if(wasOn&&!guide)clear('off');wasOn=guide;return tickBase.call(this,dt,...a);};
 for(const key of ['enterRegion','restoreSave','newGame']){const base=key==='enterRegion'?enterRegion:key==='restoreSave'?restoreSave:newGame,wrapped=async function(...a){clear(key);return base.apply(this,a);};if(key==='enterRegion')enterRegion=wrapped;else if(key==='restoreSave')restoreSave=wrapped;else newGame=wrapped;}
 const deathBase=showDeath;showDeath=function(...a){clear('death');return deathBase.apply(this,a);};
 window.__STORYWORLD_GUIDE_R75__=Object.freeze({currentGoal,clear,inspect:()=>({enabled:guide,goal:currentGoal()?.label||null,ownedRoute:route===ownedRoute,metrics:{...metrics},events:[...events]})});
})();
