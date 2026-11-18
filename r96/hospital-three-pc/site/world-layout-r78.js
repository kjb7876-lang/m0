/* R81: reuse the CURRENT hospital ward maze, not the retired diagonal annex.
 * Regional art, canonical story identity and native combat state stay separate
 * from the shared, single-source floor/wall/navigation geometry. */
const WORLD_LAYOUT_R78_SAFE_IDS=new Set(['hub','village','dreamRest','restEp1b','restU2','restLast3','restKairo','restHando']);
const WORLD_LAYOUT_R78_METRICS={built:0,skipped:0,failed:0,byId:Object.create(null)};
let WORLD_WARD_R81_TEMPLATE=null;
function worldLayoutR78Eligible(id,theme,safe){
 const coop=window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off';
 return !safe&&id!=='ep1a08'&&!WORLD_LAYOUT_R78_SAFE_IDS.has(id)&&!!theme&&!!StoryWorldProfilesR74.profiles[id]&&coop==='off';
}
function worldWardTemplateR81(){
 if(WORLD_WARD_R81_TEMPLATE)return WORLD_WARD_R81_TEMPLATE;
 const ward=hospitalCoreLayoutB2({walls:[],surface:{}},['door-0','door-1','door-2']);
 // Generic world collision consumes axis-aligned width/depth, whereas the
 // hospital stores segment length+angle. Convert once; keep exact endpoints.
 const walls=ward.walls.map(w=>{const[a,b]=w.endpoints,vertical=a[0]===b[0];return{
  id:w.id.replace('hospital-b2-wall:','ward-r81-wall:').replace('hospital-maze:','ward-r81-baffle:'),
  x:w.x,y:w.y,width:vertical?w.depth:w.width,depth:vertical?w.width:w.depth,height:w.height,
  angle:0,endpoints:w.endpoints.map(p=>[...p]),annex:true,worldWardR81:true,
  wardBaffleR81:!!w.hospitalMazeBarrier,analyticBounds12:[...w.analyticBounds12]
 };});
 const definitions=[
  ['north-a',38,12,16,16],['north-b',57,12,18,16],['north-c',76,12,16,16],
  ['preparation-annex',76,36,16,12],['preparation',20,36,24,12],['preparation-east',51,36,26,12],
  ['consult-a',21,60,22,16],['consult-b',41,60,14,16],['consult-c',59,60,18,16],['consult-d',75,60,10,16],
  ['ward-west',23,78,26,8],['ward-east',64,78,28,8],
  ['south-a',17,94,14,14],['south-b',34,94,16,12],['south-c',53,94,18,14],['south-d',71,94,14,14],
  ['entry-hall',43,109,84,6],['boss-room',20,12,18,12],['west-entry',17,109,6,6],['east-entry',70,109,6,6]
 ];
 const nodes=definitions.map(([name,x,y,width,depth],id)=>({id,name,x,y,width,depth,radius:Math.min(width,depth)/2,shape:'square',...(id===17?{bossCoreR78:true}:{})}));
 const template={bounds:[0,0,87,113],floorCells:ward.floorCells,floorRects:ward.floorRects,walls,nodes},width=87,height=113,size=width*height,index=(x,y)=>y*width+x,walk=new Uint8Array(size),neighbors=new Array(size);
 for(const[x,y]of template.floorCells)if(!explorationBlocked(template,x+.5,y+.5,.34))walk[index(x,y)]=1;
 // Adjacent cells must also clear the shared wall segment at their midpoint.
 // A floor-only flood fill would incorrectly pass through the maze baffles.
 for(let at=0;at<size;at++)if(walk[at]){const x=at%width,y=Math.floor(at/width),row=[];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,to=index(xx,yy);if(xx>=0&&xx<width&&yy>=0&&yy<height&&walk[to]&&!explorationBlocked(template,x+.5+dx*.5,y+.5+dy*.5,.34))row.push(to);}neighbors[at]=row;}
 const anchor=n=>{const x=Math.floor(n.x),y=Math.floor(n.y);if(walk[index(x,y)])return index(x,y);throw Error('R81 ward room anchor blocked: '+n.name);},anchors=nodes.map(anchor),queue=new Int32Array(size);
 const distances=anchors.map(start=>{const out=new Int32Array(size);out.fill(-1);out[start]=0;queue[0]=start;let tail=1;for(let head=0;head<tail;head++){const at=queue[head];for(const next of neighbors[at])if(out[next]<0){out[next]=out[at]+1;queue[tail++]=next;}}return out;});
 const edges=[],connected=new Set([16]);while(connected.size<nodes.length){let best=null;for(const a of connected)for(let b=0;b<nodes.length;b++)if(!connected.has(b)){const d=distances[a][anchors[b]];if(d>=0&&(!best||d<best.d||d===best.d&&(a<best.a||a===best.a&&b<best.b)))best={a,b,d};}if(!best)throw Error('R81 ward maze has disconnected rooms');edges.push([best.a,best.b,6]);connected.add(best.b);}
 // Semantic door edge endpoints are real room indices. Gate objectives rely
 // on this invariant, not on a fabricated route-only graph.
 for(const[a,b]of[[17,4],[12,18],[15,19]])if(!edges.some(([x,y])=>x===a&&y===b||x===b&&y===a))edges.push([a,b,6]);
 WORLD_WARD_R81_TEMPLATE={...template,edges,starts:ward.starts,entry:{...ward.entry,node:16},entrance:{...ward.entry},renderEnvelope:ward.renderEnvelope,walkableCellCount:walk.reduce((n,v)=>n+v,0)};
 return WORLD_WARD_R81_TEMPLATE;
}
function worldLayoutStoryR78(base,id,theme,safe,meta={}){
 if(meta.layerR81==='DREAM'||meta.egoVisitR81)return worldLayoutStoryV4(base?.expanded?base:baseExplorationLayoutR74(id,theme,safe,meta),id,theme,safe,meta);
 if(!worldLayoutR78Eligible(id,theme,safe)){WORLD_LAYOUT_R78_METRICS.skipped++;return worldLayoutR75(base,id,theme,safe,meta);}
 const profile=StoryWorldProfilesR74.profiles[id],plan=worldPlanR75(profile,false,id),art=worldArtR74(profile),template=worldWardTemplateR81();
 // Read source metadata directly; constructing the retired R75 geometry only
 // to discard it makes region transitions needlessly expensive.
 const generic={sourceExits:REGIONAL_ROUTE_DATA[id]?.exits||base.sourceExits||null,
  worldR75:{version:1,family:plan.family,sourceTopology:plan.sourceTopology},
  worldR74:{version:1,mode:profile.mode,style:profile.style,corridorWidth:6,seed:meta.seedR73||0},
  voidCover:{static:true,theme:profile.style,tint:profile.mode==='indoor'?'#182027':'#1a2523',opacity:1}};
 if(!art)throw Error('R81 regional terrain missing: '+id);
 const castle=['hando01','hando02','hando03'].includes(id),bossDoorId=castle?'door-2':'door-0';
 const door=(n,x,y,width,edge,name)=>({id:'door-'+n,x,y,width,depth:.24,axis:'y',reach:3,closed:true,edge,name,r81WardDoor:true});
 const doors=castle?[
  door(0,17,105,6,[12,18],'서쪽 성문'),door(1,70,105,6,[15,19],'동쪽 성문'),door(2,20,20,6,[17,4],'중심 전투실 문')
 ]:[door(0,20,20,6,[17,4],'보스 구역 문'),door(1,29,90,6,[13,10],'서쪽 연결문'),door(2,5,6,8,[17,4],'다음 구역 문')];
 doors.find(d=>d.id===bossDoorId).r78BossDoor=true;
 const purposes=profile.purposes?.length?profile.purposes:['전투 구역','연결 회랑','외곽 전투 구역'],nodes=template.nodes.map(n=>({...n}));
 const rooms=nodes.map(n=>({...n,purpose:n.id===17?'보스 전투실':purposes[n.id%purposes.length],storyZone:id,...(n.id===17?{bossRoom:true}:{})}));
 const layout={...base,...template,nodes,edges:template.edges.map(e=>[...e]),walls:template.walls.map(w=>({...w,path:art.path})),
  version:EXPLORATION_VERSION,expanded:true,type:'r81-story-ward-maze',surface:{...base.surface,art},
  floorCells:template.floorCells,floorRects:template.floorRects,coreFloorRects:[],coreReshaped:true,connectorFloorRects:[],backdropRects:[],fogRects:[],
  chunkMinX:0,chunkMinY:0,chunkColumns:9,chunkRows:12,regional55:null,regional59:null,scenery59:null,mazeR73:null,
  sourceExits:generic.sourceExits||base.sourceExits||null,sourceTopology:profile.sourceTopology,sourceEnvironment:profile.sourceEnvironment,
  voidCover:{...generic.voidCover,theme:profile.style,opacity:1,belowFloor:false},
  originalEncounterBounds:[10,6,28,18],originalPropsRelocated:false,mazeFirst:true,navigationCellsOnly12:false,
  bossRoomNodeId:17,bossDoorId,midbossRoomNodeId:4,combatRoomNodeIds:nodes.filter(n=>![16,17,18,19].includes(n.id)).map(n=>n.id),
  visitRoute:[16,12,10,6,4,17],worldR75:{...generic.worldR75},
  worldR74:{...generic.worldR74,doors,rooms,corridors:template.edges.map(([from,to,width])=>({from,to,width,kind:from===17||to===17?'boss-approach':'maze'})),wallCount:template.walls.length,floorCount:template.floorCells.length,nativeCorePreserved:false},
  worldR78:{version:2,zoneId:id,theme:profile.style,sourceTopology:profile.sourceTopology,family:generic.worldR75?.family,
   maze:'current-hospital-wide-ward-rooms',nativeCorePreserved:false,bossRoomNodeId:17,bossDoorId,midbossRoomNodeId:4,
   combatRoomNodeIds:nodes.filter(n=>![16,17,18,19].includes(n.id)).map(n=>n.id),canonicalRoomPurposes:[...purposes],
   routeNodeIds:[16,12,10,6,4],routeBranches:[[16,12,10,6,4],[16,15,11,8,5,4]]},
  worldWardR81:{version:1,revision:'current-hospital-ward-r81',source:'ep1a08-ward-maze-r2',bossBounds:[10,6,28,18],
   bossAnchor:{x:20,y:12},gatherAnchor:{x:20,y:36},arrivalAnchor:castle?{x:39,y:109}:{x:20,y:36},portalNext:{x:5,y:3.5},portalPrevious:{x:43,y:109},
   fieldAnchors:[{x:17,y:94},{x:70,y:94},{x:21,y:63.5},{x:59,y:63.5},{x:20,y:36},{x:51,y:36}],physicalDoorIds:doors.map(d=>d.id)},r78StoryMaze:true};
 // Never enter hospital-specific actor, clinical texture or medical door code.
 for(const key of ['hospitalCoreB2','hospitalDoorsB3','hospitalAnalytic12','hospitalBoundary12','hospitalVisualWalls12','hospitalPreviousWalls12','hospitalWalkPolygons12','hospitalWalkArea12','hospitalLayoutRevision','hospitalPrototypeB1','doorUV','gate'])delete layout[key];
 window.__STORYWORLD_ENVIRONMENT_R81__?.surface(layout,id);
 WORLD_LAYOUT_R78_METRICS.built++;WORLD_LAYOUT_R78_METRICS.byId[id]=(WORLD_LAYOUT_R78_METRICS.byId[id]||0)+1;return layout;
}

