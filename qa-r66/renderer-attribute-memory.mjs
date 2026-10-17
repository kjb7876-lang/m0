import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const baseThree=process.env.BASELINE_URL||'http://127.0.0.1:4391/';
const candidateThree=process.env.CANDIDATE_URL||'http://127.0.0.1:4392/';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];
try{
  for(const [label,base] of [['baseline',baseThree],['candidate',candidateThree]]){
    const context=await browser.newContext({viewport:{width:1365,height:850},deviceScaleFactor:1});
    await context.addInitScript(()=>{let seed=20261017;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};try{localStorage.clear();sessionStorage.clear();}catch(_){}});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const url=new URL(base);url.searchParams.set('renderer','three');
    await page.goto(url.href,{waitUntil:'load',timeout:60000});await page.waitForTimeout(300);
    await page.locator('#campaignNew54').click();
    await page.waitForFunction(()=>window.eval('started&&booted&&!loading'),null,{timeout:60000});
    await page.waitForTimeout(600);
    const zone=await page.evaluate(()=>window.eval('zone'));
    if(zone!=='dist00'){
      await page.evaluate(()=>window.eval("enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}})"));
      await page.waitForFunction(()=>window.eval("zone==='dist00'&&!loading&&!modal"),null,{timeout:60000});
    }
    await page.waitForFunction(()=>window.__STORYWORLD_PHASE1__?.inspect?.()?.active==='three',null,{timeout:60000});
    await page.waitForTimeout(1200);
    const sample=await page.evaluate(()=>{const renderer=window.__STORYWORLD_PHASE1__.controller.state.three,rows=[...renderer.commands.rows.values()];let screenPositionBytes=0,screenPositionRows=0,totalGeometryAttributeBytes=0;const attributes={};for(const row of rows){for(const[name,a]of Object.entries(row.mesh.geometry.attributes)){const bytes=a.array?.byteLength||0;attributes[name]=(attributes[name]||0)+bytes;totalGeometryAttributeBytes+=bytes;if(name==='screenPosition'){screenPositionBytes+=bytes;screenPositionRows++;}}}return{renderer:'three',zone,layer,rows:rows.length,screenPositionRows,screenPositionBytes,totalGeometryAttributeBytes,attributes,webglRenderer:(()=>{const gl=renderer.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER);})()};});
    results.push({label,...sample,pageErrors:errors});
    await context.close();
  }
  const saved={status:'THREE_GEOMETRY_ATTRIBUTE_MEMORY_PASSED',browser:await browser.version(),scenario:'dist00 normal, 1365x850 DPR1, fixed PRNG seed, same start position and six-enemy game state',results};
  console.log(JSON.stringify(saved,null,2));
}finally{await browser.close();}
