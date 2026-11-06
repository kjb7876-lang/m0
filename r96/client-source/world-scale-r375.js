// R375 geometry candidate. Deliberately has no automatic runtime installer:
// the three generation boundaries, hospital collision and save restoration
// must be integrated together before any game room can adopt this coordinate space.
(()=>{'use strict';
 if(window.__STORYWORLD_WORLD_SCALE_R375__)return;
 const REV='R375-geometry-2',S=2,cache=new WeakMap(),outputs=new WeakSet(),physicsCache=new WeakMap();
 const finite=Number.isFinite,copy=v=>v==null?v:JSON.parse(JSON.stringify(v));
 const xy=p=>p&&typeof p==='object'?{...p,...(finite(p.x)?{x:p.x*S}:{}),...(finite(p.y)?{y:p.y*S}:{})}:p;
 const pairs=a=>a?.map(p=>Array.isArray(p)?p.map((v,i)=>i<2&&finite(v)?v*S:v):xy(p));
 const bounds=a=>a?.map(v=>finite(v)?v*S:v);
 function rect(p){const q=xy(p);if(!q)return q;for(const k of ['width','depth','w','h'])if(finite(q[k]))q[k]*=S;
  if(p.endpoints)q.endpoints=pairs(p.endpoints);if(p.polygon)q.polygon=pairs(p.polygon);for(const k of ['box','bounds','analyticBounds12'])if(p[k])q[k]=bounds(p[k]);return q;}
 function node(p){const q=rect(p);if(finite(q?.radius))q.radius*=S;return q;}
 function door(p){const q=xy(p);if(p.endpoints){const [a,b]=p.endpoints,cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2;q.endpoints=p.endpoints.map(([x,y])=>[cx*S+x-cx,cy*S+y-cy]);}return q;}
 const pointKeys=['entry','entrance','exit','centre','center','save','dais','core','top','gate','objective','bossAnchor','gatherAnchor','arrivalAnchor','portalNext','portalPrevious','routeSplit','merge'];
 const listKeys=['starts','chests','landings','combatAnchors','bays','fieldAnchors','bossPoints','rallySpots','rallyTriggers'];
 function metadata(m){if(!m||typeof m!=='object')return m;const q=copy(m);
  for(const k of pointKeys)if(m[k])q[k]=xy(m[k]);for(const k of listKeys)if(Array.isArray(m[k]))q[k]=m[k].map(xy);
  for(const k of ['bounds','bossBounds','gatherBounds','originalEncounterBounds'])if(m[k])q[k]=bounds(m[k]);
  if(m.rooms)q.rooms=m.rooms.map(rect);if(m.doors)q.doors=m.doors.map(door);
  if(m.corridors)q.corridors=m.corridors.map(rect);if(finite(m.corridorWidth))q.corridorWidth=m.corridorWidth*S;
  if(m.routeSpawns)q.routeSpawns=Object.fromEntries(Object.entries(m.routeSpawns).map(([k,v])=>[k,v.map(xy)]));
  if(m.patrol)q.patrol=m.patrol.map(pairs);if(m.path)q.path=pairs(m.path);
  if(m.rects)q.rects=m.rects.map(([id,...b])=>[id,...bounds(b)]);
  if(m.mazeBarriers)q.mazeBarriers=m.mazeBarriers.map(rect);return q;
 }
 // Canonical R115 carve doors carry lo/hi but the public layout drops the span.
 // Pass the original carve descriptors explicitly; guessing from a nearby wall
 // can silently widen a doorway or seal the wrong corridor.
 function aperture(d,i){
  if(d.endpoints&&finite(d.depth)){const [a,b]=d.endpoints,dx=b[0]-a[0],dy=b[1]-a[1];if(Math.abs(dx)>.000001&&Math.abs(dy)>.000001)throw Error('Diagonal doorway requires explicit aperture support');return{id:d.id||'door-'+i,x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,span:Math.hypot(dx,dy),thickness:d.depth,vertical:Math.abs(dy)>Math.abs(dx),source:d};}
  if(finite(d.width)&&finite(d.depth))return{id:d.id||'door-'+i,x:d.x,y:d.y,span:Math.max(d.width,d.depth),thickness:Math.min(d.width,d.depth),vertical:d.depth>d.width,source:d};
  if(finite(d.lo)&&finite(d.hi)&&['v','h'].includes(d.axis)){
   const vertical=d.axis==='v',offset=-.5+(d.lo+d.hi)/2;
   return{id:d.id||'passage-'+i,x:d.x+(vertical?0:offset),y:d.y+(vertical?offset:0),span:d.hi-d.lo,thickness:.24,vertical,source:d};
  }
  return null;
 }
 function jambs(a,template={}){
  const along=a.span*(S-1)/2,offset=(a.span+along)/2,cx=a.x*S,cy=a.y*S;
  // Door collars retain native thickness too: thicker analytic capsule caps
  // would intrude into an otherwise unchanged opening at both inner ends.
  return[-1,1].map((sign,i)=>{const x=cx+(a.vertical?0:sign*offset),y=cy+(a.vertical?sign*offset:0),w=a.vertical?a.thickness:along,d=a.vertical?along:a.thickness;
   return{...template,id:'r375-jamb:'+a.id+':'+i,x,y,width:template.hospitalCoreB2?along:w,depth:template.hospitalCoreB2?a.thickness:d,height:template.height??2.7,angle:template.hospitalCoreB2&&a.vertical?Math.PI/2:0,
    endpoints:a.vertical?[[x,y-d/2],[x,y+d/2]]:[[x-w/2,y],[x+w/2,y]],
    analyticBounds12:[x-w/2,y-d/2,x+w/2,y+d/2],annex:true,r375Jamb:true};});
 }
 function scaleLayout(L,options={}){
  if(!L||typeof L!=='object')throw TypeError('A canonical layout is required');
  if(outputs.has(L))return L;
  // The options identity is part of the cache: door descriptors are input data.
  const prior=cache.get(L);if(prior&&prior.doors===options.doors)return prior.layout;
  if(!Array.isArray(L.floorCells)||!Array.isArray(L.bounds))throw TypeError('Missing floorCells/bounds');
  const q=copy(L);
  q.bounds=bounds(L.bounds);q.floorCells=[];
  const cells=new Set();for(const [x,y]of L.floorCells){if(!Number.isInteger(x)||!Number.isInteger(y))throw TypeError('Nonintegral floor cell');
   for(let dy=0;dy<S;dy++)for(let dx=0;dx<S;dx++){const a=x*S+dx,b=y*S+dy,k=a+':'+b;if(!cells.has(k)){cells.add(k);q.floorCells.push([a,b]);}}}
  for(const k of ['walls','floorRects','coreFloorRects','connectorFloorRects','backdropRects','fogRects'])if(L[k])q[k]=L[k].map(rect);
  if(L.nodes)q.nodes=L.nodes.map(node);
  if(L.branches)q.branches=pairs(L.branches);
  if(L.edges)q.edges=L.edges.map(e=>e.map((v,i)=>i===2&&finite(v)?v*S:v));
  if(L.sourceExits)q.sourceExits=Object.fromEntries(Object.entries(L.sourceExits).map(([k,v])=>[k,xy(v)]));
  if(finite(L.entryToGateDistance))q.entryToGateDistance=L.entryToGateDistance*S;
  if(L.centralArena)q.centralArena=rect(L.centralArena);
  for(const k of pointKeys)if(L[k])q[k]=xy(L[k]);for(const k of listKeys)if(Array.isArray(L[k]))q[k]=L[k].map(xy);
  for(const k of ['worldR74','worldR78','worldWardR81','samongR103','hospitalCoreB2','refugeR82'])if(L[k])q[k]=metadata(L[k]);
  if(L.hospitalDoorsB3)q.hospitalDoorsB3=L.hospitalDoorsB3.map(door);
  if(L.hospitalWalkPolygons12)q.hospitalWalkPolygons12=L.hospitalWalkPolygons12.map(pairs);
  for(const k of ['spawnExclude'])if(L[k])q[k]=L[k].map(bounds);
  if(L.originalEncounterBounds)q.originalEncounterBounds=bounds(L.originalEncounterBounds);
  if(L.renderEnvelope)q.renderEnvelope=Object.fromEntries(Object.entries(L.renderEnvelope).map(([k,v])=>[k,finite(v)?v*S:v]));
  if(L.doorUV)q.doorUV=Object.fromEntries(Object.entries(L.doorUV).map(([k,v])=>[k,finite(v)?v*S:v]));
  const raw=options.doors||L.hospitalDoorsB3||L.worldR74?.doors||[],aps=raw.map(aperture);
  if(aps.some(a=>!a))throw Error('Door aperture metadata is required for '+L.id);
  const unique=[...new Map(aps.map(a=>[[a.x,a.y,a.span,a.vertical].join(':'),a])).values()];
  // Hospital closed leaves live in walls; preserve their size around the scaled
  // centre. Dynamic R74 doors use the size-preserving descriptor above instead.
  q.walls=(q.walls||[]).map((w,i)=>{const old=L.walls[i];if(!old.hospitalDoorB3)return w;const fixed=door(old);
   fixed.analyticBounds12=fixed.endpoints?[Math.min(...fixed.endpoints.map(p=>p[0]))-old.depth/2,Math.min(...fixed.endpoints.map(p=>p[1]))-old.depth/2,Math.max(...fixed.endpoints.map(p=>p[0]))+old.depth/2,Math.max(...fixed.endpoints.map(p=>p[1]))+old.depth/2]:[fixed.x-old.width/2,fixed.y-old.depth/2,fixed.x+old.width/2,fixed.y+old.depth/2];return fixed;});
  for(const a of unique){const template=L.walls?.find(w=>w.hospitalDoorB3===a.id)||L.walls?.[0]||{};
   const clean={height:template.height,path:template.path,...(L.hospitalCoreB2?{hospitalCoreB2:true,analyticBoundary12:true}:{} )};q.walls.push(...jambs(a,clean));}
  for(const k of ['hospitalBoundary12','hospitalVisualWalls12'])if(L[k])q[k]=q.walls;
  if(L.hospitalPreviousWalls12)q.hospitalPreviousWalls12=L.hospitalPreviousWalls12.map(rect);
  if(finite(L.hospitalWalkArea12))q.hospitalWalkArea12=q.floorCells.length;
  if(finite(L.walkableCellCount))q.walkableCellCount=q.floorCells.length;
  // Chunk coordinates are ten-unit renderer buckets, not scalable cell sizes.
  if(finite(L.chunkColumns)){q.chunkMinX=Math.floor(q.bounds[0]/10);q.chunkMinY=Math.floor(q.bounds[1]/10);q.chunkColumns=Math.ceil(q.bounds[2]/10)-q.chunkMinX;q.chunkRows=Math.ceil(q.bounds[3]/10)-q.chunkMinY;}
  if(q.worldR74){q.worldR74.wallCount=q.walls.length;q.worldR74.floorCount=q.floorCells.length;}
  outputs.add(q);cache.set(L,{doors:options.doors,layout:q});return q;
 }
 function scaleZone(z){const q=copy(z);q.rooms=z.rooms.map(R=>{const n=rect(R);if(R.grid)n.grid={...xy(R.grid),dx:R.grid.dx*S,dy:R.grid.dy*S};if(R.along)n.along=R.along.map(([k,s,d])=>[k,s,d*S]);return n;});
  for(const k of pointKeys)if(z[k])q[k]=xy(z[k]);for(const k of ['chests','landings'])if(z[k])q[k]=z[k].map(xy);
  if(z.cuts)q.cuts=z.cuts.map(rect);if(z.clues)q.clues=z.clues.map(c=>({...c,at:c.at?c.at.map(v=>v*S):c.at}));
  if(z.patrol?.routes)q.patrol={...z.patrol,routes:z.patrol.routes.map(pairs)};
  // The geometry generator must continue using the canonical definition. These
  // definitions are for dress/tick/navGoal; do not carve them a second time.
  return q;
 }
 // Hospital collision must read the supplied layout, never the original B2
 // closure. These pure callbacks can be passed to explorationPath at integration.
 // No global collision/navigation functions are replaced here.
 function hospitalPhysics(L){
  if(physicsCache.has(L))return physicsCache.get(L);
  if(!L?.hospitalCoreB2?.rects||!Array.isArray(L.hospitalBoundary12))throw TypeError('Hospital B2 layout required');
  const rects=L.hospitalCoreB2.rects,buckets=new Map(),queryCache=new Map(),bucketSize=8,empty=[];
  const walls=L.hospitalBoundary12.filter(w=>!w.decorative).map(w=>{
   const [a,b]=w.endpoints||[],depth=w.depth??L.hospitalCoreB2.wallDepth;
   if(!a||!b||![...a,...b,depth].every(finite)||depth<=0)throw TypeError('Invalid hospital wall '+w.id);
   return{a,b,half:depth/2,id:w.id};
  });
  for(const w of walls){
   const minX=Math.floor((Math.min(w.a[0],w.b[0])-w.half)/bucketSize),maxX=Math.floor((Math.max(w.a[0],w.b[0])+w.half)/bucketSize);
   const minY=Math.floor((Math.min(w.a[1],w.b[1])-w.half)/bucketSize),maxY=Math.floor((Math.max(w.a[1],w.b[1])+w.half)/bucketSize);
   for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const k=x+':'+y;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(w);}
  }
  const valid=(x,y,r)=>[x,y,r].every(finite)&&r>=0;
  const contains=(x,y)=>finite(x)&&finite(y)&&rects.some(([,a,b,c,d])=>x>=a&&x<c&&y>=b&&y<d);
  function nearby(ax,ay,bx,by,r){
   const minX=Math.floor((Math.min(ax,bx)-r)/bucketSize),maxX=Math.floor((Math.max(ax,bx)+r)/bucketSize),minY=Math.floor((Math.min(ay,by)-r)/bucketSize),maxY=Math.floor((Math.max(ay,by)+r)/bucketSize);
   // Bound work even for a malformed, extremely distant segment. Testing the
   // finite wall list is cheaper than enumerating an unbounded empty grid.
   const area=(maxX-minX+1)*(maxY-minY+1);if(area>4096)return walls;
   if(area===1)return buckets.get(minX+':'+minY)||empty;
   const key=minX+':'+minY+':'+maxX+':'+maxY;if(queryCache.has(key))return queryCache.get(key);
   const found=new Set();
   for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)for(const w of buckets.get(x+':'+y)||[])found.add(w);
   // Cache candidate lists, never movement results or door state. Each layout
   // owns its immutable geometry; newly opened doors produce a new layout.
   if(area<=16){if(queryCache.size>=1024)queryCache.clear();queryCache.set(key,found);}
   return found;
  }
  function distance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],length2=dx*dx+dy*dy,t=length2?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/length2)):0;return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}
  function blocked(x,y,r=.27){
   if(!valid(x,y,r)||!contains(x,y))return true;
   for(const w of nearby(x,y,x,y,r))if(distance(x,y,w.a,w.b)<r+w.half)return true;
   return false;
  }
  function circleContact(p,r,ax,ay,bx,by){
   const dx=bx-ax,dy=by-ay,px=ax-p[0],py=ay-p[1],A=dx*dx+dy*dy,C=px*px+py*py-r*r;
   if(C<0)return 0;if(!A)return null;
   const B=2*(px*dx+py*dy),D=B*B-4*A*C;if(D<=0)return null;
   const t=(-B-Math.sqrt(D))/(2*A);return t>=0&&t<=1?t:null;
  }
  function boundaryContact(ax,ay,bx,by,r=.27){
   if(!valid(ax,ay,r)||!valid(bx,by,r)||!contains(ax,ay))return 0;
   let first=null;const add=t=>{if(t!==null&&(first===null||t<first))first=t;};
   for(const w of nearby(ax,ay,bx,by,r)){
    const [a,b]=[w.a,w.b],ux=b[0]-a[0],uy=b[1]-a[1],len=Math.hypot(ux,uy),R=Math.max(1e-8,r+w.half);
    if(len){
     const dx=ux/len,dy=uy/len,X=(ax-a[0])*dx+(ay-a[1])*dy,Y=-(ax-a[0])*dy+(ay-a[1])*dx,dX=(bx-ax)*dx+(by-ay)*dy,dY=-(bx-ax)*dy+(by-ay)*dx;
     let lo=0,hi=1;
     for(const[v,d,min,max]of[[X,dX,0,len],[Y,dY,-R,R]]){if(d===0){if(v<=min||v>=max){hi=-1;break;}}else{const t0=(min-v)/d,t1=(max-v)/d;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));}}
     if(hi>lo&&hi>0&&lo<=1)add(Math.max(0,lo));
    }
    add(circleContact(a,R,ax,ay,bx,by));add(circleContact(b,R,ax,ay,bx,by));
   }
   return first;
  }
  const clear=(a,b,r=.27)=>!!a&&!!b&&!blocked(a.x,a.y,r)&&!blocked(b.x,b.y,r)&&boundaryContact(a.x,a.y,b.x,b.y,r)===null;
  const api=Object.freeze({contains,blocked,boundaryContact,clear,wallCount:walls.length});physicsCache.set(L,api);return api;
 }
 // Saved coordinates retain their original format/units. Selection is explicit
 // because a host DREAM room, a Samong stage and an EGO visit can share a map id.
 // Do not pass expanded coordinates into the native validator/restore chain.
 function cloneSave(value,ancestors=new WeakSet()){
  if(!value||typeof value!=='object')return value;
  if(ancestors.has(value))throw TypeError('Save snapshot must be an acyclic JSON-style tree');
  ancestors.add(value);const out=Array.isArray(value)?new Array(value.length):{};
  for(const key of Object.keys(value))Object.defineProperty(out,key,{value:cloneSave(value[key],ancestors),enumerable:true,writable:true,configurable:true});
  ancestors.delete(value);
  return out;
 }
 function visitSaveCoordinates(raw,context,visit){
  if(!raw||typeof raw!=='object'||!context||!Array.isArray(context.roomKeys)||context.roomKeys.some(k=>typeof k!=='string')||(context.pointDropRoomKeys!==undefined&&(!Array.isArray(context.pointDropRoomKeys)||context.pointDropRoomKeys.some(k=>typeof k!=='string'))))throw TypeError('Explicit roomKeys context required');
  const selected=new Set(context.roomKeys),dropKeys=new Set(context.pointDropRoomKeys??context.roomKeys);
  if(raw.ego151?.active&&selected.has(raw.ego151.visitLayer+':'+raw.ego151.visitMap)&&context.pointDropRoomKeys===undefined)throw TypeError('Active EGO requires explicit pointDropRoomKeys ownership');
  function point(p,path,key,kind){if(p&&typeof p==='object')visit(p,path,key,kind);}
  function rows(list,path,key,kind){if(Array.isArray(list))list.forEach((p,i)=>point(p,[...path,i],key,kind));}
  if(selected.has(context.playerRoomKey))point(raw.player,['player'],context.playerRoomKey,'player');
  for(const key of selected){
   rows(raw.rooms?.[key]?.enemies,['rooms',key,'enemies'],key,'enemy');
   rows(raw.explorationHomes?.[key],['explorationHomes',key],key,'home');
   for(const [field,list,kind]of [['worldMazeR81','champions','champion'],['hospitalBossR53','units','hospital-summon'],['summonsR61','units','summon']])rows(raw[field]?.rooms?.[key]?.[list],[field,'rooms',key,list],key,kind);
  }
  for(const key of dropKeys)rows(raw.campaignPointDropsR64?.rooms?.[key]?.drops,['campaignPointDropsR64','rooms',key,'drops'],key,'point-drop');
  if(context.checkpoint===true)point(raw.samongR103?.checkpoint,['samongR103','checkpoint'],context.playerRoomKey,'samong-checkpoint');
  if(context.egoRoomKey!==undefined&&context.egoRoomKey!==null){
   const e=raw.ego151,key=e?.visitLayer+':'+e?.visitMap+':EGO:'+e?.visitId;
   if(!e?.active||typeof e.visitId!=='string'||!/^ego:[1-9][0-9]*$/.test(e.visitId)||!['STORY','DREAM'].includes(e.visitLayer)||typeof e.visitMap!=='string'||!e.visitMap||context.egoRoomKey!==key||e.routeRoom?.egoVisitId151!==e.visitId||!selected.has(key))throw TypeError('EGO routeRoom identity does not match explicit context');
   rows(e.routeRoom.enemies,['ego151','routeRoom','enemies'],key,'ego-enemy');
  }
 }
 function encodeSaveCoordinates(expanded,context){
  const canonical=cloneSave(expanded),seen=new WeakSet();
  visitSaveCoordinates(canonical,context,(p,path,key,kind)=>{if(!seen.has(p)){if(finite(p.x)&&finite(p.y)){p.x/=S;p.y/=S;}if(kind==='enemy'&&finite(p.homeX)&&finite(p.homeY)){p.homeX/=S;p.homeY/=S;}}seen.add(p);});
  return canonical;
 }
 function restoreCoordinatePlan(canonical,context){
  const positions=[];
  visitSaveCoordinates(canonical,context,(p,path,roomKey,kind)=>{
   const valid=finite(p.x)&&finite(p.y)&&finite(p.x*S)&&finite(p.y*S),homeValid=finite(p.homeX)&&finite(p.homeY)&&finite(p.homeX*S)&&finite(p.homeY*S);
   positions.push({path,roomKey,kind,...(p.id!==undefined?{id:cloneSave(p.id)}:{}),...(kind==='home'?{group:cloneSave(p.group)}:{}),...(kind==='enemy'&&('homeX' in p||'homeY' in p)?{home:{valid:homeValid,x:homeValid?p.homeX*S:cloneSave(p.homeX),y:homeValid?p.homeY*S:cloneSave(p.homeY)}}:{}),valid,x:valid?p.x*S:cloneSave(p.x),y:valid?p.y*S:cloneSave(p.y)});
  });
  // This is a detached plan, not a save payload and not a mutation. Integration
  // must validate the canonical save, await each actual room/stage, match actor
  // identities, and collision-check before applying any planned position.
  const stage=canonical.samongR103;
  return{scale:S,playerRoomKey:context.playerRoomKey,checkpointOwner:context.checkpoint&&stage?cloneSave({ep:stage.ep,stage:stage.stage,zone:stage.zone,seed:stage.seed}):null,positions};
 }
 window.__STORYWORLD_WORLD_SCALE_R375__=Object.freeze({revision:REV,scale:S,scaleLayout,scaleZone,point:xy,hospitalPhysics,encodeSaveCoordinates,restoreCoordinatePlan,
  inspect:()=>({revision:REV,autoInstalled:false,requires:['generation-boundaries','hospital-collision','canonical-save-roundtrip','dynamic-placement']})});
})();
