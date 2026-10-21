/* Local ep1a08 solo spatial candidate. No actors, damage or saved schema. */
const HOSPITAL_CORE_B2=Object.freeze({revision:'ep1a08-core-network-b2-v1',wallDepth:.24,
 rects:[
  ['combat',10,6,26,17],['observation',5,6,10,17],['preparation',6,20,26,24],
  ['inner-west-door',10,16,14,21],['inner-east-door',22,16,26,21],
  ['foyer',11,28,28,36],['spine',14,23,19,30],
  ['west-lower',-3,14,4,25],['west-upper',-3,2,4,12],
  ['west-spine',-1,10,3,29],['west-return',-1,26,18,30],['west-door',3,13,7,18],
  ['east-upper',28,6,36,16],['east-lower',28,19,36,28],
  ['east-spine',30,2,34,32],['east-return',22,27,34,32],['east-door',25,10,31,14],
  ['north-loop',1,0,33,4],['north-door',14,3,18,7],['exit-vestibule',3,3,10,10],
  ['native-left-approach',6,23,12,28],['native-front-approach',22,22,28,28],
  ['south-seam',24,28,35,35]
 ],
 starts:[{id:'lower-left',x:14,y:32},{id:'lower-centre',x:18,y:32},{id:'lower-right',x:22,y:32}],
 objective:{x:15,y:13},combatAnchors:[{x:20,y:14},{x:14,y:9},{x:22,y:9},{x:12,y:14}],
 doors:[{id:'inner-west',x:12,y:18.5,width:4},{id:'inner-east',x:24,y:18.5,width:4},
  {id:'west-ward',x:5,y:15.5,width:5},{id:'north',x:16,y:5,width:4},
  {id:'upper-exit',x:10,y:8,width:4}],
 bays:[{id:'left-upper',x:.5,y:7,wave:0},{id:'right-upper',x:32,y:11,wave:0},
  {id:'left-lower',x:.5,y:19.5,wave:1},{id:'right-lower',x:32,y:23.5,wave:1}]
});
function hospitalCoreContainsB2(x,y){return HOSPITAL_CORE_B2.rects.some(([,a,b,c,d])=>x>=a&&x<c&&y>=b&&y<d);}
function hospitalCoreLayoutB2(core){
 const cells=new Set(),key=(x,y)=>x+':'+y;
 for(const[,a,b,c,d]of HOSPITAL_CORE_B2.rects)for(let y=b;y<d;y++)for(let x=a;x<c;x++)cells.add(key(x,y));
 const floorCells=[...cells].map(k=>k.split(':').map(Number)),floors=[],active=new Map();
 for(let y=0;y<36;y++){
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
 const nodes=HOSPITAL_CORE_B2.rects.map(([name,a,b,c,d],id)=>({id,name,x:(a+c)/2,y:(b+d)/2,radius:2,shape:'square'}));
 const starts=HOSPITAL_CORE_B2.starts.map(p=>({...p})),entry={...starts[1],node:6,dx:-1,dy:-1};
 return{...core,version:EXPLORATION_VERSION,expanded:true,type:'hospital-core-b2',hospitalCoreB2:HOSPITAL_CORE_B2,
  hospitalLayoutRevision:HOSPITAL_CORE_B2.revision,hospitalAnalytic12:true,hospitalBoundary12:walls,
  hospitalVisualWalls12:walls,hospitalPreviousWalls12:core.walls,hospitalWalkArea12:floorCells.length,
  hospitalWalkPolygons12:floors.map(f=>[[f.x,f.y],[f.x+f.width,f.y],[f.x+f.width,f.y+f.depth],[f.x,f.y+f.depth]]),
  bounds:[-4,-1,37,37],chunkMinX:-1,chunkMinY:-1,chunkColumns:5,chunkRows:5,
  walls,floorCells,floorRects:floors,coreFloorRects:[],coreReshaped:true,navigationCellsOnly12:true,
  connectorFloorRects:[],backdropRects:[],fogRects:[],nodes,edges:[],entry,starts,entrance:{...entry},
  gate:{x:31.5,y:31.5},doorUV:{u0:-3,u1:3,v0:50,v1:66},
  visitRoute:nodes.map(n=>n.id),combatRoomNodeIds:[0,1,2,7,8,12,13],mazeFirst:true,
  sourceExits:REGIONAL_ROUTE_DATA.ep1a08.exits,branches:[],routeCycleRank:null,originalEncounterBounds:[1,1,29,29],
  originalPropsRelocated:false,renderEnvelope:{u0:-39,u1:39,v0:-2,v1:74},
  surface:{...core.surface,art:REGIONAL_TERRAIN_ART.ep1a08}};
}
function hospitalCoreBlockedB2(L,x,y,radius){
 if(!hospitalCoreContainsB2(x,y))return true;
 return L.hospitalBoundary12.some(w=>hospitalPointSegment12(x,y,...w.endpoints).distance<radius+HOSPITAL_CORE_B2.wallDepth/2);
}