/* Preserved V4 topology for DREAM / transient EGO visits. */
function worldLayoutStoryV4(base,id,theme,safe,meta={}){
 if(!worldLayoutR78Eligible(id,theme,safe)){WORLD_LAYOUT_R78_METRICS.skipped++;return worldLayoutR75(base,id,theme,safe,meta);}
 const profile=StoryWorldProfilesR74.profiles[id],core=baseExplorationLayoutR74(id,theme,false,{...meta,worldR74:0,worldR75:0}),
  generic=worldLayoutR75(base,id,theme,false,{...meta,worldR74:1,worldR75:1});
 if(!core?.expanded||!generic?.worldR75){WORLD_LAYOUT_R78_METRICS.failed++;return generic||base;}
 const layout=hospitalMazeLayout5(core),art=generic.surface?.art||core.surface?.art;
 if(!layout?.floorCells?.length||!layout?.nodes?.length||!art){WORLD_LAYOUT_R78_METRICS.failed++;return generic;}
 const backdrop=art.r59Backdrop?{...art.r59Backdrop,brightness:Math.max(.68,Number(art.r59Backdrop.brightness)||0)}:null;
 layout.surface={...layout.surface,art:{...art,...(backdrop?{r59Backdrop:backdrop}:{})}};
 layout.backdropRects=[{x:layout.bounds[0],y:layout.bounds[1],width:layout.bounds[2]-layout.bounds[0],depth:layout.bounds[3]-layout.bounds[1]}];
 layout.fogRects=[];layout.sourceExits=generic.sourceExits||core.sourceExits||null;
 layout.type='r78-story-combat-maze';layout.voidCover={...generic.voidCover,theme:profile.style};layout.worldR75={...generic.worldR75};
 // R80: identical integer-cell distances using bounded typed arrays.
 // Avoid 13 Maps of cell strings per generated map.
 const [x0,y0,x1,y1]=layout.bounds.map(Math.floor),width=x1-x0,height=y1-y0,size=width*height,
  floor=new Uint8Array(size),outer=layout.nodes.map(n=>({id:n.id,x:n.x,y:n.y})),index=(x,y)=>(y-y0)*width+x-x0;
 for(const[x,y]of layout.floorCells)floor[index(x,y)]=1;
 const floorAnchor=n=>{const x=Math.floor(n.x),y=Math.floor(n.y);if(floor[index(x,y)])return index(x,y);
  for(let r=1;r<=4;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const xx=x+dx,yy=y+dy;if(xx>=x0&&xx<x1&&yy>=y0&&yy<y1&&floor[index(xx,yy)])return index(xx,yy);}
  throw Error('R78 room anchor is not on floor: '+id+':'+n.id);
 };
 const anchors=outer.map(floorAnchor),queue=new Int32Array(size),distances=anchors.map(start=>{
  const distance=new Int32Array(size);distance.fill(-1);distance[start]=0;queue[0]=start;let tail=1;
  for(let head=0;head<tail;head++){const at=queue[head],next=distance[at]+1,col=at%width;
   for(const n of [col+1<width?at+1:-1,col>0?at-1:-1,at+width<size?at+width:-1,at>=width?at-width:-1])if(n>=0&&floor[n]&&distance[n]<0){distance[n]=next;queue[tail++]=n;}
  }return distance;
 });
 const connected=new Set([11]),edges=[];while(connected.size<outer.length){let best=null;for(const a of connected)for(let b=0;b<outer.length;b++)if(!connected.has(b)){
   const distance=distances[a][anchors[b]];if(distance>=0&&(!best||distance<best.distance||distance===best.distance&&(a<best.a||a===best.a&&b<best.b)))best={a,b,distance};
  }if(!best)throw Error('R78 maze rooms disconnected: '+id);edges.push([best.a,best.b,3.4]);connected.add(best.b);
 }
 const bossId=outer.length,boss={id:bossId,x:15.5,y:15.5,radius:11,shape:'square',bossCoreR78:true},door={id:'door-0',x:34.5,y:34.5,width:.28,depth:3.4,axis:'x',reach:2.2,closed:true,edge:[bossId,5],r78BossDoor:true};
 edges.push([bossId,5,3.4]);layout.nodes=[...layout.nodes,boss];layout.edges=edges;layout.bossRoomNodeId=bossId;layout.bossDoorId=door.id;layout.midbossRoomNodeId=5;
 const purposes=profile.purposes?.length?profile.purposes:['전투 구역','연결 회랑','외곽 전투 구역'];
 const rooms=outer.map(n=>({id:n.id,x:n.x,y:n.y,width:5,depth:5,purpose:purposes[n.id%purposes.length],storyZone:id}));
 rooms.push({id:bossId,x:15.5,y:15.5,width:28,depth:28,purpose:'보스 전투실',storyZone:id,bossRoom:true});
 layout.worldR74={...generic.worldR74,style:generic.worldR74?.style||profile.style,doors:[door],rooms,
  corridors:edges.map(([a,b,width])=>({from:a,to:b,width,kind:a===bossId||b===bossId?'boss-approach':'maze'})),
  wallCount:layout.walls.length,floorCount:layout.floorCells.length,nativeCorePreserved:true};
 layout.worldR78={version:1,zoneId:id,theme:profile.style,sourceTopology:profile.sourceTopology,family:generic.worldR75.family,
  maze:'hospital-like-wide-combat-rooms',nativeCorePreserved:true,bossRoomNodeId:bossId,bossDoorId:door.id,
  midbossRoomNodeId:5,combatRoomNodeIds:outer.map(n=>n.id).filter(n=>n!==5),canonicalRoomPurposes:[...purposes]};
 layout.r78StoryMaze=true;layout.mazeFirst=true;layout.originalEncounterBounds=core.originalEncounterBounds||[1,1,29,29];
 WORLD_LAYOUT_R78_METRICS.built++;WORLD_LAYOUT_R78_METRICS.byId[id]=(WORLD_LAYOUT_R78_METRICS.byId[id]||0)+1;return layout;
}

