'use strict';
const fs=require('fs'),path=require('path');
const {patchHTML,MARKER,AUTO_BLOCK}=require('./portal-patch.cjs');
const root=path.resolve(__dirname,'../..'),site=path.join(root,'hospital-three-pc/site');
const originalHTML=fs.readFileSync(path.join(site,'index.html'),'utf8');
const integrated=originalHTML.includes(MARKER)&&originalHTML.includes('<script src="./portal-interaction-r83.js"></script>')&&fs.existsSync(path.join(site,'portal-interaction-r83.js'));
if(!integrated)throw Error('R83 portal tests require the actual integrated site');
const {createHarness}=require('../harness.cjs');
fs.rmSync(path.join(__dirname,'portal-results.json'),{force:true});
const checks=[],details={};const report={schema:'r83-explicit-portals/v1',method:'Actual native keydown handlers, guideStep, tick, travel admission and story/door controllers in Node VM. Position/progress/HP fixtures and forced HP-zero native killEnemy calls are assisted. No browser/GPU or natural play.',integrationFixture:!integrated,checks,details,browserVerified:false,GPUVerified:false,naturalPlayVerified:false};
const check=(name,passed,detail)=>{checks.push({name,passed:!!passed,...detail===undefined?{}:{detail}});console.log((passed?'PASS ':'FAIL ')+name);if(!passed)throw Error(name);};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const h=createHarness({timeoutMs:60000}),run=code=>h.run(code);await h.boot();await run("newGame('hwando')");
 const dismiss=()=>run('for(let i=0;i<80&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);');dismiss();run('guide=false;auto=false;player.invincible=99999;');
 check('Exactly one automatic proximity loop is removed and the patch is idempotent',!patchHTML(originalHTML).includes(AUTO_BLOCK)&&patchHTML(patchHTML(originalHTML))===patchHTML(originalHTML));
 const prefix=run('__STORYWORLD_TEST_STORAGE_B1__.prefix');h.storage.set('storyworld.hospital-three-pc.maze.v6:portal-sentinel','preserve-v6');h.storage.set('storyworld.hospital-three-pc.maze.v5:portal-sentinel','preserve-v5');
 const bootState=run('({zone,started,loading,modal,points:__STORYWORLD_ROUTES_R72__.points()})');check('Native refuge starts with a reachable next portal',bootState.zone==='hub'&&bootState.started&&!bootState.loading&&!bootState.modal&&bootState.points.next,bootState);
 run('const portalR83=__STORYWORLD_ROUTES_R72__.points().next;player.x=portalR83.x;player.y=portalR83.y;transitionCD=0;route=[];command=null;for(let i=0;i<600;i++)tick(.1);');await flush();
 check('Standing on the refuge portal for 60 seconds never travels or opens difficulty',run("zone==='hub'&&!loading&&!__STORYWORLD_PROGRESSION_R71__.difficultyState().open"));
 function key(repeat=false){h.context.dispatchEvent({type:'keydown',key:'e',code:'KeyE',repeat,preventDefault(){},stopPropagation(){}});}
 async function finishCrossing(){await flush();if(run('__STORYWORLD_PROGRESSION_R71__.difficultyState().open')){run("__STORYWORLD_PROGRESSION_R71__.selectDifficulty('normal')");await run('__STORYWORLD_PROGRESSION_R71__.confirmDifficulty()');}await flush();dismiss();}
 key();await finishCrossing();
 check('A real E key event crosses forward through native difficulty and story admission',run("zone==='dist00'&&!loading&&!blocked(player.x,player.y,.34,room)"));
 run('const backR83=__STORYWORLD_ROUTES_R72__.points().previous;player.x=backR83.x;player.y=backR83.y;transitionCD=0;guide=false;route=[];command=null;for(let i=0;i<100;i++)tick(.1);');await flush();
 check('Standing on the previous portal never bounces back to the refuge',run("zone==='dist00'&&!loading"));
 for(let i=0;i<20;i++)key(true);await flush();
 check('Held E repeat events do not activate another portal after arrival',run("zone==='dist00'&&!loading"));
 key();await finishCrossing();check('Releasing and pressing E crosses back through the original previous route',run("zone==='hub'&&!loading&&!blocked(player.x,player.y,.34,room)"));
 run('transitionCD=0;guide=true;guideTimer=0;route=[];command=null;player.x=15;player.y=19;guideStep(1);');
 const guidePlan=run('({guide,zone,route:route.length,goal:__STORYWORLD_GUIDE_R75__.currentGoal()})');check('Guide still plans an automatic walking path toward the next portal',guidePlan.guide&&guidePlan.zone==='hub'&&guidePlan.route>0&&guidePlan.goal.kind==='portal',guidePlan);
 const walked=run('(()=>{const before={x:player.x,y:player.y};for(let i=0;i<10;i++)tick(.1);return{moved:distance(player,before),guide,safe:!blocked(player.x,player.y,.34,room)};})()');check('Guide executes automatic walking along its collision-safe path',walked.guide&&walked.safe&&walked.moved>.3,walked);
 run('const nextR83=__STORYWORLD_ROUTES_R72__.points().next;player.x=nextR83.x;player.y=nextR83.y;guide=true;for(let i=0;i<300;i++)tick(.1);');await flush();
 const guideWait=run('({zone,guide,route:route.length,command,policy:__STORYWORLD_PORTAL_INTERACTION_R83__.inspect(),intent:__STORYWORLD_GUIDE_R77__.inspect().intent,hint:$("hint").textContent})');
 check('Guide stops at the portal, stays enabled, and requires E without arming travel',guideWait.zone==='hub'&&guideWait.guide&&guideWait.route===0&&guideWait.command===null&&guideWait.policy.waitingForKey&&!guideWait.intent&&/E/.test(guideWait.hint),guideWait);
 key();await finishCrossing();check('E crosses the portal while preserving the enabled guide state',run("zone==='dist00'&&!loading&&guide===true"));
 // Existing scripted relocation/debug APIs are intentionally not input APIs.
 // Verify the actual portal condition in a completed map and hospital too.
 const starts=[];
 for(const id of ['dist01','dist02','ep1a08']){
  h.context.portalCheckpointR83=id;
  console.log('CHECKPOINT '+id);
  h.context.portalCompletedSaveR83=id==='ep1a08'?JSON.parse(fs.readFileSync(path.join(__dirname,'../done-save.json'),'utf8')):JSON.parse(JSON.stringify(run('serializeSave()')));
  if(id!=='ep1a08')run(`(()=>{const raw=portalCompletedSaveR83,id=portalCheckpointR83,order=__STORYWORLD_STORY_PROFILE_R54__.campaignOrder,at=order.indexOf(id);raw.progress={STORY:{},DREAM:{}};for(const key of order.slice(0,at+1))raw.progress.STORY[key]=true;raw.unlockedRegions=__STORYWORLD4__.deriveUnlocks(raw.progress,[],false);raw.zone=id;raw.layer='STORY';raw.visited=[...new Set([...(raw.visited||[]),'STORY:'+id])];raw.rooms={};raw.hospitalMazeR1={version:2,rooms:{}};raw.worldMazeR81={version:1,rooms:{}};raw.narrativeObjectivesR75={version:1,rooms:{}};raw.castleDefenseR75={version:1,rooms:{}};raw.campaignDifficultyR63={version:1,maps:{['STORY:'+id]:'normal'}};raw.worldR74={version:1,entries:{['STORY:'+id]:1},opened:{}};raw.worldR75={version:1,entries:{['STORY:'+id]:1}};raw.routeEntriesR72={version:1,entries:{}};raw.auto=false;raw.guide=false;raw.player.x=20;raw.player.y=36;})()`);
  await run('restoreSave(portalCompletedSaveR83)');dismiss();
  run(`(()=>{guide=false;auto=false;transitionCD=0;player.invincible=99999;room.cleared=true;room.engaged=false;room.finalizing=false;room.fieldWaveCleared6=true;for(const e of room.enemies){e.hp=0;e.deadRecorded=true;e.spawnState='dead';}const p=__STORYWORLD_ROUTES_R72__.points().next;if(!p)throw Error('No next point '+JSON.stringify({zone,cleared:room.cleared,completed:completed(zone),phase:__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase,points:__STORYWORLD_ROUTES_R72__.points(),auth:room.exploration.worldWardR81?.portalNext,blocked:blocked(room.exploration.worldWardR81?.portalNext?.x||5,3.5,.43,room)}));player.x=p.x;player.y=p.y;route=[];command=null;})()`);
  const before=run('zone');run('for(let i=0;i<100;i++)tick(.1);');await flush();
  const idle=run('zone')===before;
  const beforeKey=run('({zone,modal,loading,scene:storyScene?.key,transitionCD,canTravel:canTravel(),cleared:room.cleared,phase:__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase,portals:__STORYWORLD_ROUTES_R72__.inspect().portals,hint:$("hint").textContent})');key();await finishCrossing();const after=run('zone');starts.push({from:id,idle,to:after,changed:after!==before,safe:run('!blocked(player.x,player.y,.34,room)'),beforeKey,afterKey:run('({zone,modal,loading,scene:storyScene?.key,transitionCD,toast:$("toast").textContent})')});
 }
 details.maps=starts;check('Cave, swamp and completed hospital portals stay idle until E then cross safely',starts.every(r=>r.idle&&r.changed&&r.safe),starts);
 // Locked native boss/story doors must not be mistaken for a portal.
 h.context.portalRouteSaveR83=JSON.parse(fs.readFileSync(path.join(__dirname,'../route-save.json'),'utf8'));
 h.context.portalRouteSaveR83.readScenes=h.context.portalRouteSaveR83.readScenes.filter(key=>key!=='STORY:ep1a08:pre:r75');
 await run('restoreSave(portalRouteSaveR83)');dismiss();
 run(`(()=>{guide=false;auto=false;transitionCD=0;player.invincible=99999;const d=room.exploration.hospitalDoorsB3.find(d=>d.id==='door-0');player.x=d.x;player.y=d.y+1;route=[];command=null;})()`);
 key();await flush();
 const locked=run(`({zone,phase:__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__.inspect().state.phase,open:__STORYWORLD_WORLD_R74__.isOpen(room,room.exploration.hospitalDoorsB3.find(d=>d.id==='door-0')),next:__STORYWORLD_ROUTES_R72__.points().next,scene:!!storyScene})`);
 check('E at a locked hospital boss door preserves the field-clear requirement',locked.zone==='ep1a08'&&locked.phase==='route'&&!locked.open&&!locked.next&&!locked.scene,locked);
 h.context.portalRallySaveR83=JSON.parse(fs.readFileSync(path.join(__dirname,'../rally-save.json'),'utf8'));
 h.context.portalRallySaveR83.readScenes=h.context.portalRallySaveR83.readScenes.filter(key=>key!=='STORY:ep1a08:pre:r75');
 await run('restoreSave(portalRallySaveR83)');dismiss();
 run(`(()=>{guide=false;auto=false;transitionCD=0;player.invincible=99999;const d=room.exploration.hospitalDoorsB3.find(d=>d.id==='door-0');player.x=d.x;player.y=d.y+1.5;route=[];command=null;for(const e of [...room.enemies])if(e.hp>0&&!e.boss&&!e.midboss){e.hp=0;killEnemy(e);}__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__.settle();})()`);
 const fieldCleared=run('__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__.inspect().state.phase');
 key();await flush();
 const storyDoor=run(`({zone,phase:__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__.inspect().state.phase,scene:storyScene&&{key:storyScene.key,part:storyScene.part},next:__STORYWORLD_ROUTES_R72__.points().next})`);
 check('After native field elimination E opens the canonical boss-door story, not a portal',fieldCleared==='door'&&storyDoor.zone==='ep1a08'&&storyDoor.phase==='doorStory'&&storyDoor.scene?.key==='STORY:ep1a08:pre:r75'&&!storyDoor.next,storyDoor);
 dismiss();
 const opened=run(`({zone,phase:__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__.inspect().state.phase,open:__STORYWORLD_WORLD_R74__.isOpen(room,room.exploration.hospitalDoorsB3.find(d=>d.id==='door-0')),next:__STORYWORLD_ROUTES_R72__.points().next})`);
 check('Finishing the original story opens the native boss door and preserves the boss encounter gate',opened.zone==='ep1a08'&&opened.phase==='boss'&&opened.open&&!opened.next,opened);
 check('Portal navigation adds no serialized progression fields or modifies older test saves',!Object.keys(run('serializeSave()')).some(k=>/portalInteractionR83/i.test(k))&&h.storage.get('storyworld.hospital-three-pc.maze.v6:portal-sentinel')==='preserve-v6'&&h.storage.get('storyworld.hospital-three-pc.maze.v5:portal-sentinel')==='preserve-v5',{activePrefix:prefix});
 check('Native error ledger remains clear',run('errors.length===0'),run('[...errors]'));
})().catch(e=>{report.failure=e.stack;console.error(e.stack);process.exitCode=1;}).finally(()=>{report.passed=checks.filter(c=>c.passed).length;report.failed=checks.filter(c=>!c.passed).length;fs.writeFileSync(path.join(__dirname,'portal-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failed:report.failed,integrationFixture:report.integrationFixture}));});
