'use strict';
// Native story controllers in a Node VM. Checkpoints, position changes,
// invulnerability and lethal damage are assisted fixtures, not natural play.
const fs=require('node:fs'),path=require('node:path');
const {createHarness}=require('../harness.cjs');
async function main(){
 const h=createHarness({timeoutMs:60000}),checks=[],details={};
 const check=(name,passed,detail)=>{checks.push({name,passed:!!passed,...(detail===undefined?{}:{detail})});console.log((passed?'PASS ':'FAIL ')+name);if(!passed&&detail!==undefined)console.log(JSON.stringify(detail));};
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
 await checkpoint('hando02');
 const owners=h.run(`(()=>{const A=__STORYWORLD_OBJECTIVES_R75__,W=__STORYWORLD_WORLD_R74__,out=[];for(const p of A.actors().filter(p=>/owner$/.test(p.r75NarrativeNPC))){const t=W.interactions().find(t=>t.kind==='door'&&t.id===p.doorId),before={x:player.x,y:player.y},approach=[];if(!t){out.push({id:p.id,door:p.doorId,reachable:false,used:false,open:false});continue;}for(let ring=0;ring<=3;ring++)for(let i=0;i<16;i++){const a=i*Math.PI/8,q={x:p.x+Math.cos(a)*ring*.2,y:p.y+Math.sin(a)*ring*.2};if(blocked(q.x,q.y,.31,room)||!A.canUse({id:p.id},{...player,...q})||!W.canUse(t,{...player,...q},p.id))continue;const route=findPath(before,q,room,.31);if(route.length||distance(before,q)<.1)approach.push(q);}const q=approach[0];if(q){player.x=q.x;player.y=q.y;}const unauthorized=q&&W.canUse(t),used=q&&A.use({id:p.id});out.push({id:p.id,door:p.doorId,reachable:!!q,unauthorized:!!unauthorized,used:!!used,open:t&&W.isOpen(room,room.exploration.worldR74.doors.find(d=>d.id===p.doorId))});}return{owners:out,mask:A.gateMask(room),completed:completed(zone),opened:W.openedFor(zone,layer)};})()`);
 details.ownerUse=owners;
 check('Both owners are reachable and native NPC interaction opens each real door without completing the map',owners.owners.length===2&&owners.owners.every(p=>p.reachable&&!p.unauthorized&&p.used&&p.open)&&owners.mask===3&&!owners.completed,owners);


 console.log('DETAIL',JSON.stringify(h.run(`(()=>{const A=__STORYWORLD_OBJECTIVES_R75__,W=__STORYWORLD_WORLD_R74__;return A.actors().map(p=>{const d=room.exploration.worldR74.doors.find(d=>d.id===p.doorId),t=W.interactions().find(t=>t.id===d.id),q={x:p.x,y:p.y},b={x:d.x,y:d.y+.9};return{d,t,actor:p.id,hp:player.hp,npc:A.canUse({id:p.id},{...player,...q}),door:W.canUse(t,{...player,...q},p.id),blocked:blocked(b.x,b.y,.29,room),clear:clearPath3(q,b,.29,room),dist:distance(q,d),pose:A.sharedPose(p)}});})()`),null,2));
 console.log('OWNER_DIAGNOSTIC',JSON.stringify(h.run(`({zone, player:{x:player.x,y:player.y}, loading, modal, scene:storyScene?.key, state:__STORYWORLD_DEFENSE_R75__.inspect(), actors:__STORYWORLD_OBJECTIVES_R75__.inspect(), doors:__STORYWORLD_WORLD_R74__.inspect(), paths:__STORYWORLD_OBJECTIVES_R75__.actors().map(p=>({id:p.id,x:p.x,y:p.y,blocked:blocked(p.x,p.y,.31,room),path:findPath(player,p,room,.31).length}))})`),null,2));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
