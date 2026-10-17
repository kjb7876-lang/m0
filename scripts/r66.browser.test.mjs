import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4391/',OUT=path.resolve('out/r66');
await fs.mkdir(OUT,{recursive:true});
const baselineHTML=await fs.readFile('docs/index.html','utf8'),baselineModule=await fs.readFile('docs/dist/phase1.js','utf8'),helperSource=await fs.readFile('client-source/review-r66.js','utf8');
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
const result={revision:'R66-EGO-PERF',browser:await browser.version(),sandbox:true,physicalGPU:false,physicalMobile:false,checks:[],status:'running'};
const save=()=>fs.writeFile(path.join(OUT,'browser-regression.json'),JSON.stringify(result,null,2)+'\n');
async function openGame({baseline=false,mobile=false}={}){
 const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1365,height:850},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(baseline){await page.route(URL,r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:baselineHTML}));await page.route(new globalThis.URL('dist/phase1.js',URL).href,r=>r.fulfill({status:200,contentType:'text/javascript',body:baselineModule}));}
 try{
  await page.goto(URL,{waitUntil:'load',timeout:60000});await page.waitForTimeout(500);await page.locator('#campaignNew54').click({timeout:60000});
  await page.waitForFunction(()=>window.eval('started && booted && !loading'),null,{timeout:60000});await page.waitForTimeout(1000);
  const entered=await page.evaluate(()=>{auto=false;settings.autoSkill=false;settings.sound=false;settings.music=false;player.hp=maxHP()*100;return enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}});});
  assert.equal(entered,true,'Native region entry must report success');
  await page.waitForFunction(()=>window.eval("zone==='dist00' && !loading && !modal"),null,{timeout:30000});
  await page.evaluate(()=>{room.engaged=true;player.hp=maxHP()*100;player.ego=0;player.samong=0;});
  return{context,page,errors};
 }catch(e){console.error('R66_BOOT_STATE',await page.evaluate(()=>window.eval('({started,booted,loading,modal,zone,auto,warnings:(warnings||[]).slice(-5)})')).catch(()=>null),errors);await context.close();throw e;}
}
async function damageCase(baseline){
 const {context,page,errors}=await openGame({baseline});
 try{
  const start=await page.evaluate(()=>{
   const c=window.__STORYWORLD_CAMPAIGN_R63R1__,p=player,prog=window.__STORYWORLD_PROGRESSION_R62__;p.points+=2;prog.purchase('threadDanceR63',p);p.coopIdR62='r66-damage-fixture';
   const enemy={...room.enemies[0],id:'r66-damage-enemy',x:p.x+1,y:p.y,hp:1e8,maxHp:1e8,deadRecorded:false,spawnState:'active',invulnerableUntil:0,graceUntil:0,attack:null,nav:[],tell:0,cd:100};room.enemies=[enemy];
   window.__r66Damage=[];const base=hitEnemy;hitEnemy=function(e,amount,source){if(source?.ability==='threadDanceR63'){window.__r66Damage.push({amount,id:source.eventId});return true;}return base.apply(this,arguments);};
   const power=attackPower(),cast=c.cast(true),cooldown=c.inspect().activeSkillCooldown;return{power,cast,cooldown,hits:c.inspect().skillHitLimit};
  });
  assert.equal(start.cast,true,JSON.stringify(start));assert.ok(Math.abs(start.cooldown-20)<.01);
  await page.waitForFunction(()=>window.__r66Damage.length>=3,null,{timeout:20000});
  const damage=await page.evaluate(()=>window.__r66Damage);assert.equal(damage.length,3);assert.equal(new Set(damage.map(r=>r.id)).size,3);
  let ego=null;if(!baseline){ego=await page.evaluate(()=>window.eval(`(()=>{time+=25;player.ego=3;const c=window.__STORYWORLD_CAMPAIGN_R63R1__,cast=c.cast(true),cd=c.inspect().activeSkillCooldown;const a=ego151,b=egoRoom151;player.ego=0;ego151={...ego151,active:true,visitMap:zone,visitLayer:layer};egoRoom151=room;const transformed=window.__STORYWORLD_R66__.isEgo(player);ego151=a;egoRoom151=b;return{cast,cd,transformed};})()`));assert.equal(ego.cast,true);assert.ok(Math.abs(ego.cd-4)<.01);assert.equal(ego.transformed,true);}
  assert.deepEqual(errors,[]);return{...start,damage,ego,errors};
 }finally{await context.close();}
}
async function hudCase(mobile){
 const {context,page,errors}=await openGame({mobile});
 try{
  const expected=await page.evaluate(()=>{
   const boss=room.enemies.find(e=>e.boss||e.midboss);boss.spawnState='active';boss.deadRecorded=false;boss.maxHp=6421.5;boss.hp=3210.5;boss.cd=100;room.engaged=true;updateHUD();
   return{hp:boss.hp,maxHp:boss.maxHp,state:boss.spawnState,listed:liveEnemies().includes(boss),barClass:document.getElementById('bossbar').className};
  });
  console.log('R66_HUD_ACTIVE_STATE',JSON.stringify(expected));assert.equal(expected.listed,true,'HUD fixture must use an actually active boss');
  const node=page.locator('#bossHPNumbersR66');await node.waitFor({state:'visible',timeout:10000});const text=await node.textContent();assert.equal(text,'3,211 / 6,422');
  const box=await node.boundingBox(),viewport=page.viewportSize();assert.ok(box&&box.width>50&&box.height>=16);assert.ok(box.x>=-1&&box.x+box.width<=viewport.width+1);assert.ok(box.y>=0&&box.y+box.height<=viewport.height);
  await page.evaluate(s=>window.eval(s),helperSource);await page.evaluate(()=>updateHUD());assert.equal(await node.count(),1);
  await page.screenshot({path:path.join(OUT,mobile?'boss-hp-mobile.png':'boss-hp-desktop.png')});assert.deepEqual(errors,[]);return{mobile,expected,text,box,errors};
 }finally{await context.close();}
}
async function lifecycleCase(){
 const {context,page,errors}=await openGame();
 try{
  const cdp=await context.newCDPSession(page);await cdp.send('HeapProfiler.enable');await page.evaluate(()=>{window.__r66Save=serializeSave();});const cycles=[];
  for(let i=0;i<6;i++){
   await page.evaluate(async()=>{await restoreSave(window.__r66Save);auto=false;settings.autoSkill=false;});await page.waitForTimeout(200);await cdp.send('HeapProfiler.collectGarbage');
   const usage=await cdp.send('Runtime.getHeapUsage'),counts=await page.evaluate(()=>({effects:effects.length,projectiles:projectiles.length,delayed:typeof delayed==='undefined'?null:delayed.length,enemies:room.enemies.length,props:room.props.length,booted,loading,modal,zone}));
   assert.equal(counts.booted,true);assert.equal(counts.loading,false);assert.equal(counts.zone,'dist00');cycles.push({cycle:i,usedBytes:usage.usedSize,...counts});
  }
  await cdp.detach();assert.deepEqual(errors,[]);return{cycles,errors,caveat:'Six save/restore cycles with forced GC; bounded investigation, not proof of no long-duration leaks.'};
 }finally{await context.close();}
}
async function runLegacy(){
 let source=await fs.readFile('qa-r65/candidate-regression.mjs','utf8');source=source.replace("executablePath: '/usr/bin/chromium',",'chromiumSandbox: true,').replaceAll("args: ['--no-sandbox', '--disable-dev-shm-usage']","args: ['--disable-dev-shm-usage']");
 source=source.replace("const outDir = path.resolve('qa-r65');","const outDir = path.resolve('out/r66/legacy');\nawait fs.mkdir(outDir,{recursive:true});");
 source=source.replace("browser:'Chromium 151 headless; emulated software renderer where WebGL is used'","browser:'Chromium '+await browser.version()+' headless; software renderer, sandbox enabled'");
 const generated=path.join(OUT,'legacy.generated.mjs');await fs.writeFile(generated,source);const log=await fs.open(path.join(OUT,'legacy-regression.log'),'w');
 try{const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[generated],{env:{...process.env,STORYWORLD_URL:URL},stdio:['ignore',log.fd,log.fd]});child.on('error',reject);child.on('exit',resolve);});if(code!==0)console.error(await fs.readFile(path.join(OUT,'legacy-regression.log'),'utf8'));assert.equal(code,0,'Existing native regression failed');return{exitCode:code,scope:'Existing R65 skill, story, difficulty, save, desktop/mobile and local co-op assertions'};}finally{await log.close();}
}
try{
 const old=await damageCase(true),next=await damageCase(false);assert.ok(Math.abs(next.power/old.power-2)<1e-9);assert.equal(next.damage.length,old.damage.length);next.damage.forEach((h,i)=>assert.ok(Math.abs(h.amount/old.damage[i].amount-4)<1e-9));
 result.checks.push({name:'native-damage-and-ego-cooldown',baseline:old,candidate:next});await save();
 result.checks.push({name:'boss-hp-desktop',...await hudCase(false)});await save();
 result.checks.push({name:'boss-hp-mobile-landscape',...await hudCase(true)});await save();
 result.checks.push({name:'save-restore-lifecycle',...await lifecycleCase()});await save();await browser.close();
 result.checks.push({name:'existing-native-regressions',...await runLegacy()});result.status='passed';await save();console.log('R66_BROWSER_RESULT',JSON.stringify(result));
}catch(e){result.status='failed';result.error=e.stack||String(e);await save();console.error('R66_BROWSER_RESULT',JSON.stringify(result));throw e;}finally{await browser.close();}
