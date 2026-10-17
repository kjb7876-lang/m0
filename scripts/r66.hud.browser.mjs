import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const url=process.env.STORYWORLD_URL||'http://127.0.0.1:4391/';
await fs.mkdir('out/r66',{recursive:true});
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
const report={scope:'Final active-vs-dormant boss HP and renderer cache version regression; full R66 browser suite is also required by the production Pages gate.',browser:await browser.version(),sandbox:true,results:[],status:'running'};
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1365,height:850},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[],modules=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/dist/phase1.js'))modules.push({url:r.url(),status:r.status()});});
  await page.goto(url,{waitUntil:'load',timeout:60000});await page.waitForTimeout(500);await page.locator('#campaignNew54').click();
  await page.waitForFunction(()=>window.eval('started&&booted&&!loading'),null,{timeout:60000});await page.waitForTimeout(1000);
  const entered=await page.evaluate(()=>{auto=false;settings.autoSkill=false;settings.sound=false;settings.music=false;player.hp=maxHP()*100;return enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}});});
  assert.equal(entered,true);await page.waitForFunction(()=>window.eval("zone==='dist00'&&!loading&&!modal"),null,{timeout:30000});
  const fixture=await page.evaluate(()=>{
   const boss=room.enemies.find(e=>e.boss||e.midboss);boss.spawnState='active';boss.deadRecorded=false;boss.hp=3210.5;boss.maxHp=6421.5;boss.cd=100;
   const dormant={...boss,id:'r66-dormant-boss-fixture',spawnState:'dormant',hp:999999,maxHp:999999};room.enemies=[dormant,boss];room.engaged=true;
   window.__r66ActiveBoss=boss;updateHUD();return{firstInactive:!liveEnemies().includes(dormant),activeIncluded:liveEnemies().includes(boss),selected:liveEnemies().find(e=>e.boss||e.midboss)?.id};
  });
  assert.equal(fixture.firstInactive,true);assert.equal(fixture.activeIncluded,true);
  const hp=page.locator('#bossHPNumbersR66');await hp.waitFor({state:'visible',timeout:10000});assert.equal(await hp.textContent(),'3,211 / 6,422');
  const box=await hp.boundingBox(),viewport=page.viewportSize();assert.ok(box&&box.height>=16&&box.x>=0&&box.x+box.width<=viewport.width+1&&box.y>=0&&box.y+box.height<=viewport.height);
  const fill=await page.locator('#bossHP').evaluate(e=>parseFloat(e.style.width));assert.ok(Math.abs(fill-(3210.5/6421.5*100))<.01);
  await page.screenshot({path:mobile?'out/r66/final-hp-mobile.png':'out/r66/final-hp-desktop.png'});
  await page.evaluate(()=>{window.__r66ActiveBoss.hp=0;updateHUD();});await page.locator('#bossbar').waitFor({state:'hidden',timeout:10000});
  assert.ok(modules.some(r=>r.url.includes('?r66=1')&&r.status===200),'The versioned renderer URL must be loaded successfully');assert.deepEqual(errors,[]);
  const row={mobile,fixture,text:'3,211 / 6,422',fillPercent:fill,box,hiddenAfterActiveBossDeath:true,modules,errors};report.results.push(row);console.log('R66_FINAL_HUD',JSON.stringify(row));await context.close();
 }
 report.status='passed';await fs.writeFile('out/r66/final-hud-regression.json',JSON.stringify(report,null,2)+'\n');
}catch(error){report.status='failed';report.error=error.stack||String(error);await fs.writeFile('out/r66/final-hud-regression.json',JSON.stringify(report,null,2)+'\n');throw error;}finally{await browser.close();}
