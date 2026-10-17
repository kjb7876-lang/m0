import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const url=process.env.STORYWORLD_URL||'http://127.0.0.1:4391/';
await fs.mkdir('out/r67',{recursive:true});
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
const report={browser:await browser.version(),physicalGPU:false,sandbox:true,scope:'Real gameplay renderer gate: R66 reproduces unsupported cubic-curve fallback, R67 must retain Three.js through the same original six-motif skill and automatic EGO combat. No damage, effect or scene code is replaced.',builds:[],status:'running'};
try{
 for(const kind of ['baseline','candidate']){
  const folder=kind==='baseline'?'_baseline/docs':'_pages/docs',html=await fs.readFile(folder+'/index.html','utf8'),js=await fs.readFile(folder+'/dist/phase1.js','utf8');
  const context=await browser.newContext({viewport:{width:1365,height:850},deviceScaleFactor:1}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(url,r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));
  await page.route('**/dist/phase1.js*',r=>r.fulfill({status:200,contentType:'text/javascript',body:js}));
  try{
   await page.goto(url,{waitUntil:'load',timeout:60000});await page.locator('#campaignNew54').click({timeout:60000});
   await page.waitForFunction(()=>window.eval('started&&booted&&!loading'),null,{timeout:60000});await page.waitForTimeout(1000);
   assert.equal(await page.evaluate(async()=>{auto=false;settings.autoSkill=false;settings.sound=false;settings.music=false;return await enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}});}),true);
   await page.waitForFunction(()=>window.eval("zone==='dist00'&&!loading&&!modal"),null,{timeout:60000});
   await page.evaluate(()=>{
    auto=false;settings.autoSkill=false;settings.sound=false;settings.music=false;player.hp=maxHP()*100;player.ego=0;command=null;target=null;route=[];room.engaged=true;
    window.__r67NativeThreadHits=0;const original=hitEnemy;hitEnemy=function(e,amount,source){if(source?.ability==='threadDanceR63')window.__r67NativeThreadHits++;return original.apply(this,arguments);};
   });
   const stages=[];
   async function record(name){
    await page.waitForTimeout(700);
    const row=await page.evaluate(name=>{const r=window.__STORYWORLD_PHASE1__?.inspect?.();return{name,active:r?.active,requested:r?.requested,reason:r?.reason,failed:r?.failed,ego:player.ego,modal,loading,zone,effects:effects.length,projectiles:projectiles.length,nativeThreadHits:window.__r67NativeThreadHits};},name);
    stages.push(row);console.log('R67_EGO_RENDERER_GATE',JSON.stringify({kind,...row}));
   }
   await record('ordinary-map');
   await page.evaluate(()=>{player.ego=1000;});await record('ego-only');
   await page.evaluate(()=>{player.points+=200;const p=window.__STORYWORLD_PROGRESSION_R62__;for(const id of ['threadDanceR63','threadCrossR64','threadFlowerR64','threadFractalR64','threadClawR64','threadTsubameR64','threadIchidanR64'])p.purchase(id,player);});await record('ego-owned-motifs');
   const cast=await page.evaluate(()=>{room.enemies.forEach((e,i)=>{e.x=player.x+2+(i%3)*.6;e.y=player.y+(Math.floor(i/3)-.5)*1.1;e.hp=e.maxHp=1e8;e.difficultyBaseHpR63=1e8/(e.difficultyFactorR63||1);e.spawnState='active';e.deadRecorded=false;});return window.__STORYWORLD_CAMPAIGN_R63R1__.cast(true);});
   assert.equal(cast,true,'The native six-motif cast must actually occur');
   await page.waitForFunction(()=>window.__r67NativeThreadHits>0,null,{timeout:20000});
   await page.waitForTimeout(2500);await record('thread-cast-six-motifs');
   await page.evaluate(()=>{auto=true;settings.autoSkill=true;});await page.waitForTimeout(6000);await record('automatic-skills');
   await page.screenshot({path:'out/r67/ego-probe-'+kind+'.png'});
   report.builds.push({kind,cast,stages,errors});await fs.writeFile('out/r67/ego-probe.json',JSON.stringify(report,null,2)+'\n');
   assert.deepEqual(errors,[]);assert.ok(stages.at(-1).nativeThreadHits>0);
   if(kind==='candidate')for(const row of stages){assert.equal(row.active,'three',JSON.stringify(row));assert.equal(row.failed,false,JSON.stringify(row));}
   else {assert.ok(stages.slice(0,3).every(row=>row.active==='three'));for(const row of stages.slice(3)){assert.equal(row.active,'legacy');assert.match(row.reason,/ctx\.bezierCurveTo is not a function/);}}
  }finally{await context.close();}
 }
 report.status='passed';console.log('R67_EGO_RENDERER_GATE_PASSED',JSON.stringify({baselineFallback:'ctx.bezierCurveTo is not a function',candidate:'Three.js retained through every stage',nativeHits:report.builds.map(b=>({kind:b.kind,hits:b.stages.at(-1).nativeThreadHits}))}));
}catch(error){report.status='failed';report.error=error.stack||String(error);throw error;}finally{await fs.writeFile('out/r67/ego-probe.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
