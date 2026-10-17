import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const urls = {
  baseline: process.env.BASELINE_URL || 'http://127.0.0.1:4385/',
  candidate: process.env.CANDIDATE_URL || 'http://127.0.0.1:4386/',
};
const mode = process.env.PROFILE_STAGE || 'baseline';
const order = mode === 'baseline'
  ? ['baseline', 'baseline', 'baseline']
  : ['baseline', 'candidate', 'candidate', 'baseline', 'baseline', 'candidate'];
const measureMs = Number(process.env.PROFILE_MS || 15_000);
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const runs = [];
const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] || 0;

async function sceneState(page) {
  return page.evaluate(() => window.eval(`(() => {
    const renderer = window.__STORYWORLD_PHASE1__?.inspect?.() || null;
    const visuals = window.__STORYWORLD_PHASE1__?.captureVisual?.() || [];
    const enemies = room.enemies.map(e => ({ id:e.id, x:e.x, y:e.y, hp:e.hp, maxHp:e.maxHp }));
    const effectsNow = effects.map(e => ({ type:e.type, x:e.x, y:e.y, size:e.size, asset:e.asset }));
    return {
      zone, layer, player:{x:player.x,y:player.y,hero:player.hero}, tier:room.difficultyR63,
      enemies, effectCount:effects.length, effects:effectsNow,
      room:{engaged:room.engaged,cleared:room.cleared},
      settings:{lowFx:settings.lowFx,reducedMotion:settings.reducedMotion},
      canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height,cssWidth:c.clientWidth,cssHeight:c.clientHeight})),
      renderer, visualCommandCount:visuals.length
    };
  })()`));
}

try {
  for (let index = 0; index < order.length; index++) {
    const label = order[index];
    const context = await browser.newContext({ viewport:{width:1365,height:850}, deviceScaleFactor:1 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(urls[label], { waitUntil:'load', timeout:60_000 });
    await page.waitForTimeout(500);
    await page.locator('#campaignNew54').click();
    await page.waitForFunction(() => window.eval('started&&!loading'), null, { timeout:30_000 });
    const entered = await page.evaluate(() => window.eval("enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}})"));
    if (entered !== true) throw new Error(`${label} run ${index}: failed to enter dist00`);
    await page.waitForFunction(() => window.eval("zone==='dist00'&&!loading&&!modal"), null, { timeout:30_000 });
    const setup = await page.evaluate(() => window.eval(`(() => {
      room.engaged = true;
      player.x = 15; player.y = 19; player.moving = false;
      command = null; target = null; route = [];
      effects.length = 0;
      for (let i=0;i<6;i++) fx('burst',14+i*.35,19+(i%2)*.25,{asset:VFX.burst,size:.7+i*.05,life:1000000,age:0});
      modal = true;
      const panel = document.getElementById('modal'); if (panel) panel.style.display = 'none';
      return {zone,layer,enemyCount:room.enemies.length,player:{x:player.x,y:player.y},effectCount:effects.length,quality:{lowFx:settings.lowFx,reducedMotion:settings.reducedMotion}};
    })()`));
    if (setup.zone !== 'dist00' || setup.enemyCount !== 6 || setup.effectCount !== 6) throw new Error(`${label} run ${index}: controlled scene counts mismatch: ${JSON.stringify(setup)}`);
    await page.waitForTimeout(2500);
    const beforeScene = await sceneState(page);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    await cdp.send('Profiler.enable');
    const startMetrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name,m.value]));
    await cdp.send('Profiler.start', { samplingInterval:1000 });
    const frameSample = await page.evaluate(duration => new Promise(resolve => {
      const intervals=[]; let previous=null, first=null;
      const sample=now=>{if(first===null)first=now;if(previous!==null)intervals.push(now-previous);previous=now;if(now-first>=duration)resolve({elapsedMs:now-first,intervals});else requestAnimationFrame(sample);};
      requestAnimationFrame(sample);
    }), measureMs);
    const endMetrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name,m.value]));
    const profile = await cdp.send('Profiler.stop');
    const afterScene = await sceneState(page);
    const fingerprint = scene => JSON.stringify({zone:scene.zone,layer:scene.layer,player:scene.player,enemies:scene.enemies,effectCount:scene.effectCount,effects:scene.effects,room:scene.room,settings:scene.settings,canvases:scene.canvases});
    if (fingerprint(beforeScene) !== fingerprint(afterScene)) throw new Error(`${label} run ${index}: scene drifted during the sample`);
    const nodes = new Map(profile.profile.nodes.map(n => [n.id,n]));
    const self = new Map();
    for (let i=0;i<(profile.profile.samples||[]).length;i++) {
      const id=profile.profile.samples[i], ms=(profile.profile.timeDeltas?.[i]||0)/1000;
      self.set(id,(self.get(id)||0)+ms);
    }
    const topCpuFunctions=[...self].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([id,ms])=>{
      const frame=nodes.get(id)?.callFrame||{};
      return {name:frame.functionName||'(anonymous)',url:frame.url||'',line:frame.lineNumber??-1,sampledSelfMs:ms};
    });
    const sorted=frameSample.intervals.slice().sort((a,b)=>a-b);
    const mean=sorted.reduce((sum,value)=>sum+value,0)/Math.max(1,sorted.length);
    runs.push({
      index,label,url:urls[label],
      scenario:'fresh browser context; New Game; dist00 STORY normal; player (15,19); six static enemies; six persistent fixed burst effects; modal pauses simulation while renderer continues; 2.5s warmup',
      profileMs:frameSample.elapsedMs,
      setup:{...setup,scene:beforeScene},
      finalScene:afterScene,
      frame:{count:sorted.length,meanMs:mean,p50Ms:percentile(sorted,.5),p95Ms:percentile(sorted,.95),p99Ms:percentile(sorted,.99),fps:1000/mean},
      metrics:{scriptDurationDeltaMs:(endMetrics.ScriptDuration-startMetrics.ScriptDuration)*1000,taskDurationDeltaMs:(endMetrics.TaskDuration-startMetrics.TaskDuration)*1000,layoutCountDelta:endMetrics.LayoutCount-startMetrics.LayoutCount,recalcStyleCountDelta:endMetrics.RecalcStyleCount-startMetrics.RecalcStyleCount,heapStartBytes:startMetrics.JSHeapUsedSize,heapEndBytes:endMetrics.JSHeapUsedSize,heapDeltaBytes:endMetrics.JSHeapUsedSize-startMetrics.JSHeapUsedSize,domNodes:endMetrics.Nodes},
      topCpuFunctions,pageErrors:errors
    });
    await cdp.detach();
    await context.close();
  }
  const result={
    browser:`Chromium ${await browser.version()} headless; execution-container software renderer; GPU and physical device unverified`,
    source:{baseline:'GitHub Pages workflow success for b7890eaee8a13a624cf07e278116731da07938d5',candidate:mode==='baseline'?null:'local Stage 2 candidate'},
    measurement:{mode,order,warmupMs:2500,measuredMsPerRun:measureMs,viewport:{width:1365,height:850,dpr:1},renderer:'software/emulated; not physical GPU',sceneFrozen:true,enemyCount:6,effectCount:6},
    runs
  };
  const out=path.join(path.dirname(fileURLToPath(import.meta.url)),`profile-stage2-${mode}.json`);
  await fs.writeFile(out,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
} finally { await browser.close(); }
