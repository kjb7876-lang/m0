// Fresh local CPU control. This records a known failed HP invariant, never a gameplay pass.
import fs from 'node:fs';import {createRuntime,html,hash,htmlPath} from './runtime.mjs';
const OUT='out/hospital-b2/production-order/',h=createRuntime(),run=h.run,j=s=>JSON.parse(run('JSON.stringify('+s+')'));
const report={htmlPath,htmlSHA256:hash(html),started:new Date().toISOString(),snapshots:[]};
function ack(){let n=0;while(run('!!storyScene')){if(n++>150)throw Error('scene loop');run('advanceScene()');}run('closePanel(true);auto=false;guide=false;keys.clear();');}
function snap(){return j(`({stage:room.encounterStage,player:{x:player.x,y:player.y,hp:player.hp},visit:__STORYWORLD_EGO151__.inspect().isVisit,actors:room.enemies.map(e=>({id:e.id,hp:e.hp,maxHp:e.maxHp,dead:e.deadRecorded,spawn:e.spawnState,owner:e.hospitalSummonR53?.owner||e.r61Summoned?.owner,x:e.x,y:e.y,blocked:blocked(e.x,e.y,(e.combatProfile?.bodyBlock?.r||e.radius||.3)+.14,room)}))})`);}
async function restore(r){h.box.input=r;await run('restoreSave(input)');}
try{
 h.install();await run('boot()');run('settings.narration=false;settings.sound=false;settings.music=false;');
 await restore(JSON.parse(fs.readFileSync(OUT+'synthetic-base.json')));ack();let raw=j('serializeSave()'),index=j('__STORYWORLD_EGO151__.routeIds()').indexOf('ep1a08');
 raw.ego151={...raw.ego151,unlocked:true,pending:false,active:true,cutinConsumed:true,index,direction:1,visitSeq:'1',visitId:'ego:1',visitMap:'ep1a08',visitLayer:'STORY',cleared:false,clearCount:'0',lastClearVisit:'0',routeRoom:structuredClone(raw.rooms['STORY:ep1a08'])};raw.ego151.routeRoom.egoVisitId151='ego:1';raw.player.x=18;raw.player.y=18.5;
 for(let n=0;n<2;n++){await restore(raw);const restored=snap();ack();run('tick(1/60)');report.snapshots.push({restored,firstTick:snap()});raw=j('serializeSave()');}
}catch(e){report.error=e.stack;process.exitCode=1;}
finally{report.finished=new Date().toISOString();report.moduleOrder=h.audit.installed;report.errors=h.audit.errors;fs.writeFileSync(OUT+(process.env.CPU_HTML?'ego-b1':'ego-b2')+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({records:report.snapshots.length,error:report.error||null}));}
