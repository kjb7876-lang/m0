/* Source fragment injected into the pinned Three renderer by apply-r78.py.
 * It keeps each region's canonical core, exits, story art and source identity,
 * then wraps the core in the tested wide-room hospital maze grammar. */
const WORLD_LAYOUT_R78_SAFE_IDS=new Set(['hub','village','dreamRest','restEp1b','restU2','restLast3','restKairo','restHando']);
const WORLD_LAYOUT_R78_METRICS={built:0,skipped:0,failed:0,byId:Object.create(null)};
function worldLayoutR78Eligible(id,theme,safe){
 const coop=window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off';
 return !safe&&id!=='ep1a08'&&!WORLD_LAYOUT_R78_SAFE_IDS.has(id)&&!!theme&&
  !!StoryWorldProfilesR74.profiles[id]&&coop==='off';
}
function worldLayoutStoryR78(base,id,theme,safe,meta={}){
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
 const cell=(x,y)=>x+':'+y,floor=new Set(layout.floorCells.map(([x,y])=>cell(x,y))),outer=layout.nodes.map(n=>({id:n.id,x:n.x,y:n.y}));
 const floorAnchor=n=>{const x=Math.floor(n.x),y=Math.floor(n.y),at=cell(x,y);if(floor.has(at))return at;
  for(let r=1;r<=4;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const k=cell(x+dx,y+dy);if(floor.has(k))return k;}
  throw Error('R78 room anchor is not on floor: '+id+':'+n.id);
 };
 const distances=outer.map(n=>{const start=floorAnchor(n),d=new Map([[start,0]]),todo=[start];for(let i=0;i<todo.length;i++){
   const[x,y]=todo[i].split(':').map(Number),next=d.get(todo[i])+1;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=cell(x+dx,y+dy);if(floor.has(k)&&!d.has(k)){d.set(k,next);todo.push(k);}}
  }return d;});
 const connected=new Set([11]),edges=[];while(connected.size<outer.length){let best=null;for(const a of connected)for(let b=0;b<outer.length;b++)if(!connected.has(b)){
   const distance=distances[a].get(floorAnchor(outer[b]));if(distance!==undefined&&(!best||distance<best.distance||distance===best.distance&&(a<best.a||a===best.a&&b<best.b)))best={a,b,distance};
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