/* R82: the opening refuge is a compact cloister, not a combat ward.
 * Keep native spawn/altar/props and safe-region progression in place. */
function refugeLayoutR82(base){
 const rectangles=[[8,8,24,24],[2,2,10,10],[18,2,34,10],[2,24,12,32],[22,24,34,32],
  [4,8,8,28],[26,8,32,28],[8,4,28,8],[8,25,28,30],
  [6,13,10,19],[22,13,32,19],[13,6,19,10],[13,22,19,28],[22,20,34,26]];
 const cells=new Set(),key=(x,y)=>x+':'+y;
 for(const[x0,y0,x1,y1]of rectangles)for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)cells.add(key(x,y));
 const floorCells=[...cells].map(k=>k.split(':').map(Number)).sort((a,b)=>a[1]-b[1]||a[0]-b[0]),floorRects=[],active=new Map();
 for(let y=0;y<34;y++){const row=new Map();let x=0;while(x<36){if(!cells.has(key(x,y))){x++;continue;}const start=x;while(cells.has(key(x,y)))x++;const id=start+':'+x,old=active.get(id);if(old&&old.y+old.depth===y){old.depth++;row.set(id,old);}else{const r={x:start,y,width:x-start,depth:1};floorRects.push(r);row.set(id,r);}}active.clear();for(const[k,v]of row)active.set(k,v);}
 const segments=new Map();
 const edge=(axis,fixed,at)=>{const k=axis+':'+fixed;if(!segments.has(k))segments.set(k,[]);segments.get(k).push(at);};
 for(const[x,y]of floorCells){if(!cells.has(key(x,y-1)))edge('h',y,x);if(!cells.has(key(x,y+1)))edge('h',y+1,x);if(!cells.has(key(x-1,y)))edge('v',x,y);if(!cells.has(key(x+1,y)))edge('v',x+1,y);}
 const walls=[];for(const[k,list]of segments){const[axis,n]=k.split(':'),fixed=Number(n),a=[...new Set(list)].sort((x,y)=>x-y);for(let i=0;i<a.length;){const start=a[i++];let end=start+1;while(a[i]===end){end++;i++;}const horizontal=axis==='h';walls.push({id:'refuge-r82-wall:'+walls.length,x:horizontal?(start+end)/2:fixed,y:horizontal?fixed:(start+end)/2,width:horizontal?end-start:.24,depth:horizontal?.24:end-start,height:2.7,annex:true,refugeR82:true});}}
 // Open six-tile doorways separate the central garden from its cloister.
 // Boundary-only walls would merge all overlapping rooms into one flat hall.
 const partitions=[[8,8,13,8],[19,8,24,8],[8,24,13,24],[19,24,24,24],
  [8,8,8,13],[8,19,8,24],[24,8,24,13],[24,19,24,20]];
 for(const[x0,y0,x1,y1]of partitions){const horizontal=y0===y1;walls.push({id:'refuge-r82-partition:'+walls.length,x:(x0+x1)/2,y:(y0+y1)/2,width:horizontal?x1-x0:.24,depth:horizontal?.24:y1-y0,height:2.7,annex:true,refugeR82:true,partition:true});}
 const atlas=StoryArtR74.atlases.materials,style=atlas.styles.garden;
 const art={path:atlas.path,width:atlas.width,height:atlas.height,sha256:atlas.sha256,floorRect:[...style.floorRect],wallRect:[...style.wallRect],tileWorld:4.5,r55PhysicalUV:true,r74Generated:true,theme:'garden',r81Environment:'garden',r81Palette:{floor:0xc4c3b0,wall:0x778579,cap:0x919d88,edge:0x38483e}};
 const defs=[['중앙 피난 정원',15,16,16,16],['서쪽 회랑',6,16,4,24],['기억 보관실',26,6,16,8],['남서 피난실',7,28,10,8],['남동 휴식실',28,28,12,8],['정원 출구 회랑',30,22,8,6],['북서 회랑',6,6,8,8]],nodes=defs.map(([name,x,y,width,depth],id)=>({id,name,x,y,width,depth,radius:Math.min(width,depth)/2,shape:'square'})),edges=[[0,1,4],[1,6,4],[6,2,4],[2,5,6],[5,4,6],[4,3,4],[3,1,4],[0,5,6]];
 return{...base,id:'hub',version:EXPLORATION_VERSION,expanded:true,type:'r82-refuge-cloister',bounds:[0,0,36,34],floorCells,floorRects,walls,nodes,edges,
  coreFloorRects:[],coreReshaped:true,connectorFloorRects:[],backdropRects:[],fogRects:[],surface:{...base.surface,art},
  chunkMinX:0,chunkMinY:0,chunkColumns:4,chunkRows:4,entry:{x:15,y:19,node:0},entrance:{x:15,y:19},
  renderEnvelope:{u0:-38,u1:40,v0:-8,v1:78},regional55:null,regional59:null,scenery59:null,mazeR73:null,
  voidCover:{tint:'#778579',opacity:1},worldR74:null,worldR75:null,worldR78:null,worldWardR81:null,
  refugeR82:{version:1,safe:true,portalNext:{x:30,y:22},source:'hub-native-story',rooms:defs.map(d=>d[0])}};
}
