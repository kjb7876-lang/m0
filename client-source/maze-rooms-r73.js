/* Bounded, additive ward rooms. Existing floor, actors, story anchors and
 * native structures are retained; only annex boundary walls may open. */
function mazeRoomsR73(base,seed,id=base.id){
 if(!Number.isInteger(seed)||seed<1||seed>0xffffffff||!base.mazeFirst||base.hospitalAnalytic12)return base;
 let random=seed>>>0;const next=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random;},key=(x,y)=>x+':'+y;
 const original=new Set(base.floorCells.map(([x,y])=>key(x,y))),cells=new Set(original),added=new Set(),rooms=[],bounds=base.bounds;
 const candidates=[];for(const[x,y]of base.floorCells)if(x>=33)for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(!original.has(key(x+dx,y+dy)))candidates.push({x,y,dx,dy});
 const inside=(x,y)=>x>=32&&y>=2&&x+1<=bounds[2]-1&&y+1<=bounds[3]-1;
 let attempts=0;
 for(;attempts<24&&rooms.length<2&&candidates.length;attempts++){
  const at=next()%candidates.length,a=candidates.splice(at,1)[0],width=5+(next()%2),depth=5,center={x:a.x+a.dx*5,y:a.y+a.dy*5},x0=center.x-Math.floor(width/2),y0=center.y-2,proposal=new Set();
  for(let y=y0;y<y0+depth;y++)for(let x=x0;x<x0+width;x++)proposal.add(key(x,y));
  for(let step=0;step<=5;step++)for(let across=-1;across<=1;across++)proposal.add(key(a.x+a.dx*step-a.dy*across,a.y+a.dy*step+a.dx*across));
  const delta=[...proposal].filter(k=>!cells.has(k)).map(k=>k.split(':').map(Number));
  if(delta.length<15||added.size+delta.length>96||delta.some(([x,y])=>!inside(x,y)))continue;
  // Never cut through a native/core structure. All admitted cells are beyond
  // the unchanged native combat arena and are attached to an existing bay.
  if(base.walls.some(w=>!w.annex&&!w.decorative&&delta.some(([x,y])=>Math.abs(x+.5-w.x)<w.width/2+.5&&Math.abs(y+.5-w.y)<w.depth/2+.5)))continue;
  for(const[x,y]of delta){const k=key(x,y);cells.add(k);added.add(k);}rooms.push({x:x0,y:y0,width,depth,anchor:{x:a.x+.5,y:a.y+.5},door:1+(next()%2)});
 }
 if(!rooms.length)return{...base,mazeR73:{version:1,seed,attempts,rooms:[],addedCells:0,newWalls:0}};
 const delta=[...added].map(k=>k.split(':').map(Number)),remaining=base.walls.filter(w=>!w.annex||w.decorative||!delta.some(([x,y])=>Math.abs(x+.5-w.x)<w.width/2+.49&&Math.abs(y+.5-w.y)<w.depth/2+.49)),segments=new Map(),walls=[];
 for(const[x,y]of delta)for(const[dx,dy,axis,level,along]of[[1,0,'v',x+1,y],[-1,0,'v',x,y],[0,1,'h',y+1,x],[0,-1,'h',y,x]])if(!cells.has(key(x+dx,y+dy))){const tag=[axis,level,dx,dy].join(':');if(!segments.has(tag))segments.set(tag,[]);segments.get(tag).push(along);}
 const wall=(x,y,width,depth,kind)=>({id:'r73:ward:'+id+':'+seed+':'+walls.length,x,y,width,depth,height:1.6,path:'assets/props/v290/moss_boulders.webp',annex:true,mazeR73:true,wardPartR73:kind});
 for(const[tag,values]of segments){const[axis,level,dx,dy]=tag.split(':');values.sort((a,b)=>a-b);for(let i=0;i<values.length;i++){const start=values[i];let end=start;while(i+1<values.length&&values[i+1]===end+1)end=values[++i];const span=end-start+1,mid=(start+end+1)/2;walls.push(wall(axis==='v'?+level+(+dx)*.16:mid,axis==='h'?+level+(+dy)*.16:mid,axis==='v'?.32:span,axis==='h'?.32:span,'boundary'));}}
 if(walls.length>18)return{...base,mazeR73:{version:1,seed,attempts,rooms:[],addedCells:0,newWalls:0,reason:'bounded wall budget'}};
 for(const r of rooms){if(walls.length+2>18)break;const x=r.x+Math.floor(r.width/2),top=r.y,bottom=r.y+r.depth,door=top+r.door;
  // A two-cell doorway links the two ward bays; partitions occupy new cells
  // only and cannot seal the original route or a story/boss/portal approach.
  if(Array.from({length:r.depth},(_,i)=>[x-1,top+i]).concat(Array.from({length:r.depth},(_,i)=>[x,top+i])).every(([a,b])=>added.has(key(a,b)))){
   if(door>top)walls.push(wall(x,(top+door)/2,.26,door-top,'partition'));
   if(door+2<bottom)walls.push(wall(x,(door+2+bottom)/2,.26,bottom-door-2,'partition'));
  }
 }
 const rows=new Map();for(const[x,y]of delta){if(!rows.has(y))rows.set(y,[]);rows.get(y).push(x);}const rects=[];for(const[y,xs]of rows){xs.sort((a,b)=>a-b);for(let i=0;i<xs.length;i++){const x=xs[i];let end=x;while(i+1<xs.length&&xs[i+1]===end+1)end=xs[++i];rects.push({x,y,width:end-x+1,depth:1});}}
 const layout={...base,walls:[...remaining,...walls],floorCells:[...cells].map(k=>k.split(':').map(Number)).sort((a,b)=>a[1]-b[1]||a[0]-b[0]),floorRects:[...base.floorRects,...rects],mazeR73:{version:1,seed,attempts,rooms,addedCells:added.size,newWalls:walls.length,openedBoundaryWalls:base.walls.length-remaining.length}};
 const blocked=(x,y,r)=>explorationBlocked(layout,x,y,r),clear=(a,b,r)=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.2));for(let i=0;i<=n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,r))return false;return true;};
 // A fixed number of admission searches. On failure retain the exact original
 // map, with no resource, progress or portal changes.
 for(const r of rooms){const target={x:r.x+1.5,y:r.y+2.5};if(!explorationPath(layout,base.entry,target,.31,blocked,clear).length)return{...base,mazeR73:{version:1,seed,attempts,rooms:[],addedCells:0,newWalls:0,reason:'safe route unavailable'}};}
 return layout;
}
