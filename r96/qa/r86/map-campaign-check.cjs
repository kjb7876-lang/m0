'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{createHarness}=require('../harness.cjs');
const report={schema:'r86-all-campaign-map-admission/v1',method:'Native new game and 777 activate/go/difficulty UI across the entire 64-region story campaign; native collision, path and RenderBridge capture. Scripted positions and timers, no browser/GPU or natural-play validation.',checks:[],maps:[],geometry:[],browserVerified:false,GPUVerified:false,naturalPlayVerified:false};
const out=path.join(__dirname,'map-campaign-results.json');
function write(){fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
function check(name,passed,detail){report.checks.push({name,passed:!!passed,detail});console.log(passed?'PASS':'FAIL',name);write();}
(async()=>{
 const h=createHarness({timeoutMs:90000}),run=s=>h.run(s);const boot=await h.boot();check('Native runtime boots',boot.booted&&!boot.errors.length,boot.errors);
 await run("newGame('hwando')");const dismiss=()=>run('for(let i=0;i<100&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);auto=false;guide=false;');dismiss();
 const normal=JSON.parse(JSON.stringify(run('serializeSave()'))),order=run('[...__STORYWORLD_STORY_PROFILE_R54__.campaignOrder]');
 check('Opening is the canonical safe refuge',run("zone==='hub'&&room.exploration.refugeR82?.safe&&!blocked(player.x,player.y,.34,room)"));
 const activation=await run("__STORYWORLD_CHEAT777__.activate('777')");check('777 activates from the untouched opening checkpoint',activation.ok&&run('__STORYWORLD_CHEAT777__.active()'),activation);
 const unique=new Map();
 for(const id of order){
  h.context.mapTargetR86=id;let result=await run("__STORYWORLD_CHEAT777__.go(mapTargetR86,'STORY')");
  if(run('__STORYWORLD_PROGRESSION_R71__.difficultyState().open')){run("__STORYWORLD_PROGRESSION_R71__.selectDifficulty('normal')");result=await run('__STORYWORLD_PROGRESSION_R71__.confirmDifficulty()');}dismiss();
  const row=run(`(()=>{const L=room.exploration,controlled=__STORYWORLD_WORLD_COMBAT_R78__.controlled(room),P=__STORYWORLD_ROUTES_R72__.points(),frame=__STORYWORLD_PHASE1__.capture(),floor=new Set(L.floorCells.map(p=>p.join(':')));return{id:zone,title:regionById[zone].title,safe:!!regionById[zone].safe,type:L.type,ward:!!L.worldWardR81,hospital:!!L.hospitalCoreB2,loading,modal,started,heroSafe:!blocked(player.x,player.y,.34,room),frameReady:frame.ready,heroEntities:frame.entities.filter(e=>e.hero).length,finiteActors:frame.entities.every(e=>Number.isFinite(e.x+e.y)),unsafeActors:room.enemies.filter(e=>e.hp>0&&StoryPhase1.explorationBlocked(L,e.x,e.y,e.combatProfile?.bodyBlock?.r||.3)).map(e=>e.id),controlled,phase:__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase,routePath:controlled?findPath(player,L.worldWardR81.gatherAnchor,room,.31).length:null,lockedBossPath:controlled?findPath(player,L.worldWardR81.bossAnchor,room,.31).length:null,earlyNext:controlled?!!P.next:null,doors:(L.worldR74?.doors||L.hospitalDoorsB3||[]).map(d=>({id:d.id,x:d.x,y:d.y,width:d.width,depth:d.depth,edge:d.edge,axis:d.axis})),nodeCount:L.nodes.length,points:P,routeGraph:regionById[zone].exits,errorCount:errors.length};})()`);
  row.requested=id;row.entryResult=result;report.maps.push(row);
  if(!row.heroSafe||row.id!==id||row.errorCount)console.log('DIAGNOSTIC',JSON.stringify(row));else console.log('MAP',id,row.type,row.routePath,row.lockedBossPath);
  const L=run('room.exploration');
  if(L.worldWardR81||L.hospitalCoreB2||L.refugeR82){
   const key=crypto.createHash('sha256').update(JSON.stringify({floor:L.floorCells,walls:L.walls.map(w=>[w.x,w.y,w.width,w.depth,w.angle||0,w.analyticBounds12])})).digest('hex');
   if(!unique.has(key))unique.set(key,{id,L});
  }
  write();
 }
 check('All 64 native 777 destinations enter the requested region without loading or modal residue',report.maps.length===64&&report.maps.every(r=>r.requested===r.id&&r.entryResult===true&&r.started&&!r.loading&&!r.modal),report.maps.filter(r=>r.requested!==r.id||!r.entryResult||r.loading||r.modal));
 check('Every campaign entry places the player on collision-safe floor',report.maps.every(r=>r.heroSafe),report.maps.filter(r=>!r.heroSafe));
 check('Every campaign capture has one finite hero and finite actor coordinates',report.maps.every(r=>r.frameReady&&r.heroEntities===1&&r.finiteActors),report.maps.filter(r=>!r.frameReady||r.heroEntities!==1||!r.finiteActors));
 check('Every living enemy clears the static geometry in all 56 combat maps',report.maps.filter(r=>!r.safe).length===56&&report.maps.every(r=>!r.unsafeActors.length),report.maps.filter(r=>r.unsafeActors.length));
 check('Each controlled ward reaches its gathering room while its boss room stays locked before elimination',report.maps.filter(r=>r.controlled).every(r=>r.phase==='route'&&r.routePath>0&&r.lockedBossPath===0&&!r.earlyNext),report.maps.filter(r=>r.controlled&&!(r.phase==='route'&&r.routePath>0&&r.lockedBossPath===0&&!r.earlyNext)));
 check('Samong regions retain distinct native finale and ward controllers',report.maps.find(r=>r.id==='cult03')?.controlled===true&&report.maps.find(r=>r.id==='cult04')?.controlled===false&&report.maps.find(r=>r.id==='cult03')?.title==='사몽의 문턱'&&report.maps.find(r=>r.id==='cult04')?.title==='교주의 사몽');
 check('Every region has only valid reciprocal campaign destinations',report.maps.every(r=>Object.entries(r.routeGraph).every(([direction,to])=>{const next=report.maps.find(m=>m.id===to);return next&&Object.values(next.routeGraph).includes(r.id);})),report.maps.map(r=>({id:r.id,exits:r.routeGraph})));
 // Exhaustive clearance graph for each distinct current combat/refuge floor plan.
 // Use native static collision on cell centers AND edge midpoints; no door-state override.
 const A=h.context.StoryPhase1;
 for(const {id,L:observed} of unique.values()){
  // The hospital native boundary array includes its current closed doors;
  // use its own all-open factory only for post-unlock static connectivity.
  // Live ward gate locking is checked independently above and by native hospital tests.
  const L=observed.hospitalCoreB2?A.hospitalCoreLayoutB2({walls:[],surface:{}},['door-0','door-1','door-2']):observed;
  const points=L.floorCells.filter(([x,y])=>!A.explorationBlocked(L,x+.5,y+.5,.34)),set=new Set(points.map(p=>p.join(':'))),seen=new Set(),components=[];
  for(const [x,y] of points){const key=x+':'+y;if(seen.has(key))continue;const queue=[[x,y]];seen.add(key);for(let q=0;q<queue.length;q++){const[a,b]=queue[q];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=a+dx,yy=b+dy,k=xx+':'+yy;if(set.has(k)&&!seen.has(k)&&!A.explorationBlocked(L,a+.5+dx*.5,b+.5+dy*.5,.34)){seen.add(k);queue.push([xx,yy]);}}}components.push({cells:queue.length,sample:queue[0]});}
  report.geometry.push({representative:id,doorState:observed.hospitalCoreB2?'native factory with all three doors open':'static layout without dynamic door gating',floorCells:L.floorCells.length,walkableCenters:points.length,components:components.sort((a,b)=>b.cells-a.cells)});
 }
 check('After native door unlock, every walkable cell of the hospital, world-ward and refuge layouts is connected through body-clear edges',report.geometry.length>=3&&report.geometry.every(r=>r.components.length===1),report.geometry);
 const left=await run('__STORYWORLD_CHEAT777__.leave()');dismiss();
 check('Leaving the 64-region 777 audit restores the exact normal opening progress',left===true&&run("zone==='hub'&&!__STORYWORLD_CHEAT777__.active()")&&JSON.stringify(run('progress'))===JSON.stringify(normal.progress));
 check('No native error is recorded across the whole campaign admission audit',run('errors.length===0')&&report.maps.every(r=>!r.errorCount),run('[...errors]'));
})().catch(e=>{report.failure=e.stack;console.error(e.stack);process.exitCode=1;}).finally(()=>{report.completedAt=new Date().toISOString();report.passed=report.checks.filter(c=>c.passed).length;report.failed=report.checks.filter(c=>!c.passed).length;write();if(report.failed||report.failure)process.exitCode=1;console.log('FINAL',report.passed,report.failed);});
