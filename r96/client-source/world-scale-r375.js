// R375 geometry candidate. Deliberately has no automatic runtime installer:
// the three generation boundaries, hospital collision and save restoration
// must be integrated together before any game room can adopt this coordinate space.
(()=>{'use strict';
 if(window.__STORYWORLD_WORLD_SCALE_R375__)return;
 const REV='R375-geometry-1',S=2,cache=new WeakMap(),outputs=new WeakSet();
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
  return[-1,1].map((sign,i)=>{const x=cx+(a.vertical?0:sign*offset),y=cy+(a.vertical?sign*offset:0),w=a.vertical?a.thickness*S:along,d=a.vertical?along:a.thickness*S;
   return{...template,id:'r375-jamb:'+a.id+':'+i,x,y,width:template.hospitalCoreB2?along:w,depth:template.hospitalCoreB2?a.thickness*S:d,height:template.height??2.7,angle:template.hospitalCoreB2&&a.vertical?Math.PI/2:0,
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
 window.__STORYWORLD_WORLD_SCALE_R375__=Object.freeze({revision:REV,scale:S,scaleLayout,scaleZone,point:xy,
  inspect:()=>({revision:REV,autoInstalled:false,requires:['generation-boundaries','hospital-collision','canonical-save-roundtrip','dynamic-placement']})});
})();
