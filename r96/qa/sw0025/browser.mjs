import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Uses the same sandboxed Chromium renderer and exact build as the mandatory R96 suite.
// Hero/form and room positioning are explicit fixtures, not normal saved-game progression.
const report={physicalDevice:false,softwareGPU:true,scope:'Actual WebGL, explicitly selected hero/form and staged enemy; not natural combat',checks:[],errors:[]};
const label=x=>report.checks.push(x);
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1280,height:800}});
const assets=[];
page.on('pageerror',e=>report.errors.push(String(e.message).slice(0,300)));
page.on('request',req=>{const p=new URL(req.url()).pathname;if(/assets\/r(?:1302|1305|1306)\//.test(p))assets.push(p);});
try{
 const response=await page.goto(process.env.STORYWORLD_URL,{timeout:120000});
 assert.equal(response.status(),200);
 await page.locator('#campaignNew54').click({timeout:120000});
 await page.locator('#slotConfirmR73').click();
 await page.waitForFunction(()=>started&&!loading&&!window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().busy,null,{timeout:120000});
 await page.evaluate(()=>{for(let i=0;i<80&&storyScene;i++)advanceScene();if(modal)closePanel(true);auto=false;guide=false;settings.autoSkill=false;});
 await page.waitForFunction(()=>window.__STORYWORLD_PHASE1__?.controller?.inspect().active==='three',null,{timeout:120000});
 assert.equal(await page.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.on()),false);
 assert.deepEqual(assets,[],'default off must not preload hero assets');
 label('R1305 opt-in and lazy assets unchanged');
 // Use the native room transition as in the pinned R1305 browser fixture.
 await page.evaluate(()=>{if(room?.id!=='dist00')enterRegion('dist00',null,{layer:'STORY',restore:true});});
 await page.waitForFunction(()=>!loading&&room?.id==='dist00',null,{timeout:150000});
 await page.evaluate(()=>{
  for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);
  auto=false;guide=false;settings.autoSkill=false;player.hp=player.maxHp=99999;
  for(const e of room.enemies){e.speed=0;e.damage=0;}
  const target=room.enemies.find(e=>e.nativeId==='dist00-boss'&&e.hp>0)||room.enemies.find(e=>e.hp>0);
  if(!target)throw Error('No native enemy');target.spawnState='active';target.deadRecorded=false;
  target.visible=true;target.disabled=false;target.x=player.x+1.2;target.y=player.y;target.visualLiftPx=0;
  const api=window.__STORYWORLD_MOB_GROUND_R206__;window.sw25ShadowStart=api.inspect().stats.contacts;
 });
 await page.waitForFunction(()=>window.__STORYWORLD_MOB_GROUND_R206__.inspect().stats.contacts>window.sw25ShadowStart,null,{timeout:15000});
 await page.evaluate(()=>window.__STORYWORLD_MOB_GROUND_R206__.set({contact:false}));
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.screenshot({path:'r96/sw0025-contact-before.png'});
 await page.evaluate(()=>window.__STORYWORLD_MOB_GROUND_R206__.set({contact:true}));
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.screenshot({path:'r96/sw0025-contact.png'});
 label('Native positioned 2D enemy rendered a compact contact command');
 const plan=['seoha','neon','lauren','michaela','slayer','hunter','gunner','persona','ego'];
 for(const hero of plan){
  await page.evaluate(async hero=>{
   const base=hero==='persona'?'lauren':hero==='ego'?'hwando':hero;
   const api=window.__STORYWORLD_HWANDO3D_R1302__;
   api.set(false);
   // Direct test selection intentionally skips the menu, not its native sprite preload.
   // The 3D overlay projects and replaces that actual 2D body draw.
   await ensureImages(heroPaths(base));
   player.hero=base;
   const persona=window.__STORYWORLD_PERSONA_HERO_R1113__,ego=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;
   persona.setForm(false);ego.setForm(false);
   if(hero==='persona'){persona.unlock('silent');if(!persona.setForm(true)||!persona.formActive())throw Error('Persona fixture form');}
   if(hero==='ego'){ego.unlock('rc151');if(!ego.setForm(true)||!ego.formActive())throw Error('EGO fixture form');}
   player.attackAnim=0;player.direction='right';player.moving=false;
  },hero);
  await page.waitForFunction(hero=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().hero===hero,hero,{timeout:30000});
  await page.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
  await page.waitForFunction(hero=>{const m=window.__STORYWORLD_HWANDO3D_R1302__,v=m.inspect();return v.hero===hero&&v.ready&&v.shown&&v.sharedScene&&v.lastBodies>0&&v.attackVariant==='r1306'&&m.measure()?.ink>100;},hero,{timeout:90000});
  await page.evaluate(()=>{player.attackAnim=.9;});
  await page.waitForFunction(()=>{const v=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return v.action==='attack'&&v.shown&&v.weights.attack>.5;},null,{timeout:10000});
  await page.screenshot({path:'r96/sw0025-attack-'+hero+'.png'});
  await page.evaluate(()=>{player.attackAnim=0;});
  await page.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().action==='idle',null,{timeout:10000});
  const state=await page.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect());
  assert.equal(state.hero,hero);assert.equal(state.attackVariant,'r1306');
  assert.ok(assets.some(p=>p.endsWith('/r1306/'+hero+'-attack.json')),'exact runtime patch fetched');
  label('Actual rendered patched avatar and attack→idle: '+hero);
 }
 // Same camera via portrait/dark-mobile emulation (not a phone). At least one
 // full R1306 avatar transition and the contact-shadow on/off pair is retained.
 await page.setViewportSize({width:390,height:730});
 await page.evaluate(async()=>{await ensureImages(heroPaths('slayer'));player.hero='slayer';player.personaHeroR1113=false;player.egoSovereignR1046=false;player.attackAnim=0;});
 await page.waitForFunction(()=>{const s=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return s.hero==='slayer'&&s.shown&&s.attackVariant==='r1306';},null,{timeout:15000});
 await page.screenshot({path:'r96/sw0025-mobile-idle.png'});
 await page.evaluate(()=>{player.attackAnim=.9;});
 await page.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.attack>.5,null,{timeout:15000});
 await page.screenshot({path:'r96/sw0025-mobile-attack.png'});
 await page.evaluate(()=>{player.attackAnim=0;});
 label('Portrait viewport renders patched avatar and attack; not a physical mobile device');
 assert.deepEqual(report.errors,[],'no page errors');
 report.passed=true;
}catch(e){report.passed=false;report.failure=String(e.stack);
 try{report.inspect=await page.evaluate(()=>({hero:window.__STORYWORLD_HWANDO3D_R1302__?.inspect(),shadow:window.__STORYWORLD_MOB_GROUND_R206__?.inspect(),zone}));}catch{}
 process.exitCode=1;
}finally{
 report.assets=assets;
 await fs.writeFile('r96/sw0025-browser-results.json',JSON.stringify(report,null,2)+'\n');
 await browser.close();
 console.log(JSON.stringify(report));
}
