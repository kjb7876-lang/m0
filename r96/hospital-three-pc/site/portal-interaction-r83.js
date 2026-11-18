/* R83: walking and guidance stop at portals; E confirms every crossing.
 * Story doors, NPC interaction, guide path planning and arrival safety remain
 * owned by their existing controllers. No progression or save data is added. */
(()=>{'use strict';
 if(window.__STORYWORLD_PORTAL_INTERACTION_R83__)return;
 let guideDepth=0,waitingKey='';const events=[];
 // R1131 (2026-11-18, 사용자 "4개다 개선"): 길잡이가 포탈 앞에서 사람 C 를 끝없이 기다리면 '자동 진행'이 멈춘 것처럼 보였다.
 //  길잡이가 켜진 채 같은 포탈 앞에서 AUTO_DELAY 게임초 기다리면 스스로 건넌다. C 는 그 전에 눌러도 바로 건넌다.
 //  끄기: localStorage storyworld.guidePortalAuto='0' (예전 R83 처럼 C 를 기다림). 거절되면 4초 뒤 다시 시도.
 //  길잡이가 실제로 걸어서 데려온 때만 건넌다: 순간이동(불러오기·지역 도착·스크립트 배치)은 걸은 거리를 0 으로 되돌리므로
 //  포탈 위에 놓였을 뿐이면 예전처럼 C 를 기다린다(qa/r83 기대 유지).
 const AUTO_DELAY=1.2,AUTO_RETRY=4,AUTO_WALK=1,JUMP=1.5;let sinceKey='',waitSince=0,lastDir='',autoAt=-1e9,lastPos=null,walked=0,lastZone='';
 function track(){if(!guide||!player){lastPos=null;walked=0;return;}const z=layer+':'+zone,p={x:player.x,y:player.y};
  const d=lastPos&&lastZone===z?Math.hypot(p.x-lastPos.x,p.y-lastPos.y):Infinity;lastPos=p;lastZone=z;
  if(!(d<=JUMP))walked=0;else walked+=d;}
 function autoOn(){try{return localStorage.getItem('storyworld.guidePortalAuto')!=='0';}catch(_){return true;}}
 function autoDue(){return !!waitingKey&&autoOn()&&walked>=AUTO_WALK&&guide&&!modal&&!loading&&player?.hp>0&&time-waitSince>=AUTO_DELAY&&time-autoAt>=AUTO_RETRY;}
 function autoCross(direction){autoAt=time;walked=0;note('guide-auto-crosses',{direction});waitingKey='';sinceKey='';return travelBase.call(null,direction);}
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
  route=[];command=null;lastDir=direction;
  if(sinceKey!==key){sinceKey=key;waitSince=time;}
  if(waitingKey!==key){waitingKey=key;note('guide-waits-for-interaction',{direction});const k=(typeof KR291!=='undefined'&&KR291?KR291.i:'C');
   toast(autoOn()?'포탈 앞에 도착했습니다. 잠시 뒤 자동으로 이동합니다('+k+': 바로 이동).':'포탈 앞에 도착했습니다. '+k+'를 눌러 이동하세요.',3);}
  if($('hint'))$('hint').textContent='포탈 · '+(typeof KR291!=='undefined'&&KR291?KR291.i:'C')+'를 눌러 이동';
  return false;
 }
 // Every legacy guide implementation (including EGO) dispatches travel inside
 // this synchronous guideStep call. Block that dispatch, not the guide itself.
 const travelBase=travel;travel=async function(direction,...args){
  if(guideDepth>0)return waitForKey(direction);
  waitingKey='';sinceKey='';return travelBase.call(this,direction,...args);
 };
 // The R74 generic door handler otherwise consumes E beside a completed
 // exit: the ward handler opens door-2 and the generic handler closes it again
 // before the R72 portal gets the event. Only an already-admitted portal gets
 // priority; locked boss/story doors continue through their existing chain.
 // 2026-11-18 (스토리 사몽 실플레이 dist03): 옛 R61 포탈 층은 제단 근처(중심 2.8~7.7칸)에 자기 포탈 자리를 두고, 그 2.1칸 안에서 C 를 누르면
 //  travel 만 부르고 끝낸다. R72 서사 포탈이 그 이동을 거절하면('보스 처치와 기억 복원이 필요합니다.') 제단 상호작용이 아예 안 불려
 //  제단 1칸 옆에 선 길잡이가 멈췄다. R72 가 연 포탈이 가까이 없고 제단이 손 닿는 거리면, 이번 C 동안만 옛 층이 출구를 못 보게 한다.
 function altarFirst(){try{if(!room?.objective||!['field','fieldReady','bossReady'].includes(room.encounterStage))return false;
  if(Math.hypot(player.x-room.objective.x,player.y-room.objective.y)>2.45)return false;const R=window.__STORYWORLD_ROUTES_R72__;if(!R?.status)return false;
  const def=regionById?.[zone];if(!def?.exits)return false;for(const d of Object.keys(def.exits)){const s=R.status(d);if(s?.open&&s.point&&distance(player,s.point)<2.1)return false;}return true;}catch(_){return false;}}
 const interactBase=interact;interact=function(...args){
  const portal=nearby();
  if(portal)return guideDepth>0?waitForKey(portal.direction):travel(portal.direction);
  if(altarFirst()){const def=regionById[zone],exits=def.exits;events.push({kind:'altar-first',zone,at:time});if(events.length>40)events.shift();
   def.exits={};try{return interactBase.apply(this,args);}finally{def.exits=exits;}}
  return interactBase.apply(this,args);
 };
 const guideBase=guideStep;guideStep=function(...args){
  track();
  if(guide&&!modal&&!loading&&player?.hp>0){
   const goal=window.__STORYWORLD_GUIDE_R75__?.currentGoal?.();
   if(goal?.kind==='portal'&&goal.point&&distance(player,goal.point)<=goal.reach&&clearPath3(player,goal.point,.2,room)){waitForKey(goal.direction);return autoDue()?autoCross(goal.direction):false;}
  }
  waitingKey='';
  guideDepth++;
  let result;
  try{result=guideBase.apply(this,args);}finally{guideDepth--;}
  if(autoDue())return autoCross(lastDir);
  if(!waitingKey)sinceKey='';
  return result;
 };
 const hudBase=updateHUD;updateHUD=function(...args){
  const result=hudBase.apply(this,args),portal=nearby();
  if(portal&&$('hint'))$('hint').textContent='포탈 · '+(typeof KR291!=='undefined'&&KR291?KR291.i:'C')+'를 눌러 이동 · '+(regionById[portal.destination]?.title||'다음 지역');
  return result;
 };
 if($('miniLabel'))$('miniLabel').textContent='포탈 앞에서 '+(typeof KR291!=='undefined'&&KR291?KR291.i:'C')+' · 이동';
 window.__STORYWORLD_PORTAL_INTERACTION_R83__=Object.freeze({
  revision:'R83-EXPLICIT-PORTALS',nearby,
  inspect:()=>({requiresInteraction:!autoOn(),guideWalks:true,guideCrossesPortals:autoOn(),autoDelay:AUTO_DELAY,waitingForKey:!!waitingKey,events:[...events]})
 });
})();
