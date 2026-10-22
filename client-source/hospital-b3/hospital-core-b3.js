/* Local ep1a08 solo spatial candidate. No actors, damage or saved schema. */
const HOSPITAL_CORE_B2=Object.freeze({"revision":"ep1a08-ward-network-b3-v1","wallDepth":0.24,"rects":[["combat",10,6,28,18],["observation",1,6,9,18],["observation-link",8,10,12,14],["exit-vestibule",1,1,9,6],["combat-door",17,17,23,24],["upper-cross",2,22,66,28],["preparation",12,32,28,40],["prep-north",17,26,23,34],["prep-south",17,38,23,46],["west-main",2,26,8,86],["east-main",80,44,86,108],["mid-cross",2,44,86,50],["north-ward-a",32,6,44,20],["north-ward-b",48,6,62,20],["north-ward-a-door",35,18,41,24],["north-ward-b-door",52,18,58,24],["north-ward-return",42,10,50,16],["consult-a",12,54,30,66],["consult-b",34,54,48,66],["consult-c",52,54,66,66],["consult-d",70,54,78,66],["consult-a-door",18,48,24,56],["consult-b-door",38,48,44,56],["consult-c-door",52,48,58,56],["consult-d-door",71,48,77,56],["mid-return",6,68,84,74],["consult-a-return",18,64,24,70],["consult-b-return",38,64,44,70],["consult-c-return",58,64,64,70],["consult-d-return",71,64,77,70],["lower-cross",2,82,86,88],["lower-centre-link",40,72,46,88],["ward-west",12,76,34,80],["ward-west-door",18,72,24,84],["ward-east",50,76,76,80],["ward-east-door",60,72,66,84],["south-ward-a",12,92,22,102],["south-ward-b",26,92,36,102],["south-ward-c",50,92,60,102],["south-ward-d",64,92,76,102],["south-a-north",14,86,20,94],["south-b-north",26,86,32,94],["south-c-north",52,86,58,94],["south-d-north",67,86,73,94],["entry-hall",2,106,86,112],["south-west-link",2,86,8,108],["south-a-return",14,100,20,108],["south-b-return",28,100,34,108],["south-c-return",52,100,58,108],["south-d-return",67,100,73,108],["observation-bypass",1,17,7,24]],"starts":[{"id":"lower-left","x":5,"y":109},{"id":"lower-centre","x":43,"y":109},{"id":"lower-right","x":83,"y":109}],"objective":{"x":15,"y":13},"combatAnchors":[{"x":20,"y":14},{"x":14,"y":9},{"x":24,"y":9},{"x":12,"y":14}],"doors":[{"id":"door-0","name":"전투실 출입문","x":20,"y":20,"width":6,"depth":0.24,"axis":"y","reach":3},{"id":"door-1","name":"하부 병실 문","x":29,"y":90,"width":6,"depth":0.24,"axis":"y","reach":3},{"id":"door-2","name":"관찰 병실 문","x":55,"y":52,"width":6,"depth":0.24,"axis":"y","reach":3}],"bays":[{"id":"south-west","x":17,"y":97,"wave":0},{"id":"south-east","x":70,"y":97,"wave":0},{"id":"middle-west","x":21,"y":60,"wave":1},{"id":"middle-east","x":59,"y":60,"wave":1}]});
function hospitalCoreContainsB2(x,y){return HOSPITAL_CORE_B2.rects.some(([,a,b,c,d])=>x>=a&&x<c&&y>=b&&y<d);}
function hospitalCoreLayoutB2(core,opened=[]){
 const cells=new Set(),key=(x,y)=>x+':'+y;
 for(const[,a,b,c,d]of HOSPITAL_CORE_B2.rects)for(let y=b;y<d;y++)for(let x=a;x<c;x++)cells.add(key(x,y));
 const floorCells=[...cells].map(k=>k.split(':').map(Number)),floors=[],active=new Map();
 for(let y=1;y<112;y++){
  const xs=floorCells.filter(p=>p[1]===y).map(p=>p[0]).sort((a,b)=>a-b),next=new Map();
  for(let i=0;i<xs.length;i++){const x=xs[i];let end=x;while(i+1<xs.length&&xs[i+1]===end+1)end=xs[++i];
   const tag=x+':'+(end-x+1),prior=active.get(tag);
   if(prior){prior.depth++;next.set(tag,prior);}else{const f={x,y,width:end-x+1,depth:1};floors.push(f);next.set(tag,f);}}
  active.clear();for(const[k,v]of next)active.set(k,v);
 }
 const segments=new Map();
 for(const[x,y]of floorCells)for(const[dx,dy,axis,level,along]of[[1,0,'v',x+1,y],[-1,0,'v',x,y],[0,1,'h',y+1,x],[0,-1,'h',y,x]]){
  if(cells.has(key(x+dx,y+dy)))continue;const tag=axis+':'+level;
  if(!segments.has(tag))segments.set(tag,[]);segments.get(tag).push(along);
 }
 const walls=[];let serial=0;
 for(const[tag,values]of segments){const[axis,level]=tag.split(':');values.sort((a,b)=>a-b);
  for(let i=0;i<values.length;i++){const start=values[i];let end=start;while(i+1<values.length&&values[i+1]===end+1)end=values[++i];
   const endpoints=axis==='v'?[[+level,start],[+level,end+1]]:[[start,+level],[end+1,+level]],span=end+1-start;
   const w={id:'hospital-b2-wall:'+serial++,hospitalCoreB2:true,x:(endpoints[0][0]+endpoints[1][0])/2,y:(endpoints[0][1]+endpoints[1][1])/2,
    width:span,depth:.24,height:2.7,angle:axis==='v'?Math.PI/2:0,endpoints,annex:true,analyticBoundary12:true,
    analyticBounds12:[Math.min(...endpoints.map(p=>p[0]))-.12,Math.min(...endpoints.map(p=>p[1]))-.12,
     Math.max(...endpoints.map(p=>p[0]))+.12,Math.max(...endpoints.map(p=>p[1]))+.12],
    path:'assets/visual-test/hospital-quiet-material-atlas-r42.png'};walls.push(w);
  }
 }
 // Closed door leaves share the hospital wall material and exact collision domain.
 for(const d of HOSPITAL_CORE_B2.doors)if(!opened.includes(d.id)){
  const endpoints=[[d.x-d.width/2,d.y],[d.x+d.width/2,d.y]];
  walls.push({id:'hospital-b3:'+d.id,hospitalCoreB2:true,hospitalDoorB3:d.id,x:d.x,y:d.y,width:d.width,depth:d.depth,height:2.7,angle:0,endpoints,annex:true,analyticBoundary12:true,analyticBounds12:[d.x-d.width/2,d.y-d.depth/2,d.x+d.width/2,d.y+d.depth/2],path:'assets/visual-test/hospital-quiet-material-atlas-r42.png'});
 }
 const nodes=HOSPITAL_CORE_B2.rects.map(([name,a,b,c,d],id)=>({id,name,x:(a+c)/2,y:(b+d)/2,radius:2,shape:'square'}));
 const starts=HOSPITAL_CORE_B2.starts.map(p=>({...p})),entry={...starts[1],node:HOSPITAL_CORE_B2.rects.findIndex(r=>r[0]==='entry-hall'),dx:-1,dy:-1};
 return{...core,version:EXPLORATION_VERSION,expanded:true,type:'hospital-ward-b3',hospitalCoreB2:HOSPITAL_CORE_B2,hospitalDoorsB3:HOSPITAL_CORE_B2.doors,
  hospitalLayoutRevision:HOSPITAL_CORE_B2.revision+':'+[...opened].sort().join(','),hospitalAnalytic12:true,hospitalBoundary12:walls,
  hospitalVisualWalls12:walls,hospitalPreviousWalls12:core.walls,hospitalWalkArea12:floorCells.length,
  hospitalWalkPolygons12:floors.map(f=>[[f.x,f.y],[f.x+f.width,f.y],[f.x+f.width,f.y+f.depth],[f.x,f.y+f.depth]]),
  bounds:[0,0,87,113],chunkMinX:0,chunkMinY:0,chunkColumns:9,chunkRows:12,
  walls,floorCells,floorRects:floors,coreFloorRects:[],coreReshaped:true,navigationCellsOnly12:true,
  connectorFloorRects:[],backdropRects:[],fogRects:[],nodes,edges:[],entry,starts,entrance:{...entry},
  gate:{x:31.5,y:31.5},doorUV:{u0:-3,u1:3,v0:50,v1:66},
  visitRoute:nodes.map(n=>n.id),combatRoomNodeIds:HOSPITAL_CORE_B2.bays.map(p=>HOSPITAL_CORE_B2.rects.findIndex(([,a,b,c,d])=>p.x>=a&&p.x<c&&p.y>=b&&p.y<d)),mazeFirst:true,
  sourceExits:REGIONAL_ROUTE_DATA.ep1a08.exits,branches:[],routeCycleRank:null,originalEncounterBounds:[1,1,29,29],
  originalPropsRelocated:false,renderEnvelope:{u0:-112,u1:58,v0:0,v1:200},
  surface:{...core.surface,art:REGIONAL_TERRAIN_ART.ep1a08}};
}
function hospitalCoreBlockedB2(L,x,y,radius){
 if(!hospitalCoreContainsB2(x,y))return true;
 return hospitalNearbyB3(L,x,y,x,y,radius+.12).some(w=>hospitalPointSegment12(x,y,...w.endpoints).distance<radius+HOSPITAL_CORE_B2.wallDepth/2);
}

