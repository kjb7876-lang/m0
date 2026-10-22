import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRuntime, hash, html, site } from './runtime.mjs';

const ROOT='docs/hospital-b3-evidence/';
const OUT='out/hospital-b3-stability/evidence/room-dressing.json';
const h=createRuntime(),run=h.run,json=s=>JSON.parse(run('JSON.stringify('+s+')'));
const plan=JSON.parse(fs.readFileSync('client-source/hospital-b3/room-dressing-plan.json','utf8'));
const baselineRestore=JSON.parse(fs.readFileSync(ROOT+'restore-baseline-control.json','utf8'));
const report={
  candidateHTMLSHA256:hash(html),
  rendererSHA256:hash(fs.readFileSync(site+'/dist/phase1.js')),
  planSHA256:hash(fs.readFileSync('client-source/hospital-b3/room-dressing-plan.json')),
  testSourceSHA256:hash(fs.readFileSync(new URL(import.meta.url))),
  harnessSourceSHA256:hash(fs.readFileSync(new URL('./runtime.mjs',import.meta.url))),
  method:'Actual production HTML loaded in an isolated Node VM; actual projected DrawCommands bounds and pathTo3 paths; door/save tests use synthetic in-memory save only. No browser, raster, GPU, user save, or natural play.',
  passes:[],
  substitutions:['DOM/layout/canvas/audio endpoints are inert stubs from evidence/runtime.mjs','Image pixel decode is stubbed; existing file existence and SHA are checked','Synthetic STORY progress and direct lower-centre entry; only in-memory state','Frame drawing uses the production drawProp/DrawCommands code with an image-size stub']
};
let projectionViolations=[];
const pass=(name,data)=>{report.passes.push({name,...data});console.log('PASS',name);};

