import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const url=process.env.STORYWORLD_URL||'http://127.0.0.1:4391/';
await fs.mkdir('out/r67',{recursive:true});
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
const report={browser:await browser.version(),physicalGPU:false,scope:'Diagnostic only: staged EGO states, owned motifs and natural auto skills on both renderers. No production edits.',builds:[]};
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
    window.__r67EgoRendererErrors=[];const view=window.__STORYWORLD_PHASE1__?.controller?.state?.three;
    if(view&&typeof view.render==='function'){const original=view.render;view.render=function(...args){try{return original.apply(this,args);}catch(e){window.__r67EgoRendererErrors.push({message:String(e.message),stack:String(e.stack)});throw e;}};}
   });
   const stages=[];
   async function record(name){await page.waitForTimeout(700);const row=await page.evaluate(name=>{const r=window.__STORYWORLD_PHASE1__?.inspect?.();return{name,active:r?.active,requested:r?.requested,reason:r?.reason,failed:r?.failed,events:r?.events,ego:player.ego,modal,loading,zone,effects:effects.length,projectiles:projectiles.length,warnings:(warnings||[]).slice(-8),rendererErrors:window.__r67EgoRendererErrors};},name);stages.push(row);console.log('R67_EGO_PROBE_STAGE',JSON.stringify({kind,...row}));}
   await record('ordinary-map');
   await page.evaluate(()=>{player.ego=1000;});await record('ego-only');
   await page.evaluate(()=>{player.points+=200;const p=window.__STORYWORLD_PROGRESSION_R62__;for(const id of ['threadDanceR63','threadCrossR64','threadFlowerR64','threadFractalR64','threadClawR64','threadTsubameR64','threadIchidanR64'])p.purchase(id,player);});await record('ego-owned-motifs');
   const cast=await page.evaluate(()=>{room.enemies.forEach((e,i)=>{e.x=player.x+2+(i%3)*.6;e.y=player.y+(Math.floor(i/3)-.5)*1.1;e.hp=e.maxHp=1e8;e.difficultyBaseHpR63=1e8/(e.difficultyFactorR63||1);e.spawnState='active';e.deadRecorded=false;});return window.__STORYWORLD_CAMPAIGN_R63R1__.cast(true);});
   await page.waitForTimeout(2500);await record('thread-cast-six-motifs');
   await page.evaluate(()=>{auto=true;settings.autoSkill=true;});await page.waitForTimeout(3000);await record('automatic-skills');
   await page.screenshot({path:'out/r67/ego-probe-'+kind+'.png'});
   report.builds.push({kind,cast,stages,errors});await fs.writeFile('out/r67/ego-probe.json',JSON.stringify(report,null,2)+'\n');
  }finally{await context.close();}
 }
 console.log('R67_EGO_PROBE_COMPLETE',JSON.stringify(report));
}finally{await fs.writeFile('out/r67/ego-probe.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
