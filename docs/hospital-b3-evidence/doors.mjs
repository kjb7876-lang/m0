import fs from'node:fs';import assert from'node:assert/strict';import{createRuntime,hash,html}from'./runtime.mjs';
const OUT='out/hospital-b3-stability/evidence/',h=createRuntime(),run=h.run,json=s=>JSON.parse(run('JSON.stringify('+s+')')),copy=x=>JSON.parse(JSON.stringify(x));
const report={candidateHTML:hash(html),harnessHash:hash(fs.readFileSync(new URL(import.meta.url))),method:'Full production HTML installation and real R74 use/interact/clean/restore/serialize; synthetic progress and direct fixture positions, no browser or network.',cases:[]};
async function test(name,fn){try{report.cases.push({name,ok:true,detail:await fn()});console.log('PASS',name);}catch(e){report.cases.push({name,ok:false,error:e.stack});console.log('FAIL',name,e.message);}write();}
function write(){report.passed=report.cases.filter(r=>r.ok).length;report.failed=report.cases.filter(r=>!r.ok).length;fs.writeFileSync(OUT+'doors.json',JSON.stringify(report,null,2));}
function ack(){let n=0;while(run('!!storyScene')){assert.ok(n++<150);run('advanceScene()');}run('closePanel(true);auto=false;guide=false;keys.clear();');}
try{h.install();await run('boot()');run(`player=freshPlayer('hwando');started=true;modal=false;storyScene=null;storyQueue=[];storyDone=null;settings.narration=false;settings.sound=false;settings.music=false;auto=false;guide=false;progress={STORY:{},DREAM:{}};for(const id of __STORYWORLD_STORY_PROFILE_R54__.campaignOrder){if(id==='ep1a08')break;progress.STORY[id]=true;}layer='STORY';zone='ep1a08';world={};room=getRoom(zone,layer);player.x=43;player.y=109;`);
const originalActors=json('room.enemies.map(e=>({id:e.id,hp:e.hp,maxHp:e.maxHp,dead:e.deadRecorded,wave:e.fieldWaveIndex6}))');

await test('Bay-derived combat node references and entry node point to their actual rooms',()=>{
 const L=json('room.exploration'),R=L.hospitalCoreB2.rects;
 assert.deepEqual(L.combatRoomNodeIds,[36,39,17,19]);assert.equal(L.entry.node,44);
 L.hospitalCoreB2.bays.forEach((b,i)=>{const [name,a,c,d,e]=R[L.combatRoomNodeIds[i]];assert.ok(b.x>=a&&b.x<d&&b.y>=c&&b.y<e);assert.equal(L.nodes[L.combatRoomNodeIds[i]].name,name);});
 assert.equal(L.nodes[L.entry.node].name,'entry-hall');assert.ok(L.entry.x>=2&&L.entry.x<86&&L.entry.y>=106&&L.entry.y<112);
 return{combatNodes:L.combatRoomNodeIds,entryNode:L.entry.node,initialMakeRoomSucceeded:true};
});
function captureFrames(){return json(`(()=>{
 const priorCtx=ctx,priorReady=readyImage,priorZoom=zoom,priorOptions=window.__STORYWORLD_VISUAL_OPTIONS__,out=[];
 const image={naturalWidth:1254,naturalHeight:1254,src:'assets/visual-test/hospital-quiet-material-atlas-r42.png'};
 try{readyImage=path=>({image});
 for(const z of [.5,1,1.75])for(const enabled of [false,true])for(const scoped of [false,true]){
  zoom=z;window.__STORYWORLD_VISUAL_OPTIONS__={...priorOptions,enabled};
  for(const p of room.props.filter(p=>p.hospitalDoorFrameB3)){
   const rec=new StoryPhase1.DrawCommands({});if(!scoped)rec.scope=null;ctx=rec;drawProp(p);
   const d=p.hospitalDoorFrameB3,t=d.depth,g=d.width,h=2.7,inner=g/2-t/2;
   const planes=[[-g/2-t/2,-inner,0,h],[inner,g/2+t/2,0,h],[-inner,inner,h-t,h]];
   const expected=planes.map(([u0,u1,z0,z1])=>[[u0,z1],[u1,z1],[u1,z0],[u0,z0]].map(([u,v])=>{const q=project(d.x+u,d.y);return[q.x,q.y-v*TILE*Math.sqrt(1.5)*zoom]}));
   out.push({id:d.id,z,enabled,scoped,commands:rec.commands.map(c=>({type:c.type,points:c.points,sourceRect:c.sourceRect})),expected});
  }
 }
 }finally{ctx=priorCtx;readyImage=priorReady;zoom=priorZoom;window.__STORYWORLD_VISUAL_OPTIONS__=priorOptions;}return out;
})()`);}
function assertFrames(){const rows=captureFrames();for(const r of rows){assert.equal(r.commands.length,3);r.commands.forEach((c,i)=>{assert.deepEqual(c.sourceRect,[680,20,500,260]);c.points.forEach((p,j)=>p.forEach((v,k)=>assert.ok(Math.abs(v-r.expected[i][j][k])<1e-7)));});}return{cases:rows.length,commandsPerFrame:3,imagePixelsStubbed:true,canvasAndGPURendered:false};}
await test('Frame projection matches physical 5.76 aperture at 3 zooms, options on/off, scoped/unscoped draw commands',assertFrames);

await test('Exactly 3 existing-schema doors; no R74 extra mobs or AI layout',()=>{const ds=json('__STORYWORLD_WORLD_R74__.inspect().doors');assert.deepEqual(ds.map(d=>d.id),['door-0','door-1','door-2']);assert.equal(run('!!room.exploration.worldR74'),false);assert.equal(run('room.enemies.some(e=>!!e.r74Monster)'),false);assert.equal(run('room.props.filter(p=>p.hospitalDoorFrameB3).length'),3);return ds;});
await test('All 3 native door interactions update collision, layout reference, wall presentation and persisted state',()=>{const rows=[];for(const d of json('__STORYWORLD_WORLD_R74__.inspect().doors')){ack();run(`player.x=${d.x};player.y=${d.y+2};reviewBeforeLayout=room.exploration;`);assert.equal(run(`blocked(${d.x},${d.y},.4,room)`),true);assert.equal(run(`__STORYWORLD_WORLD_R74__.canUse({id:'${d.id}'})`),true);assert.equal(run(`__STORYWORLD_WORLD_R74__.use({id:'${d.id}'})`),true);assert.equal(run('reviewBeforeLayout===room.exploration'),false);assert.equal(run(`blocked(${d.x},${d.y},.4,room)`),false);assert.equal(run(`room.exploration.hospitalVisualWalls12.some(w=>w.hospitalDoorB3==='${d.id}')`),false);assert.ok(json("serializeSave().worldR74.opened['STORY:ep1a08']").includes(d.id));rows.push({id:d.id,open:true});}assert.deepEqual(json('room.enemies.map(e=>({id:e.id,hp:e.hp,maxHp:e.maxHp,dead:e.deadRecorded,wave:e.fieldWaveIndex6}))'),originalActors);return rows;});
await test('Door cannot close on player or living actor; closed leaf returns after clear threshold',()=>{const d=json('__STORYWORLD_WORLD_R74__.inspect().doors')[0];ack();run(`player.x=${d.x};player.y=${d.y};`);assert.equal(run("__STORYWORLD_WORLD_R74__.use({id:'door-0'})"),false);run(`player.y=${d.y+2};reviewBody=room.enemies.find(e=>e.hp>0&&e.spawnState==='active');reviewBodyBefore={x:reviewBody.x,y:reviewBody.y};reviewBody.x=${d.x};reviewBody.y=${d.y};`);assert.equal(run("__STORYWORLD_WORLD_R74__.use({id:'door-0'})"),false);run('Object.assign(reviewBody,reviewBodyBefore)');assert.equal(run("__STORYWORLD_WORLD_R74__.use({id:'door-0'})"),true);assert.equal(run('blocked(20,20,.4,room)'),true);assert.equal(run("room.exploration.hospitalVisualWalls12.filter(w=>w.hospitalDoorB3==='door-0').length"),1);assert.equal(run('clearPath3({x:20,y:22},{x:20,y:16},.4,room)'),false);run('interact()');assert.equal(run('blocked(20,20,.4,room)'),false);assert.equal(run('clearPath3({x:20,y:22},{x:20,y:16},.4,room)'),true);return{actualInteractUsed:true};});
await test('Actual complete restore retains opened doors, valid old coordinates, and reserialized schema',async()=>{const raw=json('serializeSave()');raw.player.x=15;raw.player.y=13;h.box.reviewRaw=copy(raw);await run('restoreSave(reviewRaw)');ack();assert.deepEqual(json("__STORYWORLD_WORLD_R74__.inspect().opened['STORY:ep1a08']"),['door-1','door-2','door-0']);assert.equal(run('blocked(20,20,.4,room)'),false);assert.equal(run('player.x'),15);assert.equal(run('player.y'),13);assert.deepEqual(json("serializeSave().worldR74.opened['STORY:ep1a08']"),raw.worldR74.opened['STORY:ep1a08']);assert.equal(run('room.props.filter(p=>p.hospitalDoorFrameB3).length'),3);return{schemaVersion:raw.worldR74.version,doorIds:raw.worldR74.opened['STORY:ep1a08']};});
await test('Actual R74 clean rejects fourth, duplicate and unknown door IDs',()=>{for(const ids of [['door-0','door-1','door-2','door-3'],['door-0','door-0'],['door-3']]){h.box.badDoorSave={worldR74:{version:1,entries:{'STORY:ep1a08':1},opened:{'STORY:ep1a08':ids}}};assert.throws(()=>run('__STORYWORLD_WORLD_R74__.clean(badDoorSave)'));}return{schemaExpanded:false};});
await test('Full valid profile ledger preserves every other row through hospital registration, collision, door use and restore',async()=>{
 const original=json('serializeSave()'),ids=json('Object.keys(StoryWorldProfilesR74.profiles)'),keys=ids.flatMap(id=>['STORY:'+id,'DREAM:'+id]),hospital='STORY:ep1a08';
 assert.equal(ids.length,62);assert.equal(keys.length,124);assert.ok(keys.includes(hospital));
 const entries=Object.fromEntries(keys.filter(k=>k!==hospital).map((k,i)=>[k,i%2])),opened=Object.fromEntries(Object.entries(entries).filter(([k,v])=>v===1).map(([k])=>[k,['door-2']]));
 assert.equal(Object.keys(entries).length,123);
 for(const existing of [false,true]){
  const raw=copy(original);raw.worldR74={version:1,entries:{...entries,...(existing?{[hospital]:0}:{})},opened:copy(opened)};
  h.box.ledgerSave=raw;
  assert.deepEqual(json('__STORYWORLD_WORLD_R74__.clean(ledgerSave)'),{entries:raw.worldR74.entries,opened:raw.worldR74.opened});
  assert.equal(await run('restoreSave(ledgerSave)'),true);ack();
  assert.equal(run("__STORYWORLD_WORLD_R74__.version('ep1a08','STORY')"),0);
  run('player.x=20;player.y=22;blocked(20,20,.4,room)');
  assert.equal(run("__STORYWORLD_WORLD_R74__.use({id:'door-0'})"),true);
  const saved=json('serializeSave()');assert.equal(saved.worldR74.entries[hospital],1);assert.deepEqual(saved.worldR74.opened[hospital],['door-0']);
  const otherEntries={...saved.worldR74.entries},otherOpened={...saved.worldR74.opened};delete otherEntries[hospital];delete otherOpened[hospital];
  assert.deepEqual(otherEntries,entries);assert.deepEqual(otherOpened,opened);assert.equal(Object.keys(saved.worldR74.entries).length,124);
  h.box.ledgerSave=copy(saved);assert.deepEqual(json('__STORYWORLD_WORLD_R74__.clean(ledgerSave)'),{entries:saved.worldR74.entries,opened:saved.worldR74.opened});
  assert.equal(await run('restoreSave(ledgerSave)'),true);ack();assert.deepEqual(json('serializeSave().worldR74'),saved.worldR74);
  assert.equal(run("__STORYWORLD_WORLD_R74__.version('ep1a08','STORY')"),0);
 }
 // The alleged 126 valid rows cannot exist: two additional keys are unknown
 // profiles and the unchanged production validator must reject them.
 h.box.invalidFullLedger={worldR74:{version:1,entries:{...Object.fromEntries(keys.map(k=>[k,1])),'STORY:unknown-profile-1':1,'DREAM:unknown-profile-2':1},opened:{}}};
 assert.equal(Object.keys(h.box.invalidFullLedger.worldR74.entries).length,126);
 assert.throws(()=>run('__STORYWORLD_WORLD_R74__.clean(invalidFullLedger)'));
 h.box.ledgerSave=original;assert.equal(await run('restoreSave(ledgerSave)'),true);ack();
 return{profiles:ids.length,maximumValidKeys:keys.length,otherRowsPreserved:123,hospitalVersionRemainsZero:true,existingZeroRegistration:true,unknown126Rejected:true,validatorLimitAndSchemaUnchanged:true};
});
await test('Warm open/close transitions do not duplicate frames or change enemy identity/HP/wave',()=>{ack();const warmActors=json('room.enemies.map(e=>({id:e.id,hp:e.hp,maxHp:e.maxHp,dead:e.deadRecorded,wave:e.fieldWaveIndex6}))');for(let i=0;i<6;i++){run('player.x=20;player.y=22');assert.equal(run("__STORYWORLD_WORLD_R74__.use({id:'door-0'})"),true);assert.equal(run('room.props.filter(p=>p.hospitalDoorFrameB3).length'),3);assert.equal(run("blocked(20,20,.4,room)"),i%2===0);}assert.deepEqual(json('room.enemies.map(e=>({id:e.id,hp:e.hp,maxHp:e.maxHp,dead:e.deadRecorded,wave:e.fieldWaveIndex6}))'),warmActors);});
await test('Production restore keeps STORY and DREAM door states separate',async()=>{const story=json('serializeSave()'),dream=copy(story);dream.layer='DREAM';for(const id of json('__STORYWORLD_STORY_PROFILE_R54__.campaignOrder'))dream.progress.STORY[id]=true;dream.ending.STORY=true;dream.progress.DREAM=copy(story.progress.STORY);dream.rooms={'DREAM:ep1a08':copy(story.rooms['STORY:ep1a08'])};for(const k of ['hospitalMaze5','hospitalBossR53'])if(dream[k]?.rooms?.['STORY:ep1a08'])dream[k].rooms={'DREAM:ep1a08':copy(dream[k].rooms['STORY:ep1a08'])};dream.worldR74.entries['DREAM:ep1a08']=1;dream.worldR74.opened['DREAM:ep1a08']=['door-2'];dream.player.x=43;dream.player.y=109;h.box.reviewRaw=dream;await run('restoreSave(reviewRaw)');ack();assert.equal(run('layer'),'DREAM');assert.deepEqual(json("__STORYWORLD_WORLD_R74__.openedFor('ep1a08','DREAM')"),['door-2']);assert.deepEqual(json("__STORYWORLD_WORLD_R74__.openedFor('ep1a08','STORY')"),story.worldR74.opened['STORY:ep1a08']);assert.equal(run('blocked(20,20,.4,room)'),true);assert.equal(run('blocked(55,52,.4,room)'),false);h.box.reviewRaw=story;await run('restoreSave(reviewRaw)');ack();assert.equal(run('layer'),'STORY');assert.equal(run('blocked(20,20,.4,room)'),false);return{separateLayers:true,originalUserSaves:false};});
await test('Frame projection remains aligned after actual door open/close and complete save reentry',assertFrames);
report.substitutions=h.audit.substitutions;report.substitutions.push('Frame-only drawing check temporarily supplies image dimensions; actual drawProp and DrawCommands retained; no image decode/GPU');report.moduleOrder=h.audit.installed;
}catch(e){report.fatal=e.stack;console.log('FATAL',e.stack);}write();console.log(JSON.stringify({passed:report.passed,failed:report.failed,fatal:report.fatal||null}));if(report.failed||report.fatal)process.exitCode=1;
