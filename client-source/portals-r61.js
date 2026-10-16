/* R61: discoverable center-near physical portals. The original campaign route,
 * chapter admission, completion, EGO and revisit ledgers own eligibility.
 * No floor, wall, encounter, completion or reward data is changed here. */
(()=>{'use strict';
 if(window.__STORYWORLD_PORTALS_R61__)return;
 const native=window.__STORYWORLD_REGION_ROUTES__;
 if(!native)throw Error('R61 portals require the native regional route controller');
 const vectors={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]},placements=new WeakMap(),otherRooms=new Map();
 const nativeTravel=travel,nativeInteract=interact,nativeSpawn=spawnPoint,nativeGuide=guideStep,nativeHUD=updateHUD;
 const enterBase=enterRegion,compileBase=compileWorld;
 function requirePortalArt(id){for(const def of regions)if((!id||def.id===id)&&!def.paths.includes(PROPS.portal))def.paths.push(PROPS.portal);register(PROPS.portal,'image','R61 transparent regional warp');}
 compileWorld=function(...args){const result=compileBase.apply(this,args);requirePortalArt();return result;};
 enterRegion=function(id,...args){requirePortalArt(id);return enterBase.call(this,id,...args);};
 requirePortalArt();
 const center={x:15,y:15};let traveling=false;
 const radius=.44;
 function contextFor(id,r){if(r?.id===id)return r;if(room?.id===id)return room;if(!otherRooms.has(id))otherRooms.set(id,makeRoom(id,layer));return otherRooms.get(id);}
 function pointsFor(r){
  if(placements.has(r))return placements.get(r);
  const def=regionById[r.id],directions=Object.keys(def?.exits||{}),out={},chosen=[];
  for(const d of directions){
   const v=vectors[d]||[1,0],preferred={x:center.x+v[0]*4.8,y:center.y+v[1]*4.8},candidates=[];
   for(let y=7.5;y<=22.5;y+=.5)for(let x=7.5;x<=22.5;x+=.5){
    const distance=Math.hypot(x-center.x,y-center.y);
    if(distance<2.8||distance>7.7||blocked(x,y,radius,r)||chosen.some(p=>Math.hypot(p.x-x,p.y-y)<3.6))continue;
    const objectiveGap=r.objective?Math.hypot(x-r.objective.x,y-r.objective.y):9;
    if(objectiveGap<2.9)continue;
    candidates.push({x,y,score:Math.hypot(x-preferred.x,y-preferred.y)+Math.abs(distance-4.8)*.15});
   }
   candidates.sort((a,b)=>a.score-b.score||a.y-b.y||a.x-b.x);
   // All canonical layouts have center-near clear floor. The fallback keeps a
   // custom future layout operable without cutting a wall or inventing floor.
   if(!candidates.length){for(const [x,y]of r.exploration?.floorCells||[]){const p={x:x+.5,y:y+.5};if(!blocked(p.x,p.y,radius,r)&&chosen.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>3.5))candidates.push({...p,score:Math.hypot(p.x-center.x,p.y-center.y)});}candidates.sort((a,b)=>a.score-b.score);}
   const p=candidates[0];if(!p)throw Error('No safe native portal floor in '+r.id);
   out[d]={x:p.x,y:p.y};chosen.push(out[d]);
  }
  placements.set(r,out);return out;
 }
 function point(d,id=zone,r=null){id=typeof id==='string'?id:zone;const target=contextFor(id,r);return{...(pointsFor(target)[d]||center)};}
 function status(d){
  const own=native.status(d),def=regionById[zone],to=def?.exits?.[d];
  if(!to)return{...own,visible:false,open:false};
  const active=native.activeDirection(),forward=native.progressDirection(),returnLink=d!==forward&&native.revisitAvailable(d);
  if(d===active)return{...own,point:point(d)};
  // Previous visited/finished rooms are shown at their own separate marker;
  // the actual travel still selects the native revisit route before admission.
  if(returnLink)return{...own,role:'revisit',visible:canTravel(),open:canTravel()&&chapterOpen(regionById[to]),reason:canTravel()?'복원한 이전 지역 왕래':'전투 봉인',point:point(d)};
  return{...own,point:point(d)};
 }
 function visibleDirections(){return Object.keys(regionById[zone]?.exits||{}).filter(d=>status(d).visible);}
 exitPoint=function(d,id=zone){return point(d,id);};
 spawnPoint=function(d){
  if(!room||!regionById[zone])return nativeSpawn(d);
  const markers=Object.values(pointsFor(room)),preferred={x:15,y:19},candidates=[];
  for(let y=11.5;y<=20.5;y+=.5)for(let x=11.5;x<=20.5;x+=.5){if(blocked(x,y,.31,room)||markers.some(p=>Math.hypot(p.x-x,p.y-y)<2.1))continue;candidates.push({x,y,score:Math.hypot(x-preferred.x,y-preferred.y)});}
  candidates.sort((a,b)=>a.score-b.score);const p=candidates[0];return p?{x:p.x,y:p.y}:nativeSpawn(d);
 };
 travel=function(d){
  if(traveling||!started||modal||loading||transitionCD>0||player?.hp<=0)return false;
  const state=status(d);if(!state.open)return nativeTravel(d);
  if(d!==native.activeDirection()&&!native.selectRevisit(d))return false;
  traveling=true;try{return nativeTravel(d);}finally{traveling=false;}
 };
 interact=function(){
  if(started&&!modal&&!loading&&player?.hp>0){const candidates=visibleDirections().map(d=>({d,p:point(d),state:status(d)})).filter(r=>r.state.open&&Math.hypot(player.x-r.p.x,player.y-r.p.y)<2.1).sort((a,b)=>Math.hypot(player.x-a.p.x,player.y-a.p.y)-Math.hypot(player.x-b.p.x,player.y-b.p.y));if(candidates.length)return travel(candidates[0].d);}
  return nativeInteract.apply(this,arguments);
 };
 function renderMarkers(){
  if(!room||!player)return;
  for(const d of visibleDirections()){
   const state=status(d),p=point(d),q=project(p.x,p.y),to=regionById[regionById[zone].exits[d]],forward=d===native.progressDirection();
   const owner={id:'r61:portal:'+zone+':'+d,kind:'exits',x:p.x,y:p.y,alive:false};
   const paint=()=>{
    shadow(q.x,q.y,19*zoom,{alpha:.55});sprite(PROPS.portal,q.x,q.y,actorHeight()*1.12,{alpha:state.open?.94:.34,filter:state.open?'saturate(.6) brightness(1.1)':'grayscale(1) brightness(.7)'});
    ctx.save();try{ctx.font='bold 11px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.fillStyle=state.open?(forward?'#eee0bc':'#c5d5d7'):'#a7a7ab';ctx.shadowColor='#070a0d';ctx.shadowBlur=5;ctx.fillText((state.open?(forward?'다음 기억':'이전 지역'):'봉인 · 기억 복원 후')+' · '+to.title.slice(0,19),q.x,q.y+19*zoom);if(state.open&&Math.hypot(player.x-p.x,player.y-p.y)<2.7)ctx.fillText('E · 이동',q.x,q.y+34*zoom);}finally{ctx.restore();}
   };
   if(typeof ctx.scope==='function')ctx.scope(owner,paint);else paint();
  }
 }
 drawExits=renderMarkers;
 guideStep=function(dt){
  const d=native.activeDirection(),state=d&&status(d);
  if(guide&&!modal&&!loading&&player?.hp>0&&!nearestEnemy(40)&&!room?.engaged&&state?.open){guideTimer-=dt;if(guideTimer>0)return;guideTimer=.5;const p=point(d);if(Math.hypot(player.x-p.x,player.y-p.y)<.8)travel(d);else{route=findPath(player,p);command=null;}return;}
  return nativeGuide.apply(this,arguments);
 };
 updateHUD=function(){
  const result=nativeHUD.apply(this,arguments);if(!started||!room||!player)return result;
  const d=native.activeDirection(),state=d&&status(d);if(!state?.visible)return result;
  const p=point(d),to=regionById[regionById[zone].exits[d]],meters=Math.max(0,Math.round(Math.hypot(player.x-p.x,player.y-p.y))),q=project(p.x,p.y),hero=project(player.x,player.y),a=Math.atan2(q.y-hero.y,q.x-hero.x),arrows=['→','↘','↓','↙','←','↖','↑','↗'],arrow=arrows[(Math.round(a/(Math.PI/4))+8)%8];
  if(state.open){$('questText').textContent=(state.role==='revisit'?'이전 지역 · ':'다음 기억 · ')+to.title+' / 중앙 가까운 워프 '+arrow+' '+meters+'m';$('hint').textContent=meters<3?'E 또는 워프 중심으로 이동 · '+to.title:'워프 '+arrow+' '+meters+'m · '+to.title+' / 길잡이로 이동 가능';}
  return result;
 };
 window.__STORYWORLD_REGION_ROUTES__=Object.freeze({...native,principal:(id=zone)=>point(Object.keys(regionById[id]?.exits||{})[0],id),status,visibleDirections});
 window.__STORYWORLD_PORTALS_R61__=Object.freeze({revision:'center-near-native-portals-r61',point,status,visibleDirections,inspect:()=>({zone,points:Object.keys(regionById[zone]?.exits||{}).map(d=>({direction:d,destination:regionById[zone].exits[d],point:point(d),status:status(d)})),floorChanged:false,wallsChanged:false,nativeAdmission:true})});
})();
