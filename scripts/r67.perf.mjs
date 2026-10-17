import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const url=process.env.STORYWORLD_URL||'http://127.0.0.1:4391/';
const duration=30000,out='out/r67';await fs.mkdir(out,{recursive:true});
const sources={baseline:{html:await fs.readFile('_baseline/docs/index.html','utf8'),js:await fs.readFile('_baseline/docs/dist/phase1.js','utf8')},candidate:{html:await fs.readFile('_pages/docs/index.html','utf8'),js:await fs.readFile('_pages/docs/dist/phase1.js','utf8')}};
const stats=values=>{const a=values.slice().sort((x,y)=>x-y);return{count:a.length,p50Ms:a[Math.floor((a.length-1)*.5)]??null,p95Ms:a[Math.floor((a.length-1)*.95)]??null,p99Ms:a[Math.floor((a.length-1)*.99)]??null,maxMs:a.at(-1)??null,meanMs:a.length?a.reduce((x,y)=>x+y,0)/a.length:null,over50ms:a.filter(x=>x>50).length};};
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
const result={baseline:'080ef5a535eb900f9c50900dbc35bf6c81e0ddb4',candidate:process.env.GITHUB_SHA||'working',browser:await browser.version(),durationMs:duration,physicalGPU:false,physicalMobile:false,sandbox:true,order:['baseline','candidate','candidate','baseline'],caveat:'Headless software renderer. Fresh contexts and seeded initial states; live simulation can evolve at different rates. EGO stress positions six high-HP enemies nearby and uses genuine skills. The R66 cubic-method fallback is reproduced; the candidate MUST retain Three.js. A cross-renderer EGO comparison is explicitly ineligible for claiming a same-renderer optimization percentage. Not physical-device FPS, natural full-campaign combat or a universal gain.',runs:[],status:'running'};
const save=()=>fs.writeFile(out+'/performance.json',JSON.stringify(result,null,2)+'\n');
async function rendererState(page){return page.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__?.inspect?.();return{active:r?.active,requested:r?.requested,reason:r?.reason,failed:r?.failed,loading,modal,zone};});}
try{
 for(const scenario of ['movement','ego-stress']){
  for(const [index,kind] of result.order.entries()){
   const context=await browser.newContext({viewport:{width:1365,height:850},deviceScaleFactor:1});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    let seed=67017;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const seen=new WeakSet(),original=HTMLCanvasElement.prototype.getContext;window.__r67GL={drawCalls:0,uploadCalls:0,devices:[]};
    HTMLCanvasElement.prototype.getContext=function(...args){const gl=original.apply(this,args);if(gl&&String(args[0]).startsWith('webgl')&&!seen.has(gl)){seen.add(gl);for(const key of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced'])if(typeof gl[key]==='function'){const call=gl[key];gl[key]=function(...v){window.__r67GL.drawCalls++;return call.apply(this,v);};}for(const key of ['texImage2D','texSubImage2D'])if(typeof gl[key]==='function'){const call=gl[key];gl[key]=function(...v){window.__r67GL.uploadCalls++;return call.apply(this,v);};}const ext=gl.getExtension('WEBGL_debug_renderer_info');window.__r67GL.devices.push({renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),version:gl.getParameter(gl.VERSION)});}return gl;};
   });
   await page.route(url,r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:sources[kind].html}));
   await page.route('**/dist/phase1.js*',r=>r.fulfill({status:200,contentType:'text/javascript',body:sources[kind].js}));
   try{
    await page.goto(url,{waitUntil:'load',timeout:60000});await page.locator('#campaignNew54').click({timeout:60000});await page.waitForFunction(()=>window.eval('started&&booted&&!loading'),null,{timeout:60000});
    await page.waitForTimeout(1000);
    await page.waitForFunction(()=>window.eval('started&&booted&&!loading&&!!room&&!!player')&&window.__STORYWORLD_PHASE1__?.inspect?.().active==='three',null,{timeout:60000});
    const entry=await page.evaluate(async()=>{
     const before={zone,started,booted,loading,modal};auto=false;settings.autoSkill=false;settings.sound=false;settings.music=false;player.hp=maxHP()*100;
     const accepted=await enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}});
     return{accepted,before,after:{zone,started,booted,loading,modal},warnings:(warnings||[]).slice(-5)};
    });
    console.log('R67_MAP_ENTRY',JSON.stringify({scenario,kind,index,accepted:entry.accepted}));
    assert.equal(entry.accepted,true,'Native performance-map entry failed: '+JSON.stringify(entry));
    await page.waitForFunction(()=>window.eval("zone==='dist00'&&!loading&&!modal"),null,{timeout:30000});
    const setup=await page.evaluate(scenario=>{
     auto=false;settings.autoSkill=false;settings.sound=false;settings.music=false;settings.lowFx=false;settings.reducedMotion=false;room.engaged=true;player.hp=maxHP()*100;player.ego=0;command=null;target=null;route=[];window.__STORYWORLD_PRESENTATION_R58__?.setFlashlight(true);
     window.__r67ThreadHits=0;const baseHit=hitEnemy;hitEnemy=function(e,amount,source){if(source?.ability==='threadDanceR63')window.__r67ThreadHits++;return baseHit.apply(this,arguments);};
     let firstCast=null;
     if(scenario==='ego-stress'){
      player.points+=200;const prog=window.__STORYWORLD_PROGRESSION_R62__;for(const id of ['threadDanceR63','threadCrossR64','threadFlowerR64','threadFractalR64','threadClawR64','threadTsubameR64','threadIchidanR64'])prog.purchase(id,player);
      player.ego=1000;room.enemies.forEach((e,i)=>{e.x=player.x+2+(i%3)*.6;e.y=player.y+(Math.floor(i/3)-.5)*1.1;e.hp=e.maxHp=1e8;e.difficultyBaseHpR63=1e8/(e.difficultyFactorR63||1);e.spawnState='active';e.deadRecorded=false;});auto=true;settings.autoSkill=true;firstCast=window.__STORYWORLD_CAMPAIGN_R63R1__.cast(true);
     }
     return{zone,enemies:room.enemies.length,props:room.props.length,effects:effects.length,firstCast,ego:player.ego,renderer:window.__STORYWORLD_PHASE1__?.inspect?.().active};
    },scenario);
    assert.equal(setup.renderer,'three');if(scenario==='ego-stress')assert.equal(setup.firstCast,true,'EGO fixture must execute the genuine skill');
    await page.waitForTimeout(2000);
    const rendererBefore=await rendererState(page);
    await page.evaluate(()=>{
     window.__r67Perf={draw:[],tick:[],longTasks:[],peakEffects:0,peakProjectiles:0};
     for(const name of ['draw','tick'])window.eval(name+'=('+function(key,base){return function(...args){const t=performance.now();try{return base.apply(this,args);}finally{const p=window.__r67Perf;p[key].push(performance.now()-t);if(key==='draw'){p.peakEffects=Math.max(p.peakEffects,effects.length);p.peakProjectiles=Math.max(p.peakProjectiles,projectiles.length);}}};}.toString()+')('+JSON.stringify(name)+','+name+')');
     if(PerformanceObserver.supportedEntryTypes.includes('longtask')){window.__r67Observer=new PerformanceObserver(list=>window.__r67Perf.longTasks.push(...list.getEntries().map(e=>e.duration)));window.__r67Observer.observe({type:'longtask'});}
    });
    let done=false;const sample=page.evaluate(ms=>new Promise(resolve=>{let first=null,last=null,startDraws=0,startUploads=0;const frames=[];function next(t){if(first===null){first=t;startDraws=window.__r67GL.drawCalls;startUploads=window.__r67GL.uploadCalls;}if(last!==null)frames.push(t-last);last=t;if(t-first>=ms){const p=window.__r67Perf;window.__r67Observer?.disconnect();resolve({elapsedMs:t-first,frames,draw:p.draw,tick:p.tick,longTasks:p.longTasks,peakEffects:p.peakEffects,peakProjectiles:p.peakProjectiles,glDrawCalls:window.__r67GL.drawCalls-startDraws,glUploads:window.__r67GL.uploadCalls-startUploads,devices:window.__r67GL.devices,threadHits:window.__r67ThreadHits,gameTime:time,objects:{enemies:room.enemies.length,props:room.props.length,effects:effects.length,projectiles:projectiles.length}});}else requestAnimationFrame(next);}requestAnimationFrame(next);}),duration).finally(()=>{done=true;});
    const movement=(async()=>{if(scenario!=='movement')return;let i=0;while(!done){const key=['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'][i++%4];await page.keyboard.down(key);await page.waitForTimeout(550);await page.keyboard.up(key);if(!done)await page.waitForTimeout(150);}})();
    const [raw]=await Promise.all([sample,movement]),rendererAfter=await rendererState(page);
    const threePathMeasured=rendererBefore.active==='three'&&rendererAfter.active==='three'&&raw.glDrawCalls>0;
    const row={scenario,kind,index,setup,rendererBefore,rendererAfter,threePathMeasured,elapsedMs:raw.elapsedMs,frames:stats(raw.frames),draw:stats(raw.draw),tick:stats(raw.tick),longTasks:stats(raw.longTasks),glDrawCalls:raw.glDrawCalls,glDrawCallsPerObservedFrame:raw.glDrawCalls/raw.frames.length,glUploads:raw.glUploads,peakEffects:raw.peakEffects,peakProjectiles:raw.peakProjectiles,threadHits:raw.threadHits,gameTime:raw.gameTime,devices:raw.devices,objects:raw.objects,errors};
    result.runs.push(row);await save();console.log('R67_PERF_RUN',JSON.stringify(row));
    assert.ok(raw.frames.length>=10,'Frame loop must continue');assert.ok(raw.draw.length>=10,'Actual game drawing must continue');assert.deepEqual(errors,[]);
    if(scenario==='movement'||kind==='candidate'){
     assert.equal(threePathMeasured,true,'R67 must retain the intended Three.js renderer: '+JSON.stringify(rendererAfter));
     assert.equal(rendererAfter.failed,false);
    }else{
     assert.equal(rendererBefore.active,'legacy');assert.equal(rendererAfter.active,'legacy');
     assert.match(rendererBefore.reason,/ctx\.bezierCurveTo is not a function/);assert.match(rendererAfter.reason,/ctx\.bezierCurveTo is not a function/);
    }
    if(scenario==='ego-stress')assert.ok(raw.threadHits>0,'Real thread-dance hit path must execute');
    if(index<2)await page.screenshot({path:out+'/'+scenario+'-'+kind+'.png'});
   }finally{await context.close();}
  }
 }
 const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
 result.comparisons=['movement','ego-stress'].map(scenario=>{
  const a=result.runs.filter(r=>r.scenario===scenario&&r.kind==='baseline'),b=result.runs.filter(r=>r.scenario===scenario&&r.kind==='candidate');
  const modes=rows=>[...new Set(rows.map(r=>JSON.stringify({active:r.rendererAfter.active,reason:r.rendererAfter.active==='legacy'?r.rendererAfter.reason:null})))].sort();
  const eligibleForThreeComparison=[...a,...b].every(r=>r.threePathMeasured);
  const values=rows=>({frameMeanMs:mean(rows.map(r=>r.frames.meanMs)),p50Ms:mean(rows.map(r=>r.frames.p50Ms)),p95Ms:mean(rows.map(r=>r.frames.p95Ms)),glDrawCallsPerObservedFrame:mean(rows.map(r=>r.glDrawCallsPerObservedFrame)),drawP95Ms:mean(rows.map(r=>r.draw.p95Ms))});
  const before=values(a),after=values(b);
  return{scenario,trialsPerBuild:a.length,eligibleForThreeComparison,baselineRendererModes:modes(a),candidateRendererModes:modes(b),baseline:before,candidate:after,meanFrameReductionFraction:eligibleForThreeComparison?1-after.frameMeanMs/before.frameMeanMs:null,note:eligibleForThreeComparison?'Same Three renderer; limited live-scene software measurement.':'R66 falls back at its missing cubic method; R67 remains Three.js. Different renderer paths and simulation progress: report raw timings, NEVER a same-renderer percentage gain.'};
 });
 result.status='completed';await save();console.log('R67_PERF_COMPARISON',JSON.stringify(result.comparisons));
}catch(e){result.status='failed';result.error=e.stack||String(e);await save();throw e;}finally{await browser.close();}
