'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const{createHarness}=require('../harness.cjs');
(async()=>{
 const h=createHarness({timeoutMs:120000}),run=s=>h.run(s),plain=x=>JSON.parse(JSON.stringify(x));
 const build=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../build-result.json'),'utf8'));assert.equal(fs.readFileSync(path.join(h.site,'sin-room-art.js'),'utf8'),fs.readFileSync(path.resolve(__dirname,'../../client-source/sin-room-art.js'),'utf8'),'built overlay matches tested source');
 const boot=await h.boot();assert(boot.booted&&!boot.errors.length);assert(run('!!window.__STORYWORLD_SIN_ROOM_ART__'),'built art overlay loaded');console.log('PASS built native boot');
 await run("newGame('hwando')");run('for(let i=0;i<80&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);');
 const zones=['ep1b02','ep1b03','ep1b04','ep1b05','ep1b06','ep1b07'],results=[];
 const snapshot=()=>plain(run(`({zone,phase:__STORYWORLD_WORLD_COMBAT_R78__.state(room),opened:__STORYWORLD_WORLD_R74__.openedFor(zone,layer),bosses:room.enemies.filter(e=>e.boss).map(e=>({id:e.id,hp:e.hp})),overlay:room.exploration.sinRoomArt,doors:room.exploration.worldR74.doors.map(d=>({id:d.id,x:d.x,y:d.y,width:d.width,axis:d.axis})),props:room.props.filter(p=>p.sinArt).map(p=>({id:p.id,path:p.path,key:p.sinArtKey,x:p.x,y:p.y,height:p.height})),nativeProps:room.props.filter(p=>!p.sinArt&&(p.r74Door||p.r81WardDoor||p.chest||p.altar||p.interactive)).map(p=>p.id),errors:[...errors]})`));
 async function paint(){run('drawObjective()');await new Promise(r=>setImmediate(r));run('drawObjective()');}
 const commands=()=>plain(run(`(()=>{
  const A=__STORYWORLD_SIN_ROOM_ART__,old={x:player.x,y:player.y,cam:{...cam}},before=__STORYWORLD_PLAY_R113__.stats();
  try{
   player.x=16;player.y=11;cam={x:16,y:11};draw();
   const recorded=__STORYWORLD_PHASE1__.captureVisual(),frame={zone,layer,exploration:room.exploration,commands:recorded};
   // The CPU harness has a renderer readiness spy. Invoke the exact production
   // pre-render correction; its automatic renderer wrapper is tested separately.
   A.restoreAuthoredCommands(frame);
   const rows=room.props.filter(p=>p.sinArt).map(p=>{const c=A.ATLAS[A.themes[zone].atlas].cells[p.sinArtKey],q=project(p.x,p.y),scale=p.height*zoom/c.visibleHeight,flip=p.sinArtFlip?-1:1,left=-c.pivot[0]*scale,top=-c.pivot[1]*scale,w=c.sourceRect[2]*scale,h=c.sourceRect[3]*scale;return{id:p.id,expectedRect:c.sourceRect,expectedPosition:{x:p.x,y:p.y},expectedPoints:[[left,top],[left+w,top],[left+w,top+h],[left,top+h]].map(([x,y])=>[q.x+flip*x,q.y+y]),commands:recorded.filter(c=>c.kind==='image'&&c.owner?.id==='prop:'+p.id).map(c=>({sourceRect:c.sourceRect,points:c.points,owner:{x:c.owner.x,y:c.owner.y,kind:c.owner.kind,sinArt:c.owner.sinArt}}))};});
   return{rows,groundBefore:before,groundAfter:__STORYWORLD_PLAY_R113__.stats(),scope:'Full native captureVisual DrawCommands and installed scope chain; production pre-render correction called explicitly because CPU harness renderer is a spy'};
  }finally{player.x=old.x;player.y=old.y;cam=old.cam;}
 })()`));
 for(const id of zones){
  await run("__STORYWORLD_CHEAT777__.activate('777')");await run(`__STORYWORLD_CHEAT777__.go(${JSON.stringify(id)},'STORY')`);
  if(run('__STORYWORLD_PROGRESSION_R71__.difficultyState().open')){run("__STORYWORLD_PROGRESSION_R71__.selectDifficulty('normal')");await run('__STORYWORLD_PROGRESSION_R71__.confirmDifficulty()');}
  run('for(let i=0;i<80&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);auto=false;guide=false;');
  await paint();const before=snapshot();assert.equal(before.zone,id);assert.equal(before.overlay,run('__STORYWORLD_SIN_ROOM_ART__.revision'));assert.equal(before.props.length,4,id+' four authored props on native draw path');assert.equal(new Set(before.props.map(p=>p.id)).size,4,id+' no duplicate authored props');assert(before.bosses.length>0,id+' boss present');assert.deepEqual(before.errors,[],id+' no game errors');
  const physics=plain(run(`(()=>{const L=room.exploration,T=__STORYWORLD_SIN_ROOM_ART__.themes[zone],owned=L.walls.filter(w=>w.sinArtFurniture);return{walls:owned.map(w=>({id:w.id,height:w.height,r98BaseHeight:w.r98BaseHeight})),props:T.props.map(p=>({key:p.key,blocked:StoryPhase1.explorationBlocked(L,p.x,p.y,.3)})),centre:StoryPhase1.explorationBlocked(L,16,13,.5),bossPoints:L.worldWardR81.bossPoints.map(p=>StoryPhase1.explorationBlocked(L,p.x,p.y,.5))};})()`));
  assert.equal(physics.walls.length,id==='ep1b06'?2:4,id+' only new native collision envelopes');assert(physics.walls.every(w=>w.height<=.011&&w.r98BaseHeight===.01),id+' regional dressing leaves collisions at floor height');assert(physics.props.every(p=>p.blocked),id+' real native collisions');assert(!physics.centre&&physics.bossPoints.every(x=>!x),id+' combat positions clear');
  h.context.saved=plain(run('serializeSave()'));await run('restoreSave(saved)');await paint();const after=snapshot();
  for(const key of ['zone','overlay'])assert.equal(after[key],before[key],id+' restore '+key);
  for(const key of ['bosses','doors','opened','props','nativeProps'])assert.deepEqual(after[key],before[key],id+' restore '+key);assert.equal(after.phase.phase,before.phase.phase,id+' boss phase');assert.deepEqual(after.errors,[],id+' restore errors');
  await paint();const repeat=snapshot();assert.deepEqual(repeat.props,after.props,id+' repeated frames do not duplicate props');
  const recording=commands();for(const row of recording.rows){assert.equal(row.commands.length,1,id+' exact native captured image for '+row.id);const c=row.commands[0];assert.deepEqual(c.sourceRect,row.expectedRect,id+' final recorded crop '+row.id);assert.equal(c.owner.x,row.expectedPosition.x);assert.equal(c.owner.y,row.expectedPosition.y);assert(c.owner.sinArt,id+' authored native owner marker');for(let i=0;i<4;i++)for(let j=0;j<2;j++)assert(Math.abs(c.points[i][j]-row.expectedPoints[i][j])<1e-7,id+' final native projected corner '+row.id+' '+i+','+j);}
  results.push({id,before,after,physics,recording});console.log('PASS',id,'native props/collision/save restore and final captured atlas rectangles/world placement');
 }
 const inspect=plain(run('__STORYWORLD_SIN_ROOM_ART__.inspect()'));assert.equal(inspect.stats.errors,0);assert(inspect.stats.draws>0,'native art painter exercised');
 fs.writeFileSync(path.join(__dirname,'runtime-results.json'),JSON.stringify({build,boot,results,inspect,scope:'CPU VM with native compiled game, drawObjective and full captureVisual scopes; production pre-render correction explicitly called for the GPU spy; assisted 777 normal entry/save restore, mocked image loading and GPU; not natural play, browser or physical-device validation'},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
