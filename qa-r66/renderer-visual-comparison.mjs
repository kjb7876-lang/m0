import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=process.env.STORYWORLD_URL||'http://127.0.0.1:4392/';
const outDir=path.resolve('qa-r65');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];
try{
  for(const mode of ['three','legacy']){
    const context=await browser.newContext({viewport:{width:1365,height:850},deviceScaleFactor:1});
    await context.addInitScript(()=>{
      let seed=20261017;
      Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
      try{localStorage.clear();sessionStorage.clear();}catch(_){}
    });
    const page=await context.newPage(),pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(e.message));
    const url=new URL(base);url.searchParams.set('renderer',mode);
    await page.goto(url.href,{waitUntil:'load',timeout:60000});
    await page.waitForTimeout(300);
    await page.locator('#campaignNew54').click();
    await page.waitForFunction(()=>window.eval('started && booted && !loading'),null,{timeout:60000});
    await page.waitForTimeout(600);
    const startZone=await page.evaluate(()=>window.eval('zone'));
    if(startZone!=='dist00'){
      await page.evaluate(()=>window.eval("enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}})"));
      await page.waitForFunction(()=>window.eval("zone==='dist00'&&!loading&&!modal"),null,{timeout:60000});
    }
    await page.waitForFunction(mode=>window.__STORYWORLD_PHASE1__?.inspect?.()?.active===mode,mode,{timeout:60000});
    await page.waitForTimeout(1000);
    const expression=[
      "room.engaged=true;player.x=15;player.y=19;player.moving=false;",
      "player.hp=Math.max(player.hp,maxHP()*100);",
      "projectiles.length=0;effects.length=0;hazards.length=0;",
      "settings.sound=false;settings.music=false;settings.lowFx=false;settings.reducedMotion=false;",
      "window.__STORYWORLD_PRESENTATION_R58__?.setFlashlight(true);",
      "time=7.25;modal=false;window.requestAnimationFrame=()=>0;draw();",
      "return {zone,layer,player:{x:player.x,y:player.y,hp:player.hp},enemies:room.enemies.length,props:room.props.length,time,flashlight:window.__STORYWORLD_PRESENTATION_R58__?.inspect(),renderer:window.__STORYWORLD_PHASE1__?.inspect?.()?.active};"
    ].join('');
    const state=await page.evaluate(expression=>window.eval("(()=>{" + expression + "})()"),expression);
    await page.waitForTimeout(100);
    const screenshot=path.join(outDir,'renderer-quality-'+mode+'-same-scene.png');
    await page.screenshot({path:screenshot,animations:'disabled'});
    results.push({mode,state,pageErrors,screenshot});
    await context.close();
  }
  const result={status:'VISUAL_RENDERER_COMPARISON_CAPTURED',browser:await browser.version(),viewport:{width:1365,height:850,dpr:1},seed:20261017,results};
  await fs.writeFile(path.join(outDir,'renderer-visual-comparison.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
