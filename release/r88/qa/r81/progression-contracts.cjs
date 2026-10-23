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
 const castle=[];
 for(const id of ['hando01','hando02','hando03']){
  await checkpoint(id);
  castle.push(h.run(`(()=>{const L=room.exploration,D=L.worldR74?.doors||[],G=__STORYWORLD_DEFENSE_R75__.gates(),N=__STORYWORLD_OBJECTIVES_R75__.actors();return{id:zone,doors:D.map(d=>({id:d.id,x:d.x,y:d.y,edge:d.edge})),validDoors:D.length>=2&&D.length<=3&&new Set(D.map(d=>d.id)).size===D.length&&D.every(d=>/^door-[0-2]$/.test(d.id)&&d.edge?.length===2&&d.edge.every(i=>L.nodes[i]?.id===i)),gates:G.map(g=>({id:g.id,outer:g.outer})),outerSafe:G.every(g=>!blocked(g.outer.x,g.outer.y,.31,room)),outerDistinct:G.length===2&&distance(G[0].outer,G[1].outer)>8,controlled:__STORYWORLD_DEFENSE_R75__.controls(room),actors:N.map(p=>({id:p.id,kind:p.r75NarrativeNPC,door:p.doorId,x:p.x,y:p.y})),ownersBound:N.filter(p=>/owner$/.test(p.r75NarrativeNPC)).length===2&&N.filter(p=>/owner$/.test(p.r75NarrativeNPC)).every((p,i)=>p.doorId===D[i]?.id),allHidden:room.enemies.every(e=>e.spawnState==='hidden')};})()`));
 }
 details.castle=castle;
 check('All three castle maps retain two distinct native gate bindings and safe assault anchors',castle.every(r=>r.validDoors&&r.outerSafe&&r.outerDistinct),castle);
 check('Both native two-round defense controllers are active and own initial enemy hiding',castle.filter(r=>r.id!=='hando03').every(r=>r.controlled&&r.allHidden),castle.filter(r=>r.id!=='hando03'));
 check('Both hando02 and hando03 owners bind to actual separate doors',castle.filter(r=>r.id!=='hando01').every(r=>r.ownersBound),castle.filter(r=>r.id!=='hando01'));
 await checkpoint('hando02');
 const owners=h.run(`(()=>{const A=__STORYWORLD_OBJECTIVES_R75__,W=__STORYWORLD_WORLD_R74__,out=[];for(const p of A.actors().filter(p=>/owner$/.test(p.r75NarrativeNPC))){const t=W.interactions().find(t=>t.kind==='door'&&t.id===p.doorId),before={x:player.x,y:player.y},approach=[];if(!t){out.push({id:p.id,door:p.doorId,reachable:false,used:false,open:false});continue;}for(let ring=0;ring<=3;ring++)for(let i=0;i<16;i++){const a=i*Math.PI/8,q={x:p.x+Math.cos(a)*ring*.2,y:p.y+Math.sin(a)*ring*.2};if(blocked(q.x,q.y,.31,room)||!A.canUse({id:p.id},{...player,...q})||!W.canUse(t,{...player,...q},p.id))continue;const route=findPath(before,q,room,.31);if(route.length||distance(before,q)<.1)approach.push(q);}const q=approach[0];if(q){player.x=q.x;player.y=q.y;}const unauthorized=q&&W.canUse(t),used=q&&A.use({id:p.id});out.push({id:p.id,door:p.doorId,reachable:!!q,unauthorized:!!unauthorized,used:!!used,open:t&&W.isOpen(room,room.exploration.worldR74.doors.find(d=>d.id===p.doorId))});}return{owners:out,mask:A.gateMask(room),completed:completed(zone),opened:W.openedFor(zone,layer)};})()`);
 details.ownerUse=owners;
 check('Both owners are reachable and native NPC interaction opens each real door without completing the map',owners.owners.length===2&&owners.owners.every(p=>p.reachable&&!p.unauthorized&&p.used&&p.open)&&owners.mask===3&&!owners.completed,owners);
 h.context.gateRestoreFixture=JSON.parse(JSON.stringify(h.run('serializeSave()')));await h.run('restoreSave(gateRestoreFixture)');
 h.run('for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);auto=false;guide=false;player.invincible=99999;');
 const restored=h.run(`({mask:__STORYWORLD_OBJECTIVES_R75__.gateMask(room),opened:__STORYWORLD_WORLD_R74__.openedFor(zone,layer),controlled:__STORYWORLD_DEFENSE_R75__.controls(room)})`);
 check('Native save/restore retains the two owner permissions and door states',restored.mask===3&&owners.opened.every(id=>restored.opened.includes(id))&&restored.controlled,restored);
 // Start through the native controller, then let its warning clocks and
 // assault state machine advance. Scripted native hits remove each wave.
 const started=h.run(`(()=>{const p=__STORYWORLD_OBJECTIVES_R75__.actors()[0];player.x=p.x;player.y=p.y;const result=__STORYWORLD_DEFENSE_R75__.start(p.id);for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);return result;})()`);
 let defense=null;
 if(started)for(let round=0;round<60;round++){
  defense=h.run(`(()=>{for(let i=0;i<10&&!completed(zone);i++){const s=__STORYWORLD_DEFENSE_R75__.inspect().state;if(s?.phase==='assault')for(const id of s.selected){const e=room.enemies.find(e=>e.id===id);if(e?.hp>0)hitEnemy(e,e.maxHp*5,{kind:'r81-assisted-qa'});}tick(.25);for(let j=0;j<40&&storyScene;j++)advanceScene();if(modal&&!storyScene)closePanel(true);}return{completed:completed(zone),state:__STORYWORLD_DEFENSE_R75__.inspect().state,events:__STORYWORLD_DEFENSE_R75__.inspect().events,people:__STORYWORLD_DEFENSE_R75__.inspect().people};})()`);
  if(defense.completed||defense.state?.phase==='retry')break;
 }
 details.defense=defense;
 const nextAfterDefense=h.run(`(()=>{const A=__STORYWORLD_ROUTES_R72__,d=A.visibleDirections().find(d=>A.status(d).role==='next'),s=d&&A.status(d),g=__STORYWORLD_GUIDE_R75__.currentGoal();return{direction:d,status:s,goal:g&&{kind:g.kind,id:g.id,point:g.point},safe:!!s?.point&&!blocked(s.point.x,s.point.y,.31,room)};})()`);
 check('Native castle completion exposes the next portal and preserves a guide goal',defense?.completed&&nextAfterDefense.status?.visible&&nextAfterDefense.status?.open&&nextAfterDefense.safe&&nextAfterDefense.goal?.kind==='portal',nextAfterDefense);
 check('Native hando02 defense runs both assault rounds and joins the garrison before story completion',started&&defense?.completed&&defense.state?.round===2&&defense.state?.joined&&defense.events.some(e=>e.kind==='garrison-joined')&&defense.events.filter(e=>e.kind==='assault').length===2&&defense.events.some(e=>e.kind==='source-49-gates-held'),defense);
 await checkpoint('last301');
 const duel=h.run(`(()=>{const boss=room.enemies.filter(e=>e.boss),ordinary=room.enemies.filter(e=>!e.boss&&!e.midboss&&!e.persona&&!e.cosmic&&!e.trial);return{bosses:boss.map(e=>e.nativeId),ordinary:ordinary.length};})()`);
 check('The authored last301 duel remains boss-only',duel.bosses.length===1&&duel.ordinary===0,duel);
 const fallen=h.run(`(()=>{const b=room.enemies.find(e=>e.boss);room.engaged=false;const summoned=summon3([b],'boss');for(let i=0;i<30&&room.encounterStage==='summoning';i++)tick(.05);b.hp=0;killEnemy(b);const before={falling:room.r75Falling,bossAlive:b.hp>0,bossHidden:b.spawnState==='hidden',bossRecorded:!!b.deadRecorded,completed:completed(zone),post:[storyScene,...storyQueue].filter(Boolean).some(s=>s.part==='post')};for(let i=0;i<40&&storyScene;i++)advanceScene();return{summoned,before,completed:completed(zone),events:__STORYWORLD_OBJECTIVES_R75__.inspect().events};})()`);
 check('The last301 native fall preserves the living boss and reads post-story before completion',fallen.summoned&&fallen.before.falling&&fallen.before.bossAlive&&fallen.before.bossHidden&&!fallen.before.bossRecorded&&!fallen.before.completed&&fallen.before.post&&fallen.completed&&fallen.events.some(e=>e.kind==='required-fall'&&e.bossKillReward===false),fallen);

 const npcs=[];
 for(const id of ['last303','kair02','kair03','cult01','cult04']){await checkpoint(id);npcs.push(h.run(`(()=>{const p=__STORYWORLD_OBJECTIVES_R75__.actors();return{id:zone,npcs:p.map(p=>({id:p.id,kind:p.r75NarrativeNPC,solid:p.solid,safe:!blocked(p.x,p.y,.3,room)})),command:room.enemies.filter(e=>e.r75CommandBarrier).map(e=>e.nativeId),overlap:p.some(p=>room.enemies.some(e=>e.id===p.id))};})()`));}
 details.npcs=npcs;
 check('Residents, guardian and post-castle companions remain protected wall-safe NPCs',npcs.every(r=>!r.overlap&&r.npcs.every(p=>p.solid===false&&p.safe))&&npcs.find(r=>r.id==='last303').npcs.length===3&&npcs.filter(r=>['kair02','kair03'].includes(r.id)).every(r=>r.npcs.some(p=>p.kind==='time-guardian'))&&npcs.filter(r=>/^cult/.test(r.id)).every(r=>r.npcs.filter(p=>/owner$/.test(p.kind)).length===2),npcs);
 check('kair02 keeps its native command-barrier identity',npcs.find(r=>r.id==='kair02').command.includes('kair-great-03'));
 const report={schema:'r81-narrative-progression-cpu/v1',completedAt:new Date().toISOString(),method:'Native runtime controllers and canonical unlocked save checkpoints in Node VM, assisted actor positions/invulnerability/lethal native hits. No browser/GPU or natural play.',checks,details,passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,browserVerified:false,GPUVerified:false,naturalPlayVerified:false};
 fs.mkdirSync(__dirname,{recursive:true});const out=path.join(__dirname,'progression-results.json');fs.writeFileSync(out+'.tmp',JSON.stringify(report,null,2)+'\n');fs.renameSync(out+'.tmp',out);console.log(JSON.stringify({passed:report.passed,failed:report.failed}));if(report.failed)process.exitCode=1;
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
