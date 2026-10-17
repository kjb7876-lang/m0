import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const URL = process.env.STORYWORLD_URL || 'http://127.0.0.1:4375/';
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1365, height: 850 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
try {
  await page.goto(URL, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForTimeout(500);
  await page.locator('#campaignNew54').click();
  await page.waitForFunction(() => window.eval('started&&!loading'), null, { timeout: 30_000 });
  const entryResult = await page.evaluate(async () => await window.eval("enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}})"));
  try { await page.waitForFunction(() => window.eval("zone==='dist00'&&!loading&&!modal"), null, { timeout: 30_000 }); } catch (error) { const state = await page.evaluate(() => ({ entryResult: window.__qaEntryResult, zone, layer, loading, modal, started, logs: window.__STORYWORLD_CAMPAIGN_R63R1__?.inspect?.(), pageErrors: [] })); throw new Error('profile entry failed; result='+JSON.stringify(entryResult)+' state='+JSON.stringify(state)+' '+error.message); }
  const setup = await page.evaluate(() => {
    room.engaged = true;
    return {
      zone, layer, tier: window.__STORYWORLD_CAMPAIGN_R63R1__.inspect().tier,
      enemyCount: room.enemies.length,
      enemies: room.enemies.slice(0, 6).map(e => ({ id: e.id, hp: e.hp, maxHp: e.maxHp, baseHp: e.difficultyBaseHpR63, factor: e.difficultyFactorR63 })),
      player: { x: player.x, y: player.y, hp: player.hp },
      canvas: [...document.querySelectorAll('canvas')].map(c => ({ id: c.id, width: c.width, height: c.height, cssWidth: c.clientWidth, cssHeight: c.clientHeight }))
    };
  });
  await page.waitForTimeout(2500);
  const outDir = path.dirname(fileURLToPath(import.meta.url));
  await page.screenshot({ path: path.join(outDir, 'profile-final-scene.png') });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('Profiler.enable');
  const initialPerf = await cdp.send('Performance.getMetrics');
  const initialMetrics = Object.fromEntries(initialPerf.metrics.map(x => [x.name, x.value]));
  await cdp.send('Profiler.start', { samplingInterval: 1000 });
  const samples = await page.evaluate(duration => new Promise(resolve => {
    const deltas = []; let previous = null, first = null;
    const frame = now => {
      if (first === null) first = now;
      if (previous !== null) deltas.push(now - previous);
      previous = now;
      if (now - first >= duration) resolve({ elapsedMs: now - first, frameDeltasMs: deltas });
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }), 60_000);
  const perf = await cdp.send('Performance.getMetrics');
  const profile = await cdp.send('Profiler.stop');
  const byId = new Map(profile.profile.nodes.map(n => [n.id, n]));
  const selfMs = new Map();
  for (let i = 0; i < (profile.profile.samples || []).length; i++) {
    const id = profile.profile.samples[i], delta = (profile.profile.timeDeltas?.[i] || 0) / 1000;
    selfMs.set(id, (selfMs.get(id) || 0) + delta);
  }
  const metrics = Object.fromEntries(perf.metrics.map(x => [x.name, x.value]));
  const sorted = [...selfMs].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([id, ms]) => {
    const c = byId.get(id)?.callFrame || {};
    return { name: c.functionName || '(anonymous)', url: c.url || '', line: c.lineNumber ?? -1, sampledSelfMs: ms };
  });
  const frames = samples.frameDeltasMs.sort((a, b) => a - b);
  const percentile = p => frames[Math.min(frames.length - 1, Math.floor((frames.length - 1) * p))] || 0;
  const browserInfo = await browser.version();
  const result = {
    label: 'r64-final-candidate',
    browser: `${browserInfo} headless in execution container; software/emulated renderer, not physical device or GPU test`,
    scenario: 'Fresh browser profile; New Game; dist00 STORY; player at (15,19); six region enemies; room.engaged=true; 2.5s warmup; 60s RAF+CDP sample interval',
    url: URL, setup, profileMs: samples.elapsedMs, frames: {
      count: frames.length,
      meanMs: frames.reduce((a, b) => a + b, 0) / Math.max(1, frames.length),
      p50Ms: percentile(.5), p95Ms: percentile(.95), p99Ms: percentile(.99),
      fps: 1000 / (frames.reduce((a, b) => a + b, 0) / Math.max(1, frames.length)),
      jsHeap: { usedBytes: metrics.JSHeapUsedSize, totalBytes: metrics.JSHeapTotalSize, limitBytes: metrics.JSHeapTotalSizeLimit },
      dom: { nodes: metrics.Nodes, documents: metrics.Documents, layoutCount: metrics.LayoutCount, recalcStyleCount: metrics.RecalcStyleCount },
    },
    performance: {
      scriptDurationMs: metrics.ScriptDuration * 1000,
      taskDurationMs: metrics.TaskDuration * 1000,
      layoutCount: metrics.LayoutCount,
      recalcStyleCount: metrics.RecalcStyleCount,
      jsHeapUsedStartBytes: initialMetrics.JSHeapUsedSize,
      jsHeapUsedEndBytes: metrics.JSHeapUsedSize,
      domNodes: metrics.Nodes,
      documents: metrics.Documents,
    },
    topCpuFunctions: sorted,
    pageErrors: errors,
  };
  await fs.writeFile(path.join(outDir, 'profile-final.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
  await cdp.detach();
} finally {
  await browser.close();
}
