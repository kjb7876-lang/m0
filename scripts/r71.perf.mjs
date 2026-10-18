import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const require=createRequire(import.meta.url);
let chromium;
try{chromium=require('playwright').chromium;}catch{chromium=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright').chromium;}

const site=process.env.STORYWORLD_URL||'http://127.0.0.1:4491/';
const out='out/r71',duration=Number(process.env.R71_PERF_DURATION_MS)||30000;
const profileMs=Number(process.env.R71_CPU_PROFILE_MS)||15000;
const baselineOnly=process.env.R71_PERF_BASELINE_ONLY==='1';
const R70_COMMIT='34338945dc47f5bcb8c2ce05b2d7de62d72c7ad5';
const R70_HTML_SHA256='76791c87cf6b3f70d99f35aafc7dacaf3adb389f4be10081c024f8802a9aa5f5';
const R70_RENDERER_SHA256='b87e0feb34c321d19e557b7d08e63b9f0744f1e28b9e7d6e2ee7ea9ca0a6ebf4';
await fs.mkdir(out,{recursive:true});

async function readBuild(dir){
 const html=await fs.readFile(`${dir}/index.html`,'utf8'),js=await fs.readFile(`${dir}/dist/phase1.js`,'utf8');
 return{html,js,htmlSHA256:createHash('sha256').update(html).digest('hex'),rendererSHA256:createHash('sha256').update(js).digest('hex')};
}
const baseline=await readBuild('_r70/docs');
const candidate=baselineOnly?baseline:await readBuild('_pages/docs');
assert.equal(baseline.htmlSHA256,R70_HTML_SHA256,'R70 baseline HTML hash mismatch');
assert.equal(baseline.rendererSHA256,R70_RENDERER_SHA256,'R70 baseline renderer hash mismatch');
const order=baselineOnly?['baseline','baseline']:['baseline','candidate','candidate','baseline'];
const result={
 revision:'R71 matched renderer profiling',stage:baselineOnly?'baseline-only':'baseline-vs-candidate',
 baselineCommit:R70_COMMIT,harnessCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 baseline:{htmlSHA256:baseline.htmlSHA256,rendererSHA256:baseline.rendererSHA256},
 candidate:baselineOnly?null:{htmlSHA256:candidate.htmlSHA256,rendererSHA256:candidate.rendererSHA256,commit:process.env.GITHUB_SHA||'working-tree'},
 browser:null,physicalGPU:false,physicalMobile:false,sandbox:true,durationMs:duration,
 profileDurationMs:baselineOnly?profileMs:null,profileMode:'CDP Profiler CPU sampling; profiling runs after timing trials and is not included in timing results',
 viewport:{width:1365,height:850,deviceScaleFactor:1},seed:70018,
 scenarios:['movement','ego-stress'],order,runs:[],profiles:[],status:'starting',
 caveat:'Headless Chromium software-renderer results are not physical-GPU or mobile-device results. Scenarios share map, seed, viewport, DPR, renderer, effects and initialization; simulation is live, so later frames are not a deterministic replay.'
};
const reportPath=baselineOnly?`${out}/baseline-performance.json`:`${out}/performance.json`;
const save=()=>fs.writeFile(reportPath,JSON.stringify(result,null,2)+'\n');
const stats=v=>{const s=v.slice().sort((a,b)=>a-b),at=p=>s[Math.floor((s.length-1)*p)]??null;return{count:s.length,p50Ms:at(.5),p95Ms:at(.95),p99Ms:at(.99),meanMs:s.length?s.reduce((a,b)=>a+b,0)/s.length:null,maxMs:s.at(-1)??null,over50ms:s.filter(x=>x>50).length};};
function commandDelta(before,after){
 const keys=['created','removed','styleReplacements','geometryUpdates','imageBufferReuseR70','unchangedUVUploadsSkippedR70','solidPaintReuseR70','imagePaintReuseR70'];
 return Object.fromEntries(keys.map(k=>[k,(after?.[k]||0)-(before?.[k]||0)]));
}
function sanitizeURL(value){return String(value||'').replace(/\?.*$/,'').replace(/#.*$/,'');}
function summarizeProfile(profile){
 const nodes=new Map((profile.nodes||[]).map(n=>[n.id,n]));
 const rows=new Map();
 for(let i=0;i<(profile.samples||[]).length;i++){
  const node=nodes.get(profile.samples[i]);if(!node)continue;
  const f=node.callFrame||{},key=[f.functionName||'(anonymous)',f.url||'',f.lineNumber??-1,f.columnNumber??-1].join('|');
  const row=rows.get(key)||{functionName:f.functionName||'(anonymous)',sourceURL:sanitizeURL(f.url),line:f.lineNumber==null?null:f.lineNumber+1,column:f.columnNumber==null?null:f.columnNumber+1,selfSampleMicros:0,samples:0};
  row.selfSampleMicros+=(profile.timeDeltas||[])[i]||0;row.samples++;rows.set(key,row);
 }
 const top=[...rows.values()].sort((a,b)=>b.selfSampleMicros-a.selfSampleMicros).slice(0,35);
 const total=top.reduce((n,x)=>n+x.selfSampleMicros,0);
 return{sampleCount:(profile.samples||[]).length,profileDurationMs:(profile.endTime-profile.startTime)/1000,topFunctions:top.map(x=>({...x,selfSampleMs:x.selfSampleMicros/1000,shareOfTopSamples:total?x.selfSampleMicros/total:null}))};
}
async function captureCpuProfile(context,page,scenario){
 const cdp=await context.newCDPSession(page);
 try{
  await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
  let profileDone=false,heldKey=null;
  const moving=(async()=>{if(scenario!=='movement')return;let n=0;try{while(!profileDone){const key=['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'][n++%4];heldKey=key;await page.keyboard.down(key);await page.waitForTimeout(550);await page.keyboard.up(key);heldKey=null;if(!profileDone)await page.waitForTimeout(150);}}finally{if(heldKey){await page.keyboard.up(heldKey).catch(()=>{});heldKey=null;}}})();
  await page.waitForTimeout(profileMs);profileDone=true;await moving;
  const{profile}=await cdp.send('Profiler.stop');
  const rawPath=`${out}/${scenario}-r70.cpuprofile.json`;
  await fs.writeFile(rawPath,JSON.stringify(profile));
  const summary={scenario,durationMs:profileMs,rawProfile:rawPath,...summarizeProfile(profile)};
  result.profiles.push(summary);await save();console.log('R71_CPU_PROFILE',JSON.stringify(summary));
 }finally{await cdp.detach().catch(()=>{});}
}

let browser=null;
try{
 browser=await chromium.launch({headless:true,chromiumSandbox:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--disable-dev-shm-usage']});
 result.browser=await browser.version();result.status='running';await save();
 for(const scenario of result.scenarios){
  for(const[index,kind]of order.entries()){
   const build=kind==='candidate'?candidate:baseline;
   const context=await browser.newContext({viewport:{width:1365,height:850},deviceScaleFactor:1});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{let seed=70018;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};window.__r71GL={draws:0,uploads:0,buffers:0,devices:[]};const original=HTMLCanvasElement.prototype.getContext,seen=new WeakSet();HTMLCanvasElement.prototype.getContext=function(...args){const gl=original.apply(this,args);if(gl&&String(args[0]).startsWith('webgl')&&!seen.has(gl)){seen.add(gl);for(const[name,counter]of [['drawArrays','draws'],['drawElements','draws'],['drawArraysInstanced','draws'],['drawElementsInstanced','draws'],['texImage2D','uploads'],['texSubImage2D','uploads'],['bufferData','buffers'],['bufferSubData','buffers']])if(typeof gl[name]==='function'){const fn=gl[name];gl[name]=function(...v){window.__r71GL[counter]++;return fn.apply(this,v)}}const ext=gl.getExtension('WEBGL_debug_renderer_info');window.__r71GL.devices.push(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER))}return gl}});
   await page.route(site,r=>r.fulfill({contentType:'text/html; charset=utf-8',body:build.html}));
   await page.route('**/dist/phase1.js*',r=>r.fulfill({contentType:'text/javascript',body:build.js}));
   try{
    await page.goto(site,{waitUntil:'load',timeout:60000});
    await page.locator('#campaignNew54').click({timeout:60000});
    await page.waitForFunction(()=>{const s=window.__STORYWORLD_STORY_PROFILE_R54__?.inspect?.();return s?.busy===false&&s.stage==='playing'&&!s.error&&window.eval('started&&booted&&!loading')},null,{timeout:60000});
    assert.equal(await page.evaluate(()=>{auto=false;settings.autoSkill=false;settings.sound=false;settings.music=false;return enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}})}),true);
    await page.waitForFunction(()=>window.eval("zone==='dist00'&&!loading&&!modal"),null,{timeout:30000});
    const setup=await page.evaluate(scenario=>{
     auto=false;settings.autoSkill=false;settings.lowFx=false;settings.reducedMotion=false;settings.sound=false;settings.music=false;room.engaged=true;player.hp=maxHP()*100;player.ego=0;command=null;target=null;route=[];window.__STORYWORLD_PRESENTATION_R58__?.setFlashlight(true);window.__r71Hits=0;window.__r71Motifs=new Set();const hit=hitEnemy;hitEnemy=function(e,value,s){if(s?.ability==='threadDanceR63')window.__r71Hits++;return hit.apply(this,arguments)};const de=drawEffect;drawEffect=function(e,...a){if(e?.threadR63)window.__r71Motifs.add(e.threadR63.motif);return de.call(this,e,...a)};let cast=null;
     if(scenario==='ego-stress'){player.points+=200;const prog=window.__STORYWORLD_PROGRESSION_R62__;for(const id of ['threadDanceR63','threadCrossR64','threadFlowerR64','threadFractalR64','threadClawR64','threadTsubameR64','threadIchidanR64'])prog.purchase(id,player);prog.state(player).ranks.threadDanceR63=4;player.ego=1000;room.enemies.forEach((e,i)=>{e.x=player.x+2+(i%3)*.6;e.y=player.y+(Math.floor(i/3)-.5)*1.1;e.hp=e.maxHp=1e8;e.difficultyBaseHpR63=1e8/(e.difficultyFactorR63||1);e.spawnState='active';e.deadRecorded=false});cast=window.__STORYWORLD_CAMPAIGN_R63R1__.cast(true);auto=true;settings.autoSkill=true}
     return{zone,enemies:room.enemies.length,props:room.props.length,ego:player.ego,cast,renderer:window.__STORYWORLD_PHASE1__.inspect().active};
    },scenario);
    assert.equal(setup.renderer,'three');
    if(scenario==='ego-stress'){assert.equal(setup.cast,true);await page.waitForFunction(()=>window.__r71Motifs.size===6,null,{timeout:120000});}
    await page.waitForTimeout(2000);
    const before=await page.evaluate(()=>{
     window.__r71Samples={draw:[],tick:[],long:[],maxEffects:0,maxProjectiles:0};const nd=draw,nt=tick;
     draw=function(...a){const start=performance.now();try{return nd.apply(this,a)}finally{window.__r71Samples.draw.push(performance.now()-start);window.__r71Samples.maxEffects=Math.max(window.__r71Samples.maxEffects,effects.length);window.__r71Samples.maxProjectiles=Math.max(window.__r71Samples.maxProjectiles,projectiles.length)}};
     tick=function(...a){const start=performance.now();try{return nt.apply(this,a)}finally{window.__r71Samples.tick.push(performance.now()-start)}};
     if(PerformanceObserver.supportedEntryTypes.includes('longtask')){window.__r71Obs=new PerformanceObserver(list=>window.__r71Samples.long.push(...list.getEntries().map(e=>e.duration)));window.__r71Obs.observe({type:'longtask'});}
     const r=window.__STORYWORLD_PHASE1__.inspect();return{active:r.active,reason:r.reason,counters:r.commandScene,time,gl:{...window.__r71GL},metrics:r.metrics,spatial:r.spatial,memory:performance.memory?{usedJSHeapSize:performance.memory.usedJSHeapSize,totalJSHeapSize:performance.memory.totalJSHeapSize}:null};
    });
    assert.equal(before.active,'three');
    let done=false;
    const measure=page.evaluate(ms=>new Promise(resolve=>{let start=null,last=null;const rows=[];function frame(t){if(start===null)start=t;if(last!==null)rows.push(t-last);last=t;if(t-start>=ms){window.__r71Obs?.disconnect();const r=window.__STORYWORLD_PHASE1__.inspect();resolve({frames:rows,...window.__r71Samples,elapsedMs:t-start,time,gl:{...window.__r71GL},renderer:{active:r.active,reason:r.reason,counters:r.commandScene,metrics:r.metrics,spatial:r.spatial},hits:window.__r71Hits,motifs:[...window.__r71Motifs],objects:{enemies:room.enemies.length,props:room.props.length,effects:effects.length,projectiles:projectiles.length},memory:performance.memory?{usedJSHeapSize:performance.memory.usedJSHeapSize,totalJSHeapSize:performance.memory.totalJSHeapSize}:null});}else requestAnimationFrame(frame)}requestAnimationFrame(frame)}),duration).finally(()=>{done=true;});
    const moving=(async()=>{if(scenario!=='movement')return;let n=0;while(!done){const key=['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'][n++%4];await page.keyboard.down(key);await page.waitForTimeout(550);await page.keyboard.up(key);if(!done)await page.waitForTimeout(150);}})();
    const[raw]=await Promise.all([measure,moving]);
    assert.equal(raw.renderer.active,'three','Do not count renderer fallback as a Three optimization');assert.deepEqual(errors,[]);assert.ok(raw.frames.length>=10);assert.ok(raw.gl.draws>before.gl.draws);
    if(scenario==='ego-stress'){assert.ok(raw.hits>0);assert.equal(raw.motifs.length,6);}
    const row={scenario,kind,index,setup,activeBefore:before.active,activeAfter:raw.renderer.active,frames:stats(raw.frames),draw:stats(raw.draw),tick:stats(raw.tick),longTasks:stats(raw.long),elapsedMs:raw.elapsedMs,simulationSeconds:raw.time-before.time,hits:raw.hits,motifs:raw.motifs,peakEffects:raw.maxEffects,peakProjectiles:raw.maxProjectiles,objects:raw.objects,memoryBefore:before.memory,memoryAfter:raw.memory,rendererMetricsBefore:before.metrics,rendererMetricsAfter:raw.renderer.metrics,spatialBefore:before.spatial,spatialAfter:raw.renderer.spatial,perFrame:{drawCalls:(raw.gl.draws-before.gl.draws)/raw.frames.length,textureUploads:(raw.gl.uploads-before.gl.uploads)/raw.frames.length,bufferUploads:(raw.gl.buffers-before.gl.buffers)/raw.frames.length},counterDelta:commandDelta(before.counters,raw.renderer.counters),devices:raw.gl.devices,errors};
    result.runs.push(row);await save();console.log('R71_PERF_RUN',JSON.stringify(row));
    if(index===0)await page.screenshot({path:`${out}/${scenario}-${kind}.png`});
    if(baselineOnly&&index===1)await captureCpuProfile(context,page,scenario);
   }finally{await context.close();}
  }
 }
 if(!baselineOnly){
  const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
  result.comparisons=result.scenarios.map(scenario=>{const collect=kind=>{const rows=result.runs.filter(x=>x.scenario===scenario&&x.kind===kind);return{trials:rows.length,meanMs:mean(rows.map(x=>x.frames.meanMs)),p50Ms:mean(rows.map(x=>x.frames.p50Ms)),p95Ms:mean(rows.map(x=>x.frames.p95Ms)),drawP95Ms:mean(rows.map(x=>x.draw.p95Ms)),drawCallsPerFrame:mean(rows.map(x=>x.perFrame.drawCalls)),bufferUploadsPerFrame:mean(rows.map(x=>x.perFrame.bufferUploads)),materialReplacementsPerFrame:mean(rows.map(x=>(x.counterDelta.styleReplacements||0)/x.frames.count))};};const before=collect('baseline'),after=collect('candidate');return{scenario,baseline:before,candidate:after,meanFrameReductionFraction:1-after.meanMs/before.meanMs,p95ReductionFraction:1-after.p95Ms/before.p95Ms,regressionFlag:after.meanMs>before.meanMs*1.10||after.p95Ms>before.p95Ms*1.10};});
 }
 result.status='completed';await save();console.log('R71_PERF_RESULT',JSON.stringify({stage:result.stage,comparisons:result.comparisons||null,profiles:result.profiles.map(p=>({scenario:p.scenario,rawProfile:p.rawProfile,topFunctions:p.topFunctions.slice(0,8)}))}));
}catch(error){
 const message=String(error?.stack||error);result.status=/sandbox|crashpad|SUID/i.test(message)?'blocked':'failed';result.error=message;await save();console.error('R71_PERF_BLOCKER',JSON.stringify({status:result.status,error:message.slice(0,5000)}));throw error;
}finally{if(browser)await browser.close().catch(()=>{});await save();}
