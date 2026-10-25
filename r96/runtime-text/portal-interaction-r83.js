/* R83: walking and guidance stop at portals; E confirms every crossing.
 * Story doors, NPC interaction, guide path planning and arrival safety remain
 * owned by their existing controllers. No progression or save data is added. */
(()=>{'use strict';
 if(window.__STORYWORLD_PORTAL_INTERACTION_R83__)return;
 let guideDepth=0,waitingKey='';const events=[];
 const note=(kind,detail={})=>{events.push({kind,zone,layer,...detail});if(events.length>48)events.shift();};
 function nearby(){
  if(!started||modal||loading||!player||player.hp<=0)return null;
  const api=window.__STORYWORLD_ROUTES_R72__;
  return (api?.visibleDirections?.()||[]).map(direction=>({direction,...api.status(direction)}))
   .filter(p=>p.open&&p.point&&distance(player,p.point)<2.1&&clearPath3(player,p.point,.31,room))
   .sort((a,b)=>distance(player,a.point)-distance(player,b.point))[0]||null;
 }
 function waitForKey(direction){
  const key=layer+':'+zone+':'+direction;
  route=[];command=null;
  if(waitingKey!==key){waitingKey=key;note('guide-waits-for-interaction',{direction});toast('포탈 앞에 도착했습니다. E를 눌러 이동하세요.',3);}
  if($('hint'))$('hint').textContent='포탈 · E를 눌러 이동';
  return false;
 }
 // Every legacy guide implementation (including EGO) dispatches travel inside
 // this synchronous guideStep call. Block that dispatch, not the guide itself.
 const travelBase=travel;travel=async function(direction,...args){
  if(guideDepth>0)return waitForKey(direction);
  waitingKey='';return travelBase.call(this,direction,...args);
 };
 // The R74 generic door handler otherwise consumes E beside a completed
 // exit: the ward handler opens door-2 and the generic handler closes it again
 // before the R72 portal gets the event. Only an already-admitted portal gets
 // priority; locked boss/story doors continue through their existing chain.
 const interactBase=interact;interact=function(...args){
  const portal=nearby();
  if(portal)return guideDepth>0?waitForKey(portal.direction):travel(portal.direction);
  return interactBase.apply(this,args);
 };
 const guideBase=guideStep;guideStep=function(...args){
  if(guide&&!modal&&!loading&&player?.hp>0){
   const goal=window.__STORYWORLD_GUIDE_R75__?.currentGoal?.();
   if(goal?.kind==='portal'&&goal.point&&distance(player,goal.point)<=goal.reach&&clearPath3(player,goal.point,.2,room))return waitForKey(goal.direction);
  }
  waitingKey='';
  guideDepth++;
  try{return guideBase.apply(this,args);}finally{guideDepth--;}
 };
 const hudBase=updateHUD;updateHUD=function(...args){
  const result=hudBase.apply(this,args),portal=nearby();
  if(portal&&$('hint'))$('hint').textContent='포탈 · E를 눌러 이동 · '+(regionById[portal.destination]?.title||'다음 지역');
  return result;
 };
 if($('miniLabel'))$('miniLabel').textContent='포탈 앞에서 E · 이동';
 window.__STORYWORLD_PORTAL_INTERACTION_R83__=Object.freeze({
  revision:'R83-EXPLICIT-PORTALS',nearby,
  inspect:()=>({requiresInteraction:true,guideWalks:true,guideCrossesPortals:false,waitingForKey:!!waitingKey,events:[...events]})
 });
})();
