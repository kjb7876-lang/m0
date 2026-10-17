import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const urls = {
  baseline: process.env.BASELINE_URL || 'http://127.0.0.1:4377/',
  candidate: process.env.CANDIDATE_URL || 'http://127.0.0.1:4376/',
};
const order = ['baseline','candidate','candidate','baseline','baseline','candidate'];
const measureMs = Number(process.env.PROFILE_MS || 20_000);
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const runs=[];
const percentile=(sorted,p)=>sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))]||0;

try {
  for (let index=0; index<order.length; index++) {
    const label=order[index],context=await browser.newContext({viewport:{width:1365,height:850},deviceScaleFactor:1});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(urls[label],{waitUntil:'load',timeout:60_000});
    await page.waitForTimeout(500);
    await page.locator('#campaignNew54').click();
    await page.waitForFunction(()=>window.eval('started&&!loading'),null,{timeout:30_000});
    const entry=await page.evaluate(()=>window.eval("enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}})"));
    if(entry!==true)throw Error(label+' run '+index+': failed to enter the profile scene');
    await page.waitForFunction(()=>window.eval("zone==='dist00'&&!loading&&!modal"),null,{timeout:30_000});
    const setup=await page.evaluate(()=>{room.engaged=true;return{zone,layer,tier:window.__STORYWORLD_CAMPAIGN_R63R1__?.inspect?.().tier,enemyCount:room.enemies.length,player:{x:player.x,y:player.y},canvas:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height,cssWidth:c.clientWidth,cssHeight:c.clientHeight}))};});
    await page.waitForTimeout(2500);
    const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('Profiler.enable');
    const first=await cdp.send('Performance.getMetrics'),start=Object.fromEntries(first.metrics.map(x=>[x.name,x.value]));
    await cdp.send('Profiler.start',{samplingInterval:1000});
    const frameSample=await page.evaluate(duration=>new Promise(resolve=>{const xs=[];let previous=null,first=null;const frame=now=>{if(first===null)first=now;if(previous!==null)xs.push(now-previous);previous=now;if(now-first>=duration)resolve({elapsedMs:now-first,deltas:xs});else requestAnimationFrame(frame);};requestAnimationFrame(frame);}),measureMs);
    const final=await cdp.send('Performance.getMetrics'),profile=await cdp.send('Profiler.stop'),end=Object.fromEntries(final.metrics.map(x=>[x.name,x.value]));
    const nodes=new Map(profile.profile.nodes.map(n=>[n.id,n])),self=new Map();
    for(let i=0;i<(profile.profile.samples||[]).length;i++){const id=profile.profile.samples[i],us=(profile.profile.timeDeltas?.[i]||0)/1000;self.set(id,(self.get(id)||0)+us);}
    const cpu=[...self].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([id,ms])=>{const frame=nodes.get(id)?.callFrame||{};return{name:frame.functionName||'(anonymous)',line:frame.lineNumber??-1,sampledSelfMs:ms};});
    const sorted=frameSample.deltas.slice().sort((a,b)=>a-b),mean=sorted.reduce((a,b)=>a+b,0)/Math.max(1,sorted.length);
    runs.push({index,label,url:urls[label],scenario:'fresh browser context; New Game; dist00 STORY; player at (15,19); room.engaged=true; six map enemies; 2.5s warmup; paired RAF/CDP sample',profileMs:frameSample.elapsedMs,setup,frames:{count:sorted.length,meanMs:mean,p50Ms:percentile(sorted,.5),p95Ms:percentile(sorted,.95),p99Ms:percentile(sorted,.99),fps:1000/mean},metrics:{scriptDurationDeltaMs:(end.ScriptDuration-start.ScriptDuration)*1000,taskDurationDeltaMs:(end.TaskDuration-start.TaskDuration)*1000,layoutCountDelta:end.LayoutCount-start.LayoutCount,recalcStyleCountDelta:end.RecalcStyleCount-start.RecalcStyleCount,jsHeapStartBytes:start.JSHeapUsedSize,jsHeapEndBytes:end.JSHeapUsedSize,jsHeapDeltaBytes:end.JSHeapUsedSize-start.JSHeapUsedSize,domNodes:end.Nodes},topCpuFunctions:cpu,pageErrors:errors});
    await cdp.detach();await context.close();
  }
  const groups=Object.fromEntries(['baseline','candidate'].map(label=>{const rows=runs.filter(r=>r.label===label),avg=read=>rows.reduce((n,r)=>n+read(r),0)/rows.length;return[label,{runs:rows.length,meanFrameMs:avg(r=>r.frames.meanMs),meanP50Ms:avg(r=>r.frames.p50Ms),meanP95Ms:avg(r=>r.frames.p95Ms),meanFps:avg(r=>r.frames.fps),meanScriptDurationMs:avg(r=>r.metrics.scriptDurationDeltaMs),meanTaskDurationMs:avg(r=>r.metrics.taskDurationDeltaMs),meanLayoutCount:avg(r=>r.metrics.layoutCountDelta),meanHeapDeltaBytes:avg(r=>r.metrics.jsHeapDeltaBytes)}];}));
  const pairs=[{baseline:runs[0],candidate:runs[1]},{baseline:runs[3],candidate:runs[2]},{baseline:runs[4],candidate:runs[5]}].map((p,i)=>({pair:i+1,baselineRun:p.baseline.index,candidateRun:p.candidate.index,frameDeltaMs:p.candidate.frames.meanMs-p.baseline.frames.meanMs,p50DeltaMs:p.candidate.frames.p50Ms-p.baseline.frames.p50Ms,p95DeltaMs:p.candidate.frames.p95Ms-p.baseline.frames.p95Ms,scriptDeltaMs:p.candidate.metrics.scriptDurationDeltaMs-p.baseline.metrics.scriptDurationDeltaMs,layoutDelta:p.candidate.metrics.layoutCountDelta-p.baseline.metrics.layoutCountDelta,heapDeltaBytes:p.candidate.metrics.jsHeapDeltaBytes-p.baseline.metrics.jsHeapDeltaBytes}));
  const result={browser:`Chromium ${await browser.version()} headless in execution container; software/emulated renderer, not physical device/GPU`,sourceDates:{base:'origin/main 03675216dc8deae223e7e9f1ba798942d197f048',candidate:'work/storyworld-r64-reward-aura-ui'},measurement:{warmupMs:2500,measuredMsPerRun:measureMs,order,renderer:'software/emulated only; no physical GPU/device claim'},groups,pairs,runs};
  const out=path.join(path.dirname(fileURLToPath(import.meta.url)),'profile-crossover.json');await fs.writeFile(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
} finally { await browser.close(); }