// Spatial broad phase only: exact segment distance remains authoritative.
const hospitalWallBucketsB3=new WeakMap(),hospitalWallQueriesB3=new WeakMap();
function hospitalNearbyB3(L,x0,y0,x1,y1,r){
 let buckets=hospitalWallBucketsB3.get(L);if(!buckets){buckets=new Map();for(const w of L.hospitalBoundary12){const b=w.analyticBounds12;for(let y=Math.floor(b[1]/8);y<=Math.floor(b[3]/8);y++)for(let x=Math.floor(b[0]/8);x<=Math.floor(b[2]/8);x++){const k=x+':'+y;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(w);}}hospitalWallBucketsB3.set(L,buckets);}
 const a=Math.floor((Math.min(x0,x1)-r)/8),b=Math.floor((Math.min(y0,y1)-r)/8),c=Math.floor((Math.max(x0,x1)+r)/8),d=Math.floor((Math.max(y0,y1)+r)/8),key=[a,b,c,d].join(':');let queries=hospitalWallQueriesB3.get(L);if(!queries){queries=new Map();hospitalWallQueriesB3.set(L,queries);}if(queries.has(key))return queries.get(key);const out=new Set();for(let y=b;y<=d;y++)for(let x=a;x<=c;x++)for(const w of buckets.get(x+':'+y)||[])out.add(w);const rows=[...out];if(queries.size>=512)queries.delete(queries.keys().next().value);queries.set(key,rows);return rows;
}
