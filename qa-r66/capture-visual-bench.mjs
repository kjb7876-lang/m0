import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
const versions=[['baseline','http://127.0.0.1:4391/'],['candidate','http://127.0.0.1:4392/']];
const results=[];
const percentile=(values,p)=>{const a=[...values].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor((a.length-1)*p))]??null;};
try{
 for(const [name,url] of versions){
  const context=await browser.newContext({viewport:{width:1365,height:850},deviceScaleFactor:1});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{let seed=20261017;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};try{localStorage.clear();sessionStorage.clear();}catch{}});
  await page.goto(url,{waitUntil:'load',timeout:60000});
  await page.locator('#campaignNew54').click();
  await page.waitForFunction(()=>window.eval('started && booted && !loading'),null,{timeout:60000});
  const zone=await page.evaluate(()=>window.eval('zone'));
  if(zone!=='dist00')await page.evaluate(()=>window.eval("enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}})"));
  await page.waitForFunction(()=>window.eval("zone==='dist00'&&!loading&&!modal"),null,{timeout:60000});
  await page.evaluate(()=>window.eval(`(()=>{room.engaged=true;player.x=15;player.y=19;player.moving=false;player.hp=Math.max(player.hp,maxHP()*100);projectiles.length=0;effects.length=0;hazards.length=0;settings.sound=false;settings.music=false;settings.lowFx=false;settings.reducedMotion=false;window.__STORYWORLD_PRESENTATION_R58__?.setFlashlight(true);})()`));
  const sample=await page.evaluate(()=>{
   const run=()=>window.__STORYWORLD_PHASE1__.captureVisual();
   for(let i=0;i<8;i++)run();
   const samples=[];let commandCount=0,kindCounts={};
   for(let i=0;i<32;i++){const t=performance.now();const rows=run();samples.push(performance.now()-t);commandCount=rows.length;kindCounts={};for(const c of rows)kindCounts[c.kind]=(kindCounts[c.kind]||0)+1;}
   const sorted=[...samples].sort((a,b)=>a-b);
   return{iterations:samples.length,commandCount,kindCounts,meanMs:samples.reduce((a,b)=>a+b,0)/samples.length,p50Ms:sorted[Math.floor((sorted.length-1)*.5)],p95Ms:sorted[Math.floor((sorted.length-1)*.95)],minMs:sorted[0],maxMs:sorted.at(-1),samplesMs:samples};
  });
  results.push({name,url,scenario:'dist00/STORY normal; 1365x850 DPR1; stable player at x15/y19; captureVisual records commands and does not execute Three/WebGL rendering',...sample,pageErrors:errors});
  await context.close();
 }
 const out={status:'CAPTURE_VISUAL_CPU_PROFILE',browser:await browser.version(),runs:results};
 await fs.writeFile(path.resolve('qa-r66/capture-visual-bench.json'),JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify(out,null,2));
}finally{await browser.close();}
