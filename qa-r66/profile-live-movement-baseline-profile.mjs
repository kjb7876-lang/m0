import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const url = process.env.STORYWORLD_URL || 'http://127.0.0.1:4391/';
const measureMs = Number(process.env.PROFILE_MS || 12_000);
const runCount = Number(process.env.PROFILE_RUNS || 4);
const detailedProfile = process.env.PROFILE_DETAIL !== '0';
const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const runs = [];
const percentile = (values, p) => {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
};

try {
  for (let index = 0; index < runCount; index++) {
    const context = await browser.newContext({ viewport: { width: 1365, height: 850 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
    await page.waitForTimeout(400);
    await page.locator('#campaignNew54').click();
    await page.waitForFunction(() => window.eval('started && booted && !loading'), null, { timeout: 60_000 });
    await page.waitForTimeout(800);
    const startZone = await page.evaluate(() => window.eval('zone'));
    const entered = startZone === 'dist00' ? true : await page.evaluate(() => window.eval("enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}})"));
    if (entered !== true) {
      const state = await page.evaluate(() => window.eval(`({started,booted,loading,zone,modal,bootError,warnings: (warnings||[]).slice(-5),errors: (errors||[]).slice(-5)})`));
      throw new Error(`run ${index}: could not enter dist00; ${JSON.stringify(state)}`);
    }
    await page.waitForFunction(() => window.eval("zone==='dist00'&&!loading&&!modal"), null, { timeout: 60_000 });
    const initial = await page.evaluate(() => window.eval(`(() => {
      room.engaged = true;
      player.x = 15; player.y = 19; player.moving = false;
      player.hp = Math.max(player.hp, maxHP() * 100);
      command = null; target = null; route = [];
      projectiles.length = 0; effects.length = 0;
      settings.sound = false; settings.music = false;
      settings.lowFx = false; settings.reducedMotion = false;
      window.__STORYWORLD_PRESENTATION_R58__?.setFlashlight(true);
      return {
        zone, layer, player: { x: player.x, y: player.y, hp: player.hp },
        enemies: room.enemies.length, props: room.props.length,
        flashlight: window.__STORYWORLD_PRESENTATION_R58__?.inspect(),
        renderer: window.__STORYWORLD_PHASE1__?.inspect?.(),
        webglRenderer: (() => {
          const gl = window.__STORYWORLD_PHASE1__?.controller?.state?.three?.renderer?.getContext?.();
          if (!gl) return null;
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        })(),
        viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
        canvas: { width: canvas.width, height: canvas.height },
      };
    })()`));
    await page.waitForTimeout(1_500);
    if (process.env.PERF_SCREENSHOT) {
      await page.evaluate(() => window.eval("modal=true; const panel=document.getElementById('modal'); if(panel) panel.style.display='none';"));
      await page.screenshot({ path: path.resolve(process.env.PERF_SCREENSHOT) });
      await page.evaluate(() => window.eval("modal=false;"));
    }
    if (detailedProfile) await page.evaluate(() => window.eval(`(() => {
      const names = ['tick', 'cameraTick', 'draw', 'updateHUD', 'musicTick'];
      const stats = Object.fromEntries(names.map(name => [name, { calls: 0, totalMs: 0, samples: [] }]));
      window.__SW_PERF_PHASES__ = stats;
      for (const name of names) {
        const original = window.eval(name);
        window.eval(name + ' = (' + function (label, phase) {
          return function (...args) {
            const startedAt = performance.now();
            try { return phase.apply(this, args); }
            finally {
              const row = window.__SW_PERF_PHASES__[label];
              const elapsed = performance.now() - startedAt;
              row.calls++;
              row.totalMs += elapsed;
              if (row.samples.length < 50_000) row.samples.push(elapsed);
            }
          };
        }.toString() + ')(' + JSON.stringify(name) + ',' + name + ')');
      }
      return { instrumented: names };
    })()`));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    if (detailedProfile) {
      await cdp.send('Profiler.enable');
      await cdp.send('HeapProfiler.enable');
    }
    const start = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(row => [row.name, row.value]));
    if (detailedProfile) {
      await cdp.send('Profiler.start', { samplingInterval: 1000 });
      await cdp.send('HeapProfiler.startSampling', { samplingInterval: 1024 });
    }
    const framesPromise = page.evaluate(duration => new Promise(resolve => {
      const times = []; let previous = null, first = null;
      const collect = now => {
        if (first === null) first = now;
        if (previous !== null) times.push(now - previous);
        previous = now;
        if (now - first >= duration) resolve({ elapsedMs: now - first, times });
        else requestAnimationFrame(collect);
      };
      requestAnimationFrame(collect);
    }), measureMs);
    const movementPromise = (async () => {
      const pattern = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
      let step = 0;
      while (step * 900 < measureMs) {
        const key = pattern[step % pattern.length];
        await page.keyboard.down(key);
        await page.waitForTimeout(720);
        await page.keyboard.up(key);
        await page.waitForTimeout(180);
        step++;
      }
      return step;
    })();
    const [frames, movementSteps] = await Promise.all([framesPromise, movementPromise]);
    const end = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(row => [row.name, row.value]));
    const profile = detailedProfile ? await cdp.send('Profiler.stop') : null;
    const heap = detailedProfile ? await cdp.send('HeapProfiler.stopSampling') : null;
    const after = await page.evaluate(() => window.eval(`(() => ({
      zone, layer, player: { x: player.x, y: player.y, hp: player.hp, moving: player.moving },
      camera: { ...cam }, enemyPositions: room.enemies.map(e => [e.id, e.x, e.y, e.hp]),
      effects: effects.length, projectiles: projectiles.length,
      flashlight: window.__STORYWORLD_SIGHT24__?.inspect?.(),
      renderer: window.__STORYWORLD_PHASE1__?.inspect?.(),
      phases: Object.fromEntries(Object.entries(window.__SW_PERF_PHASES__||{}).map(([name,row]) => [name, {
        calls: row.calls, totalMs: row.totalMs,
        meanMs: row.calls ? row.totalMs / row.calls : 0,
        p50Ms: row.samples.length ? [...row.samples].sort((a,b)=>a-b)[Math.floor((row.samples.length-1)*.50)] : null,
        p95Ms: row.samples.length ? [...row.samples].sort((a,b)=>a-b)[Math.floor((row.samples.length-1)*.95)] : null,
        maxMs: row.samples.length ? Math.max(...row.samples) : null,
      }]))
    }))()`));
    const sorted = frames.times.slice().sort((a, b) => a - b);
    const nodes = new Map((profile?.profile.nodes||[]).map(node => [node.id, node]));
    const sampleSelf = new Map();
    for (let i = 0; i < (profile?.profile.samples || []).length; i++) {
      const id = profile.profile.samples[i];
      sampleSelf.set(id, (sampleSelf.get(id) || 0) + (profile.profile.timeDeltas?.[i] || 0) / 1000);
    }
    const topFunctions = [...sampleSelf].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, ms]) => ({
      name: nodes.get(id)?.callFrame?.functionName || '(anonymous)',
      url: nodes.get(id)?.callFrame?.url || '',
      line: nodes.get(id)?.callFrame?.lineNumber ?? -1,
      selfMs: ms,
    }));
    const allocationNodes = heap?.profile.head.children || [];
    const sampledAllocationBytes = allocationNodes.reduce((sum, node) => sum + (node.selfSize || 0), 0);
    runs.push({
      index, url, initial, movementSteps, after,
      frames: {
        elapsedMs: frames.elapsedMs, count: sorted.length,
        meanMs: sorted.reduce((sum, value) => sum + value, 0) / Math.max(1, sorted.length),
        p50Ms: percentile(sorted, .5), p95Ms: percentile(sorted, .95), p99Ms: percentile(sorted, .99),
        fpsFromMean: 1000 / (sorted.reduce((sum, value) => sum + value, 0) / Math.max(1, sorted.length)),
        over33ms: sorted.filter(value => value > 33).length,
        over50ms: sorted.filter(value => value > 50).length,
      },
      browserMetrics: {
        scriptDurationMs: (end.ScriptDuration - start.ScriptDuration) * 1000,
        taskDurationMs: (end.TaskDuration - start.TaskDuration) * 1000,
        layoutCount: end.LayoutCount - start.LayoutCount,
        recalcStyleCount: end.RecalcStyleCount - start.RecalcStyleCount,
        jsHeapStartBytes: start.JSHeapUsedSize, jsHeapEndBytes: end.JSHeapUsedSize,
        jsHeapDeltaBytes: end.JSHeapUsedSize - start.JSHeapUsedSize,
        sampledAllocationBytes,
      },
      detailedProfile, topFunctions, pageErrors,
    });
    await cdp.detach();
    await context.close();
  }
  const summary = {
    base: '51490741b5786f59fb3fce2cf36f03343cd3e65c; matched 3-second profile baseline',
    browser: `Chromium ${await browser.version()} headless on execution container; software/emulated rendering; physical GPU and user PC unavailable`,
    measurement: {
      scenario: 'dist00/STORY normal, 1365x850 CSS px, DPR 1, new context/new game each run, six actual enemies, flashlight enabled, normal game frame loop, alternating four-direction keyboard movement; no synthetic VFX added; audio muted to keep setup deterministic',
      warmupMs: 1_500, measuredMs: measureMs, runs: runCount,
      caveat: 'Headless software timing is not an estimate of physical PC FPS; movement advances through Playwright keyboard events.',
    },
    runs,
  };
  const out = path.resolve('qa-r66/profile-live-movement-baseline-matched.json');
  await fs.writeFile(out, JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
