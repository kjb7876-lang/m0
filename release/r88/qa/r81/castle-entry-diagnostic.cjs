'use strict';
// Native story controllers in a Node VM. Checkpoints, position changes,
// invulnerability and lethal damage are assisted fixtures, not natural play.
const fs=require('node:fs'),path=require('node:path');
const {createHarness}=require('../harness.cjs');
async function main(){
 const h=createHarness({timeoutMs:60000}),checks=[],details={};
 const check=(name,passed,detail)=>{checks.push({name,passed:!!passed,...(detail===undefined?{}:{detail})});console.log((passed?'PASS ':'FAIL ')+name);};
 const boot=await h.boot();check('Native story runtime boots',boot.booted&&!boot.errors.length,boot);
 await h.start();h.run('for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);auto=false;guide=false;');
 const baseline=JSON.parse(JSON.stringify(h.run('serializeSave()')));
 async function checkpoint(id){
  console.log('CHECKPOINT '+id);
  h.context.checkpointFixture=JSON.parse(JSON.stringify(baseline));h.context.checkpointRegion=id;
  h.run(`(()=>{const raw=checkpointFixture,id=checkpointRegion,order=__STORYWORLD_STORY_PROFILE_R54__.campaignOrder,at=order.indexOf(id);if(at<0)throw Error('Unknown scene');raw.progress={STORY:{},DREAM:{}};for(const key of order.slice(0,at))raw.progress.STORY[key]=true;raw.unlockedRegions=__STORYWORLD4__.deriveUnlocks(raw.progress,[],false);raw.zone=id;raw.layer='STORY';raw.rooms={};raw.hospitalMazeR1={version:2,rooms:{}};raw.worldMazeR81={version:1,rooms:{}};raw.narrativeObjectivesR75={version:1,rooms:{}};raw.castleDefenseR75={version:1,rooms:{}};raw.campaignDifficultyR63={version:1,maps:{['STORY:'+id]:'normal'}};raw.worldR74={version:1,entries:{['STORY:'+id]:1},opened:{}};raw.worldR75={version:1,entries:{['STORY:'+id]:1}};raw.routeEntriesR72={version:1,entries:{}};raw.auto=false;raw.guide=false;const L=getRoom(id,'STORY').exploration;raw.player.x=L.entry.x;raw.player.y=L.entry.y;})()`);
  await h.run('restoreSave(checkpointFixture)');
  if(!h.run('zone===checkpointRegion&&room.id===checkpointRegion&&!loading'))throw Error('Checkpoint refused '+id);
  h.run('for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);auto=false;guide=false;player.invincible=99999;');
 }

 try{await checkpoint('hando01');}catch(e){console.log('RESTORE_ERROR',e.stack);}
 console.log(JSON.stringify(h.run(`(()=>{const L=room.exploration,P=L.entry,G=L.worldWardR81.gatherAnchor,D=__STORYWORLD_WORLD_R74__;return{zone,player:{x:player.x,y:player.y},entry:P,gather:G,doors:D.inspect().doors,objective:room.objective,blocked:{entry:blocked(P.x,P.y,.31,room),gather:blocked(G.x,G.y,.31,room)},props:room.props.filter(p=>p.solid).map(p=>({id:p.id,x:p.x,y:p.y,r:p.radius})),paths:[G,{x:17,y:94},{x:34,y:94},{x:53,y:94},{x:71,y:94},{x:20,y:35},{x:21,y:36}].map(q=>({q,blocked:blocked(q.x,q.y,.31,room),path:findPath(P,q,room,.31).length})),arrival:__STORYWORLD_PORTAL_ARRIVAL_R73__.point(P,room)};})()`),null,2));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
