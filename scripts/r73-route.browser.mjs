import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const out='out/r73',limit=Number(process.env.R73_ROUTE_LIMIT||2);await fs.mkdir(out,{recursive:true});
const report={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),htmlSHA256:createHash('sha256').update(await fs.readFile('_pages/docs/index.html')).digest('hex'),rendererSHA256:createHash('sha256').update(await fs.readFile('_pages/docs/dist/phase1.js')).digest('hex'),sandbox:true,physicalGPU:false,physicalMobile:false,scope:'actual mouse walking, E, dialogue, difficulty and slot buttons; progression flags and room/actor positions never forced. Combat-only fixture admits accelerated native hitEnemy against already active enemies and gives the test player survival protection. This verifies ordinary progression admission/events, NOT natural-difficulty combat playthrough.',maps:[],errors:[],walks:0};
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']}),context=await browser.newContext({viewport:{width:1365,height:850}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('crash',()=>report.errors.push('PAGE_CRASH'));
const saveReport=()=>fs.writeFile(`${out}/route-browser.json`,JSON.stringify(report,null,2));
async function dialogues(){for(let n=0;n<70&&await page.locator('#storyNext').count();n++){await page.locator('#storyNext').click();await page.waitForTimeout(90);}}
async function pulse(){return page.evaluate(()=>{player.invincible=1000000;player.invReason='r73-progression-combat-fixture';let hits=0;for(const e of room.enemies)if(e.hp>0&&e.spawnState==='active'&&!e.deadRecorded){hitEnemy(e,1e8,{kind:'hero',hero:player.hero,ability:'qa-r73-native-clear-events',angle:0});hits++;}return hits;});}
async function settled(){await dialogues();await page.waitForFunction(()=>{const s=window.__STORYWORLD_SAVE_SLOTS_R73__.inspect();return started&&booted&&!loading&&!s.busy&&s.transitionDepth===0;},null,{timeout:60000});await dialogues();}
async function walk(point,{portal=false}={}){
 const initial=await page.evaluate(()=>zone);report.walks++;
 for(let step=0;step<180;step++){
  if(await page.locator('#r71DifficultyConfirm').count())return;
  await dialogues();await pulse();
  const row=await page.evaluate(({point,initial})=>{if(zone!==initial||loading)return{transition:true};const d=Math.hypot(player.x-point.x,player.y-point.y);if(d<.6)return{arrived:true,d};if(modal)return{modal:true,panel:$('panel').innerText.slice(0,500)};const path=findPath(player,point);if(!path.length)return{noPath:true,from:{x:player.x,y:player.y},point};const p=path[0],length=Math.hypot(p.x-player.x,p.y-player.y),next=length>5?{x:player.x+(p.x-player.x)*5/length,y:player.y+(p.y-player.y)*5/length}:p;return{next,q:project(next.x,next.y),d};},{point,initial});
  if(row.transition||row.arrived)return;
  assert.ok(!row.modal&&!row.noPath,'physical route blocked: '+JSON.stringify(row));
  const box=await page.locator('#game').boundingBox();await page.mouse.click(box.x+row.q.x,box.y+row.q.y);
  for(let wait=0;wait<20;wait++){await page.waitForTimeout(150);await pulse();const stop=await page.evaluate(({next,initial})=>zone!==initial||loading||modal||Math.hypot(player.x-next.x,player.y-next.y)<.65,{next:row.next,initial});if(stop)break;}
 }
 throw Error('physical walk step limit exceeded '+JSON.stringify({point,initial,portal}));
}
async function next(){const before=await page.evaluate(()=>({zone,portals:window.__STORYWORLD_ROUTES_R72__.inspect()})),p=before.portals.portals.find(p=>p.role==='next');assert.ok(p?.open,'next portal must open after native clear');assert.equal(p.destination,await page.evaluate(()=>window.__STORYWORLD_ROUTES_R72__.destination('next')));await walk(p.point,{portal:true});await page.waitForFunction(to=>document.getElementById('r71DifficultyConfirm')||zone===to&&!loading,p.destination,{timeout:30000});if(await page.locator('#r71DifficultyConfirm').count())await page.locator('#r71DifficultyConfirm').click();await page.waitForFunction(to=>zone===to&&!loading,p.destination,{timeout:60000});await settled();return{from:before.zone,to:p.destination,point:p.point};}

