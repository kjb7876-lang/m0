'use strict';
// This intentionally exercises native finishEncounter rather than asserting
// that the finale's story strings merely still exist in the package.
const fs=require('node:fs'),path=require('node:path');
const {createHarness}=require('../harness.cjs');
(async()=>{
 const h=createHarness({timeoutMs:60000}),checks=[],check=(name,ok,detail)=>{checks.push({name,passed:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name);};
 const boot=await h.boot();check('Native runtime boots for the finale regression',boot.booted&&!boot.errors.length,boot.errors);
 await h.start();h.run('for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);');
 h.context.finaleCheckpoint=JSON.parse(JSON.stringify(h.run('serializeSave()')));
 h.run(`(()=>{const raw=finaleCheckpoint,id='cult04',order=__STORYWORLD_STORY_PROFILE_R54__.campaignOrder,at=order.indexOf(id);raw.progress={STORY:{},DREAM:{}};for(const k of order.slice(0,at))raw.progress.STORY[k]=true;raw.unlockedRegions=__STORYWORLD4__.deriveUnlocks(raw.progress,[],false);raw.zone=id;raw.layer='STORY';raw.rooms={};raw.hospitalMazeR1={version:2,rooms:{}};raw.worldMazeR81={version:1,rooms:{}};raw.narrativeObjectivesR75={version:1,rooms:{}};raw.castleDefenseR75={version:1,rooms:{}};raw.campaignDifficultyR63={version:1,maps:{'STORY:cult04':'normal'}};raw.worldR74={version:1,entries:{'STORY:cult04':1},opened:{'STORY:cult04':['door-0','door-1','door-2']}};raw.worldR75={version:1,entries:{'STORY:cult04':1}};raw.routeEntriesR72={version:1,entries:{}};raw.auto=false;raw.guide=false;raw.player.x=20;raw.player.y=12;})()`);
 await h.run('restoreSave(finaleCheckpoint)');
 h.run(`for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);auto=false;guide=false;player.invincible=99999;player.x=20;player.y=12;`);
 check('cult04 keeps the native multi-stage progression owner',h.run(`zone==='cult04'&&!__STORYWORLD_WORLD_COMBAT_R78__.controlled(room)&&room.finalStage===0&&!completed(zone)`));
 // Assisted cleanup uses the native death path. All subsequent progression
 // transitions are initiated by native summon3/killEnemy/finishEncounter.
 h.run(`(()=>{for(const e of [...room.enemies])if(!e.boss&&!e.midboss){e.hp=0;killEnemy(e);}room.fieldWaveIndex6=room.fieldWaves6?.length||0;room.fieldWaveCleared6=true;room.engaged=false;room.encounterStage='bossReady';})()`);
 function summonAndDefeat(expression,stage){
  h.context.summonStageFixture=stage;
  const summoned=h.run(`(()=>{const list=${expression};room.engaged=false;const ids=list.map(e=>e.id),ok=summon3(list,summonStageFixture);for(let i=0;i<30&&room.encounterStage==='summoning';i++)tick(.05);for(const id of ids){const e=room.enemies.find(e=>e.id===id);if(e){e.hp=0;killEnemy(e);}}return{ok,ids,stage:room.encounterStage,finalStage:room.finalStage,active:room.activeEncounter,parts:[storyScene,...storyQueue].filter(Boolean).map(s=>s.part),keys:[storyScene,...storyQueue].filter(Boolean).map(s=>s.key),completed:completed(zone)};})()`);return summoned;
 }
 const mids=summonAndDefeat("room.enemies.filter(e=>e.midboss&&e.hp>0)",'midboss');
 const first=summonAndDefeat("room.enemies.filter(e=>e.boss&&!e.midboss&&e.hp>0)",'boss');
 check('First boss defeat opens firstPost and awakenPre without completing the finale',first.ok&&first.finalStage===1&&!first.completed&&first.parts.includes('firstPost')&&first.parts.includes('awakenPre'),{mids,first});
 h.run('for(let i=0;i<40&&storyScene;i++)advanceScene();');
 const awakened=h.run(`({finalStage:room.finalStage,stage:room.encounterStage,finalAwakening:player.finalAwakening,completed:completed(zone)})`);
 check('Reading both native scenes enters the Cosmic guardian phase',awakened.finalStage===2&&awakened.stage==='cosmicReady'&&awakened.finalAwakening&&!awakened.completed,awakened);
 const guardians=[];
 if(awakened.stage==='cosmicReady')for(let n=0;n<6;n++){
  guardians.push(h.run(`(()=>{const before=room.cosmicIndex;spawnCosmic3();const e=room.enemies.find(e=>e.cosmic&&e.hp>0&&!e.deadRecorded),id=e?.nativeId,point=e&&{x:e.x,y:e.y},safe=!!e&&!blocked(e.x,e.y,e.combatProfile?.bodyBlock?.r||.3,room);for(let i=0;i<30&&room.encounterStage==='summoning';i++)tick(.05);if(e){e.hp=0;killEnemy(e);}return{before,after:room.cosmicIndex,id,point,safe,stage:room.encounterStage,completed:completed(zone)};})()`));
 }
 check('All six canonical Cosmic guardians advance one native stage each on safe floor',guardians.length===6&&guardians.every((g,i)=>g.before===i&&g.after===i+1&&g.id==='kair-great-0'+(i+1)&&g.safe&&g.stage==='cosmicReady'&&!g.completed),guardians);
 let finalBoss=null;
 if(guardians.length===6&&guardians[5].after===6){
  finalBoss=h.run(`(()=>{spawnCosmic3();const e=room.enemies.find(e=>e.nativeId==='c104-boss'&&e.hp>0),before={nativeId:e?.nativeId,stage:room.activeEncounter,finalStage:room.finalStage};for(let i=0;i<30&&room.encounterStage==='summoning';i++)tick(.05);if(e){e.hp=0;killEnemy(e);}const keys=[storyScene,...storyQueue].filter(Boolean).map(s=>s.key);for(let i=0;i<40&&storyScene;i++)advanceScene();return{before,keys,completed:completed(zone),ending:ending.STORY,finalStage:room.finalStage};})()`);
 }
 check('Final boss and preserved-core epilogue precede native finale completion',finalBoss?.before.nativeId==='c104-boss'&&finalBoss.before.stage==='finalBoss'&&finalBoss.keys.some(k=>String(k).includes('finale.core-preserved'))&&finalBoss.completed&&finalBoss.ending&&finalBoss.finalStage===2,finalBoss);
 const report={schema:'r81-native-finale-cpu/v1',completedAt:new Date().toISOString(),method:'Native unlocked checkpoint, native summon/death/finish and scene callbacks in Node VM; assisted field cleanup, invulnerability, boss HP=0, scene advancement. Not natural play or browser/GPU.',checks,passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,browserVerified:false,GPUVerified:false,naturalPlayVerified:false};
 const out=path.join(__dirname,'finale-results.json');fs.writeFileSync(out+'.tmp',JSON.stringify(report,null,2)+'\n');fs.renameSync(out+'.tmp',out);console.log(JSON.stringify({passed:report.passed,failed:report.failed}));if(report.failed)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