try{
  h.install();
  await run('boot()');
  run(`player=freshPlayer('hwando');started=true;modal=false;storyScene=null;storyQueue=[];storyDone=null;settings.narration=false;settings.sound=false;settings.music=false;auto=false;guide=false;progress={STORY:{},DREAM:{}};for(const id of __STORYWORLD_STORY_PROFILE_R54__.campaignOrder){if(id==='ep1a08')break;progress.STORY[id]=true;}layer='STORY';zone='ep1a08';world={};room=getRoom(zone,layer);player.x=43;player.y=109;`);
  assert.equal(run("room.exploration.hospitalLayoutRevision.startsWith('ep1a08-ward-network-b3-v1')"),true);
  const grid=json("({bounds:room.exploration.bounds,minX:room.exploration.chunkMinX,minY:room.exploration.chunkMinY,columns:room.exploration.chunkColumns,rows:room.exploration.chunkRows,starts:room.exploration.starts.map(p=>[p.x,p.y])})");
  const extent=grid.bounds,chunkPoints=[[extent[0],extent[1]],[extent[2],extent[3]],...grid.starts];
  for(const [x,y] of chunkPoints)assert.ok(Math.floor(x/10)>=grid.minX&&Math.floor(x/10)<grid.minX+grid.columns&&Math.floor(y/10)>=grid.minY&&Math.floor(y/10)<grid.minY+grid.rows,`hospital chunk grid omits (${x},${y})`);
  pass('production chunk grid covers the full hospital bounds and all three starts',{bounds:extent,columns:grid.columns,rows:grid.rows,startCount:grid.starts.length,chunkSize:10});
  // Execute the actual terrain activation method/helper with resource-only Three
  // stubs. This checks the active exploration reference, not a copied predicate.
  const apronCases=json(`(()=>{
    class Geometry{setAttribute(){return this;}setIndex(){return this;}computeVertexNormals(){return this;}}
    class Attribute{constructor(array,size){this.array=array;this.itemSize=size;}}
    class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;this.userData={};this.layers={set(){}};}}
    const rows=[],L=room.exploration,art=L.surface.art;
    for(const enabled of [false,true])for(const b3 of [false,true]){
      const prior=window.__STORYWORLD_VISUAL_OPTIONS__;window.__STORYWORLD_VISUAL_OPTIONS__={...prior,enabled};
      try{
        const added=[],key='apron-test',renderer={spatialBuilt:true,T:{BufferGeometry:Geometry,Float32BufferAttribute:Attribute,Mesh},floorRows:new Map([[key,{}]]),bridgeRows:new Map(),bridgeMaterial:{},backdropRows:new Map(),fogRows:new Map(),wallRows:new Map(),spatialRoot:{add:m=>added.push(m)},currentMazeR73:null,mazeLayoutR73:b3?L:{...L,hospitalDoorsB3:undefined}};
        StoryPhase1.ThreeRenderer.prototype.activateTerrain.call(renderer,{key,zone:'ep1a08',descriptor:{floor:L.floorRects,terrainArt:art}});
        rows.push({b3,enabled,aprons:renderer.bridgeRows.size,added:added.length,currentMazeIsNull:renderer.currentMazeR73===null});
      }finally{window.__STORYWORLD_VISUAL_OPTIONS__=prior;}
    }return rows;
  })()`);
  for(const c of apronCases)assert.equal(c.aprons,c.b3?0:1,JSON.stringify(c));
  pass('actual Three terrain activation suppresses obsolete B3 apron using active exploration with visual options on/off and preserves legacy apron',{cases:apronCases,ThreeResourcesStubbed:true,GPUCompiled:false});
  const baseHTML='out/hospital-b2/site/index.html';
  const oldRenderer='976036fb3e3f4de132ba36ca0d59e013d5a6c34aef88a51ee33bd623db555ee3';
  assert.equal(hash(fs.readFileSync(site+'/dist/phase1.js')),oldRenderer);
  assert.equal(hash(fs.readFileSync(site+'/'+plan.sourceImage)),hash(fs.readFileSync('out/hospital-b2/site/'+plan.sourceImage)));
  assert.ok(fs.existsSync(site+'/'+plan.sourceImage));
  pass('candidate reuses the exact B3 runtime, renderer, and existing hospital prop image',{baseHTML,rendererMatchesExpectedCandidate:true,sourceImage:plan.sourceImage});

  const rows=json('__STORYWORLD_VISUAL_TEST__.props(room).map(p=>({id:p.id,room:p.roomIdB3,purpose:p.roomFunctionB3,frame:p.visualHospitalFrame,visualHospitalFrame:p.visualHospitalFrame,x:p.x,y:p.y,height:p.height,flipX:p.visualFlipXB3,visualFlipXB3:p.visualFlipXB3,hospitalDressingB3:p.hospitalDressingB3,solid:p.solid,presentationOnly:p.presentationOnly,zone:p.hospitalZone13,hospitalZone13:p.hospitalZone13,path:p.path}))');
  const furnishings=rows.filter(p=>p.id?.startsWith('hospital-dressing-b3:'));
  assert.equal(furnishings.length,plan.items.length);
  const roomRects=json('room.exploration.hospitalCoreB2.rects');
  const bays=json('room.exploration.hospitalCoreB2.bays');
  const starts=json('room.exploration.starts');
  const objective=json('room.exploration.hospitalCoreB2.objective');
  const anchors=json('room.exploration.hospitalCoreB2.combatAnchors');
  const doors=json('room.exploration.hospitalDoorsB3');
  let minimumWallMargin=Infinity,minimumWallClearanceMargin=Infinity;
  for(const item of plan.items){
    const p=furnishings.find(row=>row.id==='hospital-dressing-b3:'+item.id);
    assert.ok(p,`missing ${item.id}`);
    assert.equal(p.room,item.room);assert.equal(p.purpose,item.purpose);assert.equal(p.frame,item.frame);
    assert.equal(p.x,item.x);assert.equal(p.y,item.y);assert.equal(p.height,item.height);assert.equal(p.flipX,item.flipX);assert.equal(p.hospitalDressingB3,true);assert.equal(p.solid,false);
    assert.equal(p.presentationOnly,true);assert.equal(p.zone,true);assert.equal(p.path,plan.sourceImage);
    const rect=roomRects.find(r=>r[0]===item.room);assert.ok(rect,`unknown room ${item.room}`);
    assert.ok(p.x>=rect[1]&&p.x<rect[3]&&p.y>=rect[2]&&p.y<rect[4],`outside ${item.room}`);
    const wallMargin=Math.min(p.x-rect[1],rect[3]-p.x,p.y-rect[2],rect[4]-p.y),frameDef=json(`__STORYWORLD_VISUAL_TEST__.frames['${item.frame}']`),estimatedFootprintRadius=frameDef.rect[2]/frameDef.pivot[1]*item.height/(2*run('TILE'));
    minimumWallMargin=Math.min(minimumWallMargin,wallMargin);minimumWallClearanceMargin=Math.min(minimumWallClearanceMargin,wallMargin-estimatedFootprintRadius);
    assert.ok(wallMargin>=estimatedFootprintRadius+.35,`estimated sprite base too close to room boundary ${item.id}: ${wallMargin.toFixed(2)} vs ${estimatedFootprintRadius.toFixed(2)}`);
    assert.equal(run(`blocked(${p.x},${p.y},.35,room)`),false,`blocked decor centre ${item.id}`);
    assert.ok(Math.min(...bays.map(q=>Math.hypot(p.x-q.x,p.y-q.y)))>=plan.contracts.startAndEncounterBayClearance,`too close to wave bay ${item.id}`);
    assert.ok(Math.min(...starts.map(q=>Math.hypot(p.x-q.x,p.y-q.y)))>=plan.contracts.startAndEncounterBayClearance,`too close to entry ${item.id}`);
    assert.ok(Math.min(...doors.map(q=>Math.hypot(p.x-q.x,p.y-q.y)))>3,`too close to door threshold ${item.id}`);
    assert.ok(Math.hypot(p.x-objective.x,p.y-objective.y)>6,`too close to objective ${item.id}`);
    assert.ok(Math.min(...anchors.map(q=>Math.hypot(p.x-q.x,p.y-q.y)))>6,`too close to combat anchor ${item.id}`);
    assert.ok(!(p.x>=10&&p.x<28&&p.y>=6&&p.y<18),`combat room has dressing ${item.id}`);
  }
  pass('11 furnishings stay within room boundaries with differentiated scale/mirroring and clear gameplay anchors',{items:furnishings.length,combatRoomProps:0,allCentersWalkable:true,allPresentationOnly:true,uniqueHeights:[...new Set(furnishings.map(p=>p.height))].sort((a,b)=>a-b),mirroredItems:furnishings.filter(p=>p.flipX).map(p=>p.id),minimumAnchorToWallUnits:minimumWallMargin,minimumEstimatedFootprintWallClearanceUnits:+minimumWallClearanceMargin.toFixed(2)});

  // Use production pathTo3 plus the production project() and drawProp() output.
  // Sprite bounds are the entire rendered source rectangle, which is conservative
  // for its transparent pixels. Route checks include a 10px*zoom safety margin.
  const portalPoints=json('__STORYWORLD_ROUTES_R72__.points(room)');
  assert.ok(portalPoints.next&&portalPoints.previous,'existing next/previous portal anchors available');
  const routeSpecs=[
    ...starts.map(s=>({name:s.id+' to objective',from:{x:s.x,y:s.y},to:{x:objective.x,y:objective.y}})),
    {name:'lower-centre to next portal',from:{x:starts[1].x,y:starts[1].y},to:portalPoints.next},
    {name:'lower-centre to previous portal',from:{x:starts[1].x,y:starts[1].y},to:portalPoints.previous},
    {name:'lower-left to door-1 approach',from:{x:starts[0].x,y:starts[0].y},to:{x:29,y:88}},
    {name:'lower-right to door-2 approach',from:{x:starts[2].x,y:starts[2].y},to:{x:55,y:49}}
  ];
  h.box.reviewProps=furnishings;
  h.box.reviewRouteSpecs=routeSpecs;
  const routes=json(`reviewRouteSpecs.map(s=>{const tail=pathTo3(s.from,s.to,.35,room);return{name:s.name,points:[s.from,...tail]}})`);
  for(const r of routes)assert.ok(r.points.length>1,`missing production route ${r.name}`);
  report.productionRoutes=routes;
  h.box.reviewRoutes=routes;
  const criticals=[
    ...starts.map(p=>({id:'start:'+p.id,x:p.x,y:p.y})),
    ...bays.map(p=>({id:'wave:'+p.id,x:p.x,y:p.y})),
    {id:'objective',x:objective.x,y:objective.y},
    ...anchors.map((p,i)=>({id:'combat-anchor:'+i,x:p.x,y:p.y})),
    ...doors.map(p=>({id:'door:'+p.id,x:p.x,y:p.y})),
    {id:'next-portal',...portalPoints.next},{id:'previous-portal',...portalPoints.previous}
  ];
  h.box.reviewCriticals=criticals;
  // Take the aperture from the same closed wall layout that drives production
  // drawing/collision; axis labels describe passage direction, not leaf direction.
  const doorLines=json('StoryPhase1.hospitalCoreLayoutB2(room.exploration,[]).hospitalBoundary12.filter(w=>w.hospitalDoorB3).map(w=>({id:w.hospitalDoorB3,a:{x:w.endpoints[0][0],y:w.endpoints[0][1]},b:{x:w.endpoints[1][0],y:w.endpoints[1][1]}}))');
  assert.equal(doorLines.length,doors.length);
  for(const d of doors){const line=doorLines.find(l=>l.id===d.id);assert.deepEqual(line,{id:d.id,a:{x:d.x-d.width/2,y:d.y},b:{x:d.x+d.width/2,y:d.y}});}
  h.box.reviewDoorLines=doorLines;
  function rectFromPoints(points){return{minX:Math.min(...points.map(p=>p[0])),maxX:Math.max(...points.map(p=>p[0])),minY:Math.min(...points.map(p=>p[1])),maxY:Math.max(...points.map(p=>p[1]))};}
  function hitsRect(a,b,r,pad){let t0=0,t1=1,dx=b.x-a.x,dy=b.y-a.y;const l=r.minX-pad,rr=r.maxX+pad,t=r.minY-pad,bb=r.maxY+pad;for(const[p,q]of[[-dx,a.x-l],[dx,rr-a.x],[-dy,a.y-t],[dy,bb-a.y]]){if(p===0){if(q<0)return false;continue;}const u=q/p;if(p<0){if(u>t1)return false;if(u>t0)t0=u;}else{if(u<t0)return false;if(u<t1)t1=u;}}return true;}
  const projected=[];
  const zooms=[.75,1,1.25,1.6];
  const cameraBefore=run('cam'),zoomBefore=run('zoom');
  h.box.reviewProjectedCtx=run('ctx');h.box.reviewProjectedReadyImage=run('readyImage');
  run(`readyImage=path=>({image:{naturalWidth:1536,naturalHeight:1024},crop:{x:0,y:0,w:1536,h:1024}});`);
  for(let i=0;i<furnishings.length;i++)for(const z of zooms){
    run(`zoom=${z};cam={x:reviewProps[${i}].x,y:reviewProps[${i}].y};reviewDraw=new StoryPhase1.DrawCommands({});ctx=reviewDraw;drawProp(reviewProps[${i}]);`);
    const image=json(`(()=>{const c=reviewDraw.commands.find(c=>c.kind==='image');return c?{sourceRect:c.sourceRect,points:c.points}:null})()`);
    assert.ok(image,`production image command missing ${furnishings[i].id} at zoom ${z}; prop=${JSON.stringify(furnishings[i])}; commands=${JSON.stringify(json('reviewDraw.commands.map(c=>({kind:c.kind,sourceRect:c.sourceRect,points:c.points}))'))}`);
    assert.deepEqual(image.sourceRect,json(`__STORYWORLD_VISUAL_TEST__.frames['${furnishings[i].frame}'].rect`));
    assert.ok(furnishings[i].flipX?image.points[0][0]>image.points[1][0]:image.points[0][0]<image.points[1][0],`horizontal facing variant not represented by production draw command ${furnishings[i].id}`);
    const box=rectFromPoints(image.points);
    const projectedRoutes=json(`reviewRoutes.map(r=>({name:r.name,points:r.points.map(p=>{const q=project(p.x,p.y);return{x:q.x,y:q.y}})}))`);
    const screenCriticals=json(`reviewCriticals.map(p=>{const q=project(p.x,p.y);return{id:p.id,x:q.x,y:q.y}})`);
    const screenDoors=json(`reviewDoorLines.map(d=>({id:d.id,a:(()=>{const q=project(d.a.x,d.a.y);return{x:q.x,y:q.y}})(),b:(()=>{const q=project(d.b.x,d.b.y);return{x:q.x,y:q.y}})()}))`);
    const pad=10*z,routeHits=[];
    for(const route of projectedRoutes)for(let k=1;k<route.points.length;k++)if(hitsRect(route.points[k-1],route.points[k],box,pad)){routeHits.push(route.name);break;}
    const criticalHits=screenCriticals.filter(p=>p.x>=box.minX-pad&&p.x<=box.maxX+pad&&p.y>=box.minY-pad&&p.y<=box.maxY+pad).map(p=>p.id);
    const doorHits=screenDoors.filter(d=>hitsRect(d.a,d.b,box,pad)).map(d=>d.id);
    projected.push({id:furnishings[i].id,zoom:z,bounds:Object.fromEntries(Object.entries(box).map(([k,v])=>[k,+v.toFixed(2)])),widthPx:+(box.maxX-box.minX).toFixed(2),heightPx:+(box.maxY-box.minY).toFixed(2),routeHits,criticalHits,doorHits});
  }
  projectionViolations=projected.filter(p=>p.routeHits.length||p.criticalHits.length||p.doorHits.length);
  report.projectedSpriteAudit={method:'actual production DrawCommands destination corners, full source rectangles (conservative transparent bounds), production pathTo3 route polylines at four zooms; actual production closed-leaf endpoints',routeCount:routes.length,routeSteps:Object.fromEntries(routes.map(r=>[r.name,r.points.length-1])),zooms,frames:projected,violations:projectionViolations};
  h.box.reviewCameraBefore=cameraBefore;h.box.reviewZoomBefore=zoomBefore;
  run('ctx=reviewProjectedCtx;readyImage=reviewProjectedReadyImage;cam=reviewCameraBefore;zoom=reviewZoomBefore;');

  const before=json(`(()=>({props:room.props.map(p=>({id:p.id,x:p.x,y:p.y,solid:p.solid})),floor:room.exploration.floorCells,doors:window.__STORYWORLD_WORLD_R74__.inspect().doors.map(d=>({id:d.id,open:d.open})),actors:room.enemies.map(e=>({id:e.id,hp:e.hp,maxHp:e.maxHp,dead:e.deadRecorded,spawn:e.spawnState})),save:serializeSave().worldR74,los:clearLine({x:12,y:9},{x:26,y:15},room)}))()`);
  const propRef=run('room.props');
  h.box.reviewProps=furnishings;
  h.box.reviewCtx=run('ctx');
  h.box.reviewReadyImage=run('readyImage');
  run(`readyImage=path=>({image:{naturalWidth:1536,naturalHeight:1024},crop:{x:0,y:0,w:1536,h:1024}});`);
  const visible=[];
  for(let i=0;i<furnishings.length;i++){
    h.box.reviewZoom=.9+(i%3)*.35;
    run(`zoom=reviewZoom;cam={x:reviewProps[${i}].x,y:reviewProps[${i}].y};reviewDraw=new StoryPhase1.DrawCommands({});ctx=reviewDraw;drawProp(reviewProps[${i}]);`);
    const commands=json('reviewDraw.commands.map(c=>({type:c.type,sourceRect:c.sourceRect,owner:c.owner?.id}))');
    assert.ok(commands.length>0,`no draw commands for ${furnishings[i].id}`);
    visible.push({id:furnishings[i].id,commands:commands.length,zoom:.9+(i%3)*.35});
  }
  run('ctx=reviewCtx;readyImage=reviewReadyImage;');
  const after=json(`(()=>({props:room.props.map(p=>({id:p.id,x:p.x,y:p.y,solid:p.solid})),floor:room.exploration.floorCells,doors:window.__STORYWORLD_WORLD_R74__.inspect().doors.map(d=>({id:d.id,open:d.open})),actors:room.enemies.map(e=>({id:e.id,hp:e.hp,maxHp:e.maxHp,dead:e.deadRecorded,spawn:e.spawnState})),save:serializeSave().worldR74,los:clearLine({x:12,y:9},{x:26,y:15},room)}))()`);
  assert.deepEqual(after,before);
  assert.equal(run('room.props'),propRef);
  pass('production drawing creates commands while leaving collision, LOS, actors, doors, floor and save state unchanged',{drawnItems:visible,gameplayStateUnchanged:true,persistentPropsAdded:0});

  // Existing optional branch doors remain the only stateful gates. The furniture
  // only marks rooms on their far side and is not a new route/lock/reward.
  const furnishIds=()=>json("__STORYWORLD_VISUAL_TEST__.props(room).filter(p=>p.id?.startsWith('hospital-dressing-b3:')).map(p=>p.id)");
  const expectedFurnishIds=furnishings.map(p=>p.id).sort();
  for(const [doorId,from,to] of [
    ['door-1',{x:29,y:92},{x:33.5,y:98.2}],
    ['door-2',{x:55,y:54},{x:63.6,y:64.0}]
  ]){
    const d=doors.find(v=>v.id===doorId);assert.ok(d);
    assert.deepEqual(furnishIds().sort(),expectedFurnishIds);
    run(`player.x=${d.x};player.y=${d.y+2};`);
    assert.equal(run(`blocked(${d.x},${d.y},.35,room)`),true,`${doorId} closed aperture remains a physical blocker`);
    assert.equal(run(`__STORYWORLD_WORLD_R74__.use({id:'${doorId}'})`),true,`${doorId} opens through existing helper`);
    assert.equal(run(`blocked(${d.x},${d.y},.35,room)`),false,`${doorId} open aperture clears collision`);
    assert.equal(run(`clearPath3({x:${from.x},y:${from.y}},{x:${to.x},y:${to.y}},.35,room)`),true,`${doorId} opens a path to its optional furnished branch`);
    assert.deepEqual(furnishIds().sort(),expectedFurnishIds,`${doorId} open lost or duplicated furnishings`);
    assert.equal(run(`__STORYWORLD_WORLD_R74__.use({id:'${doorId}'})`),true,`${doorId} closes through existing helper`);
    assert.equal(run(`blocked(${d.x},${d.y},.35,room)`),true,`${doorId} closed aperture restores collision`);
    assert.deepEqual(furnishIds().sort(),expectedFurnishIds,`${doorId} closed lost or duplicated furnishings`);
  }
  pass('existing door open/close still leads to furnished optional ward/consult branches without duplicates',{doors:['door-1','door-2'],newLocks:false,newRewards:false,newNarrative:false});

  // Restore a synthetic production save containing the two opened branches.
  for(const doorId of ['door-1','door-2']){const d=doors.find(v=>v.id===doorId);run(`player.x=${d.x};player.y=${d.y+2};`);assert.equal(run(`__STORYWORLD_WORLD_R74__.use({id:'${doorId}'})`),true);}
  const beforeRestore=json(`(()=>({layout:room.exploration.floorCells,actors:room.enemies.map(e=>({id:e.id,hp:e.hp,maxHp:e.maxHp,dead:e.deadRecorded,spawn:e.spawnState})),opened:serializeSave().worldR74.opened['STORY:ep1a08'],roomProps:room.props.filter(p=>p.id?.startsWith('hospital-dressing-b3:')).map(p=>p.id)}))()`);
  h.box.reviewRaw=JSON.parse(JSON.stringify(json('serializeSave()')));
  const restoreResult=await run('restoreSave(reviewRaw)');assert.equal(restoreResult,true,'production restoreSave accepts the synthetic in-memory copy');
  assert.equal(run('zone'),'ep1a08');assert.equal(run('layer'),'STORY');
  let scenes=0;while(run('!!storyScene')){assert.ok(scenes++<150);run('advanceScene()');}run('closePanel(true);auto=false;guide=false;keys.clear();');
  const restoredIds=furnishIds();assert.equal(restoredIds.length,plan.items.length);assert.equal(new Set(restoredIds).size,plan.items.length);assert.deepEqual(restoredIds.sort(),expectedFurnishIds);
  const afterRestore=json(`(()=>({layout:room.exploration.floorCells,actors:room.enemies.map(e=>({id:e.id,hp:e.hp,maxHp:e.maxHp,dead:e.deadRecorded,spawn:e.spawnState})),opened:serializeSave().worldR74.opened['STORY:ep1a08'],roomProps:room.props.filter(p=>p.id?.startsWith('hospital-dressing-b3:')).map(p=>p.id)}))()`);
  const beforeActorIdentity=beforeRestore.actors.map(({id,dead,spawn})=>({id,dead,spawn})),afterActorIdentity=afterRestore.actors.map(({id,dead,spawn})=>({id,dead,spawn})),beforeActors=new Map(beforeRestore.actors.map(e=>[e.id,e])),restoreHpDeltas=afterRestore.actors.filter(e=>beforeActors.has(e.id)&&(e.hp!==beforeActors.get(e.id).hp||e.maxHp!==beforeActors.get(e.id).maxHp)).map(e=>({id:e.id,beforeHp:beforeActors.get(e.id).hp,afterHp:e.hp,beforeMaxHp:beforeActors.get(e.id).maxHp,afterMaxHp:e.maxHp}));
  assert.deepEqual(afterRestore.layout,beforeRestore.layout);assert.deepEqual(afterActorIdentity,beforeActorIdentity);assert.deepEqual(restoreHpDeltas,baselineRestore.hpDeltas,'synthetic HP normalization matches the unchanged B3 stability baseline');assert.deepEqual(afterRestore.opened,beforeRestore.opened);assert.deepEqual(afterRestore.roomProps,[]);
  pass('synthetic production save reentry preserves door/layout/actor identity and leaves exactly 11 temporary props without serializing them',{savedDoors:afterRestore.opened,restoredProps:restoredIds.length,uniqueRestoredProps:new Set(restoredIds).size,actorIdentityAndDeathSpawnUnchanged:true,layoutUnchanged:true,syntheticActorHPNormalizationMatchesB3Baseline:restoreHpDeltas.length,baselineControlHTMLSHA256:baselineRestore.baselineHTMLSHA256,originalUserSave:false});

  const disabledBefore=json('__STORYWORLD_VISUAL_TEST__.inspect().stats');
  run("window.__STORYWORLD_VISUAL_OPTIONS__.enabled=false;reviewDraw=new StoryPhase1.DrawCommands({});ctx=reviewDraw;drawProp(reviewProps[0]);");
  assert.equal(run('reviewDraw.commands.length'),0);
  run('ctx=reviewCtx;readyImage=reviewReadyImage;window.__STORYWORLD_VISUAL_OPTIONS__.enabled=true;');
  pass('visual option off continues to hide the supplemental presentation layer',{disabledDrawCommands:0,statsBefore:disabledBefore});

  assert.deepEqual(projectionViolations,[],`projected sprites overlap routes, door apertures or critical markers: ${JSON.stringify(projectionViolations)}`);
  pass('projected sprite extents clear production paths, door apertures, starts, wave bays, objective, portals and combat anchors at four zooms',{routeCount:routes.length,routeSteps:Object.fromEntries(routes.map(r=>[r.name,r.points.length-1])),zooms,drawBounds:projected.length,screenOrGPUVerified:false});

  report.status='passed';
  report.passCount=report.passes.length;
  report.failCount=0;
}catch(error){
  report.status='failed';report.error=error.stack;report.failCount=1;
  console.error(error.stack);
}
fs.writeFileSync(OUT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,passes:report.passCount,failures:report.failCount}));
if(report.failCount)process.exitCode=1;