async function slotSave(){await page.locator('#menuBtn').click();await page.locator('#slotsOpenR73').click();await page.locator('[data-slot-save="1"]').click();await page.locator('#slotConfirmR73').click();await page.waitForFunction(()=>document.getElementById('slotsMessageR73')?.textContent.includes('저장 완료'));const raw=await page.evaluate(()=>window.__STORYWORLD_SAVE_SLOTS_R73__.read(1));await page.locator('#slotsBackR73').click();return raw;}
async function complete(){const id=await page.evaluate(()=>zone),before=await slotSave();
 for(let attempt=0;attempt<40;attempt++){
  await dialogues();await pulse();await page.waitForTimeout(200);
  const state=await page.evaluate(()=>({done:completed(zone)||room.cleared,objective:{...room.objective},engaged:room.engaged,stage:room.encounterStage,active:room.enemies.filter(e=>e.hp>0&&e.spawnState==='active').length,modal,story:!!storyScene}));
  if(state.done){await dialogues();const after=await slotSave(),route=await page.evaluate(()=>window.__STORYWORLD_ROUTES_R72__.inspect());assert.ok(after.progress[after.layer][id]===true);assert.equal(after.rooms[after.layer+':'+id].cleared,true);report.maps.push({id,before:{level:before.player.level,points:before.player.points,cleared:before.rooms[before.layer+':'+id]?.cleared},after:{level:after.player.level,points:after.player.points,progress:after.progress,room:after.rooms[after.layer+':'+id]},route});await saveReport();return;}
  if(!state.modal){await walk(state.objective);if(!await page.evaluate(()=>modal))await page.keyboard.press('e');}
 }
 throw Error('native clear sequence did not finish '+id);
}
try{
 await page.goto('http://127.0.0.1:4391/',{timeout:60000});await page.locator('#campaignNew54').click({timeout:60000});await page.locator('#slotConfirmR73').click();await settled();
 await page.evaluate(()=>{settings.sound=false;settings.music=false;settings.narration=false;auto=false;settings.autoSkill=false;});
 // Read the first sanctuary's actual DREAM control before any campaign clear.
 await walk(await page.evaluate(()=>({...room.objective})));await page.keyboard.press('e');await page.waitForSelector('#worldLayer');assert.equal(await page.locator('#worldLayer').isDisabled(),true);await page.locator('#sanctuaryBack').click();report.dreamInitiallyLocked=true;
 await next();
 for(let i=0;i<limit;i++){await complete();if(i<limit-1)await next();}
 const cleared=await page.evaluate(()=>({zone,level:player.level,points:player.points,ledger:JSON.stringify(window.__STORYWORLD_PROGRESSION_R62__.state().clears)}));
 await page.screenshot({path:`${out}/native-clear-next-door.png`});const trip=await next();const previous=await page.evaluate(()=>window.__STORYWORLD_ROUTES_R72__.inspect().portals.find(p=>p.role==='previous'));assert.equal(previous.destination,cleared.zone);await page.screenshot({path:`${out}/native-previous-start.png`});await walk(previous.point,{portal:true});await page.waitForFunction(id=>zone===id&&!loading,cleared.zone,{timeout:60000});await settled();await slotSave();
 await page.reload();await page.locator('#campaignContinue54').click({timeout:60000});await settled();const restored=await page.evaluate(()=>({zone,blocked:blocked(player.x,player.y,.34),level:player.level,points:player.points,ledger:JSON.stringify(window.__STORYWORLD_PROGRESSION_R62__.state().clears),portals:window.__STORYWORLD_ROUTES_R72__.inspect().portals,renderer:window.__STORYWORLD_PHASE1__.inspect()}));assert.equal(restored.zone,cleared.zone);assert.equal(restored.blocked,false);assert.equal(restored.level,cleared.level);assert.equal(restored.ledger,cleared.ledger);assert.equal(new Set(restored.portals.map(p=>p.role)).size,restored.portals.length);assert.equal(restored.renderer.failed,false);assert.deepEqual(report.errors,[]);report.returnTrip={trip,previous,cleared,restored};report.ok=true;
}catch(e){report.ok=false;report.error=String(e.stack);report.state=await page.evaluate(()=>({zone,layer,started,booted,loading,modal,story:storyScene?.key,player:{x:player.x,y:player.y},stage:room.encounterStage,route:route.length,panel:$('panel').innerText.slice(0,2500),fatal:$('fatal').textContent,render:window.__STORYWORLD_PHASE1__.inspect()})).catch(()=>null);await page.screenshot({path:`${out}/route-failure.png`}).catch(()=>{});console.error('R73_ROUTE_FAILURE',JSON.stringify(report));throw e;}finally{await saveReport();await browser.close();}
console.log('R73_ROUTE_RESULT',JSON.stringify({sha:report.sha,ok:report.ok,maps:report.maps.map(m=>m.id),walks:report.walks,scope:report.scope}));
